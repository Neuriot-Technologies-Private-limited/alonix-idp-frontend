import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

const TONE_VALUE: Record<'primary' | 'emerald' | 'violet' | 'amber' | 'rose', string> = {
  primary: 'text-primary',
  emerald: 'text-success',
  violet: 'text-violet',
  amber: 'text-warning',
  rose: 'text-destructive',
};

const TONE_ACCENT: Record<'primary' | 'emerald' | 'violet' | 'amber' | 'rose', string> = {
  primary:
    'from-primary/16 via-primary/8 to-transparent dark:from-primary/22 dark:via-primary/10 dark:to-transparent',
  emerald:
    'from-success/15 via-success/7 to-transparent dark:from-success/22 dark:via-success/10 dark:to-transparent',
  violet:
    'from-violet/16 via-violet/8 to-transparent dark:from-violet/24 dark:via-violet/10 dark:to-transparent',
  amber:
    'from-warning/16 via-warning/8 to-transparent dark:from-warning/22 dark:via-warning/10 dark:to-transparent',
  rose:
    'from-destructive/16 via-destructive/8 to-transparent dark:from-destructive/24 dark:via-destructive/10 dark:to-transparent',
};

const TONE_ICON_CHROME: Record<'primary' | 'emerald' | 'violet' | 'amber' | 'rose', string> = {
  primary:
    'text-primary bg-primary/[0.12] dark:bg-primary/[0.2] border-primary/35 dark:border-primary/45 shadow-[0_0_0_1px_hsl(var(--background)/0.55),0_10px_22px_-12px_hsl(var(--primary)/0.85)]',
  emerald:
    'text-success bg-success/[0.12] dark:bg-success/[0.2] border-success/35 dark:border-success/45 shadow-[0_0_0_1px_hsl(var(--background)/0.55),0_10px_22px_-12px_hsl(var(--success)/0.85)]',
  violet:
    'text-violet bg-violet/[0.12] dark:bg-violet/[0.2] border-violet/35 dark:border-violet/45 shadow-[0_0_0_1px_hsl(var(--background)/0.55),0_10px_22px_-12px_hsl(var(--violet)/0.85)]',
  amber:
    'text-warning bg-warning/[0.12] dark:bg-warning/[0.2] border-warning/35 dark:border-warning/45 shadow-[0_0_0_1px_hsl(var(--background)/0.55),0_10px_22px_-12px_hsl(var(--warning)/0.85)]',
  rose:
    'text-destructive bg-destructive/[0.12] dark:bg-destructive/[0.2] border-destructive/35 dark:border-destructive/45 shadow-[0_0_0_1px_hsl(var(--background)/0.55),0_10px_22px_-12px_hsl(var(--destructive)/0.85)]',
};

export type MetricStateTone = keyof typeof TONE_VALUE;

export interface MetricStateCardProps {
  label: string;
  value: number | string;
  /** Semantic color for the large value. */
  tone?: MetricStateTone;
  /** Override value color (e.g. custom Tailwind class). Takes precedence over `tone`. */
  valueClassName?: string;
  className?: string;
  icon?: LucideIcon;
}

/**
 * Compact stat tile for dashboards (counts, pipeline stages, etc.).
 */
export const MetricStateCard: React.FC<MetricStateCardProps> = ({
  label,
  value,
  tone = 'primary',
  valueClassName,
  className,
  icon: Icon,
}) => {
  const colorClass = valueClassName ?? TONE_VALUE[tone];
  return (
    <div
      className={cn(
        'relative isolate overflow-hidden bg-gradient-to-b from-surface-highest/65 to-surface-highest/35 border border-border/30 dark:border-border/45 rounded-2xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4 group hover:border-border/45 dark:hover:border-border/60 transition-all cursor-default',
        className
      )}
    >
      <div
        className={cn(
          'pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br opacity-95 transition-opacity duration-300 group-hover:opacity-100',
          TONE_ACCENT[tone]
        )}
      />
      <div className="pointer-events-none absolute inset-0 -z-10 rounded-2xl ring-1 ring-inset ring-white/35 dark:ring-white/5" />
      {Icon ? (
        <span
          className={cn(
            'relative grid h-9 w-9 shrink-0 place-items-center rounded-xl border backdrop-blur-sm transition-transform duration-300 group-hover:scale-[1.03]',
            TONE_ICON_CHROME[tone]
          )}
          aria-hidden="true"
        >
          <Icon className="h-4 w-4" />
        </span>
      ) : null}
      <div className="min-w-0">
        <p className={cn('text-2xl font-black tracking-tight', colorClass)}>{value}</p>
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/55 dark:text-muted-foreground/45">
          {label}
        </p>
      </div>
    </div>
  );
};

export interface MetricStateGridProps {
  children: React.ReactNode;
  className?: string;
}

export const MetricStateGrid: React.FC<MetricStateGridProps> = ({ children, className }) => (
  <section
    className={cn('grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4', className)}
  >
    {children}
  </section>
);
