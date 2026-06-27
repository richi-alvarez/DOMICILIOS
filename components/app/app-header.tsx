'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  Menu, X, LayoutGrid, Users, CreditCard, Plus, LogOut, ChevronDown, Store,
  Package, Palette, ShoppingCart, BarChart2, Settings2, FileText, User,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PlanCode } from '@/lib/billing/constants'
import { PLAN_NAMES, PLAN_COLORS } from '@/lib/billing/constants'
import { APP_NAME, APP_LOGO } from '@/lib/brand'
import { useI18n } from '@/lib/i18n/context'
import { LanguageSwitcher } from '@/components/i18n/language-switcher'

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
  { href: '/app', key: 'catalogs', icon: LayoutGrid },
  { href: '/app/team', key: 'team', icon: Users },
  { href: '/app/billing', key: 'billing', icon: CreditCard },
]

function getCatalogNav(id: string) {
  return [
    { href: `/app/catalogs/${id}`, key: 'details', icon: Store, exact: true },
    { href: `/app/catalogs/${id}/products`, key: 'products', icon: Package },
    { href: `/app/catalogs/${id}/categories`, key: 'categories', icon: LayoutGrid },
    { href: `/app/catalogs/${id}/design`, key: 'design', icon: Palette },
    { href: `/app/catalogs/${id}/orders`, key: 'orders', icon: ShoppingCart },
    { href: `/app/catalogs/${id}/analytics`, key: 'analytics', icon: BarChart2 },
    { href: `/app/catalogs/${id}/reports`, key: 'reports', icon: FileText },
    { href: `/app/catalogs/${id}/settings`, key: 'settings', icon: Settings2 },
  ]
}

export function AppHeader({ catalogs, userName, userEmail, planCode = 'free' }: AppHeaderProps) {
  const pathname = usePathname()
  const { t } = useI18n()
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
        <Image src={APP_LOGO} alt={APP_NAME} width={32} height={32} />
        <span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text font-display font-bold text-transparent">{APP_NAME}</span>
      </Link>

      {/* Right Section: Language + Notifications + User Dropdown + Hamburger */}
      <div className="flex items-center gap-3">
        <LanguageSwitcher />
        {/* Notifications Placeholder */}
        <button className="relative rounded-lg p-2 hover:bg-warm-100 transition-colors" title={t('appHeader.notifications')}>
          <div className="h-5 w-5 rounded-full bg-primary-500 flex items-center justify-center">
            <span className="text-xs font-bold text-white">1</span>
          </div>
        </button>

        {/* User Dropdown */}
        <div className="relative" ref={userDropdownRef}>
          <button
            onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
            className="flex items-center gap-2 rounded-lg p-2 hover:bg-warm-100 transition-colors"
            title={t('appHeader.user')}
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
                    <p className="truncate text-sm font-semibold text-night-800">{userName ?? t('appHeader.userFallback')}</p>
                    <p className="truncate text-xs text-warm-400">{userEmail}</p>
                  </div>
                </div>
              </div>

              {/* Plan Badge */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-night-600">{t('appHeader.currentPlan')}</span>
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
                  {t('appHeader.profile')}
                </Link>
                <button
                  onClick={() => {
                    setIsUserDropdownOpen(false)
                    signOut({ callbackUrl: '/login' })
                  }}
                  className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  {t('appHeader.logout')}
                </button>
              </nav>
            </div>
          )}
        </div>

        {/* Hamburger Menu */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-lg p-2 hover:bg-warm-100 transition-colors"
          title={t('appHeader.menu')}
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
                  <span className="text-[10px] font-bold uppercase tracking-wider text-warm-400">{t('appHeader.activeCatalog')}</span>
                  <span className={cn(
                    'rounded-full px-2 py-0.5 text-[10px] font-bold',
                    activeCatalog.status === 'published'
                      ? 'bg-lime-100 text-lime-700'
                      : 'bg-warm-200 text-warm-600',
                  )}>
                    {activeCatalog.status === 'published' ? t('appHeader.published') : t('appHeader.draft')}
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
                      {t(`appHeader.catalogNav.${item.key}`)}
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
                  {t(`appHeader.global.${item.key}`)}
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
            {t('appHeader.newCatalog')}
          </Link>

          {/* User section */}
          <div className="border-t border-warm-200 pt-3">
            <div className="flex items-center gap-3 rounded-lg px-2 py-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-600">
                {userName?.charAt(0).toUpperCase() ?? 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-night-800">{userName ?? t('appHeader.userFallback')}</p>
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
                title={t('appHeader.logout')}
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
