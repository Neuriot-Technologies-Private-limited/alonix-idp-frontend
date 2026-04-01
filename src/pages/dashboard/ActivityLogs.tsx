import React from 'react';
import { Clock, Filter, Download, Search } from 'lucide-react';
import { ActivityFeed } from '../../components/admin/ActivityFeed';
import { useRbac } from '../../hooks/useRbac';

export const ActivityLogs: React.FC = () => {
  const { orgRole, activeGroupRole } = useRbac();
  const role = (orgRole || activeGroupRole || undefined) as string;

  return (
    <div className="w-full min-w-0 space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:space-y-6">
      {/* Page Header */}
      <section className="flex flex-col justify-between gap-4 px-0 sm:px-2 md:flex-row md:items-end">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <Clock className="w-4 h-4 text-primary" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Governance & Audit</span>
          </div>
          <h1 className="text-3xl font-black font-display text-foreground tracking-tight bg-gradient-to-r from-foreground to-foreground/50 bg-clip-text text-transparent">
            System Activity
          </h1>
          <p className="text-muted-foreground font-medium text-sm tracking-wide max-w-lg">
            Complete audit trail of system events, user actions, and automated ingestion processes.
          </p>
        </div>

        <div className="flex w-full min-w-0 flex-wrap items-center gap-2 md:w-auto md:flex-nowrap">
          <div className="relative min-w-0 flex-1 group sm:flex-initial sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Filter logs..." 
              className="w-full rounded-xl border border-border/5 bg-surface-highest/5 py-2.5 pl-10 pr-4 text-sm font-medium transition-all focus:border-primary/50 focus:outline-none md:w-64"
            />
          </div>
          <button className="p-2.5 bg-surface-highest/5 border border-border/5 rounded-xl hover:bg-surface-highest/10 transition-all text-muted-foreground hover:text-foreground shadow-lg active:scale-95">
            <Filter className="w-4 h-4" />
          </button>
          <button className="p-2.5 bg-surface-highest/5 border border-border/5 rounded-xl hover:bg-surface-highest/10 transition-all text-muted-foreground hover:text-foreground shadow-lg active:scale-95">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Activity Feed Container */}
      <section className="relative min-h-[min(600px,70vh)] overflow-hidden rounded-2xl border border-border/5 bg-surface-highest/5 p-4 shadow-2xl backdrop-blur-xl sm:rounded-[28px] sm:p-6 md:rounded-[32px] md:p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
        <div className="relative">
          <ActivityFeed role={role} />
        </div>
      </section>
    </div>
  );
};
