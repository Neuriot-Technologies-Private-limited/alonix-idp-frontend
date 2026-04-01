import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Building2, Database, ShieldCheck, Users } from 'lucide-react';
import { useRbac } from '../../hooks/useRbac';
import { cn } from '../../utils/cn';
import OrgAiSettingsPanel from '../../components/admin/OrgAiSettingsPanel';
import { useAuthStore } from '../../stores/authStore';
import { useDashboardState } from '../../services/adminService';

const OrgSettingsPage: React.FC = () => {
  const { orgRole, groups } = useRbac();
  const context = useAuthStore((s) => s.context);
  const user = useAuthStore((s) => s.user);
  const { data: dashboard } = useDashboardState();
  const isCompanyAdmin = orgRole === 'COMPANY_ADMIN';
  const orgId = context?.orgId || user?.orgId || '-';
  const orgName = dashboard?.orgName || '';
  const orgSlug = dashboard?.orgSlug || '';
  const activeWorkspace =
    groups.find((g) => g.groupId === context?.activeGroupId)?.groupName || 'No active workspace';

  return (
    <div className="w-full max-w-6xl mx-auto pb-16 animate-in fade-in duration-500">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl border border-border/20 bg-surface-highest/10 px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground transition hover:border-primary/30 hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Link>
      </div>

      <div
        className={cn(
          'relative mb-8 overflow-hidden rounded-3xl border border-border/20 dark:border-border/10 p-6 sm:p-10 shadow-2xl shadow-black/20',
          'bg-gradient-to-br from-primary/15 via-surface-highest/20 to-background'
        )}
      >
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/4 h-48 w-48 rounded-full bg-violet/10 blur-3xl" />

        <div className="relative flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-black tracking-tight text-foreground sm:text-3xl">
              Organization Settings
            </h1>
            <p className="mt-1 text-sm font-medium text-muted-foreground">
              Company admins can manage organization-level AI provider settings.
            </p>
          </div>

          {!isCompanyAdmin ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2 text-[12px] font-bold text-destructive">
              Forbidden
            </div>
          ) : null}
        </div>
      </div>

      <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-border/20 bg-surface-lowest dark:bg-surface-highest/5 dark:border-border/10 p-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="rounded-lg bg-primary/15 p-2 text-primary">
              <Building2 className="h-4 w-4" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
              Organization
            </p>
          </div>
          <p className="text-sm font-semibold text-foreground">{orgName || '—'}</p>
          <p className="mt-1 text-[11px] font-medium text-muted-foreground">Slug</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{orgSlug || '—'}</p>
          <div className="mt-3 h-px bg-border/10" />
          <p className="mt-3 text-[11px] font-medium text-muted-foreground">Tenant ID</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{orgId}</p>
        </article>

        <article className="rounded-2xl border border-border/20 bg-surface-lowest dark:bg-surface-highest/5 dark:border-border/10 p-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="rounded-lg bg-success/10 p-2 text-success">
              <Users className="h-4 w-4" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
              Members
            </p>
          </div>
          <p className="text-2xl font-black text-foreground">{dashboard?.stats.totalUsers ?? '—'}</p>
          <p className="mt-1 text-xs text-muted-foreground">Active users in this organization</p>
        </article>

        <article className="rounded-2xl border border-border/20 bg-surface-lowest dark:bg-surface-highest/5 dark:border-border/10 p-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="rounded-lg bg-info/10 p-2 text-info">
              <Database className="h-4 w-4" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
              Workspaces
            </p>
          </div>
          <p className="text-2xl font-black text-foreground">{dashboard?.stats.totalGroups ?? groups.length}</p>
          <p className="mt-1 truncate text-xs text-muted-foreground">Current: {activeWorkspace}</p>
        </article>

        <article className="rounded-2xl border border-border/20 bg-surface-lowest dark:bg-surface-highest/5 dark:border-border/10 p-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="rounded-lg bg-violet/10 p-2 text-violet">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
              Governance
            </p>
          </div>
          <p className="text-sm font-semibold text-foreground">Role model</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Org role: {orgRole || 'MEMBER'} · Access scoped by active workspace capabilities.
          </p>
        </article>
      </section>

      {/* For COMPANY_ADMIN only (route-level gating). */}
      <OrgAiSettingsPanel />
    </div>
  );
};

export default OrgSettingsPage;

