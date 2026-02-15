import express from 'express';

const router = express.Router();

interface FarmOverview {
  id: string;
  name: string;
  nameArabic: string;
  farmerName: string;
  farmerNameArabic: string;
  location: string;
  locationArabic: string;
  totalArea: number;
  cultivatedArea: number;
  soilHealth: number;
  cropCount: number;
  healthyPercentage: number;
  alertCount: number;
  lastVisit: string;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  crops: Array<{
    name: string;
    nameArabic: string;
    area: number;
    health: string;
    stage: string;
    stageArabic: string;
  }>;
  recentAlerts: Array<{
    type: string;
    message: string;
    messageArabic: string;
    severity: string;
    timestamp: string;
  }>;
}

interface DiseaseAnalysis {
  id: string;
  farmId: string;
  farmName: string;
  cropType: string;
  cropTypeArabic: string;
  imageUrl: string;
  uploadedBy: string;
  uploadedAt: string;
  aiAnalysis: {
    diseaseDetected: boolean;
    diseaseName?: string;
    diseaseNameArabic?: string;
    confidence: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    recommendedTreatment: string[];
    recommendedTreatmentArabic: string[];
    preventiveMeasures: string[];
    preventiveMeasuresArabic: string[];
  };
  expertReview: {
    reviewed: boolean;
    reviewedBy?: string;
    reviewedAt?: string;
    expertDiagnosis?: string;
    expertDiagnosisArabic?: string;
    treatmentPlan?: string[];
    treatmentPlanArabic?: string[];
    followUpRequired: boolean;
    followUpDate?: string;
  };
  status: 'pending' | 'reviewed' | 'treated' | 'resolved';
}

interface RecommendationTracking {
  id: string;
  farmId: string;
  farmName: string;
  farmerName: string;
  recommendation: string;
  recommendationArabic: string;
  type: 'irrigation' | 'fertilizer' | 'pesticide' | 'planting' | 'harvesting' | 'soil_treatment';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
  farmerResponse?: string;
  farmerResponseArabic?: string;
  completionDate?: string;
  completionNotes?: string;
  completionNotesArabic?: string;
  effectiveness?: number; // 1-10 scale
  followUpRequired: boolean;
}

interface TrainingProgram {
  id: string;
  title: string;
  titleArabic: string;
  description: string;
  descriptionArabic: string;
  type: 'individual' | 'group' | 'online' | 'field_demonstration';
  category: 'soil_management' | 'crop_cultivation' | 'pest_control' | 'irrigation' | 'harvesting' | 'post_harvest';
  duration: number; // minutes
  maxParticipants: number;
  scheduledDate: string;
  location: string;
  locationArabic: string;
  materials: Array<{
    type: 'video' | 'document' | 'presentation' | 'quiz';
    title: string;
    titleArabic: string;
    url: string;
    duration?: number;
  }>;
  participants: Array<{
    farmerId: string;
    farmerName: string;
    farmerNameArabic: string;
    registeredAt: string;
    attended?: boolean;
    completionScore?: number;
    feedback?: string;
    feedbackArabic?: string;
  }>;
  status: 'draft' | 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  createdBy: string;
  createdAt: string;
}

interface CropPerformanceAnalysis {
  farmId: string;
  farmName: string;
  crop: string;
  cropArabic: string;
  currentSeason: {
    plantingDate: string;
    expectedHarvest: string;
    currentHealth: number;
    currentYield: number;
    growthStage: string;
    growthStageArabic: string;
  };
  historicalData: Array<{
    season: string;
    yield: number;
    health: number;
    diseaseIncidents: number;
    treatmentCost: number;
    profitability: number;
  }>;
  comparison: {
    yieldImprovement: number;
    healthImprovement: number;
    costReduction: number;
    profitabilityIncrease: number;
  };
  recommendations: string[];
  recommendationsArabic: string[];
}

