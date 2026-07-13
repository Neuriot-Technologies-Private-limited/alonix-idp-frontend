import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { isAllowedStripeCheckoutUrl, redirectToStripeCheckout } from '../utils/stripeCheckoutUrl';

describe('isAllowedStripeCheckoutUrl', () => {
  it('allows checkout.stripe.com URLs', () => {
    expect(isAllowedStripeCheckoutUrl('https://checkout.stripe.com/c/pay/cs_test_123')).toBe(true);
  });

  it('allows billing.stripe.com URLs', () => {
    expect(isAllowedStripeCheckoutUrl('https://billing.stripe.com/p/session/abc123')).toBe(true);
  });

  it('rejects other https origins', () => {
    expect(isAllowedStripeCheckoutUrl('https://evil.example.com/checkout.stripe.com')).toBe(false);
  });

  it('rejects lookalike subdomains and suffix tricks', () => {
    expect(isAllowedStripeCheckoutUrl('https://checkout.stripe.com.evil.com/')).toBe(false);
    expect(isAllowedStripeCheckoutUrl('https://evil-checkout.stripe.com/')).toBe(false);
    expect(isAllowedStripeCheckoutUrl('https://notcheckout.stripe.com.attacker.io/')).toBe(false);
  });

  it('rejects non-https schemes', () => {
    expect(isAllowedStripeCheckoutUrl('javascript:alert(1)')).toBe(false);
    expect(isAllowedStripeCheckoutUrl('http://checkout.stripe.com/')).toBe(false);
    expect(isAllowedStripeCheckoutUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
  });

  it('rejects malformed or empty input', () => {
    expect(isAllowedStripeCheckoutUrl('')).toBe(false);
    expect(isAllowedStripeCheckoutUrl('not a url')).toBe(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(isAllowedStripeCheckoutUrl(undefined as any)).toBe(false);
  });
});

describe('redirectToStripeCheckout', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    // @ts-expect-error - jsdom allows reassigning window.location for tests
    delete window.location;
    // @ts-expect-error - minimal stub sufficient for href assignment checks
    window.location = { href: '' };
  });

  afterEach(() => {
    window.location = originalLocation;
  });

  it('navigates when the URL is an allowlisted Stripe host', () => {
    redirectToStripeCheckout('https://checkout.stripe.com/c/pay/cs_test_123');
    expect(window.location.href).toBe('https://checkout.stripe.com/c/pay/cs_test_123');
  });

  it('does not navigate when the URL is not allowlisted', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    redirectToStripeCheckout('https://evil.example.com/steal');
    expect(window.location.href).toBe('');
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
