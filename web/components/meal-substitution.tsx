"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { IngredientSearch } from '@/components/ingredient-search'

interface MealSubstitutionProps {
  mealId?: string
  mealTitle: string
  onSubstitute?: (newMeal: any) => void
  className?: string
}

export function MealSubstitution({ 
  mealId, 
  mealTitle, 
  onSubstitute,
  className = ""
}: MealSubstitutionProps) {
  const [isSearching, setIsSearching] = useState(false)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const handleIngredientSelect = async (ingredient: any) => {
    setLoading(true)
    
    try {
      // In a real implementation, this would call the solver API
      // to find alternative meals based on the selected ingredient
      console.log('Finding substitutes for:', ingredient)
      
      // Demo suggestions - in production this would come from the database/solver
      const demoSuggestions = [
        {
          id: 'alt1',
          title: `${ingredient.name} sauté aux légumes`,
          time_min: 15,
          nutrients: { energy_kcal: 280, protein_g: 12 }
        },
        {
          id: 'alt2', 
          title: `Salade de ${ingredient.name}`,
          time_min: 10,
          nutrients: { energy_kcal: 220, protein_g: 8 }
        }
      ]
      
      setSuggestions(demoSuggestions)
      
    } catch (error) {
      console.error('Error finding substitutions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectSubstitution = (substitute: any) => {
    onSubstitute?.(substitute)
    setIsSearching(false)
    setSuggestions([])
  }

  if (!isSearching) {
    return (
      <div className={className}>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setIsSearching(true)}
          className="w-full"
        >
          🔄 Substituer
        </Button>
      </div>
    )
  }

  return (
    <Card className={`${className} z-10`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>🔄 Substituer: {mealTitle}</span>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              setIsSearching(false)
              setSuggestions([])
            }}
          >
            ✕
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-xs text-muted-foreground mb-2 block">
            Rechercher un ingrédient de base:
          </label>
          <IngredientSearch 
            onIngredientSelect={handleIngredientSelect}
            placeholder="Ex: tofu, lentilles, quinoa..."
          />
        </div>

        {loading && (
          <div className="text-center py-4 text-muted-foreground">
            🔍 Recherche d'alternatives...
          </div>
        )}

        {suggestions.length > 0 && (
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">
              Suggestions:
            </label>
            <div className="space-y-2">
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className="p-3 border rounded-lg hover:bg-muted cursor-pointer transition-colors"
                  onClick={() => handleSelectSubstitution(suggestion)}
                >
                  <div className="font-medium text-sm">{suggestion.title}</div>
                  <div className="text-xs text-muted-foreground">
                    ⏱️ {suggestion.time_min}min • 
                    🔥 {suggestion.nutrients.energy_kcal}kcal • 
                    💪 {suggestion.nutrients.protein_g}g protéines
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && suggestions.length === 0 && (
          <div className="text-xs text-muted-foreground text-center py-2">
            Sélectionnez un ingrédient pour voir les suggestions
          </div>
        )}
      </CardContent>
    </Card>
  )
}