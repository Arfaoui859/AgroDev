import express from 'express';

const router = express.Router();

// Types and interfaces for AI soil problem detection
interface SoilData {
  id: string;
  fieldId: string;
  location: string;
  samplingDate: string;
  ph: number;
  nitrogen: number; // mg/kg
  phosphorus: number; // mg/kg
  potassium: number; // mg/kg
  organicMatter: number; // %
  electricalConductivity: number; // dS/m (salinity indicator)
  moisture: number; // %
  temperature: number; // °C
  calcium: number; // mg/kg
  magnesium: number; // mg/kg
  sulfur: number; // mg/kg
  iron: number; // mg/kg
  zinc: number; // mg/kg
  manganese: number; // mg/kg
  copper: number; // mg/kg
  boron: number; // mg/kg
  soilTexture: 'clay' | 'sandy' | 'loamy' | 'silty';
  cropType?: string;
  season?: 'winter' | 'summer' | 'spring' | 'autumn';
}

interface SoilProblem {
  id: string;
  type: 'salinity' | 'acidity' | 'alkalinity' | 'nutrient_deficiency' | 'nutrient_excess' | 'contamination' | 'waterlogging' | 'drought_stress' | 'compaction';
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedParameter: string;
  currentValue: number;
  optimalRange: {
    min: number;
    max: number;
  };
  description: string;
  causes: string[];
  impacts: string[];
  urgency: 'immediate' | 'within_week' | 'within_month' | 'monitoring';
  estimatedCost: number; // TND
  timeToResolve: string;
}

interface SoilRecommendation {
  id: string;
  problemId: string;
  title: string;
  description: string;
  steps: string[];
  materials: {
    name: string;
    quantity: number;
    unit: string;
    estimatedCost: number;
  }[];
  timeline: string;
  expectedImprovement: number; // percentage
  priority: 'high' | 'medium' | 'low';
  difficulty: 'easy' | 'moderate' | 'difficult';
  success_rate: number; // percentage
}

interface SoilAlert {
  id: string;
  fieldId: string;
  problemType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  actionRequired: string;
  dateCreated: string;
  resolved: boolean;
  notificationSent: boolean;
}

interface IdealSoilProfile {
  cropType: string;
  season: string;
  soilType: string;
  optimalValues: {
    ph: { min: number; max: number };
    nitrogen: { min: number; max: number };
    phosphorus: { min: number; max: number };
    potassium: { min: number; max: number };
    organicMatter: { min: number; max: number };
    electricalConductivity: { min: number; max: number };
    moisture: { min: number; max: number };
    calcium: { min: number; max: number };
    magnesium: { min: number; max: number };
    micronutrients: {
      iron: { min: number; max: number };
      zinc: { min: number; max: number };
      manganese: { min: number; max: number };
      copper: { min: number; max: number };
      boron: { min: number; max: number };
    };
  };
}

