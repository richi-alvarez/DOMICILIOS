# Phase 5: Monitoring & Metrics Setup
**Date**: 2026-05-17  
**Status**: 📋 Ready for Planning & Implementation  
**Priority**: High (Required before production)

---

## Overview

Phase 5 establishes monitoring, logging, and performance metrics for the domicilios platform. This phase ensures production readiness by implementing observability across all system components.

---

## Phase 5 Objectives

### 1. Application Performance Monitoring (APM)
- Track response times by endpoint
- Monitor error rates and stack traces
- Measure database query performance
- Track API provider performance (Anthropic, OpenAI, Gemini)

### 2. Error Tracking & Alerting
- Capture all runtime errors
- Alert on critical failures
- Log stack traces with context
- Monitor API rate limits

### 3. User Analytics
- Track user flows and drop-off points
- Monitor catalog creation success rates
- Measure AI generation performance
- Track feature adoption rates

### 4. System Health Monitoring
- Database connection pool status
- Redis cache hit/miss rates
- API credential validity
- Memory and CPU usage

### 5. Cost Tracking
- AI API usage by provider
- Estimate API costs
- Alert on unexpected usage spikes
- Track usage per user/catalog

---

## Recommended Tools Stack

### Monitoring & Observability
- **Vercel Analytics** (for Next.js) - Built-in performance monitoring
- **Sentry** (Error tracking) - Real-time error notifications
- **LogRocket** (Session replay) - User behavior analysis

### Logging
- **Winston** (Logger) - Structured logging
- **Pino** (Alternative) - Ultra-fast JSON logging
- **Bunyan** (Alternative) - JSON logging with levels

### Metrics & Analytics
- **Prometheus** (Time-series data) - Open-source metrics
- **Grafana** (Dashboards) - Visualization
- **New Relic** (APM alternative)

### Cost Tracking
- **Custom implementation** in database
- Tables: `api_usage`, `ai_generation_logs`, `cost_tracking`

---

## Implementation Plan

### 5.1: Application Monitoring Setup

#### Step 1: Sentry Integration
```bash
# Install Sentry
npm install @sentry/nextjs

# Create .env.local variables
SENTRY_AUTH_TOKEN=your_token
SENTRY_ORG=your_org
SENTRY_PROJECT=domicilios
```

**Configuration**: `sentry.client.config.js` + `sentry.server.config.js`
**Features**:
- ✓ Automatic error capture
- ✓ Performance monitoring
- ✓ Session replay
- ✓ Source maps

#### Step 2: Custom Metrics Logger
Create `lib/metrics/logger.ts`:
```typescript
import pino from 'pino'

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
})

// Export logger for use throughout app
export default logger
```

#### Step 3: API Performance Tracking
Create `lib/metrics/api-tracker.ts`:
- Track all HTTP requests
- Record response times
- Log errors and status codes
- Monitor API quotas (Anthropic, OpenAI, Gemini)

### 5.2: Database Metrics

#### Create Tracking Tables
```sql
-- AI Generation Metrics
CREATE TABLE ai_generation_logs (
  id UUID PRIMARY KEY,
  catalog_id UUID NOT NULL,
  user_id UUID NOT NULL,
  provider VARCHAR(50) NOT NULL,
  model VARCHAR(100),
  prompt_tokens INT,
  completion_tokens INT,
  total_tokens INT,
  cost_usd DECIMAL(10, 6),
  duration_ms INT,
  success BOOLEAN,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (catalog_id) REFERENCES catalogs(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Daily Usage & Cost Tracking
CREATE TABLE daily_usage_metrics (
  id UUID PRIMARY KEY,
  date DATE NOT NULL,
  user_id UUID,
  ai_requests INT DEFAULT 0,
  successful_requests INT DEFAULT 0,
  failed_requests INT DEFAULT 0,
  total_tokens_used INT DEFAULT 0,
  estimated_cost_usd DECIMAL(10, 6) DEFAULT 0,
  api_provider VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(date, user_id, api_provider)
);

-- Performance Metrics
CREATE TABLE performance_metrics (
  id UUID PRIMARY KEY,
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  response_time_ms INT NOT NULL,
  status_code INT NOT NULL,
  user_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX(endpoint, created_at)
);
```

### 5.3: Dashboard & Alerts

#### Create Monitoring Dashboard
- **Real-time metrics**: Requests per minute, error rate
- **AI Integration**: Generation success rate, average latency
- **User metrics**: Active users, catalog creation rate
- **Cost tracking**: Daily/monthly spend by provider
- **Health check**: Database, Redis, API connectivity

#### Set Up Alerts
```typescript
// Alert thresholds
const ALERTS = {
  ERROR_RATE_THRESHOLD: 5, // % of requests
  API_RESPONSE_TIME: 5000, // ms
  AI_GENERATION_TIME: 30000, // ms
  DAILY_COST_LIMIT: 100, // USD
  FAILED_REQUESTS_THRESHOLD: 10, // per minute
}
```

