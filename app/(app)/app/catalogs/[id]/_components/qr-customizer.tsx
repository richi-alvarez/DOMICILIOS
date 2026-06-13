'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import QRCodeStyling, { FileExtension } from 'qr-code-styling'
import { Download, Upload } from 'lucide-react'

interface QRConfig {
  dotsType: 'rounded' | 'dots' | 'classy' | 'classy-rounded' | 'square' | 'extra-rounded'
  cornersSquareType: 'square' | 'dot' | 'extra-rounded'
  color: string
  bgColor: string
  downloadSize: 300 | 600 | 1200
  logoDataUrl: string | null
}

const COLORS = [
  { label: 'Cyan', hex: '#06b6d4' },
  { label: 'Negro', hex: '#000000' },
  { label: 'Púrpura', hex: '#7c3aed' },
  { label: 'Verde', hex: '#16a34a' },
  { label: 'Rojo', hex: '#dc2626' },
  { label: 'Naranja', hex: '#d97706' },
]

const DOTS_TYPES = [
  { label: 'rounded', id: 'rounded' },
  { label: 'dots', id: 'dots' },
  { label: 'classy', id: 'classy' },
  { label: 'classy-rounded', id: 'classy-rounded' },
  { label: 'square', id: 'square' },
  { label: 'extra-rounded', id: 'extra-rounded' },
]

const CORNERS_TYPES = [
  { label: 'square', id: 'square' },
  { label: 'dot', id: 'dot' },
  { label: 'extra-rounded', id: 'extra-rounded' },
]

interface QRCustomizerProps {
  publicUrl: string
  catalogSlug: string
  catalogId: string
}

