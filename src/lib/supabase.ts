import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Default project configuration
export const DEFAULT_SUPABASE_URL = 'https://kcrzmkrytjndeyzzoggw.supabase.co';

const getEnvVar = (key: string): string => {
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[key]) {
      return (import.meta as any).env[key];
    }
  } catch (e) {}

  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key] as string;
    }
  } catch (e) {}

  return '';
};

let currentUrl = getEnvVar('VITE_SUPABASE_URL') || getEnvVar('SUPABASE_URL') || DEFAULT_SUPABASE_URL;
let currentAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || getEnvVar('SUPABASE_ANON_KEY') || '';

// Inspect browser storage for saved credentials
if (!currentAnonKey && typeof window !== 'undefined') {
  const savedKey =
    sessionStorage.getItem('VITE_SUPABASE_ANON_KEY') ||
    localStorage.getItem('VITE_SUPABASE_ANON_KEY') ||
    localStorage.getItem('supabase_anon_key');
  if (savedKey) {
    currentAnonKey = savedKey;
  }
}

// Initial client instance
export let supabase: SupabaseClient = createClient(
  currentUrl,
  currentAnonKey || 'placeholder-anon-key'
);

/**
 * Checks if Supabase client has valid URL and anon key
 */
export function getIsSupabaseConfigured(): boolean {
  return Boolean(
    currentUrl &&
      currentAnonKey &&
      currentAnonKey !== 'placeholder-anon-key' &&
      currentAnonKey.trim().length > 10
  );
}

export let isSupabaseConfigured = getIsSupabaseConfigured();

/**
 * Dynamically re-configures the Supabase client
 */
export function configureSupabase(url?: string, anonKey?: string): SupabaseClient {
  if (url && url.trim()) {
    currentUrl = url.trim();
  }
  if (anonKey && anonKey.trim()) {
    currentAnonKey = anonKey.trim();
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('VITE_SUPABASE_ANON_KEY', currentAnonKey);
      localStorage.setItem('VITE_SUPABASE_ANON_KEY', currentAnonKey);
    }
  }

  supabase = createClient(currentUrl, currentAnonKey || 'placeholder-anon-key');
  isSupabaseConfigured = getIsSupabaseConfigured();
  return supabase;
}

/**
 * Ensures the Supabase client is initialized.
 * If the anon key was not passed in build-time Vite env,
 * it queries /api/supabase-config to load from runtime container env.
 */
export async function ensureSupabaseClient(): Promise<SupabaseClient> {
  if (getIsSupabaseConfigured()) {
    return supabase;
  }

  try {
    const res = await fetch('/api/supabase-config');
    if (res.ok) {
      const data = await res.json();
      if (data.supabaseUrl) {
        currentUrl = data.supabaseUrl;
      }
      if (data.supabaseAnonKey && typeof data.supabaseAnonKey === 'string' && data.supabaseAnonKey.trim().length > 10) {
        currentAnonKey = data.supabaseAnonKey.trim();
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('VITE_SUPABASE_ANON_KEY', currentAnonKey);
          localStorage.setItem('VITE_SUPABASE_ANON_KEY', currentAnonKey);
        }
        supabase = createClient(currentUrl, currentAnonKey);
        isSupabaseConfigured = true;
        console.log('✅ Supabase client initialized with credentials from /api/supabase-config');
      }
    }
  } catch (err) {
    // Non-blocking
  }

  return supabase;
}

/**
 * Tests connection to the stores table in Supabase
 */
export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  count?: number;
  error?: string;
}> {
  const client = await ensureSupabaseClient();
  if (!getIsSupabaseConfigured()) {
    return {
      connected: false,
      error: 'Supabase is not configured with an API key',
    };
  }

  try {
    const { data, count, error } = await client
      .from('stores')
      .select('id', { count: 'exact', head: true });

    if (error) {
      return { connected: false, error: error.message };
    }
    return { connected: true, count: count ?? (data ? data.length : 0) };
  } catch (err: any) {
    return { connected: false, error: err?.message || 'Connection failed' };
  }
}
