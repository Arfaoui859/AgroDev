# AgroGrowth farm satellite monitoring

## Existing backend reused
The project already had:
- `POST /api/assistant/satellite/ndvi`
- Copernicus Data Space OAuth + Sentinel Hub Statistical API
- Sentinel-2 L2A NDVI evalscript with cloud/shadow/water/snow masking
- persistence to `satellite_observations`

The mobile implementation reuses that endpoint and service; it does not create a second NDVI engine.

## Mobile boundary workflow
1. Open Farm Management and select the farm to monitor; each saved farm has its own boundary and NDVI result.
2. Walk around the plot perimeter and record at least three GPS corner points.
3. Save the closed GeoJSON Polygon to `farms.boundaries` through the authenticated, owner-scoped endpoint `PUT /api/farms/:farmId/boundaries`.
4. The screen renders an Esri World Imagery snapshot around the saved polygon and displays attribution.
5. Run the existing 90-day Sentinel-2 NDVI analysis. The response reports monthly observations, mean/min/max NDVI, valid samples and resolution.

## Runtime requirements
- Mobile location permission for GPS point capture.
- Supabase verified user session.
- Backend `SUPABASE_SERVICE_ROLE_KEY` for persisted satellite results.
- Backend `COPERNICUS_CLIENT_ID` and `COPERNICUS_CLIENT_SECRET` for Sentinel Hub.

## Important interpretation limits
- GPS corner points are collected by the farmer while walking the boundary; check the device's GPS accuracy and ensure the polygon follows the actual property perimeter.
- The imagery snapshot is a static latest-available World Imagery export, not a live camera or guaranteed same-day acquisition. Esri attribution is displayed.
- Sentinel-2 observations are periodic and cloud-masked at 10 m resolution. NDVI is a vegetation-greenness indicator, not a direct diagnosis of disease, nutrient deficiency, soil moisture or yield.
- A low valid-pixel count or cloudy period should be treated as insufficient evidence, not as a healthy/unhealthy verdict.
