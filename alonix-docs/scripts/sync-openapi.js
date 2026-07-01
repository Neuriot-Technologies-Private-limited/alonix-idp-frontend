#!/usr/bin/env node
'use strict';

/**
 * Sync OpenAPI spec from alonix-idp-node-backend into static/openapi.yaml.
 * Merges the full backend spec while preserving docs-only paths (/auth/login, /users/me)
 * and their component definitions from openapi.docs-only.yaml.
 *
 * Usage (from alonix-docs/):
 *   npm run sync:openapi
 */

const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

const backendRoot = path.resolve(__dirname, '..', '..', 'alonix-idp-node-backend');
const backendJson = path.join(backendRoot, 'openapi', 'openapi.json');
const docsYaml = path.resolve(__dirname, '..', 'static', 'openapi.yaml');
const docsOnlyYaml = path.resolve(__dirname, '..', 'static', 'openapi.docs-only.yaml');

const DOCS_ONLY_PATHS = ['/auth/login', '/users/me'];
const PUBLIC_OPERATIONS = {
  '/': ['get'],
  '/users/login': ['post'],
  '/users/onboard': ['post'],
  '/users/onboard-invite': ['post'],
  '/users/invite-details': ['get', 'post'],
  '/users/forgot-password': ['post'],
  '/users/reset-password': ['post'],
  '/users/verify-email': ['post'],
  '/users/resend-verification': ['post'],
  '/setup/initialize': ['post'],
  '/auth/login': ['post'],
};
const COMPONENT_KEYS = [
  'schemas',
  'responses',
  'examples',
  'parameters',
  'securitySchemes',
];

/** Sidebar order — mirrors app nav: Health → Auth → workspace features → platform */
const TAG_ORDER = [
  'Health',
  'Auth',
  'Groups',
  'Users',
  'Documents',
  'Chats',
  'Admin',
  'Billing',
  'Connectors',
  'Webhooks',
  'Internal',
  'Setup',
];

const TAG_DESCRIPTIONS = {
  Health: 'API root / welcome',
  Auth: 'Login, logout, and session tokens',
  Groups: 'Workspaces — create, list, read, and delete',
  Users: 'Onboarding, profile, invites, and account',
  Documents: 'Upload, ingest, extract, classify, jobs',
  Chats: 'RAG Q&A and session history',
  Admin: 'Org RBAC, metrics, audit, workspace members',
  Billing: 'Plans, Stripe checkout, subscription',
  Connectors: 'Email, SFTP, SharePoint integrations',
  Webhooks: 'Internal pipeline callbacks',
  Internal: 'Service-to-service audit ingestion',
  Setup: 'Enterprise one-time bootstrap',
};

const AUTH_OPERATIONS = {
  '/auth/login': ['post'],
  '/users/login': ['post'],
  '/users/logout': ['post'],
};

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'];

function loadDocsOnlySpec() {
  const source = fs.existsSync(docsOnlyYaml) ? docsOnlyYaml : docsYaml;
  if (!fs.existsSync(source)) return {paths: {}, components: {}, extraTags: []};

  const spec = yaml.parse(fs.readFileSync(source, 'utf8'));
  const paths = {};
  for (const p of DOCS_ONLY_PATHS) {
    if (spec.paths?.[p]) paths[p] = spec.paths[p];
  }
  return {paths, components: spec.components || {}, extraTags: spec.tags || []};
}

function loadBackendSpec() {
  const exportScript = path.join(backendRoot, 'scripts', 'export-openapi.js');
  if (!fs.existsSync(backendJson)) {
    if (fs.existsSync(exportScript)) {
      require('child_process').execSync('node scripts/export-openapi.js', {
        cwd: backendRoot,
        stdio: 'inherit',
      });
    }
  }
  if (!fs.existsSync(backendJson)) {
    console.warn(`Backend OpenAPI not found at ${backendJson}; keeping docs-only spec.`);
    return null;
  }
  return JSON.parse(fs.readFileSync(backendJson, 'utf8'));
}

