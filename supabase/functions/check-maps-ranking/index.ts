import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Competitor {
  name: string;
  placeId: string;
  address: string;
  rating: number | null;
}

interface ScanPointResult {
  label: string;
  lat: number;
  lng: number;
  rank_position: number | null;
  total_results: number;
  competitors: Competitor[];
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-MAPS-RANKING] ${step}${detailsStr}`);
};

// Generate grid points around center
function generateGrid(
  centerLat: number,
  centerLng: number,
  gridSize: number,
  spacingM: number
): { label: string; lat: number; lng: number }[] {
  const points: { label: string; lat: number; lng: number }[] = [];
  const offset = Math.floor(gridSize / 2);
  
  // Convert meters to degrees (approximate)
  const metersToDegLat = spacingM / 111320;
  const metersToDegLng = spacingM / (111320 * Math.cos(centerLat * Math.PI / 180));
  
  const labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const label = `${labels[row]}${col + 1}`;
      const lat = centerLat + (offset - row) * metersToDegLat;
      const lng = centerLng + (col - offset) * metersToDegLng;
      points.push({ label, lat, lng });
    }
  }
  
  return points;
}

// Search Google Places for ranking
async function searchPlaces(
  keyword: string,
  lat: number,
  lng: number,
  apiKey: string,
  spacingM: number = 1000
): Promise<{ places: any[]; error?: string }> {
  // Use a radius that covers the area between points but not too large
  const radiusM = Math.max(spacingM * 1.5, 5000);
  try {
    const response = await fetch(
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.rating,places.location",
        },
        body: JSON.stringify({
          textQuery: keyword,
          locationBias: {
            circle: {
              center: { latitude: lat, longitude: lng },
              radius: radiusM,
            },
          },
          maxResultCount: 20,
          languageCode: "fr",
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Places API error:", response.status, errorText);
      
      if (response.status === 403) {
        return { places: [], error: "API key non autorisée. Vérifiez que Places API (New) est activée." };
      }
      if (response.status === 429) {
        return { places: [], error: "Quota dépassé. Réessayez plus tard." };
      }
      return { places: [], error: `Erreur API Google: ${response.status}` };
    }

    const data = await response.json();
    return { places: data.places || [] };
  } catch (err) {
    console.error("Places search error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return { places: [], error: `Erreur réseau: ${message}` };
  }
}

// Get place details to find center coordinates
async function getPlaceDetails(
  placeId: string,
  apiKey: string
): Promise<{ lat: number; lng: number } | null> {
  try {
    const response = await fetch(
      `https://places.googleapis.com/v1/places/${placeId}`,
      {
        method: "GET",
        headers: {
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "location",
        },
      }
    );

    if (!response.ok) {
      console.error("Place details error:", response.status);
      return null;
    }

    const data = await response.json();
    if (data.location) {
      return {
        lat: data.location.latitude,
        lng: data.location.longitude,
      };
    }
    return null;
  } catch (error) {
    console.error("Place details error:", error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    // Verify API key
    const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!apiKey) {
      throw new Error("GOOGLE_PLACES_API_KEY not configured");
    }

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Parse request body
    const { business_id, keyword, grid_size, spacing_m } = await req.json();
    
    if (!business_id || !keyword || !grid_size || !spacing_m) {
      throw new Error("Missing required parameters: business_id, keyword, grid_size, spacing_m");
    }

    if (![3, 5, 7].includes(grid_size)) {
      throw new Error("grid_size must be 3, 5, or 7");
    }

    logStep("Parameters validated", { business_id, keyword, grid_size, spacing_m });

    // Get business details
    const { data: business, error: businessError } = await supabaseClient
      .from("businesses")
      .select("id, name, google_place_id, address")
      .eq("id", business_id)
      .eq("user_id", user.id)
      .single();

    if (businessError || !business) {
      throw new Error("Business not found or access denied");
    }

    if (!business.google_place_id) {
      throw new Error("Business n'a pas de google_place_id. Reconnectez-le à Google.");
    }

    logStep("Business found", { name: business.name, placeId: business.google_place_id });

    // Get center coordinates from Google Place ID
    let centerLat: number;
    let centerLng: number;

    const placeDetails = await getPlaceDetails(business.google_place_id, apiKey);
    if (placeDetails) {
      centerLat = placeDetails.lat;
      centerLng = placeDetails.lng;
      logStep("Got center from place details", { centerLat, centerLng });
    } else {
      throw new Error("Impossible de récupérer les coordonnées de l'établissement");
    }

    // Create scan record
    const { data: scan, error: scanError } = await supabaseClient
      .from("maps_rank_scans")
      .insert({
        user_id: user.id,
        business_id: business.id,
        keyword,
        grid_size,
        spacing_m,
        center_lat: centerLat,
        center_lng: centerLng,
        status: "running",
      })
      .select()
      .single();

    if (scanError) {
      throw new Error(`Failed to create scan: ${scanError.message}`);
    }

    logStep("Scan created", { scanId: scan.id });

    // Generate grid points
    const gridPoints = generateGrid(centerLat, centerLng, grid_size, spacing_m);
    logStep("Grid generated", { pointCount: gridPoints.length });

    // Process each point
    const results: ScanPointResult[] = [];
    let hasError = false;
    let errorMessage = "";

    for (const point of gridPoints) {
      logStep(`Processing point ${point.label}`, { lat: point.lat, lng: point.lng });

      const { places, error } = await searchPlaces(keyword, point.lat, point.lng, apiKey, spacing_m);

      if (error) {
        hasError = true;
        errorMessage = error;
        logStep(`Error at point ${point.label}`, { error });
        break;
      }

      // Find our business in results
      let rankPosition: number | null = null;
      const competitors: Competitor[] = [];

      for (let i = 0; i < places.length; i++) {
        const place = places[i];
        const placeIdMatch = place.id === business.google_place_id;
        
        if (placeIdMatch && rankPosition === null) {
          rankPosition = i + 1;
        }

        // Store top 5 competitors (excluding our business)
        if (!placeIdMatch && competitors.length < 5) {
          competitors.push({
            name: place.displayName?.text || "Unknown",
            placeId: place.id,
            address: place.formattedAddress || "",
            rating: place.rating || null,
          });
        }
      }

      const pointResult: ScanPointResult = {
        label: point.label,
        lat: point.lat,
        lng: point.lng,
        rank_position: rankPosition,
        total_results: places.length,
        competitors,
      };

      results.push(pointResult);

      // Insert point into database
      await supabaseClient.from("maps_rank_scan_points").insert({
        scan_id: scan.id,
        user_id: user.id,
        label: point.label,
        lat: point.lat,
        lng: point.lng,
        rank_position: rankPosition,
        total_results: places.length,
        competitors,
      });

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    // Update scan status
    await supabaseClient
      .from("maps_rank_scans")
      .update({
        status: hasError ? "failed" : "completed",
        error_message: hasError ? errorMessage : null,
      })
      .eq("id", scan.id);

    logStep("Scan completed", { status: hasError ? "failed" : "completed", pointsProcessed: results.length });

    return new Response(
      JSON.stringify({
        success: !hasError,
        scan_id: scan.id,
        center: { lat: centerLat, lng: centerLng },
        points: results,
        error: hasError ? errorMessage : null,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
