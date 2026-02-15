import express from 'express';

const router = express.Router();

// Types and interfaces for smart crop suggestions
interface SoilProfile {
  ph: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  organicMatter: number;
  electricalConductivity: number;
  moisture: number;
  texture: 'clay' | 'sandy' | 'loamy' | 'silty';
  drainage: 'excellent' | 'good' | 'fair' | 'poor';
  depth: number; // cm
}

interface ClimateData {
  region: string;
  zone: 'arid' | 'semi-arid' | 'mediterranean' | 'subtropical';
  avgTemperature: number;
  minTemperature: number;
  maxTemperature: number;
  annualRainfall: number;
  humidity: number;
  windSpeed: number;
  frostDays: number;
  season: 'winter' | 'spring' | 'summer' | 'autumn';
}

interface FarmerGoals {
  primary: 'profit' | 'organic' | 'sustainability' | 'quick_turnover' | 'export';
  budget: number;
  experience: 'beginner' | 'intermediate' | 'expert';
  marketPreference: 'local' | 'national' | 'export';
  riskTolerance: 'low' | 'medium' | 'high';
  waterAvailability: 'abundant' | 'moderate' | 'limited';
}

interface CropRecommendation {
  id: string;
  name: string;
  scientificName: string;
  variety: string;
  overallScore: number;
  compatibility: {
    soil: number;
    climate: number;
    market: number;
    farmer: number;
  };
  estimates: {
    yield: number; // tons per hectare
    revenue: number; // TND per hectare
    costs: number; // TND per hectare
    profit: number; // TND per hectare
    roi: number; // percentage
    paybackPeriod: number; // months
  };
  requirements: {
    plantingDate: string;
    harvestDate: string;
    waterNeed: number; // mm per season
    fertilizer: string[];
    spacing: string;
    depth: number; // cm
  };
  risks: string[];
  advantages: string[];
  marketTrends: {
    currentPrice: number;
    priceStability: 'stable' | 'volatile' | 'rising' | 'declining';
    demand: 'high' | 'medium' | 'low';
    competitionLevel: 'low' | 'medium' | 'high';
  };
  sustainability: {
    soilHealth: number; // impact score
    waterEfficiency: number;
    biodiversity: number;
    carbonFootprint: number;
  };
}

interface RotationPlan {
  id: string;
  title: string;
  duration: number; // years
  phases: {
    year: number;
    season: string;
    crop: string;
    purpose: 'main' | 'cover' | 'legume' | 'fallow';
    benefits: string[];
  }[];
  benefits: string[];
  estimatedProfit: number;
  soilImprovementScore: number;
}

