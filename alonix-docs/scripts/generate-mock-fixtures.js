#!/usr/bin/env node
'use strict';

/**
 * Pre-compute mock response bodies from static/openapi.yaml for the browser playground.
 * Avoids requiring Prism (localhost:4010) on deployed static hosting.
 */
const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

const specPath = path.resolve(__dirname, '..', 'static', 'openapi.yaml');
const outPath = path.resolve(__dirname, '..', 'static', 'playground', 'mock-fixtures.json');

function resolveRef(spec, ref) {
  if (!ref || typeof ref !== 'string' || !ref.startsWith('#/')) return null;
  return ref
    .slice(2)
    .split('/')
    .reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : null), spec);
}

function resolveNode(spec, node, depth = 0) {
  if (!node || depth > 12) return undefined;
  if (node.$ref) return resolveNode(spec, resolveRef(spec, node.$ref), depth + 1);
  if (node.example !== undefined) return node.example;
  if (node.value !== undefined) return node.value;
  if (node.examples) {
    const first = Object.values(node.examples)[0];
    return resolveNode(spec, first, depth + 1);
  }
  if (node.content?.['application/json']) {
    return resolveNode(spec, node.content['application/json'], depth + 1);
  }
  if (node.schema) {
    return resolveNode(spec, node.schema, depth + 1);
  }
  if (node.type === 'object' && node.properties) {
    const out = {};
    for (const [key, prop] of Object.entries(node.properties)) {
      const val = resolveNode(spec, prop, depth + 1);
      if (val !== undefined) out[key] = val;
    }
    return Object.keys(out).length ? out : undefined;
  }
  if (node.type === 'array' && node.items) {
    const item = resolveNode(spec, node.items, depth + 1);
    return item !== undefined ? [item] : [];
  }
  if (node.type === 'string') return node.default ?? 'mock-string';
  if (node.type === 'integer' || node.type === 'number') return node.default ?? 0;
  if (node.type === 'boolean') return node.default ?? true;
  return undefined;
}

function pickResponse(spec, responses) {
  if (!responses) return {status: 200, body: {message: 'OK'}};
  const order = ['200', '201', '204', '202', 'default'];
  for (const code of order) {
    const res = responses[code];
    if (!res) continue;
    const resolved = res.$ref ? resolveRef(spec, res.$ref) : res;
    const body = resolveNode(spec, resolved);
    const status = code === 'default' ? 200 : Number(code);
    if (body !== undefined) return {status, body};
    if (status === 204) return {status: 204, body: null};
    return {status, body: {message: resolved?.description || 'OK'}};
  }
  return {status: 200, body: {message: 'OK'}};
}

function main() {
  const spec = yaml.parse(fs.readFileSync(specPath, 'utf8'));
  const routes = [];

  for (const [openApiPath, pathItem] of Object.entries(spec.paths || {})) {
    for (const method of ['get', 'post', 'put', 'patch', 'delete', 'head', 'options']) {
      const operation = pathItem[method];
      if (!operation) continue;
      const {status, body} = pickResponse(spec, operation.responses);
      routes.push({
        method,
        path: openApiPath,
        status,
        body,
      });
    }
  }

  fs.mkdirSync(path.dirname(outPath), {recursive: true});
  fs.writeFileSync(
    outPath,
    JSON.stringify({generatedAt: new Date().toISOString(), routes}, null, 2) + '\n'
  );
  console.log(`Wrote ${routes.length} mock routes → ${path.relative(process.cwd(), outPath)}`);
}

main();
