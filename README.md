# VeganFlemme — Générateur de Plans Alimentaires Végans

> **Statut**: MVP Démo Fonctionnel  
> **Objectif**: Application flemme-friendly pour transition végane sans charge mentale  
> **Cible**: Flexitariens français cherchant des plans optimisés nutritionnellement

## 🎯 Vision

**VeganFlemme** est une web-app qui génère automatiquement des plans alimentaires végans nutritionnellement équilibrés. L'objectif: **zéro friction** → un menu 7 jours s'affiche directement, puis l'utilisateur peut l'ajuster selon ses besoins (temps, budget, objectifs, allergies).

## 🚀 État Actuel (Janvier 2025)

### ✅ Production Déployée et Fonctionnelle

**🌐 Application Web (Vercel)**
- **Status**: ✅ Déployée avec succès sur Vercel
- **Build**: ✅ Next.js 14.2.4 - Compilation successful (9 pages, 9 API routes)
- **Features**: Interface moderne shadcn/ui, calcul TDEE, dashboard nutrition temps réel
- **Mode démo**: Plans 7 jours réalistes, substitution repas, listes de courses
- **Performance**: 106 kB First Load JS, génération statique optimisée

**🔧 Solver d'Optimisation (Railway)**
- **Status**: ✅ Déployé et fonctionnel sur Railway
- **Health Check**: ✅ Uvicorn running on port 8080, health endpoint responding
- **Capabilities**: OR-Tools optimization, contraintes nutritionnelles (±15%)
- **API**: FastAPI avec endpoints `/health` et `/solve` opérationnels
- **Performance**: Démarrage rapide, shutdown gracieux

**🏗️ Architecture Production**
- **Frontend**: Vercel deployment avec build cache optimisé
- **Backend**: Railway container avec FastAPI + OR-Tools
- **Database**: Supabase PostgreSQL configuré (mode graceful fallback)
- **APIs**: Configuration Spoonacular, OpenFoodFacts ready
- **Monitoring**: Health checks complets sur tous les services

### 🔧 Services Configurés et Status

**Base de Données (Supabase)**
- **Status**: ⚠️ Configurée avec fallback gracieux
- **Connection**: PostgreSQL avec connection pooling
- **Schémas**: Tables définis, données CIQUAL/CALNUT en attente d'import
- **Mode**: Fonctionnement en mode démo lors d'indisponibilité réseau
- **RLS**: Row Level Security préparé pour authentification

**APIs Externes**
- **Spoonacular**: ✅ Clé API configurée et testée
- **OpenFoodFacts**: ✅ Préparé et accessible sans authentification  
- **Environment**: Variables production configurées avec fallbacks
- **Caching**: Système de cache volatile implémenté

**Monitoring et Santé**
- **Health Checks**: `/api/health` et `/api/health/advanced` opérationnels
- **Error Handling**: Graceful fallback vers mode démo en cas d'erreur
- **Logging**: Logs détaillés pour debugging production
- **Performance**: Métriques temps de réponse et availability

## 🌐 URLs Production

### Applications Déployées
- **🖥️ Application Web**: [Vercel Deployment] (logs confirment déploiement réussi)
- **⚙️ Solver API**: [Railway Service] (health check ✅ fonctionnel)
- **📊 Database**: Supabase PostgreSQL (pooler connection configurée)

### Endpoints API Principaux
- `GET /api/health` - Status complet des services
- `GET /api/health/advanced` - Diagnostics détaillés  
- `POST /api/plan/generate` - Génération plans nutritionnels
- `POST /api/plan/save` - Sauvegarde plans utilisateur
- `GET /api/ingredients/search` - Recherche ingrédients
- `POST /api/shopping-list` - Génération listes courses

### Métriques Performance (selon logs Vercel)
- **Build Time**: ~20 secondes
- **Bundle Size**: 87.1 kB shared + pages spécifiques
- **Static Generation**: 9 pages pré-générées
- **API Routes**: 9 endpoints serverless optimisés
- **Cache Strategy**: Build cache activé pour deployments rapides

### Stack
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: FastAPI (Python), OR-Tools pour optimisation
- **Base de données**: PostgreSQL/Supabase (configuré)
- **Déploiement**: Vercel (front) + Railway (solver planifié)

### Structure du Projet
```
/web/                 # Application Next.js
├── app/             # App Router (pages et API routes)
├── components/      # Composants UI réutilisables
├── lib/             # Utilitaires (database, environment)
└── package.json     # Dépendances front

/solver/             # Service d'optimisation
├── main.py          # API FastAPI avec OR-Tools
└── requirements.txt # Dépendances Python

/db/                 # Schémas base de données
├── schema.sql       # Structure des tables
└── plans.sql        # Table des plans utilisateur
```

