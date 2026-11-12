import type { DedupAction, DedupCheckResult, DedupMatchedDocument } from '../../services/documentApi';

export type UploadBatchContext = {
  userId: string;
  groupId: string;
  orgId: string | null;
  sensitivity: string;
  claimId: string;
  groupName: string;
  uploaderLabel: string;
  onUploadStarted?: () => void;
};

export type DedupReviewItem = {
  file: File;
  documentId: string;
  action: DedupAction;
  hitlTaskId: string | null;
  matched: DedupMatchedDocument | null;
  alsoRelated: DedupMatchedDocument[];
  checkFailed: boolean;
  decision: 'upload' | 'skip' | null;
  /** True after uploadDocument returns. Do not cancel this id. */
  saved: boolean;
  /** True once uploadDocument has been started. Leave the fingerprint for that request. */
  uploadStarted: boolean;
  groupId: string;
  uploadContext: UploadBatchContext;
};

export function needsCancel(item: DedupReviewItem) {
  return Boolean(item.documentId) && !item.saved && !item.uploadStarted;
}

export function normalizeCheck(
  file: File,
  groupId: string,
  data: DedupCheckResult,
  uploadContext: UploadBatchContext
): DedupReviewItem {
  const action: DedupAction =
    data?.action === 'block' || data?.action === 'choose' || data?.action === 'upload'
      ? data.action
      : 'upload';
  return {
    file,
    groupId,
    documentId: String(data?.documentId || '').trim(),
    action,
    hitlTaskId: data?.hitlTaskId ? String(data.hitlTaskId) : null,
    matched: data?.matched ?? null,
    alsoRelated: Array.isArray(data?.alsoRelated) ? data.alsoRelated : [],
    checkFailed: Boolean(data?.checkFailed),
    decision: null,
    saved: false,
    uploadStarted: false,
    uploadContext,
  };
}

/** Transport failures fail open: upload as today, with no minted id to cancel. */
export function failedOpenCheck(file: File, groupId: string, uploadContext: UploadBatchContext): DedupReviewItem {
  return normalizeCheck(
    file,
    groupId,
    {
      action: 'upload',
      documentId: '',
      label: 'NEW',
      checkFailed: true,
      unlinked: false,
      hitlTaskId: null,
      matched: null,
      alsoRelated: [],
    },
    uploadContext
  );
}
