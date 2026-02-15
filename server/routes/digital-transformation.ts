import express from 'express';
import { z } from 'zod';

const router = express.Router();

// Mock data for demonstration
const transformationProjects = [
  {
    id: '1',
    name: 'نظام الري الذكي المتقدم',
    description: 'تطوير نظام ري ذكي يستخدم الذكاء الاصطناعي وإنترنت الأشياء',
    category: 'تقنيات الري',
    status: 'in-progress',
    priority: 'high',
    progress: 65,
    budget: 150000,
    actualCost: 98000,
    startDate: '2024-01-15',
    expectedCompletion: '2024-06-30',
    team: ['أحمد محمد', 'فاطمة علي', 'محمد حسن', 'سارة أحمد'],
    technologies: ['IoT', 'AI/ML', 'Cloud Computing', 'Mobile App'],
    businessImpact: 'توفير 30% من استهلاك المياه وزيادة الإنتاجية بنسبة 25%',
    risks: [
      { level: 'medium', description: 'تأخير في توريد أجهزة الاستشعار' },
      { level: 'low', description: 'حاجة لتدريب إضافي للمزارعين' }
    ],
    kpis: [
      { metric: 'توفير المياه', current: 20, target: 30, unit: '%' },
      { metric: 'زيادة الإنتاجية', current: 15, target: 25, unit: '%' },
      { metric: 'رضا المستخدمين', current: 80, target: 90, unit: '%' }
    ]
  },
  {
    id: '2',
    name: 'منصة التسويق الرقمي للمحاصيل',
    description: 'منصة إلكترونية لربط المزارعين مباشرة بالمستهلكين والتجار',
    category: 'التسويق الرقمي',
    status: 'testing',
    priority: 'medium',
    progress: 85,
    budget: 120000,
    actualCost: 110000,
    startDate: '2023-11-01',
    expectedCompletion: '2024-03-15',
    team: ['عبدالله سالم', 'نور الهدى', 'خالد يوسف'],
    technologies: ['React', 'Node.js', 'MongoDB', 'Payment Gateway'],
    businessImpact: 'زيادة أرباح المزارعين بنسبة 40% وتقليل الوسطاء',
    risks: [
      { level: 'low', description: 'منافسة من المنصات الموجودة' }
    ],
    kpis: [
      { metric: 'عدد المزارعين المسجلين', current: 150, target: 500, unit: 'مزارع' },
      { metric: 'حجم المبيعات الشهرية', current: 50000, target: 200000, unit: 'ريال' }
    ]
  },
  {
    id: '3',
    name: 'نظام مراقبة صحة النباتات بالذكاء الاصطناعي',
    description: 'استخدام الرؤية الحاسوبية لكشف الأمراض والآفات مبكراً',
    category: 'حماية النباتات',
    status: 'planning',
    priority: 'critical',
    progress: 25,
    budget: 200000,
    actualCost: 45000,
    startDate: '2024-02-01',
    expectedCompletion: '2024-08-30',
    team: ['د. علي حسين', 'مريم عبدالله', 'يوسف محمد'],
    technologies: ['Computer Vision', 'Deep Learning', 'Mobile App', 'Cloud AI'],
    businessImpact: 'تقليل خسائر المحاصيل بنسبة 50% وتقليل استخدام المبيدات',
    risks: [
      { level: 'high', description: 'صعوبة في الحصول على بيانات تدريب كافية' },
      { level: 'medium', description: 'تحديات في دقة التشخيص للأمراض النادرة' }
    ],
    kpis: [
      { metric: 'دقة الكشف', current: 75, target: 95, unit: '%' },
      { metric: 'تقليل الخسائر', current: 20, target: 50, unit: '%' }
    ]
  }
];

