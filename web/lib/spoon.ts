import { env } from './env.server';

export async function findVeganRecipes(params: {includeIngredients?: string[], maxReadyTime?: number}) {
  if (!env.spoonacular.configured) {
    throw new Error('Spoonacular API key not configured');
  }

  const BASE = 'https://api.spoonacular.com'
  const url = new URL(`${BASE}/recipes/complexSearch`)
  url.searchParams.set('diet','vegan')
  url.searchParams.set('addRecipeNutrition','true')
  url.searchParams.set('number','20')
  if (params.includeIngredients) url.searchParams.set('includeIngredients', params.includeIngredients.join(','))
  if (params.maxReadyTime) url.searchParams.set('maxReadyTime', String(params.maxReadyTime))
  url.searchParams.set('apiKey', env.spoonacular.key!)
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error('Spoonacular error')
  return res.json()
}
