# VeganFlemme — Générateur de Plans Alimentaires Végans

> **Statut**: MVP Démo Fonctionnel  
> **Objectif**: Application flemme-friendly pour transition végane sans charge mentale  
> **Cible**: Flexitariens français cherchant des plans optimisés nutritionnellement

## 🎯 Vision

**VeganFlemme** est une web-app qui génère automatiquement des plans alimentaires végans nutritionnellement équilibrés. L'objectif: **zéro friction** → un menu 7 jours s'affiche directement, puis l'utilisateur peut l'ajuster selon ses besoins (temps, budget, objectifs, allergies).

## 🚀 État Actuel (Janvier 2025)

### ✅ Ce qui Fonctionne (Mode Démo)

**🎨 Interface Utilisateur**
- ✅ Application Next.js 14 moderne avec shadcn/ui
- ✅ Calcul TDEE scientifique (équation Mifflin-St Jeor)
- ✅ Dashboard nutrition temps réel avec barres de progression
- ✅ Génération de plans 7 jours avec recettes réalistes
- ✅ Interface substitution de repas
- ✅ Génération listes de courses avec calculs de quantités
- ✅ Export PDF des listes de courses
- ✅ Design responsive mobile/desktop

**⚙️ Backend & API**
- ✅ Solver d'optimisation mathématique (OR-Tools) intégré
- ✅ API FastAPI pour résolution de contraintes nutritionnelles
- ✅ 9 endpoints API fonctionnels avec gestion d'erreurs
- ✅ Health check système avec diagnostics
- ✅ Fallback gracieux vers mode démo si services indisponibles

**🏗️ Architecture**
- ✅ Build Next.js réussi (87.1 kB shared bundle)
- ✅ TypeScript strict avec interfaces cohérentes
- ✅ Séparation frontend/backend propre
- ✅ Gestion d'environnement flexible

### 🔧 Ce qui est Configuré mais Pas Encore Connecté

**Base de Données (Supabase PostgreSQL)**
- ⚠️ Schémas définis mais tables vides
- ⚠️ Fonctions de recherche préparées mais non peuplées
- ⚠️ Système d'authentification configuré mais inactif

**APIs Externes**
- ⚠️ Spoonacular: Clé API disponible mais non utilisée en production
- ⚠️ OpenFoodFacts: Intégration préparée mais non connectée
- ⚠️ Railway: Solver non déployé (fonctionne localement)

## 🌐 URLs Actuelles

### Application Locale
- **🖥️ Développement**: `http://localhost:3000` (après `npm run dev`)
- **⚙️ Health Check**: `http://localhost:3000/api/health`
- **📊 API Documentation**: Endpoints disponibles mais mode démo uniquement

### URLs Production (À Configurer)
- **Frontend**: Prêt pour Vercel deployment
- **Solver**: Prêt pour Railway deployment
- **Database**: Supabase configuré mais vide

## 🚦 Guide de Démarrage

### Prérequis
- Node.js 18+
- Python 3.10+ (pour solver en local)
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
# Mode développement (recommandé)
cd web
npm run dev
# → http://localhost:3000

# Mode production local (test déploiement)
npm run build && npm start

# Mode complet avec solver local (développement avancé)
cd solver
source .venv/bin/activate
uvicorn main:app --reload --port 8080
# → http://localhost:8080/health
```

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

## 🛣️ Feuille de Route

### 🎯 Phase 1: Données Nutritionnelles Réelles (Priorité Critique)
**Durée estimée**: 2-3 semaines  
**Status**: 🔄 À initier

**Objectif**: Remplacer les données démo par de vraies données CIQUAL/CALNUT françaises

- [ ] Import Base CIQUAL 2020 (télécharger depuis site ANSES)
- [ ] Script d'import CSV vers PostgreSQL  
- [ ] Import Base CALNUT complémentaire
- [ ] Recherche performante avec index trigram
- [ ] Peuplement ingrédients canoniques végans

**Résultat**: Calculs nutritionnels basés sur données officielles ANSES

### 🔧 Phase 2: Services Externes (Priorité Haute)
**Durée estimée**: 1-2 semaines  
**Status**: ⚠️ Partiellement configuré

**Objectif**: Connecter APIs externes et déployer solver

- [ ] Déploiement solver FastAPI sur Railway
- [ ] Activation Spoonacular pour vraies recettes
- [ ] Intégration OpenFoodFacts pour produits
- [ ] Cache intelligent et optimisation performance

**Résultat**: Plans avec vraies recettes, zéro dépendance mode démo

### 🔐 Phase 3: Authentification & Persistance (Priorité Moyenne)
**Durée estimée**: 1 semaine  
**Status**: 🔄 Infrastructure prête

**Objectif**: Comptes utilisateur avec sauvegarde

- [ ] Activation Supabase Auth (Magic Links)
- [ ] Row Level Security sur données utilisateur
- [ ] Profils avec préférences alimentaires
- [ ] Historique plans avec pagination

**Résultat**: Expérience personnalisée persistante

### ⚡ Phase 4: Fonctionnalités Avancées (Priorité Basse)
**Durée estimée**: 2-3 semaines  
**Status**: 🔮 Planifié

**Objectif**: Features premium et optimisations

- [ ] Contraintes avancées (allergies, budget, temps)
- [ ] Suggestions saisonnières et anti-gaspillage
- [ ] Analyse nutritionnelle IA avec recommandations
- [ ] Mode hors-ligne (PWA)

**Résultat**: Application production-ready

## 🧪 Mode Démo vs Mode Développement

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

## 🛠️ Stack Technique

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **UI**: Tailwind CSS + shadcn/ui
- **Components**: Radix UI primitives

### Backend
- **API**: Next.js API routes + FastAPI (Python)
- **Solver**: OR-Tools pour optimisation linéaire
- **Database**: PostgreSQL/Supabase

### Hébergement
- **Frontend**: Vercel (configuré)
- **Backend**: Railway (préparé)
- **Database**: Supabase (configuré)

### Structure du Projet
```
./web/                 # Application Next.js
├── app/             # App Router (pages et API routes)
├── components/      # Composants UI réutilisables
├── lib/             # Utilitaires (database, environment)
└── package.json     # Dépendances front

./solver/             # Service d'optimisation
├── main.py          # API FastAPI avec OR-Tools
└── requirements.txt # Dépendances Python

./db/                 # Schémas base de données
├── schema.sql       # Structure des tables
└── plans.sql        # Table des plans utilisateur
```

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
**Statut**: ✅ **MVP Démo Fonctionnel** - Prêt pour Phase 1 (Données Nutritionnelles Réelles)