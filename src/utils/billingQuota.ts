import type { AxiosError } from 'axios';
import { isEnterpriseBuild } from '../brand/deploymentProfile';

export const QUOTA_ERROR_CODES = new Set([
  'DOCUMENT_QUOTA_REACHED',
  'QA_QUOTA_REACHED',
  'CONNECTOR_LIMIT_REACHED',
  'USER_LIMIT_REACHED',
  'STORAGE_QUOTA_REACHED',
  'SUBSCRIPTION_PAST_DUE',
  'BILLING_UNAVAILABLE',
]);

export const SERVICE_UNAVAILABLE_CODES = new Set(['QUEUE_UNAVAILABLE']);

export type QuotaErrorPayload = {
  error?: string;
  message?: string;
  current?: number;
  limit?: number;
  plan?: string;
};

export type ApiErrorPayload = {
  error?: string;
  message?: string;
};

const GENERIC_AXIOS_STATUS_RE = /^Request failed with status code \d+$/;

function isMachineErrorCode(value: string): boolean {
  return /^[A-Z][A-Z0-9_]*$/.test(value);
}

function asAxiosError(err: unknown): AxiosError<ApiErrorPayload> | null {
  if (err == null || typeof err !== 'object') return null;
  return err as AxiosError<ApiErrorPayload>;
}

export function parseQuotaError(err: unknown): QuotaErrorPayload | null {
  const ax = asAxiosError(err);
  if (!ax) return null;
  const status = ax.response?.status;
  const data = ax.response?.data;
  if (!data?.error || (status !== 402 && status !== 503)) return null;
  if (!QUOTA_ERROR_CODES.has(data.error)) return null;
  return data;
}

export function parseServiceUnavailable(err: unknown): ApiErrorPayload | null {
  const ax = asAxiosError(err);
  if (!ax || ax.response?.status !== 503) return null;
  const data = ax.response?.data;
  if (!data) return null;
  if (data.error && SERVICE_UNAVAILABLE_CODES.has(data.error)) return data;
  if (data.message) return data;
  if (typeof data.error === 'string' && !isMachineErrorCode(data.error)) return data;
  return null;
}

/** User-facing message for API errors (queue down, validation, etc.). */
export function apiErrorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const service = parseServiceUnavailable(err);
  if (service?.message) return service.message;

  const ax = asAxiosError(err);
  if (!ax) return fallback;

  const data = ax.response?.data;
  if (data?.message) return data.message;
  if (typeof data?.error === 'string' && !isMachineErrorCode(data.error)) {
    return data.error;
  }

  const axMsg = ax.message?.trim();
  if (axMsg && !GENERIC_AXIOS_STATUS_RE.test(axMsg)) return axMsg;
  return fallback;
}

/** User-facing message with optional upgrade hint for billing limits. */
export function quotaErrorMessage(err: unknown, fallback = 'Plan limit reached.'): string {
  const q = parseQuotaError(err);
  if (!q) return apiErrorMessage(err, fallback);
  if (isEnterpriseBuild()) {
    return q.message || fallback;
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
