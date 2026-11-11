# AgroGrowth — Zero-Cost Deployment Notes

This is a cost-constrained deployment guide, not a promise that every component
can run continuously for free. Free-tier limits, sleep behaviour, build minutes,
memory and private-service availability vary by provider and can change.

## Recommended low-cost starting point

- Frontend + Express API: one deployment where supported, using the same-origin
  /api route.
- Database/Auth: one Supabase project with RLS enabled.
- Weather: use only a provider endpoint permitted by its current commercial terms.
- AI: start with the server-side deterministic agronomy engine and the services
  that can run within the selected free-tier resource limits.
- Do not deploy eight separate paid/private services under the assumption that
  Render free plans support them.

## Important constraints

1. The checked-in render.yaml currently uses paid starter/standard plans; it is
   not a zero-cost Blueprint. Review each plan in the provider dashboard before
   applying it.
2. Free web services may sleep and cold-start. Do not promise instant inference.
3. Memory-heavy image/ML services may not fit a free instance. Do not silently
   downgrade them without testing.
4. The browser calls only the Node API gateway. Do not add VITE_* variables for
   private Python microservice URLs.
5. Keep SUPABASE_SERVICE_ROLE_KEY and all AI-provider credentials server-side.
6. Browser Supabase settings are VITE_SUPABASE_URL and
   VITE_SUPABASE_ANON_KEY; the service-role key must never use a VITE_ prefix.
7. Demo/fixture data and synthetic models must stay labelled. A free deployment
   does not make simulated market prices, crop forecasts or animal records real.

## Setup

1. Clone the repository and install dependencies with npm ci.
2. Copy .env.example to .env and configure only the required variables.
3. Create an isolated Supabase project, apply reviewed database migrations,
   then verify RLS with two different users.
4. Start the integrated local application with npm run dev (Vite + Express
   development plugin). For a standalone Express process, use npm run server:dev
   and set VITE_API_URL=http://localhost:5000/api.
5. Start local AI services only if Python dependencies and machine resources
   are available: bash scripts/start-ai-services.sh.
6. Verify the Node gateway and all enabled services. Unavailable capabilities
   must stay unavailable rather than return fabricated results.

## Before inviting users

- All required CI checks green on the exact commit.
- Authentication and RLS verified against the target project.
- Backups and rollback plan confirmed.
- Real user workflows persist to authenticated tables.
- Arabic RTL and mobile workflows tested.
- Every demo screen is visibly disclosed.
- Provider terms, rate limits, privacy and data retention reviewed.

See RENDER_DEPLOYMENT_GUIDE.md and PRODUCTION_DEPLOYMENT_CHECKLIST.md for the
current deployment and release gates.
