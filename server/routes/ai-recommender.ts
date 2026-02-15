import { RequestHandler } from "express";
import { WeatherData } from "./weather";
import { MarketData } from "./market";

export interface CropRecommendationInput {
  location: {
    latitude: number;
    longitude: number;
    governorate?: string;
    city?: string;
    region?: string;
  };
  soilData?: {
    ph: number;
    organicMatter?: number;
    nitrogen?: number;
    phosphorus?: number;
    potassium?: number;
    moisture?: number;
    conductivity?: number;
    temperature?: number;
  };
  farmerPreferences?: {
    riskTolerance: 'low' | 'medium' | 'high';
    investmentCapacity: 'low' | 'medium' | 'high';
    experienceLevel: 'beginner' | 'intermediate' | 'expert';
    farmSize: number; // in feddans
    preferredCrops?: string[];
    avoidedCrops?: string[];
  };
  season?: 'winter' | 'summer' | 'nili';
  timeframe?: 'immediate' | 'short_term' | 'long_term';
}

export interface CropRecommendation {
  crop: {
    id: string;
    name: string;
    nameEn: string;
    category: string;
    description: string;
  };
  scores: {
    overall: number;
    climateCompatibility: number;
    soilSuitability: number;
    marketPotential: number;
    profitability: number;
    riskLevel: number;
    waterEfficiency: number;
  };
  economics: {
    estimatedCostPerFeddan: number;
    estimatedRevenuePerFeddan: number;
    estimatedProfit: number;
    profitMargin: number;
    breakEvenYield: number;
    roi: number;
  };
  suitability: {
    riskLevel: 'low' | 'medium' | 'high';
    waterRequirement: 'low' | 'medium' | 'high';
    laborRequirement: 'low' | 'medium' | 'high';
    technologyLevel: 'basic' | 'intermediate' | 'advanced';
  };
  timing: {
    bestPlantingTime: string;
    harvestTime: string;
    growthDuration: number;
    seasonalAdvice: string;
  };
  requirements: {
    soilPreferences: string[];
    climateNeeds: string[];
    inputs: string[];
    equipment: string[];
  };
  advantages: string[];
  challenges: string[];
  recommendations: string[];
  confidence: number;
}

export interface AIRecommendationResponse {
  recommendations: CropRecommendation[];
  analysis: {
    locationAssessment: string;
    soilAssessment?: string;
    climateAssessment: string;
    marketAssessment: string;
    riskAssessment: string;
  };
  metadata: {
    analysisDate: string;
    dataVersion: string;
    algorithmVersion: string;
    confidence: number;
  };
}

export const generateCropRecommendations: RequestHandler = async (req, res) => {
  try {
    const input: CropRecommendationInput = req.body;
    
    if (!input.location?.latitude || !input.location?.longitude) {
      return res.status(400).json({ 
        error: "يجب تحديد الموقع الجغرافي" 
      });
    }

    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const recommendations = await generateAIRecommendations(input);
    
    res.json(recommendations);
  } catch (error) {
    console.error('AI Recommender API error:', error);
    res.status(500).json({ 
      error: "خطأ في نظام التوصيات الذكي" 
    });
  }
};

async function generateAIRecommendations(input: CropRecommendationInput): Promise<AIRecommendationResponse> {
  // Simulate fetching weather and market data
  const weatherData = await simulateWeatherData(input.location);
  const marketData = await simulateMarketData();
  
  // Define crop database with detailed information
  const cropDatabase = getCropDatabase();
  
  // Analyze each crop and generate scores
  const cropRecommendations: CropRecommendation[] = [];
  
  for (const [cropId, cropInfo] of Object.entries(cropDatabase)) {
    const recommendation = analyzeCrop(
      cropId,
      cropInfo,
      input,
      weatherData,
      marketData[cropId]
    );
    
    if (recommendation.scores.overall >= 30) { // Only include viable crops
      cropRecommendations.push(recommendation);
    }
  }
  
  // Sort by overall score
  cropRecommendations.sort((a, b) => b.scores.overall - a.scores.overall);
  
  // Take top 8 recommendations
  const topRecommendations = cropRecommendations.slice(0, 8);
  
  // Generate analysis
  const analysis = generateAnalysis(input, weatherData, topRecommendations);
  
  return {
    recommendations: topRecommendations,
    analysis,
    metadata: {
      analysisDate: new Date().toISOString(),
      dataVersion: "1.0",
      algorithmVersion: "2.1",
      confidence: calculateOverallConfidence(topRecommendations)
    }
  };
}

