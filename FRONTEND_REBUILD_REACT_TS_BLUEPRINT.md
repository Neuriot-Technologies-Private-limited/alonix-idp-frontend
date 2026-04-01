# Findout Frontend Rebuild Blueprint (React + TypeScript)

This document is your complete frontend reference to rebuild the same app from scratch in React + TypeScript.

It covers:
- app architecture
- routes and pages
- RBAC and group switching UX
- data models (TypeScript interfaces)
- API contract usage
- socket/event model
- styling/theme system
- implementation sequence

---

## 1) Product Scope

You are building a multi-tenant document intelligence app with:
- auth (login/signup)
- documents management
- chat over ingested documents
- admin dashboard for RBAC/group management

## Roles
- `COMPANY_ADMIN`
- `GROUP_ADMIN`
- `SEARCH_USER`

## Core rule
UI behavior is capability-driven and scoped to `activeGroupId`.

---

## 2) Current UI/UX Style to Replicate

From your existing screens/components:
- dark theme
- compact, table-first admin layout
- blue primary buttons
- subtle borders and muted secondary text
- left sidebar + main content shell
- top-level language switcher

Design tokens (recommended):
- background: deep navy/black
- panel: dark raised surfaces
- primary: blue
- text-primary: light gray/white
- text-secondary: muted gray
- success/warning/error semantic accents

---

## 3) Recommended Tech Stack (React TS)

- React 18 + TypeScript
- React Router v6
- Axios
- Socket.IO client
- i18next + react-i18next
- Optional: React Query (recommended for API caching)
- Optional UI libs: MUI icons/react-icons

---

## 4) App Architecture

## Top-level layers
1. **Core app shell**
   - layout, sidebar, navbar, language switch
2. **Auth + Context layer**
   - token, user, authContext (orgRole/groups/capabilities)
3. **Feature modules**
   - documents
   - chats
   - admin
4. **Infrastructure**
   - api client
   - socket manager
   - i18n
   - toast notifications

## Suggested folder structure

```text
src/
  app/
    App.tsx
    routes.tsx
    providers/
      AuthProvider.tsx
      ToastProvider.tsx
      I18nProvider.tsx
  core/
    api/
      client.ts
      endpoints.ts
    auth/
      authStorage.ts
      guards.tsx
    rbac/
      capabilities.ts
      roleUtils.ts
    socket/
      socketClient.ts
    types/
      auth.ts
      user.ts
      group.ts
      documents.ts
      chat.ts
  features/
    auth/
      LoginPage.tsx
      SignupPage.tsx
    documents/
      DocumentsPage.tsx
      components/
    chat/
      ChatPage.tsx
      components/
    admin/
      AdminDashboardPage.tsx
      components/
  components/
    LanguageSwitcher.tsx
    ForbiddenPage.tsx
    PrivateRoute.tsx
    Loader.tsx
    EmptyState.tsx
  styles/
    tokens.css
    globals.css
```

---

## 5) Routing Blueprint

## Public
- `/login`
- `/signup`

## Protected
- `/documents` (requires `GROUP_DOC_VIEW`)
- `/chats` (requires `GROUP_CHAT_USE`)
- `/dashboard` (requires org role `COMPANY_ADMIN`)
- `/forbidden`

## Guard behavior
- no token -> redirect `/login`
- insufficient role/capability -> `/forbidden`
- if context not loaded yet -> allow temporary render + loading shell, then evaluate

---

## 6) TypeScript Data Models

Use these core interfaces:

```ts
export interface UserDetails {
  id?: string;
  userID: string;       // legacy key
  userId: string;       // normalized key
  email?: string;
  groupID?: string;     // legacy
  groupId?: string;     // normalized
  groupName?: string;
}

export interface GroupContext {
  groupId: string;
  groupName: string;
  role: "GROUP_ADMIN" | "SEARCH_USER";
}

export interface AuthContextPayload {
  orgId: string | null;
  orgRole: "COMPANY_ADMIN" | "MEMBER" | null;
  groups: GroupContext[];
  activeGroupId: string | null;
  activeGroupRole: "GROUP_ADMIN" | "SEARCH_USER" | null;
  capabilities: string[];
}

export interface DocumentItem {
  fileId: string;
  fileName: string;
  fileType?: string;
  orgId?: string | null;
  groupId?: string;
  status?: string;
  ingestionStatus?: string | null;
  extractionStatus?: string | null;
  classificationStatus?: string | null;
  extractionResult?: unknown;
  classificationData?: unknown;
  extractedData?: unknown;
  errorMessage?: string;
  uploadDate?: string;
}

export interface ChatSession {
  session_id: string;
  title: string;
  collection_name?: string;
  last_updated?: string;
}
```

---

## 7) Auth + Context Flow

## Login
- call `/api/users/login`
- store:
  - `token`
  - `userDetails`
  - `authContext` (from login response or `GET /users/me/context`)
- route:
  - company admin -> `/dashboard`
  - others -> `/documents`

## Context refresh
- on app boot:
  - read token + local user
  - call `/api/users/me/context`
  - update `authContext`

## Group switch
- user chooses group in dropdown
- update local `activeGroupId`
- reconnect socket with new group
- reload feature data (documents/chats)

---

## 8) RBAC Capability Matrix (Frontend)

Use capability checks, not role label only.

