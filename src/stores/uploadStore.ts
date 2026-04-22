import { create } from 'zustand';

export type UploadJobStatus = 'uploading' | 'done' | 'error';

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
  /** Wall-clock timestamp when the job finished (done or error) */
  finishedAt?: number;
}

interface UploadStore {
  jobs: UploadJob[];
  /** Add a new job (status = 'uploading') */
  addJob: (job: UploadJob) => void;
  /** Patch fields on an existing job by id */
  updateJob: (id: string, patch: Partial<UploadJob>) => void;
  /** Remove a single job by id */
  removeJob: (id: string) => void;
  /** Remove all jobs whose status is 'done' or 'error' */
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
      jobs: state.jobs.filter((j) => j.status === 'uploading'),
    })),
}));