const innovations = [
  {
    id: '1',
    title: 'طائرات بدون طيار للمراقبة الزراعية',
    description: 'استخدام الطائرات المسيرة لمراقبة المحاصيل وتحليل صحة النباتات من الجو',
    category: 'تقنيات المراقبة',
    submittedBy: 'محمد الأحمد',
    submissionDate: '2024-01-15',
    stage: 'pilot',
    votes: 45,
    comments: 12,
    potentialImpact: 'high',
    feasibility: 'medium',
    expectedROI: 35,
    requiredInvestment: 80000,
    timeline: '6-8 أشهر'
  },
  {
    id: '2',
    title: 'نظام الزراعة المائية الذكي',
    description: 'تطوير نظام زراعة مائية مؤتمت بالكامل مع تحكم في العناصر الغذائية',
    category: 'أنظمة الزراعة',
    submittedBy: 'سارة محمد',
    submissionDate: '2024-01-20',
    stage: 'evaluation',
    votes: 38,
    comments: 8,
    potentialImpact: 'high',
    feasibility: 'high',
    expectedROI: 45,
    requiredInvestment: 120000,
    timeline: '4-6 أشهر'
  },
  {
    id: '3',
    title: 'تطبيق الواقع المعزز للتدريب الزراعي',
    description: 'تطبيق يستخدم الواقع المعزز لتعليم المزارعين تقنيات زراعية جديدة',
    category: 'التعليم والتدريب',
    submittedBy: 'أحمد علي',
    submissionDate: '2024-01-25',
    stage: 'idea',
    votes: 22,
    comments: 5,
    potentialImpact: 'medium',
    feasibility: 'medium',
    expectedROI: 25,
    requiredInvestment: 60000,
    timeline: '8-10 أشهر'
  },
  {
    id: '4',
    title: 'منصة التمويل الجماعي للمشاريع الزراعية',
    description: 'منصة تتيح للمستثمرين تمويل المشاريع الزراعية الصغيرة والمتوسطة',
    category: 'التمويل',
    submittedBy: 'فاطمة حسن',
    submissionDate: '2024-02-01',
    stage: 'prototyping',
    votes: 52,
    comments: 15,
    potentialImpact: 'high',
    feasibility: 'high',
    expectedROI: 40,
    requiredInvestment: 90000,
    timeline: '3-5 أشهر'
  }
];

const digitalMaturity = [
  {
    area: 'البنية التحتية التقنية',
    currentLevel: 3,
    targetLevel: 5,
    score: 3.2,
    initiatives: [
      'ترقية شبكة الاتصالات',
      'تطوير منصة البيانات السحابية',
      'تحسين أمان المعلومات'
    ]
  },
  {
    area: 'إدارة البيانات والتحليلا��',
    currentLevel: 2,
    targetLevel: 4,
    score: 2.8,
    initiatives: [
      'تطبيق نظام إدارة البيانات المركزي',
      'تدريب الفرق على تحليل البيانات',
      'استخدام الذكاء الاصطناعي في التحليل'
    ]
  },
  {
    area: 'التفاعل الرقمي مع العملاء',
    currentLevel: 4,
    targetLevel: 5,
    score: 4.1,
    initiatives: [
      'تطوير تطبيق الهاتف المحمول',
      'تحسين تجربة المستخدم',
      'تطبيق الذكاء الاصطناعي في خدمة العملاء'
    ]
  },
  {
    area: 'الأتمتة والعمليات الذكية',
    currentLevel: 2,
    targetLevel: 4,
    score: 2.5,
    initiatives: [
      'أتمتة عمليات الري',
      'نظام إدارة المخزون الذكي',
      'أتمتة عمليات المحاسبة'
    ]
  },
  {
    area: 'الثقافة الرقمية والمهارات',
    currentLevel: 3,
    targetLevel: 4,
    score: 3.0,
    initiatives: [
      'برامج التدريب الرقمي',
      'ورش عمل التقنيات الحديثة',
      'شهادات التكنولوجيا الزراعية'
    ]
  },
  {
    area: 'الشراكات والنظا�� البيئي الرقمي',
    currentLevel: 2,
    targetLevel: 5,
    score: 2.3,
    initiatives: [
      'شراكات مع شركات التكنولوجيا',
      'التعاون مع الجامعات والمراكز البحثية',
      'المشاركة في المعارض التقنية'
    ]
  }
];

