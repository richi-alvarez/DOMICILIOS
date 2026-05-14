'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { AlertCircle, Check, CheckCircle2, Copy, Loader2, Trash2, ExternalLink } from 'lucide-react'
import { createWebhook, deleteWebhook, toggleWebhook, getWebhooks } from '@/lib/actions/webhooks'
import { toast } from 'sonner'

const AVAILABLE_EVENTS = [
  { id: 'order.created', label: 'Pedido creado', description: 'Se dispara cuando se crea un pedido' },
  { id: 'order.updated', label: 'Pedido actualizado', description: 'Se dispara cuando cambia el estado' },
  { id: 'order.delivered', label: 'Pedido entregado', description: 'Se dispara cuando se entrega' },
]

interface WebhookManagerProps {
  catalogId: string
}

export function WebhookManager({ catalogId }: WebhookManagerProps) {
  const [webhooks, setWebhooks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [url, setUrl] = useState('')
  const [selectedEvents, setSelectedEvents] = useState<string[]>(['order.created'])
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    loadWebhooks()
  }, [catalogId])

  async function loadWebhooks() {
    try {
      const result = await getWebhooks(catalogId)
      if ('error' in result) {
        toast.error(result.error)
      } else {
        setWebhooks(result.webhooks || [])
      }
      setLoading(false)
    } catch (err) {
      toast.error('Error al cargar webhooks')
      setLoading(false)
    }
  }

  async function handleCreate() {
    if (!url.trim()) {
      toast.error('Ingresa una URL')
      return
    }

    setCreating(true)
    try {
      const result = await createWebhook(catalogId, url, selectedEvents)
      if ('error' in result) {
        toast.error(result.error)
      } else {
        toast.success(`Webhook creado. Secret: ${result.secret?.slice(0, 16)}...`)
        setUrl('')
        setSelectedEvents(['order.created'])
        await loadWebhooks()
      }
    } catch (err) {
      toast.error('Error al crear webhook')
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este webhook?')) return

    try {
      const result = await deleteWebhook(catalogId, id)
      if ('error' in result) {
        toast.error(result.error)
      } else {
        toast.success('Webhook eliminado')
        await loadWebhooks()
      }
    } catch (err) {
      toast.error('Error al eliminar')
    }
  }

  async function handleToggle(id: string, active: boolean) {
    try {
      const result = await toggleWebhook(catalogId, id, active)
      if ('error' in result) {
        toast.error(result.error)
      } else {
        await loadWebhooks()
      }
    } catch (err) {
      toast.error('Error al actualizar')
    }
  }

  function toggleEvent(eventId: string) {
    if (selectedEvents.includes(eventId)) {
      setSelectedEvents(selectedEvents.filter((e) => e !== eventId))
    } else {
      setSelectedEvents([...selectedEvents, eventId])
    }
  }

  function copySecret(secret: string) {
    navigator.clipboard.writeText(secret)
    setCopied(secret)
    setTimeout(() => setCopied(null), 2000)
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
      {/* Crear webhook */}
      <Card className="p-6">
        <h3 className="mb-4 font-semibold text-night-800">Crear webhook</h3>
        <p className="mb-4 text-sm text-warm-500">
          Los webhooks envían eventos en tiempo real a tu aplicación.{' '}
          <Button asChild variant="link" size="sm" className="p-0">
            <a href="/api/docs" target="_blank" rel="noopener noreferrer">
              Ver documentación <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </Button>
        </p>

        <div className="space-y-4">
          <div>
            <Label htmlFor="url" className="text-sm font-medium text-night-700">
              URL del webhook
            </Label>
            <Input
              id="url"
              placeholder="https://tu-app.com/webhooks/domicilios"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={creating}
              className="mt-2 font-mono text-xs"
            />
          </div>

          <div>
            <p className="mb-3 text-sm font-medium text-night-700">Eventos a recibir</p>
            <div className="space-y-2">
              {AVAILABLE_EVENTS.map((event) => (
                <button
                  key={event.id}
                  onClick={() => toggleEvent(event.id)}
                  disabled={creating}
                  className={`w-full text-left flex items-center gap-3 rounded px-3 py-2 border-2 transition-all ${
                    selectedEvents.includes(event.id)
                      ? 'border-lime-500 bg-lime-50'
                      : 'border-warm-200 bg-white hover:border-warm-300'
                  }`}
                >
                  <div className={`h-5 w-5 rounded border-2 flex items-center justify-center ${
                    selectedEvents.includes(event.id)
                      ? 'bg-lime-500 border-lime-500'
                      : 'border-warm-300'
                  }`}>
                    {selectedEvents.includes(event.id) && <Check className="h-3 w-3 text-white" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-night-700">{event.label}</p>
                    <p className="text-xs text-warm-500">{event.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <Button onClick={handleCreate} disabled={creating || selectedEvents.length === 0}>
            {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Crear webhook
          </Button>
        </div>
      </Card>

      {/* Lista de webhooks */}
      {webhooks.length > 0 && (
        <div>
          <h3 className="mb-3 font-semibold text-night-800">Webhooks activos</h3>
          <div className="space-y-3">
            {webhooks.map((wh) => (
              <Card key={wh.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <code className="flex-1 rounded bg-warm-50 px-3 py-1.5 font-mono text-xs text-night-700 break-all">
                        {wh.url}
                      </code>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {wh.events?.map((e: string) => (
                        <span key={e} className="rounded-full bg-lime-100 px-2 py-0.5 text-xs font-medium text-lime-700">
                          {e}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-warm-500 font-mono break-all">
                      Secret: {wh.secret?.slice(0, 16)}...
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copySecret(wh.secret)}
                        className="ml-2 h-4 w-4 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={wh.active}
                      onCheckedChange={(checked) => handleToggle(wh.id, checked)}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(wh.id)}
                      className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {webhooks.length === 0 && (
        <Card className="border-warm-200 bg-warm-50 p-6 text-center">
          <AlertCircle className="mx-auto mb-2 h-5 w-5 text-warm-400" />
          <p className="text-sm text-warm-600">No tienes webhooks configurados</p>
        </Card>
      )}
    </div>
  )
}
