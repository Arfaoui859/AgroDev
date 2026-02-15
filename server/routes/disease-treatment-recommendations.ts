import express from 'express';

const router = express.Router();

// Types and interfaces for disease treatment system
interface TreatmentProduct {
  id: string;
  name: string;
  activeIngredient: string;
  type: 'Fungicide' | 'Insecticide' | 'Bactericide' | 'Herbicide' | 'Organic' | 'Biological';
  brand: string;
  availability: 'High' | 'Medium' | 'Low';
  cost: number; // per unit in TND
  effectiveness: number; // 0-1 scale
  safetyRating: 'A' | 'B' | 'C' | 'D'; // A = safest
  organicApproved: boolean;
  resistanceRisk: 'Low' | 'Medium' | 'High';
  applicationMethod: 'Spray' | 'Soil' | 'Seed' | 'Injection' | 'Fumigation';
  compatibleCrops: string[];
  restrictions: string[];
}

interface TreatmentStep {
  stepNumber: number;
  title: string;
  description: string;
  timing: string; // e.g., "Day 1", "Week 2", "Before symptoms"
  products: {
    productId: string;
    dosage: string;
    concentration: string;
    applicationMethod: string;
    waterVolume?: string;
  }[];
  conditions: string[];
  precautions: string[];
  expectedResults: string;
  costEstimate: number;
}

interface TreatmentPlan {
  planId: string;
  diseaseId: string;
  diseaseName: string;
  cropType: string;
  severity: 'Mild' | 'Moderate' | 'Severe' | 'Critical';
  approach: 'Chemical' | 'Organic' | 'Integrated' | 'Biological';
  totalDuration: number; // days
  totalCost: number; // TND
  successRate: number; // percentage
  steps: TreatmentStep[];
  preventionMeasures: string[];
  followUpSchedule: {
    checkDays: number[];
    monitoringPoints: string[];
    alertTriggers: string[];
  };
  emergencyActions: string[];
  createdAt: Date;
  aiConfidence: number;
  riskFactors: string[];
  alternativeTreatments: string[];
}

interface TreatmentHistory {
  historyId: string;
  userId: string;
  planId: string;
  cropId: string;
  startDate: Date;
  endDate?: Date;
  status: 'Active' | 'Completed' | 'Paused' | 'Failed' | 'Cancelled';
  progress: {
    completedSteps: number[];
    currentStep: number;
    effectiveness: number;
    sideEffects: string[];
    farmerNotes: string[];
  };
  results: {
    diseaseEliminated: boolean;
    cropRecovery: number; // percentage
    yieldImpact: number; // percentage change
    costActual: number;
    timeToRecovery: number; // days
  };
  followUpAlerts: string[];
}

