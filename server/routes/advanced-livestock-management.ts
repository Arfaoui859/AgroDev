import { Request, Response } from 'express';

// Advanced Livestock Data Interfaces
interface Animal {
  id: string;
  farmId: string;
  earTag: string;
  rfidTag?: string;
  name?: string;
  species: 'cattle' | 'sheep' | 'goat' | 'chicken' | 'turkey' | 'duck';
  breed: string;
  gender: 'male' | 'female';
  birthDate: string;
  weight: number;
  status: 'healthy' | 'sick' | 'pregnant' | 'lactating' | 'dry' | 'quarantine' | 'sold' | 'deceased';
  parentIds?: { father?: string; mother?: string };
  acquisitionDate: string;
  acquisitionType: 'birth' | 'purchase' | 'gift' | 'inheritance';
  currentLocation: string;
  notes?: string;
  images?: string[];
  geneticData?: GeneticProfile;
  healthHistory: HealthRecord[];
  breedingHistory: BreedingRecord[];
  productionHistory: ProductionRecord[];
}

interface GeneticProfile {
  bloodline: string;
  geneticMarkers: Record<string, string>;
  heritabilityTraits: {
    milkProduction?: number;
    eggProduction?: number;
    growthRate?: number;
    diseaseResistance?: number;
    fertilityRate?: number;
    meatQuality?: number;
  };
  inbreedingCoefficient: number;
  parentalLineage: string[];
}

interface HealthRecord {
  id: string;
  animalId: string;
  date: string;
  type: 'vaccination' | 'medication' | 'checkup' | 'illness' | 'injury' | 'surgery' | 'death';
  condition?: string;
  symptoms?: string[];
  temperature?: number;
  weight?: number;
  heartRate?: number;
  respiratoryRate?: number;
  treatment?: string;
  medication?: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    cost: number;
  };
  veterinarian?: string;
  cost?: number;
  notes?: string;
  followUpDate?: string;
  severity: 'mild' | 'moderate' | 'severe' | 'critical';
  outcome: 'recovered' | 'ongoing' | 'deceased' | 'chronic';
  aiRiskScore?: number;
  predictedComplications?: string[];
}

interface BreedingRecord {
  id: string;
  motherId: string;
  fatherId?: string;
  breedingDate: string;
  breedingMethod: 'natural' | 'artificial_insemination' | 'embryo_transfer';
  pregnancyConfirmed: boolean;
  pregnancyConfirmationDate?: string;
  expectedDueDate?: string;
  actualBirthDate?: string;
  offspring?: {
    id: string;
    gender: 'male' | 'female';
    birthWeight: number;
    healthStatus: 'healthy' | 'weak' | 'deceased';
  }[];
  complications?: string[];
  veterinaryAssistance: boolean;
  cost: number;
  success: boolean;
  aiBreedingScore?: number;
  geneticCompatibility?: number;
}

interface ProductionRecord {
  id: string;
  animalId: string;
  date: string;
  type: 'milk' | 'eggs' | 'wool' | 'meat' | 'offspring';
  quantity: number;
  unit: 'liters' | 'kg' | 'pieces' | 'grams';
  quality: 'A' | 'B' | 'C' | 'rejected';
  price?: number;
  revenue?: number;
  notes?: string;
}

interface FeedRecord {
  id: string;
  animalId?: string;
  groupId?: string;
  date: string;
  feedType: string;
  quantity: number;
  unit: 'kg' | 'liters' | 'bales' | 'bags';
  nutritionalContent: {
    protein: number;
    carbohydrates: number;
    fat: number;
    fiber: number;
    vitamins: Record<string, number>;
    minerals: Record<string, number>;
    calories: number;
  };
  cost: number;
  supplier?: string;
  qualityGrade: 'premium' | 'standard' | 'basic';
  expiryDate?: string;
}

interface HealthAlert {
  id: string;
  animalId: string;
  alertType: 'disease_risk' | 'breeding_time' | 'vaccination_due' | 'weight_loss' | 'production_drop' | 'temperature_abnormal' | 'behavior_change';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  aiConfidence: number;
  recommendations: string[];
  createdAt: string;
  resolvedAt?: string;
  isResolved: boolean;
}

