#!/usr/bin/env node
'use strict';

/**
 * Start Prism mock server from static/openapi.yaml.
 * Default port: 4010 (override with MOCK_PORT env var).
 */

const {spawn} = require('child_process');
const path = require('path');

const port = process.env.MOCK_PORT || '4010';
const specPath = path.resolve(__dirname, '..', 'static', 'openapi.yaml');

const prism = path.resolve(
  __dirname,
  '..',
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'prism.cmd' : 'prism'
);

console.log(`Starting Prism mock server on http://localhost:${port}`);
console.log(`OpenAPI spec: ${specPath}`);

const child = spawn(
  prism,
  ['mock', specPath, '-p', port, '--host', '0.0.0.0', '--cors'],
  {stdio: 'inherit', env: process.env}
);

child.on('exit', (code) => process.exit(code ?? 0));

process.on('SIGINT', () => child.kill('SIGINT'));
process.on('SIGTERM', () => child.kill('SIGTERM'));
