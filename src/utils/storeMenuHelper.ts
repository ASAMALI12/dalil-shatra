import { DirectoryItem, StoreMenuItem } from '../types/shatrah';

/**
 * Returns the store's authentic menu items.
 * Strictly avoids injecting any fake/synthetic menu items.
 * Only returns items actually defined by the store owner or directory data.
 */
export function getStoreMenu(store: DirectoryItem): StoreMenuItem[] {
  if (Array.isArray(store.menu) && store.menu.length > 0) {
    // Return only valid items that have at least a name
    return store.menu.filter((m) => m && typeof m.name === 'string' && m.name.trim().length > 0);
  }
  return [];
}

/**
 * Formats pricing string consistently in Iraqi Dinars (د.ع)
 */
export function formatIraqiPrice(rawPrice: string | number): string {
  if (typeof rawPrice === 'number') {
    return `${rawPrice.toLocaleString('ar-IQ')} د.ع`;
  }
  const clean = String(rawPrice || '').trim();
  if (!clean) return '';
  if (clean.includes('د.ع') || clean.includes('IQD')) return clean;
  return `${clean} د.ع`;
}
