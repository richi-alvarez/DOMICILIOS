'use client'

import { useState, useEffect } from 'react'
import { AlertCircle, CheckCircle2, AlertTriangle, Activity, TrendingUp, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DashboardSkeleton } from '@/components/monitoring/SkeletonLoaders'

interface HealthService {
  service: string
  status: 'healthy' | 'degraded' | 'down'
  latencyMs: number
  lastCheck: Date
  details?: string
}

interface Alert {
  id: string
  severity: 'info' | 'warning' | 'critical'
  title: string
  description: string
  service: string
  triggeredAt: Date
  resolvedAt?: Date
}

export default function MonitoringPage() {
  const [health, setHealth] = useState<HealthService[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  async function fetchData() {
    setRefreshing(true)
    try {
      const [healthRes, alertsRes] = await Promise.all([
        fetch('/api/monitoring/health'),
        fetch('/api/monitoring/alerts'),
      ])

      if (healthRes.ok) {
        const data = await healthRes.json()
        setHealth(data.data.services || [])
      }

      if (alertsRes.ok) {
        const data = await alertsRes.json()
        setAlerts(data.data.alerts || [])
      }
    } catch (error) {
      console.error('Failed to fetch monitoring data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />
      case 'degraded':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      case 'down':
        return <AlertCircle className="w-5 h-5 text-red-600" />
      default:
        return <Activity className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-50 border-green-200'
      case 'degraded':
        return 'bg-yellow-50 border-yellow-200'
      case 'down':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="w-4 h-4 text-red-600" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />
      default:
        return <Activity className="w-4 h-4 text-blue-600" />
    }
  }

  const overallStatus = health.some((s) => s.status === 'down')
    ? 'down'
    : health.some((s) => s.status === 'degraded')
      ? 'degraded'
      : 'healthy'

  if (loading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-night-800">System Monitoring</h1>
          <p className="text-warm-600 mt-1">Monitor the health of all critical services</p>
        </div>
        <Button
          onClick={fetchData}
          disabled={refreshing}
          variant="outline"
          className="gap-2"
        >
          <Activity className="w-4 h-4" />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Overall Status Card */}
      <div className={`rounded-lg border-2 p-6 ${getStatusColor(overallStatus)}`}>
        <div className="flex items-center gap-4">
          {getStatusIcon(overallStatus)}
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-night-800">
              {overallStatus === 'healthy'
                ? 'All Systems Operational'
                : overallStatus === 'degraded'
                  ? 'System Degraded'
                  : 'System Issues Detected'}
            </h2>
            <p className="text-sm text-warm-600 mt-1">
              {health.length} services monitored • Last check:{' '}
              {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {health.map((service) => (
          <div
            key={service.service}
            className={`rounded-lg border-2 p-4 ${getStatusColor(service.status)}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {getStatusIcon(service.status)}
                <div>
                  <h3 className="font-semibold text-night-800 capitalize">
                    {service.service.replace('-', ' ')}
                  </h3>
                  <p className="text-xs text-warm-600">
                    {service.latencyMs}ms latency
                  </p>
                </div>
              </div>
            </div>
            {service.details && (
              <p className="text-xs text-warm-700 mt-2">{service.details}</p>
            )}
          </div>
        ))}
      </div>

      {/* Alerts Section */}
      <div className="rounded-lg border border-warm-200 bg-white p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-yellow-600" />
          <h2 className="text-xl font-semibold text-night-800">
            Recent Alerts ({alerts.length})
          </h2>
        </div>

        {alerts.length === 0 ? (
          <p className="text-warm-600 py-8 text-center">No active alerts</p>
        ) : (
          <div className="space-y-3">
            {alerts.slice(0, 10).map((alert) => (
              <div
                key={alert.id}
                className="border border-warm-200 rounded-lg p-4 flex items-start gap-3"
              >
                {getSeverityIcon(alert.severity)}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-night-800">{alert.title}</h3>
                  <p className="text-sm text-warm-700 mt-1">{alert.description}</p>
                  <p className="text-xs text-warm-500 mt-2">
                    Service: <span className="font-mono">{alert.service}</span> •{' '}
                    {new Date(alert.triggeredAt).toLocaleString()}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="ml-2 whitespace-nowrap"
                  onClick={() => {
                    fetch(`/api/admin/monitoring/alerts/${alert.id}/resolve`, {
                      method: 'POST',
                    }).then(() => fetchData())
                  }}
                >
                  Resolve
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <Zap className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-blue-900">Auto-Refresh Active</p>
            <p className="text-sm text-blue-700 mt-1">
              This dashboard automatically refreshes every 30 seconds. You can manually refresh anytime.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
