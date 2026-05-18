# Phase 14: Advanced Analytics & Reporting - Implementation Plan

**Status**: 🚀 IN PROGRESS  
**Date Started**: May 18, 2026  
**Phase Manager**: Claude Code  
**Duration**: 2-3 days  

---

## 📊 Phase Overview

Phase 14 expands the monitoring dashboard with comprehensive business analytics:
- Sales metrics by time period (daily, weekly, monthly)
- Customer insights (repeat customers, lifetime value, churn rate)
- Revenue tracking and forecasting
- Custom report builder for business users
- Export functionality (PDF, CSV, Excel)

**Dependencies**: ✅ Phase 13 (Payment Integration) COMPLETE

---

## 🎯 Objectives

### Primary Goals
1. **Analytics Dashboard** — Expand dashboard with metrics cards
2. **Time-based Analysis** — Sales/revenue by date ranges
3. **Customer Insights** — Repeat customers, LTV, acquisition costs
4. **Report Builder** — Custom reports with filtering
5. **Data Export** — PDF/CSV download functionality

### Success Criteria
- [ ] Dashboard shows 10+ key metrics
- [ ] Date range filtering works (daily/weekly/monthly/custom)
- [ ] Customer cohort analysis complete
- [ ] At least 3 pre-built report templates
- [ ] Export to CSV, PDF, Excel working
- [ ] Performance: Analytics queries < 2s
- [ ] All data reflects actual transactions from Phase 13

---

## 📋 STEP 1: Database Schema Additions

### 1.1 New Tables/Views Needed

```sql
-- View: Analytics snapshot (aggregated daily)
CREATE VIEW sales_daily_summary AS
SELECT 
  DATE(created_at) as sale_date,
  COUNT(*) as order_count,
  SUM(amount) as revenue,
  AVG(amount) as avg_order_value,
  COUNT(DISTINCT user_id) as unique_customers
FROM transactions
WHERE status = 'succeeded'
GROUP BY DATE(created_at)
ORDER BY sale_date DESC;

-- View: Customer lifetime value
CREATE VIEW customer_ltv AS
SELECT 
  user_id,
  COUNT(DISTINCT order_id) as total_orders,
  SUM(amount) as lifetime_revenue,
  MAX(created_at) as last_purchase,
  DATEDIFF(day, MIN(created_at), MAX(created_at)) as customer_lifespan_days
FROM transactions
WHERE status = 'succeeded'
GROUP BY user_id;

-- Table: Saved reports (user-created)
CREATE TABLE custom_reports (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  query_type VARCHAR(50), -- 'sales', 'customers', 'products', 'revenue'
  filters JSONB, -- Date range, product filters, etc.
  columns JSONB, -- Selected columns to display
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID NOT NULL,
  is_template BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Table: Report exports (audit trail)
CREATE TABLE report_exports (
  id UUID PRIMARY KEY,
  report_id UUID,
  export_format VARCHAR(10), -- 'csv', 'pdf', 'xlsx'
  file_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID NOT NULL,
  FOREIGN KEY (created_by) REFERENCES users(id)
);
```

### 1.2 Database Indexes

```sql
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_transactions_organization_status ON transactions(organization_id, status);
CREATE INDEX idx_custom_reports_organization ON custom_reports(organization_id);
```

**Status**: 📋 TODO

---

## 🔌 STEP 2: API Endpoints

### 2.1 Analytics Endpoints

**Route**: `GET /api/analytics/overview`
```json
Response:
{
  "totalRevenue": 15000,
  "orderCount": 45,
  "avgOrderValue": 333.33,
  "uniqueCustomers": 28,
  "repeatCustomerRate": 0.35,
  "topProducts": [
    { "id": "prod_1", "name": "Product A", "revenue": 5000, "units": 12 }
  ]
}
```

**Route**: `GET /api/analytics/sales?startDate=2026-05-01&endDate=2026-05-18&interval=day`
```json
Response:
{
  "data": [
    { "date": "2026-05-18", "revenue": 1200, "orders": 5, "customers": 4 },
    { "date": "2026-05-17", "revenue": 980, "orders": 3, "customers": 3 }
  ],
  "summary": { "totalRevenue": 15000, "totalOrders": 45, "avgDaily": 833 }
}
```

