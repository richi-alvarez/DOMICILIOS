# 🧪 Phase 4: UI Integration E2E Test Plan

**Date**: 2026-05-16  
**Status**: 📋 Ready for Execution  
**Test Type**: End-to-End UI Integration with Playwright  
**Scope**: AI System Integration in React Components

---

## 📊 Overview

Phase 4 validates the integration of the multi-provider AI system into the React UI components, specifically:
- Login flow with authentication
- Catalog creation form
- AI-powered catalog generation trigger
- Product display and validation
- Error handling in UI

---

## 🛠️ Prerequisites

### Required
- ✅ Node.js 18+ with npm
- ✅ Dev server running: `npm run dev`
- ✅ Playwright CLI installed (via npx)
- ✅ Test database with users (available)
- ✅ Environment variables configured

### Test Credentials
```
Email:    carlos.garcia@test.com
Password: Test@12345
Plan:     GRATIS (1 catalog, 30 products limit)
URL:      http://localhost:3004/login
```

---

## 🧪 Test Cases

### Test Case 1: Server Availability Check
**Purpose**: Verify the development server is running and accessible

**Steps**:
1. Open terminal
2. Start dev server: `npm run dev`
3. Wait for output: "✓ Ready in Xs"
4. Verify URL responds: `curl http://localhost:3004`

**Expected Result**: HTTP 200 response with HTML

```bash
# Command to verify
curl -s http://localhost:3004 | head -20
```

---

### Test Case 2: Login & Authentication Flow
**Purpose**: Verify user can authenticate with email/password

**Playwright Steps**:
```bash
# Open browser
playwright-cli open http://localhost:3004/login

# Take initial snapshot
playwright-cli snapshot --filename=login-page.yaml

# The page should show:
# - Email input field
# - Password input field
# - Login button
# - "Don't have an account?" link (signup)
```

**Manual Verification**:
1. Navigate to http://localhost:3004/login
2. Enter email: `carlos.garcia@test.com`
3. Enter password: `Test@12345`
4. Click login
5. Verify redirect to `/app/catalogs` (dashboard)

**Expected Result**: Successfully logged in, dashboard displayed

---

### Test Case 3: Dashboard Navigation
**Purpose**: Verify catalog list page loads correctly

**Playwright Steps**:
```bash
# Navigate to catalogs page
playwright-cli goto http://localhost:3004/app/catalogs

# Wait for page load
sleep 2

# Take snapshot
playwright-cli snapshot --filename=catalogs-dashboard.yaml

# Page should show:
# - "Crear Catálogo" or "New Catalog" button
# - List of existing catalogs (if any)
# - Empty state message (if no catalogs)
```

**Expected Elements**:
- ✓ Header with user menu
- ✓ Sidebar navigation
- ✓ "Crear Catálogo" button (prominent)
- ✓ Catalogs table or list
- ✓ Plan limits indicator (1 catalog for GRATIS)

---

### Test Case 4: New Catalog Creation Form
**Purpose**: Verify catalog creation form loads with all fields

**Playwright Steps**:
```bash
# Navigate to new catalog page
playwright-cli goto http://localhost:3004/app/catalogs/new

# Wait for form
sleep 2

# Take snapshot
playwright-cli snapshot --filename=new-catalog-form.yaml

# Verify form fields visible:
# - Business Name input
# - Business Description textarea
# - Business Type select
# - "Seleccionar Contacto" dropdown
# - Next button
```

**Form Fields to Fill**:
1. **Business Name**: "Café Delgado"
2. **Business Description**: "Especialización en café artesanal y pasteles frescos"
3. **Business Type**: "Coffee Shop" or "Cafetería"
4. **Contact**: Select from dropdown (already created)

**Expected Result**: Form loads successfully with all fields

---

### Test Case 5: AI Integration - Catalog Generation
**Purpose**: Verify the AI catalog generation feature works in the UI

