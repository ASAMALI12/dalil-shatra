-- Admin Credentials table for secure authentication in Supabase
CREATE TABLE IF NOT EXISTS public.admin_credentials (
  id TEXT PRIMARY KEY,
  phone TEXT NOT NULL,
  username TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'superadmin',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial secure manager credentials if not exists
INSERT INTO public.admin_credentials (id, phone, username, password_hash, role)
VALUES ('primary_admin', '07801459424', 'asamali', 'AsamasaM12', 'superadmin')
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security so no anonymous client can read admin credentials
ALTER TABLE public.admin_credentials ENABLE ROW LEVEL SECURITY;

-- Allow only server-side service role full control
DROP POLICY IF EXISTS "Service role access only" ON public.admin_credentials;
CREATE POLICY "Service role access only" ON public.admin_credentials
  FOR ALL
  USING (auth.role() = 'service_role');
