# AgroGrowth platform status audit — 2026-11-09

> Scope: repository review plus previously reported Render/Supabase observations. This is not a fresh authenticated production test. Source-code presence does not prove that a migration, model, provider or deployment is live.

## Executive summary

AgroGrowth is a multi-role agricultural operations, intelligence and market platform—not only a farmer chatbot. It combines a React/Vite/TypeScript client, Express/TypeScript API, Supabase authentication/persistence and Python AI microservices.

The product surface is broad. The critical gap is production evidence and data/model maturity: some features rely on deterministic rules, heuristics, simulated datasets or unverified service configuration. A healthy endpoint or generated answer is not proof of a trained model or accurate inference.

## Product scope found in the codebase

| Area | Intended capability | Evidence-based status |
|---|---|---|
| Farmer dashboard | Farms, fields, crops, soil, tasks, weather, irrigation and performance | UI/API surface exists; authenticated persistence needs live verification |
| Agronomist dashboard | Advisory, field follow-up, crop/soil recommendations | Dashboard/API surface exists; recommendation quality depends on verified records and provenance |
| Trader dashboard | Market, supply/demand, listings and trade context | Product surface exists; live market feed not proven |
| Veterinarian dashboard | Animal health, patients and treatment workflows | Routes/dashboard exist; real clinical/animal data not verified |
| Inspector dashboard | Visits, quality assessments, reports and follow-up | Route surface exists; real inspection records not verified |
| Government dashboard | Agricultural oversight and aggregated analytics | Route exists; institutional source completeness and access controls need validation |
| Admin and SaaS | Users, subscriptions, plans, system/security/usage metrics | Routes exist; production authorization and billing lifecycle need end-to-end proof |
| Farm operations | Farms, fields, cultivations, soil history, equipment, labor, alerts | Core endpoints exist; older areas still expose simulated/demo data |
| Soil intelligence | Soil parameters, texture classification, interpretation and recommendations | Deterministic/provenance-aware logic exists; no trained soil ML model proven live |
| Crop intelligence | Crop recommendation, climate matching and profitability | Service exists; synthetic-demo/deterministic sources have been observed |
| Plant health | Image upload, disease/leaf analysis and follow-up records | Workflow exists; current image module is deterministic visual inspection, no trained classifier proven |
| Weather | Forecast-aware advice and planning | Open-Meteo is a real source; prior Render logs showed HTTP 429 rate limiting |
| Market intelligence | Prices, forecasts, supply/demand and sale timing | UI/API exists; prior live probe labelled prices simulated and market data table was empty |
| Irrigation and pest | Irrigation optimization, pest control and yield/weather planning | Integration surface exists; endpoint configuration and real inference need proof |
| Finance | Expense/revenue ledger, summaries, profitability and budgets | Expense/revenue code and SQL migration exist; budget-plan handlers explicitly return HTTP 501 |
| Marketplace and logistics | Listings, inquiries, supply chain, quality checks, vehicles and route optimization | Route surface exists; real counterparties, transactions and tracking data not verified |
| Collaboration | Forums, rooms, expert consultations and online experts | UI/API surface exists; real-time delivery, expert verification and moderation need validation |
| Gamification | XP, achievements, activity and leaderboard | Routes exist; authenticated live persistence needs smoke tests |
| Investor and public data | Opportunities, portfolio, public production/export/weather/market data | Product surface exists; real institutional feeds and provenance remain incomplete |
| Autonomous farm agent | Per-farm settings, record-based checks, alerts and scheduled scans | Code and workflow exist; migration, secrets, deployment and observed scheduled run still required |

## AI capability truth table

| Capability | Current honest classification | Production requirement |
|---|---|---|
| Soil numeric analysis | Deterministic agronomic rules/reference logic | Public/licensed dataset, normalized units/lab methods, independent validation; train only if it beats baseline |
| Soil texture | Approximation from sand/silt/clay when all values are supplied | Validate against authoritative texture labels and boundary cases |
| Soil image | Deterministic visual inspection, not a trained classifier | Labelled dataset, expert labels, clean splits, model, calibration and field validation |
| Crop recommendation | Rules/model provenance varies by deployed version; synthetic-demo has been observed | Regional data, seasonal/location validation, explainability and evaluation |
| Plant disease | Heuristic/deterministic image pipeline; no deployed trained classifier proven | Expert-labelled crop/disease images, per-class sensitivity, calibration and out-of-distribution rejection |
| Assistant/chatbot | Configured LLM may answer; deterministic fallback is possible | Verify provider/model per response, ground in records, test actions and persist history |
| Weather | Open-Meteo forecast when reachable | Cache/backoff for 429; distinguish forecast from sensor measurements |
| Market forecast | Not proven real; historical probe reported simulated prices | Official/partner feed, timestamps, historical backtesting and drift monitoring |
| Irrigation/pest/yield | Service/API surface exists | Prove configured endpoint, real input, inference source, benchmark and field trials |

A /health response, HTTP 200, LLM-generated paragraph or attractive dashboard is not proof of trained AI. Synthetic, heuristic, deterministic and model-generated estimates must never be presented as measured farm data.

## Persistence and chatbot findings