// Comprehensive treatment products database (Tunisia-specific)
const treatmentProducts: TreatmentProduct[] = [
  // Fungicides
  {
    id: 'COPPER_SULFATE_01',
    name: 'كبريتات النحاس',
    activeIngredient: 'Copper Sulfate',
    type: 'Fungicide',
    brand: 'AgriTunisia',
    availability: 'High',
    cost: 12.5,
    effectiveness: 0.75,
    safetyRating: 'B',
    organicApproved: true,
    resistanceRisk: 'Low',
    applicationMethod: 'Spray',
    compatibleCrops: ['tomato', 'olive', 'citrus', 'grape'],
    restrictions: ['لا تستخدم في فترة الإزهار', 'تجنب الرش في الجو الحار']
  },
  {
    id: 'MANCOZEB_01',
    name: 'مانكوزيب',
    activeIngredient: 'Mancozeb',
    type: 'Fungicide',
    brand: 'Bayer',
    availability: 'High',
    cost: 25.0,
    effectiveness: 0.90,
    safetyRating: 'C',
    organicApproved: false,
    resistanceRisk: 'Medium',
    applicationMethod: 'Spray',
    compatibleCrops: ['tomato', 'potato', 'wheat', 'grape'],
    restrictions: ['فترة انتظار 14 يوم قبل الحصاد', 'استخدم معدات حماية']
  },
  {
    id: 'BORDEAUX_MIX_01',
    name: 'خليط بوردو',
    activeIngredient: 'Copper Hydroxide + Lime',
    type: 'Fungicide',
    brand: 'Local',
    availability: 'High',
    cost: 8.0,
    effectiveness: 0.70,
    safetyRating: 'A',
    organicApproved: true,
    resistanceRisk: 'Low',
    applicationMethod: 'Spray',
    compatibleCrops: ['olive', 'citrus', 'grape', 'tomato'],
    restrictions: ['تجنب خلط مع منتجات أخرى', 'تحضير قبل الاستخدام مباشرة']
  },

  // Insecticides
  {
    id: 'SPINOSAD_01',
    name: 'سبينوساد',
    activeIngredient: 'Spinosad',
    type: 'Insecticide',
    brand: 'Dow',
    availability: 'Medium',
    cost: 45.0,
    effectiveness: 0.88,
    safetyRating: 'A',
    organicApproved: true,
    resistanceRisk: 'Low',
    applicationMethod: 'Spray',
    compatibleCrops: ['tomato', 'pepper', 'citrus', 'olive'],
    restrictions: ['آمن للنحل بعد الجفاف', 'تجنب الرش أثناء الإزهار']
  },
  {
    id: 'NEEM_OIL_01',
    name: 'زيت النيم',
    activeIngredient: 'Azadirachtin',
    type: 'Insecticide',
    brand: 'Organic Solutions',
    availability: 'Medium',
    cost: 18.0,
    effectiveness: 0.65,
    safetyRating: 'A',
    organicApproved: true,
    resistanceRisk: 'Low',
    applicationMethod: 'Spray',
    compatibleCrops: ['tomato', 'pepper', 'citrus', 'olive', 'artichoke'],
    restrictions: ['طبيعي 100%', 'يمكن استخدامه حتى يوم الحصاد']
  },

  // Biological treatments
  {
    id: 'BACILLUS_THURINGIENSIS_01',
    name: 'باسيلس ثورنجينسيس',
    activeIngredient: 'Bacillus thuringiensis',
    type: 'Biological',
    brand: 'BioControl',
    availability: 'Medium',
    cost: 35.0,
    effectiveness: 0.80,
    safetyRating: 'A',
    organicApproved: true,
    resistanceRisk: 'Low',
    applicationMethod: 'Spray',
    compatibleCrops: ['tomato', 'pepper', 'wheat', 'artichoke'],
    restrictions: ['يتطلب شروط تخزين خاصة', 'فعال ضد اليرقات فقط']
  },
  {
    id: 'TRICHODERMA_01',
    name: 'تريكوديرما',
    activeIngredient: 'Trichoderma harzianum',
    type: 'Biological',
    brand: 'BioFungi',
    availability: 'Low',
    cost: 28.0,
    effectiveness: 0.75,
    safetyRating: 'A',
    organicApproved: true,
    resistanceRisk: 'Low',
    applicationMethod: 'Soil',
    compatibleCrops: ['tomato', 'pepper', 'wheat', 'olive'],
    restrictions: ['يضاف للتربة أو نظام الري', 'تجنب استخدام مع مبيدات فطرية']
  }
];

// Disease treatment database with comprehensive treatment plans
const diseaseDatabase = {
  'tomato_late_blight': {
    diseaseName: 'اللفحة المتأخرة في الطماطم',
    treatments: {
      chemical: {
        mild: {
          products: ['MANCOZEB_01', 'COPPER_SULFATE_01'],
          schedule: 'كل 7-10 أيام لمدة 3 أسابيع',
          dosage: 'حسب تعليمات الشركة المصنعة',
          successRate: 85
        },
        severe: {
          products: ['MANCOZEB_01', 'COPPER_SULFATE_01'],
          schedule: 'كل 5-7 أيام لمدة 4-6 أسابيع',
          dosage: 'الجرعة القصوى المسموحة',
          successRate: 70
        }
      },
      organic: {
        mild: {
          products: ['BORDEAUX_MIX_01', 'COPPER_SULFATE_01'],
          schedule: 'كل 5-7 أيام لمدة 4 أسابيع',
          dosage: '2-3 جم/لتر ماء',
          successRate: 65
        }
      }
    }
  },
  'olive_peacock_spot': {
    diseaseName: 'عين الطاووس في الزيتون',
    treatments: {
      chemical: {
        mild: {
          products: ['COPPER_SULFATE_01', 'MANCOZEB_01'],
          schedule: 'رشة واحدة في الخريف ورشة في الربيع',
          dosage: '2-3 جم/لتر ماء',
          successRate: 90
        }
      },
      organic: {
        mild: {
          products: ['BORDEAUX_MIX_01'],
          schedule: 'رشتان في الخريف والربيع',
          dosage: '15-20 جم/لتر ماء',
          successRate: 75
        }
      }
    }
  },
  'citrus_canker': {
    diseaseName: 'تقرح الحمضيات',
    treatments: {
      chemical: {
        mild: {
          products: ['COPPER_SULFATE_01'],
          schedule: 'كل 2-3 أسابيع لمدة شهرين',
          dosage: '2-4 جم/لتر ماء',
          successRate: 80
        }
      },
      organic: {
        mild: {
          products: ['BORDEAUX_MIX_01'],
          schedule: 'كل أسبوعين لمدة شهرين',
          dosage: '20-25 جم/لتر ماء',
          successRate: 70
        }
      }
    }
  }
};

