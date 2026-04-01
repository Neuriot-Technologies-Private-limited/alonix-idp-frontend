import React from 'react';
import { mergePipeline } from '../../services/adminService';
import { getPipelineCurrentStageLabel } from '../../utils/pipelineUi';
import { PipelineStage, StatusBadge } from './DocumentPrimitives';

export const DocumentPipelineLifecycle: React.FC<{ pipeline: unknown; className?: string }> = ({
  pipeline,
  className,
}) => {
  const p = mergePipeline(pipeline);
  const currentStage = getPipelineCurrentStageLabel(p);
  return (
    <div className={className ?? 'flex flex-col items-center justify-center gap-2'}>
      <div className="flex items-center">
        <PipelineStage label="Ing" status={p.ingestion.status as 'done' | 'processing' | 'error' | 'idle'} />
        <PipelineStage label="Ext" status={p.extraction.status as 'done' | 'processing' | 'error' | 'idle'} />
        <PipelineStage
          label="Cls"
          status={p.classification.status as 'done' | 'processing' | 'error' | 'idle'}
          isLast
        />
      </div>
      <StatusBadge status={currentStage} />
    </div>
  );
};
