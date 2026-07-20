/**
 * Validates URLs before opening chat/document links in a new tab (audit F-020).
 * Only HTTPS URLs on known object-storage hosts are allowed when bypassing the API.
 */
const ALLOWED_DOCUMENT_URL_SUFFIXES = [
  'amazonaws.com',
  'cloudfront.net',
  'storage.googleapis.com',
];

export function isAllowedExternalDocumentUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== 'https:') return false;
  const host = parsed.hostname.toLowerCase();
  return ALLOWED_DOCUMENT_URL_SUFFIXES.some(
    (suffix) => host === suffix || host.endsWith(`.${suffix}`)
  );
}
