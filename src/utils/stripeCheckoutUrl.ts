/**
 * Guards client-side redirects to Stripe-hosted checkout/billing-portal URLs
 * (audit XSS-002). The checkout session URL is returned by our own backend,
 * but validating it before `window.location.href` assignment prevents an
 * open-redirect / URL-injection primitive if that response is ever tampered
 * with (compromised dependency, MITM on a misconfigured proxy, etc.).
 */
const ALLOWED_STRIPE_CHECKOUT_ORIGINS = [
  'https://checkout.stripe.com',
  'https://billing.stripe.com',
] as const;

/** Returns true only for absolute URLs on an allowlisted Stripe host. */
export function isAllowedStripeCheckoutUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  return ALLOWED_STRIPE_CHECKOUT_ORIGINS.some((origin) => parsed.origin === origin);
}

/**
 * Navigates the browser to a Stripe checkout/billing-portal URL after
 * validating it against the allowlist. No-ops (and reports to console) for
 * anything else, so a bad response can never redirect the user off-platform.
 */
export function redirectToStripeCheckout(url: string): void {
  if (!isAllowedStripeCheckoutUrl(url)) {
    console.error('Blocked redirect to non-Stripe checkout URL:', url);
    return;
  }
  window.location.href = url;
}