**Route**: `GET /api/analytics/customers`
```json
Response:
{
  "totalCustomers": 28,
  "repeatCustomers": 10,
  "avgLifetimeValue": 535.71,
  "churnRate": 0.15,
  "newCustomersThisMonth": 18,
  "topCustomers": [
    { "id": "user_1", "name": "John Doe", "ltv": 2500, "orderCount": 8 }
  ]
}
```

**Route**: `GET /api/analytics/products`
```json
Response:
{
  "products": [
    {
      "id": "prod_1",
      "name": "Product A",
      "revenue": 5000,
      "unitsSold": 12,
      "avgRating": 4.5,
      "trend": "up"
    }
  ]
}
```

**Route**: `POST /api/reports/create`
```json
Request:
{
  "name": "Q2 Sales Report",
  "description": "Sales by product and region",
  "queryType": "sales",
  "filters": {
    "startDate": "2026-04-01",
    "endDate": "2026-06-30",
    "productId": "prod_1"
  },
  "columns": ["date", "product", "revenue", "units"]
}
```

**Route**: `GET /api/reports/list`
```json
Response:
{
  "custom": [
    { "id": "rpt_1", "name": "Q2 Sales Report", "createdAt": "2026-05-18", "type": "sales" }
  ],
  "templates": [
    { "id": "tpl_1", "name": "Monthly Sales", "description": "Default monthly revenue report" }
  ]
}
```

**Route**: `POST /api/reports/{id}/export?format=pdf|csv|xlsx`

**Status**: 📋 TODO

---

## 🎨 STEP 3: Frontend Components

### 3.1 Analytics Dashboard Page
**File**: `/app/(app)/app/analytics/page.tsx`

Shows:
- 4 metric cards (Total Revenue, Orders, Customers, Repeat Rate)
- Sales trend chart (line chart over time)
- Top products table (bar chart)
- Customer cohort chart

### 3.2 Analytics Overview Component
**File**: `/components/AnalyticsOverview.tsx`

- Displays key metrics
- Date range picker
- Export button
- Refresh button

### 3.3 Sales Trend Chart
**File**: `/components/SalesTrendChart.tsx`

- Interactive line/bar chart using Recharts
- Hover tooltips with daily breakdown
- Interval selector (day/week/month)
- Download as image

### 3.4 Customer Insights Panel
**File**: `/components/CustomerInsightsPanel.tsx`

- Repeat customer %, LTV distribution
- Cohort analysis
- Churn rate trend
- New customer acquisition

### 3.5 Custom Reports Builder
**File**: `/components/ReportBuilder.tsx`

- Query type selector
- Filter interface (date, product, customer)
- Column selection
- Preview data
- Save as template

### 3.6 Reports Management Page
**File**: `/app/(app)/app/reports/page.tsx`

- List saved reports
- Delete/duplicate reports
- Generate/export action
- Recently exported list

**Status**: 📋 TODO

---

## 📊 STEP 4: Server Actions

### 4.1 Analytics Actions
**File**: `/lib/actions/analytics.ts`

```typescript
export async function getAnalyticsOverview()
// Get high-level metrics for dashboard

export async function getSalesData(startDate, endDate, interval)
// Get time-series sales data

export async function getCustomerAnalytics()
// Get customer metrics and cohorts

export async function getProductAnalytics()
// Get product performance metrics
```

### 4.2 Reports Actions
**File**: `/lib/actions/reports.ts`

```typescript
export async function createCustomReport(data)
// Create and save custom report

export async function getReports()
// List all saved reports for organization

export async function generateReportData(reportId)
// Execute report query and return data

export async function exportReport(reportId, format)
// Export to CSV, PDF, or XLSX

export async function deleteReport(reportId)
// Delete custom report
```

**Status**: 📋 TODO

---

## 🧪 STEP 5: Testing

### 5.1 Unit Tests
- [ ] Analytics calculation functions
- [ ] Date range filtering logic
- [ ] Currency formatting
- [ ] Report template validation

### 5.2 Integration Tests
- [ ] API endpoints return correct data
- [ ] Date filtering works correctly
- [ ] Organization isolation enforced
- [ ] Export functionality works

