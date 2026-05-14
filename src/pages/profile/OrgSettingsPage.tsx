import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Building2, Database, ShieldCheck, Users } from 'lucide-react';
import { useRbac } from '../../hooks/useRbac';
import { cn } from '../../utils/cn';
import { ConnectorsPanel } from '../../components/admin/ConnectorsPanel';
import OrgAiSettingsPanel from '../../components/admin/OrgAiSettingsPanel';
import SubscriptionPanel from '../../components/admin/SubscriptionPanel';
import { useAuthStore } from '../../stores/authStore';
import { useDashboardState } from '../../services/adminService';
import { StatCard } from '../../components/ui/StatCard';

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
        <StatCard
          label="Organization"
          value={orgName || '—'}
          trend={{ value: String(orgSlug || 'Org'), label: String(orgId || '').substring(0, 8), isPositive: true }}
          icon={<Building2 className="w-4 h-4" />}
        />
        <StatCard
          label="Members"
          value={dashboard?.stats.totalUsers ?? '—'}
          icon={<Users className="w-4 h-4" />}
        />
        <StatCard
          label="Workspaces"
          value={dashboard?.stats.totalGroups ?? groups.length}
          trend={{ value: String(activeWorkspace || ''), label: 'Current', isPositive: true }}
          icon={<Database className="w-4 h-4" />}
        />
        <StatCard
          label="Governance Role"
          value={String(orgRole || 'MEMBER').replace(/_/g, ' ')}
          icon={<ShieldCheck className="w-4 h-4" />}
        />
      </section>

      {/* For COMPANY_ADMIN only (route-level gating). */}
      <ConnectorsPanel />
      <OrgAiSettingsPanel />
      <SubscriptionPanel />
    </div>
  );
};

export default OrgSettingsPage;

