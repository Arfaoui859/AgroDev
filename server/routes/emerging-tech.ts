import express from 'express';
import { z } from 'zod';

const router = express.Router();

// Mock data for demonstration
const technologies = [
  {
    id: '1',
    name: 'أنظمة الري الذكية بالذكاء الاصطناعي',
    description: 'تقنية متقدمة تستخدم الذكاء الاصطناعي وأجهزة الاستشعار لتحسين كفاءة الري وتوفير المياه',
    category: 'AI/ML',
    maturityLevel: 'developing',
    readinessLevel: 6,
    potentialImpact: 'high',
    marketSize: 250000000,
    adoptionRate: 35,
    riskLevel: 'medium',
    competitiveAdvantage: 75,
    timeToMarket: '12-18 شهر',
    requiredInvestment: 2500000,
    expectedROI: 45,
    keyBenefits: ['توفير 30% من المياه', 'زيادة الإنتاجية 25%', 'تقليل التكاليف التشغيلية'],
    challenges: ['التكلفة الأولية العال��ة', 'الحاجة لتدريب المزارعين', 'تحديات الصيانة'],
    competitors: ['John Deere', 'Netafim', 'Rain Bird'],
    patents: 15,
    publications: 42,
    fundingReceived: 1800000,
    evaluationScore: 8.5,
    lastUpdated: '2024-02-15',
    evaluator: 'د. أحمد محمد',
    sources: ['IEEE Research', 'AgTech Reports', 'Market Analysis 2024']
  },
  {
    id: '2',
    name: 'طائرات بدون طيار للمراقبة الزراعية',
    description: 'تقنية استخدام الطائرات المسيرة مع كاميرات متطورة وأجهزة استشعار لمراقبة صحة المحاصيل',
    category: 'Robotics',
    maturityLevel: 'mature',
    readinessLevel: 8,
    potentialImpact: 'high',
    marketSize: 180000000,
    adoptionRate: 65,
    riskLevel: 'low',
    competitiveAdvantage: 65,
    timeToMarket: '6-9 أشهر',
    requiredInvestment: 1200000,
    expectedROI: 38,
    keyBenefits: ['كشف مبكر للآفات', 'تحليل دقيق للمحاصيل', 'تقليل الوقت والجهد'],
    challenges: ['القيود التنظيمية', 'عمر البطارية المحدود', 'الحاجة لمهارات تشغيل'],
    competitors: ['DJI Agriculture', 'PrecisionHawk', 'Yamaha Motor'],
    patents: 8,
    publications: 28,
    fundingReceived: 950000,
    evaluationScore: 7.8,
    lastUpdated: '2024-02-10',
    evaluator: 'م. سارة أحمد',
    sources: ['Drone Industry Report', 'Agricultural Technology Journal']
  },
  {
    id: '3',
    name: 'الاستشعار الحيوي للنباتات',
    description: 'تقنية حديثة تستخدم أجهزة استشعار حيوية لمراقبة الإجهاد النباتي والاحتياجات الغذائية',
    category: 'Biotechnology',
    maturityLevel: 'emerging',
    readinessLevel: 4,
    potentialImpact: 'transformative',
    marketSize: 320000000,
    adoptionRate: 15,
    riskLevel: 'high',
    competitiveAdvantage: 85,
    timeToMarket: '24-36 شهر',
    requiredInvestment: 4500000,
    expectedROI: 55,
    keyBenefits: ['كشف مبكر للإجهاد النباتي', 'تحسين استخدام الأسمدة', 'زيادة الإنتاجية بشكل كبير'],
    challenges: ['تعقيد التقنية', 'تكلفة البحث والتطوير', 'الحاجة لتجارب ميدانية واسعة'],
    competitors: ['Bayer CropScience', 'Syngenta', 'BASF'],
    patents: 25,
    publications: 67,
    fundingReceived: 3200000,
    evaluationScore: 9.2,
    lastUpdated: '2024-02-18',
    evaluator: 'د. محمد حس��',
    sources: ['Nature Biotechnology', 'Plant Science Research', 'AgBio World']
  },
  {
    id: '4',
    name: 'الزراعة العمودية الآلية',
    description: 'أنظمة زراعية عمودية مؤتمتة بالكامل تستخدم الذكاء الاصطناعي للتحكم في البيئة',
    category: 'AI/ML',
    maturityLevel: 'developing',
    readinessLevel: 5,
    potentialImpact: 'high',
    marketSize: 420000000,
    adoptionRate: 25,
    riskLevel: 'medium',
    competitiveAdvantage: 70,
    timeToMarket: '18-24 شهر',
    requiredInvestment: 3800000,
    expectedROI: 42,
    keyBenefits: ['توفير 95% من المساحة', 'إنتاج على مدار السنة', 'لا حاجة للمبيدات'],
    challenges: ['استهلاك الطاقة العالي', 'التكلفة الأولية المرتفعة', 'تحديات الصيانة التقنية'],
    competitors: ['AeroFarms', 'Plenty', 'Vertical Harvest'],
    patents: 18,
    publications: 35,
    fundingReceived: 2900000,
    evaluationScore: 8.1,
    lastUpdated: '2024-02-12',
    evaluator: 'د. فاطمة علي',
    sources: ['Vertical Farming Research', 'Indoor Agriculture Report']
  },
  {
    id: '5',
    name: 'تقنية البلوك تشين للتتبع الزراعي',
    description: 'استخدام تقنية البلوك تشين لتتبع المنتجات الزراعية من المزرعة إلى المائدة',
    category: 'Blockchain',
    maturityLevel: 'developing',
    readinessLevel: 6,
    potentialImpact: 'medium',
    marketSize: 150000000,
    adoptionRate: 20,
    riskLevel: 'medium',
    competitiveAdvantage: 60,
    timeToMarket: '12-15 شهر',
    requiredInvestment: 1800000,
    expectedROI: 32,
    keyBenefits: ['شفافية كاملة في التتبع', 'تحسين الثقة', 'تقليل الغش والتلاعب'],
    challenges: ['التعقيد التقني', 'الحاجة لتعاون الصناعة', 'استهلاك الطاقة'],
    competitors: ['IBM Food Trust', 'Walmart', 'Carrefour'],
    patents: 12,
    publications: 22,
    fundingReceived: 1400000,
    evaluationScore: 7.2,
    lastUpdated: '2024-02-08',
    evaluator: 'م. عبدالله سالم',
    sources: ['Blockchain Technology Reports', 'Supply Chain Management Journal']
  }
];

