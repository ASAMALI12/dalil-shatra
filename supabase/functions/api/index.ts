// ============================================================================
// Supabase Edge Function: /api (دليل العراق - Dalil Iraq Backend API)
// Deployable to Supabase: `supabase functions deploy api --no-verify-jwt`
// Project ID: ccvntqtohuxqpxfqnhxt
// Official Production Backend for Web and Capacitor Android APK (com.daliliraq.app)
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

// In-memory sessions, rate limits, and caching for Edge Function instance
const activeSessions = new Map<string, { username: string; expiresAt: number }>();
const otpRateLimitMap = new Map<string, { attempts: number; lastAttempt: number }>();
const adminLoginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const adOtpMemoryStore = new Map<string, { otpHash: string; expiresAt: number; attempts: number }>();

// ----------------------------------------------------------------------------
// Cryptographic Helpers: Password Hashing (PBKDF2-SHA256) & Secure Random OTPs
// ----------------------------------------------------------------------------

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

// PBKDF2 Password Hashing with 100,000 iterations and 16-byte random salt
async function hashPassword(password: string): Promise<string> {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );
  const saltHex = bytesToHex(salt);
  const hashHex = bytesToHex(new Uint8Array(derivedBits));
  return `pbkdf2_sha256$100000$${saltHex}$${hashHex}`;
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (!storedHash || typeof storedHash !== "string") return false;

  // Check PBKDF2 format: pbkdf2_sha256$iterations$salt$hash
  if (storedHash.startsWith("pbkdf2_sha256$")) {
    const parts = storedHash.split("$");
    if (parts.length !== 4) return false;
    const iterations = parseInt(parts[1], 10);
    const salt = hexToBytes(parts[2]);
    const originalHashHex = parts[3];

    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      enc.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveBits"]
    );
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt,
        iterations,
        hash: "SHA-256",
      },
      keyMaterial,
      256
    );
    const derivedHex = bytesToHex(new Uint8Array(derivedBits));
    return derivedHex === originalHashHex;
  }

  // Legacy transition fallback (without exposing password): if plain string equals input, allow verification and signal upgrade
  return storedHash === password;
}

// Cryptographically secure 6-digit OTP generator (never Math.random)
function generateSecureOtp(): string {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  const code = (100000 + (buf[0] % 900000)).toString();
  return code;
}

// SHA-256 hash for OTPs with application salt
async function hashOtp(otp: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(`${otp}:${salt}`);
  const hashBuf = await crypto.subtle.digest("SHA-256", data);
  return bytesToHex(new Uint8Array(hashBuf));
}

// ----------------------------------------------------------------------------
// WhatsApp Gateway Provider Integration
// ----------------------------------------------------------------------------
async function sendWhatsAppOtp(phone: string, otp: string): Promise<{ success: boolean; error?: string }> {
  const token = Deno.env.get("WHATSAPP_API_TOKEN");
  const phoneId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
  const apiUrl = Deno.env.get("WHATSAPP_API_URL");

  let intlPhone = phone.replace(/\D/g, "");
  if (intlPhone.startsWith("07")) {
    intlPhone = "964" + intlPhone.slice(1);
  } else if (!intlPhone.startsWith("964") && intlPhone.startsWith("7")) {
    intlPhone = "964" + intlPhone;
  }

  if (token && (phoneId || apiUrl)) {
    try {
      const endpoint = apiUrl || `https://graph.facebook.com/v19.0/${phoneId}/messages`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: intlPhone,
          type: "text",
          text: {
            body: `رمز التحقق الخاص بك في دليل العراق هو: ${otp} (صالح لمدة 5 دقائق). لا تشارك هذا الرمز مع أي شخص.`,
          },
        }),
      });

      if (res.ok) {
        return { success: true };
      }
      const errData = await res.json().catch(() => ({}));
      console.warn("[WhatsApp Gateway Error]", errData);
      return { success: false, error: errData?.error?.message || "تعذر تسليم رسالة الواتساب عبر المزود." };
    } catch (e: any) {
      console.warn("[WhatsApp Network Error]", e);
      return { success: false, error: "فشل الاتصال بمزود خدمة الواتساب." };
    }
  }

  // Explicit security behavior: provider not configured
  return {
    success: false,
    error: "خدمة التحقق عبر WhatsApp غير مهيأة",
  };
}

// Helper: Supabase Client with Service Role (Inside Edge Function only)
function getSupabase() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://ccvntqtohuxqpxfqnhxt.supabase.co";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY") || "";
  return createClient(supabaseUrl, supabaseKey);
}

// Helper: Check Admin Authorization Token
function checkAdminAuth(req: Request): boolean {
  const authHeader = req.headers.get("authorization");
  const customHeader = req.headers.get("x-admin-token");
  const token = (authHeader?.replace(/^Bearer\s+/i, "") || customHeader || "").trim();
  if (!token) return false;

  const session = activeSessions.get(token);
  if (session && session.expiresAt > Date.now()) {
    return true;
  }
  const masterSecret = Deno.env.get("IRAQ_ADMIN_TOKEN") || Deno.env.get("ADMIN_TOKEN");
  if (masterSecret && token === masterSecret) {
    return true;
  }
  return false;
}

// Helper: Normalize phone numbers including Arabic-Indic numerals
function normalizePhoneDigits(input: any): string {
  if (!input) return "";
  const str = String(input);
  const ascii = str.replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString());
  return ascii.replace(/\D/g, "");
}

// Rate limiting helper
function checkRateLimit(map: Map<string, { count: number; lastAttempt: number }>, key: string, maxAttempts = 5, windowMs = 10 * 60 * 1000): { allowed: boolean; waitMins?: number } {
  const now = Date.now();
  const entry = map.get(key);
  if (entry && now - entry.lastAttempt < windowMs) {
    if (entry.count >= maxAttempts) {
      const waitMins = Math.ceil((windowMs - (now - entry.lastAttempt)) / 60000);
      return { allowed: false, waitMins };
    }
    entry.count += 1;
    entry.lastAttempt = now;
    return { allowed: true };
  }
  map.set(key, { count: 1, lastAttempt: now });
  return { allowed: true };
}

