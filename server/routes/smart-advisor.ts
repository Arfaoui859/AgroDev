import express from 'express';
import { z } from 'zod';

const router = express.Router();

// Mock data for demonstration
const recommendations = [
  {
    id: '1',
    type: 'crop_selection',
    title: 'زراعة البطاطا الحلوة بدلاً من الطماطم',
    description: 'نقترح زراعة البطاطا الحلوة في الحقل الشرقي بدلاً من الطماطم نظراً لارتفاع أسعارها وملاءمة الظروف المناخية',
    priority: 'high',
    confidence: 89,
    expectedOutcome: 'زيادة الربح بنسبة 35% وتقليل استهلاك المياه بنسبة 20%',
    profitability: 35.2,
    riskLevel: 'low',
    timeframe: '4-6 أشهر',
    reasoning: [
      'ارتفاع أسعار البطاطا الحلوة بنسبة 40% في السوق المحلي',
      'انخفاض تكلفة المياه نظراً لمقاومة الجفاف',
      'توفر بذور عالية الجودة بأسعار مناسبة',
      'طلب متزايد من المصانع والمصدرين'
    ],
    data_sources: ['بيانات السوق المحلي', 'تحليل التربة', 'توقعات المناخ', 'أسعار البذور'],
    action_steps: [
      'شراء بذور البطاطا الحلوة من المورد المعتمد',
      'إعداد التربة بإضافة السماد العضوي',
      'تجهيز نظام الري بالتنقيط',
      'زراعة البذور في الأسبوع الأول من الشهر القادم',
      'متابعة النمو وتطبيق برنامج التسميد'
    ],
    financial_impact: {
      cost: 15000,
      revenue: 35000,
      profit: 20000,
      roi: 35.2
    },
    environmental_factors: ['مقاومة الجفاف', 'تحسين خصوبة التربة', 'تقليل استخدام المبيدات'],
    market_factors: ['ارتفاع الطلب', 'أسعار مستقرة', 'فرص التصدير'],
    created_at: '2024-02-15T10:30:00Z',
    status: 'pending'
  },
  {
    id: '2',
    type: 'irrigation',
    title: 'تقليل الري بنسبة 25% للقمح',
    description: 'تشير البيانات إلى إمكانية تقليل الري للقمح بناءً على مستوى الرطوبة في التربة والتوقعات المناخية',
    priority: 'medium',
    confidence: 82,
    expectedOutcome: 'توفير 15,000 ريال من تكاليف المياه مع الحفاظ على جودة المحصول',
    profitability: 22.8,
    riskLevel: 'low',
    timeframe: 'فوري - أسبوعين',
    reasoning: [
      'مستوى الرطوبة في التربة أعلى من المطلوب بنسبة 15%',
      'توقعات أمطار خلال الأسبوع القادم',
      'النباتات في مرحلة نمو لا تتطلب ري مكثف',
      'جودة المياه الجوفية تحتاج لوقت للتجدد'
    ],
    data_sources: ['أجهزة استشعار التربة', 'توقعات الأرصاد الجوية', 'مراقبة نمو النباتات'],
    action_steps: [
      'تقليل جدولة الري من 3 مرات إلى مرتين أسبوعياً',
      'مراقبة مستوى الرطوبة يومياً',
      'تأجيل الري في حالة توقع الأمطار',
      'فحص حالة النباتات كل يومين'
    ],
    financial_impact: {
      cost: 2000,
      revenue: 0,
      profit: 15000,
      roi: 22.8
    },
    environmental_factors: ['حفظ المياه الجوفية', 'تقليل هدر المياه'],
    market_factors: ['توفير تكاليف الطاقة'],
    created_at: '2024-02-14T14:20:00Z',
    status: 'pending'
  },
  {
    id: '3',
    type: 'selling',
    title: 'بيع محصول الذرة خلال أسبوعين',
    description: 'أفضل وقت لبيع محصول الذرة المخزن حالياً قبل انخفاض الأسعار المتوقع',
    priority: 'high',
    confidence: 91,
    expectedOutcome: 'تحقيق ربح إضافي قدره 25,000 ريال مقارنة بالبيع المتأخر',
    profitability: 18.5,
    riskLevel: 'medium',
    timeframe: 'أسبوعين',
    reasoning: [
      'أسعار الذرة في أعلى مستوياتها خلال 6 أشهر',
      'توقعات بانخفاض الأسعار بنسبة 15% خلال شهر',
      'زيادة المعروض من الواردات الجديدة',
      'طلب قوي من شركات الأعلاف حالياً'
    ],
    data_sources: ['أسعار البورصة', 'تقارير الواردات', 'طلبات شركات الأعلاف'],
    action_steps: [
      'التواصل مع 3 مشترين محتملين للتفاوض',
      'تحضير عينات للفحص والاختبار',
      'ترتيب النقل والت��ليم',
      'إنهاء المعاملات خلال أسبوعين'
    ],
    financial_impact: {
      cost: 5000,
      revenue: 135000,
      profit: 25000,
      roi: 18.5
    },
    environmental_factors: ['تجنب التلف أثناء التخزين المطول'],
    market_factors: ['أسعار مرتفعة', 'طلب قوي', 'منافسة قليلة'],
    created_at: '2024-02-13T09:15:00Z',
    status: 'pending'
  },
  {
    id: '4',
    type: 'investment',
    title: 'الاستثمار في نظام الري الذكي',
    description: 'استثمار في تركيب نظام ري ذكي متطور لتحسين كفاءة استخدام المياه وزيادة الإنتاجية',
    priority: 'medium',
    confidence: 76,
    expectedOutcome: 'توفير 40% من تكاليف المياه وزيادة الإنتاجية بنسبة 25%',
    profitability: 42.3,
    riskLevel: 'medium',
    timeframe: '6-9 أشهر',
    reasoning: [
      'ارتفاع تكاليف المياه بنسبة 20% سنوياً',
      'تقنيات الري الذكي أثبتت فعاليتها',
      'دعم حكومي للتقنيات المائية بنسبة 30%',
      'تحسين جودة المحاصيل مع الري المنتظم'
    ],
    data_sources: ['دراسة جدوى ��قنية', 'أسعار المعدات', 'برامج الدعم الحكومي'],
    action_steps: [
      'الحصول على عروض أسعار من 3 مقاولين',
      'تقديم طلب للحصول على الدعم الحكومي',
      'تخطيط شبكة الري وتحديد النقاط الرئيسية',
      'تنفيذ المشروع على مراحل'
    ],
    financial_impact: {
      cost: 85000,
      revenue: 0,
      profit: 36000,
      roi: 42.3
    },
    environmental_factors: ['توفير المياه', 'تقليل التلوث', 'كفاءة الطاقة'],
    market_factors: ['دعم حكومي', 'تطور التقنية', 'انخفاض أسعار المعدات'],
    created_at: '2024-02-12T11:45:00Z',
    status: 'pending'
  }
];

