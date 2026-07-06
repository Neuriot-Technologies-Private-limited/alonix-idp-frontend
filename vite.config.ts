import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

const ROOT = __dirname;
const PUBLIC_BRAND_DIR = path.resolve(ROOT, 'public', 'brand');
const THEME_DEST = path.resolve(ROOT, 'src', 'brand', 'theme.css');
const BASELINE_ASSETS = path.resolve(ROOT, 'brands', '1glance', 'assets');
const BASELINE_THEME = path.resolve(ROOT, 'brands', '1glance', 'theme.css');

export type BrandFavicon = { url: string; mimeType: string };

function copyAssets(src: string, dest: string) {
  fs.mkdirSync(dest, { recursive: true });
  for (const file of fs.readdirSync(src)) {
    if (file === '.DS_Store') continue;
    fs.copyFileSync(path.join(src, file), path.join(dest, file));
  }
}

/** Drop baseline favicon.* when the active brand ships its own favicon file(s). */
function pruneStaleBrandFavicons(publicBrandDir: string, brandAssetsDir: string) {
  const brandFavicons = fs
    .readdirSync(brandAssetsDir)
    .filter((f) => f.startsWith('favicon.'));
  if (brandFavicons.length === 0) return;

  for (const file of fs.readdirSync(publicBrandDir)) {
    if (file.startsWith('favicon.') && !brandFavicons.includes(file)) {
      fs.unlinkSync(path.join(publicBrandDir, file));
    }
  }
}

const FAVICON_EXT_PRIORITY = ['.png', '.ico', '.webp', '.svg'];

function pickFaviconFile(files: string[]): string | undefined {
  for (const ext of FAVICON_EXT_PRIORITY) {
    const match = files.find((f) => f.startsWith('favicon.') && f.endsWith(ext));
    if (match) return match;
  }
  return files.find((f) => f.startsWith('favicon.'));
}

/** Copy brand assets + theme into public/ and src/ for the active Vite mode. */
export function syncBrandAssets(mode: string): void {
  const brandDir = path.resolve(ROOT, 'brands', mode);
  const assetsDir = path.join(brandDir, 'assets');
  const themeSrc = path.join(brandDir, 'theme.css');

  if (fs.existsSync(PUBLIC_BRAND_DIR)) {
    fs.rmSync(PUBLIC_BRAND_DIR, { recursive: true, force: true });
  }

  if (fs.existsSync(BASELINE_ASSETS)) {
    copyAssets(BASELINE_ASSETS, PUBLIC_BRAND_DIR);
  }

  if (mode !== '1glance' && fs.existsSync(assetsDir)) {
    copyAssets(assetsDir, PUBLIC_BRAND_DIR);
    pruneStaleBrandFavicons(PUBLIC_BRAND_DIR, assetsDir);
  }

  if (fs.existsSync(BASELINE_THEME)) {
    fs.mkdirSync(path.dirname(THEME_DEST), { recursive: true });
    fs.copyFileSync(BASELINE_THEME, THEME_DEST);
  }

  if (mode !== '1glance' && fs.existsSync(themeSrc)) {
    fs.mkdirSync(path.dirname(THEME_DEST), { recursive: true });
    fs.copyFileSync(themeSrc, THEME_DEST);
  }
}

function faviconMimeType(filename: string): string {
  const ext = path.extname(filename).slice(1).toLowerCase();
  if (ext === 'svg') return 'image/svg+xml';
  if (ext === 'ico') return 'image/x-icon';
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  return 'image/png';
}

/**
 * Resolve favicon from brand.env (VITE_BRAND_FAVICON_URL) when the file exists
 * in public/brand/, otherwise first favicon.* in that folder.
 */