// Agricultural Knowledge Base for Tunisia
const TUNISIAN_SOIL_KNOWLEDGE_BASE = {
  idealProfiles: {
    wheat: {
      winter: {
        clay: {
          ph: { min: 6.0, max: 7.5 },
          nitrogen: { min: 40, max: 80 },
          phosphorus: { min: 15, max: 30 },
          potassium: { min: 150, max: 300 },
          organicMatter: { min: 2.0, max: 4.0 },
          electricalConductivity: { min: 0.0, max: 2.0 },
          moisture: { min: 15, max: 25 }
        },
        sandy: {
          ph: { min: 6.2, max: 7.8 },
          nitrogen: { min: 50, max: 90 },
          phosphorus: { min: 20, max: 35 },
          potassium: { min: 180, max: 350 },
          organicMatter: { min: 1.5, max: 3.5 },
          electricalConductivity: { min: 0.0, max: 1.5 },
          moisture: { min: 10, max: 18 }
        }
      }
    },
    olive: {
      spring: {
        clay: {
          ph: { min: 6.5, max: 8.0 },
          nitrogen: { min: 30, max: 60 },
          phosphorus: { min: 10, max: 25 },
          potassium: { min: 200, max: 400 },
          organicMatter: { min: 2.5, max: 5.0 },
          electricalConductivity: { min: 0.0, max: 4.0 },
          moisture: { min: 12, max: 20 }
        }
      }
    },
    tomato: {
      summer: {
        loamy: {
          ph: { min: 6.0, max: 7.0 },
          nitrogen: { min: 60, max: 120 },
          phosphorus: { min: 25, max: 50 },
          potassium: { min: 250, max: 500 },
          organicMatter: { min: 3.0, max: 6.0 },
          electricalConductivity: { min: 0.0, max: 2.5 },
          moisture: { min: 20, max: 30 }
        }
      }
    },
    citrus: {
      spring: {
        loamy: {
          ph: { min: 6.0, max: 7.5 },
          nitrogen: { min: 80, max: 150 },
          phosphorus: { min: 20, max: 40 },
          potassium: { min: 300, max: 600 },
          organicMatter: { min: 3.5, max: 7.0 },
          electricalConductivity: { min: 0.0, max: 3.0 },
          moisture: { min: 18, max: 28 }
        }
      }
    }
  },
  problemDefinitions: {
    salinity: {
      thresholds: {
        low: { min: 2.0, max: 4.0 },
        medium: { min: 4.0, max: 8.0 },
        high: { min: 8.0, max: 16.0 },
        critical: { min: 16.0, max: 50.0 }
      },
      causes: [
        'استخدام مياه مالحة في الري',
        'سوء الصرف وتراكم الأملاح',
        'الري المفرط في المناطق الساحلية',
        'استخدام أسمدة عالية الملوحة',
        'تسرب مياه البحر للطبقات الجوفية'
      ],
      impacts: [
        'انخفاض إنبات البذور',
        'تأخر نمو النباتات',
        'اصفرار الأوراق وذبولها',
        'انخفاض الإنتاجية بشكل كبير',
        'موت النباتات في الحالات الشديدة'
      ]
    },
    acidity: {
      thresholds: {
        low: { min: 5.5, max: 6.0 },
        medium: { min: 4.5, max: 5.5 },
        high: { min: 3.5, max: 4.5 },
        critical: { min: 0.0, max: 3.5 }
      },
      causes: [
        'الأمطار الحمضية الكثيفة',
        'الاستخدام المفرط للأسمدة النيتروجينية',
        'تحلل المواد العضوية الحمضية',
        'رشح العناصر القاعدية من التربة',
        'استخدام مياه حمضية في الري'
      ],
      impacts: [
        'انخفاض توفر العناصر الغذائية',
        'زيادة سمية الألومنيوم والمنغنيز',
        'تدهور بنية التربة',
        'انخفاض نشاط الكائنات الدقيقة المفيدة',
        'ضعف نمو الجذور'
      ]
    },
    alkalinity: {
      thresholds: {
        low: { min: 7.5, max: 8.0 },
        medium: { min: 8.0, max: 8.5 },
        high: { min: 8.5, max: 9.0 },
        critical: { min: 9.0, max: 14.0 }
      },
      causes: [
        'وجود كربونات الكالسيوم بكثرة',
        'استخدام مياه قلوية في الري',
        'الإفراط في استخدام الجير',
        'سوء الصرف في المناطق الجافة',
        'تراكم الأملاح القلوية'
      ],
      impacts: [
        'انخفاض توفر الحديد والمنغنيز والزنك',
        'اصفرار الأوراق (الكلوروز)',
        'ضعف امتصاص الفوسفور',
        'تكون طبقات صلبة في التربة',
        'انخفاض الإنتاجية'
      ]
    }
  }
};

// AI Analysis Engine
class SoilProblemDetector {
  private knowledgeBase = TUNISIAN_SOIL_KNOWLEDGE_BASE;

  public analyzeSoil(soilData: SoilData): {
    problems: SoilProblem[];
    recommendations: SoilRecommendation[];
    alerts: SoilAlert[];
    overallHealthScore: number;
  } {
    const problems: SoilProblem[] = [];
    const recommendations: SoilRecommendation[] = [];
    const alerts: SoilAlert[] = [];

    // Get ideal profile for comparison
    const idealProfile = this.getIdealProfile(soilData.cropType || 'wheat', soilData.season || 'winter', soilData.soilTexture);

    // Analyze each parameter
    problems.push(...this.detectSalinityProblems(soilData));
    problems.push(...this.detectPhProblems(soilData, idealProfile));
    problems.push(...this.detectNutrientProblems(soilData, idealProfile));
    problems.push(...this.detectMoistureProblems(soilData, idealProfile));
    problems.push(...this.detectOrganicMatterProblems(soilData, idealProfile));

    // Generate recommendations for each problem
    problems.forEach(problem => {
      const recs = this.generateRecommendations(problem, soilData);
      recommendations.push(...recs);
    });

    // Generate alerts for critical problems
    const criticalProblems = problems.filter(p => p.severity === 'critical' || p.urgency === 'immediate');
    criticalProblems.forEach(problem => {
      alerts.push(this.createAlert(problem, soilData.fieldId));
    });

    // Calculate overall health score
    const overallHealthScore = this.calculateHealthScore(problems, soilData);

    return {
      problems,
      recommendations,
      alerts,
      overallHealthScore
    };
  }

  private getIdealProfile(cropType: string, season: string, soilType: string): any {
    return this.knowledgeBase.idealProfiles[cropType as keyof typeof this.knowledgeBase.idealProfiles]?.[season as keyof any]?.[soilType as keyof any] || 
           this.knowledgeBase.idealProfiles.wheat.winter.clay; // Default fallback
  }

