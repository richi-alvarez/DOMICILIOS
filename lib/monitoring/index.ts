/**
 * Central export for all monitoring utilities
 * Includes logging, performance tracking, health checks, and alerting
 */

// Logging
export { logger } from './logger'
export type { LogContext } from './logger'

// Performance tracking
export { performanceTracker } from './performance-tracker'
export type { PerformanceMetric } from './performance-tracker'
export { trackApiPerformance, trackServerAction } from './middleware'

// AI usage tracking
export { aiUsageTracker } from './ai-usage-tracker'
export type { AIUsageRecord } from './ai-usage-tracker'

// Health checks
export { healthChecker } from './health-check'
export type { ServiceStatus, ServiceHealth } from './health-check'

// Metrics persistence
export { metricsPersistence } from './metrics-persistence'
export type { MetricData } from './metrics-persistence'

// Alerting
export { alertManager, ALERT_THRESHOLDS } from './alerting'
export type { Alert } from './alerting'

// Notifications
export { sendAlertNotifications, getNotificationConfig } from './notifications'
export type { NotificationConfig, AlertNotificationPayload } from './notifications'

// Thresholds
export { getThresholds, getThresholdsSync, saveThresholds, resetThresholds, getDefaultThresholds } from './thresholds'
export type { ThresholdConfig } from './thresholds'