const investments = [
  {
    id: '1',
    technologyId: '1',
    technologyName: 'أنظمة الري الذكية بالذكاء الاصطناعي',
    amount: 2500000,
    type: 'R&D',
    stage: 'executing',
    startDate: '2024-01-15',
    expectedCompletion: '2024-12-30',
    actualROI: undefined,
    milestones: [
      { name: 'تطوير النموذج الأولي', completed: true, date: '2024-03-01' },
      { name: 'الاختبار الميداني', completed: false, date: '2024-06-01' },
      { name: 'التطوير التجاري', completed: false, date: '2024-09-01' }
    ],
    risks: [
      { level: 'medium', description: 'تأخير في التوريد', mitigation: 'موردين بديلين' },
      { level: 'low', description: 'تغيير المتطلبات', mitigation: 'مراجعة دورية' }
    ],
    team: ['د. أحمد محمد', 'م. سارة أحمد', 'م. محمد حسن'],
    budget: {
      allocated: 2500000,
      spent: 1200000,
      remaining: 1300000
    },
    kpis: [
      { metric: 'توفير المياه', target: 30, current: 25, unit: '%' },
      { metric: 'زيادة الإنتاجية', target: 25, current: 18, unit: '%' }
    ]
  },
  {
    id: '2',
    technologyId: '2',
    technologyName: 'طائرات بدون طيار للمراقبة الزراعية',
    amount: 1200000,
    type: 'acquisition',
    stage: 'completed',
    startDate: '2023-06-01',
    expectedCompletion: '2024-01-31',
    actualROI: 35,
    milestones: [
      { name: 'شراء المعدات', completed: true, date: '2023-07-15' },
      { name: 'التدريب والتأهيل', completed: true, date: '2023-09-30' },
      { name: 'التشغيل التجاري', completed: true, date: '2024-01-31' }
    ],
    risks: [
      { level: 'low', description: 'مشاكل تقنية', mitigation: 'عقود صيانة' }
    ],
    team: ['م. سارة أحمد', 'م. خالد يوسف'],
    budget: {
      allocated: 1200000,
      spent: 1200000,
      remaining: 0
    },
    kpis: [
      { metric: 'دقة الكشف', target: 90, current: 92, unit: '%' },
      { metric: 'تقليل التكاليف', target: 20, current: 22, unit: '%' }
    ]
  },
  {
    id: '3',
    technologyId: '3',
    technologyName: 'الاستشعار الحيوي للنباتات',
    amount: 4500000,
    type: 'R&D',
    stage: 'planning',
    startDate: '2024-03-01',
    expectedCompletion: '2026-02-28',
    actualROI: undefined,
    milestones: [
      { name: 'دراسة الجدوى التقنية', completed: false, date: '2024-05-01' },
      { name: 'تطوير النموذج الأولي', completed: false, date: '2024-12-01' },
      { name: 'التجارب الميدانية', completed: false, date: '2025-06-01' }
    ],
    risks: [
      { level: 'high', description: 'عدم نجاح التقنية', mitigation: 'مراجعة متدرجة' },
      { level: 'medium', description: 'تجاوز الميزانية', mitigation: 'مراقبة صارمة' }
    ],
    team: ['د. محمد حسن', 'د. فاطمة علي', 'م. عبدالله سالم'],
    budget: {
      allocated: 4500000,
      spent: 450000,
      remaining: 4050000
    },
    kpis: [
      { metric: 'دقة الاستشعار', target: 95, current: 0, unit: '%' },
      { metric: 'وقت الاستجابة', target: 5, current: 0, unit: 'دقيقة' }
    ]
  }
];

