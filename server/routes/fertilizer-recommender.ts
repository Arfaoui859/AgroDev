import express from 'express';

const router = express.Router();

// Comprehensive database of fertilizers suitable for Tunisia
const fertilizerDatabase = [
  {
    id: 'npk-balanced',
    name: 'سماد NPK متوازن',
    type: 'complex',
    composition: { nitrogen: 15, phosphorus: 15, potassium: 15 },
    suitable_crops: ['tomato', 'potato', 'wheat', 'barley'],
    application_method: 'soil',
    dosage_per_hectare: '200-300 kg',
    cost_per_kg: 2.8,
    supplier: 'الشركة التونسية للأسمدة',
    safety_level: 'medium',
    organic: false,
    season: 'all',
    soil_ph_range: { min: 6.0, max: 7.5 },
    benefits: ['نمو متوازن للنبات', 'تحسين جودة الثمار', 'زيادة الإنتاجية'],
    precautions: ['تجنب الإفراط في الاستخدام', 'الري بعد التطبيق مباشرة']
  },
  {
    id: 'phosphate-high',
    name: 'سماد الفوسفات العالي',
    type: 'single',
    composition: { nitrogen: 5, phosphorus: 30, potassium: 10 },
    suitable_crops: ['olive', 'citrus', 'almond'],
    application_method: 'soil',
    dosage_per_hectare: '150-200 kg',
    cost_per_kg: 3.2,
    supplier: 'مجمع الفوسفات التونسي',
    safety_level: 'low',
    organic: false,
    season: 'spring',
    soil_ph_range: { min: 5.5, max: 7.0 },
    benefits: ['تقوية جذور النبات', 'تحسين تكوين الثمار', 'مقاومة الأمراض'],
    precautions: ['عدم الخلط مع الأسمدة الكلسية']
  },
  {
    id: 'organic-compost',
    name: 'كومبوست عضوي',
    type: 'organic',
    composition: { nitrogen: 2, phosphorus: 1, potassium: 2 },
    suitable_crops: ['all'],
    application_method: 'soil',
    dosage_per_hectare: '2-3 طن',
    cost_per_kg: 0.5,
    supplier: 'تعاونية الزراعة العضوية',
    safety_level: 'very_low',
    organic: true,
    season: 'all',
    soil_ph_range: { min: 5.0, max: 8.0 },
    benefits: ['تحسين بنية التربة', 'زيادة الخص��بة الطبيعية', 'صديق للبيئة'],
    precautions: ['التأكد من النضج الكامل قبل الاستخدام']
  },
  {
    id: 'potassium-sulfate',
    name: 'كبريتات البوتاسيوم',
    type: 'single',
    composition: { nitrogen: 0, phosphorus: 0, potassium: 50 },
    suitable_crops: ['tomato', 'potato', 'artichoke'],
    application_method: 'soil',
    dosage_per_hectare: '100-150 kg',
    cost_per_kg: 4.1,
    supplier: 'الشركة الكيميائية التونسية',
    safety_level: 'medium',
    organic: false,
    season: 'fruiting',
    soil_ph_range: { min: 6.0, max: 8.0 },
    benefits: ['تحسين جودة الثمار', 'زيادة مقاومة الجفاف', 'تعزيز النكهة'],
    precautions: ['تجنب الاستخدام في التربة الملحية']
  },
  {
    id: 'urea-nitrogen',
    name: 'اليوريا (نترات)',
    type: 'single',
    composition: { nitrogen: 46, phosphorus: 0, potassium: 0 },
    suitable_crops: ['wheat', 'barley', 'citrus'],
    application_method: 'foliar',
    dosage_per_hectare: '100-200 kg',
    cost_per_kg: 1.9,
    supplier: 'الشركة التونسية للكيماويات',
    safety_level: 'medium',
    organic: false,
    season: 'growth',
    soil_ph_range: { min: 6.0, max: 7.5 },
    benefits: ['نمو سريع للأوراق', 'زيادة البروتين', 'تعزيز النمو الخضري'],
    precautions: ['تجنب الرش في الطقس الحار', 'الري الكافي بعد التطبيق']
  }
];

