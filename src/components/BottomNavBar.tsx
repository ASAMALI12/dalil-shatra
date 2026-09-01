import React from 'react';
import { Home, Flame, User, Star, Wallet, ShieldCheck } from 'lucide-react';
import { useWallet } from '../context/WalletContext';

export type NavTab = 'home' | 'offers' | 'account' | 'advertise' | 'wallet';

interface BottomNavBarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  onOpenAdModal: () => void;
  onOpenWalletModal?: () => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAdModal,
  onOpenWalletModal,
}) => {
  const { isManagerUnlocked, balance } = useWallet();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-md pb-safe">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2 sm:max-w-xl">
        {/* 1. الرئيسية (Home) */}
        <button
          type="button"
          onClick={() => setActiveTab('home')}
          className={`flex flex-1 flex-col items-center justify-center gap-1 py-1 transition-all cursor-pointer ${
            activeTab === 'home'
              ? 'text-red-600 font-bold'
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <Home className={`h-5 w-5 sm:h-6 sm:w-6 ${activeTab === 'home' ? 'stroke-[2.5] text-red-600' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] sm:text-xs">الرئيسية</span>
        </button>

        {/* 2. العروض (Offers) */}
        <button
          type="button"
          onClick={() => setActiveTab('offers')}
          className={`flex flex-1 flex-col items-center justify-center gap-1 py-1 transition-all cursor-pointer ${
            activeTab === 'offers'
              ? 'text-red-600 font-bold'
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <Flame className={`h-5 w-5 sm:h-6 sm:w-6 ${activeTab === 'offers' ? 'stroke-[2.5] text-red-600 fill-red-500/20' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] sm:text-xs">العروض</span>
        </button>

        {/* 3. المحفظة (Wallet - ONLY VISIBLE WHEN MANAGER IS LOGGED IN) */}
        {isManagerUnlocked && (
          <button
            type="button"
            onClick={() => {
              if (onOpenWalletModal) {
                onOpenWalletModal();
              } else {
                setActiveTab('wallet');
              }
            }}
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-1 transition-all cursor-pointer relative text-amber-600 font-bold`}
          >
            <div className="relative">
              <Wallet className="h-5 w-5 sm:h-6 sm:w-6 stroke-[2.2] text-amber-600" />
              <span className="absolute -top-1 -right-1 flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            </div>
            <span className="text-[10px] sm:text-xs text-amber-800">
              المحفظة 🔒
            </span>
          </button>
        )}

        {/* 4. حسابي (My Account) */}
        <button
          type="button"
          onClick={() => setActiveTab('account')}
          className={`flex flex-1 flex-col items-center justify-center gap-1 py-1 transition-all cursor-pointer ${
            activeTab === 'account'
              ? 'text-red-600 font-bold'
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <User className={`h-5 w-5 sm:h-6 sm:w-6 ${activeTab === 'account' ? 'stroke-[2.5] text-red-600' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] sm:text-xs">حسابي</span>
        </button>

        {/* 5. إعلان (Advertise) */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('advertise');
            onOpenAdModal();
          }}
          className={`flex flex-1 flex-col items-center justify-center gap-1 py-1 transition-all cursor-pointer ${
            activeTab === 'advertise'
              ? 'text-amber-500 font-bold'
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <Star className="h-5 w-5 sm:h-6 sm:w-6 stroke-[2] fill-amber-400 text-amber-500" />
          <span className="text-[10px] sm:text-xs">إعلان</span>
        </button>
      </div>
    </nav>
  );
};
