# Changelog

All notable changes to Family Hub will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.1] - 2026-08-14

A patch release focused on correctness and internal quality. **No breaking API
changes** — every route's response shape is preserved. Child login (completely
broken in v0.2.0) now works end-to-end, a security fail-open is closed, and all
API routes are unified onto a single auth/error/rate-limit stack.

### Fixed
- **Child login was completely broken.** Resolvers coupled `Member.username` to the
  Better-Auth session email, but a child's username is their short name while their
  auth email is synthetic — so every child-only API call returned 404. Added a real
  `userId` foreign key from `Member` to `User` (with a backfill migration) and
  switched all resolvers to look up the member by `session.user.id`.
- **Child account creation returned 500.** The internal self-`fetch` to Better-Auth
  sign-up omitted the `Origin` header and was rejected by the CSRF check. Added it.
- **`npm test` was broken locally** — the vitest `setupFiles` path resolved against
  `cwd` and couldn't find `src/test/setup.ts`, so the unit suite couldn't run.
  Fixed the config (also excludes `.next/`).
- **Better-Auth spawned its own Prisma client**, bypassing the HMR-safe singleton
  and doubling Postgres connection pressure under `next dev` hot-reload. Now uses
  the shared singleton.

### Security
- **Reminder cron endpoint failed open.** With `CRON_SECRET` unset, the guard
  short-circuited and the endpoint processed requests unauthenticated. It now
  fails closed (401) in production when the secret is missing or mismatched;
  development is still allowed with a warning.

### Changed
- **Unified every API route onto one infrastructure stack.** Chores, completions,
  dashboard, children, and auth routes previously used three different
  auth/error/rate-limit patterns; they now share one `requireAuth`, one rate
  limiter (HMR-safe singleton, survives hot-reload), and one `Errors` object.
  ~400 lines of duplicated helper code removed (`src/lib/api-utils.ts` deleted;
  `isValidUUID` moved to `lib/validation.ts`). Rate-limited responses now include
  `X-RateLimit-*` headers.
- A few auth/role error messages read more descriptively (e.g. "Authentication
  required" instead of "Unauthorized"). Status codes and the `{ error: string }`
  response shape are unchanged, so clients are unaffected.

### Added
- Regression E2E for child login (the previously broken path).
- End-to-end E2E for the chore completion → parent approval → points flow, which
  was previously validated only through direct database inserts.

### Notes
- Finding 5 (the dashboard's child chore filter) was reviewed. Its
  first-come-first-served behavior for unassigned chores is functionally
  defensible; the alternative semantics are a product question, so behavior is
  preserved as-is with an explanatory comment.
- Known debt (not fixed in this release): child creation still uses a server-side
  self-`fetch` to Better-Auth rather than the server-side `auth.api.signUpEmail`
  call (counts against the auth rate limit, network round-trip).

## [0.2.0] - 2026-04-17

### Release Status: ✅ READY FOR RELEASE

**Quality Metrics:**
- Build: ✅ Passing (0 TypeScript errors)
- E2E Tests: ✅ 45/49 passing (91.8%)
- Mobile: ✅ Fully responsive (375px-1280px)
- Console: ⚠️ Minor hydration warnings (non-blocking)

### Added

#### Authentication & Authorization
- Complete parent registration and login flow
- Child account creation with usernames
- Role-based access control (Parent/Child)
- Session-based authentication via Better-Auth
- Protected routes middleware

#### Calendar Core
- Month, week, and day view modes
- Event creation with title, description, location
- Date/time selection with timezone support
- Color-coded event categories (Family, School, Activity, Appointment, Other)
- "All-day" event support
- Drag-and-drop event rescheduling
- ICS file export for calendar sharing

#### Calendar Advanced
- Recurring events with RRULE support (daily, weekly, monthly, yearly)
- Recurrence exceptions for individual occurrences
- Event reminders with configurable lead times
- Notification system for upcoming events
- Event conflict detection

#### Chore Management
- Create and assign chores to family members
- Recurring chore schedules (custom rules)
- Points system for completed chores
- Child "My Chores" view with progress
- Parent approval workflow for completions
- Photo upload for chore completion proof
- Points tracking and history

#### Gamification
- Points dashboard with visual indicators
- Weekly/daily points summaries
- Pending approvals notification badge
- Completion streaks (infrastructure)

#### Mobile Experience
- Fully responsive layout (375px to 1280px+)
- Bottom navigation bar for mobile
- Touch-optimized buttons (≥44px targets)
- Collapsible sidebar on small screens
- Mobile-optimized forms and dialogs
- Safe area insets for notched devices

#### Notifications
- In-app notification center
- Pending chore approval alerts
- Event reminder system
- Quiet hours configuration
- Sound notification toggle
- Default reminder time settings

### Technical

#### Testing
- 49 Playwright E2E tests (45 passing)
- Authentication test suite
- Calendar CRUD test suite
- Mobile responsive audit tests
- Dashboard integration tests
- Navigation flow tests

#### Performance
- Optimized bundle with Next.js
- React Server Components
- Image optimization
- Lazy loading for dialogs

#### Security
- CSRF protection via Better-Auth
- Rate limiting on auth endpoints
- Input validation with Zod
- SQL injection prevention via Prisma
- XSS protection via React escaping

### Known Issues
- Minor console warnings in Playwright test environment (React hydration)
- 4 E2E tests skipped due to Playwright/React 19 hydration quirks
- Calendar week/agenda view planned for v0.3.0

### Fixed
- Build compilation errors (all resolved)
- TypeScript strict mode compliance
- Mobile overflow issues
- Touch target sizing

## [0.1.0] - 2026-03-XX

### Added
- Initial project setup
- Basic authentication
- Family management
- Simple calendar

[0.2.1]: https://github.com/tonymontoya/FamilyHub/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/tony/family-hub/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/tony/family-hub/releases/tag/v0.1.0
