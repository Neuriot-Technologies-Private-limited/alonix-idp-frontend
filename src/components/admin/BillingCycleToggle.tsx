import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

export type BillingCycle = 'monthly' | 'annually';

/** Monthly / annual switch (shared by pricing modal and marketing pricing page). */
export const BillingCycleToggle: React.FC<{
  cycle: BillingCycle;
  onChange: (c: BillingCycle) => void;
  className?: string;
  /** Shown next to "Annually" (e.g. 20 for −20%). From `BILLING_ANNUAL_DISCOUNT_FRACTION` via API. */
  discountPercent?: number;
}> = ({ cycle, onChange, className, discountPercent = 20 }) => (
  <div className={cn('flex items-center justify-center gap-3 py-1', className)}>
    <button
      type="button"
      onClick={() => onChange('monthly')}
      className={cn(
        'text-[11px] font-black uppercase tracking-widest transition-colors cursor-pointer',
        cycle === 'monthly' ? 'text-foreground' : 'text-muted-foreground/50',
      )}
    >
      Monthly
    </button>

    <button
      type="button"
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
        type="button"
        onClick={() => onChange('annually')}
        className={cn(
          'text-[11px] font-black uppercase tracking-widest transition-colors cursor-pointer',
          cycle === 'annually' ? 'text-foreground' : 'text-muted-foreground/50',
        )}
      >
        Annually
      </button>
      {discountPercent > 0 && (
        <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-[9px] font-black px-1.5 py-0.5 rounded-full">
          −{discountPercent}%
        </span>
      )}
    </div>
  </div>
);
