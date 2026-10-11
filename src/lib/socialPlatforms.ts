// ===== src/lib/socialPlatforms.ts =====
// Icons/labels for the admin's "More Social Links" (Settings). Keys must match
// adminorg/lib/socialPlatforms.js. Unknown keys are ignored so a newer admin can't break the footer.

/** Where a link shows and when it is live (admin Settings). Empty dates = no limit. */
export interface SocialVisibility {
  showInFooter?: boolean;
  showInSidebar?: boolean;
  activeFrom?: string | null;
  activeUntil?: string | null;
}

export interface ExtraSocialLink extends SocialVisibility {
  platform: string;
  url: string;
  label?: string;
  iconUrl?: string;
}

export interface ResolvedSocialLink {
  href: string;
  imgSrc: string;
  label: string;
}

export type SocialPlacement = 'footer' | 'sidebar';

// Built-in links (Settings -> telegramUrl, ...). Keys match adminorg FIXED_SOCIAL_LINKS / `socialLinkDisplay`.
// Used when an older settings doc has no `socialLinkDisplay` yet: X was never on the sidebar.
const FIXED_DEFAULTS: Record<string, { footer: boolean; sidebar: boolean }> = {
  telegram: { footer: true, sidebar: true },
  whatsapp: { footer: true, sidebar: true },
  instagram: { footer: true, sidebar: true },
  facebook: { footer: true, sidebar: true },
  youtube: { footer: true, sidebar: true },
  twitter: { footer: true, sidebar: false },
};

/** Inside its schedule window right now? Settings are cached ~60s, so changes land within a minute. */
export function isSocialLinkActive(v: SocialVisibility | null | undefined, now = Date.now()): boolean {
  const from = v?.activeFrom ? Date.parse(v.activeFrom) : NaN;
  const until = v?.activeUntil ? Date.parse(v.activeUntil) : NaN;
  if (!Number.isNaN(from) && now < from) return false;
  if (!Number.isNaN(until) && now >= until) return false;
  return true;
}

/** Ticked for this placement (and live)? `fallback` covers docs saved before the option existed. */
export function isSocialLinkShown(
  v: SocialVisibility | null | undefined,
  placement: SocialPlacement,
  fallback = true,
  now = Date.now(),
): boolean {
  const flag = placement === 'footer' ? v?.showInFooter : v?.showInSidebar;
  return (typeof flag === 'boolean' ? flag : fallback) && isSocialLinkActive(v, now);
}

/** For a built-in link: `key` is e.g. 'telegram'; `display` is settings.socialLinkDisplay. */
export function isFixedSocialShown(
  display: Record<string, SocialVisibility | undefined> | null | undefined,
  key: string,
  placement: SocialPlacement,
  now = Date.now(),
): boolean {
  const defaults = FIXED_DEFAULTS[key] ?? { footer: true, sidebar: true };
  return isSocialLinkShown(display?.[key], placement, defaults[placement], now);
}

const PLATFORMS: Record<string, { label: string; icon: string }> = {
  tiktok: { label: 'TikTok', icon: '/social/tiktok.svg' },
  threads: { label: 'Threads', icon: '/social/threads.svg' },
  pinterest: { label: 'Pinterest', icon: '/social/pinterest.svg' },
  linkedin: { label: 'LinkedIn', icon: '/social/linkedin.svg' },
  discord: { label: 'Discord', icon: '/social/discord.svg' },
  snapchat: { label: 'Snapchat', icon: '/social/snapchat.svg' },
  reddit: { label: 'Reddit', icon: '/social/reddit.svg' },
  quora: { label: 'Quora', icon: '/social/quora.svg' },
  twitch: { label: 'Twitch', icon: '/social/twitch.svg' },
  kick: { label: 'Kick', icon: '/social/kick.svg' },
  spotify: { label: 'Spotify', icon: '/social/spotify.svg' },
  medium: { label: 'Medium', icon: '/social/medium.svg' },
  telegram: { label: 'Telegram', icon: '/wordpress/telegram.png' },
  whatsapp: { label: 'WhatsApp', icon: '/wordpress/whatsapp.png' },
  instagram: { label: 'Instagram', icon: '/wordpress/instagram.webp' },
  facebook: { label: 'Facebook', icon: '/wordpress/facebook.png' },
  youtube: { label: 'YouTube', icon: '/wordpress/youtube.png' },
  x: { label: 'X', icon: '/wordpress/x.webp' },
  website: { label: 'Website', icon: '/social/website.svg' },
  other: { label: 'Link', icon: '/social/website.svg' },
};

/** Only real web links (blocks javascript: etc.). */
function safeHttpUrl(value: unknown, upgradeToHttps = false): string {
  if (typeof value !== 'string' || !value.trim()) return '';
  try {
    const u = new URL(value.trim());
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return '';
    // Uploaded icons come from the admin host as http:// - the site is https, avoid mixed content
    if (upgradeToHttps && u.protocol === 'http:' && !/^(localhost|127\.0\.0\.1)$/.test(u.hostname)) u.protocol = 'https:';
    return u.href;
  } catch {
    return '';
  }
}

/**
 * Extra links for one placement (only those ticked for it and inside their schedule).
 * Without a placement, every currently-live link is returned (used for schema.org sameAs).
 */
export function resolveExtraSocialLinks(
  links: ExtraSocialLink[] | undefined | null,
  placement?: SocialPlacement,
  now = Date.now(),
): ResolvedSocialLink[] {
  if (!Array.isArray(links)) return [];
  const out: ResolvedSocialLink[] = [];
  for (const link of links) {
    const def = PLATFORMS[link?.platform];
    const href = safeHttpUrl(link?.url);
    if (!def || !href) continue;
    if (placement ? !isSocialLinkShown(link, placement, true, now) : !isSocialLinkActive(link, now)) continue;
    const isOther = link.platform === 'other';
    out.push({
      href,
      label: (isOther && link.label?.trim()) || def.label,
      imgSrc: (isOther && safeHttpUrl(link.iconUrl, true)) || def.icon,
    });
  }
  return out;
}
