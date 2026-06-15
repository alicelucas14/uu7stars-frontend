// ===== src/lib/paths.ts =====
// --- UPDATED: Slugify function is now Unicode-aware ---
import { defaultLocale, type Locale } from '../i18n';

export function createPath(path: string, locale: Locale): string {
  if (!path.startsWith('/')) {
    path = `/${path}`;
  }
  if (locale === defaultLocale) {
    return path;
  }
  const finalPath = `/${locale}${path === '/' ? '' : path}`;
  return finalPath;
}

/**
 * Creates a URL-friendly "slug" from a given string, now with Unicode support.
 */
export function slugify(text: string): string {
  if (!text) return '';
  
  const a = 'àáâäæãåāăąçćčđďèéêëēėęěğǵḧîïíīįìłḿñńǹňôöòóœøōõőṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźż·/_,:;'
  const b = 'aaaaaaaaaacccddeeeeeeeegghiiiiiilmnnnnoooooooooprrsssssttuuuuuuuuuwxyyzzz------'
  const p = new RegExp(a.split('').join('|'), 'g')

  return text.toString().toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(p, c => b.charAt(a.indexOf(c))) // Replace special characters
    .replace(/&/g, '-and-') // Replace & with 'and'
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .replace(/--+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, '') // Trim - from end of text
}