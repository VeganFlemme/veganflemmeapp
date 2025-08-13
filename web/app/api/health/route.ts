export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server'
import { database } from '@/lib/database'
import { getEnvironmentConfig, validateEnvironment, getServiceEndpoints } from '@/lib/environment'

export async function GET() {
  const startTime = Date.now()
  
  // Get comprehensive environment configuration
  const config = getEnvironmentConfig()
  const validation = validateEnvironment()
  const endpoints = getServiceEndpoints()
  
  // Enhanced database health check
  const dbHealth = await database.healthCheck()
  
  // Test external services connectivity with timeout protection
  const serviceTests = await Promise.allSettled([
    // Solver service test
    config.services.solver.configured 
      ? fetch(`${config.services.solver.url}/health`, {
          cache: 'no-store',
          signal: AbortSignal.timeout(5000)
        }).then(res => ({ service: 'solver', ok: res.ok, status: res.status }))
        .catch(err => ({ service: 'solver', ok: false, error: err.message }))
      : Promise.resolve({ service: 'solver', ok: false, error: 'Not configured' }),
    
    // Spoonacular API test
    config.services.spoonacular.configured 
      ? fetch(`https://api.spoonacular.com/recipes/random?apiKey=${config.services.spoonacular.key}&number=1`, {
          cache: 'no-store',
          signal: AbortSignal.timeout(5000)
        }).then(res => ({ service: 'spoonacular', ok: res.ok, status: res.status }))
        .catch(err => ({ service: 'spoonacular', ok: false, error: err.message }))
      : Promise.resolve({ service: 'spoonacular', ok: false, error: 'Not configured' }),
    
    // OpenFoodFacts test
    fetch('https://world.openfoodfacts.org/api/v0/product/test.json', {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000)
    }).then(res => ({ service: 'openfoodfacts', ok: res.ok, status: res.status }))
     .catch(err => ({ service: 'openfoodfacts', ok: false, error: err.message }))
  ])
  
  // Process service test results
  const services: Record<string, any> = {}
  serviceTests.forEach((result, index) => {
    const serviceNames = ['solver', 'spoonacular', 'openfoodfacts']
    const serviceName = serviceNames[index]
    
    if (!serviceName) return; // Skip if service name is undefined
    
    if (result.status === 'fulfilled') {
      services[serviceName] = result.value
    } else {
      services[serviceName] = { 
        service: serviceName, 
        ok: false, 
        error: result.reason?.message || 'Test failed' 
      }
    }
  })
  
  const responseTime = Date.now() - startTime
  const hasDatabase = dbHealth.postgres || dbHealth.supabase
  const isHealthy = validation.valid && hasDatabase
  
  return NextResponse.json({ 
    ok: isHealthy,
    environment: {
      mode: config.mode,
      production: config.production,
      configured_services: Object.entries(config.services)
        .filter(([_, service]) => service.configured)
        .map(([name, _]) => name),
      validation: {
        valid: validation.valid,
        issues: validation.issues,
        recommendations: validation.recommendations
      }
    },
    services: {
      database: {
        postgres: dbHealth.postgres,
        supabase: dbHealth.supabase,
        status: hasDatabase ? 'connected' : 'not_configured',
        error: dbHealth.error?.message
      },
      external: services
    },
    performance: {
      response_time_ms: responseTime,
      database_available: hasDatabase,
      external_services_tested: serviceTests.length
    },
    meta: {
      timestamp: new Date().toISOString(),
      version: '0.1.1',
      phase: 'Phase 3B - Production Integration'
    }
  }, {
    status: isHealthy ? 200 : 503
  })
}