import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, LogOut, Building2, UserCircle, Sun, Moon, Menu } from 'lucide-react';
import { useThemeStore } from '../stores/themeStore';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';
import { getMyContext } from '../services/chatApi';

const TopNavBar: React.FC = () => {
  const navigate = useNavigate();
  const { user, context, setActiveGroup, updateContext, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const toggleMobileNav = useUIStore((s) => s.toggleMobileNav);
  const [isGroupMenuOpen, setIsGroupMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const groupMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Handle scroll for transparency
  useEffect(() => {
    const handleScroll = (e: any) => {
      const scrollY = e.target.scrollTop;
      setIsScrolled(scrollY > 20);
    };

    // The main scroll container is in AppLayout/Dashboard
    const mainContainer = document.querySelector('main');
    if (mainContainer) {
      mainContainer.addEventListener('scroll', handleScroll);
    }

    return () => mainContainer?.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdowns on click outside
  useEffect(() => {
    const syncContext = async () => {
      try {
        const { data } = await getMyContext();
        if (data?.context) {
          const incoming = data.context;
          const hasIncomingGroups = Array.isArray(incoming?.groups) && incoming.groups.length > 0;
          const currentGroups = useAuthStore.getState().context?.groups;
          const hasCurrentGroups = Array.isArray(currentGroups) && currentGroups.length > 0;
          // Avoid replacing a valid in-memory context with an empty payload.
          if (!hasIncomingGroups && hasCurrentGroups) return;
          updateContext(incoming);
        }
      } catch {
        // ignore; existing context remains usable
      }
    };
    void syncContext();
  }, [updateContext]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (groupMenuRef.current && !groupMenuRef.current.contains(event.target as Node)) {
        setIsGroupMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeGroup = context?.groups.find(g => g.groupId === context.activeGroupId);

  const dropdownVariants = {
    hidden: { opacity: 0.5, y: 10, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: 'spring' as const, damping: 20, stiffness: 300 }
    },
    exit: { opacity: 0, y: 10, scale: 0.95, transition: { duration: 0.15 } }
  };

  return (
    <header className={cn(
      "min-h-14 transition-all duration-300 flex items-center justify-between px-3 sm:px-5 z-40 sticky top-0 gap-2 sm:gap-3 pt-[env(safe-area-inset-top)] pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))]",
      isScrolled
        ? "bg-background/10 backdrop-blur-md border-b border-border/10 shadow-lg"
        : "bg-transparent border-transparent"
    )}>
      <button
        type="button"
        aria-label="Open navigation"
        onClick={() => toggleMobileNav()}
        className="md:hidden flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/20 bg-surface-highest/10 text-foreground hover:bg-surface-highest/20 transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5 sm:gap-3">
      {/* Group Switcher (Moved to Right) */}
      <div className="relative min-w-0 max-w-[min(100%,14rem)] sm:max-w-none" ref={groupMenuRef}>
        <button
          onClick={() => setIsGroupMenuOpen(!isGroupMenuOpen)}
          className="group flex items-center gap-2 rounded-xl border border-transparent px-2 py-1.5 transition-all hover:border-border/20 hover:bg-surface-highest/10 sm:gap-2.5 sm:px-3 sm:py-2"
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary transition-transform group-hover:scale-105 sm:h-8 sm:w-8 sm:rounded-lg">
            <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </div>
          <div className="hidden text-left sm:block">
            <p className="mb-0.5 text-[8px] font-bold uppercase leading-none tracking-wider text-muted-foreground/50 sm:text-[9px]">
              Workspace
            </p>
            <p className="max-w-[100px] truncate text-xs font-bold text-foreground sm:max-w-[120px] sm:text-sm">
              {activeGroup?.groupName || 'Select'}
            </p>
          </div>
          <ChevronDown
            className={cn(
              'h-3 w-3 shrink-0 text-muted-foreground transition-transform duration-300 sm:h-3.5 sm:w-3.5',
              isGroupMenuOpen && 'rotate-180'
            )}
          />
        </button>

        <AnimatePresence>
          {isGroupMenuOpen && (
            <motion.div
              variants={dropdownVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="glass absolute right-0 top-full z-50 mt-1.5 w-[13.5rem] overflow-hidden rounded-xl border border-border/20 shadow-2xl sm:mt-2 sm:w-56 sm:rounded-2xl"
            >
              <div className="border-b border-border/10 px-2 py-1.5 sm:px-2.5 sm:py-2">
                <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-muted-foreground/45 sm:text-[9px] sm:tracking-widest">
                  Switch workspace
                </p>
              </div>
              <ul
                className="max-h-[min(10.5rem,32vh)] list-none space-y-0.5 overflow-y-auto overscroll-contain p-1 [scrollbar-color:hsl(var(--muted-foreground)/0.35)_transparent] [scrollbar-width:thin] sm:max-h-[min(12rem,40vh)]"
              >
                {context?.groups.map((group) => {
                  const selected = context.activeGroupId === group.groupId;
                  return (
                    <li key={group.groupId}>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveGroup(group.groupId);
                          setIsGroupMenuOpen(false);
                        }}
                        className={cn(
                          'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-all sm:gap-2 sm:rounded-xl sm:py-2',
                          selected
                            ? 'border border-primary/20 bg-primary/10 text-primary'
                            : 'border border-transparent text-muted-foreground hover:bg-surface-highest/10 hover:text-foreground'
                        )}
                      >
                        <div
                          className={cn(
                            'flex h-6 w-6 shrink-0 items-center justify-center rounded-md sm:h-7 sm:w-7 sm:rounded-lg',
                            selected ? 'bg-primary/20' : 'bg-surface-highest/10'
                          )}
                        >
                          <Building2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1 leading-tight">
                          <p className="truncate text-[11px] font-semibold sm:text-xs">{group.groupName}</p>
                          <p className="truncate text-[9px] font-medium capitalize opacity-60 sm:text-[10px]">
                            {group.role.replaceAll('_', ' ').toLowerCase()}
                          </p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="h-6 w-px bg-border/10 mx-1" />

      {/* Right Side Actions & User Menu */}
      <div className="flex items-center gap-4">
        <button className="p-2 rounded-xl hover:bg-surface-highest/10 text-muted-foreground relative transition-colors group">
          <Bell className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-primary rounded-full border border-background shadow-sm shadow-primary/40" />
        </button>

        <div className="h-6 w-px bg-border/10 mx-1" />

        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-3 p-1 rounded-xl hover:bg-surface-highest/10 transition-all group"
          >
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary to-primary-container p-[1px] transition-transform group-hover:scale-105">
              <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-[7px] bg-background text-xs font-display font-bold text-primary">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  user?.email?.charAt(0).toUpperCase() ?? '?'
                )}
              </div>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-300 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {isUserMenuOpen && (
              <motion.div
                variants={dropdownVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute top-full right-0 mt-2 w-52 glass border border-border/20 rounded-2xl shadow-2xl p-2 z-50 overflow-hidden"
              >
                <div className="px-3 py-3 border-b border-border/10 mb-2">
                  <p className="text-xs font-bold truncate text-foreground">{user?.email}</p>
                  <p className="text-[9px] text-muted-foreground font-medium uppercase mt-0.5 tracking-widest">{context?.orgRole || 'Professional Tier'}</p>
                </div>

                <div className="space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      navigate('/profile');
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 p-2 rounded-xl text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all text-[12px] font-medium text-left"
                  >
                    <UserCircle className="w-4 h-4 shrink-0" />
                    My Profile
                  </button>

                  {context?.orgRole === 'COMPANY_ADMIN' && (
                    <button
                      type="button"
                      onClick={() => {
                        navigate('/org-settings');
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 p-2 rounded-xl text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all text-[12px] font-medium text-left"
                    >
                      <Building2 className="w-4 h-4 shrink-0" />
                      Organization Settings
                    </button>
                  )}

                  <button
                    onClick={() => toggleTheme()}
                    className="w-full flex items-center gap-3 p-2 rounded-xl text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all text-[12px] font-medium"
                  >
                    {theme === 'dark' ? (
                      <Sun className="w-4 h-4" />
                    ) : (
                      <Moon className="w-4 h-4" />
                    )}
                    {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                  </button>
                </div>

                <div className="h-px bg-border/10 my-2" />

                <button
                  onClick={() => logout()}
                  className="w-full flex items-center gap-3 p-2 rounded-xl text-destructive hover:bg-destructive/10 transition-all text-[12px] font-bold"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      </div>
    </header>
  );
};

export default TopNavBar;
