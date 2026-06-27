'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  Menu,
  X,
  ChevronDown,
  Wrench,
  BookOpen,
  BarChart2,
  Newspaper,
  MessageCircle,
  Calculator,
  QrCode,
  User2,
  Zap,
  LogOut,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { APP_NAME, APP_LOGO } from '@/lib/brand'
import { useI18n } from '@/lib/i18n/context'
import { LanguageSwitcher } from '@/components/i18n/language-switcher'

const tools = [
  { href: '/tools/whatsapp-link-generator', key: 'whatsapp', icon: MessageCircle },
  { href: '/tools/product-description-generator', key: 'description', icon: Zap },
  { href: '/tools/profit-margin-calculator', key: 'margin', icon: Calculator },
  { href: '/tools/business-name-generator', key: 'names', icon: Zap },
  { href: '/tools/qr-code-menu-generator', key: 'qr', icon: QrCode },
  { href: '/tools/biography-generator', key: 'bio', icon: User2 },
]

const guides = [
  { href: '/como-vender/ropa', key: 'ropa' },
  { href: '/como-vender/comida', key: 'comida' },
  { href: '/como-vender/pasteles', key: 'pasteles' },
  { href: '/como-vender/cosmeticos', key: 'cosmeticos' },
  { href: '/como-vender/cafe', key: 'cafe' },
  { href: '/como-vender', key: 'all' },
]

const comparisons = [
  { href: '/guides/catalogo-digital-whatsapp', key: 'qr' },
  { href: '/guides/mejor-plataforma-whatsapp', key: 'platform' },
  { href: '/guides/tienda-online-gratis', key: 'free' },
  { href: '/guides', key: 'all' },
]

