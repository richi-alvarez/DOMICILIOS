'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { AlertCircle, CheckCircle2, Copy, ExternalLink, Loader2 } from 'lucide-react'
import { updateCatalogDomain, getDNSRecord, getCatalogDomain } from '@/lib/actions/domain'
import { toast } from 'sonner'

interface DomainEditorProps {
  catalogId: string
  catalogName: string
}

export function DomainEditor({ catalogId, catalogName }: DomainEditorProps) {
  const [domain, setDomain] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dnsRecord, setDnsRecord] = useState<{ type: string; name: string; value: string } | null>(null)
  const [showDns, setShowDns] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadDomain()
  }, [catalogId])

  async function loadDomain() {
    try {
      const result = await getCatalogDomain(catalogId)
      if ('error' in result) {
        toast.error(result.error)
        setLoading(false)
        return
      }
      setDomain(result.domain || '')
      if (result.dnsRecord) {
        setDnsRecord(result.dnsRecord)
      }
      setLoading(false)
    } catch (err) {
      toast.error('Error al cargar dominio')
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!domain.trim()) {
      await updateCatalogDomain(catalogId, null)
      toast.success('Dominio personalizado removido')
      return
    }

    setSaving(true)
    try {
      const result = await updateCatalogDomain(catalogId, domain)
      if ('error' in result) {
        toast.error(result.error)
      } else {
        toast.success('Dominio guardado. Configura los registros DNS.')
        const dnsData = await getDNSRecord(domain)
        if (!('error' in dnsData)) {
          setDnsRecord(dnsData as any)
          setShowDns(true)
        }
      }
    } catch (err) {
      toast.error('Error al guardar dominio')
    } finally {
      setSaving(false)
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-warm-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Dominio personalizado */}
      <Card className="p-6">
        <h3 className="mb-4 font-semibold text-night-800">Dominio personalizado</h3>
        <p className="mb-4 text-sm text-warm-500">
          Apunta tu dominio propio a este catálogo. Por ejemplo: <code className="rounded bg-warm-50 px-2 py-1 font-mono text-xs">mitienda.com</code>
        </p>

        <div className="space-y-3">
          <Label htmlFor="domain" className="text-sm font-medium text-night-700">
            Dominio (sin https://)
          </Label>
          <Input
            id="domain"
            placeholder="ej: mitienda.com"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            disabled={saving}
            className="font-mono"
          />
          <p className="text-xs text-warm-400">
            Dominio actual: <span className="font-semibold">{catalogName}.domicilios.app</span>
          </p>
        </div>

        <div className="mt-4 flex gap-2">
          <Button
            onClick={handleSave}
            disabled={saving}
            variant="default"
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Guardar dominio
          </Button>
          {domain && (
            <Button
              onClick={() => {
                setDomain('')
              }}
              variant="outline"
              disabled={saving}
            >
              Limpiar
            </Button>
          )}
        </div>
      </Card>

      {/* Instrucciones DNS */}
      {domain && dnsRecord && (
        <Card className="border-lime-200 bg-lime-50 p-6">
          <div className="mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-lime-600" />
            <h3 className="font-semibold text-lime-900">Configurar DNS</h3>
          </div>

          <p className="mb-4 text-sm text-lime-800">
            Agrega este registro CNAME a tu proveedor de DNS para completar la verificación:
          </p>

          <div className="space-y-3 rounded bg-white p-4">
            <div>
              <p className="text-xs font-semibold text-warm-600">Nombre (Name)</p>
              <div className="mt-1 flex items-center gap-2">
                <code className="flex-1 rounded bg-warm-50 px-3 py-2 font-mono text-sm text-night-800">
                  {dnsRecord.name}
                </code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(dnsRecord.name)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-warm-600">Valor (Value/Target)</p>
              <div className="mt-1 flex items-center gap-2">
                <code className="flex-1 rounded bg-warm-50 px-3 py-2 font-mono text-sm text-night-800">
                  {dnsRecord.value}
                </code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(dnsRecord.value)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-warm-600">Tipo</p>
              <p className="mt-1 rounded bg-warm-50 px-3 py-2 font-mono text-sm text-night-800">
                {dnsRecord.type}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded bg-warm-50 p-3 text-xs text-warm-700">
            <p className="font-semibold mb-1">⏱️ Tiempo de propagación</p>
            <p>Los cambios DNS pueden tardar de 15 minutos a 48 horas en propagarse. Verifica el estado con:</p>
            <Button asChild variant="link" size="sm" className="mt-2">
              <a
                href={`https://mxtoolbox.com/cname.aspx?query=${domain}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Verificar DNS <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </Button>
          </div>
        </Card>
      )}

      {/* Subdominio automático */}
      <Card className="p-6">
        <h3 className="mb-2 font-semibold text-night-800">Subdominio automático</h3>
        <p className="text-sm text-warm-500 mb-4">
          Disponible sin configuración adicional:
        </p>
        <div className="rounded bg-warm-50 px-4 py-3 font-mono text-sm text-night-700">
          https://<span className="font-bold">{catalogName}</span>.domicilios.app
        </div>
      </Card>
    </div>
  )
}
