import React, { useState, useMemo } from 'react';
import {
  X,
  ShieldAlert,
  ShieldCheck,
  Store,
  Trash2,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  LogOut,
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
  Database,
  Upload,
  Megaphone,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useWallet } from '../context/WalletContext';
import { useDirectory } from '../context/DirectoryContext';
import { useNotification } from '../context/NotificationContext';
import { DirectoryItem, Category } from '../types/shatrah';
import { validateIraqPhone, normalizeIraqPhone } from '../utils/iraqPhoneValidator';
import { safeApiFetch } from '../utils/apiClient';
import { ManagerDataImportTab } from './ManagerDataImportTab';
import { ManagerClaimsTab } from './ManagerClaimsTab';
import { ManagerAdsTab } from './ManagerAdsTab';

interface ManagerDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPreviewStore?: (store: DirectoryItem) => void;
}

export const ManagerDashboardModal: React.FC<ManagerDashboardModalProps> = ({
  isOpen,
  onClose,
  onPreviewStore,
}) => {
  const {
    isManagerUnlocked,
    managerCredentials,
    loginManager,
    lockManager,
    updateManagerCredentials,
    refreshAdminSession,
    verifyAdminSession,
  } = useWallet();

  const {
    items,
    categories,
    deleteStore,
    addStore,
    reports,
    resolveReport,
    deleteReport,
    isSupabaseLoading,
    isUsingSupabase,
    supabaseStoreCount,
    refreshFromSupabase,
    seedToSupabase,
  } = useDirectory();
  const { broadcastNewStoreNotification, broadcastNotification } = useNotification();

  const [isSeedingSupabase, setIsSeedingSupabase] = useState(false);
  const [seedNotice, setSeedNotice] = useState('');

  // Navigation & Sub-tabs
  const [activeTab, setActiveTab] = useState<'stores' | 'import' | 'claims' | 'reports' | 'ads' | 'broadcast' | 'security'>('stores');

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
  const handleManagerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    try {
      const resp = await safeApiFetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loginUsername.trim(),
          password: loginPassword.trim(),
          phone: loginPhone.trim(),
        }),
      });
      const data = await resp.json();
      if (resp.ok && data.success && data.token) {
        sessionStorage.setItem('iraq_admin_token', data.token);
        loginManager(loginPhone, loginUsername);
        setLoginPhone('');
        setLoginUsername('');
        setLoginPassword('');
        confetti({ particleCount: 50, spread: 70 });
        return;
      } else {
        setLoginError(data.error || 'بيانات تسجيل الدخول غير صحيحة.');
        return;
      }
    } catch {
      setLoginError('تعذر الاتصال بخادم الإدارة، يرجى المحاولة لاحقاً.');
    }
  };

  const handleManagerLogout = async () => {
    try {
      const token = sessionStorage.getItem('iraq_admin_token');
      if (token) {
        await safeApiFetch('/api/admin/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch {
      // Continue client logout
    }
    lockManager();
    onClose();
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
    setDeleteSuccessMsg(`تم حذف متجر "${store.name}" نهائياً من دليل العراق بنجاح.`);
    setTimeout(() => setDeleteSuccessMsg(''), 4000);
  };

  // Handle Add New Store by Manager
  const handleAddStoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName.trim()) return;

    if (!newStorePhone.trim()) {
      alert('يجب إدخال رقم هاتف عراقي حقيقي لتمكين تواصل الزبائن مع المتجر.');
      return;
    }

    const phoneValidation = validateIraqPhone(newStorePhone);
    if (!phoneValidation.isValid) {
      alert(`رقم الهاتف غير صالح: ${phoneValidation.reason}\nيجب إدخال رقم هاتف عراقي حقيقي لشبكات زين، آسيا سيل، أو كورك.`);
      return;
    }

    const newId = `store-${Date.now()}`;
    const cleanPhone = phoneValidation.formattedDisplay || phoneValidation.normalized;
    const cleanWhatsapp = phoneValidation.normalized;

    const newStore: DirectoryItem = {
      id: newId,
      name: newStoreName.trim(),
      category: newStoreCategory,
      subCategory: newStoreSubCategory.trim() || 'نشاط تجاري موثق',
      phone: cleanPhone,
      whatsapp: cleanWhatsapp,
      address: newStoreAddress.trim() || 'العراق - المركز العام',
      rating: null,
      reviewsCount: 0,
      isOpen: true,
      workingHours: newStoreWorkingHours.trim(),
      imageUrl: newStoreImage,
      description: newStoreDesc.trim() || 'متجر مسجل رسمياً بواسطة إدارة دليل العراق.',
      tags: ['متجر جديد', 'دليل العراق', newStoreOwner.trim() || 'المدير'],
      source: 'manual_registration',
      phoneReliability: 'admin_confirmed',
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

    setBroadcastSuccessMsg('تم بث الإشعار بنجاح لجميع مستخدمي تطبيق دليل العراق!');
    setBroadcastTitle('');
    setBroadcastMessage('');
    confetti({ particleCount: 60, spread: 70 });
    setTimeout(() => setBroadcastSuccessMsg(''), 4000);
  };

  // Handle Update Security Credentials
  const handleUpdateSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityErrorMsg('');
    setSecuritySuccessMsg('');

    if (newPassword && !currPass) {
      setSecurityErrorMsg('يرجى إدخال كلمة المرور الحالية لتأكيد التغيير.');
      return;
    }

    if (newPassword) {
      try {
        const token = sessionStorage.getItem('iraq_admin_token');
        const resp = await safeApiFetch('/api/admin/change-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'x-admin-token': token || '',
          },
          body: JSON.stringify({
            currentPassword: currPass,
            newPassword: newPassword,
          }),
        });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok || !data.success) {
          setSecurityErrorMsg(data.error || 'فشل تغيير كلمة المرور. تأكد من كلمة المرور الحالية.');
          return;
        }
      } catch {
        setSecurityErrorMsg('تعذر الاتصال بالخادم لتحديث كلمة المرور.');
        return;
      }
    }

    updateManagerCredentials(
      currPass,
      newPhone || managerCredentials.phone,
      newUsername || managerCredentials.username
    );

    setSecuritySuccessMsg('تم تحديث بيانات الدخول بنجاح!');
    setCurrPass('');
    setNewPassword('');
    setTimeout(() => setSecuritySuccessMsg(''), 4000);
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
                onClick={handleManagerLogout}
                className="flex items-center gap-1 rounded-xl bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-red-900/50 hover:text-red-300 transition-all cursor-pointer"
                title="تسجيل خروج المدير"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>تسجيل خروج</span>
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
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-tr from-amber-600 to-red-600 text-white shadow-2xl shadow-red-900/50">
              <ShieldCheck className="h-8 w-8 text-white" />
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
            </form>
          </div>
        ) : (
          /* Unlocked Admin Dashboard */
          <>
            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-800 bg-slate-950/60 p-2 gap-1.5 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveTab('stores')}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 px-2.5 font-display text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
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
                onClick={() => setActiveTab('import')}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 px-2.5 font-display text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === 'import'
                    ? 'bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-md'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <Upload className="h-4 w-4 text-sky-400" />
                <span>استيراد وتوزيع البيانات ⚡</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('claims')}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 px-2.5 font-display text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === 'claims'
                    ? 'bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-md'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>توثيقات الملكية</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('reports')}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 px-2.5 font-display text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer relative ${
                  activeTab === 'reports'
                    ? 'bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-md'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <AlertTriangle className="h-4 w-4" />
                <span>البلاغات</span>
                {reports.filter((r) => r.status === 'pending').length > 0 && (
                  <span className="rounded-full bg-rose-500 text-white px-1.5 py-0.2 text-[10px] font-bold">
                    {reports.filter((r) => r.status === 'pending').length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ads')}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 px-2.5 font-display text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === 'ads'
                    ? 'bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-md'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <Megaphone className="h-4 w-4 text-amber-400" />
                <span>الإعلانات الممولة</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('broadcast')}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 px-2.5 font-display text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
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
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 px-2.5 font-display text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === 'security'
                    ? 'bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-md'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <KeyRound className="h-4 w-4" />
                <span>الأمان</span>
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

            {/* Main Tab Content */}
            <div className="overflow-y-auto p-4 sm:p-6 flex-1 space-y-6">
              {/* TAB: STORES MANAGEMENT & DELETION */}
              {activeTab === 'stores' && (
                <div className="space-y-4">
                  {/* Top Bar with Add Store Button */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-display text-sm font-bold text-white">
                        إدارة وحذف متاجر دليل العراق
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

                  {/* Supabase Database Status Card */}
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3 flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                        <Database className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-emerald-300">
                            قاعدة بيانات Supabase السحابية (public.stores)
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 border border-emerald-500/30">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            {isUsingSupabase ? 'متصل ومفعل' : 'جاهز للمزامنة'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          إجمالي المتاجر المحملة حالياً: <strong className="text-white">{items.length} متجر</strong>
                          {supabaseStoreCount > 0 && ` (${supabaseStoreCount} من Supabase)`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {seedNotice && (
                        <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/30">
                          {seedNotice}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={async () => {
                          setIsSeedingSupabase(true);
                          setSeedNotice('');
                          const res = await seedToSupabase();
                          setIsSeedingSupabase(false);
                          if (res.success) {
                            setSeedNotice(`تم رفع ${res.count} متجر بنجاح`);
                            setTimeout(() => setSeedNotice(''), 4000);
                          } else {
                            setSeedNotice('تأكد من إعداد المفاتيح');
                            setTimeout(() => setSeedNotice(''), 4000);
                          }
                        }}
                        disabled={isSeedingSupabase || isSupabaseLoading}
                        className="flex items-center gap-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 px-2.5 py-1.5 text-xs font-semibold border border-emerald-500/30 transition-colors disabled:opacity-60 cursor-pointer"
                        title="مزامنة وتخزين جميع المتاجر الحالية في جدول public.stores في Supabase"
                      >
                        <Database className="h-3.5 w-3.5" />
                        <span>{isSeedingSupabase ? 'جاري المزامنة...' : 'مزامنة مع السحابة'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => refreshFromSupabase()}
                        disabled={isSupabaseLoading || isSeedingSupabase}
                        className="flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 text-xs font-semibold border border-slate-700 transition-colors disabled:opacity-60 cursor-pointer"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${isSupabaseLoading ? 'animate-spin text-emerald-400' : ''}`} />
                        <span>{isSupabaseLoading ? 'جاري الجلب...' : 'تحديث'}</span>
                      </button>
                    </div>
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
                                  هل أنت متأكد من حذف هذا المتجر نهائياً من دليل العراق؟
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

              {/* TAB: IMPORT DATA PIPELINE */}
              {activeTab === 'import' && <ManagerDataImportTab />}

              {/* TAB: STORE CLAIMS & VERIFICATIONS */}
              {activeTab === 'claims' && <ManagerClaimsTab />}

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

              {/* TAB: SPONSORED ADS (National, Governorate, Store Areas) */}
              {activeTab === 'ads' && <ManagerAdsTab />}

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
