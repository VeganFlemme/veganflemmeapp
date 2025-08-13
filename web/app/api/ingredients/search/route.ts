import { NextRequest } from 'next/server'
import { z } from 'zod'
import { database } from '@/lib/database'
import { validateQueryParams, validateRequestBody, createErrorResponse, createSuccessResponse } from '@/lib/api-utils'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Zod schemas for validation
const searchQuerySchema = z.object({
  q: z.string().min(2, 'Query must be at least 2 characters').max(100, 'Query too long'),
  limit: z.coerce.number().int().min(1).max(50).default(10),
})

const batchSearchSchema = z.object({
  queries: z.array(z.string().min(1).max(100)).min(1).max(10),
  limit: z.number().int().min(1).max(20).default(5),
})

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    
    // Validate query parameters with zod
    const validation = validateQueryParams(searchParams, searchQuerySchema)
    if (!validation.success) {
      return createErrorResponse(validation.error, 400, 'VALIDATION_ERROR')
    }

    const { q: query, limit } = validation.data

    const result = await database.searchIngredients(query, limit)
    
    if (!result.success) {
      return createErrorResponse(
        String(result.error) || 'Search failed',
        500,
        'SEARCH_ERROR'
      )
    }

    return createSuccessResponse(
      {
        ingredients: result.data || [],
        count: result.data?.length || 0,
        query,
        source: result.source
      }
    )

  } catch (error: any) {
    console.error('Ingredient search error:', error)
    return createErrorResponse(
      'Internal server error',
      500,
      'INTERNAL_ERROR',
      error.message
    )
  }
}

// Batch search endpoint
export async function POST(req: NextRequest) {
  try {
    // Validate request body with zod
    const validation = await validateRequestBody(req, batchSearchSchema)
    if (!validation.success) {
      return createErrorResponse(validation.error, 400, 'VALIDATION_ERROR')
    }

    const { queries, limit } = validation.data

    const results = await Promise.all(
      queries.map(async (query: string) => {
        const result = await database.searchIngredients(query, limit)
        return {
          query,
          success: result.success,
          ingredients: result.data || [],
          source: result.source,
          error: result.success ? undefined : result.error
        }
      })
    )

    return createSuccessResponse({
      results,
      total_queries: queries.length,
      successful_queries: results.filter(r => r.success).length
    })
    
  } catch (error: any) {
    console.error('Batch ingredient search error:', error)
    return createErrorResponse(
      'Batch search failed',
      500,
      'BATCH_ERROR',
      error.message
    )
  }
}