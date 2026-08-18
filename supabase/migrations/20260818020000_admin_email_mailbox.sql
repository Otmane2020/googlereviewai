-- Admin mailbox for Google Review AI
CREATE TABLE IF NOT EXISTS public.email_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_message_id TEXT UNIQUE,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  from_email TEXT NOT NULL,
  to_emails TEXT[] NOT NULL DEFAULT '{}',
  cc_emails TEXT[] NOT NULL DEFAULT '{}',
  subject TEXT NOT NULL DEFAULT '(sans objet)',
  text_body TEXT,
  html_body TEXT,
  status TEXT NOT NULL DEFAULT 'received',
  source TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_messages_direction_created
  ON public.email_messages(direction, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_messages_created
  ON public.email_messages(created_at DESC);

ALTER TABLE public.email_messages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role manages email mailbox"
    ON public.email_messages FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can read email mailbox"
    ON public.email_messages FOR SELECT
    TO authenticated
    USING ((auth.jwt() ->> 'email') IN ('benyahya.otmane@gmail.com', 'oben.rockman@gmail.com'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TABLE public.email_messages IS 'Inbound and outbound Google Review AI mailbox shown in /admin';
