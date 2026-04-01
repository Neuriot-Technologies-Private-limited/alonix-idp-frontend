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
    "bg-surface-lowest p-4 rounded-2xl relative overflow-hidden group border border-border/20 shadow-sm transition-all hover:bg-surface-low hover:border-primary/30 hover:shadow-md dark:bg-surface-highest/10 dark:border-border/10 dark:hover:bg-surface-highest/20 dark:hover:border-primary/20",
    className
  )}>
    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 blur-[40px] rounded-full translate-x-1/2 -translate-y-1/2 transition-all group-hover:bg-primary/15 dark:bg-primary/5 dark:group-hover:bg-primary/10" />

    <div className="flex justify-between items-start mb-3">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform dark:bg-surface-highest/5">
        {icon}
      </div>
      {trend && (
        <div className={cn(
          "flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider tabular-nums",
          trend.isPositive
            ? "text-success bg-success/10"
            : "text-destructive bg-destructive/10"
        )}>
          {trend.isPositive ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
          {trend.value}
        </div>
      )}
    </div>

    <p className="text-muted-foreground font-bold text-[9px] uppercase tracking-[0.2em] mb-1">{label}</p>
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
