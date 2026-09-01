# 1-Glance Frontend

React web application for the **1-Glance** Intelligent Document Platform, plus the embedded **Help Center** (`alonix-docs/`) — end-user guides, developer API reference, and interactive playground.

Production readiness: [docs/PRODUCTION_READINESS_TODO.md](../docs/PRODUCTION_READINESS_TODO.md) · [docs/PRODUCTION_STATUS.md](../docs/PRODUCTION_STATUS.md)

---

## Repository layout

```text
alonix-idp-frontend/
├── src/                 # React app (pages, services, stores, components)
├── public/brand/        # 1-Glance logos, favicon, product screenshots
├── alonix-docs/         # Docusaurus Help Center + API playground (ships at /docs/)
├── scripts/             # AWS dist build, merge-docs-into-dist
├── .github/workflows/   # CI/CD (build dist → copy to AWS EC2)
├── nginx.conf           # Host nginx example for the AWS instance
└── package.json
```

Related repos:

| Repo | Role | Default local URL |
|------|------|-------------------|
| `alonix-idp-node-backend` | Express API | http://localhost:5005 |
| `alonix-idp-frontend` (this) | React SPA | http://localhost:5173 |
| `alonix-idp-frontend/alonix-docs` | Help Center | http://localhost:3000 |

---

## Tech stack

- React 19 + TypeScript
- Vite 8
- React Router 7
- TanStack Query (server state)
- Zustand (auth/UI state)
- Axios (API client)
- Tailwind CSS 4 + Framer Motion
- Socket.IO client (chat/realtime)
- i18next (internationalization)
- **Docs:** Docusaurus 3, OpenAPI, Scalar playground, Prism mock API

---

## Prerequisites

- **Node.js** ≥ 22.12 (see `engines` in `package.json`)
- **npm** ≥ 10
- **Backend** running from `alonix-idp-node-backend` for real API calls

---

## Deployment profiles

SaaS vs enterprise is a **delivery** flag, not a product skin. Set it in `.env` on **both** apps so they stay aligned:

| Profile | Env value | Effect |
|---------|-----------|--------|
| **enterprise** (default) | `VITE_DEPLOYMENT_PROFILE=enterprise` | Hides public landing, signup, and billing UI |
| **saas** | `VITE_DEPLOYMENT_PROFILE=saas` | Public landing on; public pricing off for 1-Glance |

Backend must use the same value as `DEPLOYMENT_PROFILE` in `alonix-idp-node-backend/.env`. `npm run dev:saas` / `build:saas` only apply when `.env` does not already set `VITE_DEPLOYMENT_PROFILE`.

---

## Environment variables

### Frontend (`alonix-idp-frontend/.env`)

Copy from `.env.example`:

```bash
cp .env.example .env
```

| Variable | Dev | Production |
|----------|-----|------------|
| `VITE_DEPLOYMENT_PROFILE` | `saas` or `enterprise` — must match backend `DEPLOYMENT_PROFILE` | Same. GitHub Environment var `VITE_DEPLOYMENT_PROFILE` (default enterprise if unset) |
| `VITE_API_BASE_URL` | Optional — omit to use `/api` via Vite proxy → `localhost:5005` | **Omit on AWS** (nginx proxies `/api`). Set only if the API is on another host |
| `VITE_DEV_PROXY_TARGET` | Optional — override proxy target (ngrok, remote backend) | — |
| `VITE_SOCKET_URL` | Optional — defaults to API origin | Set if Socket.IO host differs |
| `VITE_SOCKET_PATH` | Optional — default `/socket.io` | Optional |

### Help Center (`alonix-docs/.env`)

```bash
cd alonix-docs && cp .env.example .env
```

| Variable | Purpose | Local dev example |
|----------|---------|-------------------|
| `DOCUSAURUS_SITE_URL` | Canonical site origin | `http://localhost:3000` |
| `DOCUSAURUS_BASE_URL` | URL prefix for docs | `/` locally; `/docs/` on AWS nginx |
| `DOCUSAURUS_API_MODE` | `mock` or `sandbox` | `mock` (safe default) |
| `DOCUSAURUS_API_SANDBOX_URL` | Real API for playground | `http://localhost:5005/api` |

Full reference: [alonix-docs/.env.example](./alonix-docs/.env.example)

---

## Local development

### Full stack (recommended)

Three terminals — backend, frontend, and docs:

