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

// Geocode address using Places API (New) instead of Geocoding API
async function geocodeAddress(
  address: string,
  apiKey: string
): Promise<{ lat: number; lng: number } | null> {
  try {
    // Use Places API textSearch to geocode the address
    const response = await fetch(
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "places.location",
        },
        body: JSON.stringify({
          textQuery: address,
          maxResultCount: 1,
          languageCode: "fr",
        }),
      }
    );

    if (!response.ok) {
      console.error("Geocoding via Places API error:", response.status);
      return null;
    }

    const data = await response.json();
    if (data.places && data.places.length > 0 && data.places[0].location) {
      const location = data.places[0].location;
      console.log("Geocoded address via Places API:", { lat: location.latitude, lng: location.longitude });
      return {
        lat: location.latitude,
        lng: location.longitude,
      };
    }
    console.error("Geocoding via Places API: no results found");
    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}

// Search for business by name and address to get its Places API id
async function findBusinessPlaceId(
  businessName: string,
  address: string,
  apiKey: string
): Promise<{ placeId: string; lat: number; lng: number } | null> {
  try {
    const query = `${businessName} ${address}`;
    const response = await fetch(
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location",
        },
        body: JSON.stringify({
          textQuery: query,
          maxResultCount: 5,
          languageCode: "fr",
        }),
      }
    );

    if (!response.ok) {
      console.error("Find business error:", response.status);
      return null;
    }

    const data = await response.json();
    if (data.places && data.places.length > 0) {
      const place = data.places[0];
      return {
        placeId: place.id,
        lat: place.location.latitude,
        lng: place.location.longitude,
      };
    }
    return null;
  } catch (error) {
    console.error("Find business error:", error);
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

    logStep("Business found", { name: business.name, address: business.address, placeId: business.google_place_id });

    // Get center coordinates and Places API place_id
    let centerLat: number;
    let centerLng: number;
    let placesApiPlaceId: string | null = null;

    // First, try to find the business in Places API using name + address
    if (business.name && business.address) {
      const businessInfo = await findBusinessPlaceId(business.name, business.address, apiKey);
      if (businessInfo) {
        centerLat = businessInfo.lat;
        centerLng = businessInfo.lng;
        placesApiPlaceId = businessInfo.placeId;
        logStep("Found business via Places search", { centerLat, centerLng, placesApiPlaceId });
      }
    }

    // Fallback to geocoding the address
    if (!placesApiPlaceId && business.address) {
      const geocoded = await geocodeAddress(business.address, apiKey);
      if (geocoded) {
        centerLat = geocoded.lat;
        centerLng = geocoded.lng;
        logStep("Got center from geocoding", { centerLat, centerLng });
      } else {
        throw new Error("Impossible de géolocaliser l'adresse de l'établissement. Vérifiez l'adresse.");
      }
    }

    if (!centerLat! || !centerLng!) {
      throw new Error("Impossible de récupérer les coordonnées. L'établissement doit avoir une adresse valide.");
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

      // Find our business in results - match by Places API id if we have it
      let rankPosition: number | null = null;
      const competitors: Competitor[] = [];

      for (let i = 0; i < places.length; i++) {
        const place = places[i];
        
        // Match using Places API place_id if available, otherwise match by name
        let isOurBusiness = false;
        if (placesApiPlaceId) {
          isOurBusiness = place.id === placesApiPlaceId;
        } else {
          // Fallback: fuzzy match by name
          const placeName = (place.displayName?.text || "").toLowerCase();
          const businessName = business.name.toLowerCase();
          isOurBusiness = placeName.includes(businessName) || businessName.includes(placeName);
        }
        
        if (isOurBusiness && rankPosition === null) {
          rankPosition = i + 1;
          logStep(`Found business at rank ${rankPosition}`, { placeName: place.displayName?.text });
        }

        // Store top 5 competitors (excluding our business)
        if (!isOurBusiness && competitors.length < 5) {
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
