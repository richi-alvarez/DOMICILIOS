import type { BannerConfig } from '@/lib/design/blocks'

export function BannerBlock({ config }: { config: BannerConfig }) {
  return (
    <div className="relative overflow-hidden bg-night-800">
      {config.imageUrl && (
        <img
          src={config.imageUrl}
          alt={config.title}
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        />
      )}
      <div className="relative px-6 py-10 text-center text-white">
        {config.title && <h2 className="font-display text-2xl font-extrabold">{config.title}</h2>}
        {config.subtitle && <p className="mt-1.5 text-sm opacity-80">{config.subtitle}</p>}
        {config.ctaText && (
          <a
            href={config.ctaLink || '#'}
            className="mt-4 inline-block rounded-full bg-primary-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-600"
          >
            {config.ctaText}
          </a>
        )}
      </div>
    </div>
  )
}
