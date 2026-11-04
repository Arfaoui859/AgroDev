# Fusion Starter

A production-ready full-stack React application template with integrated Express server, featuring React Router 6 SPA mode, TypeScript, Vitest, Zod and modern tooling.

While the starter comes with a express server, only create endpoint when strictly neccesary, for example to encapsulate logic that must leave in the server, such as private keys handling, or certain DB operations, db...

## Tech Stack

- **Frontend**: React 18 + React Router 6 (spa) + TypeScript + Vite + TailwindCSS 3
- **Backend**: Express server integrated with Vite dev server
- **Testing**: Jest
- **UI**: Radix UI + TailwindCSS 3 + Lucide React icons

## Project Structure

```
client/                   # React SPA frontend
├── pages/                # Route components (Index.tsx = home)
├── components/ui/        # Pre-built UI component library
├── App.tsx                # App entry point and with SPA routing setup
└── global.css            # TailwindCSS 3 theming and global styles

server/                   # Express API backend
├── index.ts              # Main server setup (express config + routes)
└── routes/               # API handlers

shared/                   # Types used by both client & server
└── api.ts                # Example of how to share api interfaces
```

## Key Features

## SPA Routing System

The routing system is powered by React Router 6:

- `client/pages/Index.tsx` represents the home page.
- Routes are defined in `client/App.tsx` using the `react-router-dom` import
- Route files are located in the `client/pages/` directory

For example, routes can be defined with:

```typescript
import { BrowserRouter, Routes, Route } from "react-router-dom";

<Routes>
  <Route path="/" element={<Index />} />
  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
  <Route path="*" element={<NotFound />} />
</Routes>;
```

### Styling System

- **Primary**: TailwindCSS 3 utility classes
- **Theme and design tokens**: Configure in `client/global.css` 
- **UI components**: Pre-built library in `client/components/ui/`
- **Utility**: `cn()` function combines `clsx` + `tailwind-merge` for conditional classes

```typescript
// cn utility usage
className={cn(
  "base-classes",
  { "conditional-class": condition },
  props.className  // User overrides
)}
```

### Express Server Integration

- **Development**: Single port (8080) for both frontend/backend
- **Hot reload**: Both client and server code
- **API endpoints**: Prefixed with `/api/`

#### Example API Routes
- `GET /api/ping` - Simple ping api
- `GET /api/demo` - Demo endpoint  

### Shared Types
Import consistent types in both client and server:
```typescript
import { DemoResponse } from '@shared/api';
```

Path aliases:
- `@shared/*` - Shared folder
- `@/*` - Client folder

## Development Commands

```bash
npm run dev        # Start dev server (client + server)
npm run build      # Production build (client + SSR server -> dist/)
npm run start      # Start production server
npm test           # Run the test suite (Jest)
npx tsc --noEmit   # TypeScript validation
```

## AgroGrowth — verified engineering notes

Facts below were confirmed against the running code and the live database,
not copied from the template or the README. Treat them as the starting point
for future work; re-verify before relying on them.

### Test runner and typecheck
- Tests run on **Jest** (`npm test`), not Vitest. Config is `jest.config.*`
  with `tests/setup.ts`. Suites live in `tests/unit`, `tests/integration`,
  `tests/live`, `tests/e2e`.
- There is no `npm run typecheck` script. Use `npx tsc --noEmit`.
- Production build output is `dist/server/node-build.mjs`; run it with
  `PORT=<port> node dist/server/node-build.mjs` (it loads `.env` via
  `dotenv/config`). Dev runs on 8080; the built server honours `PORT`.

### Data layer (Supabase Postgres)
- `.env` (gitignored) holds `SUPABASE_URL`, `SUPABASE_ANON_KEY`,
  `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DIRECT_URL`,
  `DATABASE_URL`. Never print or commit their values.
- RLS is enabled on every table except the PostGIS system table
  `spatial_ref_sys`. Hardening lives in `database/rls-hardening.sql`
  (idempotent; re-runnable).
- `public.users` has **no** FK to `auth.users`. Account deletion is kept
  consistent by the `on_auth_user_deleted` trigger in
  `database/user-lifecycle.sql`, which deletes the profile row and lets the
  existing `ON DELETE CASCADE` rules clean up farms and children.
- `anon`/`authenticated` hold broad table grants; isolation relies entirely
  on RLS, so any new table must have RLS enabled **and** policies added.

