import { Platform } from 'react-native';
import { supabase } from './supabase';
import { readCache, writeCache } from './cache';
import { API_TIMEOUT_MS, DEFAULT_API_BASE_URL } from '../config';
import { getActiveLanguage } from '../i18n';
import { getExtra, ExtraTranslations } from '../i18n/extra';
import { getProjects } from '../i18n/projects';
import { formatDateTime } from '../utils/date';
import { normalizePriority } from '../utils/notifications';
import {
  ApiResult,
  AppNotification,
  AICapabilitiesResponse,
  AICapability,
  AgriculturalCatalogProduct,
  AssistantReply,
  CropRecommendation,
  CropRecommendationResult,
  Cultivation,
  DataProvenance,
  DiseaseDiagnosisResult,
  Farm,
  FarmBoundary,
  SatelliteNdviObservation,
  FarmTask,
  FarmTaskPriority,
  FarmTaskStatus,
  FarmTaskType,
  Field,
  IrrigationResult,
  MarketPriceItem,
  MarketResult,
  OrchestrationTrace,
  MarketplaceListing,
  MarketplaceInquiry,
  MarketplaceResult,
  NewsArticle,
  NewsResult,
  NewsSourceStatus,
  PestIdentification,
  ProjectExpense,
  ProjectFinancialSummary,
  ProjectRevenue,
  ProvenanceMeta,
  SoilAnalysisInput,
  SoilAnalysisResult,
  SoilDetailedInput,
  SoilDetailedResult,
  SoilReport,
  SoilReportSummary,
  WeatherData,
} from '../types';

// ---------------------------------------------------------------------------
// Base URL configuration
// ---------------------------------------------------------------------------

/**
 * Localised fallback message. The API client is not a React component, so it
 * reads the module-level active language instead of a hook.
 */
function msg(key: keyof ExtraTranslations): string {
  return getExtra(getActiveLanguage())[key];
}

// Arabic script range. The Express gateway answers some errors with Arabic-only
// copy (e.g. market/weather validation messages). Those are correct for an
// Arabic caller but must not be shown verbatim to fr/en users, so we swap an
// Arabic-only server message for a localised generic one. English/French server
// messages are kept as-is (they are already readable and more specific).
const ARABIC_RE = /[\u0600-\u06FF]/;

function localizeServerError(message: string, status: number | null): string {
  const lang = getActiveLanguage();
  // The AI routes are rate-limited (30/min). The upstream answers a bare
  // English "Too Many Requests", which is unreadable for an Arabic-first
  // caller, so replace it with a localised, actionable message in every
  // language rather than leaking the raw status text.
  if (status === 429) return msg('apiRateLimited');
  if (lang === 'ar') return message;
  if (!ARABIC_RE.test(message)) return message;
  const x = getExtra(lang);
  return status !== null && status >= 500 ? x.apiUnavailable : x.stateError;
}

let API_BASE_URL = DEFAULT_API_BASE_URL;

export function setApiBaseUrl(url: string) {
  API_BASE_URL = url.trim().replace(/\/+$/, '');
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}

// ---------------------------------------------------------------------------
// Low-level request helper
// ---------------------------------------------------------------------------

export interface RequestOptions extends RequestInit {
  /** Cache key. When set, successful GET responses are cached and replayed offline. */
  cacheKey?: string;
  /** Skip the Authorization header (used by the public health probe). */
  anonymous?: boolean;
  /** Include the underlying transport error in the result for targeted diagnostics. */
  exposeNetworkError?: boolean;
  /** Explicitly mark multipart uploads so native FormData never gets a JSON content type. */
  multipart?: boolean;
}

/** Attach the freshest access token we can obtain without blocking the request. */
async function authHeaders(extra?: HeadersInit): Promise<Headers> {
  const headers = new Headers(extra);
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers.set('Authorization', `Bearer ${session.access_token}`);
    }
  } catch (error) {
    console.warn('session lookup failed:', error);
  }
  return headers;
}

/**
 * Force a token refresh after the gateway rejected the current one with 401.
 * Supabase normally refreshes in the background, but a long-idle app can still
 * present a token the server has already expired; refreshing once and retrying
 * keeps the user signed in instead of surfacing a spurious auth error.
 */
async function refreshSessionToken(): Promise<boolean> {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    return !error && Boolean(data.session?.access_token);
  } catch (error) {
    console.warn('session refresh failed:', error);
    return false;
  }
}

/**
 * Perform an authenticated request against the Express gateway.
 *
 * - Attaches the current Supabase access token when a session exists.
 * - On a 401, refreshes the session once and retries the request.
 * - Aborts after `API_TIMEOUT_MS`.
 * - On network failure, replays the last cached response for GET requests
 *   (labelled `fromCache`) so offline screens keep working.
 * - Never throws: always resolves to an `ApiResult` envelope.
 */
export async function apiRequest<T = unknown>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<ApiResult<T>> {
  const { cacheKey, anonymous, exposeNetworkError, multipart, ...init } = options;
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const buildHeaders = async () => {
    const headers = anonymous ? new Headers(init.headers) : await authHeaders(init.headers);
    // Multipart is declared by the caller, not inferred from a FormData
    // polyfill: React Native/Expo may wrap FormData across runtime boundaries.
    // Let fetch generate the boundary; manually setting this header breaks
    // Android file uploads.
    if (!headers.has('Content-Type') && init.body && !multipart) {
      headers.set('Content-Type', 'application/json');
    }
    return headers;
  };

  /** One network attempt with a fresh abort controller. */
  const send = async (): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
    try {
      return await fetch(url, { ...init, headers: await buildHeaders(), signal: controller.signal });
    } finally {
      clearTimeout(timeoutId);
    }
  };

  try {
    let res = await send();
    // A single retry after a token refresh covers an expired access token
    // without masking a genuine authorization failure (which 403 covers).
    if (res.status === 401 && !anonymous) {
      const refreshed = await refreshSessionToken();
      if (refreshed) res = await send();
    }

    const text = await res.text();
    let parsed: any = null;
    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = null;
      }
    }

    if (!res.ok) {
      const raw =
        (parsed && (parsed.message || parsed.error)) ||
        (res.status === 503 ? msg('apiUnavailable') : `HTTP ${res.status}`);
      const message = typeof raw === 'string' ? localizeServerError(raw, res.status) : `HTTP ${res.status}`;
      return {
        data: null,
        error: message,
        isOnline: true,
        fromCache: false,
        status: res.status,
        // Preserved so callers can distinguish an honest "no data" envelope
        // (e.g. code MARKET_DATA_NOT_AVAILABLE) from a genuine failure.
        errorBody: parsed ?? null,
      };
    }

    if (cacheKey && parsed !== null) {
      await writeCache(cacheKey, parsed);
    }

    return { data: parsed as T, error: null, isOnline: true, fromCache: false, status: res.status };
  } catch (error: any) {
    const isTimeout = error?.name === 'AbortError';

    if (cacheKey) {
      const cached = await readCache<T>(cacheKey);
      if (cached) {
        return {
          data: cached.value,
          error: null,
          isOnline: false,
          fromCache: true,
          status: null,
        };
      }
    }

    return {
      data: null,
      error: isTimeout
        ? msg('apiTimeout')
        : exposeNetworkError
          ? (typeof error?.message === 'string' && error.message.trim()
              ? error.message
              : String(error || msg('apiOffline')))
          : msg('apiOffline'),
      isOnline: false,
      fromCache: false,
      status: null,
    };
  }
}

// ---------------------------------------------------------------------------
// Provenance helpers
// ---------------------------------------------------------------------------

function asProvenance(value: unknown): DataProvenance {
  const v = typeof value === 'string' ? value.toLowerCase() : '';
  if (v === 'rule-based' || v === 'heuristic' || v === 'rule_based') return 'rule-based';
  if (v === 'llm' || v === 'llm-generated' || v === 'ai-advisory' || v === 'advisory') return 'llm';
  // Image endpoints emit "vision-service"/"trained-model-inference" for a
  // multimodal model; keep them in the vision category.
  if (v === 'vision-model' || v === 'vision-service' || v === 'trained-model-inference') {
    return 'vision-model';
  }
  // "microservice" is the proxy's label for a genuinely trained model served by
  // one of the Python microservices (provenanceFields(kind === "trained")).
  if (v === 'trained-model' || v === 'trained-ml' || v === 'microservice') {
    return 'trained-model';
  }
  if (
    v === 'database' ||
    v === 'supabase' ||
    v === 'persisted-records' ||
    v.startsWith('platform-database') ||
    // The platform stamps persisted reads as e.g. "supabase.notifications" or
    // "supabase.livestock_animals"; those are stored records, not live feeds.
    v.startsWith('supabase.')
  ) {
    return 'database';
  }
  // External live feeds: WeatherAPI.com observations and Tunisian agri-news RSS.
  if (v === 'weatherapi.com' || v === 'live-observation' || v === 'rss-feeds') return 'live-observation';
  return 'unavailable';
}