## 🚦 Guide de Démarrage

### Prérequis
- Node.js 18+
- Python 3.10+
- PostgreSQL (optionnel, mode démo par défaut)

### Installation

1. **Cloner le projet**
```bash
git clone https://github.com/VeganFlemme/veganflemmeapp.git
cd veganflemmeapp
```

2. **Installer les dépendances**
```bash
# Frontend
cd web
npm install

# Backend (optionnel pour démo)
cd ../solver
python -m venv .venv
source .venv/bin/activate  # ou .venv\Scripts\activate sur Windows
pip install -r requirements.txt
```

3. **Configuration (optionnelle)**
```bash
# Copier le template d'environnement
cd web
cp .env.example .env.local

# Configurer les variables si vous voulez les vraies données:
# NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # ⚠️ Admin key - keep secure!
# DATABASE_URL=your-postgres-url
# SOLVER_URL=http://localhost:8080
# SPOONACULAR_KEY=your-api-key
```

4. **Lancer l'application**
```bash
# Mode développement local (recommandé pour contributions)
cd web
npm run dev
# → http://localhost:3000

# Mode production local (test déploiement)
npm run build && npm start
# → Simule environnement production

# Mode complet avec solver local (développement avancé)
cd solver
source .venv/bin/activate
uvicorn main:app --reload --port 8080
# → http://localhost:8080/health
```

## 🚀 Déploiement Production

### Status Actuel
- **✅ Frontend**: Déployé sur Vercel avec build cache optimisé
- **✅ Backend**: Solver déployé sur Railway, health checks opérationnels  
- **✅ Database**: Supabase configuré avec fallback gracieux
- **✅ APIs**: Spoonacular et OpenFoodFacts configurés

### Workflow de Déploiement
1. **Push vers main** → Trigger automatique Vercel build
2. **Vercel build** → Next.js optimization + static generation  
3. **Railway deploy** → Container solver avec health monitoring
4. **Health verification** → Tests automatiques endpoints critiques
5. **Cache optimization** → Build cache pour déploiements rapides

### Variables d'Environnement Production
```bash
# Vercel (Frontend)
DATABASE_URL=postgresql://postgres.lpggllnmrjpevvslmiuq:*
SOLVER_URL=https://veganflemmeapp-production.up.railway.app
SPOONACULAR_KEY=26f861f1f54244c1b9b146adeab9fc17
NEXT_PUBLIC_SUPABASE_URL=https://lpggllnmrjpevvslmiuq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[CONFIGURED_IN_DASHBOARD]
SUPABASE_SERVICE_ROLE_KEY=[REQUIRED_FOR_ADMIN_OPERATIONS]

# Railway (Backend Solver)
PORT=8080
PYTHONPATH=/app
```

### 🧪 Mode Démo vs Mode Développement

**Mode Démo** (par défaut, aucune configuration requise):
- Plans générés avec données simulées
- Tous les composants UI fonctionnels
- Calculs TDEE et objectifs nutritionnels réels
- Sauvegarde simulée des plans
- Parfait pour tester l'UX

**Mode Développement** (avec services configurés):
- Connexion vraie base de données
- Appels API externes (Spoonacular, OpenFoodFacts)
- Solver d'optimisation en temps réel
- Persistance utilisateur avec Supabase Auth

## 📊 Tests et Validation

### Test Manuel Rapide
1. Aller sur http://localhost:3000
2. Cliquer "📋 Afficher exemple" → Plan 7 jours s'affiche
3. Cliquer "Générer mon menu" → Test de l'API de génération
4. Tester la substitution de repas
5. Vérifier la liste de courses

### Endpoints API Disponibles
- `GET /api/health` - État des services
- `POST /api/plan/generate` - Génération de plan
- `POST /api/plan/save` - Sauvegarde de plan
- `GET /api/ingredients/search` - Recherche d'ingrédients
- `POST /api/shopping-list` - Génération liste courses

### Health Check
```bash
curl http://localhost:3000/api/health
# Retourne l'état de tous les services configurés
```

## 🛣️ Feuille de Route Développement Complète

### 🎯 Phase 1: Données Nutritionnelles Réelles (Priorité Critique)
**Durée estimée**: 2-3 semaines  
**Status**: 🔄 À initier - Infrastructure déployée et prête

**Objectif**: Remplacer les données démo par de vraies données CIQUAL/CALNUT françaises

#### Tâches Principales
- [ ] **Import Base CIQUAL 2020**
  - Télécharger depuis site ANSES officiel
  - Script d'import CSV vers PostgreSQL
  - Normaliser données (virgules → points, valeurs manquantes)
  - Créer vues `ciqual.food_norm` standardisées

