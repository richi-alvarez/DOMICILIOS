'use client'

import { useState, useTransition } from 'react'
import {
  Clock,
  AlertTriangle,
  Database,
  Zap,
  TrendingUp,
  HardDrive,
} from 'lucide-react'
import { saveThresholdConfig, resetThresholdConfig } from '@/lib/actions/monitoring-thresholds'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import type { ThresholdConfig } from '@/lib/monitoring/thresholds'

interface Props {
  initialConfig: ThresholdConfig
  defaults: ThresholdConfig
}

export function ThresholdsForm({ initialConfig, defaults }: Props) {
  const [isPending, startTransition] = useTransition()
  const [slowEndpoint, setSlowEndpoint] = useState(initialConfig.slowEndpoint)
  const [errorRate, setErrorRate] = useState(initialConfig.errorRate)
  const [cacheHitRate, setCacheHitRate] = useState(initialConfig.cacheHitRate)
  const [aiCostPerDay, setAiCostPerDay] = useState(initialConfig.aiCostPerDay)
  const [highResponseTime, setHighResponseTime] = useState(
    initialConfig.highResponseTime
  )
  const [serviceDownThreshold, setServiceDownThreshold] = useState(
    initialConfig.serviceDownThreshold
  )

  const handleSave = () => {
    startTransition(async () => {
      const res = await saveThresholdConfig({
        slowEndpoint,
        errorRate,
        cacheHitRate,
        aiCostPerDay,
        highResponseTime,
        serviceDownThreshold,
      })

      if (res.success) {
        toast.success('Umbrales guardados correctamente')
      } else {
        toast.error(res.error || 'Error al guardar umbrales')
      }
    })
  }

  const handleReset = () => {
    startTransition(async () => {
      const res = await resetThresholdConfig()

      if (res.success) {
        setSlowEndpoint(defaults.slowEndpoint)
        setErrorRate(defaults.errorRate)
        setCacheHitRate(defaults.cacheHitRate)
        setAiCostPerDay(defaults.aiCostPerDay)
        setHighResponseTime(defaults.highResponseTime)
        setServiceDownThreshold(defaults.serviceDownThreshold)
        toast.success('Umbrales restaurados a valores predeterminados')
      } else {
        toast.error(res.error || 'Error al restaurar umbrales')
      }
    })
  }

  const thresholds = [
    {
      label: 'Endpoint lento',
      icon: Clock,
      value: slowEndpoint,
      setValue: setSlowEndpoint,
      unit: 'ms',
      min: 100,
      max: 30000,
      description: '> X ms = alerta warning',
    },
    {
      label: 'Tasa de errores',
      icon: AlertTriangle,
      value: errorRate,
      setValue: setErrorRate,
      unit: '%',
      min: 1,
      max: 50,
      description: '> X% = alerta warning',
    },
    {
      label: 'Cache hit rate',
      icon: Database,
      value: cacheHitRate,
      setValue: setCacheHitRate,
      unit: '%',
      min: 10,
      max: 90,
      description: '< X% = alerta warning',
    },
    {
      label: 'Costo IA por día',
      icon: TrendingUp,
      value: aiCostPerDay,
      setValue: setAiCostPerDay,
      unit: 'USD',
      min: 1,
      max: 1000,
      description: '> $X = alerta critical',
    },
    {
      label: 'Tiempo de respuesta',
      icon: Zap,
      value: highResponseTime,
      setValue: setHighResponseTime,
      unit: 'ms',
      min: 100,
      max: 10000,
      description: '> X ms promedio = alerta warning',
    },
    {
      label: 'Servicio caído',
      icon: HardDrive,
      value: serviceDownThreshold,
      setValue: setServiceDownThreshold,
      unit: 'checks',
      min: 1,
      max: 10,
      description: 'N+ fallos consecutivos = alerta critical',
    },
  ]

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Thresholds Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {thresholds.map((threshold) => {
          const Icon = threshold.icon
          return (
            <div
              key={threshold.label}
              className="rounded-lg border border-warm-200 bg-white p-6 space-y-3"
            >
              <div className="flex items-center gap-3 mb-2">
                <Icon className="w-5 h-5 text-primary-600" />
                <h3 className="font-semibold text-night-800 text-sm">
                  {threshold.label}
                </h3>
              </div>

              <p className="text-xs text-warm-600 mb-3">{threshold.description}</p>

              <div className="space-y-1">
                <Label htmlFor={threshold.label} className="text-xs font-medium">
                  Valor actual
                </Label>
                <div className="flex gap-2">
                  <Input
                    id={threshold.label}
                    type="number"
                    min={threshold.min}
                    max={threshold.max}
                    value={threshold.value}
                    onChange={(e) => threshold.setValue(Number(e.target.value))}
                    disabled={isPending}
                    className="flex-1"
                  />
                  <span className="text-sm font-semibold text-night-600 w-12 flex items-center justify-center">
                    {threshold.unit}
                  </span>
                </div>
              </div>

              {threshold.value !== defaults[threshold.label.toLowerCase().replace(/\s+/g, '') as keyof ThresholdConfig] && (
                <p className="text-xs text-blue-600 font-medium">
                  Por defecto: {defaults[threshold.label.toLowerCase().replace(/\s+/g, '') as keyof ThresholdConfig]}
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* Info Box */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-700">
            <p className="font-semibold mb-1">Notas importantes</p>
            <ul className="list-disc ml-5 space-y-1 text-xs">
              <li>Los cambios en los umbrales se aplican inmediatamente</li>
              <li>Se guardan en un archivo de configuración (no requiere reinicio)</li>
              <li>Solo warning y critical generan notificaciones (info no notifica)</li>
              <li>El sistema continúa funcionando si hay errores de guardado</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Button
          onClick={handleReset}
          variant="outline"
          disabled={isPending}
          className="flex-1"
        >
          {isPending ? 'Procesando...' : 'Restaurar predeterminados'}
        </Button>
        <Button
          onClick={handleSave}
          disabled={isPending}
          className="flex-1"
        >
          {isPending ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </div>
    </div>
  )
}
