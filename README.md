# AgroGrowth

**An AI-assisted agriculture and nature platform built in Tunisia.**

AgroGrowth is being developed as a shared digital workspace for people and
organisations working with agriculture and nature: home growers, farmers,
agronomists, cooperatives, traders, livestock professionals, companies and
public institutions. The long-term product spans production, knowledge,
services, collaboration and investment—not only farm management.

> **Current readiness:** the repository contains a React/Express platform and
> eight FastAPI service implementations. It is not certified production-ready.
> Some screens and numeric AI services remain demo-backed; external provider,
> live database, market-data and model-validation gates are documented below.
> Never infer production readiness from a successful build or health response.

## Product areas

- Farm, field, crop and livestock workflows.
- Soil analysis and laboratory-assisted soil modelling.
- Crop, weather, irrigation and pest decision support.
- Image-based plant inspection and optional configured vision advisory.
- Market and marketplace workflows.
- Expert collaboration, notifications, analytics and role-specific dashboards.
- Arabic-first UX with RTL support; French and English coverage is still partial.

## Technology

| Layer | Implementation |
|---|---|
| Web client | React 18, TypeScript, React Router, Vite, TailwindCSS, Radix UI |
| API | Node.js, Express, TypeScript |
| Database/auth | Supabase Postgres and Supabase Auth |
| AI services | Eight Python FastAPI services |
| Testing | Jest, pytest, Cypress |
| Deployment configuration | Render, Docker, plus legacy provider configs |

### AI service inventory

| Service | Directory | Port | Current evidence-based scope |
|---|---|---:|---|
| Soil Analysis | agrogrowth-ai/soil_analysis | 8001 | Deterministic sensor analysis; separate AFSIS lab-assisted ML models, not Tunisia/field validated |
| Crop Recommendation | agrogrowth-ai/crop_recommendation | 8002 | Synthetic-demo recommender; deterministic financial calculations |
| Image Diagnosis | agrogrowth-ai/image_diagnosis | 8003 | Heuristic inspection; optional configured multimodal vision provider |
| Market Prediction | agrogrowth-ai/market_prediction | 8004 | Synthetic-demo numeric engine; no licensed live Tunisian feed |
| Intelligent Agent | agrogrowth-ai/intelligent_agent | 8005 | Configured LLM when credentials/model are available |
| Weather / Yield | agrogrowth-ai/weather_yield_intelligence | 8006 | Synthetic-demo yield/planning engine; weather source is separate |
| Pest Control | agrogrowth-ai/pest_control | 8007 | Synthetic-demo numeric engine; optional LLM advisory |
| Irrigation | agrogrowth-ai/irrigation_optimization | 8008 | Synthetic-demo numeric engine; optional LLM advisory |

**AI and data honesty rules**

- A healthy service means reachable; it does not prove that a trained model produced the result or that the result is agronomically accurate.
- Deterministic rules, heuristics, synthetic-demo models, external LLM/vision advisories and validated ML are distinct provenance categories.
- Soil's seven AFSIS wet-chemistry artifacts are lab-assisted only. Their spatial cross-validation is not Tunisia field validation.
- Do not treat an LLM narrative as a validated disease diagnosis or as proof that the numeric engine is a trained model.
- Market prices are not real-time/live unless a trusted licensed feed is integrated and the production data source is verified.
- If a provider or service is unavailable, show an honest unavailable state; never fabricate a successful analysis.

See AI_SERVICES_STATUS.md for model provenance, limitations and verification steps.

## Repository layout

- client/ — React pages, components, contexts and hooks.
- server/ — Express routes, auth/security middleware and AI provider adapters.
- shared/ — shared TypeScript contracts.
- database/ — SQL schema, migrations and RLS policies.
- agrogrowth-ai/ — eight FastAPI services and Python tests.
- tests/ — Jest unit, integration and live tests.
- cypress/ — browser end-to-end tests.
- scripts/ — service startup and operational scripts.

## Local development

### Prerequisites

- Node.js 20 or 22 (CI validates both) and npm.
- Python 3.11+ for AI services; use the service requirements/AI requirements.
- Docker is optional for containerized development.

### Install and run

```bash
git clone https://github.com/Arfaoui859/AgroDev.git
cd AgroDev
npm ci
cp .env.example .env
# Configure only the variables needed for the feature you are testing.
npm run dev
```

The development Vite server runs on port 8080 and mounts the Express API through
the development plugin, so one command is sufficient for the normal workflow.

For a standalone backend instead, run `npm run server:dev` in another terminal.
It starts server/node-build.ts on PORT=5000 (from .env.example). Set
`VITE_API_URL=http://localhost:5000/api` if the Vite client should call that
standalone backend instead of its integrated Express middleware.

To start/check the Python services, see AI_SERVICES_DEPLOYMENT_GUIDE.md and
the scripts under scripts/. Do not assume all eight services fit within a
single low-memory/free hosting instance.

### Useful commands

```bash
npx tsc --noEmit
npm run lint
npm test -- --runInBand
npm run build
cd agrogrowth-ai && python -m pytest tests -q
```

The production server bundle is build/server/node-build.mjs, outside the
public client directory dist/. Start the built server with:

```bash
PORT=5000 node build/server/node-build.mjs
```

Do not move server bundles or source maps into the public static directory.

## Environment and secrets

See .env.example and PRODUCTION_DEPLOYMENT_CHECKLIST.md.

- Never commit .env or provider credentials.
- Never expose SUPABASE_SERVICE_ROLE_KEY through a VITE_* variable.
- Configure production secrets only in the approved hosting secret store.
- Do not paste secrets, database passwords or access tokens into issues or chat.
- Confirm that Supabase URL and keys refer to the same project.

## Security and data integrity

- Every user-owned table must have RLS enabled and least-privilege policies.
- Test cross-user and cross-tenant access at the database/API layer.
- Validate file uploads by actual content, not only filename or MIME header.
- Keep provider failures, missing measurements and unavailable data explicit.
- Never substitute example values for missing coordinates, weather, soil, prices, animal records or financial measurements without a clear demo label.

## Deployment and release gates

The Render configuration is in render.yaml; Docker setup is in Dockerfile and docker-compose.yml.

Do not release until:
1. All required GitHub Actions jobs are green on the exact release SHA.
2. Live Supabase migrations, Auth and tenant RLS tests pass.
3. Every deployed service is reachable and reports truthful model provenance.
4. Critical user workflows persist and read back authenticated records.
5. Synthetic/demo modules are either clearly disclosed or replaced with evaluated data-backed integrations.
6. Arabic RTL, French/English, accessibility, mobile, backup, monitoring and rollback checks are complete.
7. A staging-to-production smoke test is signed off.

Current work and blockers are tracked in AGROGROWTH_REMEDIATION_MASTER_PLAN.md and DEPLOYMENT_PROGRESS.md.

## Contributing

Read AGENTS.md before modifying the repository. Add regression tests for fixes,
preserve the provenance contract, and update operational documentation when
verified status changes.
