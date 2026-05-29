import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

/**
 * Vite plugin: Brand Asset Injector
 *
 * When running `vite --mode <brand>` (e.g. --mode 1glance):
 *  1. Reads `brands/<brand>/brand.env` and merges into the env
 *  2. Copies `brands/<brand>/assets/*` → `public/brand/` before build
 *  3. Copies `brands/<brand>/theme.css` → `src/brand/theme.css` if present
 *
 * This means all components can safely reference `/brand/logo.png` etc.
 * without knowing which brand they're building for.
 */
function brandPlugin(mode: string, brandEnv: Record<string, string>): Plugin {
  const brandDir = path.resolve(__dirname, 'brands', mode);
  const assetsDir = path.join(brandDir, 'assets');
  const publicBrandDir = path.resolve(__dirname, 'public', 'brand');
  const themeSrc = path.join(brandDir, 'theme.css');
  const themeDest = path.resolve(__dirname, 'src', 'brand', 'theme.css');

  return {
    name: 'vite-plugin-brand',
    buildStart() {
      // 1. Clean public/brand/ to prevent leftover files from previous brand builds
      if (fs.existsSync(publicBrandDir)) {
        fs.rmSync(publicBrandDir, { recursive: true, force: true });
      }

      // 2. Copy baseline 1glance assets first
      const fallbackDir = path.resolve(__dirname, 'brands', '1glance', 'assets');
      if (fs.existsSync(fallbackDir)) {
        copyAssets(fallbackDir, publicBrandDir);
      }

      // Copy active brand assets on top of baseline if not in 1glance mode
      if (mode !== '1glance' && fs.existsSync(brandDir) && fs.existsSync(assetsDir)) {
        copyAssets(assetsDir, publicBrandDir);
      }

      // 3. Copy baseline 1glance theme first
      const fallbackTheme = path.resolve(__dirname, 'brands', '1glance', 'theme.css');
      if (fs.existsSync(fallbackTheme)) {
        fs.mkdirSync(path.dirname(themeDest), { recursive: true });
        fs.copyFileSync(fallbackTheme, themeDest);
      }

      // Copy active brand theme on top of baseline if not in 1glance mode
      if (mode !== '1glance' && fs.existsSync(brandDir) && fs.existsSync(themeSrc)) {
        fs.mkdirSync(path.dirname(themeDest), { recursive: true });
        fs.copyFileSync(themeSrc, themeDest);
      }
    },
    transformIndexHtml(html) {
      // Find favicon file inside public/brand/
      let faviconFile = 'favicon.svg';
      if (fs.existsSync(publicBrandDir)) {
        const files = fs.readdirSync(publicBrandDir);
        const found = files.find(f => f.startsWith('favicon.'));
        if (found) {
          faviconFile = found;
        }
      }

      const ext = path.extname(faviconFile).slice(1);
      const mimeType = ext === 'svg' ? 'image/svg+xml' : `image/${ext}`;
      
      let modifiedHtml = html.replace(
        /<link rel="icon" type="[^"]*" href="\/brand\/favicon\.[^"]*" \/>/g,
        `<link rel="icon" type="${mimeType}" href="/brand/${faviconFile}" />`
      );
      
      if (modifiedHtml === html) {
        modifiedHtml = html.replace(
          /\/brand\/favicon\.svg/g,
          `/brand/${faviconFile}`
        );
      }

      // Explicitly replace title placeholder %VITE_BRAND_NAME%
      const brandName = brandEnv.VITE_BRAND_NAME || '1-Glance';
      modifiedHtml = modifiedHtml.replace(/%VITE_BRAND_NAME%/g, brandName);

      return modifiedHtml;
    }
  };
}

function copyAssets(src: string, dest: string) {
  fs.mkdirSync(dest, { recursive: true });
  for (const file of fs.readdirSync(src)) {
    if (file === '.DS_Store') continue;
    fs.copyFileSync(path.join(src, file), path.join(dest, file));
  }
}

/**
 * Load brand.env for the given mode and merge into the Vite env.
 * Standard Vite .env files (`.env`, `.env.<mode>`) still apply as normal.
 */
function loadBrandEnv(mode: string, root: string): Record<string, string> {
  const brandEnvPath = path.join(root, 'brands', mode, 'brand.env');
  if (!fs.existsSync(brandEnvPath)) return {};

  const raw = fs.readFileSync(brandEnvPath, 'utf-8');
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

// https://vite.dev/config/
/// <reference types="vitest/config" />
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const brandEnv = loadBrandEnv(mode, process.cwd());

  // Merge brand env on top of standard env (brand wins)
  const mergedEnv = { ...env, ...brandEnv };

  const proxyTarget = mergedEnv.VITE_DEV_PROXY_TARGET || mergedEnv.VITE_API_BASE_URL || 'http://localhost:5005';

  return {
    plugins: [
      react(),
      brandPlugin(mode, brandEnv),
    ],
    // Expose brand env vars to import.meta.env
    define: {
      // Only forward VITE_BRAND_* keys into the client bundle
      ...Object.fromEntries(
        Object.entries(brandEnv)
          .filter(([k]) => k.startsWith('VITE_'))
          .map(([k, v]) => [`import.meta.env.${k}`, JSON.stringify(v)])
      ),
    },
    server: {
      allowedHosts: true,
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
