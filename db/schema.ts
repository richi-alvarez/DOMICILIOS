import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  pgEnum,
  uuid,
  varchar,
  index,
  primaryKey,
} from 'drizzle-orm/pg-core'

// ── Enums ──────────────────────────────────────────────────────────────
export const orgTypeEnum = pgEnum('org_type', ['merchant', 'agency'])
export const memberRoleEnum = pgEnum('member_role', [
  'owner',
  'admin',
  'editor',
  'viewer',
  'agency_owner',
  'agency_operator',
  'client_owner',
])
export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'active',
  'trialing',
  'past_due',
  'canceled',
  'incomplete',
])
export const catalogStatusEnum = pgEnum('catalog_status', ['draft', 'published', 'archived'])
export const orderStatusEnum = pgEnum('order_status', [
  'draft',
  'pending_send',
  'received',
  'preparing',
  'ready',
  'delivered',
  'cancelled',
])
export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'paid',
  'failed',
  'refunded',
])
export const orderChannelEnum = pgEnum('order_channel', ['whatsapp', 'email'])
export const deliveryTypeEnum = pgEnum('delivery_type', ['pickup', 'delivery', 'dine_in'])
export const paymentProviderEnum = pgEnum('payment_provider', [
  'stripe',
  'mercadopago',
  'paypal',
  'manual',
])

// ── Users ──────────────────────────────────────────────────────────────
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('email_verified', { mode: 'date' }),
  image: text('image'),
  passwordHash: text('password_hash'),
  locale: varchar('locale', { length: 10 }).default('es'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
})

// ── Auth.js accounts & sessions ────────────────────────────────────────
export const accounts = pgTable(
  'accounts',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    refreshToken: text('refresh_token'),
    accessToken: text('access_token'),
    expiresAt: integer('expires_at'),
    tokenType: text('token_type'),
    scope: text('scope'),
    idToken: text('id_token'),
    sessionState: text('session_state'),
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })],
)

export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
})

export const verificationTokens = pgTable(
  'verification_tokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
)

// ── Organizations ──────────────────────────────────────────────────────
export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerUserId: uuid('owner_user_id')
    .notNull()
    .references(() => users.id),
  name: text('name').notNull(),
  type: orgTypeEnum('type').default('merchant').notNull(),
  planId: uuid('plan_id'),
  stripeCustomerId: text('stripe_customer_id'),
  status: text('status').default('active').notNull(),
  parentAgencyId: uuid('parent_agency_id'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
})

export const memberships = pgTable(
  'memberships',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    role: memberRoleEnum('role').default('viewer').notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.organizationId] })],
)

// ── Plans & Subscriptions ──────────────────────────────────────────────
export const plans = pgTable('plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 32 }).notNull().unique(),
  name: text('name').notNull(),
  limitsJson: jsonb('limits_json').notNull().default({}),
  pricesJson: jsonb('prices_json').notNull().default({}),
  stripePriceIdMonthly: text('stripe_price_id_monthly'),
  stripePriceIdAnnual: text('stripe_price_id_annual'),
  active: boolean('active').default(true).notNull(),
})

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  planId: uuid('plan_id')
    .notNull()
    .references(() => plans.id),
  stripeSubscriptionId: text('stripe_subscription_id'),
  interval: text('interval').default('monthly').notNull(),
  status: subscriptionStatusEnum('status').default('trialing').notNull(),
  currentPeriodEnd: timestamp('current_period_end', { mode: 'date' }),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
})

// ── Catalogs ───────────────────────────────────────────────────────────
export const catalogs = pgTable(
  'catalogs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    slug: varchar('slug', { length: 64 }).notNull().unique(),
    name: text('name').notNull(),
    description: text('description'),
    status: catalogStatusEnum('status').default('draft').notNull(),
    domain: text('domain'),
    themeJson: jsonb('theme_json').default({}),
    settingsJson: jsonb('settings_json').default({}),
    language: varchar('language', { length: 10 }).default('es').notNull(),
    currency: varchar('currency', { length: 8 }).default('COP').notNull(),
    orderChannel: orderChannelEnum('order_channel').default('whatsapp').notNull(),
    contactPhone: text('contact_phone'),
    contactCountryCode: varchar('contact_country_code', { length: 8 }),
    contactEmail: text('contact_email'),
    aiPrompt: text('ai_prompt'),
    publishedAt: timestamp('published_at', { mode: 'date' }),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (t) => [index('catalogs_org_id_idx').on(t.orgId), index('catalogs_slug_idx').on(t.slug)],
)

