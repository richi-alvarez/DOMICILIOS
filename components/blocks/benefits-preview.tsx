'use client'

interface BenefitItem {
  id: string
  icon: string
  title: string
  description: string
}

interface BenefitsPreviewProps {
  title: string
  subtitle: string
  items: BenefitItem[]
  columns: 1 | 2 | 3 | 4
  bgColor: string
  textColor: string
  iconColor: string
  iconSize: 'sm' | 'md' | 'lg'
  padding: 'sm' | 'md' | 'lg' | 'xl'
}

export default function BenefitsPreview({
  title,
  subtitle,
  items,
  columns,
  bgColor,
  textColor,
  iconColor,
  iconSize,
  padding,
}: BenefitsPreviewProps) {
  const iconSizeMap = {
    sm: '40px',
    md: '56px',
    lg: '80px',
  }

  const paddingMap = {
    sm: 'px-4 py-8',
    md: 'px-6 py-12',
    lg: 'px-8 py-16',
    xl: 'px-10 py-20',
  }

  const columnMap = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  }

  return (
    <div
      style={{
        backgroundColor: bgColor,
        color: textColor,
      }}
      className={`w-full ${paddingMap[padding]}`}
    >
      <div className="max-w-6xl mx-auto">
        {/* Encabezado */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">{title}</h2>
          {subtitle && <p className="text-lg opacity-80">{subtitle}</p>}
        </div>

        {/* Grid de beneficios */}
        {items.length > 0 ? (
          <div className={`grid ${columnMap[columns]} gap-6 md:gap-8`}>
            {items.map((item) => (
              <div
                key={item.id}
                className="text-center p-6 rounded-lg hover:bg-black/5 transition"
              >
                {/* Icono */}
                <div
                  className="mb-4 flex justify-center"
                  style={{ fontSize: iconSizeMap[iconSize] }}
                >
                  {item.icon}
                </div>

                {/* Contenido */}
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm opacity-80 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No hay beneficios configurados</p>
          </div>
        )}
      </div>
    </div>
  )
}