// AI Health Analysis Engine
class AIHealthAnalysisEngine {
  static analyzeAnimalHealth(animal: Animal, recentHealthRecords: HealthRecord[]): {
    healthScore: number;
    riskFactors: string[];
    recommendations: string[];
    alerts: HealthAlert[];
  } {
    let healthScore = 100;
    const riskFactors: string[] = [];
    const recommendations: string[] = [];
    const alerts: HealthAlert[] = [];

    // Analyze recent health records
    const recentSickRecords = recentHealthRecords.filter(record => 
      record.type === 'illness' && 
      new Date(record.date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );

    if (recentSickRecords.length > 0) {
      healthScore -= recentSickRecords.length * 15;
      riskFactors.push('إصابات مرضية حديثة');
      recommendations.push('متابعة دورية مع الطبيب البيطري');
    }

    // Age-based health analysis
    const ageInMonths = this.calculateAgeInMonths(animal.birthDate);
    if (ageInMonths > 60 && animal.species === 'cattle') {
      healthScore -= 10;
      riskFactors.push('عمر متقدم يتطلب عناية خاصة');
      recommendations.push('فحوصات دورية أكثر تكراراً للحيوانات المسنة');
    }

    // Weight monitoring
    const recentWeightRecords = recentHealthRecords
      .filter(record => record.weight)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3);

    if (recentWeightRecords.length >= 2) {
      const weightTrend = this.calculateWeightTrend(recentWeightRecords);
      if (weightTrend < -5) {
        healthScore -= 20;
        riskFactors.push('فقدان وزن ملحوظ');
        recommendations.push('مراجعة نظام التغذية وفحص الأمراض الهضمية');
        
        alerts.push({
          id: Date.now().toString(),
          animalId: animal.id,
          alertType: 'weight_loss',
          severity: 'high',
          message: `الحيوان ${animal.earTag} يواجه فقدان وزن بنسبة ${Math.abs(weightTrend).toFixed(1)}%`,
          aiConfidence: 0.85,
          recommendations: ['فحص طبي عاجل', 'مراجعة النظام الغذائي'],
          createdAt: new Date().toISOString(),
          isResolved: false
        });
      }
    }

    // Vaccination status
    const lastVaccination = recentHealthRecords
      .filter(record => record.type === 'vaccination')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

    if (!lastVaccination || this.daysSince(lastVaccination.date) > 365) {
      riskFactors.push('تأخر في التطعيمات');
      recommendations.push('تحديث جدول التطعيمات حسب البروتوكول المحلي');
      
      alerts.push({
        id: (Date.now() + 1).toString(),
        animalId: animal.id,
        alertType: 'vaccination_due',
        severity: 'medium',
        message: `التطعيم مستحق للحيوان ${animal.earTag}`,
        aiConfidence: 0.95,
        recommendations: ['جدولة موعد تطعيم', 'مراجعة سجل التطعيمات'],
        createdAt: new Date().toISOString(),
        isResolved: false
      });
    }

    // Species-specific health analysis
    const speciesAnalysis = this.analyzeSpeciesSpecificHealth(animal, recentHealthRecords);
    healthScore += speciesAnalysis.scoreModifier;
    riskFactors.push(...speciesAnalysis.riskFactors);
    recommendations.push(...speciesAnalysis.recommendations);

    return {
      healthScore: Math.max(0, Math.min(100, healthScore)),
      riskFactors,
      recommendations,
      alerts
    };
  }

  static analyzeSpeciesSpecificHealth(animal: Animal, records: HealthRecord[]): {
    scoreModifier: number;
    riskFactors: string[];
    recommendations: string[];
  } {
    let scoreModifier = 0;
    const riskFactors: string[] = [];
    const recommendations: string[] = [];

    switch (animal.species) {
      case 'cattle':
        // Cattle-specific analysis
        if (animal.status === 'lactating') {
          const recentMilkProduction = records.filter(r => 
            r.type === 'checkup' && r.notes?.includes('إنتاج الحليب')
          );
          if (recentMilkProduction.length === 0) {
            riskFactors.push('عدم مراقبة إنتاج الحليب للبقرة المرضعة');
            recommendations.push('مراقبة يومية لإنتاج الحليب وجودته');
          }
        }
        break;

      case 'chicken':
        // Poultry-specific analysis
        const ageInWeeks = this.calculateAgeInMonths(animal.birthDate) * 4;
        if (ageInWeeks > 20 && animal.gender === 'female') {
          riskFactors.push('دجاجة في عمر الإنتاج تحتاج مراقبة إنتاج البيض');
          recommendations.push('تسجيل إنتاج البيض اليومي ومراقبة التغذية');
        }
        break;

      case 'sheep':
      case 'goat':
        // Small ruminants analysis
        if (this.isBreedingSeason()) {
          recommendations.push('مراقبة علامات الشبق والاستعداد للتلقيح');
        }
        break;
    }

    return { scoreModifier, riskFactors, recommendations };
  }

