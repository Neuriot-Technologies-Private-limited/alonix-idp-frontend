import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Skeleton } from './Skeleton';
import { cn } from '../../utils/cn';

export interface TrendingInfo {
  value: string;
  label: string;
  isPositive: boolean;
}

export interface StatCardProps {
  label: string;
  value?: string | number;
  trend?: TrendingInfo;
  icon: React.ReactNode;
  isPulse?: boolean;
  loading?: boolean;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  trend,
  isPulse,
  loading,
  icon,
  className
}) => (
  <div className={cn(
    "relative isolate overflow-hidden rounded-2xl p-4 bg-gradient-to-b from-surface-highest/65 to-surface-highest/35 border border-border/30 dark:border-border/45 group cursor-default transition-all hover:border-border/45 dark:hover:border-border/60",
    className
  )}>
    <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-primary/16 via-primary/8 to-transparent dark:from-primary/22 dark:via-primary/10 dark:to-transparent opacity-95 transition-opacity duration-300 group-hover:opacity-100" />
    <div className="pointer-events-none absolute inset-0 -z-10 rounded-2xl ring-1 ring-inset ring-white/35 dark:ring-white/5" />

    <div className="flex justify-between items-start mb-3">
      <div className="relative grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-primary/35 dark:border-primary/45 bg-primary/[0.12] dark:bg-primary/[0.2] backdrop-blur-sm text-primary shadow-[0_0_0_1px_hsl(var(--background)/0.55),0_10px_22px_-12px_hsl(var(--primary)/0.85)] transition-transform duration-300 group-hover:scale-[1.03]">
        {icon}
      </div>
      {trend && (
        <div className={cn(
          "flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider tabular-nums border backdrop-blur-sm",
          trend.isPositive
            ? "text-success bg-success/[0.12] dark:bg-success/[0.2] border-success/35 dark:border-success/45"
            : "text-destructive bg-destructive/[0.12] dark:bg-destructive/[0.2] border-destructive/35 dark:border-destructive/45"
        )}>
          {trend.isPositive ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
          {trend.value}
        </div>
      )}
    </div>

    <p className="text-muted-foreground/65 dark:text-muted-foreground/55 font-bold text-[9px] uppercase tracking-[0.2em] mb-1">{label}</p>
    {loading ? (
      <Skeleton className="h-7 w-20 mb-1 rounded-lg" />
    ) : (
      <h3 className="text-2xl font-extrabold text-foreground tracking-tight tabular-nums">{value}</h3>
    )}

    <div className={cn("mt-2 flex items-center gap-1.5 text-[9px] font-bold tracking-widest uppercase", isPulse ? "text-primary" : "text-muted-foreground/40")}>
      {isPulse ? <span className="animate-pulse w-1.5 h-1.5 rounded-full bg-primary shadow-glass" /> : null}
      <span>{trend?.label || 'Org total'}</span>
    </div>
  </div>
);
