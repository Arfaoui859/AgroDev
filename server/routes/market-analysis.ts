import express from 'express';

const router = express.Router();

// Mock market data for Tunisian agricultural products
const tunisianCrops = [
  { id: 'olive', name: 'الزيتون', category: 'fruits' },
  { id: 'tomato', name: 'الطماطم', category: 'vegetables' },
  { id: 'wheat', name: 'القمح', category: 'grains' },
  { id: 'citrus', name: 'الحمضيات', category: 'fruits' },
  { id: 'potato', name: 'البطاطا', category: 'vegetables' },
  { id: 'dates', name: 'التمر', category: 'fruits' },
  { id: 'barley', name: 'الشعير', category: 'grains' },
  { id: 'artichoke', name: 'الخرشوف', category: 'vegetables' },
  { id: 'almond', name: 'اللوز', category: 'nuts' },
  { id: 'cork_oak', name: 'البلوط الفليني', category: 'forestry' }
];

// Generate realistic price data with trends
function generatePriceData(crop: string, days: number = 30) {
  const basePrice = {
    olive: 8.5,
    tomato: 2.3,
    wheat: 1.8,
    citrus: 3.2,
    potato: 1.5,
    dates: 15.0,
    barley: 1.4,
    artichoke: 4.5,
    almond: 22.0,
    cork_oak: 35.0
  }[crop] || 5.0;

  const data = [];
  let currentPrice = basePrice;
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Add realistic price volatility
    const volatility = 0.05 + Math.random() * 0.1;
    const change = (Math.random() - 0.5) * volatility;
    currentPrice = Math.max(0.1, currentPrice * (1 + change));
    
    data.push({
      date: date.toISOString().split('T')[0],
      price: parseFloat(currentPrice.toFixed(2)),
      volume: Math.floor(Math.random() * 1000) + 100,
      change: i === 0 ? 0 : parseFloat((change * 100).toFixed(2))
    });
  }
  
  return data;
}

// Generate market predictions
function generatePredictions(crop: string, historicalData: any[]) {
  const lastPrice = historicalData[historicalData.length - 1].price;
  const predictions = [];
  let predictedPrice = lastPrice;
  
  // Seasonal factors for different crops
  const seasonalFactors = {
    olive: [1.05, 1.1, 1.15, 1.2, 1.1, 0.95, 0.9, 0.85, 0.9, 1.0, 1.05, 1.1],
    tomato: [1.2, 1.15, 1.0, 0.8, 0.7, 0.75, 0.85, 0.9, 1.0, 1.1, 1.15, 1.2],
    wheat: [1.0, 1.0, 1.05, 1.1, 1.15, 1.2, 1.15, 1.0, 0.95, 0.9, 0.95, 1.0],
    citrus: [1.15, 1.2, 1.1, 0.9, 0.8, 0.85, 0.9, 0.95, 1.0, 1.05, 1.1, 1.15]
  };
  
  const factors = seasonalFactors[crop] || Array(12).fill(1.0);
  const currentMonth = new Date().getMonth();
  
  for (let i = 1; i <= 30; i++) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + i);
    const futureMonth = futureDate.getMonth();
    
    const seasonalMultiplier = factors[futureMonth];
    const trendFactor = 1 + (Math.random() - 0.5) * 0.03;
    
    predictedPrice = predictedPrice * seasonalMultiplier * trendFactor;
    
    predictions.push({
      date: futureDate.toISOString().split('T')[0],
      predictedPrice: parseFloat(predictedPrice.toFixed(2)),
      confidence: Math.max(0.6, 0.95 - (i * 0.01)),
      factors: {
        seasonal: seasonalMultiplier,
        weather: 1 + (Math.random() - 0.5) * 0.05,
        demand: 1 + (Math.random() - 0.5) * 0.03,
        supply: 1 + (Math.random() - 0.5) * 0.04
      }
    });
  }
  
  return predictions;
}

