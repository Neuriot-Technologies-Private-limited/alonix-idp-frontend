# Adding a New Brand

Each brand lives in its own folder under `brands/`. The codebase reads all branding from here — no source code changes needed.

## Folder Structure

```
brands/
  <brand-slug>/
    brand.env          ← All VITE_BRAND_* variables (required)
    assets/
      logo.png         ← Full horizontal logo (required)
      logo-icon.png    ← Square icon / favicon fallback (required)
      favicon.svg      ← Browser tab icon (required)
    i18n/
      en/
        landing.json   ← Brand-specific landing page copy (optional, overrides defaults)
    theme.css          ← Brand CSS variable overrides (optional)
```

## Steps to Onboard a New Client Brand

1. **Create the folder**
   ```bash
   mkdir -p brands/newclient/assets
   mkdir -p brands/newclient/i18n/en
   ```

2. **Copy and fill `brand.env`**
   ```bash
   cp brands/1glance/brand.env brands/newclient/brand.env
   # Edit the values for the new client
   ```

3. **Add brand assets**
   - `brands/newclient/assets/logo.png` — full logo
   - `brands/newclient/assets/logo-icon.png` — icon only
   - `brands/newclient/assets/favicon.svg` — browser favicon

4. **Optional: Custom landing copy**
   ```bash
   cp brands/1glance/i18n/en/landing.json brands/newclient/i18n/en/landing.json
   # Edit the strings for the new client
   ```

5. **Optional: Custom theme colours**
   ```bash
   cp brands/1glance/theme.css brands/newclient/theme.css
   # Edit the CSS variables for the new client
   ```

6. **Add build scripts to `package.json`**
   ```json
   "dev:newclient": "vite --mode newclient",
   "build:newclient": "tsc -b && vite build --mode newclient"
   ```

7. **Run the brand**
   ```bash
   npm run dev:newclient
   ```

## Enterprise deployment (same brand, different profile)

SaaS and enterprise share the same brand folder; **deployment** is controlled separately:

| Layer | Knob | Example |
|-------|------|---------|
| Brand | `vite --mode <brand>` | `npm run dev:findoutai` |
| Deployment | `VITE_DEPLOYMENT_PROFILE` | `npm run dev:findoutai:enterprise` |

1. Copy `brands/<brand>/brand.env.enterprise.example` values or use repo `profiles/enterprise.env` (merged by Vite automatically when `VITE_DEPLOYMENT_PROFILE=enterprise`).
2. Pair with backend `DEPLOYMENT_PROFILE=enterprise` and bootstrap — see [docs/ENTERPRISE_INSTALL.md](../../docs/ENTERPRISE_INSTALL.md).
3. Build for production: `npm run build:<brand>:enterprise`.

Enterprise builds hide public landing, pricing, signup, and billing UI.

## What Each Brand Controls

| Setting | File | Key |
|---|---|---|
| App name | `brand.env` | `VITE_BRAND_NAME` |
| Logo image | `assets/logo.png` | (file) |
| Favicon | `assets/favicon.svg` (or `.png`) | `VITE_BRAND_FAVICON_URL` in `brand.env` |
| Primary colour | `brand.env` | `VITE_BRAND_PRIMARY_LIGHT/DARK` |
| Landing page text | `i18n/en/landing.json` | (strings) |
| Footer links | `brand.env` | `VITE_BRAND_PRIVACY_URL` etc. |
| Show/hide pricing | `brand.env` | `VITE_BRAND_SHOW_PRICING` (landing, `/pricing`, org subscription panel, `/settings/billing`) |
| SaaS vs enterprise | `profiles/enterprise.env` or npm `*:enterprise` | `VITE_DEPLOYMENT_PROFILE` |

## Rules

- **Never edit `src/` files** to add brand-specific logic.
- **Never hardcode a brand name** in any component.
- All components must read from `useBrand()` or `useTranslation()`.
