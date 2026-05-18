# Phase 6: Performance Optimization Plan
**Date**: 2026-05-17  
**Status**: 📋 **READY FOR IMPLEMENTATION**

---

## Overview

Based on load testing results (100% success rate, 761ms avg response), we can optimize performance with targeted improvements. No critical issues found, but optimization will prepare for production scale.

---

## Optimization Strategies

### 1. Database Optimization

#### 1.1 Add Indexes on Hot Queries
```sql
-- Catalogs lookup by user
CREATE INDEX idx_catalogs_user_id ON catalogs(user_id);

-- Users authentication
CREATE INDEX idx_users_email ON users(email);

-- API usage logs
CREATE INDEX idx_api_logs_timestamp ON ai_generation_logs(created_at DESC);

-- Daily metrics
CREATE INDEX idx_daily_metrics_date ON daily_usage_metrics(date DESC, user_id);
```

**Expected Impact**: 20-30% faster queries

#### 1.2 Query Optimization
```typescript
// Before: N+1 query problem
const catalogs = await getCatalogs(userId)
for (const catalog of catalogs) {
  catalog.products = await getProducts(catalog.id) // N queries!
}

// After: Single query with join
const catalogs = await db
  .select()
  .from(catalogs)
  .leftJoin(products, eq(products.catalogId, catalogs.id))
  .where(eq(catalogs.userId, userId))
```

**Expected Impact**: 50%+ faster for multi-item queries

#### 1.3 Connection Pooling Optimization
```typescript
// .env.local
DATABASE_URL_POOL_SIZE=20  // Current might be 10
DATABASE_IDLE_TIMEOUT=30000  // 30 seconds
```

**Expected Impact**: 10-15% faster under concurrent load

---

### 2. Application-Level Caching

#### 2.1 Redis Cache Layer
```bash
npm install redis ioredis
```

```typescript
// lib/cache/redis-client.ts
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

export async function getCatalogWithCache(catalogId: string) {
  const cached = await redis.get(`catalog:${catalogId}`)
  if (cached) return JSON.parse(cached)

  const catalog = await db.query.catalogs.findFirst({
    where: eq(catalogs.id, catalogId),
  })

  if (catalog) {
    await redis.setex(`catalog:${catalogId}`, 3600, JSON.stringify(catalog))
  }

  return catalog
}
```

**Expected Impact**: 60-70% faster for cached queries (if hit rate 70%)

#### 2.2 API Response Caching
```typescript
// lib/cache/response-cache.ts
export async function withResponseCache(
  key: string,
  fn: () => Promise<any>,
  ttl = 3600,
) {
  const cached = await redis.get(key)
  if (cached) return JSON.parse(cached)

  const data = await fn()
  await redis.setex(key, ttl, JSON.stringify(data))
  return data
}
```

**Usage**:
```typescript
// In API route
export async function GET() {
  const data = await withResponseCache(
    'catalog-list:' + userId,
    () => getCatalogs(userId),
    1800,  // 30 minutes
  )
  return Response.json(data)
}
```

**Expected Impact**: 80%+ faster for high-traffic endpoints

---

### 3. Frontend Optimization

#### 3.1 Image Optimization
```typescript
// Use Next.js Image component
import Image from 'next/image'

export function ProductImage({ src, alt }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={300}
      height={300}
      quality={75}  // 75% quality for web
      placeholder="blur"  // Blur while loading
      priority={false}
    />
  )
}
```

**Expected Impact**: 30-40% faster image loading

#### 3.2 Code Splitting
```typescript
// Dynamic imports for large components
import dynamic from 'next/dynamic'

const ExpensiveChart = dynamic(
  () => import('@/components/charts/ExpensiveChart'),
  { loading: () => <ChartSkeleton />, ssr: false }
)

export function Dashboard() {
  return (
    <>
      <QuickStats />  // Loaded immediately
      <ExpensiveChart />  // Lazy loaded
    </>
  )
}
```

**Expected Impact**: 15-25% faster initial page load

#### 3.3 Asset Compression
```typescript
// next.config.js
module.exports = {
  compress: true,  // GZIP compression
  swcMinify: true,  // SWC minification
  productionBrowserSourceMaps: false,  // Don't expose source maps
}
```

**Expected Impact**: 40-50% smaller JS bundles

---

### 4. API Optimization

#### 4.1 Response Pagination
```typescript
// lib/api/pagination.ts
export async function getPaginatedCatalogs(userId: string, page = 1, limit = 20) {
  const offset = (page - 1) * limit

  const [catalogs, total] = await Promise.all([
    db.query.catalogs
      .findMany({
        where: eq(catalogs.userId, userId),
        limit,
        offset,
        orderBy: desc(catalogs.createdAt),
      }),
    db
      .select({ count: count() })
      .from(catalogs)
      .where(eq(catalogs.userId, userId)),
  ])

  return {
    data: catalogs,
    total: total[0].count,
    page,
    limit,
    pages: Math.ceil(total[0].count / limit),
  }
}
```

**Expected Impact**: Reduce API response payload by 50-70%

#### 4.2 Lazy Loading Fields
```typescript
// Only fetch needed fields
export async function getCatalogSummary(catalogId: string) {
  return db.query.catalogs.findFirst({
    where: eq(catalogs.id, catalogId),
    columns: {
      id: true,
      name: true,
      slug: true,
      createdAt: true,
      // Don't fetch: description, fullConfig, etc
    },
  })
}
```

