# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phase16-penetration.spec.ts >> Phase 16 - Penetration Testing >> 2.1 API Endpoint Security >> Missing token - GET /api/v1/catalogs should return 401
- Location: tests/phase16-penetration.spec.ts:21:9

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 401
Received: 404
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
> 23  |       expect(response.status()).toBe(401)
      |                                 ^ Error: expect(received).toBe(expected) // Object.is equality
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
  97  |       expect([400, 401]).toContain(response.status())
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
```