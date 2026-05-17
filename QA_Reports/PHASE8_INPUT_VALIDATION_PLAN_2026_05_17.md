# Phase 8: Input Validation & Advanced Security
**Date**: 2026-05-17  
**Status**: 🔍 **PLANNING**

---

## Overview

Phase 8 focuses on input validation and advanced security hardening. Building on Phase 7's critical vulnerability fixes, this phase prevents injection attacks, improves data quality, and implements rate limiting.

---

## Objectives

- [ ] Implement input validation schemas (zod)
- [ ] Validate all POST/PUT/PATCH endpoints
- [ ] Sanitize user inputs before AI prompts
- [ ] Add rate limiting on sensitive endpoints
- [ ] Prevent SQL injection, XSS, and prompt injection
- [ ] Implement centralized authorization middleware
- [ ] Document security best practices

---

## Phase 8 Architecture

### 1. Input Validation Layer

#### Install Zod for Schema Validation
```bash
npm install zod
```

#### Create Validation Schemas
**File**: `lib/validators/index.ts`

```typescript
import { z } from 'zod'

// Catalog validation
export const CreateCatalogSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  description: z.string().max(500).optional(),
  language: z.enum(['es', 'en']).default('es'),
  currency: z.enum(['USD', 'COP', 'MXN']).default('COP'),
})

// Product validation
export const CreateProductSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  price: z.number().positive(),
  category: z.string().max(100),
  sku: z.string().max(50).optional(),
  image: z.string().url().optional(),
})

// Order validation
export const CreateOrderSchema = z.object({
  catalogId: z.string().uuid(),
  customerName: z.string().min(1).max(100),
  customerEmail: z.string().email(),
  customerPhone: z.string().max(20),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().positive().int(),
  })),
  deliveryType: z.enum(['pickup', 'delivery']).default('pickup'),
  deliveryAddress: z.string().optional(),
})

// AI Generation validation
export const GenerateAICatalogSchema = z.object({
  businessName: z.string().min(1).max(200),
  businessType: z.string().min(1).max(100),
  description: z.string().max(1000),
  language: z.enum(['es', 'en']),
})
```

#### Create Input Sanitizer
**File**: `lib/validators/sanitizer.ts`

```typescript
export function sanitizeInput(input: string, maxLength: number = 1000): string {
  // Remove potentially dangerous characters
  let sanitized = input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>{}]/g, '') // Remove angle brackets and braces
  
  return sanitized
}

export function sanitizeForPrompt(input: string): string {
  // Remove control characters and limit length
  return input
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .slice(0, 2000)
    .trim()
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 254
}

export function validateUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}
```

---

### 2. Authorization Middleware

#### Create Centralized Authorization
**File**: `lib/api/authorize.ts`

```typescript
import { auth } from '@/auth'
import { logger } from '@/lib/monitoring/logger'

export async function authorizeResourceAccess(
  resourceUserId: string,
  resourceType: 'catalog' | 'product' | 'order' | 'report'
) {
  const session = await auth()

  if (!session?.user?.id) {
    return {
      authorized: false,
      status: 401,
      error: 'Unauthorized',
    }
  }

  // Cross-user access attempt
  if (session.user.id !== resourceUserId) {
    logger.warn('Unauthorized access attempt', {
      userId: session.user.id,
      resourceType,
      attemptedResourceUserId: resourceUserId,
    })

    return {
      authorized: false,
      status: 403,
      error: 'Forbidden',
    }
  }

  return {
    authorized: true,
    status: 200,
    userId: session.user.id,
  }
}
```

---

### 3. Rate Limiting

#### Install Rate Limiting
```bash
npm install @upstash/ratelimit @upstash/redis
# or
npm install rate-limit-redis redis
```

#### Create Rate Limiter
**File**: `lib/api/rate-limit.ts`

