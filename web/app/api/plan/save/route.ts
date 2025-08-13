export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { database } from '@/lib/database'

export async function POST(req: NextRequest) {
  try {
    const { plan, user_email = null } = await req.json().catch(()=>({}))
    
    if (!plan) {
      return NextResponse.json({ ok:false, error:'Missing body.plan' }, { status: 400 })
    }

    // Try to get authenticated user from headers
    let authenticatedUserEmail: string | undefined
    const authHeader = req.headers.get('authorization')
    
    if (authHeader && supabase) {
      try {
        const token = authHeader.replace('Bearer ', '')
        const { data: { user } } = await supabase.auth.getUser(token)
        authenticatedUserEmail = user?.email
      } catch (error) {
        console.log('Auth token validation failed:', error)
      }
    }

    // Use authenticated user email if available, otherwise use provided email
    const finalUserEmail = authenticatedUserEmail || user_email

    // Save using enhanced database integration
    const result = await database.savePlan(plan, finalUserEmail)

    if (!result.success) {
      return NextResponse.json({ 
        ok: false, 
        error: result.error || 'Failed to save plan',
        source: result.source 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      ok: true, 
      id: result.data?.id, 
      created_at: result.data?.created_at,
      source: result.source,
      user_email: finalUserEmail
    })

  } catch (e: any) {
    console.error('Plan save error:', e)
    return NextResponse.json({ 
      ok: false, 
      error: e.message || 'Internal server error' 
    }, { status: 500 })
  }
}
