import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Download, Search, Loader2 } from 'lucide-react';
import { ActivityFeed } from '../../components/admin/ActivityFeed';
import { useRbac } from '../../hooks/useRbac';
import {
  adminService,
  useAuditLogs,
  type AuditLogsQuery,
} from '../../services/adminService';
import { useAlert } from '../../components/alert';
import { cn } from '../../utils/cn';

type DatePreset = '7d' | '30d' | '90d' | 'month';

type ActivityNavState = {
  from?: string;
  fromLabel?: string;
};

function rangeForPreset(preset: DatePreset): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  if (preset === '7d') from.setDate(from.getDate() - 7);
  else if (preset === '30d') from.setDate(from.getDate() - 30);
  else if (preset === '90d') from.setDate(from.getDate() - 90);
  else from.setMonth(from.getMonth() - 1);
  return { from: from.toISOString(), to: to.toISOString() };
}

export const ActivityLogs: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const navState = (location.state as ActivityNavState | null) || {};
  const { orgRole, activeGroupRole } = useRbac();
  const role = (orgRole || activeGroupRole || undefined) as string;
  const { alert: appAlert } = useAlert();

  const handleBack = () => {
    if (navState.from) {
      navigate(navState.from);
      return;
    }
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/dashboard');
  };

  const backLabel = navState.fromLabel ? `Back to ${navState.fromLabel}` : 'Back';

  const [preset, setPreset] = React.useState<DatePreset>('30d');
  const [actorEmail, setActorEmail] = React.useState('');
  const [searchText, setSearchText] = React.useState('');
  const [exporting, setExporting] = React.useState(false);
  const usersFilterRef = React.useRef<HTMLElement>(null);

  React.useLayoutEffect(() => {
    const main = document.querySelector('main');
    if (main) main.scrollTop = 0;
    else window.scrollTo(0, 0);
  }, [location.pathname]);

  const range = React.useMemo(() => rangeForPreset(preset), [preset]);

  const auditQuery: AuditLogsQuery = React.useMemo(
    () => ({
      ...range,
      actorEmail: actorEmail.trim() || undefined,
      limit: 100,
      skip: 0,
    }),
    [range, actorEmail]
  );

  const { data: auditResult, isLoading } = useAuditLogs(auditQuery);
  const logs = auditResult?.logs ?? [];

  const { data: byUser } = useQuery({
    queryKey: ['metrics-by-user', range],
    queryFn: () => adminService.getMetricsByUser({ ...range, limit: 8 }),
    staleTime: 60_000,
  });

  const filteredLogs = React.useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter(
      (l) =>
        l.user.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        (l.target || '').toLowerCase().includes(q)
    );
  }, [logs, searchText]);

  const chipEmails = React.useMemo(
    () => new Set((byUser?.users ?? []).map((u) => u.actorEmail)),
    [byUser]
  );

  React.useEffect(() => {
    if (!actorEmail || !chipEmails.has(actorEmail)) return;
    const onPointerDown = (e: PointerEvent) => {
      const root = usersFilterRef.current;
      if (root && !root.contains(e.target as Node)) setActorEmail('');
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [actorEmail, chipEmails]);

  const toggleUserFilter = (email: string) => {
    setActorEmail((prev) => (prev === email ? '' : email));
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await adminService.exportActivityCsv(auditQuery);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `activity-export-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      const err = e as { message?: string };
      await appAlert({
        variant: 'danger',
        title: 'Export failed',
        description: err.message || 'Could not export activity log.',
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto pb-16 animate-in fade-in duration-500 space-y-6">
      <div className="mb-2 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 rounded-xl border border-border/20 bg-surface-highest/10 px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground transition hover:border-primary/30 hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {backLabel}
        </button>
      </div>

      <section
        className={cn(
          'relative overflow-hidden rounded-3xl border border-border/20 dark:border-border/10 p-6 sm:p-8 shadow-2xl shadow-black/20',
          'bg-gradient-to-br from-primary/15 via-surface-highest/20 to-background'
        )}
      >
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70">
                Governance & Audit
              </span>
            </div>
            <h1 className="font-display text-2xl font-black tracking-tight text-foreground sm:text-3xl">
              System Activity
            </h1>
            <p className="mt-1 max-w-xl text-sm font-medium text-muted-foreground">
              Filter by date, user, and workspace. Export CSV for compliance reporting.
            </p>
          </div>

          <div className="flex w-full min-w-0 flex-wrap items-center gap-2 lg:w-auto lg:justify-end">
            <div className="relative min-w-0 flex-1 group sm:flex-initial sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search logs..."
                className="w-full rounded-xl border border-border/10 bg-background/80 py-2.5 pl-10 pr-4 text-sm font-medium focus:border-primary/50 focus:outline-none"
              />
            </div>
            <input
              type="email"
              value={actorEmail}
              onChange={(e) => setActorEmail(e.target.value)}
              placeholder="Filter by user email"
              className="w-full sm:w-48 rounded-xl border border-border/10 bg-background/80 py-2.5 px-3 text-sm"
            />
            <button
              type="button"
              onClick={() => void handleExport()}
              disabled={exporting}
              className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-3 py-2.5 text-sm font-bold text-primary hover:bg-primary/15 disabled:opacity-50"
            >
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Export
            </button>
          </div>
        </div>
      </section>

      <section className="flex flex-wrap gap-2 items-center">
        {(['7d', '30d', '90d', 'month'] as DatePreset[]).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPreset(p)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors',
              preset === p
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-surface-highest/5 border-border/10 text-muted-foreground hover:text-foreground'
            )}
          >
            {p === '7d' ? '7 days' : p === '30d' ? '30 days' : p === '90d' ? '90 days' : 'This month'}
          </button>
        ))}
        {auditResult != null && (
          <span className="text-xs text-muted-foreground ml-auto">
            {auditResult.total} events in range
          </span>
        )}
      </section>

      {byUser?.users && byUser.users.length > 0 && (
        <section
          ref={usersFilterRef}
          className="rounded-2xl border border-border/10 bg-surface-highest/5 p-4"
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
              Most active users
            </h2>
            {actorEmail && chipEmails.has(actorEmail) ? (
              <button
                type="button"
                onClick={() => setActorEmail('')}
                className="text-[10px] font-bold uppercase tracking-widest text-primary hover:text-primary/80"
              >
                Clear filter
              </button>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {byUser.users.map((u) => {
              const selected = actorEmail === u.actorEmail;
              return (
                <button
                  key={u.actorEmail}
                  type="button"
                  onClick={() => toggleUserFilter(u.actorEmail)}
                  aria-pressed={selected}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors',
                    selected
                      ? 'bg-primary/15 border-primary/30 text-primary'
                      : 'bg-background border-border/10 text-muted-foreground hover:text-foreground'
                  )}
                >
                  {u.actorEmail} ({u.eventCount})
                  {selected ? <span className="text-[10px] opacity-70">×</span> : null}
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section className="relative min-h-[min(400px,60vh)] overflow-hidden rounded-2xl border border-border/5 bg-surface-highest/5 p-4 sm:p-6 md:p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
        <div className="relative">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading activity…
            </div>
          ) : (
            <ActivityFeed role={role} logs={filteredLogs} />
          )}
        </div>
      </section>
    </div>
  );
};
