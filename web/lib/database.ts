import { Pool } from 'pg'

// Database connection utility
let pool: Pool | null = null

export function getPool(): Pool | null {
  const DATABASE_URL = process.env.DATABASE_URL
  if (!DATABASE_URL) {
    console.warn('DATABASE_URL not configured - falling back to demo mode')
    return null
  }

  if (!pool) {
    pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    })
  }

  return pool
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