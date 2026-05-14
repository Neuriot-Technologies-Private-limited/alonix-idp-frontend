// ── Billing utilities ─────────────────────────────────────────────────────────

export const ANNUAL_DISCOUNT = 0.20; // 20 % off annually

// Minimal plan shape required by billing helpers — avoids importing the full
// PricingPlan interface from a UI component into a util module.
export interface BillingPlanLike {
  priceMonthlyUsd: number;
}

/** Returns the effective monthly price for the given billing cycle. */
export function monthlyPrice(
  plan: BillingPlanLike,
  cycle: 'monthly' | 'annually',
): number {
  if (cycle === 'monthly') return plan.priceMonthlyUsd;
  return Math.round(plan.priceMonthlyUsd * (1 - ANNUAL_DISCOUNT));
}

/** Total amount charged once a year on the annual plan. */
export function annualTotal(plan: BillingPlanLike): number {
  return Math.round(plan.priceMonthlyUsd * (1 - ANNUAL_DISCOUNT) * 12);
}

/** Dollar amount saved per year by choosing annual over monthly. */
export function annualSavings(plan: BillingPlanLike): number {
  return plan.priceMonthlyUsd * 12 - annualTotal(plan);
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