const marketTrends = [
  {
    id: '1',
    name: 'نمو سوق الزراعة الذكية',
    description: 'نمو متسارع في تطبيق تقنيات الذكاء الاصطناعي وإنترنت الأشياء في الزراعة',
    category: 'التقنيات الذكية',
    impact: 'high',
    urgency: 'high',
    confidence: 85,
    timeframe: '2024-2027',
    relatedTechnologies: ['AI/ML', 'IoT', 'Robotics'],
    opportunities: [
      'زيادة الطلب على الحلول الذكية',
      'دعم حكومي للتحول الرقمي',
      'تزايد الوعي البيئي'
    ],
    threats: [
      'منافسة شديدة من الشركات الكبيرة',
      'تحديات في التبني من المزارعين التقليديين'
    ]
  },
  {
    id: '2',
    name: 'اتجاه نحو الزراعة المستدامة',
    description: 'تزايد الاهتمام بالممارسات الزراعية المستدامة والصديقة للبيئة',
    category: 'الاستدامة',
    impact: 'high',
    urgency: 'medium',
    confidence: 90,
    timeframe: '2024-2030',
    relatedTechnologies: ['Biotechnology', 'Precision Agriculture'],
    opportunities: [
      'تطوير منتجات عضوية متقدمة',
      'تقنيات تقليل استخدام المبيدات',
      'نظم إدارة الكربون'
    ],
    threats: [
      'تكاليف التحول العالية',
      'مقاومة من بعض المزارعين'
    ]
  },
  {
    id: '3',
    name: 'تطور تقنيات الزراعة الداخلية',
    description: 'نمو كبير في الزراعة العمودية والمحمية باستخدام تقنيات متقدمة',
    category: 'الزراعة الداخلية',
    impact: 'medium',
    urgency: 'medium',
    confidence: 75,
    timeframe: '2024-2028',
    relatedTechnologies: ['LED Lighting', 'Hydroponics', 'Climate Control'],
    opportunities: [
      'إنتاج في المناطق الحضرية',
      'توفير المياه والمساحة',
      'إنتاج على مدار السنة'
    ],
    threats: [
      'استهلاك طاقة عالي',
      'تكلفة أولية مرتفعة'
    ]
  }
];

// Validation schemas
const TechnologySchema = z.object({
  name: z.string(),
  description: z.string(),
  category: z.string(),
  maturityLevel: z.enum(['emerging', 'developing', 'mature', 'declining']),
  readinessLevel: z.number().min(1).max(9),
  potentialImpact: z.enum(['low', 'medium', 'high', 'transformative']),
  marketSize: z.number(),
  riskLevel: z.enum(['low', 'medium', 'high', 'very-high']),
  requiredInvestment: z.number(),
  expectedROI: z.number()
});

