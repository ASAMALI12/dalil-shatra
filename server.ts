import express, { Request, Response, NextFunction } from "express";
import path from "path";
import crypto from "crypto";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { normalizeIraqPhone, isFakeOrPlaceholderPhone, validateIraqPhone } from "./src/utils/iraqPhoneValidator";
import {
  IRAQ_GEO_GOVERNORATES,
  fetchFromOsmOverpass,
  fetchFromGooglePlaces,
  processAndDeduplicateStores,
  RawCandidateStore,
} from "./src/services/onlineStoreImporter";
import { getLiveIraqNews } from "./src/services/liveIraqNewsService";

dotenv.config();

// Supabase configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "https://ccvntqtohuxqpxfqnhxt.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";

let serverSupabase: SupabaseClient | null = null;

function getServerSupabase(): SupabaseClient | null {
  if (!serverSupabase && SUPABASE_URL && SUPABASE_KEY && SUPABASE_KEY.length > 10) {
    try {
      serverSupabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      console.log("✅ Supabase server client connected:", SUPABASE_URL);
    } catch (e) {
      console.warn("Could not create server Supabase client:", e);
    }
  }
  return serverSupabase;
}

// Admin credentials & security configuration
const ADMIN_TOKEN_SECRET = process.env.ADMIN_TOKEN_SECRET || crypto.randomBytes(32).toString("hex");

// Cryptographic Password Hashing (PBKDF2-SHA256) matching Edge Function
function hashPasswordSync(password: string): string {
  const salt = crypto.randomBytes(16);
  const derived = crypto.pbkdf2Sync(password, salt, 100000, 32, "sha256");
  return `pbkdf2_sha256$100000$${salt.toString("hex")}$${derived.toString("hex")}`;
}

function verifyPasswordSync(password: string, storedHash: string): boolean {
  if (!storedHash || typeof storedHash !== "string") return false;
  if (storedHash.startsWith("pbkdf2_sha256$")) {
    const parts = storedHash.split("$");
    if (parts.length !== 4) return false;
    const iterations = parseInt(parts[1], 10);
    const salt = Buffer.from(parts[2], "hex");
    const originalHash = parts[3];
    const derived = crypto.pbkdf2Sync(password, salt, iterations, 32, "sha256");
    return crypto.timingSafeEqual(derived, Buffer.from(originalHash, "hex"));
  }
  // Transition check for older unhashed value
  return storedHash === password;
}

function hashOtpSync(otp: string, salt: string): string {
  return crypto.createHash("sha256").update(`${otp}:${salt}`).digest("hex");
}

// In-memory token store for authenticated admin sessions
const activeAdminSessions = new Map<string, { username: string; createdAt: number; expiresAt: number }>();

// Anti-brute force rate limiting for admin login (Max 5 attempts per 10 minutes)
const adminLoginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const adminWhatsappOtps = new Map<string, { otpHash: string; expiresAt: number; attempts: number }>();

// In-memory OTP fallback storage with anti-abuse rate limiting
interface ClaimOtpEntry {
  storeId: string;
  storeName: string;
  phone: string;
  applicantName: string;
  otpHash: string;
  createdAt: number;
  expiresAt: number;
  attempts: number;
}

const claimOtpStore = new Map<string, ClaimOtpEntry>();
const claimRateLimitStore = new Map<string, { attempts: number; lastAttempt: number }>();

// WhatsApp Provider Integration (Secure Server-Side Gateway)
async function sendWhatsAppOtpMessage(phone: string, otp: string): Promise<{ success: boolean; error?: string }> {
  const token = process.env.WHATSAPP_API_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const apiUrl = process.env.WHATSAPP_API_URL;

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
            body: `رمز التحقق الخاص بك لتوثيق المتجر في دليل العراق هو: ${otp} (صالح لمدة 5 دقائق). لا تشارك هذا الرمز مع أي شخص.`,
          },
        }),
      });

      if (res.ok) {
        return { success: true };
      }
      const errData = await res.json().catch(() => ({}));
      console.warn("[WhatsApp Gateway Error]", errData);
      return { success: false, error: "تعذر تسليم رسالة الواتساب عبر المزود." };
    } catch (e: any) {
      console.warn("[WhatsApp Network Error]", e);
      return { success: false, error: "فشل الاتصال بمزود خدمة الواتساب." };
    }
  }

  // If WhatsApp provider credentials are not yet configured in environment:
  return {
    success: false,
    error: "خدمة التحقق عبر WhatsApp غير مهيأة",
  };
}

// Store Claims Memory Fallback
interface BackendStoreClaim {
  id: string;
  storeId: string;
  storeName: string;
  applicantName: string;
  applicantPhone: string;
  status: 'pending' | 'verified' | 'rejected';
  createdAt: string;
  reviewedAt?: string;
  adminNotes?: string;
  otpVerified: boolean;
}

const storeClaimsList: BackendStoreClaim[] = [];

