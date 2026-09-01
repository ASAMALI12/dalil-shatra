import React, { useState } from 'react';
import {
  X,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  CreditCard,
  Smartphone,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Receipt,
  Download,
  Building2,
  RefreshCw,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useWallet } from '../context/WalletContext';
import { WalletTransaction, PaymentMethod } from '../types/shatrah';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'overview' | 'deposit' | 'withdraw' | 'history';
}

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'overview',
}) => {
  const {
    balance,
    transactions,
    totalEarnings,
    totalWithdrawn,
    deposit,
    withdraw,
    isManagerUnlocked,
    loginManager,
    managerCredentials,
    lockManager,
  } = useWallet();

  const [activeTab, setActiveTab] = useState<'overview' | 'deposit' | 'withdraw' | 'history'>(defaultTab);

  // Deposit State
  const [depositAmount, setDepositAmount] = useState<number>(50000);
  const [depositMethod, setDepositMethod] = useState<'zaincash' | 'mastercard' | 'qicard'>('zaincash');
  const [depositPhone, setDepositPhone] = useState('07801234567');
  const [depositCardNumber, setDepositCardNumber] = useState('');
  const [depositSuccessRef, setDepositSuccessRef] = useState<string | null>(null);

  // Withdraw State (Manager Login)
  const [managerPhoneInput, setManagerPhoneInput] = useState('');
  const [managerUserInput, setManagerUserInput] = useState('');
  const [managerPassInput, setManagerPassInput] = useState('');
  const [managerLoginError, setManagerLoginError] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState<'zaincash' | 'mastercard'>('zaincash');
  const [withdrawAmount, setWithdrawAmount] = useState<number>(100000);
  const [zainNumber, setZainNumber] = useState('07801234567');
  const [accountHolder, setAccountHolder] = useState('مدير دليل الشطرة');
  const [mastercardNumber, setMastercardNumber] = useState('');
  const [bankName, setBankName] = useState('مصرف الرافدين');
  const [withdrawError, setWithdrawError] = useState('');
  const [withdrawSuccessRef, setWithdrawSuccessRef] = useState<string | null>(null);

  // Receipt Modal State
  const [selectedReceipt, setSelectedReceipt] = useState<WalletTransaction | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);

  // Transaction History Filter
  const [historyFilter, setHistoryFilter] = useState<'all' | 'deposit' | 'withdrawal' | 'earning'>('all');

  if (!isOpen) return null;

  // Handle Manager Login Unlock
  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setManagerLoginError('');
    const res = loginManager(managerPhoneInput, managerUserInput, managerPassInput);
    if (res.success) {
      setManagerLoginError('');
      setManagerPhoneInput('');
      setManagerUserInput('');
      setManagerPassInput('');
    } else {
      setManagerLoginError(res.message || 'بيانات الدخول غير صحيحة!');
    }
  };

  const handleFillDemo = () => {
    setManagerPhoneInput(managerCredentials.phone);
    setManagerUserInput(managerCredentials.username);
    setManagerPassInput(managerCredentials.password);
    setManagerLoginError('');
  };

  // Handle Deposit
  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (depositAmount <= 0) return;

    const ref = deposit(depositAmount, depositMethod, {
      phoneNumber: depositMethod === 'zaincash' ? depositPhone : undefined,
      cardNumber: depositMethod !== 'zaincash' ? depositCardNumber || '**** **** **** 8821' : undefined,
      accountName: 'مستخدم محفظة الشطرة',
    });

    setDepositSuccessRef(ref);
    confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
  };

  // Handle Withdrawal
  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError('');

    if (withdrawAmount <= 0) {
      setWithdrawError('يرجى تحديد مبلغ سحب صالح');
      return;
    }
    if (withdrawAmount > balance) {
      setWithdrawError('المبلغ المطلوب سحبه يتجاوز الرصيد المتوفر في المحفظة!');
      return;
    }

    const res = withdraw(withdrawAmount, withdrawMethod, {
      accountName: accountHolder || 'مدير دليل الشطرة',
      phoneNumber: withdrawMethod === 'zaincash' ? zainNumber : undefined,
      cardNumber: withdrawMethod === 'mastercard' ? mastercardNumber || '5421 9876 1234 5678' : undefined,
      bankName: withdrawMethod === 'mastercard' ? bankName : undefined,
    });

    if (res.success && res.referenceNumber) {
      setWithdrawSuccessRef(res.referenceNumber);
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
    } else {
      setWithdrawError(res.message || 'فشلت عملية السحب، يرجى المحاولة مرة أخرى');
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard?.writeText?.(text);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2500);
  };

  const filteredTransactions = transactions.filter((t) => {
    if (historyFilter === 'all') return true;
    if (historyFilter === 'deposit') return t.type === 'deposit';
    if (historyFilter === 'withdrawal') return t.type === 'withdrawal';
    if (historyFilter === 'earning') return t.type === 'earning' || t.type === 'ad_payment';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="border-b border-slate-200 p-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-600 text-white shadow-md">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-base sm:text-lg font-bold">
                  محفظة دليل الشطرة الرقمية
                </h3>
                <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                  <ShieldCheck className="h-3 w-3" />
                  مؤمنة بالكامل
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-300">
                إيداع، دفع فوري للإعلانات، وسحب أرباح المدير عبر زين كاش وماستر كارد
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white transition-all cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 p-1.5 gap-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('overview');
              setDepositSuccessRef(null);
              setWithdrawSuccessRef(null);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:bg-white/50'
            }`}
          >
            <Wallet className="h-3.5 w-3.5" />
            <span>الرصيد</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('deposit');
              setDepositSuccessRef(null);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 transition-all cursor-pointer ${
              activeTab === 'deposit'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:bg-white/50'
            }`}
          >
            <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-600" />
            <span>شحن المحفظة</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('withdraw');
              setWithdrawSuccessRef(null);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 transition-all cursor-pointer ${
              activeTab === 'withdraw'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-white/50'
            }`}
          >
            <ArrowUpRight className="h-3.5 w-3.5" />
            <span>سحب المدير 🔐</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:bg-white/50'
            }`}
          >
            <Receipt className="h-3.5 w-3.5" />
            <span>السجل ({transactions.length})</span>
          </button>
        </div>

        {/* Modal Main Content */}
        <div className="overflow-y-auto p-5 space-y-4 flex-1">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Premium Digital Card Layout */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-red-950 to-slate-900 p-5 sm:p-6 text-white shadow-xl border border-red-900/40">
                {/* Decorative background glows */}
                <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-red-600/20 blur-2xl" />
                <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-amber-500/15 blur-2xl" />

                <div className="relative z-10 flex flex-col justify-between h-44">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-xs font-bold uppercase tracking-wider text-red-300">
                        دليل الشطرة الرقمي
                      </span>
                      <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-mono text-slate-300">
                        Smart Wallet
                      </span>
                    </div>
                    <div className="h-6 w-10 rounded-md bg-amber-400/80 flex items-center justify-center shadow-xs">
                      <div className="h-4 w-7 rounded-xs border border-amber-800/40 grid grid-cols-2 gap-0.5 p-0.5">
                        <div className="bg-amber-600/60 rounded-2xs" />
                        <div className="bg-amber-600/60 rounded-2xs" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-medium text-slate-300 block">
                      الرصيد المتاح القابل للسحب والاستخدام:
                    </span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">
                        {balance.toLocaleString('ar-IQ')}
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-amber-300">
                        دينار عراقي (IQD)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs text-slate-300">
                    <span className="font-mono text-[11px]">8842 •••• •••• 9104</span>
                    <span className="font-bold text-[11px] text-emerald-400">● نشط ومؤمن</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions Grid */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('deposit')}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-emerald-800 hover:bg-emerald-100 transition-all font-display text-xs sm:text-sm font-bold cursor-pointer"
                >
                  <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
                  <span>شحن رصيد المحفظة</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('withdraw')}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 p-3.5 text-white shadow-sm hover:from-red-700 hover:to-rose-700 transition-all font-display text-xs sm:text-sm font-bold cursor-pointer"
                >
                  <ArrowUpRight className="h-4 w-4" />
                  <span>سحب أرباح المدير</span>
                </button>
              </div>

              {/* Stats Tiles */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5 text-slate-800">
                  <span className="text-[11px] font-semibold text-slate-500 block">
                    إجمالي إيرادات الإعلانات:
                  </span>
                  <span className="font-display text-sm sm:text-base font-extrabold text-emerald-700 mt-1 block">
                    +{totalEarnings.toLocaleString('ar-IQ')} د.ع
                  </span>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5 text-slate-800">
                  <span className="text-[11px] font-semibold text-slate-500 block">
                    إجمالي المسحوبات المحولة:
                  </span>
                  <span className="font-display text-sm sm:text-base font-extrabold text-red-600 mt-1 block">
                    -{totalWithdrawn.toLocaleString('ar-IQ')} د.ع
                  </span>
                </div>
              </div>

              {/* Latest Recent Activity */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-display text-xs font-bold text-slate-700">
                    آخر الحركات المالية
                  </h4>
                  <button
                    type="button"
                    onClick={() => setActiveTab('history')}
                    className="text-xs font-bold text-red-600 hover:underline"
                  >
                    عرض كل الحركات ←
                  </button>
                </div>

                <div className="space-y-2">
                  {transactions.slice(0, 3).map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedReceipt(t)}
                      className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 bg-white hover:bg-slate-50 hover:border-slate-200 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-xl text-base ${
                            t.type === 'withdrawal'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {t.type === 'withdrawal' ? (
                            <ArrowUpRight className="h-4 w-4" />
                          ) : (
                            <ArrowDownLeft className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <h5 className="font-display text-xs font-bold text-slate-900 truncate max-w-[200px]">
                            {t.title}
                          </h5>
                          <span className="text-[10px] text-slate-400">{t.date}</span>
                        </div>
                      </div>

                      <div className="text-left">
                        <span
                          className={`font-display text-xs sm:text-sm font-extrabold ${
                            t.type === 'withdrawal' ? 'text-red-600' : 'text-emerald-600'
                          }`}
                        >
                          {t.type === 'withdrawal' ? '-' : '+'}
                          {t.amount.toLocaleString('ar-IQ')} د.ع
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DEPOSIT / TOP-UP */}
          {activeTab === 'deposit' && (
            <div className="space-y-4">
              {depositSuccessRef ? (
                <div className="py-6 text-center space-y-3 animate-in zoom-in-95 duration-200">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <CheckCircle2 className="h-10 w-10" />
                  </div>
                  <div>
                    <h4 className="font-display text-lg font-bold text-slate-900">
                      تم شحن المحفظة بنجاح!
                    </h4>
                    <p className="text-xs text-slate-600">
                      أصبح رصيدك الحالي {balance.toLocaleString('ar-IQ')} دينار عراقي
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3 border border-slate-200 text-xs">
                    <span className="text-slate-500 block">الرقم المرجعي للإيداع:</span>
                    <span className="font-mono font-bold text-red-600 text-sm">{depositSuccessRef}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDepositSuccessRef(null);
                      setActiveTab('overview');
                    }}
                    className="rounded-2xl bg-slate-900 px-6 py-2.5 font-display text-xs font-bold text-white hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    العودة للمحفظة
                  </button>
                </div>
              ) : (
                <form onSubmit={handleDepositSubmit} className="space-y-4">
                  <div>
                    <h4 className="font-display text-sm font-bold text-slate-800">
                      اختر مبلغ الشحن:
                    </h4>
                    <p className="text-xs text-slate-500">
                      الرصيد المشحون يتيح لك حجز ونشر الإعلانات فورًا بدون انتظار
                    </p>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="grid grid-cols-3 gap-2">
                    {[25000, 50000, 100000, 200000, 500000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setDepositAmount(amt)}
                        className={`rounded-xl p-2.5 text-xs font-bold transition-all cursor-pointer text-center ${
                          depositAmount === amt
                            ? 'bg-red-600 text-white shadow-xs'
                            : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {amt.toLocaleString('ar-IQ')} د.ع
                      </button>
                    ))}
                    <div className="relative">
                      <input
                        type="number"
                        min="1000"
                        step="5000"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(Number(e.target.value))}
                        className="w-full h-full rounded-xl border border-slate-200 bg-slate-50 px-2 text-center text-xs font-bold text-slate-800 focus:border-red-500 focus:outline-none"
                        placeholder="مبلغ مخصص"
                      />
                    </div>
                  </div>

                  {/* Payment Channel Selector */}
                  <div className="space-y-2">
                    <label className="block font-display text-xs font-bold text-slate-700">
                      وسيلة الدفع والشحن:
                    </label>

                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'zaincash', name: 'زين كاش', icon: '📱' },
                        { id: 'mastercard', name: 'ماستر كارد', icon: '💳' },
                        { id: 'qicard', name: 'كي كارد', icon: '🏦' },
                      ].map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setDepositMethod(m.id as any)}
                          className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                            depositMethod === m.id
                              ? 'border-red-500 bg-red-50 text-red-800 ring-1 ring-red-500'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span className="text-xl mb-1">{m.icon}</span>
                          <span>{m.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Conditional inputs */}
                  {depositMethod === 'zaincash' ? (
                    <div>
                      <label className="mb-1 block font-display text-xs font-bold text-slate-700">
                        رقم محفظة زين كاش للدفع *
                      </label>
                      <input
                        type="tel"
                        value={depositPhone}
                        onChange={(e) => setDepositPhone(e.target.value)}
                        placeholder="0780XXXXXXX"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-800 focus:border-red-500 focus:bg-white focus:outline-none"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        سيتم إرسال إشعار تحويل آمن إلى تطبيق زين كاش الخاص بك لتأكيد العملية
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      <div>
                        <label className="mb-1 block font-display text-xs font-bold text-slate-700">
                          رقم البطاقة (16 رقم) *
                        </label>
                        <input
                          type="text"
                          maxLength={19}
                          value={depositCardNumber}
                          onChange={(e) => setDepositCardNumber(e.target.value)}
                          placeholder="5421 9876 5432 1098"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-mono text-xs font-semibold text-slate-800 focus:border-red-500 focus:bg-white focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 font-display text-xs sm:text-sm font-bold text-white shadow-md hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span>تأكيد شحن {depositAmount.toLocaleString('ar-IQ')} د.ع</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 3: MANAGER WITHDRAWAL (سحب أرباح المدير) */}
          {activeTab === 'withdraw' && (
            <div className="space-y-4">
              {!isManagerUnlocked ? (
                /* Manager Credentials Verification Screen */
                <form onSubmit={handleUnlock} className="py-4 text-right space-y-3.5 max-w-sm mx-auto">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600 shadow-inner">
                    <Lock className="h-7 w-7" />
                  </div>

                  <div className="text-center">
                    <h4 className="font-display text-base font-bold text-slate-900">
                      بوابة سحب الأرباح الخاصة بالمدير
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      يرجى تسجيل دخول المدير (رقم الهاتف، اليوزر، والباسوورد) لمتابعة سحب الأرباح إلى زين كاش أو ماستر كارد
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      رقم هاتف المدير *
                    </label>
                    <input
                      type="tel"
                      required
                      value={managerPhoneInput}
                      onChange={(e) => setManagerPhoneInput(e.target.value)}
                      placeholder="07801234567"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:border-red-500 focus:bg-white focus:outline-none text-left"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      اسم المستخدم (اليوزر) *
                    </label>
                    <input
                      type="text"
                      required
                      value={managerUserInput}
                      onChange={(e) => setManagerUserInput(e.target.value)}
                      placeholder="admin"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-red-500 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      كلمة المرور (الباسوورد) *
                    </label>
                    <input
                      type="password"
                      required
                      value={managerPassInput}
                      onChange={(e) => setManagerPassInput(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-800 focus:border-red-500 focus:bg-white focus:outline-none"
                    />
                  </div>

                  {managerLoginError && (
                    <p className="text-xs font-bold text-red-600 flex items-center justify-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                      <span>{managerLoginError}</span>
                    </p>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-100 p-2 rounded-xl">
                    <span>الافتراضي: 07801234567 / admin / admin123</span>
                    <button
                      type="button"
                      onClick={handleFillDemo}
                      className="text-red-600 font-bold hover:underline cursor-pointer"
                    >
                      تعبئة سريعة
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-red-600 py-3 font-display text-xs sm:text-sm font-bold text-white shadow-md hover:bg-red-700 transition-all cursor-pointer"
                  >
                    <Unlock className="h-4 w-4" />
                    <span>تأكيد هوية المدير وفتح السحب</span>
                  </button>
                </form>
              ) : withdrawSuccessRef ? (
                /* Withdrawal Success Screen */
                <div className="py-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-inner">
                    <CheckCircle2 className="h-10 w-10" />
                  </div>

                  <div>
                    <h4 className="font-display text-lg font-bold text-slate-900">
                      تم تحويل وسحب الأرباح بنجاح!
                    </h4>
                    <p className="text-xs text-slate-600 max-w-xs mx-auto">
                      تم إرسال مبلغ <strong>{withdrawAmount.toLocaleString('ar-IQ')} د.ع</strong> إلى {withdrawMethod === 'zaincash' ? `محفظة زين كاش (${zainNumber})` : `بطاقة ماستر كارد (${mastercardNumber || '**** 9104'})`}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200 text-xs space-y-1 text-right">
                    <div className="flex justify-between">
                      <span className="text-slate-500">الرقم المرجعي للحوالة:</span>
                      <span className="font-mono font-bold text-red-600">{withdrawSuccessRef}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">الرصيد المتبقي في المحفظة:</span>
                      <span className="font-bold text-slate-900">{balance.toLocaleString('ar-IQ')} د.ع</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopy(withdrawSuccessRef)}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      <span>{copiedRef ? 'تم النسخ!' : 'نسخ رقم الحوالة'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setWithdrawSuccessRef(null);
                        setActiveTab('overview');
                      }}
                      className="flex-1 rounded-xl bg-slate-900 py-2 text-xs font-bold text-white hover:bg-slate-800 cursor-pointer"
                    >
                      تم والعودة
                    </button>
                  </div>
                </div>
              ) : (
                /* Manager Withdrawal Form */
                <form onSubmit={handleWithdrawSubmit} className="space-y-4">
                  <div className="flex items-center justify-between bg-amber-50 p-3 rounded-2xl border border-amber-200 text-xs">
                    <div>
                      <span className="text-slate-600 block">الرصيد المتاح للسحب حاليًا:</span>
                      <span className="font-display text-sm font-extrabold text-slate-900">
                        {balance.toLocaleString('ar-IQ')} د.ع
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={lockManager}
                      className="text-[11px] font-bold text-red-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Lock className="h-3 w-3" />
                      <span>قفل البوابة</span>
                    </button>
                  </div>

                  {/* Method Selection: Zain Cash vs MasterCard */}
                  <div className="space-y-1.5">
                    <label className="block font-display text-xs font-bold text-slate-700">
                      اختر وسيلة استلام الأرباح:
                    </label>

                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setWithdrawMethod('zaincash')}
                        className={`flex items-center gap-2.5 p-3 rounded-2xl border text-right transition-all cursor-pointer ${
                          withdrawMethod === 'zaincash'
                            ? 'border-red-500 bg-red-50/70 text-red-900 ring-1 ring-red-500'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-red-600 text-lg flex-shrink-0">
                          📱
                        </div>
                        <div>
                          <h5 className="font-display text-xs font-bold">محفظة زين كاش</h5>
                          <span className="text-[10px] text-slate-500">تحويل فوري إلى رقم الهاتف</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setWithdrawMethod('mastercard')}
                        className={`flex items-center gap-2.5 p-3 rounded-2xl border text-right transition-all cursor-pointer ${
                          withdrawMethod === 'mastercard'
                            ? 'border-red-500 bg-red-50/70 text-red-900 ring-1 ring-red-500'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700 text-lg flex-shrink-0">
                          💳
                        </div>
                        <div>
                          <h5 className="font-display text-xs font-bold">ماستر كارد / بنكي</h5>
                          <span className="text-[10px] text-slate-500">حوالة لحسابك البنكي</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Withdrawal Amount and Percent Buttons */}
                  <div className="space-y-1.5">
                    <label className="block font-display text-xs font-bold text-slate-700">
                      المبلغ المراد سحبه (د.ع):
                    </label>

                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="10000"
                        max={balance}
                        step="5000"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                        className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-900 focus:border-red-500 focus:bg-white focus:outline-none"
                      />
                      <div className="flex gap-1">
                        {[0.25, 0.5, 1].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => setWithdrawAmount(Math.floor(balance * pct))}
                            className="rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-[11px] font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                          >
                            {pct === 1 ? 'الكل' : `${pct * 100}%`}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Form for ZainCash vs MasterCard */}
                  {withdrawMethod === 'zaincash' ? (
                    <div className="space-y-3 rounded-2xl bg-slate-50 p-3.5 border border-slate-200">
                      <div>
                        <label className="mb-1 block font-display text-xs font-bold text-slate-700">
                          رقم محفظة زين كاش للمدير *
                        </label>
                        <input
                          type="tel"
                          value={zainNumber}
                          onChange={(e) => setZainNumber(e.target.value)}
                          placeholder="07801234567"
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:border-red-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block font-display text-xs font-bold text-slate-700">
                          اسم صاحب المحفظة الثلاثي *
                        </label>
                        <input
                          type="text"
                          value={accountHolder}
                          onChange={(e) => setAccountHolder(e.target.value)}
                          placeholder="اسم المدير المسجل في زين كاش"
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-red-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 rounded-2xl bg-slate-50 p-3.5 border border-slate-200">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="mb-1 block font-display text-xs font-bold text-slate-700">
                            المصرف المستلم
                          </label>
                          <select
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs font-semibold text-slate-800 focus:border-red-500 focus:outline-none"
                          >
                            <option value="مصرف الرافدين">مصرف الرافدين</option>
                            <option value="مصرف الرشيد">مصرف الرشيد</option>
                            <option value="المصرف العراقي للتجارة (TBI)">مصرف TBI</option>
                            <option value="مصرف التنمية الدولي">مصرف التنمية الدولي</option>
                            <option value="مصرف بغداد">مصرف بغداد</option>
                            <option value="مصرف الناسك الإسـلامي">مصرف الناسك</option>
                          </select>
                        </div>

                        <div>
                          <label className="mb-1 block font-display text-xs font-bold text-slate-700">
                            رقم البطاقة (16 رقم) *
                          </label>
                          <input
                            type="text"
                            maxLength={19}
                            value={mastercardNumber}
                            onChange={(e) => setMastercardNumber(e.target.value)}
                            placeholder="5421 8899 0011 2233"
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-xs font-bold text-slate-800 focus:border-red-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-1 block font-display text-xs font-bold text-slate-700">
                          اسم صاحب الحساب / البطاقة *
                        </label>
                        <input
                          type="text"
                          value={accountHolder}
                          onChange={(e) => setAccountHolder(e.target.value)}
                          placeholder="الاسم المطبوع على البطاقة"
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-red-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {withdrawError && (
                    <div className="rounded-xl bg-red-50 p-2.5 text-xs font-bold text-red-600 flex items-center gap-1.5">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>{withdrawError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 py-3 font-display text-xs sm:text-sm font-bold text-white shadow-md hover:from-red-700 hover:to-rose-700 active:scale-95 transition-all cursor-pointer"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                    <span>تنفيذ السحب والتحويل الفوري ({withdrawAmount.toLocaleString('ar-IQ')} د.ع)</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 4: TRANSACTIONS HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              {/* Filter pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {[
                  { id: 'all', name: 'الكل' },
                  { id: 'earning', name: 'إيرادات الإعلانات' },
                  { id: 'deposit', name: 'شحن المحفظة' },
                  { id: 'withdrawal', name: 'مسحوبات المدير' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setHistoryFilter(f.id as any)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      historyFilter === f.id
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {f.name}
                  </button>
                ))}
              </div>

              {/* Transactions List */}
              <div className="space-y-2">
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      onClick={() => setSelectedReceipt(tx)}
                      className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-red-300 hover:shadow-xs transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-2xl flex-shrink-0 text-base ${
                            tx.type === 'withdrawal'
                              ? 'bg-red-100 text-red-600'
                              : 'bg-emerald-100 text-emerald-600'
                          }`}
                        >
                          {tx.type === 'withdrawal' ? (
                            <ArrowUpRight className="h-5 w-5" />
                          ) : (
                            <ArrowDownLeft className="h-5 w-5" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5">
                            <h5 className="font-display text-xs sm:text-sm font-bold text-slate-900">
                              {tx.title}
                            </h5>
                            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-600">
                              {tx.paymentMethod === 'zaincash' ? 'زين كاش' : tx.paymentMethod === 'mastercard' ? 'ماستر كارد' : tx.paymentMethod === 'qicard' ? 'كي كارد' : 'محفظة'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{tx.description}</p>
                          <span className="text-[10px] text-slate-400 font-medium">{tx.date}</span>
                        </div>
                      </div>

                      <div className="text-left flex-shrink-0">
                        <span
                          className={`font-display text-xs sm:text-sm font-extrabold ${
                            tx.type === 'withdrawal' ? 'text-red-600' : 'text-emerald-600'
                          }`}
                        >
                          {tx.type === 'withdrawal' ? '-' : '+'}
                          {tx.amount.toLocaleString('ar-IQ')} د.ع
                        </span>
                        <span className="block text-[10px] text-emerald-600 font-bold mt-0.5">مكتملة ✓</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
                    <Receipt className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-bold text-xs text-slate-600">لا توجد حركات مسجلة</p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Detailed Formal Receipt Modal Overlay */}
        {selectedReceipt && (
          <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="relative w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl space-y-3.5 text-slate-800">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-red-600" />
                  <h4 className="font-display text-sm font-bold text-slate-900">
                    إيصال معاملة مالية رقمي
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedReceipt(null)}
                  className="rounded-full bg-slate-100 p-1 text-slate-500 hover:bg-slate-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="text-center py-2 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[11px] text-slate-400 font-medium">المبلغ الإجمالي:</span>
                <div
                  className={`font-display text-xl font-extrabold ${
                    selectedReceipt.type === 'withdrawal' ? 'text-red-600' : 'text-emerald-600'
                  }`}
                >
                  {selectedReceipt.type === 'withdrawal' ? '-' : '+'}
                  {selectedReceipt.amount.toLocaleString('ar-IQ')} د.ع
                </div>
                <span className="inline-block rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  تمت المعاملة بنجاح ✓
                </span>
              </div>

              <div className="text-xs space-y-2 divide-y divide-slate-100">
                <div className="flex justify-between pt-1">
                  <span className="text-slate-500">عنوان الحركة:</span>
                  <span className="font-bold text-slate-800">{selectedReceipt.title}</span>
                </div>

                <div className="flex justify-between pt-1">
                  <span className="text-slate-500">الرقم المرجعي:</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(selectedReceipt.referenceNumber)}
                    className="font-mono font-bold text-red-600 hover:underline flex items-center gap-1"
                  >
                    <span>{selectedReceipt.referenceNumber}</span>
                    <Copy className="h-3 w-3" />
                  </button>
                </div>

                <div className="flex justify-between pt-1">
                  <span className="text-slate-500">التاريخ والوقت:</span>
                  <span className="font-semibold text-slate-700">{selectedReceipt.date}</span>
                </div>

                <div className="flex justify-between pt-1">
                  <span className="text-slate-500">طريقة الدفع/السحب:</span>
                  <span className="font-bold text-slate-800">
                    {selectedReceipt.paymentMethod === 'zaincash' ? 'زين كاش (ZainCash)' : selectedReceipt.paymentMethod === 'mastercard' ? 'ماستر كارد (MasterCard)' : selectedReceipt.paymentMethod === 'qicard' ? 'كي كارد (Qi Card)' : 'المحفظة الإلكترونية'}
                  </span>
                </div>

                {selectedReceipt.recipientDetails?.phoneNumber && (
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-500">رقم المحفظة / الهاتف:</span>
                    <span className="font-mono font-bold text-slate-800">{selectedReceipt.recipientDetails.phoneNumber}</span>
                  </div>
                )}

                {selectedReceipt.recipientDetails?.cardNumber && (
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-500">رقم البطاقة:</span>
                    <span className="font-mono font-bold text-slate-800">{selectedReceipt.recipientDetails.cardNumber}</span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="w-full rounded-2xl bg-slate-900 py-2 text-xs font-bold text-white hover:bg-slate-800"
              >
                إغلاق الإيصال
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
