import { create } from 'zustand';
import type { DedupReviewItem } from '../pages/documents/dedupReview';

export type UploadJobStatus = 'checking' | 'uploading' | 'review' | 'done' | 'error' | 'skipped';

export interface UploadJob {
  /** Unique ID for this upload job (crypto.randomUUID or Date.now string) */
  id: string;
  fileName: string;
  /** File size in bytes */
  fileSize: number;
  status: UploadJobStatus;
  /** Optional error message if status === 'error' */
  error?: string;
  /** Wall-clock timestamp when the job was created */
  startedAt: number;
  /** Wall-clock timestamp when the job finished (done, error, or skipped) */
  finishedAt?: number;
  /** Set while the user still has to accept or skip a duplicate match. */
  reviewItem?: DedupReviewItem;
}

interface UploadStore {
  jobs: UploadJob[];
  /** Add a new job (status = 'uploading') */
  addJob: (job: UploadJob) => void;
  /** Patch fields on an existing job by id */
  updateJob: (id: string, patch: Partial<UploadJob>) => void;
  /** Remove a single job by id */
  removeJob: (id: string) => void;
  /** Remove jobs that already finished (done, error, or skipped). */
  clearFinished: () => void;
}

export const useUploadStore = create<UploadStore>((set) => ({
  jobs: [],

  addJob: (job) =>
    set((state) => ({ jobs: [...state.jobs, job] })),

  updateJob: (id, patch) =>
    set((state) => ({
      jobs: state.jobs.map((j) => (j.id === id ? { ...j, ...patch } : j)),
    })),

  removeJob: (id) =>
    set((state) => ({ jobs: state.jobs.filter((j) => j.id !== id) })),

  clearFinished: () =>
    set((state) => ({
      jobs: state.jobs.filter(
        (j) => j.status === 'checking' || j.status === 'uploading' || j.status === 'review'
      ),
    })),
}));