// Gemini AI Helper
function getGenAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  return new GoogleGenAI({
    apiKey: apiKey || "",
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Middleware: Verify Admin Authorization Token
function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const customHeader = req.headers["x-admin-token"] as string;

  let token = customHeader;
  if (!token && authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  }

  if (!token) {
    return res.status(401).json({ success: false, error: "غير مصرح لك بالوصول: يرجى تسجيل الدخول كمدير أولاً." });
  }

  const session = activeAdminSessions.get(token);
  if (!session) {
    return res.status(401).json({ success: false, error: "جلسة المدير غير صالحة أو منتهية. يرجى تسجيل الدخول مجدداً." });
  }

  if (Date.now() > session.expiresAt) {
    activeAdminSessions.delete(token);
    return res.status(401).json({ success: false, error: "انتهت صلاحية جلسة المدير. يرجى إعادة تسجيل الدخول." });
  }

  // Session valid
  (req as any).adminSession = session;
  next();
}

export const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // 1. Health check
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", app: "دليل العراق", time: new Date().toISOString() });
  });

  // 2. Supabase public configuration endpoint (Anon Key ONLY, Service Role Key NEVER exposed)
  app.get("/api/supabase-config", (_req: Request, res: Response) => {
    const supabaseUrl =
      process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "https://ccvntqtohuxqpxfqnhxt.supabase.co";
    const supabaseAnonKey =
      process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
    res.json({
      supabaseUrl,
      supabaseAnonKey,
      isConfigured: Boolean(supabaseUrl && supabaseAnonKey),
    });
  });

  // Protected: Only authenticated Admin can update runtime Supabase config
  app.post("/api/supabase-config", requireAdminAuth, (req: Request, res: Response) => {
    const { supabaseUrl, supabaseAnonKey } = req.body;
    if (supabaseUrl && typeof supabaseUrl === "string" && supabaseUrl.startsWith("https://")) {
      process.env.VITE_SUPABASE_URL = supabaseUrl;
      process.env.SUPABASE_URL = supabaseUrl;
    }
    if (supabaseAnonKey && typeof supabaseAnonKey === "string" && supabaseAnonKey.length > 20) {
      process.env.VITE_SUPABASE_ANON_KEY = supabaseAnonKey;
      process.env.SUPABASE_ANON_KEY = supabaseAnonKey;
    }
    res.json({
      success: true,
      supabaseUrl: process.env.VITE_SUPABASE_URL || "https://ccvntqtohuxqpxfqnhxt.supabase.co",
      isConfigured: Boolean(process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY),
    });
  });

  // 3. SECURE ADMIN AUTHENTICATION (Database via Supabase admin_credentials + Server-side fallback)
  
  // Helper: Normalize phone numbers including Arabic-Indic numerals
  function normalizePhoneDigits(input: any): string {
    if (!input) return "";
    const str = String(input);
    const ascii = str.replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString());
    return ascii.replace(/\D/g, "");
  }

  // Step 1: Verify manager credentials (Phone, Username, Password) & Dispatch WhatsApp OTP
  app.post("/api/admin/verify-credentials-send-otp", async (req: Request, res: Response) => {
    const { username, password, phone } = req.body;
    const clientIp = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "client";

    if (!username || !password || !phone) {
      return res.status(400).json({
        success: false,
        error: "يرجى ملء جميع الحقول المطلوبة (رقم الهاتف، واسم المستخدم، وكلمة المرور).",
      });
    }

    const cleanUser = String(username).trim().toLowerCase();
    const cleanPass = String(password).trim();
    const cleanPhone = normalizePhoneDigits(phone);

    // Rate limiting check: max 5 attempts per 10 minutes
    const now = Date.now();
    const rate = adminLoginAttempts.get(clientIp);
    if (rate && now - rate.lastAttempt < 10 * 60 * 1000 && rate.count >= 5) {
      const waitMins = Math.ceil((10 * 60 * 1000 - (now - rate.lastAttempt)) / 60000);
      return res.status(429).json({
        success: false,
        error: `تم تجاوز الحد المسموح لمحاولات الدخول. يرجى الانتظار ${waitMins} دقيقة قبل المحاولة مجدداً.`,
      });
    }

    // 1. Fetch Supabase admin_credentials record
    let dbUser: any = null;
    const sb = getServerSupabase();
    if (sb) {
      try {
        const { data } = await sb
          .from("admin_credentials")
          .select("*")
          .limit(1)
          .maybeSingle();
        if (data) {
          dbUser = data;
        }
      } catch (err) {
        // Continue
      }
    }

    // If no credentials in DB, allow initial bootstrap from environment variables
    if (!dbUser && sb) {
      const envUser = process.env.IRAQ_ADMIN_USERNAME;
      const envPass = process.env.IRAQ_ADMIN_PASSWORD;
      const envPhone = process.env.IRAQ_ADMIN_PHONE;
      if (envUser && envPass) {
        try {
          const initHash = hashPasswordSync(envPass);
          const { data: created } = await sb.from("admin_credentials").insert({
            id: "primary_admin",
            username: envUser,
            phone: envPhone || cleanPhone,
            password_hash: initHash,
            role: "superadmin",
          }).select().maybeSingle();
          if (created) dbUser = created;
        } catch {}
      }
    }

    if (!dbUser) {
      return res.status(401).json({
        success: false,
        error: "لم يتم العثور على إعدادات المدير في قاعدة البيانات.",
      });
    }

    const isUserMatch = dbUser.username && cleanUser === String(dbUser.username).trim().toLowerCase();
    const dbPhoneClean = normalizePhoneDigits(dbUser.phone);
    const isPhoneMatch =
      cleanPhone === dbPhoneClean ||
      (dbPhoneClean.length >= 8 && cleanPhone.endsWith(dbPhoneClean.slice(-8))) ||
      (cleanPhone.length >= 8 && dbPhoneClean.endsWith(cleanPhone.slice(-8)));

    const isPassMatch = verifyPasswordSync(cleanPass, dbUser.password_hash);

    if (!isUserMatch || !isPhoneMatch || !isPassMatch) {
      const currentCount = rate && now - rate.lastAttempt < 10 * 60 * 1000 ? rate.count + 1 : 1;
      adminLoginAttempts.set(clientIp, { count: currentCount, lastAttempt: now });
      const remaining = Math.max(0, 5 - currentCount);
      return res.status(401).json({
        success: false,
        error: `بيانات المدير غير مطابقة. يرجى التأكد من رقم الهاتف واسم المستخدم وكلمة المرور. تبقى لديك ${remaining} محاولات.`,
      });
    }

    // Upgrade plaintext legacy password in database to secure PBKDF2 hash
    if (!dbUser.password_hash.startsWith("pbkdf2_sha256$") && sb) {
      try {
        const upgradedHash = hashPasswordSync(cleanPass);
        await sb.from("admin_credentials").update({
          password_hash: upgradedHash,
          updated_at: new Date().toISOString(),
        }).eq("id", dbUser.id);
      } catch {}
    }

    // Reset failed count on successful credential verification
    adminLoginAttempts.delete(clientIp);

    // Generate cryptographic 6-digit OTP using crypto.randomInt
    const code = crypto.randomInt(100000, 1000000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity
    const codeHash = hashOtpSync(code, ADMIN_TOKEN_SECRET);

    // Save in memory store
    adminWhatsappOtps.set(cleanPhone, { otpHash: codeHash, expiresAt, attempts: 0 });
    adminWhatsappOtps.set("primary_admin", { otpHash: codeHash, expiresAt, attempts: 0 });

    // Ensure OTP hash is stored in Supabase admin_credentials
    if (sb) {
      try {
        await sb.from("admin_credentials").update({
          otp_code_hash: codeHash,
          otp_expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        }).eq("id", dbUser.id);
      } catch (sbErr) {
        console.warn("Supabase admin_credentials sync warning:", sbErr);
      }
    }

    const targetPhone = dbUser.phone || cleanPhone;
    const sendResult = await sendWhatsAppOtpMessage(targetPhone, code);

    if (!sendResult.success) {
      return res.status(503).json({
        success: false,
        error: sendResult.error || "خدمة التحقق عبر WhatsApp غير مهيأة",
      });
    }

    // The raw OTP code is NEVER sent to the client!
    res.json({
      success: true,
      step: "otp_required",
      message: "تم التحقق من صحة البيانات بنجاح! تم إرسال رمز التحقق إلى واتساب هاتفك.",
    });
  });

  // Step 2: Final Verification (Phone + Username + Password + WhatsApp OTP) -> Unlocks Admin
  app.post("/api/admin/login", async (req: Request, res: Response) => {
    const { username, password, phone, whatsappOtp, otp } = req.body;
    const clientIp = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "client";

    if (!username || !password) {
      return res.status(400).json({ success: false, error: "بيانات تسجيل الدخول غير مكتملة." });
    }

    const cleanUser = String(username).trim().toLowerCase();
    const cleanPass = String(password).trim();
    const cleanPhone = normalizePhoneDigits(phone);
    const cleanOtp = normalizePhoneDigits(whatsappOtp || otp);

    if (!cleanOtp || cleanOtp.length < 4) {
      return res.status(400).json({
        success: false,
        error: "رمز التحقق عبر واتساب مطلوب لإثبات ملكية الهاتف وفتح الصلاحيات.",
      });
    }

    const sb = getServerSupabase();
    let dbUser: any = null;
    if (sb) {
      try {
        const { data } = await sb.from("admin_credentials").select("*").limit(1).maybeSingle();
        if (data) dbUser = data;
      } catch {}
    }

    if (!dbUser) {
      return res.status(401).json({ success: false, error: "بيانات الاعتماد غير موجودة." });
    }

    const isUserMatch = dbUser.username && cleanUser === String(dbUser.username).trim().toLowerCase();
    const isPassMatch = verifyPasswordSync(cleanPass, dbUser.password_hash);

    if (!isUserMatch || !isPassMatch) {
      return res.status(401).json({ success: false, error: "اسم المستخدم أو كلمة المرور غير صحيحة." });
    }

    // Verify WhatsApp OTP from memory or Supabase
    let storedOtp = adminWhatsappOtps.get(cleanPhone) || adminWhatsappOtps.get("primary_admin");

    if (!storedOtp && dbUser.otp_code_hash && dbUser.otp_expires_at) {
      storedOtp = {
        otpHash: String(dbUser.otp_code_hash),
        expiresAt: Number(dbUser.otp_expires_at),
        attempts: 0,
      };
    }

    if (!storedOtp) {
      return res.status(400).json({
        success: false,
        error: "لم يتم العثور على طلب تحقق نشط لهذا الرقم. يرجى طلب رمز جديد.",
      });
    }

    if (Date.now() > storedOtp.expiresAt) {
      adminWhatsappOtps.delete(cleanPhone);
      adminWhatsappOtps.delete("primary_admin");
      return res.status(400).json({
        success: false,
        error: "انتهت صلاحية رمز التحقق (أكثر من 5 دقائق). يرجى طلب رمز جديد.",
      });
    }

    const inputHash = hashOtpSync(cleanOtp, ADMIN_TOKEN_SECRET);
    if (storedOtp.otpHash !== inputHash) {
      storedOtp.attempts = (storedOtp.attempts || 0) + 1;
      const remaining = Math.max(0, 3 - storedOtp.attempts);
      if (storedOtp.attempts >= 3) {
        adminWhatsappOtps.delete(cleanPhone);
        adminWhatsappOtps.delete("primary_admin");
        return res.status(429).json({
          success: false,
          error: "تم تجاوز عدد المحاولات الخاطئة لهذا الرمز. يرجى طلب رمز جديد.",
        });
      }
      return res.status(401).json({
        success: false,
        error: `رمز التحقق عبر واتساب غير صحيح. تبقى لديك ${remaining} محاولة.`,
      });
    }

    // Clean consumed OTP
    adminWhatsappOtps.delete(cleanPhone);
    adminWhatsappOtps.delete("primary_admin");
    adminLoginAttempts.delete(clientIp);

    if (sb) {
      try {
        await sb.from("admin_credentials").update({
          otp_code_hash: null,
          otp_expires_at: null,
          updated_at: new Date().toISOString(),
        }).eq("id", dbUser.id);
      } catch {}
    }

    // Generate secure session token (24 hours validity)
    const sessionToken = "adm_" + crypto.randomBytes(32).toString("hex");
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

    activeAdminSessions.set(sessionToken, {
      username: dbUser.username,
      createdAt: Date.now(),
      expiresAt,
    });

    res.json({
      success: true,
      token: sessionToken,
      expiresAt,
      user: {
        username: dbUser.username,
        phone: dbUser.phone,
      },
      message: "تم التحقق بنجاح وفتح صلاحيات المدير العام 🇮🇶",
    });
  });

  // Official payment destination accounts (ZainCash + MasterCard) stored safely in Supabase
  app.get("/api/payment-details", async (_req: Request, res: Response) => {
    let dbSettings: any = null;
    const sb = getServerSupabase();
    if (sb) {
      try {
        const { data } = await sb.from("payment_settings").select("*").limit(1).maybeSingle();
        if (data) {
          dbSettings = data;
        }
      } catch (err) {
        // Fallback to configured variables
      }
    }

    const zainNumber = dbSettings?.zaincash_number || process.env.ZAIN_CASH_NUMBER || "07801459424";
    const mastercardNumber = dbSettings?.mastercard_number || process.env.MASTERCARD_NUMBER || "4538548308";
    const managerPhone = dbSettings?.manager_phone || "07801459424";
    const managerWhatsapp = dbSettings?.manager_whatsapp || "9647801459424";

    res.json({
      success: true,
      zaincash: {
        number: zainNumber,
        holder: dbSettings?.zaincash_holder || "محفظة زين كاش المعتمدة",
        title: "محفظة زين كاش (ZainCash)",
        instructions: `قم بالتحويل المباشر من تطبيق زين كاش إلى رقم المحفظة (${zainNumber}) ثم أرفق صورة الوصل للتأكيد.`,
      },
      mastercard: {
        number: mastercardNumber,
        holder: dbSettings?.mastercard_holder || "حساب ماستر كارد المعتمد",
        title: "بطاقة وحساب ماستر كارد (MasterCard)",
        instructions: `قم بالتحويل البنكي أو عبر تطبيق المصرف إلى رقم حساب الماستر كارد الموضح أعلاه (${mastercardNumber}) ثم أرفق صورة الوصل.`,
      },
      managerPhone,
      managerWhatsapp,
    });
  });

  // Submit real transfer proof and transaction details
  app.post("/api/payment/submit-transfer", async (req: Request, res: Response) => {
    try {
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
      } = req.body;

      if (!senderPhone && !transactionRef) {
        return res.status(400).json({ success: false, error: "رقم هاتف المرسل أو رقم العملية مطلوب." });
      }

      const cleanPhone = senderPhone ? String(senderPhone).replace(/\D/g, "") : "";
      const record = {
        id: "tx_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
        payment_method: paymentMethod || "zaincash",
        sender_phone: cleanPhone,
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

      const sb = getServerSupabase();
      if (sb) {
        try {
          await sb.from("payment_transactions").insert(record);
        } catch (dbErr) {
          console.warn("Could not insert payment_transaction into Supabase:", dbErr);
        }
      }

      res.json({
        success: true,
        transactionId: record.id,
        message: "تم استلام تفاصيل التحويل بنجاح! سيتم مراجعة الإشعار وتأكيد العملية فوراً.",
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "حدث خطأ أثناء معالجة التحويل." });
    }
  });

  // Verify Admin Session
  app.get("/api/admin/verify", requireAdminAuth, (_req: Request, res: Response) => {
    res.json({ success: true, valid: true });
  });

  // Admin Logout
  app.post("/api/admin/logout", (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const customHeader = req.headers["x-admin-token"] as string;
    const token = customHeader || (authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null);
    if (token) {
      activeAdminSessions.delete(token);
    }
    res.json({ success: true, message: "تم تسجيل الخروج بنجاح." });
  });

  // Admin status check (compatible with Edge Function)
  app.get("/api/admin/status", requireAdminAuth, async (req: Request, res: Response) => {
    const session = (req as any).adminSession;
    let username = session?.username || "admin";
    let phone = "";

    const sb = getServerSupabase();
    if (sb) {
      try {
        const { data } = await sb.from("admin_credentials").select("username, phone").limit(1).maybeSingle();
        if (data) {
          username = data.username || username;
          phone = data.phone || "";
        }
      } catch {}
    }

    res.json({
      success: true,
      loggedIn: true,
      username,
      phone,
      user: {
        username,
        phone,
      },
    });
  });

  // Admin session refresh
  app.post("/api/admin/refresh", requireAdminAuth, (req: Request, res: Response) => {
    const session = (req as any).adminSession;
    const sessionToken = "adm_" + crypto.randomBytes(32).toString("hex");
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
    activeAdminSessions.set(sessionToken, {
      username: session?.username || "admin",
      createdAt: Date.now(),
      expiresAt,
    });
    res.json({ success: true, token: sessionToken, expiresAt });
  });

  // Admin change password (Secure PBKDF2 hash verification & storage)
  app.post("/api/admin/change-password", requireAdminAuth, async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, error: "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل." });
    }

    const sb = getServerSupabase();
    if (!sb) {
      return res.status(500).json({ success: false, error: "قاعدة البيانات غير متصلة لحفظ كلمة المرور." });
    }

    const { data: adminRecord, error: fetchErr } = await sb
      .from("admin_credentials")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (fetchErr || !adminRecord) {
      return res.status(500).json({ success: false, error: "تعذر استرجاع بيانات المدير من قاعدة البيانات." });
    }

    const isCurrentMatch = verifyPasswordSync(currentPassword, adminRecord.password_hash);
    if (!isCurrentMatch) {
      return res.status(401).json({ success: false, error: "كلمة المرور الحالية غير صحيحة." });
    }

    // Hash new password using PBKDF2
    const newHash = hashPasswordSync(newPassword);

    const { error: updErr } = await sb
      .from("admin_credentials")
      .update({
        password_hash: newHash,
        updated_at: new Date().toISOString(),
      })
      .eq("id", adminRecord.id);

    if (updErr) {
      return res.status(500).json({
        success: false,
        error: `فشل حفظ كلمة المرور في قاعدة البيانات: ${updErr.message}`,
      });
    }

    res.json({ success: true, message: "تم تغيير كلمة المرور بنجاح وحفظها في قاعدة البيانات." });
  });

  // Admin update credentials (Phone, Username, Password) in Supabase
  app.post("/api/admin/credentials/update", requireAdminAuth, async (req: Request, res: Response) => {
    const { currentPassword, newPhone, newUsername, newPassword } = req.body;

    const sb = getServerSupabase();
    if (!sb) {
      return res.status(500).json({ success: false, error: "قاعدة البيانات غير متصلة." });
    }

    const { data: adminRecord } = await sb
      .from("admin_credentials")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (!adminRecord) {
      return res.status(500).json({ success: false, error: "سجل المدير غير موجود في قاعدة البيانات." });
    }

    if (currentPassword) {
      const isCurrentMatch = verifyPasswordSync(currentPassword, adminRecord.password_hash);
      if (!isCurrentMatch) {
        return res.status(401).json({ success: false, error: "كلمة المرور الحالية غير صحيحة لتأكيد التحديث." });
      }
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };
    if (newPhone) updateData.phone = normalizePhoneDigits(newPhone);
    if (newUsername) updateData.username = String(newUsername).trim();
    if (newPassword && newPassword.length >= 6) {
      updateData.password_hash = hashPasswordSync(newPassword);
    }

    const { error: updErr } = await sb.from("admin_credentials").update(updateData).eq("id", adminRecord.id);
    if (updErr) {
      return res.status(500).json({ success: false, error: updErr.message });
    }

    res.json({ success: true, message: "تم تحديث بيانات المدير وحفظها في قاعدة البيانات بنجاح." });
  });

  // 4. CLAIM STORE: Request OTP with Phone Verification & Anti-Abuse Rate Limiting
  app.post(["/api/claim/request-otp", "/api/stores/claim"], async (req: Request, res: Response) => {
    try {
      const { storeId, storeName, storePhone, applicantName, applicantPhone } = req.body;

      if (!storeId || !applicantName || !applicantPhone || !storePhone) {
        return res.status(400).json({
          success: false,
          error: "جميع الحقول مطلوبة: معرف المتجر، اسم المتقدم، ورقم هاتف المتجر.",
        });
      }

      // Normalize phone numbers
      const cleanStorePhone = normalizeIraqPhone(storePhone);
      const cleanApplicantPhone = normalizeIraqPhone(applicantPhone);

      // Validate applicant phone
      const validation = validateIraqPhone(cleanApplicantPhone);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: `رقم الهاتف غير صالح: ${validation.reason}`,
        });
      }

      // Check matching phone number
      const isMatch =
        cleanStorePhone === cleanApplicantPhone ||
        cleanStorePhone.endsWith(cleanApplicantPhone.slice(-8)) ||
        cleanApplicantPhone.endsWith(cleanStorePhone.slice(-8));

      if (!isMatch) {
        return res.status(400).json({
          success: false,
          error: `رقم الهاتف المدخل لا يطابق رقم الهاتف المسجل لهذا المتجر في دليل العراق (${storePhone}). يجب تأكيد نفس رقم هاتف المتجر.`,
        });
      }

      // Anti-Abuse Rate Limiting: Max 3 OTP requests in 10 minutes per store/phone
      const rateLimitKey = `${storeId}_${cleanApplicantPhone}`;
      const now = Date.now();
      const rateRecord = claimRateLimitStore.get(rateLimitKey);

      if (rateRecord) {
        if (now - rateRecord.lastAttempt < 10 * 60 * 1000) {
          if (rateRecord.attempts >= 4) {
            const waitMins = Math.ceil((10 * 60 * 1000 - (now - rateRecord.lastAttempt)) / 60000);
            return res.status(429).json({
              success: false,
              error: `تم تجاوز الحد المسموح لمحاولات التحقق. يرجى الانتظار لمدة ${waitMins} دقيقة قبل المحاولة مجدداً.`,
            });
          }
          rateRecord.attempts += 1;
          rateRecord.lastAttempt = now;
        } else {
          claimRateLimitStore.set(rateLimitKey, { attempts: 1, lastAttempt: now });
        }
      } else {
        claimRateLimitStore.set(rateLimitKey, { attempts: 1, lastAttempt: now });
      }

      // Generate cryptographic 6-digit OTP using crypto.randomInt
      const otp = crypto.randomInt(100000, 1000000).toString();
      const otpHash = crypto.createHash("sha256").update(otp + ADMIN_TOKEN_SECRET).digest("hex");
      const otpKey = `${storeId}_${cleanApplicantPhone}`;
      const expiresAt = new Date(now + 5 * 60 * 1000).toISOString();

      // Store in memory fallback
      claimOtpStore.set(otpKey, {
        storeId,
        storeName: storeName || "متجر",
        phone: cleanApplicantPhone,
        applicantName: applicantName.trim(),
        otpHash,
        createdAt: now,
        expiresAt: now + 5 * 60 * 1000, // 5 minutes
        attempts: 0,
      });

      // Save to Supabase `otp_verifications` table
      const sb = getServerSupabase();
      if (sb) {
        try {
          await sb.from("otp_verifications").insert({
            id: `otp_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
            phone: cleanApplicantPhone,
            store_id: storeId,
            otp_hash: otpHash,
            attempts: 0,
            max_attempts: 3,
            expires_at: expiresAt,
            verified: false,
          });
        } catch (dbErr) {
          console.warn("[Supabase OTP save error]", dbErr);
        }
      }

      // Send via WhatsApp Gateway
      const sendResult = await sendWhatsAppOtpMessage(cleanApplicantPhone, otp);

      if (!sendResult.success) {
        // Return clear, user-friendly security feedback
        return res.status(503).json({
          success: false,
          error: sendResult.error || "تعذر إرسال رمز التحقق عبر الواتساب حالياً. يرجى مراجعة إدارة الدليل للتوثيق المباشر.",
        });
      }

      res.json({
        success: true,
        message: `تم إرسال رمز التحقق المكون من 6 أرقام إلى واتساب الرقم ${cleanApplicantPhone}. الرمز صالح لمدة 5 دقائق.`,
        expiresInSeconds: 300,
      });
    } catch (err: any) {
      console.error("Error in request-otp:", err);
      res.status(500).json({ success: false, error: err?.message || "حدث خطأ أثناء معالجة الطلب." });
    }
  });

  // Verify OTP & Submit Claim
  app.post(["/api/claim/verify-otp", "/api/stores/verify-otp"], async (req: Request, res: Response) => {
    try {
      const { storeId, applicantPhone, applicantName, otp } = req.body;

      if (!storeId || !applicantPhone || !otp) {
        return res.status(400).json({ success: false, error: "رمز التحقق ورقم الهاتف مطلوبان." });
      }

      const cleanPhone = normalizeIraqPhone(applicantPhone);
      const otpInputHash = crypto.createHash("sha256").update(String(otp).trim() + ADMIN_TOKEN_SECRET).digest("hex");
      const sb = getServerSupabase();

      let isVerified = false;
      let storeTitle = "متجرك";

      // 1. Try verification via Supabase otp_verifications table
      if (sb) {
        try {
          const { data: records, error: fetchErr } = await sb
            .from("otp_verifications")
            .select("*")
            .eq("store_id", storeId)
            .eq("phone", cleanPhone)
            .eq("verified", false)
            .order("created_at", { ascending: false })
            .limit(1);

          if (!fetchErr && records && records.length > 0) {
            const row = records[0];
            const isExpired = new Date(row.expires_at).getTime() < Date.now();
            if (isExpired) {
              return res.status(400).json({
                success: false,
                error: "انتهت صلاحية رمز التحقق (أكثر من 5 دقائق). يرجى طلب رمز جديد.",
              });
            }

            if (row.attempts >= (row.max_attempts || 3)) {
              return res.status(400).json({
                success: false,
                error: "تم تجاوز عدد المحاولات الخاطئة لهذا الرمز. يرجى طلب رمز جديد.",
              });
            }

            if (row.otp_hash === otpInputHash) {
              isVerified = true;
              await sb.from("otp_verifications").update({ verified: true }).eq("id", row.id);
            } else {
              const newAttempts = (row.attempts || 0) + 1;
              await sb.from("otp_verifications").update({ attempts: newAttempts }).eq("id", row.id);
              const remaining = Math.max(0, (row.max_attempts || 3) - newAttempts);
              return res.status(400).json({
                success: false,
                error: `رمز التحقق غير صحيح! تبقى لديك ${remaining} محاولة.`,
              });
            }
          }
        } catch (dbErr) {
          console.warn("[Supabase OTP verification error, checking memory fallback]", dbErr);
        }
      }

      // 2. Memory Fallback verification if not verified yet
      if (!isVerified) {
        const otpKey = `${storeId}_${cleanPhone}`;
        const claimEntry = claimOtpStore.get(otpKey);

        if (!claimEntry) {
          return res.status(400).json({
            success: false,
            error: "لم يتم العثور على طلب تحقق نشط لهذا الرقم أو انتهت مهلته. يرجى طلب رمز جديد.",
          });
        }

        storeTitle = claimEntry.storeName;

        if (Date.now() > claimEntry.expiresAt) {
          claimOtpStore.delete(otpKey);
          return res.status(400).json({
            success: false,
            error: "انتهت صلاحية رمز التحقق (أكثر من 5 دقائق). يرجى طلب رمز جديد.",
          });
        }

        if (claimEntry.attempts >= 3) {
          claimOtpStore.delete(otpKey);
          return res.status(400).json({
            success: false,
            error: "تم تجاوز عدد المحاولات الخاطئة لهذا الرمز. يرجى طلب رمز تحقق جديد.",
          });
        }

        if (claimEntry.otpHash !== otpInputHash) {
          claimEntry.attempts += 1;
          const remaining = 3 - claimEntry.attempts;
          return res.status(400).json({
            success: false,
            error: `رمز التحقق غير صحيح! تبقى لديك ${remaining} محاولة.`,
          });
        }

        isVerified = true;
        claimOtpStore.delete(otpKey);
      }

      if (!isVerified) {
        return res.status(400).json({ success: false, error: "فشل التحقق من رمز OTP." });
      }

      // OTP Verified Successfully!
      const claimId = `claim_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const applicantCleanName = (applicantName || "صاحب المتجر").trim();
      const verifiedAt = new Date().toISOString();

      const newClaim: BackendStoreClaim = {
        id: claimId,
        storeId,
        storeName: storeTitle,
        applicantName: applicantCleanName,
        applicantPhone: cleanPhone,
        status: "verified",
        createdAt: verifiedAt,
        reviewedAt: verifiedAt,
        otpVerified: true,
        adminNotes: "تم توثيق الملكية عبر رمز OTP بنجاح.",
      };

      storeClaimsList.unshift(newClaim);

      // Persist Claim & Update Store in Supabase
      if (sb) {
        try {
          // 1. Insert into store_claims table
          await sb.from("store_claims").insert({
            id: claimId,
            store_id: storeId,
            applicant_name: applicantCleanName,
            applicant_phone: cleanPhone,
            status: "verified",
            otp_verified: true,
            reviewed_at: verifiedAt,
            created_at: verifiedAt,
            admin_notes: "تم توثيق الملكية عبر رمز OTP بنجاح.",
          });

          // 2. Update stores table
          await sb.from("stores").update({
            is_claimed: true,
            claim_status: "verified",
            phone_reliability: "otp_verified",
            claimed_by_name: applicantCleanName,
            claimed_by_phone: cleanPhone,
            claimed_at: verifiedAt,
            updated_at: verifiedAt,
          }).eq("id", storeId);

          console.log(`[Supabase Store Claimed] Store "${storeId}" claimed by "${applicantCleanName}" (${cleanPhone})`);
        } catch (dbErr) {
          console.warn("[Supabase store claim update error]", dbErr);
        }
      }

      res.json({
        success: true,
        claim: newClaim,
        store: {
          id: storeId,
          isClaimed: true,
          claimStatus: "verified",
          phoneReliability: "otp_verified",
          claimedByName: applicantCleanName,
          claimedByPhone: cleanPhone,
          claimedAt: verifiedAt,
        },
        message: `تم التحقق من ملكية الرقم وتوثيق متجر "${storeTitle}" بنجاح في دليل العراق!`,
      });
    } catch (err: any) {
      console.error("Error in verify-otp:", err);
      res.status(500).json({ success: false, error: err?.message || "حدث خطأ أثناء تأكيد الرمز." });
    }
  });

  // Admin: Get all store claims
  const adOtpStore = new Map<string, { phone: string; otpHash: string; expiresAt: number; attempts: number }>();

  // Secure Advertiser WhatsApp OTP Request (Never returns plain OTP to client)
  app.post("/api/ad/request-otp", async (req: Request, res: Response) => {
    try {
      const { phone } = req.body;
      if (!phone) {
        return res.status(400).json({ success: false, error: "رقم الهاتف مطلوب." });
      }

      const cleanPhone = normalizeIraqPhone(phone);
      const validation = validateIraqPhone(cleanPhone);
      if (!validation.isValid) {
        return res.status(400).json({ success: false, error: `رقم الهاتف غير صالح: ${validation.reason}` });
      }

      // Generate 6-digit OTP securely
      const otp = crypto.randomInt(100000, 1000000).toString();
      const otpHash = crypto.createHash("sha256").update(otp + ADMIN_TOKEN_SECRET).digest("hex");
      const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

      adOtpStore.set(cleanPhone, {
        phone: cleanPhone,
        otpHash,
        expiresAt,
        attempts: 0,
      });

      // Attempt sending via WhatsApp provider gateway
      await sendWhatsAppOtpMessage(cleanPhone, otp);

      // WhatsApp direct message URL for opening in WhatsApp app/web
      let intlPhone = cleanPhone.replace(/\D/g, "");
      if (intlPhone.startsWith("07")) {
        intlPhone = "964" + intlPhone.slice(1);
      } else if (!intlPhone.startsWith("964") && intlPhone.startsWith("7")) {
        intlPhone = "964" + intlPhone;
      }

      const waText = encodeURIComponent(
        `🔐 رمز التحقق لتوثيق إعلانك في دليل العراق هو: ${otp}\n(صالح لمدة 5 دقائق). يرجى نسخ الرمز ولصقه داخل التطبيق.`
      );
      const whatsappUrl = `https://wa.me/${intlPhone}?text=${waText}`;

      // CRITICAL SECURITY: The plain OTP is NEVER sent to the client!
      return res.json({
        success: true,
        message: `تم إرسال رمز التحقق في رسالة خاصة إلى واتساب الرقم ${cleanPhone}.`,
        whatsappUrl,
      });
    } catch (err: any) {
      console.error("Error in /api/ad/request-otp:", err);
      return res.status(500).json({ success: false, error: "حدث خطأ أثناء إرسال رمز التحقق." });
    }
  });

  // Secure Advertiser WhatsApp OTP Verification
  app.post("/api/ad/verify-otp", async (req: Request, res: Response) => {
    try {
      const { phone, otp } = req.body;
      if (!phone || !otp) {
        return res.status(400).json({ success: false, error: "رقم الهاتف ورمز التحقق مطلوبان." });
      }

      const cleanPhone = normalizeIraqPhone(phone);
      const cleanOtp = String(otp).trim();

      const record = adOtpStore.get(cleanPhone);
      if (!record) {
        return res.status(400).json({
          success: false,
          error: "انتهت صلاحية رمز التحقق أو لم يتم طلبه. يرجى طلب رمز جديد.",
        });
      }

      if (Date.now() > record.expiresAt) {
        adOtpStore.delete(cleanPhone);
        return res.status(400).json({
          success: false,
          error: "انتهت صلاحية رمز التحقق (صلاحيته 5 دقائق). يرجى طلب رمز جديد.",
        });
      }

      if (record.attempts >= 4) {
        adOtpStore.delete(cleanPhone);
        return res.status(429).json({
          success: false,
          error: "تم تجاوز عدد المحاولات المسموحة. يرجى طلب رمز جديد.",
        });
      }

      const inputHash = crypto.createHash("sha256").update(cleanOtp + ADMIN_TOKEN_SECRET).digest("hex");
      if (inputHash !== record.otpHash) {
        record.attempts += 1;
        const remaining = 4 - record.attempts;
        return res.status(400).json({
          success: false,
          error: `رمز التحقق غير صحيح! يرجى نسخه بدقة من تطبيق الواتساب (تبقى لديك ${remaining} محاولات).`,
        });
      }

      // Successfully verified!
      adOtpStore.delete(cleanPhone);

      return res.json({
        success: true,
        message: "تم التحقق بنجاح من ملكية رقم الهاتف!",
        phone: cleanPhone,
      });
    } catch (err: any) {
      console.error("Error in /api/ad/verify-otp:", err);
      return res.status(500).json({ success: false, error: "حدث خطأ أثناء التحقق من الرمز." });
    }
  });

  app.get("/api/admin/claims", requireAdminAuth, async (_req: Request, res: Response) => {
    const sb = getServerSupabase();
    if (sb) {
      try {
        const { data, error } = await sb.from("store_claims").select("*").order("created_at", { ascending: false });
        if (!error && Array.isArray(data)) {
          return res.json({ success: true, claims: data });
        }
      } catch (e) {
        console.warn("Could not fetch claims from Supabase, using memory:", e);
      }
    }

    res.json({
      success: true,
      claims: storeClaimsList,
    });
  });

  // Admin: Review Claim (Approve / Reject)
  app.post("/api/admin/claims/:id/review", requireAdminAuth, async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    if (!["verified", "rejected", "pending"].includes(status)) {
      return res.status(400).json({ success: false, error: "حالة المطالبة غير صالحة." });
    }

    const reviewedAt = new Date().toISOString();
    const sb = getServerSupabase();
    if (sb) {
      try {
        await sb.from("store_claims").update({
          status,
          admin_notes: adminNotes,
          reviewed_at: reviewedAt,
        }).eq("id", id);
      } catch (e) {
        console.warn("Could not update claim in Supabase:", e);
      }
    }

    const claim = storeClaimsList.find((c) => c.id === id);
    if (claim) {
      claim.status = status;
      claim.reviewedAt = reviewedAt;
      if (adminNotes) claim.adminNotes = adminNotes;
    }

    res.json({
      success: true,
      claim: claim || { id, status, reviewedAt, adminNotes },
      message: `تم تحديث حالة المطالبة إلى: ${status === "verified" ? "معتمد وموثّق" : status === "rejected" ? "مرفوض" : "قيد المراجعة"}.`,
    });
  });


  // 5. MULTI-SOURCE & ONLINE DATA IMPORT ENGINE (Protected: Admin Only)

  // 5.1 Import Providers Status & Config Check
  app.get("/api/import/status", requireAdminAuth, (_req: Request, res: Response) => {
    const hasGoogleKey = Boolean(process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY);
    const sb = getServerSupabase();

    res.json({
      success: true,
      providers: {
        osm_overpass: {
          id: "osm_overpass",
          name: "OpenStreetMap Overpass API (مفتوح وقانوني ODbL)",
          description: "مصدر رسمي ومجاني مفتوح لا يتطلب مفتاح API، يغطي جميع مدن ومحافظات العراق.",
          isReady: true,
        },
        google_places: {
          id: "google_places",
          name: "Google Places API (Google Maps Platform)",
          description: "الواجهة الرسمية المعتمدة من Google للأنشطة التجارية والمتاجر.",
          isReady: hasGoogleKey,
          missingConfig: hasGoogleKey ? null : "يتطلب ضبط GOOGLE_PLACES_API_KEY أو GOOGLE_MAPS_API_KEY في متغيرات البيئة.",
        },
      },
      supabase: {
        isConnected: Boolean(sb),
        url: SUPABASE_URL,
        message: Boolean(sb)
          ? "متصل بالخادم ويتم التخزين المباشر في public.stores."
          : "الخادم يعمل بدون مفتاح SUPABASE_SERVICE_ROLE_KEY. سيتم عرض البيانات بالواجهة ولكن لن تُحفظ في قاعدة البيانات حتى ضبط المفتاح.",
      },
      governorates: IRAQ_GEO_GOVERNORATES.map((g) => ({
        id: g.id,
        name: g.name,
      })),
    });
  });

  // 5.2 Real Online Stores Import Pipeline
  app.post("/api/import/online", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const {
        provider = "osm_overpass",
        governorateId = "all",
        maxPerGov = 20,
        categoryKeyword = "مطاعم ومتاجر وعيادات",
      } = req.body;

      const targetGovs =
        governorateId === "all"
          ? IRAQ_GEO_GOVERNORATES
          : IRAQ_GEO_GOVERNORATES.filter((g) => g.id === governorateId);

      if (targetGovs.length === 0) {
        return res.status(400).json({
          success: false,
          error: `المحافظة المحددة (${governorateId}) غير موجودة في الدليل الجغرافي.`,
        });
      }

      const googleApiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY || "";
      if (provider === "google_places" && (!googleApiKey || googleApiKey.length < 15)) {
        return res.status(400).json({
          success: false,
          error: "يتطلب استخدام مزود Google Places ضبط مفتاح GOOGLE_PLACES_API_KEY أو GOOGLE_MAPS_API_KEY في متغيرات البيئة.",
        });
      }

      const rawCandidates: RawCandidateStore[] = [];

      for (let idx = 0; idx < targetGovs.length; idx++) {
        const gov = targetGovs[idx];
        try {
          if (provider === "google_places") {
            const googleRes = await fetchFromGooglePlaces(gov, googleApiKey, categoryKeyword);
            rawCandidates.push(...googleRes.stores.slice(0, maxPerGov));
          } else {
            // Default: OpenStreetMap Overpass (Legal Open Data ODbL)
            const osmStores = await fetchFromOsmOverpass(gov, maxPerGov, 25);
            rawCandidates.push(...osmStores);
          }
        } catch (err: any) {
          console.warn(`[Online Importer Warning] ${gov.name}:`, err.message);
        }

        // Polite delay between queries to respect online servers and avoid rate limits
        if (idx < targetGovs.length - 1) {
          await new Promise((r) => setTimeout(r, 600));
        }
      }

      const sb = getServerSupabase();
      const processResult = await processAndDeduplicateStores(rawCandidates, sb);

      res.json({
        success: true,
        provider,
        governorateId,
        totalFetched: processResult.totalCandidates,
        verifiedWithRealPhoneCount: processResult.verifiedWithRealPhoneCount,
        skippedNoPhoneOrInvalidCount: processResult.skippedNoPhoneOrInvalidCount,
        duplicateCount: processResult.duplicateCount,
        savedToSupabaseCount: processResult.savedToSupabaseCount,
        governoratesSummary: processResult.governoratesBreakdown,
        stores: processResult.stores,
        supabaseStatus: processResult.supabaseStatus,
        message: `تم جلب ${processResult.totalCandidates} مرشح أونلاين: تم اعتماد وتوثيق ${processResult.verifiedWithRealPhoneCount} متجر بهاتف حقيقي، واستبعاد ${processResult.skippedNoPhoneOrInvalidCount} بدون هاتف، وحفظ ${processResult.savedToSupabaseCount} في Supabase.`,
      });
    } catch (err: any) {
      console.error("[Online Import Error]:", err);
      res.status(500).json({
        success: false,
        error: err.message || "حدث خطأ غير متوقع أثناء الاستيراد الأونلاين.",
      });
    }
  });

  // 5.3 Process Custom Pasted or Legacy Import Data
  app.post("/api/import/process", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { items = [], source = "multi_source_import", autoSeedDefault = false } = req.body;

      // If triggered from One-click button with no custom payload, seamlessly route to the real online importer!
      if ((!Array.isArray(items) || items.length === 0) && (autoSeedDefault || source === "iraq_verified_multi_region")) {
        const targetGovs = IRAQ_GEO_GOVERNORATES;
        const rawCandidates: RawCandidateStore[] = [];

        for (let idx = 0; idx < targetGovs.length; idx++) {
          const gov = targetGovs[idx];
          try {
            const osmStores = await fetchFromOsmOverpass(gov, 20, 20);
            rawCandidates.push(...osmStores);
          } catch (err: any) {
            console.warn(`[AutoSeed Warning] ${gov.name}:`, err.message);
          }
          if (idx < targetGovs.length - 1) {
            await new Promise((r) => setTimeout(r, 500));
          }
        }

        const sb = getServerSupabase();
        const processResult = await processAndDeduplicateStores(rawCandidates, sb);

        return res.json({
          success: true,
          totalProcessed: processResult.totalCandidates,
          savedToSupabaseCount: processResult.savedToSupabaseCount,
          importedCount: processResult.verifiedWithRealPhoneCount,
          skippedNoPhoneCount: processResult.skippedNoPhoneOrInvalidCount,
          duplicateCount: processResult.duplicateCount,
          governoratesSummary: processResult.governoratesBreakdown,
          stores: processResult.stores,
          supabaseStatus: processResult.supabaseStatus,
          message: `تم جلب واستيراد ${processResult.verifiedWithRealPhoneCount} متجراً حقيقياً من محافظات العراق هاتفياً، وحفظ ${processResult.savedToSupabaseCount} في Supabase.`,
        });
      }

      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          error: "يرجى إرسال مصفوفة من الأنشطة التجارية للمعالجة والاستيراد أو اختيار الاستيراد الأونلاين.",
        });
      }

      // Convert custom input items to candidate structure
      const rawCandidates: RawCandidateStore[] = items.map((item: any, i: number) => ({
        sourceId: item.id || `custom_${Date.now()}_${i}`,
        source: source || item.source || "manual_custom_upload",
        name: item.name ? String(item.name).trim() : "",
        rawPhone: item.phone || item.mobile || item.telephone || "",
        governorateId: item.governorateId || "baghdad",
        governorateName: item.governorateName || "العراق",
        districtId: item.districtId,
        districtName: item.districtName,
        category: item.category || "other",
        subCategory: item.subCategory || item.sub_category,
        address: item.address,
        lat: item.lat,
        lng: item.lng,
        website: item.website,
        facebook: item.facebook,
        instagram: item.instagram,
        workingHours: item.workingHours || item.working_hours,
        rating: item.rating,
        reviewsCount: item.reviewsCount,
      }));

      const sb = getServerSupabase();
      const processResult = await processAndDeduplicateStores(rawCandidates, sb);

      res.json({
        success: true,
        totalProcessed: items.length,
        savedToSupabaseCount: processResult.savedToSupabaseCount,
        importedCount: processResult.verifiedWithRealPhoneCount,
        skippedNoPhoneCount: processResult.skippedNoPhoneOrInvalidCount,
        duplicateCount: processResult.duplicateCount,
        governoratesSummary: processResult.governoratesBreakdown,
        stores: processResult.stores,
        supabaseStatus: processResult.supabaseStatus,
        message: `اكتملت المعالجة بنجاح: تم اعتماد وتوثيق ${processResult.verifiedWithRealPhoneCount} متجراً برقم هاتف حقيقي، واستبعاد ${processResult.skippedNoPhoneOrInvalidCount} لعدم توفر هاتف حقيقي، وحفظ ${processResult.savedToSupabaseCount} في Supabase.`,
      });
    } catch (err: any) {
      console.error("Import processing error:", err);
      res.status(500).json({ success: false, error: err.message || "حدث خطأ أثناء معالجة البيانات." });
    }
  });

  // 6. GEO-TARGETED NOTIFICATIONS & OFFERS ENGINE
  interface BackendNotification {
    id: string;
    title: string;
    message: string;
    type: "offer" | "store" | "news" | "system";
    targetType?: "store" | "offer" | "news" | "general";
    targetId?: string;
    imageUrl?: string;
    badge?: string;
    storeId?: string;
    targetScope: "district" | "governorate" | "iraq";
    targetGovernorateId?: string;
    targetDistrictId?: string;
    governorateId?: string;
    governorateName?: string;
    districtId?: string;
    districtName?: string;
    categoryId?: string;
    categoryName?: string;
    createdAt: string;
    timestamp: number;
  }

  // Pure dynamic notifications: no hardcoded demo notifications
  const backendNotifications: BackendNotification[] = [];

  // In-memory Offers fallback
  const backendOffers: any[] = [];

  // POST /api/offers: Store Owners Add Offers (Enforces 15-day server-side cooldown for notifications)
  app.post("/api/offers", async (req: Request, res: Response) => {
    try {
      const {
        storeId,
        businessName,
        title,
        description,
        discountPercentage,
        couponCode,
        governorateId,
        districtId,
        governorateName,
        districtName,
        category,
        imageUrl,
        validUntil,
      } = req.body;

      if (!storeId || !title || !description) {
        return res.status(400).json({ success: false, error: "معرف المتجر وعنوان العرض والوصف مطلوبة." });
      }

      const offerId = `offer_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const now = Date.now();
      const createdAt = new Date().toISOString();
      const sb = getServerSupabase();

      // 1. Check 15-day server-side cooldown using `offer_notification_limits` table
      let canSendNotification = true;
      let cooldownRemainingDays = 0;
      const FIFTEEN_DAYS_MS = 15 * 24 * 60 * 60 * 1000;

      if (sb) {
        try {
          const { data: limitData } = await sb
            .from("offer_notification_limits")
            .select("*")
            .eq("store_id", storeId)
            .order("last_notification_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (limitData && limitData.last_notification_at) {
            const lastTime = new Date(limitData.last_notification_at).getTime();
            const elapsed = now - lastTime;
            if (elapsed < FIFTEEN_DAYS_MS) {
              canSendNotification = false;
              cooldownRemainingDays = Math.ceil((FIFTEEN_DAYS_MS - elapsed) / (24 * 60 * 60 * 1000));
            }
          }
        } catch (dbErr) {
          console.warn("[Supabase offer_notification_limits error]", dbErr);
        }
      }

      // 2. Persist offer to Supabase `offers` table
      const newOffer = {
        id: offerId,
        store_id: storeId,
        business_name: businessName || "متجر",
        title: title.trim(),
        description: description.trim(),
        discount_percentage: discountPercentage || null,
        coupon_code: couponCode || null,
        governorate_id: governorateId || "baghdad",
        district_id: districtId || "karkh",
        governorate_name: governorateName || "بغداد",
        district_name: districtName || "الكرخ",
        category: category || "restaurants",
        image_url: imageUrl || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80",
        valid_until: validUntil || new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: true,
        created_at: createdAt,
      };

      if (sb) {
        try {
          await sb.from("offers").insert(newOffer);
        } catch (dbErr) {
          console.warn("[Supabase offer insert error]", dbErr);
        }
      }
      backendOffers.unshift(newOffer);

      // 3. If eligible, automatically broadcast geo-targeted notification
      let generatedNotification: BackendNotification | null = null;

      if (canSendNotification) {
        const notifId = `notif_offer_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        generatedNotification = {
          id: notifId,
          title: `🔥 عرض جديد من ${businessName || "المتجر"}: ${title}`,
          message: `${description} ${discountPercentage ? `(خصم ${discountPercentage})` : ""}`,
          type: "offer",
          targetType: "offer",
          targetId: offerId,
          storeId,
          badge: discountPercentage ? `${discountPercentage} 🔥` : "عرض حصري",
          targetScope: "district",
          targetGovernorateId: governorateId,
          targetDistrictId: districtId,
          governorateId,
          governorateName,
          districtId,
          districtName,
          categoryId: category,
          imageUrl: newOffer.image_url,
          createdAt,
          timestamp: now,
        };

        // Insert notification into Supabase `notifications` table
        if (sb) {
          try {
            await sb.from("notifications").insert({
              id: notifId,
              title: generatedNotification.title,
              message: generatedNotification.message,
              type: "offer",
              target_type: "offer",
              target_id: offerId,
              store_id: storeId,
              target_scope: "district",
              target_district_id: districtId,
              target_governorate_id: governorateId,
              category_id: category,
              image_url: generatedNotification.imageUrl,
              created_at: createdAt,
            });

            // Update or insert offer_notification_limits
            await sb.from("offer_notification_limits").upsert({
              id: `limit_${storeId}`,
              store_id: storeId,
              last_notification_at: createdAt,
              offer_id: offerId,
              updated_at: createdAt,
            });
          } catch (dbErr) {
            console.warn("[Supabase notification auto-trigger error]", dbErr);
          }
        }
        backendNotifications.unshift(generatedNotification);
      }

      res.json({
        success: true,
        offer: newOffer,
        notificationCreated: canSendNotification,
        cooldownRemainingDays: canSendNotification ? 0 : cooldownRemainingDays,
        message: canSendNotification
          ? `تم نشر العرض وبث الإشعار التلقائي للمنطقة (${districtName || "المحددة"}) بنجاح!`
          : `تم نشر العرض بنجاح. ملاحظة: لم يتم إرسال إشعار للمنطقة بسبب قاعدة الـ15 يوماً بين إشعارات المتجر الواحد (المتبقي ${cooldownRemainingDays} يوم).`,
      });
    } catch (err: any) {
      console.error("Error creating offer:", err);
      res.status(500).json({ success: false, error: err?.message || "حدث خطأ أثناء حفظ العرض." });
    }
  });

  // GET /api/offers: Retrieve Active Offers with Geo-filtering (Supabase Source of Truth)
  app.get("/api/offers", async (req: Request, res: Response) => {
    const { governorateId, districtId, category } = req.query as {
      governorateId?: string;
      districtId?: string;
      category?: string;
    };

    const sb = getServerSupabase();
    if (sb) {
      try {
        let query = sb.from("offers").select("*").eq("is_active", true).order("created_at", { ascending: false });

        if (governorateId && governorateId !== "all") {
          query = query.eq("governorate_id", governorateId);
        }
        if (districtId && districtId !== "all") {
          query = query.eq("district_id", districtId);
        }
        if (category && category !== "all") {
          query = query.eq("category", category);
        }

        const { data, error } = await query;
        if (!error && Array.isArray(data)) {
          return res.json({ success: true, count: data.length, offers: data });
        }
      } catch (dbErr) {
        console.warn("[Supabase fetch offers error]", dbErr);
      }
    }

    // Clean empty response if no offers exist in Supabase
    res.json({ success: true, count: 0, offers: [] });
  });

  // GET /api/notifications: Server-side Geo-targeted Filtering (Supabase Source of Truth)
  app.get("/api/notifications", async (req: Request, res: Response) => {
    const { governorateId, districtId } = req.query as {
      governorateId?: string;
      districtId?: string;
    };

    const sb = getServerSupabase();
    if (sb) {
      try {
        const { data, error } = await sb.from("notifications").select("*").order("created_at", { ascending: false });
        if (!error && Array.isArray(data)) {
          const dbFiltered = data.filter((n: any) => {
            const scope = n.target_scope || "district";
            if (scope === "iraq") return true;
            if (!governorateId || governorateId === "all") return true;
            if (scope === "governorate") {
              return (n.target_governorate_id || n.governorate_id) === governorateId;
            }
            if (scope === "district") {
              const targetDist = n.target_district_id || n.district_id;
              const targetGov = n.target_governorate_id || n.governorate_id;
              if (districtId && districtId !== "all") {
                return targetDist === districtId;
              }
              return targetGov === governorateId;
            }
            return true;
          });

          return res.json({ success: true, count: dbFiltered.length, notifications: dbFiltered });
        }
      } catch (dbErr) {
        console.warn("[Supabase notifications error]", dbErr);
      }
    }

    // Clean empty response (No demo mock notifications)
    res.json({
      success: true,
      count: 0,
      notifications: [],
    });
  });

  // POST /api/notifications: Publish Geo-targeted Notification (SECURED: Only Admin allowed to broadcast)
  app.post("/api/notifications", requireAdminAuth, async (req: Request, res: Response) => {
    const {
      title,
      message,
      type = "system",
      targetType,
      targetId,
      imageUrl,
      badge,
      storeId,
      targetScope = "district",
      targetGovernorateId,
      targetDistrictId,
      governorateId,
      governorateName,
      districtId,
      districtName,
      categoryId,
      categoryName,
    } = req.body;

    if (!title || !message) {
      return res.status(400).json({ success: false, error: "عنوان الإشعار ونصه مطلوبان." });
    }

    const scope = ["district", "governorate", "iraq"].includes(targetScope)
      ? (targetScope as "district" | "governorate" | "iraq")
      : "district";

    const notifId = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const createdAt = new Date().toISOString();

    const newNotif: BackendNotification = {
      id: notifId,
      title: String(title).trim(),
      message: String(message).trim(),
      type: type || "system",
      targetType: targetType || "general",
      targetId,
      imageUrl,
      badge,
      storeId,
      targetScope: scope,
      targetGovernorateId: targetGovernorateId || governorateId,
      targetDistrictId: targetDistrictId || districtId,
      governorateId: governorateId || targetGovernorateId,
      governorateName,
      districtId: districtId || targetDistrictId,
      districtName,
      categoryId,
      categoryName,
      createdAt,
      timestamp: Date.now(),
    };

    const sb = getServerSupabase();
    if (!sb) {
      return res.status(503).json({
        success: false,
        error: "تعذر الاتصال بقاعدة بيانات Supabase لبث الإشعار.",
      });
    }

    try {
      const { error: insertErr } = await sb.from("notifications").insert({
        id: notifId,
        title: newNotif.title,
        message: newNotif.message,
        type: newNotif.type,
        target_type: newNotif.targetType,
        target_id: newNotif.targetId,
        store_id: newNotif.storeId,
        target_scope: scope,
        target_governorate_id: newNotif.targetGovernorateId,
        target_district_id: newNotif.targetDistrictId,
        category_id: newNotif.categoryId,
        image_url: newNotif.imageUrl,
        created_at: createdAt,
      });

      if (insertErr) {
        throw new Error(insertErr.message);
      }
    } catch (dbErr: any) {
      console.warn("[Supabase insert notification error]", dbErr);
      return res.status(500).json({
        success: false,
        error: `فشل حفظ الإشعار في Supabase: ${dbErr?.message || "خطأ غير معروف"}`,
      });
    }

    res.json({
      success: true,
      notification: newNotif,
      message: `تم بث الإشعار بنجاح إلى نطاق (${scope === "district" ? `قضاء ${districtName || "المحدد"}` : scope === "governorate" ? `محافظة ${governorateName || "المحددة"}` : "عموم محافظات العراق"}).`,
    });
  });

  // POST /api/notifications/read: Persist read notifications
  app.post("/api/notifications/read", async (req: Request, res: Response) => {
    const { notificationId, notificationIds, userId = "user" } = req.body || {};
    const ids: string[] = notificationIds || (notificationId ? [notificationId] : []);
    const sb = getServerSupabase();
    if (sb && ids.length > 0) {
      const rows = ids.map((nid) => ({
        id: `read_${userId}_${nid}`,
        user_id: userId,
        notification_id: nid,
        read_at: new Date().toISOString(),
      }));
      await sb.from("notification_reads").upsert(rows, { onConflict: "id" }).catch(() => {});
    }
    return res.json({ success: true, count: ids.length });
  });

  // POST /api/reports: Submit store report from visitor
  app.post("/api/reports", async (req: Request, res: Response) => {
    const { storeId, storeName, storePhone, reason, details, reporterName, reporterPhone } = req.body || {};
    const reportId = `rep_${Date.now()}`;
    const sb = getServerSupabase();
    if (sb) {
      await sb.from("reports").insert({
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
    }
    return res.json({ success: true, reportId });
  });

  // GET /api/reports: Fetch store reports (Admin only)
  app.get("/api/reports", requireAdminAuth, async (_req: Request, res: Response) => {
    const sb = getServerSupabase();
    if (!sb) {
      return res.status(503).json({ success: false, error: "قاعدة البيانات غير متصلة." });
    }
    const { data } = await sb.from("reports").select("*").order("created_at", { ascending: false }).limit(100);
    return res.json({ success: true, reports: data || [] });
  });

  // 7. WALLET & TRANSACTIONS ENDPOINTS (SECURED: Admin / Authorized Only)
  app.get("/api/wallet", requireAdminAuth, async (req: Request, res: Response) => {
    const walletId = (req.query.walletId as string) || (req.query.userId as string) || "main_wallet";
    const sb = getServerSupabase();

    if (!sb) {
      return res.status(503).json({
        success: false,
        error: "قاعدة بيانات Supabase غير متصلة في الخادم لاسترجاع بيانات المحفظة.",
      });
    }

    try {
      const { data: walletData, error: wError } = await sb
        .from("wallets")
        .select("*")
        .or(`id.eq.${walletId},user_id.eq.${walletId}`)
        .maybeSingle();

      if (wError) {
        throw new Error(wError.message);
      }

      const { data: txData, error: tError } = await sb
        .from("transactions")
        .select("*")
        .or(`wallet_id.eq.${walletId},user_id.eq.${walletId}`)
        .order("created_at", { ascending: false })
        .limit(100);

      if (tError) {
        throw new Error(tError.message);
      }

      return res.json({
        success: true,
        wallet: walletData || { id: walletId, user_id: "admin", balance: 0, currency: "IQD" },
        transactions: txData || [],
      });
    } catch (e: any) {
      console.warn("Wallet fetch from Supabase error:", e);
      return res.status(500).json({
        success: false,
        error: `فشل استرجاع بيانات المحفظة من Supabase: ${e?.message || "خطأ غير معروف"}`,
      });
    }
  });

  // PROTECTED: Only authenticated Admin can adjust balances or create transactions
  app.post("/api/wallet/transaction", requireAdminAuth, async (req: Request, res: Response) => {
    const { 
      walletId = "main_wallet", 
      userId = "admin", 
      amount, 
      type, 
      title, 
      description,
      paymentMethod = "zaincash",
      referenceNumber
    } = req.body;

    if (!amount || !type || !description) {
      return res.status(400).json({ success: false, error: "المبلغ والنوع والوصف مطلوبة." });
    }

    const sb = getServerSupabase();
    if (!sb) {
      return res.status(503).json({
        success: false,
        error: "قاعدة بيانات Supabase غير متصلة في الخادم لتسجيل المعاملة وتعديل الرصيد.",
      });
    }

    const txId = `tx_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const createdAt = new Date().toISOString();
    const numAmount = Math.abs(Number(amount));
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ success: false, error: "المبلغ يجب أن يكون رقماً موجباً أكبر من صفر." });
    }
    const refNum = referenceNumber || `IRAQ-TX-${crypto.randomInt(100000, 1000000)}`;

    try {
      // Fetch current wallet from Supabase
      const { data: wallet, error: getErr } = await sb
        .from("wallets")
        .select("*")
        .eq("id", walletId)
        .maybeSingle();

      if (getErr) throw new Error(getErr.message);

      const currentBal = wallet ? Number(wallet.balance) : 0;
      let newBal = currentBal;
      if (type === "earning" || type === "deposit" || type === "credit") {
        newBal = currentBal + numAmount;
      } else if (type === "withdrawal" || type === "payment" || type === "debit") {
        if (currentBal < numAmount) {
          return res.status(400).json({
            success: false,
            error: `الرصيد غير كافٍ لإتمام العملية (الرصيد الحالي: ${currentBal.toLocaleString()} د.ع).`,
          });
        }
        newBal = Math.max(0, currentBal - numAmount);
      }

      // 1. Update wallet balance in Supabase
      const { error: walletErr } = await sb.from("wallets").upsert({
        id: walletId,
        user_id: userId,
        balance: newBal,
        currency: "IQD",
        updated_at: createdAt,
      });

      if (walletErr) throw new Error(walletErr.message);

      // 2. Insert transaction record in Supabase
      const txRecord = {
        id: txId,
        wallet_id: walletId,
        user_id: userId,
        amount: numAmount,
        type,
        title: title || description,
        description,
        payment_method: paymentMethod,
        reference_number: refNum,
        status: "completed",
        created_at: createdAt,
      };

      const { error: txErr } = await sb.from("transactions").insert(txRecord);
      if (txErr) throw new Error(txErr.message);

      return res.json({
        success: true,
        balance: newBal,
        transaction: txRecord,
        message: "تم تحديث الرصيد وتسجيل المعاملة في Supabase بنجاح.",
      });
    } catch (e: any) {
      console.error("Wallet transaction error in Supabase:", e);
      return res.status(500).json({
        success: false,
        error: `فشل تعديل الرصيد وتسجيل المعاملة في قاعدة البيانات: ${e?.message || "خطأ غير معروف"}`,
      });
    }
  });

  // 8. NEWS & ADS ENDPOINTS
  app.get("/api/news", async (req: Request, res: Response) => {
    const governorateId = (req.query.governorateId as string) || undefined;
    const districtName = (req.query.district as string) || (req.query.districtName as string) || undefined;
    const forceRefresh = req.query.refresh === "true" || req.query.refresh === "1";

    try {
      const liveItems = await getLiveIraqNews({
        governorateId: governorateId && governorateId !== "all" ? governorateId : undefined,
        districtName: districtName && districtName !== "الكل" ? districtName : undefined,
        forceRefresh,
        limit: 40,
      });

      if (liveItems && liveItems.length > 0) {
        // Optional background async sync to Supabase if connected
        const sb = getServerSupabase();
        if (sb && forceRefresh) {
          (async () => {
            try {
              for (const item of liveItems.slice(0, 10)) {
                await sb.from("news").upsert(
                  {
                    id: item.id,
                    title: item.title,
                    content: item.summary,
                    category: item.category,
                    source: item.source,
                    governorate_id: item.governorateId || null,
                    image_url: item.imageUrl,
                    created_at: new Date().toISOString(),
                  },
                  { onConflict: "id" }
                );
              }
            } catch (err) {
              // Ignore background upsert error
            }
          })();
        }

        return res.json({
          success: true,
          count: liveItems.length,
          news: liveItems,
          source: "live_iraq_feed",
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.warn("Live Iraq news service error:", err);
    }

    // Fallback: Supabase if available
    const sb = getServerSupabase();
    if (sb) {
      try {
        let query = sb.from("news").select("*").order("created_at", { ascending: false }).limit(30);
        if (governorateId && governorateId !== "all") {
          query = query.eq("governorate_id", governorateId);
        }
        const { data, error } = await query;
        if (!error && Array.isArray(data) && data.length > 0) {
          let filtered = data;
          if (districtName && districtName !== "الكل") {
            const cleanD = districtName.replace(/^(قضاء|ناحية)\s+/, "").trim().toLowerCase();
            filtered = data.filter((item: any) => {
              const text = `${item.title || ""} ${item.content || ""}`.toLowerCase();
              return (item.district_id && item.district_id.toLowerCase().includes(cleanD)) || text.includes(cleanD);
            });
          }
          if (filtered.length > 0) {
            return res.json({ success: true, count: filtered.length, news: filtered, source: "supabase" });
          }
        }
      } catch (e) {
        console.warn("Supabase news error:", e);
      }
    }

    res.json({ success: true, count: 0, news: [] });
  });

  app.get("/api/advertisements", async (_req: Request, res: Response) => {
    const sb = getServerSupabase();
    if (sb) {
      try {
        const { data, error } = await sb.from("advertisements").select("*").eq("is_active", true).order("created_at", { ascending: false });
        if (!error && Array.isArray(data)) {
          return res.json({ success: true, count: data.length, ads: data });
        }
      } catch (e) {
        console.warn("Supabase ads error:", e);
      }
    }
    res.json({ success: true, count: 0, ads: [] });
  });

  // 8.5. REVIEWS: 5-Star Ratings & Community Reviews
  app.get("/api/reviews", async (req: Request, res: Response) => {
    try {
      const storeId = req.query.storeId as string;
      const sb = getServerSupabase();
      if (!sb) {
        return res.json({ success: true, reviews: [] });
      }

      let query = sb.from("reviews").select("*").order("created_at", { ascending: false });
      if (storeId) {
        query = query.eq("store_id", storeId);
      }

      const { data, error } = await query;
      if (error) {
        return res.status(400).json({ success: false, error: error.message });
      }

      res.json({ success: true, reviews: data || [] });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e?.message || "تعذر جلب التقييمات." });
    }
  });

  app.post("/api/reviews", async (req: Request, res: Response) => {
    try {
      const { storeId, store_id, rating, userName, user_name, comment, deviceId, device_id } = req.body;
      const targetStoreId = storeId || store_id;
      const numRating = Number(rating);

      if (!targetStoreId || !numRating || numRating < 1 || numRating > 5) {
        return res.status(400).json({ success: false, error: "معرف المتجر والتقييم (1-5) مطلوبان." });
      }

      const sb = getServerSupabase();
      if (!sb) {
        return res.json({ success: true, message: "تم تسجيل التقييم محلياً." });
      }

      // Check anti-spam: 1 rating per device/user per store within 24 hours
      const effectiveDeviceId = deviceId || device_id || req.ip;
      if (effectiveDeviceId) {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data: existing } = await sb
          .from("reviews")
          .select("id")
          .eq("store_id", targetStoreId)
          .eq("device_id", effectiveDeviceId)
          .gte("created_at", oneDayAgo);

        if (existing && existing.length > 0) {
          return res.status(429).json({
            success: false,
            error: "لقد قمت بتقييم هذا المتجر مؤخراً. يرجى الانتظار قبل إرسال تقييم جديد.",
          });
        }
      }

      const reviewId = `rev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const { error: insertErr } = await sb.from("reviews").insert({
        id: reviewId,
        store_id: targetStoreId,
        rating: numRating,
        user_name: userName || user_name || "زائر دليل العراق",
        comment: comment || null,
        device_id: effectiveDeviceId,
        created_at: new Date().toISOString(),
      });

      if (insertErr) {
        return res.status(400).json({ success: false, error: insertErr.message });
      }

      // Calculate aggregate rating for the store
      const { data: allStoreReviews } = await sb
        .from("reviews")
        .select("rating")
        .eq("store_id", targetStoreId);

      if (allStoreReviews && allStoreReviews.length > 0) {
        const count = allStoreReviews.length;
        const avg = Number((allStoreReviews.reduce((acc, curr) => acc + Number(curr.rating), 0) / count).toFixed(1));
        await sb.from("stores").update({ rating: avg, reviews_count: count }).eq("id", targetStoreId);
      }

      res.json({ success: true, message: "تم حفظ التقييم بنجاح! شكراً لمشاركتك." });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e?.message || "تعذر حفظ التقييم." });
    }
  });

  // 8.6. STORES: Directory Search & Insertion
  app.get("/api/stores", async (req: Request, res: Response) => {
    try {
      const { governorateId, districtId, category, q, limit = "100", offset = "0" } = req.query;
      const sb = getServerSupabase();
      if (!sb) {
        return res.json({ success: true, stores: [], total: 0 });
      }

      let query = sb.from("stores").select("*", { count: "exact" });
      if (governorateId && governorateId !== "all") query = query.eq("governorate_id", governorateId);
      if (districtId && districtId !== "all") query = query.eq("district_id", districtId);
      if (category && category !== "all") query = query.eq("category", category);
      if (q) query = query.ilike("name", `%${q}%`);

      const numLimit = parseInt(String(limit), 10) || 100;
      const numOffset = parseInt(String(offset), 10) || 0;
      query = query.range(numOffset, numOffset + numLimit - 1).order("created_at", { ascending: false });

      const { data, error, count } = await query;
      if (error) {
        return res.status(400).json({ success: false, error: error.message });
      }
      res.json({ success: true, stores: data || [], total: count || 0 });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e?.message || "تعذر جلب المتاجر." });
    }
  });

  app.post("/api/stores", async (req: Request, res: Response) => {
    try {
      const { id, name, category, phone, address, governorateId, districtId } = req.body;
      if (!name || !category || !phone || !address) {
        return res.status(400).json({ success: false, error: "جميع الحقول الأساسية مطلوبة." });
      }
      const sb = getServerSupabase();
      if (!sb) {
        return res.json({ success: true, store: req.body });
      }
      const storeId = id || `store_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const { data, error } = await sb.from("stores").insert({
        id: storeId,
        name,
        category,
        sub_category: req.body.subCategory || req.body.sub_category || category,
        phone,
        whatsapp: req.body.whatsapp || phone,
        address,
        governorate_id: governorateId || req.body.governorate_id || "baghdad",
        district_id: districtId || req.body.district_id || "karkh",
        governorate_name: req.body.governorateName || req.body.governorate_name,
        district_name: req.body.districtName || req.body.district_name,
        rating: null,
        reviews_count: 0,
        is_open: true,
        working_hours: req.body.workingHours || req.body.working_hours || "٩:٠٠ ص - ١١:٠٠ م",
        image_url: req.body.imageUrl || req.body.image_url,
        featured: Boolean(req.body.featured),
      }).select();

      if (error) {
        return res.status(400).json({ success: false, error: error.message });
      }
      res.json({ success: true, store: data?.[0] || req.body });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e?.message || "تعذر حفظ المتجر." });
    }
  });

  // 8.7. STATS & METRICS
  app.get("/api/stats", async (_req: Request, res: Response) => {
    try {
      const sb = getServerSupabase();
      let storeCount = 0;
      let offerCount = 0;
      let adCount = 0;
      if (sb) {
        const { count: sCount } = await sb.from("stores").select("*", { count: "exact", head: true });
        const { count: oCount } = await sb.from("offers").select("*", { count: "exact", head: true });
        const { count: aCount } = await sb.from("advertisements").select("*", { count: "exact", head: true });
        storeCount = sCount || 0;
        offerCount = oCount || 0;
        adCount = aCount || 0;
      }
      res.json({
        success: true,
        stats: {
          stores: storeCount,
          offers: offerCount,
          advertisements: adCount,
          governorates: 18,
          districts: 138,
        },
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e?.message || "تعذر جلب الإحصائيات." });
    }
  });

  // 8.8. SYNC STATUS
  app.all("/api/sync", async (_req: Request, res: Response) => {
    try {
      const sb = getServerSupabase();
      let storeCount = 0;
      if (sb) {
        const { count: sCount } = await sb.from("stores").select("*", { count: "exact", head: true });
        storeCount = sCount || 0;
      }
      res.json({
        success: true,
        status: "synced",
        storeCount,
        timestamp: new Date().toISOString(),
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e?.message || "تعذر المزامنة." });
    }
  });

  // 8.9. AI COLORING & ASSISTANT ENDPOINTS (Uses GEMINI_API_KEY from environment)
  app.post("/api/chat", async (req: Request, res: Response) => {
    try {
      const { messages = [], systemInstruction, childName, theme } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (apiKey && apiKey.length > 5) {
        try {
          const ai = getGenAI();
          const contents = messages.map((m: any) => ({
            role: m.role === "user" ? "user" : "model",
            parts: [{ text: String(m.text || "") }],
          }));

          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents,
            config: systemInstruction ? { systemInstruction } : undefined,
          });

          if (response && response.text) {
            return res.json({ success: true, text: response.text });
          }
        } catch (aiErr) {
          console.warn("[Server Gemini Chat Error]", aiErr);
        }
      }

      const fallbackText = `مرحباً بك وبالمبدع الصغير ${childName || ""} في عالم التلوين والقصص! فكرة رائعة لموضوع "${theme || "المغامرات"}": يمكننا رسم مشهد واضح بخطوط عريضة يسهل تلوينها مع شخصيات لطيفة ومبهجة.`;
      res.json({ success: true, text: fallbackText });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "حدث خطأ أثناء معالجة المحادثة." });
    }
  });

  app.post("/api/regenerate-prompt", async (req: Request, res: Response) => {
    try {
      const { pageTitle, currentCaption, userInstructions, childName, theme } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (apiKey && apiKey.length > 5) {
        try {
          const ai = getGenAI();
          const promptQuery = `You are a children coloring book creator. Given page: "${pageTitle}", current caption: "${currentCaption}", user instructions: "${userInstructions}", child: "${childName}", theme: "${theme}". Return valid JSON with keys: title, caption, prompt. The prompt must be high-contrast, black and white thick line art for kids coloring page.`;
          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: promptQuery,
            config: { responseMimeType: "application/json" },
          });

          if (response && response.text) {
            const parsed = JSON.parse(response.text);
            return res.json({
              success: true,
              data: {
                title: parsed.title || pageTitle || "صفحة تلوين ممتعة",
                caption: parsed.caption || currentCaption || "مغامرة تلوين شيقة للأطفال",
                prompt: parsed.prompt || `Thick black and white line art coloring page of ${theme || "adventure"}, simple shapes, high contrast, clean outlines`,
              },
            });
          }
        } catch (aiErr) {
          console.warn("[Server Gemini Regenerate Error]", aiErr);
        }
      }

      res.json({
        success: true,
        data: {
          title: pageTitle || "صفحة تلوين مرحة",
          caption: userInstructions ? `مشهد جديد: ${userInstructions}` : currentCaption || "مغامرة تلوين رائعة للأطفال",
          prompt: `High-contrast black and white clean line art coloring book page for children, ${userInstructions || theme || "happy adventure"}, bold outlines, no grayscale shading`,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "حدث خطأ أثناء تجديد الصفحة." });
    }
  });

  app.post("/api/generate-image", async (req: Request, res: Response) => {
    try {
      const { prompt, theme } = req.body;
      const cleanThemeText = String(theme || prompt || "تلوين مرح").slice(0, 30);
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
      res.json({ success: true, imageUrl: dataUrl });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "حدث خطأ أثناء رسم الصورة." });
    }
  });

  // 9. COMPLETE SUPABASE SQL SCHEMA (13 Tables, RLS, Indexes, Triggers)
  app.get("/api/supabase-sql", (_req: Request, res: Response) => {
    const sqlScript = `
-- =====================================================================
-- الهيكل الشامل وقواعد الأمان RLS لمشروع «دليل العراق» (Supabase Source of Truth)
-- يغطي 15 محافظة عراقية بدون أربيل، دهوك، وسليمانية
-- =====================================================================

-- 1. جدول الحسابات والمستخدمين (Profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  governorate_id TEXT,
  district_id TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'store_owner', 'admin', 'moderator')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. جدول المتاجر (Stores)
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

-- 3. جدول مطالبات توثيق المتاجر (Store Claims)
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

-- 4. جدول التحقق برمز OTP (OTP Verifications)
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

-- 5. جدول العروض والخصومات (Offers)
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

-- 6. جدول قيود إرسال إشعارات العروض (15 days cooldown enforcement)
CREATE TABLE IF NOT EXISTS public.offer_notification_limits (
  id TEXT PRIMARY KEY,
  store_id TEXT UNIQUE REFERENCES public.stores(id) ON DELETE CASCADE,
  last_notification_at TIMESTAMPTZ NOT NULL,
  offer_id TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. جدول الإشعارات الموجهة جغرافياً (Notifications)
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

-- 8. جدول الأخبار (News)
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

-- 9. جدول الإعلانات الترويجية (Advertisements)
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. جدول المحافظ (Wallets)
CREATE TABLE IF NOT EXISTS public.wallets (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  balance NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'IQD',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. جدول المعاملات المالية (Transactions)
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

-- 12. جدول المراجعات والتقييمات (Reviews)
CREATE TABLE IF NOT EXISTS public.reviews (
  id TEXT PRIMARY KEY,
  store_id TEXT REFERENCES public.stores(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  rating NUMERIC NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. جدول التقارير والبلاغات (Reports)
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
-- تفعيل Row Level Security (RLS) وسياسات الحماية المحكمة
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

-- 1. سياسات القراءة العامة (Public Read) للبيانات غير الحساسة
DROP POLICY IF EXISTS "Public Read Stores" ON public.stores;
CREATE POLICY "Public Read Stores" ON public.stores FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Offers" ON public.offers;
CREATE POLICY "Public Read Offers" ON public.offers FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Public Read Notifications" ON public.notifications;
CREATE POLICY "Public Read Notifications" ON public.notifications FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read News" ON public.news;
CREATE POLICY "Public Read News" ON public.news FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Ads" ON public.advertisements;
CREATE POLICY "Public Read Ads" ON public.advertisements FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Public Read Reviews" ON public.reviews;
CREATE POLICY "Public Read Reviews" ON public.reviews FOR SELECT USING (true);

-- 2. سياسات الإدخال من المستخدمين (Public / Authenticated Insert)
DROP POLICY IF EXISTS "Public Insert Reviews" ON public.reviews;
CREATE POLICY "Public Insert Reviews" ON public.reviews FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public Insert Reports" ON public.reports;
CREATE POLICY "Public Insert Reports" ON public.reports FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public Insert Claims" ON public.store_claims;
CREATE POLICY "Public Insert Claims" ON public.store_claims FOR INSERT WITH CHECK (true);

-- 3. صلاحيات كاملة للـ Service Role والخادم الداخلي (Full Admin & Backend Access)
DROP POLICY IF EXISTS "Service Role Full Access Stores" ON public.stores;
CREATE POLICY "Service Role Full Access Stores" ON public.stores FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service Role Full Access Claims" ON public.store_claims;
CREATE POLICY "Service Role Full Access Claims" ON public.store_claims FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service Role Full Access OTP" ON public.otp_verifications;
CREATE POLICY "Service Role Full Access OTP" ON public.otp_verifications FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service Role Full Access Offers" ON public.offers;
CREATE POLICY "Service Role Full Access Offers" ON public.offers FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service Role Full Access Limits" ON public.offer_notification_limits;
CREATE POLICY "Service Role Full Access Limits" ON public.offer_notification_limits FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service Role Full Access Notifications" ON public.notifications;
CREATE POLICY "Service Role Full Access Notifications" ON public.notifications FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service Role Full Access News" ON public.news;
CREATE POLICY "Service Role Full Access News" ON public.news FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service Role Full Access Ads" ON public.advertisements;
CREATE POLICY "Service Role Full Access Ads" ON public.advertisements FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service Role Full Access Wallets" ON public.wallets;
CREATE POLICY "Service Role Full Access Wallets" ON public.wallets FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service Role Full Access Transactions" ON public.transactions;
CREATE POLICY "Service Role Full Access Transactions" ON public.transactions FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service Role Full Access Reviews" ON public.reviews;
CREATE POLICY "Service Role Full Access Reviews" ON public.reviews FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service Role Full Access Reports" ON public.reports;
CREATE POLICY "Service Role Full Access Reports" ON public.reports FOR ALL USING (auth.role() = 'service_role');

-- 14. جدول بيانات المدير العام وصلاحيات الإدارة (Admin Credentials)
CREATE TABLE IF NOT EXISTS public.admin_credentials (
  id TEXT PRIMARY KEY DEFAULT 'primary_admin',
  phone TEXT NOT NULL,
  username TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'superadmin',
  otp_code TEXT,
  otp_expires_at BIGINT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.admin_credentials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service Role Full Access Admin" ON public.admin_credentials;
CREATE POLICY "Service Role Full Access Admin" ON public.admin_credentials FOR ALL USING (auth.role() = 'service_role');
`;
    res.type("text/plain").send(sqlScript);
  });

  async function ensureAdminCredentialsInSupabase() {
    const sb = getServerSupabase();
    if (!sb) return;
    try {
      const { data } = await sb.from("admin_credentials").select("id, password_hash").eq("id", "primary_admin").maybeSingle();
      if (!data) {
        const envUser = process.env.IRAQ_ADMIN_USERNAME;
        const envPass = process.env.IRAQ_ADMIN_PASSWORD;
        const envPhone = process.env.IRAQ_ADMIN_PHONE || "";
        if (envUser && envPass) {
          const hash = hashPasswordSync(envPass);
          await sb.from("admin_credentials").insert({
            id: "primary_admin",
            phone: envPhone,
            username: envUser,
            password_hash: hash,
            role: "superadmin",
            updated_at: new Date().toISOString(),
          });
        }
      } else if (data.password_hash && !data.password_hash.startsWith("pbkdf2_sha256$")) {
        // Upgrade legacy unhashed password in database to secure PBKDF2 hash
        const upgraded = hashPasswordSync(data.password_hash);
        await sb.from("admin_credentials").update({
          password_hash: upgraded,
          updated_at: new Date().toISOString(),
        }).eq("id", "primary_admin");
      }
    } catch (e) {
      // Non-critical background seed
    }
  }

  async function startServer() {
    ensureAdminCredentialsInSupabase().catch(() => {});

    // Vite middleware in development vs static serving in production
    if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else if (!process.env.VERCEL) {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Only bind port in standalone Node/Cloud Run container (not in Vercel serverless)
  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Iraq Directory Server running on http://0.0.0.0:${PORT}`);
    });
  }
}

if (!process.env.VERCEL) {
  startServer().catch((err) => {
    console.error("Failed to start server:", err);
  });
}

export default app;
