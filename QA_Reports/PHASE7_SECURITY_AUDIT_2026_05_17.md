# Phase 7: Security & Compliance Audit
**Date**: 2026-05-17  
**Status**: 🔍 **AUDIT IN PROGRESS**

---

## Executive Summary

Security audit of the domicilios platform identified **3 CRITICAL** and **5 HIGH** risk issues requiring immediate remediation before production deployment.

---

## Critical Issues Found

### 🔴 CRITICAL #1: Debug Endpoint Exposes All User Data
**File**: `app/api/auth/debug/route.ts`  
**Risk Level**: CRITICAL  
**Severity**: 🔥 Immediate remediation required

**Issue**:
- Endpoint `/api/auth/debug` returns ALL users, OAuth accounts, sessions, organizations
- No authentication/authorization check
- Accessible to anyone on the internet
- Violates GDPR/privacy regulations
- Exposes internal system state

**Exposed Data**:
```
- User IDs, emails, names, creation dates
- OAuth provider details
- JWT session tokens
- Organization structure
- Owner relationships
```

**Impact**: Full database enumeration, privacy breach, regulatory violation

**Fix**: Delete the entire endpoint (development-only debug, not needed in production)

---

### 🔴 CRITICAL #2: Missing Authorization in API Endpoints
**File**: `app/api/catalogs/[id]/route.ts`  
**Risk Level**: CRITICAL  
**Severity**: 🔥 Unauthorized data access

**Issue**:
- GET endpoint returns catalog data without verifying user ownership
- Any authenticated user can access ANY catalog
- No authorization checks present
- Returns full catalog details (including internal config)

**Current Code**:
```typescript
const catalog = await db.query.catalogs.findFirst({
  where: eq(catalogs.id, id)
})
// ❌ No check: if (catalog.userId !== session.user.id)
return NextResponse.json(catalog)
```

**Impact**: Cross-user data access, business information leak, competitive intelligence theft

**Fix**: Add authorization check before returning data

---

### 🔴 CRITICAL #3: Dangerous OAuth Email Linking Enabled
**File**: `auth.ts` line 26  
**Risk Level**: CRITICAL  
**Severity**: 🔥 Account takeover vulnerability

**Issue**:
```typescript
Google({
  allowDangerousEmailAccountLinking: true,  // ❌ DANGEROUS
})
```

**Attack Vector**:
1. Attacker controls email user@example.com
2. Attacker creates Google account with that email
3. If legitimate user had credentials auth for that email
4. Attacker can now sign in via Google and access the account
5. Legitimate user loses access

**Impact**: Account takeover, data theft, user data compromise

**Fix**: Remove `allowDangerousEmailAccountLinking` (default is false/safe)

---

## High Risk Issues

### 🟠 HIGH #1: Generic Error Messages Leak System Details
**File**: Multiple API routes  
**Issue**: Error messages expose database errors, file paths, internal state

```typescript
// ❌ BAD - leaks details
catch (error) {
  return NextResponse.json(
    { error: String(error) },  // Exposes error message
    { status: 500 }
  )
}

// ✅ GOOD - generic message
catch (error) {
  logger.error('Catalog fetch failed', error)
  return NextResponse.json(
    { error: 'Unable to load catalog' },
    { status: 500 }
  )
}
```

**Impact**: Information disclosure, reconnaissance for attacks

---

### 🟠 HIGH #2: No Rate Limiting on APIs
**Issue**: 
- No rate limiting on authentication endpoints
- No protection against brute force attacks
- AI generation endpoints can be abused for cost attacks
- Public endpoints (health, docs) unrestricted

**Attack Scenarios**:
- Brute force password attempts (credentials auth)
- AI generation spam (costly)
- DDoS via health checks

**Impact**: Brute force attacks possible, cost explosion from abuse

---

### 🟠 HIGH #3: Insufficient Input Validation
**File**: Various API routes and server actions  
**Issue**: 
- String inputs not sanitized for length
- Numbers not validated for ranges
- No schema validation on POST endpoints
- User inputs directly used in prompts (prompt injection risk)

