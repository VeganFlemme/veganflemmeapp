export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

export async function POST(req: NextRequest) {
  const DATABASE_URL = process.env.DATABASE_URL
  if (!DATABASE_URL) {
    return NextResponse.json({ ok:false, error:'Missing env DATABASE_URL' }, { status: 500 })
  }
  const { plan, user_email = null } = await req.json().catch(()=>({}))
  if (!plan) {
    return NextResponse.json({ ok:false, error:'Missing body.plan' }, { status: 400 })
  }
  const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } })
  try {
    const { rows } = await pool.query(
      'insert into public.plans (user_email, plan_json) values ($1, $2) returning id, created_at',
      [user_email, plan]
    )
    return NextResponse.json({ ok:true, id: rows[0].id, created_at: rows[0].created_at })
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e.message || 'DB error' }, { status: 500 })
  } finally {
    await pool.end().catch(()=>{})
  }
}
