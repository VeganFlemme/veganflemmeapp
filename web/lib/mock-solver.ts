/**
 * Mock Solver Service for Development and Demo Mode
 * Provides realistic meal plan generation when external solver is unavailable
 */

export interface Nutrients {
  energy_kcal: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
  b12_ug: number
  vitamin_d_ug: number
  calcium_mg: number
  iron_mg: number
  zinc_mg: number
  iodine_ug: number
  selenium_ug: number
  ala_g: number
}

export interface Recipe {
  id: string
  title: string
  time_min: number
  cost_eur: number
  nutrients: Nutrients
}

export interface MealSlot {
  recipeId: string | null
  servings: number
}

export interface DayPlan {
  breakfast: MealSlot
  lunch: MealSlot
  dinner: MealSlot
  snack: MealSlot
}

export interface SolverRequest {
  recipes: Recipe[]
  day_templates: any[]
  targets: Nutrients
  weights?: { nutri?: number; time?: number; cost?: number }
  dislikes?: string[]
  max_repeat?: number
}

export interface SolverResponse {
  status: string
  plan: DayPlan[]
  meta?: {
    mode: 'mock' | 'real'
    optimization_time_ms: number
    nutritional_score: number
  }
}

export class MockSolver {
  private recipes: Recipe[] = [
    {
      id: "mock-001",
      title: "Porridge d'avoine aux graines de chia",
      time_min: 10,
      cost_eur: 1.50,
      nutrients: {
        energy_kcal: 320,
        protein_g: 12,
        carbs_g: 45,
        fat_g: 8,
        fiber_g: 12,
        b12_ug: 0,
        vitamin_d_ug: 0,
        calcium_mg: 150,
        iron_mg: 4.2,
        zinc_mg: 2.1,
        iodine_ug: 5,
        selenium_ug: 15,
        ala_g: 2.3
      }
    },
    {
      id: "mock-002", 
      title: "Bowl de quinoa aux légumes grillés",
      time_min: 25,
      cost_eur: 3.20,
      nutrients: {
        energy_kcal: 450,
        protein_g: 16,
        carbs_g: 65,
        fat_g: 14,
        fiber_g: 8,
        b12_ug: 0,
        vitamin_d_ug: 0,
        calcium_mg: 80,
        iron_mg: 6.5,
        zinc_mg: 3.2,
        iodine_ug: 3,
        selenium_ug: 18,
        ala_g: 0.8
      }
    },
    {
      id: "mock-003",
      title: "Curry de lentilles rouges au lait de coco",
      time_min: 30,
      cost_eur: 2.80,
      nutrients: {
        energy_kcal: 380,
        protein_g: 18,
        carbs_g: 50,
        fat_g: 12,
        fiber_g: 15,
        b12_ug: 0,
        vitamin_d_ug: 0,
        calcium_mg: 120,
        iron_mg: 8.2,
        zinc_mg: 2.8,
        iodine_ug: 8,
        selenium_ug: 12,
        ala_g: 0.5
      }
    },
    {
      id: "mock-004",
      title: "Smoothie protéiné aux épinards et banane",
      time_min: 5,
      cost_eur: 2.10,
      nutrients: {
        energy_kcal: 280,
        protein_g: 15,
        carbs_g: 35,
        fat_g: 8,
        fiber_g: 6,
        b12_ug: 2.4,
        vitamin_d_ug: 1.2,
        calcium_mg: 200,
        iron_mg: 3.5,
        zinc_mg: 1.8,
        iodine_ug: 12,
        selenium_ug: 8,
        ala_g: 1.2
      }
    },
    {
      id: "mock-005",
      title: "Salade de pois chiches aux légumes croquants",
      time_min: 15,
      cost_eur: 2.50,
      nutrients: {
        energy_kcal: 350,
        protein_g: 14,
        carbs_g: 42,
        fat_g: 13,
        fiber_g: 11,
        b12_ug: 0,
        vitamin_d_ug: 0,
        calcium_mg: 90,
        iron_mg: 5.8,
        zinc_mg: 2.5,
        iodine_ug: 4,
        selenium_ug: 10,
        ala_g: 1.8
      }
    },
    {
      id: "mock-006",
      title: "Tofu sauté aux brocolis et sésame",
      time_min: 20,
      cost_eur: 3.50,
      nutrients: {
        energy_kcal: 320,
        protein_g: 22,
        carbs_g: 18,
        fat_g: 18,
        fiber_g: 7,
        b12_ug: 0,
        vitamin_d_ug: 0,
        calcium_mg: 280,
        iron_mg: 4.8,
        zinc_mg: 2.2,
        iodine_ug: 6,
        selenium_ug: 14,
        ala_g: 0.3
      }
    },
    {
      id: "mock-007",
      title: "Energy balls aux dattes et amandes",
      time_min: 10,
      cost_eur: 1.80,
      nutrients: {
        energy_kcal: 180,
        protein_g: 6,
        carbs_g: 22,
        fat_g: 8,
        fiber_g: 4,
        b12_ug: 0,
        vitamin_d_ug: 0,
        calcium_mg: 45,
        iron_mg: 1.8,
        zinc_mg: 1.2,
        iodine_ug: 2,
        selenium_ug: 6,
        ala_g: 0.2
      }
    },
    {
      id: "mock-008",
      title: "Soupe de légumes aux haricots blancs",
      time_min: 35,
      cost_eur: 2.20,
      nutrients: {
        energy_kcal: 240,
        protein_g: 12,
        carbs_g: 38,
        fat_g: 4,
        fiber_g: 14,
        b12_ug: 0,
        vitamin_d_ug: 0,
        calcium_mg: 110,
        iron_mg: 6.2,
        zinc_mg: 2.0,
        iodine_ug: 7,
        selenium_ug: 11,
        ala_g: 0.6
      }
    }
  ]

