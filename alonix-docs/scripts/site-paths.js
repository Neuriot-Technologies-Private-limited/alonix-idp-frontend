#!/usr/bin/env node
'use strict';

/**
 * Path helper for Docusaurus standalone (/) vs Firebase subpath (/docs/) deploys.
 * Used by generate-api-docs.js and docusaurus.config.ts (via duplicate logic).
 */

function isSubpathDeploy() {
  const base = process.env.DOCUSAURUS_BASE_URL ?? '/';
  return base !== '/' && base !== '';
}

/**
 * @param {string} path - Site path starting with / (e.g. /introduction/foo, /api-playground)
 */
function sitePath(path) {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  // Static assets live at site root (openapi.yaml, playground/)
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

module.exports = { isSubpathDeploy, sitePath };
