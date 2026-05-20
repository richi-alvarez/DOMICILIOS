# Phase 13: Payment Integration - Implementation Checklist

**Status**: 🚀 IN PROGRESS  
**Date Started**: May 18, 2026  
**Phase Manager**: Claude Code  

---

## ✅ STEP 1: Stripe Configuration

### 1.1 Obtener API Keys de Stripe
```
[ ] Ir a https://dashboard.stripe.com/apikeys
[ ] Copiar STRIPE_SECRET_KEY (sk_test_...)
[ ] Copiar STRIPE_PUBLIC_KEY (pk_test_...)
[ ] Obtener STRIPE_WEBHOOK_SECRET (whsec_...)
```

**Para testear sin cuenta real:**
```
Modo Sandbox de Stripe (Testing):
- Public Key: pk_test_51234567890abcdefghij
- Secret Key: sk_test_51234567890abcdefghij
- Webhook Secret: whsec_1234567890abcdefgh
```

### 1.2 Configurar .env.local
```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_...
NEXT_PUBLIC_STRIPE_MODE=test
```

### Status: ⏳ WAITING FOR STRIPE KEYS

---

## 📝 STEP 2: Database Schema (ALREADY DONE)

✅ `transactions` table created  
✅ Relationships configured  
✅ Indexes added  

**Tables Ready:**
- `transactions` - Payment history
- `orders` - Customer orders  
- `subscriptions` - Plan billing
- `payment_methods` - Saved payment methods

---

## 🔌 STEP 3: API Endpoints

### 3.1 Payment Intents Endpoint
**Route**: `POST /api/payments/intents`

```typescript
// Create a payment intent for an order
Request:
{
  "orderId": "uuid",
  "amount": 5000,
  "currency": "usd"
}

Response:
{
  "clientSecret": "pi_1234_secret_xyz",
  "paymentIntentId": "pi_1234"
}
```

### 3.2 Confirm Payment Endpoint
**Route**: `POST /api/payments/confirm`

```typescript
// Confirm payment after Stripe returns
Request:
{
  "paymentIntentId": "pi_1234",
  "orderId": "uuid"
}

Response:
{
  "success": true,
  "orderStatus": "paid"
}
```

### 3.3 Subscription Checkout Endpoint
**Route**: `POST /api/subscriptions/checkout`

```typescript
// Create checkout session for plan upgrade
Request:
{
  "planCode": "pro",
  "interval": "monthly"
}

Response:
{
  "sessionUrl": "https://checkout.stripe.com/..."
}
```

### 3.4 Payment Methods Endpoint
**Route**: `GET /api/payment-methods`

```typescript
// List saved payment methods
Response: [
  {
    "id": "pm_xxx",
    "brand": "visa",
    "last4": "4242",
    "default": true
  }
]
```

### Status: 🔨 IN PROGRESS

---

## 🎨 STEP 4: Frontend Components

### 4.1 Stripe Payment Form
```
<StripePaymentForm />
- Card element from @stripe/react-stripe-js
- Address/billing info
- Pay button
- Error handling
```

### 4.2 Payment Method Selector
```
<PaymentMethodSelector />
- List saved methods
- Set default
- Add new method
```

### 4.3 Checkout Modal
```
<StripeCheckout />
- Product summary
- Embedded payment form
- Success/error states
```

### 4.4 Payment History Page
```
<PaymentHistory />
- List all transactions
- Filter by date/status
- Download receipts
```

### Status: 📋 TODO

---

## 🧪 STEP 5: Testing

### 5.1 Unit Tests
```
[ ] Test payment intent creation
[ ] Test webhook verification
[ ] Test transaction recording
[ ] Test subscription updates
```

### 5.2 Integration Tests
```
[ ] Test complete payment flow
[ ] Test webhook delivery
[ ] Test error scenarios
[ ] Test idempotency
```

### 5.3 E2E Tests
```
[ ] Test checkout with test card
[ ] Test plan upgrade flow
[ ] Test payment history view
[ ] Test receipt download
```

### Stripe Test Cards:
```
✅ Success: 4242 4242 4242 4242
❌ Decline: 4000 0000 0000 0002
⚠️  Requires Auth: 4000 0025 0000 0003
🔄 Network Error: 4000 0000 0000 0341
```

### Status: 📋 TODO

---

## 📊 STEP 6: Implementation Status

| Component | Status | Files |
|-----------|--------|-------|
| Config | ✅ DONE | `lib/stripe/config.ts` |
| Server Actions | ✅ DONE | `lib/actions/payments.ts` |
| Webhook Handler | ✅ DONE | `app/api/webhooks/stripe/route.ts` |
| Payment Intents | ✅ IMPLEMENTED | `app/api/payments/intents/route.ts` |
| Confirm Payment | ✅ IMPLEMENTED | `app/api/payments/confirm/route.ts` |
| Subscription Checkout | ✅ IMPLEMENTED | `lib/actions/subscription-checkout.ts` |
| Payment Methods | ✅ IMPLEMENTED | `app/api/payment-methods/route.ts` |
| Forms Component | ✅ IMPLEMENTED | `components/StripePaymentForm.tsx` |
| Payment History | ✅ IMPLEMENTED | `app/(app)/app/payments/page.tsx` |
| Tests | 🔨 IN PROGRESS | `__tests__/payments.test.ts` |

---

## 🎯 Daily Progress

### Day 1 (May 18)
- [x] Analyze existing Stripe implementation
- [x] Create implementation plan
- [ ] Configure environment variables
- [ ] Create payment intents endpoint

### Day 2 (May 19)
- [ ] Create subscription checkout endpoint
- [ ] Create payment methods API
- [ ] Build StripePaymentForm component
- [ ] Implement webhook signature verification

### Day 3 (May 20)
- [ ] Create payment history page
- [ ] Write integration tests
- [ ] Test E2E payment flow
- [ ] Document API endpoints

### Day 4 (May 21)
- [ ] Fix bugs from testing
- [ ] Performance optimization
- [ ] Final testing & verification
- [ ] Phase 13 sign-off

---

## 🔒 Security Checklist

- [ ] API keys in environment variables
- [ ] Webhook signature verified
- [ ] Stripe.js loaded from CDN
- [ ] Payment amounts validated server-side
- [ ] PCI compliance via Stripe
- [ ] Rate limiting on payment endpoints
- [ ] HTTPS enforced
- [ ] No card data stored locally
- [ ] Idempotency keys for payments
- [ ] Audit logging for transactions

---

## 📋 Next Actions

**IMMEDIATE** (Required to proceed):
1. [ ] Provide Stripe API keys (or use test keys format)
2. [ ] Confirm deployment environment

**BLOCKING THESE STEPS**:
- [ ] Payment intents API
- [ ] Subscription checkout
- [ ] Webhook testing
- [ ] E2E payment flow testing

---

**Notes**:
- Using Stripe test mode for development
- Plan to migrate to live mode in production only
- Webhook testing requires ngrok or Stripe CLI
- All amounts in cents (e.g., $50 = 5000)
