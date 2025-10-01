import express from 'express';
import { z } from 'zod';

const router = express.Router();

// Mock data for demonstration
const patents = [
  {
    id: '1',
    title: 'نظام ري ذكي مع تحكم آلي في الرطوبة',
    description: 'نظام متطور للري الذكي يستخدم أجهزة استشعار الرطوبة والذكاء الاصطناعي لتحديد احتياجات النباتات المائية',
    inventors: ['د. أحمد محمد العلي', 'م. سارة أحمد حسن', 'د. محمد عبدالله'],
    assignee: 'شركة التقنيات الزراعية المتقدمة',
    applicationNumber: 'SA2024000123',
    publicationNumber: 'SA2024000123A1',
    grantNumber: 'SA123456',
    filingDate: '2024-01-15',
    publicationDate: '2024-07-15',
    grantDate: '2024-12-01',
    expiryDate: '2044-01-15',
    status: 'granted',
    priority: 'high',
    category: 'Agriculture',
    jurisdiction: ['SA', 'US', 'EP'],
    claims: [
      'نظام ري ذكي يضم أجهزة استشعار للرطوبة',
      'وحدة تحكم مركزية تحلل بيانات الاستشعار',
      'خوارزميات ذكية لتحديد مواعيد الري المثلى'
    ],
    technologies: ['IoT', 'AI/ML', 'Sensor Technology', 'Automation'],
    relatedPatents: ['2', '3'],
    commercialValue: 2500000,
    maintenanceFees: [
      { year: 3, amount: 5000, paid: true, dueDate: '2027-01-15' },
      { year: 7, amount: 8000, paid: false, dueDate: '2031-01-15' },
      { year: 11, amount: 12000, paid: false, dueDate: '2035-01-15' }
    ],
    prosecutionHistory: [
      { date: '2024-01-15', action: 'Filing', description: 'تم إيداع طلب البراءة' },
      { date: '2024-03-20', action: 'Examination', description: 'بدء الفحص الموضوعي' },
      { date: '2024-12-01', action: 'Grant', description: 'منح البراءة نهائياً' }
    ],
    licensing: {
      isLicensed: true,
      licensees: ['شركة الزراعة الحديثة', 'مؤسسة التقنية الخضراء'],
      royaltyRate: 5.5,
      revenue: 450000
    },
    opposition: {
      hasOpposition: false,
      opponents: [],
      status: 'none'
    },
    attachment: ['patent_document.pdf', 'technical_drawings.pdf']
  },
  {
    id: '2',
    title: 'جهاز مراقبة صحة النباتات بالاستشعار البصري',
    description: 'جهاز يستخدم الكاميرات والذكاء الاصطناعي لكشف الأمراض والآفات في النباتات مبكراً',
    inventors: ['د. فاطمة علي محمد', 'م. خالد يوسف أحمد'],
    assignee: 'معهد الذكاء الاصطناعي الزراعي',
    applicationNumber: 'SA2024000456',
    publicationNumber: 'SA2024000456A1',
    filingDate: '2024-03-10',
    publicationDate: '2024-09-10',
    expiryDate: '2044-03-10',
    status: 'published',
    priority: 'critical',
    category: 'Biotechnology',
    jurisdiction: ['SA', 'US'],
    claims: [
      'نظام كاميرا متعددة الطيف لتحليل النباتات',
      'خوارزميات التعلم العميق لتشخيص الأمراض',
      'واجهة مستخدم لعرض نتائج التشخيص'
    ],
    technologies: ['Computer Vision', 'Deep Learning', 'Multispectral Imaging'],
    relatedPatents: ['1'],
    commercialValue: 3200000,
    maintenanceFees: [
      { year: 3, amount: 5000, paid: false, dueDate: '2027-03-10' }
    ],
    prosecutionHistory: [
      { date: '2024-03-10', action: 'Filing', description: 'تم إيداع طلب البراءة' },
      { date: '2024-05-15', action: 'Examination', description: 'بدء الفحص الشكلي' },
      { date: '2024-09-10', action: 'Publication', description: 'نشر طلب البراءة' }
    ],
    licensing: {
      isLicensed: false,
      licensees: [],
      revenue: 0
    },
    opposition: {
      hasOpposition: true,
      opponents: ['شركة الرؤية الزراعية المحدودة'],
      status: 'pending'
    },
    attachment: ['application.pdf']
  },
  {
    id: '3',
    title: 'طريقة لتحسين كفاءة استخدام الأسمدة',
    description: 'طريقة متطورة لتطبيق الأسمدة بناءً على تحليل التربة والاحتياجات النباتية',
    inventors: ['د. عبدالرحمن سالم', 'م. نور الهدى محمد'],
    assignee: 'شركة الحلول الزراعية المستدامة',
    applicationNumber: 'SA2024000789',
    filingDate: '2024-02-20',
    expiryDate: '2044-02-20',
    status: 'filed',
    priority: 'medium',
    category: 'Agriculture',
    jurisdiction: ['SA'],
    claims: [
      'طريقة لتحليل عينات التربة بالاستشعار',
      'خوارزمية ��حساب الجرعة المثلى للأسمدة',
      'نظام توزيع دقيق للأسمدة'
    ],
    technologies: ['Precision Agriculture', 'Soil Analysis', 'Automation'],
    relatedPatents: ['1'],
    commercialValue: 1800000,
    maintenanceFees: [
      { year: 3, amount: 5000, paid: false, dueDate: '2027-02-20' }
    ],
    prosecutionHistory: [
      { date: '2024-02-20', action: 'Filing', description: 'تم إيداع طلب البراءة' },
      { date: '2024-04-01', action: 'Examination Request', description: 'طلب فحص موضوعي' }
    ],
    licensing: {
      isLicensed: false,
      licensees: [],
      revenue: 0
    },
    attachment: ['method_description.pdf']
  }
];

