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
import { uploadDocument } from '../../../../services/chatApi';
import { useUploadStore } from '../../../../stores/uploadStore';
import { useAlert } from '../../../../components/alert';
import { quotaErrorMessage } from '../../../../utils/billingQuota';
import { useAuthStore } from '../../../../stores/authStore';
import { optimisticAppendUploadedDocument } from '../../../../utils/pipelineDocumentsCache';

export function useDocumentUpload(opts: {
  isCompanyAdmin: boolean;
  groups: { groupId: string; groupName: string; role?: string; maxDocumentSensitivity?: string }[];
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

  const uploadGroupChoices = React.useMemo(() => {
    if (isCompanyAdmin) {
      return groupHealthList.map((h) => ({ groupId: h.id, groupName: h.name }));
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

  const runUpload = () => {
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
    setIsUploadModalOpen(false);
    onUploadStarted?.();
    const filesToUpload = [...selectedFiles];
    setSelectedFiles([]);
    if (isCompanyAdmin) setTargetGroupId('');

    void (async () => {
      const jobIds: string[] = [];
      for (const file of filesToUpload) {
        const jobId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        jobIds.push(jobId);
        addJob({
          id: jobId,
          fileName: file.name,
          fileSize: file.size,
          status: 'uploading',
          startedAt: Date.now(),
        });
      }
      const uploadGroupName =
        uploadGroupChoices.find((g) => String(g.groupId) === String(gid))?.groupName || '';
      const uploaderLabel =
        (user?.displayName || user?.name || user?.username || user?.email || '').trim() ||
        user?.email ||
        '';

      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        const jobId = jobIds[i];
        try {
          const { data: uploadBody } = await uploadDocument(file, {
            userId,
            groupId: gid || null,
            orgId: orgId ?? user?.orgId ?? null,
            sensitivityLevel: uploadSensitivityLevel,
          });
          updateJob(jobId, { status: 'done', finishedAt: Date.now() });
          const newId = uploadBody?.id ? String(uploadBody.id) : '';
          if (newId) {
            optimisticAppendUploadedDocument(
              queryClient,
              {
                id: newId,
                fileName: file.name,
                fileSizeBytes: file.size,
                groupId: gid,
                groupName: uploadGroupName,
                uploader: uploaderLabel,
                sensitivityLevel: uploadSensitivityLevel,
              },
              orgId
            );
            // List is scoped to navbar workspace — switch so the new row is visible immediately.
            useAuthStore.getState().setActiveGroup(gid);
          }
        } catch (err: unknown) {
          const errMsg = quotaErrorMessage(err, 'Upload failed');
          updateJob(jobId, { status: 'error', error: errMsg, finishedAt: Date.now() });
        }
      }
      void queryClient.invalidateQueries({ queryKey: ['documents'] });
      void queryClient.invalidateQueries({ queryKey: billingSubscriptionQueryKey(orgId) });
    })();
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
    runUpload,
  };
}
