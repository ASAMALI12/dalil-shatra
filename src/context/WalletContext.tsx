import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { WalletTransaction, PaymentMethod } from '../types/directory';
import { safeApiFetch } from '../utils/apiClient';

interface ManagerCredentials {
  phone: string;
  username: string;
}

interface WalletContextType {
  balance: number;
  transactions: WalletTransaction[];
  isManagerUnlocked: boolean;
  isVerifyingAuth: boolean;
  managerCredentials: ManagerCredentials;
  totalEarnings: number;
  totalWithdrawn: number;
  deposit: (amount: number, method: PaymentMethod, details?: any) => string;
  withdraw: (
    amount: number,
    method: 'zaincash' | 'mastercard',
    details: {
      accountName: string;
      phoneNumber?: string;
      cardNumber?: string;
      bankName?: string;
    }
  ) => { success: boolean; message?: string; referenceNumber?: string };
  payWithWallet: (
    amount: number,
    title: string,
    description: string
  ) => { success: boolean; message?: string; referenceNumber?: string };
  loginManager: (
    phone: string,
    username: string,
    password?: string
  ) => { success: boolean; message?: string };
  lockManager: () => Promise<void>;
  verifyAdminSession: () => Promise<boolean>;
  refreshAdminSession: () => Promise<boolean>;
  changeManagerPassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  updateManagerCredentials: (
    currentPassword?: string,
    newPhone?: string,
    newUsername?: string,
    newPassword?: string
  ) => { success: boolean; message?: string };
  // Legacy stubs kept for backwards compatibility without simulated state mutations
  setCustomBalance: (newBalance: number) => void;
  resetBalance: () => void;
  addManualAdjustment: (amount: number, reason: string) => void;
  deleteTransaction: (id: string) => void;
  clearTransactions: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // No fake simulated balance or demo transactions
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [isManagerUnlocked, setIsManagerUnlocked] = useState<boolean>(false);
  const [isVerifyingAuth, setIsVerifyingAuth] = useState<boolean>(true);

  // Dynamic manager credentials - populated ONLY after server-side authentication
  const [managerCredentials, setManagerCredentials] = useState<ManagerCredentials>({
    phone: '',
    username: '',
  });

  // Verify Admin Session via Supabase Edge Function / Backend
  const verifyAdminSession = useCallback(async (): Promise<boolean> => {
    setIsVerifyingAuth(true);
    try {
      const token = sessionStorage.getItem('iraq_admin_token');
      if (!token) {
        setIsManagerUnlocked(false);
        setIsVerifyingAuth(false);
        return false;
      }

      const res = await safeApiFetch('/api/admin/status', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok && res.data && res.data.loggedIn) {
        setIsManagerUnlocked(true);
        if (res.data.username || res.data.phone) {
          setManagerCredentials({
            phone: res.data.phone || '',
            username: res.data.username || '',
          });
        }
        setIsVerifyingAuth(false);
        return true;
      } else {
        // Token invalid or expired on server
        sessionStorage.removeItem('iraq_admin_token');
        setIsManagerUnlocked(false);
        setIsVerifyingAuth(false);
        return false;
      }
    } catch {
      setIsVerifyingAuth(false);
      return false;
    }
  }, []);

  // On mount: check server status
  useEffect(() => {
    verifyAdminSession();
  }, [verifyAdminSession]);

