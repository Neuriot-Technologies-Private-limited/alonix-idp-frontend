import { brandConfig } from './brandConfig';

function faviconMimeType(url: string): string {
  const ext = url.split('.').pop()?.toLowerCase() || '';
  if (ext === 'svg') return 'image/svg+xml';
  if (ext === 'ico') return 'image/x-icon';
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  return 'image/png';
}

/** Sync document title + favicon from build-time brand config. */
export function applyBrandDocument(): void {
  if (typeof document === 'undefined') return;

  document.title = brandConfig.name;

  const href = brandConfig.faviconUrl;
  const type = faviconMimeType(href);

  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.type = type;
  // Bust aggressive favicon caching when switching brands locally.
  const cacheKey = encodeURIComponent(brandConfig.shortName);
  link.href = href.includes('?') ? `${href}&v=${cacheKey}` : `${href}?v=${cacheKey}`;
}