interface ExpertPerformanceMetrics {
  totalFarms: number;
  totalFarmers: number;
  diseaseDetections: number;
  treatmentSuccessRate: number;
  farmerComplianceRate: number;
  trainingSessionsConducted: number;
  farmerSatisfactionScore: number;
  averageResponseTime: number; // hours
  monthlyStats: Array<{
    month: string;
    farmsVisited: number;
    recommendationsGiven: number;
    trainingSessions: number;
    diseasesCured: number;
    farmerRating: number;
  }>;
}

// Mock data generators
const generateMockFarms = (): FarmOverview[] => [
  {
    id: 'farm_001',
    name: 'Green Valley Farm',
    nameArabic: 'مزرعة الوادي الأخضر',
    farmerName: 'Ahmed Ben Ali',
    farmerNameArabic: 'أحمد بن علي',
    location: 'Bizerte, Tunisia',
    locationArabic: 'بنزرت، تونس',
    totalArea: 15.5,
    cultivatedArea: 14.2,
    soilHealth: 87,
    cropCount: 5,
    healthyPercentage: 92,
    alertCount: 2,
    lastVisit: '2024-01-15',
    urgencyLevel: 'medium',
    crops: [
      { name: 'Wheat', nameArabic: 'قمح', area: 6.5, health: 'excellent', stage: 'Tillering', stageArabic: 'التفريع' },
      { name: 'Olives', nameArabic: 'زيتون', area: 4.0, health: 'good', stage: 'Fruit Development', stageArabic: 'نمو الثمار' },
      { name: 'Tomatoes', nameArabic: 'طماطم', area: 2.2, health: 'fair', stage: 'Flowering', stageArabic: 'الإزهار' }
    ],
    recentAlerts: [
      {
        type: 'disease',
        message: 'Early blight detected on tomatoes',
        messageArabic: 'تم اكتشاف اللفحة المبكرة على الطماطم',
        severity: 'high',
        timestamp: '2024-01-20T10:30:00Z'
      }
    ]
  },
  {
    id: 'farm_002',
    name: 'Sunrise Agriculture',
    nameArabic: 'زراعة الشروق',
    farmerName: 'Fatma Mansouri',
    farmerNameArabic: 'فاطمة المنصوري',
    location: 'Sousse, Tunisia',
    locationArabic: 'سوسة، تونس',
    totalArea: 22.3,
    cultivatedArea: 20.1,
    soilHealth: 94,
    cropCount: 7,
    healthyPercentage: 96,
    alertCount: 0,
    lastVisit: '2024-01-18',
    urgencyLevel: 'low',
    crops: [
      { name: 'Citrus', nameArabic: 'حمضيات', area: 8.5, health: 'excellent', stage: 'Fruit Maturation', stageArabic: 'نضج الثمار' },
      { name: 'Almonds', nameArabic: 'لوز', area: 5.8, health: 'excellent', stage: 'Dormancy', stageArabic: 'السكون' }
    ],
    recentAlerts: []
  },
  {
    id: 'farm_003',
    name: 'Desert Edge Farm',
    nameArabic: 'مزرعة حافة الصحراء',
    farmerName: 'Mohamed Trabelsi',
    farmerNameArabic: 'محمد الطرابلسي',
    location: 'Tozeur, Tunisia',
    locationArabic: 'توزر، تونس',
    totalArea: 8.7,
    cultivatedArea: 7.2,
    soilHealth: 68,
    cropCount: 3,
    healthyPercentage: 78,
    alertCount: 4,
    lastVisit: '2024-01-12',
    urgencyLevel: 'critical',
    crops: [
      { name: 'Dates', nameArabic: 'تمر', area: 4.5, health: 'good', stage: 'Pollination', stageArabic: 'التلقيح' },
      { name: 'Pomegranates', nameArabic: 'رمان', area: 2.7, health: 'poor', stage: 'Vegetative Growth', stageArabic: 'النمو الخضري' }
    ],
    recentAlerts: [
      {
        type: 'soil',
        message: 'High salinity detected in soil',
        messageArabic: 'تم اكتشاف ملوحة عالية في التربة',
        severity: 'critical',
        timestamp: '2024-01-19T14:20:00Z'
      }
    ]
  }
];

