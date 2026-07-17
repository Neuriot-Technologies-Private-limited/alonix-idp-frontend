export const PII_HANDLING_POLICIES = [
  {
    value: 'RAW_PII_ALLOWED',
    label: 'Raw PII allowed',
    description: 'PII is stored as-is in documents with no masking or encryption.',
  },
  {
    value: 'MASK_PII_NO_STORAGE',
    label: 'Mask PII — no storage',
    description: 'PII is detected and stripped before indexing. No PII is retained.',
  },
  {
    value: 'MASK_PII_STORE_ENCRYPTED',
    label: 'Mask PII — encrypted vault',
    description: 'PII is masked with an encrypted vault that enables query-time rehydration.',
  },
] as const;

export type PiiHandlingPolicy = (typeof PII_HANDLING_POLICIES)[number]['value'];

export const DEFAULT_PII_HANDLING_POLICY: PiiHandlingPolicy = 'RAW_PII_ALLOWED';

export const PII_POLICY_LABELS: Record<PiiHandlingPolicy, string> = {
  RAW_PII_ALLOWED: 'Raw PII allowed',
  MASK_PII_NO_STORAGE: 'Mask PII — no storage',
  MASK_PII_STORE_ENCRYPTED: 'Mask PII — encrypted vault',
};

export const PII_POLICY_SHORT_LABELS: Record<PiiHandlingPolicy, string> = {
  RAW_PII_ALLOWED: 'Raw PII',
  MASK_PII_NO_STORAGE: 'PII masked',
  MASK_PII_STORE_ENCRYPTED: 'PII encrypted',
};

export const PII_POLICY_DESCRIPTIONS: Record<PiiHandlingPolicy, string> = {
  RAW_PII_ALLOWED: 'PII is stored as-is in documents with no masking or encryption.',
  MASK_PII_NO_STORAGE: 'PII is detected and stripped before indexing. No PII is retained.',
  MASK_PII_STORE_ENCRYPTED: 'PII is masked with an encrypted vault that enables query-time rehydration.',
};
