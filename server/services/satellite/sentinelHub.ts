import axios from "axios";

const TOKEN_URL = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token";
const STATISTICS_URL = "https://sh.dataspace.copernicus.eu/statistics/v1";
const DATA_COLLECTION = "sentinel-2-l2a";

let cachedToken: { value: string; expiresAt: number } | null = null;

function normalizeGeometry(raw: any): { type: "Polygon" | "MultiPolygon"; coordinates: number[][][] | number[][][][] } | null {
  const candidate = raw?.type === "Feature" ? raw.geometry : raw;
  if (!candidate || !["Polygon", "MultiPolygon"].includes(candidate.type) || !Array.isArray(candidate.coordinates)) return null;
  const coordinates = candidate.coordinates;
  const rings = candidate.type === "Polygon" ? coordinates : coordinates.flat(1);
  if (!Array.isArray(rings) || !rings.length) return null;
  for (const ring of rings) {
    if (!Array.isArray(ring) || ring.length < 4) return null;
    for (const point of ring) {
      if (!Array.isArray(point) || point.length < 2 ||
          !Number.isFinite(Number(point[0])) || !Number.isFinite(Number(point[1])) ||
          Math.abs(Number(point[0])) > 180 || Math.abs(Number(point[1])) > 90) return null;
    }
  }
  return { type: candidate.type, coordinates } as { type: "Polygon" | "MultiPolygon"; coordinates: number[][][] | number[][][][] };
}

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 60_000) return cachedToken.value;
  const clientId = process.env.COPERNICUS_CLIENT_ID;
  const clientSecret = process.env.COPERNICUS_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("SATELLITE_CREDENTIALS_NOT_CONFIGURED");

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });
  const response = await axios.post(TOKEN_URL, body.toString(), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    timeout: 15_000,
  });
  const token = response.data?.access_token;
  const expiresIn = Number(response.data?.expires_in);
  if (typeof token !== "string" || !token || !Number.isFinite(expiresIn)) {
    throw new Error("SATELLITE_TOKEN_RESPONSE_INVALID");
  }
  cachedToken = { value: token, expiresAt: now + expiresIn * 1000 };
  return token;
}

const NDVI_EVALSCRIPT = `//VERSION=3
function setup() {
  return {
    input: [{ bands: ["B04", "B08", "SCL", "dataMask"] }],
    output: [
      { id: "data", bands: 1, sampleType: "FLOAT32" },
      { id: "dataMask", bands: 1 }
    ]
  };
}
function evaluatePixel(sample) {
  var denominator = sample.B08 + sample.B04;
  var ndvi = denominator === 0 ? 0 : (sample.B08 - sample.B04) / denominator;
  var mask = sample.dataMask;
  // Exclude cloud shadows, water, clouds, cirrus and snow from parcel statistics.
  if ([3, 6, 8, 9, 10, 11].indexOf(sample.SCL) !== -1 || denominator === 0) mask = 0;
  return { data: [ndvi], dataMask: [mask] };
}`;

export interface SentinelNdviResult {
  intervalFrom: string;
  intervalTo: string;
  mean: number;
  min: number;
  max: number;
  standardDeviation: number;
  sampleCount: number;
  noDataCount: number;
}

export async function fetchFarmNdvi(boundary: unknown, periodDays = 90): Promise<{
  observations: SentinelNdviResult[];
  provider: string;
  collection: string;
  resolutionMeters: number;
}> {
  const geometry = normalizeGeometry(boundary);
  if (!geometry) throw new Error("VALID_FARM_GEOJSON_BOUNDARY_REQUIRED");
  if (![30, 60, 90, 180].includes(periodDays)) throw new Error("INVALID_SATELLITE_PERIOD");

  const token = await getAccessToken();
  const to = new Date();
  const from = new Date(to.getTime() - periodDays * 24 * 60 * 60 * 1000);
  const iso = (date: Date) => date.toISOString().replace(/\.\d{3}Z$/, "Z");
  const payload = {
    input: {
      bounds: {
        geometry,
        properties: { crs: "http://www.opengis.net/def/crs/OGC/1.3/CRS84" },
      },
      data: [{
        type: DATA_COLLECTION,
        dataFilter: { mosaickingOrder: "leastCC" },
      }],
    },
    aggregation: {
      timeRange: { from: iso(from), to: iso(to) },
      aggregationInterval: { of: "P30D" },
      evalscript: NDVI_EVALSCRIPT,
      resx: 10,
      resy: 10,
    },
  };
  const response = await axios.post(STATISTICS_URL, payload, {
    headers: { Authorization: "Bearer " + token, "Content-Type": "application/json", Accept: "application/json" },
    timeout: 60_000,
  });
  if (response.data?.status !== "OK" || !Array.isArray(response.data?.data)) {
    throw new Error("SATELLITE_STATISTICS_RESPONSE_INVALID");
  }

  const observations: SentinelNdviResult[] = response.data.data.flatMap((entry: any) => {
    const stats = entry?.outputs?.data?.bands?.B0?.stats;
    if (!stats || !entry?.interval?.from || !entry?.interval?.to) return [];
    const mean = Number(stats.mean);
    const min = Number(stats.min);
    const max = Number(stats.max);
    if (![mean, min, max].every(Number.isFinite)) return [];
    return [{
      intervalFrom: entry.interval.from,
      intervalTo: entry.interval.to,
      mean,
      min,
      max,
      standardDeviation: Number.isFinite(Number(stats.stDev)) ? Number(stats.stDev) : 0,
      sampleCount: Number(stats.sampleCount) || 0,
      noDataCount: Number(stats.noDataCount) || 0,
    }];
  });
  if (!observations.length) throw new Error("NO_VALID_SATELLITE_OBSERVATIONS");
  return {
    observations,
    provider: "Copernicus Data Space Ecosystem · Sentinel Hub Statistical API",
    collection: DATA_COLLECTION,
    resolutionMeters: 10,
  };
}
