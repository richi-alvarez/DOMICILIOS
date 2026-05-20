# Phase 12: E2E & Regression Testing Plan
**Date**: 2026-05-18  
**Objective**: Execute comprehensive E2E tests and verify Phase 11 doesn't break existing functionality

---

## 🎯 Phase 12 Scope

### Test Coverage Areas
1. **Authentication & Authorization** - All user types
2. **Catalog Management** - By plan limits
3. **Product Management** - CRUD operations
4. **Design & QR** - Customization features
5. **Monitoring** - Access control verification (NEW)
6. **Regression** - Phase 11 changes don't break Phase 4-10

### Test Users (From E2E_SUMMARY_2026_05_18)
```
Free Plan:
  • carlos.garcia@test.com / Password123!
  • ana.martinez@test.com / Password123!

Pro Plan:
  • maria.lopez@test.com / Password123!

Premium Plan:
  • juan.rodriguez@test.com / Password123!
```

---

## 📋 Critical Path Tests

### Section 1: Authentication (BLOCKER: Fix CSRF)

- [ ] Login with Free user email/password
- [ ] Login with Pro user email/password
- [ ] Login with Premium user email/password
- [ ] Session persists across pages
- [ ] Logout clears session
- [ ] Can't access /app without login

**Status**: ⏳ Blocked by CSRF token handling

### Section 2: Free User - Catalog Limits

- [ ] Login: carlos.garcia@test.com
- [ ] Navigate to catalogs
- [ ] Create 1st catalog (✅ should work)
- [ ] Try create 2nd catalog (❌ should be blocked - Free limit 1)
- [ ] Verify error message about plan limit
- [ ] View catalog dashboard
- [ ] See product limit: 30

**Expected**: Can create 1 catalog, blocked on 2nd

### Section 3: Pro User - Catalog & Features

- [ ] Login: maria.lopez@test.com
- [ ] Create up to 3 catalogs
- [ ] Verify AI feature NOT visible (Pro doesn't have)
- [ ] Create product (should allow up to 500)
- [ ] Access analytics dashboard
- [ ] Cannot access monitoring (❌ Free/Pro blocked)

**Expected**: 3 catalogs max, AI hidden, analytics visible

### Section 4: Premium User - Full Access

- [ ] Login: juan.rodriguez@test.com
- [ ] Create 10 catalogs
- [ ] AI catalog generator VISIBLE and working
- [ ] Product limit: 5000
- [ ] Access monitoring dashboard ✅ (NEW - Phase 11)
- [ ] View threshold configuration page
- [ ] Access analytics

**Expected**: Full feature access

### Section 5: Product Management

- [ ] Add product with image
- [ ] Edit product details
- [ ] Delete product
- [ ] Bulk operations (if available)
- [ ] View product count vs limit

**Reference**: PHASE9_TESTING_OPTIMIZATION_2026_05_17.md

### Section 6: Design Page (QR Customization)

- [ ] Open design page
- [ ] Change QR color (red/blue/green)
- [ ] Upload custom image
- [ ] Preview updates immediately
- [ ] Save changes persist
- [ ] Print QR code
- [ ] Download QR code

**Reference**: QA_QR_CUSTOMIZATION_FEATURE_2026_05_15.md

### Section 7: Monitoring Access Control (Phase 11 NEW)

- [ ] Free user: Dashboard shows lock icon
- [ ] Free user: Upgrade button visible
- [ ] Pro user: Dashboard accessible
- [ ] Pro user: Can view metrics
- [ ] Pro user: Can edit thresholds ✅
- [ ] Premium user: Full monitoring access

**Expected**: Access control working per Phase 11

### Section 8: Navigation & UI

- [ ] Sidebar renders correctly
- [ ] All nav links work for user's plan
- [ ] Mobile menu functional
- [ ] Responsive design intact
- [ ] Monitoring link shows for Pro+

**Reference**: QA_RESPONSIVE_HEADER_NAVIGATION_2026_05_15.md

### Section 9: Regression - No Phase 11 Breakage

- [ ] Catalog CRUD still works ✅
- [ ] Product CRUD still works ✅
- [ ] Design page still works ✅
- [ ] Non-monitoring features unchanged ✅
- [ ] Database queries still optimized ✅
- [ ] Caching still working ✅

---

## 🚀 Test Execution Strategy

### Phase 1: Manual Interactive Testing (Use Real Browser)
```bash
# 1. Terminal 1 - Monitor logs
docker logs -f domicilios-app | grep -E "(GET|POST|error|Error)"

# 2. Browser - http://localhost:3000/login
# 3. Test each user flow manually
# 4. Document results
```

### Phase 2: Playwright Automated Tests
Once auth works, automate with proper CSRF token handling

### Phase 3: Performance Baseline
```bash
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3000
```

---

## 📊 Success Criteria

| Metric | Target | Status |
|--------|--------|--------|
| Authentication | 100% | ⏳ CSRF issue |
| Free user limits | 100% | Pending |
| Pro user limits | 100% | Pending |
| Premium access | 100% | Pending |
| Monitoring access control | 100% | Pending |
| Phase 11 regression | 0 failures | Pending |
| Page load time | <3s avg | TBD |
| API response time | <200ms avg | TBD |

---

## 📝 Test Data Reference

### Database State (From E2E_SUMMARY)
```
4 Users created:
  • Free: carlos.garcia@test.com, ana.martinez@test.com
  • Pro: maria.lopez@test.com
  • Premium: juan.rodriguez@test.com

4 Organizations:
  • Garcia Enterprise (Carlos - Free)
  • Martinez Corp (Ana - Free)
  • Lopez Solutions (Maria - Pro)
  • Rodriguez Tech (Juan - Premium)

Subscriptions: All active and linked to plans
```

---

## 🔧 Known Blockers

1. **CSRF Token in Form Submission**
   - NextAuth requires CSRF protection
   - Automated submission needs token
   - **Workaround**: Use interactive browser

2. **Google OAuth**
   - Credentials may be invalid
   - Requires Google Cloud Console verification
   - **Plan**: Fix credentials, retry in Phase 12b

---

## 📈 Phase 12 Milestones

- [ ] **M1**: Fix authentication CSRF issue
- [ ] **M2**: Execute Section 1-4 tests (Auth + Limits)
- [ ] **M3**: Execute Section 5-6 tests (Products + Design)
- [ ] **M4**: Execute Section 7-8 tests (Monitoring + UI)
- [ ] **M5**: Regression testing (Section 9)
- [ ] **M6**: Performance baseline
- [ ] **M7**: Generate final QA report

---

**Estimated Duration**: 2-3 hours manual testing + 1 hour automation setup  
**Environment**: Docker (PostgreSQL 16, Redis 7, Next.js 15.3.9)  
**Reference**: QA_Reports/E2E_SUMMARY_2026_05_18.md, PHASE11_REGRESSION_TEST_PLAN_2026_05_17.md

