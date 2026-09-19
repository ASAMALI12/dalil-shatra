/**
 * معالج الروابط والحسابات الاجتماعية للمتاجر
 * يضمن فتح حسابات إنستغرام وفيسبوك وتيك توك وتيليجرام بدون أي شاشة بيضاء
 * ويفتح الصفحة المحددة للمتجر مباشرة في تطبيق الهاتف الرسمي أو المتصفح
 */
import { Capacitor } from '@capacitor/core';
import { AppLauncher } from '@capacitor/app-launcher';
import { Browser } from '@capacitor/browser';

export type SocialPlatform = 'instagram' | 'facebook' | 'tiktok' | 'telegram' | 'whatsapp' | 'website';

export interface SocialAccountDetails {
  platform: SocialPlatform;
  rawValue: string;
  cleanHandle: string;
  displayHandle: string;
  appDeepLink: string;
  androidIntent: string;
  webUrl: string;
  searchUrl: string;
  platformName: string;
  storeName: string;
  isNumeric?: boolean;
  numericId?: string;
}

/**
 * فحص ما إذا كانت السلسلة النصية تحتوي على حروف عربية أو مسافات
 */
function hasArabicOrSpaces(str: string): boolean {
  return /[\u0600-\u06FF\s]/.test(str);
}

/**
 * تنظيف وتنسيق رابط فيسبوك
 */
