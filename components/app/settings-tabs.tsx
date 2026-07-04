'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n/context'

interface Tab {
  href: string
  labelKey: string
}

interface Props {
  tabs: Tab[]
}

export function SettingsTabs({ tabs }: Props) {
  const pathname = usePathname()
  const { t } = useI18n()

  return (
    <div className="mb-8 flex gap-1 rounded-xl border border-warm-200 bg-warm-50 p-1">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/')
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'flex-1 rounded-lg px-4 py-2 text-center text-sm font-semibold transition-all',
              isActive
                ? 'bg-white text-night-800 shadow-sm'
                : 'text-warm-500 hover:text-night-700',
            )}
          >
            {t(tab.labelKey)}
          </Link>
        )
      })}
    </div>
  )
}