const trademarks = [
  {
    id: '1',
    mark: 'أجروتك الذكية',
    type: 'combined',
    description: 'علامة تجارية تجمع بين النص والشعار لشركة التقنيات الزراعية',
    classes: [42, 35, 9],
    applicant: 'شركة التقنيات الزراعية المتقدمة',
    applicationNumber: 'TM2024001',
    registrationNumber: 'REG123456',
    filingDate: '2024-01-10',
    registrationDate: '2024-06-15',
    expiryDate: '2034-06-15',
    status: 'registered',
    jurisdiction: 'SA',
    goodsServices: 'خدمات تقنية المعلومات الزراعية، برمجيات الزراعة الذكية، أجهزة استشعار زراعية',
    priority: 'high',
    renewalHistory: [
      { date: '2024-06-15', period: 10, fee: 2000 }
    ],
    oppositions: [],
    usage: {
      firstUse: '2023-06-01',
      commercialUse: '2023-08-15',
      marketValue: 850000
    }
  },
  {
    id: '2',
    mark: 'SmartFarm Pro',
    type: 'word',
    description: 'علامة تجارية نصية لمنصة إدارة المزارع الذكية',
    classes: [42, 9],
    applicant: 'معهد الذكاء الاصطناعي الزراعي',
    applicationNumber: 'TM2024002',
    filingDate: '2024-02-05',
    expiryDate: '2034-02-05',
    status: 'examined',
    jurisdiction: 'SA',
    goodsServices: 'برمجيات إدارة المزارع، تطبيقات الهاتف المحمول الزراعية',
    priority: 'medium',
    renewalHistory: [],
    oppositions: [
      { 
        opponent: 'شركة الزراعة التقليدية', 
        date: '2024-04-10', 
        status: 'pending', 
        grounds: 'تشابه مع علامة موجودة' 
      }
    ],
    usage: {
      firstUse: '2024-01-01',
      commercialUse: '2024-03-01',
      marketValue: 650000
    }
  }
];

