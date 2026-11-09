import axios from "axios";
import type { Request, Response, RequestHandler } from "express";
import { scopedClientFromAuthHeader, supabaseAdmin } from "../lib/supabase";
import { fetchFarmNdvi } from "../services/satellite/sentinelHub";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const analyzeFarmSatelliteNdvi: RequestHandler = async (req: Request, res: Response) => {
  const userId = req.userId;
  const db = req.identitySource === "jwt" ? scopedClientFromAuthHeader(req.header("authorization")) : null;
  if (!userId || !db) return res.status(401).json({ success: false, code: "VERIFIED_SESSION_REQUIRED" });
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !supabaseAdmin) {
    return res.status(503).json({ success: false, code: "SATELLITE_PERSISTENCE_NOT_CONFIGURED" });
  }

  const farmId = typeof req.body?.farm_id === "string" ? req.body.farm_id.trim() : "";
  const periodDays = req.body?.period_days === undefined ? 90 : Number(req.body.period_days);
  if (!uuidPattern.test(farmId)) return res.status(400).json({ success: false, code: "VALID_FARM_ID_REQUIRED" });
  if (![30, 60, 90, 180].includes(periodDays)) {
    return res.status(400).json({ success: false, code: "INVALID_SATELLITE_PERIOD", allowed: [30, 60, 90, 180] });
  }

  const { data: farm, error: farmError } = await db.from("farms")
    .select("id,name,boundaries").eq("id", farmId).eq("owner_id", userId).maybeSingle();
  if (farmError) return res.status(503).json({ success: false, code: "FARM_LOOKUP_FAILED" });
  if (!farm) return res.status(404).json({ success: false, code: "FARM_NOT_FOUND_OR_NOT_OWNED" });
  if (!farm.boundaries) {
    return res.status(422).json({
      success: false,
      code: "FARM_BOUNDARY_REQUIRED",
      message: "Draw and save the farm polygon before requesting field-level satellite analysis.",
    });
  }

  try {
    const result = await fetchFarmNdvi(farm.boundaries, periodDays);
    const rows = result.observations.map(item => ({
      farm_id: farmId,
      provider: result.provider,
      collection: result.collection,
      index_name: "NDVI",
      observed_from: item.intervalFrom,
      observed_to: item.intervalTo,
      mean_value: item.mean,
      min_value: item.min,
      max_value: item.max,
      standard_deviation: item.standardDeviation,
      sample_count: item.sampleCount,
      no_data_count: item.noDataCount,
      resolution_meters: result.resolutionMeters,
      quality_metadata: {
        cloud_mask: "Sentinel-2 Scene Classification Layer; classes 3, 6, 8, 9, 10, 11 excluded",
        spatial_scope: "saved farm GeoJSON polygon",
        temporal_period_days: periodDays,
        interpretation: "vegetation index; not a disease diagnosis or direct yield measurement",
      },
    }));
    const { data, error } = await supabaseAdmin.from("satellite_observations")
      .upsert(rows, { onConflict: "farm_id,provider,index_name,observed_from,observed_to" })
      .select("id,farm_id,index_name,observed_from,observed_to,mean_value,min_value,max_value,standard_deviation,sample_count,no_data_count,resolution_meters,provider,collection");
    if (error) {
      console.error("Satellite observation persistence failed:", error.message);
      return res.status(503).json({ success: false, code: "SATELLITE_RESULT_SAVE_FAILED" });
    }
    return res.json({
      success: true,
      farm: { id: farm.id, name: farm.name },
      data: data ?? [],
      provenance: {
        provider: result.provider,
        collection: result.collection,
        index: "NDVI",
        resolutionMeters: result.resolutionMeters,
        boundary: "saved farm GeoJSON polygon",
        persisted: true,
        isLiveSensorData: false,
        isDiseaseDiagnosis: false,
      },
      limitations: [
        "NDVI measures vegetation greenness and is not a direct measurement of plant disease, soil nutrients or crop yield.",
        "Cloud and invalid pixels are masked; low valid sample counts reduce confidence.",
        "Satellite observations are periodic acquisitions, not continuous live monitoring.",
      ],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "SATELLITE_ANALYSIS_FAILED";
    if (message === "SATELLITE_CREDENTIALS_NOT_CONFIGURED") {
      return res.status(503).json({ success: false, code: message, requiredEnvironment: ["COPERNICUS_CLIENT_ID", "COPERNICUS_CLIENT_SECRET"] });
    }
    if (message === "VALID_FARM_GEOJSON_BOUNDARY_REQUIRED") {
      return res.status(422).json({ success: false, code: message });
    }
    if (axios.isAxiosError(error)) {
      const providerStatus = error.response?.status;
      if (providerStatus === 429) {
        return res.status(503).json({ success: false, code: "SATELLITE_PROVIDER_RATE_LIMITED", message: "Copernicus rate-limited the request. Retry later; no new observation was saved." });
      }
      if (providerStatus === 401 || providerStatus === 403) {
        return res.status(502).json({ success: false, code: "SATELLITE_PROVIDER_AUTH_OR_PERMISSION_FAILED", message: "Copernicus rejected the configured OAuth credentials or account permissions." });
      }
    }
    if (message === "NO_VALID_SATELLITE_OBSERVATIONS") {
      return res.status(404).json({ success: false, code: message, message: "No usable Sentinel-2 observations were returned for this period and polygon." });
    }
    console.error("Farm satellite NDVI request failed:", message);
    return res.status(502).json({ success: false, code: "COPERNICUS_SATELLITE_REQUEST_FAILED" });
  }
};
