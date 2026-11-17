# Agricultural input prices and pesticide seller offers

This feature separates **source-backed reference prices** from **seller offers**.

## 1. Apply the database migration

Run `supabase/migrations/20261117000100_agricultural_input_marketplace.sql` in the Supabase SQL editor (or apply it through the project's migration workflow) before deploying the API.

The migration creates:

- `agricultural_input_price_observations`: dated price observations with source name, source URL, source type, package size, currency, and verification status.
- `pesticide_seller_offers`: seller submissions held in `pending_review` until an administrator reviews the product registration evidence and seller distribution authorization.

RLS exposes reference prices publicly. Pesticide offers are public only when their status is `approved`; sellers can read their own submissions. Review and ingestion use the server-side service-role client only.

## 2. Reference-price ingestion

Send normalized observations to:

`POST /api/agro-market/ingest/input-prices`

This endpoint requires the same admin authentication used by the existing AgroGrowth market ingestion endpoint. Do not put the admin token in the mobile app.

Example payload (illustrative schema only; these are not real prices):

```json
{
  "source_key": "onagri-pesticide-prices",
  "source_name": "ONAGRI",
  "source_url": "https://www.onagri.nat.tn/",
  "source_type": "official_open_data",
  "verification_status": "official-source",
  "prices": [
    {
      "external_id": "source-row-identifier",
      "product_name": "Product trade name",
      "product_type": "pesticide",
      "active_ingredient": "Active ingredient if supplied by the source",
      "package_size": 1,
      "package_unit": "L",
      "price": 0.001,
      "currency": "TND",
      "observed_on": "2026-11-17"
    }
  ]
}
```

Replace the illustrative row with values parsed from the actual source file. Never mark a row `official-source` unless the source itself supports that claim. The ingest endpoint is idempotent on `source_key + external_id`.

An ONAGRI workbook review collector is included:

- Script: `scripts/market-data/prepare_onagri_input_price_review.py`
- Scheduled/manual workflow: `.github/workflows/onagri-input-price-review.yml`
- It inspects the ONAGRI pesticide and agricultural-input price workbooks, extracts only explicit product-name and price columns, and writes unapproved candidates plus diagnostics to a GitHub Actions artifact.
- If a workbook has no recognizable price/date columns, it reports a manual-mapping diagnostic instead of guessing.
- After reviewing the artifact and confirming the unit, package size, price and observation date, set `approved=true` only on valid rows. Upload the reviewed file from a trusted operator environment with `AGROGROWTH_API_URL` and `AGROGROWTH_ADMIN_TOKEN` set:

```bash
python scripts/market-data/prepare_onagri_input_price_review.py --upload-reviewed onagri-input-price-review.json
```

The workflow does not automatically publish candidate prices.

Public read endpoint:

`GET /api/agro-market/input-prices?q=&limit=100`

The mobile screen sorts observations by `observed_on` descending (newest first) and displays the source and date beside each price. If no observations have been imported, the UI intentionally shows an empty state rather than invented prices.

## 3. Pesticide seller submissions

Seller endpoint:

`POST /api/agro-market/pesticide-offers`

Required fields:

- `trade_name`
- `registration_number` and `product_registration_evidence_url`
- `seller_authorization_number` and `seller_authorization_document_url`
- `package_size`, `package_unit`, `price`, and `quantity`

Optional fields include active ingredient, location, governorate, and image URLs. The API always stores new submissions as `pending_review`. Supplying a URL or number is not itself proof of validity; an administrator must inspect the documents before approval.

Public offers endpoint:

`GET /api/agro-market/pesticide-offers`

Seller's own submissions:

`GET /api/agro-market/my-pesticide-offers`

Admin review queue and action:

- `GET /api/agro-market/admin/pesticide-offers`
- `PATCH /api/agro-market/admin/pesticide-offers/:id/review` with `{"status":"approved","review_note":"..." }` or `{"status":"rejected","review_note":"..." }`

Only approved offers appear publicly. The legacy generic listing endpoint rejects pesticide-keyword listings and filters previously published pesticide-like input listings from its public response, directing those submissions through this review flow.

## 4. Important operational status

The API and mobile integration are committed, but the feature is not live until the migration is applied, the API is deployed, and real source rows are imported. No current price is fabricated or implied by the illustrative payload above. The existing produce-price observations remain separate from agricultural-input prices.