function getCropDatabase() {
  return {
    wheat: {
      name: "القمح",
      nameEn: "Wheat",
      category: "حبوب",
      description: "محصول حبوب استراتيجي مناسب للمناخ المصري",
      basePrice: 850,
      baseYield: 3.5,
      baseCost: 6500,
      optimalPH: { min: 6.0, max: 7.5 },
      optimalTemp: { min: 15, max: 25 },
      waterNeed: "medium",
      growthDuration: 180,
      plantingSeason: "winter",
      riskFactors: ["تقلبات أسعار الأسمدة", "الأمراض الفطرية"]
    },
    tomato: {
      name: "الطماطم",
      nameEn: "Tomato",
      category: "خضروات",
      description: "محصول خضر عالي الربحية مع فرص تصدير ممتازة",
      basePrice: 4.5,
      baseYield: 25,
      baseCost: 12000,
      optimalPH: { min: 6.0, max: 6.8 },
      optimalTemp: { min: 18, max: 29 },
      waterNeed: "high",
      growthDuration: 120,
      plantingSeason: "winter",
      riskFactors: ["الأمراض النباتية", "تقلبات السوق"]
    },
    corn: {
      name: "الذرة الشامية",
      nameEn: "Corn",
      category: "حبوب",
      description: "محصول علفي مهم مع استقرار في الطلب",
      basePrice: 680,
      baseYield: 4.2,
      baseCost: 7200,
      optimalPH: { min: 6.0, max: 7.0 },
      optimalTemp: { min: 20, max: 30 },
      waterNeed: "high",
      growthDuration: 150,
      plantingSeason: "summer",
      riskFactors: ["منافسة الواردات", "استهلاك مياه عالي"]
    },
    potato: {
      name: "البطاطس",
      nameEn: "Potato",
      category: "خضروات",
      description: "محصول أساسي مع طلب محلي ثابت",
      basePrice: 3.2,
      baseYield: 20,
      baseCost: 9000,
      optimalPH: { min: 5.5, max: 6.5 },
      optimalTemp: { min: 15, max: 25 },
      waterNeed: "medium",
      growthDuration: 100,
      plantingSeason: "winter",
      riskFactors: ["تقلبات سعرية موسمية", "أمراض التخزين"]
    },
    cotton: {
      name: "القطن",
      nameEn: "Cotton",
      category: "محاصيل نقدية",
      description: "محصول نقدي تقليدي مع قيمة تصديرية عالية",
      basePrice: 25000,
      baseYield: 0.8,
      baseCost: 15000,
      optimalPH: { min: 7.0, max: 8.5 },
      optimalTemp: { min: 25, max: 35 },
      waterNeed: "high",
      growthDuration: 200,
      plantingSeason: "summer",
      riskFactors: ["تقلبات السوق العالمي", "تكلفة إنتاج عالية"]
    },
    rice: {
      name: "الأرز",
      nameEn: "Rice",
      category: "حبوب",
      description: "محصول أساسي مع طلب محلي عالي",
      basePrice: 1200,
      baseYield: 4.5,
      baseCost: 8500,
      optimalPH: { min: 6.0, max: 7.0 },
      optimalTemp: { min: 20, max: 35 },
      waterNeed: "very_high",
      growthDuration: 140,
      plantingSeason: "summer",
      riskFactors: ["استهلاك مياه مرتفع جداً", "قيود زراعية"]
    }
  };
}

function analyzeCrop(
  cropId: string,
  cropInfo: any,
  input: CropRecommendationInput,
  weather: any,
  market: any
): CropRecommendation {
  
  // Calculate individual scores
  const climateScore = calculateClimateCompatibility(cropInfo, weather, input.location);
  const soilScore = calculateSoilSuitability(cropInfo, input.soilData);
  const marketScore = calculateMarketPotential(market);
  const profitabilityScore = calculateProfitability(cropInfo, market, input.farmerPreferences);
  const riskScore = calculateRiskLevel(cropInfo, input.farmerPreferences);
  const waterScore = calculateWaterEfficiency(cropInfo, weather);
  
  // Calculate weighted overall score
  const weights = {
    climate: 0.25,
    soil: 0.20,
    market: 0.20,
    profitability: 0.20,
    risk: 0.10,
    water: 0.05
  };
  
  const overallScore = Math.round(
    climateScore * weights.climate +
    soilScore * weights.soil +
    marketScore * weights.market +
    profitabilityScore * weights.profitability +
    (100 - riskScore) * weights.risk + // Invert risk score
    waterScore * weights.water
  );
  
  // Calculate economics
  const economics = calculateEconomics(cropInfo, market, input.farmerPreferences);
  
  // Determine suitability levels
  const suitability = determineSuitability(cropInfo, overallScore);
  
  // Generate timing advice
  const timing = generateTimingAdvice(cropInfo, weather, input.season);
  
  // Generate requirements
  const requirements = generateRequirements(cropInfo);
  
  // Generate advantages and challenges
  const { advantages, challenges } = generateAdvantagesAndChallenges(
    cropInfo, 
    climateScore, 
    soilScore, 
    marketScore
  );
  
  // Generate specific recommendations
  const recommendations = generateSpecificRecommendations(
    cropInfo, 
    input, 
    overallScore
  );
  
  return {
    crop: {
      id: cropId,
      name: cropInfo.name,
      nameEn: cropInfo.nameEn,
      category: cropInfo.category,
      description: cropInfo.description
    },
    scores: {
      overall: overallScore,
      climateCompatibility: climateScore,
      soilSuitability: soilScore,
      marketPotential: marketScore,
      profitability: profitabilityScore,
      riskLevel: riskScore,
      waterEfficiency: waterScore
    },
    economics,
    suitability,
    timing,
    requirements,
    advantages,
    challenges,
    recommendations,
    confidence: calculateConfidence(overallScore, [climateScore, soilScore, marketScore])
  };
}

