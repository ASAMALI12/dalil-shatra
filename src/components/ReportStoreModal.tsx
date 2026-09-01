import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  Send,
  MessageCircle,
  Phone,
  CheckCircle2,
  Building,
  MapPin,
  HelpCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DirectoryItem } from '../types/shatrah';
import { useDirectory } from '../context/DirectoryContext';
import { useNotification } from '../context/NotificationContext';

interface ReportStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: DirectoryItem | null;
  onReportSubmitted?: () => void;
}

const COMMON_REASONS = [
  { id: 'phone_error', label: 'رقم الهاتف غير صحيح أو لا يجيب', icon: '📵' },
  { id: 'closed_moved', label: 'المتجر مغلق نهائياً أو غيّر موقعه', icon: '📍' },
  { id: 'inaccurate_info', label: 'معلومات أو أسعار غير صحيحة', icon: '🏷️' },
  { id: 'bad_service', label: 'شكوى حول جودة الخدمة أو التعامل', icon: '⚠️' },
  { id: 'fake_store', label: 'نشاط وهمي أو انتحال صفة', icon: '🚫' },
  { id: 'other', label: 'ملاحظة أو اقتراح آخر للإدارة', icon: '📝' },
];

// Official Administration Contact for Shatrah Directory
const ADMIN_WHATSAPP = '9647801234567';
const ADMIN_PHONE = '07801234567';