### 5.4: AI Provider Monitoring

#### Track Each Provider
For each provider (Anthropic, OpenAI, Gemini):
1. Request count per day
2. Success/failure rates
3. Average response time
4. Token usage and costs
5. Rate limit status

#### Create Provider Health Check
```typescript
// lib/metrics/provider-health.ts
export async function checkProviderHealth() {
  return {
    anthropic: {
      configured: !!process.env.ANTHROPIC_API_KEY,
      creditsAvailable: await checkAnthropicCredits(),
      rateLimitRemaining: await checkAnthropicRateLimit(),
    },
    openai: {
      configured: !!process.env.OPENAI_API_KEY,
      creditsAvailable: await checkOpenAICredits(),
      rateLimitRemaining: await checkOpenAIRateLimit(),
    },
    gemini: {
      configured: !!process.env.GEMINI_API_KEY,
      quotaRemaining: await checkGeminiQuota(),
    },
  }
}
```

---

## Validation Checklist

### Pre-Implementation
- [ ] Sentry account created and project set up
- [ ] Logging strategy defined (format, levels)
- [ ] Database schema for metrics created
- [ ] Alert thresholds defined
- [ ] Team dashboard requirements gathered

### During Implementation
- [ ] Sentry integration deployed
- [ ] Logging to all critical paths
- [ ] Metrics tables populated with data
- [ ] Dashboard created with key metrics
- [ ] Alert rules configured in Sentry

### Post-Implementation
- [ ] Verify metrics being collected
- [ ] Test alert triggers
- [ ] Review dashboard accuracy
- [ ] Document monitoring procedures
- [ ] Train team on monitoring tools

---

## Success Criteria

✅ **Phase 5 PASSED if**:
1. All application errors are captured in Sentry
2. Performance metrics are tracked for all endpoints
3. AI generation times and costs are logged
4. Daily cost tracking shows accurate numbers
5. Alerts are triggered for critical issues
6. Dashboard displays real-time metrics
7. Team can quickly identify and respond to issues

---

## Next Steps After Phase 5

### Phase 6: Load Testing & Performance
- Simulate concurrent users
- Test peak load scenarios
- Optimize slow endpoints
- Validate scaling capability

### Phase 7: Security & Compliance
- Security audit of code
- Data privacy validation
- API key rotation procedures
- Compliance checklist (GDPR, etc)

### Phase 8: Staging Deployment
- Deploy to staging environment
- End-to-end testing in production-like environment
- Load testing in staging
- Final security review

### Phase 9: Production Deployment
- Blue-green deployment strategy
- Rollback procedure
- Monitoring alert verification
- Support team training

---

## Estimated Timeline

| Phase | Duration | Status |
|-------|----------|--------|
| Phase 1 | 1 week | ✅ Complete |
| Phase 2 | 1 week | ✅ Complete |
| Phase 3 | 1 week | ✅ Complete |
| Phase 4 | 2 weeks | ✅ Complete |
| **Phase 5** | **1-2 weeks** | 📋 Ready |
| Phase 6 | 1 week | Next |
| Phase 7 | 1 week | Next |
| Phase 8 | 1 week | Next |
| Phase 9 | 1 week | Next |

**Total to Production**: ~3-4 more weeks from Phase 5 start

---

## Recommended Implementation Order

1. **Week 1**:
   - Set up Sentry
   - Create logging infrastructure
   - Create database metrics tables
   - Deploy basic monitoring

2. **Week 2**:
   - Build dashboard
   - Configure alerts
   - Implement cost tracking
   - Test monitoring under load

---

## Cost Considerations

### Monthly Monitoring Costs (Estimated)
- **Sentry Pro**: $50-300/month (based on events)
- **LogRocket**: $99-499/month (based on sessions)
- **Hosting**: Included in current infrastructure
- **Total**: ~$150-800/month

### AI API Costs (Current)
- **Anthropic**: Variable (need credits to test)
- **OpenAI**: Pay-as-you-go (estimated $0.01-0.10 per generation)
- **Gemini**: Free tier available

---

## Resources & Documentation

### Setup Guides
- [Sentry Next.js Setup](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Pino Logging](https://getpino.io/)
- [Prometheus for Node.js](https://prometheus.io/docs/clients/nodejs/)

### Database
- PostgreSQL JSON aggregations for metrics
- Time-series optimization with BRIN indexes

---

## Questions for Team

1. Which error tracking tool is preferred? (Sentry vs New Relic vs Datadog)
2. What are the budget constraints for monitoring tools?
3. Should costs be tracked per user or per organization?
4. What SLAs should we target for response times?
5. Who needs access to the monitoring dashboard?

---

**Status**: Ready to proceed  
**Approval Required**: For tool selection and budget  
**Can Start**: Immediately with Sentry (free tier available)
