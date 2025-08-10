from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict
import pulp, time

app = FastAPI(title="VeganFlemme Optimizer")

# In production, lock to your Vercel domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Nutrients(BaseModel):
    energy_kcal: float = 0
    protein_g: float = 0
    carbs_g: float = 0
    fat_g: float = 0
    fiber_g: float = 0
    b12_ug: float = 0
    iron_mg: float = 0
    calcium_mg: float = 0
    zinc_mg: float = 0
    iodine_ug: float = 0
    selenium_ug: float = 0
    vitamin_d_ug: float = 0
    ala_g: float = 0

class Recipe(BaseModel):
    id: str
    title: str
    time_min: int
    cost_eur: float
    nutrients: Nutrients

class DayPlan(BaseModel):
    breakfast: str | None
    lunch: str | None
    dinner: str | None
    snack: str | None = None

class SolveRequest(BaseModel):
    recipes: List[Recipe]
    day_templates: List[DayPlan]
    targets: Nutrients
    weights: Dict[str, float]
    dislikes: List[str] = []
    max_repeat: int = Field(2, ge=1, le=5)
    time_limit_sec: int = Field(25, ge=5, le=180)

@app.get('/health')
def health():
    return {"ok": True, "ts": time.time()}

def _solve_once(req: SolveRequest, tol: float = 0.15):
    R = {r.id: r for r in req.recipes if r.id not in set(req.dislikes)}
    days = len(req.day_templates)
    slots = ['breakfast','lunch','dinner','snack']

    x = pulp.LpVariable.dicts('portion', (range(days), slots), lowBound=0, upBound=2, cat='Continuous')
    y = pulp.LpVariable.dicts('pick', (range(days), slots, list(R.keys())), 0, 1, cat='Binary')

    c = pulp.LpProblem('veganflemme', pulp.LpMinimize)

    BIG = 2.0
    for d in range(days):
        for slot in slots:
            c += pulp.lpSum([y[d][slot][rid] for rid in R]) <= 1
            for rid in R:
                c += x[d][slot] <= BIG * y[d][slot][rid]

    def agg(day, key):
        return pulp.lpSum([
            y[day][slot][rid] * getattr(R[rid].nutrients, key) * x[day][slot]
            for slot in slots for rid in R
        ])

    keys = ["energy_kcal","protein_g","carbs_g","fat_g","fiber_g","b12_ug","iron_mg","calcium_mg","zinc_mg","iodine_ug","selenium_ug","vitamin_d_ug","ala_g"]
    dev_pos = { (d,k): pulp.LpVariable(f"dev_pos_{d}_{k}", lowBound=0) for d in range(days) for k in keys }
    dev_neg = { (d,k): pulp.LpVariable(f"dev_neg_{d}_{k}", lowBound=0) for d in range(days) for k in keys }

    for d in range(days):
        for k in keys:
            target = max(0.0, getattr(req.targets, k))
            low = (1.0 - tol) * target
            high = (1.0 + tol) * target
            val = agg(d, k)
            c += val - high <= dev_pos[(d,k)]
            c += low - val <= dev_neg[(d,k)]

    mean_cost = pulp.lpSum([ y[d][slot][rid] * R[rid].cost_eur for d in range(days) for slot in slots for rid in R ]) / max(1,days)
    mean_time = pulp.lpSum([ y[d][slot][rid] * R[rid].time_min for d in range(days) for slot in slots for rid in R ]) / max(1,days)

    for rid in R:
        c += pulp.lpSum([ y[d][slot][rid] for d in range(days) for slot in slots ]) <= req.max_repeat

    alpha = float(req.weights.get('nutri', 1.0))
    beta  = float(req.weights.get('time', 0.2))
    gamma = float(req.weights.get('cost', 0.2))

    nutri_term = pulp.lpSum([ dev_pos[(d,k)] + dev_neg[(d,k)] for d in range(days) for k in keys ])
    c += alpha*nutri_term + beta*mean_time + gamma*mean_cost

    solver = pulp.PULP_CBC_CMD(msg=0, timeLimit=req.time_limit_sec)
    c.solve(solver)

    return c, x, y, keys, R, days, slots

@app.post('/solve')
def solve(req: SolveRequest):
    started = time.time()
    if not req.recipes or not req.day_templates:
        raise HTTPException(status_code=400, detail="recipes and day_templates required")

    c, x, y, keys, R, days, slots = _solve_once(req, tol=0.15)
    status = pulp.LpStatus[c.status]

    if status not in ("Optimal",):
        c, x, y, keys, R, days, slots = _solve_once(req, tol=0.25)
        status = pulp.LpStatus[c.status]

    solution = []
    for d in range(days):
        day = {}
        for slot in slots:
            best = None
            for rid in R:
                var = y[d][slot][rid]
                if var.value() and var.value() > 0.5:
                    best = rid
                    break
            day[slot] = { 'recipeId': best, 'servings': float(x[d][slot].value() or 0) }
        solution.append(day)

    return { 'status': status, 'plan': solution, 'stats': { 'elapsed_sec': round(time.time()-started,3) } }
