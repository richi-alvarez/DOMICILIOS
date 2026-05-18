import { auth } from '@/auth'
import { logger } from '@/lib/monitoring/logger'

export interface AuthorizationResult {
  authorized: boolean
  status: number
  error?: string
  userId?: string
}

/**
 * Verify user has access to a resource owned by a specific user
 */
export async function authorizeResourceAccess(
  resourceOwnerId: string,
  resourceType: 'catalog' | 'product' | 'order' | 'report' | 'analytics'
): Promise<AuthorizationResult> {
  try {
    const session = await auth()

    // No session = not authenticated
    if (!session?.user?.id) {
      return {
        authorized: false,
        status: 401,
        error: 'Unauthorized',
      }
    }

    // Different user = forbidden
    if (session.user.id !== resourceOwnerId) {
      logger.warn('Unauthorized resource access attempt', {
        userId: session.user.id,
        resourceType,
        attemptedResourceOwnerId: resourceOwnerId,
      })

      return {
        authorized: false,
        status: 403,
        error: 'Forbidden',
      }
    }

    // User owns the resource
    return {
      authorized: true,
      status: 200,
      userId: session.user.id,
    }
  } catch (error) {
    logger.error('Authorization check failed', error, { resourceType })
    return {
      authorized: false,
      status: 500,
      error: 'Authorization service error',
    }
  }
}

/**
 * Verify user is authenticated (has valid session)
 */
export async function requireAuth(): Promise<AuthorizationResult> {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return {
        authorized: false,
        status: 401,
        error: 'Unauthorized',
      }
    }

    return {
      authorized: true,
      status: 200,
      userId: session.user.id,
    }
  } catch (error) {
    logger.error('Authentication check failed', error)
    return {
      authorized: false,
      status: 500,
      error: 'Authentication service error',
    }
  }
}

/**
 * Verify user can access a catalog (owner check)
 * Used for catalog-specific operations
 */
export async function authorizeCatalogAccess(
  catalogOwnerId: string
): Promise<AuthorizationResult> {
  return authorizeResourceAccess(catalogOwnerId, 'catalog')
}

/**
 * Verify user can perform order operations on a catalog
 */
export async function authorizeOrderAccess(
  catalogOwnerId: string
): Promise<AuthorizationResult> {
  return authorizeResourceAccess(catalogOwnerId, 'order')
}

/**
 * Verify user can view/export reports for a catalog
 */
export async function authorizeReportAccess(
  catalogOwnerId: string
): Promise<AuthorizationResult> {
  return authorizeResourceAccess(catalogOwnerId, 'report')
}

/**
 * Verify user can view analytics for a catalog
 */
export async function authorizeAnalyticsAccess(
  catalogOwnerId: string
): Promise<AuthorizationResult> {
  return authorizeResourceAccess(catalogOwnerId, 'analytics')
}

/**
 * Log authorization attempt for audit trail
 */
export function logAuthAttempt(
  userId: string,
  resourceType: string,
  action: 'read' | 'write' | 'delete',
  authorized: boolean
): void {
  if (authorized) {
    logger.info('Authorized action', {
      userId,
      resourceType,
      action,
    })
  } else {
    logger.warn('Unauthorized action blocked', {
      userId,
      resourceType,
      action,
    })
  }
}
