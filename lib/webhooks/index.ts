/**
 * Webhooks Module Index
 */

export {
  generateWebhookSignature,
  verifyWebhookSignature,
  sendWebhookEvent,
  notifyJobStarted,
  notifyJobProgress,
  notifyJobCompleted,
  notifyJobFailed,
  validateWebhookUrl,
  validateWebhookConfig,
} from './scanner-webhooks'

export type {
  WebhookEvent,
  WebhookConfig,
} from './scanner-webhooks'
