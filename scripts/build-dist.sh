#!/usr/bin/env bash
# Build the production static bundle: Vite app + Help Center at dist/docs/.
# Same-origin AWS: leave VITE_API_BASE_URL unset so the SPA calls /api on nginx.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ ! -f alonix-docs/package.json ]; then
  echo "Missing alonix-docs/ — Help Center must be in this repo."
  exit 1
fi

echo "==> Building React app (same-origin /api)..."
npm run build

SITE_URL="${PUBLIC_APP_URL:-http://localhost}"
echo "==> Building docs (/docs subpath, siteUrl=${SITE_URL})..."
(
  cd alonix-docs
  if [ ! -d node_modules ]; then
    npm ci
  fi
  DOCUSAURUS_BASE_URL=/docs/ \
  DOCUSAURUS_SITE_URL="${SITE_URL}" \
  DOCUSAURUS_API_MODE=mock \
  npm run build:ci
)

echo "==> Merging docs into dist/docs/..."
chmod +x scripts/merge-docs-into-dist.sh
./scripts/merge-docs-into-dist.sh alonix-docs/build dist

echo "Done. dist/ is what nginx on AWS should serve."
echo "  App:  dist/index.html"
echo "  Docs: dist/docs/index.html"
echo "Preview: npx serve dist"
