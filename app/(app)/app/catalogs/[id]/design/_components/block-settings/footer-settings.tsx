'use client'

import { Plus, Trash2, Mail, Phone, MapPin, Globe, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

interface SocialLink {
  id: string
  name: string
  url: string
}

interface FooterBlock {
  id: string
  visible: boolean
  type: 'footer'
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

interface FooterSettingsProps {
  block: FooterBlock
  onChange: (partial: Partial<FooterBlock>) => void
}

export default function FooterSettings({ block, onChange }: FooterSettingsProps) {
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null)

  const addSocialLink = () => {
    const newLink: SocialLink = {
      id: `social-${Date.now()}`,
      name: 'Nueva Red Social',
      url: '',
    }
    onChange({ socialLinks: [...block.socialLinks, newLink] })
  }

  const updateSocialLink = (linkId: string, updates: Partial<SocialLink>) => {
    onChange({
      socialLinks: block.socialLinks.map((link) =>
        link.id === linkId ? { ...link, ...updates } : link
      ),
    })
  }

  const deleteSocialLink = (linkId: string) => {
    onChange({
      socialLinks: block.socialLinks.filter((link) => link.id !== linkId),
    })
  }

  const toggleField = (field: string) => {
    const currentValue = block[field as keyof FooterBlock]
    const newValue = typeof currentValue === 'boolean' ? !currentValue : true
    onChange({ [field]: newValue } as any)
  }

  return (
    <div className="space-y-6">
      {/* Secciones Principales */}
      <div className="border-b border-gray-200 pb-4">
        <h3 className="font-semibold text-sm mb-4">Secciones del Footer</h3>

        <div className="space-y-3">
          {/* Información de Empresa */}
          <button
            onClick={() => toggleField('showCompanyInfo')}
            className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition"
          >
            <span className="text-sm font-medium text-gray-700">Información de Empresa</span>
            {block.showCompanyInfo ? (
              <Eye className="w-5 h-5 text-blue-600" />
            ) : (
              <EyeOff className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {/* Contacto */}
          <button
            onClick={() => toggleField('showContactInfo')}
            className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition"
          >
            <span className="text-sm font-medium text-gray-700">Información de Contacto</span>
            {block.showContactInfo ? (
              <Eye className="w-5 h-5 text-blue-600" />
            ) : (
              <EyeOff className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {/* Copyright */}
          <button
            onClick={() => toggleField('showCopyright')}
            className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition"
          >
            <span className="text-sm font-medium text-gray-700">Copyright</span>
            {block.showCopyright ? (
              <Eye className="w-5 h-5 text-blue-600" />
            ) : (
              <EyeOff className="w-5 h-5 text-gray-400" />
            )}
          </button>
        </div>
      </div>

      {/* Información de Empresa */}
      {block.showCompanyInfo && (
        <div className="border-b border-gray-200 pb-4">
          <h3 className="font-semibold text-sm mb-4">Información de Empresa</h3>

          <div className="space-y-4">
            {/* Nombre de empresa */}
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-2">Nombre de la Empresa</label>
              <input
                type="text"
                value={block.companyName}
                onChange={(e) => onChange({ companyName: e.target.value })}
                placeholder="Mi Empresa S.A.S"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Descripción */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-gray-700">Descripción Breve</label>
                <button
                  onClick={() => toggleField('showDescription')}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  {block.showDescription ? (
                    <Eye className="w-4 h-4 text-blue-600" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
              <textarea
                value={block.companyDescription}
                onChange={(e) => onChange({ companyDescription: e.target.value })}
                placeholder="Descripción corta de tu empresa"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={2}
              />
            </div>
          </div>
        </div>
      )}

      {/* Información de Contacto */}
      {block.showContactInfo && (
        <div className="border-b border-gray-200 pb-4">
          <h3 className="font-semibold text-sm mb-4">Información de Contacto</h3>

          <div className="space-y-4">
            {/* Dirección */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-gray-700 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Dirección
                </label>
                <button
                  onClick={() => toggleField('showAddress')}
                  className="p-1 hover:bg-gray-100 rounded"
                  title={block.showAddress ? 'Ocultar' : 'Mostrar'}
                >
                  {block.showAddress ? (
                    <Eye className="w-4 h-4 text-blue-600" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
              <input
                type="text"
                value={block.address}
                onChange={(e) => onChange({ address: e.target.value })}
                placeholder="Calle 123 #45, Bogotá, Colombia"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Teléfono */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-gray-700 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Teléfono
                </label>
                <button
                  onClick={() => toggleField('showPhone')}
                  className="p-1 hover:bg-gray-100 rounded"
                  title={block.showPhone ? 'Ocultar' : 'Mostrar'}
                >
                  {block.showPhone ? (
                    <Eye className="w-4 h-4 text-blue-600" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
              <input
                type="tel"
                value={block.phone}
                onChange={(e) => onChange({ phone: e.target.value })}
                placeholder="+57 1 123 4567"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Email */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-gray-700 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Correo Electrónico
                </label>
                <button
                  onClick={() => toggleField('showEmail')}
                  className="p-1 hover:bg-gray-100 rounded"
                  title={block.showEmail ? 'Ocultar' : 'Mostrar'}
                >
                  {block.showEmail ? (
                    <Eye className="w-4 h-4 text-blue-600" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
              <input
                type="email"
                value={block.email}
                onChange={(e) => onChange({ email: e.target.value })}
                placeholder="contacto@empresa.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Sitio web */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-gray-700 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Sitio Web
                </label>
                <button
                  onClick={() => toggleField('showWebsite')}
                  className="p-1 hover:bg-gray-100 rounded"
                  title={block.showWebsite ? 'Ocultar' : 'Mostrar'}
                >
                  {block.showWebsite ? (
                    <Eye className="w-4 h-4 text-blue-600" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
              <input
                type="url"
                value={block.website}
                onChange={(e) => onChange({ website: e.target.value })}
                placeholder="https://www.empresa.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Redes Sociales */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-semibold text-gray-700">Redes Sociales</h4>
                <button
                  onClick={() => toggleField('showSocialLinks')}
                  className="p-1 hover:bg-gray-100 rounded"
                  title={block.showSocialLinks ? 'Ocultar' : 'Mostrar'}
                >
                  {block.showSocialLinks ? (
                    <Eye className="w-4 h-4 text-blue-600" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>

              {block.showSocialLinks && (
                <>
                  <div className="space-y-2 mb-4">
                    {block.socialLinks.map((link) => (
                      <div key={link.id} className="border border-gray-200 rounded-lg overflow-hidden">
                        <div
                          className="bg-gray-50 p-3 flex items-center justify-between cursor-pointer hover:bg-gray-100"
                          onClick={() => setEditingLinkId(editingLinkId === link.id ? null : link.id)}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{link.name}</p>
                            <p className="text-xs text-gray-500 truncate">{link.url}</p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteSocialLink(link.id)
                            }}
                            className="p-2 hover:bg-red-100 rounded text-red-600 flex-shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {editingLinkId === link.id && (
                          <div className="p-4 bg-white border-t border-gray-200 space-y-3">
                            <div>
                              <label className="text-xs font-medium text-gray-700 block mb-2">Nombre</label>
                              <input
                                type="text"
                                value={link.name}
                                onChange={(e) => updateSocialLink(link.id, { name: e.target.value })}
                                placeholder="Facebook"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>

                            <div>
                              <label className="text-xs font-medium text-gray-700 block mb-2">URL</label>
                              <input
                                type="url"
                                value={link.url}
                                onChange={(e) => updateSocialLink(link.id, { url: e.target.value })}
                                placeholder="https://facebook.com/tuempresa"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={addSocialLink}
                    className="flex items-center gap-2 px-3 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg w-full justify-center"
                  >
                    <Plus className="w-3 h-3" />
                    Agregar Red Social
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Copyright */}
      {block.showCopyright && (
        <div className="border-b border-gray-200 pb-4">
          <h3 className="font-semibold text-sm mb-4">Copyright</h3>

          <div>
            <label className="text-xs font-medium text-gray-700 block mb-2">Texto de Derechos Reservados</label>
            <input
              type="text"
              value={block.copyrightText}
              onChange={(e) => onChange({ copyrightText: e.target.value })}
              placeholder="© 2026 Mi Empresa. Todos los derechos reservados."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {/* Diseño */}
      <div className="border-b border-gray-200 pb-4">
        <h3 className="font-semibold text-sm mb-4">Diseño</h3>

        <div className="space-y-4">
          {/* Layout */}
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-2">Layout</label>
            <select
              value={block.layout}
              onChange={(e) => onChange({ layout: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="minimal">Minimalista (solo contact)</option>
              <option value="standard">Estándar (contact + empresa)</option>
              <option value="full">Completo (contact + empresa + redes)</option>
            </select>
          </div>

          {/* Alineación */}
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-2">Alineación</label>
            <div className="flex gap-2">
              {(['left', 'center'] as const).map((align) => (
                <button
                  key={align}
                  onClick={() => onChange({ alignment: align })}
                  className={`flex-1 py-2 px-3 rounded text-sm font-medium border transition ${
                    block.alignment === align
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                  }`}
                >
                  {align === 'left' ? 'Izquierda' : 'Centro'}
                </button>
              ))}
            </div>
          </div>

          {/* Color de fondo */}
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-2">Fondo</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={block.bgColor}
                onChange={(e) => onChange({ bgColor: e.target.value })}
                className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={block.bgColor}
                onChange={(e) => onChange({ bgColor: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Color de texto */}
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-2">Texto</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={block.textColor}
                onChange={(e) => onChange({ textColor: e.target.value })}
                className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={block.textColor}
                onChange={(e) => onChange({ textColor: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Color de acento */}
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-2">Color de Acento (Links, Iconos)</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={block.accentColor}
                onChange={(e) => onChange({ accentColor: e.target.value })}
                className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={block.accentColor}
                onChange={(e) => onChange({ accentColor: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