const copyrights = [
  {
    id: '1',
    title: 'برنامج إدارة المزارع الذكية v2.0',
    type: 'software',
    description: 'برمجية شاملة لإدارة العمليات الزراعية باستخدام الذكاء الاصطناعي',
    author: 'فريق التطوير في شركة التقنيات الزراعية',
    owner: 'شركة التقنيات الزراعية المتقدمة',
    creationDate: '2024-01-15',
    registrationDate: '2024-02-01',
    registrationNumber: 'CR2024001',
    jurisdiction: 'SA',
    duration: '70 سنة من تاريخ النشر',
    status: 'registered',
    commercialValue: 1200000,
    licensing: {
      isLicensed: true,
      licensees: ['شركة الزراعة الحديثة', 'مؤسسة المزارع الكبرى'],
      revenue: 280000
    },
    infringements: []
  },
  {
    id: '2',
    title: 'دليل أفضل الممارسات في الزراعة الذكية',
    type: 'literary',
    description: 'دليل شامل يوثق أفضل الممارسات والتقنيات في الزراعة الذكية',
    author: 'د. أحمد محمد العلي',
    owner: 'معهد الذكاء الاصطناعي الزراعي',
    creationDate: '2023-11-20',
    registrationDate: '2024-01-10',
    registrationNumber: 'CR2024002',
    jurisdiction: 'SA',
    duration: '70 سنة من وفاة المؤلف',
    status: 'registered',
    commercialValue: 450000,
    licensing: {
      isLicensed: true,
      licensees: ['دار النشر التقني'],
      revenue: 85000
    },
    infringements: [
      { 
        date: '2024-03-15', 
        infringer: 'منشورات غير مصرحة', 
        status: 'resolved', 
        resolution: 'تسوية ودية' 
      }
    ]
  }
];

const licenses = [
  {
    id: '1',
    type: 'patent',
    ipId: '1',
    ipTitle: 'نظام ري ذكي مع تحكم آلي في الرطوبة',
    licensee: 'شركة الزراعة الحديثة',
    licensor: 'شركة التقنيات الزراعية المتقدمة',
    licenseType: 'non-exclusive',
    territory: ['SA', 'UAE', 'Kuwait'],
    field: 'الزراعة والري',
    startDate: '2024-01-01',
    endDate: '2029-12-31',
    royaltyRate: 5.5,
    minimumRoyalty: 50000,
    upfrontPayment: 100000,
    totalRevenue: 320000,
    status: 'active',
    terms: [
      'استخدام التقنية في المنطقة المحددة فقط',
      'تقديم تقارير مبيعات ربع سنوية',
      'عدم الإفصاح عن التقنية لأطراف ثالثة'
    ],
    milestones: [
      { description: 'تسجيل أول مبيعات', date: '2024-03-01', completed: true },
      { description: 'تحقيق مبيعات 1 مليون ريال', date: '2024-08-01', completed: true },
      { description: 'توسيع السوق للإمارات', date: '2025-01-01', completed: false }
    ]
  },
  {
    id: '2',
    type: 'software',
    ipId: '1',
    ipTitle: 'برنامج إدارة المزارع الذكية v2.0',
    licensee: 'مؤسسة المزارع الكبرى',
    licensor: 'شركة التقنيات الزراعية المتقدمة',
    licenseType: 'exclusive',
    territory: ['SA'],
    field: 'إدارة المزارع التجارية الكبيرة',
    startDate: '2024-02-15',
    endDate: '2027-02-14',
    royaltyRate: 12.0,
    minimumRoyalty: 80000,
    upfrontPayment: 200000,
    totalRevenue: 480000,
    status: 'active',
    terms: [
      'ترخيص حصري للاستخدام في السعودية',
      'تحديثات مجانية للبرنامج',
      'دعم فني على مدار الساعة'
    ],
    milestones: [
      { description: 'تدريب الفريق', date: '2024-03-01', completed: true },
      { description: 'تطبيق النظام في 5 مزارع', date: '2024-06-01', completed: true },
      { description: 'التوسع لـ 20 مزرعة', date: '2024-12-01', completed: false }
    ]
  },
  {
    id: '3',
    type: 'patent',
    ipId: '2',
    ipTitle: 'جهاز مراقبة صحة النباتات بالاستشعار البصري',
    licensee: 'شركة التقنية الخضراء',
    licensor: 'معهد الذكاء الاصطناعي الزراعي',
    licenseType: 'non-exclusive',
    territory: ['GCC'],
    field: 'مراقبة وتشخيص أمراض النباتات',
    startDate: '2024-06-01',
    endDate: '2029-05-31',
    royaltyRate: 8.0,
    minimumRoyalty: 60000,
    upfrontPayment: 150000,
    totalRevenue: 180000,
    status: 'active',
    terms: [
      'استخدام التقنية في دول الخليج',
      'تقديم تقارير شهرية عن الاستخدام',
      'المشاركة في تطوير التقنية'
    ],
    milestones: [
      { description: 'إطلاق المنتج التجاري', date: '2024-09-01', completed: false },
      { description: 'تحقيق 100 عميل', date: '2025-03-01', completed: false }
    ]
  }
];

