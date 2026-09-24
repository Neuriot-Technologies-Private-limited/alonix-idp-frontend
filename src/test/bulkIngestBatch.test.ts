import { describe, expect, it } from 'vitest';
import {
  BATCH_INGEST_CHUNK,
  batchIngestItemError,
  chunkList,
  collectBatchIngestFailures,
  groupTargetsByGroup,
  selectBulkPipelineTargets,
  type BulkPipelineTarget,
} from '../pages/documents/hooks/pipeline/bulkIngestBatch';
import type { DocumentRow } from '../pages/documents/types/documentRow';

function row(partial: Partial<DocumentRow> & { id: string }): DocumentRow {
  return {
    pipeline: {
      ingestion: { status: 'idle' },
      extraction: { status: 'idle' },
      classification: { status: 'idle' },
    },
    ...partial,
  };
}

describe('bulk ingest batching', () => {
  it('splits ids into server-sized chunks', () => {
    const ids = Array.from({ length: BATCH_INGEST_CHUNK + 1 }, (_, i) => String(i));
    const chunks = chunkList(ids, BATCH_INGEST_CHUNK);
    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toHaveLength(BATCH_INGEST_CHUNK);
    expect(chunks[1]).toEqual(['50']);
  });

  it('groups targets by workspace so each batch stays on one documents route', () => {
    const targets: BulkPipelineTarget[] = [
      { id: 'a', fileName: 'a.pdf', groupId: 'g1', collectionName: 'g1' },
      { id: 'b', fileName: 'b.pdf', groupId: 'g2', collectionName: 'g2' },
      { id: 'c', fileName: 'c.pdf', groupId: 'g1', collectionName: 'g1' },
    ];
    const grouped = groupTargetsByGroup(targets);
    expect(grouped.get('g1')?.map((t) => t.id)).toEqual(['a', 'c']);
    expect(grouped.get('g2')?.map((t) => t.id)).toEqual(['b']);
  });

  it('treats PENDING as queued and maps other batch statuses', () => {
    expect(batchIngestItemError('PENDING')).toBeNull();
    expect(batchIngestItemError('NOT_FOUND')).toBe('Document not found.');
    expect(batchIngestItemError(undefined)).toBe('Could not start ingest.');
  });

  it('does not report an error when every batch item is queued', () => {
    const targets = [
      { id: '507f1f77bcf86cd799439011', fileName: 'email1.pdf' },
      { id: '507f191e810c19729de860ea', fileName: 'report.pdf' },
    ];
    const failures = collectBatchIngestFailures(targets, [
      { id: '507f1f77bcf86cd799439011', status: 'PENDING' },
      { id: '507f191e810c19729de860ea', status: 'PENDING' },
    ]);
    expect(failures).toEqual([]);
  });

  it('reports only the document that the batch did not queue', () => {
    const targets = [
      { id: 'ok', fileName: 'ok.pdf' },
      { id: 'missing', fileName: 'missing.pdf' },
    ];
    const failures = collectBatchIngestFailures(targets, [
      { id: 'ok', status: 'PENDING' },
      { id: 'missing', status: 'NOT_FOUND' },
    ]);
    expect(failures).toEqual([{ id: 'missing', message: 'missing.pdf: Document not found.' }]);
  });

  it('skips documents that are already ingesting or done', () => {
    const docs = [
      row({ id: 'idle', fileName: 'idle.pdf', groupId: 'g1' }),
      row({
        id: 'done',
        fileName: 'done.pdf',
        pipeline: { ingestion: { status: 'done' } },
      }),
      row({
        id: 'busy',
        fileName: 'busy.pdf',
        pipeline: { ingestion: { status: 'processing' } },
      }),
    ];
    const targets = selectBulkPipelineTargets(
      docs,
      new Set(['idle', 'done', 'busy']),
      'ingest',
      () => true
    );
    expect(targets.map((t) => t.id)).toEqual(['idle']);
  });
});
