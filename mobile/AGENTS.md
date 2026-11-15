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

### AI assistant conversational memory (verified)

`AIAssistantScreen` sends the prior turns (`history`) and threads back the
gateway's `conversationId` (`POST /api/ai/assistant/chat` accepts both and
returns the id for a verified session). Without this the model answered each
message with no context and the server wrote one conversation per turn.
Anonymous callers keep a null thread id; the history is bounded to the last 12
turns, matching the gateway's own cap. Covered by
`tests/unit/ai-assistant-screen.test.tsx`.

### Home discovery: intelligence strip, news, learning videos, season agenda (verified)

`HomeScreen` now carries four real, provenance-honest discovery sections above
the urgent-alert panel. None of them invent data:

- **`IntelligenceStrip`** (`src/components/home/IntelligenceStrip.tsx`) renders
  the gateway's own `GET /api/ai/capabilities` document. Each chip's on/off dot
  is `cap.engine !== 'unavailable'`; an unavailable capability is shown as
  unavailable, never hidden or dressed up. Tapping a chip opens the screen that
  actually backs the capability (`CAPABILITY_SERVICE`), falling back to the full
  capability matrix (`MultiAgentAIScreen`). No count is estimated.
- **`HomeNewsPreview`** reads real publisher RSS via `GET /api/news`.
- **`LearningVideos`** (`src/components/home/LearningVideos.tsx`) surfaces a
  curated, static editorial catalogue of real YouTube videos
  (`src/data/agriculturalVideos.ts`); it plays on YouTube via `Linking` and
  labels the source. This is deliberately a *curated list*, not a live AI feed —
  titles/channels are verbatim and the catalogue is not derived from the server.
- **`SeasonAgenda`** (`src/components/home/SeasonAgenda.tsx` +
  `src/utils/season.ts`) is a general northern-hemisphere seasonal reminder,
  explicitly labelled `homeSeasonGeneral` ("General guidance") because it is not
  specific to the user's farm.

The full catalogue lives in `LearningVideosScreen`
(`src/screens/services/LearningVideosScreen.tsx`, route id `learning`), reachable
from Home and from the Services directory. Category filters + watch links are
covered by `tests/unit/learning-videos-screen.test.tsx`,
`tests/unit/agricultural-videos.test.ts`, `tests/unit/season-video-labels.test.ts`
and `tests/unit/home-discovery.test.tsx`.

### Profile / account screen (verified)

`ProfileScreen` hosts no role switcher at all. The account role is a
server-side fact chosen once during the Persona onboarding flow, so the screen
renders it as a read-only identity badge and never re-prompts. The demo-era
`roleGrid` / `demoModeSwitch` / `demoModeNotice` UI, its styles, and the
`profilePersonaButton` shortcut into `PersonaSelectorModal` were removed.
Role *preference* (interface + shortcut ordering only) stays adjustable through
the one-time `PersonaSelectorModal` onboarding step in `App.tsx`, which the
Profile screen no longer opens. Covered by `tests/unit/profile-screen.test.tsx`
(asserts no role/persona selector is exposed).

### Live image diagnosis re-verified (2026-11)

A real multipart upload to `POST /api/ai/images/detect-disease` with field
`file` (plus `plant_type` / `plant_part` / `symptoms`) returns HTTP 200 with
`dataSource: "llm"`, `modelSource: "vision:gemini-flash-lite-latest"`,
`provider: "gemini"` — a generative vision model, so the badge reads generative
AI, never "trained model". The mobile client
(`diagnosePlantDisease` → `buildImageForm`) already sends the correct field
name; a wrong field (`image`) makes multer answer
`400 LIMIT_UNEXPECTED_FILE`.

Note: the gateway maps `primary_disease.disease` to the vision model's
`diseaseId`, which can be a machine slug (`unclear_image`). The client must not
render that as the diagnosis title; `diagnosePlantDisease` now prefers a
human-readable `disease_name`, then the Arabic display name, then a generic
localised label.

### Verified checks (2026-11)