// Tunisian crop database with comprehensive data
const TUNISIAN_CROPS_DATABASE = {
  wheat: {
    name: 'القمح الصلب',
    scientificName: 'Triticum durum',
    varieties: ['كريم', 'نصر', 'مجد', 'خير'],
    soilRequirements: {
      ph: { min: 6.0, max: 7.5, optimal: 6.8 },
      nitrogen: { min: 60, max: 120, optimal: 90 },
      phosphorus: { min: 20, max: 40, optimal: 30 },
      potassium: { min: 80, max: 150, optimal: 120 },
      texture: ['clay', 'loamy'],
      drainage: ['good', 'excellent'],
      depth: { min: 30, optimal: 60 }
    },
    climateRequirements: {
      temperature: { min: 5, max: 25, optimal: 15 },
      rainfall: { min: 300, max: 600, optimal: 450 },
      zone: ['mediterranean', 'semi-arid'],
      season: 'winter'
    },
    economics: {
      baseYield: 3.5, // tons/hectare
      basePrice: 800, // TND/ton
      productionCost: 1200, // TND/hectare
      waterRequirement: 400, // mm
      growthPeriod: 6 // months
    },
    benefits: [
      'محصول أساسي مضمون التسويق',
      'يتحمل الجفاف والصقيع',
      'يحسن بنية التربة',
      'مقاوم للأمراض الشائعة'
    ],
    risks: [
      'حساس للإفراط في الري',
      'يحتاج صرف جيد',
      'متأثر بالرياح القوية'
    ]
  },
  olive: {
    name: 'الزيتون',
    scientificName: 'Olea europaea',
    varieties: ['الشملالي', 'الشتوي', 'الزلماط', 'الجربوعي'],
    soilRequirements: {
      ph: { min: 6.5, max: 8.5, optimal: 7.5 },
      nitrogen: { min: 40, max: 80, optimal: 60 },
      phosphorus: { min: 15, max: 30, optimal: 20 },
      potassium: { min: 200, max: 400, optimal: 300 },
      texture: ['clay', 'loamy', 'sandy'],
      drainage: ['excellent', 'good'],
      depth: { min: 60, optimal: 120 }
    },
    climateRequirements: {
      temperature: { min: -5, max: 40, optimal: 20 },
      rainfall: { min: 200, max: 800, optimal: 500 },
      zone: ['mediterranean', 'semi-arid'],
      season: 'perennial'
    },
    economics: {
      baseYield: 8, // tons/hectare
      basePrice: 2500, // TND/ton
      productionCost: 3000, // TND/hectare
      waterRequirement: 500, // mm
      growthPeriod: 84 // months (7 years to full production)
    },
    benefits: [
      'استثمار طويل الأمد مربح',
      'يتحمل الجفاف والملوحة',
      'منتج عالي القيمة',
      'مناسب للتصدير'
    ],
    risks: [
      'استثمار أولي مرتفع',
      'يحتاج وقت طويل للإنتاج',
      'حساس للصقيع المتأخر'
    ]
  },
  tomato: {
    name: 'الطماطم',
    scientificName: 'Solanum lycopersicum',
    varieties: ['ريو غراند', 'سان مارزانو', 'شيروكي', 'برقوق'],
    soilRequirements: {
      ph: { min: 6.0, max: 7.0, optimal: 6.5 },
      nitrogen: { min: 80, max: 150, optimal: 120 },
      phosphorus: { min: 30, max: 60, optimal: 45 },
      potassium: { min: 200, max: 400, optimal: 300 },
      texture: ['loamy', 'sandy'],
      drainage: ['excellent', 'good'],
      depth: { min: 40, optimal: 80 }
    },
    climateRequirements: {
      temperature: { min: 15, max: 30, optimal: 22 },
      rainfall: { min: 400, max: 800, optimal: 600 },
      zone: ['mediterranean', 'subtropical'],
      season: 'summer'
    },
    economics: {
      baseYield: 60, // tons/hectare
      basePrice: 800, // TND/ton
      productionCost: 8000, // TND/hectare
      waterRequirement: 600, // mm
      growthPeriod: 4 // months
    },
    benefits: [
      'دورة إنتاج سريعة',
      'طلب محلي مرتفع',
      'إمكانية زراعة محمية',
      'ربح سريع'
    ],
    risks: [
      'حساس للأمراض الفطرية',
      'يحتاج ري منتظم',
      'متطلبات عمالة مكثفة'
    ]
  },
  citrus: {
    name: 'الحمضيات',
    scientificName: 'Citrus spp.',
    varieties: ['البرتقال', 'الليمون', 'اليوسفي', 'الجريب فروت'],
    soilRequirements: {
      ph: { min: 6.0, max: 7.5, optimal: 6.8 },
      nitrogen: { min: 100, max: 200, optimal: 150 },
      phosphorus: { min: 25, max: 50, optimal: 35 },
      potassium: { min: 300, max: 600, optimal: 450 },
      texture: ['loamy', 'sandy'],
      drainage: ['excellent'],
      depth: { min: 80, optimal: 150 }
    },
    climateRequirements: {
      temperature: { min: 0, max: 35, optimal: 25 },
      rainfall: { min: 600, max: 1200, optimal: 900 },
      zone: ['mediterranean', 'subtropical'],
      season: 'perennial'
    },
    economics: {
      baseYield: 25, // tons/hectare
      basePrice: 1200, // TND/ton
      productionCost: 5000, // TND/hectare
      waterRequirement: 800, // mm
      growthPeriod: 48 // months (4 years to production)
    },
    benefits: [
      'محصول مربح ومطلوب',
      'إمكانية تصدير عالية',
      'إنتاج على مدار السنة',
      'قيمة غذائية عالية'
    ],
    risks: [
      'حساس للصقيع',
      'يحتاج ري منتظم',
      'استثمار أولي مرتفع'
    ]
  },
  potato: {
    name: 'البطاطا',
    scientificName: 'Solanum tuberosum',
    varieties: ['سبونتا', 'ديزيري', 'مونديال', 'أطلس'],
    soilRequirements: {
      ph: { min: 5.5, max: 6.5, optimal: 6.0 },
      nitrogen: { min: 60, max: 120, optimal: 90 },
      phosphorus: { min: 40, max: 80, optimal: 60 },
      potassium: { min: 150, max: 300, optimal: 225 },
      texture: ['sandy', 'loamy'],
      drainage: ['excellent', 'good'],
      depth: { min: 30, optimal: 50 }
    },
    climateRequirements: {
      temperature: { min: 10, max: 25, optimal: 18 },
      rainfall: { min: 400, max: 700, optimal: 550 },
      zone: ['mediterranean'],
      season: 'winter'
    },
    economics: {
      baseYield: 30, // tons/hectare
      basePrice: 600, // TND/ton
      productionCost: 4000, // TND/hectare
      waterRequirement: 500, // mm
      growthPeriod: 3 // months
    },
    benefits: [
      'دورة قصيرة وربح سريع',
      'طلب محلي مستقر',
      'إمكانية زراعتين في السنة',
      'مقاوم للظروف المعتدلة'
    ],
    risks: [
      'حساس للحرارة المرتفعة',
      'يحتاج تربة خفيفة',
      'متأثر بأمراض التربة'
    ]
  },
  pepper: {
    name: 'الفلفل الحار',
    scientificName: 'Capsicum annuum',
    varieties: ['هلابينو', 'سيرانو', 'كايين', 'بابريكا'],
    soilRequirements: {
      ph: { min: 6.0, max: 7.0, optimal: 6.5 },
      nitrogen: { min: 70, max: 130, optimal: 100 },
      phosphorus: { min: 35, max: 70, optimal: 50 },
      potassium: { min: 180, max: 350, optimal: 265 },
      texture: ['loamy', 'sandy'],
      drainage: ['excellent', 'good'],
      depth: { min: 35, optimal: 70 }
    },
    climateRequirements: {
      temperature: { min: 18, max: 32, optimal: 25 },
      rainfall: { min: 500, max: 900, optimal: 700 },
      zone: ['mediterranean', 'subtropical'],
      season: 'summer'
    },
    economics: {
      baseYield: 15, // tons/hectare
      basePrice: 3000, // TND/ton
      productionCost: 6000, // TND/hectare
      waterRequirement: 650, // mm
      growthPeriod: 5 // months
    },
    benefits: [
      'قيمة اقتصادية عالية',
      'طلب متزايد للتصدير',
      'مقاوم للحشرات نسبياً',
      'يمكن التجفيف والحفظ'
    ],
    risks: [
      'حساس للبرد',
      'يحتاج حماية من الرياح',
      'متطلبات مائية عالية'
    ]
  }
};

