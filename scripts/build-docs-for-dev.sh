#!/usr/bin/env bash
# Build Help Center for /docs/ subpath (served by Vite — no webpack dev proxy).
# Required on Lightning / any host where the app is at :5173 and docs at /docs/.
set -euo pipefail

# Lightning / conda Node: npm_config_prefix breaks nvm and makes nested `npm` fail
# ("nvm is not compatible with npm_config_prefix" → "npm: command not found").
unset npm_config_prefix 2>/dev/null || true
unset NPM_CONFIG_PREFIX 2>/dev/null || true

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/alonix-docs"

if ! command -v npm >/dev/null 2>&1; then
  echo "ERROR: npm not found on PATH after unsetting npm_config_prefix."
  echo "       On Lightning try: unset npm_config_prefix && nvm use 22"
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "==> Installing alonix-docs dependencies..."
  npm ci
fi

BRAND="${DOCUSAURUS_BRAND:-1glance}"
# Lightning Studio example:
#   DOCUSAURUS_SITE_URL=https://5173-<studio-id>.cloudspaces.litng.ai
SITE_URL="${DOCUSAURUS_SITE_URL:-${PUBLIC_APP_URL:-http://localhost:5173}}"

if [[ "${SITE_URL}" == *"localhost"* ]] && [[ -n "${LIGHTNING_CLOUD_URL:-}" || -n "${LIGHTNING_JOB_ID:-}" ]]; then
  echo "WARN: SITE_URL is still localhost but Lightning env is present."
  echo "      Set DOCUSAURUS_SITE_URL to your public 5173 URL, e.g.:"
  echo "      DOCUSAURUS_SITE_URL=https://5173-xxxx.cloudspaces.litng.ai npm run build:docs:dev"
fi

echo "==> Building docs (brand=${BRAND}, baseUrl=/docs/, siteUrl=${SITE_URL})..."
DOCUSAURUS_BRAND="${BRAND}" \
DOCUSAURUS_BASE_URL=/docs/ \
DOCUSAURUS_SITE_URL="${SITE_URL}" \
DOCUSAURUS_API_MODE="${DOCUSAURUS_API_MODE:-mock}" \
npm run build:1glance

# Fail fast if the build accidentally used baseUrl=/
if ! grep -qE '["'"'"']/docs/assets/' build/index.html 2>/dev/null; then
  echo "ERROR: alonix-docs/build was not produced with baseUrl=/docs/"
  echo "       Asset hrefs must start with /docs/assets/ for Lightning/Vite /docs/ serving."
  echo "       Re-run with DOCUSAURUS_BASE_URL=/docs/ (this script already sets it)."
  exit 1
fi

echo "==> Docs ready at alonix-docs/build/ (baseUrl=/docs/)"
echo "    Start Vite with: VITE_DOCS_MODE=static npm run dev"
echo "    Or one-shot:     DOCUSAURUS_SITE_URL=${SITE_URL} npm run dev:with-docs"
