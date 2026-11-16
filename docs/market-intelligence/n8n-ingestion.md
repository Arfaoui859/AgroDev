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

## Confirmed Tunisian open-data sources

These are official dataset pages/resources found in the national open-data catalogue. They are registered in `market_data_sources` as `adapter_pending` and remain disabled until the n8n mapping is configured and a successful test run is reviewed.

- CRDA Sidi Bouzid produce prices: https://catalog.data.gov.tn/dataset/suivi-des-prix
- Vegetables CSV resource: https://catalog.data.gov.tn/dataset/suivi-des-prix/resource/1a522c14-4d20-430f-adb4-9820cb057d29
- Fruits CSV resource: https://catalog.data.gov.tn/dataset/suivi-des-prix/resource/75f90f09-a748-4c16-b867-9b646503ca3f
- ONAGRI agricultural input prices (XLSX: seeds, plants, fertilizers, pesticides, mechanization and tools): https://catalog.data.gov.tn/fr/dataset/prix-des-principaux-intrants-des-produits-agricoles
- Ministry pesticide homologation register (PDF; requires reviewed extraction): https://catalog.data.gov.tn/dataset/liste-des-pesticides-homologues-en-tunisie

The CRDA dataset describes columns `Date`, `Type`, `Qte`, `pgmin`, `pgmax`, `pdmin`, and `pdmax`. Map each source row into two observations when the ranges exist:
- `price_kind=wholesale`, `price_min=pgmin`, `price_max=pgmax`
- `price_kind=retail`, `price_min=pdmin`, `price_max=pdmax`

Do not fabricate an average when the publisher supplies only a min/max range. Set `price_average=null`. Set the location to `Sidi Bouzid`; this source does **not** provide Bir El Kassaa prices. A separate Bir El Kassaa source/URL is still needed before that market can be represented.

### CRDA CSV normalization Code node

After the CKAN resource metadata request, download the CSV and parse it into item JSON. In a Code node configured to run once for all items:

```javascript
const rows = $input.all().map(x => x.json);
const get = (row, names) => {
  const keys = Object.keys(row);
  const key = keys.find(k => names.includes(k.trim().toLowerCase()));
  return key ? row[key] : null;
};
const dateValue = (v) => {
  if (typeof v === 'number') {
    const d = new Date(Date.UTC(1899, 11, 30) + v * 86400000);
    return d.toISOString().slice(0, 10);
  }
  const s = String(v ?? '').trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
};
const numberValue = (v) => {
  if (v === null || v === undefined || String(v).trim() === '') return null;
  const n = Number(String(v).replace(',', '.').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) && n >= 0 ? n : null;
};
const out = [];
for (const row of rows) {
  const crop = String(get(row, ['type','نوع']) ?? '').trim();
  const date = dateValue(get(row, ['date','التاريخ']));
  if (!crop || !date) continue;
  const common = { crop_name: crop, market_location: 'Sidi Bouzid', price_date: date, unit: 'kg', currency: 'TND' };
  const pgmin = numberValue(get(row, ['pgmin']));
  const pgmax = numberValue(get(row, ['pgmax']));
  if (pgmin !== null || pgmax !== null) out.push({ json: { ...common, price_kind: 'wholesale', price_min: pgmin, price_max: pgmax } });
  const pdmin = numberValue(get(row, ['pdmin']));
  const pdmax = numberValue(get(row, ['pdmax']));
  if (pdmin !== null || pdmax !== null) out.push({ json: { ...common, price_kind: 'retail', price_min: pdmin, price_max: pdmax } });
}
return out;
```

Then map the Code node output into the ingestion request's `prices` array. Keep source keys distinct for vegetables and fruits so each feed can be monitored independently. The n8n workflow must query CKAN's resource metadata for the current download URL rather than hard-coding a temporary download URL.
