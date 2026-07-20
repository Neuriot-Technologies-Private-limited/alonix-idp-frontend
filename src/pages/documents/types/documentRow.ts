export type DocumentPipelineTab = 'All' | 'Connectors' | 'Ingest' | 'Extract' | 'Classify';

export const DOCUMENTS_ITEMS_PER_PAGE = 8;

interface DocumentPipelineStage {
  status?: string;
  startTime?: string | null;
  endTime?: string | null;
  errorMessage?: string | null;
}

export interface DocumentPipelineStages {
  ingestion?: DocumentPipelineStage;
  extraction?: DocumentPipelineStage;
  classification?: DocumentPipelineStage;
}

/** Pipeline table row from org document APIs. */
export interface DocumentRow {
  id: string;
  fileName?: string;
  title?: string;
  group?: string;
  groupId?: string;
  uploader?: string;
  uploadedBy?: string;
  connectorId?: string;
  sourceType?: string;
  type?: string;
  size?: string;
  sensitivityLevel?: string;
  uploadedAt?: string;
  pipeline?: DocumentPipelineStages;
  [key: string]: unknown;
}
