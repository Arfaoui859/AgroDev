import { RequestHandler } from "express";

const mockSubscriptionPlans = [
  {
    id: 'plan_farmer_free',
    name: 'Farmer Free',
    nameAr: 'مزارع مجاني',
    description: 'Basic features for small farmers',
    descriptionAr: 'ميزات أساسية للمزارعين الصغار',
    role: 'farmer',
    type: 'free',
    price: 0,
    currency: 'TND',
    billingPeriod: 'monthly',
    features: ['Basic soil analysis', 'Weather alerts', 'Simple recommendations'],
    featuresAr: ['تحليل التربة الأساسي', 'تنبيهات الطقس', 'توصيات بسيطة'],
    limitations: { analyses: 5, reports: 2 },
    maxUsers: 1,
    maxFarms: 1,
    maxStorage: 1,
    apiCalls: 100,
    supportLevel: 'basic',
    isPopular: false,
    isActive: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-15'
  },
  {
    id: 'plan_farmer_basic',
    name: 'Farmer Basic',
    nameAr: 'مزارع أساسي',
    description: 'Enhanced features for growing farms',
    descriptionAr: 'ميزات محسنة للمزارع النامية',
    role: 'farmer',
    type: 'basic',
    price: 25,
    originalPrice: 35,
    currency: 'TND',
    billingPeriod: 'monthly',
    features: ['Advanced soil analysis', 'Disease detection', 'Market insights', 'Crop planning'],
    featuresAr: ['تحليل متقدم للتربة', 'كشف الأمراض', 'رؤى السوق', 'تخطيط المحاصيل'],
    limitations: { analyses: 50, reports: 10 },
    maxUsers: 2,
    maxFarms: 3,
    maxStorage: 5,
    apiCalls: 1000,
    supportLevel: 'basic',
    isPopular: true,
    isActive: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-02-01'
  },
  {
    id: 'plan_agronomist_pro',
    name: 'Agronomist Professional',
    nameAr: 'مهندس زراعي احترافي',
    description: 'Professional tools for agricultural experts',
    descriptionAr: 'أدوات احترافية للخبراء الزراعيين',
    role: 'agronomist',
    type: 'professional',
    price: 75,
    currency: 'TND',
    billingPeriod: 'monthly',
    features: ['All farmer features', 'Multi-farm management', 'Custom reports', 'API access'],
    featuresAr: ['جميع ميزات المزارع', 'إدارة متعددة المزارع', 'تقارير مخصصة', 'وصول API'],
    limitations: { analyses: 200, reports: 50 },
    maxUsers: 10,
    maxFarms: 25,
    maxStorage: 50,
    apiCalls: 10000,
    supportLevel: 'priority',
    isPopular: false,
    isActive: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-20'
  },
  {
    id: 'plan_trader_enterprise',
    name: 'Trader Enterprise',
    nameAr: 'تاجر مؤسسي',
    description: 'Enterprise solution for agricultural traders',
    descriptionAr: 'حل مؤسسي لتجار المنتجات الزراعية',
    role: 'trader',
    type: 'enterprise',
    price: 150,
    currency: 'TND',
    billingPeriod: 'monthly',
    features: ['Market analytics', 'Price forecasting', 'Supply chain tracking', 'White-label options'],
    featuresAr: ['تحليلات السوق', 'توقع الأسعار', 'تتبع سلسلة التوريد', 'خيارات العلامة البيضاء'],
    limitations: { analyses: -1, reports: -1 },
    maxUsers: 50,
    maxFarms: 100,
    maxStorage: 500,
    apiCalls: 100000,
    supportLevel: 'dedicated',
    isPopular: false,
    isActive: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-10'
  }
];

