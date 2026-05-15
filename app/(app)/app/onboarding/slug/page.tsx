import type { Metadata } from 'next'
export const dynamic = 'force-dynamic'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export const metadata: Metadata = { title: 'Crea tu enlace único' }

export default async function OnboardingSlugPage() {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div className="flex min-h-screen items-center justify-center bg-warm-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-warm-200 bg-white p-8 shadow-elevated text-center">
        <div className="mb-4 text-4xl">🔗</div>
        <h1 className="text-2xl font-extrabold text-night-800">¡Empecemos!</h1>
        <p className="mt-2 text-warm-500 text-sm leading-relaxed">
          Crea un enlace único para tu tienda. Una vez seleccionado{' '}
          <strong>no podrá cambiarse</strong>. Puedes conectar tu propio dominio después.
        </p>

        <div className="mt-6 space-y-3">
          <div className="flex items-center gap-1 rounded-xl border-2 border-primary-300 bg-primary-50 p-3 text-sm">
            <span className="whitespace-nowrap text-warm-400">domicilios.app/</span>
            <input
              type="text"
              maxLength={30}
              placeholder="mi-tienda"
              className="min-w-0 flex-1 bg-transparent font-medium text-night-800 outline-none placeholder:text-warm-300"
            />
          </div>
          <p className="text-right text-xs text-warm-400">0/30</p>
        </div>

        <p className="mt-4 rounded-lg bg-lime-50 px-4 py-2 text-xs text-lime-700">
          Este módulo se completa en Fase 3 (Dashboard + Server Actions)
        </p>
      </div>
    </div>
  )
}
