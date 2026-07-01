---
sidebar_position: 4
---

# Error Handling

All {{brandName}} IDP API errors return JSON with a `message` field. Some responses include `code`, `details`, or `requestId`.

## Standard error shape

```json
{
  "message": "Human-readable description",
  "code": "OPTIONAL_MACHINE_CODE",
  "details": "Optional validation detail",
  "requestId": "req_01HYZABCDEF123456"
}
```

## HTTP status codes

| Status | Meaning | When it happens |
|--------|---------|-----------------|
| **400** | Bad Request | Missing/invalid body fields, validation failure |
| **401** | Unauthorized | Missing/invalid JWT, wrong password, expired token |
| **403** | Forbidden | Valid auth but insufficient role or scope |
| **404** | Not Found | Resource does not exist or not visible in org scope |
| **409** | Conflict | Duplicate email, invite conflict |
| **410** | Gone | Expired invite token |
| **413** | Payload Too Large | Upload exceeds limit (e.g. avatar 1.4MB) |
| **429** | Too Many Requests | Rate limit exceeded (100 req / 15 min per IP on `/api/*`) |
| **500** | Internal Server Error | Unexpected server failure — retry with backoff |

## Common error codes

| `code` | Status | Description |
|--------|--------|-------------|
| `EMAIL_NOT_VERIFIED` | 403 | User must verify email before login |
| `TOKEN_EXPIRED` | 401 | JWT expired — login again |
| `INVITE_EXPIRED` | 410 | Group invite link no longer valid |
| `CSRF_INVALID` | 403 | Missing or wrong CSRF token (browser mutations) |

## Examples

### 400 — Validation error

```json
{
  "message": "email and password are required"
}
```

### 401 — Invalid credentials

```json
{
  "message": "Invalid email or password"
}
```

### 401 — Missing token

```json
{
  "message": "Authentication required"
}
```

### 404 — Not found

```json
{
  "message": "User not found"
}
```

### 500 — Server error

```json
{
  "message": "Internal server error",
  "requestId": "req_01HYZABCDEF123456"
}
```

## Client handling pattern

```typescript
async function apiCall<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(body.message ?? res.statusText);
    (err as Error & {status: number; code?: string}).status = res.status;
    (err as Error & {code?: string}).code = body.code;
    throw err;
  }
  return body as T;
}
```

## Retry guidance

| Status | Retry? |
|--------|--------|
| 400, 401, 403, 404 | No — fix request or auth |
| 429 | Yes — exponential backoff |
| 500, 502, 503 | Yes — limited retries with `requestId` for support |

## Support

When reporting a **500** error, include the `requestId` from the response body and the approximate timestamp (UTC).
