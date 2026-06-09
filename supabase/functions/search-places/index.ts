import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, action, placeId, city, type, country } = await req.json();
    const lang = country === "us" ? "en" : "fr";
    const region = country || "fr";
    const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    
    if (!apiKey) {
      throw new Error("GOOGLE_PLACES_API_KEY not configured");
    }

    // Action: autocomplete - Search for places
    if (action === "autocomplete") {
      if (!query || query.length < 3) {
        return new Response(
          JSON.stringify({ predictions: [] }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&types=establishment&components=country:${region}&key=${apiKey}&language=${lang}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log(`[search-places] Autocomplete for "${query}": ${data.predictions?.length || 0} results`);
      
      return new Response(
        JSON.stringify({ predictions: data.predictions || [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Action: details - Get place details with reviews
    if (action === "details") {
      if (!placeId) {
        throw new Error("placeId is required for details action");
      }

      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,rating,user_ratings_total,reviews,photos,types,business_status,opening_hours&key=${apiKey}&language=fr&reviews_sort=newest`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status !== "OK") {
        console.error(`[search-places] Details error:`, data);
        throw new Error(`Google Places API error: ${data.status}`);
      }

      console.log(`[search-places] Details for ${placeId}: ${data.result?.name}, ${data.result?.reviews?.length || 0} reviews`);
      
      // Get photo URL if available
      let photoUrl = null;
      if (data.result?.photos?.[0]?.photo_reference) {
        photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${data.result.photos[0].photo_reference}&key=${apiKey}`;
      }

      return new Response(
        JSON.stringify({ 
          place: {
            ...data.result,
            photoUrl
          }
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Action: nearby - Text search by type + city (restaurants Paris, hôtels Lyon...)
    if (action === "nearby") {
      const t = (type || "restaurant").toString();
      const c = (city || "").toString().trim();
      if (!c) {
        return new Response(
          JSON.stringify({ results: [] }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const q = `${t} ${c}`;
      const baseUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(q)}&region=${region}&key=${apiKey}&language=${lang}`;

      // Fetch up to 3 pages (60 results) using next_page_token
      const allRaw: any[] = [];
      let pageToken: string | null = null;
      let status = "OK";
      for (let page = 0; page < 3; page++) {
        const url = pageToken ? `${baseUrl}&pagetoken=${pageToken}` : baseUrl;
        // Google requires a delay before next_page_token becomes valid (usually 2-3s)
        if (pageToken) await new Promise((r) => setTimeout(r, 3000));
        const response = await fetch(url);
        const data = await response.json();
        status = data.status;
        console.log(`[search-places] Page ${page + 1}: status=${status}, results=${data.results?.length || 0}`);
        if (data.results) allRaw.push(...data.results);
        pageToken = data.next_page_token || null;
        if (!pageToken || status !== "OK") break;
      }
      console.log(`[search-places] Nearby "${q}": ${allRaw.length} results (${status})`);

      const results = allRaw
        .map((r: any) => ({
          place_id: r.place_id,
          name: r.name,
          formatted_address: r.formatted_address,
          rating: r.rating,
          user_ratings_total: r.user_ratings_total || 0,
          business_status: r.business_status,
          types: r.types,
          photoUrl: r.photos?.[0]?.photo_reference
            ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=200&photo_reference=${r.photos[0].photo_reference}&key=${apiKey}`
            : null,
        }))
        // Sort by review count ascending so low-review prospects are first (better targets)
        .sort((a, b) => (a.user_ratings_total || 0) - (b.user_ratings_total || 0));

      return new Response(
        JSON.stringify({ results }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error(`Unknown action: ${action}`);

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[search-places] Error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
