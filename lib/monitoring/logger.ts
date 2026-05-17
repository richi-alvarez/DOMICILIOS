/**
 * Centralized logging configuration for the application
 * Structured logging with different levels for debugging and monitoring
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  userId?: string
  catalogId?: string
  provider?: string
  endpoint?: string
  duration?: number
  [key: string]: unknown
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'

  private formatLog(level: LogLevel, message: string, context?: LogContext) {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: context || {},
      environment: process.env.NODE_ENV,
    }
  }

  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      console.debug('[DEBUG]', this.formatLog('debug', message, context))
    }
  }

  info(message: string, context?: LogContext) {
    console.log('[INFO]', this.formatLog('info', message, context))
  }

  warn(message: string, context?: LogContext) {
    console.warn('[WARN]', this.formatLog('warn', message, context))
  }

  error(message: string, error?: Error, context?: LogContext) {
    console.error('[ERROR]', this.formatLog('error', message, context), error?.stack || '')
  }
}

export const logger = new Logger()