// Validation schemas
const ProjectSchema = z.object({
  name: z.string(),
  description: z.string(),
  category: z.string(),
  status: z.enum(['planning', 'in-progress', 'testing', 'completed', 'on-hold']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  budget: z.number(),
  expectedCompletion: z.string(),
  team: z.array(z.string()),
  technologies: z.array(z.string()),
  businessImpact: z.string()
});

const InnovationSchema = z.object({
  title: z.string(),
  description: z.string(),
  category: z.string(),
  submittedBy: z.string(),
  potentialImpact: z.enum(['low', 'medium', 'high']),
  feasibility: z.enum(['low', 'medium', 'high']),
  expectedROI: z.number(),
  requiredInvestment: z.number(),
  timeline: z.string()
});

// GET /api/digital-transformation/projects - Get all transformation projects
router.get('/projects', (req, res) => {
  try {
    const { status, priority, category } = req.query;
    
    let filteredProjects = [...transformationProjects];
    
    if (status) {
      filteredProjects = filteredProjects.filter(project => project.status === status);
    }
    
    if (priority) {
      filteredProjects = filteredProjects.filter(project => project.priority === priority);
    }
    
    if (category) {
      filteredProjects = filteredProjects.filter(project => project.category === category);
    }
    
    res.json(filteredProjects);
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في جلب المشاريع' });
  }
});

// POST /api/digital-transformation/projects - Create new transformation project
router.post('/projects', (req, res) => {
  try {
    const validatedData = ProjectSchema.parse(req.body);
    
    const newProject = {
      id: String(transformationProjects.length + 1),
      ...validatedData,
      progress: 0,
      actualCost: 0,
      startDate: new Date().toISOString().split('T')[0],
      risks: [],
      kpis: []
    };
    
    transformationProjects.push(newProject);
    res.status(201).json(newProject);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'بيانات غير صحيحة', details: error.errors });
    } else {
      res.status(500).json({ error: 'حدث خطأ في إنشاء المشروع' });
    }
  }
});

// GET /api/digital-transformation/projects/:id - Get specific project
router.get('/projects/:id', (req, res) => {
  try {
    const project = transformationProjects.find(p => p.id === req.params.id);
    
    if (!project) {
      return res.status(404).json({ error: 'المشروع غير موجود' });
    }
    
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في جلب المشروع' });
  }
});

// PATCH /api/digital-transformation/projects/:id/status - Update project status
router.patch('/projects/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    const projectIndex = transformationProjects.findIndex(p => p.id === req.params.id);
    
    if (projectIndex === -1) {
      return res.status(404).json({ error: 'المشروع غير موجود' });
    }
    
    transformationProjects[projectIndex].status = status;
    res.json(transformationProjects[projectIndex]);
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في تحديث حالة المشروع' });
  }
});

// PATCH /api/digital-transformation/projects/:id/progress - Update project progress
router.patch('/projects/:id/progress', (req, res) => {
  try {
    const { progress } = req.body;
    const projectIndex = transformationProjects.findIndex(p => p.id === req.params.id);
    
    if (projectIndex === -1) {
      return res.status(404).json({ error: 'المشروع غير موجود' });
    }
    
    transformationProjects[projectIndex].progress = Math.min(100, Math.max(0, progress));
    res.json(transformationProjects[projectIndex]);
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في تحديث تقدم المشروع' });
  }
});