const chatHistory = [
  {
    id: '1',
    type: 'assistant',
    content: 'مرحباً! أنا المستشار الذكي للقرارات الزراعية. يمكنني مساعدتك في اتخاذ قرارات مدروسة حول مزرعتك. ما الذي تود معرفته؟',
    timestamp: '2024-02-15T09:00:00Z'
  }
];

const marketData = [
  {
    crop: 'القمح',
    current_price: 1850,
    price_trend: 'up',
    demand_level: 'high',
    seasonal_pattern: 'ارتفاع في الشتاء',
    forecast_30_days: 1920,
    forecast_90_days: 2100,
    supply_status: 'معروض محدود',
    export_potential: true
  },
  {
    crop: 'الذرة',
    current_price: 1650,
    price_trend: 'down',
    demand_level: 'medium',
    seasonal_pattern: 'استقرار في الربيع',
    forecast_30_days: 1580,
    forecast_90_days: 1520,
    supply_status: 'معروض كافي',
    export_potential: false
  },
  {
    crop: 'الطماطم',
    current_price: 4500,
    price_trend: 'stable',
    demand_level: 'high',
    seasonal_pattern: 'ارتفاع في الصيف',
    forecast_30_days: 4600,
    forecast_90_days: 5200,
    supply_status: 'معروض قليل',
    export_potential: true
  },
  {
    crop: 'البطاطا الحلوة',
    current_price: 3200,
    price_trend: 'up',
    demand_level: 'high',
    seasonal_pattern: 'ارتفاع مستمر',
    forecast_30_days: 3450,
    forecast_90_days: 3800,
    supply_status: 'معروض محدود جداً',
    export_potential: true
  },
  {
    crop: 'الجزر',
    current_price: 2800,
    price_trend: 'stable',
    demand_level: 'medium',
    seasonal_pattern: 'موسمي',
    forecast_30_days: 2850,
    forecast_90_days: 2900,
    supply_status: 'معروض مناسب',
    export_potential: false
  }
];