const generateMockDiseaseAnalyses = (): DiseaseAnalysis[] => [
  {
    id: 'analysis_001',
    farmId: 'farm_001',
    farmName: 'Green Valley Farm',
    cropType: 'Tomatoes',
    cropTypeArabic: 'طماطم',
    imageUrl: '/api/images/disease_sample_001.jpg',
    uploadedBy: 'Ahmed Ben Ali',
    uploadedAt: '2024-01-20T09:15:00Z',
    aiAnalysis: {
      diseaseDetected: true,
      diseaseName: 'Early Blight',
      diseaseNameArabic: 'اللفحة المبكرة',
      confidence: 0.89,
      severity: 'high',
      recommendedTreatment: [
        'Apply copper-based fungicide',
        'Remove affected leaves',
        'Improve air circulation'
      ],
      recommendedTreatmentArabic: [
        'تطبيق مبيد فطري أساسه النحاس',
        'إزالة الأوراق المصابة',
        'تحسين دوران الهواء'
      ],
      preventiveMeasures: [
        'Avoid overhead watering',
        'Use resistant varieties',
        'Crop rotation'
      ],
      preventiveMeasuresArabic: [
        'تجنب الري العلوي',
        'استخدام أصناف مقاومة',
        'دورة المحاصيل'
      ]
    },
    expertReview: {
      reviewed: false,
      followUpRequired: true
    },
    status: 'pending'
  },
  {
    id: 'analysis_002',
    farmId: 'farm_003',
    farmName: 'Desert Edge Farm',
    cropType: 'Pomegranates',
    cropTypeArabic: 'رمان',
    imageUrl: '/api/images/disease_sample_002.jpg',
    uploadedBy: 'Mohamed Trabelsi',
    uploadedAt: '2024-01-19T16:45:00Z',
    aiAnalysis: {
      diseaseDetected: true,
      diseaseName: 'Bacterial Blight',
      diseaseNameArabic: 'اللفحة البكتيرية',
      confidence: 0.92,
      severity: 'critical',
      recommendedTreatment: [
        'Apply copper sulfate spray',
        'Prune affected branches',
        'Improve drainage'
      ],
      recommendedTreatmentArabic: [
        'رش كبريتات النحاس',
        'تقليم الفروع المصابة',
        'تحسين الصرف'
      ],
      preventiveMeasures: [
        'Avoid water stress',
        'Maintain proper spacing',
        'Regular inspection'
      ],
      preventiveMeasuresArabic: [
        'تجنب إجهاد المياه',
        'الحفاظ على المسافات المناسبة',
        'الفحص المنتظم'
      ]
    },
    expertReview: {
      reviewed: true,
      reviewedBy: 'Dr. Ahmed Ben Salem',
      reviewedAt: '2024-01-20T08:30:00Z',
      expertDiagnosis: 'Confirmed bacterial blight with secondary fungal infection',
      expertDiagnosisArabic: 'تأكيد اللفحة البكتيرية مع عدوى فطرية ثانوية',
      treatmentPlan: [
        'Immediate copper sulfate application',
        'Systemic antibiotic treatment',
        'Remove and destroy affected material',
        'Adjust irrigation schedule'
      ],
      treatmentPlanArabic: [
        'تطبيق فوري لكبريتات النحاس',
        'علاج بالمضادات الحيوية الجهازية',
        'إزالة وتدمير المواد المصابة',
        'تعديل جدول الري'
      ],
      followUpRequired: true,
      followUpDate: '2024-01-27'
    },
    status: 'reviewed'
  }
];

