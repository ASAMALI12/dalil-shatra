-- Payment Settings and Transactions Table for Real Transfers
CREATE TABLE IF NOT EXISTS public.payment_settings (
  id TEXT PRIMARY KEY,
  zaincash_number TEXT NOT NULL DEFAULT '07801459424',
  zaincash_holder TEXT NOT NULL DEFAULT 'محفظة زين كاش المعتمدة',
  mastercard_number TEXT NOT NULL DEFAULT '4538548308',
  mastercard_holder TEXT NOT NULL DEFAULT 'حساب ماستر كارد المعتمد',
  manager_phone TEXT NOT NULL DEFAULT '07801459424',
  manager_whatsapp TEXT NOT NULL DEFAULT '9647801459424',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert payment destination configuration
INSERT INTO public.payment_settings (
  id,
  zaincash_number,
  zaincash_holder,
  mastercard_number,
  mastercard_holder,
  manager_phone,
  manager_whatsapp
)
VALUES (
  'official_payment',
  '07801459424',
  'محفظة زين كاش المعتمدة',
  '4538548308',
  'حساب ماستر كارد المعتمد',
  '07801459424',
  '9647801459424'
)
ON CONFLICT (id) DO NOTHING;

-- Table to store real transfer proof submissions
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id TEXT PRIMARY KEY,
  payment_method TEXT NOT NULL,
  sender_phone TEXT NOT NULL,
  sender_name TEXT,
  store_name TEXT,
  amount NUMERIC DEFAULT 0,
  transaction_ref TEXT,
  receipt_image_url TEXT,
  ad_scope TEXT DEFAULT 'general',
  notes TEXT,
  status TEXT DEFAULT 'pending_review',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- Allow read on payment_settings for authenticated & anon
DROP POLICY IF EXISTS "Public can view payment_settings" ON public.payment_settings;
CREATE POLICY "Public can view payment_settings" ON public.payment_settings
  FOR SELECT
  USING (true);

-- Allow public to submit transfer proofs
DROP POLICY IF EXISTS "Public can insert payment_transactions" ON public.payment_transactions;
CREATE POLICY "Public can insert payment_transactions" ON public.payment_transactions
  FOR INSERT
  WITH CHECK (true);

-- Only service role can read/update payment_transactions
DROP POLICY IF EXISTS "Service role full access payment_transactions" ON public.payment_transactions;
CREATE POLICY "Service role full access payment_transactions" ON public.payment_transactions
  FOR ALL
  USING (auth.role() = 'service_role');
