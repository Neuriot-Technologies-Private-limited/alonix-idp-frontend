import React from 'react';
import { cn } from '../../utils/cn';

export interface HealthBadgeProps {
  status: string;
  label: string;
  className?: string;
}

export const HealthBadge: React.FC<HealthBadgeProps> = ({ status, label, className }) => {
  const styles = {
    Healthy: 'bg-success/10 text-success border-success/20',
    Pending: 'bg-warning/10 text-warning border-warning/20',
    Error: 'bg-destructive/10 text-destructive border-destructive/20'
  };
  
  return (
    <span className={cn(
      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
      styles[status as keyof typeof styles] || 'bg-muted/10 text-muted-foreground border-border/10',
      className
    )}>
      {label}
    </span>
  );
};
