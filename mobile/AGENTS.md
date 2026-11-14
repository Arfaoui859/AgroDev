This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md

## AgroGrowth mobile — verified production integration (2026-11)

Facts confirmed by probing the live deployment, not copied from the README.

### Backend entry point
- The app's ONLY backend is the Express gateway at
  `https://agrodev-3.onrender.com`. Never call the Python AI microservices
  directly from mobile; the gateway holds the credentials.
- `src/config.ts` resolves the base URL as: `EXPO_PUBLIC_API_BASE_URL` override
  > production gateway (release build, `!__DEV__`) > local dev server
  (`10.0.2.2:5000` Android / `localhost:5000` otherwise, debug build).
  The pure `resolveApiBaseUrl()` is unit-tested in `tests/unit/config.test.ts`.
- Default request timeout is 30s because Render free instances cold-start
  slowly; 15s failed every cold start.

### Supabase
- Production project `https://jymrhhlwdbclctobhbsi.supabase.co`, anon key only
  (RLS-protected). `tests/unit/config.test.ts` asserts the embedded key is
  `role: anon` and that no `service_role`/`DATABASE_URL`/`postgres://` string is
  in the bundle.

### Live capability status (gateway `/api/ai/capabilities`)
- LLM provider: configured (`gemini`, `gemini-flash-lite-latest`); the assistant
  `/api/ai/assistant/chat` returns `dataSource: "llm"`, `isRealData: true`.
- `plant-disease-detection` / `leaf-scan`: `vision-model` (Gemini vision). Live
  upload to `/api/ai/images/detect-disease` returns `dataSource: "llm"`,
  `modelSource: "vision:gemini-flash-lite-latest"`. A vision LLM is generative,
  so the badge must read generative AI, never "trained model".
- `soil-analysis`, `crop-recommendation`, `climate-crop-matcher`,
  `smart-match`, `farming-tasks-planner`, `alert-notifier`: `rule-based`
  (`isRealData: false`).
- `pest-control` gateway endpoint is `rule-based` when the microservice is up
  (honest keyword match), 502 when down.
- `irrigation-optimizer`, `market-forecast`, `supply-demand`, `yield-predictor`,
  `weather-yield-planner`, `lab-soil-models`: `unavailable` — the underlying
  microservices report `synthetic-demo`/degraded, so the gateway fails closed
  (503 "Synthetic or heuristic microservice output is disabled").
- Weather `/api/weather/coordinates` is real Open-Meteo (`isRealData: true`) but
  can 502 with `provider: Open-Meteo` on a 429 daily-limit; the UI shows an
  honest error, not invented values.

### Microservice health (direct /health, for the status table only)
- soil-analysis: healthy, `model_source: deterministic-rules` (NOT trained).
- image-diagnosis: healthy, `mobilenetv3-plantvillage-v1` (trained CNN), but the
  gateway prefers the vision LLM for `/api/ai/images/detect-disease`.
- intelligent-agent: healthy, OpenRouter LLM.
- market-intelligence / irrigation-optimization / pest-control /
  crop-recommendation: reachable but `degraded`, `model_source: synthetic-demo`
  with disabled features — this is why their gateway capabilities are
  `unavailable`.
- weather/yield-intelligence: **Render env var
  `WEATHER_YIELD_INTELLIGENCE_URL` is set to the literal string `value`**, so
  `normalizeServiceUrl` builds `http://value` and DNS fails. This is a
  backend/Render configuration defect, not a mobile one; it must be fixed in
  Render, not in the app.

### Data-provenance labelling (Req 4 — verified)

Every screen that renders a server result must show *how* that result was
produced. The single source of truth is `src/utils/provenance.ts`
(`provenanceLabel`) plus `src/components/ui/ProvenanceBadge.tsx`.

- The API layer (`src/api/client.ts`) maps every envelope to a
  `ProvenanceMeta` via `metaFrom()` / `asProvenance()`. Backend sources such as
  `supabase.*`, `persisted-records` and `platform-database*` map to the honest
  `database` kind — a stored row is **never** upgraded to `live-observation`.
- Persisted-data reads (`getFarms`, `getFields`, `getNotifications`,
  `getAnimals`) return `{ data, error, fromCache, meta }`; their screens
  (`FarmManagementScreen`, `LivestockScreen`, `NotificationsScreen`) render the
  badge and default to `{ provenance: 'database', isRealData: false }` — never to
  `isRealData: true` — until the backend's own provenance arrives.
- AI/result screens render the badge from the response meta:
  `SoilAnalysisScreen`, `CropRecommendationScreen`, `DiseaseDetectionScreen` +
  `PlantScanner`, `WeatherDetailScreen`, `AgriNewsScreen`, `MultiAgentAIScreen`,
  `AIAssistantScreen` (per message), `HomeScreen` (weather), `MarketplaceScreen`,
  `GeneralServiceModal` (irrigation/pest).
- A rule-based or synthetic result must never be labelled like a trained model.
  The label wording is centralised so ar/fr/en agree.
- Regression coverage: `tests/integration/api-provenance.test.ts` asserts the
  stored-record and unavailable mappings; the screen tests assert the badge text
  renders. Run `npx jest` (offline, green) and `LIVE_API_TESTS=1 npx jest
  tests/live` (real gateway + Supabase).

### Soil → crop → cultivation-project flow (verified)

A single connected workflow that reuses existing gateway endpoints — no new
endpoint was added to the backend:

1. `SoilAnalysisScreen` — three steps (plot → measurements → report). Preferred
   path is `POST /api/soil-analysis/analyze` (auth-required; LLM advisory over
   the user-entered, unverified measurements, persisted per plot). On 503 it
   falls back to the deterministic rule-based engine and says so. Blank fields
   are never filled with invented values (`src/utils/soilInput.ts`).
2. `CropRecommendationScreen` — two honest paths. Plot path
   `POST /api/ai-recommendations` (auth-required) scores the plot's **saved**
   analysis; a 409 `PERSISTED_SOIL_DATA_REQUIRED` renders an explicit "saved
   analysis required" state instead of inventing a result. Manual path
   `POST /api/ai/crop-recommendation` runs the rule-based reference-table engine.
   `retry()` re-runs whichever path produced the current view.
3. `CultivationProjectScreen` — confirms crop/farm/plot/date, persists via
   `POST /api/assistant/actions/cultivations` (server validates ownership, area
   and date), then derives the checklist from the plot's persisted soil report
   (`GET /api/soil-analysis/reports` + `/report/:analysisId`), or an honest
   generic sequence when no plot/report is linked. Task ticks are stored
   on-device only (`src/api/projectTasks.ts`). A "matching products" section
   reads `GET /api/marketplace/listings` and shows an explicit unavailable state
   (503) until the store is connected.

Covered by `tests/unit/crop-recommendation-screen.test.tsx` and
`tests/unit/cultivation-project-screen.test.tsx`.

### Verified checks (2026-11)

- `npx tsc --noEmit` — clean.
- `npx expo lint` — clean.
- `npx jest` — 41 suites / 201 tests passing (7 skipped live suites).
- `npx expo-doctor` — 20/20 checks passed.
- `npx expo export --platform android` — bundles (832 modules) to Hermes
  bytecode successfully.
- `LIVE_API_TESTS=1 npx jest tests/live` — production-smoke and live-auth
  (7 tests) pass against `https://agrodev-3.onrender.com` and the live Supabase
  project.
