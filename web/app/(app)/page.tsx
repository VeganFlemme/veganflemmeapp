
"use client"

import { useState, useEffect } from 'react'
import { UserOnboarding, calculateTDEE, calculateMacroTargets } from '@/components/user-onboarding'
import { NutritionDashboard } from '@/components/nutrition-dashboard'
import { MealPlanView } from '@/components/meal-plan-view'
import { ShoppingList } from '@/components/shopping-list'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface UserProfile {
  age: number
  weight: number
  height: number
  gender: 'male' | 'female'
  activityLevel: number
  goal: 'lose' | 'maintain' | 'gain'
}

interface PlanDay {
  breakfast?: any
  lunch?: any
  dinner?: any
  snack?: any
}

// Demo mode data
const demoNutrients = {
  energy_kcal: 1850,
  protein_g: 68,
  carbs_g: 245,
  fat_g: 62,
  fiber_g: 28,
  b12_ug: 3.2,
  vitamin_d_ug: 12,
  calcium_mg: 920,
  iron_mg: 13,
  zinc_mg: 8.5,
  iodine_ug: 135,
  selenium_ug: 65,
  ala_g: 1.8,
}

const demoPlan = [
  {
    breakfast: { recipeId: "653251", servings: 1.2, title: "Porridge aux graines de chia" },
    lunch: { recipeId: "1096185", servings: 1.0, title: "Buddha bowl quinoa légumes" },
    dinner: { recipeId: "1095745", servings: 1.1, title: "Curry de lentilles corail" },
    snack: { recipeId: "789456", servings: 0.8, title: "Smoothie fruits rouges" }
  },
  {
    breakfast: { recipeId: "653252", servings: 1.0, title: "Toast avocat graines" },
    lunch: { recipeId: "1096186", servings: 1.2, title: "Salade pois chiches tahini" },
    dinner: { recipeId: "1095746", servings: 1.0, title: "Pasta bolognaise lentilles" },
    snack: { recipeId: "789457", servings: 1.0, title: "Noix et fruits secs" }
  },
  {
    breakfast: { recipeId: "653253", servings: 1.1, title: "Granola maison yaourt soja" },
    lunch: { recipeId: "1096187", servings: 1.0, title: "Wrap houmous légumes" },
    dinner: { recipeId: "1095747", servings: 1.3, title: "Chili sin carne haricots" },
    snack: { recipeId: "789458", servings: 0.9, title: "Banane beurre d'amande" }
  },
  {
    breakfast: { recipeId: "653254", servings: 1.0, title: "Smoothie bowl spiruline" },
    lunch: { recipeId: "1096188", servings: 1.1, title: "Soupe miso tofu légumes" },
    dinner: { recipeId: "1095748", servings: 1.0, title: "Risotto champignons levure" },
    snack: { recipeId: "789459", servings: 1.0, title: "Energy balls dates cacao" }
  },
  {
    breakfast: { recipeId: "653255", servings: 1.2, title: "Pancakes flocons d'avoine" },
    lunch: { recipeId: "1096189", servings: 1.0, title: "Poke bowl tempeh mariné" },
    dinner: { recipeId: "1095749", servings: 1.1, title: "Tajine légumes pois chiches" },
    snack: { recipeId: "789460", servings: 0.8, title: "Compote pomme cannelle" }
  },
  {
    breakfast: { recipeId: "653256", servings: 1.0, title: "French toast pain complet" },
    lunch: { recipeId: "1096190", servings: 1.2, title: "Ramen légumes miso" },
    dinner: { recipeId: "1095750", servings: 1.0, title: "Pizza légumes fromage vegan" },
    snack: { recipeId: "789461", servings: 1.0, title: "Thé vert biscuits avoine" }
  },
  {
    breakfast: { recipeId: "653257", servings: 1.1, title: "Chia pudding fruits" },
    lunch: { recipeId: "1096191", servings: 1.0, title: "Salade lentilles beluga" },
    dinner: { recipeId: "1095751", servings: 1.2, title: "Couscous légumes merguez vegan" },
    snack: { recipeId: "789462", servings: 0.9, title: "Chocolat noir 70% amandes" }
  }
]

