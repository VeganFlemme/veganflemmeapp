export const runtime = 'nodejs';
import { NextResponse } from 'next/server'
export async function GET() {
  const needs = ['SOLVER_URL','SPOONACULAR_KEY','DATABASE_URL']
  const missing = needs.filter((k)=>!process.env[k])
  return NextResponse.json({ ok: missing.length===0, missing })
}