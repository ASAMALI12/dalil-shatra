-- =====================================================================
-- دليل العراق (Dalil Iraq) - Production Database Schema & RLS Hardening
-- Project ID: ccvntqtohuxqpxfqnhxt
-- Date: 2026-09-20
-- =====================================================================

-- 1. STORES (المتاجر والأنشطة التجارية)
CREATE TABLE IF NOT EXISTS public.stores (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  sub_category TEXT,
  phone TEXT NOT NULL,
  whatsapp TEXT,
  address TEXT NOT NULL,
  governorate_id TEXT NOT NULL,
  district_id TEXT NOT NULL,
  governorate_name TEXT,
  district_name TEXT,
  rating NUMERIC CHECK (rating >= 1 AND rating <= 5),
  reviews_count INTEGER DEFAULT 0,
  is_open BOOLEAN DEFAULT true,
  working_hours TEXT DEFAULT '٩:٠٠ ص - ١١:٠٠ م',
  image_url TEXT,
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  description TEXT,
  featured BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_claimed BOOLEAN DEFAULT false,
  claim_status TEXT DEFAULT 'unclaimed',
  phone_reliability TEXT DEFAULT 'unverified',
  claimed_by_name TEXT,
  claimed_by_phone TEXT,
  claimed_at TIMESTAMPTZ,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  google_maps_url TEXT,
  menu JSONB DEFAULT '[]'::JSONB,
  menu_images TEXT[] DEFAULT ARRAY[]::TEXT[],
  item_type TEXT DEFAULT 'store',
  price TEXT,
  condition TEXT,
  salary TEXT,
  job_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all columns exist on stores
ALTER TABLE IF EXISTS public.stores ADD COLUMN IF NOT EXISTS sub_category TEXT;
ALTER TABLE IF EXISTS public.stores ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE IF EXISTS public.stores ADD COLUMN IF NOT EXISTS governorate_name TEXT;
ALTER TABLE IF EXISTS public.stores ADD COLUMN IF NOT EXISTS district_name TEXT;
ALTER TABLE IF EXISTS public.stores ADD COLUMN IF NOT EXISTS rating NUMERIC;
ALTER TABLE IF EXISTS public.stores ADD COLUMN IF NOT EXISTS reviews_count INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS public.stores ADD COLUMN IF NOT EXISTS is_open BOOLEAN DEFAULT true;
ALTER TABLE IF EXISTS public.stores ADD COLUMN IF NOT EXISTS working_hours TEXT DEFAULT '٩:٠٠ ص - ١١:٠٠ م';
ALTER TABLE IF EXISTS public.stores ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE IF EXISTS public.stores ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE IF EXISTS public.stores ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS public.stores ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE IF EXISTS public.stores ADD COLUMN IF NOT EXISTS is_claimed BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS public.stores ADD COLUMN IF NOT EXISTS claim_status TEXT DEFAULT 'unclaimed';
ALTER TABLE IF EXISTS public.stores ADD COLUMN IF NOT EXISTS phone_reliability TEXT DEFAULT 'unverified';
ALTER TABLE IF EXISTS public.stores ADD COLUMN IF NOT EXISTS claimed_by_name TEXT;
ALTER TABLE IF EXISTS public.stores ADD COLUMN IF NOT EXISTS claimed_by_phone TEXT;
ALTER TABLE IF EXISTS public.stores ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;
ALTER TABLE IF EXISTS public.stores ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
ALTER TABLE IF EXISTS public.stores ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;
ALTER TABLE IF EXISTS public.stores ADD COLUMN IF NOT EXISTS google_maps_url TEXT;
ALTER TABLE IF EXISTS public.stores ADD COLUMN IF NOT EXISTS menu JSONB DEFAULT '[]'::JSONB;
ALTER TABLE IF EXISTS public.stores ADD COLUMN IF NOT EXISTS menu_images TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE IF EXISTS public.stores ADD COLUMN IF NOT EXISTS item_type TEXT DEFAULT 'store';
ALTER TABLE IF EXISTS public.stores ADD COLUMN IF NOT EXISTS price TEXT;
ALTER TABLE IF EXISTS public.stores ADD COLUMN IF NOT EXISTS condition TEXT;
ALTER TABLE IF EXISTS public.stores ADD COLUMN IF NOT EXISTS salary TEXT;
ALTER TABLE IF EXISTS public.stores ADD COLUMN IF NOT EXISTS job_type TEXT;
ALTER TABLE IF EXISTS public.stores ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. STORE CLAIMS (مطالبات ملكية المتاجر)
CREATE TABLE IF NOT EXISTS public.store_claims (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  store_name TEXT NOT NULL,
  applicant_name TEXT NOT NULL,
  applicant_phone TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewer_notes TEXT,
  otp_verified BOOLEAN DEFAULT false
);

-- 3. OTP VERIFICATIONS (رموز التحقق الحساسة - Service Role Only)
CREATE TABLE IF NOT EXISTS public.otp_verifications (
  id TEXT PRIMARY KEY,
  phone TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN DEFAULT false,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. OFFERS (العروض والتخفيضات)
CREATE TABLE IF NOT EXISTS public.offers (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  discount_percentage TEXT,
  coupon_code TEXT,
  governorate_id TEXT NOT NULL,
  district_id TEXT NOT NULL,
  governorate_name TEXT,
  district_name TEXT,
  category TEXT NOT NULL,
  image_url TEXT,
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. OFFER NOTIFICATION LIMITS (15-Day Cooldown Enforcement)
CREATE TABLE IF NOT EXISTS public.offer_notification_limits (
  id TEXT PRIMARY KEY,
  store_id TEXT UNIQUE NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  last_notification_at TIMESTAMPTZ NOT NULL,
  offer_id TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. NOTIFICATIONS (الإشعارات الجغرافية الموجهة)
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'offer' CHECK (type IN ('offer', 'store', 'news', 'system')),
  target_type TEXT DEFAULT 'offer',
  target_id TEXT,
  store_id TEXT,
  target_scope TEXT DEFAULT 'district' CHECK (target_scope IN ('district', 'governorate', 'iraq')),
  target_governorate_id TEXT,
  target_district_id TEXT,
  category_id TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ADVERTISEMENTS (الإعلانات الترويجية الموحدة)
CREATE TABLE IF NOT EXISTS public.advertisements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  store_id TEXT REFERENCES public.stores(id) ON DELETE SET NULL,
  image_url TEXT NOT NULL,
  link_url TEXT,
  badge TEXT,
  position TEXT DEFAULT 'home_banner',
  placement TEXT DEFAULT 'banner',
  target_governorate_id TEXT,
  target_district_id TEXT,
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  phone TEXT,
  whatsapp TEXT,
  price NUMERIC,
  duration_days INTEGER DEFAULT 30,
  category_id TEXT,
  category_name TEXT,
  governorate_name TEXT,
  district_name TEXT,
  payment_method TEXT,
  reference_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE IF EXISTS public.advertisements ADD COLUMN IF NOT EXISTS subtitle TEXT;
ALTER TABLE IF EXISTS public.advertisements ADD COLUMN IF NOT EXISTS store_id TEXT REFERENCES public.stores(id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.advertisements ADD COLUMN IF NOT EXISTS badge TEXT;
ALTER TABLE IF EXISTS public.advertisements ADD COLUMN IF NOT EXISTS position TEXT DEFAULT 'home_banner';
ALTER TABLE IF EXISTS public.advertisements ADD COLUMN IF NOT EXISTS placement TEXT DEFAULT 'banner';
ALTER TABLE IF EXISTS public.advertisements ADD COLUMN IF NOT EXISTS target_governorate_id TEXT;
ALTER TABLE IF EXISTS public.advertisements ADD COLUMN IF NOT EXISTS target_district_id TEXT;
ALTER TABLE IF EXISTS public.advertisements ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE IF EXISTS public.advertisements ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE IF EXISTS public.advertisements ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE IF EXISTS public.advertisements ADD COLUMN IF NOT EXISTS price NUMERIC;
ALTER TABLE IF EXISTS public.advertisements ADD COLUMN IF NOT EXISTS duration_days INTEGER DEFAULT 30;
ALTER TABLE IF EXISTS public.advertisements ADD COLUMN IF NOT EXISTS category_id TEXT;
ALTER TABLE IF EXISTS public.advertisements ADD COLUMN IF NOT EXISTS category_name TEXT;
ALTER TABLE IF EXISTS public.advertisements ADD COLUMN IF NOT EXISTS governorate_name TEXT;
ALTER TABLE IF EXISTS public.advertisements ADD COLUMN IF NOT EXISTS district_name TEXT;
ALTER TABLE IF EXISTS public.advertisements ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE IF EXISTS public.advertisements ADD COLUMN IF NOT EXISTS reference_number TEXT;
ALTER TABLE IF EXISTS public.advertisements ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;
ALTER TABLE IF EXISTS public.advertisements ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending_approval';
ALTER TABLE IF EXISTS public.advertisements ADD COLUMN IF NOT EXISTS receipt_url TEXT;
ALTER TABLE IF EXISTS public.advertisements ADD COLUMN IF NOT EXISTS ai_style JSONB DEFAULT '{}'::jsonb;
ALTER TABLE IF EXISTS public.advertisements ADD COLUMN IF NOT EXISTS manager_notes TEXT;

-- 8. WALLETS (محفظة الإيرادات - سرية - Service Role Only)
CREATE TABLE IF NOT EXISTS public.wallets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  balance NUMERIC DEFAULT 0 NOT NULL,
  currency TEXT DEFAULT 'IQD' NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. TRANSACTIONS (سجل المعاملات المالية - سري - Service Role Only)
CREATE TABLE IF NOT EXISTS public.transactions (
  id TEXT PRIMARY KEY,
  wallet_id TEXT NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('earning', 'deposit', 'withdrawal', 'payment')),
  title TEXT NOT NULL,
  description TEXT,
  payment_method TEXT,
  reference_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. REVIEWS (التقييمات الحقيقية 5 نجوم)
CREATE TABLE IF NOT EXISTS public.reviews (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL DEFAULT 'زائر دليل العراق',
  rating NUMERIC NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  device_id TEXT,
  user_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE IF EXISTS public.reviews ADD COLUMN IF NOT EXISTS device_id TEXT;
ALTER TABLE IF EXISTS public.reviews ADD COLUMN IF NOT EXISTS user_id TEXT;

-- 11. REPORTS (بلاغات المخالفات)
CREATE TABLE IF NOT EXISTS public.reports (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  notes TEXT,
  reporter_phone TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. NEWS (الأخبار والتعاميم الرسمية)
CREATE TABLE IF NOT EXISTS public.news (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  category TEXT,
  image_url TEXT,
  link TEXT,
  source TEXT DEFAULT 'دليل العراق',
  governorate_id TEXT,
  district_id TEXT,
  author TEXT DEFAULT 'إدارة دليل العراق',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE IF EXISTS public.news ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE IF EXISTS public.news ADD COLUMN IF NOT EXISTS link TEXT;
ALTER TABLE IF EXISTS public.news ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'دليل العراق';

-- 13. PROFILES (ملفات المستخدمين مع التحقق من الهوية)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT,
  full_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'store_owner', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- الفهارس (Indexes)
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_stores_location ON public.stores(governorate_id, district_id);
CREATE INDEX IF NOT EXISTS idx_stores_category ON public.stores(category);
CREATE INDEX IF NOT EXISTS idx_stores_phone ON public.stores(phone);
CREATE INDEX IF NOT EXISTS idx_offers_location ON public.offers(governorate_id, district_id);
CREATE INDEX IF NOT EXISTS idx_offers_active ON public.offers(is_active);
CREATE INDEX IF NOT EXISTS idx_notifications_scope ON public.notifications(target_scope, target_governorate_id, target_district_id);
CREATE INDEX IF NOT EXISTS idx_advertisements_active ON public.advertisements(is_active, position);
CREATE INDEX IF NOT EXISTS idx_reviews_store ON public.reviews(store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_device ON public.reviews(store_id, device_id);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON public.transactions(wallet_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_otp_phone ON public.otp_verifications(phone, verified);

-- =====================================================================
-- ROW LEVEL SECURITY (RLS) & HARDENED POLICIES
-- =====================================================================
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_notification_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Clean existing policies for idempotence
DROP POLICY IF EXISTS "Public Read Stores" ON public.stores;
DROP POLICY IF EXISTS "Service Role Full Access Stores" ON public.stores;

DROP POLICY IF EXISTS "Public Read Offers" ON public.offers;
DROP POLICY IF EXISTS "Service Role Full Access Offers" ON public.offers;

DROP POLICY IF EXISTS "Public Read Notifications" ON public.notifications;
DROP POLICY IF EXISTS "Service Role Full Access Notifications" ON public.notifications;

DROP POLICY IF EXISTS "Public Read Ads" ON public.advertisements;
DROP POLICY IF EXISTS "Service Role Full Access Ads" ON public.advertisements;

DROP POLICY IF EXISTS "Public Read Reviews" ON public.reviews;
DROP POLICY IF EXISTS "Public Insert Reviews" ON public.reviews;
DROP POLICY IF EXISTS "Service Role Full Access Reviews" ON public.reviews;

DROP POLICY IF EXISTS "Public Read News" ON public.news;
DROP POLICY IF EXISTS "Service Role Full Access News" ON public.news;

DROP POLICY IF EXISTS "Public Insert Reports" ON public.reports;
DROP POLICY IF EXISTS "Service Role Full Access Reports" ON public.reports;

-- Strict protection: NEVER allow public access to Wallets, Transactions, Claims, OTP, or Limits!
DROP POLICY IF EXISTS "Public Read Wallets" ON public.wallets;
DROP POLICY IF EXISTS "Service Role Full Access Wallets" ON public.wallets;

DROP POLICY IF EXISTS "Public Read Transactions" ON public.transactions;
DROP POLICY IF EXISTS "Service Role Full Access Transactions" ON public.transactions;

DROP POLICY IF EXISTS "Public Read Claims" ON public.store_claims;
DROP POLICY IF EXISTS "Service Role Full Access Claims" ON public.store_claims;

DROP POLICY IF EXISTS "Public Read OTP" ON public.otp_verifications;
DROP POLICY IF EXISTS "Service Role Full Access OTP" ON public.otp_verifications;

DROP POLICY IF EXISTS "Public Read Limits" ON public.offer_notification_limits;
DROP POLICY IF EXISTS "Service Role Full Access Limits" ON public.offer_notification_limits;

-- 1. STORES: Public can view, only service_role (Edge Functions / Backend) can write/update
CREATE POLICY "Public Read Stores" ON public.stores FOR SELECT USING (true);
CREATE POLICY "Service Role Full Access Stores" ON public.stores FOR ALL USING (auth.role() = 'service_role');

-- 2. OFFERS: Public can view active, non-expired offers
CREATE POLICY "Public Read Offers" ON public.offers FOR SELECT USING (
  is_active = true AND (valid_until IS NULL OR valid_until > NOW())
);
CREATE POLICY "Service Role Full Access Offers" ON public.offers FOR ALL USING (auth.role() = 'service_role');

-- 3. NOTIFICATIONS: Public can view notifications
CREATE POLICY "Public Read Notifications" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "Service Role Full Access Notifications" ON public.notifications FOR ALL USING (auth.role() = 'service_role');

-- 4. ADVERTISEMENTS: Public can view active ads only
CREATE POLICY "Public Read Ads" ON public.advertisements FOR SELECT USING (
  is_active = true AND (expires_at IS NULL OR expires_at > NOW())
);
CREATE POLICY "Service Role Full Access Ads" ON public.advertisements FOR ALL USING (auth.role() = 'service_role');

-- 5. REVIEWS: Public can view all reviews; users can submit with valid rating constraints
CREATE POLICY "Public Read Reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Public Insert Reviews" ON public.reviews FOR INSERT WITH CHECK (
  rating >= 1 AND rating <= 5 AND store_id IS NOT NULL
);
CREATE POLICY "Service Role Full Access Reviews" ON public.reviews FOR ALL USING (auth.role() = 'service_role');

-- 6. REPORTS: Public can insert reports, only service_role can view or resolve
CREATE POLICY "Public Insert Reports" ON public.reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Service Role Full Access Reports" ON public.reports FOR ALL USING (auth.role() = 'service_role');

-- 7. NEWS: Public can read, only service_role can manage
CREATE POLICY "Public Read News" ON public.news FOR SELECT USING (true);
CREATE POLICY "Service Role Full Access News" ON public.news FOR ALL USING (auth.role() = 'service_role');

-- 8. SENSITIVE TABLES: Strictly NO public policies. ONLY service_role can access
CREATE POLICY "Service Role Full Access Wallets" ON public.wallets FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service Role Full Access Transactions" ON public.transactions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service Role Full Access Claims" ON public.store_claims FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service Role Full Access OTP" ON public.otp_verifications FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service Role Full Access Limits" ON public.offer_notification_limits FOR ALL USING (auth.role() = 'service_role');

-- 9. PROFILES: Users can read and update only their own profile, service_role has full access
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service Role Full Access Profiles" ON public.profiles;

CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Service Role Full Access Profiles" ON public.profiles FOR ALL USING (auth.role() = 'service_role');

-- 10. PAYMENT ACCOUNTS (حسابات التحويل المالي الرسمية - زين كاش وماستر كارد)
CREATE TABLE IF NOT EXISTS public.payment_accounts (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL, -- 'zaincash' | 'mastercard'
  account_number TEXT NOT NULL,
  account_holder TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  instructions TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.payment_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Payment Accounts" ON public.payment_accounts;
DROP POLICY IF EXISTS "Service Role Full Access Payment Accounts" ON public.payment_accounts;

CREATE POLICY "Public Read Payment Accounts" ON public.payment_accounts FOR SELECT USING (is_active = true);
CREATE POLICY "Service Role Full Access Payment Accounts" ON public.payment_accounts FOR ALL USING (auth.role() = 'service_role');

INSERT INTO public.payment_accounts (id, provider, account_number, account_holder, is_active, instructions)
VALUES 
  ('zaincash_main', 'zaincash', '07801459424', 'محفظة زين كاش المعتمدة', true, 'التحويل المباشر من تطبيق زين كاش إلى رقم المحفظة ثم إرفاق صورة الوصل'),
  ('mastercard_main', 'mastercard', '4538548308', 'حساب ماستر كارد المعتمد', true, 'التحويل إلى رقم حساب الماستر كارد الموضح ثم إرفاق صورة الوصل')
ON CONFLICT (id) DO UPDATE SET 
  account_number = EXCLUDED.account_number,
  account_holder = EXCLUDED.account_holder,
  instructions = EXCLUDED.instructions;

