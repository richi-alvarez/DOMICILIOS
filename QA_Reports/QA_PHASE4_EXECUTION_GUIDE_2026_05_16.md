# 🎯 Phase 4: UI Integration E2E - Execution Guide

**Date**: 2026-05-16  
**Status**: 📋 Ready for User Execution  
**Test Method**: Manual + Playwright CLI  
**Audience**: QA Team / Developers

---

## 🚀 Quick Start

### Option A: Automated Testing (Recommended)

```bash
# 1. In Terminal 1: Start dev server
npm run dev

# Wait for: "✓ Ready in Xs" message

# 2. In Terminal 2: Run Phase 4 tests
chmod +x phase4-e2e-tests.sh
./phase4-e2e-tests.sh
```

### Option B: Manual Testing with Playwright CLI

```bash
# 1. Ensure dev server is running (see Option A step 1)

# 2. Open browser
playwright-cli open http://localhost:3004/login

# 3. Interact with the page using commands (see below)
```

### Option C: Manual Browser Testing

```bash
# 1. Start dev server: npm run dev
# 2. Open browser: http://localhost:3004/login
# 3. Follow manual steps below
```

---

## 📋 Phase 4 Test Scenarios

### Scenario 1: Complete User Flow (Happy Path)

#### Step 1️⃣: Login
```
URL: http://localhost:3004/login

Fill in:
  Email:    carlos.garcia@test.com
  Password: Test@12345

Click: Login button

Expected: Redirect to http://localhost:3004/app/catalogs
```

**Verification**:
- [ ] Login form displays
- [ ] Credentials accepted
- [ ] No error messages
- [ ] Redirected to dashboard

---

#### Step 2️⃣: Navigate to Catalog Creation

```
From Dashboard: http://localhost:3004/app/catalogs

Click: "Crear Catálogo" button (prominent button)

Expected: Navigate to http://localhost:3004/app/catalogs/new
          Form with input fields loads
```

**Verification**:
- [ ] Button visible and clickable
- [ ] Form loads without errors
- [ ] No loading spinner stuck
- [ ] All fields visible

---

#### Step 3️⃣: Fill Catalog Form

```
Form Fields to Fill:

1. Business Name (Required)
   Input: "Café Delgado"
   
2. Business Description (Required)
   Input: "Especialización en café artesanal y pasteles frescos. 
           Granos de calidad premium, métodos de extracción profesionales."
   
3. Business Type (Select)
   Choose: "Coffee Shop" or "Cafetería"
   
4. Contact (Dropdown)
   Select: Any available contact
           If none, create one first
           
5. AI Generation (Optional Toggle)
   Status: Should be ON by default
           Look for toggle or checkbox
```

**Playwright CLI Commands**:
```bash
# Fill fields using playwright
playwright-cli fill "input[placeholder*='nombre']" "Café Delgado"

playwright-cli fill "textarea[placeholder*='descripción']" \
  "Especialización en café artesanal y pasteles frescos"

playwright-cli select "select[name='type']" "coffee-shop"

playwright-cli click "button[contains(text(), 'Siguiente')]"
```

**Verification**:
- [ ] Fields accept input
- [ ] No validation errors on valid input
- [ ] Form scrolls if needed
- [ ] All required fields fillable

---

#### Step 4️⃣: AI Catalog Generation

```
Location: Step 3 form (or Step 2 if in flow)

Look For:
  - Button labeled "Generar con IA"
  - OR Toggle/Checkbox "Generar catálogo con IA"
  - OR Any AI-related button
  
Action: Click AI generation button
```

**Expected Behavior**:
```
BEFORE CLICK:
  - Button is visible
  - Can be clicked
  
AFTER CLICK (0-3 seconds):
  - Loading indicator appears
  - Button becomes disabled
  - Message: "Generando catálogo..."
  
AFTER PROCESSING (3-10 seconds):
  - Loading ends
  - Results displayed
  - Generated products shown
```

**Playwright CLI Commands**:
```bash
# Click AI button
playwright-cli click "button[contains(text(), 'Generar')]"

# Wait for results
sleep 5

# Take snapshot to see results
playwright-cli snapshot --filename=ai-results.yaml

# Check for product elements
playwright-cli eval \
  "document.querySelectorAll('[data-testid=\"product\"]').length"
```

**Verification**:
- [ ] Button click registered
- [ ] Loading state visible
- [ ] Request sent (check network tab)
- [ ] Response received
- [ ] No error messages
- [ ] Products appear (at least 5+)

---

#### Step 5️⃣: Review Generated Products