const weatherData = {
  temperature: 28,
  humidity: 45,
  rainfall: 2.5,
  forecast_7_days: [
    { date: '2024-02-16', temp_max: 30, temp_min: 18, humidity: 40, rainfall: 0 },
    { date: '2024-02-17', temp_max: 32, temp_min: 19, humidity: 38, rainfall: 0 },
    { date: '2024-02-18', temp_max: 29, temp_min: 17, humidity: 55, rainfall: 5 },
    { date: '2024-02-19', temp_max: 26, temp_min: 15, humidity: 65, rainfall: 12 },
    { date: '2024-02-20', temp_max: 28, temp_min: 16, humidity: 50, rainfall: 3 },
    { date: '2024-02-21', temp_max: 31, temp_min: 18, humidity: 42, rainfall: 0 },
    { date: '2024-02-22', temp_max: 33, temp_min: 20, humidity: 35, rainfall: 0 }
  ],
  forecast_30_days: [
    { week: 1, avg_temp: 29, rainfall: 20 },
    { week: 2, avg_temp: 27, rainfall: 35 },
    { week: 3, avg_temp: 30, rainfall: 15 },
    { week: 4, avg_temp: 32, rainfall: 8 }
  ],
  weather_alerts: [
    'موجة حارة متوقعة الأسبوع القادم مع درجات حرارة تصل إلى 38°م',
    'أمطار خفيفة إلى متوسطة متوقعة يومي الخميس والجمعة',
    'رياح قوية متوقعة يوم السبت قد تؤثر على عمليات الرش'
  ],
  optimal_conditions: true,
  irrigation_needed: false
};

const soilAnalysis = {
  ph_level: 6.8,
  nitrogen: 85,
  phosphorus: 65,
  potassium: 78,
  organic_matter: 3.2,
  moisture: 28,
  salinity: 0.8,
  recommendations: [
    'إضافة السماد العضوي لزيادة المادة العضوية',
    'تطبيق الجبس الزراعي لتحسين بنية التربة',
    'مراقبة مستوى الملوحة بشكل دوري'
  ],
  last_updated: '2024-02-10T08:00:00Z'
};

const decisionContext = {
  location: 'الرياض، المملكة العربية السعودية',
  farm_size: 250,
  current_crops: ['القمح', 'الذرة', 'الطماطم', 'الجزر'],
  soil_type: 'sandy_loam',
  irrigation_system: 'drip',
  budget: 500000,
  experience_level: 'intermediate',
  goals: ['زيادة الربحية', 'توفير المياه', 'تحسين جودة المحاصيل'],
  constraints: ['ميزانية محدودة', 'نقص العمالة الماهرة', 'تذبذب أسعار السوق']
};

// AI Response Templates
const aiResponses = {
  crop_selection: [
    'بناءً على تحليل التربة والمناخ والسوق، أنصح بزراعة {crop} لأنه يناسب ظروفك الحالية ويحقق ربحية عالية.',
    'نصيحتي هي التركيز على {crop} في هذا الموسم نظراً لارتفاع الطلب وملاءمة الظروف.',
    'من خلال تحليل البيانات، يبدو أن {crop} هو الخيار الأمثل لمزرعتك حالياً.'
  ],
  irrigation: [
    'تشير أجهزة الاستشعار إلى أن مستوى الرطوبة مناسب، يمكنك {action} الري.',
    'نصحي هو {action} كمية الري بناءً على الظروف المناخية الحالية.',
    'البيانات تظهر أنه يمكنك تحسين كفاءة الري عبر {action}.'
  ],
  selling: [
    'أفضل وقت لبيع {crop} هو {timing} لتحقيق أقصى ربح.',
    'تشير توقعات السوق إلى أن البيع {timing} سيحقق لك أفضل عائد.',
    'نصيحتي هي {action} البيع نظراً لحالة السوق الحالية.'
  ],
  investment: [
    'الاستثمار في {investment} سيحقق لك عائداً قدره {roi}% خلال {timeframe}.',
    'أنصح بالاستثمار في {investment} نظراً للعوائد المتوقعة والدعم المتاح.',
    'من الناحية المالية، {investment} استثمار مربح بمعدل عائد متوقع {roi}%.'
  ]
};

