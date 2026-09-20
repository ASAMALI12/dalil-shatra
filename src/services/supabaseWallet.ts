import { ensureSupabaseClient, getIsSupabaseConfigured } from '../lib/supabase';
import { WalletTransaction } from '../types/directory';
import { getApiUrl } from '../utils/apiClient';

export interface WalletData {
  id: string;
  balance: number;
  currency: string;
  updated_at: string;
}

export async function fetchWalletFromSupabase(): Promise<{
  balance: number;
  transactions: WalletTransaction[];
  fromSupabase: boolean;
  error?: any;
}> {
  try {
    const client = await ensureSupabaseClient();
    if (getIsSupabaseConfigured()) {
      // 1. Fetch wallet record
      const { data: walletData, error: walletError } = await client
        .from('wallets')
        .select('*')
        .eq('id', 'main_wallet')
        .maybeSingle();

      // 2. Fetch transactions
      const { data: txData, error: txError } = await client
        .from('transactions')
        .select('*')
        .or('wallet_id.eq.main_wallet,wallet_id.is.null')
        .order('created_at', { ascending: false })
        .limit(100);

      if (!walletError && !txError && walletData) {
        const transactions: WalletTransaction[] = (txData || []).map((row: any) => ({
          id: String(row.id),
          type: row.type as WalletTransaction['type'],
          amount: Number(row.amount),
          title: String(row.title || 'معاملة مالية'),
          description: String(row.description || ''),
          date: row.created_at
            ? new Intl.DateTimeFormat('ar-IQ', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(row.created_at))
            : 'الآن',
          timestamp: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
          status: (row.status as any) || 'completed',
          paymentMethod: row.payment_method || 'zaincash',
          referenceNumber: row.reference_number || undefined,
        }));

        return {
          balance: Number(walletData.balance || 0),
          transactions,
          fromSupabase: true,
        };
      }
    }

    // Fallback to server API
    const adminToken = typeof window !== 'undefined' ? sessionStorage.getItem('iraq_admin_token') : null;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (adminToken) {
      headers['Authorization'] = `Bearer ${adminToken}`;
      headers['x-admin-token'] = adminToken;
    }

    const res = await fetch(getApiUrl('/api/wallet'), { headers });
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        const bal = data.wallet?.balance !== undefined ? Number(data.wallet.balance) : Number(data.balance || 0);
        return {
          balance: bal,
          transactions: data.transactions || [],
          fromSupabase: false,
        };
      }
    }
  } catch (err) {
    console.warn('Could not fetch wallet from Supabase/API:', err);
  }

  return {
    balance: 0,
    transactions: [],
    fromSupabase: false,
  };
}

export async function addTransactionToSupabase(tx: {
  walletId?: string;
  userId?: string;
  amount: number;
  type: 'earning' | 'deposit' | 'withdrawal' | 'payment';
  title: string;
  description: string;
  paymentMethod?: string;
  referenceNumber?: string;
}): Promise<{ success: boolean; balance?: number; error?: any }> {
  try {
    const adminToken = typeof window !== 'undefined' ? sessionStorage.getItem('iraq_admin_token') : null;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (adminToken) {
      headers['Authorization'] = `Bearer ${adminToken}`;
      headers['x-admin-token'] = adminToken;
    }

    const res = await fetch(getApiUrl('/api/wallet/transaction'), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        walletId: tx.walletId || 'main_wallet',
        userId: tx.userId || 'admin',
        ...tx,
      }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err?.message || 'تعذر تسجيل المعاملة' };
  }
}
