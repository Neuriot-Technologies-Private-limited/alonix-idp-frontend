/**
 * UI labels for merged pipeline state (matches {@link mergePipeline} output shape).
 * Kept in utils with a narrow type so feature code does not need `adminService` for labels.
 */
export type PipelineStageForLabel = {
  ingestion: { status: string; errorMessage?: string | null };
  extraction: { status: string; errorMessage?: string | null };
  classification: { status: string; errorMessage?: string | null };
};

export function getPipelineFailureMessage(p: PipelineStageForLabel): string | null {
  if (p.ingestion.status === 'error') {
    return p.ingestion.errorMessage ? String(p.ingestion.errorMessage) : null;
  }
  if (p.extraction.status === 'error') {
    return p.extraction.errorMessage ? String(p.extraction.errorMessage) : null;
  }
  if (p.classification.status === 'error') {
    return p.classification.errorMessage ? String(p.classification.errorMessage) : null;
  }
  return null;
}

export function getPipelineCurrentStageLabel(p: PipelineStageForLabel): string {
  const isAllDone =
    p.ingestion.status === 'done' &&
    p.extraction.status === 'done' &&
    p.classification.status === 'done';
  if (p.ingestion.status === 'processing') return 'Ingesting...';
  if (p.ingestion.status === 'error') return 'Ingest failed';
  if (p.extraction.status === 'processing') return 'Extracting...';
  if (p.extraction.status === 'error') return 'Extract failed';
  if (p.classification.status === 'processing') return 'Classifying...';
  if (p.classification.status === 'error') return 'Classify failed';
  if (isAllDone) return 'Complete';
  return 'Idle';
}
