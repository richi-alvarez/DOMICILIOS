#!/usr/bin/env node

/**
 * Load Testing Script for Domicilios Platform
 * Tests performance under concurrent user load
 *
 * Usage: node scripts/run-load-test.mjs
 */

const BASE_URL = 'http://localhost:3000'

// Test endpoints
const TEST_ENDPOINTS = [
  { path: '/api/health', method: 'GET' },
  { path: '/app', method: 'GET' },
]

class LoadTestRunner {
  constructor(config) {
    this.baseUrl = config.baseUrl
    this.endpoints = config.endpoints
    this.concurrentUsers = config.concurrentUsers || 5
    this.requestsPerUser = config.requestsPerUser || 10
    this.results = []
  }

  async run() {
    console.log('\n🔥 Starting Load Test')
    console.log(`   Base URL: ${this.baseUrl}`)
    console.log(`   Concurrent Users: ${this.concurrentUsers}`)
    console.log(`   Requests per User: ${this.requestsPerUser}`)
    console.log(`   Total Requests: ${this.concurrentUsers * this.requestsPerUser}`)
    console.log(`   Endpoints: ${this.endpoints.length}`)
    console.log(`\n   Starting requests...`)

    const startTime = Date.now()
    this.results = []

    // Create user simulation tasks
    const userTasks = Array.from({ length: this.concurrentUsers }, (_, userIndex) =>
      this.simulateUser(userIndex),
    )

    // Run all users concurrently
    await Promise.all(userTasks)

    const totalDuration = Date.now() - startTime

    // Calculate and print statistics
    this.printResults(totalDuration)
  }

  async simulateUser(userIndex) {
    for (let i = 0; i < this.requestsPerUser; i++) {
      // Pick random endpoint
      const endpoint = this.endpoints[Math.floor(Math.random() * this.endpoints.length)]

      try {
        const startTime = performance.now()

        const response = await fetch(`${this.baseUrl}${endpoint.path}`, {
          method: endpoint.method,
          headers: { 'Content-Type': 'application/json' },
        })

        const duration = Math.round(performance.now() - startTime)

        this.results.push({
          endpoint: endpoint.path,
          duration,
          status: response.status,
        })

        // Log progress
        const totalMade = (userIndex * this.requestsPerUser + i + 1)
        const totalNeeded = this.concurrentUsers * this.requestsPerUser
        if (totalMade % 5 === 0) {
          process.stdout.write(`\r   Progress: ${totalMade}/${totalNeeded} requests`)
        }
      } catch (error) {
        this.results.push({
          endpoint: endpoint.path,
          duration: 0,
          status: 0,
          error: error.message,
        })
      }

      // Small delay to avoid overwhelming
      await new Promise(resolve => setTimeout(resolve, 10))
    }
  }

  printResults(totalDuration) {
    if (this.results.length === 0) {
      console.log('\n❌ No results collected')
      return
    }

    const durations = this.results
      .filter(r => r.status > 0)
      .map(r => r.duration)
      .sort((a, b) => a - b)

    const successCount = this.results.filter(r => r.status >= 200 && r.status < 400).length
    const failCount = this.results.filter(r => r.status === 0 || r.status >= 400 || r.error).length

    const p95Index = Math.floor(durations.length * 0.95)
    const p99Index = Math.floor(durations.length * 0.99)

    console.log('\n\n📊 Load Test Results')
    console.log('═'.repeat(60))

    console.log('\n📈 Overall Statistics:')
    console.log(`   Total Requests: ${this.results.length}`)
    console.log(`   Successful: ${successCount} ✅`)
    console.log(`   Failed: ${failCount} ❌`)
    console.log(`   Error Rate: ${((failCount / this.results.length) * 100).toFixed(2)}%`)
    console.log(`   Total Duration: ${totalDuration}ms`)
    console.log(`   Requests/Second: ${Math.round((this.results.length / totalDuration) * 1000)}`)

    console.log('\n⏱️  Response Times (successful requests):')
    if (durations.length > 0) {
      console.log(`   Average: ${Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)}ms`)
      console.log(`   Min: ${Math.min(...durations)}ms`)
      console.log(`   Max: ${Math.max(...durations)}ms`)
      console.log(`   P95: ${durations[p95Index] || 0}ms`)
      console.log(`   P99: ${durations[p99Index] || 0}ms`)
    }

    console.log('\n🔗 By Endpoint:')
    const grouped = {}
    for (const r of this.results) {
      if (!grouped[r.endpoint]) {
        grouped[r.endpoint] = { count: 0, durations: [], errors: 0 }
      }
      grouped[r.endpoint].count++
      if (r.duration > 0) grouped[r.endpoint].durations.push(r.duration)
      if (r.error || r.status === 0) grouped[r.endpoint].errors++
    }

    console.log('   Endpoint                      Requests  Avg(ms)  Max(ms)  Errors')
    console.log('   ' + '─'.repeat(70))
    for (const [endpoint, data] of Object.entries(grouped)) {
      const avg = data.durations.length > 0
        ? Math.round(data.durations.reduce((a, b) => a + b, 0) / data.durations.length)
        : 0
      const max = data.durations.length > 0 ? Math.max(...data.durations) : 0
      const padEnd = endpoint.padEnd(30)
      const padReqs = String(data.count).padStart(8)
      const padAvg = String(avg).padStart(8)
      const padMax = String(max).padStart(8)
      const padErr = String(data.errors).padStart(6)
      console.log(`   ${padEnd}${padReqs}${padAvg}${padMax}${padErr}`)
    }

    console.log('\n' + '═'.repeat(60))

    // Determine if test passed
    const passThreshold = 95
    if (successCount / this.results.length * 100 >= passThreshold) {
      console.log('\n✅ Load test PASSED (success rate >= ' + passThreshold + '%)')
    } else {
      console.log('\n❌ Load test FAILED (success rate < ' + passThreshold + '%)')
    }
  }
}

// Run the test
const runner = new LoadTestRunner({
  baseUrl: BASE_URL,
  endpoints: TEST_ENDPOINTS,
  concurrentUsers: 10,
  requestsPerUser: 10,
})

runner.run().catch(error => {
  console.error('❌ Load test error:', error)
  process.exit(1)
})
