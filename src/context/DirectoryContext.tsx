import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { DirectoryItem, Category, StoreReport } from '../types/shatrah';
import { CATEGORIES_DATA } from '../data/categoriesData';
import { DIRECTORY_ITEMS_DATA } from '../data/shatrahData';
import { ALL_IRAQ_STORES } from '../data/allIraqStoresData';
import { supabase, ensureSupabaseClient, getIsSupabaseConfigured } from '../lib/supabase';
import {
  fetchAllStoresFromSupabase,
  addStoreToSupabase,
  updateStoreInSupabase,
  deleteStoreFromSupabase,
  seedStoresToSupabase,
} from '../services/supabaseStores';
import { validateIraqPhone, normalizeIraqPhone } from '../utils/iraqPhoneValidator';

interface DirectoryContextType {
  items: DirectoryItem[];
  categories: Category[];
  reports: StoreReport[];
  claimedStoreIds: string[];
  isSupabaseLoading: boolean;
  isUsingSupabase: boolean;
  supabaseStoreCount: number;
  supabaseError: string | null;
  refreshFromSupabase: () => Promise<void>;
  seedToSupabase: () => Promise<{ success: boolean; count: number }>;
  getItemCountByCategory: (categoryId: string) => number;
  addStore: (item: DirectoryItem) => Promise<void> | void;
  updateStore: (id: string, item: Partial<DirectoryItem>) => Promise<void> | void;
  deleteStore: (id: string) => boolean;
  registerStoreOwner: (storeId: string) => void;
  claimStore: (storeId: string, ownerName: string, phone: string) => { success: boolean; message: string };
  unclaimStore: (storeId: string) => void;
  isUserStoreOwner: (storeId: string) => boolean;
  addReport: (report: Omit<StoreReport, 'id' | 'createdAt' | 'timestamp' | 'status'>) => StoreReport;
  resolveReport: (reportId: string) => void;
  deleteReport: (reportId: string) => void;
  resetToDefault: () => void;
  importStores: (newItems: DirectoryItem[]) => { importedCount: number; skippedNoPhoneCount: number };
}

const DirectoryContext = createContext<DirectoryContextType | undefined>(undefined);

const CACHE_KEY = 'iraq_supabase_cache';

