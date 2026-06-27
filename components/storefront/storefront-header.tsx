'use client'

import Link from 'next/link'
import { ShoppingCart, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useCartState } from './cart-context'
import { useI18n } from '@/lib/i18n/context'
import { LanguageSwitcher } from '@/components/i18n/language-switcher'

interface Props {
  catalogName: string
  catalogSlug: string
  logoUrl?: string
  showSearch?: boolean
}

export function StorefrontHeader({ catalogName, catalogSlug, logoUrl, showSearch = true }: Props) {
  const { items } = useCartState()
  const { t } = useI18n()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const count = mounted ? items.reduce((s, i) => s + i.qty, 0) : 0

  return (
    <header
      className="sticky top-0 z-40 border-b border-black/5 backdrop-blur-sm"
      style={{ background: 'var(--sf-header-bg, #ffffff)' }}
    >
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
        <Link href={`/s/${catalogSlug}`} className="flex items-center gap-2">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={catalogName}
              className="h-8 max-w-[120px] object-contain"
            />
          ) : (
            <span
              className="font-display text-lg font-bold text-night-800"
              style={{ fontFamily: 'var(--sf-heading-font)' }}
            >
              {catalogName}
            </span>
          )}
        </Link>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          {showSearch && (
            <button
              type="button"
              className="rounded-full p-2 text-night-500 hover:bg-black/5 hover:text-night-800"
              aria-label={t('storefrontHeader.search')}
            >
              <Search className="h-5 w-5" />
            </button>
          )}
          <Link
            href={`/s/${catalogSlug}/cart`}
            className="relative rounded-full p-2 text-night-700 hover:bg-black/5 hover:text-night-900"
            aria-label={t('storefrontHeader.cart')}
          >
            <ShoppingCart className="h-5 w-5" />
            {count > 0 && (
              <span
                className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold"
                style={{
                  background: 'var(--sf-primary, #FF6B57)',
                  color: 'var(--sf-primary-text, #ffffff)',
                }}
              >
                {count > 9 ? '9+' : count}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  )
}