function metaFrom(
  payload: any,
  fallback: DataProvenance,
  source?: string,
): ProvenanceMeta {
  // Persisted platform reads carry the source either as a flat string
  // (`dataSource` / `source`) or as a nested `provenance` object
  // (`{ source: "supabase.farms", persisted: true }`). Honour both.
  const provObj =
    payload?.provenance && typeof payload.provenance === 'object' ? payload.provenance : undefined;
  const raw =
    payload?.dataSource ??
    payload?.data_source ??
    payload?.source ??
    (typeof provObj?.source === 'string' ? provObj.source : undefined);
  const provenance = raw ? asProvenance(raw) : fallback;

  // An explicit boolean from the backend always wins: several platform records
  // are stored but explicitly NOT verified (e.g. market prices ship
  // `isRealData: false`), so we must never upgrade them to "real" just because
  // they come from the database. A nested `persisted: true` is an equivalent
  // affirmative signal for stored reads.
  const explicit =
    typeof payload?.isRealData === 'boolean'
      ? payload.isRealData
      : typeof payload?.is_real_data === 'boolean'
        ? payload.is_real_data
        : typeof provObj?.persisted === 'boolean'
          ? provObj.persisted
          : undefined;
  const isRealData =
    explicit ??
    (provenance === 'live-observation' ||
      provenance === 'database' ||
      provenance === 'trained-model' ||
      provenance === 'vision-model');

  return {
    provenance,
    isRealData,
    source:
      source ??
      (typeof provObj?.source === 'string' ? provObj.source : undefined) ??
      (typeof payload?.modelSource === 'string' ? payload.modelSource : undefined),
    disclaimer: typeof payload?.disclaimer === 'string' ? payload.disclaimer : undefined,
  };
}

// ---------------------------------------------------------------------------
// Disease-name normalisation
// ---------------------------------------------------------------------------

// A machine identifier such as `unclear_image` or `olive-leaf-spot`: lowercase
// ASCII words joined by underscores/hyphens and containing no spaces. Real
// display names always contain a space or an upper-case letter, so this only
// matches ids the vision model returns when it has no human label.
const MACHINE_SLUG_RE = /^[a-z0-9]+([_-][a-z0-9]+)+$/;

function isMachineSlug(value: unknown): boolean {
  return typeof value === 'string' && MACHINE_SLUG_RE.test(value.trim());
}

/**
 * Pick the most human-readable disease label the payload offers.
 *
 * The gateway maps `primary_disease.disease` to the model's `diseaseId`, which
 * can be a machine slug (`unclear_image`). A slug must never be shown as the
 * diagnosis title, so we fall back to the Arabic display name (which the UI
 * already flags as Arabic-only for fr/en callers) and finally to a generic
 * localised label.
 */
function humanDiseaseName(
  primary: any,
  arName: string,
  fallback: string,
): string {
  for (const candidate of [primary?.disease_name, primary?.disease]) {
    if (typeof candidate === 'string' && candidate.trim() && !isMachineSlug(candidate)) {
      return candidate.trim();
    }
  }
  return arName || fallback;
}

// ---------------------------------------------------------------------------
// Weather (WeatherAPI.com via gateway) — real observation
// ---------------------------------------------------------------------------

