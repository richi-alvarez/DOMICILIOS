'use client'

import { CatalogWizard } from '@/components/app/catalog-wizard'

export default function NewCatalogPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 bg-warm-50">
      <CatalogWizard isOnboarding={false} />
    </div>
  )
}
