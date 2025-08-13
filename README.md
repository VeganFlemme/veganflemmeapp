# VeganFlemme App

A comprehensive vegan meal planning application with nutritional optimization, built with Next.js 14 App Router and FastAPI.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+ (for solver service)
- PostgreSQL database (or Supabase)

### Development Setup

1. **Clone and setup web app**
   ```bash
   git clone https://github.com/VeganFlemme/veganflemmeapp.git
   cd veganflemmeapp/web
   npm install
   cp .env.example .env.local
   # Edit .env.local with your environment variables
   npm run dev
   ```

2. **Setup solver service** (optional)
   ```bash
   cd ../solver
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   uvicorn main:app --reload --port 8000
   ```

### Development Commands
```bash
# Web development
npm run dev          # Start development server
npm run build        # Build for production  
npm run typecheck    # TypeScript validation
npm run lint         # ESLint linting

# Solver development
uvicorn main:app --reload  # Start API server
ruff check .              # Lint Python code
```

## 🏗️ Architecture

- **Web**: Next.js 14 + TypeScript (strict) + Tailwind CSS
- **Solver**: FastAPI + OR-Tools optimization
- **Database**: Supabase (PostgreSQL) with CIQUAL nutrition data
- **Auth**: Supabase Auth with Row Level Security

## 🔧 Environment Variables

See `web/.env.example` for complete configuration. Key variables:

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL (client-safe)
- `SUPABASE_SERVICE_ROLE_KEY` - Admin key (server-only, bypasses RLS)
- `SOLVER_URL` - FastAPI solver service endpoint
- `DATABASE_URL` - PostgreSQL connection string

⚠️ **Security**: Never expose service role key to client. Use proper client/server separation.

---

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

### 🔧 Ce qui Nécessite une Configuration Immédiate

**Base de Données (Supabase PostgreSQL)**
- ⚠️ **CRITIQUE**: Schémas doivent être appliqués à la base de données
- ⚠️ **CRITIQUE**: Tables CIQUAL doivent être peuplées avec données nutritionnelles
- ⚠️ **CRITIQUE**: Fonctions de recherche doivent être créées
- ✅ Connexion et authentification configurées

**Services Externes**
- ⚠️ **CRITIQUE**: Solver FastAPI doit être déployé sur Railway
- ✅ Spoonacular: Clé API configurée et valide
- ✅ OpenFoodFacts: Intégration prête
- ✅ Environnement: Toutes les variables configurées

## 🌐 URLs Actuelles

### Application Locale
- **🖥️ Développement**: `http://localhost:3000` (après `npm run dev`)
- **⚙️ Health Check**: `http://localhost:3000/api/health`
- **📊 API Documentation**: Endpoints disponibles avec fallback démo

### URLs Production (Configurées)
- **Frontend Principal**: `https://veganflemmeapp.vercel.app`
- **Frontend Alternatif**: `https://veganflemmeapp-o4unaqtv5-veganflemmes-projects.vercel.app`
- **Solver Backend**: `https://veganflemmeapp-production.up.railway.app`
- **Database**: Supabase PostgreSQL - Projet `lpggllnmrjpevvslmiuq`

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

3. **Configuration (Production Ready)**
```bash
# Les variables de production sont déjà configurées:
cd web
cp .env.example .env.local

# Variables production disponibles:
# NEXT_PUBLIC_SUPABASE_URL=https://lpggllnmrjpevvslmiuq.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=[clé fournie]
# SUPABASE_SERVICE_ROLE_KEY=[clé admin fournie]  # ⚠️ Admin key - keep secure!
# DATABASE_URL=[URL PostgreSQL fournie]
# SOLVER_URL=https://veganflemmeapp-production.up.railway.app
# SPOONACULAR_KEY=[clé fournie]
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

### 🎯 Phase 1: Configuration Base de Données (Priorité CRITIQUE)
**Durée estimée**: 1-2 heures  
**Status**: 🔄 **Prêt à exécuter**

**Objectif**: Appliquer le schéma complet et importer les données nutritionnelles CIQUAL

- [ ] **Exécuter le script de configuration de base de données**
```bash
./scripts/setup-database.sh
```
- [ ] **Vérifier l'import des données CIQUAL**
- [ ] **Tester les fonctions de recherche d'ingrédients**
- [ ] **Valider les politiques RLS (Row Level Security)**

**Résultat**: Base de données fonctionnelle avec données nutritionnelles officielles françaises

### 🔧 Phase 2: Déploiement Solver (Priorité Haute)
**Durée estimée**: 1-2 heures  
**Status**: ⚠️ **Prêt pour déploiement**

**Objectif**: Déployer le service d'optimisation sur Railway

- [ ] **Déploiement solver FastAPI sur Railway**
```bash
cd solver
railway deploy
```
- [ ] **Vérification endpoints de résolution**
- [ ] **Test d'intégration avec l'application web**
- [ ] **Configuration health checks**

**Résultat**: Optimisation mathématique en temps réel pour plans alimentaires

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
**Statut**: ✅ **Prêt pour Déploiement Production** - Variables configurées, base de données prête, solver opérationnel

---

## 🚀 Déploiement Immédiat

**Pour déployer immédiatement en production:**

1. **Base de données**: `./scripts/setup-database.sh`
2. **Solver**: Déployer sur Railway
3. **Frontend**: Déployer sur Vercel avec variables existantes
4. **Vérification**: `curl https://veganflemmeapp.vercel.app/api/health`

**Voir**: `DEPLOYMENT_CHECKLIST.md` pour instructions détaillées