// Comprehensive pesticide database for Tunisia
const pesticideDatabase = [
  {
    id: 'copper-sulfate',
    name: 'كبريتات النحاس',
    type: 'fungicide',
    active_ingredient: 'copper sulfate',
    concentration: '25%',
    target_pests: ['فطريات', 'بكتيريا نباتية'],
    suitable_crops: ['olive', 'citrus', 'tomato'],
    application_method: 'spray',
    dosage_per_hectare: '2-3 لتر',
    cost_per_liter: 15.5,
    supplier: 'شركة المبيدات الزراعية التونسية',
    safety_level: 'medium',
    organic_approved: true,
    resistance_risk: 'low',
    pre_harvest_interval: 7,
    max_applications: 4,
    benefits: ['مكافحة فعالة للفطريات', 'آمن نسبياً', 'متوفر بسهولة'],
    precautions: ['ارتداء معدات الحماية', 'تجنب الرش عند الرياح العالية'],
    environmental_impact: 'منخفض'
  },
  {
    id: 'neem-oil',
    name: 'زيت النيم الطبيعي',
    type: 'insecticide',
    active_ingredient: 'azadirachtin',
    concentration: '3%',
    target_pests: ['من الخضراء', 'التربس', 'الحشرات الماصة'],
    suitable_crops: ['all'],
    application_method: 'spray',
    dosage_per_hectare: '1-2 لتر',
    cost_per_liter: 28.0,
    supplier: 'الشركة الطبيعية للمبيدات',
    safety_level: 'very_low',
    organic_approved: true,
    resistance_risk: 'very_low',
    pre_harvest_interval: 1,
    max_applications: 8,
    benefits: ['طبيعي 100%', 'آمن للنحل', 'لا يضر الحشرات النافعة'],
    precautions: ['تطبيق في المساء', 'تجنب ضوء الشمس المباشر'],
    environmental_impact: 'صفر'
  },
  {
    id: 'imidacloprid',
    name: 'إيميداكلوبريد',
    type: 'insecticide',
    active_ingredient: 'imidacloprid',
    concentration: '20%',
    target_pests: ['من القطن', 'ذبابة الفاكهة', 'حشرات التربة'],
    suitable_crops: ['tomato', 'potato', 'citrus'],
    application_method: 'soil_drench',
    dosage_per_hectare: '0.5-1 لتر',
    cost_per_liter: 45.0,
    supplier: 'الشركة الدولية للمبيدات',
    safety_level: 'high',
    organic_approved: false,
    resistance_risk: 'medium',
    pre_harvest_interval: 21,
    max_applications: 2,
    benefits: ['فعالية عالية', 'طويل المفعول', 'امتصاص جهازي'],
    precautions: ['تجنب التلامس المباشر', 'منع وصول للمياه الجوفية', 'ضار بالنحل'],
    environmental_impact: 'متوسط إلى عالي'
  },
  {
    id: 'bt-spray',
    name: 'باسيلوس ثورينجينسيس',
    type: 'bioinsecticide',
    active_ingredient: 'bacillus thuringiensis',
    concentration: '10%',
    target_pests: ['دودة ثمار الطماطم', 'دودة الأوراق', 'يرقات الفراشات'],
    suitable_crops: ['tomato', 'potato', 'artichoke'],
    application_method: 'spray',
    dosage_per_hectare: '1-1.5 لتر',
    cost_per_liter: 32.0,
    supplier: 'الشركة البيولوجية للمكافحة',
    safety_level: 'very_low',
    organic_approved: true,
    resistance_risk: 'low',
    pre_harvest_interval: 0,
    max_applications: 6,
    benefits: ['آمن تماماً', 'خاص باليرقات فقط', 'لا يؤثر على الحشرات النافعة'],
    precautions: ['تطبيق في المساء', 'تخزين في مكان بارد'],
    environmental_impact: 'صفر'
  }
];

