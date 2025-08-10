export async function offSearch(query: string, pageSize=20) {
  const url = new URL('https://world.openfoodfacts.org/api/v2/search')
  url.searchParams.set('categories_tags_en','plant-based-foods-and-beverages')
  url.searchParams.set('page_size', String(pageSize))
  url.searchParams.set('fields','product_name,brands,code,labels,ecoscore_grade,nutriments')
  url.searchParams.set('q', query)
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error('OFF error')
  return res.json()
}
