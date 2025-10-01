import { RequestHandler } from "express";

// Sample data - in production, this would come from a database
const mockMetrics = {
  totalUsers: 15420,
  activeSubscriptions: 8760,
  monthlyRevenue: 125000,
  trialUsers: 2340,
  conversionRate: 24.5,
  churnRate: 3.2,
  averageRevenuePerUser: 14.3,
  growthRate: 18.7
};

const mockAnalytics = {
  dailyActiveUsers: 5670,
  monthlyActiveUsers: 12890,
  averageSessionDuration: 1540, // seconds
  topFeatures: [
    { name: 'soil_analysis', nameAr: 'تحليل التربة', usage: 34, trend: 'up' },
    { name: 'crop_monitoring', nameAr: 'مراقبة المحاصيل', usage: 28, trend: 'up' },
    { name: 'smart_recommendations', nameAr: 'التوصيات الذكية', usage: 23, trend: 'stable' },
    { name: 'weather_alerts', nameAr: 'تنبيها�� الطقس', usage: 19, trend: 'down' },
    { name: 'market_analysis', nameAr: 'تحليل السوق', usage: 15, trend: 'up' }
  ],
  usersByRole: {
    farmer: 8960,
    agronomist: 2340,
    trader: 1890,
    consultant: 1120,
    investor: 890
  },
  usersByRegion: {
    'تونس العاصمة': 3450,
    'صفاقس': 2890,
    'سوسة': 2140,
    'القيروان': 1890,
    'قابس': 1560,
    'أخرى': 3490
  }
};

const mockSubscriptions = [
  {
    id: 'sub_1',
    userId: 'user_1',
    planId: 'plan_farmer_basic',
    status: 'active',
    startDate: '2024-01-15',
    endDate: '2024-12-15',
    autoRenew: true,
    lastPayment: {
      amount: 25,
      date: '2024-01-15',
      method: 'credit_card',
      status: 'success'
    }
  },
  {
    id: 'sub_2',
    userId: 'user_2',
    planId: 'plan_agronomist_pro',
    status: 'trial',
    startDate: '2024-02-01',
    endDate: '2024-02-28',
    trialEndDate: '2024-02-14',
    autoRenew: false
  },
  {
    id: 'sub_3',
    userId: 'user_3',
    planId: 'plan_trader_enterprise',
    status: 'active',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    autoRenew: true,
    lastPayment: {
      amount: 120,
      date: '2024-01-01',
      method: 'bank_transfer',
      status: 'success'
    }
  }
];

const mockPlans = [
  {
    id: 'plan_farmer_basic',
    name: 'Farmer Basic',
    nameAr: 'مزارع أساسي',
    role: 'farmer',
    type: 'basic',
    price: 25,
    currency: 'TND',
    billingPeriod: 'monthly',
    features: ['Soil Analysis', 'Basic Recommendations', 'Weather Alerts'],
    featuresAr: ['تحليل التربة', 'التوصيات الأساسية', 'تنبيهات الطقس'],
    maxUsers: 1,
    maxFarms: 3,
    isPopular: true
  },
  {
    id: 'plan_agronomist_pro',
    name: 'Agronomist Professional',
    nameAr: 'مهندس زراعي احترافي',
    role: 'agronomist',
    type: 'professional',
    price: 75,
    currency: 'TND',
    billingPeriod: 'monthly',
    features: ['Advanced Analytics', 'Custom Reports', 'Multi-farm Management'],
    featuresAr: ['تحليلات متقدمة', 'تقارير مخصصة', 'إدارة متعددة المزارع'],
    maxUsers: 5,
    maxFarms: 15,
    isPopular: false
  }
];

export const getSaaSMetrics: RequestHandler = (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    // In production, metrics would be filtered by period
    res.json({
      success: true,
      data: mockMetrics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch SaaS metrics'
    });
  }
};

export const getSaaSAnalytics: RequestHandler = (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    res.json({
      success: true,
      data: mockAnalytics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch SaaS analytics'
    });
  }
};

export const getSaaSSubscriptions: RequestHandler = (req, res) => {
  try {
    res.json({
      success: true,
      data: mockSubscriptions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subscriptions'
    });
  }
};

export const getSaaSPlans: RequestHandler = (req, res) => {
  try {
    res.json({
      success: true,
      data: mockPlans
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subscription plans'
    });
  }
};
