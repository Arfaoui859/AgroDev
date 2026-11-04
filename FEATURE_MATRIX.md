# AgroGrowth — Feature Matrix (live-verified)

Generated from live probes against the running server on 2026-11-04 13:23 UTC.
Every row below is the **actual** HTTP status returned by the running
platform, not a hand-written claim. `prov` is the data-provenance tag the
server advertises (`real` = real source, otherwise heuristic/simulated).

## Feature areas

| Feature | Method | Endpoint | Status | Provenance | Real data |
|---|---|---|---|---|---|
| Auth: profile provisioning (guarded) | POST | `/api/auth/create-user-profile` | 403 | - | - |
| Auth: user existence check (guarded) | GET | `/api/auth/check-user/00000000-0000-0000-0000-000000000000` | 403 | - | - |
| Farm management overview | GET | `/api/farm-management/overview` | 200 | simulated | false |
| Farm list (auth-guarded) | GET | `/api/farms` | 401 | - | - |
| Fields (auth-guarded) | GET | `/api/fields` | 401 | - | - |
| Soil analysis (AI) | POST | `/api/ai/soil/analyze` | 200 | heuristic | false |
| Soil analysis (detailed) | POST | `/api/soil-analysis/analyze` | 400 | - | - |
| Crop recommendation (AI) | POST | `/api/ai/crops/recommend` | 200 | heuristic | false |
| Disease detection (image req) | POST | `/api/ai/images/detect-disease` | 400 | - | - |
| Assistant chat (ar) | POST | `/api/ai/assistant/chat` | 200 | rule-based | false |
| Assistant chat (fr) | POST | `/api/ai/assistant/chat` | 200 | rule-based | false |
| Weather (real, coords) | GET | `/api/weather/coordinates?lat=36.8&lon=10.18` | 200 | open-meteo | true |
| Market prices | GET | `/api/market-analysis/prices/current` | 200 | simulated | false |
| Marketplace listings | GET | `/api/marketplace/listings` | 200 | simulated | false |
| Notifications | GET | `/api/notifications` | 200 | simulated | false |
| AI capabilities | GET | `/api/ai/capabilities` | 200 | - | - |
| AI services health | GET | `/api/ai/health` | 200 | - | - |
| Admin overview (guarded) | GET | `/api/admin/overview` | 401 | simulated | false |
| Admin set-password (guarded) | POST | `/api/admin/set-password` | 403 | simulated | false |

Legend: `200` = working; `400` = request validation (expected without a real body);
`401`/`403` = auth-guarded (correct, not an error); `404` = route/business-level not found.

## AI microservices (ports 8001–8008)

| Port | /health |
|---|---|
| 8001 | 200 |
| 8002 | 200 |
| 8003 | 200 |
| 8004 | 200 |
| 8005 | 200 |
| 8006 | 200 |
| 8007 | 200 |
| 8008 | 200 |

## Declared AI capabilities and their engine

| Capability | Engine | Microservice configured |
|---|---|---|
| soil-analysis | rule-based | True |
| crop-recommendation | rule-based | True |
| climate-crop-matcher | rule-based | True |
| plant-disease-detection | heuristic | True |
| leaf-scan | heuristic | True |
| pest-control | microservice | True |
| weather-yield-planner | microservice | True |
| yield-predictor | microservice | True |
| irrigation-optimizer | microservice | True |
| market-forecast | microservice | True |
| supply-demand | microservice | True |
| smart-match | rule-based | False |
| farming-tasks-planner | rule-based | False |
| agro-chat | rule-based | False |
| alert-notifier | rule-based | False |

## Frontend & backend surface

| Area | Count |
|---|---|
| SPA route definitions | 100 |
| SPA page components | 102 |
| Express route modules | 63 |
| AI microservices | 8 |
| Declared AI capabilities | 15 |


## Notes on non-200 rows

- **Auth**: registration/sign-in happen client-side directly against Supabase
  (`supabase.auth.signUp`), so there is no `/api/auth/signup` Express route by
  design. The server-side auth endpoints (`/api/auth/create-user-profile`,
  `/api/auth/check-user/:userId`) are admin-guarded and correctly return 403
  without a token.
- **400 rows** are request-validation responses: the probe deliberately sends an
  incomplete body (e.g. a disease image or a full soil lab panel) to prove the
  endpoint validates input instead of crashing or inventing a result.
- **401/403 rows** are authentication/authorization guards working as intended;
  they are not failures.
- **Provenance**: `open-meteo`/`real=true` is genuine live weather. Every other
  module currently advertises `simulated`/`heuristic`/`rule-based` and
  `isRealData=false`, i.e. the platform labels synthetic output honestly rather
  than presenting it as observed data.
