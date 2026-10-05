import { billingSubscriptionQueryKey } from '../../hooks/useOrgQuota';
import { cancelDocumentDedup, checkDocumentDedup, uploadDocument } from '../../services/documentApi';
import { queryClient } from '../../services/queryClient';
import { useAuthStore } from '../../stores/authStore';
import { useUploadStore, type UploadJob } from '../../stores/uploadStore';
import { quotaErrorMessage } from '../../utils/billingQuota';
import { optimisticAppendUploadedDocument } from '../../utils/pipelineDocumentsCache';
import {
  failedOpenCheck,
  needsCancel,
  normalizeCheck,
  type DedupReviewItem,
  type UploadBatchContext,
} from './dedupReview';

function reviewJobs(): UploadJob[] {
  return useUploadStore.getState().jobs.filter((job) => job.status === 'review' && job.reviewItem);
}

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

async function uploadOne(jobId: string, item: DedupReviewItem) {
  const ctx = item.uploadContext;
  const { updateJob } = useUploadStore.getState();
  updateJob(jobId, { status: 'uploading', reviewItem: undefined });
  ctx.onUploadStarted?.();
  try {
    const { data: uploadBody } = await uploadDocument(item.file, {
      userId: ctx.userId,
      groupId: ctx.groupId || null,
      orgId: ctx.orgId,
      sensitivityLevel: ctx.sensitivity,
      ...(ctx.claimId ? { claimId: ctx.claimId } : {}),
      ...(item.documentId ? { documentId: item.documentId } : {}),
    });
    const saved = { ...item, saved: true, uploadStarted: true };
    updateJob(jobId, { status: 'done', finishedAt: Date.now(), reviewItem: saved });
    const newId = uploadBody?.id ? String(uploadBody.id) : '';
    if (newId) {
      optimisticAppendUploadedDocument(
        queryClient,
        {
          id: newId,
          fileName: item.file.name,
          fileSizeBytes: item.file.size,
          groupId: ctx.groupId,
          groupName: ctx.groupName,
          uploader: ctx.uploaderLabel,
          sensitivityLevel: ctx.sensitivity,
          ...(ctx.claimId ? { claimId: ctx.claimId } : {}),
        },
        ctx.orgId
      );
      useAuthStore.getState().setActiveGroup(ctx.groupId);
    }
  } catch (err: unknown) {
    const errMsg = quotaErrorMessage(err, 'Upload failed');
    const failed = { ...item, uploadStarted: false, saved: false };
    updateJob(jobId, {
      status: 'error',
      error: errMsg,
      finishedAt: Date.now(),
      reviewItem: failed,
    });
    if (needsCancel(failed)) await cancelUnsaved([failed]);
  } finally {
    void queryClient.invalidateQueries({ queryKey: ['documents'] });
    void queryClient.invalidateQueries({ queryKey: billingSubscriptionQueryKey(ctx.orgId) });
  }
}

async function checkOne(file: File, ctx: UploadBatchContext) {
  const jobId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  useUploadStore.getState().addJob({
    id: jobId,
    fileName: file.name,
    fileSize: file.size,
    status: 'checking',
    startedAt: Date.now(),
  });
  let item: DedupReviewItem;
  try {
    const { data } = await checkDocumentDedup(file, {
      userId: ctx.userId,
      groupId: ctx.groupId || null,
      orgId: ctx.orgId,
    });
    item = normalizeCheck(file, ctx.groupId, data, ctx);
  } catch {
    item = failedOpenCheck(file, ctx.groupId, ctx);
  }
  if (item.action === 'block' || item.action === 'choose') {
    useUploadStore.getState().updateJob(jobId, { status: 'review', reviewItem: item });
    return;
  }
  await uploadOne(jobId, { ...item, uploadStarted: true });
}

/** Close the picker and keep working. Each file checks on its own, then uploads or waits for review. */
export function beginBackgroundDocumentUpload(files: File[], ctx: UploadBatchContext) {
  return Promise.all(files.map((file) => checkOne(file, ctx))).then(() => undefined);
}

export function setDedupChoice(documentId: string, decision: 'upload' | 'skip') {
  const { jobs, updateJob } = useUploadStore.getState();
  for (const job of jobs) {
    const item = job.reviewItem;
    if (!item || item.documentId !== documentId || item.action !== 'choose') continue;
    updateJob(job.id, { reviewItem: { ...item, decision } });
  }
}

export async function continueDedupReview() {
  const jobs = reviewJobs();
  await Promise.all(
    jobs.map(async (job) => {
      const item = job.reviewItem;
      if (!item) return;
      const willUpload =
        item.action === 'upload' || (item.action === 'choose' && item.decision === 'upload');
      if (willUpload) {
        await uploadOne(job.id, { ...item, uploadStarted: true });
        return;
      }
      const skipped = { ...item, uploadStarted: false };
      if (needsCancel(skipped)) await cancelUnsaved([skipped]);
      useUploadStore.getState().updateJob(job.id, {
        status: 'skipped',
        finishedAt: Date.now(),
        reviewItem: undefined,
      });
    })
  );
}

/** Leave the review without uploading. In-flight checks and uploads are left alone. */
export function dismissDedupReview() {
  const jobs = reviewJobs();
  const items = jobs.map((job) => job.reviewItem).filter((item): item is DedupReviewItem => Boolean(item));
  for (const job of jobs) {
    useUploadStore.getState().updateJob(job.id, {
      status: 'skipped',
      finishedAt: Date.now(),
      reviewItem: undefined,
    });
  }
  return cancelUnsaved(items.filter((item) => !item.saved && !item.uploadStarted));
}

export function reviewItemsFromJobs(jobs: UploadJob[]): DedupReviewItem[] | null {
  const items = jobs
    .filter((job) => job.status === 'review' && job.reviewItem)
    .map((job) => job.reviewItem as DedupReviewItem);
  return items.length ? items : null;
}
