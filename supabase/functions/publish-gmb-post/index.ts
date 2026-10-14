import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getGoogleAccessToken } from "../_shared/googleAuth.ts";
import { generateGmbImage } from "../_shared/gmbImages.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
type PostKind = "STANDARD" | "EVENT" | "OFFER";
type RequestBody = {
  business_id: string;
  summary: string;
  topic_type?: PostKind;
  cta_type?: string;
  cta_url?: string;
  media_url?: string;
  generate_image?: boolean;
  scheduled_content_id?: string;
  post_id?: string; // Deprecated alias for scheduled_content_id.
  user_id?: string; // Allowed ONLY for a service-role-authenticated cron.
  event_title?: string;
  start_date?: string;
  end_date?: string;
  coupon_code?: string;
  terms_conditions?: string;
  editorial_mode?: "news" | "information" | "spotlight";
};

function httpsUrl(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const input = value.trim();
    const url = new URL(input.includes("://") ? input : "https://" + input);
    if (url.protocol !== "https:" || url.username || url.password || !url.hostname) return null;
    if (url.hostname === "localhost" || url.hostname.endsWith(".localhost")) return null;
    if (/^(127|10|0|169\.254|192\.168)\./.test(url.hostname)) return null;
    if (/^172\.(1[6-9]|2\d|3[01])\./.test(url.hostname)) return null;
    return url.toString();
  } catch { return null; }
}

