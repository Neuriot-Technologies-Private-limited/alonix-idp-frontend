import { describe, expect, it, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import {
  applyJobUpdateToPipelineCache,
  hasProcessingPipelineDocuments,
  optimisticAppendUploadedDocument,
  optimisticSetPipelineStage,
  pipelineActionToStage,
  markPipelineStageFailed,
  readPipelineStageStatus,
} from '../utils/pipelineDocumentsCache';

describe('pipelineDocumentsCache', () => {
  it('maps pipeline actions to stage keys', () => {
    expect(pipelineActionToStage('ingest')).toBe('ingestion');
    expect(pipelineActionToStage('extract')).toBe('extraction');
    expect(pipelineActionToStage('classify')).toBe('classification');
  });

  it('optimisticSetPipelineStage updates ingestion to processing', () => {
    const qc = new QueryClient();
    qc.setQueryData(['pipeline-documents', 'org-1', 'all'], [
      {
        id: 'doc-1',
        fileName: 'a.pdf',
        pipeline: { ingestion: { status: 'idle' } },
      },
    ]);

    optimisticSetPipelineStage(qc, 'doc-1', 'ingestion', 'processing', 'org-1');

    const rows = qc.getQueryData<any[]>(['pipeline-documents', 'org-1', 'all']);
    expect(rows?.[0].pipeline.ingestion.status).toBe('processing');
  });

  it('optimisticAppendUploadedDocument prepends a new row', () => {
    const qc = new QueryClient();
    qc.setQueryData(['pipeline-documents', 'org-1', 'all'], [
      { id: 'existing', fileName: 'old.pdf', pipeline: {} },
    ]);

    optimisticAppendUploadedDocument(
      qc,
      {
        id: 'new-doc',
        fileName: 'new.pdf',
        groupId: 'g1',
        groupName: 'Ops',
      },
      'org-1'
    );

    const rows = qc.getQueryData<any[]>(['pipeline-documents', 'org-1', 'all']);
    expect(rows).toHaveLength(2);
    expect(rows?.[0].id).toBe('new-doc');
    expect(rows?.[0].group).toBe('Ops');
    expect(rows?.[0].type).toBe('PDF');
  });

  it('markPipelineStageFailed sets error on the stage after API failure', () => {
    const qc = new QueryClient();
    qc.setQueryData(['pipeline-documents', 'org-1', 'all'], [
      {
        id: 'doc-1',
        fileName: 'a.pdf',
        pipeline: { ingestion: { status: 'idle' } },
      },
    ]);

    expect(readPipelineStageStatus({ ingestion: { status: 'idle' } }, 'ingestion')).toBe('idle');
    optimisticSetPipelineStage(qc, 'doc-1', 'ingestion', 'processing', 'org-1');
    markPipelineStageFailed(qc, 'doc-1', 'ingestion', 'org-1');

    const rows = qc.getQueryData<any[]>(['pipeline-documents', 'org-1', 'all']);
    expect(rows?.[0].pipeline.ingestion.status).toBe('error');
  });

  it('applyJobUpdateToPipelineCache patches stage from websocket payload', () => {
    const qc = new QueryClient();
    qc.setQueryData(['pipeline-documents', 'org-1', 'all'], [
      {
        id: 'doc-1',
        fileName: 'a.pdf',
        pipeline: { ingestion: { status: 'idle' } },
      },
    ]);

    applyJobUpdateToPipelineCache(
      qc,
      {
        documentId: 'doc-1',
        taskType: 'INGEST',
        status: 'PROCESSING',
        timestamps: { startTime: '2026-06-08T10:00:00.000Z', endTime: null },
      },
      'org-1'
    );

    const rows = qc.getQueryData<any[]>(['pipeline-documents', 'org-1', 'all']);
    expect(rows?.[0].pipeline.ingestion.status).toBe('processing');
  });

  it('applyJobUpdateToPipelineCache skips unknown document without HTTP refetch', () => {
    const qc = new QueryClient();
    qc.setQueryData(['pipeline-documents', 'org-1', 'all'], [
      { id: 'other-doc', fileName: 'b.pdf', pipeline: { ingestion: { status: 'idle' } } },
    ]);
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries');

    applyJobUpdateToPipelineCache(
      qc,
      { documentId: 'missing-doc', taskType: 'EXTRACT', status: 'PROCESSING' },
      'org-1'
    );
    applyJobUpdateToPipelineCache(
      qc,
      { documentId: 'missing-doc', taskType: 'EXTRACT', status: 'PROCESSING' },
      'org-1'
    );

    expect(invalidateSpy).not.toHaveBeenCalled();
    invalidateSpy.mockRestore();
  });

  it('hasProcessingPipelineDocuments detects in-flight stages', () => {
    expect(
      hasProcessingPipelineDocuments([
        { pipeline: { ingestion: { status: 'idle' }, extraction: { status: 'idle' } } },
      ])
    ).toBe(false);
    expect(
      hasProcessingPipelineDocuments([
        { pipeline: { ingestion: { status: 'processing' }, extraction: { status: 'idle' } } },
      ])
    ).toBe(true);
  });
});
