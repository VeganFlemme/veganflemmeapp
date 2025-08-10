export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server'

const SPOON_KEY = process.env.SPOONACULAR_KEY
const SOLVER_URL = process.env.SOLVER_URL

async function pingSolver() {
  if (!SOLVER_URL) return
  try { await fetch(`${SOLVER_URL}/health`, { cache: 'no-store' }) } catch {}
}

async function findVeganRecipes(maxReadyTime:number=30) {
  if (!SPOON_KEY) throw new Error('Missing env: SPOONACULAR_KEY')
  const url = new URL('https://api.spoonacular.com/recipes/complexSearch')
  url.searchParams.set('diet','vegan')
  url.searchParams.set('addRecipeNutrition','true')
  url.searchParams.set('number','24')
  url.searchParams.set('maxReadyTime', String(maxReadyTime))
  url.searchParams.set('apiKey', SPOON_KEY)
  const res = await fetch(url.toString(), { cache: 'no-store' })
  if (!res.ok) throw new Error(`Spoonacular error ${res.status}`)
  return res.json()
}

export async function POST(req: NextRequest) {
  if (!SPOON_KEY || !SOLVER_URL) {
    return NextResponse.json({ ok:false, error: 'Missing env vars. Check SPOONACULAR_KEY and SOLVER_URL in Vercel.' }, { status: 500 })
  }
  const body = await req.json().catch(() => ({}))
  const { maxTime = 30, targets } = body

  await pingSolver() // wake-up cold start

  const pool = await findVeganRecipes(maxTime)
  const recipes = (pool.results || []).map((r:any) => ({
    id: String(r.id),
    title: r.title,
    time_min: r.readyInMinutes || 20,
    cost_eur: 2.5,
    nutrients: {
      energy_kcal: r.nutrition?.nutrients?.find((n:any)=>n.name==='Calories')?.amount || 0,
      protein_g:   r.nutrition?.nutrients?.find((n:any)=>n.name==='Protein')?.amount || 0,
      carbs_g:     r.nutrition?.nutrients?.find((n:any)=>n.name==='Carbohydrates')?.amount || 0,
      fat_g:       r.nutrition?.nutrients?.find((n:any)=>n.name==='Fat')?.amount || 0,
      fiber_g:     r.nutrition?.nutrients?.find((n:any)=>n.name==='Fiber')?.amount || 0,
      b12_ug: 0, iron_mg: 0, calcium_mg: 0, zinc_mg: 0, iodine_ug: 0, selenium_ug: 0,
      vitamin_d_ug: 0, ala_g: 0
    }
  }))

  const dayTemplates = Array.from({length: 7}).map(()=> ({
    breakfast: recipes[0]?.id, lunch: recipes[1]?.id, dinner: recipes[2]?.id, snack: null
  }))

  const resp = await fetch(`${SOLVER_URL}/solve`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipes, day_templates: dayTemplates, targets, weights: { nutri:1.0, time:0.2, cost:0.2 }, dislikes: [] })
  })
  if (!resp.ok) {
    const t = await resp.text()
    return NextResponse.json({ ok:false, error:`Solver HTTP ${resp.status}`, details:t }, { status: 502 })
  }
  const plan = await resp.json()
  return NextResponse.json({ ok:true, plan })
}
