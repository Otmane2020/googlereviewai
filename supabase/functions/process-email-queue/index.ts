import { sendLovableEmail } from 'npm:@lovable.dev/email-js'
import { createClient } from 'npm:@supabase/supabase-js@2'

const MAX_RETRIES = 5
const DEFAULT_BATCH_SIZE = 10
const DEFAULT_SEND_DELAY_MS = 200
const DEFAULT_AUTH_TTL_MINUTES = 15
const DEFAULT_TRANSACTIONAL_TTL_MINUTES = 60

function isRateLimited(error: unknown): boolean {
  if (error && typeof error === 'object' && 'status' in error) return (error as { status: number }).status === 429
  return error instanceof Error && error.message.includes('429')
}

function isForbidden(error: unknown): boolean {
  if (error && typeof error === 'object' && 'status' in error) return (error as { status: number }).status === 403
  return error instanceof Error && error.message.includes('403')
}

function getRetryAfterSeconds(error: unknown): number {
  if (error && typeof error === 'object' && 'retryAfterSeconds' in error) {
    return (error as { retryAfterSeconds: number | null }).retryAfterSeconds ?? 60
  }
  return 60
}

function parseJwtClaims(token: string): Record<string, unknown> | null {
  const parts = token.split('.')
  if (parts.length < 2) return null
  try {
    const payload = parts[1].replaceAll('-', '+').replaceAll('_', '/').padEnd(Math.ceil(parts[1].length / 4) * 4, '=')
    return JSON.parse(atob(payload)) as Record<string, unknown>
  } catch { return null }
}

const toArray = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map(String).filter(Boolean)
  if (typeof value === 'string' && value.trim()) return [value.trim()]
  return []
}

async function moveToDlq(
  supabase: ReturnType<typeof createClient>,
  queue: string,
  msg: { msg_id: number; message: Record<string, unknown> },
  reason: string
): Promise<void> {
  const payload = msg.message
  await supabase.from('email_send_log').insert({
    message_id: payload.message_id,
    template_name: (payload.label || queue) as string,
    recipient_email: payload.to,
    status: 'dlq',
    error_message: reason,
  })
  const { error } = await supabase.rpc('move_to_dlq', {
    source_queue: queue,
    dlq_name: `${queue}_dlq`,
    message_id: msg.msg_id,
    payload,
  })
  if (error) console.error('Failed to move message to DLQ', { queue, msg_id: msg.msg_id, reason, code: error.code, message: error.message })
}