// Validation schemas
const ChatMessageSchema = z.object({
  message: z.string(),
  context: z.object({
    location: z.string().optional(),
    farm_size: z.number().optional(),
    current_crops: z.array(z.string()).optional(),
    soil_type: z.string().optional(),
    irrigation_system: z.string().optional(),
    budget: z.number().optional()
  }).optional()
});

// GET /api/smart-advisor/recommendations - Get all recommendations
router.get('/recommendations', (req, res) => {
  try {
    const { type, priority, status } = req.query;
    
    let filteredRecommendations = [...recommendations];
    
    if (type) {
      filteredRecommendations = filteredRecommendations.filter(r => r.type === type);
    }
    
    if (priority) {
      filteredRecommendations = filteredRecommendations.filter(r => r.priority === priority);
    }
    
    if (status) {
      filteredRecommendations = filteredRecommendations.filter(r => r.status === status);
    }
    
    res.json(filteredRecommendations);
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في جلب التوصيات' });
  }
});

// GET /api/smart-advisor/market-data - Get market data
router.get('/market-data', (req, res) => {
  try {
    res.json(marketData);
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في جلب بيانات السوق' });
  }
});

// GET /api/smart-advisor/weather - Get weather data
router.get('/weather', (req, res) => {
  try {
    res.json(weatherData);
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في جلب بيانات الطقس' });
  }
});

// GET /api/smart-advisor/soil-analysis - Get soil analysis
router.get('/soil-analysis', (req, res) => {
  try {
    res.json(soilAnalysis);
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في جلب تحليل التربة' });
  }
});

// GET /api/smart-advisor/context - Get decision context
router.get('/context', (req, res) => {
  try {
    res.json(decisionContext);
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في جلب سياق القرار' });
  }
});

// GET /api/smart-advisor/chat-history - Get chat history
router.get('/chat-history', (req, res) => {
  try {
    res.json(chatHistory);
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في جلب تاريخ المحادثة' });
  }
});

