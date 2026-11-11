# AgroGrowth — Supabase Integration Status

**Reviewed:** 2026-11-11  
**Status:** Code integration exists; live production readiness is **not verified**.

> This document supersedes the older 2024-era claim that the platform was
> "100% complete" and production-ready. Repository code and SQL files do not
> prove that the current Render deployment points to the intended Supabase
> project, that migrations have been applied there, or that tenant isolation
> has been tested against live credentials.

## What is present in the repository

- Supabase client/auth integration in the React application.
- Server-side Supabase/database adapters and authenticated API routes.
- SQL setup and hardening scripts under `database/`.
- RLS policies and user-lifecycle SQL.
- Database-backed effectiveness-report API and migration.
- Database-backed admin-user management code with fail-closed authorization.
- CI job that applies the schema/RLS hardening to an isolated PostgreSQL test
  database and verifies tenant-isolation behaviour.

## What is not certified as live

The following require access to the actual target Supabase project and its
hosted environment configuration:

1. Confirm `SUPABASE_URL`, anon/publishable key and server service-role key
   belong to the same intended project. Never print or share secret values.
2. Confirm the Render service has the correct environment variables.
3. Apply and verify the current SQL migrations against the target project.
4. Test signup, login, session refresh, profile/role resolution and logout.
5. Test user A cannot read or mutate user B's farms, fields, soil, livestock,
   reports or other tenant-owned records.
6. Verify admin routes require the intended server-side role and protect the
   last administrator.
7. Verify account deletion and dependent-record cleanup.
8. Confirm backups, retention and recovery settings in the Supabase dashboard.

## Schema compatibility notes

- The checked-in cloud schema stores market display names in market_prices.crop_name, while the API also uses a stable crop_id key.
- database/market-prices-compatibility.sql adds crop_id and its index idempotently. Existing crop_name-only records remain readable through the API fallback.
- Do not backfill crop_id by guessing from arbitrary names; use a verified crop-name-to-slug mapping and review the records first.

## Data and feature provenance

- Market prices must not be described as live unless the production
  `market_prices` table is populated from a trusted source and the API reports
  database provenance.
- Demo/fixture records remain simulated even when displayed inside a page that
  also has Supabase integration.
- A successful database connection is not proof that every screen is persisted.
- A successful HTTP response is not proof of correct authorization or
  cross-tenant isolation.

## Security

- Never place `SUPABASE_SERVICE_ROLE_KEY` in a `VITE_*` variable or browser
  bundle.
- Never commit `.env`, service-role keys, database passwords, access tokens
  or demo-user passwords.
- Do not create shared demo accounts with hardcoded passwords. Create test users
  through the Supabase Auth dashboard or isolated automated test fixtures.
- Do not paste credentials into ChatGPT or GitHub issues. Configure them only
  in the approved secret store.

## Acceptance evidence required

| Check | Required evidence | Current status |
|---|---|---|
| Supabase project identity | Redacted project URL/ref comparison | BLOCKED-ACCESS |
| Render env configuration | Names present; values never exposed | BLOCKED-ACCESS |
| Migrations | Successful live migration history | BLOCKED-ACCESS |
| RLS | Live cross-user negative tests | BLOCKED-ACCESS |
| Auth lifecycle | Signup/login/refresh/delete tests | BLOCKED-ACCESS |
| Admin authorization | Role and last-admin tests | BLOCKED-ACCESS |
| Market data | Trusted source and non-empty production rows | BLOCKED-DATA |

See `AGROGROWTH_REMEDIATION_MASTER_PLAN.md` and
`PRODUCTION_DEPLOYMENT_CHECKLIST.md` for the complete release gates.
