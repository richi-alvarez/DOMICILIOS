import type { HeroConfig } from '@/lib/design/blocks'

export function HeroBlock({ config }: { config: HeroConfig }) {
  return (
    <div
      className="px-4 py-10"
      style={{ background: config.bgColor, color: config.textColor }}
    >
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-3xl font-extrabold leading-tight">{config.title}</h1>
        {config.subtitle && (
          <p className="mt-2 text-base opacity-80">{config.subtitle}</p>
        )}
        {config.ctaText && (
          <a
            href={config.ctaLink || '#productos'}
            className="mt-5 inline-block rounded-full bg-white/20 border border-white/30 px-6 py-2.5 text-sm font-semibold backdrop-blur transition-colors hover:bg-white/30"
            style={{ color: config.textColor }}
          >
            {config.ctaText}
          </a>
        )}
      </div>
    </div>
  )
}
