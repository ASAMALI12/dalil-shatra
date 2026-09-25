-- Admin Credentials table for secure authentication in Supabase
CREATE TABLE IF NOT EXISTS public.admin_credentials (
  id TEXT PRIMARY KEY DEFAULT 'primary_admin',
  phone TEXT NOT NULL DEFAULT '',
  username TEXT NOT NULL DEFAULT 'admin',
  password_hash TEXT NOT NULL DEFAULT '',
  role TEXT DEFAULT 'superadmin',
  otp_code_hash TEXT,
  otp_expires_at BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns if table already existed previously
ALTER TABLE public.admin_credentials ADD COLUMN IF NOT EXISTS otp_code_hash TEXT;
ALTER TABLE public.admin_credentials ADD COLUMN IF NOT EXISTS otp_expires_at BIGINT;

-- Enable Row Level Security so no anonymous client can read admin credentials
ALTER TABLE public.admin_credentials ENABLE ROW LEVEL SECURITY;

-- Allow only server-side service role full control
DROP POLICY IF EXISTS "Service role access only" ON public.admin_credentials;
CREATE POLICY "Service role access only" ON public.admin_credentials
  FOR ALL
  USING (auth.role() = 'service_role');
