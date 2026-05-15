export const dynamic = 'force-dynamic'

async function getCatalog(id: string) {
  if (!process.env.DATABASE_URL) return null
  try {
    const { db, catalogs } = await import('@/db')
    const { eq } = await import('drizzle-orm')
    return await db.query.catalogs.findFirst({ where: eq(catalogs.id, id) })
  } catch (err) {
    console.error('getCatalog error:', err)
    return null
  }
}

export default async function CatalogDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const catalog = await getCatalog(id)

  if (!catalog) {
    return <div className="p-8 text-center">Catálogo no encontrado</div>
  }

  return (
    <div className="px-6 py-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">{catalog.name}</h1>
      <p className="text-gray-600 mb-8">/{catalog.slug}</p>
      
      <div className="grid gap-6">
        <div className="border rounded-lg p-6">
          <h2 className="font-bold mb-4">Información Básica</h2>
          <dl className="space-y-2">
            <div><dt className="font-semibold">Nombre:</dt><dd>{catalog.name}</dd></div>
            <div><dt className="font-semibold">Slug:</dt><dd>{catalog.slug}</dd></div>
            <div><dt className="font-semibold">Estado:</dt><dd>{String(catalog.status)}</dd></div>
            <div><dt className="font-semibold">Idioma:</dt><dd>{catalog.language}</dd></div>
            <div><dt className="font-semibold">Moneda:</dt><dd>{catalog.currency}</dd></div>
            <div><dt className="font-semibold">Canal:</dt><dd>{catalog.orderChannel}</dd></div>
          </dl>
        </div>

        <div className="border rounded-lg p-6">
          <h2 className="font-bold mb-4">Contacto</h2>
          <p>Email: {catalog.contactEmail || 'No especificado'}</p>
          <p>Teléfono: {catalog.contactPhone || 'No especificado'}</p>
        </div>
      </div>
    </div>
  )
}
