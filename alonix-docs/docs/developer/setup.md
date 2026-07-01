---
title: Developer Setup
description: Clone, install, and run the Alonix documentation portal, frontend app, and backend API for local development.
sidebar_position: 1
---

# Developer Setup

## Overview

This guide covers local development for three related repositories:

| Repository | Purpose | Default local URL |
|------------|---------|-------------------|
| `alonix-docs` | Docusaurus documentation and API playground | http://localhost:3000 |
| `alonix-idp-frontend` | React end-user application | http://localhost:5173 |
| `alonix-idp-node-backend` | Express API server | http://localhost:5005 |

End-user documentation lives in `alonix-docs/docs/`. API and frontend architecture guides live under `docs/developer/`.

## Purpose

Get engineers and technical writers running the full stack locally for development, doc previews, and API playground testing.

## Prerequisites

- **Node.js** ≥ 22.12.0 (see `alonix-docs/package.json` engines)
- **npm** (bundled with Node)
- **Git** access to Alonix repositories
- macOS, Linux, or Windows with a supported terminal

Optional for API playground sandbox mode:

- MongoDB and other backend env vars per `alonix-idp-node-backend` README

## Step-by-Step Instructions

### 1. Clone repositories

From your projects directory:

```bash
git clone <alonix-idp-node-backend-url>
git clone <alonix-idp-frontend-url>
git clone <alonix-docs-url>
```

Typical sibling layout:

```text
Alonix/
├── alonix-idp-node-backend/
├── alonix-idp-frontend/
└── alonix-docs/
```

### 2. Run the backend API (`:5005`)

```bash
cd alonix-idp-node-backend
npm install
cp .env.example .env   # if present — configure DB and secrets
npm run dev
```

Verify: API responds at **http://localhost:5005** (health or `/api` routes per project README).

### 3. Run the frontend app (`:5173`)

In a second terminal:

```bash
cd alonix-idp-frontend
npm install
cp .env.example .env   # point VITE_API_URL to http://localhost:5005/api if needed
npm run dev
```

Verify: open **http://localhost:5173** — login and workspace UI load against local backend.

### 4. Run the documentation portal (`:3000`)

In a third terminal:

```bash
cd alonix-docs
npm install
cp .env.example .env
npm run dev:mock
```

`dev:mock` starts:

| Service | URL |
|---------|-----|
| Docs site | http://localhost:3000 |
| API Playground | http://localhost:3000/api-playground |
| Prism mock API | http://localhost:4010 |

For docs only without mock:

```bash
npm run start
```

### 5. Configure API playground mode

Edit `alonix-docs/.env`:

```bash
# Mock (default) — safe, no real data
DOCUSAURUS_API_MODE=mock
DOCUSAURUS_API_MOCK_URL=http://localhost:4010

# Sandbox — real local backend
DOCUSAURUS_API_MODE=sandbox
DOCUSAURUS_API_SANDBOX_URL=http://localhost:5005/api
```

Restart the dev server after changing mode (values inject at build time via `docusaurus.config.ts`).

**Sandbox prerequisites:** backend running on port **5005** with non-production credentials only.

### 6. Sync OpenAPI spec from backend

```bash
cd alonix-docs
npm run sync:openapi
```

Runs automatically before `npm run build` via `prebuild`. Source of truth: `alonix-idp-node-backend` swagger paths → `static/openapi.yaml`.

### 7. Production build (docs)

```bash
cd alonix-docs
npm run build
npm run serve   # preview build locally
```

Deploy contents of `build/` to static hosting. See `.github/workflows/docs-deploy.yml` for CI example.

## Expected Results

| Check | Success |
|-------|---------|
| Backend | `localhost:5005` serves API |
| Frontend | `localhost:5173` loads app, talks to API |
| Docs | `localhost:3000` renders end-user and developer pages |
| Playground mock | Try it out works against `:4010` |
| Playground sandbox | Try it out works against `:5005/api` with valid token |

## Tips

:::tip Daily doc editing
Use `npm run start` in `alonix-docs` if you only edit Markdown and do not need the API playground mock server.
:::

- Rate limit on local backend sandbox: typically 100 requests / 15 min per IP.
- Use `npm run clear` in `alonix-docs` if Docusaurus cache causes stale routes.

## Best Practices

- Never point sandbox playground at production APIs.
- Run `sync:openapi` after backend swagger changes before opening API PRs.
- Keep end-user docs (`docs/introduction/`, `docs/user-guide/`, etc.) separate from developer API MDX pages.

## Common Mistakes

- Frontend on 5173 configured for wrong API URL—check `alonix-idp-frontend` env.
- Changing `.env` in docs without restarting dev server.
- Forgetting backend must run before sandbox playground tests.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Port 5005 in use | Stop other process or change backend port + update frontend/docs env |
| Port 5173 in use | Vite prompts alternate port—or kill stale dev server |
| Playground CORS errors in sandbox | Confirm backend CORS allows `localhost:3000` |
| `sync:openapi` fails | Ensure backend repo path in `scripts/sync-openapi.js` is correct |
| Node version error | Upgrade to Node ≥ 22.12.0 |

## Related Articles

- [Authentication](/docs/developer/authentication)
- [API Reference](/docs/developer/api-reference)
- [Frontend Overview](/docs/developer/frontend/overview)
- [Error Handling](/docs/developer/error-handling)
- End-user docs: [What Is Alonix?](/docs/introduction/what-is-alonix)

## Project structure (alonix-docs)

```text
alonix-docs/
├── docs/                     # End-user + developer Markdown / MDX
├── src/
│   ├── components/           # ApiPlayground, CodeTabs, ServerModeBanner
│   ├── config/api.ts
│   └── pages/api-playground.tsx
├── static/openapi.yaml
├── scripts/
│   ├── sync-openapi.js
│   └── start-mock.js
├── docusaurus.config.ts
└── sidebars.ts
```

## Adding a new API endpoint to docs

1. Add route + swagger path in `alonix-idp-node-backend`
2. Export OpenAPI: `cd alonix-idp-node-backend && npm run openapi:export`
3. Sync and regenerate: `cd alonix-docs && npm run sync:openapi && npm run generate:api-docs`
4. Verify in [API Playground](/api-playground)