- `npx tsc --noEmit` — clean.
- `npx expo lint` — clean.
- `npx jest` — 48 suites / 235 tests passing (7 skipped live tests across 2
  suites: `tests/live/production-smoke.test.ts`, `tests/live/live-auth.test.ts`).
- `npx expo-doctor` — 20/20 checks passed.
- `npx expo export --platform android` (and `--platform web`) — bundles
  successfully (Hermes bytecode for Android).
- `LIVE_API_TESTS=1 npx jest tests/live` — production-smoke and live-auth
  (7 tests) pass against `https://agrodev-3.onrender.com` and the live Supabase
  project.

### Runtime render check (no device required)

The web export renders the whole app in a browser, which is the fastest way to
verify a UI change end to end:

```bash
npx expo export --platform web --output-dir /tmp/mob-web
cd /tmp/mob-web && python3 -m http.server 12001   # then open the work-2 host
```

The unauthenticated render shows Home (intelligence strip, Academy tiles, news,
learning videos) plus the first-run persona modal. Tapping an Academy video tile
(e.g. "التقليم") navigates to `LearningVideosScreen` pre-filtered to that
category — this is how the category pass-through bug was confirmed fixed. Live
data (weather/news) needs a session; the offline gateway also serves cached
reads. Remove `/tmp/mob-web` and stop the server when done.

### Live AI service audit (2026-11, gateway `agrodev-3.onrender.com`)

Every mobile service function was probed against the deployed gateway. The
mobile client calls only the Express gateway, never a Python microservice
directly, and each surface reports the engine the backend actually declares:

| Endpoint | HTTP | Honest engine / state |
|---|---|---|
| `GET /api/ai/capabilities` | 200 | capability matrix, per-capability `engine` |
| `POST /api/ai/soil-analysis` | 200 | `dataSource: rule-based`, `isRealData: false` |
| `POST /api/ai/crop-recommendation` | 200 | `dataSource: rule-based`, `isRealData: false` |
| `POST /api/ai/images/detect-disease` | 200 | `dataSource: llm` (generative vision, not a trained model) |
| `POST /api/ai/assistant/chat` | 200 | `dataSource: llm`, `isRealData: true` (generative advisory) |
| `GET /api/weather/coordinates` | 200 | Open-Meteo, `isRealData: true` |
| `GET /api/news` | 200 | `dataSource: rss-feeds`, `isRealData: true` |
| `GET /api/market/all` | 503 | `MARKET_DATA_NOT_AVAILABLE` — no recorded prices |
| `POST /api/pest-control/identify-from-symptoms` | 502 | `PEST_SERVICE_UNAVAILABLE` (honest) |
| `POST /api/irrigation-optimization/water-requirements` | 503 | microservice not reachable (honest) |
| `POST /api/weather-yield-intelligence/predict-yield` | 503 | `yield-predictor` unavailable (honest) |
| `POST /api/ai/market/supply-demand` | 503 | `MARKET_MODEL_NOT_VALIDATED` (honest) |
| `POST /api/ai/market/forecast-prices` | 503 | `MARKET_MODEL_NOT_VALIDATED` (honest) |

The mobile UI renders an explicit unavailable/empty state for each 5xx above;
none of them is turned into a fabricated success. The Marketplace screen adds a
read-only "Market intelligence" panel that reflects the capability document for
price-forecast and supply/demand instead of inventing trends.

### UI consistency polish pass (verified 2026-11)

A cross-screen consistency pass centralised the shared chrome so the same
treatment is used everywhere:

- **`SectionHeader`** (`src/components/ui/SectionHeader.tsx`) is the one section
  title used by Home and the home discovery components
  (`IntelligenceStrip`, `HomeNewsPreview`, `LearningVideos`, `SeasonAgenda`,
  `AcademySection`). It supports an optional leading icon, subtitle, trailing
  node (e.g. a `Badge`) or a "see all" action. Home's inline quick-actions and
  urgent-alerts headers now use it too, and their bespoke `sectionHeader` /
  `sectionTitle` / `linkButton` styles were deleted.
