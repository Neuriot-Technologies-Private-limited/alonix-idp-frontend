import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Check, Loader2, Sparkles, Zap, Star, Building2,
  ArrowRight, Shield, RefreshCcw, Mail,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import {
  monthlyPrice, annualTotal, annualSavings, fmtBytes, limitLabel,
} from '../../utils/billingUtils';

// ── Types ─────────────────────────────────────────────────────────────────────
interface PlanLimits {
  maxConnectors: number;
  maxDocumentsMonth: number;
  maxUsers: number;
  maxStorageBytes: number;
}

export interface PricingPlan {
  _id: string;
  name: string;
  displayName: string;
  description: string;
  priceMonthlyUsd: number;
  limits: PlanLimits;
  stripePriceId: string | null;
}

interface PricingModalProps {
  open: boolean;
  onClose: () => void;
  plans: PricingPlan[];
  currentPlanName: string;
  onUpgrade: (planName: string) => void;
  upgrading: string | null;
}

// Canonical display order
const PLAN_ORDER: Record<string, number> = { FREE: 0, STARTER: 1, PRO: 2, ENTERPRISE: 3 };
function sortPlans(plans: PricingPlan[]) {
  return [...plans].sort((a, b) => (PLAN_ORDER[a.name] ?? 99) - (PLAN_ORDER[b.name] ?? 99));
}

// ── Per-plan visual config ────────────────────────────────────────────────────
const PLAN_CFG: Record<string, {
  accent: string;       // tailwind gradient classes for top bar
  glow: string;         // rgba for card bg tint
  iconCls: string;      // icon wrapper classes
  icon: React.ReactNode;
  popular?: boolean;
}> = {
  FREE: {
    accent: 'from-slate-500/60 via-slate-600/30 to-transparent',
    glow: 'rgba(100,116,139,0.08)',
    iconCls: 'bg-slate-500/10 text-slate-400',
    icon: <Zap className="w-4 h-4" />,
  },
  STARTER: {
    accent: 'from-blue-500/70 via-cyan-400/30 to-transparent',
    glow: 'rgba(59,130,246,0.10)',
    iconCls: 'bg-blue-500/10 text-blue-400',
    icon: <Star className="w-4 h-4" />,
  },
  PRO: {
    accent: 'from-primary via-violet/60 to-transparent',
    glow: 'rgba(173,198,255,0.14)',
    iconCls: 'bg-primary/20 text-primary',
    icon: <Sparkles className="w-4 h-4" />,
    popular: true,
  },
  ENTERPRISE: {
    accent: 'from-amber-400/70 via-orange-400/30 to-transparent',
    glow: 'rgba(251,191,36,0.10)',
    iconCls: 'bg-amber-400/10 text-amber-400',
    icon: <Building2 className="w-4 h-4" />,
  },
};

// Compact, focused feature list — max 5 per plan to avoid overflow
function features(plan: PricingPlan): string[] {
  const docs = limitLabel(plan.limits.maxDocumentsMonth);
  const conn = limitLabel(plan.limits.maxConnectors);
  const users = limitLabel(plan.limits.maxUsers);
  const stor = fmtBytes(plan.limits.maxStorageBytes);

  const extra: Record<string, string[]> = {
    FREE:       ['Email & Fax ingestion', 'Basic AI extraction'],
    STARTER:    ['All connectors + SharePoint', 'Priority processing'],
    PRO:        ['API ingestion', 'Audit logs & classification'],
    ENTERPRISE: ['Custom SLAs & on-prem', 'Dedicated account manager'],
  };
  const connLabel = plan.limits.maxConnectors === 0
    ? 'No connectors'
    : `${conn} connector${plan.limits.maxConnectors === 1 ? '' : 's'}`;
  return [`${docs} docs/mo`, connLabel, `${users} users`, `${stor} storage`, ...(extra[plan.name] ?? [])];
}

// ── Billing toggle ────────────────────────────────────────────────────────────
const BillingToggle: React.FC<{
  cycle: 'monthly' | 'annually';
  onChange: (c: 'monthly' | 'annually') => void;
}> = ({ cycle, onChange }) => (
  <div className="flex items-center justify-center gap-3 py-1">
    <button
      onClick={() => onChange('monthly')}
      className={cn('text-[11px] font-black uppercase tracking-widest transition-colors cursor-pointer',
        cycle === 'monthly' ? 'text-foreground' : 'text-muted-foreground/50')}
    >
      Monthly
    </button>

    <button
      onClick={() => onChange(cycle === 'monthly' ? 'annually' : 'monthly')}
      aria-label="Toggle billing cycle"
      className="relative w-12 h-6 rounded-full bg-surface-highest/20 border border-border/15 p-[3px] cursor-pointer"
    >
      <motion.div
        animate={{ x: cycle === 'monthly' ? 0 : 22 }}
        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
        className="w-[18px] h-[18px] rounded-full bg-primary shadow-lg shadow-primary/40"
      />
    </button>

    <div className="flex items-center gap-1.5">
      <button
        onClick={() => onChange('annually')}
        className={cn('text-[11px] font-black uppercase tracking-widest transition-colors cursor-pointer',
          cycle === 'annually' ? 'text-foreground' : 'text-muted-foreground/50')}
      >
        Annually
      </button>
      <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-[9px] font-black px-1.5 py-0.5 rounded-full">
        −20%
      </span>
    </div>
  </div>
);

