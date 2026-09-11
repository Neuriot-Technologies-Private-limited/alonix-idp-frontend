function optionLabel(item: unknown): string {
  if (item == null) return '';
  if (typeof item === 'string' || typeof item === 'number') return String(item).trim();
  if (typeof item === 'object') {
    const rec = item as Record<string, unknown>;
    return String(rec.label || rec.text || rec.claim_id || rec.claimId || rec.id || '').trim();
  }
  return String(item).trim();
}

/** Extract clarification chip labels from API / history payloads. */
export function extractClarificationOptions(apiResponse: Record<string, unknown>): string[] {
  const nested =
    apiResponse.data && typeof apiResponse.data === 'object'
      ? (apiResponse.data as Record<string, unknown>)
      : null;
  const raw =
    apiResponse.options ??
    apiResponse.clarification_options ??
    apiResponse.clarificationOptions ??
    nested?.options ??
    nested?.clarification_options ??
    nested?.clarificationOptions ??
    [];
  const list = Array.isArray(raw) ? raw : raw != null && raw !== '' ? [raw] : [];
  return list.map(optionLabel).filter((o) => o.length > 0);
}

export function resolveResponseKind(
  apiResponse: Record<string, unknown>
): 'answer' | 'clarification' {
  const kind = apiResponse.response_kind ?? apiResponse.responseKind;
  if (kind === 'clarification' || apiResponse.status === 'clarification_needed') {
    return 'clarification';
  }
  return 'answer';
}