// AI-powered crop scoring algorithm
class SmartCropRecommendationEngine {
  private cropsDB = TUNISIAN_CROPS_DATABASE;

  public generateRecommendations(
    soilProfile: SoilProfile,
    climateData: ClimateData,
    farmerGoals: FarmerGoals,
    dataSource: 'manual' | 'iot' = 'manual'
  ): CropRecommendation[] {
    const recommendations: CropRecommendation[] = [];

    Object.entries(this.cropsDB).forEach(([cropId, cropData]) => {
      const scores = this.calculateCompatibilityScores(cropData, soilProfile, climateData, farmerGoals);
      const estimates = this.calculateEconomicEstimates(cropData, soilProfile, climateData, farmerGoals);
      const marketTrends = this.getMarketTrends(cropId);
      const sustainability = this.calculateSustainabilityScore(cropData, soilProfile);

      // Select best variety for this crop
      const bestVariety = this.selectBestVariety(cropData, soilProfile, climateData);

      recommendations.push({
        id: cropId,
        name: cropData.name,
        scientificName: cropData.scientificName,
        variety: bestVariety,
        overallScore: this.calculateOverallScore(scores),
        compatibility: scores,
        estimates,
        requirements: this.generateRequirements(cropData, climateData),
        risks: this.assessRisks(cropData, soilProfile, climateData),
        advantages: this.identifyAdvantages(cropData, soilProfile, climateData, farmerGoals),
        marketTrends,
        sustainability
      });
    });

    // Sort by overall score and return top recommendations
    return recommendations
      .sort((a, b) => b.overallScore - a.overallScore)
      .slice(0, 6);
  }

