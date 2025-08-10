"use client"

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Ingredient {
  id: string
  name: string
  ciqual_code: string
  tags: string[]
  prep_complexity: number
  similarity?: number
}

interface IngredientSearchProps {
  onIngredientSelect?: (ingredient: Ingredient) => void
  placeholder?: string
  className?: string
}

export function IngredientSearch({ 
  onIngredientSelect, 
  placeholder = "Rechercher un ingrédient...",
  className = ""
}: IngredientSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDbConnected, setIsDbConnected] = useState(true)

  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      return
    }

    const timeoutId = setTimeout(() => {
      searchIngredients(query)
    }, 300) // Debounce search

    return () => clearTimeout(timeoutId)
  }, [query])

  const searchIngredients = async (searchTerm: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/ingredients/search?q=${encodeURIComponent(searchTerm)}&limit=10`)
      const data = await response.json()

      if (!data.ok) {
        throw new Error(data.error || 'Search failed')
      }

      setResults(data.data || [])
      setIsDbConnected(true)
      
      // Check if we're in demo mode
      if (data.message?.includes('demo mode')) {
        setIsDbConnected(false)
      }

    } catch (err: any) {
      setError(err.message)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleIngredientClick = (ingredient: Ingredient) => {
    onIngredientSelect?.(ingredient)
    setQuery('')
    setResults([])
  }

  const getComplexityColor = (complexity: number) => {
    if (complexity === 0) return 'bg-green-100 text-green-700'
    if (complexity <= 2) return 'bg-yellow-100 text-yellow-700'
    return 'bg-red-100 text-red-700'
  }

  const getComplexityLabel = (complexity: number) => {
    if (complexity === 0) return 'Cru'
    if (complexity <= 2) return 'Simple'
    return 'Complexe'
  }

  return (
    <div className={`relative ${className}`}>
      <div className="space-y-2">
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full"
        />
        
        {!isDbConnected && query.length >= 2 && (
          <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border">
            ⚠️ Base de données non connectée - Mode démo actif
          </div>
        )}
        
        {error && (
          <div className="text-xs text-red-600 bg-red-50 p-2 rounded border">
            Erreur: {error}
          </div>
        )}
      </div>

      {/* Results dropdown */}
      {query.length >= 2 && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-80 overflow-y-auto">
          {loading && (
            <CardContent className="p-3">
              <div className="text-center text-muted-foreground">
                🔍 Recherche en cours...
              </div>
            </CardContent>
          )}
          
          {!loading && results.length === 0 && !error && (
            <CardContent className="p-3">
              <div className="text-center text-muted-foreground">
                {isDbConnected 
                  ? `Aucun ingrédient trouvé pour "${query}"`
                  : 'Recherche nécessite la connexion à la base de données'
                }
              </div>
            </CardContent>
          )}
          
          {!loading && results.length > 0 && (
            <div className="p-2">
              {results.map((ingredient) => (
                <div
                  key={ingredient.id}
                  className="p-3 hover:bg-muted rounded cursor-pointer transition-colors border-b last:border-b-0"
                  onClick={() => handleIngredientClick(ingredient)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{ingredient.name}</div>
                      <div className="text-xs text-muted-foreground">
                        Code CIQUAL: {ingredient.ciqual_code}
                        {ingredient.similarity && (
                          <span className="ml-2">
                            Pertinence: {Math.round(ingredient.similarity * 100)}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getComplexityColor(ingredient.prep_complexity)}>
                        {getComplexityLabel(ingredient.prep_complexity)}
                      </Badge>
                      {ingredient.tags && ingredient.tags.length > 0 && (
                        <div className="flex gap-1">
                          {ingredient.tags.slice(0, 2).map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {ingredient.tags.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{ingredient.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  )
}