import React, { createContext, useContext, useState, useEffect } from 'react';
import { DirectoryItem, Category, StoreReport } from '../types/shatrah';
import { DIRECTORY_ITEMS_DATA, CATEGORIES_DATA } from '../data/shatrahData';

interface DirectoryContextType {
  items: DirectoryItem[];
  categories: Category[];
  claimedStoreIds: string[];
  reports: StoreReport[];
  deleteStore: (id: string) => boolean;
  addStore: (item: DirectoryItem) => void;
  updateStore: (id: string, updated: Partial<DirectoryItem>) => void;
  claimStore: (storeId: string, ownerName: string, phone: string) => { success: boolean; message: string };
  isUserStoreOwner: (storeId: string) => boolean;
  addReport: (report: Omit<StoreReport, 'id' | 'createdAt' | 'timestamp' | 'status'>) => StoreReport;
  resolveReport: (reportId: string) => void;
  deleteReport: (reportId: string) => void;
  resetToDefault: () => void;
  getItemCountByCategory: (categoryId: string) => number;
}

const DirectoryContext = createContext<DirectoryContextType | undefined>(undefined);

export const DirectoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Helper to filter out any items that do not have a valid phone number
  const sanitizeItems = (rawItems: DirectoryItem[]): DirectoryItem[] => {
    return rawItems.filter(
      (item) => item && typeof item.phone === 'string' && item.phone.trim() !== ''
    );
  };

  const [items, setItems] = useState<DirectoryItem[]>(() => {
    const saved = localStorage.getItem('shatrah_directory_items');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return sanitizeItems(parsed);
      } catch (e) {
        return sanitizeItems(DIRECTORY_ITEMS_DATA);
      }
    }
    return sanitizeItems(DIRECTORY_ITEMS_DATA);
  });

  const [claimedStoreIds, setClaimedStoreIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('shatrah_my_claimed_stores');
    return saved ? JSON.parse(saved) : [];
  });

  const [reports, setReports] = useState<StoreReport[]>(() => {
    const saved = localStorage.getItem('shatrah_store_reports');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [
      {
        id: 'rep-init-1',
        storeId: 'item-2',
        storeName: 'أزياء السلطانة',
        storePhone: '07802223344',
        reason: 'تحديث أوقات العمل في العطل',
        details: 'يرجى تحديث وقت الإغلاق يوم الجمعة حيث يفتح المحل بعد صلاة الظهر مباشرة.',
        reporterName: 'زبون من الشطرة',
        reporterPhone: '07801122334',
        createdAt: 'اليوم، 11:30 ص',
        timestamp: Date.now() - 3600000 * 2,
        status: 'pending',
      },
    ];
  });

  // Sync items to LocalStorage
  useEffect(() => {
    const sanitized = sanitizeItems(items);
    localStorage.setItem('shatrah_directory_items', JSON.stringify(sanitized));
  }, [items]);

  // Sync claimed store IDs
  useEffect(() => {
    localStorage.setItem('shatrah_my_claimed_stores', JSON.stringify(claimedStoreIds));
  }, [claimedStoreIds]);

  // Sync reports
  useEffect(() => {
    localStorage.setItem('shatrah_store_reports', JSON.stringify(reports));
  }, [reports]);

  const deleteStore = (id: string): boolean => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    setClaimedStoreIds((prev) => prev.filter((sId) => sId !== id));
    return true;
  };

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

  const addStore = (item: DirectoryItem) => {
    if (!item.phone || item.phone.trim() === '') {
      console.warn('Cannot add store without phone number');
      return;
    }
    setItems((prev) => [item, ...prev]);
    // Newly registered store is automatically owned by creator
    setClaimedStoreIds((prev) => [...new Set([item.id, ...prev])]);
  };

  const updateStore = (id: string, updated: Partial<DirectoryItem>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updated } : item))
    );
  };

  const claimStore = (storeId: string, ownerName: string, phone: string): { success: boolean; message: string } => {
    const store = items.find((i) => i.id === storeId);
    if (!store) {
      return { success: false, message: 'المتجر غير موجود' };
    }

    // Clean phone comparisons
    const cleanStorePhone = store.phone.replace(/[^0-9]/g, '');
    const cleanInputPhone = phone.replace(/[^0-9]/g, '');

    // Allow match if ends with same digits or exact
    const isPhoneMatch =
      cleanStorePhone.endsWith(cleanInputPhone.slice(-8)) ||
      cleanInputPhone.endsWith(cleanStorePhone.slice(-8)) ||
      cleanStorePhone === cleanInputPhone;

    if (!isPhoneMatch) {
      return {
        success: false,
        message: `رقم الهاتف المدخل لا يطابق رقم هاتف المتجر المسجل (${store.phone})!`,
      };
    }

    const updatedStore: Partial<DirectoryItem> = {
      isClaimed: true,
      claimedByName: ownerName.trim(),
      claimedByPhone: phone.trim(),
      claimedAt: new Date().toISOString(),
    };

    updateStore(storeId, updatedStore);
    setClaimedStoreIds((prev) => [...new Set([storeId, ...prev])]);

    return {
      success: true,
      message: `تم توثيق ملكية المتجر بنجاح لصاحبه ${ownerName}!`,
    };
  };

  const isUserStoreOwner = (storeId: string): boolean => {
    return claimedStoreIds.includes(storeId);
  };

  const resetToDefault = () => {
    const sanitized = sanitizeItems(DIRECTORY_ITEMS_DATA);
    setItems(sanitized);
    localStorage.setItem('shatrah_directory_items', JSON.stringify(sanitized));
  };

  const getItemCountByCategory = (categoryId: string): number => {
    if (categoryId === 'other') return items.filter((i) => i.category === 'other' || !i.category).length;
    return items.filter((i) => i.category === categoryId).length;
  };

  return (
    <DirectoryContext.Provider
      value={{
        items,
        categories: CATEGORIES_DATA,
        claimedStoreIds,
        reports,
        deleteStore,
        addStore,
        updateStore,
        claimStore,
        isUserStoreOwner,
        addReport,
        resolveReport,
        deleteReport,
        resetToDefault,
        getItemCountByCategory,
      }}
    >
      {children}
    </DirectoryContext.Provider>
  );
};

export const useDirectory = () => {
  const context = useContext(DirectoryContext);
  if (!context) {
    throw new Error('useDirectory must be used within a DirectoryProvider');
  }
  return context;
};
