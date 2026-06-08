import { describe, expect, it } from 'vitest';
import {
  buildConnectorBreakdown,
  isConnectorSourcedDoc,
  resolveConnectorSourceType,
} from '../utils/connectorDocumentSource';

describe('connectorDocumentSource', () => {
  const connectors = [
    { _id: 'c-email', name: 'Sales Inbox', type: 'EMAIL' },
    { _id: 'c-sftp', name: 'HR SFTP', type: 'SFTP' },
  ];

  it('detects connector-sourced documents', () => {
    expect(isConnectorSourcedDoc({ connectorId: 'c-email' })).toBe(true);
    expect(isConnectorSourcedDoc({ uploadedBy: 'SYSTEM_CONNECTOR' })).toBe(true);
    expect(isConnectorSourcedDoc({ uploader: 'SYSTEM_CONNECTOR' })).toBe(true);
    expect(isConnectorSourcedDoc({ sourceType: 'EMAIL' })).toBe(true);
    expect(isConnectorSourcedDoc({ ingestSource: 'connector' })).toBe(true);
    expect(isConnectorSourcedDoc({ sourceType: 'UPLOAD' })).toBe(false);
  });

  it('builds type and connector breakdowns', () => {
    const docs = [
      { connectorId: 'c-email', sourceType: 'EMAIL' },
      { connectorId: 'c-email', sourceType: 'EMAIL' },
      { connectorId: 'c-sftp', sourceType: 'SFTP' },
      { sourceType: 'UPLOAD' },
    ];

    const breakdown = buildConnectorBreakdown(docs, connectors);
    expect(breakdown.byType).toEqual([
      { type: 'EMAIL', label: 'Email', count: 2 },
      { type: 'SFTP', label: 'SFTP', count: 1 },
    ]);
    expect(breakdown.byConnector).toEqual([
      { connectorId: 'c-email', name: 'Sales Inbox', type: 'EMAIL', count: 2 },
      { connectorId: 'c-sftp', name: 'HR SFTP', type: 'SFTP', count: 1 },
    ]);
  });

  it('resolves connector type from connector list', () => {
    const map = new Map(connectors.map((c) => [c._id, c]));
    expect(resolveConnectorSourceType({ connectorId: 'c-sftp' }, map)).toBe('SFTP');
    expect(resolveConnectorSourceType({ sourceType: 'EMAIL' }, map)).toBe('EMAIL');
  });
});
