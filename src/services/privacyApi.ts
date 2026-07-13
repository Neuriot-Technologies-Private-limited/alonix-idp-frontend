import apiClient from './api/client';

/** Mirrors publicUserExport() in the backend userDataRightsService. */
export interface ExportedUserProfile {
  id: string;
  email: string;
  name: string;
  orgId: string | null;
  groupID: string | null;
  status: string;
  emailVerified?: boolean;
  lastLoginAt?: string | null;
  avatarUrl?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

/** GET /users/me/data/export response shape. */
export interface UserDataExport {
  exportedAt: string;
  user: ExportedUserProfile;
  chatSessions: unknown[];
  chatMessages: unknown[];
  auditLogsAsActor: unknown[];
}

/** DELETE /users/me/data response shape. */
export interface DeleteMyDataResult {
  message: string;
  chatsDeleted: number;
  chatSessionsDeleted: number;
  chatMessagesDeleted: number;
  auditLogsAnonymized: number;
  userAnonymized: boolean;
  userId: string;
}

export const privacyApi = {
  /** Fetch a portable JSON export of the signed-in user's profile, chats, and audit activity. */
  async exportMyData(): Promise<UserDataExport> {
    const { data } = await apiClient.get<UserDataExport>('/users/me/data/export');
    return data;
  },

  /**
   * Permanently erase the signed-in user's chat history and PII, anonymize their audit trail,
   * and deactivate the account. Does not delete the organization. Backend clears session cookies.
   */
  async deleteMyData(): Promise<DeleteMyDataResult> {
    const { data } = await apiClient.delete<DeleteMyDataResult>('/users/me/data');
    return data;
  },
};

/** Triggers a browser download of `data` serialized as pretty-printed JSON. */
export function downloadJson(filename: string, data: unknown): void {
  const text = JSON.stringify(data, null, 2);
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Deterministic, filesystem-safe filename for a data export download. */
export function buildDataExportFilename(email?: string | null, now: Date = new Date()): string {
  const stamp = now.toISOString().slice(0, 10);
  const safeEmail = (email || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '');
  return `alonix-data-export-${safeEmail || 'account'}-${stamp}.json`;
}

/** Delete confirmation is valid only when the typed value exactly matches the account email. */
export function isDeleteConfirmationValid(
  typedValue: string,
  accountEmail: string | null | undefined
): boolean {
  const typed = typedValue.trim().toLowerCase();
  const expected = (accountEmail || '').trim().toLowerCase();
  return typed.length > 0 && expected.length > 0 && typed === expected;
}