- **`ScreenHeading`** (`src/components/ui/ScreenHeading.tsx`) is the title block
  for tab-root screens (`ServicesScreen`, `MarketplaceScreen`,
  `AIAssistantScreen`, `NotificationsScreen`) — RTL-aware, with an optional
  `leading` node (avatar/icon). Their local `headerBox`/`mainTitle`/`mainSub`
  styles were removed.
- **`ServiceHeader`** is the header for the pushed service screens; its
  `subtitle` is now optional (`GeneralServiceModal` no longer passes `""`).
- **Scrim** — every modal/sheet/overlay backdrop uses the theme token
  `colors.scrim` / `colors.scrimLight` (added to `src/theme/colors.ts`), not a
  raw `rgba(0,0,0,…)`: `AuthModal`, `PersonaSelectorModal`, `PlantScanner`,
  `DiseaseDetectionScreen`, `RecentAnalysesScreen`.
- **`shadows.primary`** is the brand-tinted shadow for the prominent floating
  assistant tab in `BottomTabBar`.
- **Profile** shows a sign-in button only when signed out; the signed-in state
  reads its identity from the card above and signs out from the primary action
  at the bottom, so there is no redundant "manage account" button. The screen
  still exposes no role/persona selector (onboarding owns that).

A repo-wide sweep also removed dead `StyleSheet` keys
(`GeneralServiceModal.resultText`, `PersonaSelectorModal.personaTitleEn`) and an
unused import. Re-verified after the pass: `npx tsc --noEmit` clean,
`npx expo lint` clean, `npx jest` 48 suites / 237 passed (7 live tests skipped),
`npx expo-doctor` 20/20, and both `npx expo export --platform web|android`
bundle. The web export renders Home (AR/FR), Services, Assistant, Marketplace,
Profile, Notifications and the Disease-detection camera screen correctly.

### Premium UI polish pass, continued (verified 2026-11)

A second pass extended the same centralisation and tokenisation to the screens
that had been left with local copies:

- **`SectionHeader`** gained `iconSize` and `titleNumberOfLines` props so the
  in-card section heads could adopt it too. `PlantScanner` (symptoms/treatment/
  prevention blocks) and `SoilReportView` (its local `Section` helper) now use
  it; their `sectionHeader` / `sectionHead` / `sectionTitle` styles were deleted.
- **`ProfileScreen`** language and connectivity section titles now use
  `SectionHeader`; the bespoke `sectionHeading` style was deleted.
- **Theme tokens** — the last raw colour literals in components were replaced by
  tokens in `src/theme/colors.ts`: `scrimStrong` (video duration pill),
  `dangerScrim` (camera error pill), and the white-on-brand ramp
  `onBrandFaint` / `onBrandSubtle` / `onBrandMuted` / `onBrandStrong` /
  `onBrandBorder` / `onBrandSurface` (Home hero + gradient action card, assistant
  empty state, scanner controls). `PlantScanner`'s `#fff` literals now read
  `colors.textInverse`.
- **Regression coverage** — `tests/unit/headers.test.tsx` guards the three
  shared heading components (`ServiceHeader`, `SectionHeader`, `ScreenHeading`):
  subtitle presence/absence, the mutually-exclusive action/trailing slots, the
  leading node, and the new icon/wrap props.

Re-verified after this pass: `npx tsc --noEmit` clean, `npx expo lint` clean,
`npx jest` 49 suites / 243 passed (7 live tests skipped, 2 suites skipped),
`npx expo export --platform web` bundles, and the web export renders Home,
Services, Farm Management and Profile correctly (all with the unified headers).

### Premium UI polish pass — shared SearchBar and loading states (verified 2026-11)

A third pass removed the last duplicated screen chrome:

- **`SearchBar`** (`src/components/ui/SearchBar.tsx`) is now the one search
  field, used by `ServicesScreen`, `MarketplaceScreen` and `AgriNewsScreen`.
  It renders the magnifier, an RTL-aware input, and either a clear button (once
  there is text) or a trailing submit arrow (`onSubmit`). The three screens'
  local `searchBar` / `searchInput` / `iconButton` / `searchSubmit` / `flipIcon`
  styles and their `TextInput` imports were deleted.