export function SiteHeader() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const { t } = useI18n()
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [resourcesOpen, setResourcesOpen] = React.useState(false)
  const [userMenuOpen, setUserMenuOpen] = React.useState(false)

  const navLinks = [
    { href: '/', key: 'home' },
    { href: '/plans', key: 'plans' },
    { href: '/agencies', key: 'agencies' },
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-warm-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src={APP_LOGO}
            alt={APP_NAME}
            width={32}
            height={32}
            className="h-auto w-auto"
          />
          <span className="font-display text-xl font-bold bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
            {APP_NAME}
          </span>
        </Link>

        {/* Nav desktop */}
        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'rounded-md px-3 py-2 text-sm font-medium transition-colors hover:text-primary-500',
                pathname === link.href ? 'text-primary-500' : 'text-night-700',
              )}
            >
              {t(`siteHeader.nav.${link.key}`)}
            </Link>
          ))}

          {/* Recursos dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setResourcesOpen(true)}
            onMouseLeave={() => setResourcesOpen(false)}
          >
            <button
              className={cn(
                'flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:text-primary-500',
                resourcesOpen ? 'text-primary-500' : 'text-night-700',
              )}
            >
              {t('siteHeader.nav.resources')}
              <ChevronDown
                className={cn('h-4 w-4 transition-transform', resourcesOpen && 'rotate-180')}
              />
            </button>

            {resourcesOpen && (
              <div className="absolute left-0 top-full z-50 mt-1 w-[700px] rounded-2xl border border-warm-200 bg-white p-6 shadow-modal">
                <div className="grid grid-cols-4 gap-6">
                  {/* Herramientas */}
                  <div>
                    <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-warm-400">
                      <Wrench className="h-3.5 w-3.5" />
                      {t('siteHeader.sections.tools')}
                    </div>
                    <ul className="space-y-1">
                      {tools.map((tool) => (
                        <li key={tool.href}>
                          <Link
                            href={tool.href}
                            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-night-700 hover:bg-primary-50 hover:text-primary-600"
                          >
                            <tool.icon className="h-3.5 w-3.5 text-primary-400" />
                            {t(`siteHeader.tools.${tool.key}`)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Guías */}
                  <div>
                    <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-warm-400">
                      <BookOpen className="h-3.5 w-3.5" />
                      {t('siteHeader.sections.guides')}
                    </div>
                    <ul className="space-y-1">
                      {guides.map((g) => (
                        <li key={g.href}>
                          <Link
                            href={g.href}
                            className="block rounded-md px-2 py-1.5 text-sm text-night-700 hover:bg-primary-50 hover:text-primary-600"
                          >
                            {t(`siteHeader.guides.${g.key}`)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Comparativas */}
                  <div>
                    <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-warm-400">
                      <BarChart2 className="h-3.5 w-3.5" />
                      {t('siteHeader.sections.comparisons')}
                    </div>
                    <ul className="space-y-1">
                      {comparisons.map((c) => (
                        <li key={c.href}>
                          <Link
                            href={c.href}
                            className="block rounded-md px-2 py-1.5 text-sm text-night-700 hover:bg-primary-50 hover:text-primary-600"
                          >
                            {t(`siteHeader.comparisons.${c.key}`)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Blog */}
                  <div>
                    <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-warm-400">
                      <Newspaper className="h-3.5 w-3.5" />
                      {t('siteHeader.sections.blog')}
                    </div>
                    <div className="rounded-xl bg-gradient-to-br from-primary-50 to-lime-50 p-4">
                      <p className="text-sm font-medium text-night-800">{t('siteHeader.blog.title')}</p>
                      <p className="mt-1 text-xs text-warm-500">
                        {t('siteHeader.blog.desc')}
                      </p>
                      <Link
                        href="/blog"
                        className="mt-3 inline-flex items-center text-xs font-semibold text-primary-500 hover:underline"
                      >
                        {t('siteHeader.blog.cta')}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* CTAs desktop */}
        <div className="hidden items-center gap-3 lg:flex">
          <LanguageSwitcher />
          {status === 'authenticated' && session?.user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 rounded-full border border-warm-200 px-3 py-2 hover:bg-warm-50 transition-colors"
              >
                <div className="h-6 w-6 rounded-full bg-primary-500 flex items-center justify-center text-white text-xs font-bold">
                  {session.user.name?.charAt(0) || session.user.email?.charAt(0) || 'U'}
                </div>
                <span className="text-sm font-medium text-night-700">
                  {session.user.name || session.user.email}
                </span>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 transition-transform text-night-500',
                    userMenuOpen && 'rotate-180',
                  )}
                />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-warm-200 bg-white shadow-lg z-50">
                  <div className="border-b border-warm-200 px-4 py-3">
                    <p className="text-sm font-medium text-night-800">
                      {session.user.name}
                    </p>
                    <p className="text-xs text-warm-500">
                      {session.user.email}
                    </p>
                  </div>
                  <Link
                    href="/app"
                    onClick={() => setUserMenuOpen(false)}
                    className="block w-full px-4 py-2.5 text-left text-sm text-night-700 hover:bg-warm-50 transition-colors"
                  >
                    {t('siteHeader.cta.panel')}
                  </Link>
                  <button
                    onClick={() => {
                      setUserMenuOpen(false)
                      signOut({ callbackUrl: '/' })
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-warm-600 hover:bg-warm-50 transition-colors border-t border-warm-200"
                  >
                    <LogOut className="h-4 w-4" />
                    {t('siteHeader.cta.logout')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-night-700 hover:text-primary-500 transition-colors"
              >
                {t('siteHeader.cta.login')}
              </Link>
              <Button asChild size="md">
                <Link href="/signup">{t('siteHeader.cta.signup')}</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="rounded-md p-2 text-night-700 hover:bg-warm-100 lg:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={t('siteHeader.mobile.openMenu')}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-warm-200 bg-white px-4 pb-6 pt-4 lg:hidden">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'rounded-md px-3 py-2.5 text-sm font-medium',
                  pathname === link.href
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-night-700 hover:bg-warm-100',
                )}
              >
                {t(`siteHeader.nav.${link.key}`)}
              </Link>
            ))}
            <Link
              href="/tools"
              onClick={() => setMobileOpen(false)}
              className="rounded-md px-3 py-2.5 text-sm font-medium text-night-700 hover:bg-warm-100"
            >
              {t('siteHeader.mobile.tools')}
            </Link>
            <Link
              href="/como-vender"
              onClick={() => setMobileOpen(false)}
              className="rounded-md px-3 py-2.5 text-sm font-medium text-night-700 hover:bg-warm-100"
            >
              {t('siteHeader.mobile.guides')}
            </Link>
            <div className="px-3 pt-2">
              <LanguageSwitcher />
            </div>
          </nav>
          <div className="mt-4 border-t border-warm-200 pt-4">
            {status === 'authenticated' && session?.user ? (
              <div className="flex flex-col gap-2">
                <div className="rounded-lg bg-warm-50 p-3 mb-2">
                  <p className="text-sm font-medium text-night-800">
                    {session.user.name}
                  </p>
                  <p className="text-xs text-warm-500">
                    {session.user.email}
                  </p>
                </div>
                <Button asChild className="w-full">
                  <Link href="/app" onClick={() => setMobileOpen(false)}>
                    {t('siteHeader.cta.panel')}
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setMobileOpen(false)
                    signOut({ callbackUrl: '/' })
                  }}
                  className="w-full"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {t('siteHeader.cta.logout')}
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Button asChild variant="outline" className="w-full">
                  <Link href="/login" onClick={() => setMobileOpen(false)}>
                    {t('siteHeader.cta.login')}
                  </Link>
                </Button>
                <Button asChild className="w-full">
                  <Link href="/signup" onClick={() => setMobileOpen(false)}>
                    {t('siteHeader.cta.signup')}
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
