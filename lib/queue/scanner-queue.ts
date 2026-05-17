/**
 * Scanner Job Queue
 * Procesa escaneos grandes de forma asincrónica
 */

export interface ScanJob {
  /** ID único del job */
  id: string
  /** ID del catálogo */
  catalogId: string
  /** ID del usuario */
  userId: string
  /** Archivos a procesar (base64) */
  files: Array<{
    base64: string
    fileName: string
    mediaType: 'image/jpeg' | 'image/png' | 'application/pdf'
  }>
  /** Estado del job */
  status: 'pending' | 'processing' | 'completed' | 'failed'
  /** Resultado de productos detectados */
  detectedProducts?: any[]
  /** Error si falló */
  error?: string
  /** Timestamp de creación */
  createdAt: number
  /** Timestamp de inicio */
  startedAt?: number
  /** Timestamp de fin */
  completedAt?: number
  /** Webhook URL para notificar cuando termine */
  webhookUrl?: string
  /** Progreso 0-100 */
  progress: number
}

/**
 * Implementación simple en memoria (para desarrollo)
 * En producción usar Bull, BullMQ, RabbitMQ, etc.
 */
class InMemoryScannerQueue {
  private jobs: Map<string, ScanJob> = new Map()
  private processing: Set<string> = new Set()
  private workers: number = 2 // Número de workers concurrentes

  async addJob(job: ScanJob): Promise<string> {
    this.jobs.set(job.id, job)
    console.log(`[Queue] Job added: ${job.id}`)
    // Inicia procesamiento en background
    this.processQueue()
    return job.id
  }

  async getJob(jobId: string): Promise<ScanJob | null> {
    return this.jobs.get(jobId) || null
  }

  async updateJob(jobId: string, updates: Partial<ScanJob>): Promise<void> {
    const job = this.jobs.get(jobId)
    if (job) {
      Object.assign(job, updates)
      console.log(`[Queue] Job updated: ${jobId} - Status: ${job.status}`)
    }
  }

  async getJobsByUser(userId: string): Promise<ScanJob[]> {
    return Array.from(this.jobs.values()).filter((j) => j.userId === userId)
  }

  async getJobsByCatalog(catalogId: string): Promise<ScanJob[]> {
    return Array.from(this.jobs.values()).filter((j) => j.catalogId === catalogId)
  }

  async getPendingJobs(): Promise<ScanJob[]> {
    return Array.from(this.jobs.values()).filter((j) => j.status === 'pending')
  }

  private async processQueue(): Promise<void> {
    if (this.processing.size >= this.workers) {
      return // Ya hay suficientes workers
    }

    const pending = this.getPendingJobs()
    if (pending.length === 0) return

    const job = pending[0]
    this.processing.add(job.id)
    await this.updateJob(job.id, {
      status: 'processing',
      startedAt: Date.now(),
      progress: 0,
    })

    try {
      // Aquí se ejecutaría el procesamiento real
      // Por ahora solo es un placeholder
      console.log(`[Queue] Processing job: ${job.id}`)

      // Simula notificación
      if (job.webhookUrl) {
        // await notifyWebhook(job.webhookUrl, job)
      }

      await this.updateJob(job.id, {
        status: 'completed',
        completedAt: Date.now(),
        progress: 100,
      })
    } catch (error) {
      await this.updateJob(job.id, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        completedAt: Date.now(),
      })
    } finally {
      this.processing.delete(job.id)
      // Continúa con siguiente job
      await this.processQueue()
    }
  }

  stats(): {
    total: number
    pending: number
    processing: number
    completed: number
    failed: number
  } {
    const jobs = Array.from(this.jobs.values())
    return {
      total: jobs.length,
      pending: jobs.filter((j) => j.status === 'pending').length,
      processing: jobs.filter((j) => j.status === 'processing').length,
      completed: jobs.filter((j) => j.status === 'completed').length,
      failed: jobs.filter((j) => j.status === 'failed').length,
    }
  }

  async clear(): Promise<void> {
    this.jobs.clear()
    this.processing.clear()
  }
}

