# AgroGrowth — Final Evidence-Based Engineering Audit & Completion Report

**Repository:** `Arfaoui859/AgroDev`
**Audit branch:** `feat/ai-integration-production-hardening`
**Audit HEAD:** `8fcab84` (`docs: record Gemini provider verification result`)
**Audit date:** 2026-11-04
**Mode:** AUDIT-ONLY. No application code, database, or deployment changes were
made during this audit. This document is the sole artifact produced.

> Every claim below is marked with the command that produced it. Anything not
> verified against running code, the live database, or an executed test is
> explicitly marked **[UNVERIFIED]**.

---

## 0. Method and evidence base

| Probe | Command | Result |
|-------|---------|--------|
| Branch / HEAD | `git branch --show-current` / `git log -1 --oneline` | `feat/ai-integration-production-hardening` / `8fcab84` |
| Clone depth | `git rev-parse --is-shallow-repository` | `true` (history incomplete) |
| Working tree | `git status --porcelain` | clean |
| Frontend scale | `find client -name '*.ts' -o -name '*.tsx' \| wc -l` | 207 files, 109,599 lines |
| Backend scale | `find server -name '*.ts' \| wc -l` | 91 files, 42,068 lines |
| Pages / routes | `ls client/pages/*.tsx` / `<Route` count | 102 pages / 63 routes |
| Jest suites | `npx jest` | 1 skipped, 56 passed, 56/57 |
| Jest tests | `npx jest` | 2 skipped, 456 passed, 458 |
| TypeScript | `npx tsc --noEmit` | exit 0 |
| Lint | `npm run lint` | exit 0, 0 warnings |
| Python tests | `python3 -m pytest tests/ -q` (in `agrogrowth-ai/`) | **180 passed**, 1 warning |
| Prod deps | `npm audit --omit=dev` | **0 vulnerabilities** |
| Live server | `npm run build` + start | `/api/health` → `{"status":"ok"}` |
| Live DB | read-only `psycopg2` session via `DIRECT_URL` | PostgreSQL 17.4 |

---

## 1. Completed phases

| Phase | Status | Evidence |
|-------|--------|----------|
| 1 — Repository understanding & audit | ✅ Complete | This document; route/table/test inventories below |
| 2 — Environment, dependency & startup repair | ✅ Complete | `npm run build` → `dist/server/node-build.mjs`; server boots; `/api/ping` → `{"message":"pong"}` |
| 3 — Backend & database stabilization | ✅ Prior work verified | RLS live on 22/23 tables; `on_auth_user_deleted` trigger present |
| 4 — Frontend functionality & API integration | ✅ Audited | 194 client `/api` paths, **0 unmatched** against server routes |
| 5 — AI agents & real provider integration | ⚠️ Partially blocked | Weather = real; LLM/vision = not configured → honest fallback |
| 6 — Security, reliability & performance | ✅ Audited | Findings in §7; **1 open finding (F-1)** |
| 7 — Full testing & regression correction | ✅ Complete | 456 Jest + 180 pytest + tsc + lint all green |
| 8 — Deployment readiness & documentation | ✅ Audited | CI has 8 jobs; deploy configs for Render/Railway/Vercel/Netlify/Docker |

---

## 2. Architecture as actually implemented

**Stack (verified from `package.json`, `Dockerfile`, source):**
- Frontend: React 18 + React Router 6 + Vite + TypeScript + TailwindCSS 3 + Radix UI.
- Backend: Express (TypeScript), bundled by a custom Vite SSR build to
  `dist/server/node-build.mjs`.
- Database: Supabase Postgres (server: PostgreSQL 17.4).
- AI: a Node-side provider layer (`server/services/providers/*`) **plus** 8
  self-hosted FastAPI microservices in `agrogrowth-ai/` (ports 8001–8008).

**AI provider layer (files, verified):**

| File | Role |
|------|------|
| `server/services/providers/llmProvider.ts` | Env-driven OpenAI-compatible / native Gemini text provider |
| `server/services/providers/visionProvider.ts` | Multimodal vision provider (`AI_VISION_MODEL`) |
| `server/services/providers/weatherProvider.ts` | Open-Meteo real weather |
| `server/services/providers/microserviceProxy.ts` | Forwards to Python services, tags provenance |
| `server/services/providers/gemini.ts` | Native Gemini adapter |
| `server/services/providers/aiTelemetry.ts` | Success/failure counters |
| `server/services/ai/farmAdvisor.ts` | Rule-based agricultural orchestrator (localised) |
| `server/services/ai/cropAdvisor.ts` | Rule-based crop advisor |
| `server/services/ai/knowledgeEngine.ts` | Agricultural knowledge base |

---

## 3. AI capability inventory (live: `GET /api/ai/capabilities`)

