# 🚀 Phase 15 — Advanced Reports Features — Execution Guide

**Date**: 2026-05-19  
**Status**: READY FOR TESTING  
**Test Framework**: Playwright CLI  
**Test File**: `tests/e2e/phase15-comprehensive.spec.ts`

---

## 📋 Pre-Execution Checklist

Before running the tests, ensure:

- [ ] PostgreSQL running: `docker-compose up -d`
- [ ] Database migrations applied: `npm run db:push`
- [ ] Node dependencies installed: `npm install`
- [ ] Local app running on http://localhost:3000
- [ ] Test users created in database (see below)
- [ ] Environment variables configured (`.env.local`)

---

## 👥 Test Users

All test users have the password: **`Test@12345`**

| # | Email | Name | Plan | Status |
|---|-------|------|------|--------|
| 1 | carlos.garcia@test.com | Carlos García | Gratis | Ready |
| 2 | maria.lopez@test.com | María López | Pro | Ready |
| 3 | juan.rodriguez@test.com | Juan Rodríguez | Premium | Ready |
| 4 | ana.martinez@test.com | Ana Martínez | Gratis | Ready |

---

## 🔧 Database Migrations

The following migrations have been prepared and must be applied:

### 0005_phase15_archive_share.sql
- Adds `archived_at` column to `custom_reports`
- Adds `share_token` and `share_token_expires_at` columns
- Creates indexes for performance

### 0006_phase15_schedules.sql
- Creates new `report_schedules` table
- Defines frequency (daily/weekly/monthly)
- Tracks next run time and last execution

**To apply:**
```bash
npm run db:push
```

---

## 🎮 Execution Steps

### Option 1: Run All Tests
```bash
npm run test:e2e -- tests/e2e/phase15-comprehensive.spec.ts
```

### Option 2: Run Specific User Tests
```bash
# Run only Carlos García tests
npm run test:e2e -- tests/e2e/phase15-comprehensive.spec.ts -g "Carlos García"

# Run only Maria López tests
npm run test:e2e -- tests/e2e/phase15-comprehensive.spec.ts -g "María López"
```

### Option 3: Run with UI Mode (Visual Debugging)
```bash
npm run test:e2e -- tests/e2e/phase15-comprehensive.spec.ts --ui
```

### Option 4: Run with Video Recording
```bash
npm run test:e2e -- tests/e2e/phase15-comprehensive.spec.ts --video=on
```

---

## 📊 Expected Test Flow

For each user, the tests will:

1. **Login** — Authenticate with credentials
2. **Create Catalog** — Create a new catalog for testing
3. **Add Products** — Create products (various quantities per plan)
4. **Design Configuration** — Customize catalog appearance
5. **View Publicly** — Access catalog via public link
6. **Purchase** — Complete full checkout with **CASH PAYMENT**
7. **Analytics** — Access analytics dashboard
8. **Export History** — Verify export tracking works
9. **Date Picker** — Test custom date range filtering
10. **Archive** — Archive and restore reports
11. **Share Link** — Generate and verify guest share links
12. **Report Data** — Verify orders appear in reports

---

## 💳 Cash Payment Method

✅ **New Feature**: Orders can now be completed with cash payment

**Flow:**
1. Customer selects "Pagar al recibir" (Pay on delivery)
2. Order payment method recorded as `cash`
3. Order status set to `pending` (awaiting payment)
4. Confirmation shows: "Pedido pendiente de pago en efectivo"
5. Payment appears in reports as pending

**Backend Implementation:**
- New endpoint: `PATCH /api/v1/orders/[id]/payment`
- Accepts `{ method: 'cash', status: 'pending' }`
- Records in order's `paymentJson` field

---

## 📈 Phase 15 Features Tested

### 1. Export History ✅
- Records all exports (downloads + emails)
- Stores metadata: format, size, delivery type
- Endpoint: `GET /api/reports/[id]/history`

### 2. Date Picker ✅
- Custom date range selection in analytics
- Button: "Personalizado"
- Filters report data dynamically

### 3. Archive/Restore ✅
- Soft-delete reports (not permanently removed)
- "Reportes Archivados" section
- One-click restore functionality

### 4. Guest Share Links ✅
- 7-day expiring share tokens
- Public access without authentication
- Endpoint: `GET /api/reports/share/[token]`

### 5. Scheduled Delivery ✅
- Daily/weekly/monthly automated emails
- Vercel Cron integration (6 AM UTC daily)
- Configurable export format (CSV/XLSX/PDF)
- Endpoint: `POST /api/cron/report-delivery`

---

## 📁 Test Artifacts

After running tests, outputs are saved to:

```
playwright-report/
├── index.html          # Main HTML report
├── test-results/       # Detailed test results
└── trace/              # Execution traces
```

View the report:
```bash
npm run test:show-report
# or
npx playwright show-report
```

---

## 🔍 Debugging

### View Console Output
```bash
npm run test:e2e -- tests/e2e/phase15-comprehensive.spec.ts --reporter=verbose
```

### Run Single Test
```bash
npm run test:e2e -- tests/e2e/phase15-comprehensive.spec.ts -g "User: Carlos García.*Login"
```

### Debug with Inspector
```bash
npm run test:e2e -- tests/e2e/phase15-comprehensive.spec.ts --debug
```

---

## 📝 Success Criteria

✅ All tests should pass with:
- 4 users successfully testing all flows
- 20+ total products created
- Cash payment method working
- Export history tracked
- Date picker filtering
- Archive/restore functionality
- Guest share links generated
- Scheduled reports configured

---

## 🚨 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Order not found" | Verify order was created successfully |
| "Payment endpoint 404" | Ensure `/api/v1/orders/[id]/payment` route exists |
| "Share link 401" | Verify `shareToken` column exists in DB |
| "Schedule not found" | Run `npm run db:push` to create `reportSchedules` table |
| "Timeout waiting for navigation" | Increase timeout in test or check app responsiveness |

---

## 📞 Next Steps

1. ✅ Run migrations: `npm run db:push`
2. ✅ Start app: `npm run dev`
3. ✅ Run tests: `npm run test:e2e -- tests/e2e/phase15-comprehensive.spec.ts`
4. ✅ Review report: `npm run test:show-report`
5. ✅ Document results in `PHASE15_E2E_EXECUTION_RESULTS_*.md`

---

**Last Updated**: 2026-05-19  
**Prepared By**: Claude Code  
**Framework**: Playwright CLI v1.44+