  private calculateCompatibilityScores(
    cropData: any,
    soil: SoilProfile,
    climate: ClimateData,
    goals: FarmerGoals
  ): { soil: number; climate: number; market: number; farmer: number } {
    // Soil compatibility score
    const soilScore = this.calculateSoilCompatibility(cropData, soil);
    
    // Climate compatibility score
    const climateScore = this.calculateClimateCompatibility(cropData, climate);
    
    // Market compatibility score
    const marketScore = this.calculateMarketCompatibility(cropData, goals);
    
    // Farmer goals compatibility score
    const farmerScore = this.calculateFarmerCompatibility(cropData, goals);

    return {
      soil: Math.round(soilScore),
      climate: Math.round(climateScore),
      market: Math.round(marketScore),
      farmer: Math.round(farmerScore)
    };
  }

  private calculateSoilCompatibility(cropData: any, soil: SoilProfile): number {
    let score = 0;
    let factors = 0;

    // pH compatibility
    const phReq = cropData.soilRequirements.ph;
    if (soil.ph >= phReq.min && soil.ph <= phReq.max) {
      score += 100;
    } else {
      const deviation = Math.min(
        Math.abs(soil.ph - phReq.min),
        Math.abs(soil.ph - phReq.max)
      );
      score += Math.max(0, 100 - (deviation * 20));
    }
    factors++;

    // Nutrient compatibility
    ['nitrogen', 'phosphorus', 'potassium'].forEach(nutrient => {
      const req = cropData.soilRequirements[nutrient];
      const soilValue = soil[nutrient as keyof SoilProfile] as number;
      
      if (soilValue >= req.min && soilValue <= req.max) {
        score += 100;
      } else if (soilValue < req.min) {
        const deficit = req.min - soilValue;
        score += Math.max(0, 100 - (deficit / req.min * 100));
      } else {
        const excess = soilValue - req.max;
        score += Math.max(0, 100 - (excess / req.max * 50)); // Excess is less penalized
      }
      factors++;
    });

    // Texture compatibility
    if (cropData.soilRequirements.texture.includes(soil.texture)) {
      score += 100;
    } else {
      score += 50; // Partial compatibility
    }
    factors++;

    // Drainage compatibility
    if (cropData.soilRequirements.drainage.includes(soil.drainage)) {
      score += 100;
    } else {
      score += 30;
    }
    factors++;

    return score / factors;
  }

  private calculateClimateCompatibility(cropData: any, climate: ClimateData): number {
    let score = 0;
    let factors = 0;

    // Temperature compatibility
    const tempReq = cropData.climateRequirements.temperature;
    if (climate.avgTemperature >= tempReq.min && climate.avgTemperature <= tempReq.max) {
      score += 100;
    } else {
      const deviation = Math.min(
        Math.abs(climate.avgTemperature - tempReq.min),
        Math.abs(climate.avgTemperature - tempReq.max)
      );
      score += Math.max(0, 100 - (deviation * 5));
    }
    factors++;

    // Rainfall compatibility
    const rainReq = cropData.climateRequirements.rainfall;
    if (climate.annualRainfall >= rainReq.min && climate.annualRainfall <= rainReq.max) {
      score += 100;
    } else if (climate.annualRainfall < rainReq.min) {
      const deficit = rainReq.min - climate.annualRainfall;
      score += Math.max(0, 100 - (deficit / rainReq.min * 100));
    } else {
      score += 80; // Excess rain is manageable with drainage
    }
    factors++;

    // Zone compatibility
    if (cropData.climateRequirements.zone.includes(climate.zone)) {
      score += 100;
    } else {
      score += 40;
    }
    factors++;

    // Season compatibility
    if (cropData.climateRequirements.season === climate.season || 
        cropData.climateRequirements.season === 'perennial') {
      score += 100;
    } else {
      score += 30;
    }
    factors++;

    return score / factors;
  }

