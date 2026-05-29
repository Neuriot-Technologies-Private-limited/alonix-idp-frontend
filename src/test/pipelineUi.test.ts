import { describe, expect, it } from 'vitest';
import { getPipelineCurrentStageLabel } from '../utils/pipelineUi';

const idle = { status: 'idle' };
const done = { status: 'done' };
const processing = { status: 'processing' };
const error = { status: 'error' };

describe('getPipelineCurrentStageLabel', () => {
  it('reports ingestion in progress first', () => {
    expect(
      getPipelineCurrentStageLabel({
        ingestion: processing,
        extraction: idle,
        classification: idle,
      })
    ).toBe('Ingesting...');
  });

  it('reports extraction and classification stages', () => {
    expect(
      getPipelineCurrentStageLabel({
        ingestion: done,
        extraction: processing,
        classification: idle,
      })
    ).toBe('Extracting...');
    expect(
      getPipelineCurrentStageLabel({
        ingestion: done,
        extraction: done,
        classification: processing,
      })
    ).toBe('Classifying...');
  });

  it('reports Complete when all stages are done', () => {
    expect(
      getPipelineCurrentStageLabel({
        ingestion: done,
        extraction: done,
        classification: done,
      })
    ).toBe('Complete');
  });

  it('reports Failed on first error stage in order', () => {
    expect(
      getPipelineCurrentStageLabel({
        ingestion: error,
        extraction: idle,
        classification: idle,
      })
    ).toBe('Failed');
  });

  it('returns Idle when nothing is running', () => {
    expect(
      getPipelineCurrentStageLabel({
        ingestion: idle,
        extraction: idle,
        classification: idle,
      })
    ).toBe('Idle');
  });
});
