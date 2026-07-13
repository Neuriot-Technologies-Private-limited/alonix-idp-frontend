#!/usr/bin/env bash
# Build Help Center for /docs/ subpath (served by Vite — no webpack dev proxy).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/alonix-docs"

if [ ! -d node_modules ]; then
  echo "==> Installing alonix-docs dependencies..."
  npm ci
fi

BRAND="${DOCUSAURUS_BRAND:-1glance}"
SITE_URL="${DOCUSAURUS_SITE_URL:-${PUBLIC_APP_URL:-http://localhost:5173}}"

echo "==> Building docs (brand=${BRAND}, baseUrl=/docs/, siteUrl=${SITE_URL})..."
DOCUSAURUS_BRAND="${BRAND}" \
DOCUSAURUS_BASE_URL=/docs/ \
DOCUSAURUS_SITE_URL="${SITE_URL}" \
DOCUSAURUS_API_MODE="${DOCUSAURUS_API_MODE:-mock}" \
npm run build:1glance

echo "==> Docs ready at alonix-docs/build/ — start Vite with VITE_DOCS_MODE=static"
