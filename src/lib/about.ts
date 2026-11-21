// Content of the About us pages (/about/ and /hi/about/).
//
// Source of truth is the admin "About page" screen (GET /frontend-api/about, which serves the starting content until
// something is saved). Only when the API cannot be reached does the page fall back to the short About text in
// src/locales/<lang>.json (aboutTabs), so it is never empty.
//
// Everything that reaches the page is re-checked here, whatever the API sent: multi-line texts are Markdown and go
// through renderMarkdown (sanitised); links must be a page on this site, http(s) or mailto (never javascript:);
// picture addresses must be http(s) or a site path (http is upgraded to https). Internal links in buttons are opened
// in the page's language (/faq/ -> /hi/faq/ on the Hindi page).
import type { Locale } from '../i18n';
import { getAbout, type AboutApiContent } from '../services/api';
import { useTranslations } from './i18n';
import { createPath } from './paths';
import { renderMarkdown } from './renderMarkdown';

export interface AboutButton { label: string; href: string; }
export interface AboutImage { src: string; alt: string; }
export interface AboutView {
  hero: { eyebrow: string; title: string; subtitle: string; primary: AboutButton | null; secondary: AboutButton | null; image: AboutImage | null };
  story: { title: string; html: string; quote: string; image: AboutImage | null } | null;
  panels: { items: { icon: string; title: string; html: string }[] } | null;
  features: { title: string; intro: string; items: { icon: string; title: string; html: string }[] } | null;
  benefits: { title: string; items: { icon: string; value: string; label: string }[] } | null;
  timeline: { title: string; intro: string; items: { label: string; title: string; html: string }[] } | null;
  highlight: { title: string; html: string } | null;
  contact: { title: string; intro: string; button: string; success: string; note: string; image: AboutImage | null } | null;
  cta: { title: string; html: string; button: AboutButton | null } | null;
  seo: { title: string; description: string };
}

const LINK_OK = /^(https?:\/\/\S+|mailto:\S+|\/(?!\/)\S*|#\S+)$/i;
const IMAGE_OK = /^(https?:\/\/\S+|\/(?!\/)\S+)$/i;

export function safeHref(url: string | undefined, lang: Locale): string {
  const u = (url || '').trim();
  if (!u || !LINK_OK.test(u)) return '';
  if (u.startsWith('/') && !/^\/hi(\/|$)/.test(u)) return createPath(u, lang);
  return u;
}

function safeImage(pic: { url: string; alt: string } | null | undefined): AboutImage | null {
  const u = (pic?.url || '').trim();
  if (!u || !IMAGE_OK.test(u)) return null;
  return { src: u.replace(/^http:\/\//i, 'https://'), alt: pic?.alt || '' };
}

function safeButton(b: { label: string; url: string } | null | undefined, lang: Locale): AboutButton | null {
  if (!b) return null;
  const href = safeHref(b.url, lang);
  return href && b.label ? { label: b.label, href } : null;
}

// Built from the About text that already lives in the locale files; only used when the API is unreachable.
function localeFallback(lang: Locale): AboutApiContent {
  const t = useTranslations(lang);
  const text = (key: string) => { const v = t(key); return typeof v === 'string' && v !== key ? v : ''; };
  const body = text('aboutTabs.tab2.p1');
  return {
    hero: { eyebrow: '', title: text('aboutTabs.title'), subtitle: text('aboutTabs.intro1').replace(/<[^>]*>/g, ''), primary: null, secondary: null, image: null },
    story: null,
    panels: null,
    features: null,
    benefits: null,
    timeline: null,
    highlight: body ? { title: text('aboutTabs.tab2.title'), body } : null,
    contact: null,
    cta: null,
    seo: { title: '', description: '' },
  };
}

export async function loadAbout(lang: Locale): Promise<AboutView> {
  const c = (await getAbout(lang)) ?? localeFallback(lang);
  const md = (s: string) => renderMarkdown(s);
  const withHtml = <T extends { text: string }>(items: T[]) =>
    Promise.all(items.map(async ({ text, ...rest }) => ({ ...rest, html: await md(text) })));

  const story = c.story
    ? { title: c.story.title, html: await md(c.story.body), quote: c.story.quote || '', image: safeImage(c.story.image) }
    : null;
  const panels = c.panels ? { items: await withHtml(c.panels.items) } : null;
  const features = c.features ? { title: c.features.title, intro: c.features.intro, items: await withHtml(c.features.items) } : null;
  const timeline = c.timeline ? { title: c.timeline.title, intro: c.timeline.intro, items: await withHtml(c.timeline.items) } : null;
  const highlight = c.highlight ? { title: c.highlight.title, html: await md(c.highlight.body) } : null;
  const cta = c.cta ? { title: c.cta.title, html: await md(c.cta.text), button: safeButton(c.cta.button, lang) } : null;

  return {
    hero: {
      eyebrow: c.hero.eyebrow,
      title: c.hero.title,
      subtitle: c.hero.subtitle,
      primary: safeButton(c.hero.primary, lang),
      secondary: safeButton(c.hero.secondary, lang),
      image: safeImage(c.hero.image),
    },
    story,
    panels,
    features,
    benefits: c.benefits,
    timeline,
    highlight,
    contact: c.contact ? { ...c.contact, image: safeImage(c.contact.image) } : null,
    cta,
    seo: c.seo,
  };
}
