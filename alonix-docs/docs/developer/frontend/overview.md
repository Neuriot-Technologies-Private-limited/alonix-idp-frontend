---
sidebar_position: 1
---

# Frontend Overview

The {{brandName}} IDP frontend is a **React 19 + Vite + TypeScript** SPA in `alonix-idp-frontend`.

## Tech stack

| Layer | Technology |
|-------|------------|
| UI | React 19, Tailwind CSS 4, Framer Motion |
| Routing | React Router 7 |
| Server state | TanStack Query |
| Client state | Zustand (`authStore`) |
| HTTP | Axios (`services/api/client.ts`) |
| Realtime | Socket.IO (`services/chatSocket.ts`) |
| i18n | i18next |

## Local development

```bash
cd alonix-idp-frontend
npm install
npm run dev
```

Default URL: `http://localhost:5173`

Ensure the backend is running at `http://localhost:5005`.

## API integration

The frontend talks to the same backend documented here:

```text
VITE_API_BASE_URL → http://localhost:5005/api
```

Key service modules:

| Module | Purpose |
|--------|---------|
| `services/authApi.ts` | Login, logout, session rehydration |
| `services/api/client.ts` | Axios instance, cookies, CSRF |
| `services/chatApi.ts` | RAG chat REST |
| `services/adminService.ts` | Org admin, RBAC, connectors |

## Auth flow (SPA)

1. User submits email/password on `/login`
2. `authApi.login()` → `POST /users/login`
3. Response: `user`, `context`, cookies set by server
4. `authStore` persists user; context refreshed via `GET /users/me/context`
5. Mutations include `X-CSRF-Token` from login/context response

See [Authentication](../authentication) for Bearer token usage in non-browser clients.

## Deployment profiles

| Profile | Command | Notes |
|---------|---------|-------|
| SaaS | `npm run build` | Billing UI follows product flags |
| Enterprise | `npm run build:enterprise` | `VITE_DEPLOYMENT_PROFILE=enterprise` |

## Related docs

- [Frontend architecture](./architecture)
- [Backend API reference](/docs/developer/api-reference)
- [API Playground](/api-playground)
