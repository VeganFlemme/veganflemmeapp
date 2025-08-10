import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface NutrientInfo {
  current: number
  target: number
  unit: string
  emoji: string
  name: string
}

interface NutritionDashboardProps {
  nutrients: {
    [key: string]: number
  }
  targets: {
    [key: string]: number
  }
}

const nutrientConfig: Record<string, { unit: string; emoji: string; name: string }> = {
  energy_kcal: { unit: "kcal", emoji: "🔥", name: "Calories" },
  protein_g: { unit: "g", emoji: "💪", name: "Protéines" },
  carbs_g: { unit: "g", emoji: "🌾", name: "Glucides" },
  fat_g: { unit: "g", emoji: "🥑", name: "Lipides" },
  fiber_g: { unit: "g", emoji: "🌿", name: "Fibres" },
  b12_ug: { unit: "μg", emoji: "💊", name: "B12" },
  vitamin_d_ug: { unit: "μg", emoji: "☀️", name: "Vitamine D" },
  calcium_mg: { unit: "mg", emoji: "🦴", name: "Calcium" },
  iron_mg: { unit: "mg", emoji: "⚡", name: "Fer" },
  zinc_mg: { unit: "mg", emoji: "🛡️", name: "Zinc" },
  iodine_ug: { unit: "μg", emoji: "🧂", name: "Iode" },
  selenium_ug: { unit: "μg", emoji: "✨", name: "Sélénium" },
  ala_g: { unit: "g", emoji: "🐟", name: "ALA (Oméga-3)" },
}

function NutrientBar({ nutrient }: { nutrient: NutrientInfo }) {
  const percentage = Math.min((nutrient.current / nutrient.target) * 100, 100)
  const isLow = percentage < 85
  const isHigh = percentage > 115

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2">
          <span className="text-lg">{nutrient.emoji}</span>
          <span className="font-medium">{nutrient.name}</span>
        </span>
        <span className="text-muted-foreground">
          {nutrient.current.toFixed(1)} / {nutrient.target} {nutrient.unit}
        </span>
      </div>
      <div className="space-y-1">
        <Progress 
          value={percentage} 
          className={`h-2 ${isLow ? 'bg-red-100' : isHigh ? 'bg-yellow-100' : 'bg-green-100'}`}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{percentage.toFixed(0)}%</span>
          {isLow && <span className="text-red-600">En dessous</span>}
          {isHigh && <span className="text-yellow-600">Au dessus</span>}
          {!isLow && !isHigh && <span className="text-green-600">Optimal</span>}
        </div>
      </div>
    </div>
  )
}

export function NutritionDashboard({ nutrients, targets }: NutritionDashboardProps) {
  const macroNutrients = ['energy_kcal', 'protein_g', 'carbs_g', 'fat_g', 'fiber_g']
  const microNutrients = ['b12_ug', 'vitamin_d_ug', 'calcium_mg', 'iron_mg', 'zinc_mg', 'iodine_ug', 'selenium_ug', 'ala_g']

  const createNutrientInfo = (key: string): NutrientInfo => ({
    current: nutrients[key] || 0,
    target: targets[key] || 0,
    unit: nutrientConfig[key]?.unit || '',
    emoji: nutrientConfig[key]?.emoji || '📊',
    name: nutrientConfig[key]?.name || key,
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">📊</span>
            Macronutriments
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {macroNutrients.map((key) => (
            <NutrientBar key={key} nutrient={createNutrientInfo(key)} />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">💎</span>
            Micronutriments essentiels
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {microNutrients.map((key) => (
            <NutrientBar key={key} nutrient={createNutrientInfo(key)} />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}