// GET /api/digital-transformation/innovations - Get all innovations
router.get('/innovations', (req, res) => {
  try {
    const { stage, category, sortBy } = req.query;
    
    let filteredInnovations = [...innovations];
    
    if (stage) {
      filteredInnovations = filteredInnovations.filter(innovation => innovation.stage === stage);
    }
    
    if (category) {
      filteredInnovations = filteredInnovations.filter(innovation => innovation.category === category);
    }
    
    if (sortBy === 'votes') {
      filteredInnovations.sort((a, b) => b.votes - a.votes);
    } else if (sortBy === 'date') {
      filteredInnovations.sort((a, b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime());
    }
    
    res.json(filteredInnovations);
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في جلب الا��تكارات' });
  }
});

// POST /api/digital-transformation/innovations - Submit new innovation
router.post('/innovations', (req, res) => {
  try {
    const validatedData = InnovationSchema.parse(req.body);
    
    const newInnovation = {
      id: String(innovations.length + 1),
      ...validatedData,
      submissionDate: new Date().toISOString().split('T')[0],
      stage: 'idea',
      votes: 0,
      comments: 0
    };
    
    innovations.push(newInnovation);
    res.status(201).json(newInnovation);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'بيانات غير صحيحة', details: error.errors });
    } else {
      res.status(500).json({ error: 'حدث خطأ في إرسال الابتكار' });
    }
  }
});

// POST /api/digital-transformation/innovations/:id/vote - Vote for innovation
router.post('/innovations/:id/vote', (req, res) => {
  try {
    const innovationIndex = innovations.findIndex(i => i.id === req.params.id);
    
    if (innovationIndex === -1) {
      return res.status(404).json({ error: 'الابتكار غير موجود' });
    }
    
    innovations[innovationIndex].votes += 1;
    res.json(innovations[innovationIndex]);
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ ف�� التصويت' });
  }
});

// PATCH /api/digital-transformation/innovations/:id/stage - Update innovation stage
router.patch('/innovations/:id/stage', (req, res) => {
  try {
    const { stage } = req.body;
    const innovationIndex = innovations.findIndex(i => i.id === req.params.id);
    
    if (innovationIndex === -1) {
      return res.status(404).json({ error: 'الابتكار غير موجود' });
    }
    
    innovations[innovationIndex].stage = stage;
    res.json(innovations[innovationIndex]);
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في تحديث مرحلة الابتكار' });
  }
});

// GET /api/digital-transformation/maturity - Get digital maturity assessment
router.get('/maturity', (req, res) => {
  try {
    res.json(digitalMaturity);
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في جلب تقييم النضج الرقمي' });
  }
});

// PATCH /api/digital-transformation/maturity/:area - Update maturity score for area
router.patch('/maturity/:area', (req, res) => {
  try {
    const { currentLevel, targetLevel } = req.body;
    const areaIndex = digitalMaturity.findIndex(a => a.area === decodeURIComponent(req.params.area));
    
    if (areaIndex === -1) {
      return res.status(404).json({ error: 'المجال غير موجود' });
    }
    
    if (currentLevel !== undefined) {
      digitalMaturity[areaIndex].currentLevel = currentLevel;
    }
    
    if (targetLevel !== undefined) {
      digitalMaturity[areaIndex].targetLevel = targetLevel;
    }
    
    // Recalculate score based on current level and initiatives progress
    digitalMaturity[areaIndex].score = digitalMaturity[areaIndex].currentLevel + (Math.random() * 0.5);
    
    res.json(digitalMaturity[areaIndex]);
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في تحديث نضج المجال' });
  }
});

