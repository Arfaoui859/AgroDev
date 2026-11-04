# AgroGrowth — Production Deployment Checklist

**Branch:** `feat/ai-integration-production-hardening` · **HEAD:** `7c5b3cb`
**Date:** 2026-11-04 · **Owner:** release engineer + platform admin

Work top-to-bottom. Each item has a verification command. Do not deploy until
every **P0** box is ticked. Tick **P1** before opening to real users.

---

## 0. Pre-flight (repo hygiene)

- [ ] **Confirm the branch/commit to ship.**
  `git rev-parse HEAD` → record the SHA in the release notes.
- [ ] **Working tree contains only intended changes.**
  `git status --short` — expect the P1 hardening edits + the audit docs.
- [ ] **Do not commit `.env`.** `git ls-files | grep -E '^\.env$'` → empty.
- [ ] **Build output is not tracked.** `dist/` and `build/` are ignored
  (`git check-ignore dist build`). Build in CI, do not commit bundles.

## 1. Automated gates (must all pass)

- [ ] `npx tsc --noEmit` → exit 0
- [ ] `npm run lint` (`--max-warnings 0`) → exit 0
- [ ] `npx jest --silent` → 0 failures (baseline: **575 passed, 2 skipped**)
- [ ] `agrogrowth-ai/.venv/bin/python -m pytest tests` → 0 failures (baseline: **194 passed**)
- [ ] `npm run build` → SPA in `dist/` **and** `build/server/node-build.mjs`
- [ ] `npm audit --omit=dev` → 0 vulnerabilities
- [ ] **No source map in the build output:**
  `find dist build -name '*.map'` → empty

## 2. Environment & secrets (P0 — B-1)

- [ ] Set in the host secret store (never in the repo):
  - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_PUBLISHABLE_KEY`,
    `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `DIRECT_URL`
  - **`APP_ORIGIN=https://<public-host>`** (required by the hardened CORS —
    B-14). On Render, `RENDER_EXTERNAL_URL` is injected automatically.
  - `CORS_ORIGINS` — any additional explicitly-trusted domains (comma separated)
  - AI provider: `AI_PROVIDER=gemini` + `GEMINI_API_KEY` **or**
    `AI_BASE_URL` + `AI_API_KEY`
  - Pin models explicitly: `AI_TEXT_MODEL`, `AI_VISION_MODEL` (see §3)
  - Per-service URLs: `SOIL_ANALYSIS_URL`, `CROP_RECOMMENDATION_URL`,
    `IMAGE_DIAGNOSIS_URL`, `MARKET_FORECAST_URL` (or `MARKET_PREDICTION_URL`),
    `SMART_ASSISTANT_URL` (or `INTELLIGENT_AGENT_URL`),
    `SMART_MARKETPLACE_URL` (or `WEATHER_YIELD_INTELLIGENCE_URL`),
    `PEST_CONTROL_URL`, `IRRIGATION_OPTIMIZATION_URL`
- [ ] Rotate any key that has ever been pasted into a chat/CI log.
- [ ] Confirm the running process logs **no** secret at startup.

## 3. AI provider verification (P0/P1)

- [ ] **Pin a model that serves in your region.** Built-in default is
  `gemini-flash-lite-latest` (verified serving 2026-11-04). Set
  `AI_TEXT_MODEL`/`AI_VISION_MODEL` explicitly; `gemini-2.5-flash-lite` and
  `gemini-2.0-flash-lite` returned 404, `gemini-flash-latest` returned 503
  during a high-demand window.
- [ ] **Health probe returns reachable.**
  `curl -s $BASE/api/system/ai/health` → `"reachable": true`.
  If `errorKind:"timeout"`, re-check (probe is cached 60 s) and confirm the
  provider is not under load; set `AI_TIMEOUT_MS` to your latency budget
  (probe timeout is `AI_HEALTH_TIMEOUT_MS`, default 45 s).
- [ ] **Real text inference.**
  `AI_LIVE_TESTS=1 AI_PROVIDER=… AI_API_KEY=… npx jest tests/live/real-provider-smoke.test.ts`
  → PASS (asserts provenance/structure, not a specific answer).
- [ ] **Real vision inference** (requires an approved leaf image):
  `AI_LIVE_VISION_TESTS=1 AI_LIVE_TEST_IMAGE=/path/leaf.jpg …` → PASS.
- [ ] **Capabilities reflect reality.** `curl -s $BASE/api/ai/capabilities` —
  confirm each engine label matches what is actually deployed.

## 4. Database & RLS (P0 — B-2)

