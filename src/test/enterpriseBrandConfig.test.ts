import { describe, it, expect, vi, afterEach } from 'vitest';

describe('enterprise brandConfig', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('forces showLanding and showPricing off for enterprise profile', async () => {
    vi.stubEnv('VITE_DEPLOYMENT_PROFILE', 'enterprise');
    vi.stubEnv('VITE_BRAND_SHOW_LANDING', 'true');
    vi.stubEnv('VITE_BRAND_SHOW_PRICING', 'true');
    const { brandConfig, isSelfServeBillingEnabled } = await import('../brand/brandConfig');
    expect(brandConfig.showLanding).toBe(false);
    expect(brandConfig.showPricing).toBe(false);
    expect(isSelfServeBillingEnabled()).toBe(false);
  });

  it('disables self-serve billing UI when VITE_BRAND_SHOW_PRICING is false', async () => {
    vi.stubEnv('VITE_DEPLOYMENT_PROFILE', 'saas');
    vi.stubEnv('VITE_BRAND_SHOW_PRICING', 'false');
    const { brandConfig, isSelfServeBillingEnabled } = await import('../brand/brandConfig');
    expect(brandConfig.showPricing).toBe(false);
    expect(isSelfServeBillingEnabled()).toBe(false);
  });
});
