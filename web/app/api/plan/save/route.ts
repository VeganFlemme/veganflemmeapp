export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { database } from '@/lib/database'
import { validateRequestBody, createErrorResponse, createSuccessResponse } from '@/lib/api-utils'

// Zod schemas for validation
const mealSlotSchema = z.object({
  recipeId: z.string().optional(),
  title: z.string().optional(),
  servings: z.number().min(0.1).max(10).default(1),
}).refine(data => data.recipeId || data.title, {
  message: "Either recipeId or title must be provided"
})

const dayPlanSchema = z.object({
  breakfast: mealSlotSchema.optional(),
  lunch: mealSlotSchema.optional(),
  dinner: mealSlotSchema.optional(),
  snack: mealSlotSchema.optional(),
})

const savePlanSchema = z.object({
  plan: z.object({
    plan: z.array(dayPlanSchema).min(1).max(7),
    status: z.string().optional(),
    meta: z.object({}).passthrough().optional(),
  }),
  user_email: z.string().email().optional(),
})

export async function POST(req: NextRequest) {
  try {
    // Validate request body with zod
    const validation = await validateRequestBody(req, savePlanSchema)
    if (!validation.success) {
      return createErrorResponse(validation.error, 400, 'VALIDATION_ERROR')
    }

    const { plan, user_email } = validation.data

    // Try to get authenticated user from headers
    let authenticatedUserEmail: string | undefined
    const authHeader = req.headers.get('authorization')
    
    if (authHeader && supabase) {
      try {
        const token = authHeader.replace('Bearer ', '')
        const { data: { user } } = await supabase.auth.getUser(token)
        authenticatedUserEmail = user?.email
      } catch (error) {
        console.log('Auth token validation failed:', error)
      }
    }

    // Use authenticated user email if available, otherwise use provided email
    const finalUserEmail = authenticatedUserEmail || user_email

    // Save using enhanced database integration
    const result = await database.savePlan(plan, finalUserEmail)

    if (!result.success) {
      return createErrorResponse(
        String(result.error) || 'Failed to save plan',
        500,
        'SAVE_ERROR'
      )
    }

    return createSuccessResponse({
      id: result.data?.id, 
      created_at: result.data?.created_at,
      source: result.source,
      user_email: finalUserEmail
    })

  } catch (e: any) {
    console.error('Plan save error:', e)
    return createErrorResponse(
      'Internal server error',
      500,
      'INTERNAL_ERROR',
      e.message
    )
  }
}
