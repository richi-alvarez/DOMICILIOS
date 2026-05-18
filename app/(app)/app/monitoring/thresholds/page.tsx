import { canAccessMonitoring } from '@/lib/actions/monitoring'
import { getThresholdConfig } from '@/lib/actions/monitoring-thresholds'
import { ThresholdsForm } from './_components/ThresholdsForm'
import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function ThresholdsPage() {
  const hasAccess = await canAccessMonitoring()

  if (!hasAccess) {
    return (
      <div className="max-w-7xl mx-auto p-6 flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Lock className="w-16 h-16 text-warm-400 mx-auto" />
          <div>
            <h1 className="text-3xl font-bold text-night-800">
              Configuración Bloqueada
            </h1>
            <p className="text-warm-600 mt-2">
              La configuración de umbrales solo está disponible para planes Pro,
              Premium y Business.
            </p>
          </div>
          <Button onClick={() => (window.location.href = '/app/settings/billing')}>
            Actualizar Plan
          </Button>
        </div>
      </div>
    )
  }

  const result = await getThresholdConfig()

  if (!result) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-night-800">Error</h1>
          <p className="text-warm-600">No se pudo cargar la configuración de umbrales</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-night-800">
          Configuración de Umbrales de Alertas
        </h1>
        <p className="text-warm-600 mt-1">
          Ajusta los límites para activar alertas automáticas del sistema
        </p>
      </div>

      {/* Form */}
      <ThresholdsForm initialConfig={result.config} defaults={result.defaults} />
    </div>
  )
}