  static calculateAgeInMonths(birthDate: string): number {
    const birth = new Date(birthDate);
    const now = new Date();
    return (now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
  }

  static calculateWeightTrend(weightRecords: HealthRecord[]): number {
    if (weightRecords.length < 2) return 0;
    
    const oldest = weightRecords[weightRecords.length - 1].weight!;
    const newest = weightRecords[0].weight!;
    
    return ((newest - oldest) / oldest) * 100;
  }

  static daysSince(date: string): number {
    return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
  }

  static isBreedingSeason(): boolean {
    const month = new Date().getMonth() + 1;
    return month >= 9 && month <= 12; // September to December
  }
}

// AI Breeding Optimization Engine
class AIBreedingOptimizationEngine {
  static calculateBreedingCompatibility(male: Animal, female: Animal): {
    compatibilityScore: number;
    geneticAdvantages: string[];
    potentialRisks: string[];
    recommendations: string[];
  } {
    let compatibilityScore = 50; // Base score
    const geneticAdvantages: string[] = [];
    const potentialRisks: string[] = [];
    const recommendations: string[] = [];

    // Genetic diversity analysis
    if (male.geneticData && female.geneticData) {
      const inbreedingRisk = this.calculateInbreedingRisk(male, female);
      
      if (inbreedingRisk < 0.05) {
        compatibilityScore += 20;
        geneticAdvantages.push('تنوع جيني ممتاز يقلل من مخاطر الأمراض الوراثية');
      } else if (inbreedingRisk > 0.15) {
        compatibilityScore -= 30;
        potentialRisks.push('مخاطر عالية للأمراض الوراثية بسبب القرابة الجينية');
        recommendations.push('البحث عن بديل بخط جيني مختلف');
      }

      // Trait combination analysis
      const traitAnalysis = this.analyzeTraitCombination(male.geneticData, female.geneticData);
      compatibilityScore += traitAnalysis.scoreModifier;
      geneticAdvantages.push(...traitAnalysis.advantages);
    }

    // Age compatibility
    const maleAge = AIHealthAnalysisEngine.calculateAgeInMonths(male.birthDate);
    const femaleAge = AIHealthAnalysisEngine.calculateAgeInMonths(female.birthDate);

    if (maleAge >= 12 && maleAge <= 60 && femaleAge >= 12 && femaleAge <= 72) {
      compatibilityScore += 15;
      geneticAdvantages.push('أعمار مثالية للتناسل');
    } else {
      compatibilityScore -= 10;
      potentialRisks.push('أعمار غير مثالية قد تؤثر على نجاح التلقيح');
    }

    // Health status check
    if (male.status === 'healthy' && female.status === 'healthy') {
      compatibilityScore += 10;
    } else {
      compatibilityScore -= 20;
      potentialRisks.push('حالة صحية غير مثالية لأحد الوالدين');
      recommendations.push('تأجيل التلقيح حتى تحسن الحالة الصحية');
    }

    // Production performance analysis
    if (female.productionHistory && female.productionHistory.length > 0) {
      const avgProduction = this.calculateAverageProduction(female.productionHistory);
      if (avgProduction > 80) { // Assuming 100 is maximum
        compatibilityScore += 15;
        geneticAdvantages.push('أداء إنتاجي ممتاز للأم');
      }
    }

    return {
      compatibilityScore: Math.max(0, Math.min(100, compatibilityScore)),
      geneticAdvantages,
      potentialRisks,
      recommendations
    };
  }

  static calculateInbreedingRisk(male: Animal, female: Animal): number {
    // Simplified inbreeding coefficient calculation
    if (!male.parentIds || !female.parentIds) return 0;
    
    const maleParents = [male.parentIds.father, male.parentIds.mother].filter(Boolean);
    const femaleParents = [female.parentIds.father, female.parentIds.mother].filter(Boolean);
    
    const sharedParents = maleParents.filter(parent => femaleParents.includes(parent));
    
    return sharedParents.length * 0.25; // 25% per shared parent
  }

