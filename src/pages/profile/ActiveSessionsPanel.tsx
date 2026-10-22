import React, { useCallback, useEffect, useState } from 'react';
import {
  Laptop,
  Loader2,
  LogOut,
  MonitorSmartphone,
  RefreshCw,
  Smartphone,
  Tablet,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { authApi, type AuthSessionRow } from '../../services/authApi';
import { useAlert } from '../../components/alert';
import { useAuthStore } from '../../stores/authStore';
import { cn } from '../../utils/cn';

function deviceIcon(label: string) {
  const l = label.toLowerCase();
  if (l.includes('iphone') || l.includes('android') || l.includes('ios')) {
    return Smartphone;
  }
  if (l.includes('ipad') || l.includes('tablet')) return Tablet;
  if (l.includes('mac') || l.includes('windows') || l.includes('linux') || l.includes('chrome os')) {
    return Laptop;
  }
  return MonitorSmartphone;
}

function formatWhen(iso: string | null): string {
  if (!iso) return 'Unknown';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return 'Unknown';
  const diffMs = Date.now() - t;
  if (diffMs < 60_000) return 'Just now';
  if (diffMs < 3_600_000) {
    const m = Math.floor(diffMs / 60_000);
    return `${m}m ago`;
  }
  if (diffMs < 86_400_000) {
    const h = Math.floor(diffMs / 3_600_000);
    return `${h}h ago`;
  }
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatSignedIn(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export const ActiveSessionsPanel: React.FC = () => {
  const { alert: appAlert } = useAlert();
  const logout = useAuthStore((s) => s.logout);
  const [sessions, setSessions] = useState<AuthSessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [revokeOthersBusy, setRevokeOthersBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { sessions: rows } = await authApi.listSessions();
      setSessions(rows);
    } catch {
      setSessions([]);
      void appAlert({
        title: 'Could not load sessions',
        description: 'Refresh the page or try again in a moment.',
        variant: 'danger',
      });
    } finally {
      setLoading(false);
    }
  }, [appAlert]);

  useEffect(() => {
    void load();
  }, [load]);

  const otherCount = sessions.filter((s) => !s.isCurrent).length;

  const revokeOne = async (row: AuthSessionRow) => {
    if (busyId) return;
    setBusyId(row.id);
    try {
      const result = await authApi.revokeSession(row.id);
      if (result.current) {
        await logout();
        return;
      }
      setSessions((prev) => prev.filter((s) => s.id !== row.id));
      void appAlert({
        title: 'Session signed out',
        description: `${row.deviceLabel} can no longer access your account.`,
        variant: 'success',
      });
    } catch {
      void appAlert({
        title: 'Sign-out failed',
        description: 'That session may already be gone. Refresh and try again.',
        variant: 'danger',
      });
    } finally {
      setBusyId(null);
    }
  };

  const revokeOthers = async () => {
    if (revokeOthersBusy || otherCount === 0) return;
    setRevokeOthersBusy(true);
    try {
      const { revokedCount } = await authApi.revokeOtherSessions();
      await load();
      void appAlert({
        title: 'Other sessions signed out',
        description:
          revokedCount > 0
            ? `${revokedCount} device${revokedCount === 1 ? '' : 's'} removed.`
            : 'No other active sessions found.',
        variant: 'success',
      });
    } catch {
      void appAlert({
        title: 'Could not sign out others',
        description: 'Try again in a moment.',
        variant: 'danger',
      });
    } finally {
      setRevokeOthersBusy(false);
    }
  };

  return (
    <div className="rounded-3xl border border-border/10 bg-surface-highest/5 p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-lg font-black text-foreground">Active sessions</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Devices signed in with your account. Sign out anything you do not recognize.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border/20 bg-background/30 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground transition hover:border-border/40 hover:text-foreground disabled:opacity-50"
          aria-label="Refresh sessions"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      <div className="mt-6 space-y-2.5">
        {loading && sessions.length === 0 ? (
          <div className="flex items-center gap-2 rounded-2xl border border-border/10 bg-background/20 px-4 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading sessions…
          </div>
        ) : null}

        {!loading && sessions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/25 bg-background/15 px-4 py-8 text-center">
            <p className="text-sm font-bold text-foreground">No tracked sessions yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Sign out and sign back in once to start tracking this device. Older logins from before
              this feature will not appear here.
            </p>
          </div>
        ) : null}

        <AnimatePresence initial={false}>
          {sessions.map((row, index) => {
            const Icon = deviceIcon(row.deviceLabel);
            return (
              <motion.div
                key={row.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ delay: Math.min(index * 0.04, 0.2) }}
                className={cn(
                  'group relative overflow-hidden rounded-2xl border px-4 py-3.5 sm:px-5 sm:py-4',
                  row.isCurrent
                    ? 'border-primary/35 bg-primary/[0.07]'
                    : 'border-border/15 bg-background/25 hover:border-border/30'
                )}
              >
                {row.isCurrent ? (
                  <div
                    className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-primary"
                    aria-hidden
                  />
                ) : null}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <div
                      className={cn(
                        'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border',
                        row.isCurrent
                          ? 'border-primary/30 bg-primary/15 text-primary'
                          : 'border-border/20 bg-surface-highest/20 text-muted-foreground'
                      )}
                    >
                      <Icon className="h-4.5 w-4.5 h-[18px] w-[18px]" aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-black text-foreground">
                          {row.deviceLabel}
                        </p>
                        {row.isCurrent ? (
                          <span className="rounded-md bg-primary/20 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-primary">
                            This device
                          </span>
                        ) : null}
                      </div>
                      <dl className="mt-1.5 grid gap-0.5 text-[11px] text-muted-foreground sm:grid-cols-2 sm:gap-x-6">
                        <div className="flex gap-1.5">
                          <dt className="font-bold text-muted-foreground/70">IP</dt>
                          <dd className="font-mono text-[10px] text-foreground/80">
                            {row.ip || '—'}
                          </dd>
                        </div>
                        <div className="flex gap-1.5">
                          <dt className="font-bold text-muted-foreground/70">Last active</dt>
                          <dd className="font-semibold text-foreground/80">
                            {formatWhen(row.lastSeenAt)}
                          </dd>
                        </div>
                        <div className="flex gap-1.5 sm:col-span-2">
                          <dt className="font-bold text-muted-foreground/70">Signed in</dt>
                          <dd className="font-semibold text-foreground/80">
                            {formatSignedIn(row.createdAt)}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => void revokeOne(row)}
                    disabled={busyId === row.id}
                    className={cn(
                      'inline-flex shrink-0 items-center justify-center gap-1.5 self-stretch rounded-xl border px-3.5 py-2.5 text-[10px] font-black uppercase tracking-widest transition sm:self-center',
                      row.isCurrent
                        ? 'border-destructive/35 bg-destructive/10 text-destructive hover:bg-destructive/20'
                        : 'border-border/25 bg-background/40 text-muted-foreground hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive',
                      'disabled:opacity-50'
                    )}
                  >
                    {busyId === row.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <LogOut className="h-3.5 w-3.5" />
                    )}
                    {row.isCurrent ? 'Sign out' : 'Revoke'}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {otherCount > 0 ? (
        <div className="mt-6 flex flex-col gap-3 border-t border-border/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            <span className="font-bold text-foreground">{otherCount}</span> other session
            {otherCount === 1 ? '' : 's'} can access your account.
          </p>
          <button
            type="button"
            onClick={() => void revokeOthers()}
            disabled={revokeOthersBusy}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-destructive/35 bg-destructive/10 px-5 py-3 text-[11px] font-black uppercase tracking-widest text-destructive transition hover:bg-destructive/20 disabled:opacity-50"
          >
            {revokeOthersBusy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            Sign out other sessions
          </button>
        </div>
      ) : null}
    </div>
  );
};
