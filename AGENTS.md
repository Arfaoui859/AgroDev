# AgroGrowth — Agent and Engineering Guide

This repository is AgroGrowth, a Tunisia-origin agriculture and nature platform.
Do not treat it as a generic starter template. Verify behaviour in the current
source and tests before changing it.

## Product scope

AgroGrowth serves people and organisations working with agriculture and nature:
home growers, farmers, agronomists, cooperatives, traders, livestock
professionals, companies and institutions. The intended platform spans
production, knowledge, services, collaboration, marketplace and investment.

Arabic is the primary product language with RTL support. French and English
coverage is incomplete and must not be described as fully translated.

## Verified stack and layout

- Client: React 18, TypeScript, React Router, Vite, TailwindCSS and Radix UI.
- API: Node.js + Express + TypeScript.
- Database/auth: Supabase Postgres and Supabase Auth.
- AI: eight Python FastAPI services under agrogrowth-ai/ (local ports 8001–8008),
  plus server-side provider adapters and deterministic agronomy rules.
- Tests: Jest, pytest and Cypress.
- Deployment definitions: Docker, Render and a Vercel config. A config file is
  not proof of a live deployment.

Repository areas:
- client/ — pages, components, contexts and hooks.
- server/ — Express routes, auth/security middleware and AI gateway.
- shared/ — shared TypeScript contracts.
- database/ — schema, migrations and RLS policies.
- agrogrowth-ai/ — FastAPI services and Python tests.
- tests/ — Node, integration, live and database tests.
- cypress/ — browser end-to-end tests.
- scripts/ — local service startup and deployment diagnostics.

## Local development

Use Node 20 or 22 and npm:

```bash
npm ci
cp .env.example .env
# Configure the browser and server Supabase values in .env.
npm run dev
```

The Vite dev server runs on port 8080 and mounts the Express app through its
development plugin. For a standalone backend, run `npm run server:dev`
separately; it starts server/node-build.ts on PORT=5000. Set VITE_API_URL to
http://localhost:5000/api when the client should use that standalone backend.
server/index.ts exports the Express app factory and is not a standalone listener.

Useful checks:

```bash
npx tsc --noEmit
npm run lint
npm test -- --runInBand
npm run build
cd agrogrowth-ai && python -m pytest tests -q
```

Start the Python services locally only when the AI virtualenv and dependencies
are installed:

```bash
python3 -m venv agrogrowth-ai/.venv
agrogrowth-ai/.venv/bin/pip install -r agrogrowth-ai/requirements.txt
bash scripts/start-ai-services.sh
bash scripts/start-ai-services.sh --check
```

The production server bundle is build/server/node-build.mjs, outside the public
client directory dist/. Never move the server bundle or its source maps into
the public static directory.

## AI architecture and provenance

The browser must call the Node API gateway only. Private Python service URLs
and provider credentials belong on the server, never in VITE_* variables.

Distinguish these output types:
- trained ML model with verifiable dataset and evaluation evidence;
- lab-assisted research model not field validated;
- deterministic rules;
- heuristic image/feature analysis;
- synthetic-demo model;
- external LLM/vision advisory.

A /health response proves reachability, not model training or agronomic
accuracy. The Soil AFSIS artifacts are lab-assisted and are not Tunisia field
validation. Several other numeric AI services remain synthetic-demo. Never
claim synthetic data is real, invent market prices, or fabricate a diagnosis.
Keep model_source, dataSource, isRealData, isRealModel and
modelTrainedOnSyntheticData accurate. An unavailable provider must produce an
explicit unavailable/error state rather than a fake success.

## Security and data integrity — non-negotiable

- Never commit .env, passwords, tokens, provider secrets or database keys.
- Browser Supabase uses VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY only.
  The browser client must not embed a project URL/key fallback.
- Server Supabase uses SUPABASE_URL and SUPABASE_ANON_KEY. Do not infer the
  server database target from VITE_* browser settings.
- SUPABASE_SERVICE_ROLE_KEY is server-only. Never expose it through VITE_*,
  logs, HTTP headers or the x-admin-token field.
- x-admin-token accepts only a dedicated ADMIN_API_TOKEN.
- Legacy demo account provisioning, fixed demo credentials, auth-debug and
  mutating database diagnostic routes are retired. Do not recreate them.
- Do not seed random/illustrative market prices into market_prices.
- Every user-owned table needs RLS and least-privilege policies. Test that user A
  cannot read or mutate user B's farms, fields, soil, livestock or reports.
- Validate inputs and uploads at API boundaries. Enforce authorization on the
  server; do not trust client-supplied userId/role.
- Avoid logging personal data, access tokens or secrets.
- Do not run a live migration, mutate production data, change hosted secrets or
  deploy without explicit authorization and a verified target.

## UI and product quality

- Keep demo/fixture pages visibly labelled with SimulatedDataNotice or
  equivalent provenance disclosure.
- Mock UI data is disabled by default and may be enabled only explicitly in a
  development build; never in production.
- Handle loading, empty, offline, timeout and provider-unavailable states.
- Maintain Arabic RTL, French and English layouts; do not hardcode new strings
  where the i18n system applies.
- Test responsive/mobile behaviour and keyboard accessibility.
- Add regression tests for every bug fix and update the relevant documentation.

## Release discipline

Do not call the application production-ready until:
1. Required CI jobs pass on the exact release SHA.
2. Supabase migrations, Auth and cross-tenant RLS are verified on the target.
3. Deployed services are reachable and expose truthful provenance.
4. Critical workflows persist/read back authenticated records.
5. Licensed market and agronomic data sources are connected and evaluated.
6. Arabic RTL, French/English, accessibility, privacy, backup, monitoring and
   rollback checks pass.

See AGROGROWTH_REMEDIATION_MASTER_PLAN.md and
PRODUCTION_DEPLOYMENT_CHECKLIST.md for current acceptance gates.