  static analyzeTraitCombination(maleGenetics: GeneticProfile, femaleGenetics: GeneticProfile): {
    scoreModifier: number;
    advantages: string[];
  } {
    let scoreModifier = 0;
    const advantages: string[] = [];

    // Analyze complementary traits
    if (maleGenetics.heritabilityTraits && femaleGenetics.heritabilityTraits) {
      const traits = Object.keys(maleGenetics.heritabilityTraits) as Array<keyof typeof maleGenetics.heritabilityTraits>;
      
      traits.forEach(trait => {
        const maleValue = maleGenetics.heritabilityTraits[trait] || 0;
        const femaleValue = femaleGenetics.heritabilityTraits[trait] || 0;
        const averageValue = (maleValue + femaleValue) / 2;
        
        if (averageValue > 80) {
          scoreModifier += 5;
          advantages.push(`وراثة ممتازة لصفة ${this.translateTrait(trait)}`);
        }
      });
    }

    return { scoreModifier, advantages };
  }

  static translateTrait(trait: string): string {
    const translations = {
      milkProduction: 'إنتاج الحليب',
      eggProduction: 'إنتاج البيض',
      growthRate: 'معدل النمو',
      diseaseResistance: 'مقاومة الأمراض',
      fertilityRate: 'معدل الخصوبة',
      meatQuality: 'جودة اللحم'
    };
    return translations[trait as keyof typeof translations] || trait;
  }

  static calculateAverageProduction(productionHistory: ProductionRecord[]): number {
    if (productionHistory.length === 0) return 0;
    
    const recentProduction = productionHistory
      .filter(record => new Date(record.date) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000))
      .reduce((sum, record) => sum + record.quantity, 0);
    
    return Math.min(100, (recentProduction / productionHistory.length) * 10);
  }

  static generateBreedingSchedule(animals: Animal[]): {
    recommendedPairings: {
      male: Animal;
      female: Animal;
      compatibilityScore: number;
      recommendedDate: string;
      expectedOutcome: string;
    }[];
    seasonalRecommendations: string[];
  } {
    const males = animals.filter(a => a.gender === 'male' && a.status === 'healthy');
    const females = animals.filter(a => a.gender === 'female' && ['healthy', 'dry'].includes(a.status));
    
    const recommendedPairings = [];
    
    for (const female of females) {
      let bestMale = null;
      let bestScore = 0;
      
      for (const male of males) {
        if (male.species === female.species) {
          const compatibility = this.calculateBreedingCompatibility(male, female);
          if (compatibility.compatibilityScore > bestScore) {
            bestScore = compatibility.compatibilityScore;
            bestMale = male;
          }
        }
      }
      
      if (bestMale && bestScore > 60) {
        recommendedPairings.push({
          male: bestMale,
          female,
          compatibilityScore: bestScore,
          recommendedDate: this.calculateOptimalBreedingDate(female),
          expectedOutcome: this.predictBreedingOutcome(bestScore)
        });
      }
    }
    
    return {
      recommendedPairings: recommendedPairings.sort((a, b) => b.compatibilityScore - a.compatibilityScore),
      seasonalRecommendations: this.getSeasonalBreedingRecommendations()
    };
  }

  static calculateOptimalBreedingDate(female: Animal): string {
    // Calculate based on species gestation period and optimal seasonal timing
    const gestationPeriods = {
      cattle: 280,
      sheep: 150,
      goat: 150,
      chicken: 21,
      turkey: 28,
      duck: 28
    };
    
    const gestationDays = gestationPeriods[female.species] || 150;
    const optimalBirthMonth = female.species === 'cattle' ? 3 : 4; // March-April for optimal spring births
    
    const currentYear = new Date().getFullYear();
    const optimalBirthDate = new Date(currentYear, optimalBirthMonth - 1, 15);
    const breedingDate = new Date(optimalBirthDate.getTime() - gestationDays * 24 * 60 * 60 * 1000);
    
    return breedingDate.toISOString().split('T')[0];
  }

  static predictBreedingOutcome(compatibilityScore: number): string {
    if (compatibilityScore >= 90) return 'نتائج ممتازة متوقعة مع صفات وراثية فائقة';
    if (compatibilityScore >= 80) return 'نتائج جيدة جداً مع صفات وراثية قوية';
    if (compatibilityScore >= 70) return 'نتائج جيدة مع توقعات إيجابية';
    if (compatibilityScore >= 60) return 'نتائج مقبولة مع مراقبة مطلوبة';
    return 'نتائج غير مؤكدة - يُنصح بالحذر';
  }

