import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Only allow POST
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Optional API key validation
    const apiKey = req.headers.get('x-api-key')
    const expectedApiKey = Deno.env.get('ARTICLE_API_KEY')
    
    if (expectedApiKey && apiKey !== expectedApiKey) {
      return new Response(
        JSON.stringify({ error: 'Invalid API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const requestBody = await req.json()
    console.log('[receive-article] Received body keys:', Object.keys(requestBody))
    
    // Accept both 'body' and 'content' as the article content
    const { 
      title, 
      body: articleBodyField, 
      content,
      slug, 
      sourceId, 
      source_id,
      metaDescription, 
      meta_description,
      author 
    } = requestBody

    // Use body or content (support both naming conventions)
    const articleBody = articleBodyField || content
    const articleSourceId = sourceId || source_id
    const articleMetaDescription = metaDescription || meta_description

    // Validate required fields
    if (!title) {
      console.log('[receive-article] Missing title')
      return new Response(
        JSON.stringify({ error: 'Missing required field: title', received: Object.keys(requestBody) }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    if (!articleBody) {
      console.log('[receive-article] Missing body/content')
      return new Response(
        JSON.stringify({ error: 'Missing required field: body (or content)', received: Object.keys(requestBody) }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    if (!slug) {
      console.log('[receive-article] Missing slug')
      return new Response(
        JSON.stringify({ error: 'Missing required field: slug', received: Object.keys(requestBody) }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Sanitize slug
    const sanitizedSlug = slug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

    console.log('[receive-article] Processing article:', { title, slug: sanitizedSlug })

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Upsert article (update if slug exists, insert if not)
    const { data, error } = await supabase
      .from('published_articles')
      .upsert(
        {
          title,
          body: articleBody,
          slug: sanitizedSlug,
          source_id: articleSourceId || null,
          meta_description: articleMetaDescription || null,
          author: author || 'Équipe GoogleReviewAI',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'slug' }
      )
      .select()
      .single()

    if (error) {
      console.error('[receive-article] Database error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to save article', details: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[receive-article] ✅ Article published: ${sanitizedSlug}`)

    return new Response(
      JSON.stringify({
        success: true,
        article: {
          id: data.id,
          slug: data.slug,
          title: data.title,
          url: `https://googlereviewai.com/blog/${data.slug}`,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[receive-article] Error processing request:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
