#!/usr/bin/env node
'use strict';

/**
 * Generates MDX API reference pages from static/openapi.yaml.
 * Run after sync:openapi — npm run generate:api-docs
 */

const fs = require('fs');
const path = require('path');
const yaml = require('yaml');
const { sitePath: sp } = require('./site-paths');

const ROOT = path.join(__dirname, '..');
const SPEC_PATH = path.join(ROOT, 'static', 'openapi.yaml');
const OUT_ROOT = path.join(ROOT, 'docs', 'developer', 'api-reference');

const METHODS = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'];
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

function tagSlug(tag) {
  return tag.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function opSlug(method, apiPath) {
  const base = apiPath
    .replace(/^\//, '')
    .replace(/\{[^}]+\}/g, 'param')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return `${method}-${base || 'root'}`.toLowerCase();
}

function resolveRef(spec, ref) {
  if (!ref || !ref.startsWith('#/')) return null;
  const parts = ref.slice(2).split('/');
  let node = spec;
  for (const p of parts) {
    node = node?.[p];
    if (!node) return null;
  }
  return node;
}

function resolveSchema(spec, schema, depth = 0) {
  if (!schema || depth > 4) return schema;
  if (schema.$ref) {
    const resolved = resolveRef(spec, schema.$ref);
    return resolveSchema(spec, resolved, depth + 1);
  }
  if (schema.allOf) {
    return schema.allOf.reduce((acc, s) => ({ ...acc, ...resolveSchema(spec, s, depth + 1) }), {});
  }
  return schema;
}

function schemaExample(spec, schema) {
  const s = resolveSchema(spec, schema);
  if (!s) return null;
  if (s.example !== undefined) return s.example;
  if (s.enum?.length) return s.enum[0];
  if (s.type === 'object' && s.properties) {
    const out = {};
    for (const [k, v] of Object.entries(s.properties)) {
      if (s.required?.includes(k) || Object.keys(s.properties).length <= 4) {
        out[k] = schemaExample(spec, v);
      }
    }
    return out;
  }
  if (s.type === 'array') return [schemaExample(spec, s.items)];
  if (s.type === 'integer' || s.type === 'number') return 0;
  if (s.type === 'boolean') return true;
  if (s.format === 'email') return 'user@example.com';
  if (s.format === 'date-time') return '2026-06-30T12:00:00.000Z';
  return 'string';
}

function escapeMd(text) {
  return String(text ?? '').replace(/\|/g, '\\|');
}

/** Escape `{param}` so MDX does not treat path segments as JSX expressions */
function escapeMdx(text) {
  return String(text ?? '').replace(/\{/g, '\\{').replace(/\}/g, '\\}');
}

function authLabel(operation) {
  if (!operation.security || operation.security.length === 0) return 'None';
  const schemes = operation.security.flatMap((s) => Object.keys(s));
  const unique = [...new Set(schemes)];
  if (unique.includes('bearerAuth')) return 'Bearer JWT';
  if (unique.includes('internalWebhook')) return 'Internal token';
  if (unique.includes('stripeWebhook')) return 'Stripe signature';
  return unique.join(', ') || 'Bearer JWT';
}

function collectParameters(spec, operation) {
  const rows = [];
  for (const p of operation.parameters || []) {
    const param = p.$ref ? resolveRef(spec, p.$ref) : p;
    if (!param) continue;
    rows.push({
      name: param.name,
      in: param.in,
      required: Boolean(param.required),
      type: param.schema?.type || param.schema?.$ref?.split('/').pop() || 'string',
      description: param.description || '',
    });
  }
  return rows;
}

function requestBodyInfo(spec, operation) {
  const content = operation.requestBody?.content;
  if (!content) return null;
  const media =
    content['application/json'] ||
    content['multipart/form-data'] ||
    Object.values(content)[0];
  if (!media?.schema) return { contentType: Object.keys(content)[0], example: null };
  const example = schemaExample(spec, media.schema);
  return { contentType: Object.keys(content)[0], example };
}

function responseRows(operation) {
  const rows = [];
  for (const [code, resp] of Object.entries(operation.responses || {})) {
    rows.push({
      code,
      description: resp.description || '',
    });
  }
  return rows.sort((a, b) => a.code.localeCompare(b.code));
}

function buildCurl(method, apiPath, body, contentType) {
  const upper = method.toUpperCase();
  const lines = [`curl -X ${upper} "http://localhost:4010${apiPath}" \\`];
  if (body && contentType?.includes('json')) {
    lines.push('  -H "Content-Type: application/json" \\');
    lines.push(`  -d '${JSON.stringify(body, null, 2).replace(/'/g, "'\\''")}'`);
  } else if (upper !== 'GET') {
    lines.push('  -H "Authorization: Bearer <token>" \\');
    lines.push('  -H "Content-Type: application/json"');
  } else {
    lines.push('  -H "Authorization: Bearer <token>"');
  }
  return lines.join('\n');
}

function buildFetch(method, apiPath, body, needsAuth) {
  const upper = method.toUpperCase();
  const headers = ['Content-Type: application/json'];
  if (needsAuth) headers.unshift('Authorization: Bearer <token>');
  const headerBlock = headers.map((h) => `    '${h}',`).join('\n');
  const bodyBlock =
    body && upper !== 'GET'
      ? `\n  body: JSON.stringify(${JSON.stringify(body, null, 4).replace(/\n/g, '\n  ')}),`
      : '';
  return `const response = await fetch('http://localhost:4010${apiPath}', {
  method: '${upper}',
  headers: {
${headerBlock}
  },${bodyBlock}
});

const data = await response.json();
if (!response.ok) throw new Error(data.message || response.statusText);
console.log(data);`;
}

function playgroundLink(apiPath, method) {
  const params = new URLSearchParams({ path: apiPath, method: method.toLowerCase() });
  return sp(`/api-playground?${params.toString()}`);
}

function generateOperationMdx(spec, apiPath, method, operation, sidebarPosition) {
  const upper = method.toUpperCase();
  const title = `${upper} ${apiPath}`;
  const tag = (operation.tags && operation.tags[0]) || 'Other';
  const params = collectParameters(spec, operation);
  const bodyInfo = requestBodyInfo(spec, operation);
  const responses = responseRows(operation);
  const needsAuth = authLabel(operation) !== 'None';
  const summary = operation.summary || title;
  const description = operation.description || '';

  const mdxTitle = escapeMdx(title);

  let md = `---
title: "${title.replace(/"/g, '\\"')}"
description: "${escapeMd(summary)}"
sidebar_position: ${sidebarPosition}
custom_edit_url: null
---

import PlaygroundLink from '@site/src/components/PlaygroundLink';

# ${mdxTitle}

${description ? `${escapeMdx(description)}\n\n` : ''}**[Try in API Playground](${playgroundLink(apiPath, method)})**

| | |
|---|---|
| **Method** | \`${upper}\` |
| **Path** | \`/api${apiPath}\` |
| **Tag** | ${tag} |
| **Auth** | ${authLabel(operation)} |

`;

  if (params.length) {
    md += `## Parameters\n\n| Name | In | Required | Type | Description |\n|------|-----|----------|------|-------------|\n`;
    for (const p of params) {
      md += `| \`${p.name}\` | ${p.in} | ${p.required ? 'Yes' : 'No'} | ${p.type} | ${escapeMdx(escapeMd(p.description))} |\n`;
    }
    md += '\n';
  }

  if (bodyInfo) {
    md += `## Request body\n\n**Content-Type:** \`${bodyInfo.contentType}\`\n\n`;
    if (bodyInfo.example) {
      md += `\`\`\`json\n${JSON.stringify(bodyInfo.example, null, 2)}\n\`\`\`\n\n`;
    }
  }

  if (responses.length) {
    md += `## Responses\n\n| Status | Description |\n|--------|-------------|\n`;
    for (const r of responses) {
      md += `| ${r.code} | ${escapeMdx(escapeMd(r.description))} |\n`;
    }
    md += '\n';
  }

  const curl = buildCurl(method, apiPath, bodyInfo?.example, bodyInfo?.contentType);
  const fetchCode = buildFetch(method, apiPath, bodyInfo?.example, needsAuth);

  md += `## Code examples\n\n### cURL\n\n\`\`\`bash\n${curl}\n\`\`\`\n\n### JavaScript (fetch)\n\n\`\`\`javascript\n${fetchCode}\n\`\`\`\n\n`;
  md += `<PlaygroundLink path="${apiPath}" method="${method}" />\n\n`;
  md += `## Related\n\n- [API overview](${sp('/developer/api-reference')})\n- [Authentication](${sp('/developer/authentication')})\n- [Error handling](${sp('/developer/error-handling')})\n`;

  return md;
}

function writeTagCategory(tag, position) {
  const dir = path.join(OUT_ROOT, tagSlug(tag));
  fs.mkdirSync(dir, { recursive: true });
  const tagMeta = (spec.tags || []).find((t) => t.name === tag);
  fs.writeFileSync(
    path.join(dir, '_category_.json'),
    JSON.stringify(
      {
        label: tag,
        position,
        collapsed: true,
        link: {
          type: 'generated-index',
          slug: `/developer/api-reference/${tagSlug(tag)}`,
          title: tag,
          description: tagMeta?.description || `${tag} endpoints`,
        },
      },
      null,
      2
    ) + '\n'
  );
}

function cleanDir(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) cleanDir(full);
    else if (entry.name.endsWith('.mdx') || entry.name === '_category_.json') fs.unlinkSync(full);
    if (entry.isDirectory()) {
      try {
        fs.rmdirSync(full);
      } catch {
        /* not empty */
      }
    }
  }
}

