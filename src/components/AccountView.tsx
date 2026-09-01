import React, { useState } from 'react';
import {
  User,
  PhoneCall,
  Shield,
  Heart,
  Store,
  Bell,
  HelpCircle,
  FileText,
  ChevronLeft,
  PlusCircle,
  ShieldCheck,
  Lock,
  Unlock,
  KeyRound,
  Trash2,
  Wallet,
  Sparkles,
  MessageCircle,
  Crown,
  Edit3,
  CheckCircle,
  AlertTriangle,
  Headphones,
} from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { useDirectory } from '../context/DirectoryContext';
import { DirectoryItem } from '../types/shatrah';

interface AccountViewProps {
  onOpenAdModal: () => void;
  onOpenManagerDashboard: () => void;
  onOpenOpenStoreModal?: () => void;
  onOpenWalletModal?: () => void;
  onOpenNotifications?: () => void;
  onOpenClaimStore?: (store?: DirectoryItem) => void;
  onOpenEditStore?: (store: DirectoryItem) => void;
  onPreviewStore?: (store: DirectoryItem) => void;
}

export const AccountView: React.FC<AccountViewProps> = ({
  onOpenAdModal,
  onOpenManagerDashboard,
  onOpenOpenStoreModal,
  onOpenWalletModal,
  onOpenNotifications,
  onOpenClaimStore,
  onOpenEditStore,
  onPreviewStore,
}) => {
  const { isManagerUnlocked, lockManager, balance } = useWallet();
  const { items, claimedStoreIds } = useDirectory();
  const [userName, setUserName] = useState('مستخدم دليل الشطرة');

  // Filter stores that belong to this user
  const myClaimedStores = items.filter((item) => claimedStoreIds.includes(item.id));

  const emergencyNumbers = [
    { title: 'طوارئ مستشفى الشطرة العام', number: '07801112233', icon: '🏥' },
    { title: 'النجدة والشرطة', number: '104', icon: '🚓' },
    { title: 'الدفاع المدني والإطفاء', number: '115', icon: '🚒' },
    { title: 'الإسعاف الفوري', number: '122', icon: '🚑' },
    { title: 'بلدية قضاء الشطرة', number: '07804445566', icon: '🏢' },
    { title: 'طوارئ الكهرباء والصيانة', number: '07807778899', icon: '⚡' },
  ];

  return (
    <div className="space-y-5 pb-20">
      {/* User Profile Header (Public Profile) */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-slate-900 via-slate-800 to-red-600 text-white font-display text-2xl font-bold shadow-md ring-4 ring-slate-100">
            {isManagerUnlocked ? 'م' : '👤'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-lg sm:text-xl font-bold text-slate-900">
                {isManagerUnlocked ? 'مدير تطبيق دليل الشطرة' : userName}
              </h2>
              {isManagerUnlocked ? (
                <span className="rounded-md bg-red-100 border border-red-200 px-2 py-0.5 text-[10px] font-bold text-red-800 flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  صلاحيات الإدارة مفعّلة
                </span>
              ) : (
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                  مستخدم عادي (بدون تسجيل)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              {isManagerUnlocked ? 'إدارة النظام المركزية والمحفظة' : 'مدينة الشطرة • محافظة ذي قار'}
            </p>
          </div>
        </div>

        {/* Manager Mode Quick Status */}
        {isManagerUnlocked ? (
          <button
            type="button"
            onClick={lockManager}
            className="flex items-center gap-1.5 rounded-2xl bg-rose-50 border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-all cursor-pointer"
            title="قفل وضع المدير"
          >
            <Lock className="h-3.5 w-3.5" />
            <span>قفل وخروج</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenManagerDashboard}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all cursor-pointer"
            title="دخول المدير"
          >
            <Lock className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* 1. MY CLAIMED STORES (متاجري الموثقة وإدارتها) */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
              <Crown className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-display text-sm font-bold text-slate-900">
                متاجري الموثقة ({myClaimedStores.length})
              </h3>
              <p className="text-[11px] text-slate-500">
                المتاجر التي قمت بتأكيد رقم هاتفها والمطالبة بإدارتها
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onOpenOpenStoreModal && onOpenOpenStoreModal()}
            className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
          >
            + تسجيل متجر جديد
          </button>
        </div>

        {myClaimedStores.length > 0 ? (
          <div className="space-y-2.5 pt-1">
            {myClaimedStores.map((store) => (
              <div
                key={store.id}
                className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-3.5 flex items-center justify-between gap-3 shadow-2xs"
              >
                <div
                  className="flex items-center gap-3 min-w-0 cursor-pointer"
                  onClick={() => onPreviewStore && onPreviewStore(store)}
                >
                  <img
                    src={store.imageUrl}
                    alt={store.name}
                    referrerPolicy="no-referrer"
                    className="h-12 w-12 rounded-xl object-cover flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-display text-xs sm:text-sm font-bold text-slate-900 truncate">
                        {store.name}
                      </h4>
                      <span className="rounded-md bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.2">
                        ✓ موثق
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">{store.phone} • {store.subCategory}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {onOpenEditStore && (
                    <button
                      type="button"
                      onClick={() => onOpenEditStore(store)}
                      className="flex items-center gap-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3 py-2 shadow-xs cursor-pointer"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>تعديل وإدارة</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-amber-50/70 border border-amber-200/80 p-4 text-center space-y-2.5">
            <p className="text-xs text-amber-900 leading-relaxed font-semibold">
              هل أنت صاحب محل أو عيادة أو نشاط تجاري مدرج بالفعل في دليل الشطرة؟
            </p>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              جميع المتاجر في التطبيق حقيقية، ويحق لك المطالبة بمتجرك فوراً بمجرد تأكيد رقم هاتفك المسجل عبر رسالة الواتساب.
            </p>
            <button
              type="button"
              onClick={() => onOpenClaimStore && onOpenClaimStore()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2 shadow-sm cursor-pointer"
            >
              <Crown className="h-3.5 w-3.5" />
              <span>المطالبة بمتجر مسجل في الدليل 👑</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. STORE REGISTRATION & WHATSAPP VERIFICATION (For Normal Users) */}
      <div className="rounded-3xl border-2 border-emerald-300 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/50 p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-center sm:text-right">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white text-2xl shadow-md">
            <Store className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-base font-bold text-emerald-950">
                فتح متجر جديد في دليل الشطرة
              </h3>
              <span className="rounded-full bg-emerald-200 border border-emerald-300 text-emerald-900 text-[10px] px-2 py-0.5 font-bold">
                توثيق واتساب 💬
              </span>
            </div>
            <p className="text-xs text-emerald-800 mt-0.5">
              يدخل المستخدم بدون تسجيل، وعند فتح متجر يتم تأكيد الاسم ورقم الهاتف بالواتساب وبث إشعار لجميع الهواتف فوراً.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenOpenStoreModal}
          className="rounded-2xl bg-emerald-600 px-5 py-2.5 font-display text-xs font-bold text-white shadow-md hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
        >
          أضف متجرك الآن مجاناً 🚀
        </button>
      </div>

      {/* 3. SECURE MANAGER ACCESS CARD (Phone + Username + Password) */}
      <div className="rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-red-950 p-5 sm:p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-red-600/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600 text-white font-bold shadow-lg">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-base font-bold text-white">
                  لوحة تحكم إدارة التطبيق (المدير العام)
                </h3>
                <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-300 border border-red-500/30">
                  {isManagerUnlocked ? 'مفتوحة الآن' : 'سري ومحمي 🔒'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                دخول برقم الهاتف واليوزر والباسوورد • ظهور المحفظة • حذف وإدارة المتاجر • بث الإشعارات
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isManagerUnlocked && onOpenWalletModal && (
              <button
                type="button"
                onClick={onOpenWalletModal}
                className="flex items-center gap-1 rounded-2xl bg-amber-500 hover:bg-amber-600 px-4 py-2.5 font-display text-xs font-bold text-slate-950 shadow-md transition-all cursor-pointer whitespace-nowrap"
              >
                <Wallet className="h-4 w-4" />
                <span>المحفظة ({balance.toLocaleString('ar-IQ')} د.ع)</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenManagerDashboard}
              className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 px-5 py-3 font-display text-xs sm:text-sm font-bold text-white shadow-lg hover:from-red-700 hover:to-rose-700 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              {isManagerUnlocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
              <span>{isManagerUnlocked ? 'لوحة تحكم المدير ⚡' : 'تسجيل دخول المدير 🔑'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Business Owner / Merchant CTA */}
      <div className="rounded-3xl border-2 border-red-200 bg-gradient-to-r from-red-50 via-rose-50 to-amber-50 p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-center sm:text-right">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600 text-white text-2xl shadow-md">
            📢
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-slate-900">
              هل ترغب بحجز إعلان مميز أو بانر رئيسي؟
            </h3>
            <p className="text-xs text-slate-600">
              أضف إعلانك في الدليل الذكي وتواصل مع آلاف الزبائن يومياً مع إشعار تلقائي لجميع الهواتف
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenAdModal}
          className="rounded-2xl bg-red-600 px-5 py-2.5 font-display text-xs font-bold text-white shadow-md hover:bg-red-700 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
        >
          أضف إعلانك التجاري
        </button>
      </div>

      {/* 5. Public Quick Services & Menu */}
      <div className="rounded-3xl border border-slate-200 bg-white p-2 shadow-xs divide-y divide-slate-100">
        {onOpenNotifications && (
          <button
            type="button"
            onClick={onOpenNotifications}
            className="flex w-full items-center justify-between p-3.5 hover:bg-slate-50 rounded-2xl transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <Bell className="h-4 w-4" />
              </div>
              <div className="text-right">
                <h4 className="font-display text-xs sm:text-sm font-bold text-slate-800">
                  مركز الإشعارات والتنبيهات
                </h4>
                <p className="text-[11px] text-slate-400">تنبيهات العروض والمحلات الجديدة في الشطرة</p>
              </div>
            </div>
            <ChevronLeft className="h-4 w-4 text-slate-400" />
          </button>
        )}

        <button
          type="button"
          onClick={onOpenOpenStoreModal}
          className="flex w-full items-center justify-between p-3.5 hover:bg-slate-50 rounded-2xl transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Store className="h-4 w-4" />
            </div>
            <div className="text-right">
              <h4 className="font-display text-xs sm:text-sm font-bold text-slate-800">
                فتح وتسجيل متجر جديد (توثيق واتساب)
              </h4>
              <p className="text-[11px] text-slate-400">تأكيد الاسم ورقم الهاتف ونشر النشاط مجاناً</p>
            </div>
          </div>
          <ChevronLeft className="h-4 w-4 text-slate-400" />
        </button>

        <button
          type="button"
          onClick={onOpenAdModal}
          className="flex w-full items-center justify-between p-3.5 hover:bg-slate-50 rounded-2xl transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
              <PlusCircle className="h-4 w-4" />
            </div>
            <div className="text-right">
              <h4 className="font-display text-xs sm:text-sm font-bold text-slate-800">
                إعلانات المحلات والمتاجر
              </h4>
              <p className="text-[11px] text-slate-400">طلب حجز بانر رئيسي أو بطاقة مميزة</p>
            </div>
          </div>
          <ChevronLeft className="h-4 w-4 text-slate-400" />
        </button>

        {/* Contact Administration & Support */}
        <a
          href="https://wa.me/9647801234567?text=%D8%A7%D9%84%D8%B3%D9%84%D8%A7%D9%85%20%D8%B9%D9%84%D9%8A%D9%83%D9%85%20%D8%A5%D8%AF%D8%A7%D8%B1%D8%A9%20%D8%AF%D9%84%D9%8A%D9%84%20%D8%A7%D9%84%D8%B4%D8%B7%D8%B1%D8%A9%D8%8C%20%D9%84%D8%AF%D9%8A%20%D8%A7%D8%B3%D8%AA%D9%81%D8%B3%D8%A7%D8%B1%20/%20%D8%A8%D9%84%D8%A7%D8%BA%20%D8%AD%D9%88%D9%84%20%D8%A7%D9%84%D8%AF%D9%84%D9%8A%D9%84"
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-between p-3.5 hover:bg-slate-50 rounded-2xl transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <Headphones className="h-4 w-4" />
            </div>
            <div className="text-right">
              <h4 className="font-display text-xs sm:text-sm font-bold text-slate-800">
                مراسلة إدارة التطبيق والدعم الفني
              </h4>
              <p className="text-[11px] text-slate-400">واتساب مباشر • استقبال الشكاوى والاقتراحات 24/7</p>
            </div>
          </div>
          <ChevronLeft className="h-4 w-4 text-slate-400" />
        </a>
      </div>

      {/* Emergency Phone Numbers in Shatrah */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <PhoneCall className="h-4 w-4 text-red-600" />
          <h3 className="font-display text-base font-bold text-slate-900">
            أرقام الطوارئ والخدمات الهامة في الشطرة
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {emergencyNumbers.map((em, idx) => (
            <a
              key={idx}
              href={`tel:${em.number}`}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs hover:border-red-300 hover:bg-red-50/20 transition-all"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-xl">{em.icon}</span>
                <span className="font-display text-xs font-bold text-slate-800">
                  {em.title}
                </span>
              </div>
              <span className="font-mono text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-lg">
                {em.number}
              </span>
            </a>
          ))}
        </div>
      </div>

      {/* App Info */}
      <div className="text-center text-xs text-slate-400 pt-4 space-y-1">
        <p className="font-bold text-slate-600">تطبيق دليل الشطرة الذكي</p>
        <p>الإصدار 2.5.0 • جميع الحقوق محفوظة لمدينة الشطرة</p>
      </div>
    </div>
  );
};

