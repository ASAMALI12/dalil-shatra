import React, { useState, useMemo } from 'react';
import {
  X,
  ShieldAlert,
  ShieldCheck,
  Wallet,
  Store,
  Trash2,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  Smartphone,
  Edit3,
  Search,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Lock,
  Unlock,
  KeyRound,
  Send,
  Eye,
  Building2,
  MapPin,
  Phone,
  User,
  Bell,
  RefreshCw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useWallet } from '../context/WalletContext';
import { useDirectory } from '../context/DirectoryContext';
import { useNotification } from '../context/NotificationContext';
import { DirectoryItem, Category } from '../types/shatrah';

interface ManagerDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPreviewStore?: (store: DirectoryItem) => void;
  onOpenWalletModal?: () => void;
}

export const ManagerDashboardModal: React.FC<ManagerDashboardModalProps> = ({
  isOpen,
  onClose,
  onPreviewStore,
  onOpenWalletModal,
}) => {
  const {
    balance,
    transactions,
    totalEarnings,
    totalWithdrawn,
    isManagerUnlocked,
    managerCredentials,
    loginManager,
    lockManager,
    updateManagerCredentials,
    setCustomBalance,
    resetBalance,
    addManualAdjustment,
    deleteTransaction,
    clearTransactions,
    withdraw,
    deposit,
  } = useWallet();

  const { items, categories, deleteStore, addStore, reports, resolveReport, deleteReport } = useDirectory();
  const { broadcastNewStoreNotification, broadcastNotification } = useNotification();

  // Navigation & Sub-tabs
  const [activeTab, setActiveTab] = useState<'wallet' | 'stores' | 'reports' | 'broadcast' | 'security'>('wallet');

  // Manager Login State (Phone + Username + Password)
  const [loginPhone, setLoginPhone] = useState('');
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Store Management State
  const [storeSearch, setStoreSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [deletingStoreId, setDeletingStoreId] = useState<string | null>(null);
  const [isAddStoreOpen, setIsAddStoreOpen] = useState(false);
  const [deleteSuccessMsg, setDeleteSuccessMsg] = useState('');

  // New Store Form State
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreOwner, setNewStoreOwner] = useState('');
  const [newStoreCategory, setNewStoreCategory] = useState('restaurants');
  const [newStoreSubCategory, setNewStoreSubCategory] = useState('');
  const [newStorePhone, setNewStorePhone] = useState('');
  const [newStoreAddress, setNewStoreAddress] = useState('');
  const [newStoreWorkingHours, setNewStoreWorkingHours] = useState('9:00 ص - 10:00 م');
  const [newStoreDesc, setNewStoreDesc] = useState('');
  const [newStoreImage, setNewStoreImage] = useState(
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80'
  );

  // Wallet Edit/Adjustment State
  const [isEditBalanceOpen, setIsEditBalanceOpen] = useState(false);
  const [customBalanceInput, setCustomBalanceInput] = useState(balance.toString());
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');

  // Withdrawal State
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [withdrawMethod, setWithdrawMethod] = useState<'zaincash' | 'mastercard'>('zaincash');
  const [withdrawAmount, setWithdrawAmount] = useState<number>(50000);
  const [withdrawPhone, setWithdrawPhone] = useState('07801234567');
  const [withdrawAccountName, setWithdrawAccountName] = useState('مدير دليل الشطرة');
  const [withdrawCardNumber, setWithdrawCardNumber] = useState('');
  const [withdrawBank, setWithdrawBank] = useState('مصرف الرافدين');
  const [withdrawMsg, setWithdrawMsg] = useState('');

  // Broadcast Notification State
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastSuccessMsg, setBroadcastSuccessMsg] = useState('');

  // Security & Credentials Update State
  const [currPass, setCurrPass] = useState('');
  const [newPhone, setNewPhone] = useState(managerCredentials.phone);
  const [newUsername, setNewUsername] = useState(managerCredentials.username);
  const [newPassword, setNewPassword] = useState('');
  const [securitySuccessMsg, setSecuritySuccessMsg] = useState('');
  const [securityErrorMsg, setSecurityErrorMsg] = useState('');

  if (!isOpen) return null;

  // Handle Manager Login (Phone + Username + Password)
  const handleManagerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const res = loginManager(loginPhone, loginUsername, loginPassword);
    if (res.success) {
      setLoginPhone('');
      setLoginUsername('');
      setLoginPassword('');
      confetti({ particleCount: 50, spread: 70 });
    } else {
      setLoginError(res.message || 'بيانات الدخول غير صحيحة!');
    }
  };

  // Fast auto-fill for testing/demo
  const handleFillDemoCredentials = () => {
    setLoginPhone(managerCredentials.phone);
    setLoginUsername(managerCredentials.username);
    setLoginPassword(managerCredentials.password);
    setLoginError('');
  };

  // Filtered Stores
  const filteredStores = items.filter((store) => {
    const matchCat = selectedCategoryFilter === 'all' || store.category === selectedCategoryFilter;
    const matchQuery =
      !storeSearch.trim() ||
      store.name.toLowerCase().includes(storeSearch.toLowerCase()) ||
      store.address.toLowerCase().includes(storeSearch.toLowerCase()) ||
      store.subCategory?.toLowerCase().includes(storeSearch.toLowerCase()) ||
      store.phone.includes(storeSearch);
    return matchCat && matchQuery;
  });

  // Handle Delete Store
  const confirmDeleteStore = (store: DirectoryItem) => {
    deleteStore(store.id);
    setDeletingStoreId(null);
    setDeleteSuccessMsg(`تم حذف متجر "${store.name}" نهائياً من دليل الشطرة بنجاح.`);
    setTimeout(() => setDeleteSuccessMsg(''), 4000);
  };

  // Handle Add New Store by Manager
  const handleAddStoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName.trim()) return;

    const newId = `store-${Date.now()}`;
    const cleanPhone = newStorePhone || '07801234567';
    const cleanWhatsapp = cleanPhone.startsWith('0')
      ? `964${cleanPhone.slice(1)}`
      : cleanPhone.startsWith('964')
      ? cleanPhone
      : `964${cleanPhone}`;

    const newStore: DirectoryItem = {
      id: newId,
      name: newStoreName,
      category: newStoreCategory,
      subCategory: newStoreSubCategory || 'نشاط تجاري في الشطرة',
      phone: cleanPhone,
      whatsapp: cleanWhatsapp,
      address: newStoreAddress || 'مدينة الشطرة - الشارع العام',
      rating: 5.0,
      reviewsCount: 1,
      isOpen: true,
      workingHours: newStoreWorkingHours,
      imageUrl: newStoreImage,
      description: newStoreDesc || 'متجر مسجل رسمياً بواسطة إدارة دليل الشطرة.',
      tags: ['متجر جديد', 'دليل الشطرة', newStoreOwner || 'المدير'],
    };

    addStore(newStore);
    broadcastNewStoreNotification(newStore);

    // Reset Form
    setNewStoreName('');
    setNewStoreOwner('');
    setNewStoreSubCategory('');
    setNewStorePhone('');
    setNewStoreAddress('');
    setNewStoreDesc('');
    setIsAddStoreOpen(false);

    confetti({ particleCount: 60, spread: 70 });
  };

  // Handle Direct Balance Edit
  const handleSaveCustomBalance = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(customBalanceInput);
    if (!isNaN(num) && num >= 0) {
      setCustomBalance(num);
      setIsEditBalanceOpen(false);
    }
  };

  // Handle Manual Adjustment
  const handleApplyAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(adjustmentAmount);
    if (!isNaN(amt) && amt !== 0) {
      addManualAdjustment(amt, adjustmentReason || 'تسوية رصيد يدوي');
      setAdjustmentAmount('');
      setAdjustmentReason('');
    }
  };

  // Handle Withdrawal Submit
  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (withdrawAmount <= 0) return;

    const res = withdraw(withdrawAmount, withdrawMethod, {
      accountName: withdrawAccountName,
      phoneNumber: withdrawMethod === 'zaincash' ? withdrawPhone : undefined,
      cardNumber: withdrawMethod !== 'zaincash' ? withdrawCardNumber || '**** **** **** 4892' : undefined,
      bankName: withdrawMethod !== 'zaincash' ? withdrawBank : undefined,
    });

    if (res.success) {
      setWithdrawMsg(`تم سحب مبلغ ${withdrawAmount.toLocaleString('ar-IQ')} د.ع بنجاح (رقم الإيصال: ${res.referenceNumber})`);
      setIsWithdrawOpen(false);
      confetti({ particleCount: 50, spread: 60 });
      setTimeout(() => setWithdrawMsg(''), 5000);
    } else {
      alert(res.message);
    }
  };

  // Handle Broadcast Send
  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;

    broadcastNotification({
      title: broadcastTitle.trim(),
      message: broadcastMessage.trim(),
      type: 'system',
      badge: 'تنبيه الإدارة',
    });

    setBroadcastSuccessMsg('تم بث الإشعار بنجاح لجميع مستخدمي تطبيق دليل الشطرة!');
    setBroadcastTitle('');
    setBroadcastMessage('');
    confetti({ particleCount: 60, spread: 70 });
    setTimeout(() => setBroadcastSuccessMsg(''), 4000);
  };

  // Handle Update Security Credentials
  const handleUpdateSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityErrorMsg('');
    setSecuritySuccessMsg('');

    const res = updateManagerCredentials(
      currPass,
      newPhone || managerCredentials.phone,
      newUsername || managerCredentials.username,
      newPassword || managerCredentials.password
    );

    if (res.success) {
      setSecuritySuccessMsg(res.message || 'تم تحديث بيانات الدخول بنجاح!');
      setCurrPass('');
      setNewPassword('');
      setTimeout(() => setSecuritySuccessMsg(''), 4000);
    } else {
      setSecurityErrorMsg(res.message || 'فشل التحديث، تأكد من كلمة المرور الحالية');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-3xl overflow-hidden rounded-3xl bg-slate-900 text-white shadow-2xl border border-red-500/30 max-h-[94vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="border-b border-slate-800 p-4 bg-gradient-to-r from-red-950 via-slate-900 to-red-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-600 text-white font-bold text-xl shadow-lg shadow-red-950">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-base sm:text-lg font-bold text-white">
                  لوحة تحكم إدارة التطبيق (المدير العام)
                </h3>
                <span className="rounded-full bg-red-500/20 border border-red-500/40 px-2 py-0.5 text-[10px] font-bold text-red-400">
                  لوحة سرية خاصة 🔒
                </span>
              </div>
              <p className="text-xs text-slate-400">
                التحكم الكامل بالمحفظة والأرباح • حذف وإدارة المتاجر • صلاحيات المدير الحصرية
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isManagerUnlocked && (
              <button
                type="button"
                onClick={() => {
                  lockManager();
                  onClose();
                }}
                className="flex items-center gap-1 rounded-xl bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-red-900/50 hover:text-red-300 transition-all cursor-pointer"
                title="قفل لوحة الإدارة"
              >
                <Lock className="h-3.5 w-3.5" />
                <span>قفل وخروج</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content Section: If Locked, Show 3-Field Manager Login (Phone + Username + Password) */}
        {!isManagerUnlocked ? (
          <div className="p-6 sm:p-8 flex flex-col items-center justify-center text-center space-y-5 flex-1 overflow-y-auto">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-tr from-red-600 to-rose-700 text-white shadow-2xl shadow-red-900/50">
              <Lock className="h-8 w-8" />
            </div>

            <div className="max-w-md space-y-1.5">
              <h4 className="font-display text-lg sm:text-xl font-bold text-white">
                تسجيل دخول المدير (رقم الهاتف + اليوزر + الباسوورد)
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                يدخل المستخدم العادي بدون أي تسجيل، بينما يفتح المدير النظام بصلاحيات إدارية حصرية من ضمنها ظهور المحفظة، حذف المتاجر، والتحكم بالأرباح.
              </p>
            </div>

            <form onSubmit={handleManagerLogin} className="w-full max-w-sm space-y-3.5 text-right">
              
              {/* 1. Phone Number */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  رقم هاتف المدير *
                </label>
                <div className="relative flex items-center">
                  <Phone className="absolute right-3 h-4 w-4 text-slate-500 pointer-events-none" />
                  <input
                    type="tel"
                    required
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    placeholder="مثال: 07801234567"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/90 py-2.5 pr-9 pl-3 text-xs font-mono font-bold text-white focus:border-red-500 focus:outline-none"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* 2. Username */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  اسم المستخدم (اليوزر / Username) *
                </label>
                <div className="relative flex items-center">
                  <User className="absolute right-3 h-4 w-4 text-slate-500 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder="مثال: admin"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/90 py-2.5 pr-9 pl-3 text-xs font-semibold text-white focus:border-red-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* 3. Password */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  كلمة المرور (الباسوورد / Password) *
                </label>
                <div className="relative flex items-center">
                  <KeyRound className="absolute right-3 h-4 w-4 text-slate-500 pointer-events-none" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/90 py-2.5 pr-9 pl-3 text-xs font-mono text-white focus:border-red-500 focus:outline-none"
                  />
                </div>
              </div>

              {loginError && (
                <div className="rounded-xl bg-rose-950/80 border border-rose-500/50 p-2.5 text-xs font-bold text-rose-300 flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-rose-400 flex-shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 py-3.5 font-display text-sm font-bold text-white shadow-lg hover:from-red-700 hover:to-rose-700 active:scale-95 transition-all cursor-pointer"
              >
                <Unlock className="h-4 w-4" />
                <span>دخول المدير وتفعيل صلاحيات المحفظة والحذف</span>
              </button>

              {/* Demo Hint & Quick Fill */}
              <div className="rounded-xl bg-slate-800/60 p-3 border border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
                <div>
                  <span className="block text-[11px] font-bold text-amber-400">البيانات الافتراضية للنظام:</span>
                  <span className="text-[10px] text-slate-300 font-mono">
                    هاتف: {managerCredentials.phone} | يوزر: {managerCredentials.username} | باس: {managerCredentials.password}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleFillDemoCredentials}
                  className="rounded-lg bg-red-600/30 text-red-300 border border-red-500/40 px-2 py-1 text-[10px] font-bold hover:bg-red-600 hover:text-white transition-all cursor-pointer whitespace-nowrap"
                >
                  تعبئة تلقائية ⚡
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Unlocked Admin Dashboard */
          <>
            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-800 bg-slate-950/60 p-2 gap-1.5 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveTab('wallet')}
                className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 font-display text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === 'wallet'
                    ? 'bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-md'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <Wallet className="h-4 w-4" />
                <span>التحكم بالمحفظة</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('stores')}
                className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 font-display text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === 'stores'
                    ? 'bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-md'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <Store className="h-4 w-4" />
                <span>المتاجر ({items.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('reports')}
                className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 font-display text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer relative ${
                  activeTab === 'reports'
                    ? 'bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-md'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <AlertTriangle className="h-4 w-4" />
                <span>بلاغات الزوار</span>
                {reports.filter((r) => r.status === 'pending').length > 0 && (
                  <span className="rounded-full bg-rose-500 text-white px-1.5 py-0.2 text-[10px] font-bold">
                    {reports.filter((r) => r.status === 'pending').length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('broadcast')}
                className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 font-display text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === 'broadcast'
                    ? 'bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-md'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <Bell className="h-4 w-4" />
                <span>بث إشعار</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('security')}
                className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 font-display text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === 'security'
                    ? 'bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-md'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <KeyRound className="h-4 w-4" />
                <span>بيانات الدخول</span>
              </button>
            </div>

            {/* Notification Alert Message */}
            {deleteSuccessMsg && (
              <div className="bg-emerald-900/60 border-b border-emerald-500/40 p-3 text-xs font-bold text-emerald-200 flex items-center justify-between animate-in fade-in">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  {deleteSuccessMsg}
                </span>
                <button
                  type="button"
                  onClick={() => setDeleteSuccessMsg('')}
                  className="text-emerald-300 hover:text-white cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {withdrawMsg && (
              <div className="bg-amber-900/60 border-b border-amber-500/40 p-3 text-xs font-bold text-amber-200 flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="h-4 w-4 text-amber-400" />
                <span>{withdrawMsg}</span>
              </div>
            )}

            {/* Main Tab Content */}
            <div className="overflow-y-auto p-4 sm:p-6 flex-1 space-y-6">
              
              {/* TAB 1: WALLET FULL CONTROL */}
              {activeTab === 'wallet' && (
                <div className="space-y-6">
                  {/* Grand Balance Card */}
                  <div className="rounded-3xl bg-gradient-to-br from-slate-800 via-slate-900 to-black p-5 sm:p-6 border border-slate-700 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
                      <div className="flex items-center gap-2">
                        <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-bold text-slate-300">
                          صندوق أرباح التطبيق والمحفظة المركزية للمدير
                        </span>
                      </div>
                      <span className="font-mono text-xs text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                        مخفية عن المستخدمين 🔒
                      </span>
                    </div>

                    <div className="mt-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-3">
                      <div>
                        <span className="text-xs text-slate-400 block font-medium">الرصيد المتاح حالياً للسحب:</span>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="font-display text-3xl sm:text-4xl font-extrabold text-white">
                            {balance.toLocaleString('ar-IQ')}
                          </span>
                          <span className="text-sm font-bold text-red-400">دينار عراقي</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {onOpenWalletModal && (
                          <button
                            type="button"
                            onClick={onOpenWalletModal}
                            className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-white hover:bg-white/20 transition-all cursor-pointer border border-white/10"
                          >
                            <Wallet className="h-3.5 w-3.5 text-amber-400" />
                            <span>المحفظة الرقمية ⚡</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setIsEditBalanceOpen(!isEditBalanceOpen)}
                          className="flex items-center gap-1.5 rounded-xl bg-red-600/20 border border-red-500/40 px-3 py-2 text-xs font-bold text-red-300 hover:bg-red-600 hover:text-white transition-all cursor-pointer"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          <span>تعديل الرصيد يدوياً</span>
                        </button>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="mt-5 grid grid-cols-2 gap-3 pt-4 border-t border-slate-800">
                      <div>
                        <span className="text-[11px] text-slate-400">إجمالي إيرادات الإعلانات:</span>
                        <p className="text-sm font-bold text-emerald-400 font-mono">+{totalEarnings.toLocaleString('ar-IQ')} د.ع</p>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400">إجمالي المسحوبات المحولة:</span>
                        <p className="text-sm font-bold text-rose-400 font-mono">-{totalWithdrawn.toLocaleString('ar-IQ')} د.ع</p>
                      </div>
                    </div>
                  </div>

                  {/* Manual Balance Edit Box */}
                  {isEditBalanceOpen && (
                    <form onSubmit={handleSaveCustomBalance} className="rounded-2xl bg-slate-800 p-4 border border-slate-700 space-y-3 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <h5 className="font-display text-xs font-bold text-white">
                          تعيين رصيد مخصص للمحفظة
                        </h5>
                        <button
                          type="button"
                          onClick={resetBalance}
                          className="text-[11px] font-bold text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="h-3 w-3" />
                          <span>تصفير الرصيد (0 د.ع)</span>
                        </button>
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          value={customBalanceInput}
                          onChange={(e) => setCustomBalanceInput(e.target.value)}
                          className="flex-1 rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-xs font-bold text-white focus:border-red-500 focus:outline-none"
                          placeholder="أدخل الرصيد الجديد"
                        />
                        <button
                          type="submit"
                          className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 cursor-pointer"
                        >
                          حفظ الرصيد
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Quick Action Grid: Withdraw, Adjustment */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setIsWithdrawOpen(!isWithdrawOpen)}
                      className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-700 text-white font-display text-xs sm:text-sm font-bold shadow-md hover:from-red-700 hover:to-rose-800 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <ArrowUpRight className="h-5 w-5" />
                        <span>سحب أرباح المدير إلى زين كاش / ماستر كارد</span>
                      </div>
                      <span className="text-xs bg-black/20 px-2 py-1 rounded-lg">فوري ⚡</span>
                    </button>

                    <div className="rounded-2xl bg-slate-800/80 p-3.5 border border-slate-700 flex items-center gap-2">
                      <input
                        type="number"
                        value={adjustmentAmount}
                        onChange={(e) => setAdjustmentAmount(e.target.value)}
                        placeholder="مبلغ التسوية (+ أو -)"
                        className="w-28 rounded-xl border border-slate-600 bg-slate-900 px-2.5 py-2 text-xs font-bold text-white focus:outline-none"
                      />
                      <input
                        type="text"
                        value={adjustmentReason}
                        onChange={(e) => setAdjustmentReason(e.target.value)}
                        placeholder="السبب..."
                        className="flex-1 rounded-xl border border-slate-600 bg-slate-900 px-2.5 py-2 text-xs text-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleApplyAdjustment}
                        className="rounded-xl bg-slate-700 hover:bg-slate-600 px-3 py-2 text-xs font-bold text-white cursor-pointer"
                      >
                        تطبيق
                      </button>
                    </div>
                  </div>

                  {/* Withdrawal Form */}
                  {isWithdrawOpen && (
                    <form onSubmit={handleWithdrawSubmit} className="rounded-2xl bg-slate-800/90 p-4 sm:p-5 border border-slate-700 space-y-3.5 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <h5 className="font-display text-xs sm:text-sm font-bold text-white">
                          طلب سحب أرباح المدير
                        </h5>
                        <button
                          type="button"
                          onClick={() => setIsWithdrawOpen(false)}
                          className="text-xs text-slate-400 hover:text-white"
                        >
                          إغلاق
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setWithdrawMethod('zaincash')}
                          className={`p-2.5 rounded-xl border text-xs font-bold text-right cursor-pointer ${
                            withdrawMethod === 'zaincash' ? 'border-red-500 bg-red-600/20 text-white' : 'border-slate-700 bg-slate-900 text-slate-400'
                          }`}
                        >
                          📱 محفظة زين كاش
                        </button>
                        <button
                          type="button"
                          onClick={() => setWithdrawMethod('mastercard')}
                          className={`p-2.5 rounded-xl border text-xs font-bold text-right cursor-pointer ${
                            withdrawMethod === 'mastercard' ? 'border-red-500 bg-red-600/20 text-white' : 'border-slate-700 bg-slate-900 text-slate-400'
                          }`}
                        >
                          💳 ماستر كارد / مصرفي
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">المبلغ (د.ع)</label>
                          <input
                            type="number"
                            min="1000"
                            max={balance}
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-white focus:outline-none"
                          />
                        </div>
                        {withdrawMethod === 'zaincash' ? (
                          <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1">رقم زين كاش</label>
                            <input
                              type="tel"
                              value={withdrawPhone}
                              onChange={(e) => setWithdrawPhone(e.target.value)}
                              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-white focus:outline-none"
                            />
                          </div>
                        ) : (
                          <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1">رقم البطاقة</label>
                            <input
                              type="text"
                              value={withdrawCardNumber}
                              onChange={(e) => setWithdrawCardNumber(e.target.value)}
                              placeholder="5421 •••• •••• 4892"
                              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-white focus:outline-none"
                            />
                          </div>
                        )}
                      </div>

                      <button
                        type="submit"
                        className="w-full rounded-xl bg-gradient-to-r from-red-600 to-rose-600 py-2.5 text-xs font-bold text-white hover:from-red-700 hover:to-rose-700 cursor-pointer"
                      >
                        تأكيد سحب {withdrawAmount.toLocaleString('ar-IQ')} د.ع فوري
                      </button>
                    </form>
                  )}

                  {/* Transactions List */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-display text-xs font-bold text-slate-300">
                        سجل الحركات المالية ({transactions.length})
                      </h4>
                      {transactions.length > 0 && (
                        <button
                          type="button"
                          onClick={clearTransactions}
                          className="text-[11px] text-rose-400 hover:underline cursor-pointer"
                        >
                          مسح السجل بالكامل
                        </button>
                      )}
                    </div>

                    <div className="space-y-1.5 max-h-56 overflow-y-auto">
                      {transactions.map((tx) => (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between p-2.5 rounded-xl border border-slate-800 bg-slate-950/70 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className={`p-1.5 rounded-lg ${tx.type === 'withdrawal' ? 'bg-rose-900/40 text-rose-400' : 'bg-emerald-900/40 text-emerald-400'}`}>
                              {tx.type === 'withdrawal' ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownLeft className="h-3.5 w-3.5" />}
                            </span>
                            <div>
                              <span className="font-bold text-slate-200 block truncate max-w-[200px]">{tx.title}</span>
                              <span className="text-[10px] text-slate-500 font-mono">{tx.date}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`font-bold font-mono ${tx.type === 'withdrawal' ? 'text-rose-400' : 'text-emerald-400'}`}>
                              {tx.type === 'withdrawal' ? '-' : '+'}{tx.amount.toLocaleString('ar-IQ')} د.ع
                            </span>
                            <button
                              type="button"
                              onClick={() => deleteTransaction(tx.id)}
                              className="text-slate-500 hover:text-rose-400 cursor-pointer p-1"
                              title="حذف الحركة"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: STORES MANAGEMENT & DELETION */}
              {activeTab === 'stores' && (
                <div className="space-y-4">
                  {/* Top Bar with Add Store Button */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-display text-sm font-bold text-white">
                        إدارة وحذف متاجر دليل الشطرة
                      </h4>
                      <p className="text-xs text-slate-400">
                        لديك صلاحية المدير الكاملة لحذف أي متجر أو إضافة محلات جديدة فوراً
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsAddStoreOpen(!isAddStoreOpen)}
                      className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-3.5 py-2 text-xs font-bold text-white shadow-md hover:from-red-700 hover:to-rose-700 transition-all cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                      <span>{isAddStoreOpen ? 'إغلاق النموذج' : 'إضافة متجر جديد'}</span>
                    </button>
                  </div>

                  {/* Add Store Form */}
                  {isAddStoreOpen && (
                    <form onSubmit={handleAddStoreSubmit} className="rounded-2xl bg-slate-950 p-4 sm:p-5 border border-slate-800 space-y-3 animate-in fade-in">
                      <h5 className="font-display text-xs sm:text-sm font-bold text-red-400">
                        إضافة متجر جديد مباشرة بصلاحية المدير
                      </h5>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-xs font-bold text-slate-300 mb-1">اسم المتجر / المحل *</label>
                          <input
                            type="text"
                            required
                            value={newStoreName}
                            onChange={(e) => setNewStoreName(e.target.value)}
                            placeholder="مثال: أسواق الأمانة"
                            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-red-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-300 mb-1">اسم صاحب المتجر</label>
                          <input
                            type="text"
                            value={newStoreOwner}
                            onChange={(e) => setNewStoreOwner(e.target.value)}
                            placeholder="مثال: علي الشطري"
                            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-red-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div>
                          <label className="block text-xs font-bold text-slate-300 mb-1">القسم</label>
                          <select
                            value={newStoreCategory}
                            onChange={(e) => setNewStoreCategory(e.target.value)}
                            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:outline-none"
                          >
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>{c.title}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-300 mb-1">رقم الهاتف</label>
                          <input
                            type="tel"
                            value={newStorePhone}
                            onChange={(e) => setNewStorePhone(e.target.value)}
                            placeholder="0780xxxxxxx"
                            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-300 mb-1">العنوان</label>
                          <input
                            type="text"
                            value={newStoreAddress}
                            onChange={(e) => setNewStoreAddress(e.target.value)}
                            placeholder="شارع الشهداء..."
                            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:outline-none"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full rounded-xl bg-gradient-to-r from-red-600 to-rose-600 py-2.5 text-xs font-bold text-white hover:from-red-700 hover:to-rose-700 cursor-pointer"
                      >
                        نشر المتجر وبث إشعار تلقائي لجميع الهواتف 🚀
                      </button>
                    </form>
                  )}

                  {/* Search and Category Filter */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        value={storeSearch}
                        onChange={(e) => setStoreSearch(e.target.value)}
                        placeholder="ابحث عن متجر لحذفه بالاسم أو العنوان أو الهاتف..."
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 pr-9 pl-3 py-2.5 text-xs text-white placeholder-slate-500 focus:border-red-500 focus:outline-none"
                      />
                    </div>

                    <select
                      value={selectedCategoryFilter}
                      onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                      className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-white focus:border-red-500 focus:outline-none"
                    >
                      <option value="all">جميع الأقسام ({items.length})</option>
                      <option value="doctors">الأطباء</option>
                      <option value="clothing">الملابس والمحلات</option>
                      <option value="restaurants">المطاعم</option>
                      <option value="pharmacies">الصيدليات</option>
                      <option value="electronics">الكترونيات</option>
                      <option value="beauty">صالونات التجميل</option>
                      <option value="services">خدمات</option>
                    </select>
                  </div>

                  {/* Stores List with Delete Button */}
                  <div className="space-y-2.5">
                    {filteredStores.length > 0 ? (
                      filteredStores.map((store) => {
                        const isDeleting = deletingStoreId === store.id;
                        return (
                          <div
                            key={store.id}
                            className={`rounded-2xl border p-3.5 transition-all ${
                              isDeleting
                                ? 'border-rose-500 bg-rose-950/40 ring-1 ring-rose-500'
                                : 'border-slate-800 bg-slate-950/80 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <img
                                  src={store.imageUrl}
                                  alt={store.name}
                                  referrerPolicy="no-referrer"
                                  className="h-14 w-14 rounded-xl object-cover border border-slate-800"
                                />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h5 className="font-display text-xs sm:text-sm font-bold text-white">
                                      {store.name}
                                    </h5>
                                    <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300">
                                      {store.subCategory || store.category}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3 text-red-400" />
                                      {store.address}
                                    </span>
                                    <span className="flex items-center gap-1 font-mono">
                                      <Phone className="h-3 w-3 text-slate-400" />
                                      {store.phone}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Admin Action Buttons */}
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                {onPreviewStore && (
                                  <button
                                    type="button"
                                    onClick={() => onPreviewStore(store)}
                                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer transition-colors"
                                    title="معاينة المتجر"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => setDeletingStoreId(isDeleting ? null : store.id)}
                                  className="flex items-center gap-1.5 rounded-xl bg-rose-900/60 hover:bg-rose-800 text-rose-200 px-3 py-2 text-xs font-bold transition-all cursor-pointer border border-rose-700/50 shadow-xs active:scale-95"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  <span>حذف المتجر</span>
                                </button>
                              </div>
                            </div>

                            {/* Delete Confirmation Box */}
                            {isDeleting && (
                              <div className="mt-3 pt-3 border-t border-rose-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-in fade-in">
                                <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                                  <AlertTriangle className="h-4 w-4 text-rose-400" />
                                  هل أنت متأكد من حذف هذا المتجر نهائياً من دليل الشطرة؟
                                </span>

                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => confirmDeleteStore(store)}
                                    className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 text-xs font-bold shadow-md cursor-pointer transition-colors"
                                  >
                                    نعم، احذف المتجر الآن
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeletingStoreId(null)}
                                    className="rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 text-xs font-semibold cursor-pointer"
                                  >
                                    إلغاء
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-10 text-center text-slate-500 rounded-2xl bg-slate-950/40 border border-slate-800">
                        <Store className="h-10 w-10 mx-auto mb-2 text-slate-600" />
                        <p className="text-xs font-bold text-slate-400">لا توجد متاجر مطابقة لبحثك</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: VISITOR REPORTS & STORE COMPLAINTS */}
              {activeTab === 'reports' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-2xl bg-slate-800/80 p-4 border border-slate-700">
                    <div>
                      <h4 className="font-display text-sm font-bold text-white flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-400" />
                        بلاغات وشكاوى الزوار والزبائن حول المتاجر ({reports.length})
                      </h4>
                      <p className="text-xs text-slate-400">
                        مراسلات وبلاغات فورية واردة من مستخدمي الدليل بخصوص أرقام خاطئة أو محلات مغلقة أو شكاوى
                      </p>
                    </div>
                    <span className="rounded-xl bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs font-bold text-slate-300 self-start sm:self-center">
                      المتبقي: {reports.filter((r) => r.status === 'pending').length} قيد المتابعة
                    </span>
                  </div>

                  {reports.length === 0 ? (
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-8 text-center space-y-2">
                      <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
                      <p className="text-sm font-bold text-slate-200">لا توجد بلاغات أو شكاوى حالياً</p>
                      <p className="text-xs text-slate-400">جميع بيانات المتاجر تعمل بصورة طبيعية ولم يتم الإبلاغ عن أي خطأ.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {reports.map((rep) => {
                        const targetStore = items.find((it) => it.id === rep.storeId);
                        return (
                          <div
                            key={rep.id}
                            className={`rounded-2xl border p-4 transition-all ${
                              rep.status === 'resolved'
                                ? 'bg-slate-950/40 border-slate-800 opacity-75'
                                : 'bg-slate-950 border-rose-900/50 shadow-md'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                              <div className="space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span
                                    className={`rounded-lg px-2.5 py-0.5 text-[11px] font-bold ${
                                      rep.status === 'resolved'
                                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                        : 'bg-rose-950 text-rose-300 border border-rose-800'
                                    }`}
                                  >
                                    {rep.status === 'resolved' ? '✓ تم الحل والمعالجة' : '⚠️ قيد المتابعة'}
                                  </span>

                                  <h5 className="font-display text-sm font-bold text-white">
                                    {rep.storeName}
                                  </h5>

                                  <span className="rounded-md bg-slate-800 text-slate-300 px-2 py-0.5 text-[10px] font-mono">
                                    هاتف المتجر: {rep.storePhone}
                                  </span>
                                </div>

                                {/* Reason & Details */}
                                <div className="space-y-1 bg-slate-900/90 rounded-xl p-3 border border-slate-800/80">
                                  <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                                    <span>نوع البلاغ:</span>
                                    <span className="text-white">{rep.reason}</span>
                                  </div>
                                  <p className="text-xs text-slate-300 leading-relaxed">
                                    "{rep.details}"
                                  </p>
                                </div>

                                {/* Reporter details */}
                                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                                  <span>المبلغ: {rep.reporterName || 'زائر مجهول'}</span>
                                  {rep.reporterPhone && (
                                    <span className="font-mono text-slate-300">
                                      هاتف المبلغ: {rep.reporterPhone}
                                    </span>
                                  )}
                                  <span className="text-slate-500">
                                    التاريخ: {new Date(rep.createdAt).toLocaleString('ar-IQ')}
                                  </span>
                                </div>
                              </div>

                              {/* Action buttons */}
                              <div className="flex flex-wrap sm:flex-col gap-2 flex-shrink-0">
                                {targetStore && onPreviewStore && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onPreviewStore(targetStore);
                                      onClose();
                                    }}
                                    className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 text-xs font-bold transition-all cursor-pointer"
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                    <span>معاينة المتجر</span>
                                  </button>
                                )}

                                <a
                                  href={`tel:${rep.storePhone}`}
                                  className="flex items-center justify-center gap-1.5 rounded-xl bg-red-600/30 hover:bg-red-600 text-red-200 hover:text-white px-3 py-1.5 text-xs font-bold transition-all"
                                >
                                  <Phone className="h-3.5 w-3.5" />
                                  <span>اتصال بالمتجر</span>
                                </a>

                                {rep.reporterPhone && (
                                  <a
                                    href={`tel:${rep.reporterPhone}`}
                                    className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-600/30 hover:bg-blue-600 text-blue-200 hover:text-white px-3 py-1.5 text-xs font-bold transition-all"
                                  >
                                    <Phone className="h-3.5 w-3.5" />
                                    <span>اتصال بالزبون</span>
                                  </a>
                                )}

                                {rep.status === 'pending' ? (
                                  <button
                                    type="button"
                                    onClick={() => resolveReport(rep.id)}
                                    className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-bold transition-all cursor-pointer"
                                  >
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    <span>تعيين كـ تم الحل</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => deleteReport(rep.id)}
                                    className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 px-3 py-1.5 text-xs font-bold transition-all cursor-pointer"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    <span>حذف الأرشفة</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: BROADCAST NOTIFICATIONS */}
              {activeTab === 'broadcast' && (
                <div className="max-w-md mx-auto space-y-4">
                  <div className="rounded-2xl bg-slate-800/80 p-4 border border-slate-700 space-y-1">
                    <h4 className="font-display text-sm font-bold text-white flex items-center gap-2">
                      <Bell className="h-4 w-4 text-red-500" />
                      بث إشعار منبثق فوري لجميع المستخدمين
                    </h4>
                    <p className="text-xs text-slate-400">
                      سيظهر هذا الإشعار فورا في شريط التنبيهات المنبثق أعلى الشاشة عند فتح التطبيق لجميع أهالي الشطرة.
                    </p>
                  </div>

                  {broadcastSuccessMsg && (
                    <div className="rounded-xl bg-emerald-900/80 border border-emerald-500/50 p-3 text-xs font-bold text-emerald-200 flex items-center gap-2 animate-in fade-in">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <span>{broadcastSuccessMsg}</span>
                    </div>
                  )}

                  <form onSubmit={handleSendBroadcast} className="space-y-3.5 rounded-2xl bg-slate-950 p-5 border border-slate-800">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        عنوان الإشعار *
                      </label>
                      <input
                        type="text"
                        required
                        value={broadcastTitle}
                        onChange={(e) => setBroadcastTitle(e.target.value)}
                        placeholder="مثال: 📢 تنبيه هام من إدارة دليل الشطرة"
                        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-white focus:border-red-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        نص الرسالة / الإشعار *
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={broadcastMessage}
                        onChange={(e) => setBroadcastMessage(e.target.value)}
                        placeholder="اكتب تفاصيل التنبيه أو التهنئة أو الخبر لجميع المستخدمين..."
                        className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-xs text-white focus:border-red-500 focus:outline-none resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 py-3 text-xs font-bold text-white shadow-md hover:from-red-700 hover:to-rose-700 cursor-pointer transition-all"
                    >
                      <Send className="h-4 w-4" />
                      <span>إرسال وبث الإشعار لجميع الهواتف الآن</span>
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 4: SECURITY & CREDENTIALS UPDATE */}
              {activeTab === 'security' && (
                <div className="max-w-md mx-auto space-y-4">
                  <div className="rounded-2xl bg-slate-800/80 p-4 border border-slate-700 space-y-1">
                    <h4 className="font-display text-sm font-bold text-white flex items-center gap-2">
                      <KeyRound className="h-4 w-4 text-amber-400" />
                      تحديث بيانات دخول المدير (رقم الهاتف، اليوزر، الباسوورد)
                    </h4>
                    <p className="text-xs text-slate-400">
                      يمكنك تخصيص بيانات اعتمادك الإدارية لتأمين دخولك للبرنامج.
                    </p>
                  </div>

                  {securitySuccessMsg && (
                    <div className="rounded-xl bg-emerald-900/80 border border-emerald-500/50 p-3 text-xs font-bold text-emerald-200 flex items-center gap-2 animate-in fade-in">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <span>{securitySuccessMsg}</span>
                    </div>
                  )}

                  {securityErrorMsg && (
                    <div className="rounded-xl bg-rose-950/80 border border-rose-500/50 p-3 text-xs font-bold text-rose-300 flex items-center gap-2 animate-in fade-in">
                      <AlertTriangle className="h-4 w-4 text-rose-400" />
                      <span>{securityErrorMsg}</span>
                    </div>
                  )}

                  <form onSubmit={handleUpdateSecurity} className="space-y-3.5 rounded-2xl bg-slate-950 p-5 border border-slate-800">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        رقم هاتف المدير الجديد *
                      </label>
                      <input
                        type="tel"
                        required
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        placeholder="0780xxxxxxx"
                        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-mono text-white focus:border-red-500 focus:outline-none text-left"
                        dir="ltr"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        اسم المستخدم الجديد (اليوزر) *
                      </label>
                      <input
                        type="text"
                        required
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        placeholder="admin"
                        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-red-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        كلمة المرور الجديدة (الباسوورد) *
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="اترك فارغاً للإبقاء على كلمة المرور الحالية"
                        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-mono text-white focus:border-red-500 focus:outline-none"
                      />
                    </div>

                    <div className="pt-2 border-t border-slate-800">
                      <label className="block text-xs font-bold text-amber-400 mb-1">
                        كلمة المرور الحالية لتأكيد التغيير *
                      </label>
                      <input
                        type="password"
                        required
                        value={currPass}
                        onChange={(e) => setCurrPass(e.target.value)}
                        placeholder="أدخل كلمة المرور الحالية"
                        className="w-full rounded-xl border border-amber-600/50 bg-slate-900 px-3 py-2 text-xs font-mono text-white focus:border-amber-400 focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full rounded-xl bg-gradient-to-r from-red-600 to-rose-600 py-3 text-xs font-bold text-white shadow-md hover:from-red-700 hover:to-rose-700 cursor-pointer transition-all"
                    >
                      حفظ وتحديث بيانات المدير
                    </button>
                  </form>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
