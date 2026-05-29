import { beforeEach, describe, expect, it } from 'vitest';
import { useUploadStore, type UploadJob } from '../stores/uploadStore';

const job = (id: string, status: UploadJob['status']): UploadJob => ({
  id,
  fileName: `${id}.pdf`,
  fileSize: 100,
  status,
  startedAt: Date.now(),
});

describe('uploadStore', () => {
  beforeEach(() => {
    useUploadStore.setState({ jobs: [] });
  });

  it('adds and updates jobs', () => {
    useUploadStore.getState().addJob(job('1', 'uploading'));
    useUploadStore.getState().updateJob('1', { status: 'done', finishedAt: 1 });
    const j = useUploadStore.getState().jobs[0];
    expect(j.status).toBe('done');
    expect(j.finishedAt).toBe(1);
  });

  it('removes a single job', () => {
    useUploadStore.getState().addJob(job('1', 'uploading'));
    useUploadStore.getState().removeJob('1');
    expect(useUploadStore.getState().jobs).toHaveLength(0);
  });

  it('clearFinished keeps only uploading jobs', () => {
    useUploadStore.getState().addJob(job('1', 'uploading'));
    useUploadStore.getState().addJob(job('2', 'done'));
    useUploadStore.getState().addJob(job('3', 'error'));
    useUploadStore.getState().clearFinished();
    expect(useUploadStore.getState().jobs.map((j) => j.id)).toEqual(['1']);
  });
});
