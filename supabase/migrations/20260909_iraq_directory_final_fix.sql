-- =====================================================================
-- الهيكل النهائي وقواعد الأمان لـ Supabase (دليل العراق)
-- التاريخ: أيلول / سبتمبر 2026
-- متوافق بالكامل مع جميع ميزات الواجهة الأمامية وتطبيق Android APK
-- =====================================================================

-- 1. جدول المحافظ المالية (Wallets)
CREATE TABLE IF NOT EXISTS public.wallets (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  balance NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'IQD',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- تحديث الحقول في حال وجود الجدول مسبقاً
ALTER TABLE IF EXISTS public.wallets ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE IF EXISTS public.wallets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- إنشاء المحفظة الرئيسية الموحدة برصيد أولي صفري حقيقي (بدون أرصدة تجريبية)
INSERT INTO public.wallets (id, user_id, balance, currency, updated_at)
VALUES ('main_wallet', 'admin', 0, 'IQD', NOW())
ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

-- 2. جدول المعاملات المالية (Transactions)
CREATE TABLE IF NOT EXISTS public.transactions (
  id TEXT PRIMARY KEY,
  wallet_id TEXT DEFAULT 'main_wallet',
  user_id TEXT,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL,
  title TEXT,
  description TEXT,
  payment_method TEXT,
  reference_number TEXT,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- تحديث الحقول للجدول إن وجد
ALTER TABLE IF EXISTS public.transactions ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE IF EXISTS public.transactions ADD COLUMN IF NOT EXISTS wallet_id TEXT DEFAULT 'main_wallet';
ALTER TABLE IF EXISTS public.transactions ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE IF EXISTS public.transactions ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE IF EXISTS public.transactions ADD COLUMN IF NOT EXISTS reference_number TEXT;
ALTER TABLE IF EXISTS public.transactions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed';

-- تحديث قيد نوع المعاملة ليتوافق مع جميع أنواع المحفظة
DO $$
BEGIN
  ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
  ALTER TABLE public.transactions ADD CONSTRAINT transactions_type_check 
    CHECK (type IN ('earning', 'deposit', 'withdrawal', 'payment', 'credit', 'debit'));
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- 3. جدول المتاجر والأنشطة التجارية (Stores)
CREATE TABLE IF NOT EXISTS public.stores (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  sub_category TEXT,
  phone TEXT NOT NULL,
  whatsapp TEXT,
  instagram TEXT,
  facebook TEXT,
  tiktok TEXT,
  website TEXT,
  address TEXT,
  governorate_id TEXT NOT NULL,
  district_id TEXT NOT NULL,
  governorate_name TEXT,
  district_name TEXT,
  rating NUMERIC DEFAULT 4.8,
  reviews_count INTEGER DEFAULT 12,
  is_open BOOLEAN DEFAULT true,
  working_hours TEXT DEFAULT '9:00 ص - 11:00 م',
  image_url TEXT,
  description TEXT,
  featured BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  is_claimed BOOLEAN DEFAULT false,
  claim_status TEXT DEFAULT 'unclaimed' CHECK (claim_status IN ('unclaimed', 'pending', 'verified', 'rejected')),
  phone_reliability TEXT DEFAULT 'unverified' CHECK (phone_reliability IN ('unverified', 'otp_verified', 'admin_verified')),
  claimed_by_name TEXT,
  claimed_by_phone TEXT,
  claimed_at TIMESTAMPTZ,
  source TEXT DEFAULT 'iraq_directory',
  imported_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. جدول مطالبات توثيق المتاجر (Store Claims)
CREATE TABLE IF NOT EXISTS public.store_claims (
  id TEXT PRIMARY KEY,
  store_id TEXT REFERENCES public.stores(id) ON DELETE CASCADE,
  applicant_name TEXT NOT NULL,
  applicant_phone TEXT NOT NULL,
  status TEXT DEFAULT 'verified' CHECK (status IN ('pending', 'verified', 'rejected')),
  otp_verified BOOLEAN DEFAULT true,
  admin_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. جدول رموز التحقق OTP (OTP Verifications)
CREATE TABLE IF NOT EXISTS public.otp_verifications (
  id TEXT PRIMARY KEY,
  phone TEXT NOT NULL,
  store_id TEXT,
  otp_hash TEXT NOT NULL,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. جدول العروض والخصومات (Offers)
CREATE TABLE IF NOT EXISTS public.offers (
  id TEXT PRIMARY KEY,
  store_id TEXT REFERENCES public.stores(id) ON DELETE CASCADE,
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

-- 7. جدول حدود إرسال إشعارات العروض (15 days cooldown)
CREATE TABLE IF NOT EXISTS public.offer_notification_limits (
  id TEXT PRIMARY KEY,
  store_id TEXT UNIQUE REFERENCES public.stores(id) ON DELETE CASCADE,
  last_notification_at TIMESTAMPTZ NOT NULL,
  offer_id TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. جدول الإشعارات الموجهة جغرافياً (Notifications)
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

-- 9. جدول الأخبار (News)
CREATE TABLE IF NOT EXISTS public.news (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  image_url TEXT,
  governorate_id TEXT,
  district_id TEXT,
  author TEXT DEFAULT 'إدارة دليل العراق',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. جدول الإعلانات الترويجية (Advertisements)
CREATE TABLE IF NOT EXISTS public.advertisements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  placement TEXT DEFAULT 'banner',
  target_governorate_id TEXT,
  target_district_id TEXT,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. جدول المراجعات والتقييمات (Reviews)
CREATE TABLE IF NOT EXISTS public.reviews (
  id TEXT PRIMARY KEY,
  store_id TEXT REFERENCES public.stores(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  rating NUMERIC NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. جدول التقارير والبلاغات (Reports)
CREATE TABLE IF NOT EXISTS public.reports (
  id TEXT PRIMARY KEY,
  store_id TEXT REFERENCES public.stores(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  notes TEXT,
  reporter_phone TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- إنشاء الفهارس (Indexes) لتسريع البحث والأداء
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_stores_location ON public.stores(governorate_id, district_id);
CREATE INDEX IF NOT EXISTS idx_stores_category ON public.stores(category);
CREATE INDEX IF NOT EXISTS idx_stores_phone ON public.stores(phone);
CREATE INDEX IF NOT EXISTS idx_offers_location ON public.offers(governorate_id, district_id);
CREATE INDEX IF NOT EXISTS idx_offers_active ON public.offers(is_active);
CREATE INDEX IF NOT EXISTS idx_notifications_scope ON public.notifications(target_scope, target_governorate_id, target_district_id);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON public.transactions(wallet_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_otp_phone ON public.otp_verifications(phone, verified);

-- =====================================================================
-- تفعيل Row Level Security (RLS) وسياسات الحماية
-- =====================================================================
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_notification_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- حذف السياسات القديمة إن وجدت لإعادة تهيئتها بأمان
DROP POLICY IF EXISTS "Public Read Stores" ON public.stores;
DROP POLICY IF EXISTS "Public Read Offers" ON public.offers;
DROP POLICY IF EXISTS "Public Read Notifications" ON public.notifications;
DROP POLICY IF EXISTS "Public Read News" ON public.news;
DROP POLICY IF EXISTS "Public Read Ads" ON public.advertisements;
DROP POLICY IF EXISTS "Public Read Reviews" ON public.reviews;
DROP POLICY IF EXISTS "Public Read Wallets" ON public.wallets;
DROP POLICY IF EXISTS "Public Read Transactions" ON public.transactions;
DROP POLICY IF EXISTS "Public Insert Reports" ON public.reports;
DROP POLICY IF EXISTS "Service Role Full Access Stores" ON public.stores;
DROP POLICY IF EXISTS "Service Role Full Access Claims" ON public.store_claims;
DROP POLICY IF EXISTS "Service Role Full Access OTP" ON public.otp_verifications;
DROP POLICY IF EXISTS "Service Role Full Access Offers" ON public.offers;
DROP POLICY IF EXISTS "Service Role Full Access Limits" ON public.offer_notification_limits;
DROP POLICY IF EXISTS "Service Role Full Access Notifications" ON public.notifications;
DROP POLICY IF EXISTS "Service Role Full Access Wallets" ON public.wallets;
DROP POLICY IF EXISTS "Service Role Full Access Transactions" ON public.transactions;

-- سياسات القراءة العامة
CREATE POLICY "Public Read Stores" ON public.stores FOR SELECT USING (true);
CREATE POLICY "Public Read Offers" ON public.offers FOR SELECT USING (is_active = true);
CREATE POLICY "Public Read Notifications" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "Public Read News" ON public.news FOR SELECT USING (true);
CREATE POLICY "Public Read Ads" ON public.advertisements FOR SELECT USING (is_active = true);
CREATE POLICY "Public Read Reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Public Read Wallets" ON public.wallets FOR SELECT USING (true);
CREATE POLICY "Public Read Transactions" ON public.transactions FOR SELECT USING (true);
CREATE POLICY "Public Insert Reports" ON public.reports FOR INSERT WITH CHECK (true);

-- صلاحيات كاملة للـ Service Role والخادم الداخلي
CREATE POLICY "Service Role Full Access Stores" ON public.stores FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service Role Full Access Claims" ON public.store_claims FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service Role Full Access OTP" ON public.otp_verifications FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service Role Full Access Offers" ON public.offers FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service Role Full Access Limits" ON public.offer_notification_limits FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service Role Full Access Notifications" ON public.notifications FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service Role Full Access Wallets" ON public.wallets FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service Role Full Access Transactions" ON public.transactions FOR ALL USING (auth.role() = 'service_role');
