import apiClient from './api/client';
import { fmtBytes, limitLabel, stripePriceIdForCycle, type BillingCycle } from '../utils/billingUtils';

/** Plan document from GET /billing/plans or subscription.plan (enriched on server). */
export interface BillingPlan {
  _id: string;
  name: string;
  displayName: string;
  description: string;
  priceMonthlyUsd: number;
  limits: {
    maxConnectors: number;
    maxDocumentsMonth: number;
    maxUsers: number;
    maxStorageBytes: number;
  };
  stripePriceId?: string | null;
  stripePriceIdMonthly?: string | null;
  stripePriceIdYearly?: string | null;
  annualDiscountFraction?: number;
}

export interface BillingConfig {
  stripeConfigured: boolean;
  checkoutReady: boolean;
  publicAppUrl?: string;
  annualDiscountFraction?: number;
  plans?: Array<{
    name: string;
    stripePriceIdMonthly: string | null;
    stripePriceIdYearly: string | null;
    checkoutMonthly?: boolean;
    checkoutYearly?: boolean;
  }>;
}

export interface BillingSubscriptionResponse {
  plan: BillingPlan;
  subscription: {
    status: string;
    currentPeriodEnd: string | null;
    trialEndsAt: string | null;
    cancelAtPeriodEnd: boolean;
  };
  usage: {
    docsThisMonth: number;
    connectors: number;
    users: number;
    storageBytes: number;
  };
  limits: BillingPlan['limits'];
}

export const PLAN_ORDER: Record<string, number> = {
  FREE: 0,
  STARTER: 1,
  PRO: 2,
  ENTERPRISE: 3,
};

export function sortBillingPlans<T extends { name: string }>(plans: T[]): T[] {
  return [...plans].sort((a, b) => (PLAN_ORDER[a.name] ?? 99) - (PLAN_ORDER[b.name] ?? 99));
}

/** Next self-serve paid tier (skips ENTERPRISE). */
export function getNextUpgradePlan(
  currentPlanName: string,
  plans: BillingPlan[],
): BillingPlan | null {
  const sorted = sortBillingPlans(plans).filter((p) => p.name !== 'ENTERPRISE');
  const idx = sorted.findIndex((p) => p.name === currentPlanName);
  if (idx < 0) return null;
  for (let i = idx + 1; i < sorted.length; i++) {
    const candidate = sorted[i];
    if (candidate.priceMonthlyUsd > 0) return candidate;
  }
  return null;
}

export function connectorQuotaLabel(count: number): string {
  if (count === -1) return 'Unlimited connectors';
  if (count === 0) return 'No connectors';
  return `${limitLabel(count)} connector${count === 1 ? '' : 's'}`;
}

/** Short quota pills for upgrade CTAs (from API limits). */
export function planQuotaPills(plan: BillingPlan): string[] {
  return [
    connectorQuotaLabel(plan.limits.maxConnectors),
    `${limitLabel(plan.limits.maxDocumentsMonth)} docs/mo`,
    `${limitLabel(plan.limits.maxUsers)} users`,
    `${fmtBytes(plan.limits.maxStorageBytes)} storage`,
  ];
}

/** One-line upgrade pitch using backend plan fields only. */
export function upgradePitch(_current: BillingPlan, target: BillingPlan): string {
  const conn = connectorQuotaLabel(target.limits.maxConnectors).toLowerCase();
  const docs = limitLabel(target.limits.maxDocumentsMonth);
  const users = limitLabel(target.limits.maxUsers);
  return `Get ${conn}, ${docs} documents/month, and ${users} team members for $${target.priceMonthlyUsd}/mo.`;
}

export function isPlanCheckoutAvailable(plan: BillingPlan, cycle: BillingCycle): boolean {
  if (plan.name === 'FREE' || plan.name === 'ENTERPRISE') return false;
  return !!stripePriceIdForCycle(plan, cycle);
}

export async function fetchBillingPlans(): Promise<BillingPlan[]> {
  const { data } = await apiClient.get<BillingPlan[]>('/billing/plans');
  return data;
}

export async function fetchBillingConfig(): Promise<BillingConfig> {
  const { data } = await apiClient.get<BillingConfig>('/billing/config');
  return data;
}

export async function fetchBillingSubscription(): Promise<BillingSubscriptionResponse> {
  const { data } = await apiClient.get<BillingSubscriptionResponse>('/billing/subscription');
  return data;
}