// POST /api/smart-advisor/chat - Send chat message and get AI response
router.post('/chat', (req, res) => {
  try {
    const validatedData = ChatMessageSchema.parse(req.body);
    const { message, context } = validatedData;
    
    // Simple AI response logic based on keywords
    let response = 'شكراً لسؤالك. يمكنني مساعدتك في تحليل هذا الموضوع بناءً على البيانات المتاحة.';
    let recommendationId = null;
    
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('محصول') || lowerMessage.includes('زراعة') || lowerMessage.includes('أفضل')) {
      const crop = 'البطاطا الحلوة';
      response = `بناءً على تحليل التربة والمناخ وبيانات السوق الحالية، أنصح بزراعة ${crop} لأنه يحقق ربحية عالية (35%) ويناسب ظروف مزرعتك. السوق يشهد طلباً متزايداً على هذا المحصول مع ارتفاع في الأسعار بنسبة 40%.`;
      recommendationId = '1';
    } else if (lowerMessage.includes('ري') || lowerMessage.includes('مياه')) {
      response = 'تشير أجهزة الاستشعار إلى أن مستوى الرطوبة في التربة أعلى من المطلوب بنسبة 15%. أنصح بتقليل الري بنسبة 25% مما يوفر لك حوالي 15,000 ريال مع الحفاظ على جودة المحصول. كما أن هناك توقعات بأمطار خلال الأسبوع القادم.';
      recommendationId = '2';
    } else if (lowerMessage.includes('بيع') || lowerMessage.includes('سعر') || lowerMessage.includes('سوق')) {
      response = 'أسعار الذرة حالياً في أعلى مستوياتها خلال 6 أشهر. أنصح ببيع محصول الذرة المخزن خلال أسبوعين لتحقيق ربح إضافي قدره 25,000 ريال، حيث تتوقع التقارير انخفاضاً في الأسعار بنسبة 15% خلال الشهر القادم بسبب زيادة الواردات.';
      recommendationId = '3';
    } else if (lowerMessage.includes('استثمار') || lowerMessage.includes('تطوير') || lowerMessage.includes('تحديث')) {
      response = 'أنصح بالاستثمار في نظام الري الذكي الذي سيوفر 40% من تكاليف المياه ويزيد الإنتاجية بنسبة 25%. التكلفة 85,000 ريال مع إمكانية الحصول على دعم حكومي 30%. العائد المتوقع 42.3% خلال 6-9 أشهر.';
      recommendationId = '4';
    } else if (lowerMessage.includes('طقس') || lowerMessage.includes('مناخ') || lowerMessage.includes('حرارة')) {
      response = 'الظروف المناخية حالياً مثالية للزراعة. درجة الحرارة 28°م والرطوبة 45%. هناك تنبيه لموجة حارة الأسبوع القادم قد تصل لـ 38°م، وأمطار خفيفة متوقعة يومي الخميس والجمعة. أنصح بتجنب عمليات الرش يوم السبت بسبب الرياح القوية المتوق��ة.';
    } else if (lowerMessage.includes('تربة') || lowerMessage.includes('سماد') || lowerMessage.includes('تسميد')) {
      response = 'تحليل التربة يظهر: pH = 6.8 (مثالي)، نيتروجين 85، فوسفور 65، بوتاسيوم 78. أنصح بإضافة السماد العضوي لزيادة المادة العضوية من 3.2% إلى 4%، وتطبيق الجبس الزراعي لتحسين بنية التربة. مستوى الملوحة مقبول (0.8) لكن يحتاج مراقبة دورية.';
    }
    
    res.json({
      response,
      recommendation_id: recommendationId,
      confidence: Math.floor(Math.random() * 20) + 80, // 80-99%
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'بيانات غير صحيحة', details: error.errors });
    } else {
      res.status(500).json({ error: 'حدث خطأ في معالجة الرسالة' });
    }
  }
});

// POST /api/smart-advisor/generate-recommendations - Generate new recommendations
router.post('/generate-recommendations', (req, res) => {
  try {
    const { context } = req.body;
    
    // Simulate AI recommendation generation
    const newRecommendation = {
      id: String(recommendations.length + 1),
      type: 'crop_selection',
      title: 'زراعة الخيار المحمي في البيوت البластيكية',
      description: 'نقترح الاستثمار في زراعة الخيار في البيوت البластيكية نظراً للظروف المثالية والطلب العالي',
      priority: 'medium',
      confidence: 78,
      expectedOutcome: 'زيادة الإنتاجية بنسبة 300% وتحكم أفضل في الجودة',
      profitability: 45.6,
      riskLevel: 'medium',
      timeframe: '3-4 أشهر',
      reasoning: [
        'ارتفاع أسعار الخيار بنسبة 25% خلال الشهرين الماضيين',
        'إمكانية الزراعة على مدار السنة في البيوت المحمية',
        'توفر تقنيات الزراعة المائية المتطورة',
        'طلب مستمر من المطاعم والفنادق'
      ],
      data_sources: ['أسعار السوق', 'دراسة جدوى البيوت المحمية', 'تقارير الطلب'],
      action_steps: [
        'دراسة مواقع مناسبة لإقامة البيوت البластيكية',
        'الحصول على عروض أسعار من الموردين',
        'تحضير البنية التحتية (كهرباء، مياه)',
        'شراء المعدات والبذور',
        'بدء الإنتاج التجريبي'
      ],
      financial_impact: {
        cost: 120000,
        revenue: 175000,
        profit: 55000,
        roi: 45.6
      },
      environmental_factors: ['توفير المياه', 'تقليل استخدام المبيدات', 'إنتاج طوال السنة'],
      market_factors: ['طلب مستمر', 'أسعار مستقرة', 'منافسة محدودة'],
      created_at: new Date().toISOString(),
      status: 'pending'
    };
    
    recommendations.push(newRecommendation);
    
    res.json({
      message: 'تم إنشاء توصيات جديدة بنجاح',
      recommendations_count: 1,
      new_recommendation: newRecommendation
    });
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في إنشاء التوصيات' });
  }
});

