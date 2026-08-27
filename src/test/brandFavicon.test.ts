import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { resolveBrandFavicon } from '../../vite.config';

const publicBrandDir = path.resolve(__dirname, '../../public/brand');

describe('product favicon', () => {
  it('public/brand has a committed favicon.svg', () => {
    const files = fs.readdirSync(publicBrandDir).filter((f) => f.startsWith('favicon.'));
    expect(files).toContain('favicon.svg');
  });

  it('resolves favicon.svg from public/brand', () => {
    const fav = resolveBrandFavicon(
      { VITE_BRAND_FAVICON_URL: '/brand/favicon.svg' },
      publicBrandDir
    );
    expect(fav.url).toBe('/brand/favicon.svg');
    expect(fav.mimeType).toBe('image/svg+xml');
  });
});
