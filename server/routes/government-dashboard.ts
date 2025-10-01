import express from 'express';

const router = express.Router();

// ========== DATA MODELS & INTERFACES ==========

interface Region {
  id: string;
  name: string;
  nameArabic: string;
  area: number; // in hectares
  farmCount: number;
  farmerCount: number;
  coordinates: { lat: number; lng: number };
  governorate: string;
  governorateArabic: string;
}

interface ProductionData {
  id: string;
  cropType: string;
  cropTypeArabic: string;
  regionId: string;
  year: number;
  season: string;
  seasonArabic: string;
  productionVolume: number; // in tons
  cultivatedArea: number; // in hectares
  averageYield: number; // tons per hectare
  qualityGrade: 'A' | 'B' | 'C';
  exportVolume: number;
  localConsumption: number;
  pricePerTon: number;
  revenue: number;
  monthlyData: Array<{
    month: number;
    production: number;
    quality: number;
    price: number;
  }>;
}

interface Policy {
  id: string;
  title: string;
  titleArabic: string;
  description: string;
  descriptionArabic: string;
  type: 'subsidy' | 'regulation' | 'incentive' | 'restriction';
  typeArabic: string;
  status: 'draft' | 'active' | 'suspended' | 'expired';
  statusArabic: string;
  startDate: string;
  endDate: string;
  targetCrops: string[];
  targetRegions: string[];
  budgetAllocated: number;
  budgetSpent: number;
  beneficiaries: number;
  effectivenessScore: number;
  impact: {
    productionIncrease: number;
    qualityImprovement: number;
    farmerSatisfaction: number;
    economicBenefit: number;
  };
}

interface ComplianceRecord {
  id: string;
  farmerId: string;
  farmerName: string;
  farmerNameArabic: string;
  regionId: string;
  policyId: string;
  complianceStatus: 'compliant' | 'partial' | 'non-compliant' | 'pending';
  complianceStatusArabic: string;
  lastInspection: string;
  nextInspection: string;
  violations: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    penaltyAmount: number;
    resolved: boolean;
  }>;
  supportProvided: string[];
}

interface MarketTrend {
  id: string;
  cropType: string;
  period: string;
  demandLevel: number;
  supplyLevel: number;
  priceVolatility: number;
  exportDemand: number;
  marketShare: number;
  competitorAnalysis: {
    country: string;
    production: number;
    quality: number;
    price: number;
  }[];
  recommendations: string[];
  recommendationsArabic: string[];
}

interface CrisisAlert {
  id: string;
  type: 'weather' | 'disease' | 'pest' | 'market' | 'supply';
  typeArabic: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  severityArabic: string;
  title: string;
  titleArabic: string;
  description: string;
  descriptionArabic: string;
  affectedRegions: string[];
  affectedCrops: string[];
  estimatedImpact: {
    productionLoss: number;
    economicLoss: number;
    farmersAffected: number;
    areaAffected: number;
  };
  responseActions: string[];
  responseActionsArabic: string[];
  status: 'active' | 'monitoring' | 'resolved';
  statusArabic: string;
  reportedAt: string;
  resolvedAt?: string;
}

interface Budget {
  id: string;
  year: number;
  category: string;
  categoryArabic: string;
  allocated: number;
  spent: number;
  remaining: number;
  utilization: number;
  quarterly: Array<{
    quarter: number;
    planned: number;
    actual: number;
    variance: number;
  }>;
  programs: Array<{
    name: string;
    nameArabic: string;
    budget: number;
    spent: number;
    beneficiaries: number;
    impact: number;
  }>;
}

// ========== MOCK DATA GENERATORS ==========