export function resolveBrandFavicon(
  brandEnv: Record<string, string>,
  publicBrandDir = PUBLIC_BRAND_DIR
): BrandFavicon {
  const configured = brandEnv.VITE_BRAND_FAVICON_URL?.trim();
  if (configured && fs.existsSync(publicBrandDir)) {
    const name = path.basename(configured.replace(/^\/brand\//, ''));
    if (fs.existsSync(path.join(publicBrandDir, name))) {
      return { url: `/brand/${name}`, mimeType: faviconMimeType(name) };
    }
  }

  if (fs.existsSync(publicBrandDir)) {
    const candidates = fs.readdirSync(publicBrandDir).filter((f) => f.startsWith('favicon.'));
    const found = pickFaviconFile(candidates);
    if (found) {
      return { url: `/brand/${found}`, mimeType: faviconMimeType(found) };
    }
  }

  return { url: '/brand/favicon.svg', mimeType: 'image/svg+xml' };
}

function brandPlugin(mode: string, brandEnvRaw: Record<string, string>): Plugin {
  return {
    name: 'vite-plugin-brand',
    buildStart() {
      syncBrandAssets(mode);
    },
    configureServer() {
      syncBrandAssets(mode);
    },
    transformIndexHtml(html) {
      const fav = resolveBrandFavicon(brandEnvRaw);
      const brandName = brandEnvRaw.VITE_BRAND_NAME || '1-Glance';
      return html
        .replace(/%BRAND_FAVICON_URL%/g, fav.url)
        .replace(/%BRAND_FAVICON_TYPE%/g, fav.mimeType)
        .replace(/%VITE_BRAND_NAME%/g, brandName);
    },
  };
}

function parseEnvFile(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) return {};

  const raw = fs.readFileSync(filePath, 'utf-8');
  const result: Record<string, string> = {};

  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    result[key] = value;
  }

  return result;
}

/**
 * Load brand.env for the given mode and merge into the Vite env.
 * Standard Vite .env files (`.env`, `.env.<mode>`) still apply as normal.
 */
function loadBrandEnv(mode: string, root: string): Record<string, string> {
  return parseEnvFile(path.join(root, 'brands', mode, 'brand.env'));
}

/**
 * Load profiles/<profile>.env (saas | enterprise).
 * Merged after brand.env; npm scripts set VITE_DEPLOYMENT_PROFILE before Vite starts.
 */
export function loadProfileEnv(profile: string, root: string): Record<string, string> {
  const normalized = profile === 'enterprise' ? 'enterprise' : 'saas';
  return parseEnvFile(path.join(root, 'profiles', `${normalized}.env`));
}

// https://vite.dev/config/
/// <reference types="vitest/config" />
export default defineConfig(({ mode }) => {
  const root = process.cwd();
  const env = loadEnv(mode, root, '');
  const brandEnv = loadBrandEnv(mode, root);

  const deploymentProfile =
    process.env.VITE_DEPLOYMENT_PROFILE?.trim() ||
    env.VITE_DEPLOYMENT_PROFILE?.trim() ||
    'saas';
  const profileEnv = loadProfileEnv(deploymentProfile, root);
  const profileEnvResolved: Record<string, string> = {
    ...profileEnv,
    VITE_DEPLOYMENT_PROFILE: profileEnv.VITE_DEPLOYMENT_PROFILE || deploymentProfile,
  };

  syncBrandAssets(mode);
  const favicon = resolveBrandFavicon(brandEnv);
  const brandEnvResolved = { ...brandEnv, VITE_BRAND_FAVICON_URL: favicon.url };
  const buildEnvResolved: Record<string, string> = {
    ...brandEnvResolved,
    ...profileEnvResolved,
  };

  const mergedEnv: Record<string, string> = { ...env, ...buildEnvResolved };
  const proxyTarget =
    mergedEnv.VITE_DEV_PROXY_TARGET || mergedEnv.VITE_API_BASE_URL || 'http://localhost:5005';

  return {
    plugins: [react(), brandPlugin(mode, brandEnv)],
    define: {
      ...Object.fromEntries(
        Object.entries(buildEnvResolved)
          .filter(([k]) => k.startsWith('VITE_'))
          .map(([k, v]) => [`import.meta.env.${k}`, JSON.stringify(v)])
      ),
    },
    server: {
      allowedHosts: ['localhost', '127.0.0.1', '.localhost', '.litng.ai', '.cloudspaces.litng.ai'],
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          headers: { 'ngrok-skip-browser-warning': 'true' },
        },
        '/socket.io': {
          target: proxyTarget,
          changeOrigin: true,
          ws: true,
          headers: { 'ngrok-skip-browser-warning': 'true' },
        },
        // Help Center (alonix-docs) — run with DOCUSAURUS_BASE_URL=/docs/ on port 3000
        '/docs': {
          target: process.env.VITE_DOCS_DEV_URL || 'http://localhost:3000',
          changeOrigin: true,
        },
        '/openapi.yaml': {
          target: process.env.VITE_DOCS_DEV_URL || 'http://localhost:3000',
          changeOrigin: true,
        },
        '/playground': {
          target: process.env.VITE_DOCS_DEV_URL || 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/test/**/*.{test,spec}.{ts,tsx}'],
    },
  };
});