// Validation schemas
const PatentSchema = z.object({
  title: z.string(),
  description: z.string(),
  inventors: z.array(z.string()),
  assignee: z.string(),
  applicationNumber: z.string(),
  category: z.string(),
  jurisdiction: z.array(z.string()),
  priority: z.enum(['low', 'medium', 'high', 'critical'])
});

const LicenseSchema = z.object({
  type: z.enum(['patent', 'trademark', 'copyright']),
  ipId: z.string(),
  ipTitle: z.string(),
  licensee: z.string(),
  licensor: z.string(),
  licenseType: z.enum(['exclusive', 'non-exclusive', 'sole']),
  territory: z.array(z.string()),
  field: z.string(),
  royaltyRate: z.number(),
  minimumRoyalty: z.number(),
  upfrontPayment: z.number()
});

// GET /api/ip-management/patents - Get all patents
router.get('/patents', (req, res) => {
  try {
    const { status, category, priority, jurisdiction } = req.query;
    
    let filteredPatents = [...patents];
    
    if (status) {
      filteredPatents = filteredPatents.filter(patent => patent.status === status);
    }
    
    if (category) {
      filteredPatents = filteredPatents.filter(patent => patent.category === category);
    }
    
    if (priority) {
      filteredPatents = filteredPatents.filter(patent => patent.priority === priority);
    }
    
    if (jurisdiction) {
      filteredPatents = filteredPatents.filter(patent => 
        patent.jurisdiction.includes(jurisdiction as string)
      );
    }
    
    res.json(filteredPatents);
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في جلب البراءات' });
  }
});

// GET /api/ip-management/patents/:id - Get specific patent
router.get('/patents/:id', (req, res) => {
  try {
    const patent = patents.find(p => p.id === req.params.id);
    
    if (!patent) {
      return res.status(404).json({ error: 'البراءة غير موجودة' });
    }
    
    res.json(patent);
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في جلب البراءة' });
  }
});

// POST /api/ip-management/patents - Create new patent
router.post('/patents', (req, res) => {
  try {
    const validatedData = PatentSchema.parse(req.body);
    
    const newPatent = {
      id: String(patents.length + 1),
      ...validatedData,
      filingDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 20 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'draft',
      claims: [],
      technologies: [],
      relatedPatents: [],
      commercialValue: 0,
      maintenanceFees: [],
      prosecutionHistory: [
        { 
          date: new Date().toISOString().split('T')[0], 
          action: 'Creation', 
          description: 'تم إنشاء طلب براءة جديد' 
        }
      ],
      licensing: {
        isLicensed: false,
        licensees: [],
        revenue: 0
      },
      attachment: []
    };
    
    patents.push(newPatent);
    res.status(201).json(newPatent);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'بيانات غير صحيحة', details: error.errors });
    } else {
      res.status(500).json({ error: 'حدث خطأ في إنشاء البراءة' });
    }
  }
});

// PATCH /api/ip-management/patents/:id/status - Update patent status
router.patch('/patents/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    const patentIndex = patents.findIndex(p => p.id === req.params.id);
    
    if (patentIndex === -1) {
      return res.status(404).json({ error: 'البراءة غير موجودة' });
    }
    
    patents[patentIndex].status = status;
    patents[patentIndex].prosecutionHistory.push({
      date: new Date().toISOString().split('T')[0],
      action: 'Status Update',
      description: `تم تحديث الحالة إلى ${status}`
    });
    
    res.json(patents[patentIndex]);
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في تحديث حالة البراءة' });
  }
});

// PATCH /api/ip-management/patents/:id/maintenance - Update maintenance fees
router.patch('/patents/:id/maintenance', (req, res) => {
  try {
    const { year, paid } = req.body;
    const patentIndex = patents.findIndex(p => p.id === req.params.id);
    
    if (patentIndex === -1) {
      return res.status(404).json({ error: 'البراءة غير موجودة' });
    }
    
    const feeIndex = patents[patentIndex].maintenanceFees.findIndex(f => f.year === year);
    if (feeIndex !== -1) {
      patents[patentIndex].maintenanceFees[feeIndex].paid = paid;
    }
    
    res.json(patents[patentIndex]);
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في تحديث رسوم الصيانة' });
  }
});

