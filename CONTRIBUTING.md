# Guide de Contribution - VeganFlemme

## 🎯 Objectif du Projet

VeganFlemme vise à **simplifier la transition végane** en automatisant la planification nutritionnelle. Notre priorité: **zéro friction** pour l'utilisateur final.

## 🚀 Comment Contribuer

### 1. Pour Commencer

**Setup de base**:
```bash
# Fork + clone
git clone https://github.com/YOUR-USERNAME/veganflemmeapp.git
cd veganflemmeapp

# Installation
cd web && npm install
cd ../solver && python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt

# Test mode démo
cd web && npm run dev
# → http://localhost:3000
```

**Premier test**:
- Interface s'affiche sans erreur
- Clic "📋 Afficher exemple" montre plan 7 jours
- Clic "✨ Générer mon menu" déclenche API call
- Health check: `curl http://localhost:3000/api/health`

### 2. Types de Contributions

#### 🐛 Bug Reports
**Template issue**:
```markdown
**Bug**: Description claire
**Steps**: 1. Faire X, 2. Voir Y
**Expected**: Devrait faire Z
**Environment**: OS, browser, mode (démo/dev)
**Screenshots**: Si applicable
```

#### ✨ Nouvelles Features
**Avant de coder**:
1. Créer issue avec proposition design
2. Discuter approche avec maintainers
3. Vérifier cohérence avec roadmap
4. Commencer par mode démo si applicable

#### 📊 Données & Nutrition
**Expertise bienvenue**:
- Validation données CIQUAL/CALNUT
- Recommandations nutritionnelles
- Sources alimentaires véganes
- Contraintes d'optimisation realistes

#### 🎨 UX/UI Improvements
**Guidelines**:
- Respecter système shadcn/ui existant
- Mobile-first design
- Accessibilité (WCAG)
- Cohérence visuelle

### 3. Standards Techniques

#### Code Style
```typescript
// TypeScript strict activé
// Noms explicites, pas d'abbréviations
const userProfileData = getUserProfile() // ✅
const upd = getUP() // ❌

// Composants fonctionnels avec hooks
export function MealPlanView({ plan }: { plan: PlanDay[] }) {
  // Interface props explicite
}

// Gestion d'erreur systématique
try {
  const result = await apiCall()
  return { success: true, data: result }
} catch (error) {
  return { success: false, error: error.message }
}
```

#### Structure Commits
```bash
# Format: type(scope): description
feat(solver): add allergy constraints support
fix(ui): meal substitution button click handler
docs(readme): update installation instructions
refactor(api): extract common validation logic
```

#### Tests Requis
**Avant chaque PR**:
- [ ] `npm run build` success
- [ ] Mode démo fonctionne end-to-end
- [ ] API health check OK
- [ ] Tests manuels sur changements UI
- [ ] Performance acceptable (build <30s, load <2s)

### 4. Workflow Contribution

#### Branch Strategy
```bash
# Créer branche depuis main
git checkout main
git pull origin main
git checkout -b feature/amazing-feature

# Développer, commiter
git add .
git commit -m "feat(scope): description"

# Push et PR
git push origin feature/amazing-feature
# Créer PR via GitHub UI
```

#### Review Process
**Auto-review checklist**:
- [ ] Code fonctionne en mode démo
- [ ] Pas de breaking changes non intentionnels
- [ ] Documentation mise à jour si nécessaire
- [ ] Commits atomiques et well-named
- [ ] Screenshots pour changements UI

**Reviewer checklist**:
- [ ] Code review complet
- [ ] Test manuel des changements
- [ ] Vérification cohérence architecture
- [ ] Feedback constructif avec suggestions

### 5. Domaines d'Expertise Recherchés

#### 🥗 Nutrition Végane
- Validation équilibres nutritionnels
- Sources véganes de micronutriments
- Recommandations par profil (sportif, enfant, etc.)
- Interactions nutriments/absorption

#### 🔬 Optimisation Mathématique
- Amélioration algorithmes OR-Tools
- Contraintes multi-objectifs
- Performance solver grandes instances
- Warm-start et heuristiques

#### 📱 UX/Product Design
- Simplification workflows
- Design patterns accessibilité
- Mobile UX optimization
- User research et feedback

#### ⚡ Performance Web
- Bundle optimization
- Rendering performance
- Caching strategies
- Progressive Web App features

#### 🗄️ Data Engineering
- Import gros volumes (CIQUAL)
- Optimisation requêtes PostgreSQL
- ETL pipelines
- Data validation et monitoring

### 6. Guidelines Spécifiques

#### Données Nutritionnelles
```typescript
// Format standard nutriments (jamais changer clés)
interface Nutrients {
  energy_kcal: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
  b12_ug: number
  vitamin_d_ug: number
  calcium_mg: number
  iron_mg: number
  zinc_mg: number
  iodine_ug: number
  selenium_ug: number
  ala_g: number
}

// Sources officielles prioritaires
// 1. CIQUAL (ANSES) - France
// 2. CALNUT - Europe
// 3. USDA - USA en dernier recours
```

#### Mode Démo vs Production
```typescript
// TOUJOURS implémenter fallback démo
export async function searchIngredients(query: string) {
  try {
    // Try real database first
    const result = await database.search(query)
    if (result.success) return result
    
    // Fallback to demo data
    return getDemoIngredients(query)
  } catch {
    return getDemoIngredients(query)
  }
}
```

#### API Contracts
```typescript
// Respecter contrats existants
// POST /api/plan/generate
interface GenerateRequest {
  targets: Nutrients // Obligatoire
  maxTime?: number   // Optionnel
  dislikes?: string[] // Optionnel
}

interface GenerateResponse {
  ok: boolean
  plan?: PlanDay[]
  error?: string
  source: 'database' | 'demo' | 'error'
}
```

### 7. Ressources Utiles

#### Documentation
- [shadcn/ui Components](https://ui.shadcn.com/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Supabase Client](https://supabase.com/docs/reference/javascript)
- [OR-Tools Python](https://developers.google.com/optimization/cp/cp_solver)

#### APIs Externes
- [CIQUAL ANSES](https://ciqual.anses.fr/)
- [Spoonacular Recipe API](https://spoonacular.com/food-api/docs)
- [OpenFoodFacts API](https://world.openfoodfacts.org/data)

#### Nutrition Végane
- [Position AND](https://www.jandonline.org/article/S2212-2672(16)31192-3/fulltext) - Académie Nutrition & Diététique
- [Vegan Society B12](https://www.vegansociety.com/resources/nutrition-and-health/nutrients/vitamin-b12)
- [Table CALNUT](http://www.calnut.org/)

### 8. Communication

#### Discord/Slack (si configuré)
- `#general` - Discussion générale
- `#dev` - Questions techniques
- `#nutrition` - Validation données nutritionnelles
- `#design` - UX/UI feedback

#### GitHub Issues
- Utiliser labels appropriés
- Template issues pour bug reports
- Feature requests avec justification
- Link PRs aux issues

#### Code Reviews
- Bienveillant et constructif
- Suggestions avec exemples
- Explain "why" pas seulement "what"
- Célébrer bonnes contributions

---

## 🙏 Merci de Contribuer!

Chaque contribution, petite ou grande, aide à rendre la transition végane plus accessible. Ensemble, nous créons un outil qui peut **vraiment changer la vie** des gens.

**Questions?** Ouvrez une issue avec label `question` ou contactez les maintainers.

**Première contribution?** Commencez par issues labeled `good-first-issue` ou `help-wanted`.

---

**Dernière mise à jour**: Janvier 2025  
**Document vivant**: Amélioré par feedback contributeurs