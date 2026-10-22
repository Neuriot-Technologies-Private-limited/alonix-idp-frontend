import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useGroupHealth } from '../../../../hooks/queries/admin';
import { adminService } from '../../../../services/adminService';
import {
  DOCUMENT_SENSITIVITY_HINTS,
  DOCUMENT_SENSITIVITY_LABELS,
  uploadAssignableLevelsForGroup,
  type DocumentSensitivityLevel,
} from '../../../../constants/documentSensitivity';
import { useUploadStore } from '../../../../stores/uploadStore';
import { useAlert } from '../../../../components/alert';
import { useAuthStore } from '../../../../stores/authStore';
import { hasActiveSession } from '../../../../utils/session';
import type { GroupContext } from '../../../../types/auth';
import {
  beginBackgroundDocumentUpload,
  continueDedupReview,
  dismissDedupReview,
  reviewItemsFromJobs,
  setDedupChoice as chooseDedupFile,
} from '../../backgroundDocumentUpload';
import type { DedupReviewItem } from '../../dedupReview';
import { resolveUploadTargetGroupId } from './resolveUploadTargetGroupId';

export type { DedupReviewItem };

function userIdOf(user: { _id?: string; id?: string } | null | undefined) {
  return String(user?._id || user?.id || '').trim();
}

/** Local profile can lose its id after reload. The cookie session still has it. */
async function resolveUploadUserId(user: { _id?: string; id?: string } | null | undefined) {
  const existing = userIdOf(user) || userIdOf(useAuthStore.getState().user);
  if (existing) return existing;
  const restored = await useAuthStore.getState().refreshSession();
  const fresh = useAuthStore.getState().user;
  const userId = userIdOf(fresh);
  if (restored && userId && hasActiveSession(fresh, useAuthStore.getState().context)) {
    return userId;
  }
  return '';
}

export function useDocumentUpload(opts: {
  isCompanyAdmin: boolean;
  groups: GroupContext[];
  /** TopNav workspace — uploads should default here when the user can upload to it. */
  activeGroupId?: string | null;
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
  const { isCompanyAdmin, groups, activeGroupId, orgRole, orgId, user, onUploadStarted } = opts;
  const { alert: appAlert } = useAlert();
  const uploadJobs = useUploadStore((state) => state.jobs);
  const dedupReview = reviewItemsFromJobs(uploadJobs);
  const { data: groupHealthList = [] } = useGroupHealth();

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [targetGroupId, setTargetGroupId] = useState('');
  const [uploadSensitivityLevel, setUploadSensitivityLevel] = useState<string>('INTERNAL_USE');
  const [attachClaimId, setAttachClaimId] = useState(false);
  const [claimId, setClaimId] = useState('');
  const inflightRef = React.useRef(false);

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

  const allowedUploadGroupIds = React.useMemo(
    () => uploadGroupChoices.map((g) => String(g.groupId)).filter(Boolean),
    [uploadGroupChoices]
  );

  const uploadTargetGroupId = React.useMemo(
    () =>
      resolveUploadTargetGroupId({
        activeGroupId,
        allowedGroupIds: allowedUploadGroupIds,
        previousTargetId: targetGroupId,
      }),
    [activeGroupId, allowedUploadGroupIds, targetGroupId]
  );

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
    if (!isUploadModalOpen || !allowedUploadGroupIds.length) return;
    setTargetGroupId((prev) =>
      resolveUploadTargetGroupId({
        activeGroupId,
        allowedGroupIds: allowedUploadGroupIds,
        previousTargetId: prev,
      })
    );
  }, [isUploadModalOpen, allowedUploadGroupIds, activeGroupId]);

  const releaseUploadForm = () => {
    setIsUploadModalOpen(false);
    setSelectedFiles([]);
    setAttachClaimId(false);
    setClaimId('');
    setTargetGroupId('');
  };

  const runUpload = () => {
    if (inflightRef.current) return;
    const gid = String(targetGroupId || uploadTargetGroupId || '').trim();
    if (!gid) {
      void appAlert({
        title: 'Choose a workspace',
        description: 'Select a target workspace before uploading.',
        variant: 'warning',
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
    const filesToCheck = [...selectedFiles];
    const sensitivity = uploadSensitivityLevel;
    const uploadGroupName =
      uploadGroupChoices.find((g) => String(g.groupId) === String(gid))?.groupName || '';
    const uploaderLabel =
      (user?.displayName || user?.name || user?.username || user?.email || '').trim() ||
      user?.email ||
      '';

    return (async () => {
      const userId = await resolveUploadUserId(user);
      if (!userId) {
        inflightRef.current = false;
        void appAlert({
          title: 'Session expired',
          description: 'Please sign in again to upload documents.',
          variant: 'danger',
        });
        return;
      }
      releaseUploadForm();
      inflightRef.current = false;
      await beginBackgroundDocumentUpload(filesToCheck, {
        userId,
        groupId: gid,
        orgId: orgId ?? user?.orgId ?? null,
        sensitivity,
        claimId: trimmedClaimId,
        groupName: uploadGroupName,
        uploaderLabel,
        onUploadStarted,
      });
    })();
  };

  const setDedupChoice = (documentId: string, decision: 'upload' | 'skip') => {
    chooseDedupFile(documentId, decision);
  };

  const continueDedupUpload = () => continueDedupReview();

  const dismissUpload = () => {
    releaseUploadForm();
    return dismissDedupReview();
  };

  const closeUploadForm = () => {
    releaseUploadForm();
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
    dedupChecking: false,
    dedupReview,
    setDedupChoice,
    continueDedupUpload,
    dismissUpload,
    closeUploadForm,
    runUpload,
  };
}