// ── Categories ─────────────────────────────────────────────────────────
export const categories = pgTable(
  'categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    catalogId: uuid('catalog_id')
      .notNull()
      .references(() => catalogs.id, { onDelete: 'cascade' }),
    parentId: uuid('parent_id'),
    name: text('name').notNull(),
    slug: varchar('slug', { length: 64 }).notNull(),
    position: integer('position').default(0).notNull(),
    active: boolean('active').default(true).notNull(),
  },
  (t) => [index('categories_catalog_id_idx').on(t.catalogId)],
)

// ── Products ───────────────────────────────────────────────────────────
export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    catalogId: uuid('catalog_id')
      .notNull()
      .references(() => catalogs.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
    name: text('name').notNull(),
    slug: varchar('slug', { length: 64 }).notNull(),
    description: text('description'),
    price: integer('price').default(0).notNull(),
    compareAt: integer('compare_at'),
    stock: integer('stock'),
    sku: text('sku'),
    imagesJson: jsonb('images_json').default([]),
    variantsJson: jsonb('variants_json').default([]),
    active: boolean('active').default(true).notNull(),
    position: integer('position').default(0).notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (t) => [index('products_catalog_id_idx').on(t.catalogId)],
)

// ── Blocks ─────────────────────────────────────────────────────────────
export const blocks = pgTable(
  'blocks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    catalogId: uuid('catalog_id')
      .notNull()
      .references(() => catalogs.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    position: integer('position').default(0).notNull(),
    configJson: jsonb('config_json').default({}),
    active: boolean('active').default(true).notNull(),
  },
  (t) => [index('blocks_catalog_id_idx').on(t.catalogId)],
)

// ── Orders ─────────────────────────────────────────────────────────────
export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: varchar('code', { length: 32 }).notNull(),
    catalogId: uuid('catalog_id')
      .notNull()
      .references(() => catalogs.id, { onDelete: 'restrict' }),
    status: orderStatusEnum('status').default('draft').notNull(),
    customerJson: jsonb('customer_json').default({}),
    itemsJson: jsonb('items_json').default([]),
    deliveryJson: jsonb('delivery_json').default({}),
    paymentJson: jsonb('payment_json').default({}),
    totalsJson: jsonb('totals_json').default({}),
    whatsappSentAt: timestamp('whatsapp_sent_at', { mode: 'date' }),
    emailSentAt: timestamp('email_sent_at', { mode: 'date' }),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (t) => [index('orders_catalog_id_idx').on(t.catalogId), index('orders_code_idx').on(t.code)],
)

// ── Payment methods (per catalog) ──────────────────────────────────────
export const paymentMethods = pgTable('payment_methods', {
  id: uuid('id').primaryKey().defaultRandom(),
  catalogId: uuid('catalog_id')
    .notNull()
    .references(() => catalogs.id, { onDelete: 'cascade' }),
  provider: paymentProviderEnum('provider').notNull(),
  credentialsJson: jsonb('credentials_json').default({}),
  enabled: boolean('enabled').default(false).notNull(),
})

// ── Analytics events ───────────────────────────────────────────────────
export const analyticsEvents = pgTable(
  'analytics_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    catalogId: uuid('catalog_id')
      .notNull()
      .references(() => catalogs.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    productId: uuid('product_id'),
    sessionId: text('session_id'),
    meta: jsonb('meta').default({}),
    ts: timestamp('ts', { mode: 'date' }).defaultNow().notNull(),
  },
  (t) => [
    index('analytics_catalog_id_idx').on(t.catalogId),
    index('analytics_ts_idx').on(t.ts),
  ],
)

// ── Assets ─────────────────────────────────────────────────────────────
export const assets = pgTable('assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  kind: text('kind').notNull(),
  size: integer('size'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
})

// ── Invites ────────────────────────────────────────────────────────────
export const invites = pgTable('invites', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  role: memberRoleEnum('role').default('editor').notNull(),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
})

// ── Onboarding progress ────────────────────────────────────────────────
export const onboardingProgress = pgTable('onboarding_progress', {
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  step: text('step').notNull(),
  completedAt: timestamp('completed_at', { mode: 'date' }).defaultNow().notNull(),
})

// ── Webhooks ──────────────────────────────────────────────────────────
export const webhooks = pgTable(
  'webhooks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    catalogId: uuid('catalog_id')
      .notNull()
      .references(() => catalogs.id, { onDelete: 'cascade' }),
    url: text('url').notNull(),
    events: text('events').array().notNull().default(['order.created']),
    active: boolean('active').default(true).notNull(),
    secret: text('secret').notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (t) => [index('webhooks_catalog_id_idx').on(t.catalogId)],
)