  private calculateMarketCompatibility(cropData: any, goals: FarmerGoals): number {
    let score = 50; // Base score

    // Price stability and demand simulation
    const marketFactors = {
      wheat: { stability: 90, demand: 95, export: 60 },
      olive: { stability: 85, demand: 80, export: 95 },
      tomato: { stability: 60, demand: 90, export: 40 },
      citrus: { stability: 75, demand: 70, export: 85 },
      potato: { stability: 70, demand: 85, export: 30 },
      pepper: { stability: 65, demand: 75, export: 80 }
    };

    const cropMarket = marketFactors[cropData.name as keyof typeof marketFactors];
    if (cropMarket) {
      score = cropMarket.stability * 0.4 + cropMarket.demand * 0.4;
      
      if (goals.marketPreference === 'export') {
        score = score * 0.6 + cropMarket.export * 0.4;
      }
    }

    return Math.min(100, score);
  }

  private calculateFarmerCompatibility(cropData: any, goals: FarmerGoals): number {
    let score = 50;

    // Budget compatibility
    const requiredBudget = cropData.economics.productionCost;
    if (goals.budget >= requiredBudget) {
      score += 25;
    } else {
      const budgetRatio = goals.budget / requiredBudget;
      score += budgetRatio * 25;
    }

    // Experience compatibility
    const experienceScore = {
      wheat: { beginner: 90, intermediate: 95, expert: 85 },
      olive: { beginner: 40, intermediate: 70, expert: 95 },
      tomato: { beginner: 60, intermediate: 85, expert: 90 },
      citrus: { beginner: 30, intermediate: 60, expert: 90 },
      potato: { beginner: 80, intermediate: 90, expert: 85 },
      pepper: { beginner: 55, intermediate: 75, expert: 85 }
    };

    const expScore = experienceScore[cropData.name as keyof typeof experienceScore];
    if (expScore) {
      score += (expScore[goals.experience] - 50) * 0.3;
    }

    // Goal alignment
    if (goals.primary === 'profit' && cropData.economics.basePrice > 1000) {
      score += 15;
    }
    if (goals.primary === 'quick_turnover' && cropData.economics.growthPeriod <= 6) {
      score += 15;
    }
    if (goals.primary === 'organic' && ['wheat', 'olive'].includes(cropData.name)) {
      score += 15;
    }

    return Math.min(100, Math.max(0, score));
  }

  private calculateOverallScore(scores: { soil: number; climate: number; market: number; farmer: number }): number {
    // Weighted average with soil and climate being most important
    return Math.round(
      scores.soil * 0.35 +
      scores.climate * 0.30 +
      scores.market * 0.20 +
      scores.farmer * 0.15
    );
  }

  private calculateEconomicEstimates(
    cropData: any,
    soil: SoilProfile,
    climate: ClimateData,
    goals: FarmerGoals
  ) {
    const baseYield = cropData.economics.baseYield;
    const basePrice = cropData.economics.basePrice;
    const baseCost = cropData.economics.productionCost;

    // Adjust yield based on soil and climate conditions
    const soilFactor = this.calculateSoilCompatibility(cropData, soil) / 100;
    const climateFactor = this.calculateClimateCompatibility(cropData, climate) / 100;
    
    const adjustedYield = baseYield * soilFactor * climateFactor;
    const adjustedPrice = basePrice * (0.9 + Math.random() * 0.2); // Market variability
    
    const revenue = adjustedYield * adjustedPrice;
    const costs = baseCost * (0.9 + Math.random() * 0.2); // Cost variability
    const profit = revenue - costs;
    const roi = (profit / costs) * 100;
    const paybackPeriod = Math.ceil(costs / (profit / 12));

    return {
      yield: Math.round(adjustedYield * 10) / 10,
      revenue: Math.round(revenue),
      costs: Math.round(costs),
      profit: Math.round(profit),
      roi: Math.round(roi * 10) / 10,
      paybackPeriod: Math.max(1, paybackPeriod)
    };
  }

  private generateRequirements(cropData: any, climate: ClimateData) {
    const currentDate = new Date();
    const season = climate.season;
    
    // Calculate planting and harvest dates based on season and crop
    let plantingDate = new Date(currentDate);
    let harvestDate = new Date(currentDate);

    if (season === 'winter') {
      plantingDate = new Date(currentDate.getFullYear(), 10, 1); // November
      harvestDate = new Date(currentDate.getFullYear() + 1, 4, 30); // May
    } else if (season === 'summer') {
      plantingDate = new Date(currentDate.getFullYear(), 2, 1); // March
      harvestDate = new Date(currentDate.getFullYear(), 6, 30); // July
    }

    harvestDate.setMonth(harvestDate.getMonth() + cropData.economics.growthPeriod);

    return {
      plantingDate: plantingDate.toISOString().split('T')[0],
      harvestDate: harvestDate.toISOString().split('T')[0],
      waterNeed: cropData.economics.waterRequirement,
      fertilizer: this.getRecommendedFertilizers(cropData),
      spacing: this.getPlantingSpacing(cropData),
      depth: cropData.soilRequirements.depth.optimal || 30
    };
  }

