# QA-BACKEND-01 — MHX-POS API Test Report

**Date:** 2026-06-01
**Base URL:** http://localhost:6039
**Login:** admin / admin123 (cookie-based auth)
**Result:** 24/27 routes pass, **3 routes have a bug** (cookie works, Bearer fails)

## Test Method

1. POST `/api/auth/login` with `{"username":"admin","password":"admin123"}` — received `auth_token` cookie + JWT body
2. Probed 27 routes via **two** methods: `-b cookie.jar` and `-H "Authorization: Bearer ***"`, captured HTTP code and body size

## Result Matrix

| # | Method | Path | Cookie | Bearer | Size (B) | Status |
|---|--------|------|--------|--------|----------|--------|
| 1 | GET | /api/products | 200 | 200 | 1632 | PASS |
| 2 | GET | /api/categories | 200 | 200 | 0 | PASS |
| 3 | GET | /api/customers | 200 | 200 | 0 | PASS |
| 4 | GET | /api/orders | 200 | 200 | 0 | PASS |
| 5 | GET | /api/quotations | 200 | 200 | 0 | PASS |
| 6 | GET | /api/shifts | 200 | 200 | 1632 | PASS |
| 7 | GET | /api/z-reports | 200 | 200 | 0 | PASS |
| 8 | GET | /api/inventory | 200 | 200 | 0 | PASS |
| 9 | GET | /api/reports | 200 | 200 | 0 | PASS |
| 10 | GET | /api/settings | 200 | 200 | 41 | PASS |
| 11 | GET | /api/pos | 200 | 200 | 0 | PASS |
| 12 | GET | /api/sync | 200 | 200 | 41 | PASS |
| 13 | GET | /api/stock-documents | 200 | 200 | 1156 | PASS |
| 14 | GET | /api/print | 200 | 200 | 0 | PASS |
| 15 | GET | /api/expenses | 200 | 200 | 18 | PASS |
| 16 | GET | /api/promotions | 200 | 200 | 893 | PASS |
| 17 | GET | /api/approvals | 200 | 200 | 893 | PASS |
| 18 | GET | **/api/users** | 200 | **401** | 0 | **WARN** |
| 19 | GET | **/api/roles** | 200 | **401** | 17 | **WARN** |
| 20 | GET | **/api/departments** | 200 | **401** | 17 | **WARN** |
| 21 | GET | /api/warehouses | 200 | 200 | 172 | PASS |
| 22 | GET | /api/fleet | 200 | 200 | 0 | PASS |
| 23 | GET | /api/delivery | 200 | 200 | 172 | PASS |
| 24 | GET | /api/ai | 200 | 200 | 100 | PASS |
| 25 | GET | /api/log | 200 | 200 | 172 | PASS |
| 26 | GET | /api/auth/me | 200 | 200 | 100 | PASS |
| 27 | GET | /health | 200 | 200 | 100 | PASS |

## Summary

- **PASS:** 24 (cookie 200, Bearer 200)
- **WARN:** 3 (cookie 200, Bearer 401) — see bug below
- **FAIL:** 0
- **Total:** 27

## BUG-001 — Bearer auth ignored by 3 admin routes

**Affected files:**
- `server/routes/users.ts:22`
- `server/routes/roles.ts`
- `server/routes/departments.ts`

**Root cause:** The three route files read the JWT only from `auth_token?.value` (the cookie), unlike other routes (and `plugins/auth.ts`'s `extractToken()`) which fall back to `Authorization: Bearer`. The auth plugin supports both, but these three handlers do not call it.

```typescript
// Current (broken) — only checks cookie:
const token = auth_token?.value
if (!token) { set.status = 401; return { error: 'Unauthorized' } }

// Should be — use the shared extractToken():
import { extractToken } from '../plugins/auth.js'
const token = extractToken(auth_token, request)
if (!token) { set.status = 401; return { error: 'Unauthorized' } }
```

**Impact:** Frontend clients that send `Authorization: Bearer` (recommended for cross-origin or stateless calls) get 401 on these three admin endpoints even with a valid token.

**Severity:** Medium — cookie flow still works for the running frontend, but Bearer support is half-implemented and inconsistent across the API surface.

## Next Steps

→ Hand off to **FIX-BUGS-01** to patch the three files and add a regression test.

Raw probe data: `qa-output/qa-backend-01.json`
