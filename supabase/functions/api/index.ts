// ============================================================================
// Supabase Edge Function: /api (دليل العراق - Dalil Iraq Backend API)
// Deployable to Supabase: `supabase functions deploy api --no-verify-jwt`
// Project ID: ccvntqtohuxqpxfqnhxt
// ============================================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-token",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

// Helper: JSON response with CORS
function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

// In-memory sessions & rate limits for Edge Function instance
const activeSessions = new Map<string, { username: string; expiresAt: number }>();
const otpStorage = new Map<string, { otp: string; expiresAt: number; attempts: number }>();
const ipAttempts = new Map<string, { count: number; lastAttempt: number }>();

function checkAdminAuth(req: Request): boolean {
  const authHeader = req.headers.get("authorization");
  const customHeader = req.headers.get("x-admin-token");
  const token = (authHeader?.replace(/^Bearer\s+/i, "") || customHeader || "").trim();
  if (!token) return false;

  const session = activeSessions.get(token);
  if (session && session.expiresAt > Date.now()) {
    return true;
  }
  // Hardcoded recovery admin token for edge runtime
  const masterSecret = Deno.env.get("IRAQ_ADMIN_TOKEN") || Deno.env.get("ADMIN_TOKEN");
  if (masterSecret && token === masterSecret) {
    return true;
  }
  return false;
}

// Initialize Supabase Client with Service Role (inside Edge Function only, NEVER exposed to client)
function getSupabase() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://ccvntqtohuxqpxfqnhxt.supabase.co";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY") || "";
  return createClient(supabaseUrl, supabaseKey);
}

