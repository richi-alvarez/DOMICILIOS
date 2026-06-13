export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { db, catalogs, memberships, appointments as appointmentsTable } from '@/db'
import { and, eq } from 'drizzle-orm'
import { CitasClient } from './citas-client'
import type { AppointmentDTO } from '@/lib/actions/appointments'

export const metadata: Metadata = { title: 'Citas' }

interface Props {
  params: Promise<{ id: string }>
}

export default async function CitasPage({ params }: Props) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) notFound()

  const catalog = await db.query.catalogs.findFirst({ where: eq(catalogs.id, id) })
  if (!catalog) notFound()
  const member = await db.query.memberships.findFirst({
    where: and(eq(memberships.userId, session.user.id), eq(memberships.organizationId, catalog.orgId)),
  })
  if (!member) notFound()

  const rows = await db.query.appointments.findMany({
    where: eq(appointmentsTable.catalogId, id),
    orderBy: (t, { asc }) => [asc(t.startAt)],
  })
  const data: AppointmentDTO[] = rows.map((a) => ({
    id: a.id,
    code: a.code,
    service: a.service,
    startAt: a.startAt.toISOString(),
    endAt: a.endAt.toISOString(),
    status: a.status as AppointmentDTO['status'],
    customer: (a.customerJson ?? {}) as AppointmentDTO['customer'],
    notes: a.notes,
  }))

  return (
    <div className="px-6 py-8">
      <h1 className="mb-1 font-display text-2xl font-bold text-night-900">Citas</h1>
      <p className="mb-6 text-sm text-night-400">
        Agenda de tus citas. Haz clic en una cita para ver el detalle y cambiar su estado.
      </p>
      {catalog.type !== 'appointments' && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
          Este catálogo está en modo <strong>productos</strong>. Para recibir citas cámbialo a
          <strong> Servicios (citas)</strong> en Configuración → Tipo de venta.
        </div>
      )}
      <CitasClient appointments={data} />
    </div>
  )
}
