# AgroGrowth Autonomous Farm Agent — deployment runbook

## What this first production slice does

The agent evaluates persisted, user-owned farm records and creates deduplicated in-app notifications for:
- Farms with no soil-analysis record.
- A latest soil-analysis record older than the configurable review window (default 180 days).
- Active cultivations whose recorded expected harvest date is within seven days.
- Active cultivations whose recorded expected harvest date has passed.
- Registered sensors marked inactive.
- Registered sensors with a stored battery level at or below 20%.

Every alert carries an evidence payload and a stable event key. Duplicate notifications are prevented by a database unique index. These are operational reminders, not diagnoses or guaranteed agronomic advice.

The first slice does **not** claim to monitor live sensor streams, forecast weather, detect plant disease continuously, track live market prices, or deliver push/SMS/email. It creates in-app notifications only. Those capabilities need their respective verified data integrations and delivery providers.\n\nThe assistant now persists user-scoped conversations/messages and can include the caller's registered farm size/location, active crop, latest lab/sensor soil measurements, and recent unarchived agent alerts in its context. If the session or farm records cannot be verified, the assistant labels its answer as general instead of pretending it has farm context.

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

The new API, UI, migration and workflow are committed to `feat/soil-analysis-professional-report`.

The workflow schedule runs only after the workflow file is merged into the repository's default branch. Ensure the main Render service deploys a branch containing these commits. The `render.yaml` main service branch is now set to `feat/soil-analysis-professional-report`. Render must still sync/apply the Blueprint and complete a successful deploy; editing this file does not itself change the live service.

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
- The current rules use only saved farm, cultivation, soil-analysis and sensor-device records. Missing records create a data-completeness reminder, never an invented measurement.
- In-app alerts are not yet push notifications. Push requires service-worker subscription handling and a delivery provider; email/SMS require separately configured providers and consent.

## Source and test coverage

- Engine: `server/services/ai/autonomousFarmAgent.ts`\n- Advisor farm/alert context: `server/routes/ai-services-gateway.ts` + `server/services/ai/farmAdvisor.ts`\n- Persistent assistant memory API: `server/routes/assistant-conversations.ts`
- Authenticated API and protected scheduled endpoint: `server/routes/autonomous-farm-agent.ts`
- Assistant panel: `client/components/AutonomousAgentPanel.tsx`
- Database migration: `database/autonomous-farm-agent.sql`
- Event unit tests: `tests/unit/autonomous-farm-agent.test.ts`

Run locally:

    npm test -- --runInBand tests/unit/autonomous-farm-agent.test.ts
    npm run lint
    npm run build

Do not describe the feature as production-active until the SQL migration, Render secrets, GitHub Actions secrets, deployment and live scan verification are all complete.
