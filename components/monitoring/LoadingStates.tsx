/**
 * Professional loading state components
 * Empty states, error states, and loading messages
 */

import { AlertCircle, Database, Network, Zap, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Empty state component
 */
interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      {icon && <div className="mb-4 text-warm-400">{icon}</div>}
      <h3 className="text-lg font-semibold text-night-800 mb-1">{title}</h3>
      {description && <p className="text-sm text-warm-600 text-center mb-4 max-w-md">{description}</p>}
      {action && (
        <Button onClick={action.onClick} size="sm">
          {action.label}
        </Button>
      )}
    </div>
  )
}

/**
 * Error state component
 */
interface ErrorStateProps {
  title?: string
  message: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  action,
}: ErrorStateProps) {
  return (
    <div className="rounded-lg border-2 border-red-200 bg-red-50 p-6">
      <div className="flex items-start gap-4">
        <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <h3 className="font-semibold text-red-900 mb-1">{title}</h3>
          <p className="text-sm text-red-700 mb-4">{message}</p>
          {action && (
            <Button size="sm" onClick={action.onClick} variant="outline" className="text-red-600">
              {action.label}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * No data message
 */
export function NoData() {
  return (
    <EmptyState
      icon={<Database className="w-12 h-12" />}
      title="No data available"
      description="There's no data to display at the moment. Check back later or refresh the page."
    />
  )
}

/**
 * Connection error state
 */
export function ConnectionError({ onRetry }: { onRetry: () => void }) {
  return (
    <ErrorState
      title="Connection Error"
      message="Failed to connect to the monitoring service. Please check your internet connection and try again."
      action={{ label: 'Retry', onClick: onRetry }}
    />
  )
}

/**
 * Timeout error state
 */
export function TimeoutError({ onRetry }: { onRetry: () => void }) {
  return (
    <ErrorState
      title="Request Timeout"
      message="The request took too long to complete. Please try again."
      action={{ label: 'Retry', onClick: onRetry }}
    />
  )
}

/**
 * Loading message with spinner
 */
export function LoadingMessage({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex items-center gap-3 py-8 px-4 justify-center">
      <div className="relative w-5 h-5">
        <div className="absolute inset-0 rounded-full border-2 border-warm-200" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary-600 animate-spin" />
      </div>
      <span className="text-sm text-warm-600">{message}</span>
    </div>
  )
}

/**
 * Service unavailable state
 */
export function ServiceUnavailable({ serviceName }: { serviceName: string }) {
  return (
    <div className="rounded-lg border-2 border-yellow-200 bg-yellow-50 p-6">
      <div className="flex items-start gap-4">
        <Network className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
        <div>
          <h3 className="font-semibold text-yellow-900 mb-1">{serviceName} Unavailable</h3>
          <p className="text-sm text-yellow-700">
            This service is currently unavailable. Our team is working on it.
          </p>
        </div>
      </div>
    </div>
  )
}

/**
 * Refreshing indicator
 */
export function RefreshingIndicator() {
  return (
    <div className="flex items-center gap-2 text-sm text-warm-600 py-2">
      <RefreshCw className="w-4 h-4 animate-spin" />
      <span>Refreshing...</span>
    </div>
  )
}

/**
 * Last updated timestamp
 */
export function LastUpdated({ timestamp }: { timestamp: Date }) {
  return (
    <p className="text-xs text-warm-500">
      Last updated: {timestamp.toLocaleTimeString()}
    </p>
  )
}

/**
 * Data loading skeleton wrapper
 */
interface DataLoadingWrapperProps {
  isLoading: boolean
  isError?: boolean
  error?: {
    message: string
    onRetry?: () => void
  }
  children: React.ReactNode
  skeleton?: React.ReactNode
}

export function DataLoadingWrapper({
  isLoading,
  isError,
  error,
  children,
  skeleton,
}: DataLoadingWrapperProps) {
  if (isError && error) {
    return (
      <ErrorState
        message={error.message}
        action={error.onRetry ? { label: 'Retry', onClick: error.onRetry } : undefined}
      />
    )
  }

  if (isLoading) {
    return skeleton || <LoadingMessage />
  }

  return <>{children}</>
}
