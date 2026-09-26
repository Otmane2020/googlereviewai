import { createClient } from "@supabase/supabase-js";

export const RANKI_SUPABASE_URL = "https://hlruprayqfnatnldrski.supabase.co";
export const RANKI_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhscnVwcmF5cWZuYXRubGRyc2tpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzODc1OTMsImV4cCI6MjA4MDk2MzU5M30.CnG5qU9hYhJ3gAd84sr4h1Q5ZAWuDQshy9e3nfg_8vA";

export type RankiArticle = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content_html: string;
  content_markdown: string | null;
  cover_url: string | null;
  keywords: string[] | null;
  content_type: string | null;
  status: string | null;
  published_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export const rankiBlogSupabase = createClient(RANKI_SUPABASE_URL, RANKI_SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export async function getPublishedRankiArticles() {
  const { data, error } = await rankiBlogSupabase
    .from("ranki_articles")
    .select("id,title,slug,excerpt,content_html,cover_url,keywords,content_type,published_at,created_at,updated_at,status")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (error) throw error;
  return (data || []) as RankiArticle[];
}

export async function getPublishedRankiArticle(slug: string) {
  const { data, error } = await rankiBlogSupabase
    .from("ranki_articles")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) throw error;
  return (data || null) as RankiArticle | null;
}
