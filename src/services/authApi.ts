import apiClient from './api/client';
import type { UserDetails, AuthContextPayload } from '../types/auth';

function mapApiUser(u: Record<string, unknown>): UserDetails {
  const email = String(u.email ?? '').trim();
  const username = String((u.username as string) || email || '').trim();
  return {
    _id: (u._id as string) || (u.id as string),
    id: (u.id as string) || (u._id as string),
    email,
    username: username || email,
    name: (u.name as string) || undefined,
    avatarUrl: u.avatarUrl as string | null | undefined,
    groupID: u.groupID as string | undefined,
    groupId: (u.groupId as string | undefined) ?? (u.groupID as string | undefined),
    orgId: (u.orgId as string | null | undefined) ?? null,
    groupName: u.groupName as string | undefined,
  };
}

export const authApi = {
  async login(email: string, password: string, orgId?: string | null): Promise<{
    user: UserDetails;
    context: AuthContextPayload;
  }> {
    const { data } = await apiClient.post('/users/login', {
      email: email.trim(),
      password,
      ...(orgId ? { orgId } : {}),
    });
    return {
      user: mapApiUser(data.user),
      context: data.context as AuthContextPayload,
    };
  },

  async logout(): Promise<void> {
    await apiClient.post('/users/logout');
  },

  /** Server RBAC/workspace context only (see POST /users/login for profile). */
  async fetchAuthContext(): Promise<AuthContextPayload | null> {
    try {
      const { data } = await apiClient.get('/users/me/context');
      if (!data?.context) return null;
      return data.context as AuthContextPayload;
    } catch {
      return null;
    }
  },

  /** Rehydrate after reload: requires persisted user; refreshes context from server. */
  async fetchSession(
    persistedUser: UserDetails | null
  ): Promise<{ user: UserDetails; context: AuthContextPayload } | null> {
    if (!persistedUser?.email) return null;
    const context = await this.fetchAuthContext();
    if (!context) return null;
    return { user: persistedUser, context };
  },

  async onboardCompany(payload: {
    companyName: string;
    email: string;
    password: string;
    name: string;
    orgId?: string | null;
  }) {
    const { data } = await apiClient.post('/users/onboard', payload);
    return data as {
      message: string;
      emailVerificationSent?: boolean;
      emailVerificationPending?: boolean;
    };
  },

  async onboardInvite(payload: {
    inviteToken: string;
    email: string;
    password: string;
    name: string;
    orgId?: string | null;
  }) {
    const { data } = await apiClient.post('/users/onboard-invite', payload);
    return data as {
      message: string;
      orgId?: string;
      emailVerificationSent?: boolean;
      emailVerificationPending?: boolean;
    };
  },

  async getInviteDetails(inviteToken: string) {
    const { data } = await apiClient.get('/users/invite-details', {
      params: { inviteToken: inviteToken.trim() },
    });
    return data as {
      email: string;
      inviteeName?: string;
      orgId?: string;
      groupId?: string;
    };
  },

  async verifyEmail(email: string, otp: string, orgId?: string | null) {
    const { data } = await apiClient.post('/users/verify-email', {
      email: email.trim(),
      otp: otp.trim(),
      ...(orgId ? { orgId } : {}),
    });
    return data as { message: string };
  },

  async resendVerification(email: string, orgId?: string | null) {
    const { data } = await apiClient.post('/users/resend-verification', {
      email: email.trim(),
      ...(orgId ? { orgId } : {}),
    });
    return data as { message: string; sent?: boolean };
  },

  async forgotPassword(email: string, orgId?: string | null) {
    const { data } = await apiClient.post('/users/forgot-password', {
      email: email.trim(),
      ...(orgId ? { orgId } : {}),
    });
    return data as { message: string; sent?: boolean };
  },

  async resetPassword(payload: {
    email: string;
    token: string;
    newPassword: string;
    orgId?: string | null;
  }) {
    const { data } = await apiClient.post('/users/reset-password', {
      email: payload.email.trim(),
      token: payload.token.trim(),
      newPassword: payload.newPassword,
      ...(payload.orgId ? { orgId: payload.orgId } : {}),
    });
    return data as { message: string };
  },

  async changePassword(payload: {
    currentPassword: string;
    newPassword: string;
    orgId?: string | null;
  }) {
    const { data } = await apiClient.post('/users/change-password', {
      currentPassword: payload.currentPassword,
      newPassword: payload.newPassword,
      ...(payload.orgId ? { orgId: payload.orgId } : {}),
    });
    return data as { message: string };
  },

  async uploadAvatar(file: File): Promise<{ avatarUrl: string | null; avatarKey: string | null }> {
    const fd = new FormData();
    fd.append('file', file);
    const { data } = await apiClient.post('/users/me/avatar', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data as { avatarUrl: string | null; avatarKey: string | null };
  },

  async removeAvatar(): Promise<{ avatarUrl: null; avatarKey: null }> {
    const { data } = await apiClient.delete('/users/me/avatar');
    return data as { avatarUrl: null; avatarKey: null };
  },
};
