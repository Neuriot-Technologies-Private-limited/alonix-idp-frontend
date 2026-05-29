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
  setAuth: (token: string, user: UserDetails, context: AuthContextPayload) => void;
  logout: () => void;
  setActiveGroup: (groupId: string) => void;
  updateContext: (context: AuthContextPayload) => void;
  /** Merge fields into the signed-in user (profile, avatar, preferences). */
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

      setAuth: (token, user, context) => set({ token, user, context, isInitialized: true }),

      logout: () => set({ token: null, user: null, context: null, isInitialized: true }),

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
      partialize: (state) => ({ token: state.token, user: state.user, context: state.context }),
    }
  )
);
