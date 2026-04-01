/**
 * UI labels for merged pipeline state (matches {@link mergePipeline} output shape).
 * Kept in utils with a narrow type so feature code does not need `adminService` for labels.
 */
export type PipelineStageForLabel = {
  ingestion: { status: string };
  extraction: { status: string };
  classification: { status: string };
};

export function getPipelineCurrentStageLabel(p: PipelineStageForLabel): string {
  const isAllDone =
    p.ingestion.status === 'done' &&
    p.extraction.status === 'done' &&
    p.classification.status === 'done';
  if (p.ingestion.status === 'processing') return 'Ingesting...';
  if (p.ingestion.status === 'error') return 'Failed';
  if (p.extraction.status === 'processing') return 'Extracting...';
  if (p.extraction.status === 'error') return 'Failed';
  if (p.classification.status === 'processing') return 'Classifying...';
  if (p.classification.status === 'error') return 'Failed';
  if (isAllDone) return 'Complete';
  return 'Idle';
}
