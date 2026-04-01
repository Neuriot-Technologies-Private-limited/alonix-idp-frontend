import apiClient from './api/client';
import type { UserDetails, AuthContextPayload } from '../types/auth';

function mapApiUser(u: Record<string, unknown>): UserDetails {
  const email = String(u.email ?? '').trim();
  const username = String((u.username as string) || email || '').trim();
  return {
    _id: u._id as string,
    id: (u.id as string) || (u._id as string),
    email,
    username: username || email,
    name: (u.name as string) || undefined,
    groupID: u.groupID as string | undefined,
    groupId: (u.groupId as string | undefined) ?? (u.groupID as string | undefined),
    orgId: (u.orgId as string | null | undefined) ?? null,
    groupName: u.groupName as string | undefined,
  };
}

export const authApi = {
  async login(email: string, password: string, orgId?: string | null): Promise<{
    token: string;
    user: UserDetails;
    context: AuthContextPayload;
  }> {
    const { data } = await apiClient.post('/users/login', {
      email: email.trim(),
      password,
      ...(orgId ? { orgId } : {}),
    });
    return {
      token: data.token,
      user: mapApiUser(data.user),
      context: data.context as AuthContextPayload,
    };
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
};
