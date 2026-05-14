import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';

import {
  CreditCard, Zap, FileText, Users, HardDrive, Crown,
  ArrowUpRight, CheckCircle2, AlertTriangle, Loader2,
  ExternalLink, TrendingUp, Calendar, Sparkles, BarChart3, X,
} from 'lucide-react';
import apiClient from '../../services/api/client';
import { useAuthStore } from '../../stores/authStore';
import { cn } from '../../utils/cn';
import { fmtBytes, stripePriceIdForCycle, type BillingCycle } from '../../utils/billingUtils';
import PricingModal from './PricingModal';
import { useAlert } from '../alert';

// ── Types ─────────────────────────────────────────────────────────────────────
interface PlanLimits {
  maxConnectors: number;
  maxDocumentsMonth: number;
  maxUsers: number;
  maxStorageBytes: number;
}

interface Plan {
  _id: string;
  name: string;
  displayName: string;
  description: string;
  priceMonthlyUsd: number;
  limits: PlanLimits;
  stripePriceId: string | null;
  stripePriceIdMonthly?: string | null;
  stripePriceIdYearly?: string | null;
  annualDiscountFraction?: number;
}

interface BillingData {
  plan: Plan;
  subscription: {
    status: string;
    currentPeriodEnd: string | null;
    trialEndsAt: string | null;
    cancelAtPeriodEnd: boolean;
  };
  usage: { docsThisMonth: number; connectors: number; users: number };
  limits: PlanLimits;
}


function limitLabel(n: number) { return n === -1 ? '∞' : String(n); }

/** Human label for plan caps: 0 means “not included”, -1 unlimited. */
function quotaLimitLabel(limit: number): string {
  if (limit === -1) return '∞';
  if (limit === 0) return 'Not included';
  return String(limit);
}

/** Short label for summary pills */
function pillQuota(n: number): string {
  if (n === -1) return '∞';
  if (n === 0) return 'None';
  return String(n);
}

function usagePct(used: number, limit: number): number {
  if (limit === -1) return 0;
  if (limit === 0) return 0;
  if (used <= 0) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

function statusBadgeClass(status: string) {
  const map: Record<string, string> = {
    active:   'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    trialing: 'bg-info/10 text-info border-info/20',
    past_due: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    canceled: 'bg-destructive/10 text-destructive border-destructive/20',
    free:     'bg-muted/10 text-muted-foreground border-border/20',
  };
  return map[status] || map.free;
}

const planGrad: Record<string, string> = {
  FREE:       'from-slate-500 to-slate-700',
  STARTER:    'from-blue-500 to-cyan-600',
  PRO:        'from-violet to-purple-600',
  ENTERPRISE: 'from-amber-400 to-orange-500',
};

// ── Usage bar ─────────────────────────────────────────────────────────────────
const UsageBar: React.FC<{
  label: string; icon: React.ReactNode;
  used: number; limit: number; displayUsed?: string; displayLimit?: string;
}> = ({ label, icon, used, limit, displayUsed, displayLimit }) => {
  const overLimit = limit > 0 && limit !== -1 && used > limit;
  const pct = usagePct(used, limit);
  const barCol = overLimit ? 'bg-destructive' : pct >= 90 ? 'bg-destructive' : pct >= 70 ? 'bg-amber-500' : 'bg-primary';
  const limitText = displayLimit ?? (limit === -1 ? limitLabel(limit) : quotaLimitLabel(limit));

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs gap-2">
        <span className="flex items-center gap-1.5 text-muted-foreground font-medium min-w-0">{icon}{label}</span>
        <span className={cn('font-bold tabular-nums shrink-0 text-right', overLimit && 'text-destructive')}>
          {displayUsed ?? used}
          <span className="font-normal text-muted-foreground"> / {limitText}</span>
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-surface-highest/20 overflow-hidden">
        {limit === -1 ? (
          <div className="h-full w-full rounded-full bg-gradient-to-r from-primary/30 via-violet/30 to-info/30" />
        ) : limit === 0 ? (
          <div className="h-full w-[2px] rounded-full bg-muted-foreground/25" aria-hidden />
        ) : (
          <div className={cn('h-full rounded-full transition-all duration-700', barCol)} style={{ width: `${overLimit ? 100 : pct}%` }} />
        )}
      </div>
      {overLimit && (
        <p className="text-[10px] font-bold text-destructive">Over plan limit — upgrade to add capacity.</p>
      )}
    </div>
  );
};