`llm: {"configured": false, "credentialAvailable": false, "provider":
"openai-compatible", "model": "gpt-4o-mini"}`
`summary: {"total": 15, "available": 7, "unavailable": 8, "modelPowered": 0}`

| # | Capability | Engine | Microservice configured |
|---|-----------|--------|------------------------|
| 1 | `soil-analysis` | rule-based | yes |
| 2 | `crop-recommendation` | rule-based | yes |
| 3 | `climate-crop-matcher` | rule-based | yes |
| 4 | `smart-match` | rule-based | no |
| 5 | `farming-tasks-planner` | rule-based | no |
| 6 | `agro-chat` | rule-based | no |
| 7 | `alert-notifier` | rule-based | no |
| 8 | `plant-disease-detection` | unavailable | yes |
| 9 | `leaf-scan` | unavailable | yes |
| 10 | `pest-control` | unavailable | yes |
| 11 | `weather-yield-planner` | unavailable | yes |
| 12 | `yield-predictor` | unavailable | yes |
| 13 | `irrigation-optimizer` | unavailable | yes |
| 14 | `market-forecast` | unavailable | yes |
| 15 | `supply-demand` | unavailable | yes |

**Interpretation:** 0 capabilities are model-powered in this environment. Seven
answer honestly from the deterministic rule-based engine; eight report
`unavailable` (they need either a configured provider key or the corresponding
Python microservice running) rather than fabricating output.

### 3.1 Live AI endpoint behaviour (verified by POST probe)

| Endpoint | HTTP | Provenance reported |
|----------|------|---------------------|
| `POST /api/ai/soil/analyze` | 200 | `dataSource: "rule-based"`, `isRealData: false` |
| `POST /api/ai/crops/recommend` | 200 | `dataSource: "rule-based"`, `isRealData: false` |
| `POST /api/ai/assistant/chat` | 200 | `dataSource: "rule-based"`, `isRealData: false` |
| `POST /api/ai/images/detect-disease` (multipart `file`) | **503** | `"Plant Disease Detection service unavailable"` |
| `POST /api/ai/images/detect-disease` (non-image file) | 400 | `"نوع الملف غير مدعوم..."` (validation works) |
| `POST /api/ai/market/forecast-prices` (missing `current_price`) | 400 | `dataSource: "none"`, `isRealData: false` |
| `POST /api/disease/analyze` (no image) | 400 | Arabic "upload an image" validation error |

**Honesty verdict:** ✅ The AI surface never presents a rule-based or failed
result as a genuine model inference. Vision returns an honest **503**, not a
guessed diagnosis.

### 3.2 Real data sources (verified)

- **Weather:** `GET /api/weather/coordinates?lat=36.8&lon=10.18` →
  `source: {provider: "Open-Meteo", observationTime: "2026-11-04T12:45",
  isRealData: true}`, live temperature 23 °C. **Genuinely real.**
- **Market:** `GET /api/market/all` → `dataSource: "database"`,
  `isRealData: true`, `totalCrops: 0` (empty table, honestly reported).

---

## 4. Database audit (live, read-only)

**Server:** PostgreSQL 17.4 (aarch64), Supabase-managed.

| Metric | Value |
|--------|-------|
| Public tables | 23 |
| RLS enabled | **22** |
| RLS disabled | 1 (`spatial_ref_sys`, PostGIS system table — expected) |
| Policies | Present on all 22 RLS-enabled tables (1–6 each) |
| `users` rows | 1 |
| Business tables (`farms`, `soil_analyses`, `market_prices`, …) | **0 rows** |
| Trigger on `auth.users` | `on_auth_user_deleted` ✅ |
| FK `public.users` → `auth.users` | **none** (documented limitation) |

**Grants note:** `anon` and `authenticated` hold broad table privileges on
`public.farms` (SELECT/INSERT/UPDATE/DELETE/TRUNCATE), but RLS is enabled and
policies gate access, so the effective posture is fail-closed. The broad grants
are inherited Supabase defaults, not an application decision.

---

## 5. Frontend audit

- **Route coverage:** 63 `<Route>` declarations across 102 page components.
- **API contract integrity:** 194 distinct client `/api` paths were extracted
  and matched against 172 server route literals + 28 mount prefixes →
  **0 unmatched client paths** (no dead client→server calls).
- **Data honesty coverage:** 54 pages/components render
  `SimulatedDataNotice` or `DataProvenanceBanner`. Server-side,
  `withSimulatedProvenance` stamps 28 router prefixes; verified live header
  `X-Data-Provenance: simulated` on `/api/saas/metrics`,
  `/api/investor/dashboard`, `/api/segmentation/segments`,
  `/api/collaboration/forum/posts`, `/api/logistics/orders`,
  `/api/subscription/plans`. `/api/marketplace/listings` and
  `/api/supply-chain/nodes` additionally return `dataSource: "simulated"`.
