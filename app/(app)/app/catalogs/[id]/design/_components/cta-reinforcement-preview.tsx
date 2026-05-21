'use client'

interface CTAReinforcementPreviewProps {
  title: string
  subtitle: string
  buttonText: string
  buttonAction: 'url' | 'phone' | 'email' | 'scroll'
  buttonUrl: string
  buttonPhone: string
  buttonEmail: string
  scrollTarget: string
  buttonColor: string
  textColor: string
  bgColor: string
  fontSize: 'sm' | 'md' | 'lg'
  buttonSize: 'sm' | 'md' | 'lg'
  alignment: 'left' | 'center' | 'right'
  padding: 'sm' | 'md' | 'lg' | 'xl'
  showBorder: boolean
  borderColor: string
  borderWidth: 'none' | 'thin' | 'medium' | 'thick'
}

export default function CTAReinforcementPreview({
  title,
  subtitle,
  buttonText,
  buttonAction,
  buttonUrl,
  buttonPhone,
  buttonEmail,
  scrollTarget,
  buttonColor,
  textColor,
  bgColor,
  fontSize,
  buttonSize,
  alignment,
  padding,
  showBorder,
  borderColor,
  borderWidth,
}: CTAReinforcementPreviewProps) {
  const paddingMap = {
    sm: '20px',
    md: '40px',
    lg: '60px',
    xl: '80px',
  }

  const buttonSizeMap = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  }

  const fontSizeMap = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  }

  const getButtonHref = () => {
    if (buttonAction === 'url') return buttonUrl
    if (buttonAction === 'phone') return `tel:${buttonPhone}`
    if (buttonAction === 'email') return `mailto:${buttonEmail}`
    return '#'
  }

  const handleClick = (e: React.MouseEvent) => {
    if (buttonAction === 'scroll') {
      e.preventDefault()
      const element = document.getElementById(scrollTarget)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }

  const borderStyle = showBorder
    ? {
        borderWidth: borderWidth === 'thin' ? '1px' : borderWidth === 'medium' ? '2px' : '3px',
        borderColor: borderColor,
      }
    : { borderWidth: '0px' }

  return (
    <div
      style={{
        backgroundColor: bgColor,
        padding: paddingMap[padding],
      }}
      className="w-full"
    >
      <div className="max-w-6xl mx-auto">
        <div style={{ textAlign: alignment as any }}>
          {/* Título */}
          {title && (
            <h2 className="text-2xl font-bold mb-2" style={{ color: textColor }}>
              {title}
            </h2>
          )}

          {/* Subtítulo */}
          {subtitle && (
            <p className="text-base mb-6" style={{ color: textColor, opacity: 0.8 }}>
              {subtitle}
            </p>
          )}

          {/* Botón */}
          {buttonAction === 'scroll' ? (
            <button
              onClick={handleClick}
              style={{
                backgroundColor: buttonColor,
                color: 'white',
                ...borderStyle,
              }}
              className={`rounded-lg font-semibold transition hover:opacity-90 active:scale-95 ${buttonSizeMap[buttonSize]}`}
            >
              {buttonText}
            </button>
          ) : (
            <a
              href={getButtonHref()}
              target={buttonAction === 'url' ? '_blank' : undefined}
              rel={buttonAction === 'url' ? 'noopener noreferrer' : undefined}
              style={{
                backgroundColor: buttonColor,
                color: 'white',
                ...borderStyle,
                display: alignment === 'center' ? 'inline-block' : alignment === 'right' ? 'block' : 'block',
              }}
              className={`rounded-lg font-semibold transition hover:opacity-90 active:scale-95 ${buttonSizeMap[buttonSize]} ${
                alignment === 'left' ? 'w-fit' : alignment === 'right' ? 'text-right' : 'inline-block'
              }`}
            >
              {buttonText}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
