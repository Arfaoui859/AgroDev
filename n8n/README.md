# n8n — AgroGrowth ONAGRI Bir El Kassaa price ingestion

Import `n8n/workflows/agrogrowth-onagri-bir-el-kassaa.json` into the n8n instance.

## What it does

1. Runs daily at 04:15 in `Africa/Tunis`, or manually from the Manual Test trigger.
2. Reads the official ONAGRI Bir El Kassaa archive.
3. Selects the latest five dated monthly Mercuriale reports.
4. Parses the published wholesale tables and preserves the report URL and original cells.
5. Converts the published millimes/kg average to TND/kg, retaining monthly periods and supply/variation fields.
6. Rejects an empty or malformed collection rather than posting fabricated/empty prices.
7. Upserts through the existing authenticated AgroGrowth ingestion endpoint. Repeated runs are safe because source/external IDs are stable.

**Important:** ONAGRI's figures are monthly wholesale averages, not daily prices or min/max quotations. The workflow must not label them as daily or retail prices.

## One-time n8n setup

1. Import the JSON workflow.
2. Open **Upsert Prices into AgroGrowth**.
3. Create/select an **HTTP Bearer Auth** credential named `AgroGrowth Admin API`. Paste the server-side admin bearer token accepted by AgroGrowth's `requireAdminAccess`. Never put this token in the mobile app or commit it to Git.
4. Confirm the URL points to the deployed AgroGrowth Express API:
   `https://agrodev-3.onrender.com/api/agro-market/ingest/market-prices`
5. Save the workflow and run **Manual Test** once.
6. Inspect the final node output. A successful run must return `success: true`, a positive `insertedOrUpdated` count, and source key `tn-onagri-bir-el-kassaa`.
7. Only after a successful manual run, activate the workflow for the daily schedule.

## Database prerequisite

Apply these migrations to the production Supabase project, in order, before running the workflow:

- `database/migrations/20261116_marketplace_market_intelligence.sql`
- `database/migrations/20261117_bir_el_kassaa_and_marketplace_inquiries.sql`

The second migration adds monthly period, previous-year price, supply and observation-day columns used by the collector. If the production schema is not migrated, the ingestion API can reject the write.

## Troubleshooting

- **401/403:** the n8n Bearer credential is missing/incorrect or the backend admin guard does not accept that token.
- **503 / MARKET_INGEST_FAILED:** check Render logs and Supabase migration/schema/RLS/service-role configuration.
- **No dated report links / empty parse:** ONAGRI may have changed its page structure or temporarily blocked/unavailable; the workflow intentionally stops without writing fake prices.
- **Zero new rows after a successful run:** the current reports may already have been imported. Upsert is idempotent; check `GET /api/agro-market/prices?market=Bir%20El%20Kassaa` and the source status before concluding that ingestion failed.

## Scope and data quality

This workflow currently imports only ONAGRI Bir El Kassaa **monthly wholesale** observations. It does not generate daily spot prices, retail prices, seller offers, or current prices for every Tunisian governorate. CRDA Sidi Bouzid open-data CSVs are a separate source and must remain labelled Sidi Bouzid; do not merge them into Bir El Kassaa.