- **Auth gating:** `ProtectedRoute` is used on only **3 of 63** routes; role
  enforcement is otherwise delegated to server-side `requireAuth`/RLS.
- **Localization reality:** `LanguageContext` exposes only an `isArabic`
  boolean (ar/en) — there is **no** i18n framework and **no** French UI toggle.
  72/102 pages hardcode `dir="rtl"`. **[FR/EN UI = UNVERIFIED beyond AI
  response bodies.]**
- **Dead code:** 9 components are imported nowhere:
  `AlertFeed`, `EnhancedLayout`, `FeatureNotAvailable`, `MarketAnalyticsWidget`,
  `MobileNavigation`, `PWAInstallPrompt`, `PlaceholderPage`,
  `SoilStatusIndicator`, `UnifiedAlertSystem`.

---

## 6. Backend audit

- 91 TypeScript files, 42,068 lines; 28 router mount prefixes.
- Middleware chain (`server/index.ts`): `helmet` security headers →
  CORS (env-gated) → `express.json` (2 MB) → `apiRateLimiter` →
  `aiRateLimiter` on AI routes → routes → 404 → JSON error handler.
- Auth: `requireAuth` (verified Supabase JWT, else demo identity only outside
  production) and `requireAdminToken` (timing-safe, fails closed in prod).
- Honest 404 fallback: unknown `/api/*` → `{"error":"API endpoint not found"}`.
- `/api/test/supabase` → `{"error":"This endpoint is disabled."}` in prod
  posture. `/api/public/market-prices` → 401 without API key (key-gated). ✅

---

## 7. Security audit

| Control | Status | Evidence |
|---------|--------|----------|
| Security headers | ✅ | `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN` on `/api/health` |
| CORS | ✅ | Allow-list via `CORS_ORIGINS`, same-origin allowed, dev-permissive only |
| Rate limiting | ✅ | General 300/min, AI 30/min, key-mint 5/hr (env-tunable) |
| Admin token | ✅ | Constant-time compare (`timingSafeEqualStr`) |
| Prod secret scan | ✅ | `npm audit --omit=dev` → 0 vulnerabilities |
| Committed keys | ⚠️ | `client/lib/supabase.ts`, `scripts/seed-database.js`, `scripts/setup-demo-users.js` embed a JWT whose decoded `role` claim is **`anon`** (public client key, project ref `jymrhhlwdbclctobhbsi`). Not a privileged leak, but hardcoding it in three places is poor hygiene. |
| `.env` handling | ✅ | `.env` is gitignored (`git check-ignore -v .env` → `.gitignore:30`); no secret values committed |

### 🔴 Open finding F-1 — unauthenticated admin panel API

`server/index.ts` lines 532–538 register `GET /api/admin/{overview,users,
system-metrics,usage-analytics,security-events,activity-logs,subscriptions}`
**without** `requireAdminToken()`. Live probe:

```
GET /api/admin/users -> HTTP 200
{"success":true,"data":[{"id":"user_001",...,"role":"government",...}]}
```

The backing `AdminPanelService` (`server/routes/admin-panel.ts:391`) generates
**mock** data (`generateMockUsers()`, 50 synthetic users), so no real personal
data leaks today. **However**, the endpoints are reachable anonymously, are
mounted under the `/api/admin` simulated-provenance prefix, and would expose
real PII the moment the service is wired to the database.

**Recommended fix (not applied — audit-only):** add
`requireAdminToken()` to all seven `GET /api/admin/*` handlers.

**Severity:** Medium (defense-in-depth; no live data exposure now).

### Other security notes
- The earlier-session Gemini credential was verified invalid
  (`INVALID_ARGUMENT: API key not valid`) and is **not** in the codebase or
  `.env`. The exposed value must not be reused.
- Full `npm audit` (incl. devDependencies) reports 31 advisories (4 low, 21
  moderate, 6 high), all inside the Jest transform chain — **dev-only, no
  production impact**.

---

## 8. Bugs discovered and fixed (this engagement)

| # | Bug | Root cause | Fix | Commit |
|---|-----|-----------|-----|--------|
| 1 | RLS disabled on `weather_data` while `anon` held grants | Table omitted from hardening migration | Added to `database/rls-hardening.sql` | `62a63bc` |
| 2 | Deleting an account orphaned profile + farms | No FK from `public.users` to `auth.users` | `on_auth_user_deleted` trigger (`database/user-lifecycle.sql`) | `62a63bc` |
| 3 | French/English advisor answers contained Arabic | Rule-based body hardcoded Arabic | Full localisation (ar/fr/en) + test | `9628675` |
| 4 | `AGENTS.md` described the starter template | Stale repo memory (claimed Vitest, port 8080) | Corrected to verified facts | `2295e1e` |
| 5 | Fixture-driven pages looked like live data | Missing disclosure UI | `SimulatedDataNotice` on 8 pages | `88c18cb` |