// ── Plan card (compact) ───────────────────────────────────────────────────────
const PlanCard: React.FC<{
  plan: PricingPlan;
  cycle: 'monthly' | 'annually';
  isCurrent: boolean;
  onUpgrade: (n: string) => void;
  upgrading: string | null;
  index: number;
}> = ({ plan, cycle, isCurrent, onUpgrade, upgrading, index }) => {
  const cfg = PLAN_CFG[plan.name] ?? PLAN_CFG.FREE;
  const isEnterprise = plan.name === 'ENTERPRISE';
  const isFree = plan.priceMonthlyUsd === 0 && !isEnterprise;
  const isLoading = upgrading === plan.name;
  const mo = monthlyPrice(plan, cycle);
  const yearly = annualTotal(plan);
  const feats = features(plan);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 + index * 0.06, duration: 0.38, ease: 'easeOut' }}
      className={cn(
        'relative glass rounded-2xl border flex flex-col transition-all duration-300',
        cfg.popular
          ? 'border-primary/30 shadow-xl shadow-primary/10 scale-[1.02] z-10'
          : 'border-border/10 hover:border-border/25',
        isCurrent && 'ring-1 ring-primary/30',
      )}
      style={{ background: `linear-gradient(140deg, ${cfg.glow} 0%, transparent 55%)` }}
    >
      {/* Top accent */}
      <div className={cn('h-[3px] w-full bg-gradient-to-r rounded-t-2xl overflow-hidden', cfg.accent)} />

      {/* Popular badge */}
      {cfg.popular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg shadow-primary/40 z-20 whitespace-nowrap">
          ✦ Recommended
        </div>
      )}

      <div className="p-5 flex flex-col flex-1 gap-3">
        {/* Header row */}
        <div className="flex items-center gap-2.5">
          <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0', cfg.iconCls)}>
            {cfg.icon}
          </div>
          <div className="min-w-0">
            <div className="font-display text-base font-extrabold text-foreground leading-none">{plan.displayName}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5 truncate">{plan.description}</div>
          </div>
          {isCurrent && (
            <span className="ml-auto shrink-0 text-[8px] font-black uppercase tracking-widest bg-primary/10 text-primary px-1.5 py-0.5 rounded-full border border-primary/15">
              Active
            </span>
          )}
        </div>

        {/* Price block — stacked, always legible */}
        <div className="space-y-0.5">
          {isFree ? (
            <div className="font-display text-3xl font-extrabold text-foreground leading-none">Free</div>
          ) : isEnterprise ? (
            <div className="font-display text-3xl font-extrabold text-foreground leading-none">Custom</div>
          ) : (
            <>
              {/* Primary: price + /mo */}
              <div className="flex items-baseline gap-1.5">
                <span className="font-display text-3xl font-extrabold text-foreground leading-none tabular-nums">
                  ${mo}
                </span>
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-tight">/mo</span>
                {cycle === 'annually' && (
                  <span className="ml-1 text-[10px] font-bold text-muted-foreground/45 line-through tabular-nums">
                    ${plan.priceMonthlyUsd}
                  </span>
                )}
              </div>
              {/* Secondary: annual total or monthly note */}
              {cycle === 'annually' ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-emerald-400 tabular-nums">
                    ${yearly} billed annually
                  </span>
                  <span className="text-[9px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1 py-0.5 rounded-full">
                    save ${annualSavings(plan)}
                  </span>
                </div>
              ) : (
                <div className="text-[10px] text-muted-foreground/50">billed monthly</div>
              )}
            </>
          )}
        </div>

        {/* Feature list — compact */}
        <ul className="space-y-1.5 flex-1">
          {feats.map(f => (
            <li key={f} className="flex items-start gap-2">
              <div className={cn(
                'w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-px',
                cfg.popular ? 'bg-primary/15' : 'bg-surface-highest/15',
              )}>
                <Check className={cn('w-2 h-2', cfg.popular ? 'text-primary' : 'text-muted-foreground/70')} />
              </div>
              <span className="text-[11px] text-muted-foreground leading-snug">{f}</span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        {isCurrent ? (
          <div className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-surface-highest/20 border border-border/15 text-xs font-bold text-muted-foreground">
            <Check className="w-3.5 h-3.5 text-primary" /> Current Plan
          </div>
        ) : isEnterprise ? (
          <a
            href="mailto:sales@alonix.ai?subject=Enterprise%20Plan%20Enquiry"
            id="pricing-modal-contact-sales-btn"
            className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl font-bold text-xs transition-all bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:opacity-90 hover:scale-[1.01] shadow-md"
          >
            <Mail className="w-3.5 h-3.5" /> Contact Sales
          </a>
        ) : (
          <button
            id={`pricing-modal-upgrade-${plan.name.toLowerCase()}-btn`}
            onClick={() => onUpgrade(plan.name)}
            disabled={!!upgrading || !plan.stripePriceId}
            className={cn(
              'flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl font-bold text-xs transition-all shadow-md',
              'disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99] cursor-pointer',
              cfg.popular
                ? 'bg-primary text-primary-foreground shadow-primary/20 hover:bg-primary/90'
                : 'bg-surface-highest/40 text-foreground hover:bg-surface-highest/60',
            )}
          >
            {isLoading
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <ArrowRight className="w-3.5 h-3.5" />}
            {plan.name === 'FREE' ? 'Downgrade' : `Upgrade to ${plan.displayName}`}
          </button>
        )}

        {/* Bottom glow strip for popular */}
        {cfg.popular && (
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        )}
      </div>
    </motion.div>
  );
};

// ── Modal ─────────────────────────────────────────────────────────────────────
const PricingModal: React.FC<PricingModalProps> = ({
  open, onClose, plans, currentPlanName, onUpgrade, upgrading,
}) => {
  const [cycle, setCycle] = useState<'monthly' | 'annually'>('monthly');

  // Escape to close
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="pm-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[200] bg-black/65 backdrop-blur-md"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Dialog — centred, no page scroll needed */}
          <motion.div
            key="pm-panel"
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 12 }}
            transition={{ duration: 0.26, ease: [0.25, 0.46, 0.45, 0.94] }}
            role="dialog"
            aria-modal="true"
            aria-label="Pricing plans"
            className="fixed inset-0 z-[201] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="relative w-full max-w-5xl pointer-events-auto bg-background/96 backdrop-blur-2xl rounded-[1.75rem] border border-border/10 shadow-[0_32px_80px_rgba(0,0,0,0.55)] overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Ambient glows */}
              <div className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 bg-primary/7 blur-[80px] rounded-full" />
              <div className="pointer-events-none absolute -bottom-20 -right-20 w-64 h-64 bg-violet/7 blur-[70px] rounded-full" />

              {/* ── Header ──────────────────────────────────────────────── */}
              <div className="relative flex items-center justify-between border-b border-border/8 px-7 py-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-primary">Subscription Plans</p>
                  <h2 className="font-display text-xl font-extrabold tracking-tight text-foreground leading-tight mt-0.5">
                    Pay once, unlock <span className="text-primary italic">clarity.</span>
                  </h2>
                </div>

                {/* Monthly / Annual toggle — centred */}
                <div className="absolute left-1/2 -translate-x-1/2">
                  <BillingToggle cycle={cycle} onChange={setCycle} />
                </div>

                <button
                  id="pricing-modal-close-btn"
                  onClick={onClose}
                  aria-label="Close pricing"
                  className="w-8 h-8 rounded-xl border border-border/20 bg-surface-highest/10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-border/40 transition-all cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="px-7 pb-1 text-center text-[10px] text-muted-foreground/55">
                Checkout uses each plan&apos;s monthly Stripe price. The annual toggle is for comparison only until annual prices are configured in Stripe.
              </p>

              {/* ── Plan grid ───────────────────────────────────────────── */}
              <div className="px-6 pt-6 pb-5">
                <div className={cn(
                  'grid gap-4 items-start',
                  plans.length <= 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
                )}>
                  {sortPlans(plans).map((plan, i) => (
                    <PlanCard
                      key={plan._id}
                      plan={plan}
                      cycle={cycle}
                      isCurrent={plan.name === currentPlanName}
                      onUpgrade={onUpgrade}
                      upgrading={upgrading}
                      index={i}
                    />
                  ))}
                </div>
              </div>

              {/* ── Trust bar ───────────────────────────────────────────── */}
              <div className="border-t border-border/8 px-7 py-3 flex items-center justify-center gap-6">
                {[
                  { icon: <Shield className="w-3 h-3" />, text: 'SOC 2 aligned' },
                  { icon: <RefreshCcw className="w-3 h-3" />, text: '30-day money-back' },
                  { icon: <Check className="w-3 h-3" />, text: 'Cancel anytime' },
                ].map(({ icon, text }) => (
                  <div key={text} className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider">
                    {icon}<span>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PricingModal;