  async solve(request: SolverRequest): Promise<SolverResponse> {
    const startTime = Date.now()
    
    // Use provided recipes if available, otherwise use mock recipes
    const availableRecipes = request.recipes.length > 0 ? request.recipes : this.recipes
    
    // Filter out disliked recipes
    const usableRecipes = availableRecipes.filter(recipe => 
      !request.dislikes?.includes(recipe.id)
    )
    
    if (usableRecipes.length === 0) {
      return {
        status: "NO_RECIPES_AVAILABLE",
        plan: [],
        meta: {
          mode: 'mock',
          optimization_time_ms: Date.now() - startTime,
          nutritional_score: 0
        }
      }
    }

    // Generate intelligent meal plan based on targets
    const daysCount = request.day_templates.length || 7
    const plan: DayPlan[] = []
    
    for (let day = 0; day < daysCount; day++) {
      const dayPlan = this.generateOptimalDay(usableRecipes, request.targets, request.max_repeat || 2)
      plan.push(dayPlan)
    }

    // Calculate nutritional score
    const nutritionalScore = this.calculateNutritionalScore(plan, usableRecipes, request.targets)

    return {
      status: "Optimal",
      plan,
      meta: {
        mode: 'mock',
        optimization_time_ms: Date.now() - startTime,
        nutritional_score: nutritionalScore
      }
    }
  }

  private generateOptimalDay(recipes: Recipe[], targets: Nutrients, maxRepeat: number): DayPlan {
    // Smart recipe selection based on meal type and nutritional targets
    const breakfast = this.selectRecipeForMeal(recipes, 'breakfast', targets)
    const lunch = this.selectRecipeForMeal(recipes, 'lunch', targets)  
    const dinner = this.selectRecipeForMeal(recipes, 'dinner', targets)
    const snack = this.selectRecipeForMeal(recipes, 'snack', targets)

    return {
      breakfast: { recipeId: breakfast?.id || null, servings: this.calculateServings(breakfast, targets, 0.25) },
      lunch: { recipeId: lunch?.id || null, servings: this.calculateServings(lunch, targets, 0.35) },
      dinner: { recipeId: dinner?.id || null, servings: this.calculateServings(dinner, targets, 0.35) },
      snack: { recipeId: snack?.id || null, servings: this.calculateServings(snack, targets, 0.05) }
    }
  }

  private selectRecipeForMeal(recipes: Recipe[], mealType: string, targets: Nutrients): Recipe | null {
    if (recipes.length === 0) return null

    // Score recipes based on appropriateness for meal type and nutritional fit
    const scoredRecipes = recipes.map(recipe => ({
      recipe,
      score: this.scoreRecipeForMeal(recipe, mealType, targets)
    }))

    // Sort by score and add some randomness to avoid always picking the same recipe
    scoredRecipes.sort((a, b) => b.score - a.score)
    
    // Pick from top 3 recipes with some randomness
    const topRecipes = scoredRecipes.slice(0, Math.min(3, scoredRecipes.length))
    const randomIndex = Math.floor(Math.random() * topRecipes.length)
    
    return topRecipes[randomIndex]?.recipe || null
  }

