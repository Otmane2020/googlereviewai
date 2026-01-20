-- Create maps_rank_scans table to store scan sessions
CREATE TABLE public.maps_rank_scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  keyword text NOT NULL,
  grid_size integer NOT NULL CHECK (grid_size IN (3, 5, 7)),
  spacing_m integer NOT NULL,
  center_lat numeric,
  center_lng numeric,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for efficient queries
CREATE INDEX idx_maps_rank_scans_user_created ON public.maps_rank_scans(user_id, created_at DESC);
CREATE INDEX idx_maps_rank_scans_business_keyword ON public.maps_rank_scans(business_id, keyword, created_at DESC);

-- Enable RLS
ALTER TABLE public.maps_rank_scans ENABLE ROW LEVEL SECURITY;

-- RLS policies for maps_rank_scans
CREATE POLICY "Users can view their own scans"
  ON public.maps_rank_scans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scans"
  ON public.maps_rank_scans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scans"
  ON public.maps_rank_scans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scans"
  ON public.maps_rank_scans FOR DELETE
  USING (auth.uid() = user_id);

-- Create maps_rank_scan_points table to store individual grid points
CREATE TABLE public.maps_rank_scan_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id uuid NOT NULL REFERENCES public.maps_rank_scans(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label text NOT NULL,
  lat numeric NOT NULL,
  lng numeric NOT NULL,
  rank_position integer,
  total_results integer,
  competitors jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for efficient queries
CREATE INDEX idx_maps_rank_scan_points_scan ON public.maps_rank_scan_points(scan_id);
CREATE INDEX idx_maps_rank_scan_points_user ON public.maps_rank_scan_points(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.maps_rank_scan_points ENABLE ROW LEVEL SECURITY;

-- RLS policies for maps_rank_scan_points
CREATE POLICY "Users can view their own scan points"
  ON public.maps_rank_scan_points FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scan points"
  ON public.maps_rank_scan_points FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scan points"
  ON public.maps_rank_scan_points FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scan points"
  ON public.maps_rank_scan_points FOR DELETE
  USING (auth.uid() = user_id);