# Feuille de Route de Développement - VeganFlemme

## 🎯 État Actuel et Phases de Développement

**Status Janvier 2025**: MVP Démo Fonctionnel ✅  
**Prochaine Priorité**: Phase 1 - Données Nutritionnelles Réelles

## 🚀 Ce qui Fonctionne Actuellement

### ✅ MVP Démo Opérationnel
- **Interface complète**: Application Next.js avec shadcn/ui
- **Solver mathématique**: OR-Tools intégré avec optimisation nutritionnelle
- **API fonctionnelle**: 9 endpoints avec fallback gracieux
- **Build production**: Bundle optimisé (87.1 kB) déployable immédiatement
- **Mode démonstration**: Expérience utilisateur complète sans dépendances

### Phase 1: Données Nutritionnelles Réelles
**Durée estimée**: 2-3 semaines  
**Priorité**: Critique  
**Status**: 🔄 **À INITIER** - Infrastructure prête
**Prérequis**: Base PostgreSQL configurée

#### Tâches Techniques

**1.1 Import Base CIQUAL**
- [ ] Télécharger CIQUAL 2020 depuis site ANSES
- [ ] Créer script d'import CSV vers PostgreSQL
- [ ] Nettoyer et normaliser données (virgules → points, valeurs manquantes)
- [ ] Créer vues `ciqual.food_norm` avec colonnes standardisées
- [ ] Indexer par code CIQUAL et nom français

**1.2 Import Base CALNUT**  
- [ ] Télécharger données CALNUT complémentaires
- [ ] Import dans schéma `ciqual_calnut.food_norm`
- [ ] Créer vue fusion `ciqual.food_best` (meilleure valeur CIQUAL vs CALNUT)
- [ ] Prioriser CALNUT pour micronutriments manquants

**1.3 Tables Métier**
- [ ] Peupler `vf.canonical_ingredient` depuis `ciqual.food_best`
- [ ] Filtrer aliments végans uniquement (exclure viande/poisson/produits laitiers)
- [ ] Ajouter tags (protéine, légume, céréale, légumineuse, etc.)
- [ ] Définir `prep_complexity` (0=cru, 1=simple, 2=cuisson, 3=complexe)

**1.4 Recherche Performante**
- [ ] Installer extension PostgreSQL `pg_trgm` (trigram)
- [ ] Créer fonction IMMUTABLE `vf.unaccent_imm()` 
- [ ] Index GIN trigram sur `vf.unaccent_imm(name)`
- [ ] RPC `vf.search_ingredient(text)` optimisé
- [ ] Tester performance sur 2000+ ingrédients

**1.5 Nutriments par 100g**
- [ ] Peupler `vf.ingredient_nutrients` avec JSONB
- [ ] Format: `{energy_kcal, protein_g, carbs_g, fat_g, fiber_g, b12_ug, iron_mg, calcium_mg, zinc_mg, iodine_ug, selenium_ug, vitamin_d_ug, ala_g}`
- [ ] UPSERT robuste (éviter doublons)
- [ ] Validation cohérence données

#### Tests et Validation
- [ ] RPC retourne >20 résultats pour "tofu", "lentilles", "quinoa"
- [ ] Nutriments complets pour top 100 ingrédients végans
- [ ] Performance <100ms pour recherche trigram
- [ ] Interface web utilise vraies données (plus de mode démo)

### Phase 2: Services Externes
**Durée estimée**: 1-2 semaines  
**Priorité**: Haute  
**Prérequis**: Clés API obtenues

#### 2.1 Spoonacular Integration
- [ ] Obtenir clé API Spoonacular (gratuite 150 calls/jour)
- [ ] Tester endpoint `/recipes/complexSearch` avec `diet=vegan`
- [ ] Implémenter cache volatile (Redis ou table temporaire TTL 24h)
- [ ] Mapper nutrition Spoonacular → format VeganFlemme
- [ ] Gérer limitations rate (fallback recettes locales)

#### 2.2 OpenFoodFacts Integration  
- [ ] Tester API OFF sans clé (libre accès)
- [ ] Implémenter recherche produit par nom
- [ ] Scanner code-barres (composant mobile)
- [ ] Mapper produits OFF → ingrédients canoniques
- [ ] Table liaison `off_link.product_ref`

#### 2.3 Déploiement Solver
- [ ] Créer compte Railway (gratuit)
- [ ] Dockerfile pour FastAPI + OR-Tools
- [ ] Variables d'environnement Railway
- [ ] URL publique solver → variable SOLVER_URL
- [ ] Test génération plan end-to-end

#### 2.4 Configuration Production
- [ ] Variables Vercel pour production
- [ ] Supabase project setup complet
- [ ] Test santé `/api/health` avec tous services
- [ ] Documentation troubleshooting erreurs

### Phase 3: Authentification & Persistance
**Durée estimée**: 1 semaine  
**Priorité**: Moyenne  
**Prérequis**: Phase 1 et 2 complètes

