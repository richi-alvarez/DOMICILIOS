'use client'

/**
 * Development-only monitoring dashboard
 * Shows real-time metrics for performance and AI usage
 * Accessible only in development mode
 */

import { useEffect, useState } from 'react'
import { logger } from '@/lib/monitoring/logger'
import { performanceTracker } from '@/lib/monitoring/performance-tracker'
import { aiUsageTracker } from '@/lib/monitoring/ai-usage-tracker'

interface Stats {
  performance: {
    totalRequests: number
    averageResponseTime: number
    slowRequests: number
    slowPercentage: string
  }
  aiUsage: {
    totalRequests: number
    successfulRequests: number
    failedRequests: number
    totalTokensUsed: number
    totalCostUsd: number
    averageDurationMs: number
    successRate: number
  }
  aiByProvider: Array<{
    provider: string
    requests: number
    cost: number
    successRate: number
  }>
}

export default function MonitoringPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [isDevMode] = useState(process.env.NODE_ENV === 'development')

  useEffect(() => {
    // Refresh stats every 5 seconds
    const interval = setInterval(() => {
      const performanceStats = performanceTracker.getStats()
      const aiStats = aiUsageTracker.getStats()
      const aiProviderStats = aiUsageTracker.getStatsByProvider()

      setStats({
        performance: performanceStats as any,
        aiUsage: aiStats as any,
        aiByProvider: aiProviderStats as any,
      })
    }, 5000)

    // Initial load
    const performanceStats = performanceTracker.getStats()
    const aiStats = aiUsageTracker.getStats()
    const aiProviderStats = aiUsageTracker.getStatsByProvider()

    setStats({
      performance: performanceStats as any,
      aiUsage: aiStats as any,
      aiByProvider: aiProviderStats as any,
    })

    return () => clearInterval(interval)
  }, [])

  if (!isDevMode) {
    return (
      <div className="flex h-screen items-center justify-center bg-red-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-900">Access Denied</h1>
          <p className="mt-2 text-red-700">Monitoring dashboard is only available in development mode.</p>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading metrics...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8 text-white">
      <h1 className="mb-8 text-4xl font-bold">Monitoring Dashboard</h1>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Performance Metrics */}
        <div className="rounded-lg bg-gray-800 p-6">
          <h2 className="mb-4 text-2xl font-bold text-blue-400">Performance</h2>

          <div className="space-y-3">
            <div className="flex justify-between border-b border-gray-700 pb-2">
              <span>Total Requests</span>
              <span className="font-mono text-yellow-400">{stats.performance.totalRequests}</span>
            </div>
            <div className="flex justify-between border-b border-gray-700 pb-2">
              <span>Avg Response Time</span>
              <span className="font-mono text-yellow-400">
                {stats.performance.averageResponseTime}ms
              </span>
            </div>
            <div className="flex justify-between border-b border-gray-700 pb-2">
              <span>Slow Requests (&gt;1s)</span>
              <span className="font-mono text-orange-400">
                {stats.performance.slowRequests} ({stats.performance.slowPercentage}%)
              </span>
            </div>
          </div>
        </div>

        {/* AI Usage Metrics */}
        <div className="rounded-lg bg-gray-800 p-6">
          <h2 className="mb-4 text-2xl font-bold text-purple-400">AI Usage</h2>

          <div className="space-y-3">
            <div className="flex justify-between border-b border-gray-700 pb-2">
              <span>Total Requests</span>
              <span className="font-mono text-yellow-400">{stats.aiUsage.totalRequests}</span>
            </div>
            <div className="flex justify-between border-b border-gray-700 pb-2">
              <span>Successful / Failed</span>
              <span className="font-mono text-green-400">
                {stats.aiUsage.successfulRequests} / {stats.aiUsage.failedRequests}
              </span>
            </div>
            <div className="flex justify-between border-b border-gray-700 pb-2">
              <span>Success Rate</span>
              <span className="font-mono text-green-400">{stats.aiUsage.successRate}%</span>
            </div>
            <div className="flex justify-between border-b border-gray-700 pb-2">
              <span>Total Tokens Used</span>
              <span className="font-mono text-cyan-400">{stats.aiUsage.totalTokensUsed}</span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="text-lg font-bold">Estimated Cost</span>
              <span className="font-mono text-lg text-red-400">
                ${stats.aiUsage.totalCostUsd.toFixed(4)}
              </span>
            </div>
          </div>
        </div>

        {/* AI by Provider */}
        <div className="col-span-full rounded-lg bg-gray-800 p-6">
          <h2 className="mb-4 text-2xl font-bold text-green-400">AI Usage by Provider</h2>

          <div className="overflow-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="px-4 py-2">Provider</th>
                  <th className="px-4 py-2 text-right">Requests</th>
                  <th className="px-4 py-2 text-right">Success Rate</th>
                  <th className="px-4 py-2 text-right">Cost</th>
                </tr>
              </thead>
              <tbody>
                {stats.aiByProvider.map((provider) => (
                  <tr key={provider.provider} className="border-b border-gray-700 hover:bg-gray-700">
                    <td className="px-4 py-2 capitalize">{provider.provider}</td>
                    <td className="px-4 py-2 text-right font-mono text-yellow-400">
                      {provider.requests}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-green-400">
                      {provider.successRate}%
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-red-400">
                      ${provider.cost.toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 border-t border-gray-700 pt-4 text-sm text-gray-400">
        <p>Last updated: {new Date().toLocaleTimeString()}</p>
        <p className="mt-2">Auto-refreshes every 5 seconds. Data is in-memory and will reset on page reload.</p>
      </div>
    </div>
  )
}
