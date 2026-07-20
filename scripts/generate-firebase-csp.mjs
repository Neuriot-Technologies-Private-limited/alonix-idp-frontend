#!/usr/bin/env node
/**
 * Generates (and optionally patches) the CSP `connect-src` allowlist used by
 * firebase.json's hosting headers.
 *
 * Context (F-005): firebase.json ships with a baseline `connect-src` that only
 * allows 'self', Sentry ingest, Stripe, and wss:. It intentionally does NOT
 * hardcode the production API/socket host, because that host can differ per
 * environment/deploy. This script derives that host from VITE_API_BASE_URL /
 * VITE_SOCKET_URL (env, CI secrets, or brands/1glance/brand.env) and either
 * prints the resulting connect-src value or patches firebase.json in place.
 *
 * Local dev is unaffected: with no VITE_API_BASE_URL / VITE_SOCKET_URL set,
 * the script's output is identical to firebase.json's committed baseline
 * (dev uses the same-origin Vite proxy, i.e. 'self', so nothing extra is
 * needed).
 *
 * Usage:
 *   node scripts/generate-firebase-csp.mjs                     # print connect-src value only
 *   node scripts/generate-firebase-csp.mjs --patch              # patch firebase.json in place
 *   node scripts/generate-firebase-csp.mjs --patch \
 *     --brand-env brands/1glance/brand.env \
 *     --firebase-json firebase.json
 *
 * Env vars (all optional; process.env wins over --brand-env values):
 *   VITE_API_BASE_URL       e.g. https://api.example.com/api
 *   VITE_SOCKET_URL         e.g. https://api.example.com (or wss://api.example.com)
 *   VITE_CSP_CONNECT_EXTRA  extra hosts, space/comma-separated,
 *                           e.g. "https://cdn.example.com https://metrics.example.com"
 *
 * localhost / 127.0.0.1 / 0.0.0.0 hosts are ignored (dev-only, never needed in CSP).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// Keep in sync with firebase.json's committed connect-src baseline.
const BASE_CONNECT_SRC = [
  "'self'",
  'https://*.ingest.sentry.io',
  'https://api.stripe.com',
  'https://checkout.stripe.com',
  'wss:',
];

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1']);

function parseArgs(argv) {
  const args = {
    patch: false,
    brandEnv: 'brands/1glance/brand.env',
    firebaseJson: 'firebase.json',
    help: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--patch') args.patch = true;
    else if (arg === '--brand-env') args.brandEnv = argv[++i];
    else if (arg === '--firebase-json') args.firebaseJson = argv[++i];
    else if (arg === '--help' || arg === '-h') args.help = true;
    else {
      process.stderr.write(`Unknown argument: ${arg}\n`);
      process.exitCode = 1;
    }
  }
  return args;
}

function parseDotEnv(filePath) {
  const out = {};
  if (!filePath || !fs.existsSync(filePath)) return out;
  const raw = fs.readFileSync(filePath, 'utf8');
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    value = value.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
    out[key] = value;
  }
  return out;
}

/** Returns "scheme://host[:port]" for a URL/host string, or null (bare host assumed https). */
function originOf(rawUrl) {
  if (!rawUrl) return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;
  try {
    const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const url = new URL(withScheme);
    if (LOCAL_HOSTS.has(url.hostname)) return null;
    return `${url.protocol}//${url.host}`;
  } catch {
    return null;
  }
}

/** Socket hosts need both the http(s) origin (polling/handshake) and the ws(s) origin. */
function socketOrigins(rawUrl) {
  const httpOrigin = originOf(rawUrl);
  if (!httpOrigin) return [];
  const wsOrigin = httpOrigin.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:');
  return [httpOrigin, wsOrigin];
}

function extraHosts(raw) {
  if (!raw) return [];
  return raw
    .split(/[\s,]+/)
    .map((host) => host.trim())
    .filter(Boolean);
}

function buildConnectSrc(env) {
  const hosts = new Set(BASE_CONNECT_SRC);
  const apiOrigin = originOf(env.VITE_API_BASE_URL);
  if (apiOrigin) hosts.add(apiOrigin);
  for (const host of socketOrigins(env.VITE_SOCKET_URL)) hosts.add(host);
  for (const host of extraHosts(env.VITE_CSP_CONNECT_EXTRA)) hosts.add(host);
  return Array.from(hosts).join(' ');
}

/**
 * Patches connect-src in place via a targeted text substitution rather than a
 * JSON.parse/stringify round-trip, so the rest of firebase.json's formatting
 * (indentation, single-line entries, key order) is left byte-for-byte intact.
 */
function patchFirebaseJson(firebaseJsonPath, connectSrc) {
  const raw = fs.readFileSync(firebaseJsonPath, 'utf8');

  // Validate structurally first so we fail fast on a malformed file, even
  // though the actual edit below operates on the raw text.
  const config = JSON.parse(raw);
  const hasCspHeader = (config?.hosting?.headers ?? []).some((group) =>
    (group.headers ?? []).some((header) => header.key === 'Content-Security-Policy')
  );
  if (!hasCspHeader) {
    throw new Error(`No "Content-Security-Policy" header found in ${firebaseJsonPath}`);
  }

  const cspEntryRegex = /("key":\s*"Content-Security-Policy",\s*"value":\s*")([^"]*)(")/;
  const match = raw.match(cspEntryRegex);
  if (!match) {
    throw new Error(`Could not locate a Content-Security-Policy "value" string in ${firebaseJsonPath}`);
  }
  if (!/connect-src/.test(match[2])) {
    throw new Error(`Content-Security-Policy value in ${firebaseJsonPath} has no connect-src directive`);
  }

  const patchedValue = match[2].replace(/connect-src[^;]*/, `connect-src ${connectSrc}`);
  const patched = raw.replace(cspEntryRegex, `$1${patchedValue}$3`);

  fs.writeFileSync(firebaseJsonPath, patched);
}

function printUsage() {
  console.log(`Usage: node scripts/generate-firebase-csp.mjs [options]

Options:
  --patch                    Patch firebase.json's connect-src in place (default: print only)
  --brand-env <path>         Path to a brand.env file to read defaults from
                             (default: brands/1glance/brand.env)
  --firebase-json <path>     Path to firebase.json to patch (default: firebase.json)
  -h, --help                 Show this help

Env vars: VITE_API_BASE_URL, VITE_SOCKET_URL, VITE_CSP_CONNECT_EXTRA`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printUsage();
    return;
  }

  const brandEnvPath = path.isAbsolute(args.brandEnv) ? args.brandEnv : path.join(ROOT, args.brandEnv);
  const brandEnv = parseDotEnv(brandEnvPath);

  // process.env (CI secrets, shell exports) always takes precedence over brand.env.
  const env = { ...brandEnv, ...process.env };

  const connectSrc = buildConnectSrc(env);

  if (args.patch) {
    const firebaseJsonPath = path.isAbsolute(args.firebaseJson)
      ? args.firebaseJson
      : path.join(ROOT, args.firebaseJson);
    patchFirebaseJson(firebaseJsonPath, connectSrc);
    console.log(`Patched ${path.relative(ROOT, firebaseJsonPath)}`);
    console.log(`  connect-src ${connectSrc}`);
  } else {
    console.log(connectSrc);
  }
}

main();
