export default function Page() {
  return (
    <div className="grid grid-cols-12 gap-4">
      <aside className="col-span-3 space-y-6">
        <div className="card">
          <h2 className="text-lg font-semibold">Affiner</h2>
          <p className="text-sm text-gray-500">Temps, objectifs, allergies…</p>
        </div>
      </aside>
      <main className="col-span-6 space-y-4">
        <div className="card">
          <h1 className="text-2xl font-bold">Plan 100% végane — Semaine</h1>
          <p className="text-sm text-gray-500">Déplace, remplace, on rééquilibre.</p>
        </div>
        {Array.from({length:7}).map((_,i)=> (
          <div key={i} className="card">
            <div className="font-medium">Jour {i+1}</div>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {['Petit dej','Déjeuner','Dîner','Snack'].map((m,idx)=> (
                <div key={idx} className="rounded-xl border p-3 text-sm">
                  <div className="font-semibold">{m}</div>
                  <div className="text-gray-500">Recette…</div>
                </div>
              ))}
            </div>
          </div>
        ))}
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
