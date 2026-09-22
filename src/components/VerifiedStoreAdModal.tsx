import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Crown,
  Phone,
  MessageCircle,
  CreditCard,
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
  Eye,
  Trash2,
  Smartphone,
  Plus,
  Palette,
  Type,
  Activity,
  Maximize2,
  Wand2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useDirectory } from '../context/DirectoryContext';
import { useCategoryAds } from '../context/CategoryAdsContext';
import { useWallet } from '../context/WalletContext';
import { useNotification } from '../context/NotificationContext';
import { DirectoryItem } from '../types/directory';
import { safeApiFetch } from '../utils/apiClient';

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
    id: 'tier-national',
    days: 5,
    label: '5 أيام (عموم العراق 🇮🇶)',
    price: 25000,
    priceText: '25,000 د.ع',
    badge: 'عموم العراق 🇮🇶',
    scope: 'national',
  },
  {
    id: 'tier-gov',
    days: 5,
    label: '5 أيام (محافظتك ومدنها)',
    price: 15000,
    priceText: '15,000 د.ع',
    badge: 'مدن المحافظة 🏛️',
    scope: 'governorate',
  },
  {
    id: 'tier-store',
    days: 5,
    label: '5 أيام (المنطقة وصدارة القسم)',
    price: 10000,
    priceText: '10,000 د.ع',
    badge: 'صدارة القسم 👑',
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
  const { submitAdForApproval, addCategoryAd } = useCategoryAds();
  const { isManagerUnlocked } = useWallet();
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
    if (initialScope === 'governorate') return 'tier-gov';
    if (initialScope === 'store_area') return 'tier-store';
    return 'tier-national';
  });

  // Step state: 'form' | 'preview_modal' | 'payment' | 'success'
  const [step, setStep] = useState<'form' | 'payment' | 'success'>('form');
  const [isPreviewActive, setIsPreviewActive] = useState<boolean>(false);
  const [currentPreviewImageIdx, setCurrentPreviewImageIdx] = useState(0);

  // Core Form Fields
  const [businessName, setBusinessName] = useState('');
  const [adDescription, setAdDescription] = useState('');
  const [adPhone, setAdPhone] = useState('');
  const [adWhatsapp, setAdWhatsapp] = useState('');
  const [offerBadge, setOfferBadge] = useState('عرض حصري 👑');

  // Images Gallery (Up to 5 images)
  const [images, setImages] = useState<string[]>([]);
  const [imageUploadLoading, setImageUploadLoading] = useState(false);

  // AI Design Studio State
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large' | 'huge'>('medium');
  const [textColor, setTextColor] = useState<string>('#FFFFFF');
  const [bgColor, setBgColor] = useState<string>('gradient-navy');
  const [animationType, setAnimationType] = useState<'pulse' | 'slide' | 'glow' | 'subtle'>('glow');
  const [isAiGeneratingCopy, setIsAiGeneratingCopy] = useState(false);

  // Payment Form State
  const [paymentMethod, setPaymentMethod] = useState<'zaincash' | 'mastercard'>('zaincash');
  const [receiptImage, setReceiptImage] = useState<string>('');
  const [transactionRef, setTransactionRef] = useState('');
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Official Accounts (secured from backend/Supabase with fallbacks)
  const [paymentAccounts, setPaymentAccounts] = useState({
    zaincash: '07801459424',
    mastercard: '4538548308',
  });

  useEffect(() => {
    if (isOpen) {
      safeApiFetch('/api/payment-details')
        .then((res) => res.json())
        .then((data) => {
          if (data && data.success) {
            setPaymentAccounts({
              zaincash: data.zaincash?.number || '07801459424',
              mastercard: data.mastercard?.number || '4538548308',
            });
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  // Active store object
  const activeSelectedStore = useMemo(() => {
    if (selectedStoreId) {
      return items.find((s) => s.id === selectedStoreId) || null;
    }
    if (verifiedUserStores.length > 0) {
      return verifiedUserStores[0];
    }
    return null;
  }, [selectedStoreId, items, verifiedUserStores]);

  // Sync initial scope and store defaults
  useEffect(() => {
    if (isOpen) {
      if (initialScope === 'governorate') {
        setSelectedTierId('tier-gov');
      } else if (initialScope === 'store_area') {
        setSelectedTierId('tier-store');
      } else {
        setSelectedTierId('tier-national');
      }

      if (verifiedUserStores.length > 0 && !selectedStoreId) {
        const first = verifiedUserStores[0];
        setSelectedStoreId(first.id);
        setBusinessName(first.name);
        setAdDescription(first.description || `تفضلوا بزيارة ${first.name} للاستفادة من أحدث العروض والخدمات.`);
        setAdPhone(first.phone || '');
        setAdWhatsapp(first.phone || '');
        if (first.imageUrl && images.length === 0) {
          setImages([first.imageUrl]);
        }
      }
      setStep('form');
      setIsPreviewActive(false);
      setErrorMessage('');
      setReceiptImage('');
      setTransactionRef('');
    }
  }, [isOpen, initialScope, verifiedUserStores]);

  const selectedTier = DURATION_TIERS.find((t) => t.id === selectedTierId) || DURATION_TIERS[0];

  // Store selection handler
  const handleStoreSelect = (storeId: string) => {
    setSelectedStoreId(storeId);
    const found = items.find((s) => s.id === storeId);
    if (found) {
      setBusinessName(found.name);
      setAdDescription(found.description || `تفضلوا بزيارة ${found.name} للاستفادة من أحدث العروض.`);
      setAdPhone(found.phone || '');
      setAdWhatsapp(found.phone || '');
      if (found.imageUrl && images.length === 0) {
        setImages([found.imageUrl]);
      }
    }
  };

  // Image Upload Handler (up to 5 images)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length >= 5) {
      setErrorMessage('الحد الأقصى للصور هو 5 صور لكل إعلان.');
      return;
    }

    setImageUploadLoading(true);
    setErrorMessage('');

    const remainingSlots = 5 - images.length;
    const filesToRead = Array.from(files).slice(0, remainingSlots);

    let loadedCount = 0;
    const newImgs: string[] = [];

    filesToRead.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          newImgs.push(event.target.result as string);
        }
        loadedCount++;
        if (loadedCount === filesToRead.length) {
          setImages((prev) => [...prev, ...newImgs].slice(0, 5));
          setImageUploadLoading(false);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Remove image from gallery
  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== index));
    if (currentPreviewImageIdx >= images.length - 1) {
      setCurrentPreviewImageIdx(Math.max(0, images.length - 2));
    }
  };

  // Receipt image upload
  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setReceiptImage(ev.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Copy helper
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAccount(text);
    setTimeout(() => setCopiedAccount(null), 2500);
  };

  // AI Copy Enhancement feature
  const handleAiEnhanceCopy = () => {
    setIsAiGeneratingCopy(true);
    setTimeout(() => {
      const storeName = businessName.trim() || 'متجرنا';
      const enhancements = [
        `✨ عروض استثنائية وتخفيضات كبرى لدى ${storeName}! تفضلوا بزيارتنا أو تواصلوا مباشرة واستفيدوا من أقوى الخصومات والخدمات الحصرية التي لا تُفوّت.`,
        `👑 الجودة والتميز يجتمعان في ${storeName}! تشكيلة واسعة بأسعار تنافسية تلبي كافة احتياجاتكم مع خدمة سريعة وضمان حقيقي. سارعوا بالتواصل الآن!`,
        `🔥 مفاجآت وعروض حصرية لا تنتهي لدى ${storeName}! يسعدنا استقبالكم وتقديم أفضل العروض الخاصة في مدينتكم. اطلبوا الآن وتمتعوا بأفضل تجربة!`,
      ];
      const randomEnhanced = enhancements[Math.floor(Math.random() * enhancements.length)];
      setAdDescription(randomEnhanced);
      setIsAiGeneratingCopy(false);
    }, 700);
  };

  // Proceed to Payment screen
  const handleGoToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!businessName.trim()) {
      setErrorMessage('يرجى إدخال اسم المتجر أو النشاط التجاري!');
      return;
    }

    if (!adDescription.trim()) {
      setErrorMessage('يرجى كتابة تفاصيل وعروض الإعلان التجاري!');
      return;
    }

    if (!adPhone.trim()) {
      setErrorMessage('يرجى إدخال رقم هاتف التواصل مع المتجر!');
      return;
    }

    setStep('payment');
  };

  // Final Publish Submission -> Sends to Manager Dashboard
  const handleConfirmAndPublish = () => {
    setErrorMessage('');

    if (!receiptImage && !transactionRef.trim() && !isManagerUnlocked) {
      setErrorMessage('يرجى إرفاق صورة وصل التحويل أو إدخال رقم الإشعار لتأكيد نشر الإعلان لدى المدير.');
      return;
    }

    const store = activeSelectedStore;
    const storeName = businessName.trim() || store?.name || 'متجر موثق في دليل العراق';
    const govId = store ? store.governorateId : 'all';
    const govName = store ? store.governorateName : 'عموم العراق';
    const distId = store ? store.districtId : 'all';
    const distName = store ? store.districtName : 'كافة المحافظات';
    const catId = store ? store.category : 'general';
    const catName = store ? (store as any).categoryName || store.category || 'متاجر منوعة' : 'متاجر منوعة';

    const selectedScope = selectedTier.scope;

    // Submit to Manager with pending_approval status
    submitAdForApproval({
      scope: selectedScope,
      governorateId: selectedScope === 'national' ? 'all' : govId,
      governorateName: selectedScope === 'national' ? 'عموم العراق' : govName,
      districtId: selectedScope === 'national' ? 'all' : distId,
      districtName: selectedScope === 'national' ? 'كافة المحافظات' : distName,
      categoryId: catId,
      categoryName: catName,
      businessName: storeName,
      headline: storeName,
      description: adDescription.trim(),
      imageUrl: images[0] || 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
      images: images.length > 0 ? images : undefined,
      phone: adPhone.trim(),
      whatsapp: adWhatsapp.trim() || adPhone.trim(),
      offerBadge: offerBadge.trim() || 'إعلان ممول 👑',
      durationDays: selectedTier.days,
      price: selectedTier.price,
      paymentMethod: paymentMethod === 'zaincash' ? 'زين كاش (07801459424)' : 'ماستر كارد (4538548308)',
      receiptImage: receiptImage || undefined,
      aiStyle: {
        fontSize,
        textColor,
        bgColor,
        animation: animationType,
      },
    });

    confetti({
      particleCount: 85,
      spread: 70,
      origin: { y: 0.6 },
    });

    setStep('success');
  };

  if (!isOpen) return null;

  // Background gradient map for AI Preview
  const bgStyles: Record<string, string> = {
    'gradient-navy': 'bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border-sky-500/40',
    'gradient-gold': 'bg-gradient-to-r from-amber-950 via-slate-900 to-yellow-950 border-amber-500/40',
    'gradient-emerald': 'bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border-emerald-500/40',
    'gradient-red': 'bg-gradient-to-r from-rose-950 via-slate-900 to-red-950 border-rose-500/40',
    'gradient-purple': 'bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border-purple-500/40',
    'solid-black': 'bg-slate-950 border-slate-700',
  };

  // Font size map
  const fontSizeClasses: Record<string, { title: string; body: string }> = {
    small: { title: 'text-sm font-bold', body: 'text-xs leading-relaxed' },
    medium: { title: 'text-base font-black', body: 'text-xs sm:text-sm leading-relaxed' },
    large: { title: 'text-lg sm:text-xl font-black', body: 'text-sm sm:text-base leading-relaxed' },
    huge: { title: 'text-xl sm:text-2xl font-black', body: 'text-base sm:text-lg leading-relaxed' },
  };

  // Animation map
  const animationClasses: Record<string, string> = {
    pulse: 'animate-pulse',
    slide: 'transition-transform duration-500 hover:scale-[1.01]',
    glow: 'shadow-lg shadow-sky-500/20',
    subtle: '',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden text-white flex flex-col max-h-[94vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-blue-700 via-sky-600 to-blue-800 px-5 py-3.5 border-b border-white/20">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-400 text-slate-950 font-black shadow-md">
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-sm sm:text-base font-black text-white">
                منصة إنشاء ونشر إعلانات المتاجر الموثقة 🇮🇶
              </h3>
              <p className="text-[11px] text-sky-100 font-medium">
                تصميم ذكي بالذكاء الاصطناعي • تحويل مباشر عبر زين كاش وماستر كارد
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-right" dir="rtl">
          {/* STEP 1: FORM & AI DESIGN */}
          {step === 'form' && (
            <form onSubmit={handleGoToPayment} className="space-y-5">
              {/* Step Notice */}
              <div className="rounded-2xl bg-sky-950/40 border border-sky-500/30 p-3.5 flex items-start gap-2.5">
                <Sparkles className="h-5 w-5 text-sky-400 shrink-0 mt-0.5" />
                <div className="text-xs text-sky-200 leading-relaxed">
                  أنشئ إعلانك، أضف حتى 5 صور لمتجرك، وخصص التصميم وحجم الخط بالذكاء الاصطناعي، ثم اختبر الإعلان قبل النشر والتحويل.
                </div>
              </div>

              {/* Pricing Package Selector */}
              <div>
                <label className="block text-xs font-black text-slate-200 mb-2">
                  اختر باقة ونطاق ظهور الإعلان:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {DURATION_TIERS.map((tier) => {
                    const isSelected = selectedTierId === tier.id;
                    return (
                      <button
                        key={tier.id}
                        type="button"
                        onClick={() => setSelectedTierId(tier.id)}
                        className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-between ${
                          isSelected
                            ? 'bg-blue-600/30 border-sky-400 text-white shadow-md shadow-sky-900/30 scale-[1.02]'
                            : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <span className="text-[10px] font-bold text-amber-300 mb-1">
                          {tier.badge}
                        </span>
                        <span className="text-xs font-bold mb-1">{tier.label}</span>
                        <span className="font-black text-sm text-amber-400 bg-slate-950/60 px-2.5 py-0.5 rounded-lg border border-slate-800">
                          {tier.priceText}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Store Selection or Name Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-200">
                  اسم المتجر أو النشاط التجاري:
                </label>
                {verifiedUserStores.length > 0 ? (
                  <div className="space-y-2">
                    <select
                      value={selectedStoreId}
                      onChange={(e) => handleStoreSelect(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-xs font-bold text-white focus:border-sky-400 focus:outline-none"
                    >
                      {verifiedUserStores.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.districtName || s.governorateName})
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="اسم المتجر كما سيظهر في الإعلان"
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-xs text-white focus:border-sky-400 focus:outline-none"
                    />
                  </div>
                ) : (
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="مثال: أسواق بغداد الكبرى / مطعم البركة"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-xs text-white focus:border-sky-400 focus:outline-none"
                  />
                )}
              </div>

              {/* Ad Description / Details Field (Large) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-200">
                    تفاصيل الإعلان والعروض الترويجية:
                  </label>
                  <button
                    type="button"
                    onClick={handleAiEnhanceCopy}
                    disabled={isAiGeneratingCopy}
                    className="flex items-center gap-1 text-[11px] font-bold text-amber-300 hover:text-amber-200 transition-colors cursor-pointer bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/30"
                  >
                    <Wand2 className="h-3 w-3" />
                    <span>{isAiGeneratingCopy ? 'جاري التحسين بالذكاء...' : 'تحسين بالذكاء الاصطناعي'}</span>
                  </button>
                </div>
                <textarea
                  rows={4}
                  required
                  value={adDescription}
                  onChange={(e) => setAdDescription(e.target.value)}
                  placeholder="اكتب هنا تفاصيل العرض، الخصومات، الأصناف المشمولة، وأوقات العمل بدقة لجذب الزبائن..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3.5 text-xs text-white placeholder-slate-400 focus:border-sky-400 focus:outline-none leading-relaxed"
                />
              </div>

              {/* Photo Upload: Up to 5 Images */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <span>صور المتجر والإعلان:</span>
                    <span className="text-amber-400 font-mono text-[11px]">
                      ({images.length}/5 صور)
                    </span>
                  </label>
                  <span className="text-[10px] text-slate-400">
                    يمكنك إضافة حتى 5 صور من متجرك
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {images.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative group rounded-xl overflow-hidden border border-slate-700 aspect-square bg-slate-800"
                    >
                      <img
                        src={img}
                        alt={`صورة ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="p-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 cursor-pointer transition-colors"
                          title="حذف الصورة"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {idx === 0 && (
                        <span className="absolute bottom-1 right-1 bg-amber-500 text-slate-950 font-bold text-[9px] px-1.5 py-0.5 rounded-md">
                          الرئيسية
                        </span>
                      )}
                    </div>
                  ))}

                  {images.length < 5 && (
                    <label className="rounded-xl border-2 border-dashed border-slate-700 hover:border-amber-400/60 bg-slate-800/40 hover:bg-slate-800/80 transition-all flex flex-col items-center justify-center p-3 text-center cursor-pointer aspect-square">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <Plus className="h-6 w-6 text-amber-400 mb-1" />
                      <span className="text-[10px] font-bold text-slate-300">
                        {imageUploadLoading ? 'جاري التحميل...' : 'إضافة صورة'}
                      </span>
                    </label>
                  )}
                </div>
              </div>

              {/* AI Design Studio: Font Size, Colors, Background, and Animation */}
              <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4 space-y-3.5">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-xs font-bold text-amber-400">
                  <Palette className="h-4 w-4" />
                  <span>تخصيص التصميم بالذكاء الاصطناعي (AI Style Studio):</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Font Size */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1.5 flex items-center gap-1">
                      <Type className="h-3.5 w-3.5 text-sky-400" />
                      <span>حجم الخط:</span>
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { id: 'small', label: 'صغير' },
                        { id: 'medium', label: 'متوسط' },
                        { id: 'large', label: 'عريض' },
                        { id: 'huge', label: 'ضخم' },
                      ].map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setFontSize(s.id as any)}
                          className={`py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                            fontSize === s.id
                              ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs'
                              : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Font Color */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1.5">
                      لون الخط:
                    </label>
                    <div className="flex items-center gap-2">
                      {[
                        { color: '#FFFFFF', name: 'أبيض' },
                        { color: '#FBBF24', name: 'ذهبي' },
                        { color: '#38BDF8', name: 'سماوي' },
                        { color: '#34D399', name: 'زمردي' },
                        { color: '#F87171', name: 'أحمر' },
                      ].map((c) => (
                        <button
                          key={c.color}
                          type="button"
                          onClick={() => setTextColor(c.color)}
                          className={`flex-1 py-1 px-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                            textColor === c.color ? 'ring-2 ring-white scale-105' : 'opacity-80 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: c.color, color: c.color === '#FFFFFF' || c.color === '#FBBF24' ? '#000' : '#FFF' }}
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Background Theme */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1.5">
                      لون وتدرج الخلفية:
                    </label>
                    <select
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-bold text-white focus:outline-none"
                    >
                      <option value="gradient-navy">كحلي ملكي عراقي (Royal Navy)</option>
                      <option value="gradient-gold">فخامة ذهبية وسوداء (Gold Luxury)</option>
                      <option value="gradient-emerald">أخضر زمردي فاخر (Emerald)</option>
                      <option value="gradient-red">أحمر عراقي جذاب (Burgundy)</option>
                      <option value="gradient-purple">بنفسجي ملكي مميز (Purple)</option>
                      <option value="solid-black">أسود فاحم كلاسيكي (Deep Black)</option>
                    </select>
                  </div>

                  {/* Animation Style */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1.5 flex items-center gap-1">
                      <Activity className="h-3.5 w-3.5 text-sky-400" />
                      <span>حركة وتأثير الإعلان:</span>
                    </label>
                    <select
                      value={animationType}
                      onChange={(e) => setAnimationType(e.target.value as any)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-bold text-white focus:outline-none"
                    >
                      <option value="glow">وميض ولمعان ترويجي (Neon Glow)</option>
                      <option value="pulse">نبض وتكبير لافت (Pulse)</option>
                      <option value="slide">انزلاق سلس تفاعلي (Smooth Slide)</option>
                      <option value="subtle">هدوء وثبات ملكي (Subtle Elegance)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Phone & WhatsApp fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">
                    رقم هاتف الاتصال المباشر:
                  </label>
                  <input
                    type="tel"
                    required
                    value={adPhone}
                    onChange={(e) => setAdPhone(e.target.value)}
                    placeholder="مثال: 07801234567"
                    dir="ltr"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-xs text-white focus:border-sky-400 focus:outline-none text-right"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">
                    رقم الواتساب (اختياري):
                  </label>
                  <input
                    type="tel"
                    value={adWhatsapp}
                    onChange={(e) => setAdWhatsapp(e.target.value)}
                    placeholder="مثال: 07801234567"
                    dir="ltr"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-xs text-white focus:border-sky-400 focus:outline-none text-right"
                  />
                </div>
              </div>

              {/* LIVE TEST AD PREVIEW BUTTON & BANNER */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsPreviewActive(!isPreviewActive)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 hover:text-white border border-slate-700 text-xs font-bold transition-all cursor-pointer"
                >
                  <Eye className="h-4 w-4 text-sky-400" />
                  <span>{isPreviewActive ? 'إخفاء شاشة اختبار الإعلان' : 'اختبار الإعلان ومعاينته قبل النشر'}</span>
                </button>

                {isPreviewActive && (
                  <div className="rounded-2xl border p-4 transition-all duration-300 overflow-hidden relative shadow-xl space-y-3 animate-fade-in bg-slate-900 border-sky-500/40">
                    <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
                      <span className="font-bold text-amber-400 flex items-center gap-1">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>معاينة حية للإعلان في التطبيق:</span>
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {images.length > 0 ? `معرض الصور (${currentPreviewImageIdx + 1}/${images.length})` : 'بدون صورة'}
                      </span>
                    </div>

                    {/* The Live Rendered Banner */}
                    <div
                      className={`p-4 rounded-2xl border ${bgStyles[bgColor] || bgStyles['gradient-navy']} ${animationClasses[animationType] || ''}`}
                    >
                      <div className="flex flex-col sm:flex-row items-center gap-4">
                        {images.length > 0 && (
                          <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-2xl overflow-hidden border border-white/20 shadow-md">
                            <img
                              src={images[currentPreviewImageIdx] || images[0]}
                              alt="معاينة الإعلان"
                              className="w-full h-full object-cover"
                            />
                            {images.length > 1 && (
                              <div className="absolute inset-x-0 bottom-1 flex justify-center gap-1">
                                {images.map((_, i) => (
                                  <button
                                    key={i}
                                    type="button"
                                    onClick={() => setCurrentPreviewImageIdx(i)}
                                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                                      currentPreviewImageIdx === i ? 'w-4 bg-amber-400' : 'w-1.5 bg-white/50'
                                    }`}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex-1 space-y-1.5 text-center sm:text-right">
                          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                            <span className="rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 text-[10px] font-bold">
                              {offerBadge}
                            </span>
                            <span className="text-[10px] text-sky-200">
                              {selectedTier.badge}
                            </span>
                          </div>

                          <h4
                            className={`${fontSizeClasses[fontSize]?.title || 'text-base font-bold'}`}
                            style={{ color: textColor }}
                          >
                            {businessName || 'اسم المتجر'}
                          </h4>

                          <p
                            className={`${fontSizeClasses[fontSize]?.body || 'text-xs'} text-slate-200`}
                          >
                            {adDescription || 'تفاصيل الإعلان وعروض المتجر...'}
                          </p>

                          <div className="pt-2 flex items-center justify-center sm:justify-start gap-2 text-xs">
                            <div className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-lg text-white font-mono text-[11px]" dir="ltr">
                              <Phone className="h-3 w-3 text-emerald-400" />
                              <span>{adPhone || '0780xxxxxxx'}</span>
                            </div>
                            {adWhatsapp && (
                              <div className="flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-lg font-mono text-[11px]" dir="ltr">
                                <MessageCircle className="h-3 w-3" />
                                <span>واتساب</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="rounded-xl bg-rose-950/80 border border-rose-800 p-3 text-xs text-rose-200 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Proceed to Payment Action */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black px-6 py-2.5 text-xs shadow-lg transition-all cursor-pointer active:scale-95"
                >
                  <span>متابعة ونشر الإعلان</span>
                  <ArrowRight className="h-4 w-4 rotate-180" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: PAYMENT & RECEIPT ATTACHMENT */}
          {step === 'payment' && (
            <div className="space-y-5">
              {/* Payment Header & Total */}
              <div className="rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-amber-500/10 border border-amber-500/30 p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400">قيمة رسوم الإعلان المعتمدة:</div>
                  <div className="font-display text-lg sm:text-xl font-black text-amber-400">
                    {selectedTier.priceText}
                  </div>
                </div>
                <div className="text-left">
                  <span className="rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-1 text-xs font-bold">
                    {selectedTier.label}
                  </span>
                </div>
              </div>

              {/* Payment Methods Selector (ZainCash or MasterCard) */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300">
                  اختر طريقة التحويل المالي الفعلي:
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('zaincash')}
                    className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                      paymentMethod === 'zaincash'
                        ? 'border-amber-500 bg-amber-500/10 text-white shadow-md'
                        : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Smartphone className="h-6 w-6 text-amber-400" />
                    <span className="text-xs font-bold">محفظة زين كاش</span>
                    <span className="text-[10px] text-slate-400">ZainCash تحويل فوري</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('mastercard')}
                    className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                      paymentMethod === 'mastercard'
                        ? 'border-indigo-500 bg-indigo-500/10 text-white shadow-md'
                        : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <CreditCard className="h-6 w-6 text-indigo-400" />
                    <span className="text-xs font-bold">ماستر كارد (MasterCard)</span>
                    <span className="text-[10px] text-slate-400">تحويل مصرفي معتمد</span>
                  </button>
                </div>
              </div>

              {/* Account Details Box */}
              <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
                  <span className="font-bold text-white">
                    {paymentMethod === 'zaincash' ? 'رقم محفظة زين كاش الرسمية:' : 'رقم حساب وبطاقة الماستر كارد:'}
                  </span>
                  <span className="text-emerald-400 font-mono text-[11px]">حساب مفعل وموثق ✓</span>
                </div>

                <div className="flex items-center justify-between bg-slate-900 border border-slate-700 rounded-xl px-4 py-3">
                  <span className="font-mono text-lg sm:text-xl font-black text-amber-400 tracking-wider" dir="ltr">
                    {paymentMethod === 'zaincash' ? paymentAccounts.zaincash : paymentAccounts.mastercard}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        paymentMethod === 'zaincash' ? paymentAccounts.zaincash : paymentAccounts.mastercard
                      )
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
                  >
                    {copiedAccount ===
                    (paymentMethod === 'zaincash' ? paymentAccounts.zaincash : paymentAccounts.mastercard) ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
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

                <div className="text-[11px] text-slate-400 leading-relaxed bg-slate-900/50 p-2.5 rounded-xl border border-slate-800">
                  {paymentMethod === 'zaincash'
                    ? 'قم بالدخول إلى تطبيق زين كاش واختيار تحويل أموال للرقم الموضح أعلاه بمبلغ الباقة، ثم التقط لقطة شاشة للإشعار وأرفقها بالأسفل.'
                    : 'قم بالتحويل عبر تطبيق المصرف إلى رقم حساب الماستر كارد الموضح أعلاه بمبلغ الباقة، ثم التقط صورة للوصل أو الإشعار وأرفقه أدناه.'}
                </div>
              </div>

              {/* Receipt Image Upload Field */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-200 flex items-center justify-between">
                  <span>إرفاق صورة الوصل أو إشعار التحويل:</span>
                  <span className="text-amber-400 text-[11px] font-normal">مطلوب لمراجعة المدير</span>
                </label>

                {receiptImage ? (
                  <div className="relative rounded-2xl overflow-hidden border border-emerald-500/50 bg-slate-950 p-2 flex items-center gap-3">
                    <img
                      src={receiptImage}
                      alt="وصل التحويل"
                      className="h-20 w-20 object-cover rounded-xl border border-slate-700"
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>تم إرفاق صورة الوصل بنجاح</span>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        سيقوم المدير بمراجعة هذا الوصل وتفعيل الإعلان فوراً.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReceiptImage('')}
                      className="p-2 rounded-xl bg-rose-950 text-rose-300 hover:bg-rose-900 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="rounded-2xl border-2 border-dashed border-slate-700 hover:border-amber-400/60 bg-slate-800/40 hover:bg-slate-800/80 p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleReceiptUpload}
                      className="hidden"
                    />
                    <Upload className="h-7 w-7 text-amber-400 mb-1.5" />
                    <span className="text-xs font-bold text-white mb-0.5">
                      انقر هنا لإرفاق لقطة شاشة لوصل التحويل
                    </span>
                    <span className="text-[10px] text-slate-400">
                      يدعم صور الهاتف وملفات JPG و PNG
                    </span>
                  </label>
                )}
              </div>

              {/* Transaction Ref Number (Optional fallback) */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-300">
                  رقم عملية التحويل / كود الإشعار (اختياري):
                </label>
                <input
                  type="text"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  placeholder="مثال: رقم العملية من زين كاش أو الماستر"
                  dir="ltr"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-xs text-white focus:border-sky-400 focus:outline-none text-right"
                />
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="rounded-xl bg-rose-950/80 border border-rose-800 p-3 text-xs text-rose-200 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer"
                >
                  الرجوع لتعديل الإعلان
                </button>

                <button
                  type="button"
                  onClick={handleConfirmAndPublish}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black px-6 py-2.5 text-xs shadow-lg transition-all cursor-pointer active:scale-95"
                >
                  <Send className="h-4 w-4" />
                  <span>إرسال الإعلان للمدير للمراجعة والنشر</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SUCCESS CONFIRMATION */}
          {step === 'success' && (
            <div className="text-center py-6 px-3 space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="h-8 w-8" />
              </div>

              <div className="space-y-1">
                <h4 className="font-display text-lg font-black text-white">
                  تم إرسال إعلانك بنجاح إلى إدارة دليل العراق!
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                  تم تحويل الإعلان مع صورة وصل التحويل إلى لوحة المدير العام للمراجعة. سيتم نشر إعلانك في لوحة الإعلانات فور تدقيق الوصل.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-950/70 border border-slate-800 p-4 text-xs text-slate-300 space-y-2 max-w-sm mx-auto text-right">
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">اسم المتجر:</span>
                  <span className="font-bold text-white">{businessName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">الباقة والنطاق:</span>
                  <span className="font-bold text-amber-400">{selectedTier.label}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">طريقة الدفع:</span>
                  <span className="font-bold text-sky-400">
                    {paymentMethod === 'zaincash' ? 'زين كاش' : 'ماستر كارد'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">حالة الإعلان:</span>
                  <span className="font-bold text-amber-300">بانتظار موافقة ونشر المدير</span>
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-6 py-2.5 text-xs transition-colors cursor-pointer shadow-md"
                >
                  تم، العودة إلى التطبيق
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
