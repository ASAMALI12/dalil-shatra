import React, { useState } from 'react';
import {
  X,
  Sparkles,
  CheckCircle,
  CreditCard,
  Building,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  Award,
  Wallet,
  AlertCircle,
  BellRing,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useWallet } from '../context/WalletContext';
import { useNotification } from '../context/NotificationContext';
import { PaymentMethod } from '../types/shatrah';

interface AdvertiseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdvertiseModal: React.FC<AdvertiseModalProps> = ({ isOpen, onClose }) => {
  const { balance, payWithWallet, isManagerUnlocked } = useWallet();
  const { broadcastNewOfferNotification, broadcastNewStoreNotification, broadcastNotification } = useNotification();

  const [step, setStep] = useState<'plan' | 'details' | 'payment' | 'success'>('plan');
  const [selectedPlan, setSelectedPlan] = useState<string>('hero');
  const [durationWeeks, setDurationWeeks] = useState<number>(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('zaincash');

  // Form Fields
  const [businessName, setBusinessName] = useState('');
  const [headline, setHeadline] = useState('');
  const [category, setCategory] = useState('restaurants');
  const [phone, setPhone] = useState('');
  const [referenceCode, setReferenceCode] = useState('');
  const [paymentError, setPaymentError] = useState('');

  if (!isOpen) return null;

  const plans = [
    {
      id: 'hero',
      title: 'البانر الرئيسي الأحمر في الصدارة (VIP)',
      description: 'أعلى شاشة التطبيق مباشرة ويظهر لجميع أهالي الشطرة يومياً',
      pricePerWeek: 35000,
      badge: 'الأكثر طلباً ⭐',
      features: ['ظهور فوري أعلى الصفحة الرئيسية', 'تنبيه فوري لجميع المستخدمين', 'زر اتصال وواتساب مباشر'],
    },
    {
      id: 'category_pin',
      title: 'تثبيت في صدارة القسم التجاري',
      description: 'ظهور المحل في المرتبة الأولى عند تصفح القسم الخاص به',
      pricePerWeek: 25000,
      badge: 'مبيعات أعلى 📈',
      features: ['أول نتيجة تظهر في قسمك', 'شارة متجر مميز ومرخص', 'إحصائيات نقرات أسبوعية'],
    },
    {
      id: 'offer',
      title: 'إعلان عرض وتخفيضات وكوبون خصم',
      description: 'نشر كارت خصم في شريط العروض اليومية والتخفيضات',
      pricePerWeek: 15000,
      badge: 'جذب سريع 🏷️',
      features: ['ظهور في شريط العروض المتحرك', 'كوبون خصم خاص بالزبائن', 'إشعار ترويجي فوري لجميع الهواتف'],
    },
    {
      id: 'broadcast',
      title: 'بث إشعار منبثق فوري لجميع المستخدمين',
      description: 'إشعار ينبثق أعلى الشاشة مع نغمة تنبيه لكل مستخدم يفتح التطبيق',
      pricePerWeek: 20000,
      badge: 'تنبيه فوري 🔴',
      features: ['تنبيه منبثق فوري في شريط الإشعارات', 'رابط مباشر لصفحة المحل', 'إرسال في وقت الذروة'],
    },
  ];

  const currentPlan = plans.find((p) => p.id === selectedPlan) || plans[0];
  const totalPrice = currentPlan.pricePerWeek * durationWeeks;

  const handleConfirmPayment = () => {
    setPaymentError('');

    const triggerBroadcast = () => {
      if (selectedPlan === 'offer') {
        broadcastNewOfferNotification({
          businessName: businessName || 'نشاط تجاري في الشطرة',
          title: headline || 'عرض وتخفيض خاص',
          discountPercentage: 'تخفيض حصري',
          category,
          phone,
        });
      } else if (selectedPlan === 'category_pin' || selectedPlan === 'hero') {
        broadcastNewStoreNotification({
          name: businessName || 'متجر جديد في الشطرة',
          category,
          phone,
          address: 'مدينة الشطرة',
        });
      } else {
        broadcastNotification({
          title: `📢 تنبيه جديد: ${businessName || 'دليل الشطرة'}`,
          message: headline || `تم نشر إعلان جديد لـ ${businessName || 'نشاط تجاري'} في الشطرة - تصفح الآن!`,
          type: 'offer',
          badge: 'إشعار مباشر',
        });
      }
    };

    if (paymentMethod === 'wallet') {
      if (balance < totalPrice) {
        setPaymentError('رصيد المحفظة غير كافٍ! يرجى اختيار وسيلة دفع أخرى.');
        return;
      }
      const res = payWithWallet(
        totalPrice,
        `حجز إعلان: ${businessName || 'نشاط تجاري'}`,
        `${currentPlan.title} لمدة ${durationWeeks} أسبوع في دليل الشطرة`
      );
      if (res.success && res.referenceNumber) {
        setReferenceCode(res.referenceNumber);
        setStep('success');
        triggerBroadcast();
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } else {
        setPaymentError(res.message || 'فشلت عملية الدفع من المحفظة');
      }
    } else {
      const code = `SHTR-${Math.floor(100000 + Math.random() * 900000)}`;
      setReferenceCode(code);
      setStep('success');
      triggerBroadcast();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  const handleReset = () => {
    setStep('plan');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-slate-200 p-4 bg-gradient-to-r from-red-600 to-rose-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-xs">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-display text-base sm:text-lg font-bold">
                حجز إعلان ونشر نشاط تجاري في الشطرة
              </h3>
              <p className="text-xs text-red-100">
                وصول مباشر لآلاف الزبائن في قضاء الشطرة والمناطق المجاورة
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-all cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-4 sm:p-6 flex-1 space-y-5">
          {/* STEP 1: Select Plan */}
          {step === 'plan' && (
            <div className="space-y-4">
              <div className="text-right">
                <h4 className="font-display text-sm font-bold text-slate-800">
                  ١. اختر نوع وحزمة الإعلان المناسبة لنشاطك:
                </h4>
                <p className="text-xs text-slate-500">
                  جميع الباقات تشمل ترويجاً معتمداً مع إمكانية التجديد في أي وقت
                </p>
              </div>

              <div className="space-y-2.5">
                {plans.map((plan) => {
                  const isSelected = selectedPlan === plan.id;
                  return (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan.id)}
                      className={`relative rounded-2xl border p-4 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-red-500 bg-red-50/50 shadow-xs ring-1 ring-red-500'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-display text-sm font-bold text-slate-900">
                              {plan.title}
                            </span>
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                              {plan.badge}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1">{plan.description}</p>
                        </div>

                        <div className="text-left flex-shrink-0">
                          <span className="font-display text-base font-extrabold text-red-600">
                            {plan.pricePerWeek.toLocaleString('ar-IQ')}
                          </span>
                          <span className="text-[10px] text-slate-500 block">د.ع / أسبوع</span>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
                        {plan.features.map((feat, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-[10px] font-medium text-slate-600 border border-slate-200"
                          >
                            <CheckCircle className="h-3 w-3 text-emerald-600" />
                            {feat}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Duration Selector */}
              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-display text-xs font-bold text-slate-800 block">
                    مدة الحجز الإعلاني:
                  </span>
                  <span className="text-[11px] text-slate-500">اختر عدد الأسابيع المطلوبة</span>
                </div>

                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
                  {[1, 2, 4].map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setDurationWeeks(w)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        durationWeeks === w
                          ? 'bg-red-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {w === 1 ? 'أسبوع واحد' : w === 2 ? 'أسبوعين' : 'شهر كامل (٤ أسابيع)'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Details */}
          {step === 'details' && (
            <div className="space-y-4">
              <div className="text-right">
                <h4 className="font-display text-sm font-bold text-slate-800">
                  ٢. بيانات النشاط التجاري والإعلان:
                </h4>
                <p className="text-xs text-slate-500">
                  أدخل تفاصيل المحل ليتم صياغة البانر الترويجي ونشره فوراً
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block font-display text-xs font-bold text-slate-700 mb-1">
                    اسم المحل / العيادة / النشاط التجاري *
                  </label>
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="مثال: مطعم قصر المندي - الشطرة"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-display text-xs text-slate-800 focus:border-red-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-display text-xs font-bold text-slate-700 mb-1">
                    عنوان الإعلان أو العرض الرئيسي *
                  </label>
                  <input
                    type="text"
                    required
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="مثال: خصم 20% على جميع الوجبات العائلية"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-display text-xs text-slate-800 focus:border-red-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-display text-xs font-bold text-slate-700 mb-1">
                      القسم التابع له *
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-display text-xs text-slate-800 focus:border-red-500 focus:outline-none"
                    >
                      <option value="restaurants">مطاعم ومأكولات</option>
                      <option value="clothing">مجمعات الألبسة والمحلات</option>
                      <option value="doctors">أطباء وعيادات</option>
                      <option value="pharmacies">صيدليات ومختبرات</option>
                      <option value="electronics">أجهزة وإلكترونيات</option>
                      <option value="beauty">صالونات وتجميل</option>
                      <option value="services">خدمات متنوعة</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-display text-xs font-bold text-slate-700 mb-1">
                      رقم هاتف التواصل والواتساب *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="07801234567"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-display text-xs text-slate-800 focus:border-red-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Payment */}
          {step === 'payment' && (
            <div className="space-y-4">
              <div className="text-right">
                <h4 className="font-display text-sm font-bold text-slate-800">
                  ٣. مراجعة الطلب وتأكيد وسيلة الدفع:
                </h4>
              </div>

              {/* Invoice Summary */}
              <div className="rounded-2xl bg-amber-50/70 border border-amber-200/70 p-4 space-y-2 text-xs">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>الباقة المختارة:</span>
                  <span className="font-bold text-slate-900">{currentPlan.title}</span>
                </div>
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>المدة الزمنية:</span>
                  <span className="font-bold text-slate-900">{durationWeeks} أسبوع</span>
                </div>
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>النشاط التجاري:</span>
                  <span>{businessName || 'مركز تجاري في الشطرة'}</span>
                </div>
                <div className="pt-2 border-t border-amber-200/80 flex justify-between font-bold text-slate-900 text-sm">
                  <span>المجموع الكلي:</span>
                  <span className="font-extrabold text-red-600 text-base">
                    {totalPrice.toLocaleString('ar-IQ')} د.ع
                  </span>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-2.5">
                <label className="block font-display text-xs font-bold text-slate-700">
                  اختر وسيلة الدفع المفضلة:
                </label>

                {/* In-App Wallet Option (Visible ONLY when Manager is Unlocked) */}
                {isManagerUnlocked && (
                  <div
                    onClick={() => setPaymentMethod('wallet')}
                    className={`relative flex items-center justify-between rounded-2xl border p-3.5 transition-all cursor-pointer ${
                      paymentMethod === 'wallet'
                        ? 'border-red-500 bg-red-50/80 text-red-950 ring-1 ring-red-500 shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-slate-900 to-red-900 text-white text-lg shadow-xs">
                        <Wallet className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-display text-xs font-bold text-slate-900">
                            محفظة المدير (تفعيل فوري)
                          </span>
                          <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800">
                            خاص بالإدارة 🔒
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          الرصيد المتاح:{' '}
                          <strong className="font-display font-bold text-slate-900">
                            {balance.toLocaleString('ar-IQ')} د.ع
                          </strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {balance < totalPrice ? (
                        <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                          رصيد غير كافٍ
                        </span>
                      ) : (
                        <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                          جاهز للدفع ✓
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Gateway Options for Public Merchants & Users */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'zaincash', name: 'زين كاش (ZainCash)', icon: '📱' },
                    { id: 'qicard', name: 'كي كارد (Qi Card)', icon: '💳' },
                    { id: 'mastercard', name: 'ماستر كارد / فيزا', icon: '🌐' },
                    { id: 'cash', name: 'دفع نقدي / مندوب الشطرة', icon: '💵' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`flex items-center gap-2 rounded-xl p-3 border text-xs font-bold transition-all text-right cursor-pointer ${
                        paymentMethod === m.id
                          ? 'border-red-500 bg-red-50 text-red-800 ring-1 ring-red-500'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-lg">{m.icon}</span>
                      <span>{m.name}</span>
                    </button>
                  ))}
                </div>

                {paymentError && (
                  <div className="rounded-xl bg-red-50 p-3 text-xs font-bold text-red-600 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{paymentError}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: Success */}
          {step === 'success' && (
            <div className="py-6 text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-inner">
                <CheckCircle className="h-10 w-10" />
              </div>

              <div>
                <h4 className="font-display text-lg font-bold text-slate-900">
                  تم تأكيد حجز الإعلان وبث الإشعار التلقائي بنجاح!
                </h4>
                <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                  تم إرسال إشعار فوري لجميع مستخدمي تطبيق دليل الشطرة، وسيبدأ ظهور إعلانك في الموقع فوراً.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200 max-w-xs mx-auto text-xs space-y-1">
                <span className="text-slate-500 block">رقم الإيصال المرجعي:</span>
                <span className="font-mono text-base font-extrabold text-red-600 tracking-wider">
                  {referenceCode}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        <div className="border-t border-slate-200 p-4 bg-slate-50 flex items-center justify-between">
          {step !== 'success' ? (
            <>
              {step !== 'plan' ? (
                <button
                  type="button"
                  onClick={() => setStep(step === 'payment' ? 'details' : 'plan')}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 font-display text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  السابق
                </button>
              ) : (
                <div />
              )}

              {step === 'plan' && (
                <button
                  type="button"
                  onClick={() => setStep('details')}
                  className="flex items-center gap-2 rounded-xl bg-red-600 px-6 py-2.5 font-display text-xs font-bold text-white shadow-md hover:bg-red-700 active:scale-95 transition-all cursor-pointer"
                >
                  <span>متابعة إدخال البيانات</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}

              {step === 'details' && (
                <button
                  type="button"
                  onClick={() => {
                    if (!businessName.trim() || !headline.trim()) {
                      alert('يرجى كتابة اسم المحل وعنوان الإعلان أولاً');
                      return;
                    }
                    setStep('payment');
                  }}
                  className="flex items-center gap-2 rounded-xl bg-red-600 px-6 py-2.5 font-display text-xs font-bold text-white shadow-md hover:bg-red-700 active:scale-95 transition-all cursor-pointer"
                >
                  <span>المتابعة للدفع والتأكيد</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}

              {step === 'payment' && (
                <button
                  type="button"
                  onClick={handleConfirmPayment}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-6 py-2.5 font-display text-xs font-bold text-white shadow-md hover:from-red-700 hover:to-rose-700 active:scale-95 transition-all cursor-pointer"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>تأكيد الحجز والدفع ({totalPrice.toLocaleString('ar-IQ')} د.ع)</span>
                </button>
              )}
            </>
          ) : (
            <button
              type="button"
              onClick={handleReset}
              className="w-full rounded-xl bg-slate-900 py-3 font-display text-xs font-bold text-white hover:bg-black transition-all cursor-pointer"
            >
              تم، العودة لدليل الشطرة
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
