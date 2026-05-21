# Alonix IDP Frontend

Frontend application for the Alonix IDP platform, built with React + TypeScript + Vite.

## Multi-product / white-label (Findout v3)

Architecture for running multiple branded products (e.g. Alonix and Findout v3) from one codebase: [docs/MULTI_PRODUCT_WHITE_LABEL.md](../docs/MULTI_PRODUCT_WHITE_LABEL.md).

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

## Key app areas

- Public: landing, login, signup, email verification, forgot/reset password
- Private: dashboard, documents, chat, profile
- RBAC-protected: users, groups, org settings, activity logs

Route protection is implemented with:
- token-based private route guard
- role/capability guards via `RoleProtectedRoute`

## Prerequisites

- Node.js 20+ (recommended)
- npm 10+
- Backend service running from `alonix-idp-node-backend`

## Environment variables

Create a local env file from `.env.example`:

```bash
cp .env.example .env
```

Supported variables:

- `VITE_API_BASE_URL`
  - Dev: optional. If omitted, frontend uses `/api` and Vite proxies to backend.
  - Prod: set to API origin, e.g. `https://api.example.com/api`
- `VITE_SOCKET_URL` (optional)
- `VITE_SOCKET_PATH` (optional, default `/socket.io`)

## Local development

Install dependencies:

```bash
npm install
```

Start dev server:

```bash
npm run dev
```

Default Vite URL: `http://localhost:5173`

Dev API proxy configuration (`vite.config.ts`):
- `/api` -> `http://localhost:5005`

If API calls fail with 502 in dev, ensure backend is running on port `5005`.

## Scripts

- `npm run dev` - start Vite dev server
- `npm run build` - type-check + production build
- `npm run preview` - preview built app locally
- `npm run lint` - run ESLint

## Build and deploy

Create production build:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

Deploy the generated `dist/` folder to your static hosting platform.

Before production deploy, set:
- `VITE_API_BASE_URL` to your backend API base
- optional socket variables if realtime endpoint differs

## Project structure

```text
src/
  components/    reusable UI and domain components
  pages/         route-level pages (auth, dashboard, docs, groups, etc.)
  services/      API clients and service modules
  stores/        Zustand stores
  hooks/         reusable React hooks
  core/          theme and RBAC core logic
  layout/        app shell and navigation layout
  utils/         utility helpers
```
