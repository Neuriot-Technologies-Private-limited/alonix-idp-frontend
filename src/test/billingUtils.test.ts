import { describe, expect, it } from 'vitest';
import { brandConfig } from '../brand/brandConfig';
import {
  annualDiscountPercent,
  annualSavings,
  annualTotal,
  fmtBytes,
  limitLabel,
  monthlyPrice,
  productPlanDescription,
  stripePriceIdForCycle,
} from '../utils/billingUtils';

describe('billingUtils', () => {
  const plan = { priceMonthlyUsd: 100, annualDiscountFraction: 0.2 };

  it('computes monthly and annual display prices', () => {
    expect(monthlyPrice(plan, 'monthly')).toBe(100);
    expect(monthlyPrice(plan, 'annually')).toBe(80);
    expect(annualTotal(plan)).toBe(960);
    expect(annualSavings(plan)).toBe(240);
    expect(annualDiscountPercent(plan)).toBe(20);
  });

  it('uses default annual discount when fraction is invalid', () => {
    const fallback = { priceMonthlyUsd: 50, annualDiscountFraction: 1.5 };
    expect(monthlyPrice(fallback, 'annually')).toBe(40);
    expect(annualDiscountPercent(fallback)).toBe(20);
  });

  it('selects stripe price id by billing cycle', () => {
    const p = {
      stripePriceId: 'price_legacy',
      stripePriceIdMonthly: 'price_m',
      stripePriceIdYearly: 'price_y',
    };
    expect(stripePriceIdForCycle(p, 'monthly')).toBe('price_m');
    expect(stripePriceIdForCycle(p, 'annually')).toBe('price_y');
    expect(stripePriceIdForCycle({ stripePriceId: 'only' }, 'monthly')).toBe('only');
  });

  it('formats bytes and limits', () => {
    expect(fmtBytes(-1)).toBe('Unlimited');
    expect(fmtBytes(1_073_741_824)).toBe('1 GB');
    expect(fmtBytes(5_242_880)).toBe('5 MB');
    expect(limitLabel(-1)).toBe('Unlimited');
    expect(limitLabel(10)).toBe('10');
  });

  it('rewrites legacy product names using brand config', () => {
    const out = productPlanDescription('Alonix IDP Pro on Alonix');
    expect(out).toContain(brandConfig.name);
    expect(out).not.toMatch(/alonix/i);
  });
});
