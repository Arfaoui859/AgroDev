/**
 * Domain types shared across the mobile app.
 *
 * The API-facing shapes mirror the *actual* Express responses (verified against
 * the backend source), not the older placeholder shapes. Every AI/service
 * result carries an explicit provenance field so the UI can label where the
 * data really comes from (real observation, trained model, rule engine,
 * generative model, or unavailable).
 */

export type UserRole =
  | 'farmer'
  | 'gardener'
  | 'agronomist'
  | 'trader'
  | 'veterinarian'
  | 'inspector'
  | 'admin'
  | 'government'
  | 'investor'
  | 'company';

/** How a value was produced. Never present one kind as another. */
export type DataProvenance =
  | 'live-observation'   // external live feed, e.g. Open-Meteo
  | 'database'           // persisted platform record
  | 'trained-model'      // an actual ML model served by a microservice
  | 'llm'                // generative language model
  | 'vision-model'       // generative/multimodal vision model
  | 'rule-based'         // deterministic expert rules / heuristics
  | 'unavailable';       // nothing real to show

export interface ProvenanceMeta {
  provenance: DataProvenance;
  isRealData: boolean;
  /** Human-readable source label, e.g. "open-meteo", "rule-based-engine". */
  source?: string;
  /** Optional disclaimer to render verbatim. */
  disclaimer?: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  full_name_ar?: string;
  phone?: string;
  role: UserRole;
  language_preference?: string;
  avatar_url?: string;
  governorate?: string;
  interests?: string[];
}

export interface Farm {
  id: string;
  name: string;
  name_ar?: string;
  location: string | { lat: number; lng: number; region?: string };
  size_hectares: number;
  soil_type?: string;
  created_at?: string;
}

export interface Field {
  id: string;
  farm_id: string;
  name: string;
  name_ar?: string;
  size_hectares: number;
  soil_type: string;
  current_crop?: string;
  planting_date?: string;
  expected_harvest_date?: string;
}

// ------------------------------- Weather -----------------------------------

export interface WeatherDay {
  date: string;
  temp_max: number;
  temp_min: number;
  humidity?: number;
  /** Forecast rainfall for the day in millimetres (real provider value). */
  rainfall?: number;
  /** Arabic condition text from the provider (see WeatherData.condition_ar). */
  condition_ar: string;
  /** Provider icon key, used to render localised FR/EN labels. */
  icon?: string;
  wind_speed?: number;
}

export interface WeatherData {
  temperature: number;
  humidity: number;
  /**
   * Rainfall for today in millimetres, straight from the provider. We do NOT
   * derive a "% chance of rain" because the provider does not report a
   * probability; showing one would be fabricated.
   */
  rainfall_mm: number;
  wind_speed: number;
  weather_code?: number;
  /**
   * Arabic condition text straight from the provider. It is the only
   * human-readable description the provider emits, so it must only be shown to
   * Arabic callers; other locales translate `icon` locally.
   */
  condition_ar: string;
  /** Provider icon key (e.g. "partly-cloudy"), used for localised labels. */
  icon?: string;
  governorate: string;
  advice_ar: string;
  advice_fr: string;
  advice_en: string;
  forecast: WeatherDay[];
  /** Provenance of the weather numbers (Open-Meteo = live observation). */
  meta: ProvenanceMeta;
}

// --------------------------- Disease / leaf scan ---------------------------

export type DiseaseSeverity = 'low' | 'medium' | 'high' | 'critical' | 'unknown';

export interface DiseaseDiagnosisResult {
  id: string;
  diseaseName: string;
  diseaseNameAr: string;
  /** 0..100 confidence. Only present when a model actually reported one. */
  confidence: number | null;
  severity: DiseaseSeverity;
  descriptionAr: string;
  symptoms: string[];
  treatment: string[];
  prevention: string[];
  meta: ProvenanceMeta;
  imageUri?: string;
  processedAt: string;
}

// ------------------------------- Soil --------------------------------------

export interface SoilAnalysisInput {
  fieldId?: string;
  location?: string;
  /** Optional: when omitted the engine reports it as a missing measurement. */
  ph?: number;
  moisture?: number;
  nitrogen?: number;
  phosphorus?: number;
  potassium?: number;
  organicMatter?: number;
  salinity?: number;
  temperature?: number;
  soilTexture?: string;
}

export interface SoilFinding {
  parameter: string;
  labelAr: string;
  value: number | null;
  status: string;
  messageAr: string;
}

export interface SoilAnalysisResult {
  grade: string;
  gradeScore: number;
  fertilityLevel: string;
  interpretationAr: string;
  recommendations: string[];
  problems: string[];
  missingMeasurements: string[];
  findings: SoilFinding[];
  meta: ProvenanceMeta;
}

