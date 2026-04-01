import React from 'react';
import {
  UserPlus,
  Mail,
  Shield,
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  ChevronDown,
  Edit2,
  Trash2,
  UserX,
  KeyRound,
  X,
} from 'lucide-react';
import { useUsers } from '../../services/userService';
import { useGroupHealth } from '../../services/adminService';
import { InviteUsersToGroupModal } from '../groups/modals/InviteUsersToGroupModal';
import { Loader } from '../../components/ui/Loader';
import { cn } from '../../utils/cn';
import { Pagination } from '../../components/ui/Pagination';
import { SearchInput } from '../../components/ui/SearchInput';
import { useRbac } from '../../hooks/useRbac';
import { useAuthStore } from '../../stores/authStore';

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const config: Record<string, { icon: React.FC<any>; cls: string; dot: string }> = {
    Active:   { icon: CheckCircle2, cls: 'text-success bg-success/10 border-success/20', dot: 'bg-success' },
    Inactive: { icon: XCircle,      cls: 'text-muted-foreground/40 bg-muted/10 border-border/5',      dot: 'bg-muted-foreground/30' },
    Pending:  { icon: Clock,        cls: 'text-warning bg-warning/10 border-warning/20',        dot: 'bg-warning' },
  };
  const c = config[status] ?? config['Inactive'];
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border', c.cls)}>
      <span className={cn('w-1.5 h-1.5 rounded-full animate-pulse', c.dot)} />
      {status}
    </span>
  );
};

// ─── Role Badge ───────────────────────────────────────────────────────────────
const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
  const isAdmin = role === 'COMPANY_ADMIN';
  const isGroupAdmin = role === 'GROUP_ADMIN';
  return (
    <div className="flex items-center gap-2">
      <div className={cn(
        'w-7 h-7 rounded-lg flex items-center justify-center border shrink-0',
        isAdmin ? 'bg-primary/10 border-primary/30 text-primary' :
        isGroupAdmin ? 'bg-violet/10 border-violet/20 text-violet' :
        'bg-surface-highest/5 border-border/10 text-muted-foreground/40'
      )}>
        {isAdmin ? <ShieldCheck className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
      </div>
      <span className="text-[10px] font-black text-foreground/70 uppercase tracking-widest whitespace-nowrap">
        {role.replace(/_/g, ' ')}
      </span>
    </div>
  );
};

/** Inline icon actions + native tooltip (`title`) / `aria-label`, same idea as Documents pipeline row. */
const rowActionBtn =
  'shrink-0 h-9 w-9 p-0 rounded-lg border flex items-center justify-center transition-all touch-manipulation active:scale-95';

type RowActionDef = {
  key: string;
  icon: React.ElementType<{ className?: string; 'aria-hidden'?: boolean }>;
  title: string;
  className: string;
};