function calculateClimateCompatibility(cropInfo: any, weather: any, location: any): number {
  const currentTemp = weather?.temperature || 25;
  const tempRange = cropInfo.optimalTemp;
  
  let tempScore = 100;
  if (currentTemp < tempRange.min || currentTemp > tempRange.max) {
    const deviation = Math.min(
      Math.abs(currentTemp - tempRange.min),
      Math.abs(currentTemp - tempRange.max)
    );
    tempScore = Math.max(0, 100 - deviation * 5);
  }
  
  // Adjust for latitude (northern Egypt vs southern)
  const latitudeBonus = location.latitude > 30 ? 
    (cropInfo.plantingSeason === 'winter' ? 10 : -5) :
    (cropInfo.plantingSeason === 'summer' ? 10 : -5);
  
  return Math.min(100, Math.max(0, tempScore + latitudeBonus));
}

function calculateSoilSuitability(cropInfo: any, soilData?: any): number {
  if (!soilData?.ph) return 70; // Default score if no soil data
  
  const ph = soilData.ph;
  const optimalPH = cropInfo.optimalPH;
  
  let phScore = 100;
  if (ph < optimalPH.min || ph > optimalPH.max) {
    const deviation = Math.min(
      Math.abs(ph - optimalPH.min),
      Math.abs(ph - optimalPH.max)
    );
    phScore = Math.max(0, 100 - deviation * 20);
  }
  
  // Bonus for good nutrient levels
  let nutrientBonus = 0;
  if (soilData.nitrogen && soilData.nitrogen > 100) nutrientBonus += 5;
  if (soilData.phosphorus && soilData.phosphorus > 30) nutrientBonus += 5;
  if (soilData.potassium && soilData.potassium > 150) nutrientBonus += 5;
  
  return Math.min(100, phScore + nutrientBonus);
}

function calculateMarketPotential(market: any): number {
  if (!market) return 60; // Default score
  
  const demandScore = market.demand?.local?.percentage || 50;
  const exportScore = market.demand?.export?.percentage || 0;
  const priceStability = market.forecast?.shortTerm?.confidence || 50;
  
  return Math.round((demandScore + exportScore * 0.5 + priceStability) / 2);
}

function calculateProfitability(cropInfo: any, market: any, preferences?: any): number {
  const revenue = (market?.pricing?.currentPrice || cropInfo.basePrice) * cropInfo.baseYield;
  const cost = cropInfo.baseCost;
  const profit = revenue - cost;
  const margin = (profit / revenue) * 100;
  
  // Adjust for farmer's investment capacity
  let capacityAdjustment = 0;
  if (preferences?.investmentCapacity === 'low' && cost > 10000) {
    capacityAdjustment = -20;
  } else if (preferences?.investmentCapacity === 'high' && cost < 8000) {
    capacityAdjustment = 10;
  }
  
  return Math.min(100, Math.max(0, margin + 50 + capacityAdjustment));
}

function calculateRiskLevel(cropInfo: any, preferences?: any): number {
  let baseRisk = 30; // Default risk level
  
  // Increase risk for certain crops
  if (cropInfo.category === 'خضروات') baseRisk += 20; // Vegetables are riskier
  if (cropInfo.waterNeed === 'high' || cropInfo.waterNeed === 'very_high') baseRisk += 15;
  if (cropInfo.riskFactors?.length > 2) baseRisk += 10;
  
  // Adjust for farmer's risk tolerance
  if (preferences?.riskTolerance === 'low') {
    baseRisk += 15;
  } else if (preferences?.riskTolerance === 'high') {
    baseRisk -= 15;
  }
  
  // Adjust for experience level
  if (preferences?.experienceLevel === 'beginner') {
    baseRisk += 10;
  } else if (preferences?.experienceLevel === 'expert') {
    baseRisk -= 10;
  }
  
  return Math.min(100, Math.max(0, baseRisk));
}

