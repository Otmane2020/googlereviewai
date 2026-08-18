import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const SITE_URL = 'https://googlereviewai.com'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const apiKey = req.headers.get('x-api-key')
    const expectedApiKey = Deno.env.get('ARTICLE_API_KEY')
    if (expectedApiKey && apiKey !== expectedApiKey) {
      return new Response(
        JSON.stringify({ error: 'Invalid API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const requestBody = await req.json().catch(() => ({}))
    console.log('[receive-article-v2] body keys:', Object.keys(requestBody))

    const {
      title,
      body: bodyField,
      content,
      slug,
      sourceId,
      source_id,
      metaDescription,
      meta_description,
      author,
    } = requestBody as Record<string, unknown>

    const articleBody = (bodyField ?? content) as string | undefined
    const articleSourceId = (sourceId ?? source_id) as string | undefined
    const articleMetaDescription = (metaDescription ?? meta_description) as string | undefined

    if (!title || typeof title !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing required field: title' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    if (!articleBody || typeof articleBody !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing required field: body (or content)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    if (!slug || typeof slug !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing required field: slug' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const sanitizedSlug = slug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data, error } = await supabase
      .from('published_articles')
      .upsert(
        {
          title,
          body: articleBody,
          slug: sanitizedSlug,
          source_id: articleSourceId ?? null,
          meta_description: articleMetaDescription ?? null,
          author: (author as string) || 'Équipe GoogleReviewAI',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'slug' }
      )
      .select()
      .single()

    if (error) {
      console.error('[receive-article-v2] DB error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to save article', details: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const url = `${SITE_URL}/blog/${data.slug}`
    console.log(`[receive-article-v2] ✅ published: ${url}`)

    return new Response(
      JSON.stringify({
        success: true,
        article: { id: data.id, slug: data.slug, title: data.title },
        url,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('[receive-article-v2] error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