  private detectSalinityProblems(soilData: SoilData): SoilProblem[] {
    const problems: SoilProblem[] = [];
    const ec = soilData.electricalConductivity;
    const salinityDef = this.knowledgeBase.problemDefinitions.salinity;

    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let urgency: 'immediate' | 'within_week' | 'within_month' | 'monitoring' = 'monitoring';

    if (ec >= salinityDef.thresholds.critical.min) {
      severity = 'critical';
      urgency = 'immediate';
    } else if (ec >= salinityDef.thresholds.high.min) {
      severity = 'high';
      urgency = 'within_week';
    } else if (ec >= salinityDef.thresholds.medium.min) {
      severity = 'medium';
      urgency = 'within_month';
    } else if (ec >= salinityDef.thresholds.low.min) {
      severity = 'low';
      urgency = 'monitoring';
    }

    if (ec >= salinityDef.thresholds.low.min) {
      problems.push({
        id: `salinity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'salinity',
        severity,
        affectedParameter: 'الملوحة (التوصيل الكهربائي)',
        currentValue: ec,
        optimalRange: { min: 0.0, max: 2.0 },
        description: `مستوى الملوحة في التربة ${severity === 'critical' ? 'مرتفع جداً وخطير' : severity === 'high' ? 'مرتفع' : 'أعلى من المط��وب'}`,
        causes: salinityDef.causes,
        impacts: salinityDef.impacts,
        urgency,
        estimatedCost: this.calculateRemediationCost('salinity', severity),
        timeToResolve: this.getTimeToResolve('salinity', severity)
      });
    }

    return problems;
  }

  private detectPhProblems(soilData: SoilData, idealProfile: any): SoilProblem[] {
    const problems: SoilProblem[] = [];
    const ph = soilData.ph;
    const optimalRange = idealProfile?.ph || { min: 6.0, max: 7.5 };

    if (ph < optimalRange.min) {
      // Soil is too acidic
      const acidityDef = this.knowledgeBase.problemDefinitions.acidity;
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';

      if (ph <= acidityDef.thresholds.critical.max) severity = 'critical';
      else if (ph <= acidityDef.thresholds.high.max) severity = 'high';
      else if (ph <= acidityDef.thresholds.medium.max) severity = 'medium';

      problems.push({
        id: `acidity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'acidity',
        severity,
        affectedParameter: 'درجة الحموضة (pH)',
        currentValue: ph,
        optimalRange,
        description: `التربة حمضية أكثر من اللازم`,
        causes: acidityDef.causes,
        impacts: acidityDef.impacts,
        urgency: severity === 'critical' ? 'immediate' : severity === 'high' ? 'within_week' : 'within_month',
        estimatedCost: this.calculateRemediationCost('acidity', severity),
        timeToResolve: this.getTimeToResolve('acidity', severity)
      });
    } else if (ph > optimalRange.max) {
      // Soil is too alkaline
      const alkalinityDef = this.knowledgeBase.problemDefinitions.alkalinity;
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';

      if (ph >= alkalinityDef.thresholds.critical.min) severity = 'critical';
      else if (ph >= alkalinityDef.thresholds.high.min) severity = 'high';
      else if (ph >= alkalinityDef.thresholds.medium.min) severity = 'medium';

      problems.push({
        id: `alkalinity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'alkalinity',
        severity,
        affectedParameter: 'درجة الحموضة (pH)',
        currentValue: ph,
        optimalRange,
        description: `التربة قلوية أكثر من اللازم`,
        causes: alkalinityDef.causes,
        impacts: alkalinityDef.impacts,
        urgency: severity === 'critical' ? 'immediate' : severity === 'high' ? 'within_week' : 'within_month',
        estimatedCost: this.calculateRemediationCost('alkalinity', severity),
        timeToResolve: this.getTimeToResolve('alkalinity', severity)
      });
    }

    return problems;
  }

  private detectNutrientProblems(soilData: SoilData, idealProfile: any): SoilProblem[] {
    const problems: SoilProblem[] = [];
    const nutrients = [
      { name: 'nitrogen', value: soilData.nitrogen, label: 'النيتروجين', unit: 'mg/kg' },
      { name: 'phosphorus', value: soilData.phosphorus, label: 'الفوسفور', unit: 'mg/kg' },
      { name: 'potassium', value: soilData.potassium, label: 'البوتاسيوم', unit: 'mg/kg' }
    ];

    nutrients.forEach(nutrient => {
      const optimalRange = idealProfile?.[nutrient.name] || { min: 20, max: 100 };
      
      if (nutrient.value < optimalRange.min) {
        const deficiency = (optimalRange.min - nutrient.value) / optimalRange.min;
        let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
        
        if (deficiency > 0.7) severity = 'critical';
        else if (deficiency > 0.5) severity = 'high';
        else if (deficiency > 0.3) severity = 'medium';

        problems.push({
          id: `${nutrient.name}_deficiency_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'nutrient_deficiency',
          severity,
          affectedParameter: nutrient.label,
          currentValue: nutrient.value,
          optimalRange,
          description: `نقص في عنصر ${nutrient.label} - المستوى الحالي ${nutrient.value} ${nutrient.unit}`,
          causes: [
            'استنزاف العنصر من التربة بسبب الزراعة المكثفة',
            'سوء الصرف يؤثر على توفر العناصر',
            'عدم التسميد المناسب',
            'تفاعلات كيميائية تقلل من توفر العنصر'
          ],
          impacts: [
            'انخفاض نمو النباتات',
            'اصفرار الأوراق',
            'ضعف الإنتاجية',
            'زيادة قابلية الإصا��ة بالأمراض'
          ],
          urgency: severity === 'critical' ? 'immediate' : 'within_month',
          estimatedCost: this.calculateNutrientCost(nutrient.name, severity),
          timeToResolve: '2-4 أسابيع'
        });
      } else if (nutrient.value > optimalRange.max) {
        const excess = (nutrient.value - optimalRange.max) / optimalRange.max;
        let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
        
        if (excess > 2.0) severity = 'critical';
        else if (excess > 1.5) severity = 'high';
        else if (excess > 1.0) severity = 'medium';

        problems.push({
          id: `${nutrient.name}_excess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'nutrient_excess',
          severity,
          affectedParameter: nutrient.label,
          currentValue: nutrient.value,
          optimalRange,
          description: `زيادة في عنصر ${nutrient.label} - المستوى الحالي ${nutrient.value} ${nutrient.unit}`,
          causes: [
            'الإفراط في التسميد',
            'استخدام أسمدة غير متوازنة',
            'سوء توقيت التسميد',
            'عدم خلط التربة جيداً بعد التسميد'
          ],
          impacts: [
            'حرق جذور النباتات',
            'عدم توازن العناصر الغذائية',
            'تلوث المياه الجوفية',
            'زيادة ملوحة التربة'
          ],
          urgency: severity === 'critical' ? 'immediate' : 'within_month',
          estimatedCost: this.calculateRemediationCost('nutrient_excess', severity),
          timeToResolve: '4-8 أسابيع'
        });
      }
    });

    return problems;
  }

  private detectMoistureProblems(soilData: SoilData, idealProfile: any): SoilProblem[] {
    const problems: SoilProblem[] = [];
    const moisture = soilData.moisture;
    const optimalRange = idealProfile?.moisture || { min: 15, max: 25 };

    if (moisture < optimalRange.min) {
      const dryness = (optimalRange.min - moisture) / optimalRange.min;
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
      
      if (dryness > 0.6) severity = 'critical';
      else if (dryness > 0.4) severity = 'high';
      else if (dryness > 0.2) severity = 'medium';

      problems.push({
        id: `drought_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'drought_stress',
        severity,
        affectedParameter: 'رطوبة التربة',
        currentValue: moisture,
        optimalRange,
        description: `التربة جافة أكثر من اللا��م - الرطوبة الحالية ${moisture}%`,
        causes: [
          'قلة الأمطار أو الري',
          'ارتفاع درجات الحرارة',
          'سوء توزيع المياه',
          'تربة رملية سريعة التصريف',
          'رياح قوية تزيد التبخر'
        ],
        impacts: [
          'ذبول النباتات',
          'انخفاض معدل النمو',
          'تشقق التربة',
          'انخفاض الإنتاجية بشكل كبير',
          'موت النباتات في الحالات الشديدة'
        ],
        urgency: severity === 'critical' ? 'immediate' : 'within_week',
        estimatedCost: this.calculateIrrigationCost(severity),
        timeToResolve: '1-2 أسبوع'
      });
    } else if (moisture > optimalRange.max) {
      const wetness = (moisture - optimalRange.max) / optimalRange.max;
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
      
      if (wetness > 1.0) severity = 'critical';
      else if (wetness > 0.7) severity = 'high';
      else if (wetness > 0.4) severity = 'medium';

      problems.push({
        id: `waterlogging_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'waterlogging',
        severity,
        affectedParameter: 'رطوبة التربة',
        currentValue: moisture,
        optimalRange,
        description: `التربة مشبعة بالماء أكثر من اللازم - الرطوبة الحالية ${moisture}%`,
        causes: [
          'إفراط في الري',
          'سوء الصرف',
          'أمطار غزيرة',
          'تربة طينية كثيفة',
          'انسداد قنوات الصرف'
        ],
        impacts: [
          'نقص الأكسجين في منطقة الجذور',
          'تعفن الجذور',
          'زيادة الأمراض الفطرية',
          'انخفاض امتصاص العناصر الغذائية',
          'موت النباتات من الاختناق'
        ],
        urgency: severity === 'critical' ? 'immediate' : 'within_week',
        estimatedCost: this.calculateDrainageCost(severity),
        timeToResolve: '2-6 أسابيع'
      });
    }

    return problems;
  }

  private detectOrganicMatterProblems(soilData: SoilData, idealProfile: any): SoilProblem[] {
    const problems: SoilProblem[] = [];
    const organicMatter = soilData.organicMatter;
    const optimalRange = idealProfile?.organicMatter || { min: 2.0, max: 5.0 };

    if (organicMatter < optimalRange.min) {
      const deficiency = (optimalRange.min - organicMatter) / optimalRange.min;
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
      
      if (deficiency > 0.7) severity = 'high';
      else if (deficiency > 0.5) severity = 'medium';

      problems.push({
        id: `organic_matter_low_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'nutrient_deficiency',
        severity,
        affectedParameter: 'المادة العضوية',
        currentValue: organicMatter,
        optimalRange,
        description: `نقص في المادة العضوية - المستوى الحالي ${organicMatter}%`,
        causes: [
          'قلة إضافة الكوم��وست أو السماد العضوي',
          'الزراعة المكثفة بدون راحة للتربة',
          'حرق مخلفات المحاصيل',
          'التعرية والتآكل',
          'درجات حرارة عالية تسرع تحلل المادة العضوية'
        ],
        impacts: [
          'انخفاض خصوبة التربة',
          'ضعف بنية التربة',
          'انخفاض قدرة التربة على الاحتفاظ بالماء',
          'قلة النشاط البيولوجي في التربة',
          'انخفاض مقاومة التربة للتعرية'
        ],
        urgency: 'within_month',
        estimatedCost: this.calculateOrganicMatterCost(severity),
        timeToResolve: '3-6 أشهر'
      });
    }

    return problems;
  }