Deno.serve(async (req) => {
  const apiKey = Deno.env.get('LOVABLE_API_KEY')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!apiKey || !supabaseUrl || !supabaseServiceKey) {
    return new Response(JSON.stringify({ error: 'Server configuration error' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
  }

  const claims = parseJwtClaims(authHeader.slice('Bearer '.length).trim())
  if (claims?.role !== 'service_role') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const { data: state } = await supabase.from('email_send_state')
    .select('retry_after_until, batch_size, send_delay_ms, auth_email_ttl_minutes, transactional_email_ttl_minutes').single()

  if (state?.retry_after_until && new Date(state.retry_after_until) > new Date()) {
    return new Response(JSON.stringify({ skipped: true, reason: 'rate_limited' }), { headers: { 'Content-Type': 'application/json' } })
  }

  const batchSize = state?.batch_size ?? DEFAULT_BATCH_SIZE
  const sendDelayMs = state?.send_delay_ms ?? DEFAULT_SEND_DELAY_MS
  const ttlMinutes: Record<string, number> = {
    auth_emails: state?.auth_email_ttl_minutes ?? DEFAULT_AUTH_TTL_MINUTES,
    transactional_emails: state?.transactional_email_ttl_minutes ?? DEFAULT_TRANSACTIONAL_TTL_MINUTES,
  }
  let totalProcessed = 0

  for (const queue of ['auth_emails', 'transactional_emails']) {
    const { data: messages, error: readError } = await supabase.rpc('read_email_batch', { queue_name: queue, batch_size: batchSize, vt: 30 })
    if (readError) { console.error('Failed to read email batch', readError); continue }
    if (!messages?.length) continue

    const messageIds = Array.from(new Set(messages.map((msg) =>
      msg?.message?.message_id && typeof msg.message.message_id === 'string' ? msg.message.message_id : null
    ).filter((id): id is string => Boolean(id))))

    const failedAttemptsByMessageId = new Map<string, number>()
    if (messageIds.length) {
      const { data: failedRows } = await supabase.from('email_send_log').select('message_id').in('message_id', messageIds).eq('status', 'failed')
      for (const row of failedRows ?? []) {
        if (typeof row?.message_id !== 'string' || !row.message_id) continue
        failedAttemptsByMessageId.set(row.message_id, (failedAttemptsByMessageId.get(row.message_id) ?? 0) + 1)
      }
    }

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i]
      const payload = msg.message
      const messageId = typeof payload?.message_id === 'string' ? payload.message_id : String(msg.msg_id)
      const failedAttempts = typeof payload?.message_id === 'string' ? (failedAttemptsByMessageId.get(payload.message_id) ?? 0) : (msg.read_ct ?? 0)
      const queuedAt = payload.queued_at ?? msg.enqueued_at

      if (queuedAt) {
        const ageMs = Date.now() - new Date(queuedAt).getTime()
        if (ageMs > ttlMinutes[queue] * 60 * 1000) {
          await moveToDlq(supabase, queue, msg, `TTL exceeded (${ttlMinutes[queue]} minutes)`)
          continue
        }
      }
      if (failedAttempts >= MAX_RETRIES) {
        await moveToDlq(supabase, queue, msg, `Max retries (${MAX_RETRIES}) exceeded`)
        continue
      }

      if (payload.message_id) {
        const { data: alreadySent } = await supabase.from('email_send_log').select('id')
          .eq('message_id', payload.message_id).eq('status', 'sent').maybeSingle()
        if (alreadySent) {
          await supabase.rpc('delete_email', { queue_name: queue, message_id: msg.msg_id })
          continue
        }
      }

      try {
        await sendLovableEmail({
          run_id: payload.run_id,
          to: payload.to,
          from: payload.from,
          sender_domain: payload.sender_domain,
          subject: payload.subject,
          html: payload.html,
          text: payload.text,
          purpose: payload.purpose,
          label: payload.label,
          idempotency_key: payload.idempotency_key,
          unsubscribe_token: payload.unsubscribe_token,
          message_id: payload.message_id,
        }, { apiKey, sendUrl: Deno.env.get('LOVABLE_SEND_URL') })

        await supabase.from('email_send_log').insert({
          message_id: payload.message_id,
          template_name: payload.label || queue,
          recipient_email: payload.to,
          status: 'sent',
        })

        // Full sent-mail archive for /admin. Upsert makes retries/idempotency safe.
        const { error: archiveError } = await supabase.from('email_messages').upsert({
          provider_message_id: `queue:${messageId}`,
          direction: 'outbound',
          from_email: String(payload.from || 'Google Review AI'),
          to_emails: toArray(payload.to),
          cc_emails: [],
          subject: String(payload.subject || '(sans objet)'),
          text_body: typeof payload.text === 'string' ? payload.text : null,
          html_body: typeof payload.html === 'string' ? payload.html : null,
          status: 'sent',
          source: `email-queue:${queue}`,
          metadata: { label: payload.label || null, purpose: payload.purpose || null },
        }, { onConflict: 'provider_message_id' })
        if (archiveError) console.error('Failed to archive sent email', archiveError)

        await supabase.rpc('delete_email', { queue_name: queue, message_id: msg.msg_id })
        totalProcessed++
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        if (isRateLimited(error)) {
          await supabase.from('email_send_log').insert({ message_id: payload.message_id, template_name: payload.label || queue, recipient_email: payload.to, status: 'rate_limited', error_message: errorMsg.slice(0, 1000) })
          const retryAfterSecs = getRetryAfterSeconds(error)
          await supabase.from('email_send_state').update({ retry_after_until: new Date(Date.now() + retryAfterSecs * 1000).toISOString(), updated_at: new Date().toISOString() }).eq('id', 1)
          return new Response(JSON.stringify({ processed: totalProcessed, stopped: 'rate_limited' }), { headers: { 'Content-Type': 'application/json' } })
        }
        if (isForbidden(error)) {
          await moveToDlq(supabase, queue, msg, errorMsg.slice(0, 1000))
          return new Response(JSON.stringify({ processed: totalProcessed, stopped: 'forbidden' }), { headers: { 'Content-Type': 'application/json' } })
        }
        await supabase.from('email_send_log').insert({ message_id: payload.message_id, template_name: payload.label || queue, recipient_email: payload.to, status: 'failed', error_message: errorMsg.slice(0, 1000) })
        if (typeof payload?.message_id === 'string') failedAttemptsByMessageId.set(payload.message_id, failedAttempts + 1)
      }

      if (i < messages.length - 1) await new Promise((r) => setTimeout(r, sendDelayMs))
    }
  }

  return new Response(JSON.stringify({ processed: totalProcessed }), { headers: { 'Content-Type': 'application/json' } })
})