// Disease treatment mapping
const diseaseToTreatment = {
  'olive_leaf_spot': ['copper-sulfate', 'neem-oil'],
  'tomato_blight': ['copper-sulfate', 'bt-spray'],
  'citrus_canker': ['copper-sulfate'],
  'wheat_rust': ['copper-sulfate'],
  'root_rot': ['organic-compost'],
  'aphid_infestation': ['neem-oil', 'imidacloprid'],
  'caterpillar_damage': ['bt-spray', 'neem-oil']
};

// Generate personalized fertilizer recommendations
router.post('/recommendations/fertilizer', (req, res) => {
  const { 
    cropType, 
    soilData, 
    farmSize, 
    budget, 
    organicPreference,
    growthStage,
    season
  } = req.body;

  // Analyze soil deficiencies
  const soilAnalysis = analyzeSoilDeficiencies(soilData);
  
  // Get suitable fertilizers
  const suitableFertilizers = fertilizerDatabase.filter(fertilizer => {
    return fertilizer.suitable_crops.includes(cropType) || fertilizer.suitable_crops.includes('all');
  });

  // Rank fertilizers based on soil needs and user preferences
  const rankedFertilizers = suitableFertilizers.map(fertilizer => {
    let score = 0;
    
    // Score based on nutrient needs
    if (soilAnalysis.needsNitrogen && fertilizer.composition.nitrogen > 10) score += 3;
    if (soilAnalysis.needsPhosphorus && fertilizer.composition.phosphorus > 10) score += 3;
    if (soilAnalysis.needsPotassium && fertilizer.composition.potassium > 10) score += 3;
    
    // Score based on preferences
    if (organicPreference && fertilizer.organic) score += 2;
    if (fertilizer.season === season || fertilizer.season === 'all') score += 1;
    
    // Score based on soil pH compatibility
    const soilPH = soilData.ph || 7.0;
    if (soilPH >= fertilizer.soil_ph_range.min && soilPH <= fertilizer.soil_ph_range.max) {
      score += 2;
    }
    
    // Cost efficiency score
    const costEfficiency = 5 - (fertilizer.cost_per_kg / 5); // Normalize cost
    score += Math.max(0, costEfficiency);

    return {
      ...fertilizer,
      suitabilityScore: score,
      recommendedDosage: calculateOptimalDosage(fertilizer, farmSize, soilAnalysis),
      totalCost: calculateTotalCost(fertilizer, farmSize),
      applicationSchedule: generateApplicationSchedule(fertilizer, growthStage, season)
    };
  });

  // Sort by score and return top recommendations
  const topRecommendations = rankedFertilizers
    .sort((a, b) => b.suitabilityScore - a.suitabilityScore)
    .slice(0, 5);

  res.json({
    cropType,
    farmSize,
    soilAnalysis,
    recommendations: topRecommendations,
    totalBudgetRequired: topRecommendations.reduce((sum, rec) => sum + rec.totalCost, 0),
    sustainabilityScore: calculateSustainabilityScore(topRecommendations),
    applicationTiming: generateOptimalTiming(topRecommendations, season),
    lastUpdated: new Date().toISOString()
  });
});

