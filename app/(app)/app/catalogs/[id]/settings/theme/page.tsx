import { redirect } from 'next/navigation'

/**
 * La sección "Tema visual" se movió al editor de diseño (pestaña Global).
 * Mantenemos esta ruta como redirección para no romper enlaces antiguos.
 */
export default async function ThemePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/app/catalogs/${id}/design`)
}
