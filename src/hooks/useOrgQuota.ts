import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { isSelfServeBillingEnabled } from '../brand/brandConfig';
import {
  fetchBillingSubscription,
  type BillingSubscriptionResponse,
} from '../services/billingService';
import {
  buildOrgQuotaSnapshot,
  QUOTA_CAP_HINT,
  type OrgQuotaMetricKey,
  type OrgQuotaSnapshot,
} from '../utils/orgQuota';

export function billingSubscriptionQueryKey(orgId?: string | null) {
  return ['billing-subscription', orgId] as const;
}

export interface UseOrgQuotaOptions {
  enabled?: boolean;
}

export interface UseOrgQuotaResult {
  saasBilling: boolean;
  isLoading: boolean;
  isError: boolean;
  raw: BillingSubscriptionResponse | undefined;
  quota: OrgQuotaSnapshot | null;
  atCap: (key: OrgQuotaMetricKey, opts?: { additional?: number }) => boolean;
  capMessage: (key: OrgQuotaMetricKey) => string;
  blocksUsage: boolean;
}

export function useOrgQuota(options?: UseOrgQuotaOptions): UseOrgQuotaResult {
  const saasBilling = isSelfServeBillingEnabled();
  const orgId = useAuthStore((s) => s.context?.orgId);
  const enabled = !!orgId && (options?.enabled ?? saasBilling);

  const { data, isLoading, isError } = useQuery({
    queryKey: billingSubscriptionQueryKey(orgId),
    queryFn: fetchBillingSubscription,
    enabled,
    staleTime: 30_000,
  });

  const quota = data && saasBilling ? buildOrgQuotaSnapshot(data) : null;

  const atCap = (key: OrgQuotaMetricKey, opts?: { additional?: number }) => {
    if (!quota) return false;
    if (quota.blocksUsage) return true;
    const m = quota.metrics[key];
    if (!m) return false;
    if (key === 'users' && opts?.additional) {
      return m.used + opts.additional > m.limit && m.limit !== -1;
    }
    return m.atCap;
  };

  const capMessage = (key: OrgQuotaMetricKey) => {
    const base = QUOTA_CAP_HINT[key] || 'Plan limit reached.';
    return `${base} Open Organization Settings → Subscription to upgrade your plan.`;
  };

  return {
    saasBilling,
    isLoading: enabled && isLoading,
    isError,
    raw: data,
    quota,
    atCap,
    capMessage,
    blocksUsage: quota?.blocksUsage ?? false,
  };
}
