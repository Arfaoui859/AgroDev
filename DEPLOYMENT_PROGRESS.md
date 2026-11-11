# AgroGrowth — Deployment Progress

**Reviewed:** 2026-11-11  
**Repository:** `Arfaoui859/AgroDev`  
**Working branch:** `fix/agrogrowth-ci-and-production-gaps-2026-11-11`

This file replaces the obsolete 2024 setup checklist. It does not claim that
hosting, Supabase, or AI services are production-ready merely because their
configuration files exist.

## Current repository state

- React/Vite client + Express server build.
- Eight FastAPI AI service definitions (ports 8001–8008).
- Render deployment configuration is present.
- Supabase Auth/database integration and SQL migrations are present.
- CI includes Node 20/22 tests, code quality, build, security scan, Python AI
  service regression tests, Docker build and isolated PostgreSQL RLS tests.
- The remediation branch and PR are separate from the production base branch.
  Do not deploy or merge until required CI and release gates pass.

## Release gates

### 1. GitHub CI
- [ ] All required jobs green on the exact PR head SHA.
- [ ] No skipped required test suite without an approved reason.
- [ ] Build and Docker image jobs pass.
- [ ] Security scan reviewed; no unaccepted critical/high finding.
- [ ] Python service regression suite passes.

### 2. Render
- [ ] Confirm service names, branch, root directory, build command and start
  command in the Render dashboard.
- [ ] Configure only required environment-variable names/values in Render's
  secret store. Never commit secrets or paste them into chat.
- [ ] Confirm each AI URL points to the intended deployed service.
- [ ] Verify health and one representative request for every service.
- [ ] Confirm service provenance in responses; HTTP 200 alone is not model
  validation.
- [ ] Verify logs contain no credentials or personal data.
- [ ] Perform a rollback rehearsal before production traffic.

### 3. Supabase
- [ ] Confirm the project identity and that server/client keys match it.
- [ ] Apply the current SQL migrations.
- [ ] Verify RLS and tenant isolation against live users.
- [ ] Verify Auth lifecycle and admin-role protections.
- [ ] Confirm backup and recovery configuration.
- [ ] Confirm no service-role key is exposed to the browser.

### 4. AI/data readiness
- [ ] Soil lab ML remains lab-assisted only until field/Tunisia validation.
- [ ] Crop, market, weather/yield, pest and irrigation synthetic models remain
  labelled as demo until trained/evaluated on real representative data.
- [ ] Disease diagnosis requires labelled image evaluation; LLM output alone
  is not a validated diagnosis.
- [ ] Market features require a licensed, reliable price source.
- [ ] Record dataset licenses, data lineage, evaluation splits, metrics and
  model limitations.

### 5. Product quality
- [ ] Complete Arabic RTL, French and English localization across all routes.
- [ ] Test mobile/responsive layouts and keyboard/screen-reader accessibility.
- [ ] Verify loading, empty, offline, timeout and provider-unavailable states.
- [ ] Run Cypress end-to-end tests against a staging environment.
- [ ] Verify rate limits, upload validation, backups, privacy and monitoring.

## Current status

**Not certified production-ready.** CI and code remediation are in progress;
live Render/Supabase checks and real agricultural data/model validation require
external access and evidence. Track each item in
`AGROGROWTH_REMEDIATION_MASTER_PLAN.md`.

No hosted deployment, live migration, production data mutation or environment
change is authorized by this document.