const mockPaymentMethods = [
  {
    id: 'payment_d17',
    name: 'D17',
    nameAr: 'د17',
    type: 'mobile_payment',
    icon: 'smartphone',
    fees: { percentage: 2.5, fixed: 0.5 },
    isActive: true,
    countries: ['تونس']
  },
  {
    id: 'payment_paymee',
    name: 'Paymee',
    nameAr: 'بايمي',
    type: 'mobile_payment',
    icon: 'smartphone',
    fees: { percentage: 2.0, fixed: 0.3 },
    isActive: true,
    countries: ['تونس']
  },
  {
    id: 'payment_stripe',
    name: 'Stripe',
    nameAr: 'سترايب',
    type: 'credit_card',
    icon: 'credit-card',
    fees: { percentage: 2.9, fixed: 0.8 },
    isActive: true,
    countries: ['تونس', 'المغرب', 'الجزائر', 'العالم']
  },
  {
    id: 'payment_bank',
    name: 'Bank Transfer',
    nameAr: 'تحويل بنكي',
    type: 'bank_transfer',
    icon: 'building',
    fees: { percentage: 0, fixed: 2.0 },
    isActive: true,
    countries: ['تونس', 'المغرب', 'الجزائر']
  }
];

const mockPromoCodes = [
  {
    id: 'promo_new_year',
    code: 'NEWYEAR2024',
    nameAr: 'خصم رأس السنة',
    description: 'خصم 30% للمستخدمين الجدد',
    discountType: 'percentage',
    discountValue: 30,
    minAmount: 20,
    maxDiscount: 50,
    validFrom: '2024-01-01',
    validTo: '2024-01-31',
    usageLimit: 1000,
    usedCount: 347,
    isActive: true,
    applicablePlans: ['plan_farmer_basic', 'plan_agronomist_pro'],
    applicableRoles: ['farmer', 'agronomist']
  },
  {
    id: 'promo_farmer_special',
    code: 'FARMER50',
    nameAr: 'خصم خاص للمزارعين',
    description: 'خصم 15 دينار للمزارعين الجدد',
    discountType: 'fixed',
    discountValue: 15,
    minAmount: 25,
    validFrom: '2024-02-01',
    validTo: '2024-03-31',
    usageLimit: 500,
    usedCount: 89,
    isActive: true,
    applicablePlans: ['plan_farmer_basic'],
    applicableRoles: ['farmer']
  },
  {
    id: 'promo_referral',
    code: 'REFER20',
    nameAr: 'خصم الإحالة',
    description: 'خصم 20% عند إحالة صديق',
    discountType: 'percentage',
    discountValue: 20,
    validFrom: '2024-01-01',
    validTo: '2024-12-31',
    usageLimit: 10000,
    usedCount: 1205,
    isActive: true,
    applicablePlans: ['plan_farmer_basic', 'plan_agronomist_pro', 'plan_trader_enterprise'],
    applicableRoles: ['farmer', 'agronomist', 'trader', 'consultant']
  }
];

export const getSubscriptionPlans: RequestHandler = (req, res) => {
  try {
    res.json({
      success: true,
      data: mockSubscriptionPlans
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subscription plans'
    });
  }
};

export const getPaymentMethods: RequestHandler = (req, res) => {
  try {
    res.json({
      success: true,
      data: mockPaymentMethods
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment methods'
    });
  }
};

export const getPromoCodes: RequestHandler = (req, res) => {
  try {
    res.json({
      success: true,
      data: mockPromoCodes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch promo codes'
    });
  }
};

export const createSubscriptionPlan: RequestHandler = (req, res) => {
  try {
    const planData = req.body;
    
    // In production, save to database
    const newPlan = {
      id: `plan_${Date.now()}`,
      ...planData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: newPlan,
      message: 'Subscription plan created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create subscription plan'
    });
  }
};

export const updateSubscriptionPlan: RequestHandler = (req, res) => {
  try {
    const { planId } = req.params;
    const updateData = req.body;
    
    // In production, update in database
    res.json({
      success: true,
      data: { id: planId, ...updateData, updatedAt: new Date().toISOString() },
      message: 'Subscription plan updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update subscription plan'
    });
  }
};

export const deleteSubscriptionPlan: RequestHandler = (req, res) => {
  try {
    const { planId } = req.params;
    
    // In production, delete from database or mark as inactive
    res.json({
      success: true,
      message: 'Subscription plan deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete subscription plan'
    });
  }
};
