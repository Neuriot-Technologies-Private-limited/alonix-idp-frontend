import { describe, expect, it, vi, beforeEach } from 'vitest';

const getMock = vi.fn();
const deleteMock = vi.fn();

vi.mock('../services/api/client', () => ({
  default: {
    get: (...args: unknown[]) => getMock(...args),
    delete: (...args: unknown[]) => deleteMock(...args),
  },
}));

import {
  privacyApi,
  downloadJson,
  buildDataExportFilename,
  isDeleteConfirmationValid,
  type UserDataExport,
  type DeleteMyDataResult,
} from '../services/privacyApi';

describe('privacyApi', () => {
  beforeEach(() => {
    getMock.mockReset();
    deleteMock.mockReset();
  });

  it('exportMyData fetches GET /users/me/data/export', async () => {
    const payload: UserDataExport = {
      exportedAt: '2026-07-06T00:00:00.000Z',
      user: {
        id: 'u1',
        email: 'jane@acme.com',
        name: 'Jane',
        orgId: 'org1',
        groupID: null,
        status: 'ACTIVE',
      },
      chatSessions: [],
      chatMessages: [],
      auditLogsAsActor: [],
    };
    getMock.mockResolvedValueOnce({ data: payload });

    const result = await privacyApi.exportMyData();

    expect(getMock).toHaveBeenCalledWith('/users/me/data/export');
    expect(result).toEqual(payload);
  });

  it('deleteMyData issues DELETE /users/me/data', async () => {
    const payload: DeleteMyDataResult = {
      message: 'Personal data erased',
      chatsDeleted: 4,
      chatSessionsDeleted: 1,
      chatMessagesDeleted: 3,
      auditLogsAnonymized: 2,
      userAnonymized: true,
      userId: 'u1',
    };
    deleteMock.mockResolvedValueOnce({ data: payload });

    const result = await privacyApi.deleteMyData();

    expect(deleteMock).toHaveBeenCalledWith('/users/me/data');
    expect(result).toEqual(payload);
  });
});

describe('downloadJson', () => {
  it('creates an object URL, triggers a click on an anchor, and revokes the URL', () => {
    const createObjectURL = vi.fn(() => 'blob:mock-url');
    const revokeObjectURL = vi.fn();
    // jsdom does not implement these; stub for the assertions below.
    (URL as unknown as { createObjectURL: typeof createObjectURL }).createObjectURL = createObjectURL;
    (URL as unknown as { revokeObjectURL: typeof revokeObjectURL }).revokeObjectURL = revokeObjectURL;

    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    downloadJson('export.json', { hello: 'world' });

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');

    clickSpy.mockRestore();
  });
});

describe('buildDataExportFilename', () => {
  it('slugifies the email and appends an ISO date stamp', () => {
    const now = new Date('2026-07-06T12:00:00.000Z');
    expect(buildDataExportFilename('Jane.Doe+test@Acme.com', now)).toBe(
      'alonix-data-export-jane-doe-test-acme-com-2026-07-06.json'
    );
  });

  it('falls back to "account" when no email is provided', () => {
    const now = new Date('2026-07-06T12:00:00.000Z');
    expect(buildDataExportFilename(null, now)).toBe('alonix-data-export-account-2026-07-06.json');
    expect(buildDataExportFilename(undefined, now)).toBe('alonix-data-export-account-2026-07-06.json');
    expect(buildDataExportFilename('   ', now)).toBe('alonix-data-export-account-2026-07-06.json');
  });
});

describe('isDeleteConfirmationValid', () => {
  const accountEmail = 'jane@acme.com';

  it('accepts an exact, case-insensitive, trimmed match', () => {
    expect(isDeleteConfirmationValid('jane@acme.com', accountEmail)).toBe(true);
    expect(isDeleteConfirmationValid('  JANE@ACME.COM  ', accountEmail)).toBe(true);
  });

  it('rejects empty, partial, or mismatched input', () => {
    expect(isDeleteConfirmationValid('', accountEmail)).toBe(false);
    expect(isDeleteConfirmationValid('jane@acme', accountEmail)).toBe(false);
    expect(isDeleteConfirmationValid('other@acme.com', accountEmail)).toBe(false);
  });

  it('rejects when the account email is missing', () => {
    expect(isDeleteConfirmationValid('jane@acme.com', null)).toBe(false);
    expect(isDeleteConfirmationValid('jane@acme.com', undefined)).toBe(false);
  });
});