// GET /api/ip-management/trademarks - Get all trademarks
router.get('/trademarks', (req, res) => {
  try {
    const { status, type, jurisdiction } = req.query;
    
    let filteredTrademarks = [...trademarks];
    
    if (status) {
      filteredTrademarks = filteredTrademarks.filter(tm => tm.status === status);
    }
    
    if (type) {
      filteredTrademarks = filteredTrademarks.filter(tm => tm.type === type);
    }
    
    if (jurisdiction) {
      filteredTrademarks = filteredTrademarks.filter(tm => tm.jurisdiction === jurisdiction);
    }
    
    res.json(filteredTrademarks);
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في جلب العلامات التجارية' });
  }
});

// GET /api/ip-management/copyrights - Get all copyrights
router.get('/copyrights', (req, res) => {
  try {
    const { status, type, owner } = req.query;
    
    let filteredCopyrights = [...copyrights];
    
    if (status) {
      filteredCopyrights = filteredCopyrights.filter(cr => cr.status === status);
    }
    
    if (type) {
      filteredCopyrights = filteredCopyrights.filter(cr => cr.type === type);
    }
    
    if (owner) {
      filteredCopyrights = filteredCopyrights.filter(cr => 
        cr.owner.toLowerCase().includes((owner as string).toLowerCase())
      );
    }
    
    res.json(filteredCopyrights);
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في جلب حقوق التأليف' });
  }
});

// GET /api/ip-management/licenses - Get all licenses
router.get('/licenses', (req, res) => {
  try {
    const { status, type, licensee } = req.query;
    
    let filteredLicenses = [...licenses];
    
    if (status) {
      filteredLicenses = filteredLicenses.filter(license => license.status === status);
    }
    
    if (type) {
      filteredLicenses = filteredLicenses.filter(license => license.type === type);
    }
    
    if (licensee) {
      filteredLicenses = filteredLicenses.filter(license => 
        license.licensee.toLowerCase().includes((licensee as string).toLowerCase())
      );
    }
    
    res.json(filteredLicenses);
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في جلب التراخيص' });
  }
});

// POST /api/ip-management/licenses - Create new license
router.post('/licenses', (req, res) => {
  try {
    const validatedData = LicenseSchema.parse(req.body);
    
    const newLicense = {
      id: String(licenses.length + 1),
      ...validatedData,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      totalRevenue: validatedData.upfrontPayment,
      status: 'active',
      terms: [],
      milestones: []
    };
    
    licenses.push(newLicense);
    res.status(201).json(newLicense);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'بيانات غير صحيحة', details: error.errors });
    } else {
      res.status(500).json({ error: 'حدث خطأ في إنشاء الترخيص' });
    }
  }
});

// PATCH /api/ip-management/licenses/:id/revenue - Update license revenue
router.patch('/licenses/:id/revenue', (req, res) => {
  try {
    const { amount } = req.body;
    const licenseIndex = licenses.findIndex(l => l.id === req.params.id);
    
    if (licenseIndex === -1) {
      return res.status(404).json({ error: 'الترخيص غير موجود' });
    }
    
    licenses[licenseIndex].totalRevenue += amount;
    res.json(licenses[licenseIndex]);
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في تحديث عائد الترخيص' });
  }
});

