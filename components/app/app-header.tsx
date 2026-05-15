'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  Menu, X, LayoutGrid, Users, CreditCard, Plus, LogOut, ChevronDown, Store,
  Package, Palette, ShoppingCart, BarChart2, Settings2, FileText, User,
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

interface AppHeaderProps {
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

export function AppHeader({ catalogs, userName, userEmail, planCode = 'free' }: AppHeaderProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const userDropdownRef = useRef<HTMLDivElement>(null)

  // Close user dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const catalogMatch = pathname.match(/\/app\/catalogs\/([^/]+)/)
  const activeCatalogId = catalogMatch?.[1] ?? undefined
  const isInCatalog = !!activeCatalogId
  const catalogNav = activeCatalogId ? getCatalogNav(activeCatalogId) : []
  const activeCatalog = catalogs.find((c) => c.id === activeCatalogId)

  return (
    <header className="flex h-16 items-center justify-between border-b border-warm-200 bg-white px-4 sticky top-0 z-50 lg:hidden">
      {/* Logo */}
      <Link href="/app" className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500">
          <span className="text-sm font-black text-white">D</span>
        </div>
        <span className="font-display font-bold text-night-800">Domicilios</span>
      </Link>

      {/* Right Section: Notifications + User Dropdown + Hamburger */}
      <div className="flex items-center gap-3">
        {/* Notifications Placeholder */}
        <button className="relative rounded-lg p-2 hover:bg-warm-100 transition-colors" title="Notificaciones">
          <div className="h-5 w-5 rounded-full bg-primary-500 flex items-center justify-center">
            <span className="text-xs font-bold text-white">1</span>
          </div>
        </button>

        {/* User Dropdown */}
        <div className="relative" ref={userDropdownRef}>
          <button
            onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
            className="flex items-center gap-2 rounded-lg p-2 hover:bg-warm-100 transition-colors"
            title="Usuario"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-600">
              {userName?.charAt(0).toUpperCase() ?? 'U'}
            </div>
          </button>

          {/* User Dropdown Menu */}
          {isUserDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-lg border border-warm-200 bg-white shadow-lg p-4 space-y-3">
              {/* User Info */}
              <div className="border-b border-warm-200 pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-600">
                    {userName?.charAt(0).toUpperCase() ?? 'U'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-night-800">{userName ?? 'Usuario'}</p>
                    <p className="truncate text-xs text-warm-400">{userEmail}</p>
                  </div>
                </div>
              </div>

              {/* Plan Badge */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-night-600">Plan actual:</span>
                <span className={cn('rounded-full px-2.5 py-1 text-xs font-bold', PLAN_COLORS[planCode])}>
                  {PLAN_NAMES[planCode]}
                </span>
              </div>

              {/* Menu Options */}
              <nav className="space-y-2">
                <Link
                  href="/app/billing"
                  onClick={() => setIsUserDropdownOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-night-600 hover:bg-warm-100 hover:text-primary-600 transition-colors"
                >
                  <CreditCard className="h-4 w-4" />
                  Perfil
                </Link>
                <button
                  onClick={() => {
                    setIsUserDropdownOpen(false)
                    signOut({ callbackUrl: '/login' })
                  }}
                  className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Finalizar sesión
                </button>
              </nav>
            </div>
          )}
        </div>

        {/* Hamburger Menu */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-lg p-2 hover:bg-warm-100 transition-colors"
          title="Menú"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="absolute left-0 top-16 right-0 border-b border-warm-200 bg-white p-4 space-y-3 shadow-lg">
          {/* Catalog context */}
          {isInCatalog && activeCatalog ? (
            <>
              <div className="mb-3 rounded-lg border border-warm-200 bg-warm-50 p-3">
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
              </div>

              {/* Catalog nav */}
              <nav className="space-y-1 border-b border-warm-200 pb-3">
                {catalogNav.map((item) => {
                  const active = item.exact
                    ? pathname === item.href
                    : pathname.startsWith(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
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
            </>
          ) : null}

          {/* Global nav */}
          <nav className="space-y-1 border-b border-warm-200 pb-3">
            {globalNav.map((item) => {
              const active = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
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
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 rounded-lg border-2 border-dashed border-warm-200 px-3 py-2 text-sm font-medium text-warm-400 transition-colors hover:border-primary-300 hover:text-primary-500"
          >
            <Plus className="h-4 w-4" />
            Nuevo catálogo
          </Link>

          {/* User section */}
          <div className="border-t border-warm-200 pt-3">
            <div className="flex items-center gap-3 rounded-lg px-2 py-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-600">
                {userName?.charAt(0).toUpperCase() ?? 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-night-800">{userName ?? 'Usuario'}</p>
                <p className="truncate text-xs text-warm-400">{userEmail}</p>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2 px-2">
              <span className={cn('rounded-full px-2 py-1 text-xs font-bold', PLAN_COLORS[planCode])}>
                {PLAN_NAMES[planCode]}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="ml-auto shrink-0 rounded-lg p-1.5 text-warm-400 hover:bg-warm-100 hover:text-red-500 transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
