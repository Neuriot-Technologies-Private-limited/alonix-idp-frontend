import React from 'react';
import { Activity, AlertTriangle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useSiemStatus } from '../../hooks/queries/admin';
import { cn } from '../../utils/cn';

function formatTimestamp(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

const SiemStatusPanel: React.FC = () => {
  const { data: siem, isLoading } = useSiemStatus();

  if (isLoading) {
    return (
      <section className="mb-6 rounded-2xl border border-border/20 bg-surface-highest/5 p-6 animate-pulse">
        <div className="h-5 w-48 rounded bg-muted/20" />
      </section>
    );
  }

  if (!siem) return null;

  const statusColor = siem.enabled
    ? siem.lastError
      ? 'text-amber-400'
      : 'text-emerald-400'
    : 'text-muted-foreground';

  return (
    <section className="mb-6 rounded-2xl border border-border/20 bg-surface-highest/5 p-6">
      <div className="flex items-center gap-3 mb-5">
        <ShieldCheck className="h-5 w-5 text-primary" />
        <h2 className="text-base font-bold tracking-tight text-foreground">
          Compliance — SIEM Export
        </h2>
        <span
          className={cn(
            'ml-auto inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider',
            siem.enabled
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
              : 'border-border/30 bg-surface-highest/10 text-muted-foreground'
          )}
        >
          {siem.enabled ? (
            <CheckCircle2 className="h-3 w-3" />
          ) : (
            <AlertTriangle className="h-3 w-3" />
          )}
          {siem.enabled ? 'Enabled' : 'Disabled'}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border/10 bg-surface-highest/5 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Status
          </p>
          <p className={cn('text-sm font-bold', statusColor)}>
            {!siem.enabled
              ? 'Not configured'
              : siem.configured
                ? 'Active'
                : 'Missing webhook URL'}
          </p>
        </div>

        <div className="rounded-xl border border-border/10 bg-surface-highest/5 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Events Forwarded
          </p>
          <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-primary/70" />
            {siem.eventsForwarded.toLocaleString()}
            {siem.eventsFailed > 0 && (
              <span className="text-[10px] font-medium text-destructive ml-1">
                ({siem.eventsFailed} failed)
              </span>
            )}
          </p>
        </div>

        <div className="rounded-xl border border-border/10 bg-surface-highest/5 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Last Success
          </p>
          <p className="text-sm font-bold text-foreground">
            {formatTimestamp(siem.lastSuccessAt)}
          </p>
        </div>

        <div className="rounded-xl border border-border/10 bg-surface-highest/5 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Last Error
          </p>
          <p className={cn('text-sm font-bold', siem.lastError ? 'text-destructive' : 'text-muted-foreground')}>
            {siem.lastError || '—'}
          </p>
        </div>
      </div>

      {!siem.enabled && (
        <p className="mt-4 text-xs text-muted-foreground">
          SIEM export is disabled. Set <code className="text-[11px] bg-surface-highest/20 px-1 py-0.5 rounded">SIEM_ENABLED=true</code> and configure <code className="text-[11px] bg-surface-highest/20 px-1 py-0.5 rounded">SIEM_WEBHOOK_URL</code> in the backend environment to start forwarding audit events.
        </p>
      )}
    </section>
  );
};

export default SiemStatusPanel;
