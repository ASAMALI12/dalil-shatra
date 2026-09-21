import React from 'react';
import { X, ShieldCheck, CreditCard, Building2, ExternalLink } from 'lucide-react';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'overview' | 'deposit' | 'withdraw' | 'history';
}

export const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      id="wallet-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        id="wallet-modal-content"
        className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl transition-all border border-slate-100"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-800">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900">
                الدفع والتحصيل الإلكتروني
              </h2>
              <p className="text-xs text-slate-500">
                منظومة الدفع الرسمية المعتمدة
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق النافذة"
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Notice */}
        <div className="py-6 space-y-4">
          <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
              <div className="space-y-1 text-sm text-slate-700 leading-relaxed">
                <div className="font-bold text-slate-900">
                  إشعار منظومة الدفع
                </div>
                <p>
                  تم إيقاف المحفظة الداخلية الوهمية. تتم كافة معاملات رسوم الإعلانات وتوثيق المتاجر مباشرة عبر التحويل المالي الرسمي (زين كاش) أو سيتم ربطها تلقائياً بمزود الدفع الإلكتروني المرخص من البنك المركزي العراقي.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-center">
              <Building2 className="h-5 w-5 text-slate-600 mx-auto mb-1.5" />
              <div className="text-xs font-bold text-slate-800">زين كاش (ZainCash)</div>
              <div className="text-[11px] text-slate-500 mt-0.5">التحويل الرسمي المعتمد</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-center">
              <CreditCard className="h-5 w-5 text-slate-600 mx-auto mb-1.5" />
              <div className="text-xs font-bold text-slate-800">بوابة الدفع الإلكتروني</div>
              <div className="text-[11px] text-slate-500 mt-0.5">قريباً عبر المزود المرخص</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800 transition-colors cursor-pointer text-center"
          >
            حسناً، تم
          </button>
        </div>
      </div>
    </div>
  );
};
