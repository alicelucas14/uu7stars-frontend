// ===== src/lib/socialPlatforms.ts =====
// Icons/labels for the admin's "More Social Links" (Settings). Keys must match
// adminorg/lib/socialPlatforms.js. Unknown keys are ignored so a newer admin can't break the footer.

export interface ExtraSocialLink {
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

export function resolveExtraSocialLinks(links: ExtraSocialLink[] | undefined | null): ResolvedSocialLink[] {
  if (!Array.isArray(links)) return [];
  const out: ResolvedSocialLink[] = [];
  for (const link of links) {
    const def = PLATFORMS[link?.platform];
    const href = safeHttpUrl(link?.url);
    if (!def || !href) continue;
    const isOther = link.platform === 'other';
    out.push({
      href,
      label: (isOther && link.label?.trim()) || def.label,
      imgSrc: (isOther && safeHttpUrl(link.iconUrl, true)) || def.icon,
    });
  }
  return out;
}