  private generateRecommendations(problem: SoilProblem, soilData: SoilData): SoilRecommendation[] {
    const recommendations: SoilRecommendation[] = [];

    switch (problem.type) {
      case 'salinity':
        recommendations.push({
          id: `rec_salinity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          problemId: problem.id,
          title: 'معالجة ملوحة التربة',
          description: 'خطة متكاملة لتقليل ملوح�� التربة وتحسين الصرف',
          steps: [
            'تحسين نظام الصرف لمنع تراكم الأملاح',
            'الري بكميات كبيرة من المياه العذبة لغسل الأملاح',
            'إضافة الجبس الزراعي بمعدل 2-5 طن/هكتار',
            'زراعة محاصيل مقاومة للملوحة مؤقتاً',
            'إضافة المادة العضوية لتحسين بنية التربة'
          ],
          materials: [
            { name: 'جبس زراعي', quantity: 3, unit: 'طن/هكتار', estimatedCost: 450 },
            { name: 'كومبوست', quantity: 5, unit: 'طن/هكتار', estimatedCost: 750 },
            { name: 'أنابيب صرف', quantity: 100, unit: 'متر', estimatedCost: 300 }
          ],
          timeline: '3-6 أشهر',
          expectedImprovement: 60,
          priority: problem.severity === 'critical' ? 'high' : 'medium',
          difficulty: 'moderate',
          success_rate: 80
        });
        break;

      case 'acidity':
        recommendations.push({
          id: `rec_acidity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          problemId: problem.id,
          title: 'معالجة حموضة التربة',
          description: 'رفع درجة pH التربة للمستوى المناسب للزراعة',
          steps: [
            'إضافة الجير الزراعي للتربة',
            'خلط الجير جيداً مع التربة على عمق 20-30 سم',
            'ترك التربة لتستقر لمدة 2-4 أسابيع',
            'إضافة المادة العضوية لتحسين التوازن',
            'مراقبة مستوى pH بشكل دوري'
          ],
          materials: [
            { name: 'جير زراعي (كربونات كالسيوم)', quantity: 2, unit: 'طن/هكتار', estimatedCost: 280 },
            { name: 'كومبوست', quantity: 3, unit: 'طن/هكتار', estimatedCost: 450 }
          ],
          timeline: '2-3 أشهر',
          expectedImprovement: 70,
          priority: 'high',
          difficulty: 'easy',
          success_rate: 90
        });
        break;

      case 'alkalinity':
        recommendations.push({
          id: `rec_alkalinity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          problemId: problem.id,
          title: 'معالجة قلوية التربة',
          description: 'خفض درجة pH التربة وتحسين توفر العناصر الغذائية',
          steps: [
            'إضافة الكبريت الزراعي للتربة',
            'استخدام الأسمدة الحمضية مثل سلفات الأمونيوم',
            'إضافة المادة العضوية المتحللة',
            'تحسين الصرف لمنع تراكم الأملاح القلوية',
            'استخدام مياه ري حمضية قليلاً'
          ],
          materials: [
            { name: 'كبريت زراعي', quantity: 500, unit: 'كيلو/هكتار', estimatedCost: 200 },
            { name: 'سلفات أمونيوم', quantity: 300, unit: 'كيلو/هكتار', estimatedCost: 180 },
            { name: 'سماد عضوي متحلل', quantity: 4, unit: 'طن/هكتار', estimatedCost: 600 }
          ],
          timeline: '3-4 أشهر',
          expectedImprovement: 65,
          priority: 'high',
          difficulty: 'moderate',
          success_rate: 75
        });
        break;

      case 'nutrient_deficiency':
        const nutrientName = problem.affectedParameter;
        recommendations.push({
          id: `rec_nutrient_${nutrientName.replace(/\s+/g, '_')}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          problemId: problem.id,
          title: `معالجة نقص ${nutrientName}`,
          description: `خطة لتعوي�� نقص عنصر ${nutrientName} في التربة`,
          steps: [
            `إضافة السماد المناسب الغني بعنصر ${nutrientName}`,
            'توزيع السماد بشكل متجانس على التربة',
            'خلط السماد مع التربة على العمق المناسب',
            'الري بعد التسميد لتذويب العناصر',
            'متابعة مستوى العنصر بفحوصات دورية'
          ],
          materials: this.getNutrientMaterials(nutrientName, problem.severity),
          timeline: '2-4 أسابيع',
          expectedImprovement: 80,
          priority: problem.severity === 'critical' ? 'high' : 'medium',
          difficulty: 'easy',
          success_rate: 95
        });
        break;

      case 'drought_stress':
        recommendations.push({
          id: `rec_drought_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          problemId: problem.id,
          title: 'معالجة جفاف التربة',
          description: 'زيادة رطوبة التربة وتحسين الاحتفاظ بالماء',
          steps: [
            'زيادة معدل الري بشكل تدريجي',
            'استخدام الري بالتنقيط لتوفير المياه',
            'إضافة المهاد (المولش) للاحتفاظ بالرطوبة',
            'زراعة نباتات كسر الرياح',
            'إضافة مواد محسنة للتربة لزيادة الاحتفاظ بالماء'
          ],
          materials: [
            { name: 'نظام ري بالتنقيط', quantity: 1, unit: 'هكتار', estimatedCost: 1200 },
            { name: 'مهاد عضوي', quantity: 2, unit: 'طن/هكتار', estimatedCost: 300 },
            { name: 'هايدروجل محسن للتربة', quantity: 50, unit: 'كيلو/هكتار', estimatedCost: 250 }
          ],
          timeline: '1-2 أسبوع',
          expectedImprovement: 85,
          priority: 'high',
          difficulty: 'moderate',
          success_rate: 90
        });
        break;

      case 'waterlogging':
        recommendations.push({
          id: `rec_waterlog_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          problemId: problem.id,
          title: 'معالجة غمر التربة بالماء',
          description: 'تحسين الصرف وتقليل الرطوبة الزائدة',
          steps: [
            'إنشاء قنوات صرف لتسريب المياه الزائدة',
            'تقليل كمية الري المؤقت',
            'إضافة الرمل والحصى لتحسين التصريف',
            'رفع مستوى الأحواض الزراعية',
            'زراعة نباتات ماصة للرطوبة مؤقتاً'
          ],
          materials: [
            { name: 'أنابيب صرف مثقبة', quantity: 150, unit: 'متر', estimatedCost: 450 },
            { name: 'رمل خشن', quantity: 10, unit: 'متر مكعب', estimatedCost: 400 },
            { name: 'حصى صرف', quantity: 5, unit: 'متر مكعب', estimatedCost: 300 }
          ],
          timeline: '2-4 أسابيع',
          expectedImprovement: 75,
          priority: 'high',
          difficulty: 'difficult',
          success_rate: 85
        });
        break;
    }

    return recommendations;
  }

