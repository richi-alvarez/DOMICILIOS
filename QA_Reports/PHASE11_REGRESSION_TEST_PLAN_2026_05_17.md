# Phase 11 - Regression Test Plan

**Date**: 2026-05-17  
**Objective**: Verify that Phase 11 (Monitoring Access Control) does not break existing functionality  
**Reference Reports**: 
- QA_THREE_USERS_DIFFERENT_PLANS_2026_05_15.md
- PHASE4_E2E_COMPLETE_RESULTS_2026_05_17.md
- PHASE9_TESTING_OPTIMIZATION_2026_05_17.md

---

## 📋 Critical Path Tests (Must Pass)

### 1. Authentication & Authorization

- [ ] **Free user login** works correctly
- [ ] **Pro user login** works correctly
- [ ] **Premium user login** works correctly
- [ ] **User session** persists across pages
- [ ] **Logout** clears session properly
- [ ] **Password reset** flow works
- [ ] **Email verification** works

**Expected**: All auth flows unchanged

### 2. Catalog Management (Free User)

- [ ] Create 1 catalog (Free limit)
- [ ] Cannot create 2nd catalog
- [ ] View created catalog
- [ ] Edit catalog details
- [ ] See product limit (30 products)
- [ ] Publish/unpublish catalog

**Reference**: QA_THREE_USERS_DIFFERENT_PLANS_2026_05_15.md

### 3. Catalog Management (Pro User)

- [ ] Create up to 3 catalogs
- [ ] Cannot create 4th catalog
- [ ] AI feature NOT visible (Pro doesn't have it)
- [ ] Edit catalogs
- [ ] View product limit (500 products)
- [ ] Access analytics

**Reference**: QA_THREE_USERS_DIFFERENT_PLANS_2026_05_15.md

### 4. Catalog Management (Premium User)

- [ ] Create up to 10 catalogs
- [ ] AI catalog generator visible (Premium only)
- [ ] Can use AI to generate catalog
- [ ] Product limit is 5000
- [ ] Full analytics access
- [ ] Custom domain access

### 5. Product Management

- [ ] Add product to catalog
- [ ] Edit product
- [ ] Delete product
- [ ] Upload product image
- [ ] Bulk operations (if applicable)

**Reference**: PHASE9_TESTING_OPTIMIZATION_2026_05_17.md

### 6. Design Page (QR Code)

- [ ] Open design page
- [ ] Customize QR color (red/blue/green)
- [ ] Upload custom QR image
- [ ] Preview updates
- [ ] Save changes
- [ ] Print QR code
- [ ] Download QR code

**Reference**: QA_QR_CUSTOMIZATION_FEATURE_2026_05_15.md, DESIGN_PAGE_TEST_EXECUTION.md

### 7. Dashboard Access

- [ ] Free user: Dashboard accessible ✅
- [ ] Free user: Cannot access monitoring ✅ (NEW)
- [ ] Pro user: Dashboard accessible ✅
- [ ] Pro user: Can access monitoring ✅ (NEW)
- [ ] Premium user: Dashboard accessible ✅
- [ ] Premium user: Can access monitoring ✅ (NEW)

**New Behavior**: Monitoring access controlled by plan

### 8. Navigation & Sidebar

- [ ] Sidebar renders correctly
- [ ] Navigation links work
- [ ] Mobile menu works
- [ ] Responsive design intact
- [ ] Monitoring link visible for Pro+ users

**Reference**: QA_RESPONSIVE_HEADER_NAVIGATION_2026_05_15.md

### 9. API Endpoints

Test that monitoring APIs are protected:

- [ ] `/api/monitoring/health` - requires auth
- [ ] `/api/monitoring/metrics` - requires auth
- [ ] `/api/monitoring/alerts` - requires auth
- [ ] `/api/admin/monitoring/alerts/[id]/resolve` - requires auth
- [ ] Unauthenticated requests rejected
- [ ] Free users get 403 Forbidden
- [ ] Pro+ users get data

### 10. Performance & Loading

- [ ] Skeleton loaders display correctly
- [ ] Loading transitions smooth
- [ ] No layout shifts (CLS)
- [ ] API responses within SLA (< 2s)
- [ ] Dashboard loads within 3 seconds

---

## 🔍 Areas of Potential Impact

### High Risk (Check Thoroughly)
1. **Auth system** - Changes to plan checking
   - Session creation
   - Plan lookups
   - Plan limits validation

2. **Monitoring pages** - New access control
   - Page rendering
   - Component initialization
   - API calls

3. **Data layer** - New monitoringAccess field
   - PLAN_LIMITS constant
   - Plan type definitions

### Medium Risk (Sample Test)
1. **Billing page** - Links to upgrade
2. **Navigation** - Conditional links
3. **Component rendering** - UI changes

### Low Risk (Smoke Test)
1. **Other features** - Not touched by this change
2. **Database** - No schema changes
3. **API endpoints** - No changes except monitoring

---

## 📋 Test Execution Matrix

| User Type | Dashboard | Catalogs | Products | Design | Monitoring | AI Feature |
|-----------|-----------|----------|----------|--------|------------|-----------|
| Free      | ✅ Yes    | ✅ 1     | ✅ 30    | ✅ Yes | ❌ No      | ❌ No     |
| Pro       | ✅ Yes    | ✅ 3     | ✅ 500   | ✅ Yes | ✅ Yes     | ❌ No     |
| Premium   | ✅ Yes    | ✅ 10    | ✅ 5000  | ✅ Yes | ✅ Yes     | ✅ Yes    |
| Business  | ✅ Yes    | ✅ ∞     | ✅ ∞     | ✅ Yes | ✅ Yes     | ✅ Yes    |

---

## 🛠️ Test Environment

**Database**: PostgreSQL 16 with real data  
**Users**: 4 test accounts (see USUARIOS_Y_PLANES_FINAL.md)  
**Browser**: Chromium (Playwright)  
**Test Framework**: Playwright  
**Timeout**: 5 seconds per test

---

## ✅ Acceptance Criteria

- [ ] All 10 critical path tests pass
- [ ] No regression in existing features
- [ ] Access control works as designed
- [ ] UI renders correctly for all plan types
- [ ] No console errors during tests
- [ ] API responses correct (200/403/401)
- [ ] Navigation works properly
- [ ] Loading states display correctly

---

## 📊 Test Results

**Status**: 🔄 Testing in Progress  
**Tests Executed**: Waiting for E2E results  
**Date**: 2026-05-17

Results will be documented in dedicated test report.

---

## 📝 Notes

- Tests are running in headed mode for visibility
- If any test fails, will capture screenshot for debugging
- API mocking avoided - using real endpoints
- Real database used with test data
- Tests cleanup is not needed as test data is isolated