export const webhookDeliveries = pgTable(
  'webhook_deliveries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    webhookId: uuid('webhook_id')
      .notNull()
      .references(() => webhooks.id, { onDelete: 'cascade' }),
    event: text('event').notNull(),
    payload: jsonb('payload').notNull(),
    statusCode: integer('status_code'),
    responseBody: text('response_body'),
    attempt: integer('attempt').default(1).notNull(),
    nextRetry: timestamp('next_retry', { mode: 'date' }),
    deliveredAt: timestamp('delivered_at', { mode: 'date' }),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (t) => [
    index('webhook_deliveries_webhook_id_idx').on(t.webhookId),
    index('webhook_deliveries_event_idx').on(t.event),
  ],
)

// ── API Keys ───────────────────────────────────────────────────────────
export const apiKeys = pgTable(
  'api_keys',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    key: text('key').notNull().unique(),
    secret: text('secret').notNull(),
    permissions: text('permissions').array().default(['read:public']).notNull(),
    active: boolean('active').default(true).notNull(),
    lastUsedAt: timestamp('last_used_at', { mode: 'date' }),
    expiresAt: timestamp('expires_at', { mode: 'date' }),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (t) => [index('api_keys_org_id_idx').on(t.organizationId)],
)

// ── Transactions ──────────────────────────────────────────────────────
export const transactions = pgTable(
  'transactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    stripePaymentIntentId: text('stripe_payment_intent_id'),
    stripeInvoiceId: text('stripe_invoice_id'),
    amount: integer('amount').notNull(),
    currency: varchar('currency', { length: 3 }).default('COP').notNull(),
    status: paymentStatusEnum('status').default('pending').notNull(),
    type: text('type').notNull(),
    description: text('description'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (t) => [index('transactions_org_id_idx').on(t.organizationId)],
)

// ── Quality History ───────────────────────────────────────────────────
export const qualityHistory = pgTable(
  'quality_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    catalogId: uuid('catalog_id')
      .notNull()
      .references(() => catalogs.id, { onDelete: 'cascade' }),
    catalogScore: integer('catalog_score').notNull(),
    completenessScore: integer('completeness_score').notNull(),
    seoScore: integer('seo_score').notNull(),
    consistencyScore: integer('consistency_score').notNull(),
    sellabilityScore: integer('sellability_score').notNull(),
    strengths: jsonb('strengths').default([]).notNull(),
    improvements: jsonb('improvements').default([]).notNull(),
    productAnalysis: jsonb('product_analysis').default([]).notNull(),
    actionableRecommendations: jsonb('actionable_recommendations').default([]).notNull(),
    summary: text('summary').notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (t) => [index('quality_history_catalog_id_idx').on(t.catalogId)],
)

// ── Quality Alerts ────────────────────────────────────────────────────
export const qualityAlertsEnum = pgEnum('quality_alert_type', [
  'score_drop',
  'low_score',
  'dimension_drop',
  'critical_issue',
])

export const qualityAlerts = pgTable(
  'quality_alerts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    catalogId: uuid('catalog_id')
      .notNull()
      .references(() => catalogs.id, { onDelete: 'cascade' }),
    type: qualityAlertsEnum('type').notNull(),
    severity: varchar('severity', { length: 32 }).default('medium').notNull(), // low, medium, high, critical
    previousScore: integer('previous_score'),
    currentScore: integer('current_score'),
    scoreDrop: integer('score_drop'),
    affectedDimension: text('affected_dimension'), // completeness, seo, consistency, sellability
    message: text('message').notNull(),
    emailSent: boolean('email_sent').default(false).notNull(),
    dismissed: boolean('dismissed').default(false).notNull(),
    dismissedAt: timestamp('dismissed_at', { mode: 'date' }),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (t) => [
    index('quality_alerts_catalog_id_idx').on(t.catalogId),
    index('quality_alerts_dismissed_idx').on(t.dismissed),
  ],
)

// ── Audit log ──────────────────────────────────────────────────────────
export const auditLog = pgTable('audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }),
  action: text('action').notNull(),
  resourceType: text('resource_type'),
  resourceId: text('resource_id'),
  meta: jsonb('meta').default({}),
  ts: timestamp('ts', { mode: 'date' }).defaultNow().notNull(),
})