function googleDate(iso: string) {
  const date = new Date(iso);
  if (!Number.isFinite(date.valueOf())) throw new Error("Invalid event date");
  return {
    value: date.valueOf(),
    day: { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() },
    time: { hours: date.getUTCHours(), minutes: date.getUTCMinutes(), seconds: date.getUTCSeconds(), nanos: 0 },
  };
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ success: false, error: "Method not allowed" }, 405);
  let acceptedRemoteId: string | null = null;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const admin = createClient(supabaseUrl, service);
    const body = await req.json() as RequestBody;
    const authHeader = req.headers.get("Authorization") || "";
    const serviceCall = authHeader === "Bearer " + service;
    let userId: string;

    if (body.user_id) {
      if (!serviceCall) return jsonResponse({ success: false, error: "Cron authorization required" }, 403);
      userId = body.user_id;
    } else if (serviceCall) {
      // The scheduled publisher must identify its account explicitly.
      return jsonResponse({ success: false, error: "Missing user_id for internal publication" }, 400);
    } else {
      if (!authHeader) return jsonResponse({ success: false, error: "Authentication required" }, 401);
      const session = createClient(supabaseUrl, anon, { global: { headers: { Authorization: authHeader } } });
      const { data: { user }, error } = await session.auth.getUser();
      if (!user || error) return jsonResponse({ success: false, error: "Invalid user session" }, 401);
      userId = user.id;
    }

    const summary = String(body.summary || "").replace(/<[^>]*>/g, " ").trim().slice(0, 1500);
    const topic = body.topic_type || "STANDARD";
    if (!body.business_id || !summary || !["STANDARD", "EVENT", "OFFER"].includes(topic)) {
      return jsonResponse({ success: false, error: "Invalid post: business, summary or topic" }, 400);
    }
    const { data: business } = await admin.from("businesses")
      .select("id,name,address,website,description,categories,google_place_id,gmb_language")
      .eq("id", body.business_id).eq("user_id", userId).eq("is_active", true).maybeSingle();
    if (!business || !business.google_place_id) {
      return jsonResponse({ success: false, error: "Business is not connected to Google" }, 400);
    }

    const scheduledContentId = body.scheduled_content_id || body.post_id;
    if (scheduledContentId) {
      const { data: queued } = await admin.from("scheduled_content")
        .select("id,google_post_id").eq("id", scheduledContentId)
        .eq("user_id", userId).eq("business_id", business.id).maybeSingle();
      if (!queued) return jsonResponse({ success: false, error: "Scheduled article was not found" }, 404);
      if (queued.google_post_id) {
        return jsonResponse({ success: true, already_exists: true, state: "PROCESSING", post: { name: queued.google_post_id }, message: "Post previously sent; check its Google moderation status." });
      }
    }

    // Google allows text-only standard local posts. A missing public website
    // only disables the optional learn-more CTA, never the whole post.
    const website = httpsUrl(body.cta_url) || httpsUrl(business.website);

    // Check Google connection BEFORE requesting a paid AI image.
    const token = await getGoogleAccessToken(admin, userId);
    if (!token.token) return jsonResponse({ success: false, error: token.error || "Reconnect Google", requires_reconnect: token.requires_reconnect }, 401);

    // Image generation is opt-in: do not require a paid image-provider call
    // before every otherwise-valid Google Business standard post.
    let finalImage: string | null = null;
    if (body.media_url) {
      finalImage = httpsUrl(body.media_url);
      if (!finalImage) return jsonResponse({ success: false, error: "Photo URL must be public HTTPS." }, 400);
    } else if (body.generate_image === true) {
      finalImage = await generateGmbImage(
        admin, userId, business, summary, body.editorial_mode || "information",
      );
    }

    const postBody: Record<string, unknown> = {
      languageCode: business.gmb_language?.startsWith("en") ? "en" : "fr",
      summary,
      topicType: topic,
      ...(finalImage ? { media: [{ mediaFormat: "PHOTO", sourceUrl: finalImage }] } : {}),
    };

    if (topic === "OFFER" || topic === "EVENT") {
      if (!body.event_title?.trim() || !body.start_date || !body.end_date) {
        return jsonResponse({ success: false, error: "Offer and event require real title and dates." }, 400);
      }
      const start = googleDate(body.start_date);
      const end = googleDate(body.end_date);
      if (start.value >= end.value || end.value <= Date.now()) {
        return jsonResponse({ success: false, error: "Event or offer end date must be in the future." }, 400);
      }
      postBody.event = {
        title: body.event_title.trim().slice(0, 58),
        schedule: { startDate: start.day, startTime: start.time, endDate: end.day, endTime: end.time },
      };
      if (topic === "OFFER") {
        if (!website) return jsonResponse({ success: false, error: "A valid website is required for an OFFER post." }, 400);
        postBody.offer = {
          ...(body.coupon_code?.trim() ? { couponCode: body.coupon_code.trim() } : {}),
          ...(body.terms_conditions?.trim() ? { termsConditions: body.terms_conditions.trim() } : {}),
          redeemOnlineUrl: website,
        };
      }
    }
    if (topic !== "OFFER" && website && body.cta_type !== "NONE") {
      postBody.callToAction = { actionType: body.cta_type || "LEARN_MORE", url: website };
    }

    const accountsResponse = await fetch("https://mybusinessaccountmanagement.googleapis.com/v1/accounts", {
      headers: { Authorization: "Bearer " + token.token },
    });
    if (!accountsResponse.ok) throw new Error("Unable to read Google accounts (" + accountsResponse.status + ")");
    const accounts = (await accountsResponse.json()).accounts || [];
    if (!accounts.length) throw new Error("No Google Business accounts were found.");

    let googlePost: { name?: string; state?: string; searchUrl?: string; summary?: string } | null = null;
    let lastError = "";
    for (const account of accounts) {
      if (!/^accounts\/[^/]+$/.test(account.name || "")) continue;
      const url = "https://mybusiness.googleapis.com/v4/" + account.name + "/locations/" + business.google_place_id + "/localPosts";
      // Duplicate-safe: a prior accepted create can exist even if its response was lost.
      const listing = await fetch(url + "?pageSize=100", { headers: { Authorization: "Bearer " + token.token } });
      if (listing.ok) {
        const foundPosts = ((await listing.json()).localPosts || []) as typeof googlePost[];
        const matching = foundPosts.find((post) => post && post.summary?.trim() === summary);
        if (matching?.name) { googlePost = matching; break; }
      } else {
        // List and Create permissions may differ. Let Google decide on POST,
        // retaining the stored scheduled-content idempotency guard above.
        console.warn("[publish-gmb-post] Cannot list posts for this account", listing.status);
      }

      let response: Response;
      try {
        response = await fetch(url, {
          method: "POST",
          headers: { Authorization: "Bearer " + token.token, "Content-Type": "application/json" },
          body: JSON.stringify(postBody),
        });
      } catch {
        // Network timeout after create has unknown outcome. Never blindly retry on another account.
        throw new Error("Google creation outcome is unknown. Check Google Business before retrying.");
      }
      if (response.ok) {
        googlePost = await response.json();
        acceptedRemoteId = googlePost?.name || null;
        break;
      }
      const detail = (await response.text()).slice(0, 450);
      lastError = "Google API " + response.status + ": " + detail;
      // A rate-limit or server error can happen after Google started processing.
      if (response.status === 429 || response.status >= 500) throw new Error(lastError + " (do not blindly retry)");
    }
    if (!googlePost?.name) throw new Error(lastError || "Google refused the post.");

    acceptedRemoteId = googlePost.name;
    if (!googlePost.state) {
      try {
        const read = await fetch("https://mybusiness.googleapis.com/v4/" + googlePost.name, {
          headers: { Authorization: "Bearer " + token.token },
        });
        if (read.ok) googlePost = { ...googlePost, ...await read.json() };
      } catch { /* The ID has been accepted; Google moderation may still be pending. */ }
    }
    const googleState = (googlePost.state || "").toUpperCase();
    const status = googleState === "LIVE" ? "published" : googleState === "REJECTED" ? "rejected"
      : googleState === "PROCESSING" ? "processing" : "unverified";

    const { error: saveError } = await admin.from("gmb_posts").upsert({
      user_id: userId,
      business_id: business.id,
      google_post_id: googlePost.name,
      topic_type: topic,
      summary,
      cta_type: topic === "OFFER" ? null : (body.cta_type && body.cta_type !== "NONE" ? body.cta_type : "LEARN_MORE"),
      cta_url: website,
      media_url: finalImage,
      posted_at: new Date().toISOString(),
      status,
    }, { onConflict: "google_post_id" });
    if (saveError) console.error("[publish-gmb-post] Google accepted ID but database save failed:", saveError.message);

    if (scheduledContentId) {
      const scheduleState = status === "published" ? "published" :
        status === "rejected" ? "rejected" : "processing";
      const { error: scheduleError } = await admin.from("scheduled_content")
        .update({
          status: scheduleState,
          google_post_id: googlePost.name,
          published_at: status === "published" ? new Date().toISOString() : null,
          error_message: status === "rejected" ? "Google a refusé cette publication." : null,
        })
        .eq("id", scheduledContentId).eq("business_id", business.id).eq("user_id", userId);
      if (scheduleError) console.error("[publish-gmb-post] Scheduled-content save failed:", scheduleError.message);
    }
    return jsonResponse({ success: status !== "rejected", state: googleState || "UNVERIFIED",
      post: googlePost, media_url: finalImage, cta_url: website,
      ...(saveError ? { warning: "Google accepted the post but history sync failed." } : {}),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to submit to Google";
    console.error("[publish-gmb-post]", message);
    return jsonResponse({ success: false, error: message, ...(acceptedRemoteId ? { accepted_remote_id: acceptedRemoteId } : {}) }, 500);
  }
});