// ----------------------------------------------------------------------------
// Main Request Handler
// ----------------------------------------------------------------------------
serve(async (req: Request) => {
  // 1. Handle CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
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

  const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "client";
  const secretSalt = Deno.env.get("ADMIN_TOKEN_SECRET") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "dalil-iraq-salt";

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
        packageId: "com.daliliraq.app",
        timestamp: new Date().toISOString(),
      });
    }

    // ------------------------------------------------------------------------
    // /supabase-config (Public GET, Protected POST)
    // ------------------------------------------------------------------------
    if (path === "/supabase-config") {
      if (req.method === "GET") {
        const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://ccvntqtohuxqpxfqnhxt.supabase.co";
        const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
        return jsonResponse({
          supabaseUrl,
          supabaseAnonKey,
          isConfigured: Boolean(supabaseUrl && supabaseAnonKey),
        });
      }
    }

    // ------------------------------------------------------------------------
    // /admin/verify-credentials-send-otp
    // Step 1 of Manager Login: Verifies username + phone + password hash,
    // generates secure OTP, hashes it, saves to DB, sends via WhatsApp provider.
    // NEVER returns code or password in JSON response!
    // ------------------------------------------------------------------------
    if (path === "/admin/verify-credentials-send-otp" && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const { username, password, phone } = body;

      if (!username || !password || !phone) {
        return jsonResponse({
          success: false,
          error: "يرجى ملء جميع الحقول المطلوبة (رقم الهاتف، واسم المستخدم، وكلمة المرور).",
        }, 400);
      }

      const cleanUser = String(username).trim().toLowerCase();
      const cleanPass = String(password).trim();
      const cleanPhone = normalizePhoneDigits(phone);

      // Anti-brute force rate limiting (Max 5 attempts per 10 minutes)
      const rateLimitCheck = checkRateLimit(adminLoginAttempts, `${clientIp}_${cleanUser}`);
      if (!rateLimitCheck.allowed) {
        return jsonResponse({
          success: false,
          error: `تم تجاوز الحد المسموح لمحاولات الدخول. يرجى الانتظار ${rateLimitCheck.waitMins} دقيقة قبل المحاولة مجدداً.`,
        }, 429);
      }

      // Fetch admin credentials from Supabase admin_credentials table
      let { data: adminRecord } = await supabase
        .from("admin_credentials")
        .select("*")
        .limit(1)
        .maybeSingle();

      // If no admin credentials exist yet in database, initialize securely from environment
      if (!adminRecord) {
        const envUser = Deno.env.get("IRAQ_ADMIN_USERNAME");
        const envPass = Deno.env.get("IRAQ_ADMIN_PASSWORD");
        const envPhone = Deno.env.get("IRAQ_ADMIN_PHONE");

        if (envUser && envPass) {
          const initialHash = await hashPassword(envPass);
          const { data: inserted } = await supabase.from("admin_credentials").insert({
            id: "primary_admin",
            username: envUser,
            phone: envPhone || cleanPhone,
            password_hash: initialHash,
            role: "superadmin",
          }).select().maybeSingle();
          adminRecord = inserted;
        }
      }

      if (!adminRecord) {
        return jsonResponse({
          success: false,
          error: "لم يتم العثور على إعدادات المدير في قاعدة البيانات.",
        }, 400);
      }

      // Verify username (case-insensitive)
      const isUserMatch = adminRecord.username && cleanUser === String(adminRecord.username).trim().toLowerCase();

      // Verify phone number (matches clean digits or suffix)
      const dbPhoneClean = normalizePhoneDigits(adminRecord.phone);
      const isPhoneMatch =
        cleanPhone === dbPhoneClean ||
        (dbPhoneClean.length >= 8 && cleanPhone.endsWith(dbPhoneClean.slice(-8))) ||
        (cleanPhone.length >= 8 && dbPhoneClean.endsWith(cleanPhone.slice(-8)));

      // Verify password hash
      const isPassMatch = await verifyPassword(cleanPass, adminRecord.password_hash);

      if (!isUserMatch || !isPhoneMatch || !isPassMatch) {
        return jsonResponse({
          success: false,
          error: "بيانات المدير غير مطابقة. يرجى التأكد من رقم الهاتف واسم المستخدم وكلمة المرور.",
        }, 401);
      }

      // Upgrade plaintext password in database to secure PBKDF2 hash if legacy
      if (!adminRecord.password_hash.startsWith("pbkdf2_sha256$")) {
        const upgradedHash = await hashPassword(cleanPass);
        await supabase.from("admin_credentials").update({
          password_hash: upgradedHash,
          updated_at: new Date().toISOString(),
        }).eq("id", adminRecord.id);
      }

      // Generate cryptographically secure 6-digit OTP
      const code = generateSecureOtp();
      const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity
      const codeHash = await hashOtp(code, secretSalt);

      // Save OTP hash in admin_credentials
      await supabase.from("admin_credentials").update({
        otp_code_hash: codeHash,
        otp_expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      }).eq("id", adminRecord.id);

      // Dispatch OTP via WhatsApp Provider
      const targetPhone = adminRecord.phone || cleanPhone;
      const sendResult = await sendWhatsAppOtp(targetPhone, code);

      if (!sendResult.success) {
        return jsonResponse({
          success: false,
          error: sendResult.error || "خدمة التحقق عبر WhatsApp غير مهيأة",
        }, 503);
      }

      // SUCCESS: The raw code is NEVER returned in the response!
      return jsonResponse({
        success: true,
        step: "otp_required",
        message: "تم إرسال رمز التحقق إلى واتساب المدير بنجاح. الرمز صالح لمدة 5 دقائق.",
      });
    }

    // ------------------------------------------------------------------------
    // /admin/login
    // Step 2 of Manager Login: Verifies username, password hash, and WhatsApp OTP hash.
    // Issues secure session token.
    // ------------------------------------------------------------------------
    if (path === "/admin/login" && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const { username, password, phone, whatsappOtp, otp } = body;
      const enteredOtp = normalizePhoneDigits(whatsappOtp || otp);

      if (!username || !password || !enteredOtp) {
        return jsonResponse({
          success: false,
          error: "اسم المستخدم وكلمة المرور ورمز التحقق عبر واتساب مطلوبة.",
        }, 400);
      }

      const cleanUser = String(username).trim().toLowerCase();
      const cleanPass = String(password).trim();
      const cleanPhone = normalizePhoneDigits(phone);

      const { data: adminRecord } = await supabase
        .from("admin_credentials")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (!adminRecord) {
        return jsonResponse({ success: false, error: "بيانات الاعتماد غير موجودة." }, 401);
      }

      // Verify username and password
      const isUserMatch = adminRecord.username && cleanUser === String(adminRecord.username).trim().toLowerCase();
      const isPassMatch = await verifyPassword(cleanPass, adminRecord.password_hash);

      if (!isUserMatch || !isPassMatch) {
        return jsonResponse({ success: false, error: "اسم المستخدم أو كلمة المرور غير صحيحة." }, 401);
      }

      // Check OTP expiry (5 minutes)
      const now = Date.now();
      if (!adminRecord.otp_expires_at || Number(adminRecord.otp_expires_at) < now) {
        return jsonResponse({
          success: false,
          error: "رمز التحقق منتهي الصلاحية. يرجى طلب رمز جديد.",
        }, 400);
      }

      // Verify OTP hash
      const enteredHash = await hashOtp(enteredOtp, secretSalt);
      if (!adminRecord.otp_code_hash || adminRecord.otp_code_hash !== enteredHash) {
        return jsonResponse({
          success: false,
          error: "رمز التحقق عبر واتساب غير صحيح. يرجى التأكد من الرمز المستلم.",
        }, 401);
      }

      // Clear consumed OTP immediately to prevent replay attacks
      await supabase.from("admin_credentials").update({
        otp_code_hash: null,
        otp_expires_at: null,
        updated_at: new Date().toISOString(),
      }).eq("id", adminRecord.id);

      // Generate cryptographically secure session token
      const randomBuf = new Uint8Array(32);
      crypto.getRandomValues(randomBuf);
      const token = `adm_${bytesToHex(randomBuf)}`;
      const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

      activeSessions.set(token, { username: adminRecord.username, expiresAt });
      adminLoginAttempts.delete(`${clientIp}_${cleanUser}`);

      return jsonResponse({
        success: true,
        token,
        expiresAt,
        user: {
          username: adminRecord.username,
          phone: adminRecord.phone,
        },
      });
    }

    // ------------------------------------------------------------------------
    // /admin/status
    // ------------------------------------------------------------------------
    if (path === "/admin/status" && req.method === "GET") {
      if (!checkAdminAuth(req)) {
        return jsonResponse({ success: false, loggedIn: false, error: "غير مصرح لك بالوصول." }, 401);
      }
      const { data: adminRecord } = await supabase
        .from("admin_credentials")
        .select("username, phone, role")
        .limit(1)
        .maybeSingle();

      const user = {
        username: adminRecord?.username || "admin",
        phone: adminRecord?.phone || "",
        role: adminRecord?.role || "superadmin",
      };
      return jsonResponse({
        success: true,
        loggedIn: true,
        user,
        username: user.username,
        phone: user.phone,
      });
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

      if (!currentPassword || !newPassword || newPassword.length < 6) {
        return jsonResponse({
          success: false,
          error: "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل.",
        }, 400);
      }

      const { data: adminRecord, error: fetchErr } = await supabase
        .from("admin_credentials")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (fetchErr || !adminRecord) {
        return jsonResponse({ success: false, error: "تعذر التحقق من سجل المدير في قاعدة البيانات." }, 500);
      }

      const isCurrentMatch = await verifyPassword(currentPassword, adminRecord.password_hash);
      if (!isCurrentMatch) {
        return jsonResponse({ success: false, error: "كلمة المرور الحالية غير صحيحة." }, 401);
      }

      // Hash new password using PBKDF2
      const newHash = await hashPassword(newPassword);

      const { error: updateErr } = await supabase
        .from("admin_credentials")
        .update({
          password_hash: newHash,
          updated_at: new Date().toISOString(),
        })
        .eq("id", adminRecord.id);

      if (updateErr) {
        return jsonResponse({
          success: false,
          error: `فشل حفظ كلمة المرور في قاعدة البيانات: ${updateErr.message}`,
        }, 500);
      }

      return jsonResponse({
        success: true,
        message: "تم تغيير كلمة المرور بنجاح وحفظها في قاعدة البيانات.",
      });
    }

    // ------------------------------------------------------------------------
    // /admin/credentials/update
    // ------------------------------------------------------------------------
    if (path === "/admin/credentials/update" && req.method === "POST") {
      if (!checkAdminAuth(req)) {
        return jsonResponse({ success: false, error: "غير مصرح لك بالوصول." }, 401);
      }
      const body = await req.json().catch(() => ({}));
      const { currentPassword, newPhone, newUsername, newPassword } = body;

      const { data: adminRecord } = await supabase
        .from("admin_credentials")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (!adminRecord) {
        return jsonResponse({ success: false, error: "سجل المدير غير موجود." }, 500);
      }

      if (currentPassword) {
        const isCurrentMatch = await verifyPassword(currentPassword, adminRecord.password_hash);
        if (!isCurrentMatch) {
          return jsonResponse({ success: false, error: "كلمة المرور الحالية غير صحيحة." }, 401);
        }
      }

      const updates: any = { updated_at: new Date().toISOString() };
      if (newPhone) updates.phone = normalizePhoneDigits(newPhone);
      if (newUsername) updates.username = String(newUsername).trim();
      if (newPassword && newPassword.length >= 6) {
        updates.password_hash = await hashPassword(newPassword);
      }

      const { error: updErr } = await supabase.from("admin_credentials").update(updates).eq("id", adminRecord.id);
      if (updErr) {
        return jsonResponse({ success: false, error: updErr.message }, 500);
      }

      return jsonResponse({ success: true, message: "تم تحديث بيانات المدير وحفظها بنجاح." });
    }

    // ------------------------------------------------------------------------
    // /admin/refresh
    // ------------------------------------------------------------------------
    if (path === "/admin/refresh" && req.method === "POST") {
      if (!checkAdminAuth(req)) {
        return jsonResponse({ success: false, error: "غير مصرح لك بالوصول." }, 401);
      }
      const randomBuf = new Uint8Array(32);
      crypto.getRandomValues(randomBuf);
      const token = `adm_${bytesToHex(randomBuf)}`;
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
    // /admin/claims
    // ------------------------------------------------------------------------
    if (path === "/admin/claims" && req.method === "GET") {
      if (!checkAdminAuth(req)) {
        return jsonResponse({ success: false, error: "غير مصرح لك بالوصول." }, 401);
      }
      const { data, error } = await supabase
        .from("store_claims")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        return jsonResponse({ success: false, error: error.message }, 400);
      }
      return jsonResponse({ success: true, claims: data || [] });
    }

    // ------------------------------------------------------------------------
    // /admin/claims/:id/review
    // ------------------------------------------------------------------------
    if (path.startsWith("/admin/claims/") && path.endsWith("/review") && req.method === "POST") {
      if (!checkAdminAuth(req)) {
        return jsonResponse({ success: false, error: "غير مصرح لك بالوصول." }, 401);
      }
      const claimId = path.replace("/admin/claims/", "").replace("/review", "");
      const body = await req.json().catch(() => ({}));
      const { status, adminNotes } = body;

      const reviewedAt = new Date().toISOString();
      const { data, error } = await supabase
        .from("store_claims")
        .update({
          status,
          admin_notes: adminNotes,
          reviewed_at: reviewedAt,
        })
        .eq("id", claimId)
        .select()
        .maybeSingle();

      if (error) {
        return jsonResponse({ success: false, error: error.message }, 400);
      }

      if (status === "verified" && data?.store_id) {
        await supabase.from("stores").update({
          is_claimed: true,
          claim_status: "verified",
          claimed_by_name: data.applicant_name,
          claimed_by_phone: data.applicant_phone,
          claimed_at: reviewedAt,
        }).eq("id", data.store_id);
      }

      return jsonResponse({
        success: true,
        claim: data,
        message: `تم تحديث حالة المطالبة إلى: ${status === "verified" ? "معتمد وموثّق" : status === "rejected" ? "مرفوض" : "قيد المراجعة"}.`,
      });
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
        const storeId = id || `store_${Date.now()}_${generateSecureOtp().slice(0, 4)}`;
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
    // /stores/claim and /claim/request-otp
    // Store Owner Claim Request: Cryptographic OTP, Hashed Storage, WhatsApp Gateway
    // ------------------------------------------------------------------------
    if (path === "/stores/claim" || path === "/claim/request-otp") {
      if (req.method === "POST") {
        const body = await req.json().catch(() => ({}));
        const { storeId, storePhone, applicantPhone, applicantName } = body;

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
          const comparePhone = existingStore.phone || storePhone;
          if (comparePhone) {
            const cleanDbPhone = normalizePhoneDigits(comparePhone);
            const cleanApplicantPhone = normalizePhoneDigits(applicantPhone);
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

        // Anti-abuse rate limiting (Max 3 OTP requests in 10 minutes)
        const rateKey = `${storeId}_${applicantPhone}`;
        const rateLimit = checkRateLimit(otpRateLimitMap, rateKey, 3, 10 * 60 * 1000);
        if (!rateLimit.allowed) {
          return jsonResponse({
            success: false,
            error: `تم تجاوز الحد المسموح لطلب رمز التحقق. يرجى الانتظار ${rateLimit.waitMins} دقيقة قبل المحاولة مجدداً.`,
          }, 429);
        }

        // Cryptographically secure OTP & Hash
        const generatedOtp = generateSecureOtp();
        const otpHash = await hashOtp(generatedOtp, secretSalt);
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

        // Record in otp_verifications table in Supabase
        const otpRecordId = `otp_${Date.now()}_${generateSecureOtp().slice(0, 4)}`;
        await supabase.from("otp_verifications").insert({
          id: otpRecordId,
          phone: applicantPhone,
          store_id: storeId,
          otp_hash: otpHash,
          expires_at: expiresAt,
          verified: false,
          attempts: 0,
        }).catch(() => {});

        // Send via WhatsApp provider
        const sendResult = await sendWhatsAppOtp(applicantPhone, generatedOtp);
        if (!sendResult.success) {
          return jsonResponse({
            success: false,
            error: sendResult.error || "خدمة التحقق عبر WhatsApp غير مهيأة",
          }, 503);
        }

        // Plain OTP is NEVER returned to client!
        return jsonResponse({
          success: true,
          message: "تم إرسال رمز التحقق بنجاح إلى واتساب هاتفك.",
          expiresInSeconds: 300,
        });
      }
    }

    // ------------------------------------------------------------------------
    // /stores/verify-otp and /claim/verify-otp
    // ------------------------------------------------------------------------
    if (path === "/stores/verify-otp" || path === "/claim/verify-otp") {
      if (req.method === "POST") {
        const body = await req.json().catch(() => ({}));
        const { storeId, applicantPhone, applicantName, otp } = body;

        if (!storeId || !applicantPhone || !otp) {
          return jsonResponse({ success: false, error: "رمز التحقق ورقم الهاتف مطلوبان." }, 400);
        }

        const inputHash = await hashOtp(String(otp).trim(), secretSalt);

        // Fetch active OTP from otp_verifications table
        const { data: records, error: fetchErr } = await supabase
          .from("otp_verifications")
          .select("*")
          .eq("store_id", storeId)
          .eq("phone", applicantPhone)
          .eq("verified", false)
          .order("created_at", { ascending: false })
          .limit(1);

        if (fetchErr || !records || records.length === 0) {
          return jsonResponse({ success: false, error: "رمز التحقق غير موجود أو تم استخدامه مسبقاً." }, 400);
        }

        const record = records[0];
        const isExpired = new Date(record.expires_at).getTime() < Date.now();
        if (isExpired) {
          return jsonResponse({ success: false, error: "انتهت صلاحية رمز التحقق (أكثر من 5 دقائق). يرجى طلب رمز جديد." }, 400);
        }

        if (record.attempts >= (record.max_attempts || 3)) {
          return jsonResponse({ success: false, error: "تم تجاوز الحد الأقصى للمحاولات الخاطئة." }, 429);
        }

        if (record.otp_hash !== inputHash) {
          const newAttempts = (record.attempts || 0) + 1;
          await supabase.from("otp_verifications").update({ attempts: newAttempts }).eq("id", record.id);
          const remaining = Math.max(0, 3 - newAttempts);
          return jsonResponse({
            success: false,
            error: `رمز التحقق غير صحيح. تبقى لديك ${remaining} محاولة.`,
          }, 400);
        }

        // OTP verified successfully
        await supabase.from("otp_verifications").update({ verified: true }).eq("id", record.id);

        const verifiedAt = new Date().toISOString();
        const claimId = `claim_${Date.now()}`;
        await supabase.from("store_claims").insert({
          id: claimId,
          store_id: storeId,
          applicant_name: applicantName || "صاحب المتجر",
          applicant_phone: applicantPhone,
          status: "verified",
          otp_verified: true,
          reviewed_at: verifiedAt,
          admin_notes: "تم توثيق الملكية عبر رمز OTP بنجاح.",
        }).catch(() => {});

        const { data: updatedStore } = await supabase.from("stores").update({
          is_claimed: true,
          claim_status: "verified",
          claimed_by_name: applicantName || undefined,
          claimed_by_phone: applicantPhone,
          claimed_at: verifiedAt,
        }).eq("id", storeId).select().maybeSingle().catch(() => ({ data: null }));

        return jsonResponse({
          success: true,
          message: "تم توثيق ملكية المتجر بنجاح!",
          store: updatedStore || undefined,
        });
      }
    }

    // ------------------------------------------------------------------------
    // /ad/request-otp
    // Secure Advertiser OTP Generation & WhatsApp Dispatch
    // ------------------------------------------------------------------------
    if (path === "/ad/request-otp" && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const { phone } = body;
      if (!phone) {
        return jsonResponse({ success: false, error: "رقم الهاتف مطلوب." }, 400);
      }

      const cleanPhone = normalizePhoneDigits(phone);
      if (cleanPhone.length < 8) {
        return jsonResponse({ success: false, error: "رقم الهاتف غير صالح." }, 400);
      }

      const rateLimit = checkRateLimit(otpRateLimitMap, `ad_${cleanPhone}`, 3, 10 * 60 * 1000);
      if (!rateLimit.allowed) {
        return jsonResponse({
          success: false,
          error: `تم تجاوز الحد المسموح لطلب رمز التحقق. يرجى الانتظار ${rateLimit.waitMins} دقيقة.`,
        }, 429);
      }

      const code = generateSecureOtp();
      const codeHash = await hashOtp(code, secretSalt);
      const expiresAt = Date.now() + 5 * 60 * 1000;

      adOtpMemoryStore.set(cleanPhone, {
        otpHash: codeHash,
        expiresAt,
        attempts: 0,
      });

      const sendResult = await sendWhatsAppOtp(cleanPhone, code);
      if (!sendResult.success) {
        return jsonResponse({
          success: false,
          error: sendResult.error || "خدمة التحقق عبر WhatsApp غير مهيأة",
        }, 503);
      }

      return jsonResponse({
        success: true,
        message: `تم إرسال رمز التحقق إلى واتساب الرقم ${cleanPhone} بنجاح.`,
      });
    }

    // ------------------------------------------------------------------------
    // /ad/verify-otp
    // ------------------------------------------------------------------------
    if (path === "/ad/verify-otp" && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const { phone, otp } = body;
      if (!phone || !otp) {
        return jsonResponse({ success: false, error: "رقم الهاتف ورمز التحقق مطلوبان." }, 400);
      }

      const cleanPhone = normalizePhoneDigits(phone);
      const cleanOtp = String(otp).trim();
      const record = adOtpMemoryStore.get(cleanPhone);

      if (!record) {
        return jsonResponse({ success: false, error: "انتهت صلاحية رمز التحقق أو لم يتم طلبه." }, 400);
      }

      if (Date.now() > record.expiresAt) {
        adOtpMemoryStore.delete(cleanPhone);
        return jsonResponse({ success: false, error: "انتهت صلاحية رمز التحقق (5 دقائق)." }, 400);
      }

      if (record.attempts >= 3) {
        adOtpMemoryStore.delete(cleanPhone);
        return jsonResponse({ success: false, error: "تم تجاوز عدد المحاولات المسموح بها." }, 429);
      }

      const inputHash = await hashOtp(cleanOtp, secretSalt);
      if (inputHash !== record.otpHash) {
        record.attempts += 1;
        const remaining = 3 - record.attempts;
        return jsonResponse({
          success: false,
          error: `رمز التحقق غير صحيح. تبقى لديك ${remaining} محاولات.`,
        }, 400);
      }

      adOtpMemoryStore.delete(cleanPhone);
      return jsonResponse({
        success: true,
        message: "تم التحقق بنجاح من ملكية رقم الهاتف!",
        phone: cleanPhone,
      });
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

        // 15-day cooldown enforcement
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
          await supabase.from("offer_notification_limits").upsert({
            id: `limit_${targetStoreId}`,
            store_id: targetStoreId,
            last_notification_at: new Date().toISOString(),
            offer_id: offerId,
          }).catch(() => {});

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

        const filtered = (data || []).filter((notif) => {
          if (notif.target_scope === "iraq" || !notif.target_scope) return true;
          if (gov && notif.target_governorate_id && notif.target_governorate_id !== gov) return false;
          if (dist && dist !== "all" && notif.target_scope === "district") {
            if (notif.target_district_id && notif.target_district_id !== dist) return false;
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
    // /notifications/read (POST: mark notification as read)
    // ------------------------------------------------------------------------
    if (path === "/notifications/read" && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const { notificationId, notificationIds, userId = "user" } = body;
      const ids: string[] = notificationIds || (notificationId ? [notificationId] : []);
      if (ids.length > 0) {
        const rows = ids.map((nid) => ({
          id: `read_${userId}_${nid}`,
          user_id: userId,
          notification_id: nid,
          read_at: new Date().toISOString(),
        }));
        await supabase.from("notification_reads").upsert(rows, { onConflict: "id" }).catch(() => {});
      }
      return jsonResponse({ success: true, count: ids.length });
    }

    // ------------------------------------------------------------------------
    // /reports (POST to submit user complaint/report, GET with admin auth)
    // ------------------------------------------------------------------------
    if (path === "/reports") {
      if (req.method === "POST") {
        const body = await req.json().catch(() => ({}));
        const { storeId, storeName, storePhone, reason, details, reporterName, reporterPhone } = body;
        const reportId = `rep_${Date.now()}`;
        await supabase.from("reports").insert({
          id: reportId,
          store_id: storeId || null,
          store_name: storeName || "",
          store_phone: storePhone || "",
          reason: reason || "بلاغ عام",
          details: details || "",
          reporter_name: reporterName || "زائر",
          reporter_phone: reporterPhone || null,
          status: "pending",
          created_at: new Date().toISOString(),
        }).catch(() => {});
        return jsonResponse({ success: true, reportId });
      }

      if (req.method === "GET") {
        if (!checkAdminAuth(req)) {
          return jsonResponse({ success: false, error: "غير مصرح لك باستعراض البلاغات." }, 401);
        }
        const { data } = await supabase.from("reports").select("*").order("created_at", { ascending: false }).limit(100);
        return jsonResponse({ success: true, reports: data || [] });
      }
    }

    // ------------------------------------------------------------------------
    // /advertisements (GET)
    // ------------------------------------------------------------------------
    if (path === "/advertisements") {
      if (req.method === "GET") {
        const { data, error } = await supabase
          .from("advertisements")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        if (error) {
          return jsonResponse({ success: false, error: error.message }, 400);
        }
        return jsonResponse({ success: true, count: data?.length || 0, ads: data || [] });
      }
    }

    // ------------------------------------------------------------------------
    // /payment-details (GET)
    // Destination payment info for ZainCash & MasterCard
    // ------------------------------------------------------------------------
    if (path === "/payment-details" && req.method === "GET") {
      const { data: dbSettings } = await supabase
        .from("payment_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      const { data: adminRecord } = await supabase
        .from("admin_credentials")
        .select("phone")
        .limit(1)
        .maybeSingle();

      const managerPhone = dbSettings?.manager_phone || adminRecord?.phone || "";
      const managerWhatsapp = dbSettings?.manager_whatsapp || (managerPhone ? `964${managerPhone.replace(/^0/, "")}` : "");

      return jsonResponse({
        success: true,
        zaincash: {
          number: dbSettings?.zaincash_number || "07801459424",
          holder: dbSettings?.zaincash_holder || "محفظة زين كاش المعتمدة",
          title: "محفظة زين كاش (ZainCash)",
          instructions: "التحويل المباشر من تطبيق زين كاش إلى رقم المحفظة ثم إرفاق صورة الوصل للتأكيد.",
        },
        mastercard: {
          number: dbSettings?.mastercard_number || "4538548308",
          holder: dbSettings?.mastercard_holder || "حساب ماستر كارد المعتمد",
          title: "بطاقة وحساب ماستر كارد (MasterCard)",
          instructions: "التحويل البنكي أو عبر تطبيق المصرف إلى رقم الحساب ثم إرفاق صورة الوصل.",
        },
        managerPhone,
        managerWhatsapp,
      });
    }

    // ------------------------------------------------------------------------
    // /payment/submit-transfer (POST)
    // ------------------------------------------------------------------------
    if (path === "/payment/submit-transfer" && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const {
        paymentMethod,
        senderPhone,
        senderName,
        storeName,
        amount,
        transactionRef,
        receiptImageUrl,
        notes,
        adScope,
      } = body;

      if (!senderPhone && !transactionRef) {
        return jsonResponse({ success: false, error: "رقم هاتف المرسل أو رقم العملية مطلوب." }, 400);
      }

      const txRecord = {
        id: `tx_${Date.now()}_${generateSecureOtp().slice(0, 4)}`,
        payment_method: paymentMethod || "zaincash",
        sender_phone: normalizePhoneDigits(senderPhone),
        sender_name: senderName || "مستخدم دليل العراق",
        store_name: storeName || "متجر",
        amount: Number(amount) || 0,
        transaction_ref: transactionRef || "",
        receipt_image_url: receiptImageUrl || "",
        notes: notes || "",
        ad_scope: adScope || "general",
        status: "pending_review",
        created_at: new Date().toISOString(),
      };

      const { error: insErr } = await supabase.from("payment_transactions").insert(txRecord);
      if (insErr) {
        return jsonResponse({ success: false, error: insErr.message }, 500);
      }

      return jsonResponse({
        success: true,
        transactionId: txRecord.id,
        message: "تم استلام تفاصيل التحويل بنجاح! سيتم مراجعة الإشعار وتأكيد العملية فوراً.",
      });
    }

    // ------------------------------------------------------------------------
    // /wallet & /wallet/transaction
    // ------------------------------------------------------------------------
    if (path === "/wallet" && req.method === "GET") {
      if (!checkAdminAuth(req)) {
        return jsonResponse({ success: false, error: "غير مصرح لك بالوصول للمحفظة المالية." }, 401);
      }
      const { data } = await supabase.from("wallets").select("*").limit(1).maybeSingle();
      const { data: txList } = await supabase.from("transactions").select("*").order("created_at", { ascending: false }).limit(50);
      return jsonResponse({
        success: true,
        wallet: data || { id: "main_wallet", user_id: "admin", balance: 0, currency: "IQD" },
        transactions: txList || [],
      });
    }

    if (path === "/wallet/transaction" && req.method === "POST") {
      if (!checkAdminAuth(req)) {
        return jsonResponse({ success: false, error: "غير مصرح لك بإجراء معاملات مالية." }, 401);
      }
      const body = await req.json().catch(() => ({}));
      const { amount, type, title, paymentMethod, referenceNumber } = body;
      const numAmount = Math.abs(Number(amount));
      if (!numAmount || !type) {
        return jsonResponse({ success: false, error: "بيانات المعاملة غير مكتملة." }, 400);
      }

      const txId = `tx_${Date.now()}`;
      await supabase.from("transactions").insert({
        id: txId,
        wallet_id: "main_wallet",
        user_id: "admin",
        amount: numAmount,
        type,
        title: title || "تعديل رصيد",
        payment_method: paymentMethod || "zaincash",
        reference_number: referenceNumber,
        created_at: new Date().toISOString(),
      });

      const { data: currWallet } = await supabase.from("wallets").select("balance").eq("id", "main_wallet").maybeSingle();
      const delta = (type === "deposit" || type === "earning") ? numAmount : -numAmount;
      const newBal = Math.max(0, (currWallet?.balance || 0) + delta);

      await supabase.from("wallets").upsert({
        id: "main_wallet",
        user_id: "admin",
        balance: newBal,
        currency: "IQD",
        updated_at: new Date().toISOString(),
      });

      return jsonResponse({ success: true, balance: newBal, transactionId: txId });
    }

    if ((path === "/wallet/transaction/delete" && req.method === "POST") || (path.startsWith("/wallet/transaction/") && req.method === "DELETE")) {
      if (!checkAdminAuth(req)) {
        return jsonResponse({ success: false, error: "غير مصرح لك بحذف معاملات مالية." }, 401);
      }
      const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
      const txId = path.startsWith("/wallet/transaction/") ? path.replace("/wallet/transaction/", "") : body.transactionId || body.id;
      if (!txId) {
        return jsonResponse({ success: false, error: "معرف المعاملة مطلوب." }, 400);
      }
      await supabase.from("transactions").delete().eq("id", txId);
      return jsonResponse({ success: true, message: "تم حذف المعاملة بنجاح." });
    }

    if (path === "/wallet/reset" && req.method === "POST") {
      if (!checkAdminAuth(req)) {
        return jsonResponse({ success: false, error: "غير مصرح لك بتصفير المحفظة." }, 401);
      }
      await supabase.from("wallets").upsert({
        id: "main_wallet",
        user_id: "admin",
        balance: 0,
        currency: "IQD",
        updated_at: new Date().toISOString(),
      });
      return jsonResponse({ success: true, balance: 0, message: "تم تصفير رصيد المحفظة بنجاح." });
    }

    if (path === "/wallet/transactions/clear" && req.method === "POST") {
      if (!checkAdminAuth(req)) {
        return jsonResponse({ success: false, error: "غير مصرح لك بمسح سجل المعاملات." }, 401);
      }
      await supabase.from("transactions").delete().eq("wallet_id", "main_wallet");
      return jsonResponse({ success: true, message: "تم مسح سجل المعاملات بنجاح." });
    }

    // ------------------------------------------------------------------------
    // /news (GET)
    // ------------------------------------------------------------------------
    if (path === "/news" && req.method === "GET") {
      const gov = url.searchParams.get("governorateId");
      let query = supabase.from("news").select("*").order("created_at", { ascending: false }).limit(40);
      if (gov && gov !== "all") {
        query = query.eq("governorate_id", gov);
      }
      const { data, error } = await query;
      if (error) {
        return jsonResponse({ success: false, error: error.message }, 400);
      }
      return jsonResponse({ success: true, count: data?.length || 0, news: data || [] });
    }

    // ------------------------------------------------------------------------
    // /reviews (GET / POST)
    // ------------------------------------------------------------------------
    if (path === "/reviews") {
      if (req.method === "GET") {
        const storeId = url.searchParams.get("storeId");
        let query = supabase.from("reviews").select("*").order("created_at", { ascending: false });
        if (storeId) query = query.eq("store_id", storeId);
        const { data, error } = await query;
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

        const reviewId = `rev_${Date.now()}`;
        const { error: revErr } = await supabase.from("reviews").insert({
          id: reviewId,
          store_id: targetStoreId,
          rating: numRating,
          user_name: userName || user_name || "زائر دليل العراق",
          comment: comment || null,
          device_id: deviceId || device_id || null,
          created_at: new Date().toISOString(),
        });

        if (revErr) {
          return jsonResponse({ success: false, error: revErr.message }, 400);
        }

        // Recompute average on store
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
    // /stats & /sync
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
    // /import/status & /import/online & /import/process (Admin Protected)
    // ------------------------------------------------------------------------
    if (path === "/import/status" && req.method === "GET") {
      if (!checkAdminAuth(req)) {
        return jsonResponse({ success: false, error: "غير مصرح لك بالوصول." }, 401);
      }
      return jsonResponse({
        success: true,
        providers: {
          osm_overpass: {
            id: "osm_overpass",
            name: "OpenStreetMap Overpass API (مفتوح وقانوني ODbL)",
            description: "مصدر رسمي ومجاني مفتوح لا يتطلب مفتاح API، يغطي جميع مدن ومحافظات العراق.",
            isReady: true,
          },
        },
        supabase: { isConnected: true, url: "https://ccvntqtohuxqpxfqnhxt.supabase.co" },
      });
    }

    if (path === "/import/process" && req.method === "POST") {
      if (!checkAdminAuth(req)) {
        return jsonResponse({ success: false, error: "غير مصرح لك بالوصول." }, 401);
      }
      const body = await req.json().catch(() => ({}));
      const { items = [] } = body;
      let savedCount = 0;

      for (const item of items) {
        if (!item.name || !item.phone) continue;
        const storeId = item.id || `store_imp_${Date.now()}_${savedCount}`;
        const { error } = await supabase.from("stores").upsert({
          id: storeId,
          name: String(item.name).trim(),
          category: item.category || "restaurants",
          sub_category: item.subCategory || item.sub_category || "متجر معتمد",
          phone: String(item.phone).trim(),
          whatsapp: item.whatsapp || item.phone,
          address: item.address || "العراق",
          governorate_id: item.governorateId || "baghdad",
          district_id: item.districtId || "karkh",
          governorate_name: item.governorateName,
          district_name: item.districtName,
          rating: item.rating || 4.8,
          reviews_count: item.reviewsCount || 1,
          is_open: true,
          working_hours: item.workingHours || "٩:٠٠ ص - ١١:٠٠ م",
          image_url: item.imageUrl || item.image_url,
          source: item.source || "online_import",
        }, { onConflict: "id" });

        if (!error) savedCount++;
      }

      return jsonResponse({
        success: true,
        importedCount: savedCount,
        savedToSupabaseCount: savedCount,
        stores: items.slice(0, 50),
        message: `تم استيراد وحفظ ${savedCount} متجراً بنجاح في قاعدة البيانات.`,
      });
    }

    // ------------------------------------------------------------------------
    // /chat (AI Coloring / Story Assistant Endpoint)
    // Uses GEMINI_API_KEY from environment, never exposed to client
    // ------------------------------------------------------------------------
    if (path === "/chat" && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const { messages = [], systemInstruction, childName, theme } = body;
      const apiKey = Deno.env.get("GEMINI_API_KEY");

      if (apiKey && apiKey.length > 5) {
        try {
          const contents = messages.map((m: any) => ({
            role: m.role === "user" ? "user" : "model",
            parts: [{ text: String(m.text || "") }],
          }));

          const reqBody: any = { contents };
          if (systemInstruction) {
            reqBody.systemInstruction = {
              parts: [{ text: String(systemInstruction) }],
            };
          }

          const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(reqBody),
            }
          );

          if (geminiRes.ok) {
            const geminiData = await geminiRes.json();
            const textResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
            if (textResponse) {
              return jsonResponse({ success: true, text: textResponse });
            }
          }
        } catch (aiErr) {
          console.warn("[Gemini Chat API Error]", aiErr);
        }
      }

      // Contextual fallback response so the assistant responds smoothly without crashing
      const fallbackText = `مرحباً بك وبالمبدع الصغير ${childName || ""} في عالم التلوين والقصص! فكرة رائعة لموضوع "${theme || "المغامرات"}": يمكننا رسم مشهد واضح بخطوط عريضة يسهل تلوينها مع شخصيات لطيفة ومبهجة.`;
      return jsonResponse({ success: true, text: fallbackText });
    }

    // ------------------------------------------------------------------------
    // /regenerate-prompt
    // ------------------------------------------------------------------------
    if (path === "/regenerate-prompt" && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const { pageTitle, currentCaption, userInstructions, childName, theme } = body;
      const apiKey = Deno.env.get("GEMINI_API_KEY");

      if (apiKey && apiKey.length > 5) {
        try {
          const promptQuery = `You are a children coloring book creator. Given page: "${pageTitle}", current caption: "${currentCaption}", user instructions: "${userInstructions}", child: "${childName}", theme: "${theme}". Return valid JSON with keys: title, caption, prompt. The prompt must be high-contrast, black and white thick line art for kids coloring page.`;
          const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: promptQuery }] }],
                generationConfig: { responseMimeType: "application/json" },
              }),
            }
          );

          if (geminiRes.ok) {
            const gData = await geminiRes.json();
            const rawText = gData.candidates?.[0]?.content?.parts?.[0]?.text;
            if (rawText) {
              const parsed = JSON.parse(rawText);
              return jsonResponse({
                success: true,
                data: {
                  title: parsed.title || pageTitle || "صفحة تلوين ممتعة",
                  caption: parsed.caption || currentCaption || "مغامرة تلوين شيقة للأطفال",
                  prompt: parsed.prompt || `Thick black and white line art coloring page of ${theme || "adventure"}, simple shapes, high contrast, clean outlines`,
                },
              });
            }
          }
        } catch (err) {
          console.warn("[Gemini Regenerate Prompt Error]", err);
        }
      }

      // Safe fallback prompt
      return jsonResponse({
        success: true,
        data: {
          title: pageTitle || "صفحة تلوين مرحة",
          caption: userInstructions ? `مشهد جديد: ${userInstructions}` : currentCaption || "مغامرة تلوين رائعة للأطفال",
          prompt: `High-contrast black and white clean line art coloring book page for children, ${userInstructions || theme || "happy adventure"}, bold outlines, no grayscale shading`,
        },
      });
    }

    // ------------------------------------------------------------------------
    // /generate-image
    // ------------------------------------------------------------------------
    if (path === "/generate-image" && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const { prompt, theme } = body;
      const apiKey = Deno.env.get("GEMINI_API_KEY");

      if (apiKey && apiKey.length > 5) {
        try {
          const imageRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                instances: [{ prompt: `Thick black and white line art coloring page for kids, coloring book page, bold clear outlines, pure white background, no grayscale, no shading: ${prompt || theme || "friendly animal"}` }],
                parameters: { sampleCount: 1, aspectRatio: "1:1" },
              }),
            }
          );

          if (imageRes.ok) {
            const imgData = await imageRes.json();
            const b64 = imgData.predictions?.[0]?.bytesBase64Encoded;
            if (b64) {
              return jsonResponse({ success: true, imageUrl: `data:image/png;base64,${b64}` });
            }
          }
        } catch (imgErr) {
          console.warn("[Imagen API Error]", imgErr);
        }
      }

      // High-quality black & white SVG line art coloring page fallback
      const cleanThemeText = (theme || prompt || "تلوين مرح").slice(0, 30);
      const svgFallback = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="100%" height="100%">
        <rect width="500" height="500" fill="#ffffff" stroke="#1e293b" stroke-width="8"/>
        <circle cx="250" cy="200" r="90" fill="none" stroke="#0f172a" stroke-width="6"/>
        <circle cx="215" cy="185" r="12" fill="#0f172a"/>
        <circle cx="285" cy="185" r="12" fill="#0f172a"/>
        <path d="M 210 230 Q 250 270 290 230" fill="none" stroke="#0f172a" stroke-width="6" stroke-linecap="round"/>
        <path d="M 170 330 C 170 270, 330 270, 330 330 L 330 420 L 170 420 Z" fill="none" stroke="#0f172a" stroke-width="6"/>
        <circle cx="100" cy="100" r="30" fill="none" stroke="#0f172a" stroke-width="5"/>
        <circle cx="400" cy="100" r="30" fill="none" stroke="#0f172a" stroke-width="5"/>
        <text x="250" y="465" font-size="20" font-family="sans-serif" font-weight="bold" fill="#0f172a" text-anchor="middle">${cleanThemeText}</text>
      </svg>`;
      const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svgFallback)}`;
      return jsonResponse({ success: true, imageUrl: dataUrl });
    }

    // ------------------------------------------------------------------------
    // Fallback 404
    // ------------------------------------------------------------------------
    return jsonResponse({ success: false, error: `المسار ${path} غير موجود في خادم دليل العراق.` }, 404);
  } catch (err: any) {
    return jsonResponse({ success: false, error: err?.message || "Internal Server Error" }, 500);
  }
});
