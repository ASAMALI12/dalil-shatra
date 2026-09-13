import React from 'react';
import {
  X,
  Megaphone,
  User,
  ShieldCheck,
  PhoneCall,
  Store,
  Wallet,
  Navigation,
  ExternalLink,
  ChevronLeft,
  Sparkles,
} from 'lucide-react';
import { useWallet } from '../context/WalletContext';

interface AppSidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAdModal: () => void;
  onOpenStoreModal: () => void;
  onOpenManagerDashboard: () => void;
  onOpenWalletModal: () => void;
  onDetectGPS: () => void;
}

export const AppSidebarDrawer: React.FC<AppSidebarDrawerProps> = ({
  isOpen,
  onClose,
  onOpenAdModal,
  onOpenStoreModal,
  onOpenManagerDashboard,
  onOpenWalletModal,
  onDetectGPS,
}) => {
  const { isManagerUnlocked, balance } = useWallet();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-xs sm:max-w-sm bg-white h-full shadow-2xl flex flex-col z-10 border-l border-slate-200/80 animate-in slide-in-from-right duration-250">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-slate-900 to-emerald-700 text-white font-bold text-base shadow-xs">
              🇮🇶
            </span>
            <div>
              <h2 className="font-display text-sm font-bold text-slate-900">
                دليل العراق
              </h2>
              <span className="text-[10px] text-slate-400 font-medium">
                دليل الأنشطة والمحافظات
              </span>
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

        {/* Content Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-right">
          {/* Quick CTA: Open Store */}
          <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50 to-teal-50 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-display text-xs font-bold text-emerald-950">
                أضف متجرك أو نشاطك
              </span>
              <span className="rounded-md bg-emerald-200/80 px-1.5 py-0.2 text-[9px] font-bold text-emerald-800">
                مجاناً
              </span>
            </div>
            <p className="text-[11px] text-emerald-800/90 leading-relaxed">
              سجل محلك أو عيادتك في أي قضاء بالعراق ليصلك زبائن منطقتك مباشرة عبر الواتساب والاتصال.
            </p>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenStoreModal();
              }}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-2 text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Store className="h-3.5 w-3.5" />
              <span>فتح متجر جديد 💬</span>
            </button>
          </div>

          {/* Navigation Links List */}
          <div className="space-y-1">
            {/* 1. الإعلانات التجارية */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAdModal();
              }}
              className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-slate-50 transition-colors text-slate-800 cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-200/80 group-hover:scale-105 transition-transform">
                  <Megaphone className="h-4 w-4" />
                </div>
                <div className="text-right">
                  <div className="font-display text-xs font-bold text-slate-800 group-hover:text-amber-700 transition-colors">
                    الإعلانات والرعاية التجارية
                  </div>
                  <div className="text-[10px] text-slate-400">
                    باقات الإعلانات والإشعار الموجه
                  </div>
                </div>
              </div>
              <ChevronLeft className="h-4 w-4 text-slate-400 group-hover:text-slate-600" />
            </button>

            {/* 2. كشف الموقع عبر GPS */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onDetectGPS();
              }}
              className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-slate-50 transition-colors text-slate-800 cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 group-hover:scale-105 transition-transform">
                  <Navigation className="h-4 w-4" />
                </div>
                <div className="text-right">
                  <div className="font-display text-xs font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">
                    تحديد موقعي التلقائي (GPS)
                  </div>
                  <div className="text-[10px] text-slate-400">
                    الانتقال مباشرةً لمحافظتي وقضائي
                  </div>
                </div>
              </div>
              <ChevronLeft className="h-4 w-4 text-slate-400 group-hover:text-slate-600" />
            </button>

            {/* 3. إدارة الدليل / لوحة تحكم المدير (تظهر فقط عند تسجيل دخول المدير) */}
            {isManagerUnlocked && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenManagerDashboard();
                }}
                className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 bg-amber-50/70 border border-amber-200/80 hover:bg-amber-100/70 transition-colors text-slate-800 cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl border group-hover:scale-105 transition-transform bg-amber-500 text-white border-amber-400">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div className="text-right">
                    <div className="font-display text-xs font-bold text-amber-900 group-hover:text-amber-700 transition-colors">
                      لوحة تحكم المدير (مفتوحة)
                    </div>
                    <div className="text-[10px] text-amber-700/80">
                      استيراد، إدارة المتاجر والتوثيق والإعلانات
                    </div>
                  </div>
                </div>
                <ChevronLeft className="h-4 w-4 text-amber-500 group-hover:text-amber-700" />
              </button>
            )}

            {/* محفظة المدير المالية (فقط إذا كان المدير مسجل دخول) */}
            {isManagerUnlocked && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenWalletModal();
                }}
                className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 bg-amber-50/70 border border-amber-200/80 hover:bg-amber-100/70 transition-colors text-slate-800 cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs">
                    <Wallet className="h-4 w-4" />
                  </div>
                  <div className="text-right">
                    <div className="font-display text-xs font-bold text-amber-900">
                      محفظة الأرباح المالية
                    </div>
                    <div className="text-[10px] text-amber-700 font-semibold">
                      الرصيد: {balance.toLocaleString('ar-IQ')} د.ع
                    </div>
                  </div>
                </div>
                <ChevronLeft className="h-4 w-4 text-amber-600" />
              </button>
            )}
          </div>

          {/* أرقام الطوارئ العراقية الرسمية */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <PhoneCall className="h-3.5 w-3.5 text-rose-600" />
              <span>أرقام الطوارئ العراقية المباشرة</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center text-xs font-bold">
              <a
                href="tel:104"
                className="rounded-xl bg-white border border-slate-200/80 py-2 px-1 text-slate-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition-colors shadow-2xs"
              >
                <div className="text-[10px] text-slate-400 font-medium">شرطة النجدة</div>
                <div className="font-display text-sm text-rose-600">104 🚨</div>
              </a>
              <a
                href="tel:115"
                className="rounded-xl bg-white border border-slate-200/80 py-2 px-1 text-slate-700 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 transition-colors shadow-2xs"
              >
                <div className="text-[10px] text-slate-400 font-medium">الدفاع المدني</div>
                <div className="font-display text-sm text-amber-600">115 🚒</div>
              </a>
              <a
                href="tel:122"
                className="rounded-xl bg-white border border-slate-200/80 py-2 px-1 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-colors shadow-2xs"
              >
                <div className="text-[10px] text-slate-400 font-medium">الإسعاف الفوري</div>
                <div className="font-display text-sm text-emerald-600">122 🚑</div>
              </a>
              <a
                href="tel:131"
                className="rounded-xl bg-white border border-slate-200/80 py-2 px-1 text-slate-700 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-200 transition-colors shadow-2xs"
              >
                <div className="text-[10px] text-slate-400 font-medium">الأمن الوطني</div>
                <div className="font-display text-sm text-sky-600">131 🛡️</div>
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 text-center">
          <span className="text-[10px] text-slate-400">
            منصة العراق الموحدة للمحافظات والأقضية
          </span>
        </div>
      </div>
    </div>
  );
};