// GET /api/ip-management/analytics - Get IP portfolio analytics
router.get('/analytics', (req, res) => {
  try {
    const totalPatents = patents.length;
    const grantedPatents = patents.filter(p => p.status === 'granted').length;
    const totalTrademarks = trademarks.length;
    const registeredTrademarks = trademarks.filter(t => t.status === 'registered').length;
    const totalCopyrights = copyrights.length;
    const registeredCopyrights = copyrights.filter(c => c.status === 'registered').length;
    const totalLicenses = licenses.length;
    const activeLicenses = licenses.filter(l => l.status === 'active').length;
    
    const totalIPValue = [
      ...patents.map(p => p.commercialValue),
      ...trademarks.map(t => t.usage.marketValue),
      ...copyrights.map(c => c.commercialValue)
    ].reduce((sum, value) => sum + value, 0);
    
    const totalLicenseRevenue = licenses.reduce((sum, l) => sum + l.totalRevenue, 0);
    
    const patentsByStatus = patents.reduce((acc, patent) => {
      acc[patent.status] = (acc[patent.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const patentsByCategory = patents.reduce((acc, patent) => {
      acc[patent.category] = (acc[patent.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const jurisdictionCoverage = new Set([
      ...patents.flatMap(p => p.jurisdiction),
      ...trademarks.map(t => t.jurisdiction)
    ]).size;
    
    const maintenanceFeesDue = patents.flatMap(p => p.maintenanceFees)
      .filter(f => !f.paid && new Date(f.dueDate) <= new Date(Date.now() + 90 * 24 * 60 * 60 * 1000))
      .length;
    
    const expiringTrademarks = trademarks.filter(t => 
      new Date(t.expiryDate) <= new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
    ).length;
    
    const analytics = {
      overview: {
        totalPatents,
        grantedPatents,
        totalTrademarks,
        registeredTrademarks,
        totalCopyrights,
        registeredCopyrights,
        totalLicenses,
        activeLicenses,
        totalIPValue,
        totalLicenseRevenue,
        jurisdictionCoverage
      },
      distributions: {
        patentsByStatus,
        patentsByCategory,
        licensesByType: licenses.reduce((acc, license) => {
          acc[license.type] = (acc[license.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      },
      alerts: {
        maintenanceFeesDue,
        expiringTrademarks,
        oppositions: trademarks.filter(t => t.oppositions.length > 0).length,
        infringements: copyrights.filter(c => c.infringements.length > 0).length
      },
      financial: {
        averageLicenseRevenue: totalLicenseRevenue / Math.max(totalLicenses, 1),
        averageRoyaltyRate: licenses.reduce((sum, l) => sum + l.royaltyRate, 0) / Math.max(licenses.length, 1),
        topPatentsByValue: patents
          .sort((a, b) => b.commercialValue - a.commercialValue)
          .slice(0, 5)
          .map(p => ({ title: p.title, value: p.commercialValue }))
      }
    };
    
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في جلب التحليلات' });
  }
});

// GET /api/ip-management/dashboard - Get dashboard summary
router.get('/dashboard', (req, res) => {
  try {
    const totalPatents = patents.length;
    const grantedPatents = patents.filter(p => p.status === 'granted').length;
    const totalTrademarks = trademarks.length;
    const registeredTrademarks = trademarks.filter(t => t.status === 'registered').length;
    const totalLicenses = licenses.length;
    const activeLicenses = licenses.filter(l => l.status === 'active').length;
    
    const totalIPValue = [
      ...patents.map(p => p.commercialValue),
      ...trademarks.map(t => t.usage.marketValue),
      ...copyrights.map(c => c.commercialValue)
    ].reduce((sum, value) => sum + value, 0);
    
    const totalLicenseRevenue = licenses.reduce((sum, l) => sum + l.totalRevenue, 0);
    
    const topPatents = patents
      .sort((a, b) => b.commercialValue - a.commercialValue)
      .slice(0, 5);
    
    const maintenanceAlerts = patents.flatMap(patent => 
      patent.maintenanceFees
        .filter(fee => !fee.paid && new Date(fee.dueDate) <= new Date(Date.now() + 90 * 24 * 60 * 60 * 1000))
        .map(fee => ({
          patentTitle: patent.title,
          year: fee.year,
          amount: fee.amount,
          dueDate: fee.dueDate
        }))
    ).slice(0, 5);
    
    const renewalAlerts = trademarks
      .filter(trademark => new Date(trademark.expiryDate) <= new Date(Date.now() + 180 * 24 * 60 * 60 * 1000))
      .slice(0, 5)
      .map(trademark => ({
        mark: trademark.mark,
        expiryDate: trademark.expiryDate,
        jurisdiction: trademark.jurisdiction
      }));
    
    const recentLicenses = licenses
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
      .slice(0, 5);
    
    const dashboard = {
      metrics: {
        totalPatents,
        grantedPatents,
        totalTrademarks,
        registeredTrademarks,
        totalLicenses,
        activeLicenses,
        totalIPValue,
        totalLicenseRevenue
      },
      topPatents,
      maintenanceAlerts,
      renewalAlerts,
      recentLicenses,
      performanceMetrics: {
        patentGrantRate: (grantedPatents / Math.max(totalPatents, 1)) * 100,
        trademarkRegistrationRate: (registeredTrademarks / Math.max(totalTrademarks, 1)) * 100,
        licenseSuccessRate: (activeLicenses / Math.max(totalLicenses, 1)) * 100,
        averageLicenseRevenue: totalLicenseRevenue / Math.max(activeLicenses, 1)
      }
    };
    
    res.json(dashboard);
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في جلب بيانات لوحة التحكم' });
  }
});

export default router;