#### 3.1 Supabase Auth
- [ ] Activer Magic Links dans Supabase dashboard
- [ ] Composant login/logout interface
- [ ] Context Provider auth état global
- [ ] Redirection après connexion
- [ ] Gestion erreurs auth (email invalide, etc.)

#### 3.2 Row Level Security
- [ ] Activer RLS sur table `public.plans`
- [ ] Policy: `user_email = auth.email()` pour SELECT/INSERT/UPDATE
- [ ] Fallback anonymous: `user_email IS NULL` autorisé
- [ ] Test isolation données utilisateurs

#### 3.3 Profils Utilisateur
- [ ] Table `public.user_profiles`
- [ ] Champs: `user_id, preferences, dietary_restrictions, activity_level`
- [ ] Interface édition profil
- [ ] Sauvegarde TDEE et cibles personnalisées
- [ ] Migration données localStorage → Supabase

#### 3.4 Historique Plans
- [ ] Vue plans utilisateur avec pagination
- [ ] Export/import plans JSON
- [ ] Favoris et notes personnelles
- [ ] Statistiques utilisation

### Phase 4: Optimisations Avancées
**Durée estimée**: 2-3 semaines  
**Priorité**: Basse  
**Prérequis**: MVP fonctionnel complet

#### 4.1 Solver Avancé
- [ ] Contraintes dures: allergies, budget max, temps max
- [ ] Variables slack pondérées par nutriment
- [ ] Warm-start et réutilisation solutions partielles
- [ ] Réparation locale (1 jour modifié = recalcul partiel)
- [ ] Profils nutritionnels (sportif, senior, etc.)

#### 4.2 Features Premium
- [ ] Suggestions saisonnières (tags `season_spring`, etc.)
- [ ] Mode "zero-waste" (optimise anti-gaspillage)
- [ ] Export PDF recettes avec instructions complètes
- [ ] Analyse nutritionnelle IA avec OpenAI
- [ ] Recommendations adaptatives

#### 4.3 Performance
- [ ] Cache intelligent recettes fréquentes
- [ ] Optimisation bundle JavaScript
- [ ] Images optimisées (WebP, lazy loading)
- [ ] Service Worker (mode hors-ligne)
- [ ] Métriques performance Core Web Vitals

## 🔧 Setup Développement par Phase

### Phase 1 - Setup Base de Données
```bash
# 1. Créer base PostgreSQL locale ou Supabase
# 2. Exécuter schémas
psql $DATABASE_URL -f db/schema.sql

# 3. Télécharger CIQUAL
wget https://ciqual.anses.fr/cms/sites/default/files/inline-files/TableCiqual2020_Donneescsv.zip

# 4. Scripts import (à créer)
python scripts/import_ciqual.py
python scripts/import_calnut.py  
python scripts/populate_canonical.py

# 5. Tester RPC
psql $DATABASE_URL -c "SELECT * FROM vf.search_ingredient('tofu') LIMIT 5;"
```

### Phase 2 - Configuration APIs
```bash
# .env.local
SPOONACULAR_KEY=your_key_here
SOLVER_URL=https://your-app.railway.app
DATABASE_URL=postgresql://user:pass@host:5432/db

# Test services
curl "http://localhost:3000/api/health"
# Tous services doivent être "ok": true
```

### Phase 3 - Supabase Auth
```bash
# Supabase dashboard
# 1. Authentication → Settings → Enable email auth
# 2. SQL Editor → Enable RLS
# 3. Policies → Create policies pour table plans

# Test auth flow
# 1. Créer compte via interface
# 2. Vérifier isolation données utilisateur
```

## 📊 Métriques de Succès

### Phase 1
- [ ] 2000+ ingrédients dans base avec nutriments complets
- [ ] Recherche <100ms pour 95% des requêtes
- [ ] 0 dépendance mode démo pour données nutritionnelles

### Phase 2  
- [ ] Génération plan avec vraies recettes Spoonacular
- [ ] Solver déployé avec <5s response time
- [ ] Health check 100% services externes

### Phase 3
- [ ] Authentification fonctionnelle end-to-end
- [ ] Plans sauvegardés par utilisateur isolés
- [ ] Migration données démo → comptes réels

### Phase 4
- [ ] Score performance Lighthouse >90
- [ ] Fonctionnalités premium utilisables
- [ ] Prêt pour utilisateurs beta

## ⚠️ Risques et Mitigations

**Données CIQUAL volumineuses**
- Risque: Import lourd, performance dégradée
- Mitigation: Import par batches, indexes optimisés, vues matérialisées

**Limitations APIs externes**
- Risque: Rate limits, coûts, dépendances
- Mitigation: Cache agressif, fallbacks locaux, budgets monitoring

**Complexité solver**
- Risque: Temps calcul trop long, infaisabilité
- Mitigation: Contraintes réalistes, timeout, solutions approchées

**Adoption utilisateurs**
- Risque: UX trop complexe, valeur peu claire
- Mitigation: Mode démo solide, onboarding guidé, feedback early users

---

**Dernière mise à jour**: Janvier 2025  
**Document vivant**: Mettre à jour selon avancement réel