  // Refresh Admin Session Token via Backend
  const refreshAdminSession = useCallback(async (): Promise<boolean> => {
    try {
      const token = sessionStorage.getItem('iraq_admin_token');
      if (!token) return false;

      const res = await safeApiFetch('/api/admin/refresh', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok && res.data && res.data.token) {
        sessionStorage.setItem('iraq_admin_token', res.data.token);
        setIsManagerUnlocked(true);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  // Change Password via Server Endpoint
  const changeManagerPassword = async (
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const token = sessionStorage.getItem('iraq_admin_token');
      if (!token) {
        return { success: false, message: 'يجب تسجيل الدخول كمدير أولاً لتغيير كلمة المرور.' };
      }

      const res = await safeApiFetch('/api/admin/change-password', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (res.ok && res.data && res.data.success) {
        return { success: true, message: 'تم تغيير كلمة المرور بنجاح في خادم الإدارة.' };
      }
      return {
        success: false,
        message: res.data?.error || 'فشل تغيير كلمة المرور. تأكد من صحة كلمة المرور الحالية.',
      };
    } catch {
      return { success: false, message: 'تعذر الاتصال بالخادم لتغيير كلمة المرور.' };
    }
  };

  const loginManager = (
    phone: string,
    username: string,
    _password?: string
  ): { success: boolean; message?: string } => {
    setIsManagerUnlocked(true);
    setManagerCredentials({
      phone: phone.trim(),
      username: username.trim(),
    });
    return { success: true, message: 'تم التحقق وتأكيد جلسة المدير بنجاح!' };
  };

  const lockManager = async () => {
    try {
      const token = sessionStorage.getItem('iraq_admin_token');
      if (token) {
        await safeApiFetch('/api/admin/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch {
      // Handled silently
    } finally {
      setIsManagerUnlocked(false);
      sessionStorage.removeItem('iraq_admin_token');
      setManagerCredentials({ phone: '', username: '' });
    }
  };

  const updateManagerCredentials = (
    _currentPassword?: string,
    newPhone?: string,
    newUsername?: string,
    _newPassword?: string
  ): { success: boolean; message?: string } => {
    const updated = {
      phone: (newPhone || managerCredentials.phone).trim(),
      username: (newUsername || managerCredentials.username).trim(),
    };
    setManagerCredentials(updated);
    return { success: true, message: 'تم تحديث بيانات العرض بنجاح.' };
  };

  // Fake Internal Wallet Operations are strictly deprecated
  const deposit = (_amount: number, _method: PaymentMethod, _details?: any): string => {
    console.info('Internal fake wallet deposit is decommissioned. External payment gateway will handle real transactions.');
    return 'EXT-GATEWAY-PENDING';
  };

  const withdraw = (
    _amount: number,
    _method: 'zaincash' | 'mastercard',
    _details: any
  ): { success: boolean; message?: string; referenceNumber?: string } => {
    return {
      success: false,
      message: 'تم إيقاف نظام السحب الداخلي الوهمي. ستتم إدارة العمليات المالية مباشرة عبر بوابات الدفع الرسمية.',
    };
  };

  const payWithWallet = (
    _amount: number,
    _title: string,
    _description: string
  ): { success: boolean; message?: string; referenceNumber?: string } => {
    return {
      success: false,
      message: 'تم إيقاف الدفع بالمحفظة الوهمية. يتم الدفع مباشرة عبر تحويل زين كاش أو البوابة الإلكترونية.',
    };
  };

  const setCustomBalance = (_newBalance: number) => {
    // No-op
  };

  const resetBalance = () => {
    setBalance(0);
    setTransactions([]);
  };

  const addManualAdjustment = (_amount: number, _reason: string) => {
    // No-op
  };

  const deleteTransaction = (_id: string) => {
    // No-op
  };

  const clearTransactions = () => {
    setTransactions([]);
  };

  return (
    <WalletContext.Provider
      value={{
        balance,
        transactions,
        isManagerUnlocked,
        isVerifyingAuth,
        managerCredentials,
        totalEarnings: 0,
        totalWithdrawn: 0,
        deposit,
        withdraw,
        payWithWallet,
        loginManager,
        lockManager,
        verifyAdminSession,
        refreshAdminSession,
        changeManagerPassword,
        updateManagerCredentials,
        setCustomBalance,
        resetBalance,
        addManualAdjustment,
        deleteTransaction,
        clearTransactions,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
