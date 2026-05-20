# Phase 14: Advanced Analytics & Reporting — E2E Test Plan

**Date**: May 18, 2026  
**Test Scope**: Analytics Dashboard MVP (3 endpoints)  
**Reference Plans**: PHASE12_E2E_REGRESSION_PLAN_2026_05_18.md, PROJECT_STATUS_2026_05_18.md

---

## 📋 Test Scenarios

### 1. Analytics Page Navigation & Loading
**Objective**: Verify analytics page loads correctly and displays summary cards

**Test Steps**:
```
1. Login with Pro user (who has transaction data)
2. Navigate to sidebar → Analytics
3. Verify page URL is /app/analytics
4. Verify page title "Analytics"
5. Verify 4 summary cards display:
   - Ingresos totales ($X.XX)
   - Órdenes completadas (N)
   - Orden promedio ($X.XX)
   - Clientes únicos (N)
6. Verify cards have correct icons (DollarSign, ShoppingCart, ArrowUp, Users)
7. Verify no console errors
```

**Expected Results**:
- Page loads in <2 seconds
- All cards display numeric values (not NaN or undefined)
- Summary values match Phase 13 transactions
- Icons render properly

---

### 2. Sales Trend Chart
**Objective**: Verify sales trend chart loads and displays correctly

**Test Steps**:
```
1. From analytics page, scroll to "Ventas Diarias" section
2. Verify chart renders (line chart with 2 lines)
3. Verify x-axis shows dates
4. Verify y-axis shows values
5. Verify legend shows "Ingresos" (green) and "Órdenes" (blue)
6. Hover over chart points and verify tooltip shows data
7. Verify chart contains data points (not empty)
```

**Expected Results**:
- Chart renders with Recharts library
- Data points visible on both lines
- Tooltip shows revenue and order count on hover
- No console errors related to Recharts

---

### 3. Interval Filtering
**Objective**: Verify switching between day/week/month intervals works

**Test Steps**:
```
1. On analytics page, find interval buttons (Diario/Semanal/Mensual)
2. Click "Diario" button
3. Verify chart updates with daily data
4. Verify x-axis shows dates (YYYY-MM-DD format)
5. Click "Semanal" button
6. Verify chart updates with weekly data
7. Verify data is grouped by week
8. Click "Mensual" button
9. Verify chart updates with monthly data
10. Verify data is grouped by month
```

**Expected Results**:
- Button state changes visually (active styling)
- Chart re-renders with new data immediately
- Data aggregation correct for each interval
- No loading delays (data fetches <1 second)

---

### 4. Customer Distribution Chart
**Objective**: Verify pie chart for customer distribution renders

**Test Steps**:
```
1. Scroll to "Distribución de Clientes" section
2. Verify pie chart renders
3. Verify legend shows "Nuevos" (orange) and "Recurrentes" (green)
4. Verify slice labels show counts
5. Verify pie slices are colored differently
```

**Expected Results**:
- Pie chart renders with correct colors
- Labels and legend visible
- Slices proportional to data

---

### 5. Top Customers Table
**Objective**: Verify top customers list displays correctly

**Test Steps**:
```
1. Scroll to "Clientes Principales" section
2. Verify table shows up to 5 customers
3. Verify each row shows:
   - Customer name (or ID)
   - Order count ("X órdenes")
   - LTV amount ($X.XX, right-aligned)
4. Verify rows have background color (warm-50)
5. Verify data is sorted by LTV descending
```

**Expected Results**:
- Table displays actual customer data from database
- Top customer has highest LTV
- All values formatted correctly

---

### 6. Customer Metrics Cards
**Objective**: Verify metrics display correct values

**Test Steps**:
```
1. Scroll to bottom metrics section (3 cards)
2. Verify first card: "LTV Promedio" with dollar amount
3. Verify second card: "Tasa de Recurrencia" with percentage
4. Verify third card: "Tasa de Deserción" with percentage
5. Verify values are realistic (0-100%)
```

**Expected Results**:
- All metrics display numeric values
- Percentages formatted with 1 decimal place
- Values match calculations in API endpoints

---

### 7. Export Button (Placeholder)
**Objective**: Verify export button is present (not yet functional)

**Test Steps**:
```
1. Scroll to top controls section
2. Find "Exportar" button
3. Click button
4. Verify button has Download icon
```

**Expected Results**:
- Button visible and clickable
- Shows expected UI (tooltip or disabled state)

---

### 8. Regression Testing - Navigation
**Objective**: Verify no regressions in main navigation

**Test Steps**:
```
1. From analytics page, click sidebar Dashboard link
2. Verify dashboard loads correctly
3. Click sidebar Catalogs link
4. Verify catalogs page loads
5. Click sidebar Payments link
6. Verify payments page loads
7. Click Analytics again
8. Verify analytics page loads (caching works)
```

**Expected Results**:
- All navigation links work
- No 404 errors
- Pages load correctly
- No broken sidebar styling

---

### 9. Regression Testing - Authentication
**Objective**: Verify auth still works after adding analytics endpoints

**Test Steps**:
```
1. Logout from analytics page
2. Verify redirected to login
3. Login with different user (Free plan)
4. Navigate to /app/analytics
5. Verify analytics page loads (should show 0 data for new user)
6. Check that free user can still access (no 403 errors)
```

**Expected Results**:
- Auth checks working
- Page accessible to all plan levels
- Data filtered by organization properly

---

### 10. Browser Console Errors
**Objective**: Verify no JavaScript errors

**Test Steps**:
```
1. Open browser DevTools Console
2. Navigate through all analytics sections
3. Change interval filters
4. Hover over charts
5. Record any console errors
```

**Expected Results**:
- No red error messages
- Only warnings acceptable (if any)
- No network errors

---

## 🧪 Test Data Requirements

**User Setup**:
- 1x Pro user with transaction history (Phase 13 data)
- 1x Free user (to test data isolation)
- 1x Premium user (optional)

**Transaction Requirements**:
- Minimum 5-10 transactions for Pro user
- Date range spanning last 30 days
- Mix of successful/failed transactions
- Multiple customers if possible

---

## ✅ Acceptance Criteria

**Phase 14 MVP E2E Test PASS** requires:
- ✅ All 10 test scenarios complete without failures
- ✅ No console errors
- ✅ Page load time <2 seconds
- ✅ Chart rendering <1 second after data load
- ✅ No regressions in existing features
- ✅ All calculations accurate (verified against database)

---

## 📊 Test Execution Matrix

| Scenario | Status | Notes | Pass/Fail |
|----------|--------|-------|-----------|
| 1. Navigation & Loading | ⏳ TODO | | |
| 2. Sales Chart | ⏳ TODO | | |
| 3. Interval Filtering | ⏳ TODO | | |
| 4. Distribution Chart | ⏳ TODO | | |
| 5. Top Customers | ⏳ TODO | | |
| 6. Metrics Cards | ⏳ TODO | | |
| 7. Export Button | ⏳ TODO | | |
| 8. Navigation Regression | ⏳ TODO | | |
| 9. Auth Regression | ⏳ TODO | | |
| 10. Console Errors | ⏳ TODO | | |

---

## 🚀 Execution Notes

- Use Playwright CLI for automated testing
- Take screenshots at key points
- Document any failures with timestamps
- Compare with Phase 12 E2E execution pattern
- Run during normal business hours (when data is stable)