const InvestmentSchema = z.object({
  technologyId: z.string(),
  amount: z.number(),
  type: z.enum(['R&D', 'acquisition', 'partnership', 'licensing', 'equity']),
  stage: z.enum(['planning', 'approved', 'executing', 'completed', 'cancelled']),
  expectedCompletion: z.string()
});

// GET /api/emerging-tech/technologies - Get all technologies
router.get('/technologies', (req, res) => {
  try {
    const { category, maturityLevel, potentialImpact, riskLevel, sortBy } = req.query;
    
    let filteredTechnologies = [...technologies];
    
    if (category) {
      filteredTechnologies = filteredTechnologies.filter(tech => tech.category === category);
    }
    
    if (maturityLevel) {
      filteredTechnologies = filteredTechnologies.filter(tech => tech.maturityLevel === maturityLevel);
    }
    
    if (potentialImpact) {
      filteredTechnologies = filteredTechnologies.filter(tech => tech.potentialImpact === potentialImpact);
    }
    
    if (riskLevel) {
      filteredTechnologies = filteredTechnologies.filter(tech => tech.riskLevel === riskLevel);
    }
    
    if (sortBy === 'score') {
      filteredTechnologies.sort((a, b) => b.evaluationScore - a.evaluationScore);
    } else if (sortBy === 'market') {
      filteredTechnologies.sort((a, b) => b.marketSize - a.marketSize);
    } else if (sortBy === 'roi') {
      filteredTechnologies.sort((a, b) => b.expectedROI - a.expectedROI);
    }
    
    res.json(filteredTechnologies);
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في جلب التقنيات' });
  }
});

// GET /api/emerging-tech/technologies/:id - Get specific technology
router.get('/technologies/:id', (req, res) => {
  try {
    const technology = technologies.find(t => t.id === req.params.id);
    
    if (!technology) {
      return res.status(404).json({ error: 'التقنية غير موجودة' });
    }
    
    res.json(technology);
  } catch (error) {
    res.status(500).json({ error: 'ح��ث خطأ في جلب التقنية' });
  }
});

// POST /api/emerging-tech/technologies - Create new technology assessment
router.post('/technologies', (req, res) => {
  try {
    const validatedData = TechnologySchema.parse(req.body);
    
    const newTechnology = {
      id: String(technologies.length + 1),
      ...validatedData,
      adoptionRate: 0,
      competitiveAdvantage: 50,
      timeToMarket: 'غير محدد',
      keyBenefits: [],
      challenges: [],
      competitors: [],
      patents: 0,
      publications: 0,
      fundingReceived: 0,
      evaluationScore: 5.0,
      lastUpdated: new Date().toISOString().split('T')[0],
      evaluator: 'النظام',
      sources: []
    };
    
    technologies.push(newTechnology);
    res.status(201).json(newTechnology);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'بيانات غير صحيحة', details: error.errors });
    } else {
      res.status(500).json({ error: 'حدث خطأ في إنشاء التقنية' });
    }
  }
});

// PATCH /api/emerging-tech/technologies/:id/score - Update technology evaluation score
router.patch('/technologies/:id/score', (req, res) => {
  try {
    const { evaluationScore } = req.body;
    const technologyIndex = technologies.findIndex(t => t.id === req.params.id);
    
    if (technologyIndex === -1) {
      return res.status(404).json({ error: 'التقنية غير موجودة' });
    }
    
    technologies[technologyIndex].evaluationScore = Math.min(10, Math.max(0, evaluationScore));
    technologies[technologyIndex].lastUpdated = new Date().toISOString().split('T')[0];
    
    res.json(technologies[technologyIndex]);
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في تحديث تقييم التقنية' });
  }
});

// GET /api/emerging-tech/investments - Get all investments
router.get('/investments', (req, res) => {
  try {
    const { stage, type, technologyId } = req.query;
    
    let filteredInvestments = [...investments];
    
    if (stage) {
      filteredInvestments = filteredInvestments.filter(inv => inv.stage === stage);
    }
    
    if (type) {
      filteredInvestments = filteredInvestments.filter(inv => inv.type === type);
    }
    
    if (technologyId) {
      filteredInvestments = filteredInvestments.filter(inv => inv.technologyId === technologyId);
    }
    
    res.json(filteredInvestments);
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في جلب الاستثمارات' });
  }
});

