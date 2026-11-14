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

/**
 * Extended soil input accepted by the professional detailed endpoint
 * (`POST /api/soil-analysis/analyze`). Every field is optional; the server's
 * report explicitly lists what is missing instead of inventing it. Units follow
 * the server contract (`normalizeSoilRequest` in soil-analysis-detailed.ts).
 */
export interface SoilDetailedInput {
  fieldId?: string;
  location?: string;
  samplingDate?: string;
  sampleDepth?: number;
  ph?: number;
  moisture?: number;
  organicMatter?: number;
  nitrogen?: number;
  phosphorus?: number;
  potassium?: number;
  calcium?: number;
  magnesium?: number;
  sulfur?: number;
  iron?: number;
  zinc?: number;
  manganese?: number;
  copper?: number;
  boron?: number;
  electricalConductivity?: number;
  /** Required by the server whenever EC is supplied (e.g. "dS/m", "µS/cm"). */
  electricalConductivityUnit?: string;
  electricalConductivityMethod?: string;
  soilTexture?: string;
  sandPercent?: number;
  siltPercent?: number;
  clayPercent?: number;
  nutrientUnit?: string;
  nutrientMethod?: string;
  calciumCarbonateTotal?: number;
  calciumCarbonateActive?: number;
  cec?: number;
  sodium?: number;
  sodiumAdsorptionRatio?: number;
  exchangeableSodiumPercentage?: number;
  waterElectricalConductivity?: number;
  waterElectricalConductivityUnit?: string;
  waterPh?: number;
  slopePercent?: number;
  drainage?: string;
  previousCrop?: string;
  targetCrop?: string;
  targetYield?: number;
  farmAreaHectares?: number;
  irrigationMethod?: string;
  region?: string;
  currentCrop?: string;
  season?: string;
  notes?: string;
}

// The professional report is a large, server-validated JSON object
// (schemaVersion 2.0). We type only the fields the UI renders; the rest is kept
// verbatim under `report` so nothing is dropped or reshaped.
export interface SoilIndicatorRow {
  parameter: string;
  value: string | number;
  unit: string;
  classification: string;
  cropEffect: string;
  evidence: string;
}

export interface SoilReportFinding {
  parameter: string;
  observedValue: string | number;
  unit: string;
  interpretation: string;
  importance: string;
  severity: 'informational' | 'low' | 'moderate' | 'high' | 'not_assessed';
  evidence: string;
}

export interface SoilRankedConstraint {
  rank: number;
  constraint: string;
  severity: 'low' | 'moderate' | 'high' | 'not_assessed';
  evidence: string;
  cropImpact: string;
  whatToConfirm: string;
}

export interface SoilReportAction {
  priority: 'now' | 'before_planting' | 'during_season' | 'follow_up';
  action: string;
  reason?: string;
  evidence?: string;
  howTo?: string;
  when: string;
  verification?: string;
  /** Always null in this workflow: doses are withheld without lab data. */
  quantity: null | number;
}

export interface SoilCropCandidate {
  crop: string;
  status: 'possible' | 'possible_with_checks' | 'not_assessed';
  why_it_may_fit: string;
  risk: string;
  sowingWindow: string;
  conditions_to_check: string[];
  limitations: string;
}

export interface SoilReport {
  schemaVersion: string;
  reportLanguage: string;
  executiveSummary: string;
  confidence: { level: 'low' | 'moderate' | 'high' | 'not_assessed'; reasons: string[] };
  dataQuality: {
    providedMeasurements: { name: string; value: string | number; unit: string; source: string }[];
    missingMeasurements: string[];
    limitations: string[];
    consistencyChecks: string[];
  };
  indicatorTable: SoilIndicatorRow[];
  soilCharacterization: {
    texture: { classification: string; basis: string; confidence: string };
    chemical: string[];
    physical: string[];
  };
  findings: SoilReportFinding[];
  rankedConstraints: SoilRankedConstraint[];
  strengths: string[];
  constraints: string[];
  cropSuitability: {
    status: 'qualitative' | 'not_assessed';
    candidates: SoilCropCandidate[];
    avoid: { crop: string; reason: string; evidence: string }[];
    caveats: string[];
  };
  targetCropPlan?: {
    targetCrop: string;
    feasibility: 'feasible' | 'feasible_with_correction' | 'not_recommended' | 'not_assessed';
    reasons: string[];
    gaps: { parameter: string; current: string; required: string; gap: string; evidence: string }[];
    actions: SoilReportAction[];
    firstAction: string;
    retestWhen: string;
  };
  fertilizationPlan: {
    status: 'guidance_only' | 'not_assessed';
    stages: {
      stage: string;
      strategy: string;
      productExamples: string[];
      rate: null | number;
      timing: string;
      basis: string;
      verification: string;
    }[];
    organicOptions: string[];
    withheldDosesReason: string;
  };
  waterAndIrrigation: {
    status: 'guidance_only' | 'not_assessed';
    method: string;
    frequency: string;
    amount: string;
    waterQuality: string;
    salinityAndLeaching: string;
    drainage: string;
    limitations: string[];
  };
  twelveWeekCalendar: { week: number; actions: string[]; check: string }[];
  riskAlerts: {
    risk: string;
    severity: 'low' | 'moderate' | 'high' | 'not_assessed';
    trigger: string;
    symptomsToMonitor: string[];
    safeResponse: string;
  }[];
  recommendations: SoilReportAction[];
  followUpPlan: { step: number; when: string; whatToDo: string; whatToMeasure: string; why: string }[];
  additionalInformationNeeded: string[];
  professionalReview: { required: boolean; reason: string; bringToAgronomist: string[] };
  disclaimers: string[];
}

export interface SoilDetailedResult {
  report: SoilReport;
  meta: ProvenanceMeta;
  /** Present only when the server actually persisted the report. */
  analysisId?: string;
  persisted: boolean;
  /** Why persistence was skipped, when it was (e.g. FIELD_NOT_SELECTED). */
  persistenceReason?: string;
}

export interface SoilReportSummary {
  analysisId: string;
  fieldId: string | null;
  farmId: string | null;
  analysisType: string;
  analyzedAt: string | null;
  executiveSummary: string | null;
}

/**
 * Context handed from the soil screen to the crop screen so the user does not
 * re-enter what they already provided. `soil` is the user-entered (unverified)
 * measurement set; `fieldId` is present when a plot was selected, which lets
 * the crop screen read the plot's PERSISTED analysis instead.
 */
export interface SoilToCropContext {
  fieldId?: string;
  farmId?: string;
  /** Human-readable names for the project confirmation screen. */
  farmName?: string;
  fieldName?: string;
  soil: SoilDetailedInput;
  /** Target crop the user named in the soil form, if any. */
  targetCrop?: string;
}

// --------------------------- Cultivation project ---------------------------

export interface Cultivation {
  id: string;
  farm_id: string;
  section_id: string | null;
  crop_name: string;
  crop_variety: string | null;
  planting_date: string | null;
  expected_harvest_date: string | null;
  area_hectares: number;
  current_growth_stage: string | null;
  status: string;
  created_at?: string;
}

// ------------------------------- Marketplace -------------------------------

export interface MarketplaceListing {
  id: string;
  title: string;
  category?: string;
  price?: number | null;
  currency?: string;
  unit?: string;
  sellerName?: string | null;
  location?: string | null;
  quantity?: number | null;
  imageUrl?: string | null;
}

export interface MarketplaceResult {
  listings: MarketplaceListing[];
  meta: ProvenanceMeta;
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
