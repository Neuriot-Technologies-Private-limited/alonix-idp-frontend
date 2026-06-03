import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { resolveBrandFavicon, syncBrandAssets } from '../../vite.config';

const publicBrandDir = path.resolve(__dirname, '../../public/brand');

function loadFindoutBrandEnv(): Record<string, string> {
  const raw = fs.readFileSync(
    path.resolve(__dirname, '../../brands/findoutai/brand.env'),
    'utf-8'
  );
  const env: Record<string, string> = {};
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    env[key] = value;
  }
  return env;
}

describe('brand favicon (findoutai)', () => {
  it('sync leaves only findout favicon.png in public/brand', () => {
    syncBrandAssets('findoutai');
    const files = fs.readdirSync(publicBrandDir).filter((f) => f.startsWith('favicon.'));
    expect(files).toEqual(['favicon.png']);
  });

  it('resolves favicon.png from brand.env', () => {
    syncBrandAssets('findoutai');
    const env = loadFindoutBrandEnv();
    const fav = resolveBrandFavicon(env, publicBrandDir);
    expect(fav.url).toBe('/brand/favicon.png');
    expect(fav.mimeType).toBe('image/png');
  });
});
