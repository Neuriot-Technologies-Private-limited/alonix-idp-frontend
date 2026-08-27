import { isEnterpriseBuild } from './deploymentProfile';

/**
 * Product identity for 1-Glance.
 *
 * Screens should import from here or use `useBrand()` — do not hardcode the
 * product name, logo, or colors in components.
 */

export interface BrandConfig {
  /** Full display name */
  name: string;
  /** Short abbreviation */
  shortName: string;
  /** Hero tagline used on landing page */
  tagline: string;
  /** Footer copyright entity */
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

  /** Support / contact email */
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

  /** URL to the product dashboard screenshot */
  dashboardShotUrl: string;
  /** URL to the product chat screenshot */
  chatShotUrl: string;
  /** URL to the product groups screenshot */
  groupsShotUrl: string;
  /** URL to the product users screenshot */
  usersShotUrl: string;
  /** URL to the product documents screenshot */
  documentsShotUrl: string;
}

/**
 * 1-Glance product constants.
 * `showLanding` follows the SaaS vs enterprise deployment profile.
 * Public pricing stays off for 1-Glance in both profiles.
 */
export const brandConfig: BrandConfig = {
  name: '1-Glance',
  shortName: '1G',
  tagline: 'The Digital Curator for Your Document Intelligence Platform',
  copyright: 'Alonix Intelligence Systems',

  logoUrl: '/brand/logo.png',
  logoIconUrl: '/brand/logo-icon.png',
  faviconUrl: '/brand/favicon.svg',

  primaryLight: '#005ac1',
  primaryContainerLight: '#d8e2ff',
  primaryDark: '#ADC6FF',
  primaryContainerDark: '#1E2B4B',

  supportEmail: 'support@1glance.ai',
  salesEmail: 'sales@1glance.ai',
  websiteUrl: 'https://1glance.ai',
  privacyUrl: 'https://1glance.ai/privacy',
  termsUrl: 'https://1glance.ai/terms',

  showPricing: false,
  showLanding: !isEnterpriseBuild(),

  dashboardShotUrl: '/brand/product-dashboard.png',
  chatShotUrl: '/brand/product-chat.png',
  groupsShotUrl: '/brand/product-groups.png',
  usersShotUrl: '/brand/product-users.png',
  documentsShotUrl: '/brand/product-documents.png',
};

/** Landing pricing, /pricing, org subscription panel, and /settings/billing. */
export function isSelfServeBillingEnabled(): boolean {
  return brandConfig.showPricing;
}
