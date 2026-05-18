/**
 * Load Testing Runner
 * Simulates concurrent users and measures performance under load
 */

import { performanceTracker } from '../monitoring/performance-tracker'

export interface LoadTestConfig {
  baseUrl: string
  concurrentUsers: number
  requestsPerUser: number
  endpoints: Array<{
    path: string
    method: 'GET' | 'POST' | 'PUT' | 'DELETE'
    body?: Record<string, unknown>
    headers?: Record<string, string>
  }>
}

export interface LoadTestResult {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  averageResponseTime: number
  minResponseTime: number
  maxResponseTime: number
  p95ResponseTime: number
  p99ResponseTime: number
  requestsPerSecond: number
  errorRate: number
  duration: number
  byEndpoint: Array<{
    endpoint: string
    requests: number
    averageTime: number
    maxTime: number
    errorCount: number
  }>
}

class LoadTestRunner {
  private results: Array<{
    endpoint: string
    duration: number
    status: number
    error?: string
  }> = []

  /**
   * Run load test with simulated concurrent users
   */
  async runLoadTest(config: LoadTestConfig): Promise<LoadTestResult> {
    console.log(`\n🔥 Starting Load Test`)
    console.log(`   Concurrent Users: ${config.concurrentUsers}`)
    console.log(`   Requests per User: ${config.requestsPerUser}`)
    console.log(`   Total Requests: ${config.concurrentUsers * config.requestsPerUser}`)
    console.log(`   Endpoints: ${config.endpoints.length}`)

    const startTime = Date.now()
    this.results = []

    // Create user simulation tasks
    const userTasks = Array.from({ length: config.concurrentUsers }, (_, userIndex) =>
      this.simulateUser(userIndex, config),
    )

    // Run all users concurrently
    await Promise.all(userTasks)

    const totalDuration = Date.now() - startTime

    // Calculate statistics
    return this.calculateStats(totalDuration)
  }

  /**
   * Simulate a single user making requests
   */
  private async simulateUser(
    userIndex: number,
    config: LoadTestConfig,
  ): Promise<void> {
    for (let i = 0; i < config.requestsPerUser; i++) {
      // Pick random endpoint
      const endpoint = config.endpoints[Math.floor(Math.random() * config.endpoints.length)]

      try {
        const startTime = performance.now()

        const response = await fetch(`${config.baseUrl}${endpoint.path}`, {
          method: endpoint.method,
          headers: {
            'Content-Type': 'application/json',
            ...endpoint.headers,
          },
          body: endpoint.body ? JSON.stringify(endpoint.body) : undefined,
        })

        const duration = Math.round(performance.now() - startTime)

        this.results.push({
          endpoint: endpoint.path,
          duration,
          status: response.status,
        })

        // Log progress every 10 requests
        if ((userIndex * config.requestsPerUser + i + 1) % 10 === 0) {
          const progress = userIndex * config.requestsPerUser + i + 1
          const total = config.concurrentUsers * config.requestsPerUser
          process.stdout.write(`\r   Progress: ${progress}/${total} requests`)
        }
      } catch (error) {
        this.results.push({
          endpoint: endpoint.path,
          duration: 0,
          status: 0,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }

      // Small delay to avoid overwhelming the server
      await new Promise((resolve) => setTimeout(resolve, 10))
    }
  }

  /**
   * Calculate statistical results
   */
  private calculateStats(totalDuration: number): LoadTestResult {
    if (this.results.length === 0) {
      return {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        minResponseTime: 0,
        maxResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        requestsPerSecond: 0,
        errorRate: 0,
        duration: totalDuration,
        byEndpoint: [],
      }
    }

    const durations = this.results
      .filter((r) => r.status > 0)
      .map((r) => r.duration)
      .sort((a, b) => a - b)

    const successfulRequests = this.results.filter((r) => r.status >= 200 && r.status < 400).length
    const failedRequests = this.results.filter(
      (r) => r.status === 0 || r.status >= 400 || r.error,
    ).length

    // Percentiles
    const p95Index = Math.floor(durations.length * 0.95)
    const p99Index = Math.floor(durations.length * 0.99)

    // Group by endpoint
    const byEndpoint = this.groupByEndpoint()

    return {
      totalRequests: this.results.length,
      successfulRequests,
      failedRequests,
      averageResponseTime: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
      minResponseTime: Math.min(...durations),
      maxResponseTime: Math.max(...durations),
      p95ResponseTime: durations[p95Index] || 0,
      p99ResponseTime: durations[p99Index] || 0,
      requestsPerSecond: Math.round((this.results.length / totalDuration) * 1000),
      errorRate: ((failedRequests / this.results.length) * 100).toFixed(2) as unknown as number,
      duration: totalDuration,
      byEndpoint,
    }
  }

  /**
   * Group results by endpoint
   */
  private groupByEndpoint(): Array<{
    endpoint: string
    requests: number
    averageTime: number
    maxTime: number
    errorCount: number
  }> {
    const grouped: Record<
      string,
      { requests: number; durations: number[]; errorCount: number }
    > = {}

    for (const result of this.results) {
      if (!grouped[result.endpoint]) {
        grouped[result.endpoint] = { requests: 0, durations: [], errorCount: 0 }
      }

      grouped[result.endpoint].requests++
      if (result.duration > 0) {
        grouped[result.endpoint].durations.push(result.duration)
      }
      if (result.error || result.status === 0) {
        grouped[result.endpoint].errorCount++
      }
    }

    return Object.entries(grouped).map(([endpoint, data]) => ({
      endpoint,
      requests: data.requests,
      averageTime: Math.round(
        data.durations.reduce((a, b) => a + b, 0) / (data.durations.length || 1),
      ),
      maxTime: Math.max(...data.durations, 0),
      errorCount: data.errorCount,
    }))
  }

  /**
   * Print results in readable format
   */
  static printResults(result: LoadTestResult): void {
    console.log('\n\n📊 Load Test Results')
    console.log('═'.repeat(60))

    console.log('\n📈 Overall Statistics:')
    console.log(`   Total Requests: ${result.totalRequests}`)
    console.log(`   Successful: ${result.successfulRequests} ✅`)
    console.log(`   Failed: ${result.failedRequests} ❌`)
    console.log(`   Error Rate: ${result.errorRate}%`)
    console.log(`   Duration: ${result.duration}ms`)
    console.log(`   Requests/Second: ${result.requestsPerSecond}`)

    console.log('\n⏱️  Response Times:')
    console.log(`   Average: ${result.averageResponseTime}ms`)
    console.log(`   Min: ${result.minResponseTime}ms`)
    console.log(`   Max: ${result.maxResponseTime}ms`)
    console.log(`   P95: ${result.p95ResponseTime}ms`)
    console.log(`   P99: ${result.p99ResponseTime}ms`)

    console.log('\n🔗 By Endpoint:')
    console.log('   Endpoint                      Requests  Avg(ms)  Max(ms)  Errors')
    console.log('   ' + '─'.repeat(70))
    for (const endpoint of result.byEndpoint) {
      const padEnd = endpoint.endpoint.padEnd(30)
      const padReqs = String(endpoint.requests).padStart(8)
      const padAvg = String(endpoint.averageTime).padStart(8)
      const padMax = String(endpoint.maxTime).padStart(8)
      const padErr = String(endpoint.errorCount).padStart(6)
      console.log(`   ${padEnd}${padReqs}${padAvg}${padMax}${padErr}`)
    }

    console.log('\n' + '═'.repeat(60))
  }
}

export const loadTestRunner = new LoadTestRunner()
