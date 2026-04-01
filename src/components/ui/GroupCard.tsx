import React from 'react';
import {
  Users,
  FileText,
  ArrowUpRight,
  Lock,
  Globe
} from 'lucide-react';
import { type GroupHealth } from '../../services/adminService';
import { cn } from '../../utils/cn';

interface GroupCardProps {
  group: GroupHealth;
  view?: 'grid' | 'list';
  onClick?: () => void;
  className?: string;
  /** List: primary button label. Grid: bottom bar label (default "Enter Workspace"). */
  primaryActionLabel?: string;
}

export const HealthBadge: React.FC<{ status: string, label: string, className?: string }> = ({ status, label, className }) => {
  const styles = {
    Healthy: 'text-success bg-success/10 border-success/20',
    Pending: 'text-warning bg-warning/10 border-warning/20',
    Error: 'text-destructive bg-destructive/10 border-destructive/20'
  };
  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-1.5 rounded-full border text-[9px] font-bold uppercase tracking-[0.15em] backdrop-blur-sm shrink-0",
      styles[status as keyof typeof styles],
      className
    )}>
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse shadow-[0_0_8px_currentColor]" />
      {label}
    </div>
  );
};

export const GroupCard: React.FC<GroupCardProps> = ({ group, view = 'grid', onClick, className, primaryActionLabel }) => {
  if (view === 'list') {
    return (
      <div
        onClick={onClick}
        className={cn(
          "bg-surface-lowest border border-border/20 rounded-xl py-3 px-4 hover:bg-surface-low transition-all group/card cursor-pointer flex items-center gap-4 relative overflow-hidden shadow-sm dark:bg-surface-highest/5 dark:border-border/10 dark:hover:bg-surface-highest/10",
          className
        )}
      >
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shrink-0 group-hover/card:scale-105 transition-transform dark:bg-surface-highest/10 dark:border-border/10">
          {group.name.length % 2 === 0 ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-[13px] font-bold text-foreground truncate group-hover/card:text-primary transition-colors">
              {group.name}
            </h3>
            <HealthBadge status={group.status} label={group.statusLabel} className="scale-75 origin-left" />
          </div>
          <p className="text-[9px] text-muted-foreground/40 uppercase tracking-widest font-bold">
            {group.membershipRole
              ? group.membershipRole.replaceAll('_', ' ')
              : `Group #${group.id.toString().slice(0, 8)}`}
          </p>
        </div>

        <div className="flex items-center gap-6 px-4 border-x border-border/10 shrink-0">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-muted-foreground/30" />
            <span className="text-sm font-bold text-foreground">{group.users}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-muted-foreground/30" />
            <span className="text-sm font-bold text-foreground">{group.docs}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button type="button" className="bg-primary/10 hover:bg-primary/20 text-primary text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all">
            {primaryActionLabel ?? 'Enter'}
          </button>
          <ArrowUpRight className="w-4 h-4 text-muted-foreground/20 group-hover/card:text-primary transition-all" />
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-surface-lowest border border-border/20 rounded-2xl p-4 hover:bg-surface-low transition-all group/card cursor-pointer relative overflow-hidden flex flex-col h-[260px] shadow-md hover:shadow-lg hover:-translate-y-1 duration-500 dark:bg-surface-highest/10 dark:border-border/10 dark:hover:bg-surface-highest/20 dark:shadow-2xl dark:hover:shadow-primary/5 dark:hover:-translate-y-1.5",
        className
      )}
    >
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-40 h-28 bg-primary/10 blur-[60px] rounded-full translate-x-1/3 -translate-y-1/3 transition-all group-hover/card:bg-primary/20 dark:bg-primary/5" />

      <div className="flex justify-between items-start mb-3 relative">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 transition-all duration-500 group-hover/card:scale-110 dark:bg-surface-highest/10 dark:border-border/10">
          {group.name.length % 2 === 0 ? <Globe className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
        </div>
        <HealthBadge status={group.status} label={group.statusLabel} className="scale-75 origin-top-right" />
      </div>

      <div className="space-y-1 mb-2 relative">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black font-display text-foreground group-hover/card:text-primary transition-colors tracking-tight leading-tight truncate pr-4">
            {group.name}
          </h3>
          <ArrowUpRight className="w-4 h-4 text-muted-foreground/30 group-hover/card:text-primary transition-all shrink-0" />
        </div>
        <p className="text-[9px] text-muted-foreground/30 uppercase tracking-widest font-bold">
          ID: {group.id.toString().slice(0, 8)}
        </p>
      </div>

      <div className="mt-auto pt-4 border-t border-border/10 relative grid grid-cols-2 gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-surface-low flex items-center justify-center text-muted-foreground transition-colors dark:bg-surface-highest/10 dark:text-muted-foreground/60">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-black text-foreground leading-none">{group.users}</p>
            <p className="text-[8px] text-muted-foreground/40 uppercase tracking-widest font-bold">Users</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-surface-low flex items-center justify-center text-muted-foreground transition-colors dark:bg-surface-highest/10 dark:text-muted-foreground/60">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-black text-foreground leading-none">{group.docs}</p>
            <p className="text-[8px] text-muted-foreground/40 uppercase tracking-widest font-bold">Docs</p>
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 bg-primary translate-y-full group-hover/card:translate-y-0 transition-transform duration-300 py-3 flex items-center justify-center gap-2 cursor-pointer">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-foreground">{primaryActionLabel ?? 'Enter Workspace'}</span>
        <ArrowUpRight className="w-3.5 h-3.5 text-primary-foreground" />
      </div>
    </div>
  );
};