**Playwright Steps**:
```bash
# Step through form (based on actual component structure)
# Fill business name
playwright-cli fill "input[name='name']" "Café Delgado"

# Fill description
playwright-cli fill "textarea[name='description']" "Especialización en café artesanal"

# Select type (may vary by component)
playwright-cli select "select[name='businessType']" "coffee-shop"

# Look for AI generation trigger
playwright-cli snapshot --filename=form-with-ai-button.yaml

# Click on "Generar con IA" button
playwright-cli click "button[contains(text(), 'Generar')]"

# Wait for AI response (5-10 seconds)
sleep 7

# Take snapshot showing results
playwright-cli snapshot --filename=ai-generated-results.yaml
```

**Expected Behavior**:
- ✓ Form accepts input without errors
- ✓ AI button is visible and clickable
- ✓ Loading state displays while AI processes
- ✓ Response returns with generated catalog structure
- ✓ Products list populated with AI-generated items

**Expected AI Response Structure**:
```json
{
  "success": true,
  "catalogs": [
    {
      "category": "Bebidas",
      "products": [
        {
          "name": "Espresso",
          "description": "Café espresso puro",
          "price": 2.50
        }
      ]
    }
  ]
}
```

---

### Test Case 6: Product Display Validation
**Purpose**: Verify generated products display correctly in UI

**Visual Checks**:
- ✓ Product names displayed
- ✓ Prices formatted with currency
- ✓ Categories organized in sections
- ✓ Product descriptions shown
- ✓ Images displayed (if provided)
- ✓ No layout issues or broken styles

**Playwright Steps**:
```bash
# Verify product elements visible
playwright-cli eval "document.querySelectorAll('[data-testid=\"product-item\"]').length"

# Should return number > 0

# Take final screenshot
playwright-cli screenshot --filename=products-display.png
```

---

### Test Case 7: Error Handling
**Purpose**: Verify error scenarios handled gracefully

**Scenario A: Network Error**
- Steps: Disable internet, try to submit form
- Expected: Error message displays, can retry

**Scenario B: Form Validation**
- Steps: Submit form with empty business name
- Expected: Validation error message, form not submitted

**Scenario C: AI API Timeout**
- Steps: Long delay before AI responds (>30s)
- Expected: Timeout error, option to retry

**Scenario D: Invalid Input**
- Steps: Enter extremely long business name (>500 chars)
- Expected: Input truncated or error shown

---

### Test Case 8: Save & Submit Catalog
**Purpose**: Verify catalog can be saved after generation

**Playwright Steps**:
```bash
# After viewing AI results, look for save button
playwright-cli snapshot --filename=save-button.yaml

# Click save/submit button
playwright-cli click "button[contains(text(), 'Guardar')]"

# Wait for save to complete
sleep 2

# Verify redirect to catalog detail page
playwright-cli snapshot --filename=catalog-saved.yaml

# Expected URL: /app/catalogs/[id]
```

**Expected Result**:
- ✓ Catalog saved to database
- ✓ Redirect to catalog details page
- ✓ Generated products visible in product list
- ✓ Success message displayed

---

## 📋 Manual Test Execution Steps

### If Playwright CLI method fails, use manual browser testing:

```bash
# 1. Ensure dev server is running
npm run dev

# 2. Open browser to login
# https://localhost:3004/login

# 3. Login with:
# Email: carlos.garcia@test.com
# Password: Test@12345

# 4. Click "Crear Catálogo" button

# 5. Fill form:
# - Nombre: "Café Delgado"
# - Descripción: "Especialización en café artesanal"
# - Tipo: "Coffee Shop"
# - Contacto: Select from list

# 6. Look for "Generar con IA" button/toggle

# 7. Click to generate catalog with AI

# 8. Wait 5-10 seconds for response

# 9. Verify products appear

# 10. Click "Guardar Catálogo"

# 11. Verify redirect and confirmation
```

---

## 📊 Test Execution Checklist

### Pre-Execution
- [ ] Dev server started (`npm run dev`)
- [ ] Server running on http://localhost:3004
- [ ] Test database initialized
- [ ] Test user accounts available
- [ ] Environment variables configured
- [ ] Browser/Playwright ready