  static getSeasonalBreedingRecommendations(): string[] {
    const month = new Date().getMonth() + 1;
    
    if (month >= 9 && month <= 11) {
      return [
        'موسم التناسل المثالي للأغنام والماعز',
        'التأكد من التغذية الجيدة قبل التلقيح',
        'مراقبة دورات الشبق بعناية'
      ];
    } else if (month >= 3 && month <= 5) {
      return [
        'موسم جيد لتلقيح الأبقار',
        'الاستفادة من الطقس المعتدل والمراعي الخضراء',
        'تجهيز أماكن الولادة المناسبة'
      ];
    } else {
      return [
        'موسم هدوء نسبي في التناسل',
        'التركيز على العناية بالحيوانات الحامل',
        'التخطيط للموسم القادم'
      ];
    }
  }
}

// Smart Feed Management Engine
class SmartFeedManagementEngine {
  static calculateNutritionalRequirements(animal: Animal): {
    dailyRequirements: {
      protein: number;
      energy: number; // kcal
      fiber: number;
      minerals: Record<string, number>;
      vitamins: Record<string, number>;
    };
    feedRecommendations: {
      feedType: string;
      quantity: number;
      unit: string;
      cost: number;
      nutritionalBenefit: string;
    }[];
    specialRequirements?: string[];
  } {
    const age = AIHealthAnalysisEngine.calculateAgeInMonths(animal.birthDate);
    const baseRequirements = this.getBaseNutritionalRequirements(animal.species, age, animal.weight);
    
    // Adjust based on status
    const statusMultipliers = this.getStatusMultipliers(animal.status);
    
    const dailyRequirements = {
      protein: baseRequirements.protein * statusMultipliers.protein,
      energy: baseRequirements.energy * statusMultipliers.energy,
      fiber: baseRequirements.fiber * statusMultipliers.fiber,
      minerals: Object.keys(baseRequirements.minerals).reduce((acc, mineral) => {
        acc[mineral] = baseRequirements.minerals[mineral] * (statusMultipliers.minerals || 1);
        return acc;
      }, {} as Record<string, number>),
      vitamins: Object.keys(baseRequirements.vitamins).reduce((acc, vitamin) => {
        acc[vitamin] = baseRequirements.vitamins[vitamin] * (statusMultipliers.vitamins || 1);
        return acc;
      }, {} as Record<string, number>)
    };
    
    const feedRecommendations = this.generateFeedRecommendations(animal, dailyRequirements);
    const specialRequirements = this.getSpecialRequirements(animal);
    
    return {
      dailyRequirements,
      feedRecommendations,
      specialRequirements
    };
  }

  static getBaseNutritionalRequirements(species: string, ageMonths: number, weight: number) {
    const requirements = {
      cattle: {
        protein: weight * 0.8, // 0.8g per kg body weight
        energy: weight * 50, // 50 kcal per kg
        fiber: weight * 2, // 2g per kg
        minerals: { calcium: weight * 0.4, phosphorus: weight * 0.3, sodium: weight * 0.1 },
        vitamins: { vitaminA: weight * 0.02, vitaminD: weight * 0.01, vitaminE: weight * 0.005 }
      },
      sheep: {
        protein: weight * 1.2,
        energy: weight * 60,
        fiber: weight * 2.5,
        minerals: { calcium: weight * 0.5, phosphorus: weight * 0.35, sodium: weight * 0.12 },
        vitamins: { vitaminA: weight * 0.025, vitaminD: weight * 0.012, vitaminE: weight * 0.006 }
      },
      goat: {
        protein: weight * 1.3,
        energy: weight * 65,
        fiber: weight * 2.8,
        minerals: { calcium: weight * 0.6, phosphorus: weight * 0.4, sodium: weight * 0.15 },
        vitamins: { vitaminA: weight * 0.03, vitaminD: weight * 0.015, vitaminE: weight * 0.007 }
      },
      chicken: {
        protein: weight * 18, // Higher protein requirement for poultry
        energy: weight * 280,
        fiber: weight * 4,
        minerals: { calcium: weight * 3.5, phosphorus: weight * 0.6, sodium: weight * 0.15 },
        vitamins: { vitaminA: weight * 0.4, vitaminD: weight * 0.02, vitaminE: weight * 0.1 }
      }
    };
    
    return requirements[species as keyof typeof requirements] || requirements.cattle;
  }

  static getStatusMultipliers(status: string) {
    const multipliers = {
      pregnant: { protein: 1.5, energy: 1.3, fiber: 1.1, minerals: 1.4, vitamins: 1.3 },
      lactating: { protein: 2.0, energy: 1.8, fiber: 1.2, minerals: 1.6, vitamins: 1.5 },
      growing: { protein: 1.8, energy: 1.5, fiber: 1.0, minerals: 1.3, vitamins: 1.2 },
      healthy: { protein: 1.0, energy: 1.0, fiber: 1.0, minerals: 1.0, vitamins: 1.0 },
      sick: { protein: 1.3, energy: 1.1, fiber: 0.8, minerals: 1.2, vitamins: 1.4 },
      dry: { protein: 0.8, energy: 0.9, fiber: 1.1, minerals: 0.9, vitamins: 0.9 }
    };
    
    return multipliers[status as keyof typeof multipliers] || multipliers.healthy;
  }

