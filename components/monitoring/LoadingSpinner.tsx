/**
 * Professional loading spinner component
 * Used for async data loading states
 */

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  message?: string
  overlay?: boolean
}

export function LoadingSpinner({ size = 'md', message, overlay = false }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  }

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-4">
      {/* Outer ring */}
      <div className="relative">
        <div className={`${sizeClasses[size]} rounded-full border-4 border-warm-200`} />

        {/* Spinning ring */}
        <div
          className={`${sizeClasses[size]} absolute top-0 left-0 rounded-full border-4 border-transparent border-t-primary-600 border-r-primary-500 animate-spin`}
        />
      </div>

      {message && (
        <div className="text-center">
          <p className="text-sm font-medium text-warm-600">{message}</p>
        </div>
      )}
    </div>
  )

  if (overlay) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 shadow-2xl">{spinner}</div>
      </div>
    )
  }

  return spinner
}
