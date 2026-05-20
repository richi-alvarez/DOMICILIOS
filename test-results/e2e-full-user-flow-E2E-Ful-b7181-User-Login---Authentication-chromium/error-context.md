# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e-full-user-flow.spec.ts >> E2E Full User Flow - Complete Journey >> 2. User Login - Authentication
- Location: tests/e2e-full-user-flow.spec.ts:74:7

# Error details

```
Error: expect(received).toBeTruthy()

Received: false
```

# Test source

```ts
  4   | 
  5   | const BASE_URL = 'http://localhost:3000'
  6   | 
  7   | // Test data
  8   | const testUser = {
  9   |   email: `test-user-${Date.now()}@example.com`,
  10  |   password: 'TestPass123!@#',
  11  |   name: 'Test Usuario',
  12  |   phone: '+34 123 456 789',
  13  |   catalogName: `Catálogo Test ${Date.now()}`,
  14  |   catalogDescription: 'Descripción del catálogo de prueba',
  15  |   products: [
  16  |     {
  17  |       name: 'Producto 1',
  18  |       description: 'Descripción del producto 1',
  19  |       price: '29.99',
  20  |       quantity: 10,
  21  |     },
  22  |     {
  23  |       name: 'Producto 2',
  24  |       description: 'Descripción del producto 2',
  25  |       price: '49.99',
  26  |       quantity: 5,
  27  |     },
  28  |   ],
  29  | }
  30  | 
  31  | test.describe('E2E Full User Flow - Complete Journey', () => {
  32  |   let createdCatalogId: string
  33  |   let createdProductIds: string[] = []
  34  | 
  35  |   test('1. User Registration - Sign Up Form', async ({ page }) => {
  36  |     console.log('📝 Starting registration with:', testUser.email)
  37  | 
  38  |     await page.goto(`${BASE_URL}/signup`)
  39  |     await page.waitForLoadState('networkidle')
  40  | 
  41  |     // Try to find signup form fields
  42  |     const emailInput = page.locator('input[type="email"]').first()
  43  |     const passwordInput = page.locator('input[type="password"]').first()
  44  |     const submitBtn = page.locator('button[type="submit"]').first()
  45  | 
  46  |     if (await emailInput.isVisible()) {
  47  |       await emailInput.fill(testUser.email)
  48  |       console.log(`✅ Email entered: ${testUser.email}`)
  49  |     }
  50  | 
  51  |     if (await passwordInput.isVisible()) {
  52  |       await passwordInput.fill(testUser.password)
  53  |       console.log(`✅ Password entered`)
  54  |     }
  55  | 
  56  |     if (await submitBtn.isVisible()) {
  57  |       await submitBtn.click()
  58  |       await page.waitForTimeout(3000)
  59  |       console.log(`✅ Signup form submitted`)
  60  |     }
  61  | 
  62  |     // Check if we're logged in or need to login
  63  |     const currentUrl = page.url()
  64  |     expect([
  65  |       currentUrl.includes('/app'),
  66  |       currentUrl.includes('/dashboard'),
  67  |       currentUrl.includes('/login'),
  68  |       currentUrl.includes('/signup'),
  69  |     ].some(v => v)).toBeTruthy()
  70  | 
  71  |     console.log(`✅ After signup, URL: ${currentUrl}`)
  72  |   })
  73  | 
  74  |   test('2. User Login - Authentication', async ({ page }) => {
  75  |     console.log('🔐 Starting login with:', testUser.email)
  76  | 
  77  |     await page.goto(`${BASE_URL}/login`)
  78  |     await page.waitForLoadState('networkidle')
  79  | 
  80  |     // Find login form
  81  |     const emailInput = page.locator('input[type="email"], input[placeholder*="email" i]').first()
  82  |     const passwordInput = page.locator('input[type="password"]').first()
  83  |     const submitBtn = page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Ingresar")').first()
  84  | 
  85  |     if (await emailInput.isVisible()) {
  86  |       await emailInput.fill(testUser.email)
  87  |       console.log(`✅ Email entered for login`)
  88  |     }
  89  | 
  90  |     if (await passwordInput.isVisible()) {
  91  |       await passwordInput.fill(testUser.password)
  92  |       console.log(`✅ Password entered for login`)
  93  |     }
  94  | 
  95  |     if (await submitBtn.isVisible()) {
  96  |       await submitBtn.click()
  97  |       await page.waitForTimeout(3000)
  98  |       console.log(`✅ Login form submitted`)
  99  |     }
  100 | 
  101 |     // Should redirect to dashboard/app
  102 |     const currentUrl = page.url()
  103 |     console.log(`✅ After login, URL: ${currentUrl}`)
> 104 |     expect([currentUrl.includes('/app'), currentUrl.includes('/dashboard')].some(v => v)).toBeTruthy()
      |                                                                                           ^ Error: expect(received).toBeTruthy()
  105 |   })
  106 | 
  107 |   test('3. Navigate to Catalogs Section', async ({ page }) => {
  108 |     console.log('📂 Navigating to catalogs')
  109 | 
  110 |     await page.goto(`${BASE_URL}/app/catalogs`)
  111 |     await page.waitForLoadState('networkidle')
  112 | 
  113 |     // Check page loaded
  114 |     const url = page.url()
  115 |     expect(url).toContain('catalogs')
  116 |     console.log(`✅ Catalogs page loaded`)
  117 |   })
  118 | 
  119 |   test('4. Create New Catalog', async ({ page }) => {
  120 |     console.log(`📝 Creating catalog: ${testUser.catalogName}`)
  121 | 
  122 |     await page.goto(`${BASE_URL}/app/catalogs`)
  123 |     await page.waitForLoadState('networkidle')
  124 | 
  125 |     // Find create button
  126 |     const createBtn = page.locator('button:has-text("Create"), button:has-text("Crear"), button:has-text("New"), a:has-text("New Catalog")').first()
  127 | 
  128 |     if (await createBtn.isVisible()) {
  129 |       await createBtn.click()
  130 |       await page.waitForTimeout(2000)
  131 |       console.log(`✅ Create button clicked`)
  132 |     }
  133 | 
  134 |     // Fill catalog form
  135 |     const nameInput = page.locator('input[type="text"]').first()
  136 |     const descInput = page.locator('textarea, input[placeholder*="description" i]').first()
  137 |     const submitBtn = page.locator('button[type="submit"], button:has-text("Create"), button:has-text("Save")').first()
  138 | 
  139 |     if (await nameInput.isVisible()) {
  140 |       await nameInput.fill(testUser.catalogName)
  141 |       console.log(`✅ Catalog name entered: ${testUser.catalogName}`)
  142 |     }
  143 | 
  144 |     if (await descInput.isVisible()) {
  145 |       await descInput.fill(testUser.catalogDescription)
  146 |       console.log(`✅ Catalog description entered`)
  147 |     }
  148 | 
  149 |     if (await submitBtn.isVisible()) {
  150 |       await submitBtn.click()
  151 |       await page.waitForTimeout(3000)
  152 |       console.log(`✅ Catalog creation submitted`)
  153 |     }
  154 | 
  155 |     // Extract catalog ID from URL if possible
  156 |     const currentUrl = page.url()
  157 |     const catalogIdMatch = currentUrl.match(/catalog\/([a-f0-9-]+)/) || currentUrl.match(/([a-f0-9-]{36})/)
  158 |     if (catalogIdMatch) {
  159 |       createdCatalogId = catalogIdMatch[1]
  160 |       console.log(`✅ Catalog created with ID: ${createdCatalogId}`)
  161 |     }
  162 |   })
  163 | 
  164 |   test('5. Add Products to Catalog', async ({ page }) => {
  165 |     console.log('🛍️ Adding products to catalog')
  166 | 
  167 |     if (!createdCatalogId) {
  168 |       console.log('⚠️ No catalog ID found, skipping product creation')
  169 |       return
  170 |     }
  171 | 
  172 |     // Navigate to catalog products section
  173 |     await page.goto(`${BASE_URL}/app/catalogs/${createdCatalogId}`)
  174 |     await page.waitForLoadState('networkidle')
  175 | 
  176 |     // For each product, add it
  177 |     for (let i = 0; i < testUser.products.length; i++) {
  178 |       const product = testUser.products[i]
  179 |       console.log(`\n📦 Adding product ${i + 1}: ${product.name}`)
  180 | 
  181 |       // Find add product button
  182 |       const addBtn = page.locator('button:has-text("Add Product"), button:has-text("Agregar"), button:has-text("New Product"), a:has-text("Add")').first()
  183 | 
  184 |       if (await addBtn.isVisible()) {
  185 |         await addBtn.click()
  186 |         await page.waitForTimeout(1500)
  187 |         console.log(`✅ Add product button clicked`)
  188 |       }
  189 | 
  190 |       // Fill product form
  191 |       const inputs = page.locator('input[type="text"]')
  192 |       let inputCount = 0
  193 | 
  194 |       // Product name
  195 |       if (await inputs.nth(inputCount).isVisible()) {
  196 |         await inputs.nth(inputCount).fill(product.name)
  197 |         console.log(`✅ Product name: ${product.name}`)
  198 |         inputCount++
  199 |       }
  200 | 
  201 |       // Description
  202 |       const descInput = page.locator('textarea, input[placeholder*="description" i]').first()
  203 |       if (await descInput.isVisible()) {
  204 |         await descInput.fill(product.description)
```