import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

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

interface MealPlanViewProps {
  plan: DayPlan[]
  isLoading?: boolean
  onRegenerateDay?: (dayIndex: number) => void
}

const mealConfig = {
  breakfast: { emoji: "🌅", name: "Petit déjeuner", color: "bg-yellow-50 border-yellow-200" },
  lunch: { emoji: "🍽️", name: "Déjeuner", color: "bg-orange-50 border-orange-200" },
  dinner: { emoji: "🌙", name: "Dîner", color: "bg-purple-50 border-purple-200" },
  snack: { emoji: "🍎", name: "Collation", color: "bg-green-50 border-green-200" },
}

const daysOfWeek = [
  "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"
]

function MealCard({ meal, mealType }: { meal?: MealSlot, mealType: keyof typeof mealConfig }) {
  const config = mealConfig[mealType]
  
  return (
    <div className={`rounded-lg border-2 border-dashed p-4 text-center transition-all hover:shadow-md ${config.color}`}>
      <div className="text-2xl mb-2">{config.emoji}</div>
      <div className="font-medium text-sm mb-1">{config.name}</div>
      {meal?.recipeId ? (
        <div className="space-y-1">
          <div className="text-sm font-medium text-gray-900">
            {meal.title || `Recette #${meal.recipeId}`}
          </div>
          {meal.servings && (
            <div className="text-xs text-muted-foreground">
              {meal.servings.toFixed(1)} portion{meal.servings !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      ) : (
        <div className="text-xs text-muted-foreground">Non défini</div>
      )}
    </div>
  )
}

function DayCard({ day, dayIndex, onRegenerateDay }: { 
  day: DayPlan, 
  dayIndex: number, 
  onRegenerateDay?: (dayIndex: number) => void 
}) {
  const dayName = daysOfWeek[dayIndex] || `Jour ${dayIndex + 1}`
  
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{dayName}</CardTitle>
          {onRegenerateDay && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onRegenerateDay(dayIndex)}
              className="text-xs"
            >
              🔄 Régénérer
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((mealType) => (
            <MealCard 
              key={mealType} 
              meal={day[mealType]} 
              mealType={mealType}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function MealPlanView({ plan, isLoading, onRegenerateDay }: MealPlanViewProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
                <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div 
                    key={j} 
                    className="h-24 bg-gray-100 rounded-lg border-2 border-dashed animate-pulse"
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!plan || plan.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="text-6xl mb-4">🍽️</div>
          <h3 className="text-xl font-semibold mb-2">Aucun plan généré</h3>
          <p className="text-muted-foreground">
            Cliquez sur "Générer mon menu" pour créer votre plan hebdomadaire personnalisé.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {plan.map((day, dayIndex) => (
        <DayCard 
          key={dayIndex} 
          day={day} 
          dayIndex={dayIndex}
          onRegenerateDay={onRegenerateDay}
        />
      ))}
    </div>
  )
}