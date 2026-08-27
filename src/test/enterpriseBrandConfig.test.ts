import { describe, it, expect, vi, afterEach } from 'vitest';

describe('enterprise brandConfig', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('forces showLanding off and keeps pricing off for enterprise profile', async () => {
    vi.stubEnv('VITE_DEPLOYMENT_PROFILE', 'enterprise');
    const { brandConfig, isSelfServeBillingEnabled } = await import('../brand/brandConfig');
    expect(brandConfig.showLanding).toBe(false);
    expect(brandConfig.showPricing).toBe(false);
    expect(isSelfServeBillingEnabled()).toBe(false);
  });

  it('keeps landing on and pricing off for saas 1-Glance', async () => {
    vi.stubEnv('VITE_DEPLOYMENT_PROFILE', 'saas');
    const { brandConfig, isSelfServeBillingEnabled } = await import('../brand/brandConfig');
    expect(brandConfig.showLanding).toBe(true);
    expect(brandConfig.showPricing).toBe(false);
    expect(isSelfServeBillingEnabled()).toBe(false);
  });
});