  static generateFeedRecommendations(animal: Animal, requirements: any) {
    const feedTypes = this.getAvailableFeedTypes(animal.species);
    
    return feedTypes.map(feed => {
      const quantity = this.calculateFeedQuantity(requirements, feed);
      return {
        feedType: feed.name,
        quantity: quantity,
        unit: feed.unit,
        cost: quantity * feed.costPerUnit,
        nutritionalBenefit: feed.benefit
      };
    }).sort((a, b) => a.cost - b.cost); // Sort by cost efficiency
  }

  static getAvailableFeedTypes(species: string) {
    const feedDatabase = {
      cattle: [
        { name: 'برسيم مجفف', costPerUnit: 0.8, unit: 'kg', protein: 18, energy: 250, benefit: 'مصدر ممتاز للبروتين والفيتامينات' },
        { name: 'علف مركز', costPerUnit: 1.2, unit: 'kg', protein: 16, energy: 280, benefit: 'طاقة عالية ومتوازن غذائياً' },
        { name: 'قش القمح', costPerUnit: 0.3, unit: 'kg', protein: 4, energy: 180, benefit: 'مصدر للألياف واقتصادي' },
        { name: 'ذرة مطحونة', costPerUnit: 0.9, unit: 'kg', protein: 9, energy: 320, benefit: 'طاقة عالية سهلة الهضم' }
      ],
      sheep: [
        { name: 'علف أغنام مخصوص', costPerUnit: 1.0, unit: 'kg', protein: 14, energy: 260, benefit: 'متوازن خصيصاً للأغنام' },
        { name: 'شعير مجروش', costPerUnit: 0.7, unit: 'kg', protein: 11, energy: 280, benefit: 'مصدر طاقة اقتصادي' },
        { name: 'برسيم ناشف', costPerUnit: 0.6, unit: 'kg', protein: 16, energy: 240, benefit: 'بروتين عالي وطبيعي' }
      ],
      chicken: [
        { name: 'علف دجاج بادئ', costPerUnit: 1.5, unit: 'kg', protein: 20, energy: 300, benefit: 'للكتاكيت الصغيرة' },
        { name: 'علف دجاج بياض', costPerUnit: 1.3, unit: 'kg', protein: 16, energy: 280, benefit: 'محسن لإنتاج البيض' },
        { name: 'ذرة مكسرة', costPerUnit: 0.8, unit: 'kg', protein: 8, energy: 350, benefit: 'طاقة سريعة وحبوب مفضلة' }
      ]
    };
    
    return feedDatabase[species as keyof typeof feedDatabase] || feedDatabase.cattle;
  }

  static calculateFeedQuantity(requirements: any, feed: any): number {
    // Simplified calculation based on protein and energy requirements
    const proteinNeeded = requirements.protein;
    const energyNeeded = requirements.energy;
    
    const quantityForProtein = proteinNeeded / (feed.protein * 0.01); // Convert percentage to decimal
    const quantityForEnergy = energyNeeded / feed.energy;
    
    return Math.max(quantityForProtein, quantityForEnergy);
  }

  static getSpecialRequirements(animal: Animal): string[] {
    const requirements = [];
    
    if (animal.status === 'pregnant') {
      requirements.push('زيادة تدريجية في التغذية خلال الثلث الأخير من الحمل');
      requirements.push('إضافة مكملات الكالسيوم والفوسفور');
    }
    
    if (animal.status === 'lactating') {
      requirements.push('تغذية عالية الطاقة لدعم إنتاج الحليب');
      requirements.push('مياه نظيفة متوفرة بكميات كافية');
    }
    
    if (animal.status === 'sick') {
      requirements.push('أعلاف سهلة الهضم وغنية بالفيتامينات');
      requirements.push('مراقبة كمية الطعام المتناولة يومياً');
    }
    
    const age = AIHealthAnalysisEngine.calculateAgeInMonths(animal.birthDate);
    if (age < 6) {
      requirements.push('علف خاص بالحيوانات الصغيرة عالي البروتين');
    }
    
    return requirements;
  }

