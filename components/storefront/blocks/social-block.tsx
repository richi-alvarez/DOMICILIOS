import type { SocialConfig } from '@/lib/design/blocks'

const NETWORK_META: Record<string, { label: string; emoji: string; prefix: string }> = {
  instagram: { label: 'Instagram', emoji: '📸', prefix: '' },
  facebook: { label: 'Facebook', emoji: '👥', prefix: '' },
  tiktok: { label: 'TikTok', emoji: '🎵', prefix: '' },
  twitter: { label: 'Twitter', emoji: '🐦', prefix: '' },
  youtube: { label: 'YouTube', emoji: '▶️', prefix: '' },
  whatsapp: { label: 'WhatsApp', emoji: '💬', prefix: 'https://wa.me/' },
}

export function SocialBlock({ config }: { config: SocialConfig }) {
  const items = config.items.filter((i) => i.url)
  if (items.length === 0) return null

  return (
    <div className="px-4 py-6 text-center">
      <div className="flex items-center justify-center gap-3 flex-wrap">
        {items.map((item, i) => {
          const meta = NETWORK_META[item.network] ?? { label: item.network, emoji: '🌐', prefix: '' }
          const href = meta.prefix && !item.url.startsWith('http') ? `${meta.prefix}${item.url}` : item.url
          return (
            <a
              key={i}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-full border border-warm-200 bg-white px-4 py-2 text-sm font-medium text-night-700 shadow-sm transition-shadow hover:shadow-md"
            >
              <span className="text-base">{meta.emoji}</span>
              {meta.label}
            </a>
          )
        })}
      </div>
    </div>
  )
}
