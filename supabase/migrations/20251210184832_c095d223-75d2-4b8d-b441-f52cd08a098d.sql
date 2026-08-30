-- Create notifications table for real-time updates
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  review_id BIGINT REFERENCES public.reviews(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own notifications" ON public.notifications
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- Index for faster queries
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Enable realtime for reviews and notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.reviews;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;