// Matches the provider's Arabic coordinate placeholder, e.g. "موقع (36.81, 10.18)".
const COORD_PLACEHOLDER_RE = /^موقع\s*\(/;

/** Return the provider's location name, or '' when it is the generic placeholder. */
function serverLocationName(name: unknown): string {
  if (typeof name !== 'string') return '';
  if (COORD_PLACEHOLDER_RE.test(name.trim())) return '';
  return name;
}

export async function getWeather(
  lat = 36.8065,
  lon = 10.1815,
  governorateLabel = 'Tunis',
): Promise<{ data: WeatherData | null; error: string | null; fromCache: boolean }> {
  const res = await apiRequest<any>(
    `/api/weather/coordinates?lat=${lat}&lon=${lon}`,
    { cacheKey: `weather:${lat.toFixed(2)},${lon.toFixed(2)}` },
  );

  if (res.data && typeof res.data.current?.temperature === 'number') {
    const d = res.data;
    const daily: any[] = Array.isArray(d.forecast?.daily) ? d.forecast.daily : [];
    const mapped: WeatherData = {
      temperature: Math.round(d.current.temperature),
      humidity: Math.round(d.current.humidity ?? 0),
      // Today's rainfall straight from the provider. No "% chance" is derived:
      // WeatherAPI.com does not report a probability, so inventing one would be
      // fabricated data.
      rainfall_mm: typeof daily[0]?.rainfall === 'number' ? daily[0].rainfall : 0,
      wind_speed: Math.round(d.current.windSpeed ?? 0),
      condition_ar: d.current.description || 'صافٍ',
      // The provider only emits an Arabic description; the icon key is what
      // other locales translate locally (see utils/weather.ts).
      icon: d.current.icon,
      // The provider falls back to an Arabic coordinate placeholder
      // ("موقع (lat, lon)") when no location name is supplied. The mobile always
      // knows the governorate it asked for, so prefer its localised label over
      // that placeholder rather than leaking Arabic into fr/en UIs.
      governorate: serverLocationName(d.location?.name) || governorateLabel,
      advice_ar: d.agriculturalIndices?.cropStress
        ? `مؤشر إجهاد المحصول: ${d.agriculturalIndices.cropStress}. راقب الري والتسميد.`
        : 'الظروف الجوية متاحة من محطات الرصد (WeatherAPI.com).',
      advice_fr: 'Données météo en direct fournies par WeatherAPI.com.',
      advice_en: 'Live weather data provided by WeatherAPI.com.',
      forecast: daily.map((f: any) => ({
        date: f.date,
        temp_max: Math.round(f.maxTemp ?? 0),
        temp_min: Math.round(f.minTemp ?? 0),
        humidity: typeof f.humidity === 'number' ? Math.round(f.humidity) : undefined,
        rainfall: typeof f.rainfall === 'number' ? f.rainfall : undefined,
        condition_ar: f.description || 'صافٍ',
        icon: f.icon,
        wind_speed: typeof f.windSpeed === 'number' ? Math.round(f.windSpeed) : undefined,
      })),
      meta: {
        provenance: 'live-observation',
        isRealData: true,
        source: d.source?.provider || 'weatherapi.com',
        ...(d.source?.isStale ? { disclaimer: 'Cached weather data: the live provider is temporarily unavailable.' } : {}),
      },
    };
    return { data: mapped, error: null, fromCache: res.fromCache || Boolean(d.source?.isStale) };
  }

  return { data: null, error: res.error || msg('weatherFetchFailed'), fromCache: false };
}

// ---------------------------------------------------------------------------
// Plant disease / leaf image diagnosis — honest, never fabricated
// ---------------------------------------------------------------------------

interface ImageUploadOptions {
  imageUri: string;
  mimeType?: string;
  fileName?: string;
  cropType?: string;
  plantPart?: string;
  symptoms?: string;
}

async function buildImageForm(options: ImageUploadOptions): Promise<FormData> {
  const form = new FormData();
  const name = options.fileName || `plant_${Date.now()}.jpg`;
  const type = options.mimeType || 'image/jpeg';

  if (Platform.OS === 'web') {
    // React Native's { uri, name, type } upload object is not understood by
    // browser FormData. Expo Web must send a real Blob/File or Multer receives
    // "[object Object]" instead of an image and rejects the request.
    const response = await fetch(options.imageUri);
    if (!response.ok) throw new Error('Unable to read the selected plant image');
    const blob = await response.blob();
    const uploadBlob = blob.type ? blob : new Blob([blob], { type });
    if (!uploadBlob.type.startsWith('image/')) {
      throw new Error('The selected file is not a supported image');
    }
    form.append('file', uploadBlob, name);
  } else {
    // Keep the file:// URI produced by expo-image-manipulator. On Android,
    // preparation converts picker content:// assets into a cache file URI;
    // React Native's multipart transport reads that local file.
    form.append('file', {
      uri: options.imageUri,
      name,
      type,
    } as any);
  }

  if (options.cropType) form.append('plant_type', options.cropType);
  if (options.plantPart) form.append('plant_part', options.plantPart);
  if (options.symptoms) form.append('symptoms', options.symptoms);
  return form;
}

/**
 * Analyse a plant/leaf photo through the gateway.
 *
 * The gateway fails closed (503) unless a real vision model is configured and
 * returns verifiable model provenance. We surface that state honestly instead of
 * substituting an invented diagnosis.
 */
export async function diagnosePlantDisease(
  options: ImageUploadOptions,
): Promise<{ data: DiseaseDiagnosisResult | null; error: string | null; unavailable: boolean }> {
  try {
    const form = await buildImageForm(options);
    const res = await apiRequest<any>('/api/ai/images/detect-disease', {
      method: 'POST',
      body: form,
      // Never infer FormData from its runtime identity: React Native's native
      // multipart body can cross Expo runtime boundaries. The fetch adapter
      // must leave Content-Type unset so Android supplies its own boundary.
      multipart: true,
      // Keep the underlying transport reason visible on native devices.
      exposeNetworkError: true,
    });

    // Preserve the gateway's actionable response (429/502/503/validation).
    // A generic "unconfigured" message hid the real reason on native devices.
    if (res.status === 503 || res.status === 502) {
      return {
        data: null,
        error: res.error || msg('diseaseServiceUnconfigured'),
        unavailable: true,
      };
    }
    if (!res.data) {
      return {
        data: null,
        error: res.error || msg('diseaseAnalysisFailed'),
        unavailable: false,
      };
    }

    const d = res.data;
    const primary =
      d.disease_detection?.primary_disease ??
      d.diagnosis ??
      d.result?.primary_disease ??
      {};

    const meta = metaFrom(d, 'vision-model');
    const confidenceRaw = primary.probability ?? primary.confidence ?? d.confidence;
    const confidence =
      typeof confidenceRaw === 'number'
        ? confidenceRaw <= 1
          ? Math.round(confidenceRaw * 100)
          : Math.round(confidenceRaw)
        : null;

    const arName =
      typeof primary.disease_name_ar === 'string' && !isMachineSlug(primary.disease_name_ar)
        ? primary.disease_name_ar.trim()
        : '';
    const diseaseName = humanDiseaseName(primary, arName, msg('diseaseUnknownName'));
    const diseaseNameAr = arName || diseaseName || msg('diseaseUnknownName');

    return {
      data: {
        id: String(d.id ?? Date.now()),
        diseaseName,
        diseaseNameAr,
        confidence,
        severity: (d.severity_assessment?.severity_level || primary.severity_level || 'unknown') as any,
        descriptionAr: primary.description || msg('diseaseGenericDescription'),
        symptoms: Array.isArray(primary.symptoms) ? primary.symptoms : [],
        treatment: Array.isArray(d.treatment_plan?.immediate_treatment)
          ? d.treatment_plan.immediate_treatment
          : [],
        prevention: Array.isArray(d.treatment_plan?.prevention_measures)
          ? d.treatment_plan.prevention_measures
          : [],
        meta,
        imageUri: options.imageUri,
        plantType: options.cropType,
        processedAt: formatDateTime(new Date().toISOString(), getActiveLanguage()),
      },
      error: null,
      unavailable: false,
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.warn('plant image diagnosis failed:', detail);
    return {
      data: null,
      error: detail || msg('diseaseAnalysisFailed'),
      unavailable: false,
    };
  }
}
// ---------------------------------------------------------------------------
// Soil analysis — rule-based in-process engine
// ---------------------------------------------------------------------------

export async function analyzeSoil(
  input: SoilAnalysisInput,
): Promise<{ data: SoilAnalysisResult | null; error: string | null }> {
  const body = {
    ph: input.ph,
    nitrogen: input.nitrogen,
    phosphorus: input.phosphorus,
    potassium: input.potassium,
    moisture: input.moisture,
    salinity: input.salinity,
    organic_matter: input.organicMatter,
    temperature: input.temperature,
    soil_type: input.soilTexture,
  };
  const res = await apiRequest<any>('/api/ai/soil-analysis', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  if (!res.data) {
    return { data: null, error: res.error || msg('soilAnalysisFailed') };
  }

  const d = res.data;
  const findings = Array.isArray(d.findings) ? d.findings : [];
  return {
    data: {
      grade: d.fertility_level || msg('soilGradeUnknown'),
      gradeScore: typeof d.health_score === 'number' ? d.health_score : null,
      fertilityLevel: d.fertility_level || msg('soilGradeUnknown'),
      interpretationAr: d.disclaimer || msg('soilGenericDisclaimer'),
      recommendations: Array.isArray(d.overall_recommendations) ? d.overall_recommendations : [],
      problems: Array.isArray(d.problems) ? d.problems : [],
      missingMeasurements: Array.isArray(d.missing_measurements) ? d.missing_measurements : [],
      findings: findings.map((f: any) => ({
        parameter: f.parameter,
        labelAr: f.labelAr,
        value: f.value ?? null,
        status: f.status,
        messageAr: f.messageAr,
      })),
      meta: metaFrom(d, 'rule-based', 'rule-based-engine'),
    },
    error: null,
  };
}

// ---------------------------------------------------------------------------
// Crop recommendation — rule-based in-process engine
// ---------------------------------------------------------------------------

export async function getCropRecommendations(input: {
  ph?: number;
  temperature?: number;
  rainfall?: number;
  salinity?: number;
  areaHectares?: number;
} = {}): Promise<{ data: CropRecommendationResult | null; error: string | null }> {
  const res = await apiRequest<any>('/api/ai/crop-recommendation', {
    method: 'POST',
    body: JSON.stringify({
      ph: input.ph,
      temperature: input.temperature,
      rainfall: input.rainfall,
      salinity: input.salinity,
      area_hectares: input.areaHectares,
    }),
  });

  if (!res.data) {
    return { data: null, error: res.error || msg('cropFetchFailed') };
  }

  const d = res.data;
  const recs: any[] = Array.isArray(d.recommendations) ? d.recommendations : [];
  const crops: CropRecommendation[] = recs.map((r) => ({
    id: r.crop,
    name: r.crop,
    nameAr: r.name_ar || r.crop,
    category: r.category || '',
    suitabilityScore: Math.round((r.suitability_score ?? 0) * 100),
    season: r.season || '',
    waterRequirement: r.water_need || '',
    estimatedProfitTndPerHa: Math.round(r.profit_analysis?.net_profit ?? 0),
    growthCycleDays: 0,
    keyTipsAr: Array.isArray(r.reasoning) ? r.reasoning.join(' • ') : '',
  }));

  return {
    data: { crops, meta: metaFrom(d, 'rule-based', 'rule-based-engine') },
    error: null,
  };
}

// ---------------------------------------------------------------------------
// Professional detailed soil analysis — LLM advisory over user measurements
// ---------------------------------------------------------------------------

/**
 * Call the gateway's professional soil endpoint (`POST /api/soil-analysis/analyze`).
 *
 * This endpoint answers with an LLM-generated advisory report (`dataSource:
 * "ai-advisory"`, `isRealData: false`) built strictly from the measurements the
 * caller supplies; it never fabricates missing values and withholds fertilizer
 * doses unless every required input exists. When the caller includes a
 * `fieldId` the server also persists the report against that plot (so it
 * survives logout) and returns `analysisId`.
 *
 * A 503 means the advisory provider is not configured — the caller falls back
 * to the deterministic rule-based engine and must label it as such.
 */
export async function analyzeSoilDetailed(
  input: SoilDetailedInput,
): Promise<{
  data: SoilDetailedResult | null;
  error: string | null;
  unavailable: boolean;
}> {
  const res = await apiRequest<any>('/api/soil-analysis/analyze', {
    method: 'POST',
    body: JSON.stringify(input),
  });

  if (res.status === 503 || res.status === 502) {
    return { data: null, error: msg('soilAdvisoryUnavailable'), unavailable: true };
  }
  const report = res.data?.data;
  if (!res.data?.success || !report || typeof report.executiveSummary !== 'string') {
    return {
      data: null,
      error: res.error || msg('soilAnalysisFailed'),
      unavailable: false,
    };
  }

  const persistence = res.data?.persistence ?? {};
  return {
    data: {
      report: report as SoilReport,
      // The advisory is generative AI over user-entered (unverified)
      // measurements — never a trained model, never a lab result.
      meta: metaFrom(res.data, 'llm', 'ai-advisory'),
      analysisId: typeof res.data?.analysisId === 'string' ? res.data.analysisId : undefined,
      persisted: persistence.persisted === true,
      persistenceReason:
        typeof persistence.reason === 'string' ? persistence.reason : undefined,
    },
    error: null,
    unavailable: false,
  };
}

/** List the caller's persisted soil reports (own farms only, via RLS). */
export async function getSoilReports(limit = 20): Promise<{
  data: SoilReportSummary[];
  error: string | null;
  unavailable: boolean;
}> {
  const res = await apiRequest<any>(`/api/soil-analysis/reports?limit=${limit}`, {
    cacheKey: `soilReports:${limit}`,
  });
  if (res.status === 503) {
    return { data: [], error: res.error, unavailable: true };
  }
  const rows: any[] = Array.isArray(res.data?.data) ? res.data.data : [];
  return {
    data: rows.map((r) => ({
      analysisId: r.analysisId,
      fieldId: r.fieldId ?? null,
      farmId: r.farmId ?? null,
      analysisType: r.analysisType ?? 'manual',
      analyzedAt: r.analyzedAt ?? null,
      executiveSummary: r.executiveSummary ?? null,
    })),
    error: res.error,
    unavailable: false,
  };
}

/** Retrieve one persisted soil report by id (own farms only, via RLS). */
export async function getSoilReport(analysisId: string): Promise<{
  data: { report: SoilReport; input: SoilDetailedInput | null } | null;
  error: string | null;
}> {
  const res = await apiRequest<any>(`/api/soil-analysis/report/${encodeURIComponent(analysisId)}`);
  const report = res.data?.data?.report;
  if (!report) return { data: null, error: res.error || msg('soilReportFetchFailed') };
  return {
    data: { report: report as SoilReport, input: (res.data?.data?.input ?? null) as SoilDetailedInput | null },
    error: null,
  };
}

// ---------------------------------------------------------------------------
// Crop recommendations from a persisted plot — requires a saved soil analysis
// ---------------------------------------------------------------------------

export interface FieldCropRecommendation {
  cropId: string;
  cropName: string;
  cropNameAr: string;
  suitabilityScore: number;
  reasons: string[];
  waterNeed: string;
  plantingSeason: string;
  daysToMaturity: number | null;
  recommendations: string;
}

/**
 * `POST /api/ai-recommendations` — crop suitability for a specific plot.
 *
 * The server deliberately ignores client-supplied soil values and scores only
 * the plot's PERSISTED soil analysis (`supabase.soil_analyses`). When the plot
 * has no saved analysis it answers 409 `PERSISTED_SOIL_DATA_REQUIRED`, which the
 * caller must surface honestly rather than inventing a result. The engine is
 * rule-based (`isRealData: false`).
 */
export async function getFieldCropRecommendations(fieldId: string): Promise<{
  data: { recommendations: FieldCropRecommendation[]; meta: ProvenanceMeta } | null;
  error: string | null;
  /** True when the plot has no persisted soil analysis yet (409). */
  requiresSoilData: boolean;
}> {
  const res = await apiRequest<any>('/api/ai-recommendations', {
    method: 'POST',
    body: JSON.stringify({ fieldId }),
  });

  if (res.status === 409) {
    return { data: null, error: msg('cropRequiresPersistedSoil'), requiresSoilData: true };
  }
  const recs: any[] = Array.isArray(res.data?.data?.recommendations)
    ? res.data.data.recommendations
    : [];
  if (!res.data || recs.length === 0) {
    return { data: null, error: res.error || msg('cropFetchFailed'), requiresSoilData: false };
  }
  return {
    data: {
      recommendations: recs.map((r) => ({
        cropId: r.cropId,
        cropName: r.cropName,
        cropNameAr: r.cropNameAr,
        suitabilityScore: Math.round(r.suitabilityScore ?? 0),
        reasons: Array.isArray(r.reasons) ? r.reasons : [],
        waterNeed: r.waterNeed ?? '',
        plantingSeason: r.plantingSeason ?? '',
        daysToMaturity: typeof r.daysToMaturity === 'number' ? r.daysToMaturity : null,
        recommendations: r.recommendations ?? '',
      })),
      meta: metaFrom(res.data, 'rule-based', 'rule-based-engine'),
    },
    error: null,
    requiresSoilData: false,
  };
}

// ---------------------------------------------------------------------------
// Cultivation projects — persisted, requires verified session
// ---------------------------------------------------------------------------

/** List the caller's cultivation projects (`supabase.crop_cultivations`). */
export async function getCultivations(farmId?: string): Promise<{
  data: Cultivation[];
  error: string | null;
  meta: ProvenanceMeta;
}> {
  const endpoint = farmId
    ? `/api/assistant/cultivations?farm_id=${encodeURIComponent(farmId)}`
    : '/api/assistant/cultivations';
  const res = await apiRequest<any>(endpoint, { cacheKey: `cultivations:${farmId || 'all'}` });
  const list: Cultivation[] = Array.isArray(res.data?.data) ? res.data.data : [];
  return { data: list, error: res.error, meta: metaFrom(res.data, 'database') };
}

/**
 * Create a cultivation project. The server validates farm/section ownership,
 * the planting date, and that the area does not exceed the plot's registered
 * area; it never trusts a client-supplied farm id beyond an ownership check.
 */
export async function createCultivation(payload: {
  farm_id: string;
  section_id?: string | null;
  crop_name: string;
  crop_variety?: string;
  planting_date: string;
  area_hectares: number;
  expected_harvest_date?: string;
  notes?: string;
}): Promise<{ data: Cultivation | null; error: string | null }> {
  const res = await apiRequest<any>('/api/assistant/actions/cultivations', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.data?.success || !res.data?.data) {
    return { data: null, error: res.error || msg('cultivationCreateFailed') };
  }
  return { data: res.data.data as Cultivation, error: null };
}

// ---------------------------------------------------------------------------
// Agricultural projects — daily tracking tasks and financial results
// ---------------------------------------------------------------------------

/**
 * `POST /api/assistant/actions/disease-detections` — persist a diagnosis and its
 * evidence image against a farm (`plant_disease_detections` + Supabase Storage).
 * The server independently re-checks farm ownership and stores the image; it
 * also states plainly that the visual diagnosis itself is *not* field-verified.
 * Returns the honest failure code so the caller can explain why nothing saved.
 */
export async function saveDiseaseDetection(input: {
  imageUri: string;
  mimeType?: string;
  fileName?: string;
  farmId: string;
  cultivationId?: string | null;
  plantType?: string;
  analysisResult?: Record<string, unknown>;
  primaryDisease: string;
  severityLevel?: string;
  confidence?: number | null;
}): Promise<{ data: { id: string; imageSignedUrl: string | null } | null; error: string | null }> {
  const form = await buildImageForm({
    imageUri: input.imageUri,
    mimeType: input.mimeType,
    fileName: input.fileName,
    cropType: input.plantType,
  });
  form.append('farm_id', input.farmId);
  if (input.cultivationId) form.append('cultivation_id', input.cultivationId);
  form.append('primary_disease', input.primaryDisease);
  if (input.analysisResult) form.append('analysis_result', JSON.stringify(input.analysisResult));
  if (input.severityLevel) form.append('severity_level', input.severityLevel);
  // The server expects a 0..1 confidence; our UI works in whole percents.
  if (typeof input.confidence === 'number' && Number.isFinite(input.confidence)) {
    form.append('disease_confidence', String(Math.min(1, Math.max(0, input.confidence / 100))));
  }

  const res = await apiRequest<any>('/api/assistant/actions/disease-detections', {
    method: 'POST',
    body: form,
  });
  if (!res.data?.success || !res.data?.data) {
    return { data: null, error: res.error || getProjects(getActiveLanguage()).saveFailed };
  }
  const data = res.data.data;
  return {
    data: { id: String(data.id), imageSignedUrl: data.image_signed_url ?? null },
    error: null,
  };
}

/** Localised fallback strings for this module (server copy is Arabic-only). */
function projectMsg(key: 'tasksUnavailable' | 'financeUnavailable' | 'saveFailed'): string {
  const p = getProjects(getActiveLanguage());
  if (key === 'tasksUnavailable') return p.tasksUnavailable;
  if (key === 'financeUnavailable') return p.financeUnavailable;
  return p.saveFailed;
}

/**
 * `GET /api/farm-operations/tasks` — persisted daily-tracking tasks
 * (`public.farm_tasks`). The route is farmer-role guarded; a non-farmer account
 * receives 403 and this resolves to an honest `roleBlocked` state rather than
 * an error, so the UI can explain *why* instead of showing a red failure.
 */
export async function getProjectTasks(params: { farmId?: string; cultivationId?: string } = {}): Promise<{
  data: FarmTask[];
  error: string | null;
  roleBlocked: boolean;
  meta: ProvenanceMeta;
}> {
  const queryParts = [
    params.farmId ? `farm_id=${encodeURIComponent(params.farmId)}` : null,
    params.cultivationId ? `cultivation_id=${encodeURIComponent(params.cultivationId)}` : null,
  ].filter(Boolean);
  const query = queryParts.length ? `?${queryParts.join('&')}` : '';
  const res = await apiRequest<any>(`/api/farm-operations/tasks${query}`, {
    cacheKey: `tasks:${params.farmId || 'all'}:${params.cultivationId || 'all'}`,
  });
  const roleBlocked = res.status === 403;
  const list: FarmTask[] = Array.isArray(res.data?.data) ? res.data.data : [];
  return {
    data: list,
    error: roleBlocked ? null : res.error || (res.data ? null : projectMsg('tasksUnavailable')),
    roleBlocked,
    meta: metaFrom(res.data, 'database'),
  };
}

/**
 * `POST /api/farm-operations/tasks` — create a persisted task. The server
 * validates farm ownership and the task payload; the client never invents a
 * completion date.
 */
export async function createProjectTask(payload: {
  farm_id: string;
  cultivation_id?: string | null;
  title: string;
  task_type?: FarmTaskType;
  priority?: FarmTaskPriority;
  due_date?: string;
  description?: string;
}): Promise<{ data: FarmTask | null; error: string | null; roleBlocked: boolean }> {
  const res = await apiRequest<any>('/api/farm-operations/tasks', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (res.status === 403) return { data: null, error: null, roleBlocked: true };
  if (!res.data?.success || !res.data?.data) {
    return { data: null, error: res.error || projectMsg('saveFailed'), roleBlocked: false };
  }
  return { data: res.data.data as FarmTask, error: null, roleBlocked: false };
}

/** `PUT /api/farm-operations/tasks/:id` — update a task's status/fields. */
export async function updateProjectTask(
  taskId: string,
  patch: {
    title?: string;
    status?: FarmTaskStatus;
    task_type?: FarmTaskType;
    priority?: FarmTaskPriority;
    due_date?: string | null;
    description?: string;
  },
): Promise<{ data: FarmTask | null; error: string | null; roleBlocked: boolean }> {
  // The server requires a full payload on update, so merge the caller's patch
  // over the current task by re-sending the fields it already had.
  const res = await apiRequest<any>(`/api/farm-operations/tasks/${encodeURIComponent(taskId)}`, {
    method: 'PUT',
    body: JSON.stringify(patch),
  });
  if (res.status === 403) return { data: null, error: null, roleBlocked: true };
  if (!res.data?.success || !res.data?.data) {
    return { data: null, error: res.error || projectMsg('saveFailed'), roleBlocked: false };
  }
  return { data: res.data.data as FarmTask, error: null, roleBlocked: false };
}

/** `GET /api/expenses` — persisted expenses (`public.farm_expenses`). */
export async function getProjectExpenses(params: { cropType?: string } = {}): Promise<{
  data: { expenses: ProjectExpense[]; totalExpenses: number; categoryTotals: Record<string, number> };
  error: string | null;
  roleBlocked: boolean;
  meta: ProvenanceMeta;
}> {
  const query = params.cropType ? `?cropType=${encodeURIComponent(params.cropType)}` : '';
  const res = await apiRequest<any>(`/api/expenses${query}`, { cacheKey: `expenses:${params.cropType || 'all'}` });
  const roleBlocked = res.status === 403;
  const body = res.data?.data ?? {};
  return {
    data: {
      expenses: Array.isArray(body.expenses) ? body.expenses : [],
      totalExpenses: typeof body.totalExpenses === 'number' ? body.totalExpenses : 0,
      categoryTotals: body.categoryTotals ?? {},
    },
    error: roleBlocked ? null : res.error,
    roleBlocked,
    meta: metaFrom(res.data, 'database'),
  };
}

/** `POST /api/expenses` — record a real expense against the farm/project. */
export async function createProjectExpense(payload: {
  amount: number;
  date: string;
  category: string;
  farm_id?: string | null;
  cultivation_id?: string | null;
  cropRelated?: string;
  description?: string;
  supplier?: string;
}): Promise<{ data: ProjectExpense | null; error: string | null; roleBlocked: boolean }> {
  const res = await apiRequest<any>('/api/expenses', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (res.status === 403) return { data: null, error: null, roleBlocked: true };
  if (!res.data?.success || !res.data?.data) {
    return { data: null, error: res.error || projectMsg('saveFailed'), roleBlocked: false };
  }
  return { data: res.data.data as ProjectExpense, error: null, roleBlocked: false };
}

/** `POST /api/revenues` — record a real sale/revenue for the harvest. */
export async function createProjectRevenue(payload: {
  amount: number;
  date: string;
  farm_id?: string | null;
  cultivation_id?: string | null;
  cropRelated?: string;
  quantity?: number;
  unitPrice?: number;
  buyer?: string;
  description?: string;
}): Promise<{ data: ProjectRevenue | null; error: string | null; roleBlocked: boolean }> {
  const res = await apiRequest<any>('/api/revenues', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (res.status === 403) return { data: null, error: null, roleBlocked: true };
  if (!res.data?.success || !res.data?.data) {
    return { data: null, error: res.error || projectMsg('saveFailed'), roleBlocked: false };
  }
  return { data: res.data.data as ProjectRevenue, error: null, roleBlocked: false };
}

/** `GET /api/financial-summary` — the aggregated result, computed by the server. */
export async function getProjectFinancialSummary(farmId?: string, cultivationId?: string): Promise<{
  data: ProjectFinancialSummary | null;
  error: string | null;
  roleBlocked: boolean;
  meta: ProvenanceMeta;
}> {
  const queryParts = [farmId ? `farm_id=${encodeURIComponent(farmId)}` : null, cultivationId ? `cultivation_id=${encodeURIComponent(cultivationId)}` : null].filter(Boolean);
  const query = queryParts.length ? `?${queryParts.join('&')}` : '';
  const res = await apiRequest<any>(`/api/financial-summary${query}`, { cacheKey: `financial-summary:${farmId || 'all'}:${cultivationId || 'all'}` });
  const roleBlocked = res.status === 403;
  return {
    data: (res.data?.data as ProjectFinancialSummary) ?? null,
    error: roleBlocked ? null : res.error || (res.data ? null : projectMsg('financeUnavailable')),
    roleBlocked,
    meta: metaFrom(res.data, 'database'),
  };
}

// ---------------------------------------------------------------------------
// Marketplace listings — persisted seller records (unverified, labelled)
// ---------------------------------------------------------------------------

/**
 * `GET /api/marketplace/listings` — real seller listings when the store is
 * connected; the gateway fails closed with 503 `MARKETPLACE_STORE_NOT_CONNECTED`
 * until then, which the UI renders as an honest "no matching product" state.
 */
export async function getMarketplaceListings(params: { q?: string; type?: string } = {}): Promise<{
  data: MarketplaceResult;
  error: string | null;
  unavailable: boolean;
}> {
  const query = new URLSearchParams();
  if (params.q) query.set('q', params.q);
  if (params.type) query.set('type', params.type);
  const suffix = query.toString() ? `?${query.toString()}` : '';
  const res = await apiRequest<any>(`/api/agro-market/listings${suffix}`, {
    cacheKey: `marketplace:${params.type || 'all'}:${params.q || 'all'}`,
  });
  if (!res.data?.success || !Array.isArray(res.data?.data?.listings)) {
    return {
      data: { listings: [], meta: { provenance: 'unavailable', isRealData: false } },
      error: res.error,
      unavailable: true,
    };
  }
  const listings: MarketplaceListing[] = res.data.data.listings.map((l: any) => ({
    id: String(l.id),
    title: l.title,
    category: l.category ?? undefined,
    price: l.price == null ? null : Number(l.price),
    currency: l.currency ?? 'TND',
    unit: l.unit ?? undefined,
    sellerName: l.seller_name ?? null,
    location: l.location ?? null,
    quantity: l.quantity == null ? null : Number(l.quantity),
    imageUrl: Array.isArray(l.image_urls) ? l.image_urls[0] ?? null : null,
    listingType: l.listing_type,
    expectedHarvestDate: l.expected_harvest_date ?? null,
    harvestWindowEnd: l.harvest_window_end ?? null,
    governorate: l.governorate ?? null,
    description: l.description ?? null,
  }));
  return {
    data: { listings, meta: metaFrom(res.data?.meta, 'database', 'seller-published-listings') },
    error: null,
    unavailable: false,
  };
}

export async function uploadMarketplaceImage(uri: string, mimeType = 'image/jpeg'): Promise<{ url: string | null; error: string | null }> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return { url: null, error: 'Sign in before uploading a marketplace image.' };
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) return { url: null, error: 'Only JPG, PNG and WebP images are accepted.' };
    const response = await fetch(uri);
    const blob = await response.blob();
    const extension = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
    const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extension}`;
    const { error } = await supabase.storage.from('marketplace-images').upload(path, blob, {
      contentType: mimeType, upsert: false, cacheControl: '3600',
    });
    if (error) return { url: null, error: error.message };
    const { data } = supabase.storage.from('marketplace-images').getPublicUrl(path);
    return { url: data.publicUrl, error: null };
  } catch (error) {
    return { url: null, error: error instanceof Error ? error.message : 'Image upload failed.' };
  }
}

export async function createMarketplaceListing(input: {
  listing_type: NonNullable<MarketplaceListing['listingType']>;
  title: string;
  category: string;
  description?: string;
  price?: number | null;
  currency?: string;
  unit?: string;
  quantity?: number | null;
  location?: string;
  governorate?: string;
  image_urls?: string[];
  harvest_crop?: string;
  expected_harvest_date?: string;
  harvest_window_end?: string;
  quality_notes?: string;
}): Promise<{ data: MarketplaceListing | null; error: string | null }> {
  const res = await apiRequest<any>('/api/agro-market/listings', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  if (!res.data?.success || !res.data?.data) return { data: null, error: res.error || 'LISTING_CREATE_FAILED' };
  const l = res.data.data;
  return { data: {
    id: String(l.id), title: l.title, category: l.category, price: l.price == null ? null : Number(l.price),
    currency: l.currency ?? 'TND', unit: l.unit, sellerName: l.seller_name ?? null, location: l.location ?? null,
    quantity: l.quantity == null ? null : Number(l.quantity), imageUrl: l.image_urls?.[0] ?? null,
    listingType: l.listing_type, expectedHarvestDate: l.expected_harvest_date ?? null,
    harvestWindowEnd: l.harvest_window_end ?? null, governorate: l.governorate ?? null, description: l.description ?? null,
  }, error: null };
}

export async function getMyMarketplaceListings(): Promise<{ data: MarketplaceListing[]; error: string | null }> {
  const res = await apiRequest<any>('/api/agro-market/my-listings');
  const rows: any[] = Array.isArray(res.data?.data) ? res.data.data : [];
  return {
    data: rows.map((l: any) => ({
      id: String(l.id), title: l.title, category: l.category, price: l.price == null ? null : Number(l.price),
      currency: l.currency ?? 'TND', unit: l.unit ?? undefined, location: l.location ?? null,
      quantity: l.quantity == null ? null : Number(l.quantity), imageUrl: l.image_urls?.[0] ?? null,
      listingType: l.listing_type, expectedHarvestDate: l.expected_harvest_date ?? null,
      harvestWindowEnd: l.harvest_window_end ?? null, governorate: l.governorate ?? null,
      description: l.description ?? null, status: l.status,
    })),
    error: res.error,
  };
}

export async function createMarketplaceInquiry(listingId: string, message: string, quantity?: number | null): Promise<{ success: boolean; error: string | null }> {
  const res = await apiRequest<any>(`/api/agro-market/listings/${encodeURIComponent(listingId)}/inquiries`, {
    method: 'POST', body: JSON.stringify({ message, quantity: quantity ?? null }),
  });
  return { success: Boolean(res.data?.success), error: res.data?.success ? null : res.error || 'INQUIRY_CREATE_FAILED' };
}

export async function getMarketplaceInquiries(): Promise<{ data: MarketplaceInquiry[]; error: string | null }> {
  const res = await apiRequest<any>('/api/agro-market/inquiries');
  const rows: any[] = Array.isArray(res.data?.data) ? res.data.data : [];
  const { data: { user } } = await supabase.auth.getUser();
  return {
    data: rows.map((i: any) => ({
      id: String(i.id), listingId: String(i.listing_id), buyerId: String(i.buyer_id), sellerId: String(i.seller_id),
      message: i.message, quantity: i.quantity == null ? null : Number(i.quantity), status: i.status,
      createdAt: i.created_at, listingTitle: i.listing?.title ?? null, isSeller: Boolean(user?.id && user.id === i.seller_id),
    })),
    error: res.error,
  };
}

export async function updateMarketplaceInquiryStatus(id: string, status: MarketplaceInquiry['status']): Promise<{ success: boolean; error: string | null }> {
  const res = await apiRequest<any>(`/api/agro-market/inquiries/${encodeURIComponent(id)}/status`, {
    method: 'PATCH', body: JSON.stringify({ status }),
  });
  return { success: Boolean(res.data?.success), error: res.data?.success ? null : res.error || 'INQUIRY_UPDATE_FAILED' };
}

export async function updateMarketplaceListing(id: string, input: {
  title?: string; category?: string; description?: string; price?: number | null; quantity?: number | null;
}): Promise<{ success: boolean; error: string | null }> {
  const res = await apiRequest<any>(`/api/agro-market/listings/${encodeURIComponent(id)}`, {
    method: 'PATCH', body: JSON.stringify(input),
  });
  return { success: Boolean(res.data?.success), error: res.data?.success ? null : res.error || 'LISTING_UPDATE_FAILED' };
}

export async function deleteMarketplaceListing(id: string): Promise<{ success: boolean; error: string | null }> {
  const res = await apiRequest<any>(`/api/agro-market/listings/${encodeURIComponent(id)}`, { method: 'DELETE' });
  return { success: Boolean(res.data?.success), error: res.data?.success ? null : res.error || 'LISTING_DELETE_FAILED' };
}

export async function updateMarketplaceListingStatus(id: string, status: NonNullable<MarketplaceListing['status']>): Promise<{ success: boolean; error: string | null }> {
  const res = await apiRequest<any>(`/api/agro-market/listings/${encodeURIComponent(id)}`, {
    method: 'PATCH', body: JSON.stringify({ status }),
  });
  return { success: Boolean(res.data?.success), error: res.data?.success ? null : res.error || 'LISTING_UPDATE_FAILED' };
}

export async function getAgriculturalCatalog(params: { q?: string; type?: AgriculturalCatalogProduct['productType'] } = {}): Promise<{
  data: AgriculturalCatalogProduct[];
  error: string | null;
}> {
  const query = new URLSearchParams();
  if (params.q) query.set('q', params.q);
  if (params.type) query.set('type', params.type);
  const suffix = query.toString() ? `?${query.toString()}` : '';
  const res = await apiRequest<any>(`/api/agro-market/products${suffix}`, { cacheKey: `agro-catalog:${params.type || 'all'}:${params.q || 'all'}` });
  const rows: any[] = Array.isArray(res.data?.data) ? res.data.data : [];
  return {
    data: rows.map(p => ({
      id: String(p.id), productType: p.product_type, tradeName: p.trade_name,
      activeIngredient: p.active_ingredient ?? null, composition: p.composition ?? null,
      manufacturer: p.manufacturer ?? null, registrationNumber: p.registration_number ?? null,
      registrationEvidenceUrl: p.registration_evidence_url ?? null,
      registrationVerifiedAt: p.registration_verified_at ?? null,
      registrationStatus: p.registration_status, targetCrops: Array.isArray(p.target_crops) ? p.target_crops : [],
      sourceName: p.source_name, sourceUrl: p.source_url ?? null,
    })),
    error: res.error,
  };
}

export async function getMarketPrices(params: { crop?: string; market?: string } = {}): Promise<{
  data: MarketResult | null;
  error: string | null;
  fromCache: boolean;
}> {
  const query = new URLSearchParams();
  if (params.crop) query.set('crop', params.crop);
  if (params.market) query.set('market', params.market);
  const suffix = query.toString() ? `?${query.toString()}` : '';
  const res = await apiRequest<any>(`/api/agro-market/prices${suffix}`, { cacheKey: `market:observations:${params.crop || 'all'}:${params.market || 'all'}` });
  const rows: any[] = Array.isArray(res.data?.data) ? res.data.data : [];
  const prices: MarketPriceItem[] = rows.map((p: any) => ({
    id: String(p.id), cropName: p.commodity_name, cropNameAr: p.commodity_name,
    pricePerKg: p.price_average == null ? null : Number(p.price_average),
    previousPricePerKg: p.previous_year_price == null ? null : Number(p.previous_year_price),
    changePercent: p.price_change_percent == null ? null : Number(p.price_change_percent),
    trend: p.price_change_percent > 0 ? 'rising' : p.price_change_percent < 0 ? 'falling' : p.price_change_percent === 0 ? 'stable' : 'unknown',
    marketLocation: p.market_location, marketLocationAr: p.market_location, qualityGrade: p.quality_grade ?? '—',
    lastUpdated: p.observed_on,
    sourceName: p.source_name ?? null, sourceUrl: p.source_url ?? null,
    unit: p.unit ?? 'kg', currency: p.currency ?? 'TND',
    verificationStatus: p.verification_status ?? 'unverified',
    priceMin: p.price_min == null ? null : Number(p.price_min),
    priceMax: p.price_max == null ? null : Number(p.price_max),
    priceKind: p.price_kind ?? 'wholesale', aggregationPeriod: p.aggregation_period ?? 'daily',
    periodStart: p.period_start ?? null, periodEnd: p.period_end ?? null,
    supplyQuantityTons: p.supply_quantity_tons == null ? null : Number(p.supply_quantity_tons),
    supplyChangePercent: p.supply_change_percent == null ? null : Number(p.supply_change_percent),
    observationDays: p.observation_days == null ? null : Number(p.observation_days),
  }));
  return {
    data: { prices, meta: metaFrom(res.data?.meta, 'database', 'market-price-observations') },
    error: res.error,
    fromCache: res.fromCache,
  };
}

// ---------------------------------------------------------------------------
// Pest control — rule-based symptom matcher (honest, never guesses)
// ---------------------------------------------------------------------------

export async function identifyPest(
  symptoms: string[],
  cropType?: string,
): Promise<{ data: PestIdentification | null; error: string | null; unavailable: boolean }> {
  if (!symptoms.length) {
    return { data: null, error: msg('pestNeedSymptom'), unavailable: false };
  }
  const res = await apiRequest<any>('/api/pest-control/identify-from-symptoms', {
    method: 'POST',
    body: JSON.stringify({ symptoms, crop_type: cropType }),
  });

  if (res.status === 503 || res.status === 502) {
    return { data: null, error: msg('pestServiceUnconfigured'), unavailable: true };
  }
  if (!res.data?.success) {
    return { data: null, error: msg('pestNoMatch'), unavailable: false };
  }

  const d = res.data;
  const ident = d.data?.pest_identification ?? {};
  return {
    data: {
      identifiedPest: ident.identified_pest ?? null,
      pestNameAr: ident.pest_name_ar ?? null,
      category: ident.category ?? null,
      method: ident.identification_method ?? 'symptom_based',
      symptomsUsed: Array.isArray(d.data?.symptoms_used) ? d.data.symptoms_used : symptoms,
      meta: metaFrom(d, 'rule-based', 'symptom-keyword-rules'),
    },
    error: null,
    unavailable: false,
  };
}

// ---------------------------------------------------------------------------
// Smart irrigation — microservice; fails closed when not configured
// ---------------------------------------------------------------------------

export async function getIrrigationPlan(input: {
  cropType: string;
  growthStage?: string;
  temperature?: number;
  humidity?: number;
  days?: number;
}): Promise<{ data: IrrigationResult | null; error: string | null; unavailable: boolean }> {
  // Climate inputs are forwarded only when the caller actually has them (the
  // caller supplies real WeatherAPI.com values). Injecting made-up defaults here
  // would present invented temperature/humidity as if they were observed; the
  // service applies its own documented defaults when they are omitted.
  const body: Record<string, unknown> = {
    crop_type: input.cropType,
    growth_stage: input.growthStage ?? 'vegetative',
    days_to_calculate: input.days ?? 7,
  };
  if (typeof input.temperature === 'number') body.temperature = input.temperature;
  if (typeof input.humidity === 'number') body.humidity = input.humidity;

  const res = await apiRequest<any>('/api/irrigation-optimization/water-requirements', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  if (res.status === 503 || res.status === 502) {
    return { data: null, error: msg('irrigationServiceUnconfigured'), unavailable: true };
  }
  if (!res.data?.success) {
    return { data: null, error: msg('irrigationComputeFailed'), unavailable: false };
  }
  return {
    data: {
      data: (res.data.data ?? null) as Record<string, unknown> | null,
      meta: metaFrom(res.data, 'trained-model'),
    },
    error: null,
    unavailable: false,
  };
}

// ---------------------------------------------------------------------------
// AI assistant chat — LLM when configured, else rule-based engine
// ---------------------------------------------------------------------------

export async function chatWithAIAssistant(
  message: string,
  language = 'ar',
  options: {
    /** Prior turns, oldest first, so the model has conversational context. */
    history?: { role: 'user' | 'assistant'; content: string }[];
    /** Thread id returned by the previous call; continues the persisted thread. */
    conversationId?: string | null;
  } = {},
): Promise<{ data: AssistantReply | null; error: string | null }> {
  const res = await apiRequest<any>('/api/ai/assistant/chat', {
    method: 'POST',
    body: JSON.stringify({
      message,
      language,
      history: options.history ?? [],
      conversationId: options.conversationId ?? undefined,
    }),
  });

  if (!res.data || typeof res.data.answer !== 'string') {
    return { data: null, error: res.error || msg('assistantNoAnswer') };
  }

  const meta = metaFrom(res.data, res.data.dataSource === 'llm' ? 'llm' : 'rule-based');
  return {
    data: {
      reply: res.data.answer,
      meta,
      farmContextStatus: res.data.farmContextStatus,
      conversationId: res.data.conversationId ?? null,
      // The gateway runs a real multi-agent orchestration for every turn and
      // returns its trace; surface it so the UI can show which specialists ran
      // and where each finding came from.
      orchestration: normalizeOrchestrationTrace(res.data.orchestrationTrace),
      plannedBy: res.data.plannedBy ?? null,
    },
    error: null,
  };
}

/**
 * Defensive normaliser for the orchestrator trace. The server is trusted, but
 * the shape is re-validated so a partial payload can never crash the renderer
 * (the UI walks `plan`, `steps` and their `findings`).
 */
function normalizeOrchestrationTrace(raw: any): OrchestrationTrace | undefined {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.steps)) return undefined;
  const steps = raw.steps
    .filter((s: any) => s && typeof s.id === 'string')
    .map((s: any) => ({
      id: s.id,
      title: typeof s.title === 'string' ? s.title : s.id,
      status: s.status,
      findings: Array.isArray(s.findings) ? s.findings.filter((f: any) => typeof f === 'string') : [],
      dataSource: typeof s.dataSource === 'string' ? s.dataSource : null,
      isRealData: s.isRealData === true,
      confidence: s.confidence ?? 'unknown',
      dependsOn: Array.isArray(s.dependsOn) ? s.dependsOn : [],
      attempts: typeof s.attempts === 'number' ? s.attempts : 0,
      latencyMs: typeof s.latencyMs === 'number' ? s.latencyMs : 0,
      note: typeof s.note === 'string' ? s.note : undefined,
    }));
  const plan = Array.isArray(raw.plan)
    ? raw.plan
        .filter((p: any) => p && typeof p.id === 'string')
        .map((p: any) => ({
          id: p.id,
          title: typeof p.title === 'string' ? p.title : p.id,
          dependsOn: Array.isArray(p.dependsOn) ? p.dependsOn : [],
        }))
    : [];
  return {
    plan,
    steps,
    blocked: Array.isArray(raw.blocked) ? raw.blocked : [],
    startedAt: typeof raw.startedAt === 'string' ? raw.startedAt : '',
    finishedAt: typeof raw.finishedAt === 'string' ? raw.finishedAt : '',
    concurrency: typeof raw.concurrency === 'number' ? raw.concurrency : 0,
    plannedBy: raw.plannedBy === 'llm' ? 'llm' : 'keywords',
    rejectedPlanIds: Array.isArray(raw.rejectedPlanIds) ? raw.rejectedPlanIds : [],
  };
}

// ---------------------------------------------------------------------------
// Farm & field management — persisted, requires verified session
// ---------------------------------------------------------------------------

export async function getFarms(): Promise<{
  data: Farm[];
  error: string | null;
  fromCache: boolean;
  meta: ProvenanceMeta;
}> {
  const res = await apiRequest<any>('/api/farms', { cacheKey: 'farms' });
  const list: Farm[] = Array.isArray(res.data?.data) ? res.data.data : [];
  // Farms are persisted platform records read back from Supabase, not live
  // observations — label them as stored records.
  return { data: list, error: res.error, fromCache: res.fromCache, meta: metaFrom(res.data, 'database') };
}

export async function getFields(farmId?: string): Promise<{
  data: Field[];
  error: string | null;
  fromCache: boolean;
  meta: ProvenanceMeta;
}> {
  const endpoint = farmId ? `/api/fields?farmId=${encodeURIComponent(farmId)}` : '/api/fields';
  const res = await apiRequest<any>(endpoint, { cacheKey: `fields:${farmId || 'all'}` });
  const list: Field[] = Array.isArray(res.data?.data) ? res.data.data : [];
  return { data: list, error: res.error, fromCache: res.fromCache, meta: metaFrom(res.data, 'database') };
}

export async function createField(payload: {
  farm_id: string;
  name: string;
  size_hectares: number;
  soil_type?: string;
  current_crop?: string;
}): Promise<{ data: Field | null; error: string | null }> {
  const res = await apiRequest<any>('/api/fields', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.data?.data) return { data: null, error: res.error || msg('fieldCreateFailed') };
  return { data: res.data.data as Field, error: null };
}

/**
 * Create a farm.
 *
 * `POST /api/farms` validates `name`, `region` and `size_hectares` (see
 * server/routes/field-management.ts) and persists `location` server-side as
 * `{ region, country }`. Sending the region under any other key would fail
 * validation, so the field is named `region` here on purpose.
 */
export async function createFarm(payload: {
  name: string;
  region: string;
  size_hectares: number;
  soil_type?: string;
}): Promise<{ data: Farm | null; error: string | null }> {
  const res = await apiRequest<any>('/api/farms', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.data?.data) return { data: null, error: res.error || msg('farmCreateFailed') };
  return { data: res.data.data as Farm, error: null };
}

export async function saveFarmBoundaries(farmId: string, boundaries: FarmBoundary): Promise<{ data: FarmBoundary | null; error: string | null }> {
  const res = await apiRequest<any>(`/api/farms/${encodeURIComponent(farmId)}/boundaries`, {
    method: 'PUT', body: JSON.stringify({ boundaries }),
  });
  if (!res.data?.success || !res.data?.data?.boundaries) return { data: null, error: res.error || 'BOUNDARY_SAVE_FAILED' };
  return { data: res.data.data.boundaries as FarmBoundary, error: null };
}

export async function analyzeFarmSatelliteNdvi(farmId: string, periodDays: 30 | 60 | 90 | 180 = 90): Promise<{
  data: SatelliteNdviObservation[];
  error: string | null;
  provider?: string;
  resolutionMeters?: number;
}> {
  const res = await apiRequest<any>('/api/assistant/satellite/ndvi', {
    method: 'POST', body: JSON.stringify({ farm_id: farmId, period_days: periodDays }),
  });
  if (!res.data?.success || !Array.isArray(res.data?.data)) {
    return { data: [], error: res.error || res.data?.code || 'SATELLITE_ANALYSIS_FAILED' };
  }
  return {
    data: res.data.data as SatelliteNdviObservation[],
    error: null,
    provider: res.data.provenance?.provider,
    resolutionMeters: res.data.provenance?.resolutionMeters,
  };
}

// ---------------------------------------------------------------------------
// Notifications — persisted, requires verified session
// ---------------------------------------------------------------------------

export async function getNotifications(): Promise<{
  data: AppNotification[];
  error: string | null;
  unavailable: boolean;
  meta: ProvenanceMeta;
}> {
  const res = await apiRequest<any>('/api/notifications?limit=50', { cacheKey: 'notifications' });
  if (res.status === 503) {
    return {
      data: [],
      error: res.error || msg('notificationsUnavailable'),
      unavailable: true,
      meta: { provenance: 'unavailable', isRealData: false },
    };
  }
  const list = Array.isArray(res.data?.data)
    ? res.data.data.map((n: any) => ({
        id: String(n.id),
        type: n.type ?? 'info',
        title: n.title ?? '',
        message: n.message ?? '',
        priority: normalizePriority(n.priority),
        category: n.category,
        readAt: n.read_at ?? null,
        createdAt: n.created_at ?? '',
        isStarred: n.is_starred ?? false,
      }))
    : [];
  // Notifications are the caller's own persisted rows (the gateway stamps
  // `supabase.notifications` / `isRealData: true`), not generated content.
  return { data: list, error: res.error, unavailable: false, meta: metaFrom(res.data, 'database') };
}

/**
 * Mark one of the caller's own notifications as read.
 *
 * `PATCH /api/notifications/:id/read` is ownership-scoped server-side (the
 * update is filtered by `user_id`), so a failure is reported rather than
 * optimistically assumed.
 */
export async function markNotificationRead(id: string): Promise<{ ok: boolean; error: string | null }> {
  const res = await apiRequest<any>(`/api/notifications/${encodeURIComponent(id)}/read`, {
    method: 'PATCH',
  });
  if (res.data?.success) return { ok: true, error: null };
  return { ok: false, error: res.error || msg('notificationUpdateFailed') };
}

// ---------------------------------------------------------------------------
// Livestock — persisted, requires verified session (tenant-scoped)
// ---------------------------------------------------------------------------

export interface LivestockAnimal {
  id: string;
  earTag: string;
  species: string;
  breed: string;
  gender: string;
  age: number | null;
  weight: number | null;
  healthStatus: string;
  breedingStatus: string;
  currentValue: number | null;
  currency: string;
}

export async function getAnimals(): Promise<{
  data: LivestockAnimal[];
  error: string | null;
  unavailable: boolean;
  fromCache: boolean;
  meta: ProvenanceMeta;
}> {
  const res = await apiRequest<any>('/api/animals', { cacheKey: 'livestock:animals' });
  if (res.status === 503) {
    return {
      data: [],
      error: res.error || msg('apiLivestockUnavailable'),
      unavailable: true,
      fromCache: false,
      meta: { provenance: 'unavailable', isRealData: false },
    };
  }
  const list: LivestockAnimal[] = Array.isArray(res.data?.data)
    ? res.data.data.map((a: any) => ({
        id: String(a.id),
        earTag: a.earTag ?? '',
        species: a.species ?? '',
        breed: a.breed ?? '',
        gender: a.gender ?? '',
        age: typeof a.age === 'number' ? a.age : null,
        weight: typeof a.weight === 'number' ? a.weight : null,
        healthStatus: a.healthStatus ?? 'unknown',
        breedingStatus: a.breedingStatus ?? 'unknown',
        currentValue: typeof a.currentValue === 'number' ? a.currentValue : null,
        currency: a.currency ?? 'TND',
      }))
    : [];
  // The caller's own persisted herd (`supabase.livestock_animals`), not a
  // prediction — labelled as stored records.
  return {
    data: list,
    error: res.error,
    unavailable: false,
    fromCache: res.fromCache,
    meta: metaFrom(res.data, 'database'),
  };
}

// ---------------------------------------------------------------------------
// Agricultural news — real publisher RSS feeds via the gateway
// ---------------------------------------------------------------------------

/**
 * Tunisian agricultural news aggregated from real publisher feeds
 * (`GET /api/news`). The endpoint is public and stamps
 * `dataSource: "rss-feeds"` / `isRealData: true`. Headlines are never invented:
 * a source that is down is reported in `sources[]` and simply contributes no
 * articles.
 */
export async function getAgriNews(params: {
  language?: 'ar' | 'fr' | 'en';
  category?: string;
  query?: string;
  page?: number;
  pageSize?: number;
} = {}): Promise<{ data: NewsResult | null; error: string | null; fromCache: boolean }> {
  const search = new URLSearchParams();
  if (params.language) search.set('language', params.language);
  if (params.category) search.set('category', params.category);
  if (params.query) search.set('q', params.query);
  search.set('page', String(params.page ?? 1));
  search.set('pageSize', String(params.pageSize ?? 12));
  const endpoint = `/api/news?${search.toString()}`;

  const res = await apiRequest<any>(endpoint, { cacheKey: `news:${search.toString()}` });
  if (!res.data || !Array.isArray(res.data.articles)) {
    return { data: null, error: res.error || msg('newsFetchFailed'), fromCache: res.fromCache };
  }

  const d = res.data;
  const articles: NewsArticle[] = d.articles.map((a: any) => ({
    id: String(a.id ?? a.link),
    title: a.title ?? '',
    link: a.link ?? '',
    publishedAt: a.publishedAt ?? null,
    summary: a.summary ?? '',
    sourceId: a.sourceId ?? '',
    sourceName: a.sourceName ?? '',
    sourceUrl: a.sourceUrl ?? '',
    language: (a.language ?? 'ar') as 'ar' | 'fr' | 'en',
    categories: Array.isArray(a.categories) ? a.categories : [],
    author: a.author ?? null,
  }));

  const sources: NewsSourceStatus[] = Array.isArray(d.sources) ? d.sources : [];

  return {
    data: {
      articles,
      total: typeof d.total === 'number' ? d.total : articles.length,
      page: typeof d.page === 'number' ? d.page : 1,
      pageSize: typeof d.pageSize === 'number' ? d.pageSize : articles.length,
      totalPages: typeof d.totalPages === 'number' ? d.totalPages : 1,
      sources,
      categories: Array.isArray(d.categories) ? d.categories : [],
      generatedAt: d.generatedAt ?? '',
      meta: metaFrom(d, 'live-observation', 'rss-feeds'),
    },
    error: null,
    fromCache: res.fromCache,
  };
}

// ---------------------------------------------------------------------------
// AI capability discovery — the honest source of truth for feature gating
// ---------------------------------------------------------------------------

export async function getAICapabilities(): Promise<{
  data: AICapabilitiesResponse | null;
  error: string | null;
  fromCache: boolean;
}> {
  const res = await apiRequest<AICapabilitiesResponse>('/api/ai/capabilities', {
    cacheKey: 'ai:capabilities',
  });
  return { data: res.data, error: res.error, fromCache: res.fromCache };
}

/** Convenience: turn a capabilities payload into a lookup by id. */
export function capabilityMap(payload: AICapabilitiesResponse | null): Record<string, AICapability> {
  const map: Record<string, AICapability> = {};
  for (const cap of payload?.capabilities ?? []) map[cap.id] = cap;
  return map;
}

// ---------------------------------------------------------------------------
// AgriVibe community — verified, persisted social interactions
// ---------------------------------------------------------------------------

export interface CommunityPost {
  id: string;
  author_id: string;
  content: string;
  category: string;
  media_urls: string[];
  created_at: string;
  author: { id: string; full_name: string | null; role: string | null; governorate: string | null } | null;
  likes_count: number;
  comments_count: number;
  liked_by_me: boolean;
}

export interface CommunityComment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author?: { id: string; full_name: string | null; role: string | null; governorate: string | null } | null;
}

export async function getCommunityPosts(category = 'all'): Promise<{ data: CommunityPost[]; error: string | null }> {
  const query = new URLSearchParams({ limit: '30', offset: '0' });
  if (category !== 'all') query.set('category', category);
  const res = await apiRequest<any>(`/api/community/posts?${query.toString()}`);
  if (!res.data?.success || !Array.isArray(res.data?.data)) {
    return { data: [], error: res.error || msg('apiUnavailable') };
  }
  return { data: res.data.data as CommunityPost[], error: null };
}

export async function createCommunityPost(content: string, category = 'general'): Promise<{ data: CommunityPost | null; error: string | null }> {
  const res = await apiRequest<any>('/api/community/posts', {
    method: 'POST',
    body: JSON.stringify({ content, category }),
  });
  if (!res.data?.success || !res.data?.data) return { data: null, error: res.error || msg('apiUnavailable') };
  return { data: res.data.data as CommunityPost, error: null };
}

export async function toggleCommunityPostLike(postId: string): Promise<{ liked: boolean | null; error: string | null }> {
  const res = await apiRequest<any>(`/api/community/posts/${encodeURIComponent(postId)}/like`, { method: 'POST' });
  if (!res.data?.success || typeof res.data?.data?.liked !== 'boolean') {
    return { liked: null, error: res.error || msg('apiUnavailable') };
  }
  return { liked: res.data.data.liked, error: null };
}

export async function getCommunityComments(postId: string): Promise<{ data: CommunityComment[]; error: string | null }> {
  const res = await apiRequest<any>(`/api/community/posts/${encodeURIComponent(postId)}/comments`);
  if (!res.data?.success || !Array.isArray(res.data?.data)) return { data: [], error: res.error || msg('apiUnavailable') };
  return { data: res.data.data as CommunityComment[], error: null };
}

export async function createCommunityComment(postId: string, content: string): Promise<{ data: CommunityComment | null; error: string | null }> {
  const res = await apiRequest<any>(`/api/community/posts/${encodeURIComponent(postId)}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
  if (!res.data?.success || !res.data?.data) return { data: null, error: res.error || msg('apiUnavailable') };
  return { data: res.data.data as CommunityComment, error: null };
}

// ---------------------------------------------------------------------------
// Diagnostics
// ---------------------------------------------------------------------------

export async function pingServer(): Promise<{ ok: boolean; message: string }> {
  const res = await apiRequest<{ message: string }>('/api/ping', { anonymous: true });
  if (res.data) return { ok: true, message: res.data.message || 'pong' };
  return { ok: false, message: res.error || 'unreachable' };
}

export async function checkSession(): Promise<boolean> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return Boolean(session);
}

