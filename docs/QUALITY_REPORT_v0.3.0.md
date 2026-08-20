# Family Hub v0.3.0 - Quality Analysis Report

**Date:** 2026-08-20
**Release Candidate:** v0.3.0 (minor — breaking API change)
**Test Environment:** Playwright Chromium; dockerized PostgreSQL (test DB on :5433)
**Baseline:** v0.2.2 (`a7ded14`)

---

## Executive Summary

| Metric | Status | Target | Result |
|--------|--------|--------|--------|
| Build (`next build`) | ✅ PASS | Zero errors | Compiles cleanly; `/todos` gone from route table |
| TypeScript (`tsc --noEmit`) | ✅ PASS | 0 errors | 0 errors |
| Lint | ⚠️ 2 pre-existing errors | 0 errors | Same two calendar-E2E `no-explicit-any` errors as v0.2.1/v0.2.2; nothing new |
| Unit tests (vitest) | ✅ PASS | Green | 76/76 passing |
| Unit TZ determinism | ✅ PASS | TZ-independent | 76/76 under `TZ=America/New_York` and `TZ=Pacific/Auckland` |
| E2E (Playwright, chromium) | ✅ PASS | Full tree green | 61 passed, 4 skipped (RC-only checks), 0 failed |
| DB migration | ✅ PASS | Applied cleanly | `20260820034601_drop_todos` on test DB |

**Release Recommendation:** ✅ **GO for v0.3.0 Release**

---

## What changed since v0.2.2

Two commits on top of the baseline:

1. `test(e2e)` — the pre-migration safety net (invest FIRST, migrate
   SECOND, per the v0.2.1 risk assessment):
   - 7 new UI specs/helpers: chores create/network-error/archive, children
     create/duplicate-409/reset-password/delete, approvals review, dashboard
     content. All provision their own family through the real API and sign
     in via the login form.
   - **Four real product defects the new coverage immediately surfaced:**
     `/chores/new` crashed on load (Base UI rejects `SelectItem value=""`);
     triple/double nested `<button>` triggers in `user-menu`,
     `notification-bell`, `sidebar`, `calendar-export` caused app-wide
     hydration errors (tree re-mounted mid-interaction).
   - Repaired the pre-existing `quality-audit` specs (user isolation, nav
     locator, h1 race, console-noise filter) — these were failing at the
     clean v0.2.2 baseline (verified via `git stash` A/B), not caused by
     this work.
2. `refactor(api)!` — the envelope unification + Todos removal:
   - 11 JSON routes migrated to `successResponse`/`createdResponse`; 2
     file-serving routes (`calendar/export`, `uploads/completions`)
     re-wrapped onto `withErrorHandling`.
   - 10 client files unwrap `.data` and read `error.message`.
   - Flat bridge (`withFlatErrorHandling`/`handleApiErrorFlat`) deleted from
     `src/lib/errors.ts` — one error format remains.
   - Todos module removed end-to-end (page, nav, types, `Todo` model +
     drop-table migration, seed/factories).

---

## Migration slices (route + clients + specs moved together)

| Slice | Routes | Clients | Verified by |
|-------|--------|---------|-------------|
| children | `children`, `children/[id]`, `reset-password` | children pages ×2, chores/new assignee fetch | children-ui, child-login, child-completion-approval, chore-management-ui |
| dashboard | `dashboard` | `use-dashboard` hook (page + notification-bell) | dashboard-content, dashboard/access, quality-audit |
| completions | `completions`, `approve`, `decline` | complete-chore-dialog, approvals page, pending-approvals, my-chores | approvals-ui, child-completion-approval |
| chores | `chores`, `chores/[id]`, `chores/today` | chores pages ×2, my-chores | chore-management-ui, child-login |
| misc | `auth/setup-family`, `calendar/export`, `uploads/completions/[filename]` | register page (status-only checks) | auth specs, quality-audit, calendar suite |

No consumer of any migrated body was left reading the old shape — verified
by grepping every `json()` call site in `src/` and `tests/` per slice.

---

## Detailed Test Results

### 1. Build & Compilation

```
✅ npm run build: SUCCESS — "✓ Compiled successfully", full route table
✅ TypeScript: 0 errors
```

### 2. Unit (vitest)

```
TZ=UTC:               76/76 passed
TZ=America/New_York:  76/76 passed
TZ=Pacific/Auckland:  76/76 passed
```

(Calendar recurrence suite unchanged this release; re-run as guard.)

### 3. E2E (chromium project, full tree)

```
61 passed, 4 skipped (mobile RC-only), 0 failed
```

New this release: 5 UI specs (chore-management-ui, children-ui,
approvals-ui, dashboard-content ×1, repaired quality-audit ×11) — all green
both standalone and in the full-tree run.

### 4. Database

```
✅ prisma migrate dev: 20260820034601_drop_todos applied (table + enum dropped)
✅ prisma generate: client matches schema (Todo model gone; tsc confirms)
```

---

## Known issues / deferred

- 2 pre-existing lint errors in calendar E2E specs (`no-explicit-any`).
- Finding 5 (dashboard child-filter semantics) — unchanged, documented in-code.
- Pre-0.2.2 non-UTC data caveat — unchanged (see v0.2.2 report).
- Calendar week/agenda view, meal planning, Home Assistant integration,
  and the Rewards backend build remain roadmap items (README).
