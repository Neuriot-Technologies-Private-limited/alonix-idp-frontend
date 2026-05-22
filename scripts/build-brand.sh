#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# build-brand.sh — Build a specific brand's production bundle
#
# Usage:
#   ./scripts/build-brand.sh 1glance
#   ./scripts/build-brand.sh clientx
#
# Output:
#   dist/  — standard Vite output, branded for <brand>
# ─────────────────────────────────────────────────────────────

set -euo pipefail

BRAND="${1:-}"

if [[ -z "$BRAND" ]]; then
  echo "❌  Usage: ./scripts/build-brand.sh <brand>"
  echo "   Example: ./scripts/build-brand.sh 1glance"
  exit 1
fi

BRAND_DIR="brands/$BRAND"

if [[ ! -d "$BRAND_DIR" ]]; then
  echo "❌  Brand directory not found: $BRAND_DIR"
  echo "   Available brands:"
  ls -1 brands/ | grep -v README.md | sed 's/^/   - /'
  exit 1
fi

echo "🏷️   Building brand: $BRAND"
echo "📁  Brand dir: $BRAND_DIR"
echo ""

# TypeScript check + Vite build with brand mode
npx tsc -b && npx vite build --mode "$BRAND"

echo ""
echo "✅  Build complete for brand: $BRAND"
echo "📦  Output: dist/"
