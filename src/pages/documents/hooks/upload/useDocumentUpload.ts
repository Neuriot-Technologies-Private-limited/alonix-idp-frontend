import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useGroupHealth } from '../../../../hooks/queries/admin';
import { adminService } from '../../../../services/adminService';
import { billingSubscriptionQueryKey } from '../../../../hooks/useOrgQuota';
import {
  DOCUMENT_SENSITIVITY_HINTS,
  DOCUMENT_SENSITIVITY_LABELS,
  uploadAssignableLevelsForGroup,
  type DocumentSensitivityLevel,
} from '../../../../constants/documentSensitivity';
import {
  cancelDocumentDedup,
  checkDocumentDedup,
  uploadDocument,
  type DedupAction,
  type DedupCheckResult,
  type DedupMatchedDocument,
} from '../../../../services/documentApi';
import { useUploadStore } from '../../../../stores/uploadStore';
import { useAlert } from '../../../../components/alert';
import { quotaErrorMessage } from '../../../../utils/billingQuota';
import { useAuthStore } from '../../../../stores/authStore';
import type { GroupContext } from '../../../../types/auth';
import { optimisticAppendUploadedDocument } from '../../../../utils/pipelineDocumentsCache';

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
};

function samePending(a: DedupReviewItem, b: { file: File; documentId: string }) {
  return a.file === b.file && a.documentId === b.documentId;
}

function needsCancel(item: DedupReviewItem) {
  return Boolean(item.documentId) && !item.saved && !item.uploadStarted;
}

/**
 * Skip, Cancel, close, and unmount delete fingerprints for ids that were checked
 * and not saved. Exact-duplicate cancel is a server no-op. Files already in the
 * workspace before this gate are not found until a backfill. Two people uploading
 * the same never-seen file at once can both pass the check.
 */
function cancelUnsaved(items: DedupReviewItem[]) {
  const targets = items.filter(needsCancel);
  if (!targets.length) return Promise.resolve([] as PromiseSettledResult<unknown>[]);
  return Promise.allSettled(
    targets.map((item) =>
      cancelDocumentDedup({
        documentId: item.documentId,
        groupId: item.groupId,
        hitlTaskId: item.hitlTaskId,
      })
    )
  );
}

function normalizeCheck(file: File, groupId: string, data: DedupCheckResult): DedupReviewItem {
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
  };
}

/** Transport failures fail open: upload as today, with no minted id to cancel. */
function failedOpenCheck(file: File, groupId: string): DedupReviewItem {
  return normalizeCheck(file, groupId, {
    action: 'upload',
    documentId: '',
    label: 'NEW',
    checkFailed: true,
    unlinked: false,
    hitlTaskId: null,
    matched: null,
    alsoRelated: [],
  });
}