### Assistant memory
The reported error "Could not find the table public.farm_agent_settings in the schema cache" means the deployed Supabase project does not expose that relation to PostgREST. The repository contains database/autonomous-farm-agent.sql for agent settings and assistant conversation/message tables. Apply it to the exact Supabase project used by the API, refresh the schema cache and verify the tables.

### Farm creation
POST /api/farms is mounted behind requireAuth. The handler requires a verified JWT, derives owner_id from the verified identity, inserts into Supabase and returns success only after receiving the inserted row. It now classifies missing relation/schema, RLS denial and other persistence failures. Browser Authorization propagation and a real create/reload test remain unverified.

### Finance
POST/GET/PUT/DELETE expenses and revenues are authenticated. database/farm-finance-persistence.sql creates user-owned ledgers with RLS. The finance handlers were corrected to pass Supabase errors into the classifier rather than discarding them. RLS denial now returns HTTP 403; migration/database unavailability returns HTTP 503. The migration is not confirmed applied in production.

### Conversation history
Generating an answer does not prove the transcript was saved. The conversation API returns explicit migration/RLS errors and only reports a message persisted after successful insertion. If a farm action succeeded but history save failed, verify the farm record before retrying to avoid duplicates.

## Autonomous agent: implemented vs not implemented

The source logic can inspect stored farm records for missing/stale soil baselines, harvest due dates, sensor maintenance/inactivity and recorded disease cases requiring follow-up. It can deduplicate notifications and propose next actions.

This does not prove continuous sensor streaming, automatic satellite acquisition, live market monitoring, automatic disease re-diagnosis, push/SMS/email delivery or autonomous execution of high-impact operations. Those require integrations, permissions, provider configuration and production tests.

## Deployment and verification state

- Working branch: feat/soil-analysis-professional-report.
- SQL migrations exist in the repository; they are not confirmed applied to production Supabase.
- Render URLs/services were previously reported by the product owner; this audit did not execute authenticated production smoke tests.
- Previous Vercel checks reported build-rate-limit. This is a platform quota failure, not evidence of a successful or failed source build.
- No current successful production build/deployment is asserted here.
- A previous test snapshot reported 546 Jest passed / 2 skipped and 183 Python tests passed. These are historical counts, not validation of the latest commit.

## Prioritized completion plan

### P0 — restore trusted persistence
1. Apply database/autonomous-farm-agent.sql to the production Supabase project.
2. Apply database/farm-finance-persistence.sql to the same project.
3. Run database/verify-assistant-persistence.sql.
4. Verify browser JWT propagation to farm, assistant and finance endpoints.
5. Run authenticated create → reload → read → update → delete tests, including a second account to verify ownership isolation.

### P1 — harden AI services one by one
1. Soil: deploy and test nullable response schema, NPK units, texture fractions and boundary cases; disclose deterministic provenance.
2. Crop: remove synthetic-demo outputs from production or label them; validate crop/season/location constraints.
3. Image: keep classifier unavailable until a trained model is deployed; do not manufacture disease confidence from heuristics.
4. Assistant: expose provider/model/source per answer and ground responses in selected-farm records.
5. Weather: cache and back off on 429; label forecast time/location and distinguish forecast from sensors.
6. Market: connect an official/licensed feed before claiming real-time prices or forecasts.
7. Irrigation, pest and yield: configure each endpoint and prove inference with contract tests and provenance.

### P2 — finish platform workflows
1. Implement budget-plan persistence (currently HTTP 501).
2. Finish role-based authorization and Arabic RTL across all dashboards.
3. Replace simulated admin metrics, notifications, marketplace, market and public-data values with sourced records or label them demo.
4. Validate livestock, inspector, government, investor and logistics workflows using real role accounts and database records.
5. Add end-to-end tests for onboarding, farm creation, soil report, assistant action confirmation, finance and collaboration.

### P3 — scale responsibly
1. Add model cards, dataset licenses, lineage, evaluation reports, calibration and drift monitoring.
2. Add audit trails, backups, retention/deletion, rate limits and observability.
3. Run Tunisia pilot trials with agronomists/farmers and publish measured outcomes before claiming accuracy or yield uplift.
4. Complete Arabic RTL, French and English across critical workflows.
5. Scale beyond Tunisia after operational metrics and support are stable.

## Release acceptance criteria

A module is production-ready only when it has:
- Correct role authorization and RLS ownership isolation.
- A real source/provider or explicitly disclosed deterministic/demo fallback.
- Input validation, safe errors, timeouts, retries/backoff and rate limits.
- Passing unit, contract and integration tests.
- A live smoke test proving the expected operation and persistence.
- UI disclosure of source, timestamp, uncertainty/confidence where applicable and limitations.
- Recorded deployment SHA and environment configuration.

## Evidence files

- FEATURE_MATRIX.md — historical live endpoint probe (2026-11-04), useful for provenance labels but not a fresh probe.
- database/autonomous-farm-agent.sql — agent settings and assistant persistence.
- database/farm-finance-persistence.sql — expense/revenue ledger migration.
- database/verify-assistant-persistence.sql — table/RLS verification and schema refresh.
- docs/SUPABASE_PERSISTENCE_RECOVERY.md — persistence recovery steps.
- server/routes/field-management.ts — authenticated farm creation.
- server/routes/assistant-conversations.ts — assistant history persistence.
- server/routes/farm-finance.ts — authenticated finance persistence and error classification.