const generateRegions = (): Region[] => {
  const regions = [
    { name: 'North Region', nameArabic: 'المنطقة الشمالية', governorate: 'Irbid', governorateArabic: 'إربد' },
    { name: 'Central Region', nameArabic: 'المنطقة الوسطى', governorate: 'Amman', governorateArabic: 'عمان' },
    { name: 'South Region', nameArabic: 'المنطقة الجنوبية', governorate: 'Karak', governorateArabic: 'الكرك' },
    { name: 'Jordan Valley', nameArabic: 'وادي الأردن', governorate: 'Jordan Valley', governorateArabic: 'وادي الأردن' },
    { name: 'Eastern Desert', nameArabic: 'البادية الشرقية', governorate: 'Mafraq', governorateArabic: 'المفرق' },
    { name: 'Western Highlands', nameArabic: 'المرتفعات الغربية', governorate: 'Balqa', governorateArabic: 'البلقاء' }
  ];

  return regions.map((region, index) => ({
    id: `region-${index + 1}`,
    name: region.name,
    nameArabic: region.nameArabic,
    area: Math.floor(Math.random() * 50000) + 10000,
    farmCount: Math.floor(Math.random() * 500) + 100,
    farmerCount: Math.floor(Math.random() * 2000) + 500,
    coordinates: {
      lat: 31.0 + Math.random() * 2,
      lng: 35.5 + Math.random() * 2
    },
    governorate: region.governorate,
    governorateArabic: region.governorateArabic
  }));
};

const generateProductionData = (regions: Region[]): ProductionData[] => {
  const crops = [
    { name: 'Wheat', nameArabic: 'القمح' },
    { name: 'Barley', nameArabic: 'الشعير' },
    { name: 'Tomato', nameArabic: 'الطماطم' },
    { name: 'Cucumber', nameArabic: 'الخيار' },
    { name: 'Olive', nameArabic: 'الزيتون' },
    { name: 'Citrus', nameArabic: 'الحمضيات' }
  ];

  const seasons = [
    { name: 'Winter', nameArabic: 'الشتوي' },
    { name: 'Summer', nameArabic: 'الصيفي' },
    { name: 'Spring', nameArabic: 'الربيعي' },
    { name: 'Fall', nameArabic: 'الخريفي' }
  ];

  const production: ProductionData[] = [];
  let id = 1;

  regions.forEach(region => {
    crops.forEach(crop => {
      seasons.forEach(season => {
        const productionVolume = Math.floor(Math.random() * 10000) + 1000;
        const cultivatedArea = Math.floor(Math.random() * 500) + 100;
        const pricePerTon = Math.floor(Math.random() * 500) + 200;
        
        production.push({
          id: `prod-${id++}`,
          cropType: crop.name,
          cropTypeArabic: crop.nameArabic,
          regionId: region.id,
          year: 2024,
          season: season.name,
          seasonArabic: season.nameArabic,
          productionVolume,
          cultivatedArea,
          averageYield: Math.round((productionVolume / cultivatedArea) * 10) / 10,
          qualityGrade: ['A', 'B', 'C'][Math.floor(Math.random() * 3)] as 'A' | 'B' | 'C',
          exportVolume: Math.floor(productionVolume * 0.3),
          localConsumption: Math.floor(productionVolume * 0.7),
          pricePerTon,
          revenue: productionVolume * pricePerTon,
          monthlyData: Array.from({ length: 12 }, (_, month) => ({
            month: month + 1,
            production: Math.floor(productionVolume / 12 + Math.random() * 500),
            quality: Math.floor(Math.random() * 30) + 70,
            price: pricePerTon + Math.floor(Math.random() * 100) - 50
          }))
        });
      });
    });
  });

  return production;
};

