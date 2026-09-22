/**
 * Centralized API Client & URL Resolver for «دليل العراق»
 * Handles cross-platform URL resolution (Web, Capacitor Android APK, Custom Host)
 */

export const DEFAULT_API_URL = 'https://ccvntqtohuxqpxfqnhxt.supabase.co/functions/v1/api';

/**
 * Returns the base API URL depending on the running environment:
 * 1. Explicit environment variable: VITE_API_URL
 * 2. User-configured custom API URL saved in localStorage
 * 3. Default production Supabase Edge Function API (Universal for APK and Web)
 */
export function getApiBaseUrl(): string {
  // 1. Check Vite env variable
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      const viteApi = (import.meta as any).env.VITE_API_URL;
      if (viteApi && typeof viteApi === 'string' && viteApi.trim().length > 0) {
        return viteApi.replace(/\/+$/, '');
      }
    }
  } catch {}

  // 2. Check localStorage for user/admin override
  if (typeof window !== 'undefined') {
    try {
      const custom = localStorage.getItem('iraq_custom_api_url');
      if (custom && custom.trim().length > 0) {
        return custom.replace(/\/+$/, '');
      }
    } catch {}
  }

  // 3. In Web browser environment (Preview / Web App), use relative root ('') so requests go directly to the local active server
  if (typeof window !== 'undefined') {
    const isCapacitorNative = Boolean(
      (window as any).Capacitor?.isNativePlatform?.() ||
      (window as any).Capacitor?.platform === 'android' ||
      (window as any).Capacitor?.platform === 'ios'
    );
    if (!isCapacitorNative) {
      return '';
    }
  }

  // 4. Fallback to production Supabase Edge Function ONLY when compiled inside a native mobile APK
  return DEFAULT_API_URL;
}

/**
 * Formats an API path with the appropriate host prefix.
 * Safely normalizes both '/api/endpoint' and '/endpoint' to prevent double '/api/api/'.
 */
export function getApiUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  let cleanPath = path.startsWith('/') ? path : `/${path}`;
  const base = getApiBaseUrl();

  if (base) {
    if (base.endsWith('/api') && cleanPath.startsWith('/api/')) {
      cleanPath = cleanPath.slice(4);
    } else if (base.endsWith('/api') && cleanPath === '/api') {
      cleanPath = '';
    }
    return `${base}${cleanPath}`;
  }
  return cleanPath;
}

export interface SafeApiResponse<T = any> {
  success: boolean;
  ok: boolean;
  data?: T;
  error?: string;
  status: number;
  json: () => Promise<T>;
}

/**
 * Enhanced fetch wrapper that prepends the proper base API URL (Web vs Capacitor APK)
 */
export function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  return fetch(getApiUrl(path), options);
}

/**
 * Safe fetch wrapper with timeout and standardized error handling
 */
export async function safeApiFetch<T = any>(
  path: string,
  options: RequestInit = {},
  timeoutMs: number = 10000
): Promise<SafeApiResponse<T>> {
  const url = getApiUrl(path);
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
    clearTimeout(id);

    const contentType = res.headers.get('content-type') || '';
    let parsedData: any = null;
    if (contentType.includes('application/json')) {
      parsedData = await res.json();
    } else {
      parsedData = await res.text();
    }

    if (!res.ok) {
      return {
        success: false,
        ok: false,
        status: res.status,
        error: (parsedData && parsedData.error) || (parsedData && parsedData.message) || `HTTP Error ${res.status}`,
        data: parsedData,
        json: async () => parsedData,
      };
    }

    return {
      success: true,
      ok: true,
      status: res.status,
      data: parsedData,
      json: async () => parsedData,
    };
  } catch (err: any) {
    clearTimeout(id);
    const isTimeout = err.name === 'AbortError';
    const errorMsg = isTimeout ? 'انتهت مهلة الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت.' : (err?.message || 'حدث خطأ في الاتصال بالخادم.');
    return {
      success: false,
      ok: false,
      status: isTimeout ? 408 : 500,
      error: errorMsg,
      data: { success: false, error: errorMsg } as any,
      json: async () => ({ success: false, error: errorMsg } as any),
    };
  }
}
