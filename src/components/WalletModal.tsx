import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  CreditCard,
  Building2,
  Copy,
  Check,
  Smartphone,
  ExternalLink,
  MessageCircle,
  FileCheck2,
} from 'lucide-react';
import { safeApiFetch } from '../utils/apiClient';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'overview' | 'deposit' | 'withdraw' | 'history';
}

export const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose }) => {
  const [selectedMethod, setSelectedMethod] = useState<'zaincash' | 'mastercard'>('zaincash');
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);
  const [paymentConfig, setPaymentConfig] = useState({
    zaincash: {
      number: '07801459424',
      holder: 'محفظة زين كاش المعتمدة',
      title: 'محفظة زين كاش (ZainCash)',
      instructions: 'التحويل المباشر من تطبيق زين كاش إلى رقم المحفظة الموضح أعلاه، ثم إرفاق إشعار التحويل.',
    },
    mastercard: {
      number: '4538548308',
      holder: 'حساب ماستر كارد المعتمد',
      title: 'بطاقة وحساب ماستر كارد (MasterCard)',
      instructions: 'التحويل البنكي أو عبر تطبيق المصرف إلى رقم حساب الماستر كارد الموضح أعلاه، ثم إرفاق صورة الوصل.',
    },
    managerPhone: '07801459424',
    managerWhatsapp: '9647801459424',
  });

  useEffect(() => {
    if (isOpen) {
      safeApiFetch('/api/payment-details')
        .then((res) => res.json())
        .then((data) => {
          if (data && data.success) {
            setPaymentConfig((prev) => ({
              ...prev,
              ...data,
            }));
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const activeAccount =
    selectedMethod === 'zaincash' ? paymentConfig.zaincash : paymentConfig.mastercard;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAccount(text);
    setTimeout(() => setCopiedAccount(null), 2500);
  };

  const handleOpenWhatsApp = () => {
    const text = encodeURIComponent(
      `مرحباً إدارة دليل العراق، أود الاستفسار حول إشعار تحويل عبر ${
        selectedMethod === 'zaincash' ? 'زين كاش' : 'ماستر كارد'
      }.`
    );
    window.open(`https://wa.me/${paymentConfig.managerWhatsapp}?text=${text}`, '_blank');
  };

  return (
    <div
      id="wallet-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3 sm:p-4 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        id="wallet-modal-content"
        className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-5 sm:p-6 shadow-2xl text-right overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 shadow-md">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-display text-base sm:text-lg font-bold text-white flex items-center gap-2">
                بوابة التحويل المالي المعتمدة
                <span className="rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold">
                  تحويل رسمي
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                سداد رسوم الإعلانات وتوثيق المتاجر المباشر
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق النافذة"
            className="rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Notice */}
        <div className="mt-4 rounded-2xl border border-sky-500/20 bg-sky-950/30 p-3.5 flex items-start gap-2.5">
          <ShieldCheck className="h-5 w-5 text-sky-400 shrink-0 mt-0.5" />
          <div className="text-xs text-sky-200/90 leading-relaxed">
            تم استبدال المحفظة الداخلية بنظام التحويل الفعلي المباشر عبر <strong>زين كاش</strong> و <strong>ماستر كارد</strong> لحماية أموالكم وتوثيق إيصالاتكم فوراً بواسطة الإدارة.
          </div>
        </div>

        {/* Payment Methods Selector */}
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => setSelectedMethod('zaincash')}
            className={`p-3.5 rounded-2xl border transition-all text-center cursor-pointer flex flex-col items-center gap-1.5 ${
              selectedMethod === 'zaincash'
                ? 'border-amber-500 bg-amber-500/10 text-white shadow-lg'
                : 'border-slate-800 bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Smartphone className={`h-6 w-6 ${selectedMethod === 'zaincash' ? 'text-amber-400' : 'text-slate-400'}`} />
            <span className="text-xs font-bold">محفظة زين كاش</span>
            <span className="text-[10px] text-slate-400">ZainCash العراق</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedMethod('mastercard')}
            className={`p-3.5 rounded-2xl border transition-all text-center cursor-pointer flex flex-col items-center gap-1.5 ${
              selectedMethod === 'mastercard'
                ? 'border-indigo-500 bg-indigo-500/10 text-white shadow-lg'
                : 'border-slate-800 bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <CreditCard className={`h-6 w-6 ${selectedMethod === 'mastercard' ? 'text-indigo-400' : 'text-slate-400'}`} />
            <span className="text-xs font-bold">بطاقة ماستر كارد</span>
            <span className="text-[10px] text-slate-400">MasterCard مصرفي</span>
          </button>
        </div>

        {/* Selected Account Card */}
        <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800/80">
            <span className="font-bold text-slate-300">{activeAccount.title}</span>
            <span className="text-emerald-400 font-mono text-[11px]">حساب مفعل وموثق ✓</span>
          </div>

          <div className="space-y-1">
            <div className="text-[11px] text-slate-400">
              {selectedMethod === 'zaincash' ? 'رقم محفظة التحويل المباشر:' : 'رقم حساب وبطاقة الماستر كارد:'}
            </div>
            <div className="flex items-center justify-between bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5">
              <span className="font-mono text-base sm:text-lg font-black text-amber-400 tracking-wider" dir="ltr">
                {activeAccount.number}
              </span>
              <button
                type="button"
                onClick={() => handleCopy(activeAccount.number)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
              >
                {copiedAccount === activeAccount.number ? (
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
          </div>

          <div className="text-xs text-slate-300 leading-relaxed bg-slate-900/50 rounded-xl p-2.5 border border-slate-800">
            <p className="font-bold text-slate-200 mb-1">تعليمات التحويل:</p>
            <p className="text-[11px] text-slate-400">{activeAccount.instructions}</p>
          </div>
        </div>

        {/* Help & Support WhatsApp Action */}
        <div className="mt-4 flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={handleOpenWhatsApp}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer"
          >
            <MessageCircle className="h-4 w-4" />
            <span>تأكيد التحويل عبر واتساب الإدارة</span>
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
    </div>
  );
};

