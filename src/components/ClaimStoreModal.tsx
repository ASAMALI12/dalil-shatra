import React, { useState, useEffect } from 'react';
import {
  X,
  Store,
  User,
  Phone,
  MessageCircle,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  Info,
  Crown,
  Edit3,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useDirectory } from '../context/DirectoryContext';
import { useNotification } from '../context/NotificationContext';
import { DirectoryItem } from '../types/shatrah';

interface ClaimStoreModalProps {
  store?: DirectoryItem | null;
  storeToClaim?: DirectoryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (claimedStore: DirectoryItem) => void;
  onClaimSuccess?: (claimedStore: DirectoryItem) => void;
  onOpenEdit?: (store: DirectoryItem) => void;
}

export const ClaimStoreModal: React.FC<ClaimStoreModalProps> = ({
  store: rawStore,
  storeToClaim,
  isOpen,
  onClose,
  onSuccess,
  onClaimSuccess,
  onOpenEdit,
}) => {
  const store = storeToClaim || rawStore;
  const { registerStoreOwner, refreshFromSupabase, items } = useDirectory();
  const { addNotification } = useNotification();

  // Wizard Step: 'info' | 'verify' | 'success'
  const [step, setStep] = useState<'info' | 'verify' | 'success'>('info');

  const [ownerName, setOwnerName] = useState('');
  const [phoneInput, setPhoneInput] = useState('');

  // WhatsApp OTP Verification state
  const [otpInput, setOtpInput] = useState<string>('');
  const [otpError, setOtpError] = useState<string>('');
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false);
  const [resendTimer, setResendTimer] = useState<number>(0);
  const [claimedStoreResult, setClaimedStoreResult] = useState<DirectoryItem | null>(null);

  // Initialize phone from store if available
  useEffect(() => {
    if (store && isOpen) {
      setPhoneInput(store.phone || '');
      setOwnerName(store.claimedByName || '');
      setStep('info');
      setOtpInput('');
      setOtpError('');
    }
  }, [store, isOpen]);

  // Timer countdown for OTP resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendTimer > 0) {
      timer = setTimeout(() => setResendTimer((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendTimer]);

  if (!isOpen || !store) return null;

  // Step 1 -> Step 2: Verify phone and send WhatsApp OTP
  const handleProceedToOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');

    if (!ownerName.trim()) {
      alert('يرجى إدخال اسمك الكريم (صاحب المتجر)');
      return;
    }
    if (!phoneInput.trim()) {
      alert('يرجى إدخال رقم الهاتف المسجل للمتجر لتأكيد الملكية');
      return;
    }

    // Clean phone numbers to compare
    const cleanStorePhone = store.phone.replace(/[^0-9]/g, '');
    const cleanInputPhone = phoneInput.replace(/[^0-9]/g, '');

    const isMatch =
      cleanStorePhone.endsWith(cleanInputPhone.slice(-8)) ||
      cleanInputPhone.endsWith(cleanStorePhone.slice(-8)) ||
      cleanStorePhone === cleanInputPhone;

    if (!isMatch) {
      alert(
        `رقم الهاتف الذي أدخلته (${phoneInput}) لا يطابق رقم الهاتف المسجل لهذا المتجر في الدليل (${store.phone})!\nيجب تأكيد نفس رقم هاتف المتجر للمطالبة بملكيته.`
      );
      return;
    }

    // Call backend OTP generation endpoint
    setIsSendingOtp(true);
    fetch('/api/claim/request-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storeId: store.id,
        storeName: store.name,
        storePhone: store.phone,
        applicantName: ownerName.trim(),
        applicantPhone: phoneInput.trim(),
      }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        setIsSendingOtp(false);
        if (!res.ok || !data.success) {
          alert(data.error || 'تعذر إرسال رمز التحقق عبر الواتساب. يرجى مراجعة إدارة الدليل.');
          return;
        }

        setOtpInput('');
        setOtpError('');
        setResendTimer(60);
        setStep('verify');
      })
      .catch(() => {
        setIsSendingOtp(false);
        alert('فشل الاتصال بالخادم لإرسال رمز التحقق. يرجى التحقق من اتصال الإنترنت والمحاولة مجدداً.');
      });
  };

  // Resend OTP
  const handleResendOtp = () => {
    if (resendTimer > 0) return;
    setIsSendingOtp(true);
    fetch('/api/claim/request-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storeId: store.id,
        storeName: store.name,
        storePhone: store.phone,
        applicantName: ownerName.trim(),
        applicantPhone: phoneInput.trim(),
      }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        setIsSendingOtp(false);
        if (!res.ok || !data.success) {
          setOtpError(data.error || 'تعذر إعادة إرسال رمز التحقق.');
          return;
        }
        setOtpInput('');
        setOtpError('');
        setResendTimer(60);
      })
      .catch(() => {
        setIsSendingOtp(false);
        setOtpError('فشل الاتصال بالخادم لإعادة إرسال رمز التحقق.');
      });
  };

  // Verify OTP and complete claiming
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');

    const cleanOtp = otpInput.trim();
    if (cleanOtp.length !== 6) {
      setOtpError('يرجى إدخال رمز التحقق المكون من 6 أرقام بالكامل.');
      return;
    }

    let resultData: any = null;

    try {
      const resp = await fetch('/api/claim/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: store.id,
          applicantName: ownerName.trim(),
          applicantPhone: phoneInput.trim(),
          otp: cleanOtp,
        }),
      });

      resultData = await resp.json().catch(() => ({}));
      if (!resp.ok || !resultData?.success) {
        setOtpError(resultData?.error || 'رمز التحقق غير صحيح أو انتهت صلاحيته.');
        return;
      }
    } catch {
      setOtpError('تعذر الاتصال بالخادم للتحقق من رمز OTP. يرجى التحقق من اتصال الإنترنت.');
      return;
    }

    // Only after real OTP verification succeeded on server:
    registerStoreOwner(store.id);
    await refreshFromSupabase();

    const serverVerifiedStore: DirectoryItem = resultData.store
      ? { ...store, ...resultData.store }
      : (items.find((i) => i.id === store.id) || store);

    setClaimedStoreResult(serverVerifiedStore);
    setStep('success');

    // Trigger celebration confetti
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
    });

    // Broadcast system notification
    addNotification({
      title: `👑 تم توثيق ملكية متجر: ${store.name}`,
      message: `قام السيد (${ownerName}) بتأكيد رقم الهاتف وتوثيق ملكيته الرسمية لمتجر ${store.name} في دليل العراق.`,
      type: 'store',
      targetId: store.id,
      targetType: 'store',
      badge: 'توثيق ملكية',
      imageUrl: store.imageUrl,
    });

    if (onSuccess) {
      onSuccess(serverVerifiedStore);
    }
    if (onClaimSuccess) {
      onClaimSuccess(serverVerifiedStore);
    }
  };

  const handleClose = () => {
    setStep('info');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="border-b border-slate-200 p-4 bg-gradient-to-r from-amber-600 via-amber-700 to-red-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 text-white shadow-inner">
              <Crown className="h-5 w-5 text-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-base sm:text-lg font-bold">
                  المطالبة بملكية المتجر
                </h3>
                <span className="rounded-full bg-amber-300/30 border border-amber-300/50 px-2 py-0.5 text-[10px] font-bold text-amber-100 flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  توثيق المالك الحقيقي
                </span>
              </div>
              <p className="text-[11px] text-amber-100">
                تأكيد رقم الهاتف المسجل عبر الواتساب لتولي إدارة المتجر والعروض
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Wizard Progress */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-2.5 text-xs font-bold text-slate-500">
          <div className={`flex items-center gap-1.5 ${step === 'info' ? 'text-amber-700 font-extrabold' : 'text-emerald-600'}`}>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-current text-[11px] text-white">1</span>
            <span>بيانات المالك ورقم الهاتف</span>
          </div>
          <div className="h-0.5 w-8 bg-slate-200" />
          <div className={`flex items-center gap-1.5 ${step === 'verify' ? 'text-amber-700 font-extrabold' : step === 'success' ? 'text-emerald-600' : 'text-slate-400'}`}>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-current text-[11px] text-white">2</span>
            <span>رمز تأكيد الواتساب</span>
          </div>
          <div className="h-0.5 w-8 bg-slate-200" />
          <div className={`flex items-center gap-1.5 ${step === 'success' ? 'text-emerald-600 font-extrabold' : 'text-slate-400'}`}>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-current text-[11px] text-white">3</span>
            <span>اكتمال التوثيق</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-5 space-y-4 flex-1">
          
          {/* Target Store Summary Card */}
          <div className="rounded-2xl border border-amber-200/90 bg-amber-50/50 p-3.5 flex items-center gap-3 shadow-2xs">
            <img
              src={store.imageUrl}
              alt={store.name}
              referrerPolicy="no-referrer"
              className="h-14 w-14 rounded-xl object-cover flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-display text-sm font-bold text-slate-900 truncate">
                  {store.name}
                </h4>
                <span className="rounded-md bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5">
                  متجر حقيقي
                </span>
              </div>
              <p className="text-xs text-slate-600 truncate">{store.subCategory || store.category}</p>
              <div className="flex items-center gap-1 text-xs font-mono font-bold text-red-600 mt-0.5">
                <Phone className="h-3 w-3" />
                <span>الرقم المسجل: {store.phone}</span>
              </div>
            </div>
          </div>

          {/* STEP 1: OWNER DATA & REGISTERED PHONE */}
          {step === 'info' && (
            <form onSubmit={handleProceedToOtp} className="space-y-4">
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3.5 flex items-start gap-2.5 text-xs text-slate-700">
                <Info className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  جميع المتاجر في دليل العراق حقيقية ولها أصحاب شرعيون. للمطالبة بهذا المتجر وإثبات ملكيتك، يجب أن تؤكد قدرتك على استلام رمز التحقق على <strong>رقم الهاتف المسجل للمتجر ({store.phone})</strong>.
                </p>
              </div>

              {/* Owner Name */}
              <div>
                <label className="mb-1 block font-display text-xs font-bold text-slate-700">
                  اسمك الكامل (المالك / المدير) *
                </label>
                <div className="relative flex items-center">
                  <User className="absolute right-3 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="مثال: أحمد الشطري"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-9 pl-3 text-xs font-semibold text-slate-800 focus:border-amber-500 focus:bg-white focus:outline-none"
                    autoFocus
                  />
                </div>
              </div>

              {/* Phone Input with fast auto-fill */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-display text-xs font-bold text-slate-700">
                    رقم هاتف المتجر للتأكيد *
                  </label>
                  <button
                    type="button"
                    onClick={() => setPhoneInput(store.phone)}
                    className="text-[11px] text-amber-700 hover:underline font-bold cursor-pointer"
                  >
                    تعبئة رقم المتجر المسجل ⚡
                  </button>
                </div>
                <div className="relative flex items-center">
                  <Phone className="absolute right-3 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    type="tel"
                    required
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder={store.phone}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-9 pl-3 text-xs font-mono font-bold text-slate-800 focus:border-amber-500 focus:bg-white focus:outline-none text-left"
                    dir="ltr"
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  سنرسل كود التحقق المكون من 6 أرقام عبر تطبيق الواتساب إلى هذا الرقم للتأكد.
                </span>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSendingOtp}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-700 to-red-600 py-3.5 font-display text-xs sm:text-sm font-bold text-white shadow-md hover:from-amber-700 hover:to-red-700 disabled:opacity-60 active:scale-95 transition-all cursor-pointer"
              >
                <span>{isSendingOtp ? 'جاري طلب رمز التحقق...' : 'إرسال رمز التوثيق إلى رقم الواتساب'}</span>
                <ArrowRight className="h-4 w-4 rotate-180" />
              </button>
            </form>
          )}

          {/* STEP 2: WHATSAPP OTP VERIFICATION */}
          {step === 'verify' && (
            <div className="space-y-4 py-2">
              
              {/* WhatsApp Notice Card */}
              <div className="rounded-2xl border border-emerald-300 bg-emerald-50/90 p-4 text-emerald-950 shadow-xs animate-in slide-in-from-top-3 duration-300">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                    <MessageCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-display text-xs font-bold text-emerald-900 block">
                      تم إرسال رمز التحقق عبر الواتساب (WhatsApp)
                    </span>
                    <span className="text-[11px] text-emerald-700">
                      إلى الرقم المسجل: {phoneInput}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-emerald-800 leading-relaxed">
                  مرحباً بك <strong>{ownerName}</strong>، تم إرسال كود تأكيد ملكية متجر <strong>"{store.name}"</strong> المكون من 6 أرقام إلى حسابك في تطبيق الواتساب. يرجى فتح الواتساب وإدخال الرمز أدناه لتأكيد الملكية.
                </p>
              </div>

              {/* Form to enter OTP */}
              <form onSubmit={handleVerifyOtp} className="space-y-4 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 shadow-inner">
                  <ShieldCheck className="h-7 w-7" />
                </div>

                <div>
                  <h4 className="font-display text-base font-bold text-slate-900">
                    أدخل كود التحقق المرسل إلى {phoneInput}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    أدخل الرمز المكون من 6 أرقام لتأكيد ملكية رقم الهاتف والمتجر
                  </p>
                </div>

                {/* 6-digit input */}
                <div className="space-y-2 max-w-xs mx-auto">
                  <input
                    type="text"
                    maxLength={6}
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••••"
                    className="w-full text-center rounded-2xl border-2 border-slate-300 bg-slate-50 py-3 font-mono text-2xl sm:text-3xl font-extrabold tracking-widest text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                    autoFocus
                  />

                  {otpError && (
                    <p className="text-xs font-bold text-red-600 flex items-center justify-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                      <span>{otpError}</span>
                    </p>
                  )}
                </div>

                {/* Resend OTP button */}
                <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-500">
                  {resendTimer > 0 ? (
                    <span>إعادة إرسال الكود بعد ({resendTimer} ثانية)</span>
                  ) : (
                    <button
                      type="button"
                      disabled={isSendingOtp}
                      onClick={handleResendOtp}
                      className="flex items-center gap-1 text-amber-700 hover:underline font-bold disabled:opacity-50 cursor-pointer"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${isSendingOtp ? 'animate-spin' : ''}`} />
                      <span>{isSendingOtp ? 'جاري إعادة الإرسال...' : 'إعادة إرسال كود الواتساب'}</span>
                    </button>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep('info')}
                    className="flex-1 rounded-2xl border border-slate-200 bg-white py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    رجوع
                  </button>

                  <button
                    type="submit"
                    disabled={otpInput.trim().length !== 6}
                    className="flex-2 flex items-center justify-center gap-2 rounded-2xl bg-amber-600 py-3 font-display text-xs sm:text-sm font-bold text-white shadow-md hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    <Crown className="h-4 w-4" />
                    <span>تأكيد ملكية المتجر رسمياً 👑</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 3: SUCCESS CONFIRMATION */}
          {step === 'success' && claimedStoreResult && (
            <div className="py-4 text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-lg">
                <CheckCircle2 className="h-10 w-10" />
              </div>

              <div>
                <h4 className="font-display text-lg sm:text-xl font-bold text-slate-900">
                  مبروك! أصبحت المالك المعتمد لمتجر "{claimedStoreResult.name}" 👑
                </h4>
                <p className="text-xs text-slate-600 max-w-xs mx-auto mt-1">
                  تم توثيق وتأكيد رقم الهاتف بنجاح باسم <strong>({ownerName})</strong>. يمكنك الآن تعديل بيانات المتجر، إضافة عروض حصرية، ونشر التحديثات.
                </p>
              </div>

              {/* Owner Badge Preview */}
              <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50/70 p-4 text-right flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold">
                    ✓
                  </div>
                  <div>
                    <h5 className="font-display text-xs sm:text-sm font-bold text-emerald-950">
                      شارة متجر موثق لمالكه الرسمي
                    </h5>
                    <p className="text-[11px] text-emerald-800">
                      المالك: {ownerName} • الهاتف: {claimedStoreResult.phone}
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-200 text-emerald-900 px-2.5 py-1 text-[10px] font-bold">
                  موثق 👑
                </span>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                {onOpenEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      handleClose();
                      onOpenEdit(claimedStoreResult);
                    }}
                    className="flex items-center justify-center gap-1.5 rounded-2xl bg-emerald-600 py-3 font-display text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition-all cursor-pointer"
                  >
                    <Edit3 className="h-4 w-4" />
                    <span>تعديل بيانات المتجر الآن ✏️</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-2xl bg-slate-900 py-3 font-display text-xs font-bold text-white hover:bg-slate-800 transition-all cursor-pointer"
                >
                  إغلاق وتصفح المتجر
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
