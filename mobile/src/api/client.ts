import { Platform } from 'react-native';
import { supabase } from './supabase';
import { readCache, writeCache } from './cache';
import { API_TIMEOUT_MS, DEFAULT_API_BASE_URL } from '../config';
import { getActiveLanguage } from '../i18n';
import { getExtra, ExtraTranslations } from '../i18n/extra';
import { formatDateTime } from '../utils/date';
import { normalizePriority } from '../utils/notifications';
import {
  ApiResult,
  AppNotification,
  AICapabilitiesResponse,
  AICapability,
  AssistantReply,
  CropRecommendation,
  CropRecommendationResult,
  DataProvenance,
  DiseaseDiagnosisResult,
  Farm,
  Field,
  IrrigationResult,
  MarketPriceItem,
  MarketResult,
  NewsArticle,
  NewsResult,
  NewsSourceStatus,
  PestIdentification,
  ProvenanceMeta,
  SoilAnalysisInput,
  SoilAnalysisResult,
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
  const { cacheKey, anonymous, ...init } = options;
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const buildHeaders = async () => {
    const headers = anonymous ? new Headers(init.headers) : await authHeaders(init.headers);
    const isFormData = typeof FormData !== 'undefined' && init.body instanceof FormData;
    if (!headers.has('Content-Type') && init.body && !isFormData) {
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
      error: isTimeout ? msg('apiTimeout') : msg('apiOffline'),
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
  if (v === 'llm' || v === 'llm-generated') return 'llm';
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
  // External live feeds: Open-Meteo observations and Tunisian agri-news RSS.
  if (v === 'open-meteo' || v === 'live-observation' || v === 'rss-feeds') return 'live-observation';
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
// Weather (Open-Meteo via gateway) — real observation
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
      // Open-Meteo does not report a probability, so inventing one would be
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
        : 'الظروف الجوية متاحة من محطات الرصد (Open-Meteo).',
      advice_fr: 'Données météo en direct fournies par Open-Meteo.',
      advice_en: 'Live weather data provided by Open-Meteo.',
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
      meta: { provenance: 'live-observation', isRealData: true, source: d.source?.provider || 'open-meteo' },
    };
    return { data: mapped, error: null, fromCache: res.fromCache };
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
  form.append('file', {
    uri: Platform.OS === 'ios' ? options.imageUri.replace('file://', '') : options.imageUri,
    name,
    type,
  } as any);
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
  const form = await buildImageForm(options);
  const res = await apiRequest<any>('/api/ai/images/detect-disease', {
    method: 'POST',
    body: form,
  });

  // 503 = no vision back-end configured; 502 = the back-end was reached but
  // failed. Both are honest "no diagnosis produced" states — surface our own
  // localised copy rather than the server's English message.
  if (res.status === 503 || res.status === 502) {
    return { data: null, error: msg('diseaseServiceUnconfigured'), unavailable: true };
  }
  if (!res.data) {
    return { data: null, error: msg('diseaseAnalysisFailed'), unavailable: false };
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

  return {
    data: {
      id: String(d.id ?? Date.now()),
      diseaseName: primary.disease || primary.disease_name || msg('diseaseUnknownName'),
      diseaseNameAr: primary.disease_name_ar || primary.disease || msg('diseaseUnknownName'),
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
      processedAt: formatDateTime(new Date().toISOString(), getActiveLanguage()),
    },
    error: null,
    unavailable: false,
  };
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
      gradeScore: typeof d.health_score === 'number' ? d.health_score : 0,
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
// Market prices — persisted platform records (unverified, labelled as such)
// ---------------------------------------------------------------------------

export async function getMarketPrices(): Promise<{
  data: MarketResult | null;
  error: string | null;
  fromCache: boolean;
}> {
  const res = await apiRequest<any>('/api/market/all', { cacheKey: 'market:all' });

  // The gateway answers 503 with an Arabic-only message when no prices are
  // recorded yet (code MARKET_DATA_NOT_AVAILABLE). That is an honest "no
  // records" state, not a fetch failure, so it must not surface the raw Arabic
  // text to fr/en users — the screen renders its own localised empty state.
  const isNoData =
    res.status === 503 &&
    ((res.errorBody as any)?.code === 'MARKET_DATA_NOT_AVAILABLE' ||
      (res.errorBody as any)?.dataAvailable === false);

  const overview: any[] = Array.isArray(res.data?.data?.marketOverview)
    ? res.data.data.marketOverview
    : [];

  if (!overview.length) {
    return {
      data: {
        prices: [],
        meta: { provenance: 'unavailable', isRealData: false },
      },
      error: isNoData ? null : res.error,
      fromCache: res.fromCache,
    };
  }

  const prices: MarketPriceItem[] = overview.map((m, index) => ({
    // Deterministic id: a random fallback would change on every render and
    // break list identity / caching. cropId is present for real records.
    id: String(m.cropId ?? m.crop?.id ?? `market-${index}`),
    cropName: m.crop?.name || m.cropId || '—',
    cropNameAr: m.crop?.name_ar || m.crop?.name || '—',
    pricePerKg: Number(m.currentPrice ?? 0),
    previousPricePerKg: Number.isFinite(m.averagePrice) ? Number(m.averagePrice) : null,
    changePercent: null,
    trend: 'unknown',
    marketLocation: m.prices?.[0]?.market_location || '—',
    marketLocationAr: m.prices?.[0]?.market_location || '—',
    qualityGrade: m.prices?.[0]?.quality_grade || '—',
    lastUpdated: m.prices?.[0]?.price_date || '',
  }));

  return {
    data: {
      prices,
      meta: metaFrom(res.data?.data, 'database', 'platform-database'),
    },
    error: null,
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
  // caller supplies real Open-Meteo values). Injecting made-up defaults here
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
): Promise<{ data: AssistantReply | null; error: string | null }> {
  const res = await apiRequest<any>('/api/ai/assistant/chat', {
    method: 'POST',
    body: JSON.stringify({ message, language }),
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
    },
    error: null,
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

