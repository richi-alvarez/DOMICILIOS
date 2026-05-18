'use server'

import { z } from 'zod'
import { auth } from '@/auth'
import {
  getThresholds,
  saveThresholds,
  getDefaultThresholds,
  resetThresholds,
} from '@/lib/monitoring/thresholds'
import type { ThresholdConfig } from '@/lib/monitoring/thresholds'
import { canAccessMonitoring } from './monitoring'

const ThresholdSchema = z.object({
  slowEndpoint: z.number().min(100).max(30000),
  errorRate: z.number().min(1).max(50),
  cacheHitRate: z.number().min(10).max(90),
  aiCostPerDay: z.number().min(1).max(1000),
  highResponseTime: z.number().min(100).max(10000),
  serviceDownThreshold: z.number().min(1).max(10),
})

export async function getThresholdConfig(): Promise<{
  config: ThresholdConfig
  defaults: ThresholdConfig
} | null> {
  try {
    const hasAccess = await canAccessMonitoring()
    if (!hasAccess) {
      throw new Error('Unauthorized')
    }

    const config = await getThresholds()
    const defaults = getDefaultThresholds()

    return { config, defaults }
  } catch (error) {
    console.error('[Thresholds] Failed to get config:', error)
    return null
  }
}

export async function saveThresholdConfig(
  data: unknown
): Promise<{ success: boolean; error?: string }> {
  try {
    const hasAccess = await canAccessMonitoring()
    if (!hasAccess) {
      return { success: false, error: 'Unauthorized' }
    }

    const validated = ThresholdSchema.parse(data)
    await saveThresholds(validated)

    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid configuration data' }
    }
    console.error('[Thresholds] Failed to save:', error)
    return { success: false, error: 'Failed to save configuration' }
  }
}

export async function resetThresholdConfig(): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const hasAccess = await canAccessMonitoring()
    if (!hasAccess) {
      return { success: false, error: 'Unauthorized' }
    }

    await resetThresholds()

    return { success: true }
  } catch (error) {
    console.error('[Thresholds] Failed to reset:', error)
    return { success: false, error: 'Failed to reset configuration' }
  }
}
