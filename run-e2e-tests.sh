#!/bin/bash

set -e

LOG_FILE="QA_Reports/PHASE15_E2E_EXECUTION_$(date +%Y_%m_%d_%H_%M_%S).log"
mkdir -p QA_Reports

echo "🚀 Phase 15 E2E Test Execution" | tee -a "$LOG_FILE"
echo "════════════════════════════════" | tee -a "$LOG_FILE"
echo "Start time: $(date)" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# Step 1: Start Docker
echo "1️⃣ Starting Docker container..." | tee -a "$LOG_FILE"
docker-compose up -d 2>&1 | tee -a "$LOG_FILE"
sleep 10

# Step 2: Verify PostgreSQL is running
echo "" | tee -a "$LOG_FILE"
echo "2️⃣ Verifying PostgreSQL connection..." | tee -a "$LOG_FILE"
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
  if docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
    echo "✓ PostgreSQL is ready" | tee -a "$LOG_FILE"
    break
  fi
  echo "  Waiting for PostgreSQL... (attempt $((attempt+1))/$max_attempts)" | tee -a "$LOG_FILE"
  sleep 2
  attempt=$((attempt+1))
done

if [ $attempt -eq $max_attempts ]; then
  echo "✗ PostgreSQL failed to start" | tee -a "$LOG_FILE"
  exit 1
fi

# Step 3: Apply migrations
echo "" | tee -a "$LOG_FILE"
echo "3️⃣ Applying database migrations..." | tee -a "$LOG_FILE"
npm run db:push 2>&1 | tee -a "$LOG_FILE" || true

# Step 4: Start the application
echo "" | tee -a "$LOG_FILE"
echo "4️⃣ Starting Next.js application..." | tee -a "$LOG_FILE"
npm run dev > /tmp/nextjs.log 2>&1 &
DEV_PID=$!
echo "  Dev server PID: $DEV_PID" | tee -a "$LOG_FILE"

# Wait for app to be ready
echo "5️⃣ Waiting for application to be ready..." | tee -a "$LOG_FILE"
max_attempts=60
attempt=0
while [ $attempt -lt $max_attempts ]; do
  if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✓ Application is ready at http://localhost:3000" | tee -a "$LOG_FILE"
    break
  fi
  echo "  Waiting for app... (attempt $((attempt+1))/$max_attempts)" | tee -a "$LOG_FILE"
  sleep 2
  attempt=$((attempt+1))
done

if [ $attempt -eq $max_attempts ]; then
  echo "✗ Application failed to start" | tee -a "$LOG_FILE"
  kill $DEV_PID 2>/dev/null || true
  docker-compose down
  exit 1
fi

# Step 6: Run Playwright tests with Chrome
echo "" | tee -a "$LOG_FILE"
echo "6️⃣ Running Playwright E2E tests (Chrome)..." | tee -a "$LOG_FILE"
echo "════════════════════════════════════════" | tee -a "$LOG_FILE"

PLAYWRIGHT_TIMEOUT=600000 npm run test:e2e -- tests/e2e/phase15-comprehensive.spec.ts \
  --project=chromium \
  --reporter=html \
  --reporter=list 2>&1 | tee -a "$LOG_FILE"

TEST_EXIT_CODE=$?

# Step 7: Copy test results
echo "" | tee -a "$LOG_FILE"
echo "7️⃣ Processing test results..." | tee -a "$LOG_FILE"

if [ -d "playwright-report" ]; then
  cp -r playwright-report QA_Reports/playwright-report-$(date +%Y_%m_%d_%H_%M_%S)
  echo "✓ Test report saved" | tee -a "$LOG_FILE"
fi

# Step 8: Stop the application
echo "" | tee -a "$LOG_FILE"
echo "8️⃣ Cleaning up..." | tee -a "$LOG_FILE"
kill $DEV_PID 2>/dev/null || true
sleep 2

# Step 9: Stop Docker
echo "9️⃣ Stopping Docker container..." | tee -a "$LOG_FILE"
docker-compose down 2>&1 | tee -a "$LOG_FILE"

# Final summary
echo "" | tee -a "$LOG_FILE"
echo "════════════════════════════════" | tee -a "$LOG_FILE"
echo "End time: $(date)" | tee -a "$LOG_FILE"

if [ $TEST_EXIT_CODE -eq 0 ]; then
  echo "✅ ALL TESTS PASSED!" | tee -a "$LOG_FILE"
else
  echo "❌ TESTS FAILED (exit code: $TEST_EXIT_CODE)" | tee -a "$LOG_FILE"
fi

echo "" | tee -a "$LOG_FILE"
echo "Log file: $LOG_FILE" | tee -a "$LOG_FILE"
echo "HTML Report: playwright-report/index.html" | tee -a "$LOG_FILE"

exit $TEST_EXIT_CODE
