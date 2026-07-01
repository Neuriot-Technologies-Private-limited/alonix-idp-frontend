#!/usr/bin/env node
/**
 * Sync active brand from ../brands/<slug>/ into docs static assets + generated config.
 * Set DOCUSAURUS_BRAND=findoutai (default) to match vite --mode findoutai.
 */
const fs = require('fs');
const path = require('path');
const {
  resolveBrandSlug,
  loadBrandEnv,
  syncBrandAssets,
  buildThemeCss,
  toBrandConfig,
  applyBrandTokens,
} = require('./brand-env');

const DOCS_ROOT = path.resolve(__dirname, '..');
const BRAND_STATIC = path.join(DOCS_ROOT, 'static', 'brand');
const GENERATED_JSON = path.join(DOCS_ROOT, '.brand.generated.json');
const THEME_CSS = path.join(DOCS_ROOT, 'src', 'css', 'brand-theme.generated.css');

function main() {
  const slug = resolveBrandSlug();
  const env = loadBrandEnv(slug);

  syncBrandAssets(slug, BRAND_STATIC);
  const brand = toBrandConfig(slug, env, BRAND_STATIC);

  fs.writeFileSync(GENERATED_JSON, `${JSON.stringify(brand, null, 2)}\n`);
  fs.writeFileSync(THEME_CSS, buildThemeCss(brand));

  console.log(`Synced brand "${brand.name}" (${slug})`);
  console.log(`  logo:    ${brand.logoPath}`);
  console.log(`  favicon: ${brand.faviconPath}`);
}

main();
