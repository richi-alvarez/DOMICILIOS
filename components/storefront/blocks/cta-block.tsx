import type { CtaConfig } from '@/lib/design/blocks'

export function CtaBlock({ config }: { config: CtaConfig }) {
  return (
    <div className="px-6 py-10 text-center" style={{ background: config.bgColor }}>
      <h2 className="font-display text-2xl font-extrabold text-night-800">{config.title}</h2>
      {config.subtitle && <p className="mt-2 text-sm text-night-600">{config.subtitle}</p>}
      {config.btnText && (
        <a
          href={config.btnLink || '#'}
          className="mt-5 inline-block rounded-full bg-night-800 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-night-700"
        >
          {config.btnText}
        </a>
      )}
    </div>
  )
}
