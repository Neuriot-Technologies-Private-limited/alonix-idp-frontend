import { describe, expect, it } from 'vitest';
import type { BillingPlan } from '../services/billingService';
import {
  connectorQuotaLabel,
  getNextUpgradePlan,
  isPlanCheckoutAvailable,
  planQuotaPills,
  sortBillingPlans,
  upgradePitch,
} from '../services/billingService';

function plan(name: string, priceMonthlyUsd: number, overrides: Partial<BillingPlan> = {}): BillingPlan {
  return {
    _id: name,
    name,
    displayName: name,
    description: '',
    priceMonthlyUsd,
    limits: {
      maxConnectors: 2,
      maxDocumentsMonth: 100,
      maxUsers: 5,
      maxStorageBytes: 1_073_741_824,
    },
    stripePriceIdMonthly: `price_${name.toLowerCase()}_m`,
    stripePriceIdYearly: `price_${name.toLowerCase()}_y`,
    ...overrides,
  };
}

describe('billingService helpers', () => {
  const plans = [
    plan('PRO', 99),
    plan('FREE', 0),
    plan('STARTER', 29),
    plan('ENTERPRISE', 0, { stripePriceIdMonthly: null, stripePriceIdYearly: null }),
  ];

  it('sorts plans in tier order', () => {
    expect(sortBillingPlans(plans).map((p) => p.name)).toEqual([
      'FREE',
      'STARTER',
      'PRO',
      'ENTERPRISE',
    ]);
  });

  it('finds next paid upgrade tier', () => {
    expect(getNextUpgradePlan('FREE', plans)?.name).toBe('STARTER');
    expect(getNextUpgradePlan('STARTER', plans)?.name).toBe('PRO');
    expect(getNextUpgradePlan('PRO', plans)).toBeNull();
  });

  it('formats connector quota labels', () => {
    expect(connectorQuotaLabel(-1)).toBe('Unlimited connectors');
    expect(connectorQuotaLabel(0)).toBe('No connectors');
    expect(connectorQuotaLabel(1)).toBe('1 connector');
    expect(connectorQuotaLabel(3)).toBe('3 connectors');
  });

  it('builds plan quota pills and upgrade pitch', () => {
    const starter = plan('STARTER', 29);
    expect(planQuotaPills(starter)).toEqual([
      '2 connectors',
      '100 docs/mo',
      '5 users',
      '1 GB storage',
    ]);
    expect(upgradePitch(starter, plan('PRO', 99))).toMatch(/\$99\/mo/);
  });

  it('detects checkout availability by cycle', () => {
    expect(isPlanCheckoutAvailable(plan('FREE', 0), 'monthly')).toBe(false);
    expect(isPlanCheckoutAvailable(plan('ENTERPRISE', 0), 'monthly')).toBe(false);
    expect(isPlanCheckoutAvailable(plan('STARTER', 29), 'monthly')).toBe(true);
    expect(
      isPlanCheckoutAvailable(
        plan('STARTER', 29, { stripePriceIdMonthly: null, stripePriceIdYearly: 'y' }),
        'monthly',
      ),
    ).toBe(false);
    expect(
      isPlanCheckoutAvailable(
        plan('STARTER', 29, { stripePriceIdMonthly: null, stripePriceIdYearly: 'y' }),
        'annually',
      ),
    ).toBe(true);
  });
});