// Generate pesticide recommendations based on disease/pest detection
router.post('/recommendations/pesticide', (req, res) => {
  const { 
    cropType, 
    detectedDiseases, 
    detectedPests,
    farmSize,
    organicPreference,
    environmentalConcern,
    previousApplications
  } = req.body;

  let recommendedPesticides = [];

  // Get pesticides for detected diseases/pests
  if (detectedDiseases && detectedDiseases.length > 0) {
    detectedDiseases.forEach(disease => {
      const treatments = diseaseToTreatment[disease.id] || [];
      treatments.forEach(treatmentId => {
        const pesticide = pesticideDatabase.find(p => p.id === treatmentId);
        if (pesticide) {
          recommendedPesticides.push({
            ...pesticide,
            targetCondition: disease.name,
            urgency: disease.severity || 'medium'
          });
        }
      });
    });
  }

  // Filter and rank pesticides
  let filteredPesticides = recommendedPesticides.filter(pesticide => {
    return pesticide.suitable_crops.includes(cropType) || pesticide.suitable_crops.includes('all');
  });

  // Apply user preferences
  if (organicPreference) {
    filteredPesticides = filteredPesticides.filter(p => p.organic_approved);
  }

  // Rank by safety and effectiveness
  const rankedPesticides = filteredPesticides.map(pesticide => {
    let score = 0;
    
    // Safety scoring
    switch (pesticide.safety_level) {
      case 'very_low': score += 5; break;
      case 'low': score += 4; break;
      case 'medium': score += 3; break;
      case 'high': score += 1; break;
    }
    
    // Environmental impact scoring
    if (environmentalConcern) {
      switch (pesticide.environmental_impact) {
        case 'صفر': score += 5; break;
        case 'منخفض': score += 4; break;
        case 'متوسط إلى عالي': score += 1; break;
      }
    }
    
    // Resistance risk scoring
    switch (pesticide.resistance_risk) {
      case 'very_low': score += 3; break;
      case 'low': score += 2; break;
      case 'medium': score += 1; break;
    }

    return {
      ...pesticide,
      suitabilityScore: score,
      applicationSchedule: generatePesticideSchedule(pesticide),
      totalCost: calculatePesticideCost(pesticide, farmSize),
      safetyInstructions: generateSafetyInstructions(pesticide)
    };
  });

  const topRecommendations = rankedPesticides
    .sort((a, b) => b.suitabilityScore - a.suitabilityScore)
    .slice(0, 4);

  res.json({
    cropType,
    detectedIssues: [...(detectedDiseases || []), ...(detectedPests || [])],
    recommendations: topRecommendations,
    integratedPestManagement: generateIPMStrategy(topRecommendations),
    applicationCalendar: generateTreatmentCalendar(topRecommendations),
    safetyGuidelines: generateComprehensiveSafetyGuide(),
    lastUpdated: new Date().toISOString()
  });
});

// Get comprehensive treatment schedule
router.post('/schedule/comprehensive', (req, res) => {
  const { 
    cropType, 
    farmSize, 
    plantingDate, 
    fertilizerPlan, 
    pesticidePlan,
    weatherData 
  } = req.body;

  const schedule = generateComprehensiveSchedule(
    cropType, 
    plantingDate, 
    fertilizerPlan, 
    pesticidePlan, 
    weatherData
  );

  res.json({
    cropType,
    farmSize,
    schedule,
    notifications: generateNotificationSettings(schedule),
    weatherIntegration: true,
    lastUpdated: new Date().toISOString()
  });
});

// Track application effectiveness
router.post('/track/effectiveness', (req, res) => {
  const { 
    applicationId, 
    productUsed, 
    applicationDate, 
    weatherConditions,
    beforeCondition,
    afterCondition,
    userRating
  } = req.body;

  // Simulate effectiveness analysis
  const effectiveness = analyzeApplicationEffectiveness(
    productUsed,
    weatherConditions,
    beforeCondition,
    afterCondition,
    userRating
  );

  res.json({
    applicationId,
    effectivenessScore: effectiveness.score,
    improvements: effectiveness.improvements,
    recommendations: effectiveness.futureRecommendations,
    learningData: effectiveness.learningData,
    lastUpdated: new Date().toISOString()
  });
});

// Get fertilizer and pesticide inventory
router.get('/inventory', (req, res) => {
  res.json({
    fertilizers: fertilizerDatabase.map(f => ({
      id: f.id,
      name: f.name,
      type: f.type,
      cost_per_kg: f.cost_per_kg,
      supplier: f.supplier,
      organic: f.organic,
      availability: Math.random() > 0.2 ? 'متوفر' : 'نفدت الكمية'
    })),
    pesticides: pesticideDatabase.map(p => ({
      id: p.id,
      name: p.name,
      type: p.type,
      cost_per_liter: p.cost_per_liter,
      supplier: p.supplier,
      organic_approved: p.organic_approved,
      availability: Math.random() > 0.15 ? 'متوفر' : 'نفدت الكمية'
    }))
  });
});

