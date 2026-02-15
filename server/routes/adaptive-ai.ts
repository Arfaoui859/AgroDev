import { RequestHandler } from "express";

const mockAIModels = [
  {
    id: 'model_crop_pred_v3',
    name: 'Crop Prediction Model v3.2',
    nameAr: 'نموذج تنبؤ المحاصيل 3.2',
    type: 'crop_prediction',
    version: '3.2.1',
    accuracy: 94.7,
    trainingData: 125000,
    lastTrained: '2024-02-15',
    status: 'active',
    isPersonalized: true,
    userAdaptations: 2340
  },
  {
    id: 'model_disease_det_v2',
    name: 'Disease Detection Model v2.8',
    nameAr: 'نموذج كشف الأمراض 2.8',
    type: 'disease_detection',
    version: '2.8.5',
    accuracy: 91.3,
    trainingData: 89000,
    lastTrained: '2024-02-20',
    status: 'active',
    isPersonalized: true,
    userAdaptations: 1890
  },
  {
    id: 'model_weather_forecast',
    name: 'Weather Forecast Model v1.5',
    nameAr: 'نموذج التنبؤ الجوي 1.5',
    type: 'weather_forecast',
    version: '1.5.2',
    accuracy: 87.9,
    trainingData: 456000,
    lastTrained: '2024-02-18',
    status: 'active',
    isPersonalized: false,
    userAdaptations: 0
  },
  {
    id: 'model_market_analysis',
    name: 'Market Analysis Model v2.1',
    nameAr: 'نموذج تحليل السوق 2.1',
    type: 'market_analysis',
    version: '2.1.3',
    accuracy: 88.6,
    trainingData: 234000,
    lastTrained: '2024-02-10',
    status: 'testing',
    isPersonalized: true,
    userAdaptations: 567
  },
  {
    id: 'model_recommendations',
    name: 'Smart Recommendations Engine v4.0',
    nameAr: 'محرك التوصيات الذكية 4.0',
    type: 'recommendation',
    version: '4.0.1',
    accuracy: 92.4,
    trainingData: 345000,
    lastTrained: '2024-02-22',
    status: 'training',
    isPersonalized: true,
    userAdaptations: 4560
  }
];

const mockAIInsights = {
  totalModels: 12,
  averageAccuracy: 90.8,
  personalizedUsers: 8750,
  dailyRecommendations: 15600,
  userSatisfaction: 87.3,
  modelUpdates: 23,
  dataPointsProcessed: 2340000,
  improvementRate: 12.4
};

const mockUserBehaviorData = [
  {
    userId: 'user_1',
    sessionDuration: 1840, // seconds
    pagesVisited: ['/analysis', '/recommendations', '/crop-planner'],
    featuresUsed: ['soil_analysis', 'disease_detection', 'weather_alerts'],
    interactionPattern: {
      timeOfDay: { morning: 40, afternoon: 35, evening: 20, night: 5 },
      deviceType: 'mobile',
      preferredLanguage: 'ar',
      clickHeatmap: { 'soil_analysis': 25, 'recommendations': 18, 'weather': 12 }
    },
    feedbackGiven: [],
    conversionEvents: ['trial_started', 'feature_used', 'plan_upgraded']
  },
  {
    userId: 'user_2',
    sessionDuration: 2340,
    pagesVisited: ['/market-dashboard', '/price-forecasts', '/analysis'],
    featuresUsed: ['market_analysis', 'price_forecasting', 'crop_monitoring'],
    interactionPattern: {
      timeOfDay: { morning: 30, afternoon: 45, evening: 20, night: 5 },
      deviceType: 'desktop',
      preferredLanguage: 'ar',
      clickHeatmap: { 'market_analysis': 35, 'price_forecasts': 22, 'reports': 15 }
    },
    feedbackGiven: [],
    conversionEvents: ['trial_started', 'subscription_purchased']
  }
];

const mockPersonalizedRecommendations = [
  {
    id: 'rec_1',
    userId: 'user_1',
    type: 'crop',
    title: 'Optimal Tomato Planting Time',
    titleAr: 'الوقت الأمثل لزراعة الطماطم',
    description: 'Based on your soil conditions and weather patterns, plant tomatoes in the next 2 weeks',
    descriptionAr: 'بناءً على ظرو�� التربة وأنماط الطقس، ازرع الطماطم في الأسبوعين المقبلين',
    confidence: 0.89,
    priority: 'high',
    basedOn: ['soil_ph', 'weather_forecast', 'historical_data'],
    expectedOutcome: 'تحسين الإنتاج بنسبة 15-20%',
    implementationSteps: ['تحضير التربة', 'تحديد المساحة', 'زراعة البذور', 'الري المنتظم'],
    createdAt: '2024-02-22',
    status: 'pending',
    feedback: {
      helpful: true,
      implemented: false,
      outcome: ''
    }
  },
  {
    id: 'rec_2',
    userId: 'user_1',
    type: 'treatment',
    title: 'Organic Pest Control',
    titleAr: 'مكافحة الآفات العضوية',
    description: 'Apply neem oil treatment to prevent aphid infestation',
    descriptionAr: 'استخدم زيت النيم لمنع انتشار حشرات المن',
    confidence: 0.76,
    priority: 'medium',
    basedOn: ['pest_history', 'crop_type', 'weather_conditions'],
    expectedOutcome: 'منع الإصابة بنسبة 85%',
    implementationSteps: ['شراء زيت النيم', 'تحضير المحلول', 'الرش في المساء', 'المتابعة الأسبوعية'],
    createdAt: '2024-02-20',
    status: 'viewed',
    feedback: {
      helpful: true,
      implemented: true,
      outcome: 'تم تطبيق العلاج بنجاح ولم تظهر آفات'
    }
  },
  {
    id: 'rec_3',
    userId: 'user_2',
    type: 'market',
    title: 'Wheat Price Opportunity',
    titleAr: 'فرصة سعر القمح',
    description: 'Wheat prices expected to rise 12% in next month - consider selling',
    descriptionAr: 'من المتوقع ارتفاع أسعار القمح 12% الشهر القادم - فكر في البيع',
    confidence: 0.82,
    priority: 'urgent',
    basedOn: ['market_trends', 'supply_demand', 'global_factors'],
    expectedOutcome: 'زيادة الربح بنسبة 12-15%',
    implementationSteps: ['تحديد الكمية', 'اختيار المشتري', 'التفاوض على السعر', 'إتمام البيع'],
    createdAt: '2024-02-21',
    status: 'implemented'
  }
];