// POST /api/emerging-tech/investments - Create new investment
router.post('/investments', (req, res) => {
  try {
    const validatedData = InvestmentSchema.parse(req.body);
    
    const technology = technologies.find(t => t.id === validatedData.technologyId);
    if (!technology) {
      return res.status(404).json({ error: 'التقنية غير موجودة' });
    }
    
    const newInvestment = {
      id: String(investments.length + 1),
      ...validatedData,
      technologyName: technology.name,
      startDate: new Date().toISOString().split('T')[0],
      milestones: [],
      risks: [],
      team: [],
      budget: {
        allocated: validatedData.amount,
        spent: 0,
        remaining: validatedData.amount
      },
      kpis: []
    };
    
    investments.push(newInvestment);
    res.status(201).json(newInvestment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'بيانات غير صحيحة', details: error.errors });
    } else {
      res.status(500).json({ error: 'حدث خطأ في إنشاء الاستثمار' });
    }
  }
});

// GET /api/emerging-tech/investments/:id - Get specific investment
router.get('/investments/:id', (req, res) => {
  try {
    const investment = investments.find(i => i.id === req.params.id);
    
    if (!investment) {
      return res.status(404).json({ error: 'الاستثمار غير موجود' });
    }
    
    res.json(investment);
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ ف�� جلب الاستثمار' });
  }
});

// PATCH /api/emerging-tech/investments/:id/stage - Update investment stage
router.patch('/investments/:id/stage', (req, res) => {
  try {
    const { stage } = req.body;
    const investmentIndex = investments.findIndex(i => i.id === req.params.id);
    
    if (investmentIndex === -1) {
      return res.status(404).json({ error: 'الاستثمار غير موجود' });
    }
    
    investments[investmentIndex].stage = stage;
    res.json(investments[investmentIndex]);
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في تحديث مرحلة الاستثمار' });
  }
});

// PATCH /api/emerging-tech/investments/:id/budget - Update investment budget
router.patch('/investments/:id/budget', (req, res) => {
  try {
    const { spent } = req.body;
    const investmentIndex = investments.findIndex(i => i.id === req.params.id);
    
    if (investmentIndex === -1) {
      return res.status(404).json({ error: 'الاستثمار غير موجود' });
    }
    
    const investment = investments[investmentIndex];
    investment.budget.spent = Math.min(investment.budget.allocated, Math.max(0, spent));
    investment.budget.remaining = investment.budget.allocated - investment.budget.spent;
    
    res.json(investment);
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في تحديث ميزانية الاستثمار' });
  }
});

// GET /api/emerging-tech/market-trends - Get market trends
router.get('/market-trends', (req, res) => {
  try {
    const { category, impact, urgency } = req.query;
    
    let filteredTrends = [...marketTrends];
    
    if (category) {
      filteredTrends = filteredTrends.filter(trend => trend.category === category);
    }
    
    if (impact) {
      filteredTrends = filteredTrends.filter(trend => trend.impact === impact);
    }
    
    if (urgency) {
      filteredTrends = filteredTrends.filter(trend => trend.urgency === urgency);
    }
    
    res.json(filteredTrends);
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في جلب اتجاهات السوق' });
  }
});

