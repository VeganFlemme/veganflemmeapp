# VeganFlemme Deployment Checklist and Guide

## 🎯 Current Status

**Environment Variables Available ✅**
- DATABASE_URL: `postgresql://<DB_USER>:<DB_PASSWORD>@<DB_HOST>:<DB_PORT>/<DB_NAME>`
- NEXT_PUBLIC_SUPABASE_URL: `https://lpggllnmrjpevvslmiuq.supabase.co`
- NEXT_PUBLIC_SUPABASE_ANON_KEY: `<YOUR_SUPABASE_ANON_KEY_HERE>`
- SUPABASE_SERVICE_ROLE_KEY: `<SUPABASE_SERVICE_ROLE_KEY>`
- SPOONACULAR_KEY: `<YOUR_SPOONACULAR_KEY_HERE>`

**Target Deployment URLs**
- Frontend: `veganflemmeapp.vercel.app` (primary)
- Frontend (alternative): `veganflemmeapp-o4unaqtv5-veganflemmes-projects.vercel.app`
- Backend Solver: `veganflemmeapp-production.up.railway.app`

## 📋 Deployment Tasks

### Phase 1: Database Setup ⚠️ CRITICAL
- [ ] **Connect to Supabase and verify project access**
  ```bash
  # Test connection
  psql "postgresql://postgres.lpggllnmrjpevvslmiuq:qyrgip-codsoq-1nuxJo@aws-0-eu-central-1.pooler.supabase.com:6543/postgres" -c "SELECT version();"
  ```
  
- [ ] **Apply database schema**
  ```bash
  cd /path/to/veganflemmeapp
  ./scripts/setup-database.sh
  ```
  
- [ ] **Verify schema installation**
  ```sql
  SELECT count(*) FROM information_schema.schemata WHERE schema_name IN ('ciqual', 'vf', 'off_link');
  SELECT count(*) FROM information_schema.tables WHERE table_schema = 'vf';
  ```

- [ ] **Import CIQUAL nutritional data**
  ```bash
  cd db
  python3 import_ciqual.py --database-url "postgresql://postgres.lpggllnmrjpevvslmiuq:qyrgip-codsoq-1nuxJo@aws-0-eu-central-1.pooler.supabase.com:6543/postgres" --download
  ```

- [ ] **Test database functions**
  ```sql
  SELECT * FROM vf.search_ingredient('tofu') LIMIT 5;
  SELECT count(*) FROM ciqual.food_composition;
  ```

### Phase 2: Solver Service Deployment
- [ ] **Deploy to Railway**
  ```bash
  # Using Railway CLI
  cd solver
  railway login
  railway link veganflemmeapp-production
  railway deploy
  ```
  
- [ ] **Configure Railway environment variables**
  - Set any required environment variables in Railway dashboard
  - Ensure health check endpoint is accessible
  
- [ ] **Verify solver deployment**
  ```bash
  curl https://veganflemmeapp-production.up.railway.app/health
  curl -X POST https://veganflemmeapp-production.up.railway.app/solve \
    -H "Content-Type: application/json" \
    -d '{"recipes":[],"day_templates":[],"targets":{"energy_kcal":2100}}'
  ```

### Phase 3: Frontend Deployment
- [ ] **Configure Vercel environment variables**
  - Go to Vercel Dashboard > Project Settings > Environment Variables
  - Add all production environment variables:
    ```
    NEXT_PUBLIC_SUPABASE_URL=https://lpggllnmrjpevvslmiuq.supabase.co
    NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwZ2dsbG5tcmpwZXZ2c2xtaXVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4NDI1OTgsImV4cCI6MjA3MDQxODU5OH0.SQ4OJr1REUtXR-Kphqqxur1EmT5w85_MEjZJi_59goQ
    SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwZ2dsbG5tcmpwZXZ2c2xtaXVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDg0MjU5OCwiZXhwIjoyMDcwNDE4NTk4fQ.vOXohAyQYKJ2zL_3EdRDJxBRQXiAsPofz6KmW6-J_9o
    DATABASE_URL=postgresql://postgres.lpggllnmrjpevvslmiuq:qyrgip-codsoq-1nuxJo@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
    SOLVER_URL=https://veganflemmeapp-production.up.railway.app
    SPOONACULAR_KEY=26f861f1f54244c1b9b146adeab9fc17
    OFF_BASE=https://world.openfoodfacts.org
    NODE_ENV=production
    ```

- [ ] **Deploy to Vercel**
  ```bash
  cd web
  vercel --prod
  ```

- [ ] **Configure custom domains**
  - Set up `veganflemmeapp.vercel.app` as primary domain
  - Ensure SSL certificates are properly configured

### Phase 4: End-to-End Testing
- [ ] **Test application health**
  ```bash
  curl https://veganflemmeapp.vercel.app/api/health | jq '.'
  ```
  
- [ ] **Test complete user flow**
  1. Visit https://veganflemmeapp.vercel.app
  2. Generate a meal plan
  3. Test ingredient search
  4. Generate shopping list
  5. Export PDF
  6. Save plan (if auth enabled)
  
- [ ] **Verify external integrations**
  ```bash
  # Test Spoonacular API
  curl "https://api.spoonacular.com/recipes/random?apiKey=26f861f1f54244c1b9b146adeab9fc17&number=1"
  
  # Test OpenFoodFacts API
  curl "https://world.openfoodfacts.org/api/v0/product/3017620422003.json"
  ```

### Phase 5: Performance and Monitoring
- [ ] **Set up monitoring**
  - Configure Vercel Analytics
  - Set up Railway monitoring
  - Monitor database performance in Supabase
  
- [ ] **Performance optimization**
  - Enable Vercel Edge Functions caching
  - Configure Supabase connection pooling
  - Optimize solver response times
  
- [ ] **Error tracking**
  - Set up error reporting (Sentry or similar)
  - Configure alerting for service failures

## 🚨 Critical Security Notes

1. **SUPABASE_SERVICE_ROLE_KEY** bypasses Row Level Security (RLS)
   - Keep this key secure and never expose in client-side code
   - Only use for server-side admin operations
   
2. **Database credentials** contain admin access
   - Ensure proper network security
   - Monitor for unusual access patterns
   
3. **API keys** have usage limits and costs
   - Monitor Spoonacular API usage to avoid overage charges
   - Set up usage alerts

## 🔧 Troubleshooting

### Database Connection Issues
```bash
# Test direct connection
pg_isready -h aws-0-eu-central-1.pooler.supabase.com -p 6543

# Check SSL requirements
psql "postgresql://postgres.lpggllnmrjpevvslmiuq:qyrgip-codsoq-1nuxJo@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require" -c "SELECT 1;"
```

### Solver Service Issues
```bash
# Check Railway deployment logs
railway logs

# Test solver locally
cd solver
uvicorn main:app --reload --port 8080
curl http://localhost:8080/health
```

### Frontend Build Issues
```bash
# Check environment variables
cd web
npm run build 2>&1 | grep -i error

# Test API routes locally
npm run dev
curl http://localhost:3000/api/health
```

## ✅ Success Criteria

The deployment is successful when:
1. Database schema is fully applied with CIQUAL data
2. Solver service responds at Railway URL
3. Frontend loads at Vercel URL
4. Health check shows all services as "ok: true"
5. Complete user flow works end-to-end
6. External API integrations are functional

## 📈 Next Steps After Deployment

1. **Monitor application performance and usage**
2. **Implement user authentication and profiles**
3. **Add advanced nutrition analysis features**
4. **Set up automated backups for user data**
5. **Plan for scaling based on usage patterns**