  static optimizeFeedCosts(animals: Animal[], budget: number): {
    optimizedPlan: {
      animalId: string;
      feedPlan: {
        feedType: string;
        quantity: number;
        cost: number;
      }[];
      totalCost: number;
    }[];
    totalBudgetUsed: number;
    savingsRecommendations: string[];
  } {
    const optimizedPlan = [];
    let totalBudgetUsed = 0;
    
    for (const animal of animals) {
      const requirements = this.calculateNutritionalRequirements(animal);
      const costEffectiveFeeds = requirements.feedRecommendations
        .sort((a, b) => (a.cost / a.quantity) - (b.cost / b.quantity))
        .slice(0, 3); // Top 3 cost-effective options
      
      const animalBudget = budget / animals.length; // Equal distribution
      let animalCost = 0;
      const selectedFeeds = [];
      
      for (const feed of costEffectiveFeeds) {
        if (animalCost + feed.cost <= animalBudget) {
          selectedFeeds.push(feed);
          animalCost += feed.cost;
        }
      }
      
      optimizedPlan.push({
        animalId: animal.id,
        feedPlan: selectedFeeds,
        totalCost: animalCost
      });
      
      totalBudgetUsed += animalCost;
    }
    
    return {
      optimizedPlan,
      totalBudgetUsed,
      savingsRecommendations: this.generateSavingsRecommendations(optimizedPlan, budget)
    };
  }

  static generateSavingsRecommendations(plan: any[], budget: number): string[] {
    const recommendations = [];
    
    if (plan.reduce((sum, p) => sum + p.totalCost, 0) < budget * 0.8) {
      recommendations.push('يمكن تحسين جودة الأعلاف ضمن الميزانية المتاحة');
    }
    
    recommendations.push('النظر في شراء الأعلاف بكميات كبيرة للحصول على خصومات');
    recommendations.push('زراعة علف أخضر محلي لتقليل التكاليف');
    recommendations.push('التعاون مع مزارعين آخرين للشراء الجماعي');
    
    return recommendations;
  }
}

// Sample data
let animalsDatabase: Animal[] = [
  {
    id: '1',
    farmId: 'farm1',
    earTag: 'C001',
    name: 'نورا',
    species: 'cattle',
    breed: 'هولشتاين',
    gender: 'female',
    birthDate: '2020-03-15',
    weight: 450,
    status: 'lactating',
    acquisitionDate: '2020-03-15',
    acquisitionType: 'birth',
    currentLocation: 'حظيرة رقم 1',
    geneticData: {
      bloodline: 'هولشتاين أصيل',
      geneticMarkers: {},
      heritabilityTraits: {
        milkProduction: 85,
        diseaseResistance: 70,
        fertilityRate: 80
      },
      inbreedingCoefficient: 0.02,
      parentalLineage: ['H-001', 'H-002']
    },
    healthHistory: [
      {
        id: 'h1',
        animalId: '1',
        date: '2024-01-15',
        type: 'vaccination',
        condition: 'تطعيم دوري',
        temperature: 38.5,
        weight: 450,
        treatment: 'لقاح شامل',
        severity: 'mild',
        outcome: 'recovered',
        aiRiskScore: 15
      }
    ],
    breedingHistory: [],
    productionHistory: [
      {
        id: 'p1',
        animalId: '1',
        date: '2024-01-20',
        type: 'milk',
        quantity: 25,
        unit: 'liters',
        quality: 'A',
        price: 0.8,
        revenue: 20
      }
    ]
  }
];

let healthAlertsDatabase: HealthAlert[] = [];
let feedRecordsDatabase: FeedRecord[] = [];