export function QRCustomizer({ publicUrl, catalogSlug, catalogId }: QRCustomizerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [config, setConfig] = useState<QRConfig>({
    dotsType: 'rounded',
    cornersSquareType: 'extra-rounded',
    color: '#000000',
    bgColor: '#ffffff',
    downloadSize: 256,
    logoDataUrl: null,
  })

  const qrRef = useRef<HTMLDivElement>(null)
  const qrCodeRef = useRef<QRCodeStyling | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!qrRef.current) return

    const bgColor = config.bgColor === 'transparent' ? 'rgba(0,0,0,0)' : config.bgColor

    if (!qrCodeRef.current) {
      qrCodeRef.current = new QRCodeStyling({
        width: 256,
        height: 256,
        type: 'canvas',
        data: publicUrl,
        dotsOptions: {
          type: config.dotsType as any,
          color: config.color,
        },
        cornersSquareOptions: {
          type: config.cornersSquareType as any,
        },
        backgroundOptions: {
          color: bgColor,
        },
        ...(config.logoDataUrl && {
          image: config.logoDataUrl,
          imageOptions: {
            width: 50,
            height: 50,
            margin: 5,
          },
        }),
      })

      qrRef.current.innerHTML = ''
      qrCodeRef.current.append(qrRef.current)
    } else {
      qrCodeRef.current.update({
        data: publicUrl,
        dotsOptions: {
          type: config.dotsType as any,
          color: config.color,
        },
        cornersSquareOptions: {
          type: config.cornersSquareType as any,
        },
        backgroundOptions: {
          color: bgColor,
        },
        ...(config.logoDataUrl && {
          image: config.logoDataUrl,
          imageOptions: {
            width: 50,
            height: 50,
            margin: 5,
          },
        }),
      })
    }
  }, [config, publicUrl])

  const handleLogoUpload = (file: File | null) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      setConfig((prev) => ({
        ...prev,
        logoDataUrl: e.target?.result as string,
      }))
    }
    reader.readAsDataURL(file)
  }

  const handleDownload = (format: 'png' | 'svg') => {
    qrCodeRef.current?.download({
      name: `qr-${catalogSlug}`,
      extension: format as FileExtension,
    } as any)
  }

  const handlePrint = () => {
    if (!qrRef.current) return

    const canvas = qrRef.current.querySelector('canvas') as HTMLCanvasElement
    if (!canvas) return

    const imageData = canvas.toDataURL('image/png')

    const printWindow = window.open('', 'QR_PRINT', 'width=600,height=700')
    if (!printWindow) {
      alert('Por favor, permite ventanas emergentes para imprimir')
      return
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Imprimir QR - ${catalogSlug}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
            background: #f5f5f5;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          .print-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
            padding: 40px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .qr-image {
            background: white;
            padding: 20px;
            border: 1px solid #e5e5e5;
            border-radius: 4px;
          }
          .qr-image img {
            display: block;
            width: 300px;
            height: 300px;
            image-rendering: pixelated;
          }
          .info {
            text-align: center;
            color: #666;
          }
          .info p {
            margin: 5px 0;
          }
          .info .title {
            font-weight: 600;
            color: #333;
            font-size: 16px;
            margin-bottom: 8px;
          }
          .info .url {
            font-size: 13px;
            word-break: break-all;
            color: #0066cc;
          }
          @media print {
            body {
              background: white;
              padding: 0;
            }
            .print-container {
              box-shadow: none;
              border-radius: 0;
              padding: 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-container">
          <div class="qr-image">
            <img src="${imageData}" alt="QR Code" />
          </div>
          <div class="info">
            <p class="title">Código QR</p>
            <p class="url">${publicUrl}</p>
          </div>
        </div>
      </body>
      </html>
    `

    printWindow.document.open()
    printWindow.document.write(htmlContent)
    printWindow.document.close()

    setTimeout(() => {
      printWindow.print()
    }, 500)
  }

  return (
    <div className="w-full">
      {/* QR Display + Quick Actions */}
      <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-8 border border-gray-200">
        <div className="flex flex-col gap-6">
          {/* QR Code Preview - Centered */}
          <div className="flex flex-col items-center gap-4">
            <div
              ref={qrRef}
              className="rounded-lg overflow-hidden border-2 border-gray-200 shadow-sm"
            />
            {/* Action Buttons - Grid 2x2 on mobile, responsive on tablet+ */}
            <div className="w-full grid grid-cols-2 gap-2 sm:flex sm:gap-2 sm:flex-wrap text-sm">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="px-3 py-2 border rounded-lg hover:bg-gray-50 transition font-medium text-primary-600"
              >
                <span className="hidden sm:inline">{isOpen ? 'Ocultar' : 'Personalizar'}</span>
                <span className="sm:hidden">{isOpen ? 'Ocultar' : 'Personaliz.'}</span> {isOpen ? '▲' : '▼'}
              </button>
              <button
                onClick={() => handleDownload('png')}
                className="px-3 py-2 border rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-1 sm:gap-2"
              >
                <Download className="w-4 h-4" />
                <span>PNG</span>
              </button>
              <button
                onClick={() => handleDownload('svg')}
                className="px-3 py-2 border rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-1 sm:gap-2"
              >
                <Download className="w-4 h-4" />
                <span>SVG</span>
              </button>
              <button
                onClick={handlePrint}
                className="px-3 py-2 border rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-1 sm:gap-2"
              >
                <span className="hidden sm:inline">Imprimir QR</span>
                <span className="sm:hidden">Imprimir</span>
              </button>
            </div>
          </div>

          {/* URL + Action Buttons */}
          <div className="flex flex-col gap-4 sm:gap-6">
            <div>
              <label className="text-xs sm:text-sm text-gray-600 block mb-2 font-medium">URL:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={publicUrl}
                  readOnly
                  className="flex-1 px-3 sm:px-4 py-2 border rounded-lg bg-gray-50 text-xs sm:text-sm"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(publicUrl)}
                  className="px-3 py-2 border rounded-lg hover:bg-gray-50 transition flex items-center justify-center"
                  title="Copiar"
                >
                  📋
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition text-sm"
              >
                Visitar
              </a>
              <Link
                href={`/app/catalogs/${catalogId}/design`}
                className="flex-1 border border-gray-300 hover:bg-gray-50 font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition text-sm"
              >
                Editar Diseño
              </Link>
            </div>
          </div>
        </div>

        {/* Customization Panel */}
        {isOpen && (
          <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* ESTILO DE PUNTOS */}
              <div>
                <h3 className="font-bold text-xs sm:text-sm mb-2 sm:mb-3 text-gray-700 uppercase tracking-wider">Estilo de Puntos</h3>
                <div className="flex flex-wrap gap-1 sm:gap-2">
                  {DOTS_TYPES.map((type) => (
                    <button
                      key={type.id}
                      onClick={() =>
                        setConfig((prev) => ({
                          ...prev,
                          dotsType: type.id as any,
                        }))
                      }
                      className={`px-2 sm:px-3 py-1 border rounded text-xs font-medium transition whitespace-nowrap ${
                        config.dotsType === type.id
                          ? 'bg-primary-500 text-white border-primary-500'
                          : 'border-gray-300 hover:border-primary-500'
                      }`}
                    >
                      <span className="hidden sm:inline">{type.label}</span>
                      <span className="sm:hidden text-xs">{type.label.slice(0, 3)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* ESTILO DE ESQUINAS */}
              <div>
                <h3 className="font-bold text-xs sm:text-sm mb-2 sm:mb-3 text-gray-700 uppercase tracking-wider">Estilo de Esquinas</h3>
                <div className="flex flex-wrap gap-1 sm:gap-2">
                  {CORNERS_TYPES.map((type) => (
                    <button
                      key={type.id}
                      onClick={() =>
                        setConfig((prev) => ({
                          ...prev,
                          cornersSquareType: type.id as any,
                        }))
                      }
                      className={`px-3 py-1 border rounded text-xs font-medium transition ${
                        config.cornersSquareType === type.id
                          ? 'bg-primary-500 text-white border-primary-500'
                          : 'border-gray-300 hover:border-primary-500'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* COLOR */}
              <div>
                <h3 className="font-bold text-xs sm:text-sm mb-2 sm:mb-3 text-gray-700 uppercase tracking-wider">Color</h3>
                <div className="flex flex-wrap gap-3">
                  {COLORS.map((color) => (
                    <button
                      key={color.hex}
                      onClick={() => setConfig((prev) => ({ ...prev, color: color.hex }))}
                      className={`w-8 h-8 rounded-full border-2 transition ${
                        config.color === color.hex
                          ? 'border-gray-800 ring-2 ring-offset-2 ring-gray-400'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>

              {/* FONDO */}
              <div>
                <h3 className="font-bold text-xs sm:text-sm mb-2 sm:mb-3 text-gray-700 uppercase tracking-wider">Fondo</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfig((prev) => ({ ...prev, bgColor: '#ffffff' }))}
                    className={`px-4 py-2 border rounded font-medium text-xs transition ${
                      config.bgColor === '#ffffff'
                        ? 'bg-gray-100 border-gray-800'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    Blanco
                  </button>
                  <button
                    onClick={() => setConfig((prev) => ({ ...prev, bgColor: 'transparent' }))}
                    className={`px-4 py-2 border rounded font-medium text-xs transition ${
                      config.bgColor === 'transparent'
                        ? 'bg-gray-100 border-gray-800'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    Transparente
                  </button>
                </div>
              </div>

              {/* TAMAÑO DE DESCARGA */}
              <div>
                <h3 className="font-bold text-xs sm:text-sm mb-2 sm:mb-3 text-gray-700 uppercase tracking-wider">Tamaño Descarga</h3>
                <div className="flex gap-2">
                  {[
                    { label: 'S', size: 300 },
                    { label: 'M', size: 600 },
                    { label: 'L', size: 1200 },
                  ].map((option) => (
                    <button
                      key={option.size}
                      onClick={() => setConfig((prev) => ({ ...prev, downloadSize: option.size as any }))}
                      className={`px-4 py-2 border rounded font-medium text-xs transition ${
                        config.downloadSize === option.size
                          ? 'bg-primary-500 text-white border-primary-500'
                          : 'border-gray-300 hover:border-primary-500'
                      }`}
                    >
                      {option.label} {option.size}px
                    </button>
                  ))}
                </div>
              </div>

              {/* LOGO */}
              <div>
                <h3 className="font-bold text-xs sm:text-sm mb-2 sm:mb-3 text-gray-700 uppercase tracking-wider">Logo</h3>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleLogoUpload(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    <Upload className="w-4 h-4" />
                    {config.logoDataUrl ? 'Cambiar logo' : 'Subir logo'}
                  </button>
                  {config.logoDataUrl && (
                    <button
                      onClick={() => setConfig((prev) => ({ ...prev, logoDataUrl: null }))}
                      className="mt-2 w-full px-3 py-1 text-xs border border-red-300 text-red-600 rounded hover:bg-red-50 transition"
                    >
                      Remover logo
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
