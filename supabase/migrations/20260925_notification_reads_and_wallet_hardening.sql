-- Migration: notification_reads & wallet hardening
-- Ensures notification_reads table exists for syncing notification read states across devices

CREATE TABLE IF NOT EXISTS public.notification_reads (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  notification_id TEXT NOT NULL,
  read_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_reads_user ON public.notification_reads(user_id, notification_id);

ALTER TABLE public.notification_reads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read and Insert Notification Reads" ON public.notification_reads;
CREATE POLICY "Public Read and Insert Notification Reads" ON public.notification_reads FOR ALL USING (true) WITH CHECK (true);