// Get current market prices
router.get('/prices/current', (req, res) => {
  const currentPrices = tunisianCrops.map(crop => {
    const priceData = generatePriceData(crop.id, 1);
    const prediction = generatePredictions(crop.id, priceData);
    
    return {
      id: crop.id,
      name: crop.name,
      category: crop.category,
      currentPrice: priceData[0].price,
      currency: 'TND',
      change24h: parseFloat(((Math.random() - 0.5) * 10).toFixed(2)),
      volume: priceData[0].volume,
      trend: Math.random() > 0.5 ? 'up' : 'down',
      nextWeekForecast: prediction[6].predictedPrice,
      confidence: prediction[6].confidence
    };
  });
  
  res.json(currentPrices);
});

// Get historical price data for a specific crop
router.get('/prices/history/:cropId', (req, res) => {
  const { cropId } = req.params;
  const days = parseInt(req.query.days as string) || 30;
  
  const crop = tunisianCrops.find(c => c.id === cropId);
  if (!crop) {
    return res.status(404).json({ error: 'Crop not found' });
  }
  
  const historicalData = generatePriceData(cropId, days);
  
  res.json({
    crop: crop,
    currency: 'TND',
    period: `${days} days`,
    data: historicalData,
    statistics: {
      highest: Math.max(...historicalData.map(d => d.price)),
      lowest: Math.min(...historicalData.map(d => d.price)),
      average: parseFloat((historicalData.reduce((sum, d) => sum + d.price, 0) / historicalData.length).toFixed(2)),
      volatility: parseFloat((Math.random() * 15 + 5).toFixed(2))
    }
  });
});

// Get price predictions for a specific crop
router.get('/predictions/:cropId', (req, res) => {
  const { cropId } = req.params;
  const days = parseInt(req.query.days as string) || 30;
  
  const crop = tunisianCrops.find(c => c.id === cropId);
  if (!crop) {
    return res.status(404).json({ error: 'Crop not found' });
  }
  
  const historicalData = generatePriceData(cropId, 30);
  const predictions = generatePredictions(cropId, historicalData).slice(0, days);
  
  // Analysis of factors affecting price
  const analysis = {
    outlook: Math.random() > 0.5 ? 'bullish' : 'bearish',
    keyFactors: [
      'تقلبات الطقس المتوقعة',
      'الطلب من الأسواق الأوروبية',
      'مواسم الحصاد المحلية',
      'أسعار الطاقة والنقل',
      'السياسات الحكومية'
    ],
    riskLevel: ['منخفض', 'متوسط', 'عالي'][Math.floor(Math.random() * 3)],
    recommendation: Math.random() > 0.5 ? 'شراء' : 'انتظار'
  };
  
  res.json({
    crop: crop,
    currency: 'TND',
    period: `${days} days`,
    predictions: predictions,
    analysis: analysis,
    lastUpdated: new Date().toISOString()
  });
});

// Get market alerts and recommendations
router.get('/alerts', (req, res) => {
  const alerts = [
    {
      id: 'alert-1',
      type: 'price_spike',
      severity: 'high',
      crop: { id: 'olive', name: 'الزيتون' },
      title: 'ارتفاع كبير في أسعار الزيتون',
      message: 'ارتفعت أسعار الزيتون بنسبة 15% خلال الأسبوع الماضي بسبب زيادة الطلب الأوروبي',
      currentPrice: 9.8,
      targetPrice: 8.5,
      change: '+15%',
      recommendation: 'يُنصح بالبيع للمزارعين والاحتفاظ للتجار',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      isActive: true
    },
    {
      id: 'alert-2',
      type: 'seasonal_opportunity',
      severity: 'medium',
      crop: { id: 'tomato', name: 'الطماطم' },
      title: 'فرصة استثمارية في الطماطم',
      message: 'توقعات بارتفاع أسعار الطماطم 20% خلال الشهر القادم مع بداية موسم الطلب',
      currentPrice: 2.3,
      targetPrice: 2.8,
      change: '+20%',
      recommendation: 'فرصة ممتازة للزراعة والاستثمار',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      isActive: true
    },
    {
      id: 'alert-3',
      type: 'weather_impact',
      severity: 'medium',
      crop: { id: 'wheat', name: 'القمح' },
      title: 'تأثير الطقس على القمح',
      message: 'توقعات بانخفاض محصول القمح بسبب قلة الأمطار، مما قد يرفع الأسعار',
      currentPrice: 1.8,
      targetPrice: 2.1,
      change: '+17%',
      recommendation: 'احتفظ بالمخزون وتجنب البيع الآن',
      timestamp: new Date(Date.now() - 10800000).toISOString(),
      isActive: true
    }
  ];
  
  res.json(alerts);
});

