# Help Center

Complete **end-user documentation** for 1-Glance, plus a **developer API reference** and interactive playground. Product name, logo, and colors come from `../public/brand` (synced by `npm run sync:brand`).

## What's inside

| Section | Audience | Description |
|---------|----------|-------------|
| [Help Center](http://localhost:3000) | End users | Workspaces, documents, AI chat, connectors, reports |
| [Documentation](http://localhost:3000/docs/introduction/product-overview) | Everyone | Searchable guides, tutorials, FAQ, glossary |
| [API Playground](http://localhost:3000/api-playground) | Developers | OpenAPI + Scalar — mock or sandbox backend |

## Quick start (docs site)

```bash
cd alonix-docs
npm install
cp .env.example .env
npm run start
```

Open **http://localhost:3000** for the help center homepage.

### With API playground (mock + docs)

```bash
npm run dev:mock
```

| Service | URL |
|---------|-----|
| Help Center | http://localhost:3000 |
| API Playground | http://localhost:3000/api-playground |
| Mock API (Prism) | http://localhost:4010 |

## API Playground: mock vs sandbox

The playground has two modes, controlled by `.env` (`DOCUSAURUS_API_MODE`).

| Mode | Target | Responses | Use when |
|------|--------|-----------|----------|
| **mock** (default) | `http://localhost:4010` (Prism) | **Example data only** — credentials are not checked | Public docs, demos, exploring the API shape |
| **sandbox** | `http://localhost:5005/api` or your staging URL | **Real** backend responses | Local integration testing, QA against staging |

**Why login returns `demo.admin@alonix.example` in mock mode:** Prism returns fixed examples from `openapi.yaml`. Your email/password are ignored. That is expected — not a bug.

### Get real API responses (local)

**Option A — switch server in the playground (no config change)**

1. Start the backend: `cd ../alonix-idp-node-backend && npm run dev`
2. Open [API Playground](http://localhost:3000/api-playground)
3. In the Scalar **server dropdown**, select **Sandbox backend** (`http://localhost:5005/api`)
4. Call `POST /users/login` with real credentials

**Option B — default to sandbox**

Edit `alonix-docs/.env`:

```bash
DOCUSAURUS_API_MODE=sandbox
DOCUSAURUS_API_SANDBOX_URL=http://localhost:5005/api
```

Restart the docs server. The banner shows **Sandbox** and requests go to the real API by default.

### Deployed / staging API

Point sandbox at your non-production API when building or serving docs:

```bash
DOCUSAURUS_API_MODE=sandbox
DOCUSAURUS_API_SANDBOX_URL=https://staging-api.your-domain.com/api
npm run build
```

**Do not** point the public playground at a **production** API — tokens and credentials are visible in the browser.

### Recommended setup

| Environment | Mode | `DOCUSAURUS_API_SANDBOX_URL` |
|-------------|------|------------------------------|
| Public docs site | `mock` | (unused) |
| Local dev | `sandbox` | `http://localhost:5005/api` |
| Internal staging docs | `sandbox` | Your staging API URL |
| Production API | — | **Never** wire into public playground |

See also [Authentication](/docs/developer/authentication) for the login → Authorize → protected routes flow.

## Run the application locally

End-user docs describe the product; to run the app itself:

```bash
# Terminal 1 — backend
cd ../alonix-idp-node-backend
npm install
cp .env.example .env   # configure MongoDB, etc.
npm run dev            # http://localhost:5005

# Terminal 2 — frontend
cd ../alonix-idp-frontend
npm install
npm run dev            # http://localhost:5173
```

See [Developer setup](/docs/developer/setup) for full details.

## Documentation structure

```text
docs/
├── introduction/       # Product overview
├── getting-started/    # Account, login, first steps
├── user-guide/         # Every major feature
├── tutorials/          # End-to-end workflows
├── best-practices/
├── troubleshooting/
├── faq/
├── release-notes/
├── glossary/
└── developer/          # API reference, frontend architecture
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run start` | Docusaurus dev server |
| `npm run dev:mock` | Docs + Prism mock API |
| `npm run sync:openapi` | Pull backend OpenAPI spec |
| `npm run generate:api-docs` | Generate MDX pages from OpenAPI (131 endpoints) |
| `npm run build` | Sync + generate + production static build |
| `npm run typecheck` | TypeScript check |

## Sync OpenAPI from backend

```bash
cd ../alonix-idp-node-backend && npm run openapi:export
cd ../alonix-docs && npm run sync:openapi && npm run generate:api-docs
```

`sync:openapi` and `generate:api-docs` run automatically before `npm run build`.

Generated API reference pages live under `docs/developer/api-reference/` (one page per operation, grouped by tag). Each page links to the [API Playground](/api-playground) with the correct operation pre-selected.

## Deploy

### Local dev (standalone)

```bash
npm run start
# Help center: http://localhost:3000
# Docs pages:  http://localhost:3000/docs/...
```

### Production (AWS nginx — same domain as app)

Docs ship at **`https://<your-app-domain>/docs/`** inside the frontend `dist/` folder.

**GitHub configuration (frontend repo):**

| Setting | Example | Purpose |
|---------|---------|---------|
| `vars.PUBLIC_APP_URL` | `https://app.yourdomain.com` | Canonical URL for Docusaurus |
| `vars.DEPLOY_DIST_PATH` | `/var/www/1glance` | nginx root on the EC2 instance |

Docs live in **`alonix-idp-frontend/alonix-docs/`** on the `alonix-1-glance` branch.

**CI pipeline** (`alonix-idp-frontend/.github/workflows/deploy-aws.yml`):

1. `security` — gitleaks, tests, audit  
2. `build` — app + docs merged into `dist/`  
3. `deploy` — rsync `dist/` to the AWS instance  

### Local build before push (matches CI)

From `alonix-idp-frontend/`:

```bash
export PUBLIC_APP_URL=https://app.yourdomain.com
npm run build:dist
```

This builds the app, builds docs at `/docs/`, and merges into `dist/docs/`.

```bash
# Manual production docs build (matches CI)
cd alonix-docs
DOCUSAURUS_BASE_URL=/docs/ DOCUSAURUS_SITE_URL=https://app.yourdomain.com npm run build

# Merge into frontend dist (from alonix-idp-frontend/)
./scripts/merge-docs-into-dist.sh ../alonix-docs/build dist
```

Public production docs use **`DOCUSAURUS_API_MODE=mock`** (playground returns example data only).

## Related repositories

- `alonix-idp-node-backend` — Express API
- `alonix-idp-frontend` — React web app
