#!/usr/bin/env bash
# Local parity with CI: Vite app + Help Center at dist/docs/
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ ! -f alonix-docs/package.json ]; then
  echo "Missing alonix-docs/ — ensure Help Center is committed under alonix-idp-frontend/alonix-docs/"
  exit 1
fi

if [ -z "${VITE_API_BASE_URL:-}" ] && [ ! -f .env.production ]; then
  echo "Set VITE_API_BASE_URL or create .env.production before building."
  exit 1
fi

BRAND="${VITE_BRAND_MODE:-1glance}"

echo "==> Building React app (${BRAND})..."
npm run "build:${BRAND}"

echo "==> Building docs (/docs subpath)..."
(
  cd alonix-docs
  npm ci
  DOCUSAURUS_BRAND="${DOCUSAURUS_BRAND:-${BRAND}}" \
  DOCUSAURUS_BASE_URL=/docs/ \
  DOCUSAURUS_SITE_URL="${PUBLIC_APP_URL:-http://localhost:3000}" \
  DOCUSAURUS_API_MODE=mock \
  npm run build:ci
)

echo "==> Merging docs into dist/docs/..."
chmod +x scripts/merge-docs-into-dist.sh
./scripts/merge-docs-into-dist.sh alonix-docs/build dist

echo "Done. Preview with: npx firebase-tools serve --only hosting (or npx serve dist)"
echo "  App:  dist/index.html"
echo "  Docs: dist/docs/index.html"
