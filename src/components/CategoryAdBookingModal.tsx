import React, { useState } from 'react';
import {
  X,
  Crown,
  Phone,
  Image as ImageIcon,
  CreditCard,
  Wallet,
  CheckCircle2,
  MapPin,
  Sparkles,
  ArrowRight,
  Upload,
  Copy,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCategoryAds } from '../context/CategoryAdsContext';
import { useWallet } from '../context/WalletContext';
import { useNotification } from '../context/NotificationContext';

interface CategoryAdBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  governorateId: string;
  governorateName: string;
  districtId: string;
  districtName: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
}

const DURATION_TIERS = [
  {
    days: 7 as const,
    label: 'أسبوع كامل',
    price: 30000,
    priceText: '30,000 د.ع',
  },
  {
    days: 14 as const,
    label: 'أسبوعان',
    price: 55000,
    priceText: '55,000 د.ع',
  },
  {
    days: 5 as const,
    label: '5 أيام',
    price: 100000,
    priceText: '100,000 د.ع',
  },
];

const DEFAULT_STORE_IMAGES: Record<string, string[]> = {
  restaurants: [
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80',
  ],
  medical: [
    'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=800&q=80',
  ],
  markets: [
    'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80',
  ],
  clothing: [
    'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=800&q=80',
  ],
  electronics: [
    'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=800&q=80',
  ],
  default: [
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
  ],
};

