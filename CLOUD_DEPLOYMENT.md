# AgroGrowth — Cloud Deployment Architecture

**Current source of truth:** render.yaml, .env.example, PRODUCTION_DEPLOYMENT_CHECKLIST.md, and AI_SERVICES_STATUS.md.

This document replaces the old generic Railway/Vercel setup recipe. The old example SQL created tables without the repository's current ownership/RLS requirements, used stale provider URLs, and mixed server-only secrets with browser variables. Do not run those legacy snippets.

## Current architecture

- React/Vite client.
- Express/Node API gateway.
- Supabase Auth + Postgres.
- Eight FastAPI AI services (ports 8001–8008 locally).
- Optional configured LLM/vision provider.
- Render Blueprint is present as a deployment definition; it is not proof of current live service state.

## Environment setup

Start from .env.example. The client build requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY. The server separately needs SUPABASE_URL, SUPABASE_ANON_KEY, and, only for privileged Auth Admin operations, SUPABASE_SERVICE_ROLE_KEY. Never put a service-role key in a VITE_ variable.

The server must also have the correct APP_ORIGIN / CORS_ORIGINS, database connection values and only the AI service URLs that are actually deployed. Do not copy service URLs from old Railway or Vercel examples.

## Database setup

Do not create a parallel schema from an ad-hoc SQL snippet. Review and apply the versioned SQL files in database/ to the intended Supabase project, in the documented order. Verify the migration history and test RLS with two separate users. A successful connection is not proof of tenant isolation.

The legacy demo-user provisioning and debug routes are retired. Create test accounts through Supabase Auth in an isolated development project. The old seed script that generated random market prices has been removed; synthetic prices must never be inserted into a table used by live market APIs.

## AI service deployment

The eight FastAPI services are listed in AI_SERVICES_STATUS.md. Start locally with bash scripts/start-ai-services.sh and verify with bash scripts/start-ai-services.sh --check. For Render, review render.yaml and RENDER_DEPLOYMENT_GUIDE.md.

A /health response proves reachability only. Keep each service's actual provenance visible: deterministic rules, heuristic inspection, synthetic-demo model, external LLM advisory, or trained model with verifiable dataset/evaluation evidence.

## Release checklist

1. All required CI jobs green on the exact commit SHA.
2. Build, security and Docker checks pass.
3. Supabase migrations applied and RLS tested against the target project.
4. All deployed AI services verified with real request/response smoke tests.
5. User-facing workflows persist data through authenticated APIs.
6. Demo/fixture data is clearly labelled or removed.
7. Monitoring, backup, rollback, privacy and accessibility checks completed.

No deployment, migration or production-data mutation is authorized merely by reading this guide. See AGROGROWTH_REMEDIATION_MASTER_PLAN.md for open acceptance gates.
