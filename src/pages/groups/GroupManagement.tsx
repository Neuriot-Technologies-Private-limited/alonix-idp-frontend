import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  LayoutGrid,
  List as ListIcon,
  UserPlus,
} from 'lucide-react';
import { useGroupHealth, type GroupHealth } from '../../services/adminService';
import { useUsers } from '../../services/userService';
import { useRbac } from '../../hooks/useRbac';
import { Loader } from '../../components/ui/Loader';
import { GroupCard } from '../../components/ui/GroupCard';
import { cn } from '../../utils/cn';
import { Pagination } from '../../components/ui/Pagination';
import { SearchInput } from '../../components/ui/SearchInput';
import { CreateGroupModal } from './modals/CreateGroupModal';
import { InviteUsersToGroupModal } from './modals/InviteUsersToGroupModal';

export const GroupManagement: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('groups');
  const { orgRole, isGroupAdminFor } = useRbac();
  const { data: groups, isLoading } = useGroupHealth();
  const { data: allUsers = [] } = useUsers();
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const itemsPerPage = 8;

  const isCompanyAdmin = orgRole === 'COMPANY_ADMIN';

  /** Server scopes list to org; non–company-admins only see workspaces they belong to. */
  const directoryGroups = groups ?? [];

  // Filter groups based on search query (name or id)
  const filteredGroups = React.useMemo(() => {
    if (!directoryGroups.length) return [];
    const q = searchQuery.toLowerCase().trim();
    if (!q) return directoryGroups;
    return directoryGroups.filter((g: GroupHealth) =>
      g.name.toLowerCase().includes(q) ||
      g.id.toString().includes(q) ||
      g.statusLabel.toLowerCase().includes(q)
    );
  }, [directoryGroups, searchQuery]);

  const paginatedGroups = React.useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredGroups.slice(start, start + itemsPerPage);
  }, [filteredGroups, currentPage, itemsPerPage]);

  // Reset to page 1 on search
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  return (
    <div className="w-full min-w-0 space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:space-y-8">
      {/* Header */}
      <section className="flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-start md:items-center">
        <div className="min-w-0 space-y-1.5">
          <h1 className="bg-gradient-to-r from-foreground to-foreground/50 bg-clip-text font-display text-xl font-black tracking-tight text-transparent sm:text-2xl">
            {t('title')}
          </h1>
          <p className="max-w-2xl text-[11px] font-medium tracking-wide text-muted-foreground sm:text-[12px]">
            {t('subtitle')}
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
          {isCompanyAdmin ? (
            <button
              type="button"
              onClick={() => setInviteOpen(true)}
              className="flex w-full shrink-0 items-center justify-center gap-2.5 rounded-2xl border border-border/30 dark:border-border/45 bg-gradient-to-r from-surface-highest/40 to-surface-highest/20 px-5 py-3 font-bold text-[11px] uppercase tracking-widest text-foreground shadow-sm shadow-black/5 transition-all hover:border-border/45 dark:hover:border-border/55 hover:bg-surface-highest/60 active:scale-95 sm:w-auto sm:px-6 sm:py-3.5"
            >
              <UserPlus className="h-4 w-4" />
              {t('inviteUsers')}
            </button>
          ) : null}
          {isCompanyAdmin ? (
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="flex w-full shrink-0 items-center justify-center gap-2.5 rounded-2xl border border-primary/35 bg-gradient-to-r from-primary to-primary/90 px-5 py-3 font-bold text-[11px] uppercase tracking-widest text-primary-foreground shadow-[0_20px_40px_rgba(173,198,255,0.24)] transition-all hover:opacity-90 active:scale-95 sm:w-auto sm:px-6 sm:py-3.5"
          >
            <Plus className="h-4 w-4" />
            {t('createGroup')}
          </button>
          ) : null}
        </div>
      </section>

      {isCompanyAdmin ? (
      <CreateGroupModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(g) => navigate(`/groups/${g.id}`)}
      />
      ) : null}

      {isCompanyAdmin ? (
        <InviteUsersToGroupModal
          isOpen={inviteOpen}
          onClose={() => setInviteOpen(false)}
          groups={groups ?? []}
          users={allUsers}
        />
      ) : null}

      {/* Search / view toggles */}
      <section className="flex flex-col items-stretch gap-3 sm:gap-4 md:flex-row md:items-center">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={t('filters.searchPlaceholder')}
          showClear
          className="w-full"
          inputClassName="rounded-2xl pl-11 py-4 text-[13px] focus:ring-4 focus:ring-primary/10 backdrop-blur-xl border-border/30 dark:border-border/45 bg-gradient-to-r from-surface-highest/18 to-surface-highest/8"
        />
        <div className="flex bg-gradient-to-r from-surface-highest/20 to-surface-highest/10 p-1.5 rounded-2xl border border-border/30 dark:border-border/45 backdrop-blur-xl shadow-[inset_0_1px_0_hsl(var(--foreground)/0.05)] shrink-0">
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              "p-2.5 rounded-xl transition-all",
              viewMode === 'grid' ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" : "text-muted-foreground/65 dark:text-muted-foreground/55 hover:text-foreground"
            )}
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              "p-2.5 rounded-xl transition-all",
              viewMode === 'list' ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" : "text-muted-foreground/65 dark:text-muted-foreground/55 hover:text-foreground"
            )}
          >
            <ListIcon className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Results count */}
      {searchQuery && !isLoading && (
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/30">
          {filteredGroups.length === 1
            ? t('filters.resultsLabel', { count: 1, query: searchQuery })
            : t('filters.resultsLabelPlural', { count: filteredGroups.length, query: searchQuery })}
        </p>
      )}

      {/* Grid/List of Groups */}
      <section
        className={cn(
          'gap-3 sm:gap-4 rounded-2xl border border-border/30 dark:border-border/45 bg-gradient-to-b from-surface-highest/20 via-surface-highest/8 to-transparent p-3 sm:p-4 backdrop-blur-xl',
          viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
            : 'flex flex-col'
        )}
      >
        {isLoading ? (
          <div className="col-span-full">
            <Loader variant="section" label={t('table.loading')} />
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="col-span-full rounded-xl border border-border/20 dark:border-border/35 bg-surface-highest/6 py-16 text-center space-y-2">
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/30">
              {searchQuery.trim() ? t('table.noGroupsFound') : t('table.noWorkspaces')}
            </p>
            <p className="text-[10px] text-muted-foreground/20">
              {searchQuery.trim()
                ? t('table.noGroupsHint')
                : isCompanyAdmin
                  ? t('table.noWorkspacesHintAdmin')
                  : t('table.noWorkspacesHintUser')}
            </p>
          </div>
        ) : (
          paginatedGroups.map((group: GroupHealth) => (
            <GroupCard
              key={group.id}
              group={group}
              view={viewMode}
              primaryActionLabel={
                isCompanyAdmin || isGroupAdminFor(group.id)
                  ? viewMode === 'grid'
                    ? t('actions.enterWorkspace')
                    : t('actions.enter')
                  : viewMode === 'grid'
                    ? t('actions.viewWorkspace')
                    : t('actions.view')
              }
              onClick={() => navigate(`/groups/${group.id}`)}
            />
          ))
        )}
      </section>

      <div className="mt-8">
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(filteredGroups.length / itemsPerPage)}
          onPageChange={setCurrentPage}
          totalItems={filteredGroups.length}
          itemsPerPage={itemsPerPage}
        />
      </div>
    </div>
  );
};