- **Loading states** — `WeatherDetailScreen` and `FarmManagementScreen` now use
  `<StateView kind="loading" />` for their full-area loaders instead of a bare
  `ActivityIndicator`; `WeatherDetailScreen`'s `loadingBox`/`loadingText` styles
  and both screens' `ActivityIndicator` imports were removed. The assistant's
  inline "preparing" chat bubble keeps its bespoke row-with-avatar layout on
  purpose (a `StateView` there would drop the bot icon), so it is left as-is.
- **Theme token** — `colors.imageBackdrop` (`#000000`) replaces the last raw
  hex in `PlantScanner`'s captured-image backdrop.

Re-verified after this pass: `npx tsc --noEmit` clean, `npx eslint src` clean,
`npx jest` 50 suites / 246 passed (7 live tests skipped, 2 suites skipped),
`npx expo export --platform web` bundles, and the web export renders Home,
Services, Disease detection and the tab bar correctly. `SearchBar` has its own
regression test (`tests/unit/search-bar.test.tsx`).

### Premium UI polish pass — shared CategoryPill (verified 2026-11)

- **`CategoryPill`** (`src/components/ui/CategoryPill.tsx`) is the one filter
  pill for the horizontal category rows in `ServicesScreen`, `AgriNewsScreen`
  and `LearningVideosScreen`, with an optional leading icon and RTL row
  direction. `AgriNewsScreen` and `LearningVideosScreen` dropped their local
  copies of the component and all three dropped their `catPill*` styles; Agri
  News also lost its now-unused `TouchableOpacity`/`radius` imports.

Re-verified after this pass: `npx tsc --noEmit` clean, `npx eslint src` clean,
`npx jest` 51 suites / 249 passed (7 live tests skipped, 2 suites skipped), and
`npx expo export --platform web` bundles; the Services tab renders its icon
category pills and the shared search field correctly. `CategoryPill` has its own
regression test (`tests/unit/category-pill.test.tsx`).

### Premium UI polish pass — shared LimitationsNotice (verified 2026-11)

- **`LimitationsNotice`** (`src/components/ui/LimitationsNotice.tsx`) is the one
  "limits of use" callout under image-based results, with an optional `style`
  for spacing. `PlantScanner` and `DiseaseDetectionScreen` now render it instead
  of their own `limitations`/`limitationsTitle`/`limitationsText` blocks, and
  those styles were deleted from both files.

Re-verified after this pass: `npx tsc --noEmit` clean, `npx eslint src` clean,
`npx jest` 52 suites / 250 passed (7 live tests skipped, 2 suites skipped).
`LimitationsNotice` has its own regression test
(`tests/unit/limitations-notice.test.tsx`).

### Premium UI polish pass — line-height tokenisation (verified 2026-11)

The theme declared `typography.lineHeights` "instead of ad-hoc line-height
literals", but 266 call sites still used raw numbers. Every `lineHeight` literal
in `src` was replaced with the matching `typography.lineHeights` token (the
values are identical, so nothing moves), and a `fontSizes.display` /
`lineHeights.display` pair was added for the weather hero numeral (previously a
bare `54`/`81`). No raw `lineHeight` number remains outside `theme/colors.ts`.

Re-verified after this pass: `npx tsc --noEmit` clean, `npx eslint src` clean,
`npx jest` 52 suites / 250 passed (7 live tests skipped, 2 suites skipped), and
`npx expo export --platform web` bundles; the web export renders Home and the
tab bar correctly with no spacing regression.

### Premium UI polish pass — shared RTL styles (verified 2026-11)

- **`rtlStyles`** (`src/theme/rtl.ts`) now holds the two direction rules that
  were copy-pasted into ~44 files: `rtlRow` (`flexDirection: 'row-reverse'`)
  and `rtlText` (`textAlign: 'right'` + `writingDirection: 'rtl'`). Every call
  site uses `rtlStyles.rtlRow` / `rtlStyles.rtlText` and the local copies were
  deleted. `ErrorBoundary` and `Stepper` are the two exceptions — their "rtl"
  text is *centred*, so they keep a local `rtlText`.

