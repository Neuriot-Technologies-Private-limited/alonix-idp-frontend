import React from 'react';
import { Shield, ShieldCheck } from 'lucide-react';
import { cn } from '../../../utils/cn';

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const config: Record<string, { cls: string; dot: string }> = {
    Active: { cls: 'text-success bg-success/10 border-success/20', dot: 'bg-success' },
    Inactive: { cls: 'text-muted-foreground/40 bg-muted/10 border-border/5', dot: 'bg-muted-foreground/30' },
    Pending: { cls: 'text-warning bg-warning/10 border-warning/20', dot: 'bg-warning' },
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
          'w-7 h-7 rounded-lg flex items-center justify-center border shrink-0',
          isAdmin
            ? 'bg-primary/10 border-primary/30 text-primary'
            : isGroupAdmin
              ? 'bg-violet/10 border-violet/20 text-violet'
              : 'bg-surface-highest/5 border-border/10 text-muted-foreground/40'
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
