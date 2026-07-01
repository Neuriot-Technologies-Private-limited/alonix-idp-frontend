/**
 * Site path helper — standalone dev (/) vs Firebase subpath (/docs/).
 * Keep in sync with scripts/site-paths.js
 */
export function isSubpathDeploy(): boolean {
  const base = process.env.DOCUSAURUS_BASE_URL ?? '/';
  return base !== '/' && base !== '';
}

export function sitePath(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (normalized.startsWith('/openapi.yaml') || normalized.startsWith('/playground')) {
    return normalized;
  }
  if (isSubpathDeploy()) {
    if (normalized.startsWith('/docs/')) return normalized.slice(5) || '/';
    if (normalized === '/docs') return '/';
    return normalized;
  }
  if (normalized.startsWith('/api-playground')) return normalized;
  if (normalized.startsWith('/docs')) return normalized;
  return `/docs${normalized}`;
}