function mergeComponents(target, docsOnlyComponents) {
  target.components = target.components || {};
  for (const key of COMPONENT_KEYS) {
    const docsSection = docsOnlyComponents?.[key];
    if (!docsSection) continue;
    target.components[key] = {
      ...(target.components[key] || {}),
      ...docsSection,
    };
  }
}

function applyAuthTagging(spec) {
  for (const [apiPath, methods] of Object.entries(AUTH_OPERATIONS)) {
    const pathItem = spec.paths?.[apiPath];
    if (!pathItem) continue;
    for (const method of methods) {
      if (pathItem[method]) pathItem[method].tags = ['Auth'];
    }
  }
}

function applyTagOrder(spec, extraTags = []) {
  const existing = new Map((spec.tags || []).map((t) => [t.name, t]));
  for (const t of extraTags) {
    if (t.name === 'Auth') existing.set(t.name, t);
  }

  if (!existing.has('Auth')) {
    existing.set('Auth', {name: 'Auth', description: TAG_DESCRIPTIONS.Auth});
  }

  const usedTags = new Set();
  for (const pathItem of Object.values(spec.paths || {})) {
    for (const method of HTTP_METHODS) {
      const op = pathItem[method];
      if (op?.tags) op.tags.forEach((tag) => usedTags.add(tag));
    }
  }

  const ordered = [];
  for (const name of TAG_ORDER) {
    if (usedTags.has(name)) {
      ordered.push({
        name,
        description: TAG_DESCRIPTIONS[name] || existing.get(name)?.description || '',
      });
    }
  }
  for (const name of usedTags) {
    if (!TAG_ORDER.includes(name)) {
      ordered.push(existing.get(name) || {name, description: ''});
    }
  }
  spec.tags = ordered;
}

function applyPublicSecurityOverrides(spec) {
  for (const [apiPath, methods] of Object.entries(PUBLIC_OPERATIONS)) {
    const pathItem = spec.paths?.[apiPath];
    if (!pathItem) continue;
    for (const method of methods) {
      if (pathItem[method]) pathItem[method].security = [];
    }
  }
}

function mergeSpecs(backend, docsOnly) {
  const merged = {...backend};
  merged.paths = {...(backend.paths || {})};
  for (const [p, methods] of Object.entries(docsOnly.paths || {})) {
    merged.paths[p] = methods;
  }
  mergeComponents(merged, docsOnly.components);
  merged.servers = [
    {url: 'http://localhost:4010', description: 'Mock server (Prism)'},
    {url: 'http://localhost:5005/api', description: 'Sandbox backend (local dev)'},
    ...(backend.servers || []).filter((s) => !s.url.includes('4010')),
  ];
  const infoExtra = [
    '',
    '**Playground:** Use mock mode (default) or sandbox via `DOCUSAURUS_API_MODE`.',
    '**Docs-only paths:** `/auth/login` (alias), `/users/me` (composite profile).',
  ].join('\n');
  merged.info = {
    ...merged.info,
    description: `${merged.info?.description || ''}\n${infoExtra}`.trim(),
  };
  applyPublicSecurityOverrides(merged);
  applyAuthTagging(merged);
  applyTagOrder(merged, docsOnly.extraTags || []);
  return merged;
}

function main() {
  const docsOnly = loadDocsOnlySpec();
  const backend = loadBackendSpec();

  if (!backend) {
    if (fs.existsSync(docsOnlyYaml)) {
      fs.copyFileSync(docsOnlyYaml, docsYaml);
      console.log(`Wrote ${docsYaml} from docs-only fallback.`);
    } else {
      console.log('No backend spec to merge; static/openapi.yaml unchanged.');
    }
    return;
  }

  const merged = mergeSpecs(backend, docsOnly);
  fs.writeFileSync(docsYaml, yaml.stringify(merged, {lineWidth: 0}), 'utf8');
  console.log(`Wrote ${docsYaml}`);
  console.log(`Paths: ${Object.keys(merged.paths || {}).length}`);
}

main();