```bash
# Terminal 1 — API
cd ../alonix-idp-node-backend
npm install && cp .env.example .env
npm run dev
# → http://localhost:5005

# Terminal 2 — React app
cd ../alonix-idp-frontend
npm install
npm run dev
# → http://localhost:5173

# Terminal 3 — Help Center
cd alonix-docs
npm install && cp .env.example .env
npm run dev:mock
# → http://localhost:3000  (homepage + /docs/... + /api-playground)
```

`npm run dev:mock` in `alonix-docs` syncs product assets and starts Prism mock API + Docusaurus.

### Frontend only

```bash
npm install
# Profile comes from .env (VITE_DEPLOYMENT_PROFILE). Must match backend DEPLOYMENT_PROFILE.
npm run dev
```

Vite dev server: **http://localhost:5173**

API proxy (`vite.config.ts`): `/api` → `http://localhost:5005`. If you see **502** on API calls, start the backend.

### Docs only

```bash
cd alonix-docs
npm run start            # docs without mock server
npm run dev:mock         # docs + Prism mock on :4010
```

| URL | Content |
|-----|---------|
| http://localhost:3000 | Help Center homepage |
| http://localhost:3000/docs/... | User & developer guides |
| http://localhost:3000/api-playground | Interactive OpenAPI playground |

### Playground against real API (sandbox)

1. Backend running on `:5005`
2. In `alonix-docs/.env`:

```bash
DOCUSAURUS_API_MODE=sandbox
DOCUSAURUS_API_SANDBOX_URL=http://localhost:5005/api
```

3. `npm run start`

Or keep `mock` mode and pick **Sandbox backend** in the playground server dropdown.

---

## Scripts — frontend

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server (profile from `.env`; default enterprise) |
| `npm run dev:saas` | SaaS only if `.env` does not already set `VITE_DEPLOYMENT_PROFILE` |
| `npm run dev:enterprise` | Enterprise only if `.env` does not already set `VITE_DEPLOYMENT_PROFILE` |
| `npm run build` | Typecheck + Vite production build (same env rule) |
| `npm run build:saas` | SaaS only if `.env` does not already set `VITE_DEPLOYMENT_PROFILE` |
| `npm run build:enterprise` | Enterprise only if `.env` does not already set `VITE_DEPLOYMENT_PROFILE` |
| `npm run build:dist` | App + Help Center merged into `dist/` (what AWS nginx serves) |
| `npm run preview` | Preview production `dist/` locally |
| `npm run lint` | ESLint |
| `npm run test` | Vitest (watch) |
| `npm run test:run` | Vitest single run (used in CI) |
| `npm run test:coverage` | Vitest with coverage |
| `npm run qa:deployment` | Deployment-profile unit tests |

---

## Scripts — Help Center (`alonix-docs/`)

| Command | Description |
|---------|-------------|
| `npm run start` | Docusaurus dev server |
| `npm run dev:mock` | Docs + Prism mock API |
| `npm run sync:brand` | Copy `public/brand/` → docs static assets & theme |
| `npm run sync:openapi` | Merge backend OpenAPI into `static/openapi.yaml` |
| `npm run generate:api-docs` | Generate MDX API pages from OpenAPI |
| `npm run build` | Full sync + production static build |
| `npm run build:ci` | CI build (asset sync + API docs + Docusaurus) |
| `npm run serve` | Serve `build/` after production build |
| `npm run typecheck` | TypeScript check |

More detail: [alonix-docs/README.md](./alonix-docs/README.md)

---

## Build

### Frontend only

```bash
npm run build
npm run build:enterprise
```

Output: `dist/` (SPA only, no docs).

### Help Center only

```bash
cd alonix-docs

# Local paths (no /docs prefix)
npm run build

# AWS nginx subpath (matches production)
DOCUSAURUS_BASE_URL=/docs/ \
DOCUSAURUS_SITE_URL=https://app.yourdomain.com \
npm run build:ci
```

Output: `alonix-docs/build/`

### App + docs together (AWS `dist/`)

Leave `VITE_API_BASE_URL` unset so the SPA talks to `/api` on the same nginx origin.

```bash
export PUBLIC_APP_URL=https://app.yourdomain.com
npm run build:dist
```

This will:

1. `npm run build` → `dist/`
2. Build docs with `DOCUSAURUS_BASE_URL=/docs/` → `alonix-docs/build/`
3. Merge docs into `dist/docs/` via `scripts/merge-docs-into-dist.sh`

Preview:

```bash
npx serve dist
# App:  http://localhost:3000/
# Docs: http://localhost:3000/docs/
```

