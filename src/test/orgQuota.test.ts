import { describe, it, expect } from 'vitest';
import {
  buildOrgQuotaSnapshot,
  computeRemaining,
  isAtQuotaCap,
  wouldExceedUserQuota,
  calendarMonthResetAt,
} from '../utils/orgQuota';
import type { BillingSubscriptionResponse } from '../services/billingService';

function sampleBilling(overrides?: Partial<BillingSubscriptionResponse>): BillingSubscriptionResponse {
  return {
    plan: { slug: 'FREE', name: 'Free' } as unknown as BillingSubscriptionResponse['plan'],
    limits: {
      maxDocumentsMonth: 50,
      maxQuestionsMonth: 50,
      maxConnectors: 1,
      maxUsers: 3,
      maxStorageBytes: 0,
    },
    usage: {
      docsThisMonth: 10,
      questionsThisMonth: 5,
      connectors: 1,
      users: 3,
      storageBytes: 0,
    },
    subscription: { status: 'active', currentPeriodEnd: '2026-07-01T00:00:00.000Z' },
    usagePeriod: { periodEnd: '2026-07-01T00:00:00.000Z' },
    ...overrides,
  } as BillingSubscriptionResponse;
}

describe('orgQuota helpers', () => {
  it('computeRemaining returns null for unlimited', () => {
    expect(computeRemaining(5, -1)).toBeNull();
  });

  it('isAtQuotaCap detects cap', () => {
    expect(isAtQuotaCap(50, 50)).toBe(true);
    expect(isAtQuotaCap(49, 50)).toBe(false);
    expect(isAtQuotaCap(0, 0)).toBe(true);
  });

  it('wouldExceedUserQuota respects additional headcount', () => {
    const snap = buildOrgQuotaSnapshot(sampleBilling());
    const users = snap.metrics.users;
    expect(users.atCap).toBe(true);
    expect(wouldExceedUserQuota(users, 0)).toBe(false);
    expect(wouldExceedUserQuota(users, 1)).toBe(true);
  });

  it('buildOrgQuotaSnapshot flags past_due as blocking', () => {
    const snap = buildOrgQuotaSnapshot(
      sampleBilling({ subscription: { status: 'past_due' } as BillingSubscriptionResponse['subscription'] })
    );
    expect(snap.blocksUsage).toBe(true);
    expect(snap.isPastDue).toBe(true);
  });

  it('uses usagePeriod.periodEnd when provided', () => {
    const snap = buildOrgQuotaSnapshot(sampleBilling());
    expect(snap.usageResetAt).toBe('2026-07-01T00:00:00.000Z');
  });

  it('calendarMonthResetAt returns ISO for next calendar month', () => {
    const from = new Date(2026, 5, 15);
    const iso = calendarMonthResetAt(from);
    const next = new Date(iso);
    expect(next.getFullYear()).toBe(2026);
    expect(next.getMonth()).toBe(6);
    expect(next.getDate()).toBe(1);
  });
});
