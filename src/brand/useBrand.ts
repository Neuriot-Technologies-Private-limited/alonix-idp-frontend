/**
 * useBrand — React hook that returns the current BrandConfig.
 *
 * Since brand is resolved at build time, this is effectively a constant.
 * Wrapping it in a hook keeps it:
 * - Mockable in unit tests
 * - Easy to upgrade to runtime config later (e.g. fetched from API)
 * - Consistent with React conventions throughout the codebase
 *
 * Usage:
 *   const brand = useBrand();
 *   <img src={brand.logoUrl} alt={brand.name} />
 */

import { brandConfig, type BrandConfig } from './brandConfig';

export function useBrand(): BrandConfig {
  return brandConfig;
}

export type { BrandConfig };
