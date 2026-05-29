import { describe, expect, it } from 'vitest';
import {
  DOCUMENT_SENSITIVITY_LEVELS,
  normalizeDocumentSensitivityLevel,
  sensitivityLevelIndex,
  uploadAssignableLevels,
  uploadAssignableLevelsForGroup,
} from '../constants/documentSensitivity';

describe('documentSensitivity', () => {
  describe('normalizeDocumentSensitivityLevel', () => {
    it('normalizes known levels with case and hyphen variants', () => {
      expect(normalizeDocumentSensitivityLevel('public')).toBe('PUBLIC');
      expect(normalizeDocumentSensitivityLevel('highly-confidential')).toBe('HIGHLY_CONFIDENTIAL');
    });

    it('defaults unknown values to INTERNAL_USE', () => {
      expect(normalizeDocumentSensitivityLevel('')).toBe('INTERNAL_USE');
      expect(normalizeDocumentSensitivityLevel('TOP_SECRET')).toBe('INTERNAL_USE');
    });
  });

  describe('sensitivityLevelIndex', () => {
    it('orders levels low to high', () => {
      expect(sensitivityLevelIndex('PUBLIC')).toBe(0);
      expect(sensitivityLevelIndex('RESTRICTED')).toBe(DOCUMENT_SENSITIVITY_LEVELS.length - 1);
    });
  });

  describe('uploadAssignableLevels', () => {
    it('includes only levels at or below viewer clearance', () => {
      const levels = uploadAssignableLevels('CONFIDENTIAL');
      expect(levels).toContain('PUBLIC');
      expect(levels).toContain('CONFIDENTIAL');
      expect(levels).not.toContain('RESTRICTED');
    });
  });

  describe('uploadAssignableLevelsForGroup', () => {
    it('intersects clearance with workspace-enabled tiers', () => {
      const levels = uploadAssignableLevelsForGroup('RESTRICTED', ['PUBLIC', 'INTERNAL_USE']);
      expect(levels).toEqual(['PUBLIC', 'INTERNAL_USE']);
    });

    it('falls back to clearance-only when filter removes everything', () => {
      const levels = uploadAssignableLevelsForGroup('PUBLIC', ['RESTRICTED']);
      expect(levels).toEqual(['PUBLIC']);
    });
  });
});