// AI Treatment Recommendation Engine
class AITreatmentEngine {
  static generateTreatmentPlan(
    diseaseId: string,
    diseaseName: string,
    cropType: string,
    severity: 'Mild' | 'Moderate' | 'Severe' | 'Critical',
    farmerPreferences: {
      approach: 'Chemical' | 'Organic' | 'Integrated' | 'Biological';
      budget: number;
      urgency: 'Low' | 'Medium' | 'High';
      organicPreference: boolean;
      experienceLevel: 'Beginner' | 'Intermediate' | 'Expert';
    }
  ): TreatmentPlan {
    
    const planId = `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const approach = farmerPreferences.approach;
    
    // Get suitable products based on crop and approach
    const suitableProducts = treatmentProducts.filter(product => 
      product.compatibleCrops.includes(cropType) &&
      (approach === 'Organic' ? product.organicApproved : true) &&
      (approach === 'Biological' ? product.type === 'Biological' : true)
    );

    // Sort by effectiveness and safety
    suitableProducts.sort((a, b) => {
      const scoreA = (a.effectiveness * 0.6) + (a.safetyRating === 'A' ? 0.4 : a.safetyRating === 'B' ? 0.3 : 0.2);
      const scoreB = (b.effectiveness * 0.6) + (b.safetyRating === 'A' ? 0.4 : b.safetyRating === 'B' ? 0.3 : 0.2);
      return scoreB - scoreA;
    });

    // Generate treatment steps based on severity
    const steps = this.generateTreatmentSteps(suitableProducts, severity, approach, farmerPreferences);
    
    // Calculate total cost and duration
    const totalCost = steps.reduce((sum, step) => sum + step.costEstimate, 0);
    const totalDuration = this.calculateTreatmentDuration(severity, approach);
    const successRate = this.calculateSuccessRate(suitableProducts, severity, approach);

    const plan: TreatmentPlan = {
      planId,
      diseaseId,
      diseaseName,
      cropType,
      severity,
      approach,
      totalDuration,
      totalCost,
      successRate,
      steps,
      preventionMeasures: this.generatePreventionMeasures(diseaseId, cropType),
      followUpSchedule: this.generateFollowUpSchedule(severity, totalDuration),
      emergencyActions: this.generateEmergencyActions(diseaseId, severity),
      createdAt: new Date(),
      aiConfidence: this.calculateAIConfidence(suitableProducts.length, severity),
      riskFactors: this.identifyRiskFactors(diseaseId, severity, approach),
      alternativeTreatments: this.generateAlternatives(approach, suitableProducts)
    };

    return plan;
  }

  private static generateTreatmentSteps(
    products: TreatmentProduct[],
    severity: string,
    approach: string,
    preferences: any
  ): TreatmentStep[] {
    const steps: TreatmentStep[] = [];

    if (severity === 'Critical' || severity === 'Severe') {
      // Immediate action step
      steps.push({
        stepNumber: 1,
        title: 'إجراء فوري - ا��علاج الأولي',
        description: 'بدء العلاج فوراً لوقف انتشار المرض',
        timing: 'خلال 24 ساعة',
        products: products.slice(0, 1).map(product => ({
          productId: product.id,
          dosage: this.calculateDosage(product, severity, 'immediate'),
          concentration: severity === 'Critical' ? 'الحد الأقصى المسموح' : 'الجرعة العادية',
          applicationMethod: product.applicationMethod,
          waterVolume: product.applicationMethod === 'Spray' ? '100-150 لتر/دونم' : undefined
        })),
        conditions: ['طقس هادئ', 'تجنب الرياح القوية', 'درجة حرارة أقل من 30°م'],
        precautions: ['ارتداء معدات الوقاية', 'تجنب الرش قبل المطر بـ 4 ساعات'],
        expectedResults: 'وقف انتشار المرض خلال 3-5 أيام',
        costEstimate: products[0]?.cost * 2 || 50
      });

      // Follow-up treatment
      steps.push({
        stepNumber: 2,
        title: 'العلاج التكميلي',
        description: 'متابعة العلاج لضمان القضاء على المرض',
        timing: 'بعد 7-10 أيام من العلاج الأولي',
        products: products.slice(0, 2).map(product => ({
          productId: product.id,
          dosage: this.calculateDosage(product, severity, 'follow-up'),
          concentration: 'الجرعة العادية',
          applicationMethod: product.applicationMethod,
          waterVolume: product.applicationMethod === 'Spray' ? '100 لتر/دونم' : undefined
        })),
        conditions: ['فحص مدى تحسن النباتات', 'تقييم فعالية العلاج الأولي'],
        precautions: ['تدوير المبيدات لتجنب المقاومة', 'مراقبة أي أعراض جانبية'],
        expectedResults: 'تحسن ملحوظ في حالة النباتات',
        costEstimate: products.slice(0, 2).reduce((sum, p) => sum + p.cost, 0) * 1.5
      });
    } else {
      // Mild to moderate treatment
      steps.push({
        stepNumber: 1,
        title: 'العلاج الوقائي',
        description: 'علاج وقائي للسيطرة على المرض ومنع انتشاره',
        timing: 'خلال 2-3 أيام',
        products: products.slice(0, 1).map(product => ({
          productId: product.id,
          dosage: this.calculateDosage(product, severity, 'preventive'),
          concentration: 'الجرعة العادية',
          applicationMethod: product.applicationMethod,
          waterVolume: product.applicationMethod === 'Spray' ? '80-100 لتر/دونم' : undefined
        })),
        conditions: ['طقس مناسب', 'رطوبة معتدلة'],
        precautions: ['اتباع تعليمات السلامة', 'تجنب الإفراط في الجرعة'],
        expectedResults: 'السيطرة على المرض خلال أسبوع',
        costEstimate: products[0]?.cost || 25
      });
    }

    // Prevention step
    steps.push({
      stepNumber: steps.length + 1,
      title: 'الوقاية طويلة المدى',
      description: 'إجراءات وقائية لمنع عودة المرض',
      timing: 'بعد انتهاء العلاج',
      products: approach === 'Organic' ? 
        products.filter(p => p.organicApproved).slice(0, 1).map(product => ({
          productId: product.id,
          dosage: 'نصف الجرعة العادية',
          concentration: 'تركيز منخفض',
          applicationMethod: product.applicationMethod,
          waterVolume: '50-75 لتر/دونم'
        })) : [],
      conditions: ['رش وقائي شهري', 'مراقبة دورية للنباتات'],
      precautions: ['عدم الإفراط في الرش الوقائي', 'تدوير المنتجات'],
      expectedResults: 'منع عودة المرض',
      costEstimate: 15
    });

    return steps;
  }

  private static calculateDosage(product: TreatmentProduct, severity: string, phase: string): string {
    const baseDosages = {
      'COPPER_SULFATE_01': '2-3 جم/لتر',
      'MANCOZEB_01': '2-2.5 جم/لتر',
      'BORDEAUX_MIX_01': '15-20 جم/لتر',
      'SPINOSAD_01': '0.5-1 مل/لتر',
      'NEEM_OIL_01': '5-8 مل/لتر',
      'BACILLUS_THURINGIENSIS_01': '1-2 جم/لتر',
      'TRICHODERMA_01': '2-5 جم/لتر تربة'
    };

    let dosage = baseDosages[product.id] || '2-3 جم/لتر';

    if (severity === 'Critical' && phase === 'immediate') {
      dosage = dosage.replace(/[\d.]+/g, (match) => (parseFloat(match) * 1.2).toFixed(1));
    } else if (phase === 'preventive') {
      dosage = dosage.replace(/[\d.]+/g, (match) => (parseFloat(match) * 0.7).toFixed(1));
    }

    return dosage;
  }

  private static calculateTreatmentDuration(severity: string, approach: string): number {
    const baseDurations = {
      'Mild': 14,
      'Moderate': 21,
      'Severe': 35,
      'Critical': 42
    };

    let duration = baseDurations[severity] || 21;
    
    if (approach === 'Organic') {
      duration *= 1.3; // Organic treatments typically take longer
    }

    return Math.round(duration);
  }

  private static calculateSuccessRate(products: TreatmentProduct[], severity: string, approach: string): number {
    if (products.length === 0) return 50;

    const avgEffectiveness = products.slice(0, 2).reduce((sum, p) => sum + p.effectiveness, 0) / Math.min(2, products.length);
    
    let baseRate = avgEffectiveness * 100;

    // Adjust for severity
    const severityModifiers = {
      'Mild': 1.1,
      'Moderate': 1.0,
      'Severe': 0.8,
      'Critical': 0.6
    };

    baseRate *= severityModifiers[severity] || 1.0;

    // Adjust for approach
    if (approach === 'Organic') {
      baseRate *= 0.85; // Organic treatments typically have lower immediate success rates
    } else if (approach === 'Integrated') {
      baseRate *= 1.05; // Integrated approach is often more effective
    }

    return Math.round(Math.min(95, Math.max(30, baseRate)));
  }

  private static generatePreventionMeasures(diseaseId: string, cropType: string): string[] {
    const commonMeasures = [
      'تحسين تهوية المحصول عبر التقليم المناسب',
      'تجنب الري المفرط والري في ساعات المساء',
      'إزالة الأوراق والثمار المصابة فوراً',
      'تطبيق دورة زراعية مناسبة',
      'استخدام أصناف مقاومة للأمراض',
      'تطهير أدوات الزراعة بانتظام',
      'مراقبة دورية للكشف المبكر عن الأمراض'
    ];

    const specificMeasures = {
      'tomato_late_blight': [
        'تجنب الري بالرش العلوي',
        'زراعة في أماكن جيدة التهوية',
        'استخدام أقمشة بلاستيكية لحماية التربة'
      ],
      'olive_peacock_spot': [
        'تقليم الأشجار لتحسين التهوية',
        'تجنب الري المباشر على الأوراق',
        'جمع الأوراق المتساقطة وحرقها'
      ]
    };

    return [...commonMeasures, ...(specificMeasures[diseaseId] || [])];
  }

  private static generateFollowUpSchedule(severity: string, duration: number): any {
    const baseSchedule = {
      'Mild': { checkDays: [3, 7, 14], frequency: 'أسبوعي' },
      'Moderate': { checkDays: [2, 5, 10, 15, 21], frequency: 'كل 3-4 أيام' },
      'Severe': { checkDays: [1, 3, 5, 7, 10, 14, 21, 28], frequency: 'يومي ثم كل 3 أيام' },
      'Critical': { checkDays: [1, 2, 3, 5, 7, 10, 14, 21, 28, 35], frequency: 'يومي' }
    };

    const schedule = baseSchedule[severity] || baseSchedule['Moderate'];

    return {
      checkDays: schedule.checkDays.filter(day => day <= duration),
      monitoringPoints: [
        'فحص انتشار المرض',
        'تقييم فعالية العلاج',
        'مراقبة صحة النباتات العامة',
        'فحص ظهور أعراض جديدة',
        'تقييم نمو النباتات'
      ],
      alertTriggers: [
        'ظهور أعراض جديدة',
        'عدم تحسن خلال 7 أيام',
        'انتشار المرض لنباتات أخرى',
        'ظهور أعراض جانبية للعلاج'
      ]
    };
  }

  private static generateEmergencyActions(diseaseId: string, severity: string): string[] {
    const actions = [
      'اتصل بخبير زراعي فوراً إذا ساء الوضع',
      'أوقف العلاج إذا ظهرت أعراض سمية على النباتات',
      'اعزل النباتات المصابة بشدة عن السليمة',
      'زد تكرار المراقبة إلى يومياً',
      'سجل جميع التغيرات التي تلاحظها'
    ];

    if (severity === 'Critical') {
      actions.push(
        'فكر في إزالة النباتات المصابة بشدة لحماية الباقي',
        'اطلب استشارة عاجلة من مهندس زراعي',
        'تحضير للعلاج بمنتجات أقوى إذا لزم الأمر'
      );
    }

    return actions;
  }

  private static calculateAIConfidence(productCount: number, severity: string): number {
    let confidence = 0.7; // Base confidence

    // More products available = higher confidence
    if (productCount >= 3) confidence += 0.2;
    else if (productCount >= 2) confidence += 0.1;
    else if (productCount === 0) confidence -= 0.3;

    // Severity affects confidence
    const severityModifiers = {
      'Mild': 0.1,
      'Moderate': 0.0,
      'Severe': -0.1,
      'Critical': -0.2
    };

    confidence += severityModifiers[severity] || 0;

    return Math.round(Math.min(0.95, Math.max(0.3, confidence)) * 100) / 100;
  }

  private static identifyRiskFactors(diseaseId: string, severity: string, approach: string): string[] {
    const factors = [];

    if (severity === 'Critical' || severity === 'Severe') {
      factors.push('انتشار سريع محتمل للمرض');
      factors.push('فقدان محتمل للمحصول');
    }

    if (approach === 'Organic') {
      factors.push('فعالية أبطأ للعلاجات الطبيعية');
      factors.push('قد يتطلب المزيد من التطبيقات');
    }

    factors.push('إمكانية مقاومة المرض للعلاج');
    factors.push('تأثير الظروف الجوية على فعالية العلاج');

    return factors;
  }

  private static generateAlternatives(currentApproach: string, products: TreatmentProduct[]): string[] {
    const alternatives = [];

    if (currentApproach !== 'Organic') {
      alternatives.push('العلاج الطبيعي بالمنتجات العضوية');
    }

    if (currentApproach !== 'Biological') {
      alternatives.push('العلاج البيولوجي بالكائنات المفيدة');
    }

    if (currentApproach !== 'Integrated') {
      alternatives.push('العلاج المتكامل (كيميائي + طبيعي)');
    }

    alternatives.push('تغيير نوع المبيد لتجنب المقاومة');
    alternatives.push('زيادة التركيز أو تكرار العلاج');

    return alternatives;
  }
}

// Mock database for treatment history
let treatmentHistoryDB: TreatmentHistory[] = [
  {
    historyId: 'hist-001',
    userId: 'user-123',
    planId: 'plan-001',
    cropId: 'crop-tomato-01',
    startDate: new Date('2024-01-10'),
    endDate: new Date('2024-01-25'),
    status: 'Completed',
    progress: {
      completedSteps: [1, 2, 3],
      currentStep: 3,
      effectiveness: 85,
      sideEffects: [],
      farmerNotes: ['تحسن ملحوظ بعد العلاج الثاني', 'توقف انتشار المرض']
    },
    results: {
      diseaseEliminated: true,
      cropRecovery: 90,
      yieldImpact: -5,
      costActual: 75.0,
      timeToRecovery: 15
    },
    followUpAlerts: ['مراقبة وقائية شهرياً', 'فحص الأوراق الجديدة']
  }
];

// API Routes

// Generate treatment recommendation
router.post('/recommend', (req, res) => {
  try {
    const {
      diseaseId,
      diseaseName,
      cropType,
      severity,
      farmerPreferences
    } = req.body;

    if (!diseaseId || !diseaseName || !cropType || !severity) {
      return res.status(400).json({
        success: false,
        message: 'بيانات غير مكتملة لتوليد التوصية'
      });
    }

    const treatmentPlan = AITreatmentEngine.generateTreatmentPlan(
      diseaseId,
      diseaseName,
      cropType,
      severity,
      farmerPreferences || {
        approach: 'Chemical',
        budget: 100,
        urgency: 'Medium',
        organicPreference: false,
        experienceLevel: 'Intermediate'
      }
    );

    res.json({
      success: true,
      data: treatmentPlan,
      message: 'تم توليد خطة العلاج بنجاح'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'فشل في توليد خطة العلاج',
      error: error.message
    });
  }
});

// Get treatment products
router.get('/products', (req, res) => {
  try {
    const { cropType, approach, type } = req.query;
    
    let filteredProducts = [...treatmentProducts];
    
    if (cropType) {
      filteredProducts = filteredProducts.filter(p => 
        p.compatibleCrops.includes(cropType as string)
      );
    }
    
    if (approach === 'Organic') {
      filteredProducts = filteredProducts.filter(p => p.organicApproved);
    }
    
    if (type) {
      filteredProducts = filteredProducts.filter(p => p.type === type);
    }

    res.json({
      success: true,
      data: filteredProducts,
      total: filteredProducts.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'فشل في جلب منتجات العلاج',
      error: error.message
    });
  }
});

// Get treatment history
router.get('/history/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const { status, cropId } = req.query;
    
    let userHistory = treatmentHistoryDB.filter(h => h.userId === userId);
    
    if (status) {
      userHistory = userHistory.filter(h => h.status === status);
    }
    
    if (cropId) {
      userHistory = userHistory.filter(h => h.cropId === cropId);
    }
    
    // Sort by date
    userHistory.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    
    res.json({
      success: true,
      data: userHistory,
      total: userHistory.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'فشل في جلب تاريخ العلاجات',
      error: error.message
    });
  }
});

// Start treatment plan
router.post('/start', (req, res) => {
  try {
    const { planId, userId, cropId } = req.body;
    
    const historyEntry: TreatmentHistory = {
      historyId: `hist_${Date.now()}`,
      userId,
      planId,
      cropId,
      startDate: new Date(),
      status: 'Active',
      progress: {
        completedSteps: [],
        currentStep: 1,
        effectiveness: 0,
        sideEffects: [],
        farmerNotes: []
      },
      results: {
        diseaseEliminated: false,
        cropRecovery: 0,
        yieldImpact: 0,
        costActual: 0,
        timeToRecovery: 0
      },
      followUpAlerts: []
    };
    
    treatmentHistoryDB.push(historyEntry);
    
    res.json({
      success: true,
      data: historyEntry,
      message: 'تم بدء خطة العلاج بنجاح'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'فشل في بدء خطة العلاج',
      error: error.message
    });
  }
});

// Update treatment progress
router.patch('/progress/:historyId', (req, res) => {
  try {
    const { historyId } = req.params;
    const { stepCompleted, effectiveness, notes, sideEffects } = req.body;
    
    const historyIndex = treatmentHistoryDB.findIndex(h => h.historyId === historyId);
    
    if (historyIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'سجل العلاج غير موجود'
      });
    }
    
    const history = treatmentHistoryDB[historyIndex];
    
    if (stepCompleted && !history.progress.completedSteps.includes(stepCompleted)) {
      history.progress.completedSteps.push(stepCompleted);
      history.progress.currentStep = Math.max(history.progress.currentStep, stepCompleted + 1);
    }
    
    if (effectiveness !== undefined) {
      history.progress.effectiveness = effectiveness;
    }
    
    if (notes) {
      history.progress.farmerNotes.push(`${new Date().toLocaleDateString('ar-EG')}: ${notes}`);
    }
    
    if (sideEffects) {
      history.progress.sideEffects.push(...sideEffects);
    }
    
    res.json({
      success: true,
      data: history,
      message: 'تم تحديث تقدم العلاج بنجاح'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'فشل في تحديث تقدم العلاج',
      error: error.message
    });
  }
});

// Complete treatment
router.post('/complete/:historyId', (req, res) => {
  try {
    const { historyId } = req.params;
    const { results } = req.body;
    
    const historyIndex = treatmentHistoryDB.findIndex(h => h.historyId === historyId);
    
    if (historyIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'سجل العلاج غير موجود'
      });
    }
    
    const history = treatmentHistoryDB[historyIndex];
    history.status = 'Completed';
    history.endDate = new Date();
    
    if (results) {
      history.results = { ...history.results, ...results };
    }
    
    res.json({
      success: true,
      data: history,
      message: 'تم إنهاء العلاج بنجاح'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'فشل في إنهاء العلاج',
      error: error.message
    });
  }
});

// Get treatment statistics
router.get('/stats/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const userHistory = treatmentHistoryDB.filter(h => h.userId === userId);
    
    const stats = {
      totalTreatments: userHistory.length,
      completed: userHistory.filter(h => h.status === 'Completed').length,
      active: userHistory.filter(h => h.status === 'Active').length,
      successRate: userHistory.length > 0 ? 
        userHistory.filter(h => h.results.diseaseEliminated).length / userHistory.length * 100 : 0,
      averageRecovery: userHistory.length > 0 ?
        userHistory.reduce((sum, h) => sum + h.results.cropRecovery, 0) / userHistory.length : 0,
      totalCost: userHistory.reduce((sum, h) => sum + h.results.costActual, 0),
      averageDuration: userHistory.filter(h => h.endDate).length > 0 ?
        userHistory.filter(h => h.endDate).reduce((sum, h) => {
          const duration = h.endDate ? 
            (h.endDate.getTime() - h.startDate.getTime()) / (1000 * 60 * 60 * 24) : 0;
          return sum + duration;
        }, 0) / userHistory.filter(h => h.endDate).length : 0
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'فشل في جلب إحصائيات العلاج',
      error: error.message
    });
  }
});

export default router;