const mockFeedbackData = [
  {
    id: 'feedback_1',
    type: 'rating',
    content: 'التوصيات دقيقة جداً وساعدتني في تحسين إنتاج محصول الطماطم',
    rating: 5,
    feature: 'crop_recommendations',
    timestamp: '2024-02-22T10:30:00Z',
    sentiment: 'positive',
    isProcessed: true,
    aiResponse: 'شكراً لك على التقييم الإيجابي. سنواصل تحسين دقة التوصيات.'
  },
  {
    id: 'feedback_2',
    type: 'suggestion',
    content: 'أقترح إضافة ميزة تذكير للري التلقائي',
    feature: 'irrigation_system',
    timestamp: '2024-02-21T15:45:00Z',
    sentiment: 'positive',
    isProcessed: false,
    aiResponse: ''
  },
  {
    id: 'feedback_3',
    type: 'complaint',
    content: 'التنبؤ الجوي غير دقيق أحياناً',
    rating: 2,
    feature: 'weather_forecast',
    timestamp: '2024-02-20T08:20:00Z',
    sentiment: 'negative',
    isProcessed: true,
    aiResponse: 'نعتذر عن عدم الدقة. نحن نعمل على تحسين نموذج التنبؤ الجوي.'
  },
  {
    id: 'feedback_4',
    type: 'feature_request',
    content: 'أريد ميزة مقارنة الأسعار بين الأسواق المختلفة',
    feature: 'market_analysis',
    timestamp: '2024-02-19T14:10:00Z',
    sentiment: 'neutral',
    isProcessed: false
  }
];

export const getAIModels: RequestHandler = (req, res) => {
  try {
    res.json({
      success: true,
      data: mockAIModels
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch AI models'
    });
  }
};

export const getAIInsights: RequestHandler = (req, res) => {
  try {
    const { period = '7d' } = req.query;
    
    // In production, insights would be calculated based on the period
    res.json({
      success: true,
      data: mockAIInsights
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch AI insights'
    });
  }
};

export const getUserBehaviorData: RequestHandler = (req, res) => {
  try {
    const { period = '7d' } = req.query;
    
    res.json({
      success: true,
      data: mockUserBehaviorData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user behavior data'
    });
  }
};

export const getPersonalizedRecommendations: RequestHandler = (req, res) => {
  try {
    const { model = 'all', period = '7d' } = req.query;
    
    let filteredRecommendations = mockPersonalizedRecommendations;
    
    // Filter by model type if specified
    if (model !== 'all') {
      filteredRecommendations = mockPersonalizedRecommendations.filter(rec => 
        rec.type === model || rec.type.includes(model as string)
      );
    }
    
    res.json({
      success: true,
      data: filteredRecommendations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch personalized recommendations'
    });
  }
};

export const getFeedbackData: RequestHandler = (req, res) => {
  try {
    const { period = '7d' } = req.query;
    
    res.json({
      success: true,
      data: mockFeedbackData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch feedback data'
    });
  }
};

export const submitFeedback: RequestHandler = (req, res) => {
  try {
    const feedbackData = req.body;
    
    // In production, save feedback to database and trigger AI processing
    const newFeedback = {
      id: `feedback_${Date.now()}`,
      ...feedbackData,
      timestamp: new Date().toISOString(),
      isProcessed: false
    };
    
    res.json({
      success: true,
      data: newFeedback,
      message: 'Feedback submitted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to submit feedback'
    });
  }
};

export const updateRecommendationFeedback: RequestHandler = (req, res) => {
  try {
    const { recommendationId } = req.params;
    const feedbackData = req.body;
    
    // In production, update recommendation feedback in database
    res.json({
      success: true,
      data: { id: recommendationId, feedback: feedbackData },
      message: 'Recommendation feedback updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update recommendation feedback'
    });
  }
};

export const triggerModelTraining: RequestHandler = (req, res) => {
  try {
    const { modelId } = req.params;
    const { trainingConfig } = req.body;
    
    // In production, trigger actual model training process
    res.json({
      success: true,
      message: 'Model training initiated successfully',
      trainingJobId: `job_${Date.now()}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to trigger model training'
    });
  }
};