Key capabilities in UI:
- `GROUP_DOC_VIEW`
- `GROUP_DOC_UPLOAD`
- `GROUP_DOC_INGEST`
- `GROUP_DOC_DELETE`
- `GROUP_CHAT_USE`

## UI enforcement
- page access -> route guards
- button/action access -> disabled/hidden with reason

Examples:
- Search user:
  - can access `/documents` and `/chats`
  - upload/ingest/delete disabled
- Group admin:
  - full docs + chat in assigned group
- Company admin:
  - dashboard and admin management pages

---

## 9) API Contract Mapping (Frontend Usage)

Base: `API_BASE/api`

## Auth
- `POST /users/login`
- `POST /users/onboard`
- `GET /users/me/context`

## Admin
- `GET /admin/orgs/:orgId/groups`
- `POST /admin/orgs/:orgId/groups`
- `GET /admin/orgs/:orgId/users`
- `GET /admin/groups/:groupId/members`
- `POST /admin/groups/:groupId/members`
- `PATCH /admin/groups/:groupId/members/:userId`
- `DELETE /admin/groups/:groupId/members/:userId`

## Documents
Legacy:
- `/documents/*`

Scoped preferred:
- `/groups/:groupId/documents/*`

Frontend strategy:
- if `groupId` exists -> call scoped endpoint
- fallback to legacy only where needed

## Chats
Legacy:
- `/chats/*`

Scoped preferred:
- `/groups/:groupId/chats/*`

---

## 10) Socket/Event Model

Connection input:
- `userId`
- `groupId`

Events consumed:
- `job.update`

Event effect:
- update document statuses in place
- trigger result refresh on completion
- show toast on success/failure

Important:
- reconnect socket on group switch
- detach listeners on unmount

---

## 11) Page-by-Page Behavior

## Login
- username/email + password
- token/context persistence
- role-based redirect

## Signup
- account onboarding fields
- simple flow + redirect to login

## Documents
- sidebar (docs/chat/dashboard if admin)
- optional group switcher in header
- documents table
- actions based on capabilities:
  - upload
  - ingest/batch ingest
  - extract/classify
  - delete
- results modal and job history

## Chat
- session list sidebar
- new chat
- ask question API call
- sources rendering + citation click handling
- optional upload controls in sidebar (capability-aware)

## Admin Dashboard
- org summary (counts)
- create group
- group membership assignment/update/remove

## Forbidden
- explicit denied message + quick navigation

---

## 12) State Management Blueprint

Minimum global state:
- `token`
- `userDetails`
- `authContext`
- `activeGroupId`

Feature-local state:
- Documents:
  - list, loading, selected rows, upload/delete in progress, result modal
- Chat:
  - sessions, active session, messages, input, loading, selected doc
- Admin:
  - groups/users/members and mutation loading

Recommended migration:
- move localStorage + context sync logic into `AuthProvider`
- expose hooks:
  - `useAuth()`
  - `useRbac()`
  - `useActiveGroup()`

---

## 13) i18n Blueprint

Current languages:
- English (`en`)
- Portuguese (`pt`)

Use:
- `i18next-browser-languagedetector`
- localStorage caching for selected language

Keep all user-facing strings translatable (including errors/toasts/tooltips).

---

## 14) Error, Empty, Loading UX Patterns

For each page define:
- loading skeleton/spinner
- empty state with primary CTA
- API error toast/banner + retry path
- permission denied handling (page-level or action-level)

Never silently fail on restricted action.

---

## 15) Build Plan (from scratch)

## Phase 1: Core setup
- initialize React TS app
- routing
- api client
- auth storage
- language + toast providers

## Phase 2: Auth + guards
- login/signup pages
- private route
- forbidden route
- auth context fetch

## Phase 3: Documents + chat baseline
- documents page with list/actions
- chat page with sessions/messages
- socket job updates

## Phase 4: RBAC + group switching
- capabilities in context
- group switcher
- capability-aware buttons and routes

## Phase 5: Admin module
- dashboard
- group management actions
- membership role management

## Phase 6: hardening
- scoped endpoint preference
- fallback compatibility
- QA pass using checklist

---

## 16) Migration Notes (Current app -> TS rebuild)

- Keep backend contracts stable first; rewrite frontend module by module.
- Start with auth and documents first (highest usage path).
- Keep legacy key compatibility during migration:
  - `userID` + `userId`
  - `groupID` + `groupId`
- Use adapter functions to normalize all backend responses in one place.

---

## 17) Final QA Gates

Before release, verify:
- role-based route protection works
- group switch updates both API scope and socket scope
- search users cannot trigger manage actions
- admin can manage users/groups
- chat and docs legacy behaviors are unchanged for normal users
- no console/runtime errors

Use: `RBAC_MANUAL_QA_CHECKLIST.md`

---

## 18) Deliverables You Should Build

1. Type-safe `AuthProvider` with context synchronization
2. Route guard system (`PrivateRoute` + capability checks)
3. Reusable `GroupSwitcher` component
4. `DocumentsPage` with capability-aware action bar
5. `ChatPage` with scoped sessions and source handling
6. `AdminDashboardPage` for org/group/member operations
7. `ForbiddenPage`
8. API endpoint layer with scoped/legacy fallback strategy

This blueprint is enough to rebuild the same product in React + TypeScript with cleaner architecture than the current JS implementation.