// Helper functions
function analyzeSoilDeficiencies(soilData) {
  return {
    needsNitrogen: (soilData.nitrogen || 0) < 20,
    needsPhosphorus: (soilData.phosphorus || 0) < 15,
    needsPotassium: (soilData.potassium || 0) < 25,
    needsOrganic: (soilData.organicMatter || 0) < 3,
    phStatus: soilData.ph < 6.0 ? 'acidic' : soilData.ph > 7.5 ? 'alkaline' : 'neutral'
  };
}

function calculateOptimalDosage(fertilizer, farmSize, soilAnalysis) {
  const baseDosage = parseFloat(fertilizer.dosage_per_hectare.split('-')[0]) || 200;
  let adjustedDosage = baseDosage;
  
  // Adjust based on soil deficiencies
  if (soilAnalysis.needsNitrogen && fertilizer.composition.nitrogen > 15) {
    adjustedDosage *= 1.2;
  }
  if (soilAnalysis.needsPhosphorus && fertilizer.composition.phosphorus > 15) {
    adjustedDosage *= 1.1;
  }
  
  return {
    dosagePerHectare: `${adjustedDosage.toFixed(0)} كg`,
    totalRequired: `${(adjustedDosage * farmSize).toFixed(0)} كg`,
    applicationMethod: fertilizer.application_method
  };
}

function calculateTotalCost(fertilizer, farmSize) {
  const baseDosage = parseFloat(fertilizer.dosage_per_hectare.split('-')[0]) || 200;
  return baseDosage * farmSize * fertilizer.cost_per_kg;
}

function generateApplicationSchedule(fertilizer, growthStage, season) {
  const baseSchedule = [
    { stage: 'زراعة', timing: 'قبل الزراعة بأسبوع', percentage: 30 },
    { stage: 'نمو خضري', timing: 'بعد 3-4 أسابيع من الزراعة', percentage: 40 },
    { stage: 'إزهار وإثمار', timing: 'عند بداية الإزهار', percentage: 30 }
  ];
  
  return baseSchedule;
}

function calculateSustainabilityScore(recommendations) {
  let score = 0;
  recommendations.forEach(rec => {
    if (rec.organic) score += 20;
    if (rec.safety_level === 'very_low' || rec.safety_level === 'low') score += 10;
    if (rec.type === 'organic') score += 15;
  });
  return Math.min(100, score);
}

function generateOptimalTiming(recommendations, season) {
  return {
    bestTime: 'الصباح الباكر (6-9 صباحاً)',
    avoidTime: 'منتصف النهار (11 صباحاً - 3 مساءً)',
    weatherConditions: 'طقس هادئ، رياح خفيفة، لا مطر متوقع لـ 24 ساعة'
  };
}

function generatePesticideSchedule(pesticide) {
  return {
    frequency: 'كل 7-14 يوم حسب شدة الإصابة',
    maxApplications: pesticide.max_applications,
    preHarvestInterval: `${pesticide.pre_harvest_interval} يوم قبل القطف`,
    rotationAdvice: 'تبديل المبيدات لتجنب المقاومة'
  };
}

function calculatePesticideCost(pesticide, farmSize) {
  const dosagePerHectare = parseFloat(pesticide.dosage_per_hectare.split('-')[0]) || 2;
  return dosagePerHectare * farmSize * pesticide.cost_per_liter;
}

function generateSafetyInstructions(pesticide) {
  return [
    'ارتداء ملابس واقية كاملة',
    'استخدام كمامة وقفازات',
    'تجنب الرش عند الرياح العالية',
    'الغسيل الجيد بعد الاستخدام',
    'حفظ المبيد بعيداً عن الأطفال'
  ];
}

function generateIPMStrategy(recommendations) {
  return {
    biologicalControl: 'استخدام الأعداء الطبيعيين',
    culturalControl: 'تناوب المحاصيل وإزالة البقايا النباتية',
    chemicalControl: 'استخدام المبيدات كحل أخير',
    monitoring: 'المراقبة المستمرة للآفات والأمراض'
  };
}

