// Content of the FAQ pages (/faq/ and /hi/faq/).
//
// Source of truth is the admin "FAQ" screen (GET /frontend-api/faq). When that has nothing for the language (never
// saved, no Hindi yet, API down) the text in src/locales/<lang>.json (faqPage.sections) is used, so the page is
// never empty. Answers are Markdown in both places: they go through renderMarkdown (sanitised) for the page and
// through toPlainText for the FAQPage structured data.
import type { Locale } from '../i18n';
import { getFaq, type FaqApiSection } from '../services/api';
import { useTranslations } from './i18n';
import { renderMarkdown } from './renderMarkdown';
import { toPlainText } from './plainText';

export interface FaqEntry { q: string; html: string; text: string; }
export interface FaqGroup { id?: string; title: string; items: FaqEntry[]; }

function localeFallback(lang: Locale): FaqApiSection[] {
  const t = useTranslations(lang);
  const sections = t('faqPage.sections');
  if (Array.isArray(sections)) return sections;
  // Hindi still ships the older flat list: show it as one untitled group.
  const list = t('faqPage.list');
  return Array.isArray(list) ? [{ title: '', items: list }] : [];
}

export async function loadFaq(lang: Locale): Promise<FaqGroup[]> {
  let sections = await getFaq(lang);
  if (!sections.length) sections = localeFallback(lang);
  return Promise.all(
    sections.map(async (section) => ({
      id: section.id,
      title: section.title || '',
      items: await Promise.all(
        section.items.map(async ({ q, a }) => ({ q, html: await renderMarkdown(a), text: toPlainText(a) }))
      ),
    }))
  );
}
