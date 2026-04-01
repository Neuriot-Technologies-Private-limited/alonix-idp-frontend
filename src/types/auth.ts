/** Optional notification / UX flags persisted with the user profile */
export interface UserProfilePreferences {
  emailNotifications: boolean;
  productUpdates: boolean;
  weeklyDigest: boolean;
}

export const defaultUserPreferences = (): UserProfilePreferences => ({
  emailNotifications: true,
  productUpdates: false,
  weeklyDigest: true,
});

export interface UserDetails {
  id?: string;
  _id?: string;         // backend native
  /** Display handle; often same as email */
  username: string;
  email: string;
  /** Directory full name from API */
  name?: string;
  /** Preferred display name in UI; falls back to `name` or `username` */
  displayName?: string;
  groupID?: string;     // legacy
  groupId?: string;     // normalized
  /** Organization id (tenant); used with API org scoping */
  orgId?: string | null;
  groupName?: string;
  phone?: string;
  jobTitle?: string;
  bio?: string;
  timezone?: string;
  locale?: string;
  /** `data:` URL or HTTPS image URL */
  avatarUrl?: string | null;
  preferences?: UserProfilePreferences;
}

export interface GroupContext {
  groupId: string;
  groupName: string;
  role: "GROUP_ADMIN" | "SEARCH_USER";
}

export interface AuthContextPayload {
  orgId: string | null;
  orgRole: "COMPANY_ADMIN" | "MEMBER" | null;
  groups: GroupContext[];
  activeGroupId: string | null;
  activeGroupRole: "GROUP_ADMIN" | "SEARCH_USER" | null;
  capabilities: string[];
}

export interface AuthState {
  token: string | null;
  user: UserDetails | null;
  context: AuthContextPayload | null;
  isInitialized: boolean;
}