Copy `dist/` onto the EC2 nginx root (default `/var/www/1glance`). Use [`nginx.conf`](./nginx.conf) on the instance.

---

## CI/CD — AWS EC2

Workflow: [`.github/workflows/deploy-aws.yml`](./.github/workflows/deploy-aws.yml)

**Triggers:** push to `alonix-1-glance` deploys **staging**. Manual run can choose `staging` or `production`.

| Job | What it does |
|-----|----------------|
| **security** | Gitleaks, lint, tests, `npm audit --omit=dev --audit-level=high` |
| **build** | App + Help Center → `dist/` (artifact `1glance-dist`) |
| **deploy** | rsync `dist/` to the EC2 instance, reload nginx if present |

Same-origin: CI does **not** set `VITE_API_BASE_URL`. nginx proxies `/api` and `/socket.io` to the API container on `127.0.0.1:5005`.

### GitHub Environments

Create **two** environments on this repo: Settings → Environments → New environment.

| Environment | When it is used |
|-------------|-----------------|
| `staging` | Every push to `alonix-1-glance` (and manual run with target `staging`) |
| `production` | Manual run only — Actions → Deploy dist to AWS → target `production` |

Secrets on `production` are **not** visible to `staging`. Add the full set on **each** environment (same names, different values if the hosts differ).

Repo-level Actions secrets are a fallback for both. Prefer **environment** secrets so staging cannot accidentally use production hosts.

**Environment secrets** (open `staging`, then Environment secrets):

| Secret | Required | Purpose |
|--------|----------|---------|
| `DEPLOY_SSH_KEY` | Yes | Private key to SSH into that environment's instance |
| `DEPLOY_HOST` | Yes | Instance host or Elastic IP |
| `DEPLOY_USER` | Yes | SSH user |
| `DEPLOY_SSH_PORT` | No | SSH port (default 22) |
| `DEPLOY_KNOWN_HOSTS` | No | Pinned host keys (otherwise CI runs ssh-keyscan) |

**Environment variables:**

| Variable | Purpose |
|----------|---------|
| `PUBLIC_APP_URL` | Canonical origin for Help Center links (e.g. `https://dev.1glance.ai`) |
| `VITE_DEPLOYMENT_PROFILE` | `saas` or `enterprise` — must match backend `DEPLOYMENT_PROFILE` in `ENV_FILE`. Defaults to enterprise if unset |
| `DEPLOY_DIST_PATH` | nginx root on the instance (default `/var/www/1glance`) |

Repeat the same names on `production` with production host/URL/path.

### Manual deploy

```bash
# Actions → "Deploy dist to AWS" → Run workflow → target: staging | production
```

Ensure `alonix-docs/` is committed in the same repo.

---

## App areas

- **Public:** landing, login, signup, email verification, forgot/reset password
- **Private:** dashboard, documents, chat, profile
- **RBAC-protected:** users, groups, org settings, activity logs, connectors, billing (SaaS)

Route protection: private route guard + `RoleProtectedRoute` (capabilities from backend).

---

## Project structure

```text
src/
  brand/         useBrand(), theme.css, product identity
  components/    reusable UI and domain components
  pages/         route-level pages
  services/      API clients (authApi, chatApi, …)
  stores/        Zustand stores
  hooks/         React Query hooks, RBAC helpers
  layout/        app shell, sidebar, top nav
  i18n/          translations

alonix-docs/
  docs/          Markdown/MDX — user guides, tutorials, API reference
  src/           Docusaurus pages, playground components
  static/        openapi.yaml, brand assets, playground HTML
  scripts/       sync-brand, sync-openapi, generate-api-docs, Prism mock

public/brand/    1-Glance logos, favicon, product screenshots
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| API 502 in dev | Start `alonix-idp-node-backend` on port 5005 |
| Docs show `{{brandName}}` in sidebar | Run `npm run sync:brand` in `alonix-docs`; restart docs |
| `process is not defined` on docs homepage | Use `useSitePath()` hook (fixed in `src/utils/sitePath.ts`) |
| Prism mock fails on start | Run `npm run sync:openapi` in `alonix-docs` |
| CI fails "alonix-docs missing" | Commit `alonix-docs/` inside this repo |

---

## Further reading

- [alonix-docs/README.md](./alonix-docs/README.md) — docs-only deep dive (playground, OpenAPI sync)
- [alonix-idp-node-backend/README.md](../alonix-idp-node-backend/README.md) — API setup