  private createAlert(problem: SoilProblem, fieldId: string): SoilAlert {
    return {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fieldId,
      problemType: problem.type,
      severity: problem.severity,
      message: `تنبيه ${problem.severity === 'critical' ? 'حرج' : 'مهم'}: ${problem.description}`,
      actionRequired: problem.urgency === 'immediate' ? 'تدخل فوري مطلوب' : 
                     problem.urgency === 'within_week' ? 'تدخل خلال أسبوع' : 'مراقبة مستمرة',
      dateCreated: new Date().toISOString().split('T')[0],
      resolved: false,
      notificationSent: false
    };
  }

  private calculateHealthScore(problems: SoilProblem[], soilData: SoilData): number {
    let baseScore = 100;
    
    problems.forEach(problem => {
      switch (problem.severity) {
        case 'critical':
          baseScore -= 25;
          break;
        case 'high':
          baseScore -= 15;
          break;
        case 'medium':
          baseScore -= 10;
          break;
        case 'low':
          baseScore -= 5;
          break;
      }
    });

    return Math.max(0, Math.min(100, baseScore));
  }

  private calculateRemediationCost(problemType: string, severity: string): number {
    const baseCosts = {
      salinity: { low: 200, medium: 500, high: 1000, critical: 2000 },
      acidity: { low: 150, medium: 300, high: 600, critical: 1200 },
      alkalinity: { low: 180, medium: 400, high: 800, critical: 1500 },
      nutrient_excess: { low: 100, medium: 250, high: 500, critical: 1000 }
    };

    return baseCosts[problemType as keyof typeof baseCosts]?.[severity as keyof any] || 300;
  }