---

## 9. Tests executed — actual results

| Suite | Command | Result |
|-------|---------|--------|
| Jest (full) | `npx jest` | **456 passed, 2 skipped, 458 total**; 56/57 suites (1 skipped) |
| Live provider tests | `npx jest --testMatch='**/tests/live/**'` | 2 skipped (no provider key) |
| TypeScript | `npx tsc --noEmit` | exit 0, no errors |
| ESLint | `npm run lint` | exit 0, 0 warnings |
| Python | `pytest tests/ -q` | **180 passed**, 1 deprecation warning |
| npm audit (prod) | `npm audit --omit=dev` | 0 vulnerabilities |
| Build | `npm run build` | `dist/server/node-build.mjs` (1,122.50 kB) |

Test layout: 45 integration, 11 unit, 1 live (Jest); 15 files (Python).

---

## 10. Deployment readiness

- **CI** (`.github/workflows/ci.yml`): 8 jobs — code-quality (lint),
  tests (Node 20 & 22, coverage), build, ai-services (pytest), database-rls,
  docker-build, security-scan, deployment-check.
- **Deploy** (`.github/workflows/deploy.yml`): triggers on `main`; targets
  Docker Hub, Netlify, Railway, Vercel, with Slack notify.
- **Configs present:** `Dockerfile` (multi-stage, prod runtime on port 8080),
  `docker-compose.yml` (frontend 5173, backend 8080, AI 8001–8008, Postgres,
  Redis, Adminer, nginx), `render.yaml` (platform + 6 Python web services +
  Postgres + Redis), `railway.toml`, `vercel.json`, `netlify.toml`.
- **Not deployed by this audit.** No production action taken.

---

## 11. Remaining external dependencies

| Dependency | Needed for | Current state |
|-----------|-----------|---------------|
| LLM provider key (`AI_BASE_URL`+`AI_API_KEY`, or `GEMINI_API_KEY`/`GOOGLE_API_KEY`) | Model-backed chat/advisory | Not set → rule-based fallback active |
| Vision provider (`AI_VISION_MODEL`) or image-diagnosis microservice | Plant-disease detection | Not set → honest 503 |
| Python microservices (8001–8008) running | pest, irrigation, yield, market engines | Not running → `unavailable` |
| `market_prices` data feed | Market intelligence | Table empty (0 rows) |
| `WEATHER_API_KEY` | (optional) weather | Open-Meteo needs no key and works |

---

## 12. Known limitations

1. `public.users` has no FK to `auth.users` — cascade cleanup relies on the
   `on_auth_user_deleted` trigger instead of referential integrity.
2. No i18n framework; French UI is not implemented (only ar/en boolean +
   localized AI responses).
3. 8 AI capabilities are not model-powered in this environment.
4. 9 unused components remain (dead code).
5. `ProtectedRoute` covers only 3/63 routes; the rest rely on server-side auth.
6. `AdminPanelService` returns mock data (honestly labelled, but not real).
7. Git history is shallow (`is-shallow-repository: true`); blame/merge-base
   operations are unreliable without `git fetch --unshallow`.

---

## 13. Next engineering tasks (prioritised)

1. **Fix F-1**: add `requireAdminToken()` to the seven `GET /api/admin/*`
   routes; add a regression test asserting 401 anonymously.
2. Configure an LLM + vision provider key and re-run
   `tests/live/*`; verify model-powered responses end to end.
3. Bring up the Python microservices (Docker Compose) and verify each
   specialised endpoint against the Node proxy.
4. Populate or ingest a real `market_prices` feed.
5. Add a proper i18n layer (ar/fr/en) to replace the `isArabic` boolean.
6. Delete or wire up the 9 unused components; extend `ProtectedRoute` coverage.
7. `git fetch --unshallow` in CI to restore full-history tooling.

---

## 14. Bottom line

AgroGrowth is a **large (≈152k LOC), genuinely engineered platform** with a
green build, green tests (456 Jest + 180 pytest), a real weather integration,
and an **honest AI posture** — it labels rule-based output, returns 503 for
unavailable vision instead of guessing, and stamps simulated data with
machine-readable provenance.

It is **not yet production-ready for real farmers** because the highest-value
AI capabilities (LLM advisory, vision diagnosis) have **no provider
configured**, the Python engines are not running, and the market table is
empty. One medium-severity security gap (unauthenticated admin API, F-1) and
several hygiene items remain. None of these are architectural blockers; each
has a concrete, low-risk remediation listed in §13.
