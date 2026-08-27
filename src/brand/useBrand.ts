/**
 * useBrand — returns 1-Glance product identity.
 *
 * Values are module constants (not a white-label switcher).
 */

import { brandConfig, type BrandConfig } from './brandConfig';

export function useBrand(): BrandConfig {
  return brandConfig;
}

export type { BrandConfig };
