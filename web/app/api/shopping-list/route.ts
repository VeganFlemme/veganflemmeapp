import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getRecipes } from '@/lib/database'
import { validateRequestBody, createErrorResponse, createSuccessResponse } from '@/lib/api-utils'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Zod schemas for validation
const mealSlotSchema = z.object({
  recipeId: z.string().optional(),
  servings: z.number().min(0.1).max(10).default(1),
  title: z.string().optional(),
})

const dayPlanSchema = z.object({
  breakfast: mealSlotSchema.optional(),
  lunch: mealSlotSchema.optional(),
  dinner: mealSlotSchema.optional(),
  snack: mealSlotSchema.optional(),
})

const shoppingListSchema = z.object({
  plan: z.array(dayPlanSchema).min(1).max(7),
})

interface MealSlot {
  recipeId?: string
  servings?: number
  title?: string
}

interface DayPlan {
  breakfast?: MealSlot
  lunch?: MealSlot
  dinner?: MealSlot
  snack?: MealSlot
}

export async function POST(req: NextRequest) {
  try {
    // Validate request body with zod
    const validation = await validateRequestBody(req, shoppingListSchema)
    if (!validation.success) {
      return createErrorResponse(validation.error, 400, 'VALIDATION_ERROR')
    }

    const { plan } = validation.data

    // Extract all recipe IDs from the plan
    const recipeIds = new Set<string>()
    const recipeServings: { [key: string]: number } = {}
    
    plan.forEach((day: DayPlan) => {
      Object.values(day).forEach((meal: MealSlot | undefined) => {
        if (meal?.recipeId) {
          recipeIds.add(meal.recipeId)
          recipeServings[meal.recipeId] = (recipeServings[meal.recipeId] || 0) + (meal.servings || 1)
        }
      })
    })

    // Generate shopping list
    const shoppingList = generateDemoShoppingList(Array.from(recipeIds), recipeServings)

    return createSuccessResponse({
      shoppingList,
      totalItems: shoppingList.length,
      categories: [...new Set(shoppingList.map(item => item.category))]
    })

  } catch (error: any) {
    console.error('Shopping list generation error:', error)
    return createErrorResponse(
      'Shopping list generation failed',
      500,
      'GENERATION_ERROR',
      error.message
    )
  }
}

// Demo shopping list generator (would be replaced with database queries in production)
function generateDemoShoppingList(recipeIds: string[], servings: { [key: string]: number }) {
  const baseIngredients = [
    { name: 'Tofu ferme', quantity: '400g', category: 'Protéines', unit: 'g' },
    { name: 'Lentilles rouges', quantity: '300g', category: 'Légumineuses', unit: 'g' },
    { name: 'Quinoa', quantity: '250g', category: 'Céréales', unit: 'g' },
    { name: 'Riz complet', quantity: '500g', category: 'Céréales', unit: 'g' },
    { name: 'Avoine', quantity: '200g', category: 'Céréales', unit: 'g' },
    { name: 'Épinards frais', quantity: '200g', category: 'Légumes', unit: 'g' },
    { name: 'Brocolis', quantity: '300g', category: 'Légumes', unit: 'g' },
    { name: 'Carottes', quantity: '400g', category: 'Légumes', unit: 'g' },
    { name: 'Tomates', quantity: '500g', category: 'Légumes', unit: 'g' },
    { name: 'Avocat', quantity: '3 pièces', category: 'Légumes', unit: 'pièces' },
    { name: 'Bananes', quantity: '6 pièces', category: 'Fruits', unit: 'pièces' },
    { name: 'Pommes', quantity: '4 pièces', category: 'Fruits', unit: 'pièces' },
    { name: 'Lait d\'amande', quantity: '1L', category: 'Boissons végétales', unit: 'L' },
    { name: 'Huile d\'olive', quantity: '250ml', category: 'Huiles', unit: 'ml' },
    { name: 'Tahini', quantity: '200g', category: 'Condiments', unit: 'g' },
    { name: 'Levure nutritionnelle', quantity: '50g', category: 'Suppléments', unit: 'g' },
    { name: 'Graines de chia', quantity: '100g', category: 'Graines', unit: 'g' },
    { name: 'Noix', quantity: '150g', category: 'Fruits secs', unit: 'g' },
  ]

  // Adjust quantities based on recipe count and servings
  const totalServings = Object.values(servings).reduce((sum, s) => sum + s, 0)
  const multiplier = Math.max(1, totalServings / 7) // Base for 7 servings per week

  return baseIngredients.map(ingredient => ({
    ...ingredient,
    quantity: adjustQuantity(ingredient.quantity, multiplier),
    originalQuantity: ingredient.quantity,
    multiplier: multiplier.toFixed(1)
  }))
}

function adjustQuantity(quantity: string, multiplier: number): string {
  const match = quantity.match(/^(\d+(?:\.\d+)?)\s*(.*)$/)
  if (match) {
    const [, amount, unit] = match
    const newAmount = Math.ceil(parseFloat(amount || '0') * multiplier)
    return `${newAmount}${unit}`
  }
  return quantity
}