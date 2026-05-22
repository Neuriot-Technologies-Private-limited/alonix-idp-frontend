import React from 'react';
import { Link } from 'react-router-dom';
import { Check, Zap, Star, Sparkles, Building2, Mail, Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import {
  type BillingPlan,
  sortBillingPlans,
  connectorQuotaLabel,
} from '../../services/billingService';
import {
  monthlyPrice,
  annualTotal,
  annualSavings,
  annualDiscountPercent,
  limitLabel,
  fmtBytes,
  type BillingCycle,
} from '../../utils/billingUtils';
import { useBrand } from '../../brand/useBrand';

const PLAN_STYLES: Record<string, { gradient: string; icon: React.ReactNode; featured?: boolean; badge?: string }> = {
  FREE: { gradient: 'from-slate-700 to-slate-900', icon: <Zap className="h-5 w-5" /> },
  STARTER: { gradient: 'from-blue-600 to-info', icon: <Star className="h-5 w-5" /> },
  PRO: {
    gradient: 'from-violet to-purple-700',
    icon: <Sparkles className="h-5 w-5" />,
    featured: true,
    badge: 'Most Popular',
  },
  ENTERPRISE: { gradient: 'from-amber-500 to-orange-600', icon: <Building2 className="h-5 w-5" /> },
};

function planFeatures(plan: BillingPlan): string[] {
  const docs = limitLabel(plan.limits.maxDocumentsMonth);
  const users = limitLabel(plan.limits.maxUsers);
  const stor = fmtBytes(plan.limits.maxStorageBytes);
  return [
    `${docs} documents / month`,
    connectorQuotaLabel(plan.limits.maxConnectors),
    `${users} team member${plan.limits.maxUsers === 1 ? '' : 's'}`,
    `${stor} storage`,
  ];
}

export interface PublicPricingGridProps {
  plans: BillingPlan[];
  cycle: BillingCycle;
  isLoading?: boolean;
  error?: boolean;
  /** Primary CTA for paid tiers (e.g. signup). Enterprise uses mailto. */
  ctaHref?: string;
  ctaLabel?: string;
}

export const PublicPricingGrid: React.FC<PublicPricingGridProps> = ({
  plans,
  cycle,
  isLoading,
  error,
  ctaHref = '/signup',
  ctaLabel = 'Get started',
}) => {
  const brand = useBrand();
  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/40" />
      </div>
    );
  }

  if (error || !plans.length) {
    return (
      <p className="text-center text-sm text-muted-foreground py-12">
        Pricing is temporarily unavailable.{' '}
        <Link to="/pricing" className="text-primary font-bold hover:underline">View plans</Link>
      </p>
    );
  }

  const sorted = sortBillingPlans(plans);

  const ctaClass =
    'w-full min-h-12 flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-black transition-opacity';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 items-stretch">
      {sorted.map((plan) => {
        const style = PLAN_STYLES[plan.name] || PLAN_STYLES.FREE;
        const isEnterprise = plan.name === 'ENTERPRISE';
        const mo = monthlyPrice(plan, cycle);
        const yearly = annualTotal(plan);
        const features = planFeatures(plan);

        return (
          <div
            key={plan._id}
            className={cn(
              'relative flex h-full flex-col rounded-3xl border bg-surface-lowest overflow-hidden',
              style.featured
                ? 'border-violet/40 shadow-2xl shadow-violet/10 ring-1 ring-violet/20'
                : 'border-border/20',
            )}
          >
            <div className={cn('h-1 w-full bg-gradient-to-r', style.gradient)} />
            {style.badge && (
              <div className="absolute -top-px right-6">
                <span className="inline-block bg-violet text-white text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-b-xl">
                  {style.badge}
                </span>
              </div>
            )}
            <div className="flex h-full min-h-0 flex-1 flex-col p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={cn('h-10 w-10 rounded-2xl flex items-center justify-center text-white bg-gradient-to-br', style.gradient)}>
                  {style.icon}
                </div>
                <div>
                  <h3 className="font-black text-foreground">{plan.displayName}</h3>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">{plan.description}</p>
                </div>
              </div>
              <div className="mb-5 min-h-[5.25rem]">
                {plan.priceMonthlyUsd === 0 && !isEnterprise ? (
                  <div className="text-3xl font-black text-foreground">Free</div>
                ) : isEnterprise ? (
                  <div className="text-3xl font-black text-foreground">Custom</div>
                ) : (
                  <>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black tabular-nums">${mo}</span>
                      <span className="text-sm text-muted-foreground">/month</span>
                    </div>
                    {cycle === 'annually' && (
                      <p className="text-xs text-emerald-500 mt-1 tabular-nums">
                        ${yearly}/yr · save ${annualSavings(plan)}
                      </p>
                    )}
                  </>
                )}
              </div>
              <ul className="mb-0 flex-1 space-y-2">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-auto shrink-0 pt-6">
                {isEnterprise ? (
                  <a
                    href={`mailto:${brand.salesEmail}?subject=Enterprise%20Plan`}
                    className={cn(ctaClass, 'bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:opacity-90')}
                  >
                    <Mail className="h-4 w-4 shrink-0" /> Contact Sales
                  </a>
                ) : (
                  <Link
                    to={ctaHref}
                    className={cn(
                      ctaClass,
                      style.featured ? 'bg-violet text-white hover:opacity-90' : 'bg-foreground text-background hover:opacity-90',
                    )}
                  >
                    {plan.name === 'FREE' ? 'Start free' : ctaLabel}
                  </Link>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export function discountPercentFromPlans(plans: BillingPlan[]): number {
  const first = sortBillingPlans(plans)[0];
  return annualDiscountPercent(first);
}

export default PublicPricingGrid;