export const CategoryAdBookingModal: React.FC<CategoryAdBookingModalProps> = ({
  isOpen,
  onClose,
  governorateId,
  governorateName,
  districtId,
  districtName,
  categoryId,
  categoryName,
}) => {
  const { addCategoryAd } = useCategoryAds();
  const { balance, payWithWallet } = useWallet();
  const { broadcastNotification } = useNotification();

  const [step, setStep] = useState<'form' | 'payment' | 'success'>('form');
  const [selectedDuration, setSelectedDuration] = useState<7 | 14 | 5 | 30>(7);

  // Simplified form per user request:
  // "فقط مستطيل يضع فيه المعلن صوره متجره ويكتب مايريد ويكمل للدفع"
  const defaultImages = DEFAULT_STORE_IMAGES[categoryId] || DEFAULT_STORE_IMAGES.default;
  const [storeImage, setStoreImage] = useState<string>(defaultImages[0]);
  const [storeName, setStoreName] = useState<string>('');
  const [adText, setAdText] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [transactionId, setTransactionId] = useState<string>('');
  const [copiedZainNumber, setCopiedZainNumber] = useState<boolean>(false);
  const [formError, setFormError] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [createdRefCode, setCreatedRefCode] = useState('');

  if (!isOpen) return null;

  const currentTier = DURATION_TIERS.find((t) => t.days === selectedDuration) || DURATION_TIERS[0];
  const totalPrice = currentTier.price;

  const handleCopyZainNumber = () => {
    navigator.clipboard.writeText('07801459424');
    setCopiedZainNumber(true);
    setTimeout(() => setCopiedZainNumber(false), 2500);
  };

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!storeName.trim() || !adText.trim() || !phone.trim()) {
      setFormError('يرجى كتابة اسم المتجر، نص الإعلان، ورقم الهاتف أولاً للمتابعة!');
      return;
    }
    setPaymentError('');
    setStep('payment');
  };

  const handleConfirmBooking = () => {
    setPaymentError('');

    // Strict validation for Transaction ID
    if (!transactionId.trim()) {
      setPaymentError('يرجى كتابة رقم عملية التحويل (Transaction ID) من تطبيق زين كاش لتأكيد الإعلان!');
      return;
    }

    const newAd = addCategoryAd({
      governorateId,
      governorateName,
      districtId,
      districtName,
      categoryId,
      categoryName,
      businessName: storeName.trim(),
      headline: adText.trim(),
      description: adText.trim(),
      imageUrl: storeImage.trim() || defaultImages[0],
      phone: phone.trim(),
      whatsapp: phone.trim(),
      offerBadge: '',
      durationDays: selectedDuration,
      price: totalPrice,
      paymentMethod: 'زين كاش (ZainCash)',
      transactionId: transactionId.trim(),
    });

    setCreatedRefCode(newAd.referenceNumber);
    setStep('success');

    broadcastNotification({
      title: `📢 إعلان جديد في ${districtName}: ${storeName}`,
      message: `${adText.slice(0, 90)} - يظهر الآن في قسم ${categoryName}`,
      type: 'offer',
      targetType: 'offer',
      targetId: newAd.id,
      imageUrl: storeImage.trim() || defaultImages[0],
      badge: 'إعلان مميز 🔥',
      governorateId,
      governorateName,
      districtId,
      districtName,
      categoryId,
      categoryName,
    });

    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 },
    });
  };

  const handleResetAndClose = () => {
    setStep('form');
    setStoreName('');
    setAdText('');
    setPhone('');
    setTransactionId('');
    setPaymentError('');
    onClose();
  };

  // Image upload simulation / preview
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setStoreImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-3 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative flex max-h-[92vh] w-full max-w-lg flex-col rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header with Close button */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-900 px-5 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white font-bold shadow-xs">
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-sm sm:text-base font-extrabold text-white leading-tight">
                حجز إعلان في {categoryName}
              </h3>
              <div className="flex items-center gap-1 text-[11px] text-slate-300 font-medium">
                <MapPin className="h-3 w-3 text-amber-400" />
                <span>يظهر لزبائن: {districtName} ({governorateName})</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleResetAndClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* STEP 1: THE SIMPLIFIED AD RECTANGLE FORM */}
          {step === 'form' && (
            <form onSubmit={handleProceedToPayment} className="space-y-4">
              {/* Duration selector: 5k 1 day, 10k 2 days, 15k 3 days */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  اختر مدة ظهور الإعلان:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {DURATION_TIERS.map((tier) => (
                    <button
                      key={tier.days}
                      type="button"
                      onClick={() => setSelectedDuration(tier.days)}
                      className={`flex flex-col items-center justify-between rounded-2xl p-2.5 border-2 text-center transition-all cursor-pointer ${
                        selectedDuration === tier.days
                          ? 'border-amber-500 bg-amber-50/80 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <span className="text-[11px] font-extrabold text-slate-800">
                        {tier.label}
                      </span>
                      <span className="font-display text-sm font-black text-amber-600 mt-1">
                        {tier.priceText}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* The Ad Rectangle (مستطيل يضع فيه المعلن صورة متجره ويكتب ما يريد) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    مستطيل إعلانك (كما سيظهر في أعلى القسم):
                  </label>
                  <span className="text-[11px] text-slate-400">معاينة وتعديل مباشر</span>
                </div>

                {/* THE RECTANGLE CONTAINER */}
                <div className="relative overflow-hidden rounded-2xl border-2 border-amber-400 bg-gradient-to-r from-amber-50/50 via-white to-amber-50/30 p-3 sm:p-4 shadow-sm space-y-3">
                  {/* Store Name Input */}
                  <div>
                    <input
                      type="text"
                      required
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      placeholder="اكتب هنا اسم متجرك..."
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-900 placeholder-slate-400 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  {/* Rectangle Content: Image + Text */}
                  <div className="flex flex-col sm:flex-row gap-3 items-start">
                    {/* Store Image Preview / Picker inside the rectangle */}
                    <div className="relative flex-shrink-0 w-full sm:w-28 flex flex-col items-center gap-1.5">
                      <div className="relative h-24 w-full sm:w-28 rounded-xl overflow-hidden border border-amber-300 bg-slate-100 shadow-2xs">
                        <img
                          src={storeImage || defaultImages[0]}
                          alt="صورة المتجر"
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      
                      {/* Upload / Image Change Button */}
                      <label className="flex items-center justify-center gap-1 w-full rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 px-2 text-[10px] font-bold cursor-pointer transition-colors border border-slate-200">
                        <Upload className="h-3 w-3" />
                        <span>تغيير الصورة</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageFileChange}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* What the advertiser wants to write ("يكتب ما يريد") */}
                    <div className="flex-1 w-full space-y-1.5">
                      <textarea
                        required
                        rows={3}
                        value={adText}
                        onChange={(e) => setAdText(e.target.value)}
                        placeholder="اكتب هنا ما تريده في إعلانك (عروضك، خدماتك، ما يميز متجرك، توصيل...)"
                        className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 resize-none font-medium leading-relaxed"
                      />
                    </div>
                  </div>

                  {/* Phone Input inside rectangle */}
                  <div>
                    <div className="relative">
                      <div className="pointer-events-none absolute right-3 top-2.5 text-slate-400">
                        <Phone className="h-4 w-4" />
                      </div>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="رقم هاتف المتجر للاتصال والواتساب..."
                        className="w-full rounded-xl border border-slate-200 bg-white pr-9 pl-3 py-2 text-xs font-bold text-slate-900 placeholder-slate-400 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-right"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sample Photo Presets (Quick selection if user has no photo ready) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5">
                  أو اختر صورة جاهزة تناسب متجرك:
                </label>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {defaultImages.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setStoreImage(img)}
                      className={`relative h-12 w-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                        storeImage === img ? 'border-amber-500 ring-2 ring-amber-400/30' : 'border-slate-200'
                      }`}
                    >
                      <img src={img} alt="نموذج" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Error Banner */}
              {formError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-right text-xs font-bold text-rose-700 animate-in fade-in flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Submit to Payment */}
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white py-3.5 px-4 text-xs sm:text-sm font-black shadow-md shadow-amber-500/20 transition-all cursor-pointer active:scale-98"
              >
                <span>المتابعة للدفع ({totalPrice.toLocaleString()} د.ع)</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          )}

          {/* STEP 2: PAYMENT STEP ("ويكمل للدفع") */}
          {step === 'payment' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-center">
                <span className="text-xs text-slate-500 font-bold">المبلغ المطلوب للدفع</span>
                <div className="text-2xl font-black text-slate-900 mt-0.5">
                  {totalPrice.toLocaleString()} دينار عراقي
                </div>
                <div className="text-xs text-amber-700 font-bold mt-1">
                  إعلان لمدة {currentTier.label} في {categoryName} ({districtName})
                </div>
              </div>

              {paymentError && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-bold">
                  {paymentError}
                </div>
              )}

              {/* Payment Method - ZainCash Only */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700">
                  وسيلة الدفع المعتمدة:
                </label>

                {/* ZainCash Card */}
                <div className="rounded-2xl border-2 border-red-500 bg-gradient-to-br from-red-50/70 via-rose-50/40 to-amber-50/50 p-3.5 sm:p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-600 text-white font-black text-xs shadow-xs">
                        Zain
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs sm:text-sm font-black text-slate-900">
                            زين كاش (ZainCash)
                          </span>
                          <span className="rounded-md bg-red-100 text-red-700 px-1.5 py-0.2 text-[10px] font-bold">
                            الوحيدة المعتمدة ✓
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 mt-0.5">
                          الدفع والتحويل المباشر عبر محفظة زين كاش
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Transfer Phone Box */}
                  <div className="rounded-2xl bg-white p-3 border border-red-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-600 text-[11px]">
                        رقم محفظة زين كاش للتحويل:
                      </span>
                      {copiedZainNumber && (
                        <span className="text-[10px] font-bold text-emerald-600 animate-in fade-in">
                          تم نسخ الرقم بنجاح ✓
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 rounded-xl bg-slate-900 text-white px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-amber-400" />
                        <span className="font-mono text-sm sm:text-base font-black tracking-wider text-amber-300" dir="ltr">
                          07801459424
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={handleCopyZainNumber}
                        className="flex items-center gap-1 rounded-lg bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 text-xs font-bold transition-all cursor-pointer active:scale-95"
                        title="نسخ رقم زين كاش"
                      >
                        {copiedZainNumber ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                            <span>تم النسخ</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>نسخ الرقم</span>
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                      يرجى تحويل مبلغ <strong className="text-red-600 font-bold">{totalPrice.toLocaleString()} د.ع</strong> إلى الرقم أعلاه عبر تطبيق زين كاش، ثم كتابة رقم العملية في الحقل أدناه لتأكيد حجز ونشر الإعلان فوراً.
                    </p>
                  </div>

                  {/* Mandatory Input for Transaction ID */}
                  <div className="space-y-1.5 pt-1">
                    <label className="block text-xs font-black text-slate-900">
                      رقم عملية التحويل (Transaction ID) * <span className="text-red-600 font-bold">(إجباري)</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={transactionId}
                      onChange={(e) => {
                        setTransactionId(e.target.value);
                        if (paymentError) setPaymentError('');
                      }}
                      placeholder="اكتب أو الصق رقم عملية التحويل (مثال: 9876543210)..."
                      className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none transition-all shadow-inner ${
                        paymentError && !transactionId.trim()
                          ? 'border-red-500 ring-2 ring-red-200 bg-red-50/20'
                          : 'border-slate-300 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                      }`}
                    />
                    <span className="text-[10px] text-slate-500 block font-medium">
                      ستجد رقم العملية في الرسالة النصية أو إشعار التحويل المكتمل في تطبيق زين كاش.
                    </span>
                  </div>
                </div>
              </div>

              {/* Confirm payment and back buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="flex-1 rounded-2xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-800 py-3 text-xs font-bold transition-all cursor-pointer"
                >
                  تعديل الإعلان
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBooking}
                  className="flex-[2] flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white py-3 text-xs sm:text-sm font-black shadow-md transition-all cursor-pointer active:scale-98"
                >
                  <span>تأكيد الدفع ونشر الإعلان فوراً</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SUCCESS CONFIRMATION */}
          {step === 'success' && (
            <div className="text-center py-6 space-y-4 animate-in zoom-in-95 duration-200">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  تم نشر إعلانك بنجاح! 🎉
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  إعلان متجرك يظهر الآن مباشرة في صدارة {categoryName} بـ {districtName}.
                </p>
                {createdRefCode && (
                  <div className="flex flex-col items-center gap-1.5 mt-2">
                    <span className="rounded-xl bg-slate-100 border border-slate-200 px-3 py-1 text-xs font-mono font-bold text-slate-700">
                      رقم الإيصال: {createdRefCode}
                    </span>
                    {transactionId && (
                      <span className="rounded-xl bg-red-50 border border-red-200 px-3 py-1 text-[11px] font-mono font-bold text-red-800">
                        رقم عملية زين كاش (Transaction ID): {transactionId}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleResetAndClose}
                className="w-full rounded-2xl bg-slate-900 hover:bg-slate-800 text-white py-3 text-xs font-bold transition-all cursor-pointer"
              >
                إغلاق والعودة للقائمة
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