/**
 * Adapter para BullMQ (producción)
 */
class BullMQScannerQueue {
  private queue: any = null

  async init(): Promise<void> {
    try {
      const { Queue } = await import('bullmq')
      this.queue = new Queue('scanner', {
        connection: {
          url: process.env.REDIS_URL,
        },
      })
      console.log('[Queue] BullMQ initialized')
    } catch (error) {
      console.warn('[Queue] BullMQ not available:', error)
    }
  }

  async addJob(job: ScanJob): Promise<string> {
    if (!this.queue) throw new Error('Queue not initialized')
    const result = await this.queue.add('scan', job, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    })
    return result.id || job.id
  }

  async getJob(jobId: string): Promise<ScanJob | null> {
    if (!this.queue) return null
    const job = await this.queue.getJob(jobId)
    return job?.data || null
  }

  async updateJob(jobId: string, updates: Partial<ScanJob>): Promise<void> {
    if (!this.queue) return
    const job = await this.queue.getJob(jobId)
    if (job) {
      Object.assign(job.data, updates)
      await job.updateData(job.data)
    }
  }

  async getJobsByUser(userId: string): Promise<ScanJob[]> {
    if (!this.queue) return []
    const jobs = await this.queue.getJobs()
    return jobs
      .filter((j: any) => j.data.userId === userId)
      .map((j: any) => j.data)
  }

  async getJobsByCatalog(catalogId: string): Promise<ScanJob[]> {
    if (!this.queue) return []
    const jobs = await this.queue.getJobs()
    return jobs
      .filter((j: any) => j.data.catalogId === catalogId)
      .map((j: any) => j.data)
  }

  async getPendingJobs(): Promise<ScanJob[]> {
    if (!this.queue) return []
    const jobs = await this.queue.getJobs(['waiting'])
    return jobs.map((j: any) => j.data)
  }

  async stats(): Promise<any> {
    if (!this.queue) {
      return {
        total: 0,
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
      }
    }
    const counts = await this.queue.getJobCounts()
    return counts
  }

  async clear(): Promise<void> {
    if (!this.queue) return
    await this.queue.clean(0, 1000)
  }
}

// Instancia global
let queueInstance: InMemoryScannerQueue | BullMQScannerQueue | null = null

/**
 * Obtiene instancia de la queue (singleton)
 */
export async function getScannerQueue(): Promise<
  InMemoryScannerQueue | BullMQScannerQueue
> {
  if (queueInstance) return queueInstance

  const useBullMQ =
    !!process.env.REDIS_URL && process.env.NODE_ENV === 'production'

  if (useBullMQ) {
    const bullQueue = new BullMQScannerQueue()
    await bullQueue.init()
    queueInstance = bullQueue
  } else {
    queueInstance = new InMemoryScannerQueue()
    console.log('[Queue] Using in-memory queue')
  }

  return queueInstance
}

/**
 * Encola un nuevo job de escaneo
 */
export async function enqueueScanJob(
  catalogId: string,
  userId: string,
  files: ScanJob['files'],
  webhookUrl?: string,
): Promise<string> {
  const queue = await getScannerQueue()

  const job: ScanJob = {
    id: `scan-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    catalogId,
    userId,
    files,
    status: 'pending',
    progress: 0,
    createdAt: Date.now(),
    webhookUrl,
  }

  const jobId = await queue.addJob(job)
  console.log(`[Queue] Scan job enqueued: ${jobId}`)
  return jobId
}

/**
 * Obtiene estado de un job
 */
export async function getJobStatus(jobId: string): Promise<ScanJob | null> {
  const queue = await getScannerQueue()
  return await queue.getJob(jobId)
}

/**
 * Obtiene jobs de un usuario
 */
export async function getUserJobs(userId: string): Promise<ScanJob[]> {
  const queue = await getScannerQueue()
  return await queue.getJobsByUser(userId)
}

/**
 * Obtiene estadísticas de la queue
 */
export async function getQueueStats(): Promise<any> {
  const queue = await getScannerQueue()
  return await queue.stats()
}
