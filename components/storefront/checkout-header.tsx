'use client'

import { ArrowLeft, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Props {
  title: string
  backHref?: string
  closeHref: string
}

export function CheckoutHeader({ title, backHref, closeHref }: Props) {
  const router = useRouter()

  return (
    <header className="sticky top-0 z-40 border-b border-warm-100 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
        <button
          type="button"
          onClick={() => (backHref ? router.push(backHref) : router.back())}
          className="rounded-full p-2 text-night-500 hover:bg-warm-100"
          aria-label="Volver"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-semibold text-night-800">{title}</h1>
        <Link
          href={closeHref}
          className="rounded-full p-2 text-night-500 hover:bg-warm-100"
          aria-label="Cerrar"
        >
          <X className="h-5 w-5" />
        </Link>
      </div>
    </header>
  )
}