  private calculateNutrientCost(nutrient: string, severity: string): number {
    const costs = {
      nitrogen: { low: 80, medium: 150, high: 300, critical: 500 },
      phosphorus: { low: 120, medium: 200, high: 400, critical: 700 },
      potassium: { low: 100, medium: 180, high: 350, critical: 600 }
    };

    return costs[nutrient as keyof typeof costs]?.[severity as keyof any] || 200;
  }

  private calculateIrrigationCost(severity: string): number {
    const costs = { low: 200, medium: 400, high: 800, critical: 1500 };
    return costs[severity as keyof typeof costs] || 300;
  }

  private calculateDrainageCost(severity: string): number {
    const costs = { low: 400, medium: 800, high: 1500, critical: 3000 };
    return costs[severity as keyof typeof costs] || 600;
  }

  private calculateOrganicMatterCost(severity: string): number {
    const costs = { low: 300, medium: 500, high: 800, critical: 1200 };
    return costs[severity as keyof typeof costs] || 400;
  }

  private getTimeToResolve(problemType: string, severity: string): string {
    const times = {
      salinity: { low: '2-3 أشهر', medium: '3-6 أشهر', high: '6-12 شهر', critical: '12-18 شهر' },
      acidity: { low: '1-2 شهر', medium: '2-3 أشهر', high: '3-6 أشهر', critical: '6-12 شهر' },
      alkalinity: { low: '2-3 أشهر', medium: '3-4 أشهر', high: '4-8 أشهر', critical: '8-12 شهر' }
    };

    return times[problemType as keyof typeof times]?.[severity as keyof any] || '2-4 أشهر';
  }

