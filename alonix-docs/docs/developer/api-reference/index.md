---
title: API Reference
description: Complete {{brandName}} REST API — all endpoints with examples and interactive playground.
sidebar_position: 1
---

# API Reference

Complete reference for the **{{brandName}} IDP REST API** (131 operations). All paths are relative to `/api`.

## Quick links

| Resource | URL |
|----------|-----|
| **Interactive playground** | [/api-playground](/api-playground) |
| OpenAPI spec (YAML) | [`/openapi.yaml`](/openapi.yaml) |
| Backend Swagger UI | `http://localhost:5005/api/docs` (non-production) |

## Authentication

Most endpoints require `Authorization: Bearer <token>` from [POST /users/login](/docs/developer/api-reference/auth/post-users-login).

Workspace-scoped routes often need header `X-Group-Id` with your active group ObjectId.

See [Authentication](/docs/developer/authentication) for the full flow.

## Servers

| Environment | Base URL |
|-------------|----------|
| Mock (Prism, default in docs) | `http://localhost:4010` |
| Local sandbox | `http://localhost:5005/api` |

Set `DOCUSAURUS_API_MODE=sandbox` to point the playground at your local backend.

## Operations by tag

- **[Health](/docs/developer/api-reference/health)** — 1 endpoints
- **[Auth](/docs/developer/api-reference/auth)** — 3 endpoints
- **[Groups](/docs/developer/api-reference/groups)** — 5 endpoints
- **[Users](/docs/developer/api-reference/users)** — 17 endpoints
- **[Documents](/docs/developer/api-reference/documents)** — 28 endpoints
- **[Chats](/docs/developer/api-reference/chats)** — 8 endpoints
- **[Admin](/docs/developer/api-reference/admin)** — 34 endpoints
- **[Billing](/docs/developer/api-reference/billing)** — 8 endpoints
- **[Connectors](/docs/developer/api-reference/connectors)** — 24 endpoints
- **[Webhooks](/docs/developer/api-reference/webhooks)** — 1 endpoints
- **[Internal](/docs/developer/api-reference/internal)** — 1 endpoints
- **[Setup](/docs/developer/api-reference/setup)** — 1 endpoints

## Rate limiting

`100` requests per `15` minutes per IP on `/api/*` (sandbox).

## Related

- [Developer setup](/docs/developer/setup)
- [Error handling](/docs/developer/error-handling)
