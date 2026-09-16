import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, CheckCircle2, ArrowRight } from 'lucide-react';

interface InstallAppPromptModalProps {
  storeName?: string;
  onClose: () => void;
}

export const InstallAppPromptModal: React.FC<InstallAppPromptModalProps> = ({
  storeName,
  onClose,
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      setIsInstalling(true);
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setInstallSuccess(true);
          setTimeout(() => {
            onClose();
          }, 2500);
        }
      } catch (err) {
        console.warn('Install prompt error:', err);
      } finally {
        setIsInstalling(false);
        setDeferredPrompt(null);
      }
    } else {
      // Fallback instructions for Android / iPhone
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) {
        alert('لتثبيت التطبيق على جهازك: اضغط على زر المشاركة (Share) في المتصفح ثم اختر "إضافة إلى الشاشة الرئيسية" (Add to Home Screen)');
      } else {
        alert('لتثبيت تطبيق دليل العراق: اضغط على قائمة المتصفح (⋮) أعلى الشاشة واختر "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية"');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col border border-slate-200 text-center p-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 left-3.5 flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* App Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-tr from-sky-600 via-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/30 mb-3.5">
          <Smartphone className="h-8 w-8 text-white" />
        </div>

        {/* Title */}
        <h3 className="font-display text-base sm:text-lg font-black text-slate-900 leading-snug">
          تحميل تطبيق دليل العراق 📲
        </h3>

        {/* Context subtitle */}
        <p className="mt-1.5 text-xs text-slate-600 leading-relaxed font-medium">
          {storeName ? (
            <>
              تمت مشاركة بيانات متجر <span className="font-bold text-sky-700 font-display">«{storeName}»</span> معك. يُنصح بتحميل وتثبيت التطبيق لتجربة أسرع وأسهل والوصول لجميع المتاجر والأطباء بدون متصفح.
            </>
          ) : (
            'حمّل تطبيق دليل العراق على هاتفك للوصول السريع لجميع الأنشطة، الأطباء، والمتاجر في محافظتك وقضائك مباشرة.'
          )}
        </p>

        {/* Benefits list */}
        <div className="my-4 rounded-2xl bg-slate-50 border border-slate-200/80 p-3 text-right space-y-2 text-xs">
          <div className="flex items-center gap-2 text-slate-700 font-semibold">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>تصفح سريع وخفيف على الهاتف</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700 font-semibold">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>اتصال ومراسلة واتساب بلمسة واحدة</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700 font-semibold">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>يعمل كتطبيق أندرويد وآيفون كامل ومستقل</span>
          </div>
        </div>

        {/* Primary CTA Button: Download / Install App */}
        <button
          type="button"
          onClick={handleInstall}
          disabled={isInstalling || installSuccess}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white py-3 px-4 font-display text-sm font-black shadow-md shadow-sky-600/30 transition-all cursor-pointer active:scale-95"
        >
          <Download className="h-4 w-4" />
          <span>{installSuccess ? 'تم التثبيت بنجاح!' : 'تنزيل وتثبيت التطبيق الآن'}</span>
        </button>

        {/* Secondary Button: Continue to Store directly */}
        <button
          type="button"
          onClick={onClose}
          className="mt-2.5 w-full flex items-center justify-center gap-1.5 rounded-xl text-slate-500 hover:text-slate-800 py-2 text-xs font-bold transition-colors cursor-pointer"
        >
          <span>المتابعة إلى المتجر بالمتصفح</span>
          <ArrowRight className="h-3.5 w-3.5 rotate-180" />
        </button>
      </div>
    </div>
  );
};
