import React, { useState, useMemo } from 'react';
import {
  X,
  Crown,
  Phone,
  MessageCircle,
  CreditCard,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Upload,
  Copy,
  Check,
  Building,
  ShieldCheck,
  Tag,
  Clock,
  Send,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useDirectory } from '../context/DirectoryContext';
import { useCategoryAds } from '../context/CategoryAdsContext';
import { useWallet } from '../context/WalletContext';
import { useNotification } from '../context/NotificationContext';
import { DirectoryItem } from '../types/directory';

interface VerifiedStoreAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenClaimStore?: (store?: DirectoryItem) => void;
  initialScope?: 'national' | 'governorate' | 'store_area';
}

export interface DurationTier {
  id: string;
  days: number;
  label: string;
  price: number;
  priceText: string;
  badge: string;
  scope: 'national' | 'governorate' | 'store_area';
}

export const DURATION_TIERS: DurationTier[] = [
  {
    id: 'month-national',
    days: 30,
    label: 'شهر كامل (كل العراق)',
    price: 25000,
    priceText: '25,000 د.ع',
    badge: 'عموم العراق 🇮🇶',
    scope: 'national',
  },
  {
    id: 'month-gov',
    days: 30,
    label: 'شهر كامل (المحافظة والمدن)',
    price: 15000,
    priceText: '15,000 د.ع',
    badge: 'مدن المحافظة 💎',
    scope: 'governorate',
  },
  {
    id: 'month-store',
    days: 30,
    label: 'شهر كامل (صدارة القسم)',
    price: 10000,
    priceText: '10,000 د.ع',
    badge: 'صدارة المتجر 👑',
    scope: 'store_area',
  },
];

