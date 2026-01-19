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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { content_id, provider_token } = await req.json();

    if (!content_id) {
      throw new Error("content_id is required");
    }

    // Get the scheduled content
    const { data: content, error: contentError } = await supabase
      .from("scheduled_content")
      .select(`
        *,
        businesses (
          id,
          name,
          google_place_id
        )
      `)
      .eq("id", content_id)
      .single();

    if (contentError || !content) {
      throw new Error("Content not found");
    }

    if (content.status === "published") {
      return new Response(
        JSON.stringify({ success: true, message: "Already published" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const business = content.businesses;
    if (!business?.google_place_id) {
      throw new Error("Business not linked to Google My Business");
    }

    // Format Q&A for Google My Business post
    const postContent = content.content_type === "aeo_qa"
      ? `❓ ${content.question}\n\n✅ ${content.answer}`
      : content.content || "";

    // Create a Google My Business post (local post)
    const locationId = business.google_place_id;
    const gmbUrl = `https://mybusiness.googleapis.com/v4/${locationId}/localPosts`;

    console.log("Publishing to GMB:", gmbUrl);
    console.log("Content:", postContent);

    const gmbResponse = await fetch(gmbUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${provider_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        languageCode: "fr-FR",
        summary: postContent.slice(0, 1500), // GMB limit
        topicType: "STANDARD",
      }),
    });

    if (!gmbResponse.ok) {
      const errorText = await gmbResponse.text();
      console.error("GMB API error:", gmbResponse.status, errorText);
      
      if (gmbResponse.status === 401 || gmbResponse.status === 403) {
        // Update content with error
        await supabase
          .from("scheduled_content")
          .update({
            status: "error",
            error_message: "Token expiré. Reconnectez-vous avec Google.",
          })
          .eq("id", content_id);
          
        throw new Error("Token Google expiré. Reconnectez-vous.");
      }
      
      throw new Error(`GMB API error: ${gmbResponse.status}`);
    }

    const gmbData = await gmbResponse.json();
    console.log("GMB post created:", gmbData);

    // Update the scheduled content as published
    const { error: updateError } = await supabase
      .from("scheduled_content")
      .update({
        status: "published",
        published_at: new Date().toISOString(),
        google_post_id: gmbData.name || null,
        error_message: null,
      })
      .eq("id", content_id);

    if (updateError) {
      console.error("Error updating content:", updateError);
    }

    // Create notification
    await supabase.from("notifications").insert({
      user_id: content.user_id,
      type: "qa_published",
      title: "Q&A publié sur Google",
      message: `Le Q&A "${content.question?.slice(0, 50)}..." a été publié sur Google My Business.`,
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        google_post_id: gmbData.name,
        message: "Q&A published successfully" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in publish-gmb-qa:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
