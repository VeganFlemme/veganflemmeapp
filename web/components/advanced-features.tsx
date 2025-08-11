"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'

// Nutrition education tooltips
const nutritionTips = {
  b12: {
    title: "Vitamine B12",
    tip: "Essentielle pour le système nerveux. Supplémentation recommandée pour les véganes.",
    sources: ["Levure nutritionnelle", "Aliments enrichis", "Suppléments"],
    dosage: "2.4 μg/jour minimum"
  },
  iron: {
    title: "Fer",
    tip: "Le fer végétal s'absorbe mieux avec la vitamine C. Éviter le thé/café au repas.",
    sources: ["Lentilles", "Épinards", "Graines de tournesol", "Quinoa"],
    enhancers: ["Vitamine C", "Agrumes", "Poivrons"]
  },
  calcium: {
    title: "Calcium",
    tip: "Disponible dans de nombreux végétaux. L'absorption varie selon la source.",
    sources: ["Choux verts", "Amandes", "Tahini", "Tofu enrichi"],
    absorption: "30-60% selon la source"
  },
  omega3: {
    title: "Oméga-3 ALA",
    tip: "Précurseur des EPA/DHA. Consommer quotidiennement pour une conversion optimale.",
    sources: ["Graines de lin", "Graines de chia", "Noix", "Huile de colza"],
    conversion: "5-10% vers EPA/DHA"
  }
}

interface NutritionTooltipProps {
  nutrient: keyof typeof nutritionTips
  children: React.ReactNode
}

