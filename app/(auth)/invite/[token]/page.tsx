export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { CheckCircle2, XCircle, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { auth } from '@/auth'
import { acceptInvite } from '@/lib/actions/team'
import { db, invites } from '@/db'
import { eq } from 'drizzle-orm'

export const metadata: Metadata = { title: 'Aceptar invitación' }

interface Props {
  params: Promise<{ token: string }>
}

async function InviteContent({ token }: { token: string }) {
  const session = await auth()

  // Preview: show invite info even if not logged in
  let invite = null
  try {
    invite = await db.query.invites.findFirst({ where: eq(invites.token, token) })
  } catch {
    // DB not configured
  }

  if (!invite || invite.expiresAt < new Date()) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <XCircle className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-night-800">Invitación inválida</h2>
        <p className="text-sm text-warm-500">Esta invitación no existe o ha expirado.</p>
        <Button asChild variant="outline">
          <Link href="/login">Iniciar sesión</Link>
        </Button>
      </div>
    )
  }

  // Not logged in — redirect to login with invite token preserved
  if (!session?.user?.id) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
          <Users className="h-8 w-8 text-primary-500" />
        </div>
        <h2 className="text-xl font-bold text-night-800">Tienes una invitación</h2>
        <p className="text-sm text-warm-500">
          Fuiste invitado como <strong className="text-night-700">{invite.email}</strong>.
          <br />Inicia sesión para aceptar la invitación.
        </p>
        <div className="flex flex-col gap-2 w-full">
          <Button asChild>
            <Link href={`/login?callbackUrl=/invite/${token}`}>Iniciar sesión</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/signup?callbackUrl=/invite/${token}`}>Crear cuenta nueva</Link>
          </Button>
        </div>
      </div>
    )
  }

  // Logged in — accept the invite
  const result = await acceptInvite(token)

  if (result.error) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <XCircle className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-night-800">No se pudo aceptar</h2>
        <p className="text-sm text-warm-500">{result.error}</p>
        <Button asChild>
          <Link href="/app">Ir a mi panel</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-lime-100">
        <CheckCircle2 className="h-8 w-8 text-lime-600" />
      </div>
      <h2 className="text-xl font-bold text-night-800">¡Bienvenido al equipo!</h2>
      <p className="text-sm text-warm-500">Ya eres parte del equipo. Puedes empezar a colaborar.</p>
      <Button asChild>
        <Link href="/app">Ir a mi panel →</Link>
      </Button>
    </div>
  )
}

export default async function InvitePage({ params }: Props) {
  const { token } = await params
  return (
    <Card>
      <CardContent className="pt-6">
        <InviteContent token={token} />
      </CardContent>
    </Card>
  )
}
