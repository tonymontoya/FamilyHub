# Calendar E2E Tests

## Overview

Comprehensive Playwright E2E test suite for the Calendar module with event reminders.

## Test Files

| File | Description | Tests |
|------|-------------|-------|
| `navigation.spec.ts` | Calendar navigation and view switching | 9 tests |
| `events.spec.ts` | Event CRUD operations | 7 tests |
| `recurring.spec.ts` | Recurring events and exceptions | 5 tests |
| `reminders.spec.ts` | Reminder notifications | 6 tests |
| `visual.spec.ts` | Visual regression & accessibility | 9 tests |
| `utils.ts` | Test helpers and utilities | - |

## Running Tests

### Prerequisites
1. Dev server running: `npm run dev`
2. Database accessible with DATABASE_URL set
3. Playwright browsers installed: `npx playwright install chromium`

### Run All Calendar Tests
```bash
npx playwright test tests/e2e/calendar/ --project=chromium
```

### Run Specific Test File
```bash
npx playwright test tests/e2e/calendar/navigation.spec.ts --project=chromium
```

### Run with UI (for debugging)
```bash
npx playwright test tests/e2e/calendar/ --ui
```

### Run with HTML Report
```bash
npx playwright test tests/e2e/calendar/ --reporter=html
```

## Test Coverage

### Navigation Tests ✅
- Calendar page loads
- New Event button visible
- Current month displayed
- Previous/Next navigation
- Today button
- Day headers (Sun-Sat)
- Responsive viewports

### Event CRUD Tests ✅
- Open event form
- Create simple event
- Create event with time
- Create event with location
- Form validation
- Cancel creation
- Edit existing event

### Recurring Event Tests ✅
- Create weekly recurring event
- Recurring indicator visible
- Modify single occurrence
- Cancel single occurrence
- Cancelled occurrence styling

### Reminder Tests ✅
- Add reminder to new event
- Add reminder to existing event
- Remove reminder
- Active reminders display
- Acknowledge reminder
- No duplicate acknowledged reminders

### Visual & A11y Tests ✅
- Desktop viewport (1280x720)
- Tablet viewport (768x1024)
- Mobile viewport (375x667)
- Proper form labels
- Keyboard navigation
- Escape key closes form
- Focus indicators visible
- ARIA roles present
- No horizontal scroll on mobile

## Known Issues

### Auth Setup
The auth setup test (`tests/e2e/setup/auth.setup.ts`) currently requires:
1. DATABASE_URL environment variable accessible to Playwright
2. Clean database state (no conflicting test users)

**Workaround for local testing:**
Comment out the cleanup step and manually ensure no conflicting test users exist:
```typescript
// In auth.setup.ts, temporarily comment out:
// setup('clean up test data', async () => { ... })
```

**Recommended approach:**
Use a separate test database for E2E tests:
```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/familyhub_test" npm run test:e2e
```

## Manual Testing Checklist

If E2E tests cannot be run, verify manually:

### Basic Functionality
- [ ] Calendar page loads at `/calendar`
- [ ] Can create new event
- [ ] Can edit existing event
- [ ] Can delete event
- [ ] Events persist after refresh

### Recurring Events
- [ ] Can create recurring event
- [ ] Recurring events show on multiple dates
- [ ] Can modify single occurrence
- [ ] Can cancel single occurrence
- [ ] Cancelled events visually distinct

### Reminders
- [ ] Can add reminder to event
- [ ] Can remove reminder
- [ ] Browser notification permission requested
- [ ] Reminder notification appears at correct time
- [ ] Clicking "View" navigates to event
- [ ] Acknowledged reminder doesn't reappear

### Responsive Design
- [ ] Works on desktop (1920x1080)
- [ ] Works on tablet (768x1024)
- [ ] Works on mobile (375x667)
- [ ] No horizontal scroll on mobile

### Accessibility
- [ ] Form has proper labels
- [ ] Can navigate with keyboard
- [ ] Escape closes modals
- [ ] Focus indicators visible

## Test Factories

Test factories in `../factories/index.ts` provide:
- `createTestEvent()` - Create calendar events
- `createTestReminder()` - Create event reminders
- `createTestException()` - Create event exceptions
- `cleanupCalendarTestData()` - Clean up test data

## Future Improvements

1. **Visual Regression**: Add screenshot comparisons for calendar views
2. **Performance**: Add tests for calendar render time with many events
3. **Offline**: Test behavior when connection is lost
4. **Cross-browser**: Run tests on Safari and Firefox
5. **CI/CD**: Run tests in GitHub Actions before merge
