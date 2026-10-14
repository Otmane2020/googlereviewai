# Ranki → Google Business Profile

This webhook stores the Ranki article and publishes a Google Business Profile
post. It only returns `ok: true` after Google returns a post identifier.

## Required configuration

Set these Supabase Edge Function secrets:

- `RANKI_WEBHOOK_SECRET`: shared secret used to authenticate Ranki requests.
- `RANKI_GOOGLE_BUSINESS_ID`: optional default `businesses.id`. Omit it when
  Ranki sends `business_id` in every payload.

`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_ANON_KEY` are
provided by Supabase. The target business must be active and connected to a
Google Business Profile.

Ranki must send the shared secret in one of these headers:

- `x-ranki-webhook-secret`
- `x-api-key`
- `Authorization: Bearer <secret>`

## Payload

```json
{
  "title": "Article title",
  "slug": "article-title",
  "html": "<p>Article body</p>",
  "excerpt": "Optional Google post text",
  "google_summary": "Optional explicit Google post text",
  "business_id": "optional-when-default-secret-is-configured"
}
```

The Google post text is selected from `google_summary`, then `excerpt`, then
the article text, and is limited to 1,500 characters. Retrying the same slug
for the same business does not create another Google post after a confirmed
publication.

The `{ "type": "ranki.test" }` payload is a no-op health check and never
publishes to Google.
