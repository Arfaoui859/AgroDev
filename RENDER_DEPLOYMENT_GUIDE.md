# AgroGrowth — Render Deployment Guide

**Status:** deployment instructions only; this is not evidence that a live Render service is configured or healthy.

The repository's authoritative Render blueprint is render.yaml. It describes one public Node/Express platform and eight private FastAPI services. Do not copy old example hostnames or assume that every service fits a free plan.

## 1. Before creating or changing services

1. Confirm the intended Git branch and commit in GitHub.
2. Review the current Render dashboard services before applying a Blueprint.
3. Compare each service's name, root directory, runtime, build command, start command, region, instance plan and health check with render.yaml.
4. Confirm the cost/plan for every service in the Render dashboard. The blueprint currently specifies paid starter/standard plans; it is not a zero-cost deployment configuration. Do not apply it if the project must remain free.
5. Do not delete or recreate existing services merely to match this document.

## 2. Service inventory

| Service | Blueprint name | Python module | Port inside container |
|---|---|---|---|
| Soil Analysis | agrogrowth-soil-analysis | soil_analysis.main:app | Render $PORT |
| Crop Recommendation | agrogrowth-crop-recommendation | crop_recommendation.main:app | Render $PORT |
| Image Diagnosis | agrogrowth-image-diagnosis | image_diagnosis.main:app | Render $PORT |
| Market Prediction | agrogrowth-market-prediction | market_prediction.main:app | Render $PORT |
| Intelligent Agent | agrogrowth-intelligent-agent | intelligent_agent.main:app | Render $PORT |
| Weather / Yield | agrogrowth-weather-yield | weather_yield_intelligence.main:app | Render $PORT |
| Pest Control | agrogrowth-pest-control | pest_control.main:app | Render $PORT |
| Irrigation Optimization | agrogrowth-irrigation-optimization | irrigation_optimization.main:app | Render $PORT |

The main platform is a Node web service. Its blueprint start command is node build/server/node-build.mjs; health path is /api/health.

## 3. Environment variables

Configure secrets only in Render's Environment dashboard (or an approved secret manager). Never paste secret values into GitHub, source files or chat.

### Main platform

- Supabase server: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET.
- Supabase browser build: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY. These are public client settings; never put the service-role key in a VITE_ variable.
- Database: DATABASE_URL, DIRECT_URL.
- CORS: APP_ORIGIN and any additional exact origins in CORS_ORIGINS.
- AI provider: choose one configured provider, e.g. AI_PROVIDER=gemini and GEMINI_API_KEY, or AI_BASE_URL + AI_API_KEY.
- Service URLs: SOIL_ANALYSIS_URL, CROP_RECOMMENDATION_URL, IMAGE_DIAGNOSIS_URL, MARKET_FORECAST_URL, SMART_ASSISTANT_URL, SMART_MARKETPLACE_URL, PEST_CONTROL_URL, IRRIGATION_OPTIMIZATION_URL.

The blueprint maps private services using Render's hostport property. The gateway accepts aliases for market, agent and weather/yield URLs; prefer the names above for consistency with the current Render blueprint.

## 4. Verification after a deployment

Use the actual deployed hostnames from the Render dashboard. Do not infer them from service names.

1. GET /api/health on the main platform returns 200.
2. GET /api/ai/health reports reachability for each of the eight services.
3. Inspect each service's model_source, isRealModel and modelTrainedOnSyntheticData fields. A healthy endpoint is not proof of model quality.
4. Send one valid and one invalid request to each service; verify validation, timeout and unavailable behaviour.
5. Verify the main application calls services through the Node gateway, not directly from the browser to private service hosts.
6. Confirm logs contain no credentials, access tokens or unnecessary personal data.
7. Confirm database migrations and RLS against the intended Supabase project.

## 5. Free-tier constraint

Render plan availability, private-service support, resource limits and pricing can change. The checked-in render.yaml currently uses paid plans. If zero cost is mandatory, do not claim this Blueprint satisfies it: redesign the hosting topology around the actual free-tier limits, consolidate services where safe, or run selected services locally. Do not silently downgrade memory-heavy services such as image diagnosis without load and memory testing.

## 6. Release controls

- Require all GitHub Actions checks green on the exact release SHA.
- Verify Supabase migrations and tenant isolation before real user traffic.
- Verify all live endpoints and provenance.
- Keep synthetic-demo models and fixture-backed pages disclosed.
- Record the previous deploy and rollback steps before promotion.

See PRODUCTION_DEPLOYMENT_CHECKLIST.md, AI_SERVICES_STATUS.md, and AGROGROWTH_REMEDIATION_MASTER_PLAN.md.