**Expected Impact**: 20-30% smaller payloads

#### 4.3 HTTP Compression
```typescript
// lib/middleware/compression.ts
import compression from 'compression'

export const compressMiddleware = compression({
  threshold: 1024,  // Only compress > 1KB
  level: 6,  // Balance speed vs compression
})
```

**Expected Impact**: 50-60% smaller responses

---

### 5. AI API Optimization

#### 5.1 Prompt Caching
```typescript
// Cache AI responses for identical requests
export async function generateWithCache(businessInfo: BusinessInfo) {
  const cacheKey = `ai:${hashBusinessInfo(businessInfo)}`

  const cached = await redis.get(cacheKey)
  if (cached) return JSON.parse(cached)

  const result = await aiProvider.generate(businessInfo)
  await redis.setex(cacheKey, 86400, JSON.stringify(result))  // 24h cache

  return result
}
```

**Expected Impact**: 80%+ faster for repeat requests, 30-40% cost savings

#### 5.2 Token Optimization
```typescript
// Reduce tokens in prompts
const OPTIMIZED_PROMPT = `
Analyze: ${businessName}
${description.substring(0, 200)}

Return JSON: {
  categories: [...],
  products: [{name, price}]
}
`

// Instead of: Full detailed prompt (300+ tokens)
```

**Expected Impact**: 20-30% fewer tokens, 20-30% cost reduction

---

## Implementation Roadmap

### Week 1: Database Optimization
- [ ] Add indexes (1 hour)
- [ ] Optimize N+1 queries (2 hours)
- [ ] Test with load runner (1 hour)
- **Expected Result**: 25-30% improvement

### Week 2: Caching Layer
- [ ] Setup Redis (1 hour)
- [ ] Implement catalog cache (2 hours)
- [ ] Implement response cache (2 hours)
- [ ] Test cache hit rates (1 hour)
- **Expected Result**: 60-70% for cached queries

### Week 3: Frontend Optimization
- [ ] Image optimization (1 hour)
- [ ] Code splitting (2 hours)
- [ ] Asset compression (1 hour)
- [ ] Test with Lighthouse (1 hour)
- **Expected Result**: 30-40% faster initial load

### Week 4: API & Cost Optimization
- [ ] Pagination (2 hours)
- [ ] AI prompt optimization (2 hours)
- [ ] Response compression (1 hour)
- [ ] Load test optimized version (1 hour)
- **Expected Result**: 40-50% reduction in costs

---

## Performance Targets After Optimization

| Metric | Current | Target | Improvement |
|--------|---------|--------|-------------|
| Avg Response Time | 761ms | 400ms | 47% faster |
| P95 Response | 1,156ms | 600ms | 48% faster |
| P99 Response | 1,287ms | 700ms | 46% faster |
| Throughput | 12 req/s | 40+ req/s | 3.3x faster |
| Cache Hit Rate | N/A | 70%+ | - |
| API Cost/Request | Baseline | -30% | 30% cheaper |
| JS Bundle Size | Current | -40% | 40% smaller |

---

## Estimated Impact

### Response Time Improvement
```
Scenario: 100 concurrent users, 10 req each

Current: 761ms avg × 100 = 76,100ms total time
Optimized: 400ms avg × 100 = 40,000ms total time

Improvement: 47% faster
Time saved: 36,100ms per batch
```

### Cost Reduction
```
Current: $0.0089 per generation (observed in Phase 6)
Optimized: $0.0063 per generation (30% reduction)

Monthly usage: 10,000 generations
Current cost: $89/month
Optimized cost: $63/month
Monthly savings: $26
```

### Throughput Improvement
```
Current: 12 req/sec × 86,400 sec/day = 1,036,800 req/day
Optimized: 40 req/sec × 86,400 sec/day = 3,456,000 req/day

Improvement: 3.3x capacity increase
New capacity: ~3.5M requests/day
```

---

## Risk Assessment

### Low Risk Changes
- ✅ Add database indexes (safe, read-only impact)
- ✅ Image optimization (progressive enhancement)
- ✅ Response compression (transparent)

### Medium Risk Changes
- ⚠️ Redis caching (requires cache invalidation logic)
- ⚠️ Query optimization (needs testing)
- ⚠️ Prompt changes (might affect AI quality)

### Mitigation Strategies
1. **Test with load runner** after each change
2. **Monitor metrics dashboard** for issues
3. **Gradual rollout** to 10% of users first
4. **Fallback cache invalidation** (TTL-based)

---

## Success Criteria

✅ **Phase 6 Complete when**:
- [x] Load test framework implemented
- [x] Performance baseline established
- [x] Response times measured
- [x] Bottlenecks identified
- [x] Optimization plan created
- [x] Scaling strategy documented

✅ **Optimization Complete when**:
- [ ] All optimizations implemented
- [ ] 40%+ performance improvement achieved
- [ ] Load test passes with optimized version
- [ ] Cost reduced by 30%+
- [ ] Production bundle ready

---

## Next Phase: Phase 7 - Security & Compliance

Ready to proceed with:
- Security code audit
- Data privacy validation
- Compliance checklist
- API key rotation

---

**Plan Status**: Ready for implementation  
**Estimated Effort**: 4 weeks  
**Expected ROI**: 3.3x throughput increase, 30% cost reduction
