// ===== src/lib/menuPages.ts =====
// Custom pages ticked "Show in the website menu" in the admin (Custom Pages -> edit).
// Used by the header, the mobile menu (Base layout) and the footer quick links.

import { getPagesList } from '../services/api';
import { createPath } from './paths';
import type { Locale } from '../i18n';

export interface MenuPageLink {
  href: string;
  label: string;
}

/** Never throws: a menu must not take a whole page down when the API is unreachable. */
export async function getMenuPages(lang: Locale): Promise<MenuPageLink[]> {
  try {
    const pages = await getPagesList(lang);
    return pages
      // `translated` = this language has real title + body text, i.e. the page exists in it
      .filter((p) => p.showInMenu && p.translated && p.slug?.trim() && p.title?.trim())
      .sort((a, b) => (a.menuOrder ?? 0) - (b.menuOrder ?? 0) || a.title.localeCompare(b.title))
      .map((p) => ({
        href: createPath(`/${encodeURIComponent(p.slug.trim())}/`, lang),
        label: p.title.trim(),
      }));
  } catch (err) {
    console.warn('Could not load custom pages for the menu:', err);
    return [];
  }
}