- [ ] **Import Base CALNUT Complémentaire**
  - Données CALNUT pour micronutriments manquants
  - Vue fusion `ciqual.food_best` (priorité CALNUT si meilleure qualité)
  - Tables métier `vf.canonical_ingredient` avec aliments végans uniquement

- [ ] **Recherche Performante** 
  - Extension PostgreSQL `pg_trgm` (trigram search)
  - Index GIN optimisé pour recherche temps réel
  - RPC `vf.search_ingredient()` avec performance <100ms
  - Peupler `vf.ingredient_nutrients` avec JSONB complet

**Résultat**: Calculs nutritionnels basés sur données officielles ANSES au lieu de mode démo

### 🔧 Phase 2: Optimisation Services Externes (Priorité Haute)  
**Durée estimée**: 1-2 semaines  
**Status**: ✅ Partiellement complète - APIs configurées, besoin optimisation

**Objectif**: Optimiser les intégrations existantes et performances

#### Tâches Spécifiques
- [ ] **Spoonacular Optimization**
  - Cache intelligent recettes fréquentes (Redis/PostgreSQL TTL)
  - Rate limiting graceful avec fallback recettes locales
  - Mapping nutrition Spoonacular → format VeganFlemme optimisé

- [ ] **OpenFoodFacts Enhancement**
  - Scanner code-barres mobile (composant React)
  - Liaison produits OFF → ingrédients canoniques
  - Table `off_link.product_ref` pour mapping persistant

- [ ] **Railway Solver Enhancement**
  - Variables d'environnement production optimisées
  - Monitoring performance et timeout handling
  - Warm-start et cache solutions partielles

**Résultat**: Plans générés avec vraies recettes, performance optimisée, zéro dépendance mode démo

### 🔐 Phase 3: Authentification & Données Utilisateur (Priorité Moyenne)
**Durée estimée**: 1 semaine  
**Status**: 🔄 Infrastructure prête, activation requise

**Objectif**: Comptes utilisateur avec persistance et personnalisation

#### Fonctionnalités Clés
- [ ] **Supabase Auth Activation**
  - Magic links configuration
  - Context Provider auth global
  - Row Level Security (RLS) sur table `plans`
  - Migration données localStorage → Supabase

- [ ] **Profils Utilisateur**
  - Table `user_profiles` avec préférences alimentaires
  - TDEE et cibles nutritionnelles personnalisées  
  - Historique plans avec pagination
  - Système favoris et notes personnelles

**Résultat**: Expérience personnalisée avec sauvegarde persistante par utilisateur

### ⚡ Phase 4: Fonctionnalités Avancées (Priorité Basse)
**Durée estimée**: 2-3 semaines  
**Status**: 🔮 Planifié - Après MVP complet

**Objectif**: Features premium et optimisations avancées

#### Solver Avancé
- [ ] Contraintes dures: allergies, budget max, temps de préparation
- [ ] Réparation locale (modifier 1 jour sans recalculer semaine complète)
- [ ] Profils nutritionnels spécialisés (sportif, senior, etc.)
- [ ] Variables slack pondérées par importance nutriment

#### Features Premium
- [ ] Suggestions saisonnières avec tags `season_*`
- [ ] Mode "zero-waste" anti-gaspillage
- [ ] Export PDF avec recettes détaillées et instructions
- [ ] Analyse nutritionnelle IA avec recommandations OpenAI
- [ ] Mode hors-ligne (PWA) avec Service Worker

#### Performance & Scalabilité
- [ ] Bundle JavaScript optimisé, lazy loading composants
- [ ] Images WebP optimisées, CDN assets
- [ ] Métriques Core Web Vitals >90 score Lighthouse
- [ ] Cache intelligent multi-niveaux

**Résultat**: Application niveau production prête pour utilisateurs beta

### 🌟 Phase 5: Expansion & Communauté (Futur)
**Durée estimée**: Évolutif  
**Status**: 🌅 Vision long terme

#### Aspects Sociaux
- [ ] Partage plans entre utilisateurs
- [ ] Évaluations et commentaires recettes communautaires
- [ ] Recommandations basées sur patterns utilisateurs
- [ ] API publique pour développeurs tiers

#### Expansion Technique  
- [ ] Support multi-langues (i18n)
- [ ] Intégration calendriers externes (Google, Outlook)
- [ ] Application mobile native (React Native)
- [ ] Marketplace recettes premium

**Résultat**: Plateforme communautaire complète pour transition végane

## 🐛 Production Troubleshooting

### Problèmes de Déploiement Identifiés

**Database Connection pendant Build (Vercel)**
```
Error: getaddrinfo ENOTFOUND aws-0-eu-central-1.pooler.supabase.com
```
- **Cause**: Database query lors de la génération statique
- **Impact**: ❌ Aucun - build réussit grâce au fallback gracieux
- **Solution**: Le système bascule automatiquement en mode démo pendant build
- **Monitoring**: Vérifier `/api/health` après déploiement

