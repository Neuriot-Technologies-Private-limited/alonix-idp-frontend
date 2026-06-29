export type ConnectorDocRow = {
  ingestSource?: string;
  connectorId?: string | null;
  uploadedBy?: string | null;
  sourceType?: string | null;
};

export type ConnectorListItem = {
  _id: string;
  name: string;
  type: string;
};

export type ConnectorTypeBreakdown = {
  type: string;
  label: string;
  count: number;
};

export type ConnectorNameBreakdown = {
  connectorId: string;
  name: string;
  type: string;
  count: number;
};

const CONNECTOR_TYPE_LABELS: Record<string, string> = {
  EMAIL: 'Email',
  SFTP: 'SFTP',
  SHAREPOINT: 'SharePoint',
  API: 'API',
};

export function connectorTypeLabel(type: string): string {
  const key = String(type || '').toUpperCase();
  return CONNECTOR_TYPE_LABELS[key] || key || 'Connector';
}

const CONNECTOR_SOURCE_TYPES = new Set(['EMAIL', 'SFTP', 'SHAREPOINT', 'API']);

function isSystemConnectorRef(value: unknown): boolean {
  return String(value || '').trim().toUpperCase() === 'SYSTEM_CONNECTOR';
}

export function isConnectorSourcedDoc(d: ConnectorDocRow & { uploader?: string | null }): boolean {
  if (d?.ingestSource === 'connector') return true;
  if (d?.connectorId) return true;
  if (isSystemConnectorRef(d?.uploadedBy)) return true;
  if (isSystemConnectorRef(d?.uploader)) return true;
  const sourceType = String(d?.sourceType || 'UPLOAD').toUpperCase();
  return CONNECTOR_SOURCE_TYPES.has(sourceType);
}

export function resolveConnectorSourceType(
  d: ConnectorDocRow,
  connectorById?: Map<string, ConnectorListItem>
): string {
  const connectorId = d?.connectorId ? String(d.connectorId) : '';
  if (connectorId && connectorById?.has(connectorId)) {
    return String(connectorById.get(connectorId)?.type || '').toUpperCase();
  }
  const sourceType = String(d?.sourceType || '').toUpperCase();
  if (sourceType && sourceType !== 'UPLOAD') return sourceType;
  return 'UNKNOWN';
}

export function buildConnectorBreakdown(
  docs: ConnectorDocRow[],
  connectors: ConnectorListItem[] = []
): { byType: ConnectorTypeBreakdown[]; byConnector: ConnectorNameBreakdown[] } {
  const connectorById = new Map(connectors.map((c) => [String(c._id), c]));
  const connectorDocs = docs.filter(isConnectorSourcedDoc);

  const typeCounts = new Map<string, number>();
  const connectorCounts = new Map<string, number>();

  for (const doc of connectorDocs) {
    const type = resolveConnectorSourceType(doc, connectorById);
    typeCounts.set(type, (typeCounts.get(type) || 0) + 1);

    const connectorId = doc.connectorId ? String(doc.connectorId) : '';
    if (connectorId) {
      connectorCounts.set(connectorId, (connectorCounts.get(connectorId) || 0) + 1);
    }
  }

  const byType = [...typeCounts.entries()]
    .map(([type, count]) => ({
      type,
      label: connectorTypeLabel(type),
      count,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

  const byConnector = [...connectorCounts.entries()]
    .map(([connectorId, count]) => {
      const meta = connectorById.get(connectorId);
      return {
        connectorId,
        name: meta?.name || `Connector ${connectorId.slice(-6)}`,
        type: meta?.type || 'UNKNOWN',
        count,
      };
    })
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  return { byType, byConnector };
}
