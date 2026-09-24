import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  User,
  Phone,
  Store,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  RefreshCw,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { useDirectory } from '../context/DirectoryContext';
import { DirectoryItem } from '../types/shatrah';
import { safeApiFetch } from '../utils/apiClient';

export const ManagerClaimsTab: React.FC = () => {
  const { items, unclaimStore } = useDirectory();
  const [claimsList, setClaimsList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionNotice, setActionNotice] = useState('');
  const [revokingStoreId, setRevokingStoreId] = useState<string | null>(null);

  // Collect claimed stores from items safely
  const claimedStores = (Array.isArray(items) ? items : []).filter(
    (i) => i && (i.isClaimed || i.claimStatus === 'verified' || i.claimedByName)
  );

  const fetchClaimsFromBackend = async () => {
    setIsLoading(true);
    try {
      let adminToken = '';
      try {
        adminToken = sessionStorage.getItem('iraq_admin_token') || localStorage.getItem('iraq_admin_token') || '';
      } catch {}
      const resp = await safeApiFetch('/api/admin/claims', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = resp.data || (typeof resp.json === 'function' ? await resp.json() : null);
      if (resp.ok && Array.isArray(data?.claims)) {
        setClaimsList(data.claims);
      }
    } catch {
      // Ignore network errors, fall back to directory items
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClaimsFromBackend();
  }, []);

  const handleRevokeClaim = (store: DirectoryItem) => {
    unclaimStore(store.id);
    setRevokingStoreId(null);
    setActionNotice(`تم إلغاء توثيق متجر "${store.name}" بنجاح وإعادته كمتجر غير مطالب به.`);
    setTimeout(() => setActionNotice(''), 4000);
  };

  return (
    <div className="space-y-4 text-right">
      <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/50 to-slate-900 p-4 flex items-center justify-between">
        <div>
          <h4 className="font-display text-sm sm:text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-amber-400" />
            <span>سجل توثيق ملكية المتاجر وأصحابها</span>
          </h4>
          <p className="text-xs text-slate-300 mt-0.5">
            متابعة المتاجر التي قام أصحابها بتأكيد وتوثيق أرقام الهواتف عبر رمز التحقق (OTP)
          </p>
        </div>
        <button
          type="button"
          onClick={fetchClaimsFromBackend}
          disabled={isLoading}
          className="rounded-xl bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs text-white border border-slate-700 flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>تحديث</span>
        </button>
      </div>

      {actionNotice && (
        <div className="rounded-xl bg-amber-950/60 border border-amber-500/40 p-3 text-xs font-bold text-amber-200 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-amber-400" />
          <span>{actionNotice}</span>
        </div>
      )}

      {claimedStores.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-8 text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 text-slate-400">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h5 className="font-display text-sm font-bold text-white">لا توجد متاجر موثقة حتى الآن</h5>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            عندما يقوم صاحب متجر بالضغط على "المطالبة بملكية المتجر" وتأكيد رقم هاتفه، سيظهر سجله وتوثيقه هنا مباشرة.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {claimedStores.map((store) => (
            <div
              key={store.id}
              className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <img
                  src={store.imageUrl}
                  alt={store.name}
                  referrerPolicy="no-referrer"
                  className="h-12 w-12 rounded-xl object-cover flex-shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h5 className="font-display text-sm font-bold text-white">{store.name}</h5>
                    <span className="rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold px-1.5 py-0.2 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      موثق رسمياً
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
                    <span className="flex items-center gap-1 text-slate-300">
                      <User className="h-3 w-3 text-amber-400" />
                      <span>المالك: {store.claimedByName || 'صاحب المتجر'}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-mono text-emerald-400">
                      <Phone className="h-3 w-3" />
                      <span>{store.claimedByPhone || store.phone}</span>
                    </span>
                    {store.claimedAt && (
                      <>
                        <span>•</span>
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" />
                          <span>{new Date(store.claimedAt).toLocaleDateString('ar-IQ')}</span>
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 justify-end">
                {revokingStoreId === store.id ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleRevokeClaim(store)}
                      className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer"
                    >
                      تأكيد إلغاء التوثيق
                    </button>
                    <button
                      type="button"
                      onClick={() => setRevokingStoreId(null)}
                      className="rounded-xl bg-slate-800 text-slate-300 hover:text-white px-2 py-1.5 text-xs font-bold transition-colors cursor-pointer"
                    >
                      تراجع
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setRevokingStoreId(store.id)}
                    className="rounded-xl bg-rose-950/50 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer"
                  >
                    إلغاء التوثيق
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