export const VerifiedStoreAdModal: React.FC<VerifiedStoreAdModalProps> = ({
  isOpen,
  onClose,
  onOpenClaimStore,
  initialScope = 'national',
}) => {
  const { items, claimedStoreIds, isUserStoreOwner } = useDirectory();
  const { addCategoryAd } = useCategoryAds();
  const { balance, payWithWallet, isManagerUnlocked } = useWallet();
  const { broadcastNotification } = useNotification();

  // Find stores verified/claimed by this user
  const verifiedUserStores = useMemo(() => {
    return items.filter(
      (store) =>
        claimedStoreIds.includes(store.id) ||
        isUserStoreOwner(store.id) ||
        (store.claimedByPhone && store.phoneReliability === 'otp_verified')
    );
  }, [items, claimedStoreIds, isUserStoreOwner]);

  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [selectedTierId, setSelectedTierId] = useState<string>(() => {
    if (initialScope === 'governorate') return 'month-gov';
    if (initialScope === 'store_area') return 'month-store';
    return 'month-national';
  });

  // Form State
  const [adHeadline, setAdHeadline] = useState('');
  const [adDescription, setAdDescription] = useState('');
  const [offerBadge, setOfferBadge] = useState('');
  const [adImageUrl, setAdImageUrl] = useState('');
  const [adPhone, setAdPhone] = useState('');
  const [adWhatsapp, setAdWhatsapp] = useState('');
  const [targetScope, setTargetScope] = useState<'national' | 'governorate'>('national');

  // Payment State
  const [step, setStep] = useState<'form' | 'payment' | 'success'>('form');
  const [paymentMethod, setPaymentMethod] = useState<'zaincash' | 'wallet'>('zaincash');
  const [transactionId, setTransactionId] = useState('');
  const [copiedZain, setCopiedZain] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Auto-fill when selectedStoreId changes
  const activeSelectedStore = useMemo(() => {
    if (selectedStoreId) {
      return items.find((s) => s.id === selectedStoreId) || null;
    }
    if (verifiedUserStores.length > 0) {
      return verifiedUserStores[0];
    }
    return null;
  }, [selectedStoreId, items, verifiedUserStores]);

  // Set initial selected store and scope based on props
  React.useEffect(() => {
    if (isOpen) {
      if (initialScope === 'governorate') {
        setSelectedTierId('month-gov');
        setTargetScope('governorate');
      } else if (initialScope === 'store_area') {
        setSelectedTierId('month-store');
        setTargetScope('governorate');
      } else {
        setSelectedTierId('month-national');
        setTargetScope('national');
      }

      if (verifiedUserStores.length > 0 && !selectedStoreId) {
        const first = verifiedUserStores[0];
        setSelectedStoreId(first.id);
        setAdHeadline(`عروض وتخفيضات حصرية لدى ${first.name}`);
        setAdDescription(first.description || `تفضلوا بزيارة ${first.name} في ${first.districtName || first.governorateName || 'العراق'}`);
        setAdPhone(first.phone || '');
        setAdWhatsapp(first.phone || '');
        setAdImageUrl(first.imageUrl || 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80');
      }
      setStep('form');
      setErrorMessage('');
      setTransactionId('');
    }
  }, [isOpen, initialScope, verifiedUserStores]);

  const handleStoreChange = (storeId: string) => {
    setSelectedStoreId(storeId);
    const found = items.find((s) => s.id === storeId);
    if (found) {
      setAdHeadline(`عروض وتخفيضات حصرية لدى ${found.name}`);
      setAdDescription(found.description || `تفضلوا بزيارة ${found.name}`);
      setAdPhone(found.phone || '');
      setAdWhatsapp(found.phone || '');
      if (found.imageUrl) setAdImageUrl(found.imageUrl);
    }
  };

  const selectedTier = DURATION_TIERS.find((t) => t.id === selectedTierId) || DURATION_TIERS[0];

  const handleCopyZain = () => {
    navigator.clipboard.writeText('07801459424');
    setCopiedZain(true);
    setTimeout(() => setCopiedZain(false), 2500);
  };

  const handleGoToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!adHeadline.trim()) {
      setErrorMessage('يرجى كتابة عنوان أو عرض الإعلان التجاري!');
      return;
    }

    if (!adPhone.trim()) {
      setErrorMessage('يرجى التأكد من رقم هاتف التواصل للمتجر!');
      return;
    }

    setStep('payment');
  };

  const handleConfirmAndPublish = () => {
    setErrorMessage('');

    if (paymentMethod === 'zaincash' && !transactionId.trim() && !isManagerUnlocked) {
      setErrorMessage('يرجى إدخال رقم الإشعار أو عملية التحويل (Transaction ID) من زين كاش لتأكيد الإعلان!');
      return;
    }

    if (paymentMethod === 'wallet' && !isManagerUnlocked) {
      if (balance < selectedTier.price) {
        setErrorMessage(`رصيد محفظتك (${balance.toLocaleString('ar-IQ')} د.ع) غير كافٍ. يرجى الشحن أو الدفع عبر زين كاش.`);
        return;
      }
      payWithWallet(
        selectedTier.price,
        `حجز إعلان ممول في لوحة الإشعارات - ${selectedTier.label}`,
        `مدة العرض: ${selectedTier.days} يوم`
      );
    }

    const store = activeSelectedStore;
    const storeName = store ? store.name : 'متجر موثق في دليل العراق';
    const govId = store ? store.governorateId : 'all';
    const govName = store ? store.governorateName : 'عموم العراق';
    const distId = store ? store.districtId : 'all';
    const distName = store ? store.districtName : 'كافة المحافظات';
    const catId = store ? store.category : 'general';
    const catName = store ? (store as any).categoryName || store.category || 'متاجر منوعة' : 'متاجر منوعة';

    // Add to CategoryAdsContext
    addCategoryAd({
      scope: targetScope,
      governorateId: targetScope === 'national' ? 'all' : govId,
      governorateName: targetScope === 'national' ? 'عموم العراق' : govName,
      districtId: targetScope === 'national' ? 'all' : distId,
      districtName: targetScope === 'national' ? 'كافة المحافظات' : distName,
      categoryId: catId,
      categoryName: catName,
      businessName: storeName,
      headline: adHeadline.trim(),
      description: adDescription.trim() || adHeadline.trim(),
      imageUrl: adImageUrl || 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
      phone: adPhone.trim(),
      whatsapp: adWhatsapp.trim() || adPhone.trim(),
      offerBadge: offerBadge.trim() || 'إعلان ممول 👑',
      durationDays: selectedTier.days,
      price: selectedTier.price,
      paymentMethod: paymentMethod === 'wallet' ? 'المحفظة الإلكترونية' : 'زين كاش (ZainCash)',
    });

    // Broadcast instant alert across app
    broadcastNotification({
      title: `👑 إعلان مميز: ${storeName}`,
      message: `${adHeadline} • متوفر الآن في لوحة الإعلانات الزرقاء - تواصل مباشرة عبر الاتصال أو الواتساب!`,
      type: 'store',
      badge: 'إشعار ممول 🇮🇶',
      categoryId: catId,
      governorateId: govId,
      governorateName: govName,
      districtId: distId,
      districtName: distName,
    });

    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 },
    });

    setStep('success');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden text-white flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-blue-700 via-sky-600 to-blue-800 px-5 py-3.5 border-b border-white/20">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-400 text-slate-950 font-black shadow-sm">
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-sm sm:text-base font-black text-white">
                وضع إعلان في لوحة الإشعارات الزرقاء 🇮🇶
              </h3>
              <p className="text-[11px] text-sky-100 font-medium">
                مخصص لأصحاب المتاجر الموثق حسابهم في دليل العراق
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* CASE 1: USER HAS NO VERIFIED STORES (Show verification guide) */}
          {verifiedUserStores.length === 0 && !isManagerUnlocked ? (
            <div className="text-center py-6 px-3 space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <ShieldCheck className="h-8 w-8" />
              </div>

              <div>
                <h4 className="font-display text-base font-black text-white">
                  يجب أن يكون حساب متجرك موثقاً لوضع الإعلان
                </h4>
                <p className="mt-1.5 text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                  لضمان مصداقية الإعلانات في لوحات الإشعارات الزرقاء، تُقبل الإعلانات فقط من أصحاب المتاجر والأنشطة الذين قاموا بتأكيد وتوثيق ملكية متجرهم برقم هاتفهم.
                </p>
              </div>

              <div className="rounded-2xl bg-blue-950/60 border border-sky-500/30 p-3.5 text-right text-xs text-sky-200 space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-amber-300">
                  <Sparkles className="h-4 w-4" />
                  <span>خطوات بسيطة لنشر إعلانك:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-sky-100/90 leading-relaxed pr-1">
                  <li>ابحث عن اسم متجرك في مدينتك، أو قم بإنشاء متجر جديد.</li>
                  <li>انقر على زر "توثيق ملكية هذا المتجر" وأدخل رمز التحقق.</li>
                  <li>بمجرد توثيق حسابك، ستتمكن فوراً من وضع إعلاناتك في لوحة الإشعارات بالأسعار الرسمية!</li>
                </ol>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenClaimStore) onOpenClaimStore();
                  }}
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black px-5 py-3 text-xs shadow-md transition-all cursor-pointer active:scale-95"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>توثيق ملكية متجري الآن</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </div>
          ) : step === 'form' ? (
            /* CASE 2: VERIFIED STORE OWNER FORM */
            <form onSubmit={handleGoToPayment} className="space-y-4">
              {/* Verified Store Selector Banner */}
              <div className="rounded-2xl bg-gradient-to-r from-blue-950/80 to-slate-900 border border-sky-500/40 p-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-bold text-sky-300 flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                    <span>المتجر الموثق المعتمد للإعلان:</span>
                  </span>
                  <span className="rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-black">
                    ✓ حساب موثق
                  </span>
                </div>

                {verifiedUserStores.length > 1 ? (
                  <select
                    value={selectedStoreId}
                    onChange={(e) => handleStoreChange(e.target.value)}
                    className="w-full rounded-xl border border-sky-500/40 bg-slate-800 px-3 py-2 text-xs font-bold text-white focus:border-sky-400 focus:outline-none"
                  >
                    {verifiedUserStores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.districtName || s.governorateName})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="flex items-center justify-between bg-slate-800/80 rounded-xl p-2.5 border border-slate-700">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/30 text-sky-300 font-bold">
                        <Building className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-white">
                          {activeSelectedStore?.name || 'متجرك الموثق'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {activeSelectedStore?.districtName} • {activeSelectedStore?.phone}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Pricing & Duration Tiers inside the Board */}
              <div>
                <label className="block text-xs font-black text-slate-200 mb-2">
                  اختر مدة الإعلان وسعر الباقة المعتمدة:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {DURATION_TIERS.map((tier) => (
                    <button
                      key={tier.id}
                      type="button"
                      onClick={() => {
                        setSelectedTierId(tier.id);
                        if (tier.scope === 'national') {
                          setTargetScope('national');
                        } else {
                          setTargetScope('governorate');
                        }
                      }}
                      className={`flex flex-col items-center justify-between rounded-2xl p-2.5 border transition-all cursor-pointer text-center ${
                        selectedTierId === tier.id
                          ? 'bg-gradient-to-b from-blue-700 to-sky-600 border-sky-300 text-white shadow-md shadow-sky-900/30 scale-[1.02]'
                          : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span className="text-[10px] font-bold text-amber-300 mb-0.5">
                        {tier.badge}
                      </span>
                      <span className="font-black text-xs sm:text-sm">
                        {tier.label}
                      </span>
                      <span className="mt-1 font-black text-xs text-white bg-black/30 px-2 py-0.5 rounded-lg">
                        {tier.priceText}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Scope Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  نطاق ظهور الإعلان:
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetScope('national')}
                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 px-2 text-xs font-bold border transition-all cursor-pointer ${
                      targetScope === 'national'
                        ? 'bg-blue-600 border-sky-400 text-white shadow-xs'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    <span>🇮🇶 عموم العراق (كل المحافظات)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetScope('governorate')}
                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 px-2 text-xs font-bold border transition-all cursor-pointer ${
                      targetScope === 'governorate'
                        ? 'bg-blue-600 border-sky-400 text-white shadow-xs'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    <span>🏛️ محافظة {activeSelectedStore?.governorateName || 'المتجر'}</span>
                  </button>
                </div>
              </div>

              {/* Headline */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  عنوان الإعلان والعرض الترويجي *
                </label>
                <input
                  type="text"
                  required
                  value={adHeadline}
                  onChange={(e) => setAdHeadline(e.target.value)}
                  placeholder="مثال: خصم 20% على كافة الوجبات والمشويات بمناسبة الافتتاح"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-bold text-white focus:border-sky-400 focus:outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  تفاصيل الإعلان (اختياري)
                </label>
                <textarea
                  rows={2}
                  value={adDescription}
                  onChange={(e) => setAdDescription(e.target.value)}
                  placeholder="أضف تفاصيل إضافية مثل العناوين أو أنواع الخدمات..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-xs text-white focus:border-sky-400 focus:outline-none resize-none"
                />
              </div>

              {/* Phones & Badges Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    هاتف الاتصال السريع *
                  </label>
                  <input
                    type="tel"
                    required
                    value={adPhone}
                    onChange={(e) => setAdPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white font-mono focus:border-sky-400 focus:outline-none"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    رقم الواتساب
                  </label>
                  <input
                    type="tel"
                    value={adWhatsapp}
                    onChange={(e) => setAdWhatsapp(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white font-mono focus:border-sky-400 focus:outline-none"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Offer Badge & Image URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    شارة العرض (بادج)
                  </label>
                  <input
                    type="text"
                    value={offerBadge}
                    onChange={(e) => setOfferBadge(e.target.value)}
                    placeholder="مثال: خصم 25% 🔥 أو توصيل مجاني"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-sky-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    رابط صورة المتجر أو البانر
                  </label>
                  <input
                    type="url"
                    value={adImageUrl}
                    onChange={(e) => setAdImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white font-mono focus:border-sky-400 focus:outline-none"
                    dir="ltr"
                  />
                </div>
              </div>

              {errorMessage && (
                <div className="flex items-center gap-2 rounded-xl bg-red-950/80 border border-red-800 p-2.5 text-xs text-red-200">
                  <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Submit to Payment */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                <div className="text-right">
                  <div className="text-[11px] text-slate-400">الإجمالي المستحق:</div>
                  <div className="text-base font-black text-amber-400">
                    {selectedTier.priceText}
                  </div>
                </div>

                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-sky-600 to-blue-700 hover:from-blue-500 hover:to-sky-500 text-white font-black px-6 py-2.5 text-xs shadow-md transition-all cursor-pointer active:scale-95"
                >
                  <span>متابعة للدفع والتأكيد</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          ) : step === 'payment' ? (
            /* CASE 3: PAYMENT STEP */
            <div className="space-y-4">
              {/* Ad Summary Card */}
              <div className="rounded-2xl bg-slate-800/80 border border-slate-700 p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">المتجر الموثق:</span>
                  <span className="font-bold text-white">{activeSelectedStore?.name}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">المدة والتكلفة:</span>
                  <span className="font-black text-amber-400">
                    {selectedTier.label} • {selectedTier.priceText}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">مكان النشر:</span>
                  <span className="font-bold text-sky-300">
                    لوحة الإعلانات الزرقاء ({targetScope === 'national' ? 'عموم العراق' : activeSelectedStore?.governorateName})
                  </span>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-300">
                  اختر وسيلة الدفع:
                </label>

                {/* ZainCash Option */}
                <div
                  onClick={() => setPaymentMethod('zaincash')}
                  className={`rounded-2xl p-3.5 border transition-all cursor-pointer ${
                    paymentMethod === 'zaincash'
                      ? 'bg-gradient-to-r from-red-950/40 to-slate-800 border-red-500 shadow-xs'
                      : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-600 text-white font-black text-xs">
                        Z
                      </div>
                      <span className="font-black text-xs text-white">محفظة زين كاش (ZainCash)</span>
                    </div>
                    <span className="text-xs font-bold text-amber-400">{selectedTier.priceText}</span>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed mb-2">
                    حوّل المبلغ إلى محفظة الإعلانات المعتمدة، ثم انسخ رقم العملية والصقه بالأسفل:
                  </p>

                  <div className="flex items-center justify-between bg-slate-900 rounded-xl p-2 border border-slate-700">
                    <div className="font-mono text-xs font-bold text-amber-400 px-2" dir="ltr">
                      07801459424
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyZain();
                      }}
                      className="flex items-center gap-1 bg-red-600/30 hover:bg-red-600 text-red-200 hover:text-white px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                    >
                      {copiedZain ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedZain ? 'تم النسخ' : 'نسخ الرقم'}</span>
                    </button>
                  </div>

                  {paymentMethod === 'zaincash' && (
                    <div className="mt-3">
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        رقم الإشعار / عملية التحويل (Transaction ID) *
                      </label>
                      <input
                        type="text"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        placeholder="مثال: 94817265"
                        className="w-full rounded-xl border border-red-500/50 bg-slate-900 px-3 py-2 text-xs text-white font-mono focus:outline-none"
                        dir="ltr"
                      />
                    </div>
                  )}
                </div>

                {/* Wallet Balance Option */}
                <div
                  onClick={() => setPaymentMethod('wallet')}
                  className={`rounded-2xl p-3.5 border transition-all cursor-pointer ${
                    paymentMethod === 'wallet'
                      ? 'bg-gradient-to-r from-emerald-950/40 to-slate-800 border-emerald-500 shadow-xs'
                      : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-xs">
                        <Wallet className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-black text-xs text-white">رصيد محفظة التطبيق</div>
                        <div className="text-[10px] text-slate-400">
                          رصيدك المتاح: {balance.toLocaleString('ar-IQ')} د.ع
                        </div>
                      </div>
                    </div>
                    {balance >= selectedTier.price ? (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/30">
                        رصيد كافٍ ✓
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded-md border border-rose-500/30">
                        الرصيد غير كافٍ
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {errorMessage && (
                <div className="flex items-center gap-2 rounded-xl bg-red-950/80 border border-red-800 p-2.5 text-xs text-red-200">
                  <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Actions */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer"
                >
                  تعديل الإعلان
                </button>

                <button
                  type="button"
                  onClick={handleConfirmAndPublish}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black py-2.5 text-xs shadow-md transition-all cursor-pointer active:scale-95"
                >
                  <Send className="h-4 w-4" />
                  <span>تأكيد ونشر الإعلان فوراً</span>
                </button>
              </div>
            </div>
          ) : (
            /* CASE 4: SUCCESS */
            <div className="text-center py-6 px-3 space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-bounce">
                <CheckCircle2 className="h-9 w-9" />
              </div>

              <div>
                <h4 className="font-display text-base font-black text-white">
                  تم نشر إعلان متجرك بنجاح في اللوحة الزرقاء! 🇮🇶
                </h4>
                <p className="mt-1 text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                  أصبح إعلان "{activeSelectedStore?.name}" معتمداً ونشطاً لمدة {selectedTier.label}. سيشاهده الزوار في صدارة التطبيق بالتناوب العادل كل 15 ثانية.
                </p>
              </div>

              <div className="rounded-2xl bg-blue-950/60 border border-sky-500/30 p-3 text-xs text-sky-200">
                ⭐ الإعلان يحتوي على أزرار اتصال وواتساب مباشرة مع شارة التوثيق الرسمية.
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white font-black px-8 py-2.5 text-xs shadow-md transition-all cursor-pointer active:scale-95"
                >
                  تم، عرض الإعلان الآن
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