  private scoreRecipeForMeal(recipe: Recipe, mealType: string, targets: Nutrients): number {
    let score = 0
    
    // Time preference based on meal type
    switch (mealType) {
      case 'breakfast':
        score += recipe.time_min <= 15 ? 20 : 0 // Quick breakfast preferred
        score += recipe.nutrients.fiber_g > 8 ? 15 : 0 // High fiber for breakfast
        break
      case 'lunch':
        score += recipe.nutrients.protein_g > 15 ? 20 : 0 // Protein-rich lunch
        score += recipe.nutrients.energy_kcal > 300 ? 15 : 0 // Substantial meal
        break
      case 'dinner':
        score += recipe.nutrients.protein_g > 12 ? 15 : 0 // Good protein content
        score += recipe.time_min <= 30 ? 10 : 0 // Not too time consuming
        break
      case 'snack':
        score += recipe.nutrients.energy_kcal < 250 ? 20 : 0 // Light snack
        score += recipe.time_min <= 10 ? 15 : 0 // Quick preparation
        break
    }

    // Cost efficiency
    const costEfficiency = recipe.nutrients.energy_kcal / recipe.cost_eur
    score += Math.min(costEfficiency / 10, 10)

    // Nutritional density
    const nutritionalDensity = (recipe.nutrients.protein_g + recipe.nutrients.fiber_g) / recipe.nutrients.energy_kcal
    score += nutritionalDensity * 100

    return score
  }

  private calculateServings(recipe: Recipe | null, targets: Nutrients, mealPortion: number): number {
    if (!recipe) return 0

    // Calculate target calories for this meal
    const targetCalories = targets.energy_kcal * mealPortion
    
    // Base serving size on calorie target with some adjustment for nutritional balance
    const baseServings = targetCalories / recipe.nutrients.energy_kcal
    
    // Adjust for protein needs
    const targetProtein = targets.protein_g * mealPortion
    const proteinServings = targetProtein / recipe.nutrients.protein_g
    
    // Take average of calorie and protein targets, bounded between 0.5 and 3.0
    const optimalServings = (baseServings + proteinServings) / 2
    return Math.max(0.5, Math.min(3.0, Math.round(optimalServings * 4) / 4)) // Round to nearest 0.25
  }

  private calculateNutritionalScore(plan: DayPlan[], recipes: Recipe[], targets: Nutrients): number {
    let totalScore = 0
    const recipeMap = new Map(recipes.map(r => [r.id, r]))

    for (const day of plan) {
      let dayNutrients: Nutrients = {
        energy_kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0,
        b12_ug: 0, vitamin_d_ug: 0, calcium_mg: 0, iron_mg: 0, zinc_mg: 0,
        iodine_ug: 0, selenium_ug: 0, ala_g: 0
      }

      // Sum up nutrients for the day
      for (const [mealType, meal] of Object.entries(day)) {
        if (meal.recipeId && meal.servings > 0) {
          const recipe = recipeMap.get(meal.recipeId)
          if (recipe) {
            Object.keys(dayNutrients).forEach(nutrient => {
              ;(dayNutrients as any)[nutrient] += (recipe.nutrients as any)[nutrient] * meal.servings
            })
          }
        }
      }

      // Calculate score based on how close we are to targets
      let dayScore = 0
      Object.keys(targets).forEach(nutrient => {
        const target = (targets as any)[nutrient]
        const actual = (dayNutrients as any)[nutrient]
        const ratio = target > 0 ? actual / target : 1
        
        // Score is highest when ratio is between 0.85 and 1.15 (within ±15% of target)
        if (ratio >= 0.85 && ratio <= 1.15) {
          dayScore += 10
        } else if (ratio >= 0.7 && ratio <= 1.3) {
          dayScore += 7
        } else if (ratio >= 0.5 && ratio <= 1.5) {
          dayScore += 4
        }
      })

      totalScore += dayScore
    }

    // Normalize score to 0-100 range
    const maxPossibleScore = plan.length * Object.keys(targets).length * 10
    return Math.round((totalScore / maxPossibleScore) * 100)
  }
}

export const mockSolver = new MockSolver()