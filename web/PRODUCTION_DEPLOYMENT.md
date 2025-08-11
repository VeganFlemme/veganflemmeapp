# Production Deployment Guide - VeganFlemme Phase 3B

## 🎯 Prerequisites

This guide assumes you have completed Phase 3A and have the environment variables configured. The application now supports graceful fallback when services are unavailable.

## 🔧 Environment Variables Configuration

### Critical Production Variables (Configured and Ready ✅)
```bash
DATABASE_URL=postgresql://<USERNAME>:<PASSWORD>@<HOST>:<PORT>/<DB_NAME>
NEXT_PUBLIC_SUPABASE_URL=https://lpggllnmrjpevvslmiuq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR_SUPABASE_ANON_KEY]
SUPABASE_SERVICE_ROLE_KEY=[YOUR_SUPABASE_SERVICE_ROLE_KEY]
SOLVER_URL=https://veganflemmeapp-production.up.railway.app
SPOONACULAR_KEY=[YOUR_SPOONACULAR_KEY]
```

### ⚠️ Security Notice: SUPABASE_SERVICE_ROLE_KEY
**The service role key is a critical security credential that:**
- Bypasses Row Level Security (RLS) policies
- Has full database access permissions
- Should NEVER be exposed in client-side code
- Must be kept secure in server-side environment variables only
- Is used for admin operations like health checks and system operations

### Optional Variables
```bash
OFF_BASE=https://world.openfoodfacts.org
OPENAI_API_KEY=[YOUR_OPENAI_KEY]
OPENAI_MODEL=gpt-4
NODE_ENV=production
```

## 🗄️ Database Setup Instructions

### Step 2: Execute Database Setup (Ready to Run)
**All credentials are configured. Run the automated setup:**
```bash
cd /path/to/veganflemmeapp
./scripts/setup-database.sh
```

**This script will:**
1. Test database connection
2. Apply complete schema (ciqual, vf, off_link schemas)
3. Set up RLS policies
4. Download and import CIQUAL 2020 data
5. Create search functions and indexes
Run these queries in Supabase SQL Editor to verify setup:

```sql
-- Check if CIQUAL data is imported
SELECT count(*) as ciqual_records FROM ciqual.food_norm;

-- Check if VF schema exists
SELECT count(*) as vf_ingredients FROM vf.canonical_ingredient;

-- Test search function
SELECT * FROM vf.search_ingredient('tofu') LIMIT 5;

-- Check plans table
SELECT count(*) as saved_plans FROM public.plans;
```

## 🚀 Solver Service Setup

### Current Status: Ready for Immediate Deployment
- **URL**: https://veganflemmeapp-production.up.railway.app
- **Status**: Configured, needs deployment execution

### Deployment Steps
1. **Deploy to Railway using automated configuration**:
   ```bash
   cd solver/
   
   # Option A: Using Railway CLI
   railway login
   railway link veganflemmeapp-production
   railway deploy
   
   # Option B: Using Docker (if Railway CLI unavailable)
   docker build -t veganflemme-solver .
   # Push to Railway registry or deploy manually
   ```

2. **Verify Deployment**:
   ```bash
   curl https://veganflemmeapp-production.up.railway.app/health
   # Expected: {"ok": true, "ts": timestamp}
   
   curl -X POST https://veganflemmeapp-production.up.railway.app/solve \
     -H "Content-Type: application/json" \
     -d '{"recipes":[],"day_templates":[],"targets":{"energy_kcal": 2100}}'
   ```

## 🧪 Testing Production Setup

### Health Check Test
```bash
curl https://your-vercel-app.vercel.app/api/health | jq '.environment'
```

Expected output when fully configured:
```json
{
  "mode": "production",
  "production": true,
  "configured_services": ["supabase", "database", "solver", "spoonacular"],
  "validation": {
    "valid": true,
    "issues": [],
    "recommendations": []
  },
  "supabase": {
    "configured": true,
    "adminConfigured": true
  }
}
```