export function formatFacebookUrl(value?: string | null): string {
  if (!value) return '';
  let trimmed = value.trim();
  if (!trimmed) return '';

  trimmed = trimmed.replace(/^@+/, '');

  if (hasArabicOrSpaces(trimmed)) {
    return `https://www.facebook.com/search/top/?q=${encodeURIComponent(trimmed)}`;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed
      .replace(/^http:\/\//i, 'https://')
      .replace(/^https:\/\/(?:m\.|mobile\.)/i, 'https://www.')
      .replace(/^https:\/\/facebook\.com/i, 'https://www.facebook.com')
      .replace(/^https:\/\/fb\.com/i, 'https://www.facebook.com');
  }

  if (/^(?:www\.|m\.)?(?:facebook|fb)\.com\//i.test(trimmed)) {
    const cleanPath = trimmed.replace(/^(?:www\.|m\.)?(?:facebook|fb)\.com\//i, '');
    return `https://www.facebook.com/${cleanPath}`;
  }

  if (trimmed.startsWith('profile.php?id=')) {
    return `https://www.facebook.com/${trimmed}`;
  }

  // Numeric Facebook ID - must use profile.php?id= to avoid 404 or redirect to home feed
  if (/^\d+$/.test(trimmed)) {
    return `https://www.facebook.com/profile.php?id=${trimmed}`;
  }

  const cleanHandle = trimmed.replace(/^\/+/, '').replace(/\/+$/, '');
  return `https://www.facebook.com/${cleanHandle}/`;
}

/**
 * تنظيف وتنسيق رابط إنستغرام
 */
export function formatInstagramUrl(value?: string | null): string {
  if (!value) return '';
  let trimmed = value.trim();
  if (!trimmed) return '';

  trimmed = trimmed.replace(/^@+/, '');

  if (hasArabicOrSpaces(trimmed)) {
    return `https://www.instagram.com/explore/tags/${encodeURIComponent(trimmed.replace(/\s+/g, ''))}/`;
  }

  let username = trimmed;
  if (/instagram\.com/i.test(trimmed)) {
    const match = trimmed.match(/instagram\.com\/(?:_u\/)?([a-zA-Z0-9._]+)/i);
    if (match && match[1]) {
      username = match[1];
    } else {
      username = trimmed
        .replace(/^https?:\/\/(?:www\.)?instagram\.com\//i, '')
        .split('/')[0]
        .split('?')[0];
    }
  } else {
    username = trimmed.split('/')[0].split('?')[0];
  }

  username = username.trim().replace(/^@+/, '');
  if (!username) return '';

  return `https://www.instagram.com/${username}/`;
}

export function formatTikTokUrl(value?: string | null): string {
  if (!value) return '';
  let trimmed = value.trim();
  if (!trimmed) return '';

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (/^(?:www\.)?tiktok\.com\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }

  const cleanHandle = trimmed.startsWith('@') ? trimmed : `@${trimmed}`;
  return `https://www.tiktok.com/${cleanHandle}`;
}

export function formatTelegramUrl(value?: string | null): string {
  if (!value) return '';
  let trimmed = value.trim().replace(/^@+/, '');
  if (!trimmed) return '';

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (/^(?:www\.)?t\.me\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }

  const cleanHandle = trimmed.replace(/^@/, '');
  return `https://t.me/${cleanHandle}`;
}

export function formatWebsiteUrl(value?: string | null): string {
  if (!value) return '';
  let trimmed = value.trim();
  if (!trimmed) return '';

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

/**
 * الحصول على تفاصيل الحساب الاجتماعي كاملة وروابط التطبيق والويب
 */
export function getSocialAccountDetails(
  platform: SocialPlatform,
  rawValue: string,
  storeName: string = ''
): SocialAccountDetails {
  const trimmed = rawValue.trim();

  if (platform === 'instagram') {
    let handle = trimmed.replace(/^@+/, '');
    if (/instagram\.com/i.test(trimmed)) {
      const match = trimmed.match(/instagram\.com\/(?:_u\/)?([a-zA-Z0-9._]+)/i);
      if (match && match[1]) {
        handle = match[1];
      } else {
        handle = trimmed.replace(/^https?:\/\/(?:www\.)?instagram\.com\//i, '').split('/')[0].split('?')[0];
      }
    }
    handle = handle.split('/')[0].split('?')[0].replace(/^@+/, '');

    const webUrl = `https://www.instagram.com/${handle}/`;
    // رابط التطبيق الرسمي المعتمد في أندرويد وiOS الذي يفتح الملف الشخصي للمتجر مباشرة
    const appDeepLink = `https://instagram.com/_u/${handle}`;
    const androidIntent = `https://instagram.com/_u/${handle}`;
    const searchUrl = `https://www.instagram.com/explore/tags/${encodeURIComponent((storeName || handle).replace(/\s+/g, ''))}/`;

    return {
      platform: 'instagram',
      rawValue,
      cleanHandle: handle,
      displayHandle: `@${handle}`,
      appDeepLink,
      androidIntent,
      webUrl,
      searchUrl,
      platformName: 'إنستغرام',
      storeName,
    };
  }

  if (platform === 'facebook') {
    let clean = trimmed.replace(/^@+/, '');
    let isNumeric = false;
    let numericId = '';

    if (/facebook\.com/i.test(trimmed) || /fb\.com/i.test(trimmed)) {
      const idMatch = trimmed.match(/profile\.php\?id=(\d+)/i) || trimmed.match(/page\.php\?id=(\d+)/i);
      if (idMatch && idMatch[1]) {
        isNumeric = true;
        numericId = idMatch[1];
        clean = numericId;
      } else {
        clean = trimmed
          .replace(/^https?:\/\/(?:www\.|m\.)?(?:facebook|fb)\.com\//i, '')
          .split('/')[0]
          .split('?')[0];
        if (/^\d+$/.test(clean)) {
          isNumeric = true;
          numericId = clean;
        }
      }
    } else if (/^\d+$/.test(clean)) {
      isNumeric = true;
      numericId = clean;
    }

    const webUrl = formatFacebookUrl(trimmed);
    // إذا كان الحساب يحمل معرفاً رقمياً، نستخدم fb://page/{numericId} المعتمد داخل تطبيق فيسبوك
    // أما إذا كان اسم مستخدم (مثل royalcity.cafe)، فنعتمد الرابط المباشر webUrl
    // لأن بروتوكول fb://facewebmodal أصبح معطلاً في فيسبوك وينقل المستخدم للصفحة الرئيسية بدلاً من صفحة المتجر!
    const appDeepLink = isNumeric ? `fb://page/${numericId}` : webUrl;
    const androidIntent = webUrl;
    const searchUrl = `https://www.facebook.com/search/top/?q=${encodeURIComponent(storeName || clean)}`;

    return {
      platform: 'facebook',
      rawValue,
      cleanHandle: clean,
      displayHandle: clean,
      appDeepLink,
      androidIntent,
      webUrl,
      searchUrl,
      platformName: 'فيسبوك',
      storeName,
      isNumeric,
      numericId,
    };
  }

  if (platform === 'whatsapp') {
    const cleanPhone = trimmed.replace(/\D/g, '');
    const webUrl = `https://wa.me/${cleanPhone}`;
    const appDeepLink = `whatsapp://send?phone=${cleanPhone}`;
    const androidIntent = webUrl;

    return {
      platform: 'whatsapp',
      rawValue,
      cleanHandle: cleanPhone,
      displayHandle: cleanPhone,
      appDeepLink,
      androidIntent,
      webUrl,
      searchUrl: webUrl,
      platformName: 'واتساب',
      storeName,
    };
  }

  if (platform === 'telegram') {
    const handle = trimmed.replace(/^@+/, '').replace(/^https?:\/\/(?:www\.)?t\.me\//i, '');
    const webUrl = `https://t.me/${handle}`;
    const appDeepLink = `tg://resolve?domain=${handle}`;
    const androidIntent = webUrl;

    return {
      platform: 'telegram',
      rawValue,
      cleanHandle: handle,
      displayHandle: `@${handle}`,
      appDeepLink,
      androidIntent,
      webUrl,
      searchUrl: `https://t.me/s/${handle}`,
      platformName: 'تيليجرام',
      storeName,
    };
  }

  if (platform === 'tiktok') {
    const handle = trimmed.replace(/^@+/, '').replace(/^https?:\/\/(?:www\.)?tiktok\.com\/@?/i, '');
    const webUrl = `https://www.tiktok.com/@${handle}`;
    const appDeepLink = `snssdk1233://user/profile/${handle}`;
    const androidIntent = webUrl;

    return {
      platform: 'tiktok',
      rawValue,
      cleanHandle: handle,
      displayHandle: `@${handle}`,
      appDeepLink,
      androidIntent,
      webUrl,
      searchUrl: `https://www.tiktok.com/search?q=${encodeURIComponent(storeName || handle)}`,
      platformName: 'تيك توك',
      storeName,
    };
  }

  // website
  const webUrl = formatWebsiteUrl(trimmed);
  return {
    platform: 'website',
    rawValue,
    cleanHandle: trimmed,
    displayHandle: trimmed,
    appDeepLink: webUrl,
    androidIntent: webUrl,
    webUrl,
    searchUrl: webUrl,
    platformName: 'الموقع الإلكتروني',
    storeName,
  };
}

/**
 * فتح الرابط الاجتماعي مباشرة وبشكل آمن تماماً
 * يضمن عدم تحول الشاشة إلى بيضاء، ويفتح الصفحة المحددة للمتجر
 * في التطبيق الرسمي أو في متصفح خارجي
 */
export async function openSocialMediaLink(
  platform: SocialPlatform,
  rawValue: string,
  storeName?: string,
  e?: React.MouseEvent | { preventDefault?: () => void; stopPropagation?: () => void; defaultPrevented?: boolean }
): Promise<void> {
  if (e && typeof e.stopPropagation === 'function') {
    e.stopPropagation();
  }

  if (!rawValue) return;

  const details = getSocialAccountDetails(platform, rawValue, storeName);
  const webUrl = details.webUrl;
  if (!webUrl) return;

  const isNative = Capacitor.isNativePlatform();

  // 1. في حال تشغيل التطبيق كـ APK مثبت على الهاتف (Capacitor Android / iOS)
  if (isNative) {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }

    // لفيسبوك تحديداً:
    if (platform === 'facebook') {
      // إذا كان معرف صفحة رقمي، يمكن للتطبيق الرسمي فتحه مباشرة عبر fb://page/{numericId}
      if (details.isNumeric && details.numericId) {
        try {
          const res = await AppLauncher.openUrl({ url: `fb://page/${details.numericId}` });
          if (res && res.completed) {
            return;
          }
        } catch (err) {
          console.warn('Facebook numeric page launch failed:', err);
        }
        try {
          const res = await AppLauncher.openUrl({ url: `fb://profile/${details.numericId}` });
          if (res && res.completed) {
            return;
          }
        } catch (err) {
          console.warn('Facebook numeric profile launch failed:', err);
        }
      }

      // لجميع الحسابات الأخرى بأسماء المستخدمين (مثل royalcity.cafe أو Bestoon.Samad.Restaurant):
      // لا نستخدم بروتوكول fb://facewebmodal نهائياً لأنه يفتح الصفحة الرئيسية للمستخدم (News Feed) بدلاً من صفحة المتجر!
      // نقوم بفتح صفحة المتجر المباشرة webUrl عبر متصفح النظام / كاستم تابز
      // هذا يضمن 100% أن المستخدم يرى صفحة المتجر الفعلية بكل تفاصيلها وصورها ومنشوراتها
      try {
        await Browser.open({
          url: webUrl,
          windowName: '_system',
        });
        return;
      } catch (err) {
        console.warn('Browser.open for Facebook failed:', err);
      }
      return;
    }

    // لباقي المنصات (إنستغرام، واتساب، تيليجرام، تيك توك):
    // محاولة تشغيل التطبيق الرسمي برابط الديب لينك المعتمد أولاً
    if (details.appDeepLink) {
      try {
        const res = await AppLauncher.openUrl({ url: details.appDeepLink });
        if (res && res.completed) {
          return;
        }
      } catch (err) {
        console.warn('AppLauncher primary deepLink failed:', err);
      }
    }

    // إذا لم يكن التطبيق الرسمي مثبتاً على الهاتف، يتم الفتح عبر متصفح النظام الخارجي (Browser)
    // لا يغلق التطبيق، لا يحول الشاشة لبيضاء، ويتيح للمستخدم رؤية صفحة المتجر كاملة
    try {
      await Browser.open({
        url: webUrl,
        windowName: '_system',
      });
      return;
    } catch (err) {
      console.warn('Browser.open failed:', err);
    }
    return;
  }

  // 2. في متصفح الويب (سواء على الهاتف المحمول Android/iOS أو الكمبيوتر أو المعاينة):
  // إذا تم النقر على وسم <a> أصلي مع target="_blank":
  // نترك المتصفح يقوم بعمله الطبيعي بنسبة 100% دون preventDefault ودون تغيير مسار النافذة الحالية!
  // متصفحات الهواتف الذكية الحديثة تنقل الرابط تلقائياً إلى التطبيق الرسمي إن وجد أو تفتحه في تبويب جديد،
  // مما يضمن بقاء تطبيق دليل العراق يعمل بكفاءة ودون أي شاشة بيضاء.
  if (e && typeof (e as any).target?.closest === 'function' && (e as any).target?.closest('a')) {
    return;
  }

  // إذا تم الاستدعاء برمجياً من زر أو عنصر غير <a>:
  try {
    const newWin = window.open(webUrl, '_blank', 'noopener,noreferrer');
    if (newWin) {
      newWin.focus();
    }
  } catch (err) {
    console.warn('window.open failed:', err);
  }
}

/**
 * فتح الرابط أو التطبيق بذكاء وتجنب الشاشة البيضاء تماماً
 */
export async function launchSocialMedia(params: {
  platform: SocialPlatform;
  rawValue: string;
  storeName?: string;
  mode: 'app' | 'browser' | 'search';
}): Promise<{ success: boolean; launchedApp: boolean }> {
  const details = getSocialAccountDetails(params.platform, params.rawValue, params.storeName);
  const isNative = Capacitor.isNativePlatform();

  // 1. في حال طلب البحث بالاسم
  if (params.mode === 'search') {
    if (isNative) {
      try {
        await Browser.open({ url: details.searchUrl, windowName: '_system' });
        return { success: true, launchedApp: false };
      } catch {
        return { success: false, launchedApp: false };
      }
    }
    try {
      window.open(details.searchUrl, '_blank', 'noopener,noreferrer');
    } catch {}
    return { success: true, launchedApp: false };
  }

  // 2. في حال طلب فتح متصفح الويب صراحة
  if (params.mode === 'browser') {
    if (isNative) {
      try {
        await Browser.open({ url: details.webUrl, windowName: '_system' });
        return { success: true, launchedApp: false };
      } catch {
        return { success: false, launchedApp: false };
      }
    }
    try {
      window.open(details.webUrl, '_blank', 'noopener,noreferrer');
    } catch {}
    return { success: true, launchedApp: false };
  }

  // 3. في حال طلب فتح التطبيق الرسمي مباشرة (mode === 'app')
  await openSocialMediaLink(params.platform, params.rawValue, params.storeName);
  return { success: true, launchedApp: true };
}

/**
 * فتح الرابط الخارجي بشكل آمن ومنع الشاشة البيضاء
 */
export async function openExternalUrl(
  url: string,
  e?: React.MouseEvent | { preventDefault?: () => void; stopPropagation?: () => void }
): Promise<void> {
  if (e && typeof e.stopPropagation === 'function') {
    e.stopPropagation();
  }

  if (!url) return;

  const isNative = Capacitor.isNativePlatform();

  if (isNative) {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }

    try {
      await Browser.open({
        url,
        windowName: '_system',
      });
      return;
    } catch (err) {
      console.warn('Browser.open failed:', err);
    }
    return;
  }

  if (e && typeof (e as any).target?.closest === 'function' && (e as any).target?.closest('a')) {
    return;
  }

  try {
    const newWin = window.open(url, '_blank', 'noopener,noreferrer');
    if (newWin) {
      newWin.focus();
    }
  } catch (err) {
    console.warn('window.open failed', err);
  }
}
