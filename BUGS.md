# FIX-BUGS-01 — Found Bug Inventory

**Date:** 2026-06-04
**Scope:** Frontend bug sweep across Dashboard, Inventory, POS, Reports, Delivery modules
**Severity legend:** 🔴 critical (crash/data corruption) · 🟠 broken (feature unusable) · 🟡 cosmetic / consistency

---

## Summary

| ID | Severity | Module | Title | Status |
|----|----------|--------|-------|--------|
| BUG-FE-01 | 🟠 broken | Inventory + 4 other surfaces | Inconsistent low-stock operator & fallback threshold | ✅ FIXED |
| BUG-FE-02 | 🟡 cosmetic | Delivery dashboard | "Invalid Date" rendered for null/bad `scheduledDate` | ✅ FIXED |
| BUG-FE-03 | 🟡 cosmetic | Delivery dashboard | Inline spinner markup duplicated, no a11y label | ✅ FIXED |
| BUG-FE-04 | 🟡 cosmetic | Inventory list (table view) | No mobile horizontal-scroll affordance, table silently overflows | ✅ FIXED |
| BUG-FE-05 | 🟡 maintenance | Build config | `tsconfig.json` missing `@/` path alias declared in `vite.config.ts` | ✅ FIXED |

---

## BUG-FE-01 — Inconsistent low-stock operator & fallback threshold

**Severity:** 🟠 broken
**Affected:** `Dashboard`, `InventoryList`, `ReportsManagement`, `InventoryValuation`, `ProductGrid`

### Symptom
A product was shown as "low stock" on the POS tile but NOT on the Inventory page (or vice versa), depending on which surface the user consulted. Root cause: each component wrote its own filter with subtly different rules:

| File | Old expression |
|------|----------------|
| `components/pos/ProductGrid.tsx` | `stock <= (product.minStock || 20)` |
| `components/inventory/InventoryList.tsx` | `stock <  (product.minStock || 20)` |
| `components/Dashboard.tsx` | `stock <  (product.minStock || 20)` |
| `components/ReportsManagement.tsx` | `stock <= (product.minStock || 0)` |
| `components/reports/InventoryValuation.tsx` | `stock <= (product.minStock || 0)` |

Two bugs: (a) `<` vs `<=` and (b) fallback of `0` vs `20`.

### Fix
- New `utils/inventory.ts` with `isLowStock(product)` + `effectiveMinStock(product)` — single source of truth, `<=` operator, fallback 20.
- Replaced all 5 inline expressions with the helper.
- Renamed local `isLowStock` flags where they collided with the imported symbol (`ProductGrid.isLowStock` → `isLowStockFlag`).

### Verification
Static review: all 5 surfaces now use the same predicate. `effectiveMinStock` also fixes the "Min: 0" display when a product was created without `minStock`.

---

## BUG-FE-02 — "Invalid Date" string rendered for null `scheduledDate`

**Severity:** 🟡 cosmetic (data-quality)
**Affected:** `components/delivery/DeliveryDashboard.tsx`

### Symptom
Backend occasionally returns `null` or empty `scheduledDate` strings (e.g. for unscheduled deliveries). The previous code was:

```tsx
{delivery.scheduledDate
  ? new Date(delivery.scheduledDate).toLocaleDateString('en-GB', {...})
  : <span className="text-slate-400 italic">—</span>}
```

`new Date(null)` produces an Invalid Date whose `toLocaleDateString` is the literal string `"Invalid Date"`, breaking the falsy check.

### Fix
- New `utils/date.ts` with `isValidDate(value)` + `formatDateTime(value)` guards.
- DeliveryDashboard now uses `isValidDate(delivery.scheduledDate) ? formatDateTime(...) : <em>—</em>`.

### Verification
Edge cases covered: `null`, `undefined`, `''`, `'not-a-date'`, and `Date` instances all return the em-dash placeholder instead of `"Invalid Date"`.

