#!/usr/bin/env bash
# Normalize Firebase Hosting site id / public app URL for docs + deploy.
# Usage:
#   source scripts/resolve-firebase-site-url.sh
#   SITE_ID="$(normalize_firebase_site_id "$FIREBASE_HOSTING_SITE")"
#   SITE_URL="$(resolve_public_site_url "$PUBLIC_APP_URL" "$FIREBASE_HOSTING_SITE")"

normalize_firebase_site_id() {
  local raw="${1:-}"
  raw="$(printf '%s' "$raw" | tr -d '[:space:]')"
  raw="${raw#https://}"
  raw="${raw#http://}"
  # Drop any path (handles trailing slash or accidental "/.web.app")
  raw="${raw%%/*}"
  raw="${raw%.web.app}"
  raw="${raw%.firebaseapp.com}"
  raw="${raw%.}"
  printf '%s' "$raw"
}

# Origin only — Docusaurus `url` must not include a path (use baseUrl for /docs/).
normalize_site_origin() {
  local raw="${1:-}"
  raw="$(printf '%s' "$raw" | tr -d '[:space:]')"
  if [ -z "$raw" ]; then
    return 1
  fi
  case "$raw" in
    http://*|https://*) ;;
    //*) raw="https:${raw}" ;;
    *) raw="https://${raw}" ;;
  esac
  # Strip path/query/hash → origin
  local origin
  origin="$(node -e 'const u=new URL(process.argv[1]); process.stdout.write(u.origin)' "$raw")"
  printf '%s' "$origin"
}

resolve_public_site_url() {
  local public_app_url="${1:-}"
  local firebase_site="${2:-}"

  if [ -n "${public_app_url}" ]; then
    normalize_site_origin "$public_app_url"
    return
  fi

  if [ -n "${firebase_site}" ]; then
    local site_id
    site_id="$(normalize_firebase_site_id "$firebase_site")"
    if [ -z "$site_id" ]; then
      echo "FIREBASE_HOSTING_SITE resolved to empty site id" >&2
      return 1
    fi
    printf 'https://%s.web.app' "$site_id"
    return
  fi

  echo "Set PUBLIC_APP_URL or FIREBASE_HOSTING_SITE" >&2
  return 1
}
