#!/usr/bin/env node
/**
 * Copy committed 1-Glance assets from ../public/brand into docs static + generated theme.
 */
const fs = require('fs');
const path = require('path');
const {syncBrandAssets, buildThemeCss, toBrandConfig} = require('./brand-env');

const DOCS_ROOT = path.resolve(__dirname, '..');
const BRAND_STATIC = path.join(DOCS_ROOT, 'static', 'brand');
const GENERATED_JSON = path.join(DOCS_ROOT, '.brand.generated.json');
const THEME_CSS = path.join(DOCS_ROOT, 'src', 'css', 'brand-theme.generated.css');

function main() {
  syncBrandAssets(BRAND_STATIC);
  const brand = toBrandConfig(BRAND_STATIC);

  fs.writeFileSync(GENERATED_JSON, `${JSON.stringify(brand, null, 2)}\n`);
  fs.writeFileSync(THEME_CSS, buildThemeCss(brand));

  console.log(`Synced product "${brand.name}"`);
  console.log(`  logo:    ${brand.logoPath}`);
  console.log(`  favicon: ${brand.faviconPath}`);
}

main();
