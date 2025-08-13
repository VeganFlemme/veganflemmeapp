export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server'

interface NutrientAnalysis {
  current: number
  target: number
  percentage: number
  status: 'excellent' | 'good' | 'adequate' | 'low' | 'deficient'
  recommendations: string[]
}

interface WeeklyAnalytics {
  overall_score: number
  nutrient_balance: Record<string, NutrientAnalysis>
  weekly_trends: any[]
  insights: string[]
  recommendations: string[]
}

// Nutrient targets for different demographics (per day)
const nutrientTargets = {
  default: {
    energy_kcal: 2100,
    protein_g: 90,
    carbs_g: 260,
    fat_g: 70,
    fiber_g: 30,
    b12_ug: 2.4,
    vitamin_d_ug: 15,
    calcium_mg: 1000,
    iron_mg: 18,
    zinc_mg: 11,
    iodine_ug: 150,
    selenium_ug: 55,
    ala_g: 1.6
  },
  male_adult: {
    energy_kcal: 2500,
    protein_g: 105,
    iron_mg: 8, // Lower iron needs for men
    zinc_mg: 11
  },
  female_adult: {
    energy_kcal: 2000,
    protein_g: 75,
    iron_mg: 18, // Higher iron needs for women
    calcium_mg: 1200
  },
  athlete: {
    energy_kcal: 3000,
    protein_g: 150,
    carbs_g: 400
  }
}

function analyzeNutrient(current: number, target: number, nutrient: string): NutrientAnalysis {
  const percentage = (current / target) * 100
  
  let status: NutrientAnalysis['status']
  let recommendations: string[] = []
  
  // Critical nutrients have stricter thresholds
  const criticalNutrients = ['b12_ug', 'vitamin_d_ug', 'iron_mg', 'calcium_mg']
  const isCritical = criticalNutrients.includes(nutrient)
  
  if (percentage >= 100) {
    status = 'excellent'
    if (nutrient === 'b12_ug') {
      recommendations.push('Excellent ! Maintenez cette supplémentation B12')
    }
  } else if (percentage >= 90) {
    status = 'good'
    recommendations.push('Très bien, proche de l\'objectif optimal')
  } else if (percentage >= 75) {
    status = 'adequate'
    if (isCritical) {
      recommendations.push('Augmentez légèrement l\'apport pour atteindre l\'optimal')
    }
  } else if (percentage >= 60) {
    status = 'low'
    if (nutrient === 'iron_mg') {
      recommendations.push('Associez les sources de fer avec de la vitamine C')
    } else if (nutrient === 'b12_ug') {
      recommendations.push('Supplémentation B12 fortement recommandée')
    } else {
      recommendations.push('Augmentez l\'apport via des aliments enrichis')
    }
  } else {
    status = 'deficient'
    if (nutrient === 'b12_ug') {
      recommendations.push('URGENT: Prenez un supplément B12 immédiatement')
    } else if (nutrient === 'iron_mg') {
      recommendations.push('Consultez un professionnel de santé - risque d\'anémie')
    } else {
      recommendations.push('Apport insuffisant - ajustement alimentaire nécessaire')
    }
  }
  
  return {
    current,
    target,
    percentage: Math.round(percentage),
    status,
    recommendations
  }
}

function calculateOverallScore(nutrientAnalyses: Record<string, NutrientAnalysis>): number {
  // Weighted scoring system
  const weights = {
    energy_kcal: 0.1,
    protein_g: 0.15,
    b12_ug: 0.2,      // Critical for vegans
    iron_mg: 0.15,    // Critical for vegans
    calcium_mg: 0.1,
    vitamin_d_ug: 0.1,
    fiber_g: 0.05,
    zinc_mg: 0.05,
    selenium_ug: 0.05,
    ala_g: 0.05       // Omega-3
  }
  
  let totalScore = 0
  let totalWeight = 0
  
  Object.entries(nutrientAnalyses).forEach(([nutrient, analysis]) => {
    const weight = weights[nutrient as keyof typeof weights] || 0.01
    const score = Math.min(analysis.percentage, 120) // Cap at 120%
    totalScore += score * weight
    totalWeight += weight
  })
  
  return Math.round(totalScore / totalWeight)
}

function generateInsights(analyses: Record<string, NutrientAnalysis>): string[] {
  const insights: string[] = []
  
  // B12 specific insights
  const b12 = analyses.b12_ug
  if (b12 && b12.percentage < 80) {
    insights.push('⚠️ Votre apport en B12 est critique - la supplémentation est essentielle pour tous les véganes')
  } else if (b12 && b12.percentage >= 100) {
    insights.push('✅ Excellente gestion de la B12 ! Continuez votre supplémentation')
  }
  
  // Iron absorption insights
  const iron = analyses.iron_mg
  if (iron && iron.percentage < 90) {
    insights.push('💡 Améliorez l\'absorption du fer en consommant des agrumes aux repas')
  }
  
  // Calcium insights
  const calcium = analyses.calcium_mg
  if (calcium && calcium.percentage >= 100) {
    insights.push('🦴 Apport en calcium excellent ! Vos os sont bien nourris')
  } else if (calcium && calcium.percentage < 80) {
    insights.push('🥛 Augmentez les sources de calcium : tahini, amandes, légumes verts')
  }
  
  // Overall balance
  const excellentNutrients = Object.values(analyses).filter(a => a.status === 'excellent').length
  const totalNutrients = Object.keys(analyses).length
  
  if (excellentNutrients / totalNutrients >= 0.8) {
    insights.push('🌟 Profil nutritionnel exceptionnel ! Vous maîtrisez parfaitement l\'alimentation végane')
  } else if (excellentNutrients / totalNutrients >= 0.6) {
    insights.push('👍 Très bon équilibre nutritionnel avec quelques améliorations possibles')
  }
  
  return insights
}

