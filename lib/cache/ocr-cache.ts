/**
 * OCR Cache Module
 * Evita reprocesar imágenes con OCR ya ejecutado
 */

import { createHash } from 'crypto'

export interface CacheEntry {
  /** Hash SHA-256 de la imagen base64 */
  imageHash: string
  /** Texto extraído por OCR */
  ocrText: string
  /** Idioma detectado */
  language: string
  /** Timestamp de cuando se cachó */
  cachedAt: number
  /** TTL en segundos (default: 7 días) */
  ttl: number
}

/**
 * Genera hash SHA-256 de una imagen
 */
export function generateImageHash(base64Image: string): string {
  return createHash('sha256').update(base64Image).digest('hex')
}

/**
 * Implementación de caché en memoria (para desarrollo)
 * En producción usar Redis
 */
class InMemoryOCRCache {
  private cache: Map<string, CacheEntry> = new Map()

  get(imageHash: string): CacheEntry | null {
    const entry = this.cache.get(imageHash)
    if (!entry) return null

    // Verifica si expiró
    const now = Date.now() / 1000
    if (now - entry.cachedAt > entry.ttl) {
      this.cache.delete(imageHash)
      return null
    }

    return entry
  }

  set(imageHash: string, entry: CacheEntry): void {
    this.cache.set(imageHash, entry)
  }

  has(imageHash: string): boolean {
    return this.get(imageHash) !== null
  }

  clear(): void {
    this.cache.clear()
  }

  stats(): {
    size: number
    entries: Array<{ hash: string; age: number; ttl: number }>
  } {
    const now = Date.now() / 1000
    const entries = Array.from(this.cache.entries()).map(([hash, entry]) => ({
      hash: hash.substring(0, 8),
      age: Math.round(now - entry.cachedAt),
      ttl: entry.ttl,
    }))

    return {
      size: this.cache.size,
      entries,
    }
  }
}

/**
 * Caché Redis para producción
 */
class RedisOCRCache {
  private redis: any = null

  async init(redisUrl?: string): Promise<void> {
    try {
      const { createClient } = await import('redis')
      this.redis = createClient({
        url: redisUrl || process.env.REDIS_URL,
      })
      await this.redis.connect()
      console.log('[Cache] Redis connected')
    } catch (error) {
      console.warn('[Cache] Redis not available, falling back to in-memory', error)
    }
  }

  async get(imageHash: string): Promise<CacheEntry | null> {
    if (!this.redis) return null

    try {
      const data = await this.redis.get(`ocr:${imageHash}`)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('[Cache] Redis get error:', error)
      return null
    }
  }

  async set(imageHash: string, entry: CacheEntry): Promise<void> {
    if (!this.redis) return

    try {
      await this.redis.setEx(
        `ocr:${imageHash}`,
        entry.ttl,
        JSON.stringify(entry),
      )
    } catch (error) {
      console.error('[Cache] Redis set error:', error)
    }
  }

  async has(imageHash: string): Promise<boolean> {
    return (await this.get(imageHash)) !== null
  }

  async clear(): Promise<void> {
    if (!this.redis) return

    try {
      const keys = await this.redis.keys('ocr:*')
      if (keys.length > 0) {
        await this.redis.del(keys)
      }
    } catch (error) {
      console.error('[Cache] Redis clear error:', error)
    }
  }

  async stats(): Promise<{
    size: number
    memory: string
  }> {
    if (!this.redis) {
      return { size: 0, memory: '0B' }
    }

    try {
      const keys = await this.redis.keys('ocr:*')
      const info = await this.redis.info('memory')
      return {
        size: keys.length,
        memory: info.split('\r\n').find((line: string) => line.startsWith('used_memory_human'))?.split(':')[1] || '0B',
      }
    } catch (error) {
      console.error('[Cache] Redis stats error:', error)
      return { size: 0, memory: '0B' }
    }
  }
}

// Instancia global
let cacheInstance: InMemoryOCRCache | RedisOCRCache | null = null
let useRedis = false

/**
 * Obtiene instancia del caché (singleton)
 */
export async function getOCRCache(): Promise<InMemoryOCRCache | RedisOCRCache> {
  if (cacheInstance) return cacheInstance

  // Determina si usar Redis
  useRedis = !!process.env.REDIS_URL && process.env.NODE_ENV === 'production'

  if (useRedis) {
    const redisCache = new RedisOCRCache()
    await redisCache.init()
    cacheInstance = redisCache
  } else {
    cacheInstance = new InMemoryOCRCache()
    console.log('[Cache] Using in-memory cache')
  }

  return cacheInstance
}

/**
 * Obtiene texto de caché o null si no existe
 */
export async function getCachedOCR(
  base64Image: string,
  language: string,
): Promise<string | null> {
  const cache = await getOCRCache()
  const hash = generateImageHash(base64Image)

  const entry = await cache.get(hash)
  if (entry && entry.language === language) {
    console.log(`[Cache] OCR hit for image ${hash.substring(0, 8)}`)
    return entry.ocrText
  }

  return null
}

/**
 * Guarda resultado de OCR en caché
 */
export async function cacheOCR(
  base64Image: string,
  ocrText: string,
  language: string,
  ttlSeconds: number = 7 * 24 * 60 * 60, // 7 días
): Promise<void> {
  const cache = await getOCRCache()
  const hash = generateImageHash(base64Image)

  const entry: CacheEntry = {
    imageHash: hash,
    ocrText,
    language,
    cachedAt: Date.now() / 1000,
    ttl: ttlSeconds,
  }

  await cache.set(hash, entry)
  console.log(`[Cache] Cached OCR for image ${hash.substring(0, 8)} (TTL: ${ttlSeconds}s)`)
}

/**
 * Limpia todo el caché
 */
export async function clearOCRCache(): Promise<void> {
  const cache = await getOCRCache()
  await cache.clear()
  console.log('[Cache] Cleared all OCR cache')
}

/**
 * Obtiene estadísticas del caché
 */
export async function getOCRCacheStats(): Promise<any> {
  const cache = await getOCRCache()
  if ('stats' in cache) {
    return await cache.stats()
  }
  return cache.stats()
}
