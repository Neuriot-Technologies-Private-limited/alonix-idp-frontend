export type DocumentPipelineTab = 'All' | 'Connectors' | 'Ingest' | 'Extract' | 'Classify';

export const DOCUMENTS_ITEMS_PER_PAGE = 8;

/** Pipeline table row shape from org document API (typed loosely until API schema is fixed). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DocumentRow = any;
