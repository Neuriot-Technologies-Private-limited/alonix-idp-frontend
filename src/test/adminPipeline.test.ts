import { describe, expect, it } from 'vitest';
import { mergePipeline, normalizePipelineDocument } from '../services/adminService';

describe('adminService pipeline helpers', () => {
  describe('mergePipeline', () => {
    it('returns idle stages when pipeline is missing', () => {
      const p = mergePipeline(null);
      expect(p.ingestion.status).toBe('idle');
      expect(p.extraction.status).toBe('idle');
      expect(p.classification.status).toBe('idle');
    });

    it('fills missing stages from partial API payload', () => {
      const p = mergePipeline({
        ingestion: { status: 'done', startTime: 't1', endTime: 't2' },
      });
      expect(p.ingestion.status).toBe('done');
      expect(p.extraction.status).toBe('idle');
      expect(p.classification.status).toBe('idle');
    });
  });

  describe('normalizePipelineDocument', () => {
    it('normalizes uploader, sensitivity, and pipeline', () => {
      const doc = normalizePipelineDocument({
        uploadedBy: 'user@example.com',
        sensitivityLevel: 'highly-confidential',
        pipeline: { ingestion: { status: 'processing' } },
        uploadedAt: '2026-01-15T10:00:00.000Z',
      });
      expect(doc.uploader).toBe('user@example.com');
      expect(doc.sensitivityLevel).toBe('HIGHLY_CONFIDENTIAL');
      expect((doc.pipeline as { ingestion: { status: string } }).ingestion.status).toBe('processing');
      expect(doc.uploadedAt).toBe('2026-01-15T10:00:00.000Z');
    });

    it('uses Unknown uploader and INTERNAL_USE when fields are empty', () => {
      const doc = normalizePipelineDocument({});
      expect(doc.uploader).toBe('Unknown');
      expect(doc.sensitivityLevel).toBe('INTERNAL_USE');
    });
  });
});