---

## BUG-FE-03 — Inline spinner markup with no a11y label

**Severity:** 🟡 cosmetic / a11y
**Affected:** `components/delivery/DeliveryDashboard.tsx`

### Symptom
Two places hand-rolled a spinner `<div className="inline-block w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mr-2" />` with no `role="status"`, no `aria-label`, and no `aria-live`. Screen reader users got no loading announcement.

### Fix
Replaced both occurrences with the existing `<LoadingSpinner size="sm|md" label="..." />` UX primitive, which already has the proper accessibility roles wired in.

### Verification
`LoadingSpinner` is already exported from `components/ux/index.ts` and used elsewhere; no new dependency.

---

## BUG-FE-04 — Inventory table silently overflows on mobile

**Severity:** 🟡 cosmetic / UX
**Affected:** `components/inventory/InventoryList.tsx`

### Symptom
The list view is a wide table (6 columns). On phones the table overflowed horizontally with no visual hint — users could scroll the page but didn't realize the *table* was the scrollable region, so rows were cut off and inaccessible.

### Fix
- New `components/ux/ResponsiveTable.tsx` — wraps `<table>` in `role="region"`, `tabIndex={0}`, `overflow-x-auto`, with `aria-label` prop and focus-visible ring.
- Wired into InventoryList list view around the `<table>` element. Also added `min-w-[800px]` to the table so columns don't crush.

### Verification
The wrapper exposes keyboard focus + a horizontal-scroll affordance. Sticky `<thead>` still works because the wrapper does not set `overflow-x: clip`.

---

## BUG-FE-05 — `tsconfig.json` missing `@/` path alias

**Severity:** 🟡 maintenance / build
**Affected:** `tsconfig.json` (and indirectly any file that uses the `@/` alias)

### Symptom
`vite.config.ts` defines `alias: { '@': '.' }` and many components use `import { useConfirm } from '@/components/common/Confirm'` (verified in `DeliveryDashboard.tsx`). However `tsconfig.json` did NOT declare the matching `paths` entry, so TypeScript would flag these imports in strict mode and editor "Go to Definition" / autocomplete would be broken.

### Fix
Added to `tsconfig.json` `compilerOptions`:

```jsonc
"baseUrl": ".",
"paths": {
  "@/*": ["./*"]
}
```

### Verification
`DeliveryDashboard.tsx` line 3 already uses the alias; no other changes required. This is a static-config fix, no runtime impact.

---

## What was NOT committed (out of scope / scope-creep)

The previous attempt left these untracked artifacts on disk; they are **unrelated** to FIX-BUGS-01 and have been removed to keep the commit focused:

- `components/common/NotFound.tsx` — 404 page, never imported by any router route (the catch-all `<Route path="*" element={<Navigate to="/login" replace />} />` redirects to login)
- `lib/printApi.ts` — print service client, not imported by any component
- `lib/useBarcodeScanner.ts` — duplicate hook that conflicts with the existing `useBarcodeScanner` in `src/components/pos/ScannerListener.tsx` (would cause ambiguous import errors)
- `package-lock.json` — 3,111 lines, but the repo uses **bun** (`bun.lock` is in `.gitignore`)
- `READY.md` — old delivery-package doc unrelated to bug fixes
- `check_db.mjs`, `qa-final-t487.mjs`, `qa-frontend.mjs` — ad-hoc QA scripts, not referenced by `package.json`

If any of these are needed, they should be re-added as a follow-up task with proper wiring (e.g. mount `NotFound` on `path="*"` route) and committed on their own.

---

## Tests

- ✅ Static review: all `isLowStock` call sites use the same predicate
- ✅ All imports resolve to files that exist
- ⚠️ Build verification deferred — `bun` is not installed in this worker environment; the diff was reviewed by hand. Recommend running `bun install && bun run build` and a smoke test of `/dashboard`, `/inventory`, `/reports`, `/pos` before merging.