if (!fs.existsSync(SPEC_PATH)) {
  console.error(`OpenAPI spec not found: ${SPEC_PATH}. Run npm run sync:openapi first.`);
  process.exit(1);
}

const spec = yaml.parse(fs.readFileSync(SPEC_PATH, 'utf8'));
cleanDir(OUT_ROOT);
fs.mkdirSync(OUT_ROOT, { recursive: true });

const byTag = {};
let total = 0;

for (const [apiPath, pathItem] of Object.entries(spec.paths || {})) {
  for (const method of METHODS) {
    const operation = pathItem[method];
    if (!operation) continue;
    const tag = (operation.tags && operation.tags[0]) || 'Other';
    if (!byTag[tag]) byTag[tag] = [];
    byTag[tag].push({ apiPath, method, operation });
    total++;
  }
}

const tagPositions = {};
TAG_ORDER.forEach((t, i) => {
  tagPositions[t] = i + 1;
});

let otherPos = TAG_ORDER.length + 1;
for (const tag of Object.keys(byTag)) {
  if (tagPositions[tag] === undefined) tagPositions[tag] = otherPos++;
}

fs.writeFileSync(
  path.join(OUT_ROOT, '_category_.json'),
  JSON.stringify(
    {
      label: 'API Reference',
      position: 2,
      collapsed: false,
    },
    null,
    2
  ) + '\n'
);

