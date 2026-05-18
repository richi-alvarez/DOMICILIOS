'use client'

import { useState } from 'react'
import {
  Mail,
  Slack as SlackIcon,
  AlertCircle,
  CheckCircle2,
  Code2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { NotificationConfig } from '@/lib/monitoring'

interface Props {
  config: NotificationConfig
}

export function NotificationsClient({ config }: Props) {
  const [testLoading, setTestLoading] = useState(false)
  const [testResult, setTestResult] = useState<
    'idle' | 'sending' | 'ok' | 'error'
  >('idle')
  const [testError, setTestError] = useState<string>('')

  const sendTest = async (severity: 'warning' | 'critical') => {
    setTestLoading(true)
    setTestResult('sending')
    setTestError('')

    try {
      const res = await fetch('/api/monitoring/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test', severity }),
      })

      if (res.ok) {
        setTestResult('ok')
        setTimeout(() => setTestResult('idle'), 3000)
      } else {
        const data = await res.json()
        setTestError(data.message || 'Error desconocido')
        setTestResult('error')
      }
    } catch (error) {
      setTestError(error instanceof Error ? error.message : 'Error de conexión')
      setTestResult('error')
    } finally {
      setTestLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Email Card */}
      <div className="rounded-lg border border-warm-200 bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="font-semibold text-night-800">
                Notificaciones por Email
              </h2>
              <p className="text-xs text-warm-500">Vía Resend</p>
            </div>
          </div>
          <div>
            {config.emailEnabled ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                <CheckCircle2 className="w-3 h-3" />
                Activo
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold">
                Inactivo
              </span>
            )}
          </div>
        </div>

        {config.emailEnabled ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-700">
              📧 Alertas enviadas a:{' '}
              <code className="font-mono font-semibold">{config.emailTo}</code>
            </p>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 space-y-2">
            <p className="text-sm text-yellow-700 font-semibold">
              ⚠️ No configurado
            </p>
            <ol className="text-xs text-yellow-700 space-y-1 ml-4 list-decimal">
              <li>Abre el archivo <code className="bg-white px-1">.env.local</code></li>
              <li>
                Agrega:{' '}
                <code className="bg-white px-1">
                  ALERT_EMAIL_TO=admin@example.com
                </code>
              </li>
              <li>Reinicia el servidor Next.js</li>
            </ol>
          </div>
        )}
      </div>

      {/* Slack Card */}
      <div className="rounded-lg border border-warm-200 bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <SlackIcon className="w-5 h-5 text-slate-700" />
            <div>
              <h2 className="font-semibold text-night-800">
                Notificaciones por Slack
              </h2>
              <p className="text-xs text-warm-500">Incoming Webhooks</p>
            </div>
          </div>
          <div>
            {config.slackEnabled ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                <CheckCircle2 className="w-3 h-3" />
                Activo
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold">
                Inactivo
              </span>
            )}
          </div>
        </div>

        {config.slackEnabled ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-700">
              ✓ Webhook configurado y activo
            </p>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 space-y-2">
            <p className="text-sm text-yellow-700 font-semibold">
              ⚠️ No configurado
            </p>
            <ol className="text-xs text-yellow-700 space-y-1 ml-4 list-decimal">
              <li>
                Ve a{' '}
                <a
                  href="https://api.slack.com/apps"
                  target="_blank"
                  rel="noopener"
                  className="underline hover:no-underline"
                >
                  api.slack.com/apps
                </a>
              </li>
              <li>Crea una nueva Incoming Webhook</li>
              <li>Copia la URL del webhook</li>
              <li>
                Agrégala a <code className="bg-white px-1">.env.local</code>:{' '}
                <code className="bg-white px-1">
                  SLACK_WEBHOOK_URL=https://hooks.slack.com/...
                </code>
              </li>
              <li>Reinicia el servidor Next.js</li>
            </ol>
          </div>
        )}
      </div>

      {/* Test Section */}
      <div className="rounded-lg border border-warm-200 bg-warm-50 p-6">
        <h2 className="font-semibold text-night-800 mb-2">
          Probar Notificaciones
        </h2>
        <p className="text-sm text-warm-600 mb-4">
          Envía una alerta de prueba a todos los canales activos
        </p>

        <div className="flex gap-3 mb-4">
          <Button
            onClick={() => sendTest('warning')}
            disabled={testLoading}
            variant="outline"
            size="sm"
          >
            {testLoading ? 'Enviando...' : 'Probar Warning'}
          </Button>
          <Button
            onClick={() => sendTest('critical')}
            disabled={testLoading}
            size="sm"
          >
            {testLoading ? 'Enviando...' : 'Probar Critical'}
          </Button>
        </div>

        {testResult === 'ok' && (
          <div className="flex items-center gap-2 text-green-700 text-sm bg-green-50 border border-green-200 rounded-lg p-3">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>Notificación enviada correctamente</span>
          </div>
        )}

        {testResult === 'error' && (
          <div className="flex items-start gap-2 text-red-700 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Error al enviar</p>
              <p className="text-xs">{testError || 'Revisa los logs del servidor'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Environment Variables Reference */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
        <div className="flex items-center gap-2 mb-3">
          <Code2 className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold text-blue-900">Variables de Entorno</h2>
        </div>

        <div className="bg-white rounded-lg p-4 border border-blue-100 overflow-x-auto mb-3">
          <pre className="text-xs font-mono text-blue-900">
            {`# Email de destino para alertas
ALERT_EMAIL_TO=admin@example.com

# Slack Incoming Webhook URL
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx/yyy/zzz`}
          </pre>
        </div>

        <p className="text-xs text-blue-700">
          💡 Reinicia el servidor después de cambiar estas variables para que
          surtan efecto.
        </p>
      </div>

      {/* Info Box */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-700">
            <p className="font-semibold mb-1">Notas importantes</p>
            <ul className="list-disc ml-5 space-y-1 text-xs">
              <li>Solo se envían notificaciones para alertas warning y critical</li>
              <li>Las alertas info se guardan en la base de datos sin notificar</li>
              <li>Si ambos canales fallan, el error se registra en los logs</li>
              <li>El sistema nunca deja de funcionar si falla una notificación</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
