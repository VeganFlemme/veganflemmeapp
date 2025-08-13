export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import PDFDocument from 'pdfkit'
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { validateRequestBody, createErrorResponse, SECURITY_HEADERS } from '@/lib/api-utils'

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

const pdfRequestSchema = z.object({
  plan: z.object({
    plan: z.array(dayPlanSchema).min(1).max(7),
    title: z.string().optional(),
    week: z.string().optional(),
  })
})

export async function POST(req: NextRequest) {
  try {
    // Validate request body with zod
    const validation = await validateRequestBody(req, pdfRequestSchema)
    if (!validation.success) {
      return createErrorResponse(validation.error, 400, 'VALIDATION_ERROR')
    }

    const { plan } = validation.data
    
    // Generate PDF
    const doc = new PDFDocument()
    const chunks: Buffer[] = []
    doc.on('data', (c: Buffer) => chunks.push(c))
    doc.on('end', () => {})

    // Add title
    doc.fontSize(18).text(plan.title || 'VeganFlemme — Semaine')
    
    // Add week info if provided
    if (plan.week) {
      doc.moveDown(0.5).fontSize(12).text(`Semaine du ${plan.week}`)
    }
    
    // Add each day
    plan.plan.forEach((day, i) => {
      doc.moveDown().fontSize(14).text(`Jour ${i + 1}`)
      
      const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'] as const
      const mealLabels = {
        breakfast: 'Petit-déjeuner',
        lunch: 'Déjeuner', 
        dinner: 'Dîner',
        snack: 'Collation'
      }
      
      mealTypes.forEach((slot) => {
        const meal = day[slot]
        if (!meal || (!meal.title && !meal.recipeId)) return
        
        const title = meal.title || meal.recipeId || 'Repas'
        const servings = meal.servings || 1
        doc.fontSize(12).text(`• ${mealLabels[slot]}: ${title} — ${servings} portion(s)`)
      })
    })
    
    doc.end()
    
    // Wait for PDF generation to complete
    return new Promise<Response>((resolve) => {
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks)
        resolve(new Response(pdfBuffer, { 
          headers: {
            ...SECURITY_HEADERS,
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="plan-repas.pdf"',
          }
        }))
      })
    })
    
  } catch (error: any) {
    console.error('PDF generation error:', error)
    
    return createErrorResponse(
      'PDF generation failed',
      500,
      'PDF_ERROR',
      error.message
    )
  }
}