export const DirectoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Sanitize helper ensuring all valid stores are kept and have valid telephone contact
  const sanitizeItems = (rawItems: DirectoryItem[]): DirectoryItem[] => {
    return rawItems.filter(
      (item) =>
        item &&
        typeof item.name === 'string' &&
        item.name.trim().length > 0 &&
        Boolean(item.phone && item.phone.trim().length >= 6)
    );
  };

  const [isSupabaseLoading, setIsSupabaseLoading] = useState<boolean>(true);
  const [isUsingSupabase, setIsUsingSupabase] = useState<boolean>(false);
  const [supabaseStoreCount, setSupabaseStoreCount] = useState<number>(0);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);

  // Initial stores from offline cache snapshot merged with built-in dataset (116+ stores across Iraq)
  const [items, setItems] = useState<DirectoryItem[]>(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY) || localStorage.getItem('iraq_supabase_stores');
      if (cached) {
        const parsed: DirectoryItem[] = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const storeMap = new Map<string, DirectoryItem>();
          DIRECTORY_ITEMS_DATA.forEach((s) => storeMap.set(s.id, s));
          parsed.forEach((s) => storeMap.set(s.id, s));
          return sanitizeItems(Array.from(storeMap.values()));
        }
      }
    } catch (e) {
      // ignore
    }
    return sanitizeItems(DIRECTORY_ITEMS_DATA);
  });

  const [claimedStoreIds, setClaimedStoreIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('iraq_my_claimed_stores') || localStorage.getItem('shatrah_my_claimed_stores');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [reports, setReports] = useState<StoreReport[]>(() => {
    try {
      const saved = localStorage.getItem('iraq_store_reports') || localStorage.getItem('shatrah_store_reports');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Seeds current local stores into Supabase
  const seedToSupabase = useCallback(async (): Promise<{ success: boolean; count: number }> => {
    try {
      const storesToSeed = items.length > 0 ? items : DIRECTORY_ITEMS_DATA;
      const res = await seedStoresToSupabase(storesToSeed);
      if (res.success) {
        await refreshFromSupabase();
      }
      return res;
    } catch (err: any) {
      return { success: false, count: 0 };
    }
  }, [items]);

  // Primary fetch from Supabase public.stores table
  const refreshFromSupabase = useCallback(async () => {
    setIsSupabaseLoading(true);
    setSupabaseError(null);

    try {
      await ensureSupabaseClient();
      const result = await fetchAllStoresFromSupabase();

      if (result.fromSupabase && Array.isArray(result.data) && result.data.length > 0) {
        const storeMap = new Map<string, DirectoryItem>();
        // First populate built-in stores across all Iraq governorates
        DIRECTORY_ITEMS_DATA.forEach((s) => storeMap.set(s.id, s));
        // Then overlay or add Supabase stores
        result.data.forEach((s) => storeMap.set(s.id, s));
        const merged = sanitizeItems(Array.from(storeMap.values()));

        console.log(`✅ Loaded ${result.data.length} stores from Supabase. Total active stores: ${merged.length}.`);
        setItems(merged);
        setIsUsingSupabase(true);
        setSupabaseStoreCount(result.data.length);
        setSupabaseError(null);

        // Update local offline cache snapshot as backup
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(merged));
        } catch (e) {}
      } else {
        const errMsg = result.error
          ? (typeof result.error === 'string' ? result.error : (result.error?.message || 'تعذر الاتصال بـ Supabase'))
          : 'تعذر الاتصال بقاعدة بيانات Supabase (جاري استخدام الدليل المحلي الشامل)';
        console.warn('⚠️ Supabase connection warning (using local fallback with 116+ stores):', errMsg);
        setSupabaseError(errMsg);
        setIsUsingSupabase(false);
        setItems((prev) => (prev && prev.length > 0 ? prev : sanitizeItems(DIRECTORY_ITEMS_DATA)));
      }
    } catch (err: any) {
      const errMsg = err?.message || 'خطأ أثناء الاتصال بقاعدة بيانات Supabase';
      console.warn('⚠️ Supabase error exception (using built-in directory fallback):', errMsg);
      setSupabaseError(errMsg);
      setIsUsingSupabase(false);
      setItems((prev) => (prev && prev.length > 0 ? prev : sanitizeItems(DIRECTORY_ITEMS_DATA)));
    } finally {
      setIsSupabaseLoading(false);
    }
  }, []);

  // Run on mount + setup real-time listener
  useEffect(() => {
    refreshFromSupabase();

    let channel: any = null;
    ensureSupabaseClient().then(() => {
      if (getIsSupabaseConfigured()) {
        channel = supabase
          .channel('realtime:public:stores')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'stores' },
            (payload) => {
              console.log('🔄 Real-time store update from Supabase:', payload.eventType);
              refreshFromSupabase();
            }
          )
          .subscribe();
      }
    });

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [refreshFromSupabase]);

  // Sync claimed stores locally
  useEffect(() => {
    localStorage.setItem('iraq_my_claimed_stores', JSON.stringify(claimedStoreIds));
  }, [claimedStoreIds]);

  // Sync reports locally
  useEffect(() => {
    localStorage.setItem('iraq_store_reports', JSON.stringify(reports));
  }, [reports]);

  // CRUD: Add Store
  const addStore = async (item: DirectoryItem) => {
    if (!item.name || item.name.trim() === '') {
      console.warn('Cannot add store without name');
      return;
    }

    const phoneValidation = validateIraqPhone(item.phone);
    if (!phoneValidation.isValid) {
      console.warn('Cannot add store with invalid phone number:', phoneValidation.reason);
      return;
    }

    const storeToAdd: DirectoryItem = {
      ...item,
      phone: phoneValidation.formattedDisplay || phoneValidation.normalized,
      whatsapp: item.whatsapp ? normalizeIraqPhone(item.whatsapp) : phoneValidation.normalized,
      phoneReliability: item.phoneReliability || 'unverified',
      claimStatus: item.claimStatus || 'unclaimed',
      source: item.source || 'manual_registration',
    };

    // 1. Optimistic UI update
    setItems((prev) => {
      const updated = [storeToAdd, ...prev.filter((i) => i.id !== storeToAdd.id)];
      localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
      return updated;
    });

    setClaimedStoreIds((prev) => [...new Set([storeToAdd.id, ...prev])]);

    // 2. Direct Supabase insertion
    if (getIsSupabaseConfigured()) {
      try {
        await addStoreToSupabase(storeToAdd);
      } catch (err) {
        console.warn('Supabase store insertion error:', err);
      }
    }
  };

  // CRUD: Update Store
  const updateStore = async (id: string, updated: Partial<DirectoryItem>) => {
    let updatedItem: DirectoryItem | undefined;

    // 1. Optimistic UI update
    setItems((prev) => {
      const newList = prev.map((item) => {
        if (item.id === id) {
          updatedItem = { ...item, ...updated };
          return updatedItem;
        }
        return item;
      });
      localStorage.setItem(CACHE_KEY, JSON.stringify(newList));
      return newList;
    });

    // 2. Direct Supabase update
    if (getIsSupabaseConfigured() && updatedItem) {
      try {
        await updateStoreInSupabase(id, updated);
      } catch (err) {
        console.warn('Supabase store update error:', err);
      }
    }
  };

  // CRUD: Delete Store
  const deleteStore = (id: string): boolean => {
    // 1. Optimistic UI update
    setItems((prev) => {
      const filtered = prev.filter((item) => item.id !== id);
      localStorage.setItem(CACHE_KEY, JSON.stringify(filtered));
      return filtered;
    });

    setClaimedStoreIds((prev) => prev.filter((sId) => sId !== id));

    // 2. Direct Supabase deletion
    if (getIsSupabaseConfigured()) {
      deleteStoreFromSupabase(id).catch((err) => console.warn('Supabase delete error:', err));
    }
    return true;
  };

  // Register device ownership of a store ONLY after server-side OTP verification succeeds
  const registerStoreOwner = (storeId: string) => {
    setClaimedStoreIds((prev) => [...new Set([storeId, ...prev])]);
  };

  // Direct claiming from the frontend without OTP verification is strictly blocked.
  // Store verification requires the complete WhatsApp OTP flow via /api/claim/request-otp & /api/claim/verify-otp.
  const claimStore = (_storeId: string, _ownerName: string, _phone: string): { success: boolean; message: string } => {
    return {
      success: false,
      message: 'تم إلغاء التوثيق المباشر نهائياً. التوثيق يتم حصراً بعد التحقق من رمز OTP عبر خادم التطبيق (/api/claim/verify-otp).',
    };
  };

  const unclaimStore = (storeId: string) => {
    setClaimedStoreIds((prev) => prev.filter((id) => id !== storeId));
    updateStore(storeId, {
      isClaimed: false,
      claimStatus: 'unclaimed',
      phoneReliability: 'unverified',
      claimedByName: undefined,
      claimedByPhone: undefined,
      claimedAt: undefined,
    });
  };

  const isUserStoreOwner = (storeId: string): boolean => {
    return claimedStoreIds.includes(storeId);
  };

  // Reports
  const addReport = (reportData: Omit<StoreReport, 'id' | 'createdAt' | 'timestamp' | 'status'>): StoreReport => {
    const newReport: StoreReport = {
      ...reportData,
      id: `rep-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      status: 'pending',
    };
    setReports((prev) => [newReport, ...prev]);
    return newReport;
  };

  const resolveReport = (reportId: string) => {
    setReports((prev) =>
      prev.map((rep) => (rep.id === reportId ? { ...rep, status: 'resolved' as const } : rep))
    );
  };

  const deleteReport = (reportId: string) => {
    setReports((prev) => prev.filter((rep) => rep.id !== reportId));
  };

  // Reset to default re-syncs from DIRECTORY_ITEMS_DATA and Supabase
  const resetToDefault = () => {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem('iraq_supabase_stores');
    setItems(sanitizeItems(DIRECTORY_ITEMS_DATA));
    refreshFromSupabase();
  };

  const importStores = (newItems: DirectoryItem[]): { importedCount: number; skippedNoPhoneCount: number } => {
    let importedCount = 0;
    let skippedNoPhoneCount = 0;
    const validNewItems: DirectoryItem[] = [];

    newItems.forEach((item) => {
      if (item && typeof item.name === 'string' && item.name.trim().length > 0) {
        const phoneValidation = validateIraqPhone(item.phone);
        if (phoneValidation.isValid) {
          const cleanItem: DirectoryItem = {
            ...item,
            phone: phoneValidation.formattedDisplay || phoneValidation.normalized,
            whatsapp: item.whatsapp ? normalizeIraqPhone(item.whatsapp) : phoneValidation.normalized,
            source: item.source || 'multi_source_import',
            importedAt: item.importedAt || new Date().toISOString(),
          };
          validNewItems.push(cleanItem);
          importedCount++;
          if (getIsSupabaseConfigured()) {
            addStoreToSupabase(cleanItem).catch(() => {});
          }
        } else {
          skippedNoPhoneCount++;
        }
      }
    });

    setItems((prev) => {
      const existingIds = new Set(prev.map((i) => i.id));
      const combined = [...prev];
      validNewItems.forEach((item) => {
        if (!existingIds.has(item.id)) {
          combined.unshift(item);
        }
      });
      localStorage.setItem(CACHE_KEY, JSON.stringify(combined));
      return combined;
    });

    return { importedCount, skippedNoPhoneCount };
  };

  const getItemCountByCategory = (categoryId: string): number => {
    if (categoryId === 'all') return items.length;
    return items.filter((item) => {
      const itemCat = (item.category || '').toLowerCase();
      if (itemCat === categoryId.toLowerCase()) return true;
      if (item.tags?.some((t) => t.toLowerCase() === categoryId.toLowerCase())) return true;
      return false;
    }).length;
  };

  // Dynamically calculate category store counts based on live Supabase stores
  const categories = useMemo(() => {
    return CATEGORIES_DATA.map((cat) => {
      const count = items.filter((item) => {
        const itemCat = (item.category || '').toLowerCase();
        if (itemCat === cat.id) return true;
        if (cat.id === 'doctors' && (itemCat.includes('طبيب') || itemCat.includes('صحة') || itemCat.includes('عياد'))) return true;
        if (cat.id === 'clothing' && (itemCat.includes('ملابس') || itemCat.includes('أزياء') || itemCat.includes('ازياء'))) return true;
        if (cat.id === 'restaurants' && (itemCat.includes('مطعم') || itemCat.includes('كافيه') || itemCat.includes('اكل'))) return true;
        if (cat.id === 'pharmacies' && (itemCat.includes('صيدل') || itemCat.includes('دواء'))) return true;
        if (cat.id === 'electronics' && (itemCat.includes('إلكترون') || itemCat.includes('موبايل') || itemCat.includes('هواتف'))) return true;
        if (cat.id === 'services' && (itemCat.includes('خدم') || itemCat.includes('صيان'))) return true;
        return false;
      }).length;
      return {
        ...cat,
        countNumber: count,
        countText: `${count} متجر`,
      };
    });
  }, [items]);

  return (
    <DirectoryContext.Provider
      value={{
        items,
        categories,
        reports,
        claimedStoreIds,
        isSupabaseLoading,
        isUsingSupabase,
        supabaseStoreCount,
        supabaseError,
        refreshFromSupabase,
        seedToSupabase,
        getItemCountByCategory,
        addStore,
        updateStore,
        deleteStore,
        registerStoreOwner,
        claimStore,
        unclaimStore,
        isUserStoreOwner,
        addReport,
        resolveReport,
        deleteReport,
        resetToDefault,
        importStores,
      }}
    >
      {children}
    </DirectoryContext.Provider>
  );
};

export const useDirectory = (): DirectoryContextType => {
  const context = useContext(DirectoryContext);
  if (!context) {
    throw new Error('useDirectory must be used within a DirectoryProvider');
  }
  return context;
};
