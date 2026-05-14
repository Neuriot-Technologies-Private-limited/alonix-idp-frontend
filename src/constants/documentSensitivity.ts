/** Ordered low → high; must match backend `constants/documentSensitivity.js`. */
export const DOCUMENT_SENSITIVITY_LEVELS = [
  'PUBLIC',
  'INTERNAL_USE',
  'CONFIDENTIAL',
  'HIGHLY_CONFIDENTIAL',
  'RESTRICTED',
] as const;

export type DocumentSensitivityLevel = (typeof DOCUMENT_SENSITIVITY_LEVELS)[number];

export const DOCUMENT_SENSITIVITY_LABELS: Record<DocumentSensitivityLevel, string> = {
  PUBLIC: 'Public',
  INTERNAL_USE: 'Internal use',
  CONFIDENTIAL: 'Confidential',
  HIGHLY_CONFIDENTIAL: 'Highly confidential',
  RESTRICTED: 'Restricted',
};

export const DOCUMENT_SENSITIVITY_HINTS: Record<DocumentSensitivityLevel, string> = {
  PUBLIC: 'Safe for external sharing',
  INTERNAL_USE: 'Company-only',
  CONFIDENTIAL: 'Team or department scope',
  HIGHLY_CONFIDENTIAL: 'Named individuals only',
  RESTRICTED: 'Highest controls and audit expectations',
};

export function sensitivityLevelIndex(key: string): number {
  const k = String(key || '').toUpperCase().replace(/-/g, '_') as DocumentSensitivityLevel;
  const i = DOCUMENT_SENSITIVITY_LEVELS.indexOf(k);
  return i < 0 ? 1 : i;
}

/** Levels a user may assign on upload if their clearance is `viewerMaxKey`. */
export function uploadAssignableLevels(viewerMaxKey: string): DocumentSensitivityLevel[] {
  const vmax = sensitivityLevelIndex(viewerMaxKey);
  return DOCUMENT_SENSITIVITY_LEVELS.filter((k) => sensitivityLevelIndex(k) <= vmax);
}
