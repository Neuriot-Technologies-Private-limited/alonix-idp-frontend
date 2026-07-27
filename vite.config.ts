import { defineConfig, loadEnv, type Plugin, type ProxyOptions } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import sirv from 'sirv';

const ROOT = __dirname;
const DOCS_BUILD_DIR = path.resolve(ROOT, 'alonix-docs', 'build');
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

const DOCS_SETUP_HINT = [
  'Help Center is not ready at /docs/.',
  '',
  'On Lightning (Vite :5173), rebuild docs for the /docs/ subpath, then restart Vite:',
  '',
  '  DOCUSAURUS_SITE_URL=https://5173-<studio-id>.cloudspaces.litng.ai npm run build:docs:dev',
  '  VITE_DOCS_MODE=static npm run dev',
  '',
  'Or one-shot:',
  '  DOCUSAURUS_SITE_URL=https://5173-<studio-id>.cloudspaces.litng.ai npm run dev:with-docs',
].join('\n');

function docsUnavailableHtml(reason: string): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Help Center not built</title>
  <style>
    body { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; margin: 2rem; line-height: 1.5; color: #111; background: #fafafa; }
    h1 { font-size: 1.15rem; margin: 0 0 1rem; }
    pre { background: #111; color: #e8e8e8; padding: 1rem; overflow: auto; border-radius: 8px; white-space: pre-wrap; }
    p { color: #444; max-width: 52rem; }
  </style>
</head>
<body>
  <h1>Help Center (/docs) is not available</h1>
  <p>${reason}</p>
  <pre>${DOCS_SETUP_HINT}</pre>
</body>
</html>`;
}

/** Serve pre-built Docusaurus at /docs/ (reliable on cloud dev; avoids webpack proxy ChunkLoadError). */
function docsStaticPlugin(docsBuildDir: string): Plugin {
  return {
    name: 'alonix-docs-static',
    configureServer(server) {
      const indexPath = path.join(docsBuildDir, 'index.html');
      const indexExists = fs.existsSync(indexPath);
      const indexHtml = indexExists ? fs.readFileSync(indexPath, 'utf8') : '';
      const hasDocsBase = indexExists && /["'/]docs\/assets\//.test(indexHtml);

      if (!indexExists) {
        server.config.logger.warn(
          `[alonix-docs] no build at ${docsBuildDir}\n` +
            '  Run: DOCUSAURUS_SITE_URL=<your-public-5173-url> npm run build:docs:dev'
        );
      } else if (!hasDocsBase) {
        server.config.logger.error(
          `[alonix-docs] REFUSING to serve ${docsBuildDir} — built with baseUrl=/ (not /docs/).\n` +
            '  Rebuild:\n' +
            '    DOCUSAURUS_SITE_URL=https://5173-<id>.cloudspaces.litng.ai npm run build:docs:dev\n' +
            '    VITE_DOCS_MODE=static npm run dev'
        );
      }

      const serve = hasDocsBase
        ? sirv(docsBuildDir, { dev: true, etag: true, maxAge: 0, single: false })
        : null;

      server.middlewares.use((req, res, next) => {
        const url = req.url ?? '';
        if (!url.startsWith('/docs')) return next();

        if (!serve) {
          const reason = !indexExists
            ? `Missing <code>alonix-docs/build</code> (expected at ${docsBuildDir}).`
            : 'Existing build used <code>baseUrl=/</code>; Lightning needs <code>baseUrl=/docs/</code>.';
          res.statusCode = 503;
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.end(docsUnavailableHtml(reason));
          return;
        }

        if (url === '/docs') {
          res.statusCode = 301;
          res.setHeader('Location', '/docs/');
          res.end();
          return;
        }

        const originalUrl = req.url;
        req.url = url.slice('/docs'.length) || '/';
        serve(req, res, () => {
          req.url = originalUrl;
          const subpath = url.slice('/docs'.length) || '/';
          if (subpath.includes('.')) return next();
          req.url = '/index.html';
          serve(req, res, next);
        });
      });

      if (serve) {
        server.config.logger.info(`[alonix-docs] static build at /docs/ ← ${docsBuildDir}`);
      }
    },
  };
}

function resolveDocsMode(): 'static' | 'proxy' {
  const explicit = process.env.VITE_DOCS_MODE?.trim();
  if (explicit === 'static' || explicit === 'proxy') return explicit;
  // Prefer static (or a clear /docs help page) over proxying to :3000 on cloud hosts.
  return 'static';
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
  const docsMode = resolveDocsMode();
  const docsDevUrl = process.env.VITE_DOCS_DEV_URL || 'http://localhost:3000';

  const serverProxy: Record<string, ProxyOptions> = {
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
  };
  if (docsMode === 'proxy') {
    serverProxy['/docs'] = {
      target: docsDevUrl,
      changeOrigin: true,
      ws: true,
      timeout: 120_000,
      proxyTimeout: 120_000,
    };
    serverProxy['/openapi.yaml'] = { target: docsDevUrl, changeOrigin: true };
    serverProxy['/playground'] = { target: docsDevUrl, changeOrigin: true };
  }

  const plugins = [
    react(),
    brandPlugin(mode, brandEnv),
    ...(docsMode === 'static' ? [docsStaticPlugin(DOCS_BUILD_DIR)] : []),
  ].flat();

  return {
    plugins,
    define: {
      ...Object.fromEntries(
        Object.entries(buildEnvResolved)
          .filter(([k]) => k.startsWith('VITE_'))
          .map(([k, v]) => [`import.meta.env.${k}`, JSON.stringify(v)])
      ),
    },
    server: {
      allowedHosts: ['localhost', '127.0.0.1', '.localhost', '.litng.ai', '.cloudspaces.litng.ai'],
      proxy: serverProxy,
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/test/**/*.{test,spec}.{ts,tsx}'],
    },
  };
});