  private getRecommendedFertilizers(cropData: any): string[] {
    const baseList = ['NPK 20-20-20', 'يوريا 46%', 'سوبر فوسفات'];
    
    if (cropData.name === 'olive') {
      baseList.push('سماد عضوي', 'كبريت زراعي');
    } else if (cropData.name === 'tomato') {
      baseList.push('نترات الكالسيوم', 'سلفات المغنيسيوم');
    } else if (cropData.name === 'wheat') {
      baseList.push('سلفات الأمونيوم');
    }

    return baseList.slice(0, 3);
  }

  private getPlantingSpacing(cropData: any): string {
    const spacings = {
      wheat: '20 سم بين النباتات، 25 سم بين الصفوف',
      olive: '6×6 متر للأشجار الصغيرة',
      tomato: '40 سم بين النباتات، 80 سم بين الصفوف',
      citrus: '5×5 متر للأشجار',
      potato: '30 سم بين النباتات، 70 سم بين الصفوف',
      pepper: '35 سم بين النباتات، 60 سم بين الصفوف'
    };

    return spacings[cropData.name as keyof typeof spacings] || '30 سم بين النباتات';
  }

  private assessRisks(cropData: any, soil: SoilProfile, climate: ClimateData): string[] {
    const risks = [...cropData.risks];

    // Add climate-specific risks
    if (climate.avgTemperature > 30) {
      risks.push('خطر الإجهاد الحراري');
    }
    if (climate.annualRainfall < 300) {
      risks.push('نقص المياه والجفاف');
    }
    if (soil.drainage === 'poor') {
      risks.push('خطر تعفن الجذور من سوء الصرف');
    }
    if (soil.electricalConductivity > 4) {
      risks.push('تأثير الملوحة على النمو');
    }

    return risks.slice(0, 4);
  }

  private identifyAdvantages(
    cropData: any,
    soil: SoilProfile,
    climate: ClimateData,
    goals: FarmerGoals
  ): string[] {
    const advantages = [...cropData.benefits];

    // Add specific advantages based on conditions
    if (this.calculateSoilCompatibility(cropData, soil) > 80) {
      advantages.push('التربة مثالية لهذا المحصول');
    }
    if (this.calculateClimateCompatibility(cropData, climate) > 85) {
      advantages.push('المناخ ممتاز للزراعة');
    }
    if (goals.waterAvailability === 'limited' && cropData.economics.waterRequirement < 500) {
      advantages.push('متطلبات مائية منخفضة');
    }
    if (goals.budget >= cropData.economics.productionCost * 1.5) {
      advantages.push('ميزانية كافية للزراعة المثلى');
    }

    return advantages.slice(0, 5);
  }

  private getMarketTrends(cropId: string) {
    const trends = {
      wheat: {
        currentPrice: 850,
        priceStability: 'stable' as const,
        demand: 'high' as const,
        competitionLevel: 'medium' as const
      },
      olive: {
        currentPrice: 2800,
        priceStability: 'rising' as const,
        demand: 'high' as const,
        competitionLevel: 'low' as const
      },
      tomato: {
        currentPrice: 900,
        priceStability: 'volatile' as const,
        demand: 'high' as const,
        competitionLevel: 'high' as const
      },
      citrus: {
        currentPrice: 1400,
        priceStability: 'stable' as const,
        demand: 'medium' as const,
        competitionLevel: 'medium' as const
      },
      potato: {
        currentPrice: 650,
        priceStability: 'volatile' as const,
        demand: 'high' as const,
        competitionLevel: 'high' as const
      },
      pepper: {
        currentPrice: 3200,
        priceStability: 'rising' as const,
        demand: 'medium' as const,
        competitionLevel: 'low' as const
      }
    };

    return trends[cropId as keyof typeof trends] || trends.wheat;
  }