Re-verified after this pass: `npx tsc --noEmit` clean, `npx eslint src` clean,
`npx jest` 52 suites / 250 passed (7 live tests skipped, 2 suites skipped), and
`npx expo export --platform web` bundles; the web export renders Home and the
Profile tab correctly with RTL intact.

### Premium UI polish pass — shared ProvenanceBar (verified 2026-11)

- **`ProvenanceBar`** (`src/components/ui/ProvenanceBar.tsx`) is the one
  provenance row: a `ProvenanceBadge` (`detailed` opt-in) plus the honest
  "served from cache" note (`cached` opt-in), laid out RTL-aware. Marketplace,
  Notifications, Agri News, Farm Management, Crop Recommendation and Weather
  Detail render it instead of hand-assembling badge + note; their
  `provBar`/`provRow` styles now carry only the outer spacing and their local
  `cachedTag` copies were deleted. Regression test:
  `tests/unit/provenance-bar.test.tsx`.

Re-verified after this pass: `npx tsc --noEmit` clean, `npx eslint src` clean,
`npx jest` 53 suites / 253 passed (7 live tests skipped, 2 suites skipped), and
`npx expo export --platform web` bundles; the web export renders Home and the
tab bar correctly.

### Premium UI polish pass — shared screen shell (verified 2026-11)

- **`screenStyles`** (`src/theme/layout.ts`) holds the full-screen scrolling
  shell that twelve screens declared identically: `container`
  (`flex: 1` + `colors.background`) and `content` (`padding.lg` +
  `paddingBottom 3xl`). Marketplace, Notifications, Home, Services' service
  screens, Agri News, Learning Videos, Livestock, Soil Analysis, Crop
  Recommendation, Disease Detection, Cultivation Project, Farm Management,
  Multi-Agent AI and `GeneralServiceModal` now use `screenStyles.*` and their
  local copies were deleted. Same values, so nothing moves.

Re-verified after this pass: `npx tsc --noEmit` clean, `npx eslint src` clean,
`npx jest` 53 suites / 253 passed (7 live tests skipped, 2 suites skipped), and
`npx expo export --platform web` bundles; the web export renders Home, Services
and the tab bar correctly.

### Premium UI polish pass — shared VideoCard (verified 2026-11)

- **`VideoCard`** (`src/components/ui/VideoCard.tsx`) is the one curated-video
  card, rendered by the Home "Learn from the field" strip (`variant="strip"`)
  and the Learning Videos catalogue (`variant="full"`). It keeps the exact
  per-variant layout — thumbnail, play overlay, duration pill, category and
  language tags, verbatim publisher title/channel and the YouTube attribution —
  so the two call sites no longer carry a duplicate card. Regression test:
  `tests/unit/video-card.test.tsx`.

Re-verified after this pass: `npx tsc --noEmit` clean, `npx eslint src` clean,
`npx jest` 54 suites / 255 passed (7 live tests skipped, 2 suites skipped), and
`npx expo export --platform web` bundles; the web export renders Home (with the
video strip, channel lines intact) and the tab bar correctly.

### Premium UI polish pass — shared StateCard (verified 2026-11)

- **`StateCard`** (`src/components/ui/StateCard.tsx`) is the card-framed
  loading/empty/error/unavailable panel. 51 call sites across 17 files wrote the
  identical `<Card variant="outlined"><StateView .../></Card>` shell; StateCard
  owns that shell and forwards every `StateView` prop (`kind`, `title`,
  `message`, `onRetry`, `retryLabel`, `compact`), plus `variant` and `cardStyle`
  for the outer card. The 19 bare `StateView` uses that already sit inside a
  card, a custom box (`PlotStep`), or a non-card panel (the assistant's inline
  chat bubble) are deliberately left alone. Regression test:
  `tests/unit/state-card.test.tsx`.

