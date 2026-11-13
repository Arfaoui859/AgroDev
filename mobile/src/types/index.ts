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

export interface WeatherData {
  temperature: number;
  humidity: number;
  precipitation_probability: number;
  wind_speed: number;
  weather_code?: number;
  condition: string;
  condition_ar: string;
  governorate: string;
  advice_ar: string;
  advice_fr: string;
  advice_en: string;
  forecast: Array<{
    date: string;
    day_ar: string;
    day_fr: string;
    day_en: string;
    temp_max: number;
    temp_min: number;
    condition: string;
    condition_ar: string;
    rain_chance: number;
  }>;
}

export interface DiseaseDiagnosisResult {
  id: string;
  diseaseName: string;
  diseaseNameAr: string;
  confidence: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  descriptionAr: string;
  symptoms: string[];
  treatment: string[];
  prevention: string[];
  dataSource: 'real-model' | 'vision-llm' | 'rule-based' | 'reference-guide';
  imageUri?: string;
  processedAt: string;
}

export interface SoilAnalysisInput {
  fieldId?: string;
  location?: string;
  ph: number;
  moisture?: number;
  nitrogen?: number;
  phosphorus?: number;
  potassium?: number;
  organicMatter?: number;
  soilTexture?: string;
}

export interface SoilAnalysisResult {
  grade: 'ممتاز' | 'جيد' | 'معقول' | 'ضعيف';
  gradeScore: number;
  interpretationAr: string;
  interpretationFr: string;
  interpretationEn: string;
  phStatus: {
    value: number;
    status: 'optimal' | 'acidic' | 'alkaline';
    labelAr: string;
  };
  nutrientScores: {
    nitrogen: number;
    phosphorus: number;
    potassium: number;
    organicMatter: number;
  };
  suitableCrops: Array<{
    name: string;
    nameAr: string;
    compatibility: string;
    yieldPotential: 'high' | 'medium' | 'low';
    profitability: string;
  }>;
  fertilizerPlan: Array<{
    nutrient: string;
    nutrientAr: string;
    recommendationAr: string;
    quantity: string;
  }>;
  dataSource: 'scikit-learn-model' | 'rule-based' | 'synthetic';
}

export interface CropRecommendationResult {
  crops: Array<{
    id: string;
    name: string;
    nameAr: string;
    category: string;
    suitabilityScore: number;
    season: string;
    waterRequirement: 'منخفض' | 'متوسط' | 'مرتفع';
    estimatedProfitTndPerHa: number;
    growthCycleDays: number;
    keyTipsAr: string;
  }>;
}

export interface MarketPriceItem {
  id: string;
  cropName: string;
  cropNameAr: string;
  pricePerKg: number;
  previousPricePerKg: number;
  changePercent: number;
  trend: 'rising' | 'falling' | 'stable';
  marketLocation: string;
  marketLocationAr: string;
  qualityGrade: string;
  lastUpdated: string;
}

export interface FarmAlert {
  id: string;
  type: 'weather' | 'disease' | 'irrigation' | 'pest' | 'market';
  title: string;
  titleAr: string;
  message: string;
  messageAr: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  actionable: boolean;
  actionTextAr?: string;
}

export interface FarmTask {
  id: string;
  title: string;
  titleAr: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  completed: boolean;
  cropNameAr?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  quickActions?: Array<{ label: string; action: string }>;
}

export interface AIAgentInfo {
  id: string;
  name: string;
  nameAr: string;
  role: string;
  roleAr: string;
  status: 'active' | 'standby' | 'rule-based';
  port: number;
  engine: string;
  provenance: string;
  provenanceAr: string;
}

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