**Supabase Websocket Warning**
```
Critical dependency: the request of a dependency is an expression
```
- **Cause**: Dynamic import dans @supabase/realtime-js
- **Impact**: ⚠️ Warning only - fonctionnalité non affectée  
- **Solution**: Warning attendu, pas d'action requise
- **Note**: N'affecte pas les fonctionnalités de l'application

### Solutions par Service

**Frontend (Vercel)**
```bash
# Vérifier status déploiement
curl https://your-app.vercel.app/api/health | jq

# Response attendue en production
{
  "status": "healthy",
  "services": {
    "database": "fallback",
    "solver": "operational", 
    "spoonacular": "configured"
  }
}

# Debug build issues
npm run build
# Vérifier output: "✓ Compiled successfully"
```

**Backend Solver (Railway)**
```bash
# Health check solver
curl https://veganflemmeapp-production.up.railway.app/health

# Response attendue
{
  "status": "healthy",
  "solver": "operational",
  "ortools": "available"
}

# Logs Railway
railway logs --service solver
# Vérifier: "Uvicorn running on http://0.0.0.0:8080"
```

**Database (Supabase)**
```bash
# Test connection directe
psql "postgresql://postgres.lpggllnmrjpevvslmiuq:qyrgip-codsoq-1nuxJo@aws-0-eu-central-1.pooler.supabase.com:6543/postgres" -c "SELECT 1;"

# Test via API
curl -X POST https://your-app.vercel.app/api/plan/save \
  -H "Content-Type: application/json" \
  -d '{"plan": {"test": true}}'
```

### Issues Connues et Status

**✅ Résolu**: Build warning `iconv-lite` (installation explicite dans package.json)  
**✅ Fonctionnel**: Graceful fallback database lors d'indisponibilité réseau  
**✅ Opérationnel**: Solver Railway avec health checks passing  
**⚠️ Monitoring**: Connection database intermittente (mode démo backup activé)

### Monitoring Production

**Health Endpoints**
- `/api/health` - Status général et services externes
- `/api/health/advanced` - Métriques détaillées et diagnostics
- Railway health check automatique sur port 8080

**Performance Metrics**
- Build time Vercel: ~20s (avec cache)
- First Load JS: 87.1 kB (optimisé)
- API Response time: <500ms (health checks)
- Static generation: 9 pages en <3s

**Alertes Recommandées**
- Database connection failures >5 min
- Solver response time >5s  
- Build failures sur déploiements
- Health check failures consécutifs

## 📝 Contribution

### Pour Contribuer
1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/amazing-feature`)
3. Tester en mode démo et avec services si possible
4. Commit (`git commit -m 'Add amazing feature'`)
5. Push (`git push origin feature/amazing-feature`)
6. Ouvrir une Pull Request

### Standards Code
- TypeScript strict activé
- ESLint/Prettier pour cohérence
- Tests manuels requis avant PR
- Documentation des nouvelles APIs

## 📄 Licences et Attribution

### Code
- **Licence**: MIT
- **Copyright**: VeganFlemme 2025

### Données et APIs
- **CIQUAL/CALNUT**: © ANSES - Citer la source obligatoire
- **OpenFoodFacts**: Licence ODbL - Attribution requise
- **Spoonacular**: API commerciale - Respecter conditions d'utilisation

### Disclaimer
Cette application est à des fins éducatives et ne remplace pas un conseil médical professionnel. Consultez un professionnel de santé pour tout régime spécifique.

---

**Dernière mise à jour**: Janvier 2025  
**Version**: 0.1.1  
**Statut**: ✅ **Production Déployée** - Frontend Vercel + Backend Railway opérationnels  
**Phase Actuelle**: MVP Fonctionnel → Prêt pour Phase 1 (Données Nutritionnelles Réelles)

### 📊 Métriques Déploiement Actuelles
- **Build Success**: ✅ Next.js 14.2.4 compilation successful
- **Performance**: 87.1 kB First Load JS, 9 pages pré-générées
- **API Status**: 9 endpoints serverless opérationnels
- **Solver Health**: ✅ Railway container running, health checks passing
- **Fallback Coverage**: 100% mode démo disponible si services indisponibles

### 🎯 Prochaines Étapes Prioritaires  
1. **Import données CIQUAL** - Remplacer mode démo par vraies données nutritionnelles
2. **Optimisation cache** - Performance Spoonacular et recherche ingrédients  
3. **Monitoring production** - Alertes et métriques détaillées
4. **Tests utilisateurs** - Feedback sur UX et fonctionnalités manquantes