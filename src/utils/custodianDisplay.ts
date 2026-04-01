/**
 * Maps uploader email + optional org directory to a display name for document vault UIs.
 */
export function resolveCustodianDisplay(
  uploaderField: string | undefined,
  nameByEmail: Map<string, string>
): { label: string; email: string } {
  const raw = (uploaderField || '').trim();
  if (!raw || raw === 'Unknown') return { label: 'Unknown', email: '' };
  const named = nameByEmail.get(raw.toLowerCase());
  if (named) return { label: named, email: raw };
  const at = raw.indexOf('@');
  if (at > 0) {
    const local = raw.slice(0, at);
    const pretty = local
      .replace(/[._-]+/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
    return { label: pretty || raw, email: raw };
  }
  return { label: raw, email: raw };
}
