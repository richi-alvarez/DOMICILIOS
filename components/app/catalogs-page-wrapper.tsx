'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Globe, ExternalLink, Zap, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { PlanBadge } from '@/components/app/plan-badge'
import { UsageBar } from '@/components/app/usage-bar'
import { Button } from '@/components/ui/button'
import { AICatalogModal } from './ai-catalog-modal'
import { useI18n } from '@/lib/i18n/context'

interface CatalogsPageWrapperProps {
  catalogList: any[]
  usage: any | null
  atCatalogLimit: boolean
  hasAIAccess: boolean
}

export function CatalogsPageWrapper({ catalogList, usage, atCatalogLimit, hasAIAccess }: CatalogsPageWrapperProps) {
  const { t } = useI18n()
  const [isAIModalOpen, setIsAIModalOpen] = useState(false)

  return (
    <>
      <div className="px-6 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-night-800">{t('appHeader.global.catalogs')}</h1>
            <p className="mt-0.5 text-sm text-warm-500">
              {catalogList.length === 0
                ? t('catalogsPage.subtitleEmpty')
                : `${catalogList.length} ${catalogList.length === 1 ? t('catalogsPage.countSingular') : t('catalogsPage.countPlural')}`}
            </p>
          </div>
          <div className="flex gap-3">
            {!atCatalogLimit && hasAIAccess && (
              <Button
                onClick={() => setIsAIModalOpen(true)}
                variant="outline"
              >
                <Sparkles className="h-4 w-4 text-primary-500" />
                {t('catalogsPage.createWithAI')}
              </Button>
            )}
            {atCatalogLimit ? (
              <Link href="/plans">
                <Button variant="outline">
                  <Zap className="h-4 w-4 text-primary-500" /> {t('catalogsPage.upgradePlan')}
                </Button>
              </Link>
            ) : (
              <Button asChild>
                <Link href="/app/catalogs/new">
                  <Plus className="h-4 w-4" /> {t('appHeader.newCatalog')}
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Upgrade banner when at limit */}
        {atCatalogLimit && usage && (
          <div className="mb-6 flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-amber-500 flex-shrink-0" />
              <p className="text-sm text-amber-800">
                {t('catalogsPage.limitPrefix')}
                <strong>{usage.catalogs.limit} {usage.catalogs.limit !== 1 ? t('catalogsPage.countPlural') : t('catalogsPage.countSingular')}</strong>
                {t('catalogsPage.limitSuffix').replace('{plan}', usage.planName)}
              </p>
            </div>
            <Link href="/plans" className="ml-4 flex-shrink-0 text-sm font-bold text-amber-700 hover:underline">
              {t('catalogsPage.viewPlansArrow')}
            </Link>
          </div>
        )}

        {/* Plan usage summary (only when not at limit to avoid duplicate) */}
        {usage && !atCatalogLimit && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-warm-200 bg-white px-5 py-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-semibold text-night-700">{t('catalogsPage.currentPlan')}</span>
                <PlanBadge plan={usage.planCode} />
              </div>
              <UsageBar
                label={t('catalogsPage.catalogsLabel')}
                used={usage.catalogs.used}
                limit={usage.catalogs.limit}
              />
            </div>
            {usage.planCode === 'free' && (
              <Link href="/plans" className="ml-4 flex-shrink-0 text-xs font-bold text-primary-500 hover:underline whitespace-nowrap">
                {t('catalogsPage.upgradeArrow')}
              </Link>
            )}
          </div>
        )}

        {/* Catalog grid */}
        {catalogList.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-warm-200 bg-white py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100">
              <Globe className="h-8 w-8 text-primary-500" />
            </div>
            <h2 className="text-xl font-bold text-night-800">{t('catalogsPage.emptyTitle')}</h2>
            <p className="mt-2 max-w-sm text-sm text-warm-500">
              {t('catalogsPage.emptyDesc')}
            </p>
            <div className="mt-6 flex gap-3">
              <Button asChild>
                <Link href="/app/catalogs/new">
                  <Plus className="h-4 w-4" /> {t('catalogsPage.emptyCreate')}
                </Link>
              </Button>
              {hasAIAccess && (
                <Button variant="outline" onClick={() => setIsAIModalOpen(true)}>
                  <Sparkles className="h-4 w-4" /> {t('catalogsPage.withAI')}
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {catalogList.map((catalog) => (
              <Link
                key={catalog.id}
                href={`/app/catalogs/${catalog.id}`}
                className="group rounded-2xl border border-warm-200 bg-white p-5 shadow-card transition-shadow hover:shadow-elevated"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100">
                    <Globe className="h-6 w-6 text-primary-500" />
                  </div>
                  <Badge variant={catalog.status === 'published' ? 'lime' : 'muted'}>
                    {catalog.status === 'published' ? t('appHeader.published') : t('appHeader.draft')}
                  </Badge>
                </div>
                <h3 className="font-bold text-night-800 group-hover:text-primary-500 transition-colors">
                  {catalog.name}
                </h3>
                <p className="mt-1 text-sm text-warm-400">/{catalog.slug}</p>
                {catalog.status === 'published' && (
                  <div className="mt-3 flex items-center gap-1 text-xs text-primary-500">
                    <ExternalLink className="h-3.5 w-3.5" />
                    {t('catalogsPage.viewStore')}
                  </div>
                )}
              </Link>
            ))}

            {/* Add new card */}
            {!atCatalogLimit && (
              <div className="grid grid-cols-1 gap-4">
                <Link
                  href="/app/catalogs/new"
                  className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-warm-200 p-5 text-warm-400 transition-colors hover:border-primary-300 hover:text-primary-500 min-h-[160px]"
                >
                  <Plus className="mb-2 h-8 w-8" />
                  <span className="text-sm font-medium">{t('appHeader.newCatalog')}</span>
                </Link>
                {hasAIAccess && (
                  <button
                    onClick={() => setIsAIModalOpen(true)}
                    className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary-200 p-5 text-primary-400 transition-colors hover:border-primary-400 hover:text-primary-500 hover:bg-primary-50 min-h-[160px]"
                  >
                    <Sparkles className="mb-2 h-8 w-8" />
                    <span className="text-sm font-medium">{t('catalogsPage.withAI')}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* AI Catalog Modal */}
      <AICatalogModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
      />
    </>
  )
}
