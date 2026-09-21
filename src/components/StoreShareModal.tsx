import React, { useState } from 'react';
import {
  X,
  MessageCircle,
  Copy,
  Check,
  Share2,
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
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
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentOrigin = window.location.origin;
  // Clean direct store link
  const shareUrl = `${currentOrigin}/store/${encodeURIComponent(item.id)}`;
  const locationInfo = item.governorateName
    ? `${item.governorateName}${item.districtName ? ` - ${item.districtName}` : ''}`
    : item.districtName || 'العراق';

  const shareText = `📍 ${item.name}${item.subCategory ? ` (${item.subCategory})` : ''}\nالموقع: ${locationInfo}\nهاتف: ${item.phone}\n\nرابط المتجر:\n${shareUrl}`;

  // Synchronous clipboard copy
  const copyShareTextToClipboard = (customNotice?: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareText).catch(() => {});
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
    } catch (e) {}
    setCopied(true);
    setStatusNotification(customNotice || 'تم نسخ تفاصيل ورابط المتجر بنجاح ✅');
    setTimeout(() => {
      setCopied(false);
      setStatusNotification(null);
    }, 3500);
  };

  // Safe universal URL launcher (Native Capacitor or Web)
  const openUrlSafely = (url: string) => {
    if (!url) return;
    if (Capacitor.isNativePlatform()) {
      Browser.open({ url, windowName: '_system' }).catch(() => {
        try {
          window.open(url, '_blank', 'noopener,noreferrer');
        } catch (e) {
          window.location.href = url;
        }
      });
      return;
    }
    try {
      const newWin = window.open(url, '_blank', 'noopener,noreferrer');
      if (!newWin || newWin.closed || typeof newWin.closed === 'undefined') {
        window.location.href = url;
      }
    } catch (err) {
      window.location.href = url;
    }
  };

  // WhatsApp Sharing ONLY
  const handleShareWhatsApp = () => {
    copyShareTextToClipboard('تم نسخ التفاصيل! جارٍ فتح واتساب للمشاركة...');
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    openUrlSafely(waUrl);
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
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/80">
              <MessageCircle className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-display text-xs sm:text-sm font-black text-slate-900">
                مشاركة متجر {item.name}
              </h3>
              <p className="text-[10px] text-slate-500">
                المشاركة المباشرة عبر تطبيق واتساب
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
          {/* Main WhatsApp Share Button */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              المشاركة عبر تطبيق واتساب:
            </label>
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="w-full flex items-center justify-between gap-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white p-3.5 transition-all cursor-pointer shadow-md group"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 text-white shadow-inner group-hover:scale-105 transition-transform">
                  <MessageCircle className="h-6 w-6" />
                </div>
                <div className="text-right">
                  <span className="font-display text-sm font-bold block">
                    إرسال ومشاركة عبر واتساب 💬
                  </span>
                  <span className="text-[11px] text-emerald-100 block">
                    إرسال بيانات ورابط المتجر لأي جهة اتصال أو مجموعة
                  </span>
                </div>
              </div>
              <span className="text-xs bg-white/20 px-2.5 py-1 rounded-lg font-bold shrink-0">
                فتح الآن
              </span>
            </button>
          </div>

          {/* Copy Direct Link Section */}
          <div className="space-y-1.5 pt-1">
            <label className="block text-[11px] font-bold text-slate-600">
              أو نسخ رابط المتجر المباشر:
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
                onClick={() => copyShareTextToClipboard()}
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
            {statusNotification && (
              <p className="text-[11px] text-emerald-700 font-bold text-center mt-1 bg-emerald-50 rounded-lg py-1 border border-emerald-200 animate-in fade-in">
                {statusNotification}
              </p>
            )}
          </div>
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
