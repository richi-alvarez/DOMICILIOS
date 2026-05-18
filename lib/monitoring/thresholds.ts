/**
 * Alert thresholds management
 * Allows runtime configuration of alert trigger levels
 * Persists overrides to .monitoring-thresholds.json
 */

import { ALERT_THRESHOLDS as DEFAULT_THRESHOLDS } from './alerting'
import { promises as fs } from 'fs'
import path from 'path'

export interface ThresholdConfig {
  slowEndpoint: number
  errorRate: number
  cacheHitRate: number
  aiCostPerDay: number
  highResponseTime: number
  serviceDownThreshold: number
}

const CONFIG_FILE = path.join(process.cwd(), '.monitoring-thresholds.json')

// In-memory cache to avoid repeated file reads
let cachedConfig: ThresholdConfig | null = null
let cacheTime = 0
const CACHE_TTL = 60 * 1000 // 1 minute

/**
 * Get current thresholds
 * Returns overrides from file, or defaults if not configured
 */
export async function getThresholds(): Promise<ThresholdConfig> {
  // Return cache if fresh
  if (cachedConfig && Date.now() - cacheTime < CACHE_TTL) {
    return cachedConfig
  }

  try {
    const data = await fs.readFile(CONFIG_FILE, 'utf-8')
    cachedConfig = JSON.parse(data) as ThresholdConfig
    cacheTime = Date.now()
    return cachedConfig
  } catch (error) {
    // File doesn't exist or is invalid - return defaults
    cachedConfig = getDefaultThresholds()
    cacheTime = Date.now()
    return cachedConfig
  }
}

/**
 * Synchronous version of getThresholds for use in checking logic
 * Uses cached value, falls back to defaults
 */
export function getThresholdsSync(): ThresholdConfig {
  if (cachedConfig && Date.now() - cacheTime < CACHE_TTL) {
    return cachedConfig
  }
  // If not cached, return defaults (will be populated on next async call)
  return getDefaultThresholds()
}

/**
 * Save threshold configuration
 * Writes overrides to file and updates cache
 */
export async function saveThresholds(config: ThresholdConfig): Promise<void> {
  try {
    const json = JSON.stringify(config, null, 2)
    await fs.writeFile(CONFIG_FILE, json, 'utf-8')
    cachedConfig = config
    cacheTime = Date.now()
  } catch (error) {
    console.error('[Thresholds] Failed to save:', error)
    throw new Error('Failed to save threshold configuration')
  }
}

/**
 * Get default thresholds
 */
export function getDefaultThresholds(): ThresholdConfig {
  return {
    slowEndpoint: DEFAULT_THRESHOLDS.slowEndpoint,
    errorRate: DEFAULT_THRESHOLDS.errorRate,
    cacheHitRate: DEFAULT_THRESHOLDS.cacheHitRate,
    aiCostPerDay: DEFAULT_THRESHOLDS.aiCostPerDay,
    highResponseTime: DEFAULT_THRESHOLDS.highResponseTime,
    serviceDownThreshold: DEFAULT_THRESHOLDS.serviceDownThreshold,
  }
}

/**
 * Reset thresholds to defaults
 * Deletes the config file to force default loading
 */
export async function resetThresholds(): Promise<void> {
  try {
    await fs.unlink(CONFIG_FILE)
    cachedConfig = null
    cacheTime = 0
  } catch (error) {
    // File doesn't exist - that's fine
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.error('[Thresholds] Failed to reset:', error)
      throw new Error('Failed to reset threshold configuration')
    }
  }
}