### 5.3 E2E Tests
- [ ] Navigate to analytics page
- [ ] Change date range
- [ ] Export as CSV/PDF
- [ ] Create custom report
- [ ] Save report as template

**Status**: 📋 TODO

---

## 📈 STEP 6: Implementation Checklist

| Component | Status | File | Priority |
|-----------|--------|------|----------|
| Database migration | ✅ DONE | `db/migrations/0004_phase14_analytics.sql` | HIGH |
| Database schema | ✅ DONE | `db/schema.ts` | HIGH |
| Analytics overview API | ✅ DONE | `app/api/analytics/overview/route.ts` | HIGH |
| Sales trend API | ✅ DONE | `app/api/analytics/sales/route.ts` | HIGH |
| Customers API | ✅ DONE | `app/api/analytics/customers/route.ts` | HIGH |
| Products API | 📋 TODO | `app/api/analytics/products/route.ts` | HIGH |
| Reports API | 📋 TODO | `app/api/reports/route.ts` | HIGH |
| Export API | 📋 TODO | `app/api/reports/export/route.ts` | MEDIUM |
| Analytics Dashboard Page | ✅ DONE | `app/(app)/app/analytics/page.tsx` | HIGH |
| Analytics Dashboard Component | ✅ DONE | `components/AnalyticsDashboard.tsx` | HIGH |
| Customer Panel Component | 📋 TODO | `components/CustomerInsightsPanel.tsx` | MEDIUM |
| Report Builder | 📋 TODO | `components/ReportBuilder.tsx` | MEDIUM |
| Reports Page | 📋 TODO | `app/(app)/app/reports/page.tsx` | MEDIUM |
| Analytics Server Actions | ✅ DONE | `lib/actions/analytics.ts` | HIGH |
| Reports Server Actions | 📋 TODO | `lib/actions/reports.ts` | MEDIUM |
| Unit Tests | 📋 TODO | `__tests__/analytics.test.ts` | MEDIUM |
| Integration Tests | 📋 TODO | `__tests__/analytics.integration.ts` | MEDIUM |
| E2E Tests | 📋 TODO | `__tests__/analytics.e2e.ts` | LOW |

---

## 🎯 Daily Progress

### Day 1 (May 18)
- [ ] Create database views and indexes
- [ ] Implement analytics overview API
- [ ] Implement sales trend API
- [ ] Build Analytics Dashboard page

### Day 2 (May 19)
- [ ] Implement customer analytics API
- [ ] Build SalesTrendChart component
- [ ] Build CustomerInsightsPanel component
- [ ] Add date range filtering

### Day 3 (May 20)
- [ ] Implement reports API
- [ ] Build Report Builder component
- [ ] Implement export functionality (CSV/PDF)
- [ ] Write integration tests
- [ ] E2E testing

---

## 🔒 Access Control

All analytics endpoints require:
- [ ] User authenticated
- [ ] Organization membership verified
- [ ] Plan-based feature access (Pro+ for advanced analytics)

**Feature Gates**:
- Free plan: Basic dashboard (orders, revenue only)
- Pro plan: Full analytics + 3 custom reports
- Premium plan: Full analytics + 10 custom reports + API access

---

## 📊 Expected Metrics

**Performance Targets**:
- Analytics overview: < 500ms
- Sales trend query: < 1000ms
- Customer analysis: < 800ms
- Export generation: < 3000ms

**Data Accuracy**:
- All metrics use actual transaction data
- Aggregations computed from Phase 13 transactions
- No hardcoded data

---

## 🚀 Success Criteria

✅ **Completion Requirements**:
1. All 4 analytics APIs return correct data
2. Dashboard renders all metrics and charts
3. Date range filtering functional (1 day, 7 days, 30 days, custom)
4. Export to CSV and PDF working
5. Custom reports save and load correctly
6. Performance meets targets (< 2s for all queries)
7. All tests passing
8. No plan bypass (feature gating enforced)

---

## 📞 Next Phase

After Phase 14 completion:
- **Phase 15**: Mobile App MVP (React Native)
- **Phase 16**: Security & Compliance Audit

---

**Created**: May 18, 2026  
**Last Updated**: May 18, 2026