export default function Page() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [targets, setTargets] = useState<any>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [plan, setPlan] = useState<PlanDay[]>([])
  const [isDemoMode, setIsDemoMode] = useState(true)

  useEffect(() => {
    // Check if user has already been onboarded
    const savedProfile = localStorage.getItem('veganflemme-profile')
    if (savedProfile) {
      try {
        const profile = JSON.parse(savedProfile)
        setUserProfile(profile)
        setIsDemoMode(false)
        const { targetCalories } = calculateTDEE(profile)
        const calculatedTargets = calculateMacroTargets(targetCalories)
        setTargets(calculatedTargets)
      } catch (e) {
        console.error('Error loading saved profile:', e)
      }
    }
  }, [])

  const handleOnboardingComplete = (profile: UserProfile) => {
    setUserProfile(profile)
    setIsDemoMode(false)
    localStorage.setItem('veganflemme-profile', JSON.stringify(profile))
    
    const { targetCalories } = calculateTDEE(profile)
    const calculatedTargets = calculateMacroTargets(targetCalories)
    setTargets(calculatedTargets)
  }

  const enableDemoMode = () => {
    setIsDemoMode(true)
    setPlan(demoPlan)
    setTargets({
      energy_kcal: 2000, protein_g: 75, carbs_g: 260, fat_g: 70, fiber_g: 30,
      b12_ug: 4, iron_mg: 14, calcium_mg: 1000, zinc_mg: 10, iodine_ug: 150, 
      selenium_ug: 70, vitamin_d_ug: 15, ala_g: 2
    })
  }

  const resetOnboarding = () => {
    localStorage.removeItem('veganflemme-profile')
    setUserProfile(null)
    setIsDemoMode(false)
    setPlan([])
    setTargets({})
  }

  async function generatePlan() {
    setLoading(true)
    setError(null)
    setPlan([])
    
    try {
      const res = await fetch('/api/plan/generate', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ targets })
      })
      const data = await res.json()
      
      if (!res.ok || !data.ok) {
        const details = data?.details ? `\n\nDétails: ${String(data.details).slice(0,400)}` : ''
        throw new Error((data?.error || 'Erreur API') + details)
      }
      
      setPlan(data.plan?.plan || [])
    } catch (e: any) {
      setError(e.message || 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  const handleMealSubstitute = (dayIndex: number, mealType: string, newMeal: any) => {
    const updatedPlan = [...plan]
    if (updatedPlan[dayIndex]) {
      updatedPlan[dayIndex] = {
        ...updatedPlan[dayIndex],
        [mealType]: {
          recipeId: newMeal.id,
          servings: 1.0,
          title: newMeal.title
        }
      }
      setPlan(updatedPlan)
      
      // Show success feedback
      alert(`✅ ${mealType} du ${dayIndex + 1}er jour modifié avec succès!`)
    }
  }

  async function savePlan() {
    if (!plan.length) return
    
    try {
      const res = await fetch('/api/plan/save', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ plan: { plan, meta: { targets, generatedAt: new Date().toISOString() } } })
      })
      const data = await res.json()
      
      if (!data.ok) {
        alert('Échec de l\'enregistrement: ' + data.error)
      } else {
        alert('Plan enregistré avec succès ! 🎉\nID: ' + data.id)
      }
    } catch (e) {
      alert('Erreur lors de l\'enregistrement')
    }
  }

  // Show onboarding if no user profile and not in demo mode
  if (!userProfile && !isDemoMode) {
    return (
      <div>
        <UserOnboarding onComplete={handleOnboardingComplete} />
        <div className="fixed bottom-4 right-4">
          <Button 
            variant="outline" 
            onClick={enableDemoMode}
            className="shadow-lg"
          >
            🧪 Mode démo
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">🌱 VeganFlemme</h1>
          <p className="text-muted-foreground">
            {isDemoMode 
              ? "Mode démo - Découvrez l'expérience VeganFlemme" 
              : `Bonjour ! Votre plan personnalisé est prêt.`
            }
          </p>
          <div className="flex justify-center gap-2 mt-4">
            {isDemoMode && (
              <Button variant="outline" onClick={resetOnboarding} size="sm">
                🔧 Configuration
              </Button>
            )}
            {userProfile && (
              <Button variant="outline" onClick={enableDemoMode} size="sm">
                🧪 Mode démo
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Controls */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-xl">⚡</span>
                  Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={generatePlan} 
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? '🔄 Génération...' : '✨ Générer mon menu'}
                </Button>
                
                {plan.length > 0 && (
                  <>
                    <Button 
                      onClick={savePlan}
                      variant="outline" 
                      className="w-full"
                    >
                      💾 Enregistrer
                    </Button>
                    
                    <ShoppingList plan={plan} />
                  </>
                )}
                
                {isDemoMode && plan.length === 0 && (
                  <Button 
                    onClick={() => setPlan(demoPlan)}
                    variant="outline" 
                    className="w-full"
                  >
                    📋 Afficher exemple
                  </Button>
                )}
                
                {error && (
                  <div className="p-3 text-xs text-red-600 bg-red-50 rounded border border-red-200">
                    <strong>Erreur:</strong> {error}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* User Info */}
            {userProfile && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-xl">👤</span>
                    Profil
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <div className="space-y-1">
                    <div>{userProfile.age} ans, {userProfile.gender === 'male' ? 'Homme' : 'Femme'}</div>
                    <div>{userProfile.weight}kg, {userProfile.height}cm</div>
                    <div className="text-muted-foreground">
                      Objectif: {userProfile.goal === 'lose' ? 'Perte' : userProfile.goal === 'gain' ? 'Prise' : 'Maintien'}
                    </div>
                    {Object.keys(targets).length > 0 && (
                      <div className="text-muted-foreground">
                        Cible: {targets.energy_kcal} kcal/jour
                      </div>
                    )}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={resetOnboarding}
                    className="w-full mt-3 text-xs"
                  >
                    Modifier profil
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main content - Meal Plan */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-xl">📅</span>
                  Plan de la semaine
                  {isDemoMode && (
                    <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded">DÉMO</span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MealPlanView 
                  plan={plan} 
                  isLoading={loading} 
                  onMealSubstitute={handleMealSubstitute}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Nutrition Dashboard */}
          <div className="lg:col-span-1">
            {Object.keys(targets).length > 0 && (
              <NutritionDashboard 
                nutrients={isDemoMode ? demoNutrients : {}}
                targets={targets}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