const generatePolicies = (): Policy[] => {
  const policies = [
    {
      title: 'Organic Farming Incentive', titleArabic: 'حوافز الزراعة العضوية',
      description: 'Financial incentives for farmers adopting organic practices',
      descriptionArabic: 'حوافز مالية للمزارعين الذين يتبنون ��لممارسات العضوية',
      type: 'incentive' as const, typeArabic: 'حافز'
    },
    {
      title: 'Water Conservation Subsidy', titleArabic: 'دعم الحفاظ على المياه',
      description: 'Subsidies for water-efficient irrigation systems',
      descriptionArabic: 'دعم أنظمة الري الموفرة للمياه',
      type: 'subsidy' as const, typeArabic: 'دعم'
    },
    {
      title: 'Pesticide Usage Regulation', titleArabic: 'تنظيم استخدام المبيدات',
      description: 'Strict regulations on pesticide usage',
      descriptionArabic: 'لوائح صارمة لاستخدام المبيدات',
      type: 'regulation' as const, typeArabic: 'تنظيم'
    },
    {
      title: 'Export Quality Standards', titleArabic: 'معايير جودة التصدير',
      description: 'Mandatory quality standards for export crops',
      descriptionArabic: 'معايير جودة إلزامية للمحاصيل المصدرة',
      type: 'regulation' as const, typeArabic: 'تنظيم'
    },
    {
      title: 'Young Farmer Support', titleArabic: 'دعم المزارعين الشباب',
      description: 'Financial support for young farmers under 35',
      descriptionArabic: 'دعم مالي للمزارعين الشباب تحت سن 35',
      type: 'subsidy' as const, typeArabic: 'دعم'
    }
  ];

  const statuses = [
    { name: 'active', nameArabic: 'نشط' },
    { name: 'draft', nameArabic: 'مسودة' },
    { name: 'suspended', nameArabic: 'معلق' }
  ];

  return policies.map((policy, index) => {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const budgetAllocated = Math.floor(Math.random() * 1000000) + 500000;
    const budgetSpent = Math.floor(budgetAllocated * (0.3 + Math.random() * 0.6));
    
    return {
      id: `policy-${index + 1}`,
      title: policy.title,
      titleArabic: policy.titleArabic,
      description: policy.description,
      descriptionArabic: policy.descriptionArabic,
      type: policy.type,
      typeArabic: policy.typeArabic,
      status: status.name as any,
      statusArabic: status.nameArabic,
      startDate: new Date(2024, Math.floor(Math.random() * 12), 1).toISOString(),
      endDate: new Date(2025, Math.floor(Math.random() * 12), 1).toISOString(),
      targetCrops: ['Wheat', 'Tomato', 'Olive'].slice(0, Math.floor(Math.random() * 3) + 1),
      targetRegions: ['region-1', 'region-2', 'region-3'].slice(0, Math.floor(Math.random() * 3) + 1),
      budgetAllocated,
      budgetSpent,
      beneficiaries: Math.floor(Math.random() * 5000) + 1000,
      effectivenessScore: Math.floor(Math.random() * 30) + 70,
      impact: {
        productionIncrease: Math.floor(Math.random() * 20) + 5,
        qualityImprovement: Math.floor(Math.random() * 15) + 5,
        farmerSatisfaction: Math.floor(Math.random() * 25) + 75,
        economicBenefit: Math.floor(Math.random() * 30) + 10
      }
    };
  });
};

