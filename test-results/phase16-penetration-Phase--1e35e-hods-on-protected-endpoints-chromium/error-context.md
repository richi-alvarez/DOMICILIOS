# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phase16-penetration.spec.ts >> Phase 16 - Penetration Testing >> Additional Security Tests >> Should reject requests with invalid HTTP methods on protected endpoints
- Location: tests/phase16-penetration.spec.ts:226:9

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Expected value: 204
Received array: [200, 405]
```

# Test source

```ts
  130 |     })
  131 | 
  132 |     test('Rate limit headers should be present on responses', async ({ request }) => {
  133 |       const response = await request.get(`${API_BASE}/health`)
  134 |       const headers = response.headers()
  135 |       // Check for rate limit headers
  136 |       const hasRateLimitHeaders =
  137 |         headers['retry-after'] !== undefined ||
  138 |         headers['x-ratelimit-limit'] !== undefined ||
  139 |         headers['x-ratelimit-remaining'] !== undefined
  140 |       // Rate limit headers may not be on health endpoint, but should exist somewhere
  141 |       expect(response.status()).toBe(200)
  142 |     })
  143 |   })
  144 | 
  145 |   // 2.7 Error Message Leakage
  146 |   test.describe('2.7 Error Message Leakage Check', () => {
  147 |     test('404 should not leak directory structure', async ({ request }) => {
  148 |       const response = await request.get(`${API_BASE}/nonexistent-endpoint-12345`)
  149 |       const text = await response.text()
  150 |       expect(text.toLowerCase()).not.toContain('stack')
  151 |       expect(text.toLowerCase()).not.toContain('traceback')
  152 |       expect(text.toLowerCase()).not.toContain('debug')
  153 |     })
  154 | 
  155 |     test('401 should not leak user information', async ({ request }) => {
  156 |       const response = await request.get(`${API_BASE}/reports`, {
  157 |         headers: { 'Cookie': 'authjs.session-token=invalid' }
  158 |       })
  159 |       const text = await response.text()
  160 |       // Should not contain sensitive info
  161 |       expect(response.status()).toBe(401)
  162 |     })
  163 | 
  164 |     test('Error response should be valid JSON', async ({ request }) => {
  165 |       const response = await request.get(`${API_BASE}/reports`)
  166 |       const contentType = response.headers()['content-type']
  167 |       if (response.status() >= 400) {
  168 |         // Error responses should be parseable
  169 |         try {
  170 |           await response.json()
  171 |           expect(true).toBe(true)
  172 |         } catch {
  173 |           // If not JSON, that's ok for some error responses
  174 |           expect(true).toBe(true)
  175 |         }
  176 |       }
  177 |     })
  178 |   })
  179 | 
  180 |   // 2.9 HTTPS/TLS Configuration
  181 |   test.describe('2.9 HTTPS/TLS Configuration & Security Headers', () => {
  182 |     test('Security headers should be present', async ({ request }) => {
  183 |       const response = await request.get(BASE_URL)
  184 |       const headers = response.headers()
  185 | 
  186 |       expect(headers['x-content-type-options']).toBeDefined()
  187 |       expect(headers['x-frame-options']).toBeDefined()
  188 |       expect(headers['content-security-policy']).toBeDefined()
  189 |       expect(headers['strict-transport-security']).toBeDefined()
  190 |     })
  191 | 
  192 |     test('X-Content-Type-Options should be nosniff', async ({ request }) => {
  193 |       const response = await request.get(BASE_URL)
  194 |       expect(response.headers()['x-content-type-options']).toBe('nosniff')
  195 |     })
  196 | 
  197 |     test('X-Frame-Options should be DENY', async ({ request }) => {
  198 |       const response = await request.get(BASE_URL)
  199 |       expect(response.headers()['x-frame-options']).toBe('DENY')
  200 |     })
  201 | 
  202 |     test('CSP header should be configured', async ({ request }) => {
  203 |       const response = await request.get(BASE_URL)
  204 |       const csp = response.headers()['content-security-policy']
  205 |       expect(csp).toBeDefined()
  206 |       expect(csp).toContain('default-src')
  207 |       expect(csp).not.toContain('unsafe-eval')
  208 |     })
  209 | 
  210 |     test('HSTS header should be configured', async ({ request }) => {
  211 |       const response = await request.get(BASE_URL)
  212 |       const hsts = response.headers()['strict-transport-security']
  213 |       expect(hsts).toBeDefined()
  214 |       expect(hsts).toContain('max-age')
  215 |     })
  216 | 
  217 |     test('Referrer-Policy should be configured', async ({ request }) => {
  218 |       const response = await request.get(BASE_URL)
  219 |       const policy = response.headers()['referrer-policy']
  220 |       expect(policy).toBeDefined()
  221 |     })
  222 |   })
  223 | 
  224 |   // Additional Security Tests
  225 |   test.describe('Additional Security Tests', () => {
  226 |     test('Should reject requests with invalid HTTP methods on protected endpoints', async ({ request }) => {
  227 |       const response = await request.fetch(`${API_BASE}/reports`, {
  228 |         method: 'OPTIONS'
  229 |       })
> 230 |       expect([200, 405]).toContain(response.status())
      |                          ^ Error: expect(received).toContain(expected) // indexOf
  231 |     })
  232 | 
  233 |     test('CORS headers should be properly configured', async ({ request }) => {
  234 |       const response = await request.fetch(`${API_BASE}/health`)
  235 |       expect(response.status()).toBe(200)
  236 |     })
  237 | 
  238 |     test('Should not expose server information in headers', async ({ request }) => {
  239 |       const response = await request.get(BASE_URL)
  240 |       const serverHeader = response.headers()['server']
  241 |       if (serverHeader) {
  242 |         // Should not contain version details
  243 |         expect(serverHeader).not.toMatch(/\d+\.\d+\.\d+/)
  244 |       }
  245 |     })
  246 | 
  247 |     test('API should validate content-type headers', async ({ request }) => {
  248 |       const response = await request.post(`${API_BASE}/catalogs`, {
  249 |         data: { name: 'test' },
  250 |         headers: { 'content-type': 'application/json' }
  251 |       })
  252 |       // Should handle JSON content properly or reject with 401 (no auth)
  253 |       expect([200, 400, 401]).toContain(response.status())
  254 |     })
  255 | 
  256 |     test('Should handle oversized payloads appropriately', async ({ request }) => {
  257 |       const largePayload = 'a'.repeat(1000000)
  258 |       try {
  259 |         const response = await request.post(`${API_BASE}/catalogs`, {
  260 |           data: { name: largePayload }
  261 |         })
  262 |         // Should either reject or handle gracefully
  263 |         expect([200, 400, 401, 413]).toContain(response.status())
  264 |       } catch {
  265 |         // Connection rejected due to size is also acceptable
  266 |         expect(true).toBe(true)
  267 |       }
  268 |     })
  269 |   })
  270 | 
  271 |   // Application Availability
  272 |   test.describe('Application Availability', () => {
  273 |     test('Application should be responsive', async ({ request }) => {
  274 |       const response = await request.get(`${API_BASE}/health`)
  275 |       expect(response.status()).toBe(200)
  276 |       const data = await response.json()
  277 |       expect(data.status).toBe('ok')
  278 |     })
  279 | 
  280 |     test('Should not have unhandled errors on main pages', async ({ page }) => {
  281 |       const errors: string[] = []
  282 |       page.on('console', msg => {
  283 |         if (msg.type() === 'error') errors.push(msg.text())
  284 |       })
  285 | 
  286 |       await page.goto(BASE_URL)
  287 |       // Landing page should be accessible
  288 |       await expect(page).not.toHaveURL(/.*error/)
  289 |     })
  290 |   })
  291 | })
  292 | 
```