/**
 * Truncates a file name to `max` characters. If the name exceeds `max`, the
 * extension is preserved and the stem is clipped with an ellipsis.
 *
 * Examples (max = 32):
 *   "short.pdf"                          → "short.pdf"
 *   "very-long-file-name-document.pdf"   → "very-long-file-name-docu….pdf"
 *   "no-extension-at-all-very-long-name" → "no-extension-at-all-very-l…"
 */
export function truncateFileName(name: string, max = 32): string {
  if (!name || name.length <= max) return name;

  const dotIndex = name.lastIndexOf('.');
  const hasExt = dotIndex > 0 && dotIndex < name.length - 1;

  if (hasExt) {
    const ext = name.slice(dotIndex); // e.g. ".pdf"
    const stem = name.slice(0, dotIndex);
    const allowedStem = max - ext.length - 1; // 1 for the ellipsis
    if (allowedStem <= 0) {
      // Extension itself is weirdly long — just clip the whole thing
      return name.slice(0, max - 1) + '…';
    }
    return stem.slice(0, allowedStem) + '…' + ext;
  }

  return name.slice(0, max - 1) + '…';
}
