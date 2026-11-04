# AgroGrowth — Engineering Progress Report

Maintained by the autonomous engineering team. Only verified facts are
recorded here; anything not yet confirmed against running code or the live
database is listed under "Remaining work" or "Known limitations".

## Environment

- Repository: `Arfaoui859/AgroDev`
- Working branch: `feat/ai-integration-production-hardening`
- Runtime: Node + Express (SSR build in `dist/server/node-build.mjs`),
  React 18 SPA, Supabase Postgres (PostgreSQL 17.4).
- Python AI microservices in `agrogrowth-ai/` (FastAPI, ports 8001–8005).

## Completed work

### Phase 1 — Repository understanding and audit
- Audited frontend pages, backend routes, AI services, DB schema, auth,
  Docker/CI, tests and docs.
- Established that the AI layer has a deterministic rule-based engine as the
  honest fallback and reports provenance per capability via
  `GET /api/ai/capabilities`.

### Phase 2 — Environment and startup
- Confirmed the built server starts and serves (`/api/ping` → pong).
- Confirmed `.env` loading via `dotenv/config`; server honours `PORT`.
- Corrected the repository `AGENTS.md` (it still described the starter
  template: it claimed Vitest and port 8080).

### Phase 3 — Backend and database stabilization
- Audited live RLS posture: RLS was off on several per-user tables while
  `anon`/`authenticated` held broad grants, so isolation was not enforced.
- Applied `database/rls-hardening.sql` (idempotent): enabled RLS and added
  owner/expert policies across all user tables. Extended it to cover
  `weather_data`, which had been left world-readable.
- Fixed user-lifecycle integrity: deleting an `auth.users` row left an
  orphaned `public.users` profile (no FK) and its farms. Added
  `database/user-lifecycle.sql` — an `AFTER DELETE` trigger on `auth.users`
  that removes the profile and lets `ON DELETE CASCADE` clean up the rest.

### Phase 4 — Frontend functionality and API integration
- Labeled the mock-driven `FieldManagement` page with the shared
  `SimulatedDataNotice` so its fixture data is not mistaken for live records.

### Phase 5 — AI agents and real providers
- Verified the farm advisor answers in the requested language end to end.
  Fixed a real bug: the rule-based answer body was hardcoded Arabic, so
  French and English callers received Arabic soil guidance, crop names and
  water-need labels. The body, context summary and provenance disclaimers
  are now localised (ar/fr/en).
- Verified honesty across the AI surface: soil/crop answers are labeled
  `dataSource: "rule-based"` / `isRealData: false`; the plant-disease
  endpoint returns an honest 503 (never a fabricated diagnosis) when no
  vision provider or microservice is available; weather is real
  (Open-Meteo, `source.isRealData: true`); market data reports
  `dataSource: "database"`.

## Bugs discovered and fixed

| # | Bug | Root cause | Fix |
|---|-----|-----------|-----|
| 1 | RLS disabled on `weather_data` while anon held grants | Table omitted from the hardening migration | Added to `rls-hardening.sql` |
| 2 | Deleting an account left orphaned profile + farm data | No FK from `public.users` to `auth.users` | `on_auth_user_deleted` trigger |
| 3 | French/English advisor answers contained Arabic | Rule-based body hardcoded in Arabic | Full localisation of the rule-based answer |

## AI providers and models integrated

- **LLM**: env-driven OpenAI-compatible provider (`AI_BASE_URL`,
  `AI_API_KEY`, `AI_MODEL`) with bounded retries, timeouts and telemetry.
  Not configured in this environment, so the honest rule-based engine
  answers instead.
- **Vision**: configurable multimodal provider (`AI_VISION_MODEL`), plus a
  configurable image-diagnosis microservice. Not configured here; the
  endpoint reports unavailability rather than guessing.
- **Weather**: Open-Meteo (live, verified).
- **Market**: platform database (`market_prices`).

## Database changes

- `database/rls-hardening.sql` — RLS enabled + policies on all user tables
  (48 policies), including `weather_data`.
- `database/user-lifecycle.sql` — `auth.users` delete trigger for cascade
  cleanup of the profile row.

## Tests executed (actual results)

- Jest full suite: **456 passed, 2 skipped, 56 suites** (was 453 before the
  localisation work; +3 new localisation tests).
- `npx tsc --noEmit`: clean.
- Live RLS isolation: anon sees 0 rows, owner sees their row, another user
  sees 0 rows.
- Live end-to-end farmer flow: 7/7 checks (create user → sign in → farm /
  field CRUD with the user JWT → isolation).
- Live account-deletion test: create user + farm → delete auth user →
  **0 orphaned rows**.
- Live localisation check: `language=fr`/`en` return fully localised
  answers; `language=ar` unchanged.

## Remaining external dependencies

- An LLM provider key (`AI_BASE_URL`/`AI_API_KEY`) to enable model-backed
  answers instead of the rule-based engine.
- A vision provider (`AI_VISION_MODEL`) or the image-diagnosis microservice
  running, to enable real plant-disease detection.
- The Python AI microservices (ports 8001–8005) deployed/running for the
  specialised engines.

## Known limitations

- The rule-based engine's per-parameter soil recommendation sentences are
  authored in Arabic only; for fr/en they are shown under a localised
  heading with an explicit note.
- The `agroadmin@growth.com` profile has no matching `auth.users` row (legacy
  data), which is why a hard FK constraint was not added.

## Security notes

- Secrets live only in the gitignored `.env`; no secret values are printed
  or committed.
- RLS is fail-closed for anonymous access; every new table must have RLS
  enabled and explicit policies.

## Next engineering tasks

1. Configure and verify a real LLM + vision provider; re-run
   `tests/integration/llm-live.test.ts`.
2. Bring up the Python AI microservices and verify each specialised endpoint.
3. Continue the frontend audit for any remaining mock-driven pages lacking a
   `SimulatedDataNotice`.
4. Expand API integration and end-to-end coverage for the remaining modules.
