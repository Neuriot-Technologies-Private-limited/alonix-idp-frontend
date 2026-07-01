---
title: Release Notes
description: Recent product and documentation updates for Alonix.
sidebar_position: 1
---

# Release Notes


## 1.0.0 — 2026-06-29

### Added

- Initial Docusaurus documentation portal (`alonix-docs`)
- OpenAPI 3.0 spec with interactive Scalar playground
- Prism mock server for safe API testing
- Mock / sandbox mode switch via `DOCUSAURUS_API_MODE`
- Auth guide, error handling guide, endpoint reference
- Frontend overview and architecture docs
- `npm run sync:openapi` — merge full backend spec from `alonix-idp-node-backend`

### Documented endpoints

- `POST /api/users/login` (and `/api/auth/login` alias)
- `GET /api/users/me`
- `GET /api/users/me/context` (production)

### Notes

- Full backend OpenAPI coverage available after sync from `alonix-idp-node-backend/openapi/openapi.json`
- Backend live Swagger UI remains at `/api/docs` on the running server