```
Expected Product Information:

For each product, verify:
  ✓ Product Name
    Example: "Espresso", "Cappuccino", "Croissants"
    
  ✓ Category
    Example: "Bebidas", "Pasteles", "Sándwiches"
    
  ✓ Price
    Example: 2.50, 3.00, 4.50
    Format: Currency symbol + number
    
  ✓ Description (Optional)
    Example: "Café espresso puro de calidad premium"
    
  ✓ Image (Optional)
    Should display product image if provided
```

**Product Structure**:
```javascript
// Expected data structure
{
  name: "Espresso",
  category: "Bebidas",
  price: 2.50,
  description: "Café espresso puro"
}
```

**Playwright CLI Verification**:
```bash
# Count products
playwright-cli eval \
  "document.querySelectorAll('[data-testid=\"product-card\"]').length"

# Expected: > 0 (at least 1 product)

# Get product names
playwright-cli eval \
  "Array.from(document.querySelectorAll('[data-testid=\"product-name\"]')).map(el => el.textContent)"

# Should return array with product names
```

**Verification**:
- [ ] At least 5 products generated
- [ ] Product names not empty
- [ ] Categories properly assigned
- [ ] Prices are valid numbers
- [ ] No broken images
- [ ] Layout looks good
- [ ] Scrollable if many products

---

#### Step 6️⃣: Save Catalog

```
After reviewing products:

Look For:
  - "Guardar Catálogo" button
  - "Crear Catálogo" button
  - "Siguiente" button (next step)
  
Action: Click save button
```

**Expected Result**:
```
DURING SAVE (0-2 seconds):
  - Button shows loading state
  - Potential spinner/animation
  
AFTER SAVE (2-5 seconds):
  - Success message appears
  - Redirect to catalog page
  - URL: /app/catalogs/[id]
  - Products visible in list
```

**Playwright CLI Commands**:
```bash
# Click save button
playwright-cli click "button[contains(text(), 'Guardar')]"

# Wait for save to complete
sleep 3

# Verify page changed
playwright-cli eval "window.location.pathname"

# Should contain /app/catalogs/
```

**Verification**:
- [ ] Save button clickable
- [ ] Request sent to server
- [ ] Success indication shown
- [ ] Page navigated
- [ ] Catalog appears in list
- [ ] Products saved with catalog

---

### Scenario 2: Error Handling Tests

#### Test 2A: Empty Form Submission

```
Action: Click submit without filling form

Expected:
  - Validation error appears
  - Form not submitted
  - Error message: "Este campo es requerido"
  
Verify:
  [ ] Business Name error shows
  [ ] Description error shows
  [ ] Form remains on same page
```

---

#### Test 2B: AI Generation Timeout

```
Action: 
  1. Fill form
  2. Click AI generation
  3. Wait > 30 seconds
  
Expected:
  - Timeout error message
  - Retry option appears
  - Can still save without AI
  
Verify:
  [ ] Error message clear
  [ ] Retry button available
  [ ] Form usable
```

---

#### Test 2C: Network Error Simulation

```
Action:
  1. Disable internet (or use Dev Tools)
  2. Click AI generation
  
Expected:
  - Network error message
  - "Connection failed" or similar
  - Can retry when online
  
Verify:
  [ ] Error handled gracefully
  [ ] Page doesn't crash
  [ ] User informed
```

---

### Scenario 3: Validation Tests

#### Test 3A: Business Name Limits

```
Test Case 1: Very Long Name (>200 chars)
  Input: "This is a very long business name that exceeds..."
  Expected: Truncated or error message
  
Test Case 2: Special Characters
  Input: "Café & Bar @2026"
  Expected: Accepted and displayed correctly
  
Test Case 3: Numbers Only
  Input: "123456"
  Expected: Accepted (valid business name)
```

---

#### Test 3B: Price Validation

```
AI-Generated Prices Should Be:
  ✓ Valid positive numbers
  ✓ 0.50 minimum (or business rule)
  ✓ Formatted with 2 decimals
  ✓ No currency symbol (stored as number)
  
Examples of Valid Prices:
  - 2.50
  - 15.99
  - 100.00
  
Examples of Invalid (should not appear):
  - -5.00
  - 0.00
  - $2.50 (with symbol in data)
```

---

## 📊 Test Results Template

After executing Phase 4, document results in: `QA_Reports/QA_PHASE4_RESULTS_[DATE].md`

```markdown
# Phase 4 E2E Test Results

**Date**: [Date]
**Tester**: [Your Name]
**Duration**: [Time taken]
**Status**: [PASSED / FAILED / PARTIAL]

## Test Cases Summary

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 1 | Login | ✅ | User authenticated successfully |
| 2 | Form Load | ✅ | All fields present |
| 3 | AI Generation | ✅ | 8 products generated |
| 4 | Product Display | ✅ | All products visible |
| 5 | Save Catalog | ✅ | Catalog created with ID xxx |

## Issues Found

[List any bugs or issues discovered]

## Performance Metrics

- Login Time: [X seconds]
- Form Load: [X seconds]
- AI Response: [X seconds]
- Save Time: [X seconds]

## Recommendations

[Any recommendations for improvements]
```

