import { describe, expect, it } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import {
  failOptimisticConnectorDocuments,
  isConnectorPendingDocumentId,
  optimisticAppendConnectorDocuments,
  parseConnectorPendingDocumentId,
  resolveSelectedIngestFileNames,
} from '../utils/connectorIngestOptimistic';
import type { EmailDetail } from '../services/connectorBrowserApi';
import { mergePipeline } from '../services/adminService';
import { pipelineDocumentsQueryKey } from '../utils/pipelineDocumentsCache';

describe('connectorIngestOptimistic', () => {
  it('detects pending connector placeholder ids', () => {
    expect(isConnectorPendingDocumentId('connector-pending-c1::file.pdf')).toBe(true);
    expect(isConnectorPendingDocumentId('507f1f77bcf86cd799439011')).toBe(false);
  });

  it('resolves selected archive entry file names', () => {
    const emailDetail = {
      attachments: [
        {
          id: 'att-0',
          fileName: 'Archive.zip',
          ingestable: true,
          archiveEntries: [
            { fileName: 'deck.pptx', sourceKey: 'Archive.zip::deck.pptx', ingestable: true, size: 100 },
            { fileName: '._deck.pptx', sourceKey: 'Archive.zip::._deck.pptx', ingestable: false, size: 10 },
          ],
        },
      ],
    } as EmailDetail;

    const names = resolveSelectedIngestFileNames(emailDetail, {
      archivePaths: ['Archive.zip::deck.pptx'],
    });
    expect(names).toEqual(['deck.pptx']);
  });

  it('marks optimistic connector rows as failed instead of removing them', () => {
    const queryClient = new QueryClient();
    const orgId = 'org-1';
    optimisticAppendConnectorDocuments(
      queryClient,
      [{ fileName: 'invoice.pdf', connectorId: 'c1', connectorType: 'EMAIL' }],
      orgId,
      'group-1'
    );

    failOptimisticConnectorDocuments(
      queryClient,
      ['invoice.pdf'],
      orgId,
      'group-1',
      'archive read failed'
    );

    const rows = queryClient.getQueryData<Record<string, unknown>[]>(
      pipelineDocumentsQueryKey(orgId, 'all')
    );
    expect(rows).toHaveLength(1);
    expect(isConnectorPendingDocumentId(rows?.[0]?.id)).toBe(true);
    const pipeline = mergePipeline(rows?.[0]?.pipeline);
    expect(pipeline.ingestion.status).toBe('error');
    expect(pipeline.ingestion.errorMessage).toBe('archive read failed');
  });

  it('parses connector pending document ids', () => {
    expect(parseConnectorPendingDocumentId('connector-pending-c1::invoice.pdf')).toEqual({
      connectorId: 'c1',
      fileName: 'invoice.pdf',
    });
    expect(parseConnectorPendingDocumentId('507f1f77bcf86cd799439011')).toBeNull();
  });
});
