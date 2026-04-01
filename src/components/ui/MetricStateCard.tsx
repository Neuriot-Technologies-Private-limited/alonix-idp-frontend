import React from 'react';
import { cn } from '../../utils/cn';

const TONE_VALUE: Record<'primary' | 'emerald' | 'violet' | 'amber' | 'rose', string> = {
  primary: 'text-primary',
  emerald: 'text-success',
  violet: 'text-violet',
  amber: 'text-warning',
  rose: 'text-destructive',
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
}) => {
  const colorClass = valueClassName ?? TONE_VALUE[tone];
  return (
    <div
      className={cn(
        'bg-surface-highest/5 border border-border/10 rounded-2xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4 group hover:bg-surface-highest/10 transition-all cursor-default',
        className
      )}
    >
      <div>
        <p className={cn('text-2xl font-black tracking-tight', colorClass)}>{value}</p>
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/30">{label}</p>
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