export const ReportStoreModal: React.FC<ReportStoreModalProps> = ({
  isOpen,
  onClose,
  item,
  onReportSubmitted,
}) => {
  const { addReport } = useDirectory();
  const { broadcastNotification } = useNotification();

  const [selectedReason, setSelectedReason] = useState<string>(COMMON_REASONS[0].label);
  const [details, setDetails] = useState<string>('');
  const [reporterName, setReporterName] = useState<string>('');
  const [reporterPhone, setReporterPhone] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);

  if (!isOpen || !item) return null;

  // Generate pre-formatted message for WhatsApp
  const generateWhatsAppMessage = () => {
    const text = `السلام عليكم إدارة تطبيق دليل الشطرة،
أود الإبلاغ عن مشكلة في أحد المتاجر المدرجة في الدليل:

🏪 *اسم المتجر:* ${item.name}
📞 *رقم المتجر:* ${item.phone}
📍 *العنوان:* ${item.address}
🔖 *نوع البلاغ:* ${selectedReason}
📝 *تفاصيل المشكلة:* ${details.trim() || 'لا توجد تفاصيل إضافية'}

👤 *مرسل البلاغ:* ${reporterName.trim() || 'زائر / زبون في الشطرة'}
📱 *هاتف المرسل:* ${reporterPhone.trim() || 'غير محدد'}

يرجى المتابعة والتحقق مع فائق الشكر.`;
    return encodeURIComponent(text);
  };

  const handleSubmitReport = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!details.trim() && !selectedReason) return;

    setIsSending(true);

    // Save in directory context
    addReport({
      storeId: item.id,
      storeName: item.name,
      storePhone: item.phone,
      reason: selectedReason,
      details: details.trim() || 'تم الإبلاغ عن طريق الزائر مباشرة',
      reporterName: reporterName.trim() || 'زبون من الشطرة',
      reporterPhone: reporterPhone.trim() || undefined,
    });

    // Notify the admin system
    broadcastNotification(
      '⚠️ بلاغ جديد من زائر حول متجر',
      `تم استلام بلاغ حول "${item.name}" بسبب: ${selectedReason}`,
      'system',
      item.id,
      'store'
    );

    setTimeout(() => {
      setIsSending(false);
      setIsSubmitted(true);
      try {
        confetti({
          particleCount: 45,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch (err) {
        // Safe fallback
      }
      if (onReportSubmitted) {
        onReportSubmitted();
      }
    }, 600);
  };

  const handleSendViaWhatsApp = () => {
    // Also save in the system
    handleSubmitReport();
    // Open WhatsApp
    const url = `https://wa.me/${ADMIN_WHATSAPP}?text=${generateWhatsAppMessage()}`;
    window.open(url, '_blank');
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setSelectedReason(COMMON_REASONS[0].label);
    setDetails('');
    setReporterName('');
    setReporterPhone('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="relative bg-gradient-to-r from-red-600 via-rose-600 to-red-700 p-5 text-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md text-white shadow-xs">
                <AlertTriangle className="h-5 w-5 text-amber-300" />
              </div>
              <div>
                <h3 className="font-display text-base sm:text-lg font-bold">
                  مراسلة الإدارة حول هذا المتجر
                </h3>
                <p className="text-xs text-red-100">
                  إبلاغ إدارة دليل الشطرة عن أي مشكلة أو ملاحظة
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-black/20 text-white hover:bg-black/30 transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-5 space-y-4">
          {isSubmitted ? (
            <div className="py-8 text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <div>
                <h4 className="font-display text-lg font-bold text-slate-900">
                  تم استلام رسالتك وبلاغك بنجاح!
                </h4>
                <p className="text-xs text-slate-600 max-w-sm mx-auto mt-1 leading-relaxed">
                  شكراً لحرصك ومساعدتنا في الحفاظ على دقة دليل الشطرة. سيقوم فريق الإدارة بمراجعة بيانات المتجر والتحقق منها على الفور.
                </p>
              </div>

              <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full sm:w-auto rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-6 py-3 cursor-pointer transition-all"
                >
                  العودة للمتجر
                </button>

                <a
                  href={`https://wa.me/${ADMIN_WHATSAPP}?text=${generateWhatsAppMessage()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-3 cursor-pointer transition-all"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>تأكيد المراسلة بالواتساب</span>
                </a>
              </div>
            </div>
          ) : (
            <>
              {/* Store Summary Card */}
              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 border border-slate-200">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="h-14 w-14 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-display text-sm font-bold text-slate-900 truncate">
                      {item.name}
                    </h4>
                    {item.isClaimed && (
                      <span className="rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.5">
                        موثق
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3 text-red-500" />
                      {item.phone}
                    </span>
                    <span>•</span>
                    <span className="truncate flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-slate-400" />
                      {item.address}
                    </span>
                  </div>
                </div>
              </div>

              {/* Reason Selector */}
              <div className="space-y-2">
                <label className="block font-display text-xs font-bold text-slate-800">
                  ما هي المشكلة التي واجهتك في هذا المتجر؟ *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {COMMON_REASONS.map((reason) => {
                    const isSelected = selectedReason === reason.label;
                    return (
                      <button
                        key={reason.id}
                        type="button"
                        onClick={() => setSelectedReason(reason.label)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                          isSelected
                            ? 'border-red-500 bg-red-50/80 text-red-900 font-bold shadow-2xs'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs'
                        }`}
                      >
                        <span className="text-base">{reason.icon}</span>
                        <span className="text-xs leading-tight">{reason.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Detailed Description */}
              <div className="space-y-1.5">
                <label className="block font-display text-xs font-bold text-slate-800">
                  تفاصيل إضافية حول المشكلة (اختياري)
                </label>
                <textarea
                  rows={3}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="اكتب توضيحاً للإدارة لمساعدتنا في معالجة المشكلة سريعاً..."
                  className="w-full rounded-2xl border border-slate-200 p-3 text-xs focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none text-slate-800 resize-none"
                />
              </div>

              {/* Optional Reporter Info */}
              <div className="rounded-2xl bg-slate-50/80 p-3 border border-slate-100 space-y-2">
                <span className="text-[11px] font-bold text-slate-700 block">
                  معلومات للتواصل معك عند الحاجة (اختياري):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    placeholder="اسمك الكريم"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-red-500"
                  />
                  <input
                    type="tel"
                    value={reporterPhone}
                    onChange={(e) => setReporterPhone(e.target.value)}
                    placeholder="رقم هاتفك (للمتابعة)"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-red-500 font-mono text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                {/* 1. Direct WhatsApp Message to Admin */}
                <button
                  type="button"
                  onClick={handleSendViaWhatsApp}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 font-display text-xs sm:text-sm font-bold shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>مراسلة إدارة الدليل مباشرة عبر واتساب</span>
                </button>

                {/* 2. In-App Direct Submit to Admin Dashboard */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSubmitReport}
                    disabled={isSending}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white py-2.5 px-3 font-display text-xs font-bold shadow-sm active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSending ? (
                      <span>جاري إرسال البلاغ...</span>
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5 text-red-400" />
                        <span>إرسال تقرير فوري للإدارة</span>
                      </>
                    )}
                  </button>

                  <a
                    href={`tel:${ADMIN_PHONE}`}
                    className="flex items-center justify-center gap-1.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 hover:bg-rose-100 py-2.5 px-3 font-display text-xs font-bold transition-all"
                  >
                    <Phone className="h-3.5 w-3.5 text-rose-600" />
                    <span>اتصال بالدعم</span>
                  </a>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