// GET /api/digital-transformation/analytics - Get transformation analytics
router.get('/analytics', (req, res) => {
  try {
    const totalProjects = transformationProjects.length;
    const activeProjects = transformationProjects.filter(p => p.status === 'in-progress').length;
    const completedProjects = transformationProjects.filter(p => p.status === 'completed').length;
    const totalBudget = transformationProjects.reduce((sum, p) => sum + p.budget, 0);
    const totalActualCost = transformationProjects.reduce((sum, p) => sum + p.actualCost, 0);
    const averageProgress = transformationProjects.reduce((sum, p) => sum + p.progress, 0) / Math.max(totalProjects, 1);
    
    const totalInnovations = innovations.length;
    const innovationsByStage = innovations.reduce((acc, innovation) => {
      acc[innovation.stage] = (acc[innovation.stage] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const averageMaturityScore = digitalMaturity.reduce((sum, area) => sum + area.score, 0) / digitalMaturity.length;
    
    const projectsByStatus = transformationProjects.reduce((acc, project) => {
      acc[project.status] = (acc[project.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const projectsByPriority = transformationProjects.reduce((acc, project) => {
      acc[project.priority] = (acc[project.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const analytics = {
      projects: {
        total: totalProjects,
        active: activeProjects,
        completed: completedProjects,
        byStatus: projectsByStatus,
        byPriority: projectsByPriority,
        totalBudget,
        totalActualCost,
        averageProgress: Math.round(averageProgress * 100) / 100
      },
      innovations: {
        total: totalInnovations,
        byStage: innovationsByStage,
        totalVotes: innovations.reduce((sum, i) => sum + i.votes, 0),
        averageROI: innovations.reduce((sum, i) => sum + i.expectedROI, 0) / Math.max(totalInnovations, 1)
      },
      maturity: {
        averageScore: Math.round(averageMaturityScore * 100) / 100,
        areasCount: digitalMaturity.length,
        topPerformingAreas: digitalMaturity
          .sort((a, b) => b.score - a.score)
          .slice(0, 3)
          .map(area => ({ area: area.area, score: area.score })),
        areasNeedingImprovement: digitalMaturity
          .sort((a, b) => a.score - b.score)
          .slice(0, 3)
          .map(area => ({ area: area.area, score: area.score }))
      }
    };
    
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في جلب التحليلات' });
  }
});

// GET /api/digital-transformation/dashboard - Get dashboard summary
router.get('/dashboard', (req, res) => {
  try {
    const activeProjects = transformationProjects.filter(p => p.status === 'in-progress').length;
    const completedProjects = transformationProjects.filter(p => p.status === 'completed').length;
    const totalInnovations = innovations.length;
    const avgMaturityScore = digitalMaturity.reduce((sum, area) => sum + area.score, 0) / digitalMaturity.length;
    
    const recentInnovations = innovations
      .sort((a, b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime())
      .slice(0, 5);
    
    const upcomingMilestones = transformationProjects
      .filter(p => p.status === 'in-progress')
      .map(p => ({
        projectName: p.name,
        expectedCompletion: p.expectedCompletion,
        progress: p.progress
      }))
      .sort((a, b) => new Date(a.expectedCompletion).getTime() - new Date(b.expectedCompletion).getTime())
      .slice(0, 5);
    
    const riskAlerts = transformationProjects
      .filter(p => p.risks && p.risks.length > 0)
      .flatMap(p => p.risks.map(risk => ({
        projectName: p.name,
        riskLevel: risk.level,
        description: risk.description
      })))
      .filter(risk => risk.riskLevel === 'high' || risk.riskLevel === 'medium')
      .slice(0, 5);
    
    const dashboard = {
      metrics: {
        activeProjects,
        completedProjects,
        totalInnovations,
        avgMaturityScore: Math.round(avgMaturityScore * 100) / 100
      },
      recentInnovations,
      upcomingMilestones,
      riskAlerts,
      totalBudget: transformationProjects.reduce((sum, p) => sum + p.budget, 0),
      totalActualCost: transformationProjects.reduce((sum, p) => sum + p.actualCost, 0),
      averageProgress: transformationProjects.reduce((sum, p) => sum + p.progress, 0) / Math.max(transformationProjects.length, 1)
    };
    
    res.json(dashboard);
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في جلب بيانات لوحة التحكم' });
  }
});

export default router;