- [ ] Apply `database/rls-hardening.sql` to the target DB (idempotent).
- [ ] Apply `database/user-lifecycle.sql` (installs `on_auth_user_deleted`).
- [ ] **Live RLS proof:**
  - [ ] as `anon`: sensitive tables (`user_analytics`, …) are denied
  - [ ] as user A: user B's farms/fields/sections return **0** rows
  - [ ] delete a test auth user → the `public.users` profile row is gone and
    children cascade
- [ ] Confirm every new table has **both** RLS enabled **and** policies (grants
  to `anon`/`authenticated` are broad; isolation is RLS-only).

## 5. Microservices (P1 — B-7)

- [ ] Start all eight: `bash scripts/start-ai-services.sh`; then
  `bash scripts/start-ai-services.sh --check` → all `UP`.
- [ ] Confirm each `/health` declares its true `model_source`
  (`synthetic-demo`/`heuristic-demo`/`rule-based-demo` today; the two LLM-backed
  services report `gemini:*`). Do **not** present these as trained models in the
  UI.
- [ ] When a service is down, the Node endpoint returns **503**, never a
  fabricated result.

## 6. Market data (P0/P2 — B-3)

- [ ] Decide: integrate a licensed feed **or** scope the feature as "demo".
- [ ] If demo: confirm `/api/market-analysis/prices/current` keeps
  `X-Data-Provenance: simulated` / `X-Is-Real-Data: false`, and the UI shows the
  simulated-data notice.
- [ ] If real: seed `market_prices` and confirm `/api/market/all` returns rows
  with `dataSource:"database"`.

## 7. CORS & static serving (P0 — S-1, S-2)

- [ ] **Backend source is not downloadable.**
  `curl -s -o /dev/null -w '%{http_code}' $BASE/server/node-build.mjs` → `404`;
  same for `$BASE/server/node-build.mjs.map` and `$BASE/build/server/node-build.mjs`.
- [ ] **SPA + assets load.**
  `curl -s -o /dev/null -w '%{http_code} %{content_type}' $BASE/` → `200 text/html`;
  `$BASE/assets/<hashed>.css` → `200 text/css`; `$BASE/assets/<hashed>.js` → `200 application/javascript`.
- [ ] **SPA fallback intact.** `$BASE/some/deep/route` → `200 text/html`.
- [ ] **Unknown asset is a real 404.** `$BASE/assets/missing.js` → `404`, not HTML.
- [ ] **CORS exact-origin works.** `curl -i -H 'Origin: https://<host>' $BASE/api/ping`
  → `Access-Control-Allow-Origin: https://<host>`.
- [ ] **CORS rejects an attacker Host+Origin.**
  `curl -i -H 'Host: attacker.example' -H 'Origin: https://attacker.example' $BASE/api/ping`
  → **no** `Access-Control-Allow-Origin`.

## 8. Security headers & edge config (P2 — B-9)

- [ ] Set a Content-Security-Policy at the edge (helmet CSP is disabled).
- [ ] Confirm `Strict-Transport-Security`, `X-Content-Type-Options`,
  `X-Frame-Options` are present.
- [ ] Enable rate limiting at the edge if not already configured.

## 9. Frontend / i18n / provenance (P1)

- [ ] (B-6) Until all pages are migrated, label the language switcher honestly
  or hide unsupported locales.
- [ ] Walk the farmer workflow screens (soil, crops, disease, irrigation, pest,
  weather/yield, market) in **ar, fr, en**; confirm no hard-coded Arabic leaks
  and no untranslated English appears under French.
- [ ] Confirm every simulated/demo page renders the provenance notice
  (`SimulatedDataNotice` / `AIProvenanceNotice`).
- [ ] Smoke-test the SPA build: `PORT=5000 node build/server/node-build.mjs`,
  then `curl -s localhost:5000/api/ping` → `{"message":"ping"}` and an unknown
  `/api/*` → JSON 404.

## 10. Post-deploy verification

- [ ] `GET /api/ping` → 200.
- [ ] `GET /api/system/ai` → provider configured, no credential returned.
- [ ] `GET /api/system/ai/health` → `reachable:true` (allow for cold start).
- [ ] `GET /api/admin/users` anonymous → **401**.
- [ ] `GET /server/node-build.mjs` → **404** (backend source not served).
- [ ] One end-to-end real request through the assistant (text) returns
  `dataSource:"llm"`, `isRealData:true`.
- [ ] Roll back plan documented: previous image tag + the env vars to restore.

---

## Sign-off

| Role | Name | Date | Signature |
|---|---|---|---|
| Release engineer | | | |
| Platform / DB admin | | | |
| Product owner (data provenance) | | | |
