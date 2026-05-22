/**
 * BrandConfig — the single source of truth for what a brand can customise.
 *
 * All values are resolved at build time from VITE_BRAND_* environment variables
 * injected by vite.config.ts when running `vite --mode <brand>`.
 *
 * Never hardcode brand values in components — always import from here
 * or use the `useBrand()` hook.
 */

export interface BrandConfig {
  /** Full display name, e.g. "1-Glance" */
  name: string;
  /** Short abbreviation, e.g. "1G" */
  shortName: string;
  /** Hero tagline used on landing page */
  tagline: string;
  /** Footer copyright entity, e.g. "Alonix Intelligence Systems" */
  copyright: string;

  /** URL to the full horizontal logo (served from /brand/) */
  logoUrl: string;
  /** URL to the square icon-only logo (served from /brand/) */
  logoIconUrl: string;
  /** URL to the favicon (served from /brand/) */
  faviconUrl: string;

  /** Primary colour hex — light mode */
  primaryLight: string;
  /** Primary-container colour hex — light mode */
  primaryContainerLight: string;
  /** Primary colour hex — dark mode */
  primaryDark: string;
  /** Primary-container colour hex — dark mode */
  primaryContainerDark: string;

  /** Support / contact email for this brand */
  supportEmail: string;
  /** Sales / enterprise contact email */
  salesEmail: string;
  /** Public website URL */
  websiteUrl: string;
  /** Privacy policy URL */
  privacyUrl: string;
  /** Terms of service URL */
  termsUrl: string;

  /** Whether to show the public pricing section */
  showPricing: boolean;
  /** Whether to show the public landing page */
  showLanding: boolean;
}

/** Read an optional VITE_ env var with a fallback. */
function optional(key: string, fallback: string): string {
  const val = import.meta.env[key];
  return val ? String(val) : fallback;
}

function flag(key: string, fallback = true): boolean {
  const val = import.meta.env[key];
  if (!val) return fallback;
  return String(val).toLowerCase() !== 'false' && val !== '0';
}

/**
 * The resolved brand configuration for the current build.
 * This is a module-level singleton — evaluated once at startup.
 */
export const brandConfig: BrandConfig = {
  name: optional('VITE_BRAND_NAME', '1-Glance'),
  shortName: optional('VITE_BRAND_SHORT_NAME', '1G'),
  tagline: optional(
    'VITE_BRAND_TAGLINE',
    'The Digital Curator for Your Document Intelligence Platform'
  ),
  copyright: optional('VITE_BRAND_COPYRIGHT', 'Alonix Intelligence Systems'),

  // Assets are served from /brand/ — copied there by vite.config.ts at build time
  logoUrl: '/brand/logo.png',
  logoIconUrl: '/brand/logo-icon.png',
  faviconUrl: '/brand/favicon.svg',

  primaryLight: optional('VITE_BRAND_PRIMARY_LIGHT', '#005ac1'),
  primaryContainerLight: optional('VITE_BRAND_PRIMARY_CONTAINER_LIGHT', '#d8e2ff'),
  primaryDark: optional('VITE_BRAND_PRIMARY_DARK', '#ADC6FF'),
  primaryContainerDark: optional('VITE_BRAND_PRIMARY_CONTAINER_DARK', '#1E2B4B'),

  supportEmail: optional('VITE_BRAND_SUPPORT_EMAIL', 'support@1glance.ai'),
  salesEmail: optional('VITE_BRAND_SALES_EMAIL', 'sales@1glance.ai'),
  websiteUrl: optional('VITE_BRAND_WEBSITE_URL', 'https://1glance.ai'),
  privacyUrl: optional('VITE_BRAND_PRIVACY_URL', 'https://1glance.ai/privacy'),
  termsUrl: optional('VITE_BRAND_TERMS_URL', 'https://1glance.ai/terms'),

  showPricing: flag('VITE_BRAND_SHOW_PRICING', true),
  showLanding: flag('VITE_BRAND_SHOW_LANDING', true),
};