// --------------------------- Crop recommendation ---------------------------

export interface CropRecommendation {
  id: string;
  name: string;
  nameAr: string;
  category: string;
  suitabilityScore: number;
  season: string;
  waterRequirement: string;
  estimatedProfitTndPerHa: number;
  growthCycleDays: number;
  keyTipsAr: string;
}

export interface CropRecommendationResult {
  crops: CropRecommendation[];
  meta: ProvenanceMeta;
}

// ------------------------------- Market ------------------------------------

export interface MarketPriceItem {
  id: string;
  cropName: string;
  cropNameAr: string;
  pricePerKg: number;
  previousPricePerKg: number | null;
  changePercent: number | null;
  trend: 'rising' | 'falling' | 'stable' | 'unknown';
  marketLocation: string;
  marketLocationAr: string;
  qualityGrade: string;
  lastUpdated: string;
}

export interface MarketResult {
  prices: MarketPriceItem[];
  meta: ProvenanceMeta;
}

// --------------------------- Irrigation ------------------------------------

export interface IrrigationResult {
  /** Raw service payload; shape is service-defined and rendered defensively. */
  data: Record<string, unknown> | null;
  meta: ProvenanceMeta;
}

// ------------------------------- Pest --------------------------------------

export interface PestIdentification {
  identifiedPest: string | null;
  pestNameAr: string | null;
  category: string | null;
  method: string;
  symptomsUsed: string[];
  meta: ProvenanceMeta;
}

// ------------------------------ Assistant ----------------------------------

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  meta?: ProvenanceMeta;
}

export interface AssistantReply {
  reply: string;
  meta: ProvenanceMeta;
  farmContextStatus?: string;
}

// --------------------------- Notifications ---------------------------------

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category?: string;
  readAt: string | null;
  createdAt: string;
  isStarred?: boolean;
}

// ------------------------- AI capability discovery -------------------------

export interface AICapability {
  id: string;
  name: string;
  nameAr: string;
  engine:
    | 'llm'
    | 'vision-model'
    | 'rule-based'
    | 'heuristic'
    | 'microservice'
    | 'unavailable'
    | string;
  available?: boolean;
  provenance: string;
  provenanceAr: string;
  requiresConfiguration?: string;
  microserviceConfigured?: boolean;
  dataSource?: string;
  isRealData?: boolean;
}

export interface AICapabilitiesResponse {
  capabilities: AICapability[];
  summary?: {
    total: number;
    available: number;
    unavailable: number;
    modelPowered: number;
  };
  llm?: {
    configured: boolean;
    credentialAvailable: boolean;
    provider?: string | null;
    textModel?: string | null;
    visionModel?: string | null;
  };
}

// ------------------------------- News --------------------------------------
// Real publisher RSS feeds aggregated by the gateway (`GET /api/news`).

export interface NewsArticle {
  id: string;
  title: string;
  link: string;
  publishedAt: string | null;
  summary: string;
  sourceId: string;
  sourceName: string;
  sourceUrl: string;
  language: 'ar' | 'fr' | 'en';
  categories: string[];
  author: string | null;
}

export interface NewsSourceStatus {
  id: string;
  name: string;
  language: 'ar' | 'fr' | 'en';
  kind: 'direct' | 'aggregator';
  available: boolean;
  itemCount: number;
  error?: string;
  fetchedAt?: string;
}

export interface NewsResult {
  articles: NewsArticle[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  sources: NewsSourceStatus[];
  categories: string[];
  generatedAt: string;
  meta: ProvenanceMeta;
}

// ------------------------------- History -----------------------------------

export interface SavedAnalysis {
  id: string;
  type: 'disease' | 'soil' | 'crop';
  title: string;
  date: string;
  summary: string;
  badge: string;
  badgeVariant: 'primary' | 'success' | 'warning' | 'danger';
  imageUri?: string;
}

/** Standard envelope returned by every api function. */
export interface ApiResult<T> {
  data: T | null;
  error: string | null;
  /** True when the server answered (even with an error status). */
  isOnline: boolean;
  /** True when `data` came from the offline cache, not the network. */
  fromCache: boolean;
  /** HTTP status when the server answered, else null. */
  status: number | null;
  /**
   * Parsed JSON body of a non-OK response, when the server sent one. Lets a
   * caller read an honest envelope (e.g. `code: "MARKET_DATA_NOT_AVAILABLE"`)
   * instead of treating every non-2xx as a generic failure. Null otherwise.
   */
  errorBody?: Record<string, unknown> | null;
}