function generateRecommendations(analyses: Record<string, NutrientAnalysis>): string[] {
  const recommendations: string[] = []
  
  // Priority recommendations based on deficiencies
  const deficientNutrients = Object.entries(analyses)
    .filter(([_, analysis]) => analysis.status === 'deficient' || analysis.status === 'low')
    .sort((a, b) => a[1].percentage - b[1].percentage)
  
  deficientNutrients.forEach(([nutrient, analysis]) => {
    recommendations.push(...analysis.recommendations)
  })
  
  // General vegan nutrition recommendations
  if ((analyses.b12_ug?.percentage ?? 0) < 100) {
    recommendations.push('Supplémentation B12 : 250μg/jour ou 2500μg/semaine')
  }
  
  if ((analyses.vitamin_d_ug?.percentage ?? 0) < 80) {
    recommendations.push('Considérez un supplément de vitamine D3 végane (2000 UI/jour)')
  }
  
  if ((analyses.ala_g?.percentage ?? 0) < 90) {
    recommendations.push('Ajoutez 1 cuillère à soupe de graines de lin moulues par jour')
  }
  
  return [...new Set(recommendations)] // Remove duplicates
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { weeklyPlan, userProfile } = body
    
    if (!weeklyPlan || !Array.isArray(weeklyPlan)) {
      return NextResponse.json({
        error: 'Invalid request: weeklyPlan array required'
      }, { status: 400 })
    }
    
    // Determine targets based on user profile
    let targets = { ...nutrientTargets.default }
    
    if (userProfile) {
      if (userProfile.gender === 'male') {
        targets = { ...targets, ...nutrientTargets.male_adult }
      } else if (userProfile.gender === 'female') {
        targets = { ...targets, ...nutrientTargets.female_adult }
      }
      
      // Adjust for activity level and goals
      if (userProfile.activityLevel > 1.7) {
        targets = { ...targets, ...nutrientTargets.athlete }
      }
    }
    
    // Calculate weekly averages
    const weeklyAverages: Record<string, number> = {}
    const daysWithData = weeklyPlan.filter(day => day && typeof day === 'object').length
    
    if (daysWithData === 0) {
      return NextResponse.json({
        error: 'No valid nutrition data found in weekly plan'
      }, { status: 400 })
    }
    
    // Sum up nutrients across all days
    Object.keys(targets).forEach(nutrient => {
      const total = weeklyPlan.reduce((sum, day) => {
        return sum + (day?.[nutrient] || 0)
      }, 0)
      weeklyAverages[nutrient] = total / daysWithData
    })
    
    // Analyze each nutrient
    const nutrientAnalyses: Record<string, NutrientAnalysis> = {}
    Object.entries(weeklyAverages).forEach(([nutrient, average]) => {
      const target = targets[nutrient as keyof typeof targets]
      if (target) {
        nutrientAnalyses[nutrient] = analyzeNutrient(average, target, nutrient)
      }
    })
    
    // Calculate overall score
    const overallScore = calculateOverallScore(nutrientAnalyses)
    
    // Generate insights and recommendations
    const insights = generateInsights(nutrientAnalyses)
    const recommendations = generateRecommendations(nutrientAnalyses)
    
    // Weekly trends (simplified for now)
    const weeklyTrends = weeklyPlan.map((day, index) => ({
      day: index + 1,
      score: day ? calculateOverallScore(
        Object.fromEntries(
          Object.entries(targets).map(([nutrient, target]) => [
            nutrient,
            analyzeNutrient(day[nutrient] || 0, target, nutrient)
          ])
        )
      ) : 0
    }))
    
    const analytics: WeeklyAnalytics = {
      overall_score: overallScore,
      nutrient_balance: nutrientAnalyses,
      weekly_trends: weeklyTrends,
      insights,
      recommendations
    }
    
    return NextResponse.json({
      ok: true,
      analytics,
      meta: {
        analyzed_days: daysWithData,
        targets_used: targets,
        analysis_date: new Date().toISOString(),
        version: '1.0.0'
      }
    })
    
  } catch (error: any) {
    console.error('Analytics calculation error:', error)
    
    return NextResponse.json({
      ok: false,
      error: 'Analytics calculation failed',
      details: error.message
    }, { status: 500 })
  }
}