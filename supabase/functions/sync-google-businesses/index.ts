import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    // Get provider_token from request body
    const { provider_token } = await req.json();
    
    if (!provider_token) {
      console.log("No provider token provided in request body");
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "No Google access token. Please sign out and sign in again with Google.",
          businesses: [] 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    // Fetch accounts from Google Business Profile API
    console.log("Fetching Google Business accounts...");
    const accountsResponse = await fetch(
      "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
      {
        headers: {
          Authorization: `Bearer ${provider_token}`,
        },
      }
    );

    if (!accountsResponse.ok) {
      const errorText = await accountsResponse.text();
      console.error("Google API accounts error:", accountsResponse.status, errorText);
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

    // Fetch locations for each account
    for (const account of accounts) {
      const accountName = account.name; // Format: accounts/{accountId}
      
      const locationsResponse = await fetch(
        `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations?readMask=name,title,storefrontAddress,websiteUri,phoneNumbers`,
        {
          headers: {
            Authorization: `Bearer ${provider_token}`,
          },
        }
      );

      if (locationsResponse.ok) {
        const locationsData = await locationsResponse.json();
        const locations = locationsData.locations || [];
        allLocations.push(...locations);
      } else {
        console.error(`Failed to fetch locations for ${accountName}:`, await locationsResponse.text());
      }
    }

    // Sync locations to database
    const syncedBusinesses: any[] = [];
    
    for (const location of allLocations) {
      const locationId = location.name; // Format: locations/{locationId}
      const googlePlaceId = locationId.split("/").pop();
      
      const businessData = {
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
        is_active: true,
      };

      // Upsert: insert or update if google_place_id already exists
      const { data: existingBusiness } = await supabaseClient
        .from("businesses")
        .select("id")
        .eq("user_id", user.id)
        .eq("google_place_id", googlePlaceId)
        .maybeSingle();

      let result;
      if (existingBusiness) {
        // Update existing
        result = await supabaseClient
          .from("businesses")
          .update(businessData)
          .eq("id", existingBusiness.id)
          .select()
          .single();
      } else {
        // Insert new
        result = await supabaseClient
          .from("businesses")
          .insert(businessData)
          .select()
          .single();
      }

      if (result.data) {
        syncedBusinesses.push(result.data);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Synced ${syncedBusinesses.length} businesses`,
        businesses: syncedBusinesses 
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