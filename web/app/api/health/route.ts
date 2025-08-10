export const runtime = 'nodejs';
import { NextResponse } from 'next/server'
import { database } from '@/lib/database'

export async function GET() {
  const startTime = Date.now()
  
  const needs = ['SOLVER_URL','SPOONACULAR_KEY']
  const optional = ['DATABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY']
  
  const missing = needs.filter((k)=>!process.env[k])
  const optionalMissing = optional.filter((k)=>!process.env[k])
  
  // Enhanced database health check
  const dbHealth = await database.healthCheck()
  
  // Test solver connectivity if configured
  let solverHealthy = false
  if (process.env.SOLVER_URL) {
    try {
      const solverResponse = await fetch(`${process.env.SOLVER_URL}/health`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(5000)
      })
      solverHealthy = solverResponse.ok
    } catch {
      solverHealthy = false
    }
  }
  
  const responseTime = Date.now() - startTime
  const isHealthy = missing.length === 0
  const hasDatabase = dbHealth.postgres || dbHealth.supabase
  
  return NextResponse.json({ 
    ok: isHealthy,
    status: {
      required: {
        missing,
        configured: needs.filter(k => process.env[k]).length
      },
      optional: {
        missing: optionalMissing,
        configured: optional.filter(k => process.env[k]).length
      },
      database: {
        postgres: dbHealth.postgres,
        supabase: dbHealth.supabase,
        status: hasDatabase ? 'connected' : 'not_configured',
        error: dbHealth.error?.message
      },
      solver: {
        configured: !!process.env.SOLVER_URL,
        healthy: solverHealthy
      },
      mode: optionalMissing.length > 0 ? 'demo' : 'full'
    },
    responseTime: `${responseTime}ms`,
    timestamp: new Date().toISOString(),
    version: '0.1.1'
  }, {
    status: isHealthy && hasDatabase ? 200 : 503
  })
}