const generateComplianceRecords = (policies: Policy[]): ComplianceRecord[] => {
  const statuses = [
    { name: 'compliant', nameArabic: 'ملتزم' },
    { name: 'partial', nameArabic: 'جزئي' },
    { name: 'non-compliant', nameArabic: 'غير ملتزم' },
    { name: 'pending', nameArabic: 'قيد المراجعة' }
  ];

  const farmers = [
    { name: 'Ahmed Al-Mahmoud', nameArabic: 'أحمد المحمود' },
    { name: 'Fatima Al-Zahra', nameArabic: 'فاطمة الزهراء' },
    { name: 'Omar Al-Rashid', nameArabic: 'عمر الراشد' },
    { name: 'Layla Al-Khatib', nameArabic: 'ليلى الخطيب' },
    { name: 'Hassan Al-Najjar', nameArabic: 'حسن النجار' }
  ];

  return Array.from({ length: 50 }, (_, index) => {
    const farmer = farmers[Math.floor(Math.random() * farmers.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const policy = policies[Math.floor(Math.random() * policies.length)];
    
    return {
      id: `compliance-${index + 1}`,
      farmerId: `farmer-${index + 1}`,
      farmerName: farmer.name,
      farmerNameArabic: farmer.nameArabic,
      regionId: `region-${Math.floor(Math.random() * 6) + 1}`,
      policyId: policy.id,
      complianceStatus: status.name as any,
      complianceStatusArabic: status.nameArabic,
      lastInspection: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
      nextInspection: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
      violations: status.name !== 'compliant' ? [{
        type: 'Documentation Missing',
        severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as any,
        description: 'Missing required documentation for compliance verification',
        penaltyAmount: Math.floor(Math.random() * 5000),
        resolved: Math.random() > 0.5
      }] : [],
      supportProvided: ['Training', 'Financial Aid', 'Technical Support'].slice(0, Math.floor(Math.random() * 3))
    };
  });
};

const generateCrisisAlerts = (): CrisisAlert[] => {
  const alerts = [
    {
      type: 'weather', typeArabic: 'طقس',
      title: 'Drought Warning - North Region', titleArabic: 'تحذير من الجفاف - المنطقة الشمالية',
      description: 'Extended dry period affecting crop yields',
      descriptionArabic: 'فترة جفاف ممتدة تؤثر على إنتاجية المحاصيل'
    },
    {
      type: 'disease', typeArabic: 'مرض',
      title: 'Wheat Rust Outbreak', titleArabic: 'تفشي صدأ القمح',
      description: 'Fungal disease affecting wheat crops',
      descriptionArabic: 'مرض فطري يؤثر على محاصيل القمح'
    },
    {
      type: 'market', typeArabic: 'سوق',
      title: 'Tomato Price Volatility', titleArabic: 'تقلبات أسعار الطماطم',
      description: 'Significant price fluctuations in tomato market',
      descriptionArabic: 'تقلبات كبيرة في أسعار الطماطم'
    }
  ];

  const severities = [
    { name: 'medium', nameArabic: 'متوسط' },
    { name: 'high', nameArabic: 'عالي' },
    { name: 'critical', nameArabic: 'حرج' }
  ];

  const statuses = [
    { name: 'active', nameArabic: 'نشط' },
    { name: 'monitoring', nameArabic: 'تحت المراقبة' },
    { name: 'resolved', nameArabic: 'محلول' }
  ];

  return alerts.map((alert, index) => {
    const severity = severities[Math.floor(Math.random() * severities.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    return {
      id: `crisis-${index + 1}`,
      type: alert.type as any,
      typeArabic: alert.typeArabic,
      severity: severity.name as any,
      severityArabic: severity.nameArabic,
      title: alert.title,
      titleArabic: alert.titleArabic,
      description: alert.description,
      descriptionArabic: alert.descriptionArabic,
      affectedRegions: [`region-${Math.floor(Math.random() * 6) + 1}`],
      affectedCrops: ['Wheat', 'Tomato', 'Olive'].slice(0, Math.floor(Math.random() * 3) + 1),
      estimatedImpact: {
        productionLoss: Math.floor(Math.random() * 30) + 5,
        economicLoss: Math.floor(Math.random() * 1000000) + 100000,
        farmersAffected: Math.floor(Math.random() * 500) + 50,
        areaAffected: Math.floor(Math.random() * 10000) + 1000
      },
      responseActions: ['Emergency Support', 'Technical Assistance', 'Financial Aid'],
      responseActionsArabic: ['دعم طارئ', 'مساعدة تقنية', 'مساعدة مالية'],
      status: status.name as any,
      statusArabic: status.nameArabic,
      reportedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      resolvedAt: status.name === 'resolved' ? new Date().toISOString() : undefined
    };
  });
};

// Initialize mock data
const regions = generateRegions();
const productionData = generateProductionData(regions);
const policies = generatePolicies();
const complianceRecords = generateComplianceRecords(policies);
const crisisAlerts = generateCrisisAlerts();

// ========== API ENDPOINTS ==========

// Dashboard Overview
router.get('/overview', (req, res) => {
  const currentYear = 2024;
  
  // Calculate key metrics
  const totalProduction = productionData.reduce((sum, prod) => sum + prod.productionVolume, 0);
  const totalRevenue = productionData.reduce((sum, prod) => sum + prod.revenue, 0);
  const activePolicies = policies.filter(p => p.status === 'active').length;
  const totalBeneficiaries = policies.reduce((sum, p) => sum + p.beneficiaries, 0);
  const crisisCount = crisisAlerts.filter(c => c.status === 'active').length;
  const complianceRate = (complianceRecords.filter(c => c.complianceStatus === 'compliant').length / complianceRecords.length) * 100;

  // Production by region
  const productionByRegion = regions.map(region => {
    const regionProduction = productionData
      .filter(p => p.regionId === region.id)
      .reduce((sum, p) => sum + p.productionVolume, 0);
    
    return {
      regionId: region.id,
      regionName: region.name,
      regionNameArabic: region.nameArabic,
      production: regionProduction,
      farmCount: region.farmCount
    };
  });

  // Top performing crops
  const cropPerformance = Object.entries(
    productionData.reduce((acc, prod) => {
      if (!acc[prod.cropType]) {
        acc[prod.cropType] = { 
          production: 0, 
          revenue: 0, 
          nameArabic: prod.cropTypeArabic 
        };
      }
      acc[prod.cropType].production += prod.productionVolume;
      acc[prod.cropType].revenue += prod.revenue;
      return acc;
    }, {} as any)
  ).map(([cropType, data]: [string, any]) => ({
    cropType,
    cropTypeArabic: data.nameArabic,
    production: data.production,
    revenue: data.revenue,
    efficiency: Math.round((data.revenue / data.production) * 100) / 100
  })).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  // Monthly trends
  const monthlyTrends = Array.from({ length: 12 }, (_, month) => {
    const monthData = productionData.flatMap(p => 
      p.monthlyData.filter(m => m.month === month + 1)
    );
    
    return {
      month: month + 1,
      production: monthData.reduce((sum, m) => sum + m.production, 0),
      averagePrice: monthData.length > 0 
        ? Math.round(monthData.reduce((sum, m) => sum + m.price, 0) / monthData.length)
        : 0,
      qualityScore: monthData.length > 0
        ? Math.round(monthData.reduce((sum, m) => sum + m.quality, 0) / monthData.length)
        : 0
    };
  });

  res.json({
    success: true,
    data: {
      keyMetrics: {
        totalProduction: Math.round(totalProduction),
        totalRevenue: Math.round(totalRevenue),
        activePolicies,
        totalBeneficiaries,
        activeAlerts: crisisCount,
        complianceRate: Math.round(complianceRate),
        totalRegions: regions.length,
        totalFarms: regions.reduce((sum, r) => sum + r.farmCount, 0)
      },
      productionByRegion,
      cropPerformance,
      monthlyTrends,
      recentAlerts: crisisAlerts.filter(c => c.status === 'active').slice(0, 5)
    }
  });
});

// Production Analytics
router.get('/production', (req, res) => {
  const { region, crop, year = 2024 } = req.query;
  
  let filteredData = productionData.filter(p => p.year === parseInt(year as string));
  
  if (region) {
    filteredData = filteredData.filter(p => p.regionId === region);
  }
  
  if (crop) {
    filteredData = filteredData.filter(p => p.cropType === crop);
  }

  // Production trends by crop
  const productionByCrop = Object.entries(
    filteredData.reduce((acc, prod) => {
      if (!acc[prod.cropType]) {
        acc[prod.cropType] = { 
          volume: 0, 
          area: 0, 
          revenue: 0,
          nameArabic: prod.cropTypeArabic 
        };
      }
      acc[prod.cropType].volume += prod.productionVolume;
      acc[prod.cropType].area += prod.cultivatedArea;
      acc[prod.cropType].revenue += prod.revenue;
      return acc;
    }, {} as any)
  ).map(([cropType, data]: [string, any]) => ({
    cropType,
    cropTypeArabic: data.nameArabic,
    volume: data.volume,
    area: data.area,
    revenue: data.revenue,
    yield: Math.round((data.volume / data.area) * 10) / 10
  }));

  // Quality distribution
  const qualityDistribution = {
    A: filteredData.filter(p => p.qualityGrade === 'A').length,
    B: filteredData.filter(p => p.qualityGrade === 'B').length,
    C: filteredData.filter(p => p.qualityGrade === 'C').length
  };

  // Export vs Local consumption
  const tradeData = {
    totalExport: filteredData.reduce((sum, p) => sum + p.exportVolume, 0),
    totalLocal: filteredData.reduce((sum, p) => sum + p.localConsumption, 0),
    exportValue: filteredData.reduce((sum, p) => sum + (p.exportVolume * p.pricePerTon), 0)
  };

  res.json({
    success: true,
    data: {
      productionByCrop,
      qualityDistribution,
      tradeData,
      totalRecords: filteredData.length,
      summary: {
        totalVolume: filteredData.reduce((sum, p) => sum + p.productionVolume, 0),
        totalArea: filteredData.reduce((sum, p) => sum + p.cultivatedArea, 0),
        totalRevenue: filteredData.reduce((sum, p) => sum + p.revenue, 0),
        averageYield: filteredData.length > 0 
          ? Math.round((filteredData.reduce((sum, p) => sum + p.averageYield, 0) / filteredData.length) * 10) / 10 
          : 0
      }
    }
  });
});

// Policy Management
router.get('/policies', (req, res) => {
  const { status, type } = req.query;
  
  let filteredPolicies = policies;
  
  if (status) {
    filteredPolicies = filteredPolicies.filter(p => p.status === status);
  }
  
  if (type) {
    filteredPolicies = filteredPolicies.filter(p => p.type === type);
  }

  res.json({
    success: true,
    data: {
      policies: filteredPolicies,
      summary: {
        total: policies.length,
        active: policies.filter(p => p.status === 'active').length,
        draft: policies.filter(p => p.status === 'draft').length,
        suspended: policies.filter(p => p.status === 'suspended').length,
        totalBudget: policies.reduce((sum, p) => sum + p.budgetAllocated, 0),
        totalSpent: policies.reduce((sum, p) => sum + p.budgetSpent, 0),
        totalBeneficiaries: policies.reduce((sum, p) => sum + p.beneficiaries, 0)
      }
    }
  });
});

// Compliance Monitoring
router.get('/compliance', (req, res) => {
  const { status, region, policy } = req.query;
  
  let filteredRecords = complianceRecords;
  
  if (status) {
    filteredRecords = filteredRecords.filter(r => r.complianceStatus === status);
  }
  
  if (region) {
    filteredRecords = filteredRecords.filter(r => r.regionId === region);
  }
  
  if (policy) {
    filteredRecords = filteredRecords.filter(r => r.policyId === policy);
  }

  // Compliance statistics
  const complianceStats = {
    compliant: filteredRecords.filter(r => r.complianceStatus === 'compliant').length,
    partial: filteredRecords.filter(r => r.complianceStatus === 'partial').length,
    nonCompliant: filteredRecords.filter(r => r.complianceStatus === 'non-compliant').length,
    pending: filteredRecords.filter(r => r.complianceStatus === 'pending').length
  };

  // Violations by type
  const violationTypes = filteredRecords
    .flatMap(r => r.violations)
    .reduce((acc, violation) => {
      acc[violation.type] = (acc[violation.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  res.json({
    success: true,
    data: {
      records: filteredRecords,
      statistics: complianceStats,
      violationTypes,
      totalRecords: complianceRecords.length,
      complianceRate: Math.round((complianceStats.compliant / filteredRecords.length) * 100)
    }
  });
});

// Crisis Management
router.get('/crisis-alerts', (req, res) => {
  const { status, type, severity } = req.query;
  
  let filteredAlerts = crisisAlerts;
  
  if (status) {
    filteredAlerts = filteredAlerts.filter(a => a.status === status);
  }
  
  if (type) {
    filteredAlerts = filteredAlerts.filter(a => a.type === type);
  }
  
  if (severity) {
    filteredAlerts = filteredAlerts.filter(a => a.severity === severity);
  }

  // Impact summary
  const impactSummary = filteredAlerts.reduce((acc, alert) => {
    acc.totalEconomicLoss += alert.estimatedImpact.economicLoss;
    acc.totalFarmersAffected += alert.estimatedImpact.farmersAffected;
    acc.totalAreaAffected += alert.estimatedImpact.areaAffected;
    acc.totalProductionLoss += alert.estimatedImpact.productionLoss;
    return acc;
  }, {
    totalEconomicLoss: 0,
    totalFarmersAffected: 0,
    totalAreaAffected: 0,
    totalProductionLoss: 0
  });

  res.json({
    success: true,
    data: {
      alerts: filteredAlerts,
      impactSummary,
      alertsByType: {
        weather: crisisAlerts.filter(a => a.type === 'weather').length,
        disease: crisisAlerts.filter(a => a.type === 'disease').length,
        pest: crisisAlerts.filter(a => a.type === 'pest').length,
        market: crisisAlerts.filter(a => a.type === 'market').length,
        supply: crisisAlerts.filter(a => a.type === 'supply').length
      },
      alertsBySeverity: {
        low: crisisAlerts.filter(a => a.severity === 'low').length,
        medium: crisisAlerts.filter(a => a.severity === 'medium').length,
        high: crisisAlerts.filter(a => a.severity === 'high').length,
        critical: crisisAlerts.filter(a => a.severity === 'critical').length
      }
    }
  });
});

// Regions Data
router.get('/regions', (req, res) => {
  res.json({
    success: true,
    data: { regions }
  });
});

// Budget Analysis
router.get('/budget', (req, res) => {
  const { year = 2024 } = req.query;
  
  // Generate budget data based on policies
  const budgetData: Budget[] = [
    {
      id: 'budget-1',
      year: parseInt(year as string),
      category: 'Agricultural Development',
      categoryArabic: 'التنمية الزراعية',
      allocated: 5000000,
      spent: 3500000,
      remaining: 1500000,
      utilization: 70,
      quarterly: [
        { quarter: 1, planned: 1250000, actual: 1100000, variance: -150000 },
        { quarter: 2, planned: 1250000, actual: 1300000, variance: 50000 },
        { quarter: 3, planned: 1250000, actual: 900000, variance: -350000 },
        { quarter: 4, planned: 1250000, actual: 200000, variance: -1050000 }
      ],
      programs: [
        { name: 'Irrigation Support', nameArabic: 'دعم الري', budget: 2000000, spent: 1400000, beneficiaries: 500, impact: 85 },
        { name: 'Organic Farming', nameArabic: 'الزراعة العضوية', budget: 1500000, spent: 1050000, beneficiaries: 300, impact: 78 },
        { name: 'Technology Adoption', nameArabic: 'تبني التكنولوجيا', budget: 1500000, spent: 1050000, beneficiaries: 200, impact: 92 }
      ]
    },
    {
      id: 'budget-2',
      year: parseInt(year as string),
      category: 'Research & Development',
      categoryArabic: 'البحث والتطوير',
      allocated: 2000000,
      spent: 1600000,
      remaining: 400000,
      utilization: 80,
      quarterly: [
        { quarter: 1, planned: 500000, actual: 450000, variance: -50000 },
        { quarter: 2, planned: 500000, actual: 520000, variance: 20000 },
        { quarter: 3, planned: 500000, actual: 430000, variance: -70000 },
        { quarter: 4, planned: 500000, actual: 200000, variance: -300000 }
      ],
      programs: [
        { name: 'Crop Research', nameArabic: 'بحوث المحاصيل', budget: 800000, spent: 640000, beneficiaries: 0, impact: 75 },
        { name: 'Technology Development', nameArabic: 'تطوير التكنولوجيا', budget: 700000, spent: 560000, beneficiaries: 0, impact: 82 },
        { name: 'Training Programs', nameArabic: 'برامج التدريب', budget: 500000, spent: 400000, beneficiaries: 150, impact: 88 }
      ]
    }
  ];

  const totalAllocated = budgetData.reduce((sum, b) => sum + b.allocated, 0);
  const totalSpent = budgetData.reduce((sum, b) => sum + b.spent, 0);
  const totalBeneficiaries = budgetData.reduce((sum, b) => 
    sum + b.programs.reduce((pSum, p) => pSum + p.beneficiaries, 0), 0);

  res.json({
    success: true,
    data: {
      budgets: budgetData,
      summary: {
        totalAllocated,
        totalSpent,
        totalRemaining: totalAllocated - totalSpent,
        overallUtilization: Math.round((totalSpent / totalAllocated) * 100),
        totalBeneficiaries,
        averageImpact: Math.round(
          budgetData.reduce((sum, b) => 
            sum + b.programs.reduce((pSum, p) => pSum + p.impact, 0) / b.programs.length, 0
          ) / budgetData.length
        )
      }
    }
  });
});

export default router;
