# AgroGrowth — Quick Deployment Reference

This file replaces the legacy one-click Railway deployment notes. Do not copy
historical hostnames or put private AI service URLs into browser environment
variables.

## Local development

```bash
npm ci
cp .env.example .env
# Configure Supabase browser + server values in the local .env.
npm run dev
```

Vite runs at http://localhost:8080 and mounts Express through the development
plugin. For a standalone backend, run npm run server:dev separately on port 5000
and set VITE_API_URL=http://localhost:5000/api.

## Optional local AI services

```bash
python3 -m venv agrogrowth-ai/.venv
agrogrowth-ai/.venv/bin/pip install -r agrogrowth-ai/requirements.txt
bash scripts/start-ai-services.sh
bash scripts/start-ai-services.sh --check
```

The eight services use ports 8001–8008. See AI_SERVICES_DEPLOYMENT_GUIDE.md.

## Production

1. Use render.yaml as the deployment manifest, but inspect current provider
   plans and costs first; the checked-in blueprint is not a free-tier guarantee.
2. Configure SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY,
   DATABASE_URL, DIRECT_URL, VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the
   correct server/build secret settings.
3. Configure private service host/port URLs only on the Node server:
   SOIL_ANALYSIS_URL, CROP_RECOMMENDATION_URL, IMAGE_DIAGNOSIS_URL,
   MARKET_FORECAST_URL, SMART_ASSISTANT_URL, SMART_MARKETPLACE_URL,
   PEST_CONTROL_URL and IRRIGATION_OPTIMIZATION_URL.
4. Configure APP_ORIGIN/CORS_ORIGINS and the selected AI provider on the server.
5. Verify GET /api/health and GET /api/ai/health on the deployed platform.
6. Test each live workflow and check its data/model provenance.

The browser talks only to the Node gateway. No direct microservice VITE_* URLs
or mock fallback are enabled by default.

## Release gates

Do not deploy until all required CI jobs pass on the exact SHA, Supabase RLS
is verified, all service URLs and provenance are checked, and rollback is
documented. Synthetic-demo models and fixture-backed workflows are not
production-validated data.

See PRODUCTION_DEPLOYMENT_CHECKLIST.md and AGROGROWTH_REMEDIATION_MASTER_PLAN.md.
