import { describe, expect, it } from 'vitest';
import type { BillingPlan } from '../services/billingService';
import { discountPercentFromPlans } from '../components/billing/PublicPricingGrid';

function plan(name: string, fraction?: number): BillingPlan {
  return {
    _id: name,
    name,
    displayName: name,
    description: '',
    priceMonthlyUsd: 10,
    limits: {
      maxConnectors: 1,
      maxDocumentsMonth: 10,
      maxUsers: 1,
      maxStorageBytes: 1,
    },
    annualDiscountFraction: fraction,
  };
}

describe('discountPercentFromPlans', () => {
  it('uses annual discount from first sorted plan', () => {
    const pct = discountPercentFromPlans([
      plan('PRO', 0.25),
      plan('FREE', 0.1),
    ]);
    expect(pct).toBe(10);
  });
});
