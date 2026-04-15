import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  FileText,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Users,
  FolderTree,
  Building2,
  Search,
  Bot,
} from 'lucide-react';
import { useUIStore } from '../stores/uiStore';
import { useRbac } from '../hooks/useRbac';
import { cn } from '../utils/cn';

// Branding assets
import logoFull from '../assets/1-glance.png';
import logoFullLight from '../assets/1-glance.png';
import logoIcon from '../assets/1-glance-icon.png';

interface NavItem {
  icon: any;
  label: string;
  path: string;
  capability?: string;
  show?: boolean;
}

const Sidebar: React.FC = () => {
  const { isSidebarCollapsed: isMinimized, toggleSidebar, mobileNavOpen, setMobileNavOpen } = useUIStore();
  const { hasCapability, orgRole, hasAnyGroupAdmin, activeGroupRole, accessibleGroupIds } = useRbac();
  const [isDarkTheme, setIsDarkTheme] = React.useState(() =>
    document.documentElement.classList.contains('dark')
  );

  React.useEffect(() => {
    const htmlEl = document.documentElement;
    const observer = new MutationObserver(() => {
      setIsDarkTheme(htmlEl.classList.contains('dark'));
    });
    observer.observe(htmlEl, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  const isCompanyAdmin = orgRole === 'COMPANY_ADMIN';
  const isSearchUserOnly = !isCompanyAdmin && !hasAnyGroupAdmin;
  /** JWT may omit dashboard caps on older tokens; org + workspace admins always use the dashboard. */
  const canSeeDashboard =
    !isSearchUserOnly &&
    (hasCapability('ADMIN_DASHBOARD_VIEW') ||
      hasCapability('USER_DASHBOARD_VIEW'));
  /** Matches `RoleProtectedRoute requiredWorkspaceMember`: company admin or at least one workspace. */
  const canSeeGroups = !isSearchUserOnly && (isCompanyAdmin || accessibleGroupIds.length > 0);

  const adminItems: NavItem[] = [
    {
      icon: Building2,
      label: 'Dashboard',
      path: '/dashboard',
      show: canSeeDashboard,
    },
    {
      icon: FolderTree,
      label: 'Groups',
      path: '/groups',
      show: canSeeGroups,
    },
    {
      icon: Users,
      label: 'Users',
      path: '/users',
      show: isCompanyAdmin || activeGroupRole === 'GROUP_ADMIN',
    },
    {
      icon: FileText,
      label: 'Documents',
      path: '/documents',
      capability: 'GROUP_DOC_VIEW',
      show: true // Everyone has access to /documents, launcher handles details
    },
    {
      icon: Bot,
      label: 'AI Chat',
      path: '/chat',
      // No capability gate — all authenticated users use the same Intelligence Chat page
      show: true,
    },
    // {
    //   icon: Shield,
    //   label: 'Security Logs',
    //   path: '/activity',
    //   capability: 'ADMIN_DASHBOARD_VIEW',
    //   show: isCompanyAdmin || isGroupAdmin
    // },
  ]
    .filter(
      (item) =>
        item.show !== false && (!item.capability || hasCapability(item.capability as string))
    );

  const renderNavItems = (items: NavItem[], sectionLabel?: string) => (
    <div className="space-y-1 mb-6">
      {!isMinimized && sectionLabel && (
        <h5 className="px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40 mb-2">
          {sectionLabel}
        </h5>
      )}
      <nav className="space-y-1">
        {items.map((item) => {
          if (item.capability && !hasCapability(item.capability as any)) return null;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/dashboard'}
              title={isMinimized ? item.label : ''}
              onClick={() => setMobileNavOpen(false)}
              className={({ isActive }) => `
                flex items-center ${isMinimized ? 'justify-center' : 'justify-between'} p-3 rounded-2xl transition-all group/item relative
                ${isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted/10 hover:text-foreground'}
              `}
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-4">
                    <div className={`relative flex items-center justify-center ${isActive ? 'text-primary' : 'text-muted-foreground group-hover/item:text-foreground transition-colors'}`}>
                      <item.icon className={`w-[20px] h-[20px] transition-transform duration-300 ${isActive ? 'scale-105' : 'group-hover/item:scale-110'}`} />
                      {isActive && (
                        <div className="absolute inset-0 bg-primary/30 blur-lg rounded-full" />
                      )}
                    </div>
                    {!isMinimized && (
                      <span className={`text-[13px] font-semibold tracking-tight transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground group-hover/item:text-foreground'}`}>
                        {item.label}
                      </span>
                    )}
                  </div>
                  {isActive && !isMinimized && (
                    <div className="w-1 h-5 bg-primary rounded-full shadow-[0_0_10px_rgba(173,198,255,0.5)]" />
                  )}
                  {isActive && isMinimized && (
                    <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full shadow-[0_0_10px_rgba(173,198,255,0.5)]" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      <button
        type="button"
        aria-label="Close navigation"
        className={cn(
          'fixed inset-0 z-[35] bg-scrim backdrop-blur-[3px] transition-opacity duration-300 md:hidden',
          mobileNavOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setMobileNavOpen(false)}
      />
      <aside
        className={cn(
          'group/sidebar flex h-screen flex-col border-r border-border/10 bg-background/20 backdrop-blur-xl transition-all duration-300 ease-out',
          'fixed md:relative inset-y-0 left-0 z-[50] w-[min(19rem,90vw)] -translate-x-full md:translate-x-0',
          mobileNavOpen && 'translate-x-0',
          isMinimized ? 'md:w-24' : 'md:w-45'
        )}
      >
        {/* Toggle Button — desktop only */}
        <button
          onClick={toggleSidebar}
          className="hidden md:flex absolute -right-3 top-24 w-6 h-6 bg-surface-high border border-border/20 rounded-full items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-all z-30 opacity-0 group-hover/sidebar:opacity-100 shadow-lg"
        >
          {isMinimized ? <ChevronRightIcon className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>

        {/* Main Branding */}
        <div className={isMinimized ? 'p-6 flex justify-center' : 'p-8 pb-4'}>
          <div className={`flex items-center ${isMinimized ? 'justify-center' : 'gap-3'} mb-2`}>
            {isMinimized ? (
              <img src={logoIcon} alt="Logo" className="w-10 h-10 rounded-xl object-cover ring-2 ring-primary/20" />
            ) : (
              <img src={isDarkTheme ? logoFull : logoFullLight} alt="1-glance" className="h-10 md:h-12 w-auto object-contain origin-left scale-110" />
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-4 overflow-y-auto overflow-x-hidden pt-2">
          {adminItems.length > 0 &&
            renderNavItems(adminItems, isCompanyAdmin || hasAnyGroupAdmin ? 'Administration' : 'Workspace')}
        </div>

        {/* Sidebar Footer: exactly 2 lines — label + brand row (brand stays one line) */}
        <div className={`mt-auto px-3 pb-4 pt-2 sm:px-4 sm:pb-6 ${isMinimized ? 'flex justify-center' : ''}`}>
          <a
            href="https://findout.ai"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'group transition-all duration-300',
              isMinimized
                ? 'flex h-10 w-10 items-center justify-center rounded-full border border-border/20 bg-muted/20 p-0 hover:border-primary/30 hover:bg-primary/20'
                : 'flex w-full flex-col gap-0.5 rounded-xl border border-border/10 bg-muted/10 px-2.5 py-2 text-left shadow-md hover:border-border/25 hover:bg-muted/20 sm:rounded-2xl sm:px-3 sm:py-2.5'
            )}
          >
            {isMinimized ? (
              <Search className="h-4 w-4 text-primary" />
            ) : (
              <>
                <span className="whitespace-nowrap text-[9px] font-semibold uppercase leading-none tracking-[0.14em] text-muted-foreground/60 sm:text-[10px] sm:tracking-[0.16em]">
                  Powered by
                </span>
                <div className="flex min-h-[1.375rem] items-center justify-between gap-1.5">
                  <span className="min-w-0 whitespace-nowrap text-[10px] font-black uppercase leading-none tracking-tight text-foreground transition-colors group-hover:text-primary sm:text-[11px]">
                    FINDOUT&nbsp;AI
                    <sup className="ml-0.5 align-super text-[0.58em] font-bold normal-case tracking-normal text-muted-foreground/90 group-hover:text-primary">
                      ™
                    </sup>
                  </span>
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted/30 ring-1 ring-border/15 transition-all group-hover:bg-primary/15 group-hover:ring-primary/25">
                    <ChevronLeft
                      className="h-2 w-2 text-muted-foreground transition-colors group-hover:text-primary group-hover:translate-x-px rotate-180"
                      aria-hidden
                    />
                  </span>
                </div>
              </>
            )}
          </a>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
