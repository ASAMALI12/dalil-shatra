import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Crown,
  Phone,
  MessageCircle,
  CreditCard,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Upload,
  Copy,
  Check,
  Send,
  Trash2,
  Plus,
  CheckCircle,
  RefreshCw,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  CinematicAdBillboard,
  AI_BILLBOARD_STYLES,
} from './CinematicAdBillboard';
import { CIRCULAR_CATEGORIES } from './StoresCircularView';
import { useDirectory } from '../context/DirectoryContext';
import { useCategoryAds } from '../context/CategoryAdsContext';
import { useWallet } from '../context/WalletContext';
import { DirectoryItem } from '../types/directory';
import { safeApiFetch } from '../utils/apiClient';

interface VerifiedStoreAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenClaimStore?: (store?: DirectoryItem) => void;
  initialScope?: 'national' | 'governorate' | 'store_area';
  initialCategoryId?: string;
  initialCategoryTitle?: string;
  initialGovernorateId?: string;
  initialGovernorateName?: string;
  initialDistrictId?: string;
  initialDistrictName?: string;
}

export interface DurationTier {
  id: string;
  days: number;
  label: string;
  price: number;
  priceText: string;
  badge: string;
  scope: 'national' | 'governorate' | 'store_area';
  description: string;
}

export const DURATION_TIERS: DurationTier[] = [
  {
    id: 'tier-store',
    days: 5,
    label: '5 أيام (صدارة القسم والمنطقة)',
    price: 10000,
    priceText: '10,000 د.ع',
    badge: 'صدارة القسم 👑',
    scope: 'store_area',
    description: 'يتصدر إعلانك أعلى صفحة القسم المحدد في مدينتك',
  },
  {
    id: 'tier-gov',
    days: 5,
    label: '5 أيام (محافظتك ومدنها)',
    price: 15000,
    priceText: '15,000 د.ع',
    badge: 'مدن المحافظة 🏛️',
    scope: 'governorate',
    description: 'يظهر إعلانك في صدارة جميع أقضية ومدن محافظتك',
  },
  {
    id: 'tier-national',
    days: 5,
    label: '5 أيام (عموم العراق 🇮🇶)',
    price: 25000,
    priceText: '25,000 د.ع',
    badge: 'عموم العراق 🇮🇶',
    scope: 'national',
    description: 'يظهر إعلانك في الشاشة الرئيسية لجميع مستخدمي دليل العراق',
  },
];

