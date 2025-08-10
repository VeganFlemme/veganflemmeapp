"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface UserProfile {
  age: number
  weight: number
  height: number
  gender: 'male' | 'female'
  activityLevel: number
  goal: 'lose' | 'maintain' | 'gain'
}

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void
}

const activityLevels = [
  { value: 1.2, label: "Sédentaire", description: "Travail de bureau, peu d'exercice" },
  { value: 1.375, label: "Légèrement actif", description: "Exercice léger 1-3 jours/semaine" },
  { value: 1.55, label: "Modérément actif", description: "Exercice modéré 3-5 jours/semaine" },
  { value: 1.725, label: "Très actif", description: "Exercice intense 6-7 jours/semaine" },
  { value: 1.9, label: "Extrêmement actif", description: "Exercice très intense + travail physique" },
]

const goals = [
  { value: 'lose' as const, label: "Perdre du poids", emoji: "📉", description: "-300 kcal/jour" },
  { value: 'maintain' as const, label: "Maintenir mon poids", emoji: "⚖️", description: "Équilibre énergétique" },
  { value: 'gain' as const, label: "Prendre du poids", emoji: "📈", description: "+300 kcal/jour" },
]

export function calculateTDEE(profile: UserProfile) {
  // Mifflin-St Jeor equation
  let bmr: number
  if (profile.gender === 'male') {
    bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5
  } else {
    bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 161
  }
  
  const tdee = bmr * profile.activityLevel
  
  // Adjust for goal
  let adjustedCalories = tdee
  if (profile.goal === 'lose') adjustedCalories -= 300
  if (profile.goal === 'gain') adjustedCalories += 300
  
  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    targetCalories: Math.round(adjustedCalories),
  }
}

export function calculateMacroTargets(targetCalories: number) {
  return {
    energy_kcal: targetCalories,
    protein_g: Math.round(targetCalories * 0.15 / 4), // 15% des calories
    carbs_g: Math.round(targetCalories * 0.55 / 4), // 55% des calories
    fat_g: Math.round(targetCalories * 0.30 / 9), // 30% des calories
    fiber_g: Math.round(targetCalories / 70), // ~25-35g pour 2000 kcal
    
    // Micronutriments recommandés pour adultes
    b12_ug: 4,
    vitamin_d_ug: 15,
    calcium_mg: 1000,
    iron_mg: 14,
    zinc_mg: 10,
    iodine_ug: 150,
    selenium_ug: 70,
    ala_g: 2,
  }
}

export function UserOnboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1)
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    gender: 'female',
    goal: 'maintain',
    activityLevel: 1.375,
  })

  const handleContinue = () => {
    if (step === 1) {
      setStep(2)
    } else {
      onComplete(profile as UserProfile)
    }
  }

  const isStep1Valid = profile.age && profile.weight && profile.height && profile.gender
  const isStep2Valid = profile.activityLevel && profile.goal

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">🌱 VeganFlemme</h1>
          <p className="text-muted-foreground">Configuration de votre profil nutritionnel</p>
          <div className="flex justify-center mt-4">
            <div className="flex space-x-2">
              <div className={`w-3 h-3 rounded-full ${step >= 1 ? 'bg-green-500' : 'bg-gray-300'}`} />
              <div className={`w-3 h-3 rounded-full ${step >= 2 ? 'bg-green-500' : 'bg-gray-300'}`} />
            </div>
          </div>
        </div>

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">👤</span>
                Informations personnelles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Âge (années)</label>
                  <Input
                    type="number"
                    placeholder="25"
                    value={profile.age || ''}
                    onChange={(e) => setProfile(prev => ({ ...prev, age: parseInt(e.target.value) }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Sexe</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'female', label: '👩 Femme' },
                      { value: 'male', label: '👨 Homme' }
                    ].map(option => (
                      <Button
                        key={option.value}
                        variant={profile.gender === option.value ? "default" : "outline"}
                        onClick={() => setProfile(prev => ({ ...prev, gender: option.value as 'male' | 'female' }))}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Poids (kg)</label>
                  <Input
                    type="number"
                    placeholder="65"
                    value={profile.weight || ''}
                    onChange={(e) => setProfile(prev => ({ ...prev, weight: parseInt(e.target.value) }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Taille (cm)</label>
                  <Input
                    type="number"
                    placeholder="170"
                    value={profile.height || ''}
                    onChange={(e) => setProfile(prev => ({ ...prev, height: parseInt(e.target.value) }))}
                  />
                </div>
              </div>

              <Button 
                onClick={handleContinue} 
                disabled={!isStep1Valid}
                className="w-full"
                size="lg"
              >
                Continuer →
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🎯</span>
                Niveau d'activité et objectifs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="text-sm font-medium mb-3 block">Niveau d'activité physique</label>
                <div className="grid gap-2">
                  {activityLevels.map(level => (
                    <Button
                      key={level.value}
                      variant={profile.activityLevel === level.value ? "default" : "outline"}
                      onClick={() => setProfile(prev => ({ ...prev, activityLevel: level.value }))}
                      className="justify-start h-auto p-4"
                    >
                      <div className="text-left">
                        <div className="font-medium">{level.label}</div>
                        <div className="text-sm text-muted-foreground">{level.description}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-3 block">Objectif</label>
                <div className="grid gap-2">
                  {goals.map(goal => (
                    <Button
                      key={goal.value}
                      variant={profile.goal === goal.value ? "default" : "outline"}
                      onClick={() => setProfile(prev => ({ ...prev, goal: goal.value }))}
                      className="justify-start h-auto p-4"
                    >
                      <div className="text-left flex items-center gap-3">
                        <span className="text-2xl">{goal.emoji}</span>
                        <div>
                          <div className="font-medium">{goal.label}</div>
                          <div className="text-sm text-muted-foreground">{goal.description}</div>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  ← Retour
                </Button>
                <Button 
                  onClick={handleContinue} 
                  disabled={!isStep2Valid}
                  className="flex-1"
                  size="lg"
                >
                  Commencer ! 🚀
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}