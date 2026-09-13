import React from 'react';
import { Home } from 'lucide-react';

export type NavTab = 'home' | 'districts' | 'offers';

interface BottomNavBarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  onOpenAdModal?: () => void;
  onOpenSidebar?: () => void;
  onOpenWalletModal?: () => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  setActiveTab,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/90 bg-white/95 backdrop-blur-md pb-safe">
      <div className="mx-auto flex max-w-xs items-center justify-center px-4 py-2 sm:max-w-sm">
        {/* الرئيسية (Home - All Governorates) */}
        <button
          type="button"
          onClick={() => setActiveTab('home')}
          className={`flex items-center justify-center gap-2 py-1 px-6 rounded-2xl transition-all cursor-pointer ${
            activeTab === 'home'
              ? 'bg-sky-50 text-sky-700 font-bold border border-sky-200/80 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 font-medium'
          }`}
        >
          <Home className="h-5 w-5 stroke-[2.2] text-sky-600" />
          <span className="text-xs font-black">الرئيسية (المحافظات)</span>
        </button>
      </div>
    </nav>
  );
};


