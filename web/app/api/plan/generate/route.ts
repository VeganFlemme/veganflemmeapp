export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server'
import { getEnvironmentConfig } from '@/lib/environment'

async function findVeganRecipes(maxReadyTime: number = 30, apiKey: string) {
  const url = new URL('https://api.spoonacular.com/recipes/complexSearch')
  url.searchParams.set('diet', 'vegan')
  url.searchParams.set('addRecipeNutrition', 'true')
  url.searchParams.set('number', '24')
  url.searchParams.set('maxReadyTime', String(maxReadyTime))
  url.searchParams.set('apiKey', apiKey)
  
  const res = await fetch(url.toString(), { 
    cache: 'no-store',
    signal: AbortSignal.timeout(10000) // 10 second timeout
  })
  
  if (!res.ok) throw new Error(`Spoonacular error ${res.status}`)
  return res.json()
}

async function testSolverConnectivity(solverUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`${solverUrl}/health`, { 
      cache: 'no-store',
      signal: AbortSignal.timeout(5000)
    })
    return response.ok
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  const config = getEnvironmentConfig()
  const body = await req.json().catch(() => ({}))
  const { maxTime = 30, targets: customTargets } = body

  // Default nutritional targets (can be overridden by request)
  const defaultTargets = {
    energy_kcal: 2100,
    protein_g: 90,
    carbs_g: 260,
    fat_g: 70,
    fiber_g: 30,
    b12_ug: 4,
    iron_mg: 14,
    calcium_mg: 950,
    zinc_mg: 11,
    iodine_ug: 150,
    selenium_ug: 60,
    vitamin_d_ug: 10,
    ala_g: 1.6
  }

  const targets = { ...defaultTargets, ...customTargets }

  try {
    let recipes: any[] = []
    let recipesSource = 'mock'

    // Try to get real recipes from Spoonacular if configured
    if (config.services.spoonacular.configured) {
      try {
        const pool = await findVeganRecipes(maxTime, config.services.spoonacular.key!)
        recipes = (pool.results || []).map((r: any) => ({
          id: String(r.id),
          title: r.title,
          time_min: r.readyInMinutes || 20,
          cost_eur: 2.5, // Default cost
          nutrients: {
            energy_kcal: r.nutrition?.nutrients?.find((n: any) => n.name === 'Calories')?.amount || 0,
            protein_g: r.nutrition?.nutrients?.find((n: any) => n.name === 'Protein')?.amount || 0,
            carbs_g: r.nutrition?.nutrients?.find((n: any) => n.name === 'Carbohydrates')?.amount || 0,
            fat_g: r.nutrition?.nutrients?.find((n: any) => n.name === 'Fat')?.amount || 0,
            fiber_g: r.nutrition?.nutrients?.find((n: any) => n.name === 'Fiber')?.amount || 0,
            b12_ug: 0, iron_mg: 0, calcium_mg: 0, zinc_mg: 0, iodine_ug: 0, 
            selenium_ug: 0, vitamin_d_ug: 0, ala_g: 0
          }
        }))
        recipesSource = 'spoonacular'
      } catch (error) {
        console.warn('Spoonacular API unavailable, using mock recipes:', error)
      }
    }

    // Generate day templates
    const dayTemplates = Array.from({ length: 7 }).map(() => ({
      breakfast: recipes[0]?.id || null,
      lunch: recipes[1]?.id || null,
      dinner: recipes[2]?.id || null,
      snack: null
    }))

    let planResult: any
    let solverSource = 'mock'

    // Try real solver if configured and reachable
    if (config.services.solver.configured) {
      const solverHealthy = await testSolverConnectivity(config.services.solver.url!)
      
      if (solverHealthy) {
        try {
          const resp = await fetch(`${config.services.solver.url}/solve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recipes,
              day_templates: dayTemplates,
              targets,
              weights: { nutri: 1.0, time: 0.2, cost: 0.2 },
              dislikes: []
            }),
            signal: AbortSignal.timeout(30000) // 30 second timeout
          })

          if (resp.ok) {
            planResult = await resp.json()
            solverSource = 'railway'
          } else {
            throw new Error(`Solver HTTP ${resp.status}`)
          }
        } catch (error) {
          console.warn('Real solver failed, using mock solver:', error)
        }
      }
    }

    // Fallback to mock solver
    if (!planResult) {
      // Simple mock solver implementation directly here
      const mockPlan = {
        status: "Optimal",
        plan: Array.from({ length: 7 }).map((_, day) => ({
          breakfast: { recipeId: recipes[0]?.id || `mock-${day + 1}-breakfast`, servings: 1.5 },
          lunch: { recipeId: recipes[1]?.id || `mock-${day + 1}-lunch`, servings: 1.0 },
          dinner: { recipeId: recipes[2]?.id || `mock-${day + 1}-dinner`, servings: 1.25 },
          snack: { recipeId: recipes[3]?.id || null, servings: 0.5 }
        })),
        meta: {
          mode: 'mock',
          optimization_time_ms: 50,
          nutritional_score: 85
        }
      }
      planResult = mockPlan
    }

    return NextResponse.json({
      ok: true,
      plan: planResult,
      meta: {
        mode: config.mode,
        recipes_source: recipesSource,
        solver_source: solverSource,
        recipes_count: recipes.length,
        targets_used: targets,
        generated_at: new Date().toISOString()
      }
    })

  } catch (error: any) {
    console.error('Plan generation failed:', error)

    // Emergency fallback - generate a basic plan using simple mock logic
    try {
      const emergencyPlan = {
        status: "Demo",
        plan: Array.from({ length: 7 }).map((_, day) => ({
          breakfast: { recipeId: `demo-breakfast-${day + 1}`, servings: 1.0 },
          lunch: { recipeId: `demo-lunch-${day + 1}`, servings: 1.0 },
          dinner: { recipeId: `demo-dinner-${day + 1}`, servings: 1.0 },
          snack: { recipeId: null, servings: 0 }
        })),
        meta: {
          mode: 'emergency_demo',
          optimization_time_ms: 1,
          nutritional_score: 75
        }
      }

      return NextResponse.json({
        ok: true,
        plan: emergencyPlan,
        meta: {
          mode: 'emergency_demo',
          recipes_source: 'mock_builtin',
          solver_source: 'mock',
          recipes_count: 8,
          targets_used: targets,
          generated_at: new Date().toISOString(),
          notice: 'Emergency fallback mode - external services unavailable'
        }
      })
    } catch (emergencyError) {
      return NextResponse.json({
        ok: false,
        error: 'Plan generation completely failed',
        details: error.message,
        emergency_error: emergencyError
      }, { status: 500 })
    }
  }
}
