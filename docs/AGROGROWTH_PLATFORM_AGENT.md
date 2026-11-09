# AgroGrowth Platform Agent — Integration and Deployment

## Purpose

The chatbot is the conversational control surface for AgroGrowth, not a standalone Q&A widget. The authenticated backend supplies the model with a compact, read-only view of the user's persisted platform records. Explicit write operations are implemented as separate authenticated endpoints and must be confirmed by the user in the UI.

## Implemented in this branch

### Platform context for the central advisor

`POST /api/ai/assistant/chat` now builds context from the authenticated user's own records:

- Authenticated account role, language preference, recorded farming experience, specializations and preferred crops (used only to adapt answer depth; never to grant cross-user access).
- Farms and their saved GeoJSON boundaries (boundary data is not sent to the LLM).
- Farm sections/plots and their crop, soil type, area and planting/harvest dates.
- Crop cultivation records and growth stages.
- Latest verified soil records (lab/laboratory/sensor only).
- Saved plant-disease follow-up records, explicitly labelled as unverified visual/inspection records.
- Persisted weather records and registered sensor-device status (not live telemetry).
- Historical market-price records, with source and date.
- Saved satellite vegetation-index observations, when the satellite migration has been applied.

The model receives compact facts, not credentials or raw uploaded images. The context is owner-scoped through the caller's JWT. Missing/failed optional sources are omitted rather than fabricated.

### Image diagnosis → farm record

After an image analysis succeeds, the chat can prepare a review card to select the correct farm and (optionally) crop cultivation. The image and analysis result are saved only after the user confirms.

Endpoint: `POST /api/assistant/actions/disease-detections` (authenticated multipart form)

- Verifies that the selected farm belongs to the caller.
- If a cultivation is selected, verifies it belongs to that farm.
- Stores the image in the private `agrogrowth-disease-evidence` Supabase Storage bucket.
- Creates a `plant_disease_detections` record with `detection_method=image_ai`, crop, severity, confidence, pending recovery status and a pointer to the private image.
- Tags the record as requiring field verification; saving a model output does not turn it into a confirmed diagnosis.
- Returns a short-lived signed image URL for the chat.
- Historical chats store the disease-record ID and request a fresh, owner-checked signed URL when the conversation is reopened via `GET /api/assistant/disease-detections/:recordId/evidence-url`.

Required migration: `database/assistant-disease-evidence.sql`

Required runtime configuration: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and a real `SUPABASE_SERVICE_ROLE_KEY`. The service-role key must remain server-side.

### Satellite NDVI → farm record

Endpoint: `POST /api/assistant/satellite/ndvi` (authenticated JSON: `farm_id`, optional `period_days` 30/60/90/180)

- Verifies farm ownership and requires a valid saved GeoJSON Polygon or MultiPolygon boundary in WGS84.
- Authenticates server-to-server with Copernicus Data Space Ecosystem OAuth client credentials.
- Requests Sentinel-2 L2A statistics from the Sentinel Hub Statistical API.
- Calculates NDVI using B08 and B04 at 10 m resolution and excludes cloud/shadow/water/snow scene classes from the statistics.
- Stores time-window summaries in `satellite_observations`, scoped to the selected farm.
- The chatbot can use these persisted observations in later answers.

Required migration: `database/satellite-observations.sql`

Required Render environment variables:
- `COPERNICUS_CLIENT_ID`
- `COPERNICUS_CLIENT_SECRET`

Create the OAuth client in the Copernicus/Sentinel Hub dashboard. Do not put these values in any `VITE_*` variable or commit them to Git.

The assistant UI recognises requests such as “حلللي بالساتلايت” / “analyze satellite” and asks the user to select a farm and period before it calls the endpoint. Saved observations are also supplied to later authenticated assistant conversations.

## Deployment order

1. Apply `database/assistant-disease-evidence.sql` in the Supabase SQL Editor.
2. Apply `database/satellite-observations.sql` in the Supabase SQL Editor.
3. In the existing AgroDev Render service, add the Copernicus OAuth credentials as secret environment variables. Confirm the existing `SUPABASE_SERVICE_ROLE_KEY` is configured; never paste secrets into chat or GitHub.
4. Confirm each farm has a valid GeoJSON polygon in `farms.boundaries`. A farm point/location alone is insufficient for parcel-level satellite statistics.
5. Deploy this branch to the existing service only after reviewing the branch diff. Do not apply the whole `render.yaml` Blueprint blindly; it may define extra or paid services.
6. Test using a real authenticated account and a farm that the account owns. Verify the database row and private storage object before relying on the UI.

## Honest capability boundaries

- Chat history is persisted separately from farm facts. This context enrichment does not grant the LLM arbitrary database write access.
- Crop registration already uses a separate confirmation flow.
- Disease record persistence is implemented, but the underlying diagnosis still depends on the configured vision provider returning an approved provenance response.
- Satellite analysis is a real Copernicus integration path, but it will return `SATELLITE_CREDENTIALS_NOT_CONFIGURED` until OAuth secrets are added, `FARM_BOUNDARY_REQUIRED` until a valid farm polygon exists, and will not claim results if the provider returns no usable observations.
- NDVI is a vegetation-greenness indicator. It is not a disease diagnosis, nutrient analysis, direct yield estimate, or continuous/live sensor feed.
- The code has been committed to the feature branch. Database migrations, Render secrets, live Copernicus calls, storage writes and production deployment are not performed by a GitHub source commit.

## Validation still required

Run the repository quality gate on this branch (lint, unit tests and production build). Then exercise:
- Owner vs non-owner farm IDs (must reject cross-account access).
- Image upload MIME/size limits, private storage and record persistence.
- Missing Copernicus credentials, invalid/missing boundaries, valid NDVI response, empty imagery period and provider rate limits.
- Satellite records appearing in the next authenticated assistant conversation.
