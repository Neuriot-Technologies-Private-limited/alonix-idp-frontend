/**
 * Pick which workspace a document upload targets.
 * Prefer an explicit modal selection, then TopNav activeGroupId, then first allowed.
 * Never silently prefer "newest admin group" over the workspace the user is viewing.
 */
export function resolveUploadTargetGroupId(opts: {
  activeGroupId?: string | null;
  allowedGroupIds: string[];
  previousTargetId?: string | null;
}): string {
  const allowed = opts.allowedGroupIds.map((id) => String(id).trim()).filter(Boolean);
  if (!allowed.length) return '';

  const allowedSet = new Set(allowed);
  const prev = String(opts.previousTargetId || '').trim();
  if (prev && allowedSet.has(prev)) return prev;

  const active = String(opts.activeGroupId || '').trim();
  if (active && allowedSet.has(active)) return active;

  return allowed[0] || '';
}
