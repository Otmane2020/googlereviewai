-- Add column to store scraped website content
ALTER TABLE public.businesses 
ADD COLUMN IF NOT EXISTS website_content TEXT;

-- Add comment
COMMENT ON COLUMN public.businesses.website_content IS 'Scraped website content from Firecrawl, stored once during initial analysis';