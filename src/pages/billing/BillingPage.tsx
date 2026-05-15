import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  CreditCard, Zap, TrendingUp, Users, FileText, HardDrive,
  CheckCircle2, AlertTriangle, ArrowUpRight, Loader2, Crown,
  BarChart3, Calendar, ExternalLink,
} from 'lucide-react';
import apiClient from '../../services/api/client';
import { useAuthStore } from '../../stores/authStore';
import { cn } from '../../utils/cn';
import type { BillingCycle } from '../../utils/billingUtils';

// ── Types ────────────────────────────────────────────────────────────────────
interface PlanLimits {
  maxConnectors: number;
  maxDocumentsMonth: number;
  maxUsers: number;
  maxStorageBytes: number;
}

interface BillingSubscription {
  plan: {
    name: string;
    displayName: string;
    description: string;
    priceMonthlyUsd: number;
    limits: PlanLimits;
  };
  subscription: {
    status: string;
    currentPeriodEnd: string | null;
    trialEndsAt: string | null;
    cancelAtPeriodEnd: boolean;
  };
  usage: {
    docsThisMonth: number;
    connectors: number;
    users: number;
    storageBytes: number;
  };
  limits: PlanLimits;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function formatBytes(bytes: number): string {
  if (bytes === -1) return 'Unlimited';
  if (bytes < 1024) return `${bytes} B`;
  const gb = bytes / 1024 / 1024 / 1024;
  if (gb >= 1) return `${gb.toFixed(0)} GB`;
  const mb = bytes / 1024 / 1024;
  return `${mb.toFixed(0)} MB`;
}

function limitLabel(limit: number): string {
  return limit === -1 ? 'Unlimited' : String(limit);
}

function usagePercent(used: number, limit: number): number {
  if (limit === -1) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

function statusColor(status: string) {
  switch (status) {
    case 'active':    return 'text-success bg-success/10';
    case 'trialing':  return 'text-info bg-info/10';
    case 'past_due':  return 'text-destructive bg-destructive/10';
    case 'canceled':  return 'text-muted-foreground bg-surface-highest/20';
    default:          return 'text-muted-foreground bg-surface-highest/20';
  }
}

// ── Usage Bar ─────────────────────────────────────────────────────────────
interface UsageBarProps {
  label: string;
  icon: React.ReactNode;
  used: number;
  limit: number;
  unit?: string;
  formatValue?: (v: number) => string;
}

const UsageBar: React.FC<UsageBarProps> = ({ label, icon, used, limit, unit = '', formatValue }) => {
  const pct = usagePercent(used, limit);
  const displayUsed = formatValue ? formatValue(used) : `${used}${unit ? ` ${unit}` : ''}`;
  const displayLimit = limit === -1 ? 'Unlimited' : (formatValue ? formatValue(limit) : `${limit}${unit ? ` ${unit}` : ''}`);

  const barColor =
    pct >= 90 ? 'bg-destructive' :
    pct >= 70 ? 'bg-amber-500' :
    'bg-primary';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-muted-foreground font-medium">
          {icon}
          <span>{label}</span>
        </div>
        <span className="font-bold text-foreground tabular-nums">
          {displayUsed}
          <span className="font-normal text-muted-foreground"> / {displayLimit}</span>
        </span>
      </div>
      {limit !== -1 && (
        <div className="h-1.5 w-full rounded-full bg-surface-highest/30 overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-700', barColor)}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
      {limit === -1 && (
        <div className="h-1.5 w-full rounded-full bg-gradient-to-r from-primary/30 via-violet/30 to-info/30" />
      )}
    </div>
  );
};

// ── Plan Badge ───────────────────────────────────────────────────────────
const planGradient: Record<string, string> = {
  FREE:       'from-slate-400 to-slate-600',
  STARTER:    'from-info to-blue-600',
  PRO:        'from-violet to-purple-600',
  ENTERPRISE: 'from-amber-400 to-orange-500',
};

// ── Main Component ────────────────────────────────────────────────────────
export const BillingPage: React.FC = () => {
  const context = useAuthStore((s) => s.context);
  const orgId = context?.orgId;
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  React.useEffect(() => {
    const upgrade = searchParams.get('upgrade');
    if (!upgrade) return;
    navigate(`/org-settings?upgrade=${encodeURIComponent(upgrade)}`, { replace: true });
  }, [searchParams, navigate]);

  const { data, isLoading, error } = useQuery<BillingSubscription>({
    queryKey: ['billing-subscription', orgId],
    queryFn: async () => {
      const { data } = await apiClient.get<BillingSubscription>('/billing/subscription');
      return data;
    },
    enabled: !!orgId,
    staleTime: 30_000,
  });

  const checkoutMutation = useMutation({
    mutationFn: async (vars: { planName: string; billingCycle?: BillingCycle }) => {
      const { planName, billingCycle = 'monthly' } = vars;
      const { data } = await apiClient.post<{ url: string }>('/billing/checkout-session', {
        planName,
        billingCycle,
      });
      return data;
    },
    onSuccess: ({ url }) => {
      window.location.href = url;
    },
  });

  const portalMutation = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.get<{ url: string }>('/billing/portal-session');
      return data;
    },
    onSuccess: ({ url }) => {
      window.location.href = url;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/40" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-muted-foreground">Failed to load billing information.</p>
      </div>
    );
  }

  const { plan, subscription, usage, limits } = data;
  const gradient = planGradient[plan.name] || 'from-slate-400 to-slate-600';
  const isFreePlan = plan.priceMonthlyUsd === 0;
  const isPaidPlan = !isFreePlan && subscription.status === 'active';

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2.5">
            <CreditCard className="h-6 w-6 text-primary" />
            Billing & Plan
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your subscription, view usage, and upgrade your plan.
          </p>
        </div>
        {isPaidPlan && (
          <button
            id="billing-portal-btn"
            onClick={() => portalMutation.mutate()}
            disabled={portalMutation.isPending}
            className="flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl border border-border/20 hover:border-border/40 transition-all hover:bg-surface-highest/10 disabled:opacity-50"
          >
            {portalMutation.isPending
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <ExternalLink className="h-4 w-4" />}
            Manage Billing
          </button>
        )}
      </div>

      {/* Plan Card */}
      <div className="relative rounded-3xl overflow-hidden border border-border/20 bg-surface-lowest shadow-xl">
        <div className={cn('absolute top-0 left-0 w-full h-1 bg-gradient-to-r', gradient)} />
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={cn(
                'h-12 w-12 rounded-2xl flex items-center justify-center text-white shadow-lg bg-gradient-to-br',
                gradient
              )}>
                <Crown className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-foreground">{plan.displayName} Plan</h2>
                  <span className={cn(
                    'text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded-full',
                    statusColor(subscription.status)
                  )}>
                    {subscription.status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{plan.description}</p>
              </div>
            </div>

            <div className="text-right shrink-0">
              {plan.priceMonthlyUsd === 0 ? (
                <div className="text-2xl font-black text-foreground">Free</div>
              ) : (
                <>
                  <div className="text-2xl font-black text-foreground">${plan.priceMonthlyUsd}</div>
                  <div className="text-xs text-muted-foreground">per month</div>
                </>
              )}
              {subscription.currentPeriodEnd && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1 justify-end">
                  <Calendar className="h-3 w-3" />
                  Renews {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>

          {subscription.cancelAtPeriodEnd && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-2.5 text-sm text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Your subscription will cancel at the end of the current billing period.
            </div>
          )}
        </div>
      </div>

      {/* Usage */}
      <div className="rounded-3xl border border-border/20 bg-surface-lowest shadow-xl overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-primary/20 to-transparent" />
        <div className="p-6 sm:p-8">
          <h3 className="text-base font-black text-foreground flex items-center gap-2 mb-6">
            <BarChart3 className="h-4 w-4 text-primary" />
            Usage This Month
          </h3>
          <div className="space-y-5">
            <UsageBar
              label="Documents Ingested"
              icon={<FileText className="h-4 w-4" />}
              used={usage.docsThisMonth}
              limit={limits.maxDocumentsMonth}
            />
            <UsageBar
              label="Active Connectors"
              icon={<Zap className="h-4 w-4" />}
              used={usage.connectors}
              limit={limits.maxConnectors}
            />
            <UsageBar
              label="Team Members"
              icon={<Users className="h-4 w-4" />}
              used={usage.users}
              limit={limits.maxUsers}
            />
            <UsageBar
              label="Storage"
              icon={<HardDrive className="h-4 w-4" />}
              used={usage.storageBytes ?? 0}
              limit={limits.maxStorageBytes}
              formatValue={formatBytes}
            />
          </div>
        </div>
      </div>

      {/* Upgrade CTA (only show for free/starter plans) */}
      {(plan.name === 'FREE' || plan.name === 'STARTER') && (
        <div className="rounded-3xl border border-violet/20 bg-violet/5 shadow-xl p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-5 w-5 text-violet" />
                <span className="text-sm font-black text-violet uppercase tracking-wider">
                  {plan.name === 'FREE' ? 'Upgrade to Starter' : 'Upgrade to Pro'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {plan.name === 'FREE'
                  ? 'Get 3 connectors, 500 documents/month, and 10 team members for $49/mo.'
                  : 'Get 10 connectors, 5,000 documents/month, and 50 team members for $149/mo.'}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {(plan.name === 'FREE'
                  ? ['3 Connectors', '500 Docs/mo', '10 Users', '5 GB Storage']
                  : ['10 Connectors', '5,000 Docs/mo', '50 Users', '50 GB Storage']
                ).map((feature) => (
                  <span key={feature} className="inline-flex items-center gap-1 text-[10px] font-bold text-violet bg-violet/10 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    {feature}
                  </span>
                ))}
              </div>
            </div>
            <button
              id={`upgrade-to-${plan.name === 'FREE' ? 'starter' : 'pro'}-btn`}
              onClick={() => checkoutMutation.mutate({ planName: plan.name === 'FREE' ? 'STARTER' : 'PRO', billingCycle: 'monthly' })}
              disabled={checkoutMutation.isPending}
              className="shrink-0 flex items-center gap-2 px-5 py-3 rounded-2xl bg-violet text-white font-black text-sm hover:bg-violet/90 transition-all hover:scale-[1.02] shadow-lg shadow-violet/20 disabled:opacity-50"
            >
              {checkoutMutation.isPending
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <ArrowUpRight className="h-4 w-4" />}
              Upgrade Now
            </button>
          </div>
        </div>
      )}

      {/* Plan limit features grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Connectors', value: limitLabel(limits.maxConnectors), icon: <Zap className="h-4 w-4 text-primary" /> },
          { label: 'Docs / Month', value: limitLabel(limits.maxDocumentsMonth), icon: <FileText className="h-4 w-4 text-info" /> },
          { label: 'Team Members', value: limitLabel(limits.maxUsers), icon: <Users className="h-4 w-4 text-violet" /> },
          { label: 'Storage', value: formatBytes(limits.maxStorageBytes), icon: <HardDrive className="h-4 w-4 text-emerald-500" /> },
        ].map(({ label, value, icon }) => (
          <div key={label} className="rounded-2xl border border-border/10 bg-surface-highest/5 p-4 text-center">
            <div className="flex justify-center mb-2">{icon}</div>
            <div className="text-lg font-black text-foreground">{value}</div>
            <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mt-0.5">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BillingPage;
