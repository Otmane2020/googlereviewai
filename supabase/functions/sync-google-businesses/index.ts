import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getGoogleAccessToken } from "../_shared/googleAuth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Create admin client for server-side operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get the current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error("User auth error:", userError);
      throw new Error("User not authenticated");
    }

    console.log("User authenticated:", user.id);

    // Get access token using shared helper
    const tokenResult = await getGoogleAccessToken(supabaseAdmin, user.id);
    
    if (!tokenResult.token) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: tokenResult.requires_reconnect 
            ? "Reconnectez votre compte Google Business."
            : (tokenResult.error || "No Google access token."),
          businesses: [],
          requires_reconnect: tokenResult.requires_reconnect
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const accessToken = tokenResult.token;

    // Fetch accounts from Google Business Profile API
    console.log("Fetching Google Business accounts...");
    const accountsResponse = await fetch(
      "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!accountsResponse.ok) {
      const errorText = await accountsResponse.text();
      console.error("Google API accounts error:", accountsResponse.status, errorText);
      
      const requiresReconnect = accountsResponse.status === 401 || tokenResult.requires_reconnect;
      
      // Handle quota/rate limit errors gracefully
      if (accountsResponse.status === 429) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error_code: "QUOTA_EXCEEDED",
            message: "L'API Google Business Profile n'est pas encore activée ou le quota est dépassé. Veuillez activer l'API dans Google Cloud Console.",
            businesses: [] 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Handle permission/access errors
      if (accountsResponse.status === 403) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error_code: "ACCESS_DENIED",
            message: "Accès refusé à l'API Google Business Profile. Veuillez vérifier les autorisations de votre compte Google.",
            businesses: [],
            requires_reconnect: true
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (accountsResponse.status === 401) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: "Session Google expirée. Reconnectez votre compte.",
            businesses: [],
            requires_reconnect: true
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`Failed to fetch Google accounts: ${accountsResponse.status} - ${errorText}`);
    }

    const accountsData = await accountsResponse.json();
    const accounts = accountsData.accounts || [];

    if (accounts.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No Google Business accounts found",
          businesses: [] 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const allLocations: any[] = [];
    const accountMap: Record<string, string> = {}; // locationId -> accountName

    // Fetch locations for each account
    for (const account of accounts) {
      const accountName = account.name; // Format: accounts/{accountId}
      
      const locationsResponse = await fetch(
        `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations?readMask=name,title,storefrontAddress,websiteUri,phoneNumbers,profile,metadata`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (locationsResponse.ok) {
        const locationsData = await locationsResponse.json();
        const locations = locationsData.locations || [];
        locations.forEach((loc: any) => {
          allLocations.push(loc);
          accountMap[loc.name] = accountName;
        });
      } else {
        console.error(`Failed to fetch locations for ${accountName}:`, await locationsResponse.text());
      }
    }

    // Fetch media (profile photo) for each location
    const mediaMap: Record<string, string> = {}; // google_place_id -> profile_image_url
    
    for (const location of allLocations) {
      const googlePlaceId = location.name.split("/").pop();
      const accountName = accountMap[location.name];
      
      if (accountName) {
        try {
          const mediaResponse = await fetch(
            `https://mybusiness.googleapis.com/v4/${accountName}/locations/${googlePlaceId}/media`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );
          
          if (mediaResponse.ok) {
            const mediaData = await mediaResponse.json();
            const mediaItems = mediaData.mediaItems || [];
            
            // Find profile photo (PROFILE category) or use first photo
            const profilePhoto = mediaItems.find((m: any) => 
              m.locationAssociation?.category === "PROFILE"
            ) || mediaItems.find((m: any) => 
              m.locationAssociation?.category === "COVER"
            ) || mediaItems[0];
            
            if (profilePhoto?.googleUrl) {
              mediaMap[googlePlaceId] = profilePhoto.googleUrl;
              console.log(`Found profile image for ${googlePlaceId}`);
            }
          } else {
            console.log(`No media found for ${googlePlaceId}`);
          }
        } catch (e) {
          console.error(`Failed to fetch media for ${googlePlaceId}:`, e);
        }
      }
    }

    // Sync locations to database using upsert to prevent duplicates
    const businessesMap = new Map<string, any>();
    
    // Deduplicate locations by google_place_id before upserting
    for (const location of allLocations) {
      const locationId = location.name; // Format: locations/{locationId}
      const googlePlaceId = locationId.split("/").pop();
      
      // Only keep the first occurrence of each google_place_id
      if (!businessesMap.has(googlePlaceId)) {
        businessesMap.set(googlePlaceId, {
          user_id: user.id,
          name: location.title || "Unnamed Business",
          google_place_id: googlePlaceId,
          address: location.storefrontAddress 
            ? [
                location.storefrontAddress.addressLines?.join(", "),
                location.storefrontAddress.locality,
                location.storefrontAddress.postalCode,
              ].filter(Boolean).join(", ")
            : null,
          phone: location.phoneNumbers?.primaryPhone || null,
          website: location.websiteUri || null,
          description: location.profile?.description || null,
          maps_url: location.metadata?.mapsUri || null,
          profile_image_url: mediaMap[googlePlaceId] || null,
          is_active: true,
        });
      }
    }
    
    const businessesData = Array.from(businessesMap.values());
    
    console.log(`Deduped ${allLocations.length} locations to ${businessesData.length} unique businesses`);

    // Get user's plan limit
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("max_businesses")
      .eq("id", user.id)
      .single();

    const maxBusinesses = profile?.max_businesses || 1;

    // If user has more Google businesses than their plan allows, return them for selection
    if (businessesData.length > maxBusinesses) {
      console.log(`User has ${businessesData.length} businesses but plan allows ${maxBusinesses}. Returning for selection.`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          requires_selection: true,
          message: `Vous avez ${businessesData.length} établissements Google mais votre plan permet ${maxBusinesses} établissement${maxBusinesses > 1 ? "s" : ""}.`,
          google_businesses: businessesData.map(b => ({
            name: b.name,
            google_place_id: b.google_place_id,
            address: b.address,
            phone: b.phone,
            website: b.website,
            description: b.description,
          })),
          max_businesses: maxBusinesses,
          businesses: [] 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If within limit, auto-save all businesses
    // Use upsert with onConflict to handle duplicates
    const { data: syncedBusinesses, error: upsertError } = await supabaseAdmin
      .from("businesses")
      .upsert(businessesData, { 
        onConflict: "google_place_id,user_id",
        ignoreDuplicates: false 
      })
      .select();

    if (upsertError) {
      console.error("Error upserting businesses:", upsertError);
      throw new Error(upsertError.message);
    }

    // Trigger background analysis for each business with website or description
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    
    if (syncedBusinesses && syncedBusinesses.length > 0) {
      // Fire and forget analysis for each business
      for (const business of syncedBusinesses) {
        if (business.website || business.description) {
          console.log(`Triggering analysis for business: ${business.id}`);
          // Don't await - fire and forget
          fetch(`${supabaseUrl}/functions/v1/analyze-business-website`, {
            method: "POST",
            headers: {
              "Authorization": authHeader,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              businessId: business.id,
              website: business.website,
              gmbDescription: business.description,
            }),
          }).catch(e => console.error(`Analysis trigger failed for ${business.id}:`, e));
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        requires_selection: false,
        message: `Synced ${syncedBusinesses?.length || 0} businesses`,
        businesses: syncedBusinesses || [] 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error syncing businesses:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        businesses: [] 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
