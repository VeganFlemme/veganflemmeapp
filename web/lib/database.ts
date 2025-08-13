import { Pool } from 'pg'
import { db } from '@/lib/supabase'
import { env } from '@/lib/env.server'

// Database connection utility
let pool: Pool | null = null

export function getPool(): Pool | null {
  if (!env.database.configured) {
    console.warn('DATABASE_URL not configured - falling back to demo mode')
    return null
  }

  if (!pool) {
    pool = new Pool({
      connectionString: env.database.url,
      ssl: env.isProduction ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    })
  }

  return pool
}

// Enhanced database utilities with Supabase integration
export const database = {
  // Health check that tries both direct connection and Supabase
  async healthCheck() {
    const results = {
      postgres: false,
      supabase: false,
      error: null as any
    }

    // Test direct PostgreSQL connection
    try {
      const dbResult = await testDatabaseConnection()
      results.postgres = dbResult
    } catch (error) {
      results.error = error
    }

    // Test Supabase connection
    try {
      const { ok } = await db.healthCheck()
      results.supabase = ok
    } catch (error) {
      if (!results.error) results.error = error
    }

    return results
  },

  // Search ingredients with fallback to demo data
  async searchIngredients(searchQuery: string, limit: number = 10) {
    try {
      // Try Supabase first
      const { data, error } = await db.searchIngredients(searchQuery, limit)
      
      if (!error && data && data.length > 0) {
        return { data, source: 'database', success: true }
      }

      // Fallback to direct database query
      const dbResult = await searchIngredients(searchQuery, limit)
      if (dbResult.success && dbResult.data && dbResult.data.length > 0) {
        return { data: dbResult.data, source: 'postgres', success: true }
      }

      // Fallback to demo data
      const demoIngredients = [
        { id: 'demo-1', name: 'Tofu ferme', category: 'Protéines' },
        { id: 'demo-2', name: 'Lentilles rouges', category: 'Légumineuses' },
        { id: 'demo-3', name: 'Quinoa', category: 'Céréales' },
        { id: 'demo-4', name: 'Épinards frais', category: 'Légumes' },
        { id: 'demo-5', name: 'Avocat', category: 'Légumes' },
        { id: 'demo-6', name: 'Amandes', category: 'Fruits secs' },
        { id: 'demo-7', name: 'Graines de chia', category: 'Graines' },
        { id: 'demo-8', name: 'Levure nutritionnelle', category: 'Suppléments' }
      ].filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, limit)

      return { data: demoIngredients, source: 'demo', success: true }
    } catch (error) {
      return { data: [], source: 'error', success: false, error }
    }
  },

  // Save plan with user context
  async savePlan(planData: any, userEmail?: string) {
    try {
      // Try Supabase first
      const { data, error } = await db.savePlan(planData, userEmail)
      
      if (!error && data) {
        return { data, source: 'database', success: true }
      }

      // Fallback: return a simulated success for demo
      const mockData = {
        id: `demo-${Date.now()}`,
        plan_json: planData,
        user_email: userEmail,
        created_at: new Date().toISOString()
      }

      return { data: mockData, source: 'demo', success: true }
    } catch (error) {
      return { data: null, source: 'error', success: false, error }
    }
  },

  // Get user plans with auth context
  async getUserPlans(userEmail: string) {
    try {
      const { data, error } = await db.getUserPlans(userEmail)
      
      if (!error && data) {
        return { data, source: 'database', success: true }
      }

      // Return empty array for demo mode
      return { data: [], source: 'demo', success: true }
    } catch (error) {
      return { data: [], source: 'error', success: false, error }
    }
  }
}

// Execute a database query with error handling
export async function executeQuery<T = any>(
  query: string, 
  params: any[] = []
): Promise<{ success: boolean; data?: T[]; error?: string }> {
  const dbPool = getPool()
  
  if (!dbPool) {
    return { success: false, error: 'Database not configured' }
  }

  try {
    const { rows } = await dbPool.query(query, params)
    return { success: true, data: rows }
  } catch (error: any) {
    console.error('Database query error:', error)
    return { success: false, error: error.message }
  }
}

// Search for ingredients using the database RPC
export async function searchIngredients(
  searchTerm: string, 
  limit: number = 10
): Promise<{ success: boolean; data?: any[]; error?: string }> {
  const query = 'SELECT * FROM vf.search_ingredient($1) LIMIT $2'
  return executeQuery(query, [searchTerm, limit])
}

// Get nutritional information for an ingredient
export async function getIngredientNutrients(
  ingredientId: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  const query = `
    SELECT ci.name, ci.ciqual_code, ci.tags, ci.prep_complexity,
           ing.nutrients
    FROM vf.canonical_ingredient ci
    JOIN vf.ingredient_nutrients ing ON ci.id = ing.ingredient_id
    WHERE ci.id = $1
  `
  const result = await executeQuery(query, [ingredientId])
  
  if (result.success && result.data && result.data.length > 0) {
    return { success: true, data: result.data[0] }
  }
  
  return { success: false, error: 'Ingredient not found' }
}

// Get all available recipes from the database
export async function getRecipes(
  limit: number = 50
): Promise<{ success: boolean; data?: any[]; error?: string }> {
  const query = `
    SELECT r.id, r.name, r.prep_time_min, r.difficulty,
           r.tags, r.instructions, r.servings,
           mrn.nutrients
    FROM vf.recipe r
    LEFT JOIN vf.mv_recipe_nutrients mrn ON r.id = mrn.recipe_id
    WHERE r.is_active = true
    ORDER BY r.created_at DESC
    LIMIT $1
  `
  return executeQuery(query, [limit])
}

// Health check for database connection
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const result = await executeQuery('SELECT 1 as test')
    return result.success
  } catch {
    return false
  }
}