const generateMockRecommendations = (): RecommendationTracking[] => [
  {
    id: 'rec_001',
    farmId: 'farm_001',
    farmName: 'Green Valley Farm',
    farmerName: 'Ahmed Ben Ali',
    recommendation: 'Apply nitrogen fertilizer to wheat field zone 2',
    recommendationArabic: 'تطبيق سماد النيتروجين على منطقة حقل القمح 2',
    type: 'fertilizer',
    priority: 'medium',
    createdAt: '2024-01-15T10:00:00Z',
    dueDate: '2024-01-22T10:00:00Z',
    status: 'completed',
    farmerResponse: 'Applied as recommended, plants showing good response',
    farmerResponseArabic: 'تم التطبيق كما هو موصى، النباتات تظهر استجابة جيدة',
    completionDate: '2024-01-21T14:30:00Z',
    completionNotes: 'Fertilizer applied successfully, visible improvement in crop color',
    completionNotesArabic: 'تم تطبيق السماد بنجاح، تحسن واضح في لون المحصول',
    effectiveness: 9,
    followUpRequired: false
  },
  {
    id: 'rec_002',
    farmId: 'farm_003',
    farmName: 'Desert Edge Farm',
    farmerName: 'Mohamed Trabelsi',
    recommendation: 'Install drip irrigation system to reduce water salinity impact',
    recommendationArabic: 'تركيب نظام الري بالتنقيط لتقليل تأثير ملوحة المياه',
    type: 'irrigation',
    priority: 'high',
    createdAt: '2024-01-18T09:30:00Z',
    dueDate: '2024-01-25T09:30:00Z',
    status: 'in_progress',
    farmerResponse: 'Equipment ordered, installation planned for next week',
    farmerResponseArabic: 'تم طلب المعدات، التركيب مخطط للأسبوع القادم',
    followUpRequired: true
  },
  {
    id: 'rec_003',
    farmId: 'farm_001',
    farmName: 'Green Valley Farm',
    farmerName: 'Ahmed Ben Ali',
    recommendation: 'Treat tomato early blight with copper-based fungicide',
    recommendationArabic: 'علاج اللفحة المبكرة للطماطم بمبيد فطري أساسه النحاس',
    type: 'pesticide',
    priority: 'urgent',
    createdAt: '2024-01-20T11:00:00Z',
    dueDate: '2024-01-22T11:00:00Z',
    status: 'pending',
    followUpRequired: true
  }
];

