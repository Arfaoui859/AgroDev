# AgroGrowth — Supabase Database Setup

This guide describes the safe setup path for the current repository. It does
not certify that a particular hosted Supabase project is configured.

## 1. Select the correct project

1. Open the Supabase dashboard and select the intended development or production project.
2. Confirm its project URL/ref with the Render deployment owner.
3. Ensure browser and server URLs point to the same project.
4. Never paste secret values into GitHub, issues or chat.

## 2. Configure environment variables

The browser build needs:
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY

The Node server needs:
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY (server-side Auth Admin operations only)
- DATABASE_URL and DIRECT_URL when required by the selected server/database path.

The service-role key must never be stored in a VITE_* variable or sent as an
x-admin-token header. Use a separate ADMIN_API_TOKEN for dedicated operator
actions. Configure all values in the approved secret store and restart/redeploy
after changes.

If the browser Supabase settings are missing, the client now reports that
authentication is unavailable rather than silently connecting to a historical
embedded project.

## 3. Apply database migrations

Do not use old ad-hoc SQL snippets from this guide or create a parallel schema.
Review the versioned SQL files in database/ and apply them to the intended
project in the documented order. At minimum, review:
- database/cloud-setup.sql (base schema for the current cloud setup)
- database/market-prices-compatibility.sql (adds the stable crop_id key/index while preserving legacy crop_name rows)
- database/rls-hardening.sql
- database/admin-user-management.sql
- database/effectiveness-reports.sql
- database/user-lifecycle.sql

Before applying anything to production:
1. Take/verify a backup and record the current migration state.
2. Review the SQL diff and target project identity.
3. Apply first to an isolated development/staging project.
4. Run the SQL verification scripts in tests/db/.
5. Verify user A cannot read or mutate user B's farm, field, soil, livestock or report records.

Do not assume a SQL script is safe to run twice unless it is explicitly idempotent.
Do not execute the full set blindly or against an unknown project.

## 4. Create test accounts safely

Legacy demo-user provisioning endpoints, auth-debug routes and fixed demo
credentials have been removed/retired. Create test accounts through Supabase
Auth in a dedicated development project. Use unique, temporary passwords and
never reuse them in production. Do not create shared demo administrator
accounts.

The admin dashboard must use a real, verified administrator account whose
role is stored in public.users and whose status is active. Admin creation,
deletion and other Auth Admin operations require the server-side service-role
key and a verified operator/admin authorization path.

## 5. Verify the connection and access controls

- Confirm signup, login, refresh, logout and account deletion in staging.
- Confirm /api/auth/me resolves the role from the trusted database profile.
- Confirm anonymous users cannot access admin routes.
- Confirm non-admin users receive 403 for admin operations.
- Confirm cross-tenant negative tests pass for at least two separate users.
- Confirm RLS is enabled and least-privilege policies exist for every user-owned table.
- Confirm backups and recovery settings are enabled and documented.

The read-only helper scripts/health endpoints may help diagnose connectivity,
but an HTTP 200 response alone is not proof of RLS correctness or full feature
persistence.

## 6. Market data integrity

Do not insert random or illustrative market prices into market_prices. The old
random-price seed script has been removed. Until a trusted, licensed source is
connected and its lineage is recorded, market price/forecast features must
remain labelled simulated/demo or unavailable.

## 7. Commercial weather provider

Open-Meteo free endpoints have non-commercial restrictions. Production use must
comply with the provider's commercial terms and use the appropriate server-side
credential/plan. Never put a weather-provider key in a VITE_* variable. If the
configured provider is unavailable or not entitled for the requested endpoint,
return an explicit unavailable state rather than inventing weather.

## Related documents

- .env.example
- SUPABASE_INTEGRATION_STATUS.md
- PRODUCTION_DEPLOYMENT_CHECKLIST.md
- AGROGROWTH_REMEDIATION_MASTER_PLAN.md
