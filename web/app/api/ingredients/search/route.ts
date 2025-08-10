import { NextRequest, NextResponse } from 'next/server'
import { searchIngredients } from '@/lib/database'

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
    const result = await searchIngredients(query, limit)
    
    if (!result.success) {
      // If database is not available, return empty results with info
      if (result.error?.includes('not configured')) {
        return NextResponse.json({
          ok: true,
          data: [],
          message: 'Database not configured - demo mode active'
        })
      }
      
      return NextResponse.json({ 
        ok: false, 
        error: result.error 
      }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      data: result.data || [],
      count: result.data?.length || 0
    })

  } catch (error: any) {
    console.error('Ingredient search error:', error)
    return NextResponse.json({ 
      ok: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}