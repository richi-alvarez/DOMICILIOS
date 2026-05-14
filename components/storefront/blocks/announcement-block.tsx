import type { AnnouncementConfig } from '@/lib/design/blocks'

export function AnnouncementBlock({ config }: { config: AnnouncementConfig }) {
  const inner = (
    <div
      className="px-4 py-2 text-center text-sm font-medium"
      style={{ background: config.bgColor, color: config.textColor }}
    >
      {config.text}
    </div>
  )
  if (config.link) {
    return (
      <a href={config.link} className="block hover:opacity-90 transition-opacity">
        {inner}
      </a>
    )
  }
  return inner
}