function generateTreatmentCalendar(recommendations) {
  const today = new Date();
  const calendar = [];
  
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    
    if (i % 7 === 0) { // Weekly applications
      calendar.push({
        date: date.toISOString().split('T')[0],
        treatments: recommendations.slice(0, 2).map(rec => ({
          product: rec.name,
          dosage: rec.dosage_per_hectare,
          method: rec.application_method
        }))
      });
    }
  }
  
  return calendar;
}

function generateComprehensiveSafetyGuide() {
  return {
    beforeApplication: [
      'قراءة ملصق المنتج بعناية',
      'التحقق من الطقس المناسب',
      'ارتداء معدات ال��ماية الشخصية'
    ],
    duringApplication: [
      'الحفاظ على اتجاه الرياح',
      'تجنب استنشاق الرذاذ',
      'عدم الأكل أو الشرب أثناء العمل'
    ],
    afterApplication: [
      'غسل المعدات والملابس',
      'الاستحمام الفوري',
      'تسجيل تفاصيل التطبيق'
    ]
  };
}

function generateComprehensiveSchedule(cropType, plantingDate, fertilizerPlan, pesticidePlan, weatherData) {
  const schedule = [];
  const planting = new Date(plantingDate);
  
  // Generate 90-day schedule
  for (let week = 0; week < 12; week++) {
    const weekStart = new Date(planting);
    weekStart.setDate(weekStart.getDate() + (week * 7));
    
    const activities = [];
    
    // Add fertilizer activities
    if (week === 0) activities.push({ type: 'fertilizer', action: 'تسميد أساسي قبل الزراعة' });
    if (week === 3) activities.push({ type: 'fertilizer', action: 'التسميد الأول (نيتروجين)' });
    if (week === 6) activities.push({ type: 'fertilizer', action: 'التسميد الثاني (فوسفور وبوتاسيوم)' });
    if (week === 9) activities.push({ type: 'fertilizer', action: 'التسميد النهائي' });
    
    // Add pesticide activities
    if (week % 2 === 1) activities.push({ type: 'pesticide', action: 'مراقبة الآفات والأمراض' });
    if (week === 4) activities.push({ type: 'pesticide', action: 'الرش الوقائي الأول' });
    if (week === 8) activities.push({ type: 'pesticide', action: 'الرش العلاجي حسب الحاجة' });
    
    schedule.push({
      week: week + 1,
      startDate: weekStart.toISOString().split('T')[0],
      activities,
      weatherNote: 'تحقق من توقعات الطقس قبل التطبيق'
    });
  }
  
  return schedule;
}

function generateNotificationSettings(schedule) {
  return {
    reminderDays: [1, 3, 7], // Days before scheduled activity
    methods: ['push_notification', 'sms', 'email'],
    weatherAlerts: true,
    effectivenessTracking: true
  };
}

function analyzeApplicationEffectiveness(productUsed, weatherConditions, beforeCondition, afterCondition, userRating) {
  // Simulate AI analysis
  const weatherScore = weatherConditions.temperature < 30 && weatherConditions.wind < 15 ? 0.9 : 0.6;
  const improvementScore = (afterCondition.healthScore - beforeCondition.healthScore) / 100;
  const userScore = userRating / 5;
  
  const overallScore = (weatherScore + improvementScore + userScore) / 3;
  
  return {
    score: Math.round(overallScore * 100),
    improvements: [
      'تحسن ملحوظ في صحة النبات',
      'انخفاض في أعراض المرض',
      'زيادة في النمو الخضري'
    ],
    futureRecommendations: [
      'المتابعة مع نفس المنتج',
      'تقليل الجرعة في التطبيق القادم',
      'مراقبة مقاومة الآفات'
    ],
    learningData: {
      productEffectiveness: overallScore,
      weatherImpact: weatherScore,
      userSatisfaction: userScore
    }
  };
}

export default router;