const generateMockTrainingPrograms = (): TrainingProgram[] => [
  {
    id: 'training_001',
    title: 'Integrated Pest Management for Vegetable Crops',
    titleArabic: 'الإدارة المتكاملة للآفات للمحاصيل النباتية',
    description: 'Comprehensive training on IPM strategies for sustainable vegetable production',
    descriptionArabic: 'تدريب شامل على استراتيجيات الإدارة المتكاملة للآفات للإنتاج المستدام للخضروات',
    type: 'group',
    category: 'pest_control',
    duration: 180,
    maxParticipants: 25,
    scheduledDate: '2024-01-25T09:00:00Z',
    location: 'Agricultural Extension Center, Bizerte',
    locationArabic: 'مركز الإرشاد الزراعي، بنزرت',
    materials: [
      {
        type: 'presentation',
        title: 'IPM Fundamentals',
        titleArabic: 'أساسيات الإدارة المتكاملة للآفات',
        url: '/training/materials/ipm_fundamentals.pdf',
        duration: 45
      },
      {
        type: 'video',
        title: 'Beneficial Insects Identification',
        titleArabic: 'تحديد الحشرات المفيدة',
        url: '/training/videos/beneficial_insects.mp4',
        duration: 30
      }
    ],
    participants: [
      {
        farmerId: 'farmer_001',
        farmerName: 'Ahmed Ben Ali',
        farmerNameArabic: 'أحمد بن علي',
        registeredAt: '2024-01-20T14:30:00Z',
        attended: false
      },
      {
        farmerId: 'farmer_003',
        farmerName: 'Mohamed Trabelsi',
        farmerNameArabic: 'محمد الطرابلسي',
        registeredAt: '2024-01-21T09:15:00Z',
        attended: false
      }
    ],
    status: 'scheduled',
    createdBy: 'Dr. Ahmed Ben Salem',
    createdAt: '2024-01-18T11:00:00Z'
  },
  {
    id: 'training_002',
    title: 'Soil Health Assessment and Improvement',
    titleArabic: 'تقييم وتحسين صحة التربة',
    description: 'Hands-on training for soil testing, analysis, and improvement techniques',
    descriptionArabic: 'تدريب عملي على اختبار التربة وتحليلها وتقنيات التحسين',
    type: 'field_demonstration',
    category: 'soil_management',
    duration: 240,
    maxParticipants: 15,
    scheduledDate: '2024-01-28T08:00:00Z',
    location: 'Green Valley Farm, Bizerte',
    locationArabic: 'مزرعة الوادي الأخضر، بنزرت',
    materials: [
      {
        type: 'document',
        title: 'Soil Testing Guide',
        titleArabic: 'دليل فحص التربة',
        url: '/training/materials/soil_testing_guide.pdf'
      }
    ],
    participants: [
      {
        farmerId: 'farmer_001',
        farmerName: 'Ahmed Ben Ali',
        farmerNameArabic: 'أحمد بن علي',
        registeredAt: '2024-01-22T10:45:00Z',
        attended: false
      }
    ],
    status: 'scheduled',
    createdBy: 'Dr. Ahmed Ben Salem',
    createdAt: '2024-01-19T15:20:00Z'
  }
];

const generateMockPerformanceAnalysis = (): CropPerformanceAnalysis[] => [
  {
    farmId: 'farm_001',
    farmName: 'Green Valley Farm',
    crop: 'Wheat',
    cropArabic: 'قمح',
    currentSeason: {
      plantingDate: '2023-11-15',
      expectedHarvest: '2024-06-15',
      currentHealth: 87,
      currentYield: 4.2,
      growthStage: 'Tillering',
      growthStageArabic: 'التفريع'
    },
    historicalData: [
      {
        season: '2022-2023',
        yield: 3.8,
        health: 82,
        diseaseIncidents: 2,
        treatmentCost: 450,
        profitability: 2800
      },
      {
        season: '2021-2022',
        yield: 3.5,
        health: 78,
        diseaseIncidents: 3,
        treatmentCost: 680,
        profitability: 2400
      },
      {
        season: '2020-2021',
        yield: 3.2,
        health: 75,
        diseaseIncidents: 4,
        treatmentCost: 820,
        profitability: 2100
      }
    ],
    comparison: {
      yieldImprovement: 10.5,
      healthImprovement: 6.1,
      costReduction: 33.8,
      profitabilityIncrease: 16.7
    },
    recommendations: [
      'Continue current fertilization program',
      'Monitor for rust diseases during warm weather',
      'Consider drought-resistant varieties for next season'
    ],
    recommendationsArabic: [
      'مواصلة برنامج التسميد الحالي',
      'مراقبة أمراض الصدأ خلال الطقس الدافئ',
      'النظر في الأصناف المقاومة للجفاف للموسم القادم'
    ]
  }
];

const generateMockExpertMetrics = (): ExpertPerformanceMetrics => ({
  totalFarms: 12,
  totalFarmers: 15,
  diseaseDetections: 28,
  treatmentSuccessRate: 89.3,
  farmerComplianceRate: 92.1,
  trainingSessionsConducted: 8,
  farmerSatisfactionScore: 4.7,
  averageResponseTime: 4.2,
  monthlyStats: [
    {
      month: 'December 2023',
      farmsVisited: 10,
      recommendationsGiven: 24,
      trainingSessions: 3,
      diseasesCured: 8,
      farmerRating: 4.8
    },
    {
      month: 'January 2024',
      farmsVisited: 12,
      recommendationsGiven: 31,
      trainingSessions: 2,
      diseasesCured: 12,
      farmerRating: 4.6
    }
  ]
});

