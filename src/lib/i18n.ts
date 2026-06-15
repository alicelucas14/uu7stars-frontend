import type { Locale } from "../i18n";

const translations = import.meta.glob<{ default: Record<string, any> }>('/src/locales/*.json', { eager: true });

/**
 * Returns a translation function `t` for the specified locale.
 *
 * @param lang The desired locale ('en' or 'hi').
 * @returns A function `t(key: string)` that returns the translated value (string, array, object).
 */
export function useTranslations(lang: Locale) {
  const langPath = `/src/locales/${lang}.json`;
  const dict = translations[langPath]?.default ?? translations['/src/locales/en.json'].default;

  /**
   * --- UPDATED: Uses a more robust 'reduce' method to traverse the object path. ---
   * This correctly handles nested objects and arrays.
   */
  return function t(key: string): any {
    const result = key.split('.').reduce((obj, currentKey) => {
      // Check if the current object is valid and has the key
      if (obj && typeof obj === 'object' && currentKey in obj) {
        return obj[currentKey as keyof typeof obj];
      }
      // If the path is broken at any point, return undefined
      return undefined;
    }, dict as any);

    // If the lookup failed, return the original key as a fallback for debugging.
    // Otherwise, return the found value.
    return result === undefined ? key : result;
  };
}