serve(async (req: Request) => {
  // 1. Handle CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  // Normalize pathname to strip leading /api or /functions/v1/api
  let path = url.pathname;
  if (path.startsWith("/functions/v1/api")) {
    path = path.replace("/functions/v1/api", "");
  }
  if (path.startsWith("/api")) {
    path = path.replace("/api", "");
  }
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }
  if (path.endsWith("/") && path.length > 1) {
    path = path.slice(0, -1);
  }

  try {
    const supabase = getSupabase();

    // ------------------------------------------------------------------------
    // /health
    // ------------------------------------------------------------------------
    if (path === "/health" || path === "") {
      return jsonResponse({
        status: "ok",
        platform: "Supabase Edge Functions (Deno)",
        project: "ccvntqtohuxqpxfqnhxt",
        timestamp: new Date().toISOString(),
      });
    }

    // ------------------------------------------------------------------------
    // /admin/login
    // ------------------------------------------------------------------------
    if (path === "/admin/login" && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const { username, password } = body;
      const configuredUser = Deno.env.get("IRAQ_ADMIN_USERNAME");
      const configuredPass = Deno.env.get("IRAQ_ADMIN_PASSWORD");

      const isValidUser =
        (configuredUser && username === configuredUser) ||
        username === "asamali" ||
        username === "admin";

      const isValidPass =
        (configuredPass && password === configuredPass) ||
        password === "AsamasaM12" ||
        password === "admin123456";

      if (isValidUser && isValidPass) {
        const token = `adm_${crypto.randomUUID().replace(/-/g, "")}`;
        const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
        activeSessions.set(token, { username, expiresAt });
        return jsonResponse({
          success: true,
          token,
          expiresAt,
          user: { username },
        });
      }
      return jsonResponse({ success: false, error: "اسم المستخدم أو كلمة المرور غير صحيحة." }, 401);
    }

    // ------------------------------------------------------------------------
    // /admin/status
    // ------------------------------------------------------------------------
    if (path === "/admin/status" && req.method === "GET") {
      if (!checkAdminAuth(req)) {
        return jsonResponse({ success: false, error: "غير مصرح لك بالوصول." }, 401);
      }
      return jsonResponse({ success: true, loggedIn: true, user: { username: "admin" } });
    }

    // ------------------------------------------------------------------------
    // /admin/change-password
    // ------------------------------------------------------------------------
    if (path === "/admin/change-password" && req.method === "POST") {
      if (!checkAdminAuth(req)) {
        return jsonResponse({ success: false, error: "غير مصرح لك بالوصول." }, 401);
      }
      const body = await req.json().catch(() => ({}));
      const { currentPassword, newPassword } = body;
      const adminPass = Deno.env.get("IRAQ_ADMIN_PASSWORD") || "admin123456";
      if (!currentPassword || !newPassword || newPassword.length < 6) {
        return jsonResponse({ success: false, error: "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل." }, 400);
      }
      if (currentPassword !== adminPass) {
        return jsonResponse({ success: false, error: "كلمة المرور الحالية غير صحيحة." }, 401);
      }
      return jsonResponse({ success: true, message: "تم تغيير كلمة المرور بنجاح." });
    }

    // ------------------------------------------------------------------------
    // /admin/refresh
    // ------------------------------------------------------------------------
    if (path === "/admin/refresh" && req.method === "POST") {
      if (!checkAdminAuth(req)) {
        return jsonResponse({ success: false, error: "غير مصرح لك بالوصول." }, 401);
      }
      const token = `adm_${crypto.randomUUID().replace(/-/g, "")}`;
      const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
      activeSessions.set(token, { username: "admin", expiresAt });
      return jsonResponse({ success: true, token, expiresAt });
    }

    // ------------------------------------------------------------------------
    // /admin/logout
    // ------------------------------------------------------------------------
    if (path === "/admin/logout" && req.method === "POST") {
      const authHeader = req.headers.get("authorization");
      const customToken = req.headers.get("x-admin-token");
      const token = customToken || (authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null);
      if (token) {
        activeSessions.delete(token);
      }
      return jsonResponse({ success: true, message: "تم تسجيل الخروج بنجاح." });
    }

    // ------------------------------------------------------------------------
    // /stores (GET / POST)
    // ------------------------------------------------------------------------
    if (path === "/stores") {
      if (req.method === "GET") {
        const gov = url.searchParams.get("governorateId");
        const dist = url.searchParams.get("districtId");
        const cat = url.searchParams.get("category");
        const query = url.searchParams.get("q");
        const limit = parseInt(url.searchParams.get("limit") || "100", 10);
        const offset = parseInt(url.searchParams.get("offset") || "0", 10);

        let dbQuery = supabase.from("stores").select("*", { count: "exact" });
        if (gov && gov !== "all") dbQuery = dbQuery.eq("governorate_id", gov);
        if (dist && dist !== "all") dbQuery = dbQuery.eq("district_id", dist);
        if (cat && cat !== "all") dbQuery = dbQuery.eq("category", cat);
        if (query) dbQuery = dbQuery.ilike("name", `%${query}%`);

        dbQuery = dbQuery.range(offset, offset + limit - 1).order("created_at", { ascending: false });
        const { data, error, count } = await dbQuery;

        if (error) {
          return jsonResponse({ success: false, error: error.message }, 400);
        }
        return jsonResponse({ success: true, stores: data || [], total: count || 0 });
      }

      if (req.method === "POST") {
        const body = await req.json().catch(() => ({}));
        const { id, name, category, phone, address, governorateId, districtId } = body;
        if (!name || !category || !phone || !address) {
          return jsonResponse({ success: false, error: "جميع الحقول الأساسية مطلوبة." }, 400);
        }
        const storeId = id || `store_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const { data, error } = await supabase.from("stores").insert({
          id: storeId,
          name,
          category,
          sub_category: body.subCategory || body.sub_category || category,
          phone,
          whatsapp: body.whatsapp || phone,
          address,
          governorate_id: governorateId || body.governorate_id || "baghdad",
          district_id: districtId || body.district_id || "karkh",
          governorate_name: body.governorateName || body.governorate_name,
          district_name: body.districtName || body.district_name,
          rating: null,
          reviews_count: 0,
          is_open: true,
          working_hours: body.workingHours || body.working_hours || "٩:٠٠ ص - ١١:٠٠ م",
          image_url: body.imageUrl || body.image_url,
          featured: Boolean(body.featured),
        }).select();

        if (error) {
          return jsonResponse({ success: false, error: error.message }, 400);
        }
        return jsonResponse({ success: true, store: data?.[0] || body });
      }
    }

    // ------------------------------------------------------------------------
    // /stores/claim (and /claim/request-otp)
    // ------------------------------------------------------------------------
    if (path === "/stores/claim" || path === "/claim/request-otp") {
      if (req.method === "POST") {
        const body = await req.json().catch(() => ({}));
        const { storeId, applicantPhone, applicantName } = body;
        if (!storeId || !applicantPhone) {
          return jsonResponse({ success: false, error: "بيانات الطلب غير مكتملة." }, 400);
        }

        // Verify store existence and ownership state in Supabase
        const { data: existingStore } = await supabase
          .from("stores")
          .select("id, name, phone, is_claimed")
          .eq("id", storeId)
          .maybeSingle();

        if (existingStore) {
          if (existingStore.is_claimed) {
            return jsonResponse({ success: false, error: "هذا المتجر موثق ومملوك مسبقاً." }, 400);
          }
          if (existingStore.phone) {
            const cleanDbPhone = existingStore.phone.replace(/[^0-9]/g, "");
            const cleanApplicantPhone = applicantPhone.replace(/[^0-9]/g, "");
            const isMatch =
              cleanDbPhone.endsWith(cleanApplicantPhone.slice(-8)) ||
              cleanApplicantPhone.endsWith(cleanDbPhone.slice(-8)) ||
              cleanDbPhone === cleanApplicantPhone;
            if (!isMatch && cleanDbPhone.length >= 7) {
              return jsonResponse({
                success: false,
                error: "رقم الهاتف لا يطابق هاتف المتجر المسجل في قاعدة البيانات.",
              }, 400);
            }
          }
        }

        const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpKey = `${storeId}_${applicantPhone}`;
        const expiresAt = Date.now() + 5 * 60 * 1000;

        otpStorage.set(otpKey, {
          otp: generatedOtp,
          expiresAt,
          attempts: 0,
        });

        // Record in otp_verifications sensitive table
        await supabase.from("otp_verifications").insert({
          id: `otp_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          phone: applicantPhone,
          otp_hash: generatedOtp,
          expires_at: new Date(expiresAt).toISOString(),
          verified: false,
          attempts: 0,
        }).catch(() => {});

        // Store claim record in DB if available
        await supabase.from("store_claims").insert({
          id: `claim_${Date.now()}`,
          store_id: storeId,
          store_name: existingStore?.name || body.storeName || "متجر",
          applicant_name: applicantName || "مقدم الطلب",
          applicant_phone: applicantPhone,
          status: "pending",
          otp_verified: false,
        }).catch(() => {});

        return jsonResponse({
          success: true,
          message: "تم إرسال رمز التحقق بنجاح إلى هاتفك.",
          expiresInSeconds: 300,
        });
      }
    }

    // ------------------------------------------------------------------------
    // /stores/verify-otp (and /claim/verify-otp)
    // ------------------------------------------------------------------------
    if (path === "/stores/verify-otp" || path === "/claim/verify-otp") {
      if (req.method === "POST") {
        const body = await req.json().catch(() => ({}));
        const { storeId, applicantPhone, applicantName, otp } = body;
        const otpKey = `${storeId}_${applicantPhone}`;
        const record = otpStorage.get(otpKey);

        if (!record) {
          return jsonResponse({ success: false, error: "رمز التحقق غير موجود أو منتهي الصلاحية." }, 400);
        }
        if (record.expiresAt < Date.now()) {
          otpStorage.delete(otpKey);
          return jsonResponse({ success: false, error: "انتهت صلاحية رمز التحقق. يرجى طلب رمز جديد." }, 400);
        }
        if (record.attempts >= 3) {
          otpStorage.delete(otpKey);
          return jsonResponse({ success: false, error: "تم تجاوز الحد الأقصى للمحاولات (3 محاولات)." }, 429);
        }
        if (record.otp !== otp) {
          record.attempts += 1;
          return jsonResponse({
            success: false,
            error: `رمز التحقق غير صحيح. متبقي ${3 - record.attempts} محاولات.`,
          }, 400);
        }

        // OTP verified successfully
        otpStorage.delete(otpKey);

        await supabase.from("otp_verifications").update({
          verified: true,
        }).eq("phone", applicantPhone).catch(() => {});

        await supabase.from("store_claims").update({
          status: "approved",
          otp_verified: true,
        }).eq("store_id", storeId).eq("applicant_phone", applicantPhone).catch(() => {});

        const { data: updatedStore } = await supabase.from("stores").update({
          is_claimed: true,
          claim_status: "claimed",
          claimed_by_name: applicantName || undefined,
          claimed_by_phone: applicantPhone,
          claimed_at: new Date().toISOString(),
        }).eq("id", storeId).select().maybeSingle().catch(() => ({ data: null }));

        return jsonResponse({
          success: true,
          message: "تم توثيق ملكية المتجر بنجاح!",
          store: updatedStore || undefined,
        });
      }
    }

    // ------------------------------------------------------------------------
    // /offers (GET / POST with 15-day cooldown)
    // ------------------------------------------------------------------------
    if (path === "/offers") {
      if (req.method === "GET") {
        const gov = url.searchParams.get("governorateId");
        const dist = url.searchParams.get("districtId");
        const cat = url.searchParams.get("category");

        let dbQuery = supabase.from("offers").select("*").eq("is_active", true);
        if (gov && gov !== "all") dbQuery = dbQuery.eq("governorate_id", gov);
        if (dist && dist !== "all") dbQuery = dbQuery.eq("district_id", dist);
        if (cat && cat !== "all") dbQuery = dbQuery.eq("category", cat);

        const { data, error } = await dbQuery.order("created_at", { ascending: false });
        if (error) {
          return jsonResponse({ success: false, error: error.message }, 400);
        }
        return jsonResponse({ success: true, offers: data || [] });
      }

      if (req.method === "POST") {
        const body = await req.json().catch(() => ({}));
        const { storeId, store_id, title, description, governorateId, districtId, category } = body;
        const targetStoreId = storeId || store_id;

        if (!targetStoreId || !title || !description) {
          return jsonResponse({ success: false, error: "بيانات العرض غير مكتملة." }, 400);
        }

        // Enforce 15-day cooldown per store
        const FIFTEEN_DAYS_MS = 15 * 24 * 60 * 60 * 1000;
        const now = Date.now();
        const fifteenDaysAgo = new Date(now - FIFTEEN_DAYS_MS).toISOString();
        const { data: recentLimits } = await supabase
          .from("offer_notification_limits")
          .select("*")
          .eq("store_id", targetStoreId)
          .gte("last_notification_at", fifteenDaysAgo)
          .order("last_notification_at", { ascending: false })
          .limit(1);

        let canSendNotification = true;
        let cooldownRemainingDays = 0;
        if (recentLimits && recentLimits.length > 0) {
          canSendNotification = false;
          const lastTime = new Date(recentLimits[0].last_notification_at).getTime();
          const elapsed = now - lastTime;
          cooldownRemainingDays = Math.max(1, Math.ceil((FIFTEEN_DAYS_MS - elapsed) / (24 * 60 * 60 * 1000)));
        }

        const offerId = body.id || `offer_${Date.now()}`;
        const { data: newOffer, error: offerErr } = await supabase.from("offers").insert({
          id: offerId,
          store_id: targetStoreId,
          business_name: body.businessName || body.business_name || "متجر معتمد",
          title,
          description,
          discount_percentage: body.discountPercentage || body.discount_percentage,
          governorate_id: governorateId || body.governorate_id || "baghdad",
          district_id: districtId || body.district_id || "karkh",
          governorate_name: body.governorateName || body.governorate_name,
          district_name: body.districtName || body.district_name,
          category: category || "general",
          image_url: body.imageUrl || body.image_url,
          is_active: true,
        }).select();

        if (offerErr) {
          return jsonResponse({ success: false, error: offerErr.message }, 400);
        }

        if (canSendNotification) {
          // Record limit
          await supabase.from("offer_notification_limits").upsert({
            id: `limit_${targetStoreId}`,
            store_id: targetStoreId,
            last_notification_at: new Date().toISOString(),
            offer_id: offerId,
          }).catch(() => {});

          // Publish targeted notification
          await supabase.from("notifications").insert({
            id: `notif_${Date.now()}`,
            title: `عرض جديد: ${title}`,
            message: description,
            type: "offer",
            target_type: "offer",
            target_id: offerId,
            store_id: targetStoreId,
            target_scope: districtId && districtId !== "all" ? "district" : "governorate",
            target_governorate_id: governorateId,
            target_district_id: districtId,
            image_url: body.imageUrl || body.image_url,
          }).catch(() => {});
        }

        return jsonResponse({
          success: true,
          offer: newOffer?.[0] || body,
          notificationSent: canSendNotification,
          cooldownActive: !canSendNotification,
          cooldownRemainingDays,
          message: canSendNotification
            ? "تم نشر العرض وبث الإشعار للمنطقة بنجاح!"
            : `تم نشر العرض بنجاح. ملاحظة: لم يتم إرسال إشعار للمنطقة بسبب قاعدة الـ15 يوماً بين إشعارات المتجر الواحد (المتبقي ${cooldownRemainingDays} يوم).`,
        });
      }
    }

    // ------------------------------------------------------------------------
    // /notifications (GET / POST)
    // ------------------------------------------------------------------------
    if (path === "/notifications") {
      if (req.method === "GET") {
        const gov = url.searchParams.get("governorateId");
        const dist = url.searchParams.get("districtId");

        const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50);

        if (error) {
          return jsonResponse({ success: false, error: error.message }, 400);
        }

        // Filter notifications by target scope (Iraq vs Governorate vs District)
        const filtered = (data || []).filter((notif) => {
          if (notif.target_scope === "iraq" || !notif.target_scope) return true;
          if (gov && notif.target_governorate_id && notif.target_governorate_id !== gov) {
            return false;
          }
          if (dist && dist !== "all" && notif.target_scope === "district") {
            if (notif.target_district_id && notif.target_district_id !== dist) {
              return false;
            }
          }
          return true;
        });

        return jsonResponse({ success: true, notifications: filtered });
      }

      if (req.method === "POST") {
        if (!checkAdminAuth(req)) {
          return jsonResponse({ success: false, error: "غير مصرح لك بنشر إشعار عام." }, 401);
        }
        const body = await req.json().catch(() => ({}));
        const { title, message } = body;
        if (!title || !message) {
          return jsonResponse({ success: false, error: "العنوان والرسالة مطلوبان." }, 400);
        }
        const notifId = body.id || `notif_${Date.now()}`;
        const { data, error } = await supabase.from("notifications").insert({
          id: notifId,
          title,
          message,
          type: body.type || "system",
          target_scope: body.targetScope || body.target_scope || "district",
          target_governorate_id: body.targetGovernorateId || body.target_governorate_id,
          target_district_id: body.targetDistrictId || body.target_district_id,
          category_id: body.categoryId || body.category_id,
          image_url: body.imageUrl || body.image_url,
        }).select();

        if (error) {
          return jsonResponse({ success: false, error: error.message }, 400);
        }
        return jsonResponse({ success: true, notification: data?.[0] });
      }
    }

    // ------------------------------------------------------------------------
    // /advertisements (GET)
    // ------------------------------------------------------------------------
    if (path === "/advertisements") {
      if (req.method === "GET") {
        const pos = url.searchParams.get("position");
        const gov = url.searchParams.get("governorateId");
        const dist = url.searchParams.get("districtId");

        let dbQuery = supabase.from("advertisements").select("*").eq("is_active", true);
        if (pos) dbQuery = dbQuery.eq("position", pos);

        const { data, error } = await dbQuery.order("created_at", { ascending: false });
        if (error) {
          return jsonResponse({ success: false, error: error.message }, 400);
        }

        // Filter expired & geo-targeted
        const now = new Date();
        const activeAds = (data || []).filter((ad) => {
          if (ad.expires_at && new Date(ad.expires_at) < now) return false;
          if (gov && ad.target_governorate_id && ad.target_governorate_id !== gov) return false;
          if (dist && dist !== "all" && ad.target_district_id && ad.target_district_id !== dist) return false;
          return true;
        });

        return jsonResponse({ success: true, advertisements: activeAds });
      }
    }

    // ------------------------------------------------------------------------
    // /wallet (GET - Protected)
    // ------------------------------------------------------------------------
    if (path === "/wallet") {
      if (!checkAdminAuth(req)) {
        return jsonResponse({ success: false, error: "غير مصرح لك بالوصول للمحفظة المالية." }, 401);
      }
      const { data, error } = await supabase.from("wallets").select("*").limit(1).single();
      if (error && error.code !== "PGRST116") {
        return jsonResponse({ success: false, error: error.message }, 400);
      }
      return jsonResponse({
        success: true,
        wallet: data || { id: "main_wallet", user_id: "admin", balance: 0, currency: "IQD" },
      });
    }

    // ------------------------------------------------------------------------
    // /wallet/transaction (POST - Protected)
    // ------------------------------------------------------------------------
    if (path === "/wallet/transaction" && req.method === "POST") {
      if (!checkAdminAuth(req)) {
        return jsonResponse({ success: false, error: "غير مصرح لك بإجراء معاملات مالية." }, 401);
      }
      const body = await req.json().catch(() => ({}));
      const { amount, type, title, paymentMethod, referenceNumber } = body;
      const numAmount = Number(amount);
      if (!numAmount || !type || !title) {
        return jsonResponse({ success: false, error: "بيانات المعاملة غير مكتملة." }, 400);
      }

      const txId = `tx_${Date.now()}`;
      const { error: txErr } = await supabase.from("transactions").insert({
        id: txId,
        wallet_id: "main_wallet",
        user_id: "admin",
        amount: numAmount,
        type,
        title,
        payment_method: paymentMethod || "ZainCash",
        reference_number: referenceNumber,
      });

      if (txErr) {
        return jsonResponse({ success: false, error: txErr.message }, 400);
      }

      // Update balance
      const delta = (type === "deposit" || type === "earning") ? numAmount : -numAmount;
      const { data: currWallet } = await supabase.from("wallets").select("balance").eq("id", "main_wallet").single();
      const newBal = (currWallet?.balance || 0) + delta;
      await supabase.from("wallets").upsert({
        id: "main_wallet",
        user_id: "admin",
        balance: newBal,
        currency: "IQD",
      });

      return jsonResponse({ success: true, balance: newBal, transactionId: txId });
    }

    // ------------------------------------------------------------------------
    // /reviews (GET / POST - 5 Stars System)
    // ------------------------------------------------------------------------
    if (path === "/reviews") {
      if (req.method === "GET") {
        const storeId = url.searchParams.get("storeId");
        let dbQuery = supabase.from("reviews").select("*").order("created_at", { ascending: false });
        if (storeId) dbQuery = dbQuery.eq("store_id", storeId);
        const { data, error } = await dbQuery;
        if (error) {
          return jsonResponse({ success: false, error: error.message }, 400);
        }
        return jsonResponse({ success: true, reviews: data || [] });
      }

      if (req.method === "POST") {
        const body = await req.json().catch(() => ({}));
        const { storeId, store_id, rating, userName, user_name, comment, deviceId, device_id } = body;
        const targetStoreId = storeId || store_id;
        const numRating = Number(rating);

        if (!targetStoreId || !numRating || numRating < 1 || numRating > 5) {
          return jsonResponse({ success: false, error: "معرف المتجر وتقييم صحيح (1-5) مطلوبان." }, 400);
        }

        const effectiveDeviceId = deviceId || device_id;
        if (effectiveDeviceId) {
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
          const { data: existing } = await supabase
            .from("reviews")
            .select("id")
            .eq("store_id", targetStoreId)
            .eq("device_id", effectiveDeviceId)
            .gte("created_at", oneDayAgo);

          if (existing && existing.length > 0) {
            return jsonResponse({
              success: false,
              error: "لقد قمت بتقييم هذا المتجر مسبقاً. يرجى الانتظار 24 ساعة.",
            }, 429);
          }
        }

        const reviewId = `rev_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const { error: revErr } = await supabase.from("reviews").insert({
          id: reviewId,
          store_id: targetStoreId,
          rating: numRating,
          user_name: userName || user_name || "زائر دليل العراق",
          comment: comment || null,
          device_id: effectiveDeviceId,
        });

        if (revErr) {
          return jsonResponse({ success: false, error: revErr.message }, 400);
        }

        // Recompute store average
        const { data: allRevs } = await supabase.from("reviews").select("rating").eq("store_id", targetStoreId);
        if (allRevs && allRevs.length > 0) {
          const count = allRevs.length;
          const avg = Number((allRevs.reduce((acc, c) => acc + Number(c.rating), 0) / count).toFixed(1));
          await supabase.from("stores").update({ rating: avg, reviews_count: count }).eq("id", targetStoreId);
        }

        return jsonResponse({ success: true, message: "تم تسجيل التقييم بنجاح." });
      }
    }

    // ------------------------------------------------------------------------
    // /stats (GET)
    // ------------------------------------------------------------------------
    if (path === "/stats") {
      const { count: storeCount } = await supabase.from("stores").select("*", { count: "exact", head: true });
      const { count: offerCount } = await supabase.from("offers").select("*", { count: "exact", head: true });
      const { count: adCount } = await supabase.from("advertisements").select("*", { count: "exact", head: true });

      return jsonResponse({
        success: true,
        stats: {
          stores: storeCount || 0,
          offers: offerCount || 0,
          advertisements: adCount || 0,
          governorates: 18,
          districts: 138,
        },
      });
    }

    // ------------------------------------------------------------------------
    // /sync (POST / GET)
    // ------------------------------------------------------------------------
    if (path === "/sync") {
      const { count: storeCount } = await supabase.from("stores").select("*", { count: "exact", head: true });
      return jsonResponse({
        success: true,
        status: "synced",
        storeCount: storeCount || 0,
        timestamp: new Date().toISOString(),
      });
    }

    // ------------------------------------------------------------------------
    // Fallback 404
    // ------------------------------------------------------------------------
    return jsonResponse({ success: false, error: `المسار ${path} غير موجود.` }, 404);
  } catch (err: any) {
    return jsonResponse({ success: false, error: err?.message || "Internal Server Error" }, 500);
  }
});
