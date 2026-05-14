import Link from 'next/link'
import { ArrowLeft, SearchX } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-warm-50 px-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-100">
          <SearchX className="h-10 w-10 text-primary-500" />
        </div>
        <h1 className="font-display text-6xl font-extrabold text-night-800">404</h1>
        <h2 className="mt-2 text-2xl font-bold text-night-800">Página no encontrada</h2>
        <p className="mt-3 text-warm-500">
          Lo sentimos, la página que buscas no existe o fue movida.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Volver al inicio
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/plans">Ver planes</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
