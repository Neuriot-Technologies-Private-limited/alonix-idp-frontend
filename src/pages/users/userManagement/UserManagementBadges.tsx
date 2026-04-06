import React from 'react';
import { Shield, ShieldCheck } from 'lucide-react';
import { cn } from '../../../utils/cn';

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const config: Record<string, { cls: string; dot: string }> = {
    Active: { cls: 'text-success bg-gradient-to-r from-success/14 to-success/6 border-success/30 shadow-[inset_0_1px_0_hsl(var(--foreground)/0.08)]', dot: 'bg-success' },
    Inactive: { cls: 'text-muted-foreground/50 bg-gradient-to-r from-muted/14 to-muted/6 border-border/25 dark:border-border/40', dot: 'bg-muted-foreground/40' },
    Pending: { cls: 'text-warning bg-gradient-to-r from-warning/14 to-warning/6 border-warning/30 shadow-[inset_0_1px_0_hsl(var(--foreground)/0.08)]', dot: 'bg-warning' },
  };
  const c = config[status] ?? config.Inactive;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border',
        c.cls
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full animate-pulse', c.dot)} />
      {status}
    </span>
  );
};

export const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
  const isAdmin = role === 'COMPANY_ADMIN';
  const isGroupAdmin = role === 'GROUP_ADMIN';
  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          'w-7 h-7 rounded-lg flex items-center justify-center border shrink-0 shadow-[0_0_0_1px_hsl(var(--foreground)/0.02)]',
          isAdmin
            ? 'bg-primary/12 border-primary/35 text-primary'
            : isGroupAdmin
              ? 'bg-violet/12 border-violet/30 text-violet'
              : 'bg-surface-highest/8 border-border/25 dark:border-border/40 text-muted-foreground/50'
        )}
      >
        {isAdmin ? <ShieldCheck className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
      </div>
      <span className="text-[10px] font-black text-foreground/70 uppercase tracking-widest whitespace-nowrap">
        {role.replace(/_/g, ' ')}
      </span>
    </div>
  );
};
