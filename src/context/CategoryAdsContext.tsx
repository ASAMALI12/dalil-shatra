import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CategoryAd } from '../types/shatrah';
import { supabase, getIsSupabaseConfigured } from '../lib/supabase';
import { apiFetch } from '../utils/apiClient';

interface CategoryAdsContextType {
  ads: CategoryAd[];
  isLoading: boolean;
  getAdsForCategory: (governorateId: string, districtId: string, categoryId: string) => CategoryAd[];
  getNationalAds: () => CategoryAd[];
  getGovernorateAds: (governorateId: string) => CategoryAd[];
  addCategoryAd: (
    newAd: Omit<CategoryAd, 'id' | 'createdAt' | 'expiresAt' | 'referenceNumber'>
  ) => CategoryAd;
  deleteCategoryAd: (id: string) => void;
  renewCategoryAd: (id: string, additionalDays: number) => void;
  refreshAds: () => Promise<void>;
}

const CategoryAdsContext = createContext<CategoryAdsContextType | undefined>(undefined);

export const CategoryAdsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ads, setAds] = useState<CategoryAd[]>(() => {
    // Only used as temporary offline cache
    try {
      const saved = localStorage.getItem('iraq_category_ads');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch real ads from Supabase or server API
  const refreshAds = useCallback(async () => {
    setIsLoading(true);
    try {
      if (getIsSupabaseConfigured() && supabase) {
        const { data, error } = await supabase
          .from('advertisements')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          const mappedAds: CategoryAd[] = data.map((d: any) => ({
            id: d.id,
            scope: d.placement === 'national' ? 'national' : d.placement === 'governorate' ? 'governorate' : 'store_area',
            governorateId: d.target_governorate_id || 'all',
            governorateName: d.governorate_name || (d.target_governorate_id === 'all' ? 'عموم العراق' : d.target_governorate_id),
            districtId: d.target_district_id || 'all',
            districtName: d.district_name || 'الكل',
            categoryId: d.category_id || 'other',
            categoryName: d.category_name || 'إعلان ترويجي',
            businessName: d.title,
            headline: d.title,
            description: d.description || '',
            imageUrl: d.image_url,
            phone: d.phone || '',
            whatsapp: d.whatsapp || undefined,
            offerBadge: d.badge || undefined,
            durationDays: d.duration_days || 5,
            price: d.price || 0,
            createdAt: d.created_at ? new Date(d.created_at).getTime() : Date.now(),
            expiresAt: d.expires_at ? new Date(d.expires_at).getTime() : Date.now() + 5 * 24 * 3600 * 1000,
            paymentMethod: d.payment_method || 'زين كاش',
            referenceNumber: d.reference_number || `AD-${d.id.slice(0, 6)}`,
          }));

          setAds(mappedAds);
          try {
            localStorage.setItem('iraq_category_ads', JSON.stringify(mappedAds));
          } catch (e) {}
          setIsLoading(false);
          return;
        }
      }

      const res = await apiFetch('/api/advertisements');
      const json = await res.json();
      if (json.success && Array.isArray(json.ads)) {
        const mappedAds: CategoryAd[] = json.ads.map((d: any) => ({
          id: d.id,
          scope: d.placement === 'national' ? 'national' : d.placement === 'governorate' ? 'governorate' : 'store_area',
          governorateId: d.target_governorate_id || 'all',
          governorateName: d.governorate_name || (d.target_governorate_id === 'all' ? 'عموم العراق' : d.target_governorate_id),
          districtId: d.target_district_id || 'all',
          districtName: d.district_name || 'الكل',
          categoryId: d.category_id || 'other',
          categoryName: d.category_name || 'إعلان ترويجي',
          businessName: d.title,
          headline: d.title,
          description: d.description || '',
          imageUrl: d.image_url,
          phone: d.phone || '',
          whatsapp: d.whatsapp || undefined,
          offerBadge: d.badge || undefined,
          durationDays: d.duration_days || 5,
          price: d.price || 0,
          createdAt: d.created_at ? new Date(d.created_at).getTime() : Date.now(),
          expiresAt: d.expires_at ? new Date(d.expires_at).getTime() : Date.now() + 5 * 24 * 3600 * 1000,
          paymentMethod: d.payment_method || 'زين كاش',
          referenceNumber: d.reference_number || `AD-${d.id.slice(0, 6)}`,
        }));
        setAds(mappedAds);
        try {
          localStorage.setItem('iraq_category_ads', JSON.stringify(mappedAds));
        } catch (e) {}
      }
    } catch (e) {
      console.warn('Failed to load category ads from server:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAds();
  }, [refreshAds]);

  const getAdsForCategory = (
    governorateId: string,
    districtId: string,
    categoryId: string
  ): CategoryAd[] => {
    const now = Date.now();
    return ads.filter((ad) => {
      if (ad.expiresAt && ad.expiresAt < now) return false;
      if (ad.categoryId !== categoryId && ad.categoryId !== 'all') return false;

      if (governorateId && ad.governorateId && ad.governorateId !== 'all' && ad.governorateId !== governorateId) {
        return false;
      }

      if (districtId && districtId !== 'all') {
        if (ad.districtId && ad.districtId !== 'all' && ad.districtId !== districtId) {
          return false;
        }
      }

      return true;
    });
  };

  const getNationalAds = (): CategoryAd[] => {
    const now = Date.now();
    return ads.filter(
      (ad) =>
        (!ad.expiresAt || ad.expiresAt >= now) &&
        (ad.scope === 'national' || ad.governorateId === 'all')
    );
  };

  const getGovernorateAds = (governorateId: string): CategoryAd[] => {
    const now = Date.now();
    return ads.filter(
      (ad) =>
        (!ad.expiresAt || ad.expiresAt >= now) &&
        (ad.scope === 'governorate' || (!ad.scope && ad.districtId === 'all')) &&
        (ad.governorateId === governorateId || ad.governorateId === 'all')
    );
  };

  const renewCategoryAd = (id: string, additionalDays: number) => {
    setAds((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        const currentExpiry = a.expiresAt > Date.now() ? a.expiresAt : Date.now();
        return {
          ...a,
          expiresAt: currentExpiry + additionalDays * 24 * 3600 * 1000,
          durationDays: (a.durationDays || 0) + additionalDays,
        };
      })
    );
  };

  const addCategoryAd = (
    newAdData: Omit<CategoryAd, 'id' | 'createdAt' | 'expiresAt' | 'referenceNumber'>
  ): CategoryAd => {
    const now = Date.now();
    const durationMs = (newAdData.durationDays || 1) * 24 * 3600 * 1000;
    const refNum = `AD-${(newAdData.districtId || 'IQ').slice(0, 4).toUpperCase()}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;

    const createdAd: CategoryAd = {
      ...newAdData,
      id: `cad-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: now,
      expiresAt: now + durationMs,
      referenceNumber: refNum,
    };

    setAds((prev) => [createdAd, ...prev]);

    // Save to Supabase if connected
    if (getIsSupabaseConfigured() && supabase) {
      (async () => {
        try {
          await supabase.from('advertisements').insert({
            id: createdAd.id,
            title: createdAd.headline || createdAd.businessName,
            description: createdAd.description,
            image_url: createdAd.imageUrl,
            placement: createdAd.scope === 'national' ? 'national' : createdAd.scope === 'governorate' ? 'governorate' : 'banner',
            target_governorate_id: createdAd.governorateId,
            target_district_id: createdAd.districtId,
            is_active: true,
            created_at: new Date(now).toISOString(),
          });
        } catch (err) {
          console.warn('Failed to save ad in Supabase:', err);
        }
      })();
    }

    return createdAd;
  };

  const deleteCategoryAd = (id: string) => {
    setAds((prev) => prev.filter((a) => a.id !== id));
    if (getIsSupabaseConfigured() && supabase) {
      (async () => {
        try {
          await supabase.from('advertisements').delete().eq('id', id);
        } catch (err) {
          console.warn('Failed to delete ad in Supabase:', err);
        }
      })();
    }
  };

  return (
    <CategoryAdsContext.Provider
      value={{
        ads,
        isLoading,
        getAdsForCategory,
        getNationalAds,
        getGovernorateAds,
        addCategoryAd,
        deleteCategoryAd,
        renewCategoryAd,
        refreshAds,
      }}
    >
      {children}
    </CategoryAdsContext.Provider>
  );
};

export const useCategoryAds = () => {
  const context = useContext(CategoryAdsContext);
  if (!context) {
    throw new Error('useCategoryAds must be used within a CategoryAdsProvider');
  }
  return context;
};
