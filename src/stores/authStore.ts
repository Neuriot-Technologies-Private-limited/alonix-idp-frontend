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

interface AuthActions {
  setAuth: (user: UserDetails, context: AuthContextPayload) => void;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
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
    (set) => ({
      token: null,
      user: null,
      context: null,
      isInitialized: false,

      setAuth: (user, context) =>
        set({ token: null, user, context, isInitialized: true }),

      logout: async () => {
        try {
          const { authApi } = await import('../services/authApi');
          await authApi.logout();
        } catch {
          // Clear local state even if server call fails
        }
        set({ token: null, user: null, context: null, isInitialized: true });
      },

      refreshSession: async () => {
        const { authApi } = await import('../services/authApi');
        const session = await authApi.fetchSession();
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
      },

      setActiveGroup: (groupId) =>
        set((state) => {
          if (!state.context) return state;
          return { context: applyActiveGroupToContext(state.context, groupId) };
        }),

      updateContext: (context) => set({ context, isInitialized: true }),

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
      name: 'alonix-auth-storage',
      partialize: (state) => ({ user: state.user, context: state.context }),
      onRehydrateStorage: () => (state) => {
        if (state?.user && state?.context) {
          void state.refreshSession();
        } else if (state) {
          state.isInitialized = true;
        }
      },
    }
  )
);
