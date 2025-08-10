export const runtime = 'nodejs';
import { NextResponse } from 'next/server'
import { testDatabaseConnection } from '@/lib/database'

export async function GET() {
  const needs = ['SOLVER_URL','SPOONACULAR_KEY']
  const optional = ['DATABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY']
  
  const missing = needs.filter((k)=>!process.env[k])
  const optionalMissing = optional.filter((k)=>!process.env[k])
  
  // Test database connection if configured
  let dbStatus = 'not_configured'
  if (process.env.DATABASE_URL) {
    try {
      const isConnected = await testDatabaseConnection()
      dbStatus = isConnected ? 'connected' : 'connection_failed'
    } catch {
      dbStatus = 'connection_error'
    }
  }
  
  const isHealthy = missing.length === 0
  
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
      database: dbStatus,
      mode: optionalMissing.length > 0 ? 'demo' : 'full'
    },
    timestamp: new Date().toISOString()
  })
}