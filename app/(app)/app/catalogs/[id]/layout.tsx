export const dynamic = 'force-dynamic'

export default function CatalogLayout({ children }: { children: React.ReactNode }) {
  // El sidebar ya recibe activeCatalogId desde el app layout usando params
  return <>{children}</>
}