### Plan Generation Test
```bash
curl -X POST https://your-vercel-app.vercel.app/api/plan/generate \
  -H "Content-Type: application/json" \
  -d '{"maxTime": 30, "targets": {"energy_kcal": 2100}}'
```

## 🎨 Application Features Status

### ✅ Fully Functional (Demo Mode)
- **TDEE Calculation**: Works with any configuration
- **Nutrition Dashboard**: Real-time progress tracking
- **Mock Meal Planning**: Intelligent optimization using built-in recipes
- **Smart Shopping Lists**: Generated from meal plans
- **PDF Export**: Working shopping list export
- **Responsive UI**: Mobile and desktop optimized

### 🔧 Enhanced with Real Services
- **Real Recipe Data**: When Spoonacular API is reachable
- **Mathematical Optimization**: When Railway solver is deployed
- **User Authentication**: When Supabase auth is configured
- **Persistent Storage**: When database connection is established

### 🚦 Graceful Fallbacks
- **No External API**: Uses mock data and built-in solver
- **Partial Connectivity**: Mixes real and mock data as available
- **Network Issues**: Timeout protection with fallback
- **Service Outages**: Continues operation in demo mode

## 📊 Monitoring and Troubleshooting

### Health Monitoring
The `/api/health` endpoint provides comprehensive status:
- **Environment validation**
- **Service connectivity**
- **Database health**
- **Performance metrics**

### Common Issues and Solutions

#### Database Connection Issues
```bash
# Test direct connection
pg_isready -h aws-0-eu-central-1.pooler.supabase.com -p 6543

# Check if credentials are correct
psql "postgresql://postgres.lpggllnmrjpevvslmiuq:qyrgip-codsoq-1nuxJo@aws-0-eu-central-1.pooler.supabase.com:6543/postgres" -c "SELECT 1;"
```

#### Solver Service Issues
```bash
# Check Railway deployment
railway status

# Check logs
railway logs

# Redeploy if needed
railway deploy
```

#### Spoonacular API Issues
```bash
# Test API key
curl "https://api.spoonacular.com/recipes/random?apiKey=26f861f1f54244c1b9b146adeab9fc17&number=1"

# Check quota
curl "https://api.spoonacular.com/food/ingredients/autocomplete?query=appl&number=5&apiKey=26f861f1f54244c1b9b146adeab9fc17"
```

## 🎯 Production Checklist

### Pre-Deployment
- [ ] Verify all environment variables are set
- [ ] **Verify SUPABASE_SERVICE_ROLE_KEY is configured securely**
- [ ] Test database connectivity
- [ ] Deploy and test solver service
- [ ] Validate Spoonacular API key
- [ ] Run build process successfully

### Post-Deployment
- [ ] Health check returns 200 OK
- [ ] **Verify admin Supabase client works (check /api/health/advanced)**
- [ ] Plan generation works end-to-end
- [ ] Authentication flow (if enabled)
- [ ] Database operations (save/load plans)
- [ ] PDF export functionality
- [ ] Mobile responsiveness

### Performance Optimization
- [ ] Enable Next.js caching
- [ ] Configure Supabase connection pooling
- [ ] Set up CDN for static assets
- [ ] Monitor API response times
- [ ] Implement error tracking (Sentry)

## 🔄 Deployment Workflow

1. **Environment Setup**: Configure all variables in Vercel/deployment platform
2. **Database Migration**: Run schema setup in Supabase
3. **Service Deployment**: Deploy solver to Railway
4. **Application Deployment**: Deploy Next.js app to Vercel
5. **Health Verification**: Run comprehensive health checks
6. **User Testing**: Test complete user journey
7. **Monitoring Setup**: Configure alerts and monitoring

## 📝 Next Steps (Phase 3C)

After successful Phase 3B deployment:
- **Advanced Authentication**: User profiles and preferences
- **Enhanced Nutrition**: Real CIQUAL data integration
- **Smart Substitutions**: AI-powered meal recommendations
- **Social Features**: Plan sharing and community
- **Mobile App**: React Native or PWA implementation