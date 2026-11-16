# Weather provider migration: WeatherAPI.com + NASA POWER

## Providers

- **Current conditions and forecast:** WeatherAPI.com, one `forecast.json` request for current conditions plus the Free plan's 3-day forecast.
- **Historical weather:** NASA POWER Daily API, aggregated by calendar month for historical crop-weather analysis. It is a gridded meteorological/satellite-derived product, not a local farm weather station.
- **No Open-Meteo requests remain in the active weather routes/provider.**

## One-time production configuration

1. Create a free WeatherAPI.com account: https://www.weatherapi.com/signup.aspx
2. Copy the API key from the WeatherAPI dashboard.
3. Open Render → AgroDev-3 → Environment.
4. Add `WEATHERAPI_KEY` with the key value. Keep it server-side; do not use a `VITE_` or `EXPO_PUBLIC_` variable.
5. Save changes and redeploy AgroDev-3.

Use the dedicated `WEATHERAPI_KEY` variable only. Do not reuse a generic `WEATHER_API_KEY` that may belong to another provider.

## Reliability controls

- 8-second upstream timeout by default.
- One bounded retry for transient failures (network, 429, 5xx).
- 8-minute in-process cache by rounded coordinates.
- In-flight request deduplication so simultaneous clients at the same location share a provider request.
- The mobile gateway continues to cache successful weather responses for offline use.
- Provider errors return explicit unavailable/error responses. No fake current observations are substituted.

Optional Render tuning:

- `WEATHER_FORECAST_TIMEOUT_MS=8000`
- `WEATHER_FORECAST_RETRIES=1`
- `WEATHER_HISTORY_TIMEOUT_MS=25000`

## Free-plan limitations

WeatherAPI.com currently advertises 100,000 calls/month, commercial use, and up to 3 forecast days on its Free plan. The Free plan does not provide the longer forecast horizons or agricultural ET0/solar products that require higher plans. The weather crop planner therefore has at most three forecast days until the account is upgraded; it must not label this as a 7- or 14-day forecast.

WeatherAPI.com does not provide measured soil moisture. AgroGrowth marks the displayed soil-moisture index as `weather-derived-estimate`; it is not a sensor observation and must not be treated as a field measurement.

NASA POWER historical values are gridded estimates. Historical monthly values are labelled as NASA POWER data; they are not live station observations. The simple seasonal climatology returned alongside the current forecast is explicitly marked as an estimate.

## Verification

After deployment, check:

```bash
curl -i "https://agrodev-3.onrender.com/api/weather/coordinates?lat=36.8065&lon=10.1815"
```

A successful response must contain:

- `source.provider = "WeatherAPI.com"`
- `source.isRealData = true`
- a non-empty `current` object
- up to 3 entries in `forecast.daily`

Historical route:

```bash
curl -i "https://agrodev-3.onrender.com/api/weather-crop-planner/historical-analysis/tunis/olive?period=12"
```

A successful response must contain `dataSource = "NASA POWER"` and monthly observations. If the WeatherAPI key is absent or invalid, the current-weather route returns an explicit unavailable/error response instead of fake values.