// POST /api/smart-advisor/recommendations/:id/accept - Accept recommendation
router.post('/recommendations/:id/accept', (req, res) => {
  try {
    const recommendationIndex = recommendations.findIndex(r => r.id === req.params.id);
    
    if (recommendationIndex === -1) {
      return res.status(404).json({ error: 'التوصية غير موجودة' });
    }
    
    recommendations[recommendationIndex].status = 'accepted';
    
    res.json({
      message: 'تم قبول التوصية بنجاح',
      recommendation: recommendations[recommendationIndex]
    });
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في قبول التوصية' });
  }
});

// POST /api/smart-advisor/recommendations/:id/reject - Reject recommendation
router.post('/recommendations/:id/reject', (req, res) => {
  try {
    const recommendationIndex = recommendations.findIndex(r => r.id === req.params.id);
    
    if (recommendationIndex === -1) {
      return res.status(404).json({ error: 'التوصية غير موجودة' });
    }
    
    recommendations[recommendationIndex].status = 'rejected';
    
    res.json({
      message: 'تم رفض التوصية',
      recommendation: recommendations[recommendationIndex]
    });
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في رفض التوصية' });
  }
});

// GET /api/smart-advisor/analytics - Get analytics data
router.get('/analytics', (req, res) => {
  try {
    const totalRecommendations = recommendations.length;
    const acceptedRecommendations = recommendations.filter(r => r.status === 'accepted').length;
    const implementedRecommendations = recommendations.filter(r => r.status === 'implemented').length;
    const rejectedRecommendations = recommendations.filter(r => r.status === 'rejected').length;
    
    const avgConfidence = recommendations.reduce((sum, r) => sum + r.confidence, 0) / Math.max(recommendations.length, 1);
    const avgProfitability = recommendations.reduce((sum, r) => sum + r.profitability, 0) / Math.max(recommendations.length, 1);
    
    const recommendationsByType = recommendations.reduce((acc, r) => {
      acc[r.type] = (acc[r.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const recommendationsByPriority = recommendations.reduce((acc, r) => {
      acc[r.priority] = (acc[r.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const totalPotentialRevenue = recommendations
      .filter(r => r.status === 'pending' || r.status === 'accepted')
      .reduce((sum, r) => sum + r.financial_impact.revenue, 0);
    
    const totalPotentialProfit = recommendations
      .filter(r => r.status === 'pending' || r.status === 'accepted')
      .reduce((sum, r) => sum + r.financial_impact.profit, 0);
    
    const analytics = {
      overview: {
        totalRecommendations,
        acceptedRecommendations,
        implementedRecommendations,
        rejectedRecommendations,
        pendingRecommendations: recommendations.filter(r => r.status === 'pending').length,
        avgConfidence: Math.round(avgConfidence * 100) / 100,
        avgProfitability: Math.round(avgProfitability * 100) / 100
      },
      distributions: {
        recommendationsByType,
        recommendationsByPriority,
        riskDistribution: recommendations.reduce((acc, r) => {
          acc[r.riskLevel] = (acc[r.riskLevel] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      },
      financial: {
        totalPotentialRevenue,
        totalPotentialProfit,
        averageROI: recommendations.reduce((sum, r) => sum + r.financial_impact.roi, 0) / Math.max(recommendations.length, 1),
        totalInvestmentNeeded: recommendations
          .filter(r => r.status === 'pending' || r.status === 'accepted')
          .reduce((sum, r) => sum + r.financial_impact.cost, 0)
      },
      performance: {
        successRate: (acceptedRecommendations / Math.max(totalRecommendations, 1)) * 100,
        implementationRate: (implementedRecommendations / Math.max(acceptedRecommendations, 1)) * 100,
        rejectionRate: (rejectedRecommendations / Math.max(totalRecommendations, 1)) * 100
      }
    };
    
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في جلب التحليلات' });
  }
});

export default router;