// API Routes

// Get agronomist dashboard overview
router.get('/overview', (req, res) => {
  try {
    const farms = generateMockFarms();
    const metrics = generateMockExpertMetrics();
    const pendingAnalyses = generateMockDiseaseAnalyses().filter(a => a.status === 'pending').length;
    const overdueRecommendations = generateMockRecommendations().filter(r => 
      r.status === 'overdue' || (r.status === 'pending' && new Date(r.dueDate) < new Date())
    ).length;

    const dashboardData = {
      farms,
      summary: {
        totalFarms: metrics.totalFarms,
        urgentFarms: farms.filter(f => f.urgencyLevel === 'critical').length,
        pendingDiseaseAnalyses: pendingAnalyses,
        overdueRecommendations,
        averageFarmHealth: Math.round(farms.reduce((sum, f) => sum + f.soilHealth, 0) / farms.length),
        totalAlerts: farms.reduce((sum, f) => sum + f.alertCount, 0)
      },
      metrics,
      lastUpdated: new Date().toISOString()
    };

    res.json({
      success: true,
      data: dashboardData,
      message: 'Agronomist dashboard data retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving agronomist dashboard data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get farms under supervision
router.get('/farms', (req, res) => {
  try {
    const farms = generateMockFarms();
    const { urgency, health, location } = req.query;

    let filteredFarms = farms;

    if (urgency) {
      filteredFarms = filteredFarms.filter(f => f.urgencyLevel === urgency);
    }

    if (health) {
      const minHealth = parseInt(health as string);
      filteredFarms = filteredFarms.filter(f => f.soilHealth >= minHealth);
    }

    if (location) {
      filteredFarms = filteredFarms.filter(f => 
        f.location.toLowerCase().includes((location as string).toLowerCase()) ||
        f.locationArabic.includes(location as string)
      );
    }

    res.json({
      success: true,
      data: filteredFarms,
      message: 'Farms data retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving farms data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get disease analyses for review
router.get('/disease-analyses', (req, res) => {
  try {
    const analyses = generateMockDiseaseAnalyses();
    const { status, farmId, reviewed } = req.query;

    let filteredAnalyses = analyses;

    if (status) {
      filteredAnalyses = filteredAnalyses.filter(a => a.status === status);
    }

    if (farmId) {
      filteredAnalyses = filteredAnalyses.filter(a => a.farmId === farmId);
    }

    if (reviewed !== undefined) {
      const isReviewed = reviewed === 'true';
      filteredAnalyses = filteredAnalyses.filter(a => a.expertReview.reviewed === isReviewed);
    }

    res.json({
      success: true,
      data: filteredAnalyses,
      message: 'Disease analyses retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving disease analyses',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Review disease analysis
router.put('/disease-analyses/:analysisId/review', (req, res) => {
  try {
    const { analysisId } = req.params;
    const { 
      expertDiagnosis, 
      expertDiagnosisArabic, 
      treatmentPlan, 
      treatmentPlanArabic, 
      followUpRequired, 
      followUpDate 
    } = req.body;

    // In a real implementation, update the analysis in the database
    const reviewData = {
      analysisId,
      reviewed: true,
      reviewedBy: 'Dr. Ahmed Ben Salem', // Should come from authenticated user
      reviewedAt: new Date().toISOString(),
      expertDiagnosis,
      expertDiagnosisArabic,
      treatmentPlan,
      treatmentPlanArabic,
      followUpRequired,
      followUpDate
    };

    res.json({
      success: true,
      data: reviewData,
      message: 'Disease analysis reviewed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error reviewing disease analysis',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get recommendation tracking
router.get('/recommendations', (req, res) => {
  try {
    const recommendations = generateMockRecommendations();
    const { status, farmId, priority, overdue } = req.query;

    let filteredRecommendations = recommendations;

    if (status) {
      filteredRecommendations = filteredRecommendations.filter(r => r.status === status);
    }

    if (farmId) {
      filteredRecommendations = filteredRecommendations.filter(r => r.farmId === farmId);
    }

    if (priority) {
      filteredRecommendations = filteredRecommendations.filter(r => r.priority === priority);
    }

    if (overdue === 'true') {
      const now = new Date();
      filteredRecommendations = filteredRecommendations.filter(r => 
        r.status === 'pending' && new Date(r.dueDate) < now
      );
    }

    res.json({
      success: true,
      data: filteredRecommendations,
      message: 'Recommendations retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving recommendations',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create new recommendation
router.post('/recommendations', (req, res) => {
  try {
    const {
      farmId,
      farmName,
      farmerName,
      recommendation,
      recommendationArabic,
      type,
      priority,
      dueDate
    } = req.body;

    const newRecommendation: RecommendationTracking = {
      id: `rec_${Date.now()}`,
      farmId,
      farmName,
      farmerName,
      recommendation,
      recommendationArabic,
      type,
      priority,
      createdAt: new Date().toISOString(),
      dueDate,
      status: 'pending',
      followUpRequired: priority === 'urgent' || priority === 'high'
    };

    // In a real implementation, save to database
    res.json({
      success: true,
      data: newRecommendation,
      message: 'Recommendation created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating recommendation',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get training programs
router.get('/training-programs', (req, res) => {
  try {
    const programs = generateMockTrainingPrograms();
    const { status, type, category } = req.query;

    let filteredPrograms = programs;

    if (status) {
      filteredPrograms = filteredPrograms.filter(p => p.status === status);
    }

    if (type) {
      filteredPrograms = filteredPrograms.filter(p => p.type === type);
    }

    if (category) {
      filteredPrograms = filteredPrograms.filter(p => p.category === category);
    }

    res.json({
      success: true,
      data: filteredPrograms,
      message: 'Training programs retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving training programs',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create training program
router.post('/training-programs', (req, res) => {
  try {
    const {
      title,
      titleArabic,
      description,
      descriptionArabic,
      type,
      category,
      duration,
      maxParticipants,
      scheduledDate,
      location,
      locationArabic,
      materials
    } = req.body;

    const newProgram: TrainingProgram = {
      id: `training_${Date.now()}`,
      title,
      titleArabic,
      description,
      descriptionArabic,
      type,
      category,
      duration,
      maxParticipants,
      scheduledDate,
      location,
      locationArabic,
      materials: materials || [],
      participants: [],
      status: 'draft',
      createdBy: 'Dr. Ahmed Ben Salem', // Should come from authenticated user
      createdAt: new Date().toISOString()
    };

    // In a real implementation, save to database
    res.json({
      success: true,
      data: newProgram,
      message: 'Training program created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating training program',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get crop performance analysis
router.get('/performance-analysis', (req, res) => {
  try {
    const analyses = generateMockPerformanceAnalysis();
    const { farmId, crop } = req.query;

    let filteredAnalyses = analyses;

    if (farmId) {
      filteredAnalyses = filteredAnalyses.filter(a => a.farmId === farmId);
    }

    if (crop) {
      filteredAnalyses = filteredAnalyses.filter(a => 
        a.crop.toLowerCase().includes((crop as string).toLowerCase()) ||
        a.cropArabic.includes(crop as string)
      );
    }

    res.json({
      success: true,
      data: filteredAnalyses,
      message: 'Performance analysis retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving performance analysis',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get expert performance metrics
router.get('/metrics', (req, res) => {
  try {
    const metrics = generateMockExpertMetrics();

    res.json({
      success: true,
      data: metrics,
      message: 'Expert metrics retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving expert metrics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
