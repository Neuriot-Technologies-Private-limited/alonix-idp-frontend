function optionLabel(item: unknown): string {
  if (item == null) return '';
  if (typeof item === 'string' || typeof item === 'number') return String(item).trim();
  if (typeof item === 'object') {
    const rec = item as Record<string, unknown>;
    return String(rec.label || rec.text || rec.claim_id || rec.claimId || rec.id || '').trim();
  }
  return String(item).trim();
}

function asRecord(value: object): Record<string, unknown> {
  return value as Record<string, unknown>;
}

/** Extract clarification chip labels from API / history payloads. */
export function extractClarificationOptions(apiResponse: object): string[] {
  const rec = asRecord(apiResponse);
  const nested =
    rec.data && typeof rec.data === 'object' ? asRecord(rec.data) : null;
  const raw =
    rec.options ??
    rec.clarification_options ??
    rec.clarificationOptions ??
    nested?.options ??
    nested?.clarification_options ??
    nested?.clarificationOptions ??
    [];
  const list = Array.isArray(raw) ? raw : raw != null && raw !== '' ? [raw] : [];
  return list.map(optionLabel).filter((o) => o.length > 0);
}

export function resolveResponseKind(apiResponse: object): 'answer' | 'clarification' {
  const rec = asRecord(apiResponse);
  const kind = rec.response_kind ?? rec.responseKind;
  if (kind === 'clarification' || rec.status === 'clarification_needed') {
    return 'clarification';
  }
  return 'answer';
}
