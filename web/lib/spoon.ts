export async function findVeganRecipes(params: {includeIngredients?: string[], maxReadyTime?: number}) {
  const BASE = 'https://api.spoonacular.com'
  const KEY = process.env.SPOONACULAR_KEY as string
  const url = new URL(`${BASE}/recipes/complexSearch`)
  url.searchParams.set('diet','vegan')
  url.searchParams.set('addRecipeNutrition','true')
  url.searchParams.set('number','20')
  if (params.includeIngredients) url.searchParams.set('includeIngredients', params.includeIngredients.join(','))
  if (params.maxReadyTime) url.searchParams.set('maxReadyTime', String(params.maxReadyTime))
  url.searchParams.set('apiKey', KEY)
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error('Spoonacular error')
  return res.json()
}