// GET /api/emerging-tech/analytics - Get comprehensive analytics
router.get('/analytics', (req, res) => {
  try {
    const totalTechnologies = technologies.length;
    const highImpactTech = technologies.filter(t => t.potentialImpact === 'high' || t.potentialImpact === 'transformative').length;
    const totalInvestments = investments.reduce((sum, inv) => sum + inv.amount, 0);
    const activeInvestments = investments.filter(inv => inv.stage === 'executing').length;
    const completedInvestments = investments.filter(inv => inv.stage === 'completed').length;
    const avgTechScore = technologies.reduce((sum, tech) => sum + tech.evaluationScore, 0) / Math.max(technologies.length, 1);
    
    const technologiesByCategory = technologies.reduce((acc, tech) => {
      acc[tech.category] = (acc[tech.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const technologiesByMaturity = technologies.reduce((acc, tech) => {
      acc[tech.maturityLevel] = (acc[tech.maturityLevel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const investmentsByType = investments.reduce((acc, inv) => {
      acc[inv.type] = (acc[inv.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const investmentsByStage = investments.reduce((acc, inv) => {
      acc[inv.stage] = (acc[inv.stage] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topTechnologies = technologies
      .sort((a, b) => b.evaluationScore - a.evaluationScore)
      .slice(0, 5)
      .map(tech => ({
        name: tech.name,
        score: tech.evaluationScore,
        impact: tech.potentialImpact,
        marketSize: tech.marketSize
      }));
    
    const riskDistribution = technologies.reduce((acc, tech) => {
      acc[tech.riskLevel] = (acc[tech.riskLevel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const averageROI = investments
      .filter(inv => inv.actualROI !== undefined)
      .reduce((sum, inv) => sum + (inv.actualROI || 0), 0) / 
      Math.max(investments.filter(inv => inv.actualROI !== undefined).length, 1);
    
    const analytics = {
      overview: {
        totalTechnologies,
        highImpactTech,
        totalInvestments,
        activeInvestments,
        completedInvestments,
        avgTechScore: Math.round(avgTechScore * 100) / 100,
        averageROI: Math.round(averageROI * 100) / 100
      },
      distributions: {
        technologiesByCategory,
        technologiesByMaturity,
        investmentsByType,
        investmentsByStage,
        riskDistribution
      },
      insights: {
        topTechnologies,
        totalMarketSize: technologies.reduce((sum, tech) => sum + tech.marketSize, 0),
        totalFundingReceived: technologies.reduce((sum, tech) => sum + tech.fundingReceived, 0),
        totalPatents: technologies.reduce((sum, tech) => sum + tech.patents, 0),
        averageTimeToMarket: '15-20 شهر',
        successRate: (completedInvestments / Math.max(investments.length, 1)) * 100
      },
      trends: {
        emergingTechnologies: technologies.filter(t => t.maturityLevel === 'emerging').length,
        readyForMarket: technologies.filter(t => t.readinessLevel >= 7).length,
        highRiskTechnologies: technologies.filter(t => t.riskLevel === 'high' || t.riskLevel === 'very-high').length
      }
    };
    
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في جلب التحليلات' });
  }
});

// GET /api/emerging-tech/dashboard - Get dashboard summary
router.get('/dashboard', (req, res) => {
  try {
    const totalTechnologies = technologies.length;
    const highImpactTech = technologies.filter(t => t.potentialImpact === 'high' || t.potentialImpact === 'transformative').length;
    const totalInvestments = investments.reduce((sum, inv) => sum + inv.amount, 0);
    const activeInvestments = investments.filter(inv => inv.stage === 'executing').length;
    const avgTechScore = technologies.reduce((sum, tech) => sum + tech.evaluationScore, 0) / Math.max(technologies.length, 1);
    
    const topTechnologies = technologies
      .sort((a, b) => b.evaluationScore - a.evaluationScore)
      .slice(0, 5);
    
    const recentInvestments = investments
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
      .slice(0, 5);
    
    const highRiskTechnologies = technologies
      .filter(tech => tech.riskLevel === 'high' || tech.riskLevel === 'very-high')
      .slice(0, 5);
    
    const investmentAlerts = investments
      .filter(inv => inv.stage === 'executing')
      .filter(inv => {
        const progressPercent = (inv.budget.spent / inv.budget.allocated) * 100;
        return progressPercent > 80 || new Date(inv.expectedCompletion) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      })
      .slice(0, 5);
    
    const dashboard = {
      metrics: {
        totalTechnologies,
        highImpactTech,
        totalInvestments,
        activeInvestments,
        avgTechScore: Math.round(avgTechScore * 100) / 100
      },
      topTechnologies,
      recentInvestments,
      highRiskTechnologies,
      investmentAlerts,
      budgetOverview: {
        totalAllocated: investments.reduce((sum, inv) => sum + inv.budget.allocated, 0),
        totalSpent: investments.reduce((sum, inv) => sum + inv.budget.spent, 0),
        totalRemaining: investments.reduce((sum, inv) => sum + inv.budget.remaining, 0)
      }
    };
    
    res.json(dashboard);
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في جلب بيانات لوحة التحكم' });
  }
});

export default router;
