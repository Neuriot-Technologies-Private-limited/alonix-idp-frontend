const CLAIM_ID_MAX = 128;

function looksLikeClaimId(value: string): boolean {
  const v = value.trim();
  if (!v || v.length > CLAIM_ID_MAX || /\s/.test(v)) return false;
  return /^[A-Za-z0-9][A-Za-z0-9._:/-]*$/.test(v) && /\d/.test(v);
}

/** Parse "Claim B20ME076 (Name)" or a bare / structured claim id. */
export function claimIdFromClarificationOption(raw: unknown): string | null {
  if (raw && typeof raw === 'object') {
    const rec = raw as Record<string, unknown>;
    const structured = String(rec.claim_id || rec.claimId || rec.id || '').trim();
    if (looksLikeClaimId(structured)) return structured;
    return claimIdFromClarificationOption(rec.label || rec.text || '');
  }
  const s = String(raw ?? '').trim();
  if (!s) return null;
  const prefixed = s.match(/^Claim\s+([^\s(]+)/i);
  if (prefixed?.[1] && looksLikeClaimId(prefixed[1])) return prefixed[1];
  if (looksLikeClaimId(s)) return s;
  return null;
}

export function pinnedClaimIdFromAskResponse(apiResponse: {
  claim_id?: string | null;
  claim_ids?: string[] | null;
  claimIds?: string[] | null;
}): string | null {
  const direct = String(apiResponse.claim_id ?? '').trim();
  if (looksLikeClaimId(direct)) return direct;
  const ids = apiResponse.claim_ids ?? apiResponse.claimIds ?? [];
  if (Array.isArray(ids) && ids.length === 1) {
    const only = String(ids[0] ?? '').trim();
    if (looksLikeClaimId(only)) return only;
  }
  return null;
}
