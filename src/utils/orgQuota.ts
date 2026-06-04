import type { BillingSubscriptionResponse } from '../services/billingService';

export type OrgQuotaMetricKey =
  | 'documentsMonth'
  | 'questionsMonth'
  | 'connectors'
  | 'users'
  | 'storageBytes';

export interface OrgQuotaMetric {
  key: OrgQuotaMetricKey;
  used: number;
  limit: number;
  remaining: number | null;
  atCap: boolean;
  notIncluded: boolean;
  unlimited: boolean;
  isMonthly: boolean;
}

export interface OrgQuotaSnapshot {
  metrics: Record<OrgQuotaMetricKey, OrgQuotaMetric>;
  periodEnd: string | null;
  usageResetAt: string | null;
  subscriptionStatus: string | null;
  isPastDue: boolean;
  blocksUsage: boolean;
}

export function computeRemaining(used: number, limit: number): number | null {
  if (limit === -1) return null;
  if (limit <= 0) return 0;
  return Math.max(0, limit - used);
}

export function isAtQuotaCap(used: number, limit: number): boolean {
  if (limit === -1) return false;
  if (limit === 0) return true;
  return used >= limit;
}

export function wouldExceedUserQuota(metric: OrgQuotaMetric, additionalUsers: number): boolean {
  if (metric.unlimited) return false;
  const add = Math.max(0, additionalUsers);
  return metric.used + add > metric.limit;
}

export function calendarMonthResetAt(from: Date = new Date()): string {
  const next = new Date(from.getFullYear(), from.getMonth() + 1, 1);
  return next.toISOString();
}

function metric(
  key: OrgQuotaMetricKey,
  used: number,
  limit: number,
  isMonthly: boolean
): OrgQuotaMetric {
  const unlimited = limit === -1;
  const notIncluded = limit === 0 && (key === 'connectors' || key === 'storageBytes');
  return {
    key,
    used,
    limit,
    remaining: computeRemaining(used, limit),
    atCap: isAtQuotaCap(used, limit) || (limit === 0 && key === 'connectors'),
    notIncluded,
    unlimited,
    isMonthly,
  };
}

export function buildOrgQuotaSnapshot(data: BillingSubscriptionResponse): OrgQuotaSnapshot {
  const limits = data.limits;
  const usage = data.usage;
  const periodEnd = data.subscription?.currentPeriodEnd ?? null;
  const usageResetAt =
    data.usagePeriod?.periodEnd ?? calendarMonthResetAt();

  const metrics: Record<OrgQuotaMetricKey, OrgQuotaMetric> = {
    documentsMonth: metric(
      'documentsMonth',
      usage.docsThisMonth ?? 0,
      limits.maxDocumentsMonth ?? 50,
      true
    ),
    questionsMonth: metric(
      'questionsMonth',
      usage.questionsThisMonth ?? 0,
      limits.maxQuestionsMonth ?? 50,
      true
    ),
    connectors: metric('connectors', usage.connectors ?? 0, limits.maxConnectors ?? 0, false),
    users: metric('users', usage.users ?? 0, limits.maxUsers ?? 3, false),
    storageBytes: metric(
      'storageBytes',
      usage.storageBytes ?? 0,
      limits.maxStorageBytes ?? -1,
      false
    ),
  };

  const status = data.subscription?.status ?? null;
  return {
    metrics,
    periodEnd,
    usageResetAt,
    subscriptionStatus: status,
    isPastDue: status === 'past_due',
    blocksUsage: status === 'past_due',
  };
}

export const QUOTA_CAP_HINT: Record<OrgQuotaMetricKey, string> = {
  documentsMonth: 'Document quota reached for this month.',
  questionsMonth: 'Q&A quota reached for this month.',
  connectors: 'Connector limit reached on your plan.',
  users: 'Team member limit reached on your plan.',
  storageBytes: 'Storage limit reached on your plan.',
};
