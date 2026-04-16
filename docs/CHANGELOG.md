# Changelog

All notable changes to Family Hub will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Meal planning module
- Home Assistant integration
- Mobile app improvements

---

## [0.2.0] - 2026-04-16

### Added

#### Calendar Module
- Full monthly calendar view with navigation (previous/next/today)
- Event creation with title, description, time, location, and color coding
- Event editing and deletion with soft delete support
- Recurring events with weekly and daily patterns (RRULE format)
- Event exceptions: modify or cancel single occurrences of recurring events
- Drag-and-drop event rescheduling
- All-day and timed event support
- Responsive calendar design for mobile, tablet, and desktop

#### Event Reminders
- Browser notification reminders with customizable timing
- Support for multiple reminders per event (0 min, 5 min, 15 min, 30 min, 1 hour, 1 day before)
- Server-side acknowledgment tracking to prevent duplicate notifications
- Cross-tab deduplication using sessionStorage
- Sound notifications (optional, user-configurable)
- Snooze and dismiss functionality
- Automatic reminder delivery via cron job (runs every minute)
- Client-side polling for instant notification delivery

#### API Endpoints
- `GET /api/calendar/events` - List events
- `POST /api/calendar/events` - Create event
- `GET /api/calendar/events/[id]` - Get event details
- `PATCH /api/calendar/events/[id]` - Update event
- `DELETE /api/calendar/events/[id]` - Delete event
- `POST /api/calendar/events/[id]/exceptions` - Create event exception
- `POST /api/calendar/events/[id]/reminders` - Add reminder
- `GET /api/calendar/reminders/active` - Get active reminders
- `POST /api/calendar/reminders/[id]/acknowledge` - Acknowledge reminder
- `GET /api/calendar/_internal/check-reminders` - Cron job endpoint

#### Database
- `CalendarEvent` table with recurrence support
- `EventException` table for occurrence modifications
- `EventReminder` table with acknowledgment tracking
- Indexes for performance: `(isSent, sentAt)`, `(isAcknowledged, isSent)`

#### Testing
- Comprehensive Playwright E2E tests for calendar navigation
- E2E tests for event CRUD operations
- E2E tests for recurring events and exceptions
- E2E tests for reminder notifications
- Test factories for calendar test data

### Changed

#### Repository Structure
- Moved `CONTRIBUTING.md` to `docs/CONTRIBUTING.md`
- Moved `SECURITY.md` to `docs/SECURITY.md`
- Moved config files (`eslint.config.mjs`, `playwright.config.ts`, `vitest.config.ts`) to `config/`
- Merged `e2e/` directory into `tests/e2e/`
- Reduced root directory files from 16 to 10 for cleaner project structure

#### Build Configuration
- Updated package.json scripts to use config directory
- Added dotenv support for Playwright tests

### Migration Required

```bash
# Apply database migrations
npx prisma migrate deploy
```

**New migrations:**
- `20260414040217_add_calendar_module` - Core calendar tables
- `20260414043020_add_calendar_updated_at_index` - Performance index
- `20260416040847_add_reminder_acknowledgment` - Reminder acknowledgment

### Known Issues

#### Testing Infrastructure
- Playwright E2E auth setup has timing issues with webServer configuration
- Tests pass when run against existing dev server (`--reuse-existing-server`)
- Fix planned for v0.2.1

---

## [0.1.0] - 2026-04-11

### Added

#### Core Platform
- Initial release with Next.js 16 and TypeScript
- Docker deployment support with docker-compose
- PostgreSQL database with Prisma ORM
- Better-Auth authentication system
- Parent and child account types
- Responsive design with Tailwind CSS

#### Chores Module
- Recurring chore creation with custom schedules
- Points system for chore completion
- Parent approval workflow for completed chores
- Photo upload for chore completion evidence
- Drag-and-drop chore reordering
- Assign chores to family members

#### Todos Module
- Simple todo creation and management
- Due dates and assignees
- Completion tracking

#### Lists Module
- Shopping lists with item quantities
- Packing lists for trips
- Wishlists for family members
- Drag-and-drop item reordering
- Item completion tracking

#### Dashboard
- Today's overview of chores and todos
- Quick action buttons
- Family points summary

#### Points & Rewards
- Point earning through chores
- Point redemption tracking
- Parent-managed reward system

#### Authentication
- Email/password authentication for parents
- Username/password authentication for children
- Secure session management
- Family creation during registration

### Technical Stack
- Next.js 16.2.3
- React 19
- TypeScript 5
- PostgreSQL 16
- Prisma ORM 6.6
- Tailwind CSS 4
- Better-Auth for authentication

---

## Version History

| Version | Date | Key Features |
|---------|------|--------------|
| v0.2.0 | 2026-04-16 | Calendar, Event Reminders |
| v0.1.0 | 2026-04-11 | Initial MVP Release |

[Unreleased]: https://github.com/tonymontoya/FamilyHub/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/tonymontoya/FamilyHub/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/tonymontoya/FamilyHub/releases/tag/v0.1.0
