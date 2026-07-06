import {useCallback} from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

/**
 * Site path helper — standalone dev (/) vs Firebase subpath (/docs/).
 * Keep logic in sync with scripts/site-paths.js (Node/build-time only).
 */
export function isSubpathDeploy(baseUrl = '/'): boolean {
  return baseUrl !== '/' && baseUrl !== '';
}

export function sitePath(path: string, baseUrl = '/'): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (normalized.startsWith('/openapi.yaml') || normalized.startsWith('/playground')) {
    return normalized;
  }
  if (isSubpathDeploy(baseUrl)) {
    if (normalized.startsWith('/docs/')) return normalized.slice(5) || '/';
    if (normalized === '/docs') return '/';
    return normalized;
  }
  if (normalized.startsWith('/api-playground')) return normalized;
  if (normalized.startsWith('/docs')) return normalized;
  return `/docs${normalized}`;
}

/** Client-safe path resolver using Docusaurus siteConfig.baseUrl. */
export function useSitePath(): (path: string) => string {
  const {siteConfig} = useDocusaurusContext();
  const baseUrl = siteConfig.baseUrl;
  return useCallback((path: string) => sitePath(path, baseUrl), [baseUrl]);
}
