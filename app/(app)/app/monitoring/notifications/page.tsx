import { canAccessMonitoring } from '@/lib/actions/monitoring'
import { getNotificationConfig } from '@/lib/monitoring'
import { NotificationsClient } from './_components/NotificationsClient'
import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function NotificationsPage() {
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
              La configuración de notificaciones solo está disponible para planes
              Pro, Premium y Business.
            </p>
          </div>
          <Button onClick={() => (window.location.href = '/app/settings/billing')}>
            Actualizar Plan
          </Button>
        </div>
      </div>
    )
  }

  const config = getNotificationConfig()

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-night-800">
          Configuración de Notificaciones
        </h1>
        <p className="text-warm-600 mt-1">
          Gestiona cómo se notifican las alertas críticas del sistema
        </p>
      </div>

      {/* Client Component */}
      <NotificationsClient config={config} />
    </div>
  )
}
