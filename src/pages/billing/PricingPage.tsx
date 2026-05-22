import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Check, Zap, ArrowRight,
  Loader2, Sparkles, Star, Building2, Mail,
} from 'lucide-react';

import { useQuery, useMutation } from '@tanstack/react-query';
import apiClient from '../../services/api/client';
import { useAuthStore } from '../../stores/authStore';
import { cn } from '../../utils/cn';
import {
  monthlyPrice,
  annualTotal,
  annualSavings,
  stripePriceIdForCycle,
  annualDiscountPercent,
  limitLabel,
  fmtBytes,
  type BillingCycle,
} from '../../utils/billingUtils';
import { BillingCycleToggle } from '../../components/admin/BillingCycleToggle';
import BrandHomeLink from '../../components/branding/BrandHomeLink';
import { useTranslation } from 'react-i18next';
import { useBrand } from '../../brand/useBrand';
import {
  fetchBillingPlans,
  fetchBillingConfig,
  sortBillingPlans,
  connectorQuotaLabel,
  type BillingPlan,
} from '../../services/billingService';

// ── Plan styling ──────────────────────────────────────────────────────────
const planStyles: Record<string, {
  gradient: string;
  accent: string;
  badge?: string;
  icon: React.ReactNode;
  featured?: boolean;
}> = {
  FREE: {
    gradient: 'from-slate-700 to-slate-900',
    accent: 'border-slate-700/30',
    icon: <Zap className="h-5 w-5" />,
  },
  STARTER: {
    gradient: 'from-blue-600 to-info',
    accent: 'border-info/40',
    icon: <Star className="h-5 w-5" />,
  },
  PRO: {
    gradient: 'from-violet to-purple-700',
    accent: 'border-violet/40',
    badge: 'Most Popular',
    featured: true,
    icon: <Sparkles className="h-5 w-5" />,
  },
  ENTERPRISE: {
    gradient: 'from-amber-500 to-orange-600',
    accent: 'border-amber-500/40',
    icon: <Building2 className="h-5 w-5" />,
  },
};

// ── Feature list per plan ────────────────────────────────────────────────
function getPlanFeatures(plan: BillingPlan): string[] {
  const docs  = limitLabel(plan.limits.maxDocumentsMonth);
  const users = limitLabel(plan.limits.maxUsers);
  const stor  = fmtBytes(plan.limits.maxStorageBytes);

  return [
    `${docs} documents / month`,
    connectorQuotaLabel(plan.limits.maxConnectors),
    `${users} team member${plan.limits.maxUsers === 1 ? '' : 's'}`,
    `${stor} storage`,
    ...(plan.name === 'FREE'    ? ['Email & Fax ingestion', 'Basic AI extraction'] : []),
    ...(plan.name === 'STARTER' ? ['All connector types', 'Priority processing', 'SharePoint sync'] : []),
    ...(plan.name === 'PRO'     ? ['All connector types', 'API ingestion', 'Advanced classification', 'Audit logs'] : []),
    ...(plan.name === 'ENTERPRISE' ? ['Custom SLAs', 'Dedicated support', 'On-prem deployment', 'Custom integrations'] : []),
  ];
}

// ── Plan Card ─────────────────────────────────────────────────────────────
interface PlanCardProps {
  plan: BillingPlan;
  cycle: BillingCycle;
  currentPlanName?: string;
  onUpgrade: (planName: string, billingCycle: BillingCycle) => void;
  upgrading: string | null;
}

