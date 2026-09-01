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
  MapPin,
  Clock,
  Sparkles,
  ArrowRight,
  Send,
  Camera,
  RefreshCw,
  ExternalLink,
  Info,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useDirectory } from '../context/DirectoryContext';
import { useNotification } from '../context/NotificationContext';
import { DirectoryItem } from '../types/shatrah';

interface OpenStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStoreCreated?: (store: DirectoryItem) => void;
}

export const OpenStoreModal: React.FC<OpenStoreModalProps> = ({
  isOpen,
  onClose,
  onStoreCreated,
}) => {
  const { categories, addStore } = useDirectory();
  const { broadcastNewStoreNotification } = useNotification();

  // Wizard Step: 'info' | 'verify' | 'success'
  const [step, setStep] = useState<'info' | 'verify' | 'success'>('info');

  // Form Fields
  const [ownerName, setOwnerName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [category, setCategory] = useState('restaurants');
  const [subCategory, setSubCategory] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('مدينة الشطرة - السوق التجاري');
  const [workingHours, setWorkingHours] = useState('9:00 ص - 11:00 م');
  const [description, setDescription] = useState('');
  const [selectedImage, setSelectedImage] = useState(
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80'
  );

  // WhatsApp OTP Verification state
  const [generatedOtp, setGeneratedOtp] = useState<string>('');
  const [otpInput, setOtpInput] = useState<string>('');
  const [otpError, setOtpError] = useState<string>('');
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false);
  const [resendTimer, setResendTimer] = useState<number>(0);
  const [showSimulatedWhatsAppAlert, setShowSimulatedWhatsAppAlert] = useState<boolean>(false);
  const [createdStore, setCreatedStore] = useState<DirectoryItem | null>(null);

  // Preset Image Options for Shatrah businesses
  const sampleImages = [
    { label: 'مطعم ومأكولات', url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80' },
    { label: 'ألبسة وأزياء', url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&auto=format&fit=crop&q=80' },
    { label: 'عيادة / صيدلية', url: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600&auto=format&fit=crop&q=80' },
    { label: 'إلكترونيات وموبايل', url: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=600&auto=format&fit=crop&q=80' },
    { label: 'محل وعطور', url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop&q=80' },
    { label: 'خدمات وصيانة', url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80' },
  ];

  // Timer countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendTimer > 0) {
      timer = setTimeout(() => setResendTimer((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendTimer]);

  if (!isOpen) return null;

  // Step 1 -> Step 2: Send OTP via WhatsApp
  const handleProceedToVerification = (e: React.FormEvent) => {
    e.preventDefault();

    if (!ownerName.trim()) {
      alert('يرجى كتابة اسم صاحب المتجر أو التاجر');
      return;
    }
    if (!storeName.trim()) {
      alert('يرجى كتابة اسم المتجر / المحل');
      return;
    }
    if (!phone.trim() || phone.length < 10) {
      alert('يرجى إدخال رقم هاتف عراقي صحيح للتواصل وتوثيق الواتساب');
      return;
    }

    // Generate random 4-digit code
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(code);
    setOtpInput('');
    setOtpError('');
    setResendTimer(45);
    setIsSendingOtp(true);
    setStep('verify');

    // Simulate WhatsApp Message Dispatch
    setTimeout(() => {
      setIsSendingOtp(false);
      setShowSimulatedWhatsAppAlert(true);
    }, 1200);
  };

  // Re-generate and Send OTP
  const handleResendOtp = () => {
    if (resendTimer > 0) return;
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(code);
    setOtpInput('');
    setOtpError('');
    setResendTimer(45);
    setIsSendingOtp(true);

    setTimeout(() => {
      setIsSendingOtp(false);
      setShowSimulatedWhatsAppAlert(true);
    }, 1000);
  };

  // Verify OTP and Publish Store
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');

    if (otpInput.trim() !== generatedOtp.trim()) {
      setOtpError('رمز التحقق غير صحيح! يرجى التأكد من الرمز المرسل عبر الواتساب.');
      return;
    }

    // Prepare clean phone and whatsapp link
    const cleanPhone = phone.trim();
    const cleanWhatsapp = cleanPhone.startsWith('0')
      ? `964${cleanPhone.slice(1)}`
      : cleanPhone.startsWith('964')
      ? cleanPhone
      : `964${cleanPhone}`;

    const newStoreItem: DirectoryItem = {
      id: `store-${Date.now()}`,
      name: storeName.trim(),
      category: category,
      subCategory: subCategory.trim() || 'متجر موثق برقم الهاتف والواتساب',
      phone: cleanPhone,
      whatsapp: cleanWhatsapp,
      address: address.trim() || 'مدينة الشطرة - ذي قار',
      rating: 5.0,
      reviewsCount: 1,
      isOpen: true,
      workingHours: workingHours.trim() || '9:00 ص - 10:00 م',
      imageUrl: selectedImage,
      description: description.trim() || `متجر موثق لصاحبه ${ownerName}، مسجل رسمياً في دليل الشطرة الذكي.`,
      tags: ['متجر جديد', 'موثق واتساب', ownerName, storeName],
    };

    // Add to directory
    addStore(newStoreItem);

    // Broadcast notification to all app users
    broadcastNewStoreNotification(newStoreItem);

    setCreatedStore(newStoreItem);
    setStep('success');
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.6 },
    });

    if (onStoreCreated) {
      onStoreCreated(newStoreItem);
    }
  };

  const handleCloseAll = () => {
    setStep('info');
    setOtpInput('');
    setShowSimulatedWhatsAppAlert(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="border-b border-slate-200 p-4 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 text-white shadow-inner">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-base sm:text-lg font-bold">
                  فتح متجر جديد في دليل الشطرة
                </h3>
                <span className="rounded-full bg-emerald-400/20 border border-emerald-300/40 px-2 py-0.5 text-[10px] font-bold text-emerald-100 flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  توثيق واتساب
                </span>
              </div>
              <p className="text-[11px] text-red-100">
                تسجيل مجاني فوري مع تأكيد الاسم ورقم الهاتف بالواتساب وبث إشعار لجميع الهواتف
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCloseAll}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Step Progress Indicator */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-2.5 text-xs font-bold text-slate-500">
          <div className={`flex items-center gap-1.5 ${step === 'info' ? 'text-red-600 font-extrabold' : 'text-emerald-600'}`}>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-current text-[11px] text-white">1</span>
            <span>بيانات المتجر والمالك</span>
          </div>
          <div className="h-0.5 w-8 bg-slate-200" />
          <div className={`flex items-center gap-1.5 ${step === 'verify' ? 'text-red-600 font-extrabold' : step === 'success' ? 'text-emerald-600' : 'text-slate-400'}`}>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-current text-[11px] text-white">2</span>
            <span>توثيق الواتساب</span>
          </div>
          <div className="h-0.5 w-8 bg-slate-200" />
          <div className={`flex items-center gap-1.5 ${step === 'success' ? 'text-emerald-600 font-extrabold' : 'text-slate-400'}`}>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-current text-[11px] text-white">3</span>
            <span>نشر المتجر</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-5 space-y-4 flex-1">
          
          {/* STEP 1: STORE & OWNER INFORMATION */}
          {step === 'info' && (
            <form onSubmit={handleProceedToVerification} className="space-y-4">
              
              {/* Notice Card */}
              <div className="rounded-2xl bg-amber-50/80 border border-amber-200/90 p-3 flex items-start gap-2.5 text-xs text-amber-900">
                <Info className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p>
                  يتم فتح المتجر بدون الحاجة لأي حساب مسبق، ولكن يلزم <strong>تأكيد الاسم ورقم الهاتف وتوثيقه عبر رسالة الواتساب</strong> لحماية المستخدمين وضمان صحة النشاط التجاري.
                </p>
              </div>

              {/* 1. Owner Name & Store Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-display text-xs font-bold text-slate-700">
                    اسم صاحب المتجر / التاجر *
                  </label>
                  <div className="relative flex items-center">
                    <User className="absolute right-3 h-4 w-4 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="مثال: علي الشطري"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-9 pl-3 text-xs font-semibold text-slate-800 focus:border-red-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block font-display text-xs font-bold text-slate-700">
                    اسم المتجر أو المحل *
                  </label>
                  <div className="relative flex items-center">
                    <Store className="absolute right-3 h-4 w-4 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      placeholder="مثال: أسواق الأمانة المركزية"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-9 pl-3 text-xs font-semibold text-slate-800 focus:border-red-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Phone Number (WhatsApp Verification Target) */}
              <div>
                <label className="mb-1 block font-display text-xs font-bold text-slate-700">
                  رقم الهاتف (الواتساب للتأكيد والزبائن) *
                </label>
                <div className="relative flex items-center">
                  <Phone className="absolute right-3 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="مثال: 07801234567 أو 0770xxxxxxx"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-9 pl-3 text-xs font-mono font-bold text-slate-800 focus:border-red-500 focus:bg-white focus:outline-none text-left"
                    dir="ltr"
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  💬 سنقوم بإرسال كود التحقق وتأكيد الرقم عبر الواتساب في الخطوة التالية.
                </span>
              </div>

              {/* 3. Category & Subcategory */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-display text-xs font-bold text-slate-700">
                    القسم الرئيسي *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs font-semibold text-slate-800 focus:border-red-500 focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block font-display text-xs font-bold text-slate-700">
                    التخصص الدقيق أو النشاط
                  </label>
                  <input
                    type="text"
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                    placeholder="مثال: مشاوي، ملابس رجالية، صيدلية..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs font-semibold text-slate-800 focus:border-red-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* 4. Address & Working Hours */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-display text-xs font-bold text-slate-700">
                    العنوان داخل الشطرة
                  </label>
                  <div className="relative flex items-center">
                    <MapPin className="absolute right-3 h-4 w-4 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="شارع الشهداء، قرب فلكة المعلم..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-9 pl-3 text-xs font-semibold text-slate-800 focus:border-red-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block font-display text-xs font-bold text-slate-700">
                    أوقات العمل
                  </label>
                  <div className="relative flex items-center">
                    <Clock className="absolute right-3 h-4 w-4 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      value={workingHours}
                      onChange={(e) => setWorkingHours(e.target.value)}
                      placeholder="8:00 ص - 10:00 م"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-9 pl-3 text-xs font-semibold text-slate-800 focus:border-red-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 5. Store Description */}
              <div>
                <label className="mb-1 block font-display text-xs font-bold text-slate-700">
                  نبذة عن خدمات ومنتجات المتجر
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="اكتب أهم العروض أو الخدمات التي يقدمها محلك لأهالي الشطرة..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-800 focus:border-red-500 focus:bg-white focus:outline-none resize-none"
                />
              </div>

              {/* 6. Photo Selector */}
              <div>
                <label className="mb-1.5 block font-display text-xs font-bold text-slate-700">
                  صورة واجهة المتجر أو النشاط:
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {sampleImages.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImage(img.url)}
                      className={`relative aspect-square overflow-hidden rounded-xl border-2 transition-all cursor-pointer ${
                        selectedImage === img.url
                          ? 'border-red-600 ring-2 ring-red-400 scale-95 shadow-md'
                          : 'border-slate-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={img.url}
                        alt={img.label}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                      />
                      <span className="absolute bottom-0 inset-x-0 bg-black/60 p-0.5 text-[9px] text-white text-center font-bold truncate">
                        {img.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 py-3.5 font-display text-xs sm:text-sm font-bold text-white shadow-md hover:from-red-700 hover:to-rose-700 active:scale-95 transition-all cursor-pointer"
              >
                <span>متابعة لتأكيد وتوثيق رقم الهاتف عبر الواتساب (WhatsApp)</span>
                <ArrowRight className="h-4 w-4 rotate-180" />
              </button>
            </form>
          )}

          {/* STEP 2: WHATSAPP OTP VERIFICATION */}
          {step === 'verify' && (
            <div className="space-y-4 py-2">
              
              {/* WhatsApp Simulated Alert Box */}
              {showSimulatedWhatsAppAlert && (
                <div className="rounded-2xl border-2 border-emerald-400 bg-emerald-50 p-4 text-emerald-950 shadow-md animate-in slide-in-from-top-3 duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white">
                        <MessageCircle className="h-4 w-4" />
                      </div>
                      <span className="font-display text-xs font-bold text-emerald-900">
                        رسالة التحقق عبر الواتساب (WhatsApp)
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-200/60 px-2 py-0.5 rounded-md">
                      الآن
                    </span>
                  </div>

                  <p className="text-xs text-emerald-800 leading-relaxed">
                    مرحباً بك <strong>{ownerName}</strong>، كود توثيق وتأكيد فتح متجر <strong>"{storeName}"</strong> في دليل الشطرة هو:
                  </p>

                  <div className="mt-2.5 flex items-center justify-between rounded-xl bg-white p-2.5 border border-emerald-200">
                    <span className="font-mono text-xl sm:text-2xl font-extrabold tracking-widest text-emerald-700">
                      {generatedOtp}
                    </span>
                    <button
                      type="button"
                      onClick={() => setOtpInput(generatedOtp)}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer"
                    >
                      إدخال تلقائي للكود ⚡
                    </button>
                  </div>

                  {/* Direct WhatsApp External Launch */}
                  <a
                    href={`https://wa.me/964${phone.replace(/^0/, '')}?text=${encodeURIComponent(`كود التحقق لدليل الشطرة: ${generatedOtp}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2.5 inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 hover:underline"
                  >
                    <span>فتح محادثة الواتساب الرسمية</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

              {/* Form to enter OTP */}
              <form onSubmit={handleVerifyOtp} className="space-y-4 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-inner">
                  <MessageCircle className="h-7 w-7" />
                </div>

                <div>
                  <h4 className="font-display text-base font-bold text-slate-900">
                    أدخل كود التحقق المرسل إلى {phone}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    تم إرسال كود التوثيق المكون من 4 أرقام لتأكيد ملكية رقم الهاتف والواتساب
                  </p>
                </div>

                {/* 4-digit input */}
                <div className="space-y-2 max-w-xs mx-auto">
                  <input
                    type="text"
                    maxLength={4}
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    placeholder="••••"
                    className="w-full text-center rounded-2xl border-2 border-slate-300 bg-slate-50 py-3 font-mono text-2xl sm:text-3xl font-extrabold tracking-widest text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none"
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
                      onClick={handleResendOtp}
                      className="flex items-center gap-1 text-emerald-600 hover:underline font-bold cursor-pointer"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>إعادة إرسال كود الواتساب</span>
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
                    تعديل البيانات
                  </button>

                  <button
                    type="submit"
                    disabled={otpInput.length < 4}
                    className="flex-2 flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 font-display text-xs sm:text-sm font-bold text-white shadow-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span>تأكيد التوثيق ونشر المتجر 🚀</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 3: SUCCESS & CONFIRMATION */}
          {step === 'success' && createdStore && (
            <div className="py-4 text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-lg">
                <CheckCircle2 className="h-10 w-10" />
              </div>

              <div>
                <h4 className="font-display text-lg sm:text-xl font-bold text-slate-900">
                  تهانينا! تم توثيق ونشر متجرك بنجاح 🎉
                </h4>
                <p className="text-xs text-slate-600 max-w-xs mx-auto mt-1">
                  أصبح متجر <strong>"{createdStore.name}"</strong> متاحاً الآن في دليل الشطرة الذكي لجميع الزبائن، وتم بث إشعار تلقائي لجميع الهواتف!
                </p>
              </div>

              {/* Store Preview Card */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-right flex items-center gap-3.5 shadow-xs">
                <img
                  src={createdStore.imageUrl}
                  alt={createdStore.name}
                  referrerPolicy="no-referrer"
                  className="h-16 w-16 rounded-xl object-cover flex-shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h5 className="font-display text-sm font-bold text-slate-900 truncate">
                      {createdStore.name}
                    </h5>
                    <span className="rounded-md bg-emerald-100 text-emerald-800 px-1.5 py-0.5 text-[9px] font-bold">
                      ✓ موثق
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">{createdStore.subCategory}</p>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <Phone className="h-3 w-3 text-emerald-600" />
                    <span>{createdStore.phone}</span>
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-amber-50 p-3 border border-amber-200 text-xs text-amber-900">
                <span>📢 يمكنك في أي وقت تعزيز مبيعاتك عبر حجز بانر رئيسي أو إعلان مميز من زر (إعلان).</span>
              </div>

              <button
                type="button"
                onClick={handleCloseAll}
                className="w-full rounded-2xl bg-slate-900 py-3 font-display text-xs sm:text-sm font-bold text-white hover:bg-slate-800 transition-all cursor-pointer"
              >
                تم والعودة لتصفح الدليل
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