const indexMd = `---
title: API Reference
description: Complete {{brandName}} REST API — all endpoints with examples and interactive playground.
sidebar_position: 1
---

# API Reference

Complete reference for the **{{brandName}} IDP REST API** (${total} operations). All paths are relative to \`/api\`.

## Quick links

| Resource | URL |
|----------|-----|
| **Interactive playground** | [${sp('/api-playground')}](${sp('/api-playground')}) |
| OpenAPI spec (YAML) | [\`/openapi.yaml\`](${sp('/openapi.yaml')}) |
| Backend Swagger UI | \`http://localhost:5005/api/docs\` (non-production) |

## Authentication

Most endpoints require \`Authorization: Bearer <token>\` from [POST /users/login](${sp('/developer/api-reference/auth/post-users-login')}).

Workspace-scoped routes often need header \`X-Group-Id\` with your active group ObjectId.

See [Authentication](${sp('/developer/authentication')}) for the full flow.

## Servers

| Environment | Base URL |
|-------------|----------|
| Mock (Prism, default in docs) | \`http://localhost:4010\` |
| Local sandbox | \`http://localhost:5005/api\` |

Set \`DOCUSAURUS_API_MODE=sandbox\` to point the playground at your local backend.

## Operations by tag

${TAG_ORDER.filter((t) => byTag[t]?.length)
  .map((t) => `- **[${t}](${sp(`/developer/api-reference/${tagSlug(t)}`)})** — ${byTag[t].length} endpoints`)
  .join('\n')}

## Rate limiting

\`100\` requests per \`15\` minutes per IP on \`/api/*\` (sandbox).

## Related

- [Developer setup](${sp('/developer/setup')})
- [Error handling](${sp('/developer/error-handling')})
`;

fs.writeFileSync(path.join(OUT_ROOT, 'index.md'), indexMd);

for (const [tag, ops] of Object.entries(byTag)) {
  writeTagCategory(tag, tagPositions[tag] || 99);
  const dir = path.join(OUT_ROOT, tagSlug(tag));
  ops.sort((a, b) => a.apiPath.localeCompare(b.apiPath) || a.method.localeCompare(b.method));
  ops.forEach((op, idx) => {
    const file = path.join(dir, `${opSlug(op.method, op.apiPath)}.mdx`);
    const content = generateOperationMdx(spec, op.apiPath, op.method, op.operation, idx + 2);
    fs.writeFileSync(file, content);
  });
}

console.log(`Generated ${total} API reference pages in ${OUT_ROOT}`);
console.log(`Tags: ${Object.keys(byTag).length}`);