function calculateWaterEfficiency(cropInfo: any, weather: any): number {
  const waterNeedMap = {
    'low': 90,
    'medium': 70,
    'high': 50,
    'very_high': 30
  };
  
  let baseScore = waterNeedMap[cropInfo.waterNeed] || 60;
  
  // Adjust for rainfall
  if (weather?.rainfall > 5) baseScore += 20;
  
  return Math.min(100, baseScore);
}

function calculateEconomics(cropInfo: any, market: any, preferences?: any) {
  const price = market?.pricing?.currentPrice || cropInfo.basePrice;
  const yield_ = cropInfo.baseYield;
  const cost = cropInfo.baseCost;
  
  const revenue = price * yield_;
  const profit = revenue - cost;
  const margin = (profit / revenue) * 100;
  const roi = (profit / cost) * 100;
  const breakEvenYield = cost / price;
  
  return {
    estimatedCostPerFeddan: cost,
    estimatedRevenuePerFeddan: Math.round(revenue),
    estimatedProfit: Math.round(profit),
    profitMargin: Math.round(margin * 10) / 10,
    breakEvenYield: Math.round(breakEvenYield * 10) / 10,
    roi: Math.round(roi * 10) / 10
  };
}

function determineSuitability(cropInfo: any, overallScore: number) {
  const riskLevel = overallScore > 80 ? 'low' : overallScore > 60 ? 'medium' : 'high';
  
  const waterRequirement = cropInfo.waterNeed === 'very_high' ? 'high' : 
                          cropInfo.waterNeed === 'high' ? 'high' :
                          cropInfo.waterNeed === 'medium' ? 'medium' : 'low';
  
  const laborRequirement = cropInfo.category === 'خضروات' ? 'high' :
                          cropInfo.category === 'محاصيل نقدية' ? 'medium' : 'low';
  
  const technologyLevel = cropInfo.category === 'خضروات' ? 'intermediate' :
                         cropInfo.category === 'محاصيل نقدية' ? 'advanced' : 'basic';
  
  return {
    riskLevel,
    waterRequirement,
    laborRequirement,
    technologyLevel
  };
}

function generateTimingAdvice(cropInfo: any, weather: any, season?: string) {
  const seasonMap = {
    winter: { planting: "أكتوبر - ديسمبر", harvest: "مارس - مايو" },
    summer: { planting: "أبريل - يونيو", harvest: "أغسطس - أكتوبر" },
    nili: { planting: "يوليو - أغسطس", harvest: "نوفمبر - ديسمبر" }
  };
  
  const timing = seasonMap[cropInfo.plantingSeason] || seasonMap.winter;
  
  let seasonalAdvice = "يُنصح بمتابعة النشرات الجوية قبل الزراعة";
  if (weather?.temperature > 30) {
    seasonalAdvice = "انتظر انخفاض درجات الحرارة قبل الزراعة";
  }
  
  return {
    bestPlantingTime: timing.planting,
    harvestTime: timing.harvest,
    growthDuration: cropInfo.growthDuration,
    seasonalAdvice
  };
}

function generateRequirements(cropInfo: any) {
  const soilPrefs = ["تربة جيدة التصريف", "غنية بالمواد العضوية"];
  if (cropInfo.optimalPH.min > 6.5) soilPrefs.push("تربة قلوية إلى متعادلة");
  if (cropInfo.optimalPH.max < 6.5) soilPrefs.push("تربة حمضية إلى متعادلة");
  
  const climateNeeds = [`درجة حرارة ${cropInfo.optimalTemp.min}-${cropInfo.optimalTemp.max}°C`];
  if (cropInfo.waterNeed === 'high') climateNeeds.push("توفر مياه ري كافية");
  
  const inputs = ["بذور معتمدة", "أسمدة متوازنة"];
  if (cropInfo.category === 'خضروات') inputs.push("مبيدات وقائية");
  
  const equipment = ["معدات حراثة أساسية"];
  if (cropInfo.waterNeed === 'high') equipment.push("نظام ري متطور");
  
  return {
    soilPreferences: soilPrefs,
    climateNeeds,
    inputs,
    equipment
  };
}

