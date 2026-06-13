export const dynamic = 'force-dynamic'
import { notFound } from 'next/navigation'
import { db, appointments as appointmentsTable } from '@/db'
import { and, eq, gte, ne } from 'drizzle-orm'
import { getCatalogBySlug, listCatalogProducts } from '@/lib/storefront/queries'
import { BookingFlow } from './booking-flow'
import { DEFAULT_BOOKING } from '@/lib/booking/config'

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ service?: string; from?: string }>
}

export default async function AgendarPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { service: initialServiceSlug, from } = await searchParams
  const catalog = await getCatalogBySlug(slug)
  if (!catalog) notFound()

  // Si venimos del carrito, la flecha de atrás vuelve al carrito (step anterior).
  const backHref = from === 'cart' ? `/s/${slug}/cart` : `/s/${slug}`

  const settings = (catalog.settingsJson ?? {}) as Record<string, any>
  const booking = settings.booking ?? DEFAULT_BOOKING

  const products = await listCatalogProducts(catalog.id)
  const services = products.map((p) => {
    const imgs = Array.isArray(p.imagesJson) ? p.imagesJson : []
    const first = imgs[0] as string | { url?: string } | undefined
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      image: typeof first === 'string' ? first : first?.url,
    }
  })

  // Citas futuras (no canceladas) para excluir horarios ya tomados.
  const now = new Date()
  let booked: string[] = []
  try {
    const rows = await db.query.appointments.findMany({
      where: and(
        eq(appointmentsTable.catalogId, catalog.id),
        gte(appointmentsTable.startAt, now),
        ne(appointmentsTable.status, 'cancelled'),
      ),
    })
    booked = rows.map((r) => r.startAt.toISOString())
  } catch {
    booked = []
  }

  return (
    <BookingFlow
      catalogId={catalog.id}
      catalogName={catalog.name}
      slug={slug}
      currency={catalog.currency}
      booking={booking}
      services={services}
      booked={booked}
      initialServiceSlug={initialServiceSlug}
      backHref={backHref}
      fromCart={from === 'cart'}
    />
  )
}
