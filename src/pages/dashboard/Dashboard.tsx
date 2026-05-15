import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Database,
  FileText,
  Zap,
  ArrowUpRight,
  Activity,
} from 'lucide-react';
import { useDashboardState, type GroupHealth } from '../../services/adminService';
import { cn } from '../../utils/cn';
import { useAuthStore } from '../../stores/authStore';
import { useRbac } from '../../hooks/useRbac';
import { ActivityFeed } from '../../components/admin/ActivityFeed';
import { GroupCard } from '../../components/ui/GroupCard';
import { Loader } from '../../components/ui/Loader';
import { StatCard } from '../../components/ui/StatCard';
import { getChatSessions, type ChatSessionDto } from '../../services/chatApi';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const {
    data: dash,
    isLoading: dashLoading,
    isError: dashError,
    error: dashErrorDetail,
  } = useDashboardState();
  const stats = dash?.stats;
  const groupRows = dash?.groups ?? [];
  const userRows = dash?.usersPreview ?? [];
  const docRows = (dash?.documents as any[] | undefined) ?? [];
  const statsLoading = dashLoading;
  const groupsLoading = dashLoading;
  const usersLoading = dashLoading;
  const docsLoading = dashLoading;
  const {
    orgRole,
    activeGroupRole,
    accessibleGroupIds,
    hasAnyGroupAdmin,
    isGroupAdminFor,
  } = useRbac();
  const { user } = useAuthStore();
  const activeGroupId = useAuthStore((s) => s.context?.activeGroupId);

  const isCompanyAdmin = orgRole === 'COMPANY_ADMIN';
  const memberContext = useAuthStore((s) => s.context?.groups ?? []);
  const isPureSearchUser =
    !isCompanyAdmin &&
    memberContext.length > 0 &&
    memberContext.every((g) => g.role === 'SEARCH_USER');

  const analysisBusyCount = React.useMemo(() => {
    return docRows.filter((d: any) => {
      const p = d.pipeline;
      return (
        p?.ingestion?.status === 'processing' ||
        p?.extraction?.status === 'processing' ||
        p?.classification?.status === 'processing'
      );
    }).length;
  }, [docRows]);

  const { data: myChatSessionsCount = 0, isLoading: chatSessionsLoading } = useQuery({
    queryKey: ['my-chat-sessions-count', user?.email, activeGroupId, [...accessibleGroupIds].sort().join(',')],
    enabled: Boolean(user?.email) && isPureSearchUser,
    queryFn: async () => {
      const gids = accessibleGroupIds.length ? [...new Set(accessibleGroupIds)] : [];
      const buckets = gids.length
        ? await Promise.all(gids.map((gid) => getChatSessions(gid).then((r) => r.data?.sessions || [])))
        : [((await getChatSessions(activeGroupId || undefined)).data?.sessions || []) as ChatSessionDto[]];
      const all = buckets.flat();
      const unique = new Set(all.map((s) => String(s.session_id || '')));
      unique.delete('');
      return unique.size;
    },
    staleTime: 60_000,
  });
  const ingestionValue = stats?.ingestionCount ?? 0;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="w-full min-w-0 space-y-5 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-[max(2.5rem,env(safe-area-inset-bottom))]">

      {/* ── Header ── */}
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="bg-gradient-to-r from-foreground to-foreground/55 bg-clip-text text-base font-black font-display text-transparent tracking-tight sm:text-lg">
            {greeting()}, {user?.name || user?.email?.split('@')[0] || 'User'} 👋
          </h1>
          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          {dash?.statsScope === 'workspaces' && (
            <p className="mt-1 max-w-md text-[10px] font-medium leading-snug text-muted-foreground/55">
              Showing workspaces you belong to
              {dash.activeGroupRole
                ? ` · Active workspace role: ${dash.activeGroupRole.replace(/_/g, ' ')}`
                : ''}
            </p>
          )}
        </div>
        {isCompanyAdmin && (
          <div className="flex shrink-0 items-center gap-1.5 self-start rounded-xl border border-success/30 bg-gradient-to-r from-success/15 to-success/8 px-2.5 py-1.5 sm:self-auto sm:px-3 shadow-[0_8px_24px_rgba(56,178,114,0.14)]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
            <span className="text-[8px] font-black uppercase tracking-widest text-success sm:text-[9px]">
              All Systems Nominal
            </span>
          </div>
        )}
      </div>

      {dashError && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {(dashErrorDetail as Error)?.message || 'Could not load dashboard. Ensure you are signed in with org access.'}
        </div>
      )}

      {/* ── Stat Strip ── */}
      <section className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        <StatCard
          label={isCompanyAdmin ? "Total Groups" : "Assigned Groups"}
          value={stats?.totalGroups ?? 0}
          trend={stats?.groupsTendency ?? { value: '—', label: 'trend', isPositive: true }}
          icon={<Database className="w-4 h-4" />}
          loading={statsLoading}
        />
        <StatCard
          label={isCompanyAdmin ? "Total Users" : "Users"}
          value={stats?.totalUsers ?? 0}
          trend={stats?.usersTendency ?? { value: '—', label: 'trend', isPositive: true }}
          icon={<Users className="w-4 h-4" />}
          loading={statsLoading}
        />
        <StatCard
          label={isCompanyAdmin ? "Total Documents" : "Documents"}
          value={stats?.totalDocuments ?? 0}
          trend={stats?.docsTendency ?? { value: '—', label: 'trend', isPositive: true }}
          icon={<FileText className="w-4 h-4" />}
          loading={statsLoading}
        />
        <StatCard
          label={
            isCompanyAdmin
              ? 'In Ingestion'
              : isPureSearchUser
                ? 'Chat Sessions'
                : 'Recent Analysis'
          }
          value={
            isCompanyAdmin
              ? ingestionValue
              : isPureSearchUser
                ? myChatSessionsCount
                : ingestionValue || analysisBusyCount || docRows.length
          }
          trend={
            isCompanyAdmin
              ? (stats?.ingestionTendency ?? {
                  value: ingestionValue > 0 ? 'Live' : 'Idle',
                  label: ingestionValue > 0 ? 'Processing' : 'No active jobs',
                  isPositive: ingestionValue > 0,
                })
              : {
                  value: 'Live',
                  label: isPureSearchUser ? 'Ready' : 'Processing',
                  isPositive: true,
                }
          }
          icon={<Zap className="w-4 h-4" />}
          isPulse={
            (isCompanyAdmin && ingestionValue > 0) ||
            (!isPureSearchUser && analysisBusyCount > 0)
          }
          loading={statsLoading || (isPureSearchUser && chatSessionsLoading)}
        />
      </section>

      {/* ── Main 2-col grid ── */}
      <section className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-12">

        {/* Left col (8) */}
        <div className="lg:col-span-8 space-y-5">

          {/* Group Health */}
          {(isCompanyAdmin || accessibleGroupIds.length > 0) && (
            <div className="bg-gradient-to-br from-surface-highest/24 via-surface-highest/12 to-transparent rounded-2xl border border-border/35 dark:border-border/50 overflow-hidden shadow-lg shadow-black/5 dark:shadow-black/20 backdrop-blur-xl">
              <div className="px-5 py-3 border-b border-border/25 dark:border-border/40 bg-gradient-to-r from-primary/12 via-primary/5 to-transparent flex items-center justify-between">
                <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                  {isCompanyAdmin ? 'Group Health' : 'Group Performance'}
                </h2>
                <button
                  onClick={() => navigate('/groups')}
                  className="text-primary font-bold text-[10px] flex items-center gap-1 hover:opacity-80 transition-all"
                >
                  View All <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
              <div className="p-3 space-y-2">
                {groupsLoading ? (
                  <Loader variant="section" label="Loading groups" />
                ) : (
                  groupRows.slice(0, 5).map((group: GroupHealth) => (
                    <GroupCard
                      key={group.id}
                      group={group}
                      view="list"
                      primaryActionLabel={
                        isCompanyAdmin || isGroupAdminFor(group.id) ? 'Enter' : 'View'
                      }
                      onClick={() => navigate(`/groups/${group.id}`)}
                    />
                  ))
                )}
              </div>
            </div>
          )}

          {/* Activity Feed */}
          {isCompanyAdmin && (
          <div className="bg-gradient-to-br from-surface-highest/24 via-surface-highest/12 to-transparent rounded-2xl border border-border/35 dark:border-border/50 overflow-hidden shadow-lg shadow-black/5 dark:shadow-black/20 backdrop-blur-xl">
            <div className="px-5 py-3 border-b border-border/25 dark:border-border/40 bg-gradient-to-r from-primary/12 via-primary/5 to-transparent flex items-center justify-between">
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-primary" />
                Activity Feed
              </h2>
              <button
                onClick={() =>
                  navigate('/activity', { state: { from: '/dashboard', fromLabel: 'Dashboard' } })
                }
                className="text-primary font-bold text-[10px] flex items-center gap-1 hover:opacity-80 transition-all"
              >
                View All <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
            <div className="p-4">
              {dashLoading ? (
                <Loader variant="section" label="Loading activity" />
              ) : (
                <ActivityFeed
                  role={(orgRole || activeGroupRole || undefined) as string}
                  limit={5}
                  logs={dash?.auditLogs ?? []}
                />
              )}
            </div>
          </div>
          )}
        </div>

        {/* Right col (4) */}
        <div className="lg:col-span-4 space-y-5">

          {/* Recent Documents */}
          {isCompanyAdmin ? (
          <div className="bg-gradient-to-br from-surface-highest/24 via-surface-highest/12 to-transparent rounded-2xl border border-border/35 dark:border-border/50 overflow-hidden shadow-lg shadow-black/5 dark:shadow-black/20 backdrop-blur-xl">
            <div className="px-5 py-3 border-b border-border/25 dark:border-border/40 bg-gradient-to-r from-primary/12 via-primary/5 to-transparent flex items-center justify-between">
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-primary" />
                Recent Documents
              </h2>
              <button onClick={() => navigate('/documents')} className="text-primary text-[10px] font-bold hover:opacity-80 transition-all">
                View All
              </button>
            </div>
            <div className="p-3 space-y-1">
              {docsLoading ? (
                <Loader variant="section" label="Loading" />
              ) : docRows.length === 0 ? (
                <p className="px-2 py-6 text-center text-[11px] leading-relaxed text-muted-foreground/50">
                  No documents in your accessible workspaces yet. Open Documents to upload or ingest files.
                </p>
              ) : (
                docRows.slice(-4).reverse().map((d: any) => (
                  <div
                    key={d.id}
                    onClick={() => navigate('/documents')}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-transparent hover:border-border/25 dark:hover:border-border/35 hover:bg-surface-low/50 dark:hover:bg-surface-highest/10 transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg border border-border/20 dark:border-border/35 bg-surface-low dark:bg-surface-highest/10 flex items-center justify-center text-muted-foreground/40 shrink-0">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[12px] font-bold text-foreground group-hover:text-primary transition-colors truncate leading-tight">{d.title || d.fileName}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={cn(
                            "w-1 h-1 rounded-full",
                            d.status === 'ingested' ? "bg-success" : d.status === 'pending' ? "bg-warning" : "bg-primary"
                          )} />
                          <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/30">{d.status}</span>
                        </div>
                      </div>
                    </div>
                    <span className="ml-2 shrink-0 text-[9px] font-medium text-muted-foreground/30">
                      {d.updatedAt && !Number.isNaN(new Date(d.updatedAt).getTime())
                        ? new Date(d.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        : '—'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
          ) : null}

          {/* Recent Users */}
          {isCompanyAdmin ? (
          <div className="bg-gradient-to-br from-surface-highest/24 via-surface-highest/12 to-transparent rounded-2xl border border-border/35 dark:border-border/50 overflow-hidden shadow-lg shadow-black/5 dark:shadow-black/20 backdrop-blur-xl">
            <div className="px-5 py-3 border-b border-border/25 dark:border-border/40 bg-gradient-to-r from-primary/12 via-primary/5 to-transparent flex items-center justify-between">
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-primary" />
                Recent Users
              </h2>
              {hasAnyGroupAdmin ? (
              <button onClick={() => navigate('/users')} className="text-primary text-[10px] font-bold hover:opacity-80 transition-all">
                View All
              </button>
              ) : null}
            </div>
            <div className="p-3 space-y-1">
              {usersLoading ? (
                <Loader variant="section" label="Loading" />
              ) : userRows.length === 0 ? (
                <p className="px-2 py-6 text-center text-[11px] leading-relaxed text-muted-foreground/50">
                  {isCompanyAdmin
                    ? 'No users found for this organization yet.'
                    : 'Organization user list is visible to company admins. Use chat and documents in your assigned workspaces.'}
                </p>
              ) : (
                userRows.slice(-4).reverse().map((u: any) => (
                  <div
                    key={u._id}
                    onClick={() => hasAnyGroupAdmin && navigate('/users')}
                    className={cn(
                      'flex items-center justify-between p-2.5 rounded-xl transition-all group',
                      hasAnyGroupAdmin ? 'hover:bg-surface-highest/10 cursor-pointer' : 'cursor-default opacity-90'
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg border border-primary/20 bg-primary/12 flex items-center justify-center text-[9px] font-black text-primary shrink-0">
                        {u.name.split(' ').map((n: string) => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-[12px] font-bold text-foreground group-hover:text-primary transition-colors leading-tight">{u.name}</p>
                        <p className="text-[9px] text-muted-foreground/30 uppercase tracking-widest font-bold">{u.role.replace(/_/g, ' ')}</p>
                      </div>
                    </div>
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full shrink-0",
                      u.status === 'Active' ? 'bg-success' : u.status === 'Pending' ? 'bg-warning' : 'bg-muted-foreground/20'
                    )} />
                  </div>
                ))
              )}
            </div>
          </div>
          ) : null}

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-surface-highest/24 via-surface-highest/12 to-transparent rounded-2xl border border-border/35 dark:border-border/50 p-4 space-y-2 shadow-lg shadow-black/5 dark:shadow-black/20 backdrop-blur-xl">
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-3">Quick Actions</h2>
            {[
              ...(hasAnyGroupAdmin ? [{ label: 'Invite User', path: '/users', icon: Users }] : []),
              { label: 'View Groups', path: '/groups', icon: Database },
              { label: 'Browse Documents', path: '/documents', icon: FileText },
            ].map(({ label, path, icon: Icon }) => (
              <button
                key={label}
                onClick={() => navigate(path)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-surface-low/50 dark:hover:bg-surface-highest/10 border border-border/15 dark:border-border/30 hover:border-border/30 dark:hover:border-border/45 transition-all group text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg border border-primary/20 bg-primary/12 flex items-center justify-center text-primary shadow-[0_0_0_1px_hsl(var(--foreground)/0.02)]">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[11px] font-bold text-muted-foreground/60 group-hover:text-foreground transition-colors">{label}</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground/20 group-hover:text-primary transition-all" />
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