### AI layer
- AI provider config is env-driven (`AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL`,
  `AI_VISION_MODEL`, timeouts/retries). When no provider is configured the
  advisor and knowledge engine answer from a **deterministic rule-based
  engine** and label the result honestly (`dataSource: "rule-based"`,
  `isRealData: false`, plus a disclaimer). Do not present rule-based output
  as model inference.
- Specialised Python FastAPI microservices live in `agrogrowth-ai/` — eight
  of them: `soil_analysis` (8001), `crop_recommendation` (8002),
  `image_diagnosis` (8003), `market_prediction` (8004), `intelligent_agent`
  (8005), `weather_yield_intelligence` (8006), `pest_control` (8007),
  `irrigation_optimization` (8008). The backend resolves each via its env var
  (`SOIL_ANALYSIS_URL`, `CROP_RECOMMENDATION_URL`, `IMAGE_DIAGNOSIS_URL`,
  `MARKET_FORECAST_URL`/`MARKET_PREDICTION_URL`,
  `SMART_ASSISTANT_URL`/`INTELLIGENT_AGENT_URL`, `WEATHER_YIELD_INTELLIGENCE_URL`
  /`SMART_MARKETPLACE_URL`, `PEST_CONTROL_URL`, `IRRIGATION_OPTIMIZATION_URL`).
  When a service is not running, endpoints return an honest 503 rather than
  fabricating a result.
- Start/verify them locally with `bash scripts/start-ai-services.sh`
  (`--check` health-checks all eight, `--stop` stops them). Each service is a
  FastAPI app with a `/health` endpoint that declares its `model_source`; the
  bundled models are trained on synthetic data and report
  `model_source: "synthetic-demo"` (or `rule-based-demo`), which the Node layer
  surfaces as `isRealModel: false` / `modelTrainedOnSyntheticData: true`.
- `GET /api/ai/capabilities` reports the true engine per capability. Use it
  to see what is really available before promising a feature.
- The rule-based farm advisor is fully localised (ar/fr/en). Per-parameter
  soil recommendation sentences are Arabic-only by design and are labelled
  as such for fr/en callers.

### Honesty conventions
- Never invent weather, market prices, diagnoses or confidence values.
- Weather comes from Open-Meteo (`/api/weather/coordinates` returns
  `source.isRealData: true`). Market data is read from `market_prices` and
  reports `dataSource: "database"`.
- Mock/fixture-driven pages must render the shared `SimulatedDataNotice`
  from `client/components/SimulatedDataNotice.tsx`.

## Adding Features

### Add new colors to the theme

Open `client/global.css` and `tailwind.config.ts` and add new tailwind colors.

### New API Route
1. **Optional**: Create a shared interface in `shared/api.ts`:
```typescript
export interface MyRouteResponse {
  message: string;
  // Add other response properties here
}
```

2. Create a new route handler in `server/routes/my-route.ts`:
```typescript
import { RequestHandler } from "express";
import { MyRouteResponse } from "@shared/api"; // Optional: for type safety

export const handleMyRoute: RequestHandler = (req, res) => {
  const response: MyRouteResponse = {
    message: 'Hello from my endpoint!'
  };
  res.json(response);
};
```

3. Register the route in `server/index.ts`:
```typescript
import { handleMyRoute } from "./routes/my-route";

// Add to the createServer function:
app.get("/api/my-endpoint", handleMyRoute);
```

4. Use in React components with type safety:
```typescript
import { MyRouteResponse } from '@shared/api'; // Optional: for type safety

const response = await fetch('/api/my-endpoint');
const data: MyRouteResponse = await response.json();
```

### New Page Route
1. Create component in `client/pages/MyPage.tsx`
2. Add route in `client/App.tsx`:
```typescript
<Route path="/my-page" element={<MyPage />} />
```

## Production Deployment

- **Standard**: `npm run build` + `npm start`
- **Binary**: Self-contained executables (Linux, macOS, Windows)
- **Cloud Deployment**: Use either Netlify or Vercel via their MCP integrations for easy deployment. Both providers work well with this starter template.

## Architecture Notes

- Single-port development with Vite + Express integration
- TypeScript throughout (client, server, shared)
- Full hot reload for rapid development
- Production-ready with multiple deployment options
- Comprehensive UI component library included
- Type-safe API communication via shared interfaces
