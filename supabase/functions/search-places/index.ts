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
    const { query, action, placeId } = await req.json();
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

      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&types=establishment&key=${apiKey}&language=fr`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log(`[search-places] Autocomplete for "${query}": ${data.predictions?.length || 0} results`);
      
      return new Response(
        JSON.stringify({ predictions: data.predictions || [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Action: textsearch - Find best prospects (with rating & review count)
    if (action === "textsearch") {
      if (!query || query.length < 3) {
        return new Response(
          JSON.stringify({ results: [] }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}&language=fr`;
      const response = await fetch(url);
      const data = await response.json();

      const results = (data.results || []).map((r: any) => ({
        place_id: r.place_id,
        name: r.name,
        formatted_address: r.formatted_address,
        rating: r.rating,
        user_ratings_total: r.user_ratings_total,
        types: r.types,
        business_status: r.business_status,
      }));

      // Score: privilégie 4.0-4.7 (potentiel) + nb d'avis élevé (établissement actif)
      const scored = results
        .filter((r: any) => r.business_status !== "CLOSED_PERMANENTLY")
        .map((r: any) => {
          const rating = r.rating || 0;
          const total = r.user_ratings_total || 0;
          // bonus si rating entre 3.8 et 4.7 (marge de progression) + log(reviews)
          const ratingBonus = rating >= 3.8 && rating <= 4.7 ? 1.2 : rating >= 4.8 ? 0.7 : 0.4;
          const score = ratingBonus * Math.log10(total + 10) * (rating || 1);
          return { ...r, _score: score };
        })
        .sort((a: any, b: any) => b._score - a._score)
        .slice(0, 20);

      console.log(`[search-places] TextSearch for "${query}": ${scored.length} prospects`);

      return new Response(
        JSON.stringify({ results: scored }),
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