export const VerifiedStoreAdModal: React.FC<VerifiedStoreAdModalProps> = ({
  isOpen,
  onClose,
  initialScope = 'store_area',
  initialCategoryId,
  initialCategoryTitle,
  initialGovernorateId,
  initialGovernorateName,
  initialDistrictId,
  initialDistrictName,
}) => {
  const { items, claimedStoreIds, isUserStoreOwner } = useDirectory();
  const { submitAdForApproval } = useCategoryAds();
  const { isManagerUnlocked } = useWallet();

  const [selectedTierId, setSelectedTierId] = useState<string>(() => {
    if (initialScope === 'governorate') return 'tier-gov';
    if (initialScope === 'national') return 'tier-national';
    return 'tier-store';
  });

  const [targetCategoryId, setTargetCategoryId] = useState<string>(() => {
    return initialCategoryId || 'restaurants';
  });

  // Flow Step: 'create' | 'otp_verify' | 'payment' | 'success'
  const [step, setStep] = useState<'create' | 'otp_verify' | 'payment' | 'success'>('create');

  // ONLY THE REQUESTED FIELDS:
  // 1. Photos (1 to 5)
  // 2. Description (free text)
  // 3. Phone (single phone number)
  const [images, setImages] = useState<string[]>([]);
  const [adDescription, setAdDescription] = useState('');
  const [adPhone, setAdPhone] = useState('');
  const [imageUploadLoading, setImageUploadLoading] = useState(false);

  // OTP Verification State
  const [verifiedPhones, setVerifiedPhones] = useState<string[]>([]);
  const [whatsappDirectUrl, setWhatsappDirectUrl] = useState<string>('');
  const [otpInput, setOtpInput] = useState<string>('');
  const [otpError, setOtpError] = useState<string>('');
  const [resendTimer, setResendTimer] = useState<number>(0);
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false);

  // AI Style cycling
  const [currentAiStyleIndex, setCurrentAiStyleIndex] = useState(0);
  const [isAiGeneratingStyle, setIsAiGeneratingStyle] = useState(false);

  // Payment Form State
  const [paymentMethod, setPaymentMethod] = useState<'zaincash' | 'mastercard'>('zaincash');
  const [receiptImage, setReceiptImage] = useState<string>('');
  const [transactionRef, setTransactionRef] = useState('');
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Payment accounts
  const [paymentAccounts, setPaymentAccounts] = useState({
    zaincash: '',
    mastercard: '',
  });

  // Countdown timer for OTP resend
  useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendTimer]);

  useEffect(() => {
    if (isOpen) {
      safeApiFetch('/api/payment-details')
        .then((res) => res.json())
        .then((data) => {
          if (data && data.success) {
            setPaymentAccounts({
              zaincash: data.zaincash?.number || '',
              mastercard: data.mastercard?.number || '',
            });
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  const currentCategoryObj = useMemo(() => {
    return (
      CIRCULAR_CATEGORIES.find((c) => c.id === targetCategoryId) || {
        id: 'restaurants',
        title: 'المطاعم والمأكولات',
        icon: '🍽️',
      }
    );
  }, [targetCategoryId]);

  useEffect(() => {
    if (isOpen) {
      if (initialScope === 'governorate') {
        setSelectedTierId('tier-gov');
      } else if (initialScope === 'national') {
        setSelectedTierId('tier-national');
      } else {
        setSelectedTierId('tier-store');
      }

      if (initialCategoryId) {
        setTargetCategoryId(initialCategoryId);
      }
    }
  }, [isOpen, initialScope, initialCategoryId]);

  const selectedTier = useMemo(() => {
    return DURATION_TIERS.find((t) => t.id === selectedTierId) || DURATION_TIERS[0];
  }, [selectedTierId]);

  const activeAiStyle = AI_BILLBOARD_STYLES[currentAiStyleIndex % AI_BILLBOARD_STYLES.length];

  // Check if current phone is already verified
  const isCurrentPhoneVerified = useMemo(() => {
    const clean = adPhone.replace(/\D/g, '');
    if (!clean || clean.length < 8) return false;

    // Check session verified phones
    if (verifiedPhones.includes(clean)) return true;

    // Check directory items for claimed/verified stores
    return items.some((s) => {
      const p1 = s.phone?.replace(/\D/g, '');
      const p2 = s.claimedByPhone?.replace(/\D/g, '');
      const matchesPhone = p1 === clean || p2 === clean;
      const isVerified =
        s.isClaimed ||
        s.phoneReliability === 'otp_verified' ||
        claimedStoreIds.includes(s.id) ||
        isUserStoreOwner(s.id);
      return matchesPhone && isVerified;
    });
  }, [adPhone, verifiedPhones, items, claimedStoreIds, isUserStoreOwner]);

  // Image upload handler (Up to 5 images)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setImageUploadLoading(true);
    const filesToRead = Array.from(files).slice(0, 5 - images.length);

    Promise.all(
      filesToRead.map((file) => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            resolve(event.target?.result as string);
          };
          reader.readAsDataURL(file);
        });
      })
    )
      .then((base64List) => {
        setImages((prev) => [...prev, ...base64List].slice(0, 5));
        setImageUploadLoading(false);
      })
      .catch(() => {
        setImageUploadLoading(false);
      });
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Magic AI Button: Generates and cycles billboard designs until user is pleased
  const handleGenerateAiBillboard = () => {
    setIsAiGeneratingStyle(true);
    setTimeout(() => {
      // Cycle to next style
      setCurrentAiStyleIndex((prev) => (prev + 1) % AI_BILLBOARD_STYLES.length);

      // AI polish / suggestions if description is short or empty
      if (!adDescription.trim()) {
        const categoryTitle = currentCategoryObj.title;
        const suggestions = [
          `أهلاً بكم! نسعد بزيارتكم وخدمتكم بأفضل جودة وأرقى المعايير في عالم ${categoryTitle}.`,
          `عرض خاص وحصري! تفضلوا بزيارتنا للاستمتاع بأرقى الخدمات والأسعار المناسبة.`,
          `نسعد بخدمتكم وتلبية كافة طلباتكم يومياً، أهلاً وسهلاً بالجميع.`,
        ];
        setAdDescription(suggestions[Math.floor(Math.random() * suggestions.length)]);
      }

      setIsAiGeneratingStyle(false);
    }, 250);
  };

  // Send WhatsApp OTP function via secure server endpoint
  const triggerSendOtp = (targetPhone: string) => {
    setIsSendingOtp(true);
    setOtpError('');
    setOtpInput('');
    setResendTimer(60);

    // Call secure server OTP endpoint (server generates OTP cryptographically and sends to WhatsApp)
    safeApiFetch('/api/ad/request-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: targetPhone,
      }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (data && data.success) {
          if (data.whatsappUrl) {
            setWhatsappDirectUrl(data.whatsappUrl);
          }
        } else {
          setOtpError(data?.error || 'تعذر إرسال رمز التحقق عبر الواتساب حالياً. يرجى المحاولة بعد قليل.');
        }
      })
      .catch(() => {
        setOtpError('فشل الاتصال بالخادم لإرسال رمز التحقق.');
      })
      .finally(() => {
        setIsSendingOtp(false);
      });
  };

  // Step 1 -> Validation and routing to OTP Verification or Payment
  const handleProceedFromCreate = () => {
    setErrorMessage('');
    const cleanPhone = adPhone.replace(/\D/g, '');

    if (!adPhone.trim() || cleanPhone.length < 8) {
      setErrorMessage('يرجى إدخال رقم هاتف صحيح للتواصل المباشر والتوثيق!');
      return;
    }
    if (!adDescription.trim()) {
      setErrorMessage('يرجى كتابة وصف للإعلان في مربع الوصف!');
      return;
    }

    // STRICT CHECK: If phone is not verified, require WhatsApp OTP verification before payment!
    if (!isCurrentPhoneVerified) {
      triggerSendOtp(adPhone.trim());
      setStep('otp_verify');
      return;
    }

    // Phone already verified -> go to payment
    setStep('payment');
  };

  // Step 2 -> Verify OTP submitted by user against server hash
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');

    const cleanInput = otpInput.trim();
    if (cleanInput.length !== 6) {
      setOtpError('يرجى إدخال رمز التحقق المكون من 6 أرقام بالكامل.');
      return;
    }

    setIsSendingOtp(true);
    try {
      const res = await safeApiFetch('/api/ad/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: adPhone.trim(),
          otp: cleanInput,
        }),
      });

      const data = await res.json().catch(() => ({}));
      setIsSendingOtp(false);

      if (!res.ok || !data?.success) {
        setOtpError(data?.error || 'رمز التحقق غير صحيح أو انتهت صلاحيته. يرجى التأكد من الرسالة في الواتساب.');
        return;
      }

      // Mark phone as verified
      const cleanPhone = adPhone.replace(/\D/g, '');
      setVerifiedPhones((prev) => [...prev, cleanPhone]);

      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });

      // Successfully verified -> advance to payment!
      setStep('payment');
    } catch {
      setIsSendingOtp(false);
      setOtpError('تعذر الاتصال بالخادم للتحقق من الرمز.');
    }
  };

  // Step 3 -> Final Publish Submission
  const handleConfirmAndPublish = () => {
    setErrorMessage('');

    if (!receiptImage && !transactionRef.trim() && !isManagerUnlocked) {
      setErrorMessage('يرجى إرفاق صورة وصل التحويل أو إدخال رقم الإشعار لتأكيد نشر الإعلان.');
      return;
    }

    const govId = initialGovernorateId || 'all';
    const govName = initialGovernorateName || 'عموم العراق';
    const distId = initialDistrictId || 'all';
    const distName = initialDistrictName || 'كافة الأقضية';

    const selectedScope = selectedTier.scope;
    const finalCategoryId = selectedScope === 'national' ? 'all' : targetCategoryId;
    const finalCategoryName = selectedScope === 'national' ? 'عموم العراق' : currentCategoryObj.title;

    // Use description or derived headline
    const headline = adDescription.split(/[.\n-،]/)[0]?.trim().slice(0, 50) || 'إعلان معتمد في دليل العراق';

    submitAdForApproval({
      scope: selectedScope,
      governorateId: selectedScope === 'national' ? 'all' : govId,
      governorateName: selectedScope === 'national' ? 'عموم العراق' : govName,
      districtId: selectedScope === 'national' ? 'all' : distId,
      districtName: selectedScope === 'national' ? 'كافة المحافظات' : distName,
      categoryId: finalCategoryId,
      categoryName: finalCategoryName,
      businessName: headline,
      headline,
      description: adDescription.trim(),
      imageUrl: images[0] || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=85',
      images: images.length > 0 ? images : undefined,
      phone: adPhone.trim(),
      whatsapp: adPhone.trim(),
      offerBadge: 'موثق 👑',
      durationDays: selectedTier.days,
      price: selectedTier.price,
      paymentMethod: paymentMethod === 'zaincash' ? `زين كاش (${paymentAccounts.zaincash || 'المعتمدة'})` : `ماستر كارد (${paymentAccounts.mastercard || 'المعتمدة'})`,
      receiptImage: receiptImage || undefined,
      aiStyle: {
        lightingTheme: activeAiStyle.id,
      },
    });

    confetti({
      particleCount: 90,
      spread: 75,
      origin: { y: 0.6 },
    });

    setStep('success');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-2 sm:p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-3xl max-h-[94vh] rounded-3xl border border-amber-500/40 bg-slate-900 shadow-2xl overflow-hidden">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/90 px-4 sm:px-6 py-2.5 text-right" dir="rtl">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-400/40">
              <Crown className="h-4 w-4 animate-pulse" />
            </div>
            <div>
              <h2 className="font-display text-sm font-black text-white">
                لوحة إعلانات المتاجر والمشاريع 👑
              </h2>
              <p className="text-[10px] text-amber-300 font-medium">
                {selectedTier.badge} • مستطيل الإعلان الحقيقي بنسبة 1:1 مع الموقع
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-4 text-right" dir="rtl">
          {/* ========================================================================= */}
          {/* 1. CREATION SCREEN: ONLY REQUESTED FIELDS + AI BUTTON + 1:1 RECTANGLE */}
          {/* ========================================================================= */}
          {step === 'create' && (
            <div className="space-y-3.5">
              {/* Scope Bar */}
              <div className="rounded-xl bg-slate-950 p-2.5 sm:p-3 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                  <span className="font-bold text-slate-300">نطاق الإعلان:</span>
                  <div className="flex items-center gap-1.5">
                    {DURATION_TIERS.map((tier) => {
                      const isSel = selectedTierId === tier.id;
                      return (
                        <button
                          key={tier.id}
                          type="button"
                          onClick={() => setSelectedTierId(tier.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            isSel
                              ? 'bg-blue-600 text-white shadow-md font-black'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {tier.badge} ({tier.priceText})
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Categories ONLY for store_area (Inside Stores) */}
                {selectedTier.scope === 'store_area' && (
                  <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-amber-300">
                        صدارة قسم: {currentCategoryObj.title} {currentCategoryObj.icon}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        اختر القسم المناسب لإعلانك
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {CIRCULAR_CATEGORIES.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setTargetCategoryId(cat.id)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                            targetCategoryId === cat.id
                              ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                          }`}
                        >
                          <span>{cat.icon}</span>
                          <span>{cat.shortTitle || cat.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 1. PHOTOS (1 to 5 Images, Horizontal Rectangular Preview) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200">
                    صور المتجر (من صورة إلى 5 صور):{' '}
                    <span className="text-amber-400 font-mono">({images.length}/5)</span>
                  </span>
                  <span className="text-[10px] text-slate-400">
                    تتناوب في اللوحة كل 3 ثوانٍ
                  </span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {images.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative group rounded-xl overflow-hidden border border-slate-700 aspect-[2.6/1] bg-slate-800 shadow-sm"
                    >
                      <img
                        src={img}
                        alt={`صورة ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute inset-0 bg-red-950/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 cursor-pointer text-[10px] font-bold"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-400" />
                        <span>حذف</span>
                      </button>
                    </div>
                  ))}

                  {images.length < 5 && (
                    <label className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-600 hover:border-amber-400 bg-slate-800/40 hover:bg-slate-800/80 aspect-[2.6/1] cursor-pointer transition-all">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={imageUploadLoading}
                      />
                      <Plus className="h-4 w-4 text-amber-400" />
                      <span className="text-[10px] font-bold text-slate-300">
                        {imageUploadLoading ? 'رفع...' : '+ أضف صورة'}
                      </span>
                    </label>
                  )}
                </div>
              </div>

              {/* 2. DESCRIPTION BOX (Free text - write whatever you want!) */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-200">
                  مربع الوصف (اكتب ما تريده بحرية):
                </label>
                <textarea
                  rows={2}
                  required
                  value={adDescription}
                  onChange={(e) => setAdDescription(e.target.value)}
                  placeholder="اكتب هنا تفاصيل إعلانك، اسم مطعمك أو مشروعك، خدماتك، أو أي تفاصيل تفضلها بحرية تامة..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-xs text-white placeholder-slate-400 focus:border-amber-400 focus:outline-none leading-relaxed"
                />
              </div>

              {/* 3. PHONE NUMBER (Single phone field with verification status indicator) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold text-slate-200 flex items-center gap-1">
                    <Phone className="h-3 w-3 text-emerald-400" />
                    <span>رقم الهاتف الموثق للتواصل:</span>
                  </label>
                  {isCurrentPhoneVerified ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      <ShieldCheck className="h-3 w-3" />
                      <span>رقم موثق رسمياً ✓</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-500/30">
                      <Lock className="h-2.5 w-2.5" />
                      <span>سيتطلب رمز واتساب قبل الدفع</span>
                    </span>
                  )}
                </div>

                <input
                  type="tel"
                  required
                  value={adPhone}
                  onChange={(e) => setAdPhone(e.target.value)}
                  placeholder="0780xxxxxxx"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none font-mono"
                />
              </div>

              {/* 4. THE AI DESIGN & MOTION GENERATOR BUTTON */}
              <button
                type="button"
                onClick={handleGenerateAiBillboard}
                disabled={isAiGeneratingStyle}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500/20 via-sky-500/20 to-purple-500/20 hover:from-amber-500/30 hover:to-purple-500/30 border border-amber-400/50 text-white font-bold text-xs shadow-md transition-all cursor-pointer active:scale-98"
              >
                <RefreshCw className={`h-3.5 w-3.5 text-amber-400 ${isAiGeneratingStyle ? 'animate-spin' : ''}`} />
                <span>
                  توليد حركة وتصميم بالذكاء الاصطناعي ✨ ({activeAiStyle.motionName} - {activeAiStyle.name})
                </span>
              </button>

              {/* 5. EXACT 1:1 REAL BILLBOARD RECTANGLE PREVIEW */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-bold text-slate-300">
                    معاينة مستطيل الإعلان الحقيقي (مطابق 1:1 لما سيظهر في الموقع):
                  </span>
                  <span className="text-amber-300 font-medium">كتابة شفافة متحركة • صور تملأ المستطيل بالكامل</span>
                </div>

                <div className="w-full">
                  <CinematicAdBillboard
                    description={adDescription}
                    images={images}
                    phone={adPhone}
                    scope={selectedTier.scope}
                    governorateName={initialGovernorateName || 'المحافظة'}
                    districtName={initialDistrictName || 'كافة الأقضية'}
                    categoryName={selectedTier.scope === 'national' ? 'عموم العراق' : currentCategoryObj.title}
                    aiStyleId={activeAiStyle.id}
                    isLivePreview={true}
                  />
                </div>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-500/40 text-xs text-red-200 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Next Step Button */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleProceedFromCreate}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black py-2.5 px-6 text-sm shadow-xl shadow-emerald-950/50 transition-all cursor-pointer active:scale-98"
                >
                  <span>
                    {isCurrentPhoneVerified
                      ? 'تأكيد اللوحة والمتابعة للدفع ونشر الإعلان 🚀'
                      : 'توثيق رقم الهاتف عبر الواتساب والمتابعة 💬'}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. MANDATORY WHATSAPP OTP VERIFICATION STEP */}
          {/* ========================================================================= */}
          {step === 'otp_verify' && (
            <div className="space-y-4 py-2 animate-in fade-in duration-200 max-w-lg mx-auto">
              <div className="text-center space-y-2">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/40 shadow-lg shadow-emerald-950/50">
                  <MessageCircle className="h-7 w-7 animate-pulse" />
                </div>
                <h3 className="text-base font-black text-white">
                  توثيق رقم الهاتف عبر الواتساب 💬
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  لضمان موثوقية وأمان الإعلانات، يقتصر نشر الإعلانات على أصحاب الأرقام الحقيقية الموثقة برمز التحقق.
                </p>
                <div className="inline-block bg-slate-800 border border-slate-700 rounded-xl px-3 py-1 font-mono text-sm text-emerald-400 font-bold">
                  {adPhone}
                </div>
              </div>

              {/* Secure WhatsApp Privacy & Instructions Box */}
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-center space-y-2.5 shadow-lg">
                <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold text-xs">
                  <MessageCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>تم إرسال كود التحقق في رسالة خاصة إلى الواتساب</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto">
                  لأسباب أمنية وحماية خصوصية صاحب المتجر، يصل كود التحقق حصراً في رسالة خاصة إلى تطبيق <strong>WhatsApp</strong> على رقم هاتفك.
                </p>
                <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-amber-300 font-medium">
                  📱 يرجى فتح تطبيق الواتساب الآن، نسخ كود التحقق (6 أرقام)، ولصقه في المربع أدناه.
                </div>
                {whatsappDirectUrl && (
                  <div className="pt-1">
                    <a
                      href={whatsappDirectUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>فتح تطبيق الواتساب لاستلام الكود 💬</span>
                    </a>
                  </div>
                )}
              </div>

              {/* OTP Form */}
              <form onSubmit={handleVerifyOtp} className="space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-200">
                      أدخل رمز التحقق المكون من 6 أرقام:
                    </label>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const text = await navigator.clipboard.readText();
                          const clean = text.replace(/\D/g, '').slice(0, 6);
                          if (clean) {
                            setOtpInput(clean);
                            setOtpError('');
                          }
                        } catch {
                          setOtpError('يرجى لصق الرمز يدوياً داخل الحقل.');
                        }
                      }}
                      className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <span>📋 لصق الرمز من الحافظة</span>
                    </button>
                  </div>

                  <input
                    type="text"
                    maxLength={6}
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="------"
                    autoFocus
                    className="w-full text-center tracking-widest text-2xl font-mono font-black rounded-2xl border-2 border-emerald-500/50 bg-slate-950 px-4 py-3 text-white focus:border-emerald-400 focus:outline-none shadow-inner"
                  />
                </div>

                {otpError && (
                  <div className="p-2.5 rounded-xl bg-red-950/70 border border-red-500/40 text-xs text-red-200 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                    <span>{otpError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={otpInput.trim().length !== 6 || isSendingOtp}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-black py-3 px-6 text-sm shadow-xl shadow-emerald-950/60 transition-all cursor-pointer active:scale-98"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>{isSendingOtp ? 'جاري التحقق من الخادم...' : 'تأكيد الرمز وتوثيق الرقم والمتابعة 🚀'}</span>
                </button>
              </form>

              {/* Resend and Back buttons */}
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setStep('create')}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  ← تعديل رقم الهاتف
                </button>

                <button
                  type="button"
                  disabled={resendTimer > 0 || isSendingOtp}
                  onClick={() => triggerSendOtp(adPhone.trim())}
                  className="text-emerald-400 hover:text-emerald-300 disabled:text-slate-500 transition-colors cursor-pointer font-bold"
                >
                  {resendTimer > 0
                    ? `إعادة الإرسال خلال (${resendTimer} ثانية)`
                    : 'إعادة إرسال الرمز عبر الواتساب'}
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 3. PAYMENT STEP */}
          {/* ========================================================================= */}
          {step === 'payment' && (
            <div className="space-y-3.5 animate-in fade-in duration-200">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-amber-300 font-bold">
                  <span>لوحة الإعلان المعتمدة للنشر:</span>
                  <span>{selectedTier.label} - {selectedTier.priceText}</span>
                </div>
                <CinematicAdBillboard
                  description={adDescription}
                  images={images}
                  phone={adPhone}
                  scope={selectedTier.scope}
                  governorateName={initialGovernorateName || 'المحافظة'}
                  districtName={initialDistrictName || 'كافة الأقضية'}
                  categoryName={selectedTier.scope === 'national' ? 'عموم العراق' : currentCategoryObj.title}
                  aiStyleId={activeAiStyle.id}
                  isLivePreview={true}
                />
              </div>

              {/* Payment selector */}
              <div className="space-y-2">
                <span className="block text-xs font-bold text-slate-200">
                  وسيلة تحويل مبلغ الإعلان ({selectedTier.priceText}):
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('zaincash')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      paymentMethod === 'zaincash'
                        ? 'bg-amber-500/20 border-amber-400 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="text-base">📱</span>
                    <span className="text-xs font-bold">زين كاش (Zain Cash)</span>
                    <span className="text-[11px] text-amber-300 font-mono font-bold">{paymentAccounts.zaincash || 'المحفظة المعتمدة'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('mastercard')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      paymentMethod === 'mastercard'
                        ? 'bg-amber-500/20 border-amber-400 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <CreditCard className="h-4 w-4 text-amber-400" />
                    <span className="text-xs font-bold">ماستر كارد (MasterCard)</span>
                    <span className="text-[11px] text-amber-300 font-mono font-bold">4538548308</span>
                  </button>
                </div>

                <div className="rounded-xl bg-slate-950 border border-slate-800 p-2.5 flex items-center justify-between">
                  <span className="text-xs text-slate-300 font-bold">
                    رقم الحساب:
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-black text-amber-400">
                      {paymentMethod === 'zaincash' ? paymentAccounts.zaincash : paymentAccounts.mastercard}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const val = paymentMethod === 'zaincash' ? paymentAccounts.zaincash : paymentAccounts.mastercard;
                        navigator.clipboard.writeText(val);
                        setCopiedAccount(val);
                        setTimeout(() => setCopiedAccount(null), 2000);
                      }}
                      className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-bold cursor-pointer"
                    >
                      {copiedAccount ? 'تم النسخ!' : 'نسخ'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Receipt Upload & Transaction Ref */}
              <div className="space-y-2">
                <label className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-dashed border-slate-700 hover:border-amber-400 bg-slate-800/40 cursor-pointer text-xs text-slate-300 font-bold">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => setReceiptImage(event.target?.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                  />
                  <Upload className="h-4 w-4 text-amber-400" />
                  <span>{receiptImage ? '✓ تم إرفاق الوصل (اضغط للتغيير)' : 'اضغط لإرفاق صورة وصل التحويل'}</span>
                </label>

                <input
                  type="text"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  placeholder="أو أدخل رقم الإشعار / العملية (اختياري مع الوصل)"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none font-mono"
                />
              </div>

              {errorMessage && (
                <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-500/40 text-xs text-red-200 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setStep('create')}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                >
                  ← رجوع
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAndPublish}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black py-2.5 px-4 text-xs shadow-lg cursor-pointer active:scale-98"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>تأكيد الإرسال للمدير والنشر الفوري</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 4. SUCCESS STATE */}
          {/* ========================================================================= */}
          {step === 'success' && (
            <div className="space-y-4 text-center py-6 animate-in zoom-in-95 duration-200">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/50">
                <CheckCircle className="h-7 w-7 animate-bounce" />
              </div>

              <div className="space-y-1.5">
                <h3 className="font-display text-base font-black text-white">
                  تم إرسال لوحتك الإعلانية للمدير بنجاح!
                </h3>
                <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                  تم استلام طلب الإعلان وتوثيق رقم هاتفك بنجاح. ستظهر لوحتك في صدارة{' '}
                  <strong className="text-amber-300">
                    {selectedTier.scope === 'national' ? 'عموم العراق' : currentCategoryObj.title}
                  </strong>{' '}
                  فور اعتماد التحويل.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-black py-2.5 px-6 text-xs cursor-pointer hover:opacity-95"
                >
                  تم، العودة لدليل العراق
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