export function useDocumentUpload(opts: {
  isCompanyAdmin: boolean;
  groups: GroupContext[];
  adminGroupIds?: string[] | null;
  orgRole?: string | null;
  orgId: string | null | undefined;
  user: {
    _id?: string;
    id?: string;
    email?: string;
    displayName?: string;
    name?: string;
    username?: string;
    orgId?: string | null;
  } | null;
  onUploadStarted?: () => void;
}) {
  const { isCompanyAdmin, groups, adminGroupIds, orgRole, orgId, user, onUploadStarted } = opts;
  const queryClient = useQueryClient();
  const { alert: appAlert } = useAlert();
  const { addJob, updateJob } = useUploadStore();
  const { data: groupHealthList = [] } = useGroupHealth();

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [targetGroupId, setTargetGroupId] = useState('');
  const [uploadSensitivityLevel, setUploadSensitivityLevel] = useState<string>('INTERNAL_USE');
  const [attachClaimId, setAttachClaimId] = useState(false);
  const [claimId, setClaimId] = useState('');
  const [dedupChecking, setDedupChecking] = useState(false);
  const [dedupReview, setDedupReview] = useState<DedupReviewItem[] | null>(null);
  const pendingRef = React.useRef<DedupReviewItem[]>([]);
  const sessionRef = React.useRef(0);
  const inflightRef = React.useRef(false);

  React.useEffect(() => {
    return () => {
      sessionRef.current += 1;
      const pending = pendingRef.current;
      pendingRef.current = [];
      void cancelUnsaved(pending);
    };
  }, []);

  const uploadGroupChoices = React.useMemo((): GroupContext[] => {
    if (isCompanyAdmin) {
      return groupHealthList.map((h) => ({
        groupId: h.id,
        groupName: h.name,
        role: 'GROUP_ADMIN' as const,
      }));
    }
    return groups.filter((g) => g.role === 'GROUP_ADMIN');
  }, [isCompanyAdmin, groupHealthList, groups]);

  const uploadTargetGroupId = React.useMemo(() => {
    if (isCompanyAdmin) return String(targetGroupId || '').trim();
    return String(targetGroupId || adminGroupIds?.[0] || '').trim();
  }, [isCompanyAdmin, targetGroupId, adminGroupIds]);

  const { data: uploadGroupEnabledLevels = null } = useQuery({
    queryKey: ['group-sensitivity-policy', uploadTargetGroupId],
    enabled: Boolean(uploadTargetGroupId),
    queryFn: () => adminService.getGroupSensitivityPolicy(uploadTargetGroupId),
    staleTime: 60_000,
  });

  const uploadMaxKey = React.useMemo(() => {
    if (orgRole === 'COMPANY_ADMIN') return 'RESTRICTED';
    const g = groups.find((x) => String(x.groupId) === uploadTargetGroupId);
    if (!g) return 'INTERNAL_USE';
    if (g.role === 'GROUP_ADMIN') return 'RESTRICTED';
    return String(g.maxDocumentSensitivity || 'INTERNAL_USE')
      .toUpperCase()
      .replace(/-/g, '_');
  }, [orgRole, uploadTargetGroupId, groups]);

  const uploadSensitivityOptions = React.useMemo(() => {
    const allowed = uploadAssignableLevelsForGroup(uploadMaxKey, uploadGroupEnabledLevels);
    return allowed.map((value) => ({
      value,
      label: DOCUMENT_SENSITIVITY_LABELS[value],
      hint: DOCUMENT_SENSITIVITY_HINTS[value],
    }));
  }, [uploadMaxKey, uploadGroupEnabledLevels]);

  React.useEffect(() => {
    const allowed = uploadAssignableLevelsForGroup(uploadMaxKey, uploadGroupEnabledLevels);
    setUploadSensitivityLevel((prev) =>
      allowed.includes(prev as DocumentSensitivityLevel)
        ? prev
        : allowed[allowed.length - 1] || 'INTERNAL_USE'
    );
  }, [uploadMaxKey, uploadGroupEnabledLevels]);

  React.useEffect(() => {
    if (isUploadModalOpen && !isCompanyAdmin && adminGroupIds?.length) {
      setTargetGroupId((prev) =>
        prev && adminGroupIds.includes(prev) ? prev : adminGroupIds[0]
      );
    }
  }, [isUploadModalOpen, isCompanyAdmin, adminGroupIds]);

  const releaseUploadForm = () => {
    setIsUploadModalOpen(false);
    setDedupReview(null);
    setDedupChecking(false);
    setSelectedFiles([]);
    setAttachClaimId(false);
    setClaimId('');
    if (isCompanyAdmin) setTargetGroupId('');
  };

  const persistUploads = async (
    items: DedupReviewItem[],
    ctx: { gid: string; userId: string; sensitivity: string; claimId: string }
  ) => {
    if (!items.length) return;
    const jobIds: string[] = [];
    for (const item of items) {
      const jobId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      jobIds.push(jobId);
      addJob({
        id: jobId,
        fileName: item.file.name,
        fileSize: item.file.size,
        status: 'uploading',
        startedAt: Date.now(),
      });
    }
    const uploadGroupName =
      uploadGroupChoices.find((g) => String(g.groupId) === String(ctx.gid))?.groupName || '';
    const uploaderLabel =
      (user?.displayName || user?.name || user?.username || user?.email || '').trim() ||
      user?.email ||
      '';
    const resolvedOrgId = orgId ?? user?.orgId ?? null;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const jobId = jobIds[i];
      try {
        const { data: uploadBody } = await uploadDocument(item.file, {
          userId: ctx.userId,
          groupId: ctx.gid || null,
          orgId: resolvedOrgId,
          sensitivityLevel: ctx.sensitivity,
          ...(ctx.claimId ? { claimId: ctx.claimId } : {}),
          ...(item.documentId ? { documentId: item.documentId } : {}),
        });
        updateJob(jobId, { status: 'done', finishedAt: Date.now() });
        pendingRef.current = pendingRef.current.map((row) =>
          samePending(row, item) ? { ...row, saved: true } : row
        );
        pendingRef.current = pendingRef.current.filter((row) => !samePending(row, item));
        const newId = uploadBody?.id ? String(uploadBody.id) : '';
        if (newId) {
          optimisticAppendUploadedDocument(
            queryClient,
            {
              id: newId,
              fileName: item.file.name,
              fileSizeBytes: item.file.size,
              groupId: ctx.gid,
              groupName: uploadGroupName,
              uploader: uploaderLabel,
              sensitivityLevel: ctx.sensitivity,
              ...(ctx.claimId ? { claimId: ctx.claimId } : {}),
            },
            orgId
          );
          // List is scoped to navbar workspace — switch so the new row is visible immediately.
          useAuthStore.getState().setActiveGroup(ctx.gid);
        }
      } catch (err: unknown) {
        const errMsg = quotaErrorMessage(err, 'Upload failed');
        updateJob(jobId, { status: 'error', error: errMsg, finishedAt: Date.now() });
        pendingRef.current = pendingRef.current.map((row) =>
          samePending(row, item) ? { ...row, uploadStarted: false, saved: false } : row
        );
        const failed = pendingRef.current.find((row) => samePending(row, item));
        if (failed) {
          await cancelUnsaved([failed]);
          pendingRef.current = pendingRef.current.filter((row) => !samePending(row, item));
        }
      }
    }
    void queryClient.invalidateQueries({ queryKey: ['documents'] });
    void queryClient.invalidateQueries({ queryKey: billingSubscriptionQueryKey(orgId) });
  };

  const runUpload = () => {
    if (inflightRef.current || dedupReview) return;
    const gid = isCompanyAdmin ? targetGroupId : targetGroupId || '';
    if (!gid) {
      void appAlert({
        title: 'Choose a workspace',
        description: isCompanyAdmin
          ? 'Select a target group before uploading.'
          : 'Pick an admin workspace to upload into.',
        variant: 'warning',
      });
      return;
    }
    const userId = String(user?._id || user?.id || '').trim();
    if (!userId) {
      void appAlert({
        title: 'Session issue',
        description: 'Missing user id. Please sign in again.',
        variant: 'danger',
      });
      return;
    }
    const trimmedClaimId = attachClaimId ? claimId.trim() : '';
    if (attachClaimId && !trimmedClaimId) {
      void appAlert({
        title: 'Claim ID required',
        description: 'Enter a claim ID or uncheck the option.',
        variant: 'warning',
      });
      return;
    }

    inflightRef.current = true;
    const session = ++sessionRef.current;
    setDedupChecking(true);
    const filesToCheck = [...selectedFiles];
    const sensitivity = uploadSensitivityLevel;

    return (async () => {
      try {
        const checks = await Promise.all(
          filesToCheck.map(async (file) => {
            try {
              const { data } = await checkDocumentDedup(file, {
                userId,
                groupId: gid || null,
                orgId: orgId ?? user?.orgId ?? null,
              });
              return normalizeCheck(file, gid, data);
            } catch {
              return failedOpenCheck(file, gid);
            }
          })
        );
        if (session !== sessionRef.current) {
          await cancelUnsaved(checks);
          return;
        }
        const needsReview = checks.some((item) => item.action === 'block' || item.action === 'choose');
        if (!needsReview) {
          const stamped = checks.map((item) => ({ ...item, uploadStarted: true }));
          pendingRef.current = stamped;
          onUploadStarted?.();
          releaseUploadForm();
          inflightRef.current = false;
          await persistUploads(stamped, {
            gid,
            userId,
            sensitivity,
            claimId: trimmedClaimId,
          });
          return;
        }
        pendingRef.current = checks;
        setDedupReview(checks);
      } finally {
        if (session === sessionRef.current) {
          inflightRef.current = false;
          setDedupChecking(false);
        }
      }
    })();
  };

  const setDedupChoice = (documentId: string, decision: 'upload' | 'skip') => {
    const next = pendingRef.current.map((item) =>
      item.documentId === documentId && item.action === 'choose' ? { ...item, decision } : item
    );
    pendingRef.current = next;
    setDedupReview(next);
  };

  const continueDedupUpload = () => {
    const items = pendingRef.current;
    if (!items.length) return Promise.resolve();
    const gid = items[0]?.groupId || (isCompanyAdmin ? targetGroupId : targetGroupId || '');
    const userId = String(user?._id || user?.id || '').trim();
    const trimmedClaimId = attachClaimId ? claimId.trim() : '';
    const sensitivity = uploadSensitivityLevel;
    const stamped = items.map((item) => {
      const willUpload =
        item.action === 'upload' || (item.action === 'choose' && item.decision === 'upload');
      return { ...item, uploadStarted: willUpload };
    });
    const toUpload = stamped.filter((item) => item.uploadStarted);
    const toCancel = stamped.filter((item) => !item.uploadStarted);
    pendingRef.current = toUpload;
    if (toUpload.length) onUploadStarted?.();
    releaseUploadForm();
    return Promise.all([
      cancelUnsaved(toCancel),
      persistUploads(toUpload, { gid, userId, sensitivity, claimId: trimmedClaimId }),
    ]);
  };

  const dismissUpload = () => {
    sessionRef.current += 1;
    inflightRef.current = false;
    const pending = pendingRef.current;
    pendingRef.current = [];
    setDedupReview(null);
    setDedupChecking(false);
    setIsUploadModalOpen(false);
    setAttachClaimId(false);
    setClaimId('');
    return cancelUnsaved(pending);
  };

  return {
    isUploadModalOpen,
    setIsUploadModalOpen,
    selectedFiles,
    setSelectedFiles,
    targetGroupId,
    setTargetGroupId,
    uploadSensitivityLevel,
    setUploadSensitivityLevel,
    uploadGroupChoices,
    uploadSensitivityOptions,
    attachClaimId,
    setAttachClaimId,
    claimId,
    setClaimId,
    dedupChecking,
    dedupReview,
    setDedupChoice,
    continueDedupUpload,
    dismissUpload,
    runUpload,
  };
}