// API Routes
export async function getAnimals(req: Request, res: Response) {
  try {
    const { species, status, farmId } = req.query;
    
    let filteredAnimals = animalsDatabase;
    
    if (species) {
      filteredAnimals = filteredAnimals.filter(animal => animal.species === species);
    }
    
    if (status) {
      filteredAnimals = filteredAnimals.filter(animal => animal.status === status);
    }
    
    if (farmId) {
      filteredAnimals = filteredAnimals.filter(animal => animal.farmId === farmId);
    }
    
    res.json({
      success: true,
      data: filteredAnimals,
      count: filteredAnimals.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في استرجاع بيانات الحيوانات',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export async function getAnimalHealth(req: Request, res: Response) {
  try {
    const { animalId } = req.params;
    
    const animal = animalsDatabase.find(a => a.id === animalId);
    if (!animal) {
      return res.status(404).json({
        success: false,
        message: 'الحيوان غير موجود'
      });
    }
    
    const healthAnalysis = AIHealthAnalysisEngine.analyzeAnimalHealth(animal, animal.healthHistory);
    
    res.json({
      success: true,
      data: {
        animal,
        healthAnalysis
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في تحليل الحالة الصحية',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export async function getBreedingRecommendations(req: Request, res: Response) {
  try {
    const { farmId } = req.query;
    
    let animals = animalsDatabase;
    if (farmId) {
      animals = animals.filter(animal => animal.farmId === farmId);
    }
    
    const breedingSchedule = AIBreedingOptimizationEngine.generateBreedingSchedule(animals);
    
    res.json({
      success: true,
      data: breedingSchedule
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في توليد توصيات التناسل',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export async function getFeedRecommendations(req: Request, res: Response) {
  try {
    const { animalId } = req.params;
    
    const animal = animalsDatabase.find(a => a.id === animalId);
    if (!animal) {
      return res.status(404).json({
        success: false,
        message: 'الحيوان غير موجود'
      });
    }
    
    const feedRecommendations = SmartFeedManagementEngine.calculateNutritionalRequirements(animal);
    
    res.json({
      success: true,
      data: feedRecommendations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في حساب احتياجات التغذية',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export async function optimizeFeedBudget(req: Request, res: Response) {
  try {
    const { farmId, budget } = req.body;
    
    let animals = animalsDatabase;
    if (farmId) {
      animals = animals.filter(animal => animal.farmId === farmId);
    }
    
    const optimization = SmartFeedManagementEngine.optimizeFeedCosts(animals, budget);
    
    res.json({
      success: true,
      data: optimization
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في تحسين ميزانية الأعلاف',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export async function getHealthAlerts(req: Request, res: Response) {
  try {
    const { farmId, severity, resolved } = req.query;
    
    let alerts = healthAlertsDatabase;
    
    if (severity) {
      alerts = alerts.filter(alert => alert.severity === severity);
    }
    
    if (resolved !== undefined) {
      alerts = alerts.filter(alert => alert.isResolved === (resolved === 'true'));
    }
    
    // Generate new alerts based on current animal health
    const newAlerts: HealthAlert[] = [];
    for (const animal of animalsDatabase) {
      const healthAnalysis = AIHealthAnalysisEngine.analyzeAnimalHealth(animal, animal.healthHistory);
      newAlerts.push(...healthAnalysis.alerts);
    }
    
    // Add new alerts to database
    healthAlertsDatabase.push(...newAlerts);
    
    res.json({
      success: true,
      data: alerts.concat(newAlerts).sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في استرجاع التنبيهات الصحية',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export async function getLivestockDashboard(req: Request, res: Response) {
  try {
    const { farmId } = req.query;
    
    let animals = animalsDatabase;
    if (farmId) {
      animals = animals.filter(animal => animal.farmId === farmId);
    }
    
    // Calculate summary statistics
    const totalAnimals = animals.length;
    const healthyAnimals = animals.filter(a => a.status === 'healthy').length;
    const sickAnimals = animals.filter(a => a.status === 'sick').length;
    const pregnantAnimals = animals.filter(a => a.status === 'pregnant').length;
    
    // Health score analysis
    const healthScores = animals.map(animal => {
      const analysis = AIHealthAnalysisEngine.analyzeAnimalHealth(animal, animal.healthHistory);
      return analysis.healthScore;
    });
    
    const avgHealthScore = healthScores.reduce((sum, score) => sum + score, 0) / healthScores.length;
    
    // Production analysis
    const totalProduction = animals.reduce((sum, animal) => {
      return sum + animal.productionHistory.reduce((animalSum, record) => animalSum + record.quantity, 0);
    }, 0);
    
    // Species distribution
    const speciesCount = animals.reduce((acc, animal) => {
      acc[animal.species] = (acc[animal.species] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    res.json({
      success: true,
      data: {
        summary: {
          totalAnimals,
          healthyAnimals,
          sickAnimals,
          pregnantAnimals,
          avgHealthScore: Math.round(avgHealthScore),
          totalProduction
        },
        speciesDistribution: speciesCount,
        recentAlerts: healthAlertsDatabase.slice(0, 5),
        topProducers: animals
          .sort((a, b) => {
            const aProduction = a.productionHistory.reduce((sum, record) => sum + record.quantity, 0);
            const bProduction = b.productionHistory.reduce((sum, record) => sum + record.quantity, 0);
            return bProduction - aProduction;
          })
          .slice(0, 5)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في إنشاء لوحة الثروة الحيوانية',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
