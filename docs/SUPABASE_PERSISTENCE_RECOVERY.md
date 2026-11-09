# AgroGrowth Supabase persistence recovery

This runbook addresses the two errors currently shown by the application:

- `Could not find the table 'public.farm_agent_settings' in the schema cache`
- `لم يتم حفظ المزرعة في قاعدة البيانات` / financial persistence failures

## 1. Apply the required migrations

In the Supabase project used by the deployed AgroGrowth API, open **SQL Editor** and run these files in order:

1. `database/autonomous-farm-agent.sql`
2. `database/farm-finance-persistence.sql`

The first creates the autonomous agent settings and persistent assistant conversation/message tables, adds notification metadata columns and requests a PostgREST schema-cache refresh.

The second creates the expense/revenue ledgers, user ownership policies and indexes.

Do not run these against a different Supabase project from the one configured in the deployed API.

## 2. Verify the database state

Run `database/verify-assistant-persistence.sql` in the same SQL Editor.

Expected:
- `farm_agent_settings_present = true`
- `farm_agent_conversations_present = true`
- `farm_agent_messages_present = true`
- `farm_expenses_present = true`
- `farm_revenues_present = true`
- RLS enabled for all five tables
- Policies present for the authenticated user's own records

If the tables exist but the API still reports a missing relation, refresh the PostgREST schema cache from SQL Editor:

```sql
NOTIFY pgrst, 'reload schema';
```

Then wait briefly and retry.

## 3. Confirm production authentication

The following writes require a real Supabase access token:
- `POST /api/farms`
- `POST /api/expenses`
- `POST /api/revenues`
- `POST /api/assistant/conversations`
- `POST /api/assistant/conversations/:conversationId/messages`

The API derives `user_id` / `owner_id` from the verified JWT. It must not accept a user ID supplied by the browser as proof of identity.

A signed-in browser session must send `Authorization: Bearer <session.access_token>`. If the access token is missing or expired, sign in again; do not weaken RLS or enable demo identity in production.

## 4. Verify farm creation safely

After sign-in, create one farm using the normal form. The API should return HTTP 201 with:

- `success: true`
- `provenance.source = "supabase.farms"`
- `provenance.persisted = true`
- the created farm UUID

Then reload the farm list and verify the same UUID is returned for that user. Do not infer success from a toast or optimistic UI update alone.

Useful error codes:
- `VERIFIED_SESSION_REQUIRED`: no verified caller session reached the API
- `FARM_MIGRATION_REQUIRED`: farms relation/schema is missing
- `FARM_RLS_DENIED`: database ownership policy rejected the write
- `FARM_PERSISTENCE_FAILED`: another database failure; inspect server log by database code

## 5. Verify assistant memory and finance

With the same signed-in account:
1. Open the assistant, send a message, then reload the page.
2. Confirm the conversation appears in history and the message can be reopened.
3. Create a small test expense and revenue record only if appropriate; verify each appears in the ledger after reload.
4. Check the returned `provenance.persisted = true` on successful writes.

Useful error codes:
- `ASSISTANT_MIGRATION_REQUIRED`, `ASSISTANT_RLS_DENIED`
- `FARM_FINANCE_MIGRATION_REQUIRED`, `FARM_FINANCE_RLS_DENIED`

The assistant response being generated does not prove the transcript was saved. A successful farm or finance action may be persisted even if a separate chat-history write fails; check the actual record before retrying to avoid duplicates.

## 6. Deployment boundary

Merging this feature branch and deploying the API are separate from applying SQL. The SQL migrations must be applied to the correct Supabase project, and the deployed API must run a commit containing these route changes.

The repository checks currently do not prove a successful production deployment. Vercel has reported a `build-rate-limit` failure, which is a platform build quota signal rather than a passing build. Re-check CI/build and perform a real authenticated smoke test after deployment.
