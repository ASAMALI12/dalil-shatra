import React, { createContext, useContext, useState, useEffect } from 'react';
import { WalletTransaction, PaymentMethod } from '../types/directory';
import { fetchWalletFromSupabase, addTransactionToSupabase } from '../services/supabaseWallet';

interface ManagerCredentials {
  phone: string;
  username: string;
  password: string;
}

interface WalletContextType {
  balance: number;
  transactions: WalletTransaction[];
  isManagerUnlocked: boolean;
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
    password: string
  ) => { success: boolean; message?: string };
  lockManager: () => void;
  updateManagerCredentials: (
    currentPassword: string,
    newPhone: string,
    newUsername: string,
    newPassword: string
  ) => { success: boolean; message?: string };
  // Full Manager Wallet Controls
  setCustomBalance: (newBalance: number) => void;
  resetBalance: () => void;
  addManualAdjustment: (amount: number, reason: string) => void;
  deleteTransaction: (id: string) => void;
  clearTransactions: () => void;
}

const INITIAL_TRANSACTIONS: WalletTransaction[] = [];

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [balance, setBalance] = useState<number>(() => {
    const saved = localStorage.getItem('iraq_wallet_balance');
    return saved !== null ? Number(saved) : 0;
  });

  const [transactions, setTransactions] = useState<WalletTransaction[]>(() => {
    const saved = localStorage.getItem('iraq_wallet_transactions');
    return saved !== null ? JSON.parse(saved) : [];
  });

  const [managerCredentials, setManagerCredentials] = useState<ManagerCredentials>(() => {
    const saved = localStorage.getItem('iraq_manager_credentials');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return {
      phone: '07801234567',
      username: 'admin',
      password: 'IraqDirectory2026!Secure',
    };
  });

  const [isManagerUnlocked, setIsManagerUnlocked] = useState<boolean>(() => {
    const token = sessionStorage.getItem('iraq_admin_token');
    const unlocked = sessionStorage.getItem('iraq_manager_unlocked') || sessionStorage.getItem('shatrah_manager_unlocked');
    return Boolean(token || unlocked === 'true');
  });

  // Load wallet from Supabase on mount (Supabase as Source of Truth)
  useEffect(() => {
    let isMounted = true;
    fetchWalletFromSupabase().then((res) => {
      if (isMounted && res) {
        if (typeof res.balance === 'number') {
          setBalance(res.balance);
        }
        if (Array.isArray(res.transactions) && res.transactions.length > 0) {
          setTransactions(res.transactions);
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync to Storage as local offline backup
  useEffect(() => {
    localStorage.setItem('iraq_wallet_balance', balance.toString());
  }, [balance]);

  useEffect(() => {
    localStorage.setItem('iraq_wallet_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('iraq_manager_credentials', JSON.stringify(managerCredentials));
  }, [managerCredentials]);

  useEffect(() => {
    sessionStorage.setItem('iraq_manager_unlocked', isManagerUnlocked.toString());
  }, [isManagerUnlocked]);

  // Derived statistics
  const totalEarnings = transactions
    .filter((t) => t.type === 'earning' || t.type === 'deposit')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalWithdrawn = transactions
    .filter((t) => t.type === 'withdrawal')
    .reduce((sum, t) => sum + t.amount, 0);

  const loginManager = (
    phone: string,
    username: string,
    password: string
  ): { success: boolean; message?: string } => {
    const cleanPhone = phone.trim().replace(/\s+/g, '');
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    const expectedPhone = managerCredentials.phone.trim().replace(/\s+/g, '');
    const expectedUser = managerCredentials.username.trim().toLowerCase();
    const expectedPass = managerCredentials.password.trim();

    // Check matching credentials
    if (cleanPhone === expectedPhone && cleanUser === expectedUser && cleanPass === expectedPass) {
      setIsManagerUnlocked(true);
      sessionStorage.setItem('iraq_manager_unlocked', 'true');
      return { success: true, message: 'تم تسجيل دخول المدير بنجاح!' };
    }

    // Helpful error feedback
    if (cleanPhone !== expectedPhone) {
      return { success: false, message: 'رقم هاتف المدير غير صحيح!' };
    }
    if (cleanUser !== expectedUser) {
      return { success: false, message: 'اسم المستخدم (اليوزر) غير صحيح!' };
    }
    return { success: false, message: 'كلمة المرور (الباسوورد) غير صحيحة!' };
  };

  const lockManager = () => {
    setIsManagerUnlocked(false);
    sessionStorage.removeItem('iraq_admin_token');
    sessionStorage.removeItem('iraq_manager_unlocked');
  };

  const updateManagerCredentials = (
    currentPassword: string,
    newPhone: string,
    newUsername: string,
    newPassword: string
  ): { success: boolean; message?: string } => {
    if (currentPassword.trim() !== managerCredentials.password.trim()) {
      return { success: false, message: 'كلمة المرور الحالية غير صحيحة!' };
    }
    if (!newPhone.trim() || !newUsername.trim() || !newPassword.trim()) {
      return { success: false, message: 'يرجى ملء جميع الحقول المطلوبة' };
    }

    const updated = {
      phone: newPhone.trim(),
      username: newUsername.trim(),
      password: newPassword.trim(),
    };
    setManagerCredentials(updated);
    return { success: true, message: 'تم تحديث بيانات دخول المدير بنجاح!' };
  };

  // Full Manager Controls:
  const setCustomBalance = (newBalance: number) => {
    const diff = newBalance - balance;
    const ref = `IRAQ-ADJ-${Math.floor(100000 + Math.random() * 900000)}`;
    const newTx: WalletTransaction = {
      id: `tx-${Date.now()}`,
      type: diff >= 0 ? 'deposit' : 'withdrawal',
      amount: Math.abs(diff),
      title: 'تعديل رصيد يدوي من قبل المدير',
      description: `تم تعيين الرصيد إلى ${newBalance.toLocaleString('ar-IQ')} د.ع (فارق: ${diff >= 0 ? '+' : ''}${diff.toLocaleString('ar-IQ')} د.ع)`,
      date: new Intl.DateTimeFormat('ar-IQ', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date()),
      timestamp: Date.now(),
      status: 'completed',
      paymentMethod: 'wallet',
      referenceNumber: ref,
    };
    setBalance(newBalance);
    setTransactions((prev) => [newTx, ...prev]);

    // Persist to Supabase Source of Truth
    addTransactionToSupabase({
      amount: Math.abs(diff),
      type: diff >= 0 ? 'deposit' : 'withdrawal',
      title: newTx.title,
      description: newTx.description,
      paymentMethod: 'wallet',
      referenceNumber: ref,
    }).catch((e) => console.warn('Supabase balance adjustment sync error:', e));
  };

  const resetBalance = () => {
    const ref = `IRAQ-RST-${Math.floor(100000 + Math.random() * 900000)}`;
    const newTx: WalletTransaction = {
      id: `tx-${Date.now()}`,
      type: 'withdrawal',
      amount: balance,
      title: 'تصفير رصيد المحفظة بواسطة المدير',
      description: `تمت إعادة تعيين الرصيد إلى 0 د.ع`,
      date: new Intl.DateTimeFormat('ar-IQ', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date()),
      timestamp: Date.now(),
      status: 'completed',
      paymentMethod: 'wallet',
      referenceNumber: ref,
    };
    setBalance(0);
    setTransactions((prev) => [newTx, ...prev]);

    // Persist to Supabase Source of Truth
    addTransactionToSupabase({
      amount: balance,
      type: 'withdrawal',
      title: newTx.title,
      description: newTx.description,
      paymentMethod: 'wallet',
      referenceNumber: ref,
    }).catch((e) => console.warn('Supabase reset balance sync error:', e));
  };

  const addManualAdjustment = (amount: number, reason: string) => {
    const ref = `IRAQ-ADJ-${Math.floor(100000 + Math.random() * 900000)}`;
    const newTx: WalletTransaction = {
      id: `tx-${Date.now()}`,
      type: amount >= 0 ? 'deposit' : 'withdrawal',
      amount: Math.abs(amount),
      title: reason || 'تسوية رصيد يدوي للمدير',
      description: `تسوية مالية بقيمة ${amount.toLocaleString('ar-IQ')} د.ع`,
      date: new Intl.DateTimeFormat('ar-IQ', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date()),
      timestamp: Date.now(),
      status: 'completed',
      paymentMethod: 'wallet',
      referenceNumber: ref,
    };
    setBalance((prev) => Math.max(0, prev + amount));
    setTransactions((prev) => [newTx, ...prev]);

    // Persist to Supabase Source of Truth
    addTransactionToSupabase({
      amount: Math.abs(amount),
      type: amount >= 0 ? 'deposit' : 'withdrawal',
      title: newTx.title,
      description: newTx.description,
      paymentMethod: 'wallet',
      referenceNumber: ref,
    }).catch((e) => console.warn('Supabase manual adjustment sync error:', e));
  };

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const clearTransactions = () => {
    setTransactions([]);
  };

  const deposit = (amount: number, method: PaymentMethod, details?: any): string => {
    const ref = `IRAQ-DEP-${Math.floor(100000 + Math.random() * 900000)}`;
    const newTx: WalletTransaction = {
      id: `tx-${Date.now()}`,
      type: 'deposit',
      amount,
      title: 'شحن رصيد المحفظة',
      description: `تم شحن المحفظة بنجاح عبر ${
        method === 'zaincash'
          ? 'زين كاش (ZainCash)'
          : method === 'mastercard'
          ? 'ماستر كارد (MasterCard)'
          : method === 'qicard'
          ? 'كي كارد (Qi Card)'
          : 'الدفع الإلكتروني'
      }`,
      date: new Intl.DateTimeFormat('ar-IQ', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date()),
      timestamp: Date.now(),
      status: 'completed',
      paymentMethod: method,
      referenceNumber: ref,
      recipientDetails: details,
    };

    setBalance((prev) => prev + amount);
    setTransactions((prev) => [newTx, ...prev]);

    // Persist to Supabase Source of Truth
    addTransactionToSupabase({
      amount,
      type: 'deposit',
      title: newTx.title,
      description: newTx.description,
      paymentMethod: method,
      referenceNumber: ref,
    }).catch((e) => console.warn('Supabase deposit sync error:', e));

    return ref;
  };

  const withdraw = (
    amount: number,
    method: 'zaincash' | 'mastercard',
    details: {
      accountName: string;
      phoneNumber?: string;
      cardNumber?: string;
      bankName?: string;
    }
  ): { success: boolean; message?: string; referenceNumber?: string } => {
    if (amount <= 0) {
      return { success: false, message: 'يرجى إدخال مبلغ صحيح للسحب' };
    }
    if (amount > balance) {
      return { success: false, message: 'عذرًا، الرصيد المتوفر في المحفظة غير كافٍ لإتمام السحب' };
    }

    const ref = `IRAQ-WTH-${Math.floor(100000 + Math.random() * 900000)}`;
    const isZain = method === 'zaincash';

    const newTx: WalletTransaction = {
      id: `tx-${Date.now()}`,
      type: 'withdrawal',
      amount,
      title: `سحب أرباح المدير إلى ${isZain ? 'زين كاش' : 'ماستر كارد / الحساب البنكي'}`,
      description: isZain
        ? `تحويل مبلغ ${amount.toLocaleString('ar-IQ')} د.ع إلى محفظة زين كاش (${details.phoneNumber}) باسم: ${details.accountName}`
        : `تحويل مبلغ ${amount.toLocaleString('ar-IQ')} د.ع إلى بطاقة ماستر كارد (${details.cardNumber?.slice(-4) ? '**** ' + details.cardNumber.slice(-4) : ''}) - ${details.bankName || 'المصرف العراقي'} باسم: ${details.accountName}`,
      date: new Intl.DateTimeFormat('ar-IQ', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date()),
      timestamp: Date.now(),
      status: 'completed',
      paymentMethod: method,
      referenceNumber: ref,
      recipientDetails: details,
    };

    setBalance((prev) => prev - amount);
    setTransactions((prev) => [newTx, ...prev]);

    // Persist to Supabase Source of Truth
    addTransactionToSupabase({
      amount,
      type: 'withdrawal',
      title: newTx.title,
      description: newTx.description,
      paymentMethod: method,
      referenceNumber: ref,
    }).catch((e) => console.warn('Supabase withdraw sync error:', e));

    return {
      success: true,
      referenceNumber: ref,
      message: 'تمت عملية التحويل وسحب الأرباح بنجاح فوري!',
    };
  };

  const payWithWallet = (
    amount: number,
    title: string,
    description: string
  ): { success: boolean; message?: string; referenceNumber?: string } => {
    if (amount > balance) {
      return { success: false, message: 'رصيد المحفظة غير كافٍ لإتمام الحجز' };
    }

    const ref = `IRAQ-PAY-${Math.floor(100000 + Math.random() * 900000)}`;
    const newTx: WalletTransaction = {
      id: `tx-${Date.now()}`,
      type: 'ad_payment',
      amount,
      title,
      description,
      date: new Intl.DateTimeFormat('ar-IQ', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date()),
      timestamp: Date.now(),
      status: 'completed',
      paymentMethod: 'wallet',
      referenceNumber: ref,
    };

    setBalance((prev) => prev - amount);
    setTransactions((prev) => [newTx, ...prev]);

    // Persist to Supabase Source of Truth
    addTransactionToSupabase({
      amount,
      type: 'payment',
      title,
      description,
      paymentMethod: 'wallet',
      referenceNumber: ref,
    }).catch((e) => console.warn('Supabase pay sync error:', e));

    return {
      success: true,
      referenceNumber: ref,
    };
  };


  return (
    <WalletContext.Provider
      value={{
        balance,
        transactions,
        isManagerUnlocked,
        managerCredentials,
        totalEarnings,
        totalWithdrawn,
        deposit,
        withdraw,
        payWithWallet,
        loginManager,
        lockManager,
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
