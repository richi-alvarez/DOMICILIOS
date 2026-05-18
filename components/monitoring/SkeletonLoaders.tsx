/**
 * Professional skeleton loaders for data loading states
 */

/**
 * Skeleton for a health status card
 */
export function ServiceCardSkeleton() {
  return (
    <div className="rounded-lg border-2 border-warm-200 bg-warm-50 p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-6 h-6 rounded-full bg-warm-300 animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-warm-300 rounded w-3/4 animate-pulse" />
          <div className="h-3 bg-warm-200 rounded w-1/2 animate-pulse" />
        </div>
      </div>
    </div>
  )
}

/**
 * Skeleton for a metric card
 */
export function MetricCardSkeleton() {
  return (
    <div className="rounded-lg border border-warm-200 bg-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="h-5 bg-warm-300 rounded w-1/3 animate-pulse" />
        <div className="w-10 h-10 rounded bg-warm-200 animate-pulse" />
      </div>
      <div className="space-y-2">
        <div className="h-8 bg-warm-300 rounded w-1/2 animate-pulse" />
        <div className="h-3 bg-warm-200 rounded w-2/3 animate-pulse" />
      </div>
    </div>
  )
}

/**
 * Skeleton for an alert item
 */
export function AlertItemSkeleton() {
  return (
    <div className="border border-warm-200 rounded-lg p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-5 h-5 rounded bg-warm-300 animate-pulse flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-warm-300 rounded w-1/2 animate-pulse" />
          <div className="h-3 bg-warm-200 rounded w-3/4 animate-pulse" />
          <div className="h-3 bg-warm-200 rounded w-1/3 animate-pulse" />
        </div>
        <div className="w-16 h-8 bg-warm-200 rounded animate-pulse flex-shrink-0" />
      </div>
    </div>
  )
}

/**
 * Skeleton for the health status overview card
 */
export function HealthOverviewSkeleton() {
  return (
    <div className="rounded-lg border-2 border-warm-200 bg-warm-50 p-6 space-y-4">
      <div className="flex items-start gap-4">
        <div className="w-8 h-8 rounded-full bg-warm-300 animate-pulse flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-5 bg-warm-300 rounded w-1/2 animate-pulse" />
          <div className="h-3 bg-warm-200 rounded w-3/4 animate-pulse" />
        </div>
      </div>
    </div>
  )
}

/**
 * Skeleton for a grid of cards
 */
export function CardGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <MetricCardSkeleton key={i} />
      ))}
    </div>
  )
}

/**
 * Skeleton for a list of items
 */
export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <AlertItemSkeleton key={i} />
      ))}
    </div>
  )
}

/**
 * Skeleton for the main dashboard
 */
export function DashboardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 bg-warm-300 rounded w-48 animate-pulse" />
          <div className="h-4 bg-warm-200 rounded w-64 animate-pulse" />
        </div>
        <div className="h-10 w-24 bg-warm-200 rounded animate-pulse" />
      </div>

      {/* Overall Status */}
      <HealthOverviewSkeleton />

      {/* Services Grid */}
      <CardGridSkeleton count={4} />

      {/* Alerts Section */}
      <div className="rounded-lg border border-warm-200 bg-white p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-warm-300 animate-pulse" />
          <div className="h-5 bg-warm-300 rounded w-48 animate-pulse" />
        </div>
        <ListSkeleton count={3} />
      </div>
    </div>
  )
}
