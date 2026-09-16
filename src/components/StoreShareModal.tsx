import React, { useState } from 'react';
import {
  X,
  MessageCircle,
  Instagram,
  Copy,
  Check,
  Download,
  Share2,
  ExternalLink,
  Smartphone,
} from 'lucide-react';
import { DirectoryItem } from '../types/shatrah';

interface StoreShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: DirectoryItem;
}

export const StoreShareModal: React.FC<StoreShareModalProps> = ({
  isOpen,
  onClose,
  item,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentOrigin = window.location.origin;
  const currentPath = window.location.pathname;
  // Deep link targeting the store directly with auto-prompt to install/open the app
  const shareUrl = `${currentOrigin}${currentPath}?storeId=${encodeURIComponent(item.id)}&action=download_app`;
  const locationInfo = item.governorateName
    ? `${item.governorateName} - ${item.districtName || ''}`
    : item.districtName || 'العراق';

  const shareText = `📍 ${item.name} (${item.subCategory || item.category || 'متجر'})\nالموقع: ${locationInfo}\nهاتف: ${item.phone}\n\n📲 حمّل وافتح تطبيق دليل العراق لتصفح هذا المتجر والتواصل المباشر معه:\n${shareUrl}`;

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareText);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = shareText;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (e) {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  // 1. WhatsApp Sharing
  const handleShareWhatsApp = () => {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  // 2. Facebook Messenger Chat Sharing (فتح محادثات ماسنجر مباشرة للمشاركة)
  const handleShareMessenger = async () => {
    // Copy store info & link to clipboard first
    await handleCopyLink();

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
      // Open Messenger app chat share picker directly
      window.location.href = `fb-messenger://share/?link=${encodeURIComponent(shareUrl)}`;
      // Fallback to Messenger chats if app is not intercepted
      setTimeout(() => {
        window.open('https://www.messenger.com/new', '_blank', 'noopener,noreferrer');
      }, 1200);
    } else {
      // Desktop: Open Messenger chat composer directly (not Facebook feed/post)
      window.open('https://www.messenger.com/new', '_blank', 'noopener,noreferrer');
    }
  };

  // 3. Instagram Direct Message Sharing (فتح محادثات الرسائل الخاصة DM مباشرة)
  const handleShareInstagram = async () => {
    // Copy text & link first so user can easily paste into Instagram DM chat
    await handleCopyLink();

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
      // Open Instagram app Direct Messages inbox directly
      window.location.href = 'instagram://direct-inbox';
      // Fallback to Instagram DM web inbox if app is not intercepted
      setTimeout(() => {
        window.open('https://www.instagram.com/direct/inbox/', '_blank', 'noopener,noreferrer');
      }, 1200);
    } else {
      // Desktop: Open Instagram Direct Messages inbox directly (not Instagram home feed)
      window.open('https://www.instagram.com/direct/inbox/', '_blank', 'noopener,noreferrer');
    }
  };

  // 4. Native OS Share (if available)
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${item.name} | تطبيق دليل العراق`,
          text: `📍 تصفح متجر ${item.name} وحمّل تطبيق دليل العراق:\n${shareText}`,
          url: shareUrl,
        });
        return;
      } catch (e) {}
    }
    handleCopyLink();
  };

  return (
    <div 
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 flex flex-col border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-600 border border-sky-200/80">
              <Share2 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-display text-xs sm:text-sm font-black text-slate-900">
                مشاركة متجر {item.name}
              </h3>
              <p className="text-[10px] text-slate-500">
                شارك الرابط وسيطلب من الزائر تحميل التطبيق
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-4 text-right">
          {/* App download notification banner */}
          <div className="flex items-start gap-2.5 rounded-2xl bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200/90 p-3 text-sky-950 shadow-2xs">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white shadow-xs">
              <Smartphone className="h-4 w-4" />
            </div>
            <div className="text-[11px] leading-relaxed">
              <span className="font-bold text-sky-900 block text-xs">
                رابط ذكي يطلب تحميل التطبيق 📲
              </span>
              عند فتح الرابط من قبل أي شخص سيظهر له المتجر مباشرةً مع نافذة تنزيل وتثبيت تطبيق دليل العراق على هاتفه.
            </div>
          </div>

          {/* Social Media Sharing Buttons */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              اختر التطبيق للمشاركة الفورية:
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {/* 1. واتساب WhatsApp */}
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/90 p-3 text-emerald-900 transition-all cursor-pointer active:scale-95 group shadow-2xs"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-xs group-hover:scale-105 transition-transform">
                  <MessageCircle className="h-6 w-6" />
                </div>
                <span className="font-display text-xs font-bold">واتساب</span>
                <span className="text-[9px] text-emerald-700">WhatsApp</span>
              </button>

              {/* 2. ماسنجر Messenger */}
              <button
                type="button"
                onClick={handleShareMessenger}
                className="flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-sky-50 hover:bg-sky-100/80 border border-sky-200/90 p-3 text-sky-900 transition-all cursor-pointer active:scale-95 group shadow-2xs"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-xs group-hover:scale-105 transition-transform">
                  <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.91 1.453 5.518 3.731 7.228V22l3.372-1.854c.91.252 1.88.388 2.897.388 5.523 0 10-4.145 10-9.276C22 6.145 17.523 2 12 2zm1.066 12.443l-2.73-2.912-5.326 2.912 5.86-6.22 2.798 2.912 5.258-2.912-5.86 6.22z"/>
                  </svg>
                </div>
                <span className="font-display text-xs font-bold">ماسنجر</span>
                <span className="text-[9px] text-sky-700">Messenger</span>
              </button>

              {/* 3. انستغرام Instagram */}
              <button
                type="button"
                onClick={handleShareInstagram}
                className="flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-b from-rose-50 to-pink-50 hover:from-rose-100/80 hover:to-pink-100/80 border border-pink-200/90 p-3 text-pink-950 transition-all cursor-pointer active:scale-95 group shadow-2xs"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white shadow-xs group-hover:scale-105 transition-transform">
                  <Instagram className="h-6 w-6" />
                </div>
                <span className="font-display text-xs font-bold">انستغرام</span>
                <span className="text-[9px] text-pink-700">Instagram</span>
              </button>
            </div>
          </div>

          {/* Copy Link Input Section */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-600">
              أو انسخ الرابط المباشر للمتجر مع طلب التنزيل:
            </label>
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-1.5">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 bg-transparent px-2 text-[11px] text-slate-600 font-mono outline-hidden select-all text-left dir-ltr"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer shadow-xs ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>تم النسخ</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>نسخ</span>
                  </>
                )}
              </button>
            </div>
            {copied && (
              <p className="text-[10px] text-emerald-700 font-bold text-center mt-1">
                ✅ تم نسخ نص المشاركة والرابط إلى الحافظة بنجاح!
              </p>
            )}
          </div>

          {/* More sharing options (Native Android / iOS Sheet) */}
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 py-2.5 px-3 text-xs font-bold transition-all cursor-pointer active:scale-98 border border-slate-200"
            >
              <Share2 className="h-4 w-4 text-slate-600" />
              <span>مشاركة عبر تطبيقات أخرى على هاتفك...</span>
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 bg-slate-50/50 p-3 text-center">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 py-2 text-xs font-bold transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