**Example**:
```typescript
// From menu-scan.ts
const response = await client.messages.create({
  messages: [{
    role: 'user',
    content: userPrompt  // ❌ No sanitization
  }]
})
```

**Impact**: Prompt injection, buffer overflows, injection attacks

---

### 🟠 HIGH #4: Secrets Potentially Exposed in Logs
**File**: `auth.ts` lines 63-80, 85-90, etc.  
**Issue**: 
- User IDs, emails logged in console
- Token information logged
- Debug mode logging too verbose in production code
- Logs may be captured in external services

**Example**:
```typescript
console.log('[JWT CALLBACK] Token final:', {
  id: token?.id,
  email: token?.email,  // ❌ Should not log
})
```

**Impact**: Secret leakage through logs, audit trail compromise

---

### 🟠 HIGH #5: TypeScript Strict Mode Disabled
**File**: `next.config.ts` line 4  
**Issue**:
```typescript
typescript: { ignoreBuildErrors: true },  // ❌ Ignoring type errors
```

**Impact**: Type safety bypassed, silent bugs, security vulnerabilities missed

---

## Medium Risk Issues

### 🟡 MEDIUM #1: Missing Security Headers
**Issue**: No Content-Security-Policy, X-Frame-Options, etc.

**Fix Needed**:
```typescript
// next.config.ts or middleware.ts
const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
}
```

---

### 🟡 MEDIUM #2: Production Build Configuration Issues
**Issue**: Browser source maps not disabled in production

**Fix**:
```typescript
// next.config.ts
productionBrowserSourceMaps: false,  // ❌ Currently true or missing
```

---

### 🟡 MEDIUM #3: Database Queries Not Using Parameterization
**Issue**: While Drizzle ORM prevents SQL injection, some queries could be more secure

---

## OWASP Top 10 Compliance

| Vulnerability | Status | Details |
|--------------|--------|---------|
| A01: Broken Access Control | 🔴 CRITICAL | Missing authorization checks in APIs |
| A02: Cryptographic Failures | 🟢 OK | bcrypt password hashing implemented |
| A03: Injection | 🟡 MEDIUM | Input validation needs strengthening |
| A04: Insecure Design | 🟠 HIGH | Missing rate limiting |
| A05: Security Misconfiguration | 🔴 CRITICAL | Debug endpoint exposed |
| A06: Vulnerable Components | 🟢 UNKNOWN | Need dependency audit |
| A07: Authentication | 🔴 CRITICAL | Dangerous email linking enabled |
| A08: Data Integrity | 🟡 MEDIUM | No signing/verification of sensitive data |
| A09: Logging/Monitoring | 🟠 HIGH | Excessive logging of sensitive data |
| A10: SSRF/Injection | 🟢 OK | No obvious SSRF vectors |

---

## Compliance Checklist

### GDPR (EU Privacy)
- [ ] User data deletion capability
- [ ] Data export functionality
- [ ] Privacy policy link
- [ ] Cookie consent
- [ ] PII in logs removed
- [ ] Third-party data sharing documented

### CCPA (California Privacy)
- [ ] Opt-out mechanism
- [ ] Data sale disclosure
- [ ] Privacy rights documented

### Data Security
- [ ] Database encryption at rest (Neon provides)
- [ ] TLS/HTTPS in transit (needed)
- [ ] API key rotation procedures (needed)
- [ ] Secrets not in git (needed: git hooks)
- [ ] Audit logging (partially implemented)

---

## Remediation Plan

### IMMEDIATE (Before Production)

1. **Delete Debug Endpoint** (5 min)
   - Remove `/api/auth/debug/route.ts`
   - Add note about debug info in README dev section

2. **Add Authorization to Catalogs Endpoint** (15 min)
   - Check user ownership before returning data
   - Same for all user-specific endpoints

3. **Fix OAuth Configuration** (5 min)
   - Remove `allowDangerousEmailAccountLinking: true`
   - Test OAuth flow still works

