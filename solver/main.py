
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from ortools.linear_solver import pywraplp
import time

app = FastAPI(title="VeganFlemme Optimizer")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SLOTS = ["breakfast","lunch","dinner","snack"]
N_KEYS = ["energy_kcal","protein_g","carbs_g","fat_g","fiber_g","b12_ug","iron_mg","calcium_mg","zinc_mg","iodine_ug","selenium_ug","vitamin_d_ug","ala_g"]

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
    time_min: int = 20
    cost_eur: float = 2.5
    nutrients: Nutrients

class DayPlan(BaseModel):
    breakfast: Optional[str] = None
    lunch: Optional[str] = None
    dinner: Optional[str] = None
    snack: Optional[str] = None

class SolveRequest(BaseModel):
    recipes: List[Recipe]
    day_templates: List[DayPlan]
    targets: Nutrients
    weights: Dict[str, float] = {}
    dislikes: List[str] = []
    max_repeat: int = Field(2, ge=1, le=5)
    time_limit_sec: int = Field(25, ge=5, le=180)

@app.get("/health")
def health():
    return {"ok": True, "ts": time.time()}

@app.get("/healthz")
def healthz():
    """Health check endpoint matching frontend expectations"""
    return {"ok": True, "ts": time.time()}

@app.post("/solve")
def solve(req: SolveRequest):
    try:
        if not req.recipes or not req.day_templates:
            raise HTTPException(status_code=400, detail="recipes and day_templates required")

        # Filter recipes
        R = [r for r in req.recipes if r.id not in set(req.dislikes)]
        if not R:
            return {"status": "EMPTY_POOL", "plan": [{"breakfast": None, "lunch": None, "dinner": None, "snack": None} for _ in range(len(req.day_templates))]}

        days = len(req.day_templates)
        n = len(R)
        rid_index = {R[i].id: i for i in range(n)}

        solver = pywraplp.Solver.CreateSolver("CBC")
        if solver is None:
            raise RuntimeError("OR-Tools CBC solver unavailable")

        BIG = 2.0

        # Decision variables
        y = {}  # pick recipe
        z = {}  # portions of recipe i on (d,slot)
        for d in range(days):
            for s in SLOTS:
                for i in range(n):
                    y[d, s, i] = solver.BoolVar(f"y_{d}_{s}_{i}")
                    z[d, s, i] = solver.NumVar(0.0, BIG, f"z_{d}_{s}_{i}")

        # Choose at most 1 recipe per slot
        for d in range(days):
            for s in SLOTS:
                solver.Add(sum(y[d, s, i] for i in range(n)) <= 1)
                for i in range(n):
                    # Link z <= BIG * y
                    solver.Add(z[d, s, i] <= BIG * y[d, s, i])

        # Nutrient totals per day
        # val[d,k] = sum_{s,i} z[d,s,i] * nutrient_k[i]   (linear, car z est continu et multiplie un CONSTANTE)
        val = {(d,k): solver.NumVar(0.0, solver.infinity(), f"val_{d}_{k}") for d in range(days) for k in N_KEYS}
        for d in range(days):
            for k in N_KEYS:
                solver.Add(val[d,k] == sum(z[d, s, i] * getattr(R[i].nutrients, k) for s in SLOTS for i in range(n)))

        # Deviation variables around targets
        dev_pos = {(d,k): solver.NumVar(0.0, solver.infinity(), f"devp_{d}_{k}") for d in range(days) for k in N_KEYS}
        dev_neg = {(d,k): solver.NumVar(0.0, solver.infinity(), f"devn_{d}_{k}") for d in range(days) for k in N_KEYS}

        T = req.targets
        for d in range(days):
            for k in N_KEYS:
                target = max(0.0, getattr(T, k))
                low = 0.85 * target
                high = 1.15 * target
                solver.Add(val[d,k] - high <= dev_pos[d,k])
                solver.Add(low - val[d,k] <= dev_neg[d,k])

        # Max repeat of a recipe across the week
        for i in range(n):
            solver.Add(sum(y[d, s, i] for d in range(days) for s in SLOTS) <= req.max_repeat)

        # Mean time / cost (linear on y)
        mean_time = (1.0 / max(1, days)) * solver.Sum([y[d, s, i] * R[i].time_min for d in range(days) for s in SLOTS for i in range(n)])
        mean_cost = (1.0 / max(1, days)) * solver.Sum([y[d, s, i] * R[i].cost_eur for d in range(days) for s in SLOTS for i in range(n)])

        alpha = float(req.weights.get("nutri", 1.0))
        beta  = float(req.weights.get("time", 0.2))
        gamma = float(req.weights.get("cost", 0.2))

        nutri_term = solver.Sum([dev_pos[d,k] + dev_neg[d,k] for d in range(days) for k in N_KEYS])
        objective = solver.Sum([alpha * nutri_term, beta * mean_time, gamma * mean_cost])
        solver.Minimize(objective)

        solver.SetTimeLimit(int(req.time_limit_sec * 1000))
        status = solver.Solve()

        status_map = {
            pywraplp.Solver.OPTIMAL: "Optimal",
            pywraplp.Solver.FEASIBLE: "Feasible",
            pywraplp.Solver.INFEASIBLE: "Infeasible",
            pywraplp.Solver.UNBOUNDED: "Unbounded",
            pywraplp.Solver.ABNORMAL: "Abnormal",
            pywraplp.Solver.NOT_SOLVED: "NotSolved",
        }
        label = status_map.get(status, str(status))

        # Build solution
        plan = []
        for d in range(days):
            day = {}
            for s in SLOTS:
                chosen = None
                portions = 0.0
                for i in range(n):
                    if y[d, s, i].solution_value() > 0.5:
                        chosen = R[i].id
                        portions = z[d, s, i].solution_value()
                        break
                day[s] = {"recipeId": chosen, "servings": round(portions, 2)}
            plan.append(day)

        return {"status": label, "plan": plan}

    except Exception as e:
        # Return readable error to caller
        raise HTTPException(status_code=500, detail=f"{type(e).__name__}: {e}")