function generateAdvantagesAndChallenges(cropInfo: any, climateScore: number, soilScore: number, marketScore: number) {
  const advantages = [];
  const challenges = [];
  
  if (marketScore > 80) advantages.push("طلب سوقي قوي");
  if (climateScore > 80) advantages.push("مناخ مناسب جداً");
  if (soilScore > 80) advantages.push("ملاءمة ممتازة للتربة");
  if (cropInfo.baseYield > 3) advantages.push("إنتاجية عالية");
  
  if (marketScore < 60) challenges.push("منافسة سوقية شديدة");
  if (climateScore < 60) challenges.push("تحديات مناخية");
  if (cropInfo.waterNeed === 'high') challenges.push("احتياج مائي عالي");
  if (cropInfo.riskFactors) challenges.push(...cropInfo.riskFactors);
  
  return { advantages, challenges };
}

function generateSpecificRecommendations(cropInfo: any, input: any, overallScore: number) {
  const recommendations = [];
  
  if (overallScore > 80) {
    recommendations.push("محصول ممتاز للزراعة في موقعك");
  } else if (overallScore > 60) {
    recommendations.push("محصول جيد مع بعض الاحتياطات");
  } else {
    recommendations.push("يحتاج دراسة إضافية قبل الزراعة");
  }
  
  if (input.soilData?.ph && (input.soilData.ph < 6 || input.soilData.ph > 8)) {
    recommendations.push("ضبط درجة حموضة التربة ضروري");
  }
  
  if (cropInfo.waterNeed === 'high') {
    recommendations.push("تأكد من توفر مصدر مياه كافي");
  }
  
  if (input.farmerPreferences?.experienceLevel === 'beginner') {
    recommendations.push("استشر خبير زراعي محلي");
  }
  
  return recommendations;
}

function calculateConfidence(overallScore: number, individualScores: number[]): number {
  const variance = individualScores.reduce((sum, score) => 
    sum + Math.pow(score - overallScore, 2), 0) / individualScores.length;
  
  const consistency = Math.max(0, 100 - Math.sqrt(variance));
  return Math.round((overallScore + consistency) / 2);
}

function calculateOverallConfidence(recommendations: CropRecommendation[]): number {
  if (recommendations.length === 0) return 50;
  
  const avgConfidence = recommendations.reduce((sum, rec) => 
    sum + rec.confidence, 0) / recommendations.length;
  
  return Math.round(avgConfidence);
}

function generateAnalysis(
  input: CropRecommendationInput, 
  weather: any, 
  recommendations: CropRecommendation[]
): any {
  
  const locationAssessment = `الموقع في محافظة ${input.location.governorate || 'غير محدد'} مناسب لزراعة ${recommendations.length} محصول مختلف`;
  
  const climateAssessment = weather?.temperature > 30 ? 
    "المناخ حار نسبياً، مناسب للمحاصيل الصيفية" :
    "المناخ معتدل، مناسب للمحاصيل الشتوية";
  
  const marketAssessment = "السوق المحلي يظهر طلباً جيداً على معظم المحاصيل المقترحة";
  
  const riskAssessment = recommendations[0]?.scores.riskLevel < 40 ? 
    "مستوى المخاطر منخفض للمحاصيل المقترحة" :
    "ينصح بتقييم المخاطر بعناية";
  
  let soilAssessment = "بيانات الت��بة غير متوفرة";
  if (input.soilData?.ph) {
    soilAssessment = input.soilData.ph >= 6 && input.soilData.ph <= 7.5 ? 
      "التربة مناسبة لمعظم المحاصيل" :
      "قد تحتاج التربة لتعديل درجة الحموضة";
  }
  
  return {
    locationAssessment,
    soilAssessment,
    climateAssessment,
    marketAssessment,
    riskAssessment
  };
}

async function simulateWeatherData(location: any) {
  // Simulate weather API call
  return {
    temperature: 25 + Math.random() * 10,
    humidity: 60 + Math.random() * 20,
    rainfall: Math.random() * 5
  };
}

async function simulateMarketData() {
  // Simulate market API call
  return {
    wheat: { pricing: { currentPrice: 850 }, demand: { local: { percentage: 95 } } },
    tomato: { pricing: { currentPrice: 4.5 }, demand: { local: { percentage: 90 } } },
    corn: { pricing: { currentPrice: 680 }, demand: { local: { percentage: 98 } } },
    potato: { pricing: { currentPrice: 3.2 }, demand: { local: { percentage: 85 } } },
    cotton: { pricing: { currentPrice: 25000 }, demand: { local: { percentage: 40 } } },
    rice: { pricing: { currentPrice: 1200 }, demand: { local: { percentage: 100 } } }
  };
}