Re-verified after this pass: `npx tsc --noEmit` clean, `npx eslint src` clean,
`npx jest` 55 suites / 257 passed (7 live tests skipped, 2 suites skipped), and
`npx expo export --platform web` bundles; the web export renders Home and
Services (empty state) correctly.

### Premium UI polish pass — shared Bullet (verified 2026-11)

- **`Bullet`** (`src/components/ui/Bullet.tsx`) is the one RTL-aware list item.
  Four copies existed: a glyph `•` in `SoilReportView`, a 6px dot in
  `SoilAnalysisScreen` and `PlantScanner`, and a `circle-medium` icon in
  `DiseaseDetectionScreen`. Bullet takes the marker as a `variant`
  (`dot` | `icon` | `glyph`) and keeps the existing per-variant colour override,
  so no screen changes appearance. The dead local components and their
  `bulletRow`/`bullet`/`bulletText`/`bulletItem` styles were deleted.

Re-verified after this pass: `npx tsc --noEmit` clean, `npx eslint src` clean,
`npx jest` 55 suites / 257 passed (7 live tests skipped, 2 suites skipped), and
`npx expo export --platform web` bundles; the web export renders the soil
analysis flow correctly.

### Premium UI polish pass — shared IconButton (verified 2026-11)

- **`IconButton`** (`src/components/ui/IconButton.tsx`) is the one circular,
  icon-only control. The identical 48dp `surfaceSubtle` circle was written four
  times: the header back button and notifications button
  (`Header.tsx`), and the modal close buttons in `PersonaSelectorModal` and
  `AuthModal`. IconButton owns the size, shape and accessible-label contract;
  callers pass only the glyph, handler, label and optional size/colour. The
  duplicated `backButton` / `iconButton` / `closeBtn` style blocks were deleted.

Re-verified after this pass: `npx tsc --noEmit` clean, `npx eslint src` clean,
`npx jest` 57 suites / 259 passed (7 live tests skipped, 2 suites skipped), and
`npx expo export --platform web` and `--platform android` both bundle; the web
export renders Home, Services and Profile (FR switch) with the header controls
intact.

### Premium UI polish pass — shared ModalSheet (verified 2026-11)

- **`ModalSheet`** (`src/components/ui/ModalSheet.tsx`) is the one bottom-sheet
  chrome: scrim overlay, card sheet with rounded top corners, header row with a
  leading slot and the shared `IconButton` close control. `PersonaSelectorModal`
  and `AuthModal` declared identical `overlay` / `sheet` / `headerRow` styles and
  close buttons; they now pass only their header content and per-sheet geometry
  (`sheetStyle`, `headerStyle`), plus `keyboardAvoiding` for the auth form. The
  duplicated style blocks were deleted. Regression test:
  `tests/unit/modal-sheet.test.tsx`.

Re-verified after this pass: `npx tsc --noEmit` clean, `npx eslint src` clean,
`npx jest` 58 suites / 263 passed (7 live tests skipped, 2 suites skipped), and
`npx expo export --platform web` bundles; the web export renders Home, Services
and Profile, and the auth modal opens and closes through the shared close button.

### Premium UI polish pass — shared IconTile (verified 2026-11)

- **`IconTile`** (`src/components/ui/IconTile.tsx`) is the one 46×46 tinted icon
  square. `SeasonAgenda` and `AcademySection` (Home) and `ServicesScreen` each
  wrote the identical `width:46 / height:46 / radius.md / centre` box inline with
  a `MaterialCommunityIcons` child; IconTile takes the glyph, its colour and the
  tinted background, plus an optional `size` (Services used 28). The dead
  `iconWrap` / `serviceIconContainer` styles and the now-unused `radius` import
  were removed. Regression test: `tests/unit/icon-tile.test.tsx`.

Re-verified after this pass: `npx tsc --noEmit` clean, `npx eslint src` clean,
`npx jest` 59 suites / 265 passed (7 live tests skipped, 2 suites skipped), and
`npx expo export --platform web` bundles; the web export renders Home (season +
academy tiles) and the full Services grid.
