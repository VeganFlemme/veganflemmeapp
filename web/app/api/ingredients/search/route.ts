import { NextRequest, NextResponse } from 'next/server'
import { database } from '@/lib/database'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q') || ''
  const limit = parseInt(searchParams.get('limit') || '10')

  if (!query || query.length < 2) {
    return NextResponse.json({ 
      ok: false, 
      error: 'Query parameter "q" must be at least 2 characters' 
    }, { status: 400 })
  }

  try {
    const result = await database.searchIngredients(query, limit)
    
    if (!result.success) {
      return NextResponse.json({ 
        ok: false, 
        error: result.error,
        source: result.source
      }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      data: result.data || [],
      count: result.data?.length || 0,
      source: result.source
    })

  } catch (error: any) {
    console.error('Ingredient search error:', error)
    return NextResponse.json({ 
      ok: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// Batch search endpoint
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { queries = [] } = body

    if (!Array.isArray(queries) || queries.length === 0) {
      return NextResponse.json({
        ok: false,
        error: 'Queries array required'
      }, { status: 400 })
    }

    const results = await Promise.all(
      queries.map(async (query: string) => {
        const result = await database.searchIngredients(query, 5)
        return {
          query,
          success: result.success,
          data: result.data || [],
          source: result.source
        }
      })
    )

    return NextResponse.json({
      ok: true,
      results,
      total_queries: queries.length
    })
  } catch (error: any) {
    console.error('Batch ingredient search error:', error)
    return NextResponse.json({
      ok: false,
      error: 'Batch search failed'
    }, { status: 500 })
  }
}