// ── Main panel component ──────────────────────────────────────────────────────
const SubscriptionPanel: React.FC = () => {
  const context = useAuthStore((s) => s.context);
  const orgId = context?.orgId;
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { alert: appAlert } = useAlert();

  const [showPlans, setShowPlans] = useState(false);

  const [upgrading, setUpgrading] = useState<string | null>(null);

  const upgradeResult = searchParams.get('upgrade') as 'success' | 'canceled' | null;

  const clearUpgradeQuery = React.useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.delete('upgrade');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  React.useEffect(() => {
    if (upgradeResult === 'success') {
      void queryClient.invalidateQueries({ queryKey: ['billing-subscription'] });
      void queryClient.invalidateQueries({ queryKey: ['plans'] });
    }
  }, [upgradeResult, queryClient]);

  const { data, isLoading, error } = useQuery<BillingData>({
    queryKey: ['billing-subscription', orgId],
    queryFn: async () => {
      const { data } = await apiClient.get<BillingData>('/billing/subscription');
      return data;
    },
    enabled: !!orgId,
    staleTime: 30_000,
  });

  const { data: allPlans = [] } = useQuery<Plan[]>({
    queryKey: ['plans'],
    queryFn: async () => (await apiClient.get<Plan[]>('/billing/plans')).data,
    staleTime: 5 * 60_000,
  });

  const checkoutMut = useMutation({
    mutationFn: async (vars: { planName: string; billingCycle?: BillingCycle }) => {
      const { planName, billingCycle = 'monthly' } = vars;
      setUpgrading(planName);
      const { data } = await apiClient.post<{ url: string }>('/billing/checkout-session', {
        planName,
        billingCycle,
      });
      return data;
    },
    onSuccess: ({ url }) => {
      window.location.href = url;
    },
    onError: async (err: unknown) => {
      const ax = err as { response?: { data?: { error?: string } }; message?: string };
      const msg = ax.response?.data?.error || ax.message || 'Could not start checkout.';
      await appAlert({ title: 'Checkout failed', description: msg, variant: 'danger' });
    },
    onSettled: () => setUpgrading(null),
  });

  const portalMut = useMutation({
    mutationFn: async () => (await apiClient.get<{ url: string }>('/billing/portal-session')).data,
    onSuccess: ({ url }) => {
      window.location.href = url;
    },
    onError: async (err: unknown) => {
      const ax = err as { response?: { data?: { error?: string } }; message?: string };
      const msg = ax.response?.data?.error || ax.message || 'Could not open billing portal.';
      await appAlert({ title: 'Portal unavailable', description: msg, variant: 'danger' });
    },
  });

  // ── Early states ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="mt-8 rounded-3xl border border-border/20 bg-surface-lowest p-8 flex items-center gap-3 text-muted-foreground text-sm">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading subscription…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mt-8 rounded-3xl border border-destructive/20 bg-destructive/5 p-6 flex items-center gap-3 text-destructive text-sm">
        <AlertTriangle className="h-5 w-5 shrink-0" />
        Unable to load billing information. Please refresh.
      </div>
    );
  }

  const { plan, subscription, usage, limits } = data;
  const grad = planGrad[plan.name] || planGrad.FREE;
  const isFreePlan = plan.name === 'FREE';
  const isPaid = !isFreePlan && subscription.status === 'active';
  const nextPlanName = plan.name === 'FREE' ? 'STARTER' : plan.name === 'STARTER' ? 'PRO' : null;
  const nextPlan = nextPlanName ? allPlans.find(p => p.name === nextPlanName) : null;

  return (
    <>
    <section
      id="subscription-panel"

      className="mt-8 rounded-3xl border border-border/20 bg-surface-lowest overflow-hidden shadow-xl"
    >
      {/* Section header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-border/10">
        <div className="flex items-center gap-2.5">
          <div className={cn('h-8 w-8 rounded-xl flex items-center justify-center text-white bg-gradient-to-br', grad)}>
            <Crown className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-black text-foreground tracking-tight">Subscription & Billing</h2>
            <p className="text-[11px] text-muted-foreground">Your current plan, usage, and upgrade options</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isPaid && (
            <button
              id="manage-billing-btn"
              onClick={() => portalMut.mutate()}
              disabled={portalMut.isPending}
              className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-xl border border-border/20 hover:border-primary/30 hover:text-primary transition-all text-muted-foreground disabled:opacity-50"
            >
              {portalMut.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <ExternalLink className="h-3 w-3" />}
              Manage Billing
            </button>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">

        {/* Stripe result banners */}
        {upgradeResult === 'success' && (
          <div className="flex flex-col gap-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5 text-emerald-400 text-sm font-bold">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Subscription updated. New limits are active.</span>
            </div>
            <button
              type="button"
              onClick={clearUpgradeQuery}
              className="inline-flex items-center justify-center gap-1 self-end rounded-lg border border-emerald-500/30 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-300 hover:bg-emerald-500/15 sm:self-auto"
            >
              <X className="h-3 w-3" aria-hidden />
              Dismiss
            </button>
          </div>
        )}
        {upgradeResult === 'canceled' && (
          <div className="flex flex-col gap-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5 text-amber-400 text-sm font-bold">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>Checkout was canceled — you are still on your current plan.</span>
            </div>
            <button
              type="button"
              onClick={clearUpgradeQuery}
              className="inline-flex items-center justify-center gap-1 self-end rounded-lg border border-amber-500/30 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-amber-300 hover:bg-amber-500/15 sm:self-auto"
            >
              <X className="h-3 w-3" aria-hidden />
              Dismiss
            </button>
          </div>
        )}

        {/* Current plan row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className={cn('h-12 w-12 rounded-2xl flex items-center justify-center text-white bg-gradient-to-br shrink-0', grad)}>
            <Crown className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-lg font-black text-foreground">{plan.displayName} Plan</span>
              <span className={cn('text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border', statusBadgeClass(subscription.status))}>
                {subscription.status}
              </span>
              {subscription.cancelAtPeriodEnd && (
                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                  Cancels at period end
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{plan.description}</p>
          </div>

          <div className="shrink-0 text-right">
            {plan.priceMonthlyUsd === 0 ? (
              <span className="text-xl font-black text-foreground">Free</span>
            ) : (
              <div>
                <span className="text-xl font-black text-foreground">${plan.priceMonthlyUsd}</span>
                <span className="text-xs text-muted-foreground">/mo</span>
              </div>
            )}
            {subscription.currentPeriodEnd && (
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5 justify-end">
                <Calendar className="h-2.5 w-2.5" />
                Renews {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

        {/* ── Usage meters ─────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-border/10 bg-surface-highest/5 p-4 space-y-4">
          <h3 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" /> Usage This Month
          </h3>
          <UsageBar label="Documents Ingested" icon={<FileText className="h-3.5 w-3.5" />} used={usage.docsThisMonth} limit={limits.maxDocumentsMonth} />
          <UsageBar label="Active Connectors"  icon={<Zap className="h-3.5 w-3.5" />}      used={usage.connectors}     limit={limits.maxConnectors} />
          <UsageBar label="Team Members"       icon={<Users className="h-3.5 w-3.5" />}     used={usage.users}          limit={limits.maxUsers} />
          <UsageBar label="Storage"            icon={<HardDrive className="h-3.5 w-3.5" />} used={0}                    limit={limits.maxStorageBytes} displayUsed={fmtBytes(0)} displayLimit={fmtBytes(limits.maxStorageBytes)} />
        </div>

        {/* ── Quick upgrade CTA (only when not on highest paid plan) ───── */}
        {nextPlan && (
          <div className="rounded-2xl border border-violet/20 bg-violet/5 p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUp className="h-3.5 w-3.5 text-violet" />
                  <span className="text-[11px] font-black text-violet uppercase tracking-wider">
                    Upgrade to {nextPlan.displayName} — ${nextPlan.priceMonthlyUsd}/mo
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {[
                    `${limitLabel(nextPlan.limits.maxConnectors)} connectors`,
                    `${limitLabel(nextPlan.limits.maxDocumentsMonth)} docs/mo`,
                    `${limitLabel(nextPlan.limits.maxUsers)} users`,
                    `${fmtBytes(nextPlan.limits.maxStorageBytes)} storage`,
                  ].map((f, idx) => (
                    <span key={`${nextPlan.name}-feat-${idx}`} className="inline-flex items-center gap-1 text-[10px] font-bold text-violet bg-violet/10 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="h-2.5 w-2.5" />{f}
                    </span>
                  ))}
                </div>
              </div>
              <button
                id={`quick-upgrade-to-${nextPlan.name.toLowerCase()}-btn`}
                type="button"
                title={!stripePriceIdForCycle(nextPlan, 'monthly') ? 'Monthly Stripe price is not configured for this plan.' : undefined}
                onClick={() => { checkoutMut.mutate({ planName: nextPlan.name, billingCycle: 'monthly' }); }}
                disabled={checkoutMut.isPending || !stripePriceIdForCycle(nextPlan, 'monthly')}
                className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-violet text-white font-black text-xs hover:bg-violet/90 transition-all hover:scale-[1.02] shadow-lg shadow-violet/20 disabled:opacity-50"
              >
                {upgrading === nextPlan.name
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <Sparkles className="h-3.5 w-3.5" />}
                Upgrade Now
              </button>
            </div>
          </div>
        )}

        {/* ── All plans modal trigger ───────────────────────────────── */}
        <div>
          <button
            id="toggle-all-plans-btn"
            onClick={() => setShowPlans(true)}
            className="group flex items-center gap-2.5 w-full px-4 py-3 rounded-2xl border border-border/10 bg-surface-highest/5 hover:border-primary/20 hover:bg-primary/5 transition-all text-muted-foreground hover:text-foreground"
          >
            <CreditCard className="h-4 w-4 text-primary/60 group-hover:text-primary transition-colors" />
            <span className="flex-1 text-left text-[11px] font-bold">
              Explore all plans &amp; pricing
            </span>
            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/10">
              {allPlans.length} plans
            </span>
            <ArrowUpRight className="h-3.5 w-3.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </button>
        </div>

        {/* ── Limit summary pills ──────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: 'Connectors', value: pillQuota(limits.maxConnectors), icon: <Zap className="h-3.5 w-3.5 text-primary" /> },
            { label: 'Docs/Month',  value: pillQuota(limits.maxDocumentsMonth), icon: <FileText className="h-3.5 w-3.5 text-info" /> },
            { label: 'Users',       value: pillQuota(limits.maxUsers), icon: <Users className="h-3.5 w-3.5 text-violet" /> },
            { label: 'Storage',     value: fmtBytes(limits.maxStorageBytes), icon: <HardDrive className="h-3.5 w-3.5 text-emerald-400" /> },
          ].map(({ label, value, icon }) => (
            <div key={label} className="rounded-xl border border-border/10 bg-surface-highest/5 py-3 text-center">
              <div className="flex justify-center mb-1">{icon}</div>
              <div className="text-sm font-black text-foreground">{value}</div>
              <div className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">{label}</div>
            </div>
          ))}
        </div>

      </div>
    </section>

    {/* ── Pricing modal ─────────────────────────────────────────────────── */}
    <PricingModal
      open={showPlans}
      onClose={() => setShowPlans(false)}
      plans={allPlans}
      currentPlanName={plan.name}
      onUpgrade={(name, billingCycle) => {
        setShowPlans(false);
        checkoutMut.mutate({ planName: name, billingCycle });
      }}
      upgrading={upgrading}
    />
  </>
  );
};

export default SubscriptionPanel;