const PlanCard: React.FC<PlanCardProps> = ({ plan, cycle, currentPlanName, onUpgrade, upgrading }) => {
  const brand = useBrand();
  const style = planStyles[plan.name] || planStyles.FREE;
  const isCurrent = plan.name === currentPlanName;
  const features = getPlanFeatures(plan);
  const isEnterprise = plan.name === 'ENTERPRISE';
  const isLoading = upgrading === plan.name;
  const mo = monthlyPrice(plan, cycle);
  const yearly = annualTotal(plan);
  const checkoutPriceId = stripePriceIdForCycle(plan, cycle);

  const ctaClass =
    'w-full min-h-12 flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-black transition-all disabled:opacity-50';

  return (
    <div className={cn(
      'relative flex h-full flex-col rounded-3xl border bg-surface-lowest overflow-hidden transition-all duration-300',
      style.featured
        ? 'border-violet/40 shadow-2xl shadow-violet/10 ring-1 ring-violet/20'
        : 'border-border/20 hover:border-border/40 hover:shadow-xl',
    )}>
      {/* Top accent */}
      <div className={cn('h-1 w-full bg-gradient-to-r', style.gradient)} />

      {style.badge && (
        <div className="absolute -top-px right-6">
          <span className="inline-block bg-violet text-white text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-b-xl shadow">
            {style.badge}
          </span>
        </div>
      )}

      <div className="flex h-full min-h-0 flex-1 flex-col p-6">
        {/* Plan header */}
        <div className="flex items-center gap-3 mb-4">
          <div className={cn(
            'h-10 w-10 rounded-2xl flex items-center justify-center text-white shadow-md bg-gradient-to-br',
            style.gradient,
          )}>
            {style.icon}
          </div>
          <div>
            <h3 className="font-black text-foreground">{plan.displayName}</h3>
            <p className="text-[11px] text-muted-foreground">{plan.description}</p>
          </div>
        </div>

        {/* Price */}
        <div className="mb-5 min-h-[5.25rem]">
          {plan.priceMonthlyUsd === 0 && !isEnterprise ? (
            <div className="text-3xl font-black text-foreground">Free</div>
          ) : isEnterprise ? (
            <div className="text-3xl font-black text-foreground">Custom</div>
          ) : (
            <>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-foreground tabular-nums">${mo}</span>
                <span className="text-sm text-muted-foreground font-medium">/month</span>
                {cycle === 'annually' && (
                  <span className="ml-1 text-xs font-bold text-muted-foreground/50 line-through tabular-nums">
                    ${plan.priceMonthlyUsd}
                  </span>
                )}
              </div>
              {cycle === 'annually' ? (
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  <span className="text-xs font-bold text-emerald-500 tabular-nums">
                    ${yearly} billed annually
                  </span>
                  <span className="text-[9px] font-black bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">
                    save ${annualSavings(plan)}
                  </span>
                </div>
              ) : (
                <div className="text-[11px] text-muted-foreground/60 mt-0.5">billed monthly</div>
              )}
            </>
          )}
        </div>

        {/* Features */}
        <ul className="mb-0 flex-1 space-y-2.5">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5 text-sm">
              <Check className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />
              <span className="text-muted-foreground">{feature}</span>
            </li>
          ))}
        </ul>

        <div className="mt-auto shrink-0 pt-6">
          {isCurrent ? (
            <div className={cn(ctaClass, 'bg-surface-highest/20 border border-border/20 text-muted-foreground font-bold')}>
              <Check className="h-4 w-4 shrink-0 text-success" />
              Current Plan
            </div>
          ) : isEnterprise ? (
            <a
              href={`mailto:${brand.salesEmail}?subject=Enterprise%20Plan%20Enquiry`}
              id="contact-sales-btn"
              className={cn(ctaClass, 'bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:opacity-90 shadow-lg shadow-amber-500/20')}
            >
              <Mail className="h-4 w-4 shrink-0" />
              Contact Sales
            </a>
          ) : (
            <button
              id={`upgrade-to-${plan.name.toLowerCase()}-btn`}
              type="button"
              title={!checkoutPriceId && !isEnterprise ? 'This billing interval is not configured in Stripe yet.' : undefined}
              onClick={() => onUpgrade(plan.name, cycle)}
              disabled={!!upgrading || !checkoutPriceId}
              className={cn(
                ctaClass,
                'hover:scale-[1.02] disabled:hover:scale-100',
                style.featured
                  ? 'bg-gradient-to-r from-violet to-purple-600 text-white shadow-lg shadow-violet/20'
                  : 'bg-foreground text-background hover:opacity-90',
              )}
            >
              {isLoading
                ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                : <ArrowRight className="h-4 w-4 shrink-0" />}
              {plan.name === 'FREE' ? 'Downgrade' : 'Upgrade'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────
export const PricingPage: React.FC = () => {
  const { t } = useTranslation('billing');
  const brand = useBrand();
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const context = useAuthStore((s) => s.context);
  const orgId = context?.orgId;
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');

  // Check for Stripe redirect result
  const [upgradeResult, setUpgradeResult] = useState<'success' | 'canceled' | null>(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('upgrade') === 'success') setUpgradeResult('success');
    if (params.get('upgrade') === 'canceled') setUpgradeResult('canceled');
  }, []);

  const { data: plans = [], isLoading: plansLoading, isError: plansError } = useQuery({
    queryKey: ['plans'],
    queryFn: fetchBillingPlans,
    staleTime: 5 * 60 * 1000,
  });

  const { data: billingConfig } = useQuery({
    queryKey: ['billing-config'],
    queryFn: fetchBillingConfig,
    staleTime: 60_000,
  });

  const { data: billingData } = useQuery<{ plan: { name: string } }>({
    queryKey: ['billing-subscription', orgId],
    queryFn: async () => {
      const { data } = await apiClient.get('/billing/subscription');
      return data;
    },
    enabled: !!token && !!orgId,
  });

  const [upgrading, setUpgrading] = useState<string | null>(null);

  const checkoutMutation = useMutation({
    mutationFn: async (vars: { planName: string; billingCycle: BillingCycle }) => {
      setUpgrading(vars.planName);
      const { data } = await apiClient.post<{ url: string }>('/billing/checkout-session', vars);
      return data;
    },
    onSuccess: ({ url }) => { window.location.href = url; },
    onSettled: () => setUpgrading(null),
  });

  const handleUpgrade = (planName: string, cycle: BillingCycle) => {
    if (!token) {
      navigate('/signup');
      return;
    }
    checkoutMutation.mutate({ planName, billingCycle: cycle });
  };

  const currentPlanName = billingData?.plan?.name;

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 z-50 w-full border-b border-border/10 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <BrandHomeLink />
          <Link
            to="/login"
            className="text-sm font-bold font-display text-muted-foreground hover:text-primary transition-colors"
          >
            Login
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative overflow-hidden pt-24 pb-16 px-4 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />
        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full mb-6 uppercase tracking-widest">
            <Sparkles className="h-3.5 w-3.5" />
            Simple, transparent pricing
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-foreground tracking-tight leading-tight">
            {t('pricing.title')}
            <br />
            <span className="bg-gradient-to-r from-primary to-violet bg-clip-text text-transparent">
              {t('pricing.titleBrand', { brandName: brand.name })}
            </span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            From free exploration to enterprise-grade automation — choose the plan that fits your team.
          </p>
          <div className="mt-8 flex justify-center">
            <BillingCycleToggle
              cycle={billingCycle}
              onChange={setBillingCycle}
              discountPercent={annualDiscountPercent(sortBillingPlans(plans)[0])}
            />
          </div>
        </div>
      </div>

      {/* Stripe redirect banners */}
      {upgradeResult === 'success' && (
        <div className="max-w-5xl mx-auto px-4 mb-6">
          <div className="flex items-center gap-3 rounded-2xl bg-success/10 border border-success/30 px-5 py-3 text-success font-bold text-sm">
            <Check className="h-5 w-5 shrink-0" />
            Your subscription has been upgraded! Welcome to your new plan.
          </div>
        </div>
      )}
      {upgradeResult === 'canceled' && (
        <div className="max-w-5xl mx-auto px-4 mb-6">
          <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 px-5 py-3 text-amber-600 dark:text-amber-400 font-bold text-sm">
            Upgrade canceled — you're still on your current plan.
          </div>
        </div>
      )}

      {billingConfig && token && (!billingConfig.stripeConfigured || !billingConfig.checkoutReady) && (
        <div className="max-w-3xl mx-auto px-4 mb-6">
          <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 px-4 py-3 text-sm text-amber-200/90 text-center">
            Paid checkout is not configured on the server yet. Plans and limits below are live from your account API.
          </div>
        </div>
      )}

      {/* Plan grid */}
      <div className="max-w-6xl mx-auto px-4 pb-24">
        {plansLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/40" />
          </div>
        ) : plansError ? (
          <p className="text-center text-muted-foreground py-12">Could not load plans. Please try again later.</p>
        ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 items-stretch">
          {sortBillingPlans(plans).map((plan) => (
            <PlanCard
              key={plan._id}
              plan={plan}
              cycle={billingCycle}
              currentPlanName={currentPlanName}
              onUpgrade={handleUpgrade}
              upgrading={upgrading}
            />
          ))}
        </div>
        )}

        {/* FAQ / trust signals */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          {[
            { emoji: '🔒', title: 'Secure by default', body: 'SOC 2 aligned architecture. All data encrypted at rest and in transit.' },
            { emoji: '💳', title: 'No lock-in', body: 'Cancel anytime. Downgrade to Free whenever you want — no questions asked.' },
            { emoji: '🚀', title: 'Instant activation', body: 'Upgrade and your limits increase immediately. No re-login required.' },
          ].map(({ emoji, title, body }) => (
            <div key={title} className="rounded-2xl border border-border/20 p-6 bg-surface-lowest">
              <div className="text-3xl mb-3">{emoji}</div>
              <h3 className="font-black text-foreground mb-1">{title}</h3>
              <p className="text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