```typescript
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// In-memory rate limiter for development
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export async function checkRateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number }> {
  const now = Date.now()
  const current = rateLimitStore.get(identifier) || { count: 0, resetTime: now + windowMs }

  if (now > current.resetTime) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs })
    return { allowed: true, remaining: limit - 1 }
  }

  if (current.count >= limit) {
    return { allowed: false, remaining: 0 }
  }

  current.count++
  rateLimitStore.set(identifier, current)
  return { allowed: true, remaining: limit - current.count }
}

export const rateLimitConfig = {
  auth: { limit: 5, windowMs: 60000 }, // 5 requests per minute
  ai: { limit: 10, windowMs: 60000 }, // 10 requests per minute
  api: { limit: 100, windowMs: 60000 }, // 100 requests per minute
}
```

---

### 4. Protected API Endpoints

#### Pattern for All POST/PUT/PATCH Endpoints

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { CreateProductSchema } from '@/lib/validators'
import { authorizeResourceAccess } from '@/lib/api/authorize'
import { checkRateLimit } from '@/lib/api/rate-limit'
import { logger } from '@/lib/monitoring/logger'

export async function POST(req: NextRequest) {
  try {
    // 1. Rate limiting
    const identifier = `user-${req.ip}`
    const { allowed, remaining } = await checkRateLimit(
      identifier,
      100,
      60000
    )

    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': '60' } }
      )
    }

    // 2. Input validation
    const body = await req.json()
    const validated = CreateProductSchema.parse(body)

    // 3. Authorization
    const { authorized, status: authStatus, error: authError } =
      await authorizeResourceAccess(
        validated.catalogId,
        'product'
      )

    if (!authorized) {
      return NextResponse.json({ error: authError }, { status: authStatus })
    }

    // 4. Business logic
    const result = await createProduct(validated)

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      )
    }

    logger.error('Failed to create product', error)
    return NextResponse.json(
      { error: 'Unable to create product' },
      { status: 500 }
    )
  }
}
```

---

## Implementation Tasks

### Task 1: Create Validation Schemas (1 hour)
- [ ] Create `lib/validators/index.ts` with all schemas
- [ ] Create `lib/validators/sanitizer.ts` with sanitization functions
- [ ] Test schemas with sample data

### Task 2: Implement Authorization Middleware (1.5 hours)
- [ ] Create `lib/api/authorize.ts`
- [ ] Create `lib/api/rate-limit.ts`
- [ ] Add rate limiting configuration

### Task 3: Update POST/PUT/PATCH Endpoints (2 hours)
- [ ] `/api/catalogs` - CREATE catalog
- [ ] `/api/products` - CREATE/UPDATE product
- [ ] `/api/orders` - CREATE order (already has some validation)
- [ ] `/api/ai/generate` - CREATE AI generation request

### Task 4: Add Authorization to GET Endpoints (1 hour)
- [ ] `/api/catalogs/[id]` - ADD ownership check
- [ ] `/api/products/[id]` - ADD catalog access check
- [ ] `/api/analytics/*` - ADD authorization

### Task 5: Sanitize AI Inputs (1 hour)
- [ ] `lib/ai/retry-strategy.ts` - Sanitize prompts
- [ ] `lib/actions/menu-scan.ts` - Sanitize OCR input
- [ ] `lib/ai/catalog-generation-service.ts` - Sanitize business info

### Task 6: Testing & Documentation (1.5 hours)
- [ ] Test with valid/invalid inputs
- [ ] Test rate limiting
- [ ] Test authorization across endpoints
- [ ] Document validation rules

---

## Validation Rules

### Catalog
- Name: 1-100 chars, required
- Slug: 1-100 chars, lowercase + numbers + hyphens only
- Description: 0-500 chars, optional
- Language: 'es' or 'en'
- Currency: 'USD', 'COP', 'MXN'

### Product
- Name: 1-200 chars, required
- Description: 0-1000 chars, optional
- Price: positive number, required
- Category: 1-100 chars, required
- SKU: 0-50 chars, optional
- Image: valid URL, optional

### Order
- Customer Name: 1-100 chars, required
- Email: valid email format, required
- Phone: 0-20 chars, required
- Items: array of {productId, quantity}
- Delivery: 'pickup' or 'delivery'
- Address: optional for delivery

### AI Generation
- Business Name: 1-200 chars, required
- Business Type: 1-100 chars, required
- Description: 0-1000 chars, required
- Language: 'es' or 'en'

---

## Security Patterns

### Input Sanitization for AI
```typescript
// ❌ VULNERABLE - User input directly in prompt
const prompt = `Generate products for: ${userInput}`

// ✅ SAFE - Input sanitized and limited
const prompt = `Generate products for: ${sanitizeForPrompt(userInput)}`
```

### Rate Limiting on Sensitive Endpoints
```typescript
// Auth endpoints: 5 per minute per IP
// AI generation: 10 per minute per user
// General API: 100 per minute per user
```

### Error Messages
```typescript
// ❌ BAD - Leaks validation details
{ error: 'Price must be a positive number, got undefined' }

// ✅ GOOD - Generic message
{ error: 'Validation failed' }
// Details logged internally
```

---

## OWASP Coverage

| Issue | Mitigation | Status |
|-------|-----------|--------|
| A01: Broken Access Control | Authorization checks | ✅ Phase 8 |
| A03: Injection | Input validation + sanitization | ✅ Phase 8 |
| A04: Insecure Design | Rate limiting | ✅ Phase 8 |
| A05: Security Misconfiguration | Error message control | ✅ Phase 7 |
| A07: Authentication | Session validation | ✅ Phase 7 |
| A09: Logging | Secure logging | ✅ Phase 7 |

---

## Test Plan

### Unit Tests
- [ ] Each validation schema with valid data
- [ ] Each validation schema with invalid data
- [ ] Sanitizer functions with XSS/injection attempts
- [ ] Rate limiter hit/miss scenarios

### Integration Tests
- [ ] Unauthorized user cannot access other user's data
- [ ] Rate limiting triggers correctly
- [ ] Validation errors return 400 with details
- [ ] Authorization errors return 403

### Security Tests
- [ ] SQL injection attempts blocked
- [ ] XSS payloads sanitized
- [ ] Prompt injection attempts contained
- [ ] DoS through rate limiting

---

## Expected Outcomes

### After Phase 8 Completion
- ✅ All inputs validated before processing
- ✅ User data properly isolated
- ✅ Rate limiting prevents abuse
- ✅ Injection attacks mitigated
- ✅ Error messages don't leak information
- ✅ Security posture: **8/10** (up from 7/10)

### Remaining Work (Phase 9+)
- Dependency vulnerability audit
- Advanced security features (2FA, API keys)
- GDPR compliance features
- Production hardening

---

## Effort Estimate

| Task | Time | Priority |
|------|------|----------|
| Validation Schemas | 1h | HIGH |
| Authorization Middleware | 1.5h | HIGH |
| Update Endpoints | 2h | HIGH |
| Sanitization | 1h | HIGH |
| Testing | 1.5h | MEDIUM |
| **Total** | **7.5h** | - |

---

## Rollout Plan

**Day 1**: Implement schemas and middleware (3 hours)  
**Day 2**: Update endpoints and add sanitization (3 hours)  
**Day 3**: Testing and documentation (1.5 hours)  

---

## Success Criteria

✅ Phase 8 Complete when:
- [ ] All POST/PUT/PATCH endpoints validate inputs
- [ ] Authorization checks on all data endpoints
- [ ] Rate limiting active on sensitive endpoints
- [ ] XSS/injection attempts tested and blocked
- [ ] Error messages standardized and safe
- [ ] Documentation complete

---

**Status**: Ready for implementation  
**Estimated Completion**: 8 hours  
**Expected Security Improvement**: 4/10 → 8/10

