'use client'

import { Mail, Phone, MapPin, ExternalLink, Globe } from 'lucide-react'

interface SocialLink {
  id: string
  name: string
  url: string
}

interface FooterPreviewProps {
  companyName: string
  companyDescription: string
  address: string
  phone: string
  email: string
  website: string
  socialLinks: SocialLink[]
  copyrightText: string
  bgColor: string
  textColor: string
  accentColor: string
  layout: 'minimal' | 'standard' | 'full'
  showSocialLinks: boolean
  showDescription: boolean
  showAddress: boolean
  showPhone: boolean
  showEmail: boolean
  showWebsite: boolean
  showCopyright: boolean
  showCompanyInfo: boolean
  showContactInfo: boolean
  alignment: 'left' | 'center'
}

export default function FooterPreview({
  companyName,
  companyDescription,
  address,
  phone,
  email,
  website,
  socialLinks,
  copyrightText,
  bgColor,
  textColor,
  accentColor,
  layout,
  showSocialLinks,
  showDescription,
  showAddress,
  showPhone,
  showEmail,
  showWebsite,
  showCopyright,
  showCompanyInfo,
  showContactInfo,
  alignment,
}: FooterPreviewProps) {
  return (
    <footer
      style={{
        backgroundColor: bgColor,
        color: textColor,
      }}
      className="w-full"
    >
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Contenido principal */}
        {(showCompanyInfo !== false || showContactInfo !== false || showSocialLinks !== false) && (
          <div className={`grid gap-8 mb-8 ${layout === 'minimal' ? 'grid-cols-1' : layout === 'standard' ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {/* Información de Empresa */}
            {showCompanyInfo !== false && layout !== 'minimal' && (
              <div style={{ textAlign: alignment as any }}>
                <h3 className="font-semibold text-lg mb-3">{companyName}</h3>
                {showDescription && companyDescription && (
                  <p className="text-sm mb-4 opacity-90">{companyDescription}</p>
                )}
              </div>
            )}

            {/* Datos de Contacto */}
            {showContactInfo !== false && (
              <div style={{ textAlign: alignment as any }}>
                <h3 className="font-semibold text-lg mb-3">{layout === 'minimal' && showCompanyInfo ? companyName : 'Contacto'}</h3>

                <div className="space-y-3 text-sm">
                  {showAddress && address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: accentColor }} />
                      <p>{address}</p>
                    </div>
                  )}

                  {showPhone && phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 flex-shrink-0" style={{ color: accentColor }} />
                      <a href={`tel:${phone}`} style={{ color: accentColor }} className="hover:underline">
                        {phone}
                      </a>
                    </div>
                  )}

                  {showEmail && email && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 flex-shrink-0" style={{ color: accentColor }} />
                      <a href={`mailto:${email}`} style={{ color: accentColor }} className="hover:underline">
                        {email}
                      </a>
                    </div>
                  )}

                  {showWebsite && website && (
                    <div className="flex items-center gap-3">
                      <Globe className="w-4 h-4 flex-shrink-0" style={{ color: accentColor }} />
                      <a href={website} target="_blank" rel="noopener noreferrer" style={{ color: accentColor }} className="hover:underline">
                        {website}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Redes Sociales */}
            {showContactInfo !== false && showSocialLinks !== false && (
              <div style={{ textAlign: alignment as any }}>
                <h3 className="font-semibold text-lg mb-3">Síguenos</h3>

                {socialLinks.length > 0 ? (
                  <div className="space-y-2">
                    {socialLinks.map((link) => (
                      <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: accentColor }}
                        className="text-sm hover:underline block font-medium"
                      >
                        {link.name} →
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm opacity-75">Sin redes configuradas</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Separador */}
        {(showCopyright !== false || showCompanyInfo !== false || showContactInfo !== false) && (
          <div
            className="my-6"
            style={{
              borderTopColor: `${textColor}30`,
              borderTopWidth: '1px',
            }}
          />
        )}

        {/* Copyright */}
        {showCopyright !== false && (
          <div style={{ textAlign: alignment as any }} className="text-xs opacity-75">
            <p>{copyrightText}</p>
          </div>
        )}
      </div>
    </footer>
  )
}
