# AgroGrowth market automation

## ONAGRI Bir El Kassaa — official monthly wholesale mercuriales

Official source page supplied and verified:
https://www.onagri.nat.tn/Marche-de-gros-bir-el-kasaa/fr/62

The ONAGRI page describes a daily and monthly follow-up of the Bir El Kassaa national wholesale market, and its archive lists monthly mercuriales. The visible archive contained 190 documents when checked; the first page showed monthly reports from March through July 2026. Each monthly report contains:
- average price for the reported year in millimes/kg;
- the previous-year comparison price and price variation percentage;
- monthly supply quantity in tonnes and its year-over-year variation;
- number of observation days.

Example: the July 2026 report contains separate fruit, vegetable and fish tables. Its 2026 prices are monthly averages, not daily spot quotations. The collector converts millimes/kg to TND/kg by dividing by 1,000. It stores the monthly period explicitly and does not invent minimum/maximum prices.

### Collector implementation

- Script: `scripts/market-data/ingest_onagri_bir_el_kassaa.py`
- Scheduled workflow: `.github/workflows/onagri-market-ingestion.yml`
- Endpoint: `POST /api/agro-market/ingest/market-prices`
- Source key: `tn-onagri-bir-el-kassaa`
- Database migration: `database/migrations/20261117_bir_el_kassaa_and_marketplace_inquiries.sql`

The script reads the ONAGRI index, follows the newest five monthly report links, parses the published HTML tables, preserves the original cells/document URL in `raw_payload`, and posts normalized observations. External IDs are stable by report month and commodity, so repeated scheduled runs upsert rather than duplicate. The rolling five-report import also backfills recent months when the workflow is first activated.

The database keeps the source's monthly context:
- `aggregation_period=monthly`, `period_start`, `period_end`;
- `price_average` in TND/kg (the official monthly average);
- `price_change_percent` and `observation_days`;
- `supply_quantity_tons` and `supply_change_percent`.

### Activate scheduled ingestion

Configure these GitHub repository secrets:
- `AGROGROWTH_API_URL`: the base URL of the deployed AgroGrowth Express API, without a trailing slash;
- `AGROGROWTH_ADMIN_TOKEN`: the server-side admin bearer token accepted by `requireAdminAccess`.
- `ONAGRI_REUSE_CONFIRMED=true`: set only after reviewing ONAGRI's reuse terms and confirming automated collection is allowed.

The workflow checks once daily at 04:15 UTC for a new monthly report and is also manually runnable from GitHub Actions. It is intentionally a daily *publication check*, not a claim that ONAGRI publishes a new price table every day. The collector uses a descriptive user-agent, normal HTTPS requests and a 30-second timeout; it does not bypass access controls. Review ONAGRI's reuse terms and rate-limit guidance before enabling automated collection.

Use `DRY_RUN=1 python scripts/market-data/ingest_onagri_bir_el_kassaa.py` locally to inspect the normalized payload without writing to AgroGrowth. The live job remains inactive until all three GitHub secrets are configured and the explicit reuse confirmation is set.

## Other official Tunisian sources

These sources are registered separately; they are not interchangeable with Bir El Kassaa.

- CRDA Sidi Bouzid produce prices: https://catalog.data.gov.tn/dataset/suivi-des-prix
- Vegetables CSV resource: https://catalog.data.gov.tn/dataset/suivi-des-prix/resource/1a522c14-4d20-430f-adb4-9820cb057d29
- Fruits CSV resource: https://catalog.data.gov.tn/dataset/suivi-des-prix/resource/75f90f09-a748-4c16-b867-9b646503ca3f
- ONAGRI agricultural input prices (XLSX: seeds, plants, fertilizers, pesticides, mechanization and tools): https://catalog.data.gov.tn/fr/dataset/prix-des-principaux-intrants-des-produits-agricoles
- Ministry pesticide homologation register (PDF; requires reviewed extraction): https://catalog.data.gov.tn/dataset/liste-des-pesticides-homologues-en-tunisie

CRDA Sidi Bouzid columns include `Date`, `Type`, `Qte`, `pgmin`, `pgmax`, `pdmin`, and `pdmax`. Its wholesale and retail ranges must remain labelled Sidi Bouzid. Do not display those records as Bir El Kassaa prices. When the source supplies only min/max, leave the average null.

## Existing ingestion contract

POST `/api/agro-market/ingest/market-prices` is restricted to platform admins/server-side automation. Mobile clients never receive the admin token. Payloads must carry source identity, URL, date, market, commodity and price evidence. The API validates and upserts by source/external ID/date/market/commodity/price kind, records source status, and retains the original source row.

Product catalog ingestion is separate at `POST /api/agro-market/ingest/products`. Pesticides must remain `unverified` unless the official Tunisian registration source confirms their status. Presence in a catalog is not an application recommendation or a dosage instruction.

## Marketplace buyer/seller inquiry APIs

- `GET /api/agro-market/my-listings`: authenticated seller's own listings, including non-public statuses.
- `POST /api/agro-market/listings/:id/inquiries`: buyer creates an inquiry on a published listing.
- `GET /api/agro-market/inquiries`: buyer or seller reads only conversations they participate in.
- `PATCH /api/agro-market/inquiries/:id/status`: seller updates inquiry status.

RLS enforces buyer/seller separation. The mobile Marketplace screen now exposes contact-seller, an inquiry inbox, seller edit/archive/delete controls and seller acceptance of new inquiries. This is still an inquiry/contact foundation, not online payment, escrow, shipping, threaded replies or a completed real-time chat system.