// ─── Row Actions (inline icons, no dropdown) ──────────────────────────────────
const RowActions: React.FC<{
  rowKey: string;
  rowEmail: string;
  canManageCompany: boolean;
}> = ({ rowKey: _rowKey, rowEmail, canManageCompany }) => {
  const selfEmail = useAuthStore((s) => s.user?.email?.toLowerCase().trim() ?? '');
  const isSelf = Boolean(selfEmail && rowEmail.toLowerCase().trim() === selfEmail);

  const companyAll: RowActionDef[] = [
    {
      key: 'edit',
      icon: Edit2,
      title: 'Edit profile',
      className: cn(
        rowActionBtn,
        'border-border/10 bg-surface-highest/5 text-muted-foreground/60 hover:border-primary/35 hover:bg-primary/10 hover:text-primary'
      ),
    },
    {
      key: 'reset',
      icon: KeyRound,
      title: 'Reset password',
      className: cn(
        rowActionBtn,
        'border-border/10 bg-surface-highest/5 text-muted-foreground/60 hover:border-warning/30 hover:bg-warning/10 hover:text-warning'
      ),
    },
    {
      key: 'suspend',
      icon: UserX,
      title: 'Suspend user',
      className: cn(
        rowActionBtn,
        'border-border/10 bg-surface-highest/5 text-muted-foreground/60 hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive'
      ),
    },
    {
      key: 'remove',
      icon: Trash2,
      title: 'Remove user',
      className: cn(
        rowActionBtn,
        'border-border/10 bg-surface-highest/5 text-muted-foreground/60 hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive'
      ),
    },
  ];

  const groupAdminAll: RowActionDef[] = [
    {
      key: 'add',
      icon: UserPlus,
      title: 'Add to group',
      className: cn(
        rowActionBtn,
        'border-border/10 bg-surface-highest/5 text-muted-foreground/60 hover:border-primary/35 hover:bg-primary/10 hover:text-primary'
      ),
    },
    {
      key: 'removeGroup',
      icon: UserX,
      title: 'Remove from group',
      className: cn(
        rowActionBtn,
        'border-border/10 bg-surface-highest/5 text-muted-foreground/60 hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive'
      ),
    },
  ];

  /** You cannot reset your own password, suspend, or delete yourself from this list. */
  const actions = canManageCompany
    ? isSelf
      ? companyAll.filter((a) => a.key === 'edit')
      : companyAll
    : isSelf
      ? []
      : groupAdminAll;

  if (actions.length === 0) {
    return (
      <span className="text-[10px] font-medium text-muted-foreground/35" title="No actions for your account on this row">
        —
      </span>
    );
  }

  return (
    <div className="flex min-w-max items-center justify-end gap-1 whitespace-nowrap sm:gap-1.5">
      {actions.map(({ key, icon: Icon, title, className }) => (
        <button
          key={key}
          type="button"
          aria-label={title}
          title={title}
          onClick={(e) => e.stopPropagation()}
          className={className}
        >
          <Icon className="h-4 w-4" aria-hidden />
        </button>
      ))}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export const UserManagement: React.FC = () => {
  const { data: users, isLoading } = useUsers();
  const { data: groupHealthList = [] } = useGroupHealth();
  const { orgRole, hasAnyGroupAdmin, adminGroupIds } = useRbac();
  const isCompanyAdmin = orgRole === 'COMPANY_ADMIN';
  const adminIdSet = React.useMemo(
    () =>
      !isCompanyAdmin && adminGroupIds?.length
        ? new Set(adminGroupIds.map(String))
        : null,
    [isCompanyAdmin, adminGroupIds]
  );

  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [search, setSearch]               = React.useState('');
  const [groupFilter, setGroupFilter]     = React.useState('All');
  const [statusFilter, setStatusFilter]   = React.useState('All');
  const [currentPage, setCurrentPage]     = React.useState(1);
  const itemsPerPage = 8;

  // Derived filter options from data
  const baseUsers = React.useMemo(() => {
    if (!users) return [];
    if (isCompanyAdmin) return users;
    if (!hasAnyGroupAdmin || !adminIdSet) return [];
    return users.filter((u: any) => adminIdSet.has(String(u.groupID)));
  }, [users, isCompanyAdmin, hasAnyGroupAdmin, adminIdSet]);

  const groups = React.useMemo(() => {
    if (!baseUsers.length) return ['All'];
    return ['All', ...Array.from(new Set(baseUsers.map((u: any) => u.group)))];
  }, [baseUsers]);

  // Reset to page 1 on filter change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, groupFilter, statusFilter]);

  const statuses = ['All', 'Active', 'Inactive', 'Pending'];

  // Filtered users
  const filtered = React.useMemo(() => {
    if (!baseUsers.length) return [];
    return baseUsers.filter((u: any) => {
      const q = search.toLowerCase();
      const matchSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q);
      const matchGroup  = groupFilter  === 'All' || u.group  === groupFilter;
      const matchStatus = statusFilter === 'All' || u.status === statusFilter;
      return matchSearch && matchGroup && matchStatus;
    });
  }, [baseUsers, search, groupFilter, statusFilter]);

  const paginatedUsers = React.useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  // Quick stats from data
  const totalUsers  = baseUsers.length;
  const activeCount = baseUsers.filter((u: any) => u.status === 'Active').length;
  const pendingCount = baseUsers.filter((u: any) => u.status === 'Pending').length;

  const hasFilters = search || groupFilter !== 'All' || statusFilter !== 'All';

  /** Map navbar workspace to a row in group-health (mock ids) when names align. */
  const inviteGroups = React.useMemo(() => {
    if (isCompanyAdmin) return groupHealthList;
    if (!adminGroupIds?.length) return [];
    const set = new Set(adminGroupIds.map(String));
    return groupHealthList.filter((h) => set.has(String(h.id)));
  }, [isCompanyAdmin, groupHealthList, adminGroupIds]);

  return (
    <div className="w-full min-w-0 space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:space-y-6">

      {/* ── Header ── */}
      <section className="flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-start md:items-center">
        <div className="min-w-0 space-y-1">
          <h1 className="bg-gradient-to-r from-foreground to-foreground/50 bg-clip-text font-display text-xl font-black tracking-tight text-transparent sm:text-2xl">
            {isCompanyAdmin ? 'Users' : 'Group Members'}
          </h1>
          <p className="text-[11px] font-medium tracking-wide text-muted-foreground sm:text-[12px]">
            {isCompanyAdmin
              ? 'Manage access, roles, and group assignments for all members.'
              : 'Manage membership for workspaces where you are a group administrator.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setInviteOpen(true)}
          className="flex w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-border/10 bg-primary px-5 py-3 font-bold text-[11px] uppercase tracking-widest text-primary-foreground transition-all hover:opacity-90 active:scale-95 sm:w-auto"
        >
          <UserPlus className="h-4 w-4" />
          {isCompanyAdmin ? 'Invite User' : 'Add To Group'}
        </button>
      </section>

      <InviteUsersToGroupModal
        isOpen={inviteOpen}
        onClose={() => setInviteOpen(false)}
        groups={inviteGroups}
        users={users ?? []}
      />

      {/* ── Stats strip ── */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        {[
          { label: 'Total Users',   value: totalUsers,   sub: 'All members',      color: 'text-primary' },
          { label: 'Active',        value: activeCount,  sub: 'Online / verified', color: 'text-success' },
          { label: 'Pending',       value: pendingCount, sub: 'Awaiting onboard',  color: 'text-warning' },
        ].map(s => (
          <div
            key={s.label}
            className="flex items-center gap-4 rounded-2xl border border-border/5 bg-surface-highest/5 p-3.5 sm:p-4"
          >
            <div className="min-w-0">
              <p className={cn('text-xl font-black sm:text-2xl', s.color)}>{s.value}</p>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/30">{s.label}</p>
              <p className="mt-0.5 text-[8px] text-muted-foreground/20">{s.sub}</p>
            </div>
          </div>
        ))}
      </section>

      {/* ── Filters bar ── */}
      <section className="flex flex-col items-stretch gap-3 md:flex-row md:flex-wrap md:items-center">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name, email or role..."
          showClear
          inputClassName="focus:ring-primary/20"
        />

        {/* Group filter */}
        <div className="relative shrink-0">
          <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/30 pointer-events-none" />
          <select
            value={groupFilter}
            onChange={e => setGroupFilter(e.target.value)}
            className="appearance-none bg-surface-highest/5 border border-border/10 rounded-xl pl-9 pr-8 py-3 text-[11px] font-black uppercase tracking-widest text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          >
            {groups.map(g => <option key={g} value={g}>{g === 'All' ? 'All Groups' : g}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground/30 pointer-events-none" />
        </div>

        {/* Status filter pills */}
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5 rounded-xl border border-border/10 bg-surface-highest/5 p-1 md:max-w-none md:flex-initial md:shrink-0">
          {statuses.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all',
                statusFilter === s
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground/40 hover:text-foreground'
              )}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Clear filters */}
        {hasFilters && (
          <button
            onClick={() => { setSearch(''); setGroupFilter('All'); setStatusFilter('All'); }}
            className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30 hover:text-destructive transition-colors flex items-center gap-1 shrink-0"
          >
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </section>

      {/* ── Table ── */}
      <section className="overflow-hidden rounded-2xl border border-border/5 bg-surface-highest/5 shadow-xl backdrop-blur-xl">
        {/* Results count */}
        <div className="flex items-center justify-between border-b border-border/5 px-4 py-3 sm:px-6">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/30">
            {filtered.length} User{filtered.length !== 1 ? 's' : ''}
            {hasFilters ? ` matching filters` : ''}
          </p>
        </div>

        <div className="-mx-px overflow-x-auto overscroll-x-contain sm:mx-0">
          <table className="w-full min-w-[640px] border-collapse text-left sm:min-w-0">
            <thead>
              <tr className="border-b border-border/5 bg-muted/5">
                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/30 sm:px-6">User</th>
                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/30 sm:px-6">Role</th>
                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/30 sm:px-6">Group</th>
                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/30 sm:px-6">Status</th>
                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/30 sm:px-6">Last Active</th>
                <th className="px-4 py-3 text-right text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/30 sm:px-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/10">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-6">
                    <Loader variant="section" label="Loading users" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/30">No users found</p>
                    <p className="text-[9px] text-muted-foreground/20 mt-1">Try adjusting your filters</p>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user: any) => (
                  <tr key={user._id} className="hover:bg-surface-highest/5 transition-all group/row">
                    {/* User */}
                    <td className="px-4 py-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-border/10 flex items-center justify-center text-primary font-black text-sm shrink-0">
                          {user.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-bold text-foreground group-hover/row:text-primary transition-colors truncate">
                            {user.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground/30 flex items-center gap-1 mt-0.5 truncate">
                            <Mail className="w-3 h-3 shrink-0" /> {user.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="whitespace-nowrap px-4 py-4 sm:px-6">
                      <RoleBadge role={user.role} />
                    </td>

                    {/* Group — names from API (`groupLabel` / memberships); hover shows full list if truncated */}
                    <td className="max-w-[min(14rem,40vw)] px-4 py-4 sm:px-6">
                      <span
                        title={user.group}
                        className="inline-block max-w-full truncate rounded-lg border border-border/10 bg-surface-highest/5 px-3 py-1.5 text-left text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/80"
                      >
                        {user.group}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="whitespace-nowrap px-4 py-4 sm:px-6">
                      <StatusBadge status={user.status} />
                    </td>

                    {/* Last Active */}
                    <td className="whitespace-nowrap px-4 py-4 sm:px-6">
                      <span className="text-[10px] font-bold text-muted-foreground/30">{user.lastActive}</span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4 text-right sm:px-6">
                      <RowActions
                        rowKey={user._id}
                        rowEmail={String(user.email ?? '')}
                        canManageCompany={isCompanyAdmin}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(filtered.length / itemsPerPage)}
          onPageChange={setCurrentPage}
          totalItems={filtered.length}
          itemsPerPage={itemsPerPage}
        />
      </section>
    </div>
  );
};