  private calculateSustainabilityScore(cropData: any, soil: SoilProfile) {
    const sustainability = {
      soilHealth: 70 + Math.random() * 20,
      waterEfficiency: 80 - (cropData.economics.waterRequirement / 1000) * 50,
      biodiversity: ['olive', 'citrus'].includes(cropData.name) ? 85 : 65,
      carbonFootprint: cropData.economics.growthPeriod > 12 ? 90 : 70
    };

    // Adjust based on soil organic matter
    if (soil.organicMatter > 3) {
      sustainability.soilHealth += 10;
    }

    return {
      soilHealth: Math.round(Math.min(100, sustainability.soilHealth)),
      waterEfficiency: Math.round(Math.max(0, sustainability.waterEfficiency)),
      biodiversity: Math.round(sustainability.biodiversity),
      carbonFootprint: Math.round(sustainability.carbonFootprint)
    };
  }

  private selectBestVariety(cropData: any, soil: SoilProfile, climate: ClimateData): string {
    if (cropData.varieties && cropData.varieties.length > 0) {
      // Simple selection based on climate and soil - can be made more sophisticated
      if (climate.zone === 'arid' && cropData.varieties.includes('مقاوم للجفاف')) {
        return 'الصنف المقاوم للجفاف';
      }
      return cropData.varieties[0]; // Return first variety as default
    }
    return 'الصنف المحلي المحسن';
  }

  public generateRotationPlans(soilProfile: SoilProfile, climateData: ClimateData): RotationPlan[] {
    const plans: RotationPlan[] = [];

    // 2-year rotation plan
    plans.push({
      id: 'rotation_2year',
      title: 'دورة زراعية ثنائية السنوات',
      duration: 2,
      phases: [
        {
          year: 1,
          season: 'شتاء',
          crop: 'القمح الصلب',
          purpose: 'main',
          benefits: ['إنتاج رئيسي', 'تحسين بنية التربة']
        },
        {
          year: 1,
          season: 'صيف',
          crop: 'البقوليات',
          purpose: 'legume',
          benefits: ['تثبيت النيتروجين', 'كسر دورة الآفات']
        },
        {
          year: 2,
          season: 'شتاء',
          crop: 'البطاطا',
          purpose: 'main',
          benefits: ['ربح سريع', 'تحسين تهوية التربة']
        },
        {
          year: 2,
          season: 'صيف',
          crop: 'الطماطم',
          purpose: 'main',
          benefits: ['دخل مرتفع', 'استغلال الأسمدة ��لمتبقية']
        }
      ],
      benefits: [
        'توازن في العناصر الغذائية',
        'تقليل الآفات والأمراض',
        'تحسين خصوبة التربة',
        'تنويع مصادر الدخل'
      ],
      estimatedProfit: 8500,
      soilImprovementScore: 85
    });

    // 3-year rotation plan
    plans.push({
      id: 'rotation_3year',
      title: 'دورة زراعية ثلاثية السنوات',
      duration: 3,
      phases: [
        {
          year: 1,
          season: 'شتاء',
          crop: 'القمح الصلب',
          purpose: 'main',
          benefits: ['محصول أساسي', 'استقرار الدخل']
        },
        {
          year: 2,
          season: 'شتاء',
          crop: 'البقوليات',
          purpose: 'legume',
          benefits: ['تثبيت النيتروجين', 'راحة للتربة']
        },
        {
          year: 2,
          season: 'صيف',
          crop: 'البطاطا',
          purpose: 'main',
          benefits: ['ربح إضافي', 'تحسين التربة']
        },
        {
          year: 3,
          season: 'شتاء',
          crop: 'الفلفل الحار',
          purpose: 'main',
          benefits: ['قيمة عا��ية', 'تصدير محتمل']
        }
      ],
      benefits: [
        'تحسن كبير في خصوبة التربة',
        'تنويع المخاطر',
        'زيادة الربحية طويلة المدى',
        'استدامة بيئية'
      ],
      estimatedProfit: 12000,
      soilImprovementScore: 92
    });

    return plans;
  }
}

// Initialize the recommendation engine
const recommendationEngine = new SmartCropRecommendationEngine();

// API Routes

