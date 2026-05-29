import { describe, it, expect } from 'vitest';
import type { AxiosError } from 'axios';
import {
  QUOTA_ERROR_CODES,
  parseQuotaError,
  quotaErrorMessage,
  isQuotaError,
} from '../utils/billingQuota';

function makeAxiosError(status: number, data: Record<string, unknown>): AxiosError {
  return {
    response: { status, data },
    message: 'Request failed',
  } as unknown as AxiosError;
}

describe('QUOTA_ERROR_CODES', () => {
  it('contains all expected billing error codes', () => {
    expect(QUOTA_ERROR_CODES.has('DOCUMENT_QUOTA_REACHED')).toBe(true);
    expect(QUOTA_ERROR_CODES.has('CONNECTOR_LIMIT_REACHED')).toBe(true);
    expect(QUOTA_ERROR_CODES.has('USER_LIMIT_REACHED')).toBe(true);
    expect(QUOTA_ERROR_CODES.has('STORAGE_QUOTA_REACHED')).toBe(true);
    expect(QUOTA_ERROR_CODES.has('SUBSCRIPTION_PAST_DUE')).toBe(true);
    expect(QUOTA_ERROR_CODES.has('BILLING_UNAVAILABLE')).toBe(true);
  });

  it('does not contain non-billing codes', () => {
    expect(QUOTA_ERROR_CODES.has('NOT_FOUND')).toBe(false);
    expect(QUOTA_ERROR_CODES.has('UNAUTHORIZED')).toBe(false);
  });
});

describe('parseQuotaError', () => {
  it('returns payload for a valid 402 quota error', () => {
    const err = makeAxiosError(402, {
      error: 'DOCUMENT_QUOTA_REACHED',
      message: 'Document quota exceeded',
      current: 100,
      limit: 100,
    });
    const result = parseQuotaError(err);
    expect(result).not.toBeNull();
    expect(result?.error).toBe('DOCUMENT_QUOTA_REACHED');
    expect(result?.current).toBe(100);
    expect(result?.limit).toBe(100);
  });

  it('returns payload for a valid 503 billing-unavailable error', () => {
    const err = makeAxiosError(503, {
      error: 'BILLING_UNAVAILABLE',
      message: 'Billing service unreachable',
    });
    expect(parseQuotaError(err)).not.toBeNull();
  });

  it('returns null for a 200 response', () => {
    const err = makeAxiosError(200, { error: 'DOCUMENT_QUOTA_REACHED' });
    expect(parseQuotaError(err)).toBeNull();
  });

  it('returns null for a 404 response', () => {
    const err = makeAxiosError(404, { error: 'DOCUMENT_QUOTA_REACHED' });
    expect(parseQuotaError(err)).toBeNull();
  });

  it('returns null when error code is not a quota code', () => {
    const err = makeAxiosError(402, { error: 'PAYMENT_METHOD_REQUIRED' });
    expect(parseQuotaError(err)).toBeNull();
  });

  it('returns null when data has no error field', () => {
    const err = makeAxiosError(402, { message: 'Something went wrong' });
    expect(parseQuotaError(err)).toBeNull();
  });

  it('returns null for generic errors without axios response', () => {
    expect(parseQuotaError(new Error('network error'))).toBeNull();
    expect(parseQuotaError(null)).toBeNull();
    expect(parseQuotaError(undefined)).toBeNull();
  });
});

describe('isQuotaError', () => {
  it('returns true for valid quota error', () => {
    const err = makeAxiosError(402, { error: 'USER_LIMIT_REACHED', message: 'Too many users' });
    expect(isQuotaError(err)).toBe(true);
  });

  it('returns false for non-quota error', () => {
    expect(isQuotaError(new Error('generic'))).toBe(false);
  });
});

describe('quotaErrorMessage', () => {
  it('appends upgrade hint for standard quota errors', () => {
    const err = makeAxiosError(402, {
      error: 'STORAGE_QUOTA_REACHED',
      message: 'Storage limit reached.',
    });
    const msg = quotaErrorMessage(err);
    expect(msg).toContain('Storage limit reached.');
    expect(msg).toContain('Subscription to upgrade your plan.');
  });

  it('appends billing update hint for SUBSCRIPTION_PAST_DUE', () => {
    const err = makeAxiosError(402, {
      error: 'SUBSCRIPTION_PAST_DUE',
      message: 'Your subscription is past due.',
    });
    const msg = quotaErrorMessage(err);
    expect(msg).toContain('Your subscription is past due.');
    expect(msg).toContain('Subscription to update billing.');
    expect(msg).not.toContain('upgrade your plan');
  });

  it('uses provided fallback message when quota message is absent', () => {
    const err = makeAxiosError(402, { error: 'DOCUMENT_QUOTA_REACHED' });
    const msg = quotaErrorMessage(err, 'Custom fallback.');
    expect(msg).toContain('Custom fallback.');
  });

  it('uses default fallback when message is absent and no custom fallback given', () => {
    const err = makeAxiosError(402, { error: 'DOCUMENT_QUOTA_REACHED' });
    const msg = quotaErrorMessage(err);
    expect(msg).toContain('Plan limit reached.');
  });

  it('returns axios response message for non-quota axios error', () => {
    const err = makeAxiosError(403, { message: 'Forbidden' });
    expect(quotaErrorMessage(err)).toBe('Forbidden');
  });

  it('returns axios .message for error without response data message', () => {
    const err = {
      response: { status: 500, data: {} },
      message: 'Network Error',
    } as unknown as AxiosError;
    expect(quotaErrorMessage(err)).toBe('Network Error');
  });

  it('returns fallback when err is null', () => {
    expect(quotaErrorMessage(null, 'fallback text')).toBe('fallback text');
  });
});