  private getNutrientMaterials(nutrientName: string, severity: string): any[] {
    const materials = {
      'النيتروجين': [
        { name: 'يوريا 46%', quantity: 100, unit: 'كيلو/هكتار', estimatedCost: 120 },
        { name: 'سلفات أمونيوم', quantity: 150, unit: 'كيلو/هكتار', estimatedCost: 90 }
      ],
      'الفوسفور': [
        { name: 'سوبر فوسفات', quantity: 200, unit: 'كيلو/هكتار', estimatedCost: 160 },
        { name: 'فوسفات ثنائي الأمونيوم', quantity: 120, unit: 'كيلو/هكتار', estimatedCost: 180 }
      ],
      'البوتاسيوم': [
        { name: 'سلفات البوتاسيوم', quantity: 150, unit: 'كيلو/هكتار', estimatedCost: 210 },
        { name: 'كلوريد البوتاسيوم', quantity: 100, unit: 'كيلو/هكتار', estimatedCost: 130 }
      ]
    };

    return materials[nutrientName as keyof typeof materials] || [];
  }
}

// Initialize AI detector instance
const soilAI = new SoilProblemDetector();

// API Routes

// Analyze soil data and detect problems
router.post('/analyze', (req, res) => {
  try {
    const soilData: SoilData = req.body;
    
    // Validate required fields
    if (!soilData.ph || !soilData.nitrogen || !soilData.phosphorus || !soilData.potassium) {
      return res.status(400).json({
        success: false,
        message: 'بيانات التربة الأساسية مطلوبة (pH, النيتروجين, الفوسفور, البوتاسيوم)'
      });
    }

    const analysis = soilAI.analyzeSoil(soilData);
    
    res.json({
      success: true,
      data: {
        analysisDate: new Date().toISOString().split('T')[0],
        fieldId: soilData.fieldId,
        location: soilData.location,
        problems: analysis.problems,
        recommendations: analysis.recommendations,
        alerts: analysis.alerts,
        overallHealthScore: analysis.overallHealthScore,
        riskLevel: analysis.overallHealthScore >= 80 ? 'منخفض' :
                  analysis.overallHealthScore >= 60 ? 'متوسط' :
                  analysis.overallHealthScore >= 40 ? 'عالي' : 'حرج',
        summary: {
          totalProblems: analysis.problems.length,
          criticalProblems: analysis.problems.filter(p => p.severity === 'critical').length,
          immediateActions: analysis.problems.filter(p => p.urgency === 'immediate').length,
          estimatedTotalCost: analysis.recommendations.reduce((sum, r) => 
            sum + r.materials.reduce((matSum, m) => matSum + m.estimatedCost, 0), 0
          )
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ في تحليل التربة بالذكاء الاصطناعي',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get ideal soil profile for comparison
router.get('/ideal-profile', (req, res) => {
  try {
    const { cropType = 'wheat', season = 'winter', soilType = 'clay' } = req.query;
    
    const idealProfile = soilAI['getIdealProfile'](cropType as string, season as string, soilType as string);
    
    res.json({
      success: true,
      data: {
        cropType,
        season,
        soilType,
        idealValues: idealProfile,
        description: `القيم المثالية لتربة ${soilType} لزراعة ${cropType} في فصل ${season}`,
        recommendations: [
          'الحفاظ على pH في النطاق المناسب',
          'متابعة مستويات العناصر الغذائية دورياً',
          'ضمان الصرف الجيد والرطوبة المناسبة',
          'إضافة المادة العضوية بانتظام'
        ]
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ في استرجاع المعايير المثالية للتربة',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get historical analysis and trends
router.get('/history/:fieldId', (req, res) => {
  try {
    const { fieldId } = req.params;
    
    // Generate mock historical data
    const history = Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (11 - i));
      
      return {
        date: date.toISOString().split('T')[0],
        healthScore: 60 + Math.random() * 30,
        problemsCount: Math.floor(Math.random() * 5),
        mainProblems: ['salinity', 'nutrient_deficiency', 'acidity'][Math.floor(Math.random() * 3)],
        status: 'analyzed'
      };
    });
    
    res.json({
      success: true,
      data: {
        fieldId,
        analysisHistory: history,
        trends: {
          healthScoreTrend: history.map(h => h.healthScore),
          problemFrequency: {
            salinity: Math.floor(Math.random() * 5),
            nutrient_deficiency: Math.floor(Math.random() * 8),
            acidity: Math.floor(Math.random() * 3),
            alkalinity: Math.floor(Math.random() * 2)
          },
          improvementRate: 15 + Math.random() * 20
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ في استرجاع تاريخ التحليلات',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get active alerts
router.get('/alerts', (req, res) => {
  try {
    const { severity, resolved } = req.query;
    
    // Generate mock alerts
    const alerts = Array.from({ length: 8 }, (_, i) => ({
      id: `alert_${i + 1}`,
      fieldId: `field_${Math.floor(Math.random() * 5) + 1}`,
      problemType: ['salinity', 'acidity', 'nutrient_deficiency', 'waterlogging'][Math.floor(Math.random() * 4)],
      severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] as any,
      message: [
        'مستوى الملوحة مرتفع في الحقل الشمالي',
        'نقص النيتروجين في القطاع الشرقي',
        'حموضة التربة تتطلب معالجة فورية',
        'تشبع التربة بالماء في المنطقة المنخفضة'
      ][Math.floor(Math.random() * 4)],
      actionRequired: 'تدخل خلال أسبوع',
      dateCreated: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      resolved: Math.random() > 0.7,
      notificationSent: true
    }));
    
    let filteredAlerts = alerts;
    
    if (severity) {
      filteredAlerts = filteredAlerts.filter(alert => alert.severity === severity);
    }
    
    if (resolved !== undefined) {
      filteredAlerts = filteredAlerts.filter(alert => alert.resolved === (resolved === 'true'));
    }
    
    res.json({
      success: true,
      data: filteredAlerts,
      summary: {
        totalAlerts: alerts.length,
        activeAlerts: alerts.filter(a => !a.resolved).length,
        criticalAlerts: alerts.filter(a => a.severity === 'critical' && !a.resolved).length,
        pendingNotifications: alerts.filter(a => !a.notificationSent).length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ في استرجاع التنبيهات',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Mark alert as resolved
router.patch('/alerts/:alertId/resolve', (req, res) => {
  try {
    const { alertId } = req.params;
    const { resolvedBy, notes } = req.body;
    
    res.json({
      success: true,
      message: 'تم تسوية التنبيه بنجاح',
      data: {
        alertId,
        resolvedAt: new Date().toISOString(),
        resolvedBy: resolvedBy || 'المستخدم الحالي',
        notes: notes || 'تم الحل بدون ملاحظات إضافية'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ ف�� تسوية التنبيه',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get problem statistics and insights
router.get('/statistics', (req, res) => {
  try {
    const stats = {
      commonProblems: [
        { type: 'nutrient_deficiency', count: 45, percentage: 35, trending: 'up' },
        { type: 'salinity', count: 32, percentage: 25, trending: 'stable' },
        { type: 'acidity', count: 28, percentage: 22, trending: 'down' },
        { type: 'waterlogging', count: 23, percentage: 18, trending: 'up' }
      ],
      byRegion: {
        'الشمال': { salinity: 15, acidity: 8, nutrient_deficiency: 12 },
        'الوسط': { salinity: 25, acidity: 18, nutrient_deficiency: 20 },
        'الجنوب': { salinity: 30, acidity: 5, nutrient_deficiency: 15 }
      },
      bySeason: {
        winter: { problems: 25, avgSeverity: 'medium', commonIssue: 'waterlogging' },
        spring: { problems: 18, avgSeverity: 'low', commonIssue: 'nutrient_deficiency' },
        summer: { problems: 35, avgSeverity: 'high', commonIssue: 'salinity' },
        autumn: { problems: 22, avgSeverity: 'medium', commonIssue: 'acidity' }
      },
      successRates: {
        salinity: 75,
        acidity: 90,
        alkalinity: 80,
        nutrient_deficiency: 95,
        waterlogging: 70
      },
      costEffectiveness: {
        preventiveMaintenance: 85,
        earlyIntervention: 70,
        lateIntervention: 45,
        emergencyResponse: 30
      }
    };
    
    res.json({
      success: true,
      data: stats,
      insights: [
        'نقص العناصر الغذائية هو المشكلة الأكثر شيوعاً (35%)',
        'الملوحة تزداد في المناطق الجنوبية والساحلية',
        'معدل نجاح العلاج أعلى مع التدخل المبكر',
        'الصيانة الوقائية توفر 55% من التكاليف مقارنة بالتدخل المتأخر'
      ]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ في استرجاع الإحصائيات',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
