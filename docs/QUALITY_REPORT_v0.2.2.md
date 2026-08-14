# Family Hub v0.2.2 - Quality Analysis Report

**Date:** 2026-08-14
**Release Candidate:** v0.2.2 (patch)
**Test Environment:** Playwright Chromium; dockerized PostgreSQL (test DB on :5433)
**Baseline:** v0.2.1 (`89377da`)

---

## Executive Summary

| Metric | Status | Target | Result |
|--------|--------|--------|--------|
| Build (`next build`) | ✅ PASS | Zero errors | Compiles cleanly |
| TypeScript (`tsc --noEmit`) | ✅ PASS | 0 errors | 0 errors |
| Lint | ⚠️ 2 pre-existing errors | 0 errors | Both in untouched calendar E2E specs (`no-explicit-any`); no new errors introduced |
| Unit tests (vitest) | ✅ PASS | Green | 76/76 passing |
| Unit TZ determinism | ✅ PASS | TZ-independent | 76/76 under `TZ=Pacific/Auckland` and `TZ=America/New_York` |
| E2E (Playwright, chromium) | ✅ PASS | Core flows green | 49 passed, 4 skipped (RC-only quality-audit checks) |
| API contract | ✅ PRESERVED | No breaking changes | All response shapes unchanged |

**Release Recommendation:** ✅ **GO for v0.2.2 Release**

This is a patch release: the recurrence timezone bug (Finding 6), two more
recurrence defects surfaced by its new suite, the child-creation
`signUpEmail` refactor, and test-coverage backfill. No new features, no
breaking changes.

---

## What changed since v0.2.1

See `docs/CHANGELOG.md` for the full entry. Summary:

1. **fix:** date-only calendar values parsed to server-local midnight, shifting
   recurring events and breaking exception matching on non-UTC deployments
   (Finding 6). All date parsing now resolves to UTC wall-clock midnight via
   new `src/lib/calendar/dates.ts` primitives, wired into the events
   GET/POST, event update, exception, and occurrence-expansion hook paths.
2. **fix:** `recurrenceEnd` was never consulted — recurring series never
   ended. Expansion and validation now clamp to it.
3. **fix:** `getNextOccurrence` re-included cancelled dates until depth
   exhaustion (returned `null` instead of the next valid occurrence).
4. **refactor:** child creation uses server-side `auth.api.signUpEmail`
   (no self-fetch, no Origin hack, no shared rate-limit budget).
5. **test:** recurrence engine suite (33 tests, previously zero coverage) and
   RateLimiter suite (8 tests).
6. **hygiene:** stray debug `console.log`s removed; error-path
   `console.error` kept.

---

## Detailed Test Results

### 1. Build & Compilation

```
✅ npm run build: SUCCESS (Next.js 16.2.3)
✅ TypeScript: 0 errors
✅ npm run type-check: clean
```

### 2. Unit Tests (vitest)

```
✅ 76/76 passing (6 files)
   35 carried over from v0.2.1
   22 recurrence engine  (src/lib/calendar/recurrence.test.ts, NEW)
   11 date primitives    (src/lib/calendar/dates.test.ts, NEW)
    8 rate limiter       (src/lib/rate-limit.test.ts, NEW)
```

**Timezone determinism:** the full suite was run three times — `TZ=UTC`
(container default), `TZ=Pacific/Auckland` (UTC+12), and
`TZ=America/New_York` (UTC−4) — with identical results. The recurrence suite
uses explicit UTC instants exclusively, so it pins behavior rather than
inheriting the runner's timezone.

**Red-first evidence (TDD):** before the fix, the new recurrence suite failed
7 tests against the v0.2.1 engine: occurrence dates keyed off a non-midnight
start instant, mid-day instants rejected by `isValidOccurrence`, cancelled
occurrences never skipped by `getNextOccurrence` (×2), expansion past
`recurrenceEnd` (×3 across the three functions). All green after the fix.

### 3. End-to-End Tests (Playwright, chromium)

```
✅ 49 passed, 4 skipped (full tests/e2e tree, chromium project)
```

| Area | Status |
|------|--------|
| `auth/` (registration, login, logout, child-login regression) | ✅ |
| `calendar/` (events, navigation) | ✅ |
| `chores/` (incl. child-completion-approval safety net) | ✅ |
| `dashboard/` | ✅ |
| `mobile/`, `smoke.spec.ts` | ✅ |
| `quality-audit.spec.ts` | ✅ (4 RC-only checks skipped by design) |

The child-creation specs exercise the new `auth.api.signUpEmail` path through
the real API (parent creates child → child logs in → chore completion →
parent approval). Calendar specs exercise the re-parsed event routes. In this
container the stack runs under UTC, where the old code was accidentally
correct — unit tests under non-UTC TZs cover the shifted-deployment behavior
that E2E cannot reach locally.

### 4. API Contract

All response shapes are unchanged. Occurrence ids keep the
`{eventId}_{YYYY-MM-DD}` format. The only observable behavioral changes are
bug fixes: correct day placement and exception application outside UTC,
series that actually end, and `getNextOccurrence` skipping cancellations.

---

## Known Debt (carried forward)

- **Envelope split** (chores/completions/dashboard/children return flat
  `{ foo }`; lists/calendar return `{ success, data }`) — deferred to the
  v0.3.0 unification.
- **Rewards/Todos half-built surfaces** — `/rewards` UI has no API/model;
  `Todo` has a model but no API. Deferred to v0.3.0 scoping.
- **Finding 5** (dashboard child-filter semantics) — documented in-code,
  awaiting product input.
- Pre-0.2.2 rows written on non-UTC servers may display shifted by one day
  (unrecoverable ambiguity); re-saving affected events fixes them.
