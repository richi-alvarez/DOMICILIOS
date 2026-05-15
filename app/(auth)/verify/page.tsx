import { Suspense } from 'react'
import type { Metadata } from 'next'
export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { verifyEmail } from '@/lib/actions/auth'

export const metadata: Metadata = { title: 'Verificar correo' }

async function VerifyContent({ token }: { token: string }) {
  const result = await verifyEmail(token)

  if (result.success) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-lime-100">
          <CheckCircle2 className="h-8 w-8 text-lime-600" />
        </div>
        <h2 className="text-xl font-bold text-night-800">¡Correo verificado!</h2>
        <p className="text-sm text-warm-500">{result.message}</p>
        <Button asChild className="mt-2">
          <Link href="/app">Ir a mi panel</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
        <XCircle className="h-8 w-8 text-red-500" />
      </div>
      <h2 className="text-xl font-bold text-night-800">Enlace inválido</h2>
      <p className="text-sm text-warm-500">{result.error}</p>
      <Button asChild variant="outline">
        <Link href="/signup">Volver al registro</Link>
      </Button>
    </div>
  )
}

function NoToken() {
  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <XCircle className="h-12 w-12 text-warm-300" />
      <p className="text-sm text-warm-500">No se encontró el token de verificación.</p>
    </div>
  )
}

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  return (
    <Card>
      <CardContent className="pt-6">
        <Suspense
          fallback={
            <div className="flex flex-col items-center gap-3 py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
              <p className="text-sm text-warm-400">Verificando…</p>
            </div>
          }
        >
          {token ? <VerifyContent token={token} /> : <NoToken />}
        </Suspense>
      </CardContent>
    </Card>
  )
}