// Get crop recommendations
router.post('/recommendations', (req, res) => {
  try {
    const {
      soilProfile,
      climateData,
      farmerGoals,
      dataSource = 'manual'
    } = req.body;

    // Validate required data
    if (!soilProfile || !climateData || !farmerGoals) {
      return res.status(400).json({
        success: false,
        message: 'بيانات التربة والمناخ وأهداف المزارع مطلوبة'
      });
    }

    const recommendations = recommendationEngine.generateRecommendations(
      soilProfile,
      climateData,
      farmerGoals,
      dataSource
    );

    res.json({
      success: true,
      data: {
        recommendations,
        analysisDate: new Date().toISOString(),
        dataSource,
        summary: {
          totalCrops: recommendations.length,
          averageScore: Math.round(
            recommendations.reduce((sum, r) => sum + r.overallScore, 0) / recommendations.length
          ),
          highCompatibility: recommendations.filter(r => r.overallScore >= 80).length,
          estimatedTotalProfit: recommendations.reduce((sum, r) => sum + r.estimates.profit, 0)
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ في إنشاء توصيات المحاصيل',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get rotation plans
router.post('/rotation-plans', (req, res) => {
  try {
    const { soilProfile, climateData } = req.body;

    if (!soilProfile || !climateData) {
      return res.status(400).json({
        success: false,
        message: 'بيانات التربة والمناخ مطلوبة'
      });
    }

    const rotationPlans = recommendationEngine.generateRotationPlans(soilProfile, climateData);

    res.json({
      success: true,
      data: {
        plans: rotationPlans,
        analysisDate: new Date().toISOString(),
        summary: {
          totalPlans: rotationPlans.length,
          averageProfit: Math.round(
            rotationPlans.reduce((sum, plan) => sum + plan.estimatedProfit, 0) / rotationPlans.length
          ),
          averageSoilImprovement: Math.round(
            rotationPlans.reduce((sum, plan) => sum + plan.soilImprovementScore, 0) / rotationPlans.length
          )
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ في إنشاء خطط الدورة الزراعية',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get crop database
router.get('/crop-database', (req, res) => {
  try {
    const { category, region } = req.query;

    let crops = Object.entries(TUNISIAN_CROPS_DATABASE).map(([id, crop]) => ({
      id,
      name: crop.name,
      scientificName: crop.scientificName,
      varieties: crop.varieties,
      baseYield: crop.economics.baseYield,
      basePrice: crop.economics.basePrice,
      growthPeriod: crop.economics.growthPeriod,
      waterRequirement: crop.economics.waterRequirement,
      season: crop.climateRequirements.season
    }));

    // Apply filters if provided
    if (category) {
      // Filter by category (e.g., cereals, vegetables, fruits)
      const categories = {
        cereals: ['wheat'],
        fruits: ['olive', 'citrus'],
        vegetables: ['tomato', 'potato', 'pepper']
      };
      
      const categoryIds = categories[category as keyof typeof categories] || [];
      crops = crops.filter(crop => categoryIds.includes(crop.id));
    }

    res.json({
      success: true,
      data: {
        crops,
        totalCrops: crops.length,
        categories: [
          { id: 'cereals', name: 'الحبوب', count: 1 },
          { id: 'fruits', name: 'الفواكه', count: 2 },
          { id: 'vegetables', name: 'الخضروات', count: 3 }
        ]
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ في استرجاع قاعدة بيانات المحاصيل',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get market analysis for specific crop
router.get('/market-analysis/:cropId', (req, res) => {
  try {
    const { cropId } = req.params;

    // Generate mock market analysis
    const analysis = {
      cropId,
      currentPrice: 800 + Math.random() * 1000,
      priceHistory: Array.from({ length: 12 }, (_, i) => ({
        month: new Date(Date.now() - (11 - i) * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        price: 800 + Math.random() * 400
      })),
      demand: {
        local: 70 + Math.random() * 30,
        national: 60 + Math.random() * 40,
        export: 50 + Math.random() * 50
      },
      competition: {
        level: 'medium',
        mainCompetitors: ['المغرب', 'الجزائر', 'مصر'],
        marketShare: 15 + Math.random() * 20
      },
      forecast: {
        nextSeason: 'positive',
        priceDirection: 'stable',
        confidenceLevel: 75 + Math.random() * 20
      }
    };

    res.json({
      success: true,
      data: analysis
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ في تحليل السوق',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
