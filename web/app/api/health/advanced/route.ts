export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server'
import { getEnvironmentConfig } from '@/lib/environment'

async function testServiceWithMetrics(name: string, url: string, timeout: number = 5000) {
  const startTime = Date.now()
  
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(timeout),
      cache: 'no-store'
    })
    
    const endTime = Date.now()
    const responseTime = endTime - startTime
    
    return {
      service: name,
      ok: response.ok,
      status: response.status,
      response_time_ms: responseTime,
      error: response.ok ? null : `HTTP ${response.status}`,
      timestamp: new Date().toISOString()
    }
  } catch (error: any) {
    const endTime = Date.now()
    const responseTime = endTime - startTime
    
    return {
      service: name,
      ok: false,
      status: 0,
      response_time_ms: responseTime,
      error: error.message || 'Network error',
      timestamp: new Date().toISOString()
    }
  }
}

async function testDatabaseConnectivity() {
  const config = getEnvironmentConfig()
  
  if (!config.services.database.configured) {
    return {
      postgres: false,
      supabase: false,
      status: 'not_configured',
      error: 'DATABASE_URL not configured'
    }
  }

  // Test PostgreSQL connection via pg if available
  try {
    const { Pool } = require('pg')
    const pool = new Pool({
      connectionString: config.services.database.url,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
      max: 1 // Only need one connection for health check
    })

    await pool.query('SELECT 1')
    await pool.end()
    
    return {
      postgres: true,
      supabase: config.services.supabase.configured,
      status: 'connected',
      connection_type: 'postgresql'
    }
  } catch (error: any) {
    return {
      postgres: false,
      supabase: config.services.supabase.configured,
      status: 'connection_failed',
      error: error.message,
      connection_type: 'postgresql'
    }
  }
}

export async function GET(req: NextRequest) {
  const config = getEnvironmentConfig()
  const startTime = Date.now()
  
  // Test all external services in parallel
  const serviceTests = []
  
  if (config.services.solver.configured) {
    serviceTests.push(
      testServiceWithMetrics('solver', `${config.services.solver.url}/health`)
    )
  }
  
  if (config.services.spoonacular.configured) {
    serviceTests.push(
      testServiceWithMetrics(
        'spoonacular', 
        `https://api.spoonacular.com/recipes/random?apiKey=${config.services.spoonacular.key}&number=1`
      )
    )
  }
  
  // Always test OpenFoodFacts (no API key needed)
  serviceTests.push(
    testServiceWithMetrics('openfoodfacts', 'https://world.openfoodfacts.org/api/v0/product/test.json')
  )
  
  // Test database connectivity
  const databaseTest = testDatabaseConnectivity()
  
  // Wait for all tests to complete
  const [databaseResult, ...serviceResults] = await Promise.all([
    databaseTest,
    ...serviceTests
  ])
  
  const totalTime = Date.now() - startTime
  
  // Calculate service availability metrics
  const totalServices = serviceResults.length
  const availableServices = serviceResults.filter(s => s.ok).length
  const averageResponseTime = totalServices > 0 
    ? serviceResults.reduce((sum, s) => sum + s.response_time_ms, 0) / totalServices 
    : 0
  
  // Determine overall health status
  const databaseHealthy = databaseResult.postgres || databaseResult.supabase
  const criticalServicesUp = serviceResults.filter(s => 
    ['solver', 'spoonacular'].includes(s.service) && s.ok
  ).length
  
  let overallStatus = 'healthy'
  if (!databaseHealthy && criticalServicesUp === 0) {
    overallStatus = 'critical'
  } else if (!databaseHealthy || criticalServicesUp < 2) {
    overallStatus = 'degraded'
  }
  
  // Environment validation
  const validation = {
    valid: config.services.database.configured && 
           config.services.solver.configured && 
           config.services.spoonacular.configured,
    issues: [],
    recommendations: []
  }
  
  if (!config.services.database.configured) {
    validation.issues.push('Database not configured')
    validation.recommendations.push('Configure DATABASE_URL for data persistence')
  }
  
  if (!config.services.solver.configured) {
    validation.issues.push('Solver service not configured')
    validation.recommendations.push('Configure SOLVER_URL for optimization engine')
  }
  
  // Performance insights
  const performance = {
    response_time_ms: totalTime,
    database_available: databaseHealthy,
    external_services_tested: totalServices,
    services_available: availableServices,
    availability_percentage: totalServices > 0 ? (availableServices / totalServices) * 100 : 0,
    average_response_time_ms: averageResponseTime
  }
  
  // Service recommendations based on performance
  const serviceRecommendations = []
  
  if (averageResponseTime > 3000) {
    serviceRecommendations.push('External services are slow - consider caching strategies')
  }
  
  if (availableServices < totalServices) {
    serviceRecommendations.push('Some services are unavailable - application will use fallback mode')
  }
  
  if (databaseHealthy && availableServices === totalServices) {
    serviceRecommendations.push('All systems operational - full functionality available')
  }
  
  return NextResponse.json({
    ok: overallStatus !== 'critical',
    status: overallStatus,
    environment: {
      mode: config.mode,
      production: config.production,
      configured_services: Object.entries(config.services)
        .filter(([_, service]) => service.configured)
        .map(([name]) => name),
      validation
    },
    services: {
      database: databaseResult,
      external: serviceResults.reduce((acc, service) => {
        acc[service.service] = service
        return acc
      }, {} as Record<string, any>)
    },
    performance,
    recommendations: serviceRecommendations,
    meta: {
      timestamp: new Date().toISOString(),
      version: "0.1.1",
      phase: "Phase 4 - Production Excellence",
      uptime_check_duration_ms: totalTime
    }
  })
}