### During Execution
- [ ] Test Case 1: Server availability ✓
- [ ] Test Case 2: Login flow ✓
- [ ] Test Case 3: Dashboard navigation ✓
- [ ] Test Case 4: Form loading ✓
- [ ] Test Case 5: AI integration ✓
- [ ] Test Case 6: Product display ✓
- [ ] Test Case 7: Error handling ✓
- [ ] Test Case 8: Save catalog ✓

### Post-Execution
- [ ] Screenshots/snapshots saved
- [ ] QA report generated
- [ ] Issues documented
- [ ] Performance notes captured
- [ ] Recommendations noted

---

## 🎯 Success Criteria

✅ **Phase 4 PASSED if**:
1. User can login successfully
2. Catalog creation form loads
3. AI generation button visible and functional
4. AI response returns products
5. Products display in UI without errors
6. Catalog can be saved
7. No console errors during flow
8. All form validations work
9. Error scenarios handled gracefully
10. Performance acceptable (<5s for AI response)

⏳ **Phase 4 CONDITIONAL if**:
- Some tests pass but not all
- Minor UI issues (styling, layout)
- Performance slow but functional

❌ **Phase 4 FAILED if**:
- Cannot login
- Form doesn't load
- AI integration not responsive
- Products don't display
- Save functionality broken
- Critical errors in console

---

## 🚀 After Phase 4: Next Steps

### If Phase 4 PASSED ✅
- Proceed to Phase 5: Monitoring & Metrics
- Setup logging system
- Configure error tracking
- Implement performance monitoring
- Deploy to staging

### If Phase 4 CONDITIONAL ⏳
- Document issues found
- Prioritize fixes
- Re-test after fixes
- Update integration code
- Test again

### If Phase 4 FAILED ❌
- Debug failing test case
- Check dev server logs
- Verify environment setup
- Review error messages
- Contact development team

---

## 📎 Commands Reference

### Start Server
```bash
npm run dev
```

### Run Playwright Tests
```bash
chmod +x phase4-e2e-tests.sh
./phase4-e2e-tests.sh
```

### Manual Playwright Commands
```bash
# Open browser
playwright-cli open http://localhost:3004/login

# Navigate
playwright-cli goto http://localhost:3004/app/catalogs

# Take screenshot
playwright-cli screenshot --filename=page.png

# Take snapshot (page structure)
playwright-cli snapshot --filename=page.yaml

# Fill input
playwright-cli fill "selector" "value"

# Click element
playwright-cli click "selector"

# Type text
playwright-cli type "text"

# Select option
playwright-cli select "selector" "value"

# Evaluate JavaScript
playwright-cli eval "code"

# Close browser
playwright-cli close
```

---

## 📁 Test Artifacts Location

```
.playwright-cli/
├── page-*.yaml          (Page snapshots)
├── console-*.log        (Console output)
└── Screenshots/
    └── *.png           (Screenshot images)

QA_Reports/
├── PHASE4_E2E_TEST_PLAN_2026_05_16.md
└── QA_PHASE4_RESULTS_*.md     (Results after execution)
```

---

## 👥 Test Environment

| Component | Version | Status |
|-----------|---------|--------|
| Node.js | 18+ | ✅ |
| npm | 9+ | ✅ |
| Next.js | 15.3.9 | ✅ |
| Playwright | Latest | ✅ |
| React | 18+ | ✅ |
| PostgreSQL | 16 | ✅ |

---

## 📞 Support

### Common Issues

**Issue**: Dev server won't start
- **Fix**: Clear `.next` cache: `rm -rf .next`
- **Fix**: Restart npm: `npm run dev`

**Issue**: Playwright can't connect to server
- **Fix**: Check URL: `curl http://localhost:3004`
- **Fix**: Wait longer for server startup

**Issue**: AI generation not working
- **Fix**: Check API keys in `.env.local`
- **Fix**: Verify network connection
- **Fix**: Check server logs

---

**Test Plan Created**: 2026-05-16  
**Version**: 1.0  
**Status**: 📋 Ready for Execution

Execute tests and report results in: `QA_Reports/QA_PHASE4_RESULTS_*.md`
