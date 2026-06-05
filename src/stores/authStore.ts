import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AuthState,
  UserDetails,
  AuthContextPayload,
  UserProfilePreferences,
} from '../types/auth';
import { defaultUserPreferences } from '../types/auth';
import { applyActiveGroupToContext } from '../core/rbac/capabilities';
import { hasActiveSession } from '../utils/session';

let authContextSyncInflight: Promise<boolean> | null = null;

/** Resolves when Zustand persist + optional refreshSession have finished. */
export function waitForAuthInit(): Promise<void> {
  const { isInitialized, isRefreshingSession } = useAuthStore.getState();
  if (isInitialized && !isRefreshingSession) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const unsub = useAuthStore.subscribe((state) => {
      if (state.isInitialized && !state.isRefreshingSession) {
        unsub();
        resolve();
      }
    });
  });
}

function mergeAuthContext(
  incoming: AuthContextPayload,
  current: AuthContextPayload | null
): AuthContextPayload {
  const hasIncomingGroups = Array.isArray(incoming.groups) && incoming.groups.length > 0;
  const hasCurrentGroups =
    Array.isArray(current?.groups) && (current?.groups?.length ?? 0) > 0;
  if (!hasIncomingGroups && hasCurrentGroups && current) {
    return current;
  }
  const selectedId = current?.activeGroupId;
  if (selectedId && incoming.groups?.some((g) => g.groupId === selectedId)) {
    return applyActiveGroupToContext(incoming, selectedId);
  }
  return incoming;
}

interface AuthActions {
  setAuth: (user: UserDetails, context: AuthContextPayload) => void;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  /** Fetch latest RBAC context once (deduped); keeps profile from store. */
  syncAuthContext: () => Promise<boolean>;
  setActiveGroup: (groupId: string) => void;
  updateContext: (context: AuthContextPayload) => void;
  updateUser: (
    partial: Partial<Omit<UserDetails, 'preferences'>> & {
      preferences?: Partial<UserProfilePreferences>;
    }
  ) => void;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      context: null,
      isInitialized: false,
      isRefreshingSession: false,

      setAuth: (user, context) =>
        set({
          token: null,
          user,
          context,
          isInitialized: true,
          isRefreshingSession: false,
        }),

      logout: async () => {
        try {
          const { authApi } = await import('../services/authApi');
          await authApi.logout();
        } catch {
          // Clear local state even if server call fails
        }
        set({
          token: null,
          user: null,
          context: null,
          isInitialized: true,
          isRefreshingSession: false,
        });
      },

      syncAuthContext: async () => {
        const state = get();
        if (!hasActiveSession(state.user, state.context)) return false;
        if (authContextSyncInflight) return authContextSyncInflight;
        authContextSyncInflight = (async () => {
          const { authApi } = await import('../services/authApi');
          const incoming = await authApi.fetchAuthContext();
          if (!incoming) return false;
          set((state) => ({
            context: mergeAuthContext(incoming, state.context),
          }));
          return true;
        })().finally(() => {
          authContextSyncInflight = null;
        });
        return authContextSyncInflight;
      },

      refreshSession: async () => {
        const state = get();
        set({ isRefreshingSession: true });
        try {
          if (!state.user?.email) {
            set({ token: null, user: null, context: null, isInitialized: true });
            return false;
          }
          const { authApi } = await import('../services/authApi');
          const session = await authApi.fetchSession(state.user);
          if (!session) {
            set({ token: null, user: null, context: null, isInitialized: true });
            return false;
          }
          set({
            token: null,
            user: session.user,
            context: session.context,
            isInitialized: true,
          });
          return true;
        } catch {
          set({ token: null, user: null, context: null, isInitialized: true });
          return false;
        } finally {
          set({ isRefreshingSession: false });
        }
      },

      setActiveGroup: (groupId) =>
        set((state) => {
          if (!state.context) return state;
          return { context: applyActiveGroupToContext(state.context, groupId) };
        }),

      updateContext: (context) =>
        set({ context, isInitialized: true, isRefreshingSession: false }),

      updateUser: (partial) =>
        set((state) => {
          if (!state.user) return state;
          const u = state.user;
          const { preferences: prefIn, ...rest } = partial;
          const next: UserDetails = { ...u, ...rest };
          if (prefIn) {
            next.preferences = { ...defaultUserPreferences(), ...u.preferences, ...prefIn };
          }
          return { user: next };
        }),
    }),
    {
      name: 'alonix-auth-storage-v2',
      partialize: (state) => ({
        sessionEmail: state.user?.email ?? null,
      }),
      merge: (persisted, current) => {
        const p = persisted as { sessionEmail?: string | null };
        const email = p?.sessionEmail;
        if (!email) {
          return { ...current, isInitialized: true, isRefreshingSession: false };
        }
        return {
          ...current,
          user: { email, username: email },
          context: null,
          isInitialized: false,
          isRefreshingSession: true,
        };
      },
      onRehydrateStorage: () => (state) => {
        if (state?.user?.email) {
          void state.refreshSession();
        } else if (state) {
          state.isInitialized = true;
          state.isRefreshingSession = false;
        }
      },
    }
  )
);
