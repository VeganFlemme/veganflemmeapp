import { NextRequest, NextResponse } from 'next/server'

const SPOON_KEY = process.env.SPOONACULAR_KEY!
const SOLVER_URL = process.env.SOLVER_URL!

async function findVeganRecipes(maxReadyTime:number=30) {
  const url = new URL('https://api.spoonacular.com/recipes/complexSearch')
  url.searchParams.set('diet','vegan')
  url.searchParams.set('addRecipeNutrition','true')
  url.searchParams.set('number','24')
  url.searchParams.set('maxReadyTime', String(maxReadyTime))
  url.searchParams.set('apiKey', SPOON_KEY)
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error('Spoonacular error')
  return res.json()
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { maxTime = 30, targets } = body

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
  const plan = await resp.json()
  return NextResponse.json(plan)
}
