# AgroGrowth Market Automation (n8n)

This integration is intentionally source-agnostic until each supplier/market URL and its reuse licence are confirmed. It does not invent prices or scrape arbitrary URLs.

## Existing capabilities reused
- The Express gateway already exists; this module mounts under `/api/agro-market`.
- Supabase is the persistence layer.
- Farm boundaries and Sentinel-2 NDVI already exist through `POST /api/assistant/satellite/ndvi`; do not create a second satellite pipeline.
- Existing `market_prices` is extended additively; existing observations are retained.

## Suggested n8n workflow
1. Schedule Trigger (daily or source-specific interval).
2. HTTP Request: fetch the official CSV/API/RSS URL supplied for that source.
3. Parse CSV/JSON/XML with native n8n nodes.
4. Code node: map rows to the normalized schema below; preserve the provider's original row in `raw_payload`.
5. HTTP Request: POST normalized records to the AgroGrowth endpoint with an admin credential stored in n8n Credentials (never in workflow JSON).
6. On success, record source timestamp and count; on failure, alert the operator and do not overwrite good observations.

## Price ingestion
POST `/api/agro-market/ingest/market-prices`:
```json
{
  "source_key": "official-market-feed-key",
  "source_name": "Official market feed",
  "source_url": "https://example.gov.tn/dataset.csv",
  "source_type": "official_open_data",
  "verification_status": "official-source",
  "prices": [{
    "external_id": "provider-row-id",
    "crop_name": "Potato",
    "market_location": "Bir El Kassaa",
    "price_per_kg": 1.8,
    "price_min": 1.5,
    "price_max": 2.1,
    "unit": "kg",
    "currency": "TND",
    "price_date": "2026-11-16"
  }]
}
```
Use the provider's own average if available. Do not derive a market average from min/max unless the source explicitly defines that calculation.

## Product catalog ingestion
POST `/api/agro-market/ingest/products`. Product rows require stable `external_id`, `product_type`, and `trade_name`. For pesticides, use `registration_status: registered_tunisia` only when the official Tunisian registration source explicitly confirms it. Keep unknown records as `unverified`. A product record is not itself a recommendation or a dosage instruction.

## n8n environment / security
- Store the AgroGrowth admin token in n8n Credentials, not in a committed workflow.
- Never accept a URL supplied by a mobile client for server-side fetching (SSRF risk).
- Keep one source key per publisher/dataset; use provider row IDs as external IDs for idempotent updates.
- Respect the publisher's API terms, licence, robots policy and rate limits.
- Use daily schedules for daily datasets; never poll faster than the source's publication cadence.
