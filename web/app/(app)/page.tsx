"use client";
import { useState } from 'react'

type PlanDay = { breakfast?: any; lunch?: any; dinner?: any; snack?: any }
export default function Page() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [plan, setPlan] = useState<any>(null)

  async function generate() {
    setLoading(true); setError(null)
    try {
      const targets = { energy_kcal: 2000, protein_g: 75, carbs_g: 260, fat_g: 70, fiber_g: 30,
        b12_ug: 4, iron_mg: 14, calcium_mg: 1000, zinc_mg: 10, iodine_ug: 150, selenium_ug: 70, vitamin_d_ug: 10, ala_g: 2
      }
      const res = await fetch('/api/plan/generate', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ targets })})
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data?.error || 'Erreur API')
      setPlan(data.plan)
    } catch (e:any) {
      setError(e.message || 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  async function savePlan() {
    if (!plan) return
    const res = await fetch('/api/plan/save', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ plan }) })
    const data = await res.json()
    if (!data.ok) alert('Échec: '+data.error); else alert('Enregistré ✔️  ID: '+data.id)
  }

  const days: PlanDay[] = plan?.plan || []

  return (
    <div className="grid grid-cols-12 gap-4">
      <aside className="col-span-3 space-y-6">
        <div className="card">
          <h2 className="text-lg font-semibold">Affiner</h2>
          <p className="text-sm text-gray-500">Temps, objectifs, allergies…</p>
          <button onClick={generate} disabled={loading}
            className="mt-3 inline-flex items-center rounded-xl bg-black text-white px-4 py-2 text-sm disabled:opacity-60">
            {loading ? 'Génération…' : 'Générer mon menu'}
          </button>
          {plan && <button onClick={savePlan} className="ml-2 inline-flex items-center rounded-xl border px-4 py-2 text-sm">Enregistrer dans Supabase</button>}
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        </div>
      </aside>
      <main className="col-span-6 space-y-4">
        <div className="card">
          <h1 className="text-2xl font-bold">Plan 100% végane — Semaine</h1>
          <p className="text-sm text-gray-500">Clique sur "Générer mon menu".</p>
        </div>
        {(days.length ? days : Array.from({length:7})).map((_,i)=> {
          const d: any = days[i] || {}
          return (
          <div key={i} className="card">
            <div className="font-medium">Jour {i+1}</div>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {['breakfast','lunch','dinner','snack'].map((slot,idx)=> {
                const it = d?.[slot]
                return (
                <div key={idx} className="rounded-xl border p-3 text-sm">
                  <div className="font-semibold">{['Petit dej','Déjeuner','Dîner','Snack'][idx]}</div>
                  <div className="text-gray-500">{it?.recipeId || '—'}</div>
                  {it?.servings ? <div className="text-xs text-gray-400">{it.servings} portion(s)</div> : null}
                </div>)
              })}
            </div>
          </div>
        )})}
      </main>
      <aside className="col-span-3 space-y-4">
        <div className="card">
          <h2 className="text-lg font-semibold">Tableau de bord</h2>
          <ul className="mt-2 text-sm text-gray-700">
            <li>Calories : —</li>
            <li>Protéines : —</li>
            <li>Calcium : —</li>
          </ul>
        </div>
      </aside>
    </div>
  )
}
