import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BusinessInput {
  name: string;
  google_place_id: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  description?: string | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get the current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error("User not authenticated");
    }

    const { businesses } = await req.json() as { businesses: BusinessInput[] };

    if (!businesses || !Array.isArray(businesses) || businesses.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "No businesses provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user's plan limit
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("max_businesses")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      throw new Error("Could not fetch user profile");
    }

    // Enforce plan limit
    if (businesses.length > profile.max_businesses) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Your plan allows only ${profile.max_businesses} business(es). You selected ${businesses.length}.` 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Deactivate all existing businesses for this user first
    await supabaseAdmin
      .from("businesses")
      .update({ is_active: false })
      .eq("user_id", user.id);

    // Prepare businesses for upsert
    const businessesData = businesses.map((b) => ({
      user_id: user.id,
      name: b.name,
      google_place_id: b.google_place_id,
      address: b.address,
      phone: b.phone,
      website: b.website,
      description: b.description || null,
      is_active: true,
    }));

    console.log(`Saving ${businessesData.length} selected businesses for user ${user.id}`);

    // Upsert selected businesses
    const { data: savedBusinesses, error: upsertError } = await supabaseAdmin
      .from("businesses")
      .upsert(businessesData, {
        onConflict: "google_place_id,user_id",
        ignoreDuplicates: false,
      })
      .select();

    if (upsertError) {
      console.error("Error upserting businesses:", upsertError);
      throw new Error(upsertError.message);
    }

    console.log(`Successfully saved ${savedBusinesses?.length || 0} businesses`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Saved ${savedBusinesses?.length || 0} businesses`,
        businesses: savedBusinesses || [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error saving businesses:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
