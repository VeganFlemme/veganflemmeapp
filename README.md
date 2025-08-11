# VeganFlemme — Générateur de Plans Alimentaires Végans

> **Statut**: MVP Démo Fonctionnel  
> **Objectif**: Application flemme-friendly pour transition végane sans charge mentale  
> **Cible**: Flexitariens français cherchant des plans optimisés nutritionnellement

## 🎯 Vision

**VeganFlemme** est une web-app qui génère automatiquement des plans alimentaires végans nutritionnellement équilibrés. L'objectif: **zéro friction** → un menu 7 jours s'affiche directement, puis l'utilisateur peut l'ajuster selon ses besoins (temps, budget, objectifs, allergies).

## 🚀 État Actuel (Janvier 2025)

### ✅ Ce qui fonctionne maintenant

**Application Web (Next.js)**
- Interface moderne avec shadcn/ui et Tailwind CSS
- Onboarding utilisateur avec calcul TDEE (Mifflin-St Jeor)
- Dashboard nutrition avec barres de progression temps réel
- Mode démo complet avec plans 7 jours réalistes
- Système de substitution de repas (interface)
- Génération de listes de courses (démo)
- Build successful sans erreurs

**Solver d'Optimisation (FastAPI)**
- API FastAPI fonctionnelle avec endpoint `/health` et `/solve`
- Optimisation linéaire multi-objectifs avec OR-Tools
- Contraintes nutritionnelles (±15% des cibles)
- Optimisation temps/coût/nutrition
- Contrainte max_repeat pour éviter répétitions

**Architecture**
- Séparation front/back propre
- API routes Next.js pour orchestration
- Système d'environnement avec fallbacks gracieux
- Configuration pour Supabase, PostgreSQL, services externes

### ⚠️ Ce qui est en développement/manquant

**Base de Données**
- Schémas définis mais données CIQUAL/CALNUT non importées
- Tables créées mais vides (canonical_ingredient, recipes)
- Recherche d'ingrédients fonctionne en mode démo uniquement
- Pas de vraies données nutritionnelles françaises

**Services Externes**
- Intégration Spoonacular codée mais nécessite clés API
- OpenFoodFacts préparé mais non connecté
- Solver local uniquement (pas déployé sur Railway)
- Supabase configuré mais sans données

**Fonctionnalités Avancées**
- Authentification Supabase préparée mais non activée
- Export PDF implémenté mais nécessite données réelles
- Calculs nutritionnels basés sur données démo
- Pas de persistance utilisateur réelle

## 🏗️ Architecture Technique

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
# DATABASE_URL=your-postgres-url
# SOLVER_URL=http://localhost:8080
# SPOONACULAR_KEY=your-api-key
```

4. **Lancer l'application**
```bash
# Mode démo (recommandé)
cd web
npm run dev
# → http://localhost:3000

# Mode complet avec solver (optionnel)
cd solver
source .venv/bin/activate
uvicorn main:app --reload --port 8080
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

## 🛣️ Roadmap Développement

### 🎯 Phase 1: Données Nutritionnelles (Priorité Haute)
**Objectif**: Remplacer les données démo par de vraies données CIQUAL/CALNUT

**Tâches**:
- [ ] Importer base CIQUAL 2020 dans PostgreSQL
- [ ] Importer base CALNUT complémentaire
- [ ] Créer vue fusionnée `ciqual.food_best`
- [ ] Peupler table `vf.canonical_ingredient` avec données françaises
- [ ] Implémenter recherche d'ingrédients avec index trigram
- [ ] Ajouter données nutritionnelles /100g dans `vf.ingredient_nutrients`
- [ ] Tester RPC `vf.search_ingredient()` avec vraies données

**Résultat**: Calculs nutritionnels basés sur données officielles ANSES

### 🔧 Phase 2: Services Externes (Priorité Haute)
**Objectif**: Connecter APIs externes pour recettes et produits

**Tâches**:
- [ ] Configurer et tester API Spoonacular
- [ ] Implémenter cache des recettes (éviter stockage permanent)
- [ ] Intégrer OpenFoodFacts pour scan produits
- [ ] Déployer solver FastAPI sur Railway
- [ ] Configurer variables d'environnement production
- [ ] Tester génération de plans avec vraies recettes

**Résultat**: Plans générés avec vraies recettes et produits

### 🔐 Phase 3: Authentification & Persistance (Priorité Moyenne)
**Objectif**: Comptes utilisateur et sauvegarde persistante

**Tâches**:
- [ ] Activer Supabase Auth (magic links)
- [ ] Implémenter RLS (Row Level Security) sur table `plans`
- [ ] Ajouter profils utilisateur avec préférences
- [ ] Historique des plans par utilisateur
- [ ] Système de favoris et notes personnelles
- [ ] Migration données démo vers comptes réels

**Résultat**: Expérience personnalisée avec données sauvegardées

### ⚡ Phase 4: Optimisations Avancées (Priorité Basse)
**Objectif**: Fonctionnalités avancées et performance

**Tâches**:
- [ ] Solver avec contraintes allergies/budget/temps
- [ ] Réparation locale (modification d'un jour sans refaire la semaine)
- [ ] Suggestions saisonnières et locales
- [ ] Export PDF avec recettes détaillées
- [ ] Analytics nutritionnelles avec recommandations IA
- [ ] Mode hors-ligne (PWA)

**Résultat**: Application complète niveau production

### 🌟 Phase 5: Fonctionnalités Communautaires (Futur)
**Objectif**: Aspect social et expansion

**Tâches**:
- [ ] Partage de plans entre utilisateurs
- [ ] Évaluations et commentaires recettes
- [ ] Recommandations basées sur communauté
- [ ] API publique pour développeurs tiers
- [ ] Intégration calendriers externes
- [ ] Support multi-langues

## 🐛 Troubleshooting

### Problèmes Fréquents

**L'app ne démarre pas**
```bash
cd web && npm install
# Vérifier Node.js version >= 18
```

**Erreur de build**
```bash
# Nettoyer les caches
rm -rf .next node_modules
npm install
npm run build
```

**Solver non accessible**
```bash
# Vérifier que le solver tourne
curl http://localhost:8080/health
# Démarrer si nécessaire
cd solver && uvicorn main:app --reload --port 8080
```

**Variables d'environnement**
```bash
# Vérifier la configuration
curl http://localhost:3000/api/health
# Mode démo fonctionne toujours sans configuration
```

### Issues Connues
- Build warning `iconv-lite` (résolu avec installation explicite)
- Timeout Spoonacular sans clé API (normal, mode démo utilisé)
- Connexion base données échoue gracieusement vers mode démo

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
**Statut**: MVP Démo → Prêt pour Phase 1 (Données Nutritionnelles)