4. **Generic Error Messages** (30 min)
   - Audit all API routes
   - Remove error.message from responses
   - Log details internally, return generic messages

### WEEK 1

5. **Input Validation Layer** (2 hours)
   - Create validation schemas (zod/valibot)
   - Apply to all POST/PUT/PATCH endpoints
   - Sanitize user inputs before AI prompts

6. **Remove Sensitive Logs** (1 hour)
   - Remove email, tokens from console.log
   - Use logger instead of console
   - Filter logs in production

7. **TypeScript Strict Mode** (2 hours)
   - Remove ignoreBuildErrors
   - Fix type errors
   - Improve type safety

### WEEK 2

8. **Security Headers** (1 hour)
   - Add CSP, X-Frame-Options, etc.
   - Configure in middleware.ts

9. **Rate Limiting** (2 hours)
   - Install `next-rate-limit` or similar
   - Rate limit: auth (5 req/min), AI (1 req/sec)
   - Return 429 status when exceeded

10. **Dependency Audit** (1 hour)
    - Run `npm audit`
    - Update vulnerable packages
    - Document known issues

### WEEK 3

11. **Data Privacy** (3 hours)
    - Add user data deletion (GDPR)
    - Add data export feature
    - Add privacy policy
    - Cookie consent banner

12. **API Key Rotation** (1 hour)
    - Document rotation procedures
    - Add automated rotation prompts
    - Create key versioning

13. **Secrets Management** (2 hours)
    - Add pre-commit hook to prevent .env in git
    - Document .env example for all required keys
    - Use Neon's built-in secret rotation

---

## Priority Order

**DO FIRST** (Before Deployment):
1. ✅ Delete debug endpoint
2. ✅ Add authorization checks
3. ✅ Fix OAuth linking
4. ✅ Generic error messages

**MUST DO** (Before Production):
5. ✅ Input validation
6. ✅ Remove sensitive logs
7. ✅ Security headers

**SHOULD DO** (Production Quality):
8. Rate limiting
9. TypeScript strict
10. Dependency audit

**NICE TO HAVE** (Enhancement):
11. GDPR features
12. API key rotation
13. Secrets management

---

## Testing Checklist

### Authentication Testing
- [ ] Cannot access other user's data
- [ ] Cannot bypass authorization with JWT manipulation
- [ ] OAuth email linking doesn't allow account takeover
- [ ] Login fails with wrong password
- [ ] Rate limiting blocks excessive attempts

### Data Privacy Testing
- [ ] No PII in logs
- [ ] No secrets in error messages
- [ ] Debug endpoints removed
- [ ] Database queries parameterized

### Security Headers Testing
- [ ] CSP header present
- [ ] X-Frame-Options set
- [ ] X-Content-Type-Options set
- [ ] HSTS enabled for HTTPS

---

## Files to Modify

| File | Issue | Action |
|------|-------|--------|
| `app/api/auth/debug/route.ts` | Debug endpoint | DELETE |
| `app/api/catalogs/[id]/route.ts` | No auth | ADD auth check |
| `auth.ts` | Dangerous email linking | REMOVE flag |
| All API routes | Generic errors | UPDATE error handling |
| `auth.ts` | Sensitive logs | REMOVE console.log |
| `next.config.ts` | Type errors ignored | FIX ignoreBuildErrors |
| `middleware.ts` (create) | Security headers | CREATE new |
| Multiple routes | Rate limiting | ADD middleware |

---

## Sign-Off Checklist

- [ ] All CRITICAL issues remediated
- [ ] All HIGH issues have fixes implemented
- [ ] OWASP A01-A07 addressed
- [ ] Security headers configured
- [ ] No debug endpoints exposed
- [ ] No sensitive data in logs
- [ ] Authorization checks in place
- [ ] Input validation implemented
- [ ] Error messages genericized
- [ ] Rate limiting active

---

**Status**: 🔄 AUDIT COMPLETE — REMEDIATION STARTING

**Next Step**: Implement fixes in priority order

