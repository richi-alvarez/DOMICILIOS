'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { LayoutGrid } from 'lucide-react'

interface Props {
  categories: { id: string; name: string; slug: string }[]
  catalogSlug: string
  activeCategorySlug?: string
}

export function CategoryChips({ categories, catalogSlug, activeCategorySlug }: Props) {
  if (categories.length === 0) return null

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
      <Link
        href={`/s/${catalogSlug}`}
        className={cn(
          'flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition',
          !activeCategorySlug
            ? 'border-primary-500 bg-primary-500 text-white'
            : 'border-warm-200 bg-white text-night-600 hover:border-primary-300 hover:text-primary-600',
        )}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
        Todos
      </Link>
      {categories.map((cat) => (
        <Link
          key={cat.id}
          href={`/s/${catalogSlug}?cat=${cat.slug}`}
          className={cn(
            'shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition',
            activeCategorySlug === cat.slug
              ? 'border-primary-500 bg-primary-500 text-white'
              : 'border-warm-200 bg-white text-night-600 hover:border-primary-300 hover:text-primary-600',
          )}
        >
          {cat.name}
        </Link>
      ))}
    </div>
  )
}