function NutritionTooltip({ nutrient, children }: NutritionTooltipProps) {
  const [isOpen, setIsOpen] = useState(false)
  const tip = nutritionTips[nutrient]

  return (
    <div className="relative">
      <div 
        className="cursor-help"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      >
        {children}
      </div>
      
      {isOpen && (
        <div className="absolute z-50 w-80 p-4 bg-white border border-gray-200 rounded-lg shadow-xl -top-2 left-full ml-2">
          <h4 className="font-semibold text-green-700 mb-2">{tip.title}</h4>
          <p className="text-sm text-gray-600 mb-3">{tip.tip}</p>
          
          {tip.sources && (
            <div className="mb-2">
              <span className="text-xs font-medium text-gray-500">Sources:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {tip.sources.map((source, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {source}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {(tip as any).dosage && (
            <p className="text-xs text-blue-600">
              <strong>Besoin:</strong> {(tip as any).dosage}
            </p>
          )}
          
          {(tip as any).enhancers && (
            <p className="text-xs text-green-600">
              <strong>Absorption ↑:</strong> {(tip as any).enhancers.join(', ')}
            </p>
          )}
          
          {(tip as any).conversion && (
            <p className="text-xs text-orange-600">
              <strong>Conversion:</strong> {(tip as any).conversion}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// Advanced nutrition insights
interface NutritionInsightsProps {
  currentNutrients: any
  targets: any
}

function NutritionInsights({ currentNutrients, targets }: NutritionInsightsProps) {
  const insights = []
  
  // B12 analysis
  const b12Ratio = currentNutrients.b12_ug / targets.b12_ug
  if (b12Ratio < 0.8) {
    insights.push({
      type: 'warning',
      nutrient: 'B12',
      message: 'Considérez un supplément de B12 (500μg 3x/semaine)',
      priority: 'high'
    })
  }
  
  // Iron absorption optimization
  const ironRatio = currentNutrients.iron_mg / targets.iron_mg
  if (ironRatio < 0.9) {
    insights.push({
      type: 'tip',
      nutrient: 'Fer',
      message: 'Ajoutez des agrumes aux repas riches en fer pour améliorer l\'absorption',
      priority: 'medium'
    })
  }
  
  // Calcium balance
  const calciumRatio = currentNutrients.calcium_mg / targets.calcium_mg
  if (calciumRatio > 1.2) {
    insights.push({
      type: 'success',
      nutrient: 'Calcium',
      message: 'Excellent apport en calcium ! Vos os vous remercient 🦴',
      priority: 'low'
    })
  }
  
  // Omega-3 optimization
  const alaRatio = currentNutrients.ala_g / targets.ala_g
  if (alaRatio < 0.8) {
    insights.push({
      type: 'tip',
      nutrient: 'Oméga-3',
      message: 'Pensez aux graines de lin moulues dans vos smoothies',
      priority: 'medium'
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          💡 Conseils nutritionnels personnalisés
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {insights.length === 0 ? (
            <p className="text-green-600 text-center py-4">
              🎉 Votre plan nutritionnel est parfaitement équilibré !
            </p>
          ) : (
            insights.map((insight, i) => (
              <div 
                key={i} 
                className={`p-3 rounded-lg border-l-4 ${
                  insight.type === 'warning' ? 'border-orange-400 bg-orange-50' :
                  insight.type === 'tip' ? 'border-blue-400 bg-blue-50' :
                  'border-green-400 bg-green-50'
                }`}
              >
                <p className="text-sm">
                  <strong>{insight.nutrient}:</strong> {insight.message}
                </p>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Seasonal ingredient suggestions
function SeasonalSuggestions() {
  const currentMonth = new Date().getMonth()
  const seasons = {
    winter: [11, 0, 1], // Dec, Jan, Feb
    spring: [2, 3, 4],  // Mar, Apr, May
    summer: [5, 6, 7],  // Jun, Jul, Aug
    autumn: [8, 9, 10]  // Sep, Oct, Nov
  }
  
  const seasonalIngredients = {
    winter: ['choux', 'carottes', 'pommes de terre', 'agrumes', 'courges'],
    spring: ['asperges', 'épinards', 'radis', 'petits pois', 'artichauts'],
    summer: ['tomates', 'courgettes', 'aubergines', 'poivrons', 'fruits rouges'],
    autumn: ['potirons', 'champignons', 'pommes', 'poires', 'châtaignes']
  }
  
  const currentSeason = Object.entries(seasons).find(([_, months]) => 
    months.includes(currentMonth)
  )?.[0] as keyof typeof seasonalIngredients || 'winter'
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🌱 Suggestions de saison
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-3">
          Privilégiez les ingrédients de saison pour plus de saveur et moins d'impact environnemental :
        </p>
        <div className="flex flex-wrap gap-2">
          {seasonalIngredients[currentSeason].map((ingredient, i) => (
            <Badge key={i} variant="outline" className="text-green-700">
              {ingredient}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Budget optimization tips
interface BudgetOptimizationProps {
  shoppingList: any[]
}

function BudgetOptimization({ shoppingList }: BudgetOptimizationProps) {
  const budgetTips = [
    {
      category: "Légumineuses",
      tip: "Achetez en vrac et faites tremper la veille pour économiser 50%",
      items: ["lentilles", "haricots", "pois chiches"]
    },
    {
      category: "Céréales",
      tip: "Les céréales complètes en vrac sont plus nutritives et économiques",
      items: ["riz complet", "quinoa", "avoine"]
    },
    {
      category: "Fruits et légumes",
      tip: "Choisissez de saison et locaux pour le meilleur rapport qualité-prix",
      items: ["légumes de saison", "fruits locaux"]
    }
  ]
  
  const relevantTips = budgetTips.filter(tip => 
    tip.items.some(item => 
      shoppingList.some(shopItem => 
        shopItem.name.toLowerCase().includes(item.toLowerCase())
      )
    )
  )

  if (relevantTips.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          💰 Optimisation budget
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {relevantTips.map((tip, i) => (
            <div key={i} className="p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
              <p className="text-sm">
                <strong>{tip.category}:</strong> {tip.tip}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Weekly nutrition trends
interface WeeklyTrendsProps {
  weeklyData: any[]
}

function WeeklyTrends({ weeklyData }: WeeklyTrendsProps) {
  const calculateWeeklyAverage = (nutrient: string) => {
    const total = weeklyData.reduce((sum, day) => sum + (day[nutrient] || 0), 0)
    return total / weeklyData.length
  }

  const trends = [
    { nutrient: 'protein_g', name: 'Protéines', unit: 'g', target: 90 },
    { nutrient: 'fiber_g', name: 'Fibres', unit: 'g', target: 30 },
    { nutrient: 'iron_mg', name: 'Fer', unit: 'mg', target: 14 },
    { nutrient: 'calcium_mg', name: 'Calcium', unit: 'mg', target: 950 }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>📈 Tendances hebdomadaires</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {trends.map((trend, i) => {
            const average = calculateWeeklyAverage(trend.nutrient)
            const percentage = (average / trend.target) * 100
            
            return (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{trend.name}</span>
                  <span>{average.toFixed(1)}{trend.unit} / {trend.target}{trend.unit}</span>
                </div>
                <Progress value={Math.min(percentage, 100)} className="h-2" />
                <p className="text-xs text-gray-500 mt-1">
                  {percentage >= 100 ? '✅ Objectif atteint' : 
                   percentage >= 80 ? '🟡 Proche de l\'objectif' : 
                   '🔴 Peut être amélioré'}
                </p>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// Export all components
export {
  nutritionTips,
  NutritionTooltip,
  NutritionInsights,
  SeasonalSuggestions,
  BudgetOptimization,
  WeeklyTrends
}