---

## 🔍 How to Verify AI System is Working

### Check 1: Network Request
```bash
# In browser DevTools (F12):
# 1. Go to Network tab
# 2. Filter for API requests
# 3. Click AI generation button
# 4. Look for POST request to /api/*
# 5. Status should be 200 (success)
```

### Check 2: Response Data
```bash
# In browser DevTools:
# 1. Go to Network tab
# 2. Click on the API request
# 3. Go to Response tab
# 4. Should see JSON with products:
#    { "success": true, "products": [...] }
```

### Check 3: Console Logs
```bash
# In browser DevTools:
# 1. Go to Console tab
# 2. Should see:
#    [AI] Using provider: anthropic
#    [RetryStrategy] Attempt 1/3
#    [AI] Generated X products
# 3. No red error messages
```

---

## 🆘 Troubleshooting

### Server won't start
```bash
# Error: Port already in use
Solution: 
  - Kill existing process: pkill -f "next dev"
  - Try again: npm run dev

# Error: Module not found
Solution:
  - Clear cache: rm -rf .next
  - Reinstall deps: npm install
  - Start again: npm run dev
```

### Playwright can't connect
```bash
# Error: net::ERR_CONNECTION_REFUSED
Solution:
  - Verify server running: curl http://localhost:3004
  - Wait longer for startup (can take 30s+)
  - Check logs: tail /tmp/dev-server.log
```

### AI generation fails
```bash
# Error: "Provider not configured"
Solution:
  - Check .env.local has API keys
  - Verify environment variables loaded
  - Restart server: npm run dev

# Error: "API request timeout"
Solution:
  - Wait longer (up to 10 seconds)
  - Check internet connection
  - Verify API key is valid
```

---

## 📱 Expected UI Elements

### Login Page Should Have
- [ ] Email input field
- [ ] Password input field
- [ ] Login button
- [ ] Forgot password link
- [ ] Sign up link
- [ ] Logo/branding

### Dashboard Page Should Have
- [ ] User profile menu (top right)
- [ ] Sidebar navigation
- [ ] "Crear Catálogo" button (prominent)
- [ ] List of catalogs
- [ ] Search/filter (optional)
- [ ] Empty state if no catalogs

### New Catalog Form Should Have
- [ ] Business Name input
- [ ] Description textarea
- [ ] Business Type select
- [ ] Contact dropdown
- [ ] AI Toggle (if enabled)
- [ ] Next/Continue button
- [ ] Cancel/Back button

### AI Results Should Show
- [ ] Generated products list
- [ ] Each product with:
  - Name
  - Category
  - Price
  - Description (optional)
  - Image (optional)
- [ ] Save button
- [ ] Edit options (if available)

---

## ✅ Success Criteria for Phase 4

**PASSED** if:
- ✅ Can login successfully
- ✅ Can create new catalog
- ✅ AI generation responds
- ✅ Products display correctly
- ✅ Can save catalog
- ✅ No critical errors
- ✅ Performance acceptable

**PARTIAL** if:
- ⚠️ Most features work
- ⚠️ Minor UI issues
- ⚠️ Some errors but recoverable

**FAILED** if:
- ❌ Cannot login
- ❌ Cannot create catalog
- ❌ AI not responding
- ❌ Critical errors in console
- ❌ Cannot save catalog

---

## 📎 Test Artifacts to Save

After each test, save:

```
Screenshots/
├── login-page.png
├── dashboard.png
├── new-catalog-form.png
├── ai-generating.png
├── ai-results.png
└── catalog-saved.png

Snapshots (Playwright):
├── page-*.yaml         (Automatic from playwright-cli)

Logs:
├── dev-server.log
├── console-output.txt
└── network-requests.txt
```

---

## 🎯 Summary

| Phase | Status | Action |
|-------|--------|--------|
| 1 | ✅ COMPLETE | Configuration validated |
| 2 | ✅ COMPLETE | Infrastructure tested |
| 3 | ✅ COMPLETE | API integration confirmed |
| 4 | 📋 READY | UI E2E testing (this phase) |
| 5 | ⏳ NEXT | Monitoring & metrics |

---

**Created**: 2026-05-16  
**Last Updated**: 2026-05-16  
**Test Plan Version**: 1.0

Execute tests and share results in QA_Reports/
