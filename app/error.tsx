'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-warm-50 px-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-red-100">
          <AlertTriangle className="h-10 w-10 text-red-500" />
        </div>
        <h1 className="font-display text-4xl font-extrabold text-night-800">Algo salió mal</h1>
        <p className="mt-3 text-warm-500">
          Ocurrió un error inesperado. Puedes intentar de nuevo o volver al inicio.
        </p>
        {error.digest && (
          <p className="mt-2 font-mono text-xs text-warm-400">Ref: {error.digest}</p>
        )}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={reset}>
            <RefreshCw className="h-4 w-4" />
            Intentar de nuevo
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Volver al inicio</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
