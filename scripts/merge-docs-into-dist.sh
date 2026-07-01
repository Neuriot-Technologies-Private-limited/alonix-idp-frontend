#!/usr/bin/env bash
# Merge a Docusaurus build (baseUrl /docs/) into the Vite app dist for Firebase Hosting.
set -euo pipefail

DOCS_BUILD="${1:?Usage: merge-docs-into-dist.sh <docs-build-dir> [dist-dir]}"
DIST_DIR="${2:-dist}"

if [ ! -f "${DOCS_BUILD}/index.html" ]; then
  echo "Docs build not found at ${DOCS_BUILD}/index.html"
  exit 1
fi

mkdir -p "${DIST_DIR}/docs"
echo "Merging docs build into ${DIST_DIR}/docs/ ..."
rsync -a --delete "${DOCS_BUILD}/" "${DIST_DIR}/docs/"
echo "Docs merged. Sample paths:"
ls -la "${DIST_DIR}/docs/index.html" "${DIST_DIR}/docs/assets" 2>/dev/null | head -5 || true
