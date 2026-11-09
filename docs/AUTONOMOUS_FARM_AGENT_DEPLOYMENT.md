# AgroGrowth Autonomous Farm Agent — deployment runbook

## What this first production slice does

The agent evaluates persisted, user-owned farm records and creates deduplicated in-app notifications for:
- Farms with no verified lab or sensor soil-analysis record (manual/image-only entries are not treated as validated measurements).
- A latest soil-analysis record older than the configurable review window (default 180 days).
- Active cultivations whose recorded expected harvest date is within seven days.
- Active cultivations whose recorded expected harvest date has passed.
- Registered sensors marked inactive.
- Registered sensors with a stored battery level at or below 20%.
- Recorded high/critical plant-detection results that are not marked recovered; these create a verification/follow-up reminder, not a confirmed disease diagnosis.

Every alert carries an evidence payload, a stable event key, and a short ordered action checklist. High-priority events are returned before normal reminders. Duplicate notifications are prevented by a database unique index. These are operational reminders, not diagnoses or guaranteed agronomic advice.

The first slice does **not** claim to monitor live sensor streams, forecast weather, detect plant disease continuously, track live market prices, or deliver push/SMS/email. It can follow up on high/critical disease-detection records already saved in the database, while explicitly requiring field verification. It creates in-app notifications only. Those capabilities need their respective verified data integrations and delivery providers.

The assistant now persists user-scoped conversations/messages and can include the caller's registered farm size/location, active crop, latest lab/sensor soil measurements, and recent unarchived agent alerts in its context. If the session or farm records cannot be verified, the assistant labels its answer as general instead of pretending it has farm context.

## 1. Apply the Supabase migration

Run `database/autonomous-farm-agent.sql` in the Supabase SQL Editor.

It creates:
- `farm_agent_settings` with per-user enable/disable and scan cadence.
- RLS so users can manage only their own settings.
- A unique deduplication index for autonomous-agent notifications.
- Default settings for existing users who already own farms.

The migration assumes the existing `users`, `farms`, and `notifications` tables from the AgroGrowth database setup are present. Do not enable the workflow until the migration succeeds.

## 2. Configure Render environment variables

On the main AgroGrowth Express service, verify these existing secrets are already set:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Add:
- `AGRO_AGENT_MONITOR_TOKEN`: generate a long random secret (at least 32 bytes). Use the exact same value as the GitHub secret below.
- `AGRO_AGENT_SOIL_REVIEW_DAYS`: optional; defaults to `180`.

Never commit the service-role key or monitor token to GitHub, source code, workflow files, or frontend variables.

## 3. Configure GitHub Actions secrets

In GitHub repository Settings → Secrets and variables → Actions, add:

| Secret | Value |
|---|---|
| `AGRO_AGENT_MONITOR_URL` | Main app base URL, e.g. `https://agrodev-3.onrender.com` |
| `AGRO_AGENT_MONITOR_TOKEN` | The exact `AGRO_AGENT_MONITOR_TOKEN` value configured in Render |

The workflow `.github/workflows/agrogrowth-autonomous-agent.yml` invokes the protected endpoint every 15 minutes. GitHub scheduled workflows are best-effort and may be delayed; this is not a hard real-time guarantee. The user's selected cadence is checked by the server, so a 60-minute setting is not scanned on every 15-minute workflow run.

## 4. Deploy the code

The new API, UI, migration and workflow are committed to `feat/soil-analysis-professional-report`. The same branch now includes `.github/workflows/agrogrowth-quality-gate.yml`, which runs lint, Jest unit/integration tests, and the production build on pushes. Its run must finish successfully before this branch is considered verified.

The scheduled workflow has also been committed as a standalone file to the repository's current default branch (`feat/ai-integration-production-hardening`), so the scheduler does not require merging this entire feature branch. It safely skips until both GitHub secrets are configured. The feature branch is substantially ahead of the default branch; do not merge the whole branch blindly. Ensure the main Render service deploys a branch containing these commits. The `render.yaml` main service branch is now set to `feat/soil-analysis-professional-report`. Render must still sync/apply the Blueprint and complete a successful deploy; editing this file does not itself change the live service.

**Cost and duplicate-service warning:** the current Blueprint declares `starter` and `standard` plans and service names that do not all match the live URLs shown in the operator dashboard. Do not apply the entire Blueprint until the existing Render services and expected charges are reviewed. Prefer changing the existing main web service's branch in its Render settings and adding the required environment variables; do not create duplicate Python services just to make the YAML green.

## 5. Verify after deployment

1. Sign in to AgroGrowth and open the AI assistant.
2. Confirm the Autonomous Farm Agent panel loads its status (not an API 503).
3. Press **افحص مزرعتي الآن** and confirm a real scan summary is returned.
4. Confirm new records appear in `public.notifications` for that signed-in user only.
5. Confirm repeated scans do not create duplicate notifications for the same event key.
6. In GitHub Actions, run **AgroGrowth Autonomous Farm Monitor** manually once, then inspect the response summary and subsequent scheduled runs.
7. Test disabling the agent in the panel; scheduled scans must skip that account.

## Monitoring cadence and limitations

- Available cadence settings: 15, 30, 60, 180, 360 or 1440 minutes.
- GitHub Actions schedule: every 15 minutes (best effort).
- In-app dashboard status refresh: every 60 seconds; this refresh does not itself run a farm scan.
- A scheduled scan requires the main app endpoint to be reachable and Render/Supabase to be configured.
- The current rules use only saved farm, cultivation, soil-analysis, sensor-device and plant-disease-detection records. Missing records create a data-completeness reminder, never an invented measurement.
- In-app alerts are not yet push notifications. Push requires service-worker subscription handling and a delivery provider; email/SMS require separately configured providers and consent.

## Source and test coverage

- Engine: `server/services/ai/autonomousFarmAgent.ts`
- Advisor farm/alert context: `server/routes/ai-services-gateway.ts` + `server/services/ai/farmAdvisor.ts`
- Persistent assistant memory API: `server/routes/assistant-conversations.ts`
- Authenticated API and protected scheduled endpoint: `server/routes/autonomous-farm-agent.ts`
- Assistant panel: `client/components/AutonomousAgentPanel.tsx`
- Database migration: `database/autonomous-farm-agent.sql`
- Event unit tests: `tests/unit/autonomous-farm-agent.test.ts`

Run locally:

    npm test -- --runInBand tests/unit/autonomous-farm-agent.test.ts
    npm run lint
    npm run build

Do not describe the feature as production-active until the SQL migration, Render secrets, GitHub Actions secrets, deployment and live scan verification are all complete.


## Implementation snapshot (2026-11-09)

The feature branch contains the first integrated slice:
- Autonomous event evaluator and protected scheduled runner.
- User-controlled scan cadence and enable/disable setting.
- Persistent Supabase notifications with per-user ownership, read/unread, star, archive and delete operations.
- Assistant conversation/message persistence; the chatbot no longer seeds demo conversation history.
- Verified farm context for the advisor: registered farm location/size, active crop, latest lab/sensor soil measurements and recent agent alerts.
- AI health dashboard distinction between reachable hosts, inference-available services, deterministic rule engines and trained-model claims; short health-probe cache with explicit force refresh.
- Notification center no longer fabricates sensor readings, rules or contact details.
- Service worker bypasses cache for authenticated/private API requests.

**Not yet production-verified:** this editing session did not execute npm/Jest/TypeScript/Python tests, apply the SQL migration, deploy Render, or inspect live Render logs. GitHub's current Vercel checks report a build-rate-limit failure, not a passing build. Treat this branch as source changes awaiting deployment and verification.
