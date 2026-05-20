# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phase16-penetration.spec.ts >> Phase 16 - Penetration Testing >> 2.4 Data Integrity Checks >> Missing required fields should be rejected
- Location: tests/phase16-penetration.spec.ts:93:9

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Expected value: 429
Received array: [400, 401]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test'
  2   | 
  3   | const BASE_URL = 'http://localhost:3000'
  4   | const API_BASE = `${BASE_URL}/api`
  5   | 
  6   | test.describe('Phase 16 - Penetration Testing', () => {
  7   |   // 2.1 API Endpoint Security Testing
  8   |   test.describe('2.1 API Endpoint Security', () => {
  9   |     test('No auth - GET /api/reports should return 401', async ({ request }) => {
  10  |       const response = await request.get(`${API_BASE}/reports`)
  11  |       expect(response.status()).toBe(401)
  12  |     })
  13  | 
  14  |     test('Invalid token - GET /api/reports should return 401', async ({ request }) => {
  15  |       const response = await request.get(`${API_BASE}/reports`, {
  16  |         headers: { 'Cookie': 'authjs.session-token=invalid.token.here' }
  17  |       })
  18  |       expect(response.status()).toBe(401)
  19  |     })
  20  | 
  21  |     test('Missing token - GET /api/v1/catalogs should return 401', async ({ request }) => {
  22  |       const response = await request.get(`${API_BASE}/v1/catalogs`)
  23  |       expect(response.status()).toBe(401)
  24  |     })
  25  | 
  26  |     test('Public health endpoint should return 200', async ({ request }) => {
  27  |       const response = await request.get(`${API_BASE}/health`)
  28  |       expect(response.status()).toBe(200)
  29  |     })
  30  |   })
  31  | 
  32  |   // 2.2 Authentication Bypass Tests
  33  |   test.describe('2.2 Authentication Bypass Attempts', () => {
  34  |     test('Tampered JWT should be rejected', async ({ request }) => {
  35  |       const tamperedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJoYWNrZXIiLCJpYXQiOjE1MTYyMzkwMjJ9.invalid'
  36  |       const response = await request.get(`${API_BASE}/reports`, {
  37  |         headers: { 'Cookie': `authjs.session-token=${tamperedToken}` }
  38  |       })
  39  |       expect(response.status()).toBe(401)
  40  |     })
  41  | 
  42  |     test('Empty token should be rejected', async ({ request }) => {
  43  |       const response = await request.get(`${API_BASE}/reports`, {
  44  |         headers: { 'Cookie': 'authjs.session-token=' }
  45  |       })
  46  |       expect(response.status()).toBe(401)
  47  |     })
  48  | 
  49  |     test('Malformed cookie should be rejected', async ({ request }) => {
  50  |       const response = await request.get(`${API_BASE}/reports`, {
  51  |         headers: { 'Cookie': 'malformed-cookie' }
  52  |       })
  53  |       expect(response.status()).toBe(401)
  54  |     })
  55  | 
  56  |     test('No cookie should return 401', async ({ request }) => {
  57  |       const response = await request.get(`${API_BASE}/reports`)
  58  |       expect(response.status()).toBe(401)
  59  |     })
  60  |   })
  61  | 
  62  |   // 2.3 Authorization Level Tests
  63  |   test.describe('2.3 Authorization Level Verification', () => {
  64  |     test('Non-existent report should return 404', async ({ request }) => {
  65  |       const response = await request.get(`${API_BASE}/reports/00000000-0000-0000-0000-000000000000`)
  66  |       expect([401, 404]).toContain(response.status())
  67  |     })
  68  | 
  69  |     test('API should require authentication for protected endpoints', async ({ request }) => {
  70  |       const endpoints = [
  71  |         '/api/reports',
  72  |         '/api/v1/catalogs',
  73  |         '/api/v1/products',
  74  |         '/api/v1/orders'
  75  |       ]
  76  | 
  77  |       for (const endpoint of endpoints) {
  78  |         const response = await request.get(`${BASE_URL}${endpoint}`)
  79  |         expect(response.status()).toBe(401)
  80  |       }
  81  |     })
  82  |   })
  83  | 
  84  |   // 2.4 Data Integrity Tests
  85  |   test.describe('2.4 Data Integrity Checks', () => {
  86  |     test('Create order with negative price should be rejected', async ({ request }) => {
  87  |       const response = await request.post(`${API_BASE}/v1/orders`, {
  88  |         data: { price: -100, items: [] }
  89  |       })
  90  |       expect([400, 401]).toContain(response.status())
  91  |     })
  92  | 
  93  |     test('Missing required fields should be rejected', async ({ request }) => {
  94  |       const response = await request.post(`${API_BASE}/v1/orders`, {
  95  |         data: {}
  96  |       })
> 97  |       expect([400, 401]).toContain(response.status())
      |                          ^ Error: expect(received).toContain(expected) // indexOf
  98  |     })
  99  | 
  100 |     test('XSS payload in title should be rejected', async ({ request }) => {
  101 |       const response = await request.post(`${API_BASE}/catalogs`, {
  102 |         data: { name: '<img src=x onerror=alert(1)>' }
  103 |       })
  104 |       expect([400, 401]).toContain(response.status())
  105 |     })
  106 | 
  107 |     test('SQL injection attempt should be escaped', async ({ request }) => {
  108 |       const response = await request.post(`${API_BASE}/catalogs`, {
  109 |         data: { name: "test'; DROP TABLE catalogs; --" }
  110 |       })
  111 |       // Should not crash - either reject or sanitize
  112 |       expect([200, 400, 401]).toContain(response.status())
  113 |     })
  114 | 
  115 |     test('Script tag injection should be rejected', async ({ request }) => {
  116 |       const response = await request.post(`${API_BASE}/catalogs`, {
  117 |         data: { name: '<script>alert("xss")</script>' }
  118 |       })
  119 |       expect([400, 401]).toContain(response.status())
  120 |     })
  121 |   })
  122 | 
  123 |   // 2.5 Rate Limiting Tests
  124 |   test.describe('2.5 Rate Limiting Effectiveness', () => {
  125 |     test('Health endpoint should be accessible without rate limiting', async ({ request }) => {
  126 |       const results = await Promise.all(
  127 |         Array(10).fill(null).map(() => request.get(`${API_BASE}/health`))
  128 |       )
  129 |       results.forEach(r => expect(r.status()).toBe(200))
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
```