// Create or update user alert preferences
router.post('/alerts/preferences', (req, res) => {
  const { cropIds, priceThresholds, alertTypes, notificationMethods } = req.body;
  
  // Mock saving preferences
  const preferences = {
    id: 'pref-' + Date.now(),
    cropIds: cropIds || [],
    priceThresholds: priceThresholds || {},
    alertTypes: alertTypes || ['price_spike', 'seasonal_opportunity'],
    notificationMethods: notificationMethods || ['in_app'],
    isActive: true,
    createdAt: new Date().toISOString()
  };
  
  res.json({
    success: true,
    preferences: preferences,
    message: 'تم حفظ تفضيلا�� التنبيهات بنجاح'
  });
});

// Get market analysis dashboard data
router.get('/dashboard', (req, res) => {
  const dashboardData = {
    marketSummary: {
      totalCrops: tunisianCrops.length,
      activeAlerts: 3,
      avgPriceChange: '+2.3%',
      marketTrend: 'bullish',
      lastUpdated: new Date().toISOString()
    },
    topPerformers: [
      { crop: 'الزيتون', change: '+15%', price: 9.8 },
      { crop: 'التمر', change: '+8%', price: 16.2 },
      { crop: 'اللوز', change: '+5%', price: 23.1 }
    ],
    topDecliners: [
      { crop: 'البطاطا', change: '-3%', price: 1.45 },
      { crop: 'الشعير', change: '-2%', price: 1.37 }
    ],
    seasonalInsights: [
      'موسم قطف الزيتون يقترب - توقع زيادة العرض',
      'الطلب على الحمضيات يرتفع مع قدوم الشتاء',
      'أسعار الحبوب مستقرة مع توقعات موسم جيد'
    ],
    priceIndices: {
      fruits: { value: 105.2, change: '+3.2%' },
      vegetables: { value: 98.7, change: '-1.3%' },
      grains: { value: 102.5, change: '+2.5%' },
      overall: { value: 102.1, change: '+1.8%' }
    }
  };
  
  res.json(dashboardData);
});

// Get market comparison with neighboring countries
router.get('/comparison/:cropId', (req, res) => {
  const { cropId } = req.params;
  
  const crop = tunisianCrops.find(c => c.id === cropId);
  if (!crop) {
    return res.status(404).json({ error: 'Crop not found' });
  }
  
  const tunisianPrice = generatePriceData(cropId, 1)[0].price;
  
  const comparison = {
    crop: crop,
    tunisia: {
      price: tunisianPrice,
      currency: 'TND',
      marketShare: '100%'
    },
    regionalPrices: {
      algeria: {
        price: parseFloat((tunisianPrice * (0.9 + Math.random() * 0.2)).toFixed(2)),
        currency: 'DZD',
        exchangeRate: 14.5
      },
      morocco: {
        price: parseFloat((tunisianPrice * (0.95 + Math.random() * 0.1)).toFixed(2)),
        currency: 'MAD',
        exchangeRate: 1.1
      },
      libya: {
        price: parseFloat((tunisianPrice * (1.1 + Math.random() * 0.2)).toFixed(2)),
        currency: 'LYD',
        exchangeRate: 0.21
      }
    },
    competitiveness: Math.random() > 0.5 ? 'competitive' : 'expensive',
    exportOpportunities: [
      'السوق الأوروبي - طلب مرتفع',
      'دول الخليج - جودة عالية مطلوبة',
      'السوق المحلي - استهلاك متزايد'
    ]
  };
  
  res.json(comparison);
});

export default router;
