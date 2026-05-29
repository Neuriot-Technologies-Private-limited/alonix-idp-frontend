import type { AxiosError } from 'axios';

export const QUOTA_ERROR_CODES = new Set([
  'DOCUMENT_QUOTA_REACHED',
  'CONNECTOR_LIMIT_REACHED',
  'USER_LIMIT_REACHED',
  'STORAGE_QUOTA_REACHED',
  'SUBSCRIPTION_PAST_DUE',
  'BILLING_UNAVAILABLE',
]);

export type QuotaErrorPayload = {
  error?: string;
  message?: string;
  current?: number;
  limit?: number;
  plan?: string;
};

export function parseQuotaError(err: unknown): QuotaErrorPayload | null {
  if (err == null || typeof err !== 'object') return null;
  const ax = err as AxiosError<QuotaErrorPayload>;
  const status = ax.response?.status;
  const data = ax.response?.data;
  if (!data?.error || (status !== 402 && status !== 503)) return null;
  if (!QUOTA_ERROR_CODES.has(data.error)) return null;
  return data;
}

/** User-facing message with optional upgrade hint for billing limits. */
export function quotaErrorMessage(err: unknown, fallback = 'Plan limit reached.'): string {
  const q = parseQuotaError(err);
  if (!q) {
    if (err == null || typeof err !== 'object') return fallback;
    const ax = err as AxiosError<{ message?: string; error?: string }>;
    return ax.response?.data?.message || ax.message || fallback;
  }
  if (q.error === 'SUBSCRIPTION_PAST_DUE') {
    return `${q.message || fallback} Open Organization Settings → Subscription to update billing.`;
  }
  if (QUOTA_ERROR_CODES.has(q.error || '')) {
    return `${q.message || fallback} Open Organization Settings → Subscription to upgrade your plan.`;
  }
  return q.message || fallback;
}

export function isQuotaError(err: unknown): boolean {
  return parseQuotaError(err) != null;
}
