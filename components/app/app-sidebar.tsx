'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutGrid, Package, Palette, ShoppingCart, BarChart2, Settings2, FileText,
  LogOut, ChevronDown, Plus, Store, Users, CreditCard,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PlanCode } from '@/lib/billing/constants'
import { PLAN_NAMES, PLAN_COLORS } from '@/lib/billing/constants'

interface CatalogNav {
  id: string
  name: string
  slug: string
  status: 'draft' | 'published' | 'archived'
}

interface AppSidebarProps {
  catalogs: CatalogNav[]
  userName?: string
  userEmail?: string
  planCode?: PlanCode
}

const globalNav = [
  { href: '/app', label: 'Mis catálogos', icon: LayoutGrid },
  { href: '/app/team', label: 'Equipo', icon: Users },
  { href: '/app/billing', label: 'Plan y facturación', icon: CreditCard },
]

function getCatalogNav(id: string) {
  return [
    { href: `/app/catalogs/${id}`, label: 'Detalles', icon: Store, exact: true },
    { href: `/app/catalogs/${id}/products`, label: 'Productos', icon: Package },
    { href: `/app/catalogs/${id}/categories`, label: 'Categorías', icon: LayoutGrid },
    { href: `/app/catalogs/${id}/design`, label: 'Diseño', icon: Palette },
    { href: `/app/catalogs/${id}/orders`, label: 'Pedidos', icon: ShoppingCart },
    { href: `/app/catalogs/${id}/analytics`, label: 'Estadísticas', icon: BarChart2 },
    { href: `/app/catalogs/${id}/reports`, label: 'Reportes', icon: FileText },
    { href: `/app/catalogs/${id}/settings`, label: 'Configuración', icon: Settings2 },
  ]
}

export function AppSidebar({ catalogs, userName, userEmail, planCode = 'free' }: AppSidebarProps) {
  const pathname = usePathname()
  // Detectar catálogo activo desde la URL: /app/catalogs/[id]/...
  const catalogMatch = pathname.match(/\/app\/catalogs\/([^/]+)/)
  const activeCatalogId = catalogMatch?.[1] ?? undefined
  const isInCatalog = !!activeCatalogId
  const catalogNav = activeCatalogId ? getCatalogNav(activeCatalogId) : []
  const activeCatalog = catalogs.find((c) => c.id === activeCatalogId)

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-warm-200 bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-warm-200 px-5">
        <Link href="/app" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500">
            <span className="text-sm font-black text-white">D</span>
          </div>
          <span className="font-display font-bold text-night-800">Domicilios</span>
        </Link>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto p-3">
        {/* Catalog context */}
        {isInCatalog && activeCatalog ? (
          <>
            {/* Catalog switcher */}
            <div className="mb-2 rounded-xl border border-warm-200 bg-warm-50 p-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-warm-400">Catálogo activo</span>
                <span className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] font-bold',
                  activeCatalog.status === 'published'
                    ? 'bg-lime-100 text-lime-700'
                    : 'bg-warm-200 text-warm-600',
                )}>
                  {activeCatalog.status === 'published' ? 'Publicado' : 'Borrador'}
                </span>
              </div>
              <p className="font-semibold text-sm text-night-800 truncate">{activeCatalog.name}</p>
              <p className="text-xs text-warm-400">/{activeCatalog.slug}</p>
              <Link href="/app" className="mt-2 flex items-center gap-1 text-xs text-primary-500 hover:underline">
                <ChevronDown className="h-3 w-3 rotate-90" />
                Ver todos los catálogos
              </Link>
            </div>

            {/* Catalog nav */}
            <nav className="space-y-0.5">
              {catalogNav.map((item) => {
                const active = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      active
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-night-600 hover:bg-warm-100 hover:text-night-800',
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            <div className="my-3 h-px bg-warm-200" />
          </>
        ) : null}

        {/* Global nav */}
        <nav className="space-y-0.5">
          {globalNav.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-night-600 hover:bg-warm-100 hover:text-night-800',
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* New catalog */}
        <Link
          href="/app/catalogs/new"
          className="mt-3 flex items-center gap-2 rounded-lg border-2 border-dashed border-warm-200 px-3 py-2 text-sm font-medium text-warm-400 transition-colors hover:border-primary-300 hover:text-primary-500"
        >
          <Plus className="h-4 w-4" />
          Nuevo catálogo
        </Link>
      </div>

      {/* User footer */}
      <div className="border-t border-warm-200 p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-600">
            {userName?.charAt(0).toUpperCase() ?? 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-sm font-medium text-night-800">{userName ?? 'Usuario'}</p>
              <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-bold', PLAN_COLORS[planCode])}>
                {PLAN_NAMES[planCode]}
              </span>
            </div>
            <p className="truncate text-xs text-warm-400">{userEmail}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="shrink-0 rounded-lg p-1.5 text-warm-400 hover:bg-warm-100 hover:text-red-500"
            title="Cerrar sesión"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
