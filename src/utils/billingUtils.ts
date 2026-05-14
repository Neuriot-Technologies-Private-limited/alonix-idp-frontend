// ── Billing utilities ─────────────────────────────────────────────────────────

export type BillingCycle = 'monthly' | 'annually';

/** Fallback when API does not attach `annualDiscountFraction` (older caches). */
const DEFAULT_ANNUAL_DISCOUNT_FRACTION = 0.2;

function discountFractionForPlan(plan?: { annualDiscountFraction?: number }): number {
  const d = plan?.annualDiscountFraction;
  if (typeof d === 'number' && Number.isFinite(d) && d >= 0 && d < 1) return d;
  return DEFAULT_ANNUAL_DISCOUNT_FRACTION;
}

/** @deprecated use per-plan annualDiscountFraction from GET /billing/plans */
export const ANNUAL_DISCOUNT = DEFAULT_ANNUAL_DISCOUNT_FRACTION;

/** Stripe price id for checkout for the selected billing cycle (from GET /billing/plans). */
export function stripePriceIdForCycle(
  plan: {
    stripePriceId?: string | null;
    stripePriceIdMonthly?: string | null;
    stripePriceIdYearly?: string | null;
  },
  cycle: BillingCycle,
): string | null {
  if (cycle === 'annually') return plan.stripePriceIdYearly ?? null;
  return plan.stripePriceIdMonthly ?? plan.stripePriceId ?? null;
}

// Minimal plan shape required by billing helpers — avoids importing the full
// PricingPlan interface from a UI component into a util module.
export interface BillingPlanLike {
  priceMonthlyUsd: number;
  /** From API (GET /billing/plans); drives annual display math. */
  annualDiscountFraction?: number;
}

/** Returns the effective monthly-equivalent price shown for the given billing cycle. */
export function monthlyPrice(plan: BillingPlanLike, cycle: BillingCycle): number {
  if (cycle === 'monthly') return plan.priceMonthlyUsd;
  const disc = discountFractionForPlan(plan);
  return Math.round(plan.priceMonthlyUsd * (1 - disc));
}

/** Total amount shown for one year on the annual plan (marketing display). */
export function annualTotal(plan: BillingPlanLike): number {
  const disc = discountFractionForPlan(plan);
  return Math.round(plan.priceMonthlyUsd * (1 - disc) * 12);
}

/** Dollar amount saved per year vs twelve list-price months (display). */
export function annualSavings(plan: BillingPlanLike): number {
  return plan.priceMonthlyUsd * 12 - annualTotal(plan);
}

/** Integer percent for badges (e.g. 20 for −20%). */
export function annualDiscountPercent(plan?: { annualDiscountFraction?: number }): number {
  return Math.round(discountFractionForPlan(plan) * 100);
}

/** Human-readable byte size string. Returns "Unlimited" for -1. */
export function fmtBytes(bytes: number): string {
  if (bytes === -1) return 'Unlimited';
  const gb = bytes / 1_073_741_824;
  if (gb >= 1) return `${gb.toFixed(0)} GB`;
  return `${(bytes / 1_048_576).toFixed(0)} MB`;
}

/** Human-readable limit label. Returns "Unlimited" for -1, else the number as string. */
export function limitLabel(n: number): string {
  return n === -1 ? 'Unlimited' : String(n);
}
