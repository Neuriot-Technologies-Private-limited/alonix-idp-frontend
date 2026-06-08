import { describe, expect, it } from 'vitest';
import {
  isConnectorPendingDocumentId,
  resolveSelectedIngestFileNames,
} from '../utils/connectorIngestOptimistic';
import type { EmailDetail } from '../services/connectorBrowserApi';

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
});
