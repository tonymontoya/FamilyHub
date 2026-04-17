#!/bin/bash
# E2E Test Runner for Family Hub
# Usage: ./scripts/run-e2e-tests.sh

set -e

echo "🧪 Family Hub E2E Test Runner"
echo "=============================="

# Check if dev server is running
echo -n "Checking dev server on localhost:3000... "
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✓ Running"
else
    echo "✗ Not running"
    echo ""
    echo "Please start: npm run dev"
    exit 1
fi

# Clean up
rm -rf playwright/.auth/* playwright-report/* test-results/*

echo ""
echo "🚀 Running E2E Tests"
echo "===================="
echo ""

FAILED=0

# Run tests by category
echo "1️⃣ Smoke Tests"
npx playwright test tests/e2e/smoke.spec.ts --project=chromium --reporter=line || FAILED=1

echo ""
echo "2️⃣ Auth Setup"
npx playwright test tests/e2e/setup/auth.setup.ts --project=setup --reporter=line || FAILED=1

echo ""
echo "3️⃣ Calendar Navigation"
npx playwright test tests/e2e/calendar/navigation.spec.ts --project=chromium --reporter=line || FAILED=1

echo ""
echo "4️⃣ Calendar Events"
npx playwright test tests/e2e/calendar/events.spec.ts --project=chromium --reporter=line || FAILED=1

echo ""
echo "5️⃣ Recurring Events"
npx playwright test tests/e2e/calendar/recurring.spec.ts --project=chromium --reporter=line || FAILED=1

echo ""
echo "6️⃣ Reminders"
npx playwright test tests/e2e/calendar/reminders.spec.ts --project=chromium --reporter=line || FAILED=1

echo ""
echo "7️⃣ Visual/Responsive"
npx playwright test tests/e2e/calendar/visual.spec.ts --project=chromium --reporter=line || true

echo ""
echo "=============================="
if [ $FAILED -eq 0 ]; then
    echo "✅ All critical tests passed!"
    echo "View report: npx playwright show-report"
    exit 0
else
    echo "❌ Some tests failed"
    echo "View report: npx playwright show-report"
    exit 1
fi
