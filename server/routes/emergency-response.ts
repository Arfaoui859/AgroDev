import express from 'express';
import { z } from 'zod';

const router = express.Router();

// Mock data for demonstration
const emergencyScenarios = [
  {
    id: '1',
    name: 'موجة حارة شديدة مع جفاف',
    type: 'weather',
    severity: 'critical',
    description: 'موجة حارة استثنائية مع درجات حرارة تفوق 45°م لأكثر من 5 أيام متتالية مع نقص حاد في المياه',
    trigger_conditions: [
      'درجة حرارة أعلى من 45°م لمدة 3 أيام متتالية',
      'انخفاض مستوى المياه الجوفية تحت 50%',
      'رطوبة التربة أقل من 20%',
      'سرعة رياح أقل من 5 كم/س'
    ],
    affected_areas: ['المنطقة الشرقية', 'المنطقة الوسطى', 'الحقول المكشوفة'],
    estimated_impact: {
      financial_loss: 2500000,
      crop_damage: 75,
      area_affected: 500,
      recovery_time: '6-8 أسابيع'
    },
    response_plans: [
      {
        id: 'plan-1',
        name: 'خطة الري الطارئ',
        priority: 'critical',
        execution_time: '2-4 ساعات',
        steps: [
          {
            id: 'step-1',
            sequence: 1,
            description: 'تفعيل نظام الري الطارئ على كامل المزرعة',
            action_type: 'automatic',
            estimated_duration: '30 دقيقة',
            dependencies: [],
            equipment_needed: ['مضخات المياه الطارئة', 'شبكة الري الاحتياطية'],
            personnel_required: 2,
            completion_status: 'pending'
          },
          {
            id: 'step-2',
            sequence: 2,
            description: 'تركيب أنظمة التظليل للمحاصيل الحساسة',
            action_type: 'manual',
            estimated_duration: '2 ساعة',
            dependencies: ['step-1'],
            equipment_needed: ['شباك التظليل', 'أعمدة الدعم'],
            personnel_required: 6,
            completion_status: 'pending'
          }
        ],
        prerequisites: ['توفر المياه الطارئة', 'فريق ا��استجابة السريعة'],
        success_criteria: ['الحفاظ على 80% من المحاصيل', 'تقليل الخسائر لأقل من 30%'],
        rollback_plan: ['إيقاف الري في حالة نفاد المياه', 'التركيز على المحاصيل الأساسية'],
        estimated_cost: 150000,
        resource_requirements: ['مياه طارئة 50000 لتر', 'شباك تظليل 1000 متر'],
        responsible_team: ['مدير المزرعة', 'فريق الري', 'عمال الصيانة']
      }
    ],
    automatic_actions: [
      {
        id: 'auto-1',
        name: 'تفعيل الري التلقائي الطارئ',
        trigger_threshold: 45,
        action_type: 'irrigation_control',
        parameters: {
          irrigation_duration: 60,
          water_amount: 500,
          priority_zones: ['zone-1', 'zone-3']
        },
        execution_time: 300,
        success_rate: 95,
        last_executed: '2024-01-15T14:30:00Z',
        execution_count: 3,
        is_enabled: true
      }
    ],
    manual_actions: [
      {
        id: 'manual-1',
        title: 'تركيب أنظمة التبريد الضبابي',
        description: 'تركيب أنظمة التبريد بالرذاذ في البيوت المحمية والمناطق الحساسة',
        urgency: 'immediate',
        estimated_time: '3-4 ساعات',
        required_skills: ['تركيب الأنظمة الهيدروليكية', 'صيانة المعدات'],
        safety_requirements: ['نظارات واقية', 'قفازات مقاومة للماء'],
        tools_needed: ['مفاتيح أنابيب', 'أدوات القطع', 'مضخات الضغط'],
        instructions: [
          'فحص خطوط المياه الموجودة',
          'تركيب نقاط الرذاذ كل 3 أمتار',
          'اختبار النظام قبل التشغيل',
          'ضبط توقيت التشغيل كل 15 دقيقة'
        ],
        completion_checklist: [
          'جميع النقاط تعمل بكفاءة',
          'ضغط المياه مناسب',
          'التوقيت مضبوط صحيحاً'
        ]
      }
    ],
    resources_needed: [
      {
        id: 'resource-1',
        name: 'مياه الري الطارئة',
        type: 'chemical',
        quantity_available: 30000,
        quantity_needed: 50000,
        location: 'خزان المياه الرئيسي',
        availability_status: 'in_use',
        estimated_arrival_time: 'فوري',
        cost_per_unit: 0.5,
        supplier_contact: 'شركة المياه الوط��ية - 920001234'
      }
    ],
    success_probability: 78,
    last_activated: '2024-01-15T10:00:00Z',
    activation_count: 2,
    status: 'standby'
  },
  {
    id: '2',
    name: 'تفشي آفة المن في الطماطم',
    type: 'pest',
    severity: 'high',
    description: 'انتشار سريع لآفة المن في محصول الطماطم مع توقع خسائر كبيرة في الإنتاج',
    trigger_conditions: [
      'كشف أكثر من 50 حشرة من المن لكل نبتة',
      'انتشار في أكثر من 30% من المزرعة',
      'ظهور أعراض الذبول الفيروسي',
      'رطوبة عالية أكثر من 80%'
    ],
    affected_areas: ['بيوت الطماطم المحمية', 'الحقول المكشوفة قطاع ب'],
    estimated_impact: {
      financial_loss: 850000,
      crop_damage: 60,
      area_affected: 150,
      recovery_time: '4-6 أسابيع'
    },
    response_plans: [
      {
        id: 'plan-2',
        name: 'خطة مكافحة الآفات الطارئة',
        priority: 'high',
        execution_time: '6-8 ساعات',
        steps: [
          {
            id: 'step-3',
            sequence: 1,
            description: 'رش المبيد الحيوي على المناطق المصابة',
            action_type: 'manual',
            estimated_duration: '4 ساعات',
            dependencies: [],
            equipment_needed: ['آلات الرش', 'مبيد حيوي', 'معدات الوقاية'],
            personnel_required: 4,
            completion_status: 'pending'
          }
        ],
        prerequisites: ['توفر المبيدات المناسبة', 'فريق الرش المختص'],
        success_criteria: ['تقليل أعداد الآفات بنسبة 90%', 'منع الانتشار لمناطق جديدة'],
        rollback_plan: ['استخدام مبيدات كيميائية قوية', 'إزالة النباتات المصابة بشدة'],
        estimated_cost: 75000,
        resource_requirements: ['مبيد حيوي 500 لتر', 'معدات الرش'],
        responsible_team: ['مهندس وقاية النبات', 'فريق الرش']
      }
    ],
    automatic_actions: [
      {
        id: 'auto-2',
        name: 'تفعيل المصائد الفرمونية',
        trigger_threshold: 50,
        action_type: 'chemical_application',
        parameters: {
          trap_activation: true,
          monitoring_frequency: 'hourly'
        },
        execution_time: 600,
        success_rate: 85,
        last_executed: '2024-01-10T08:00:00Z',
        execution_count: 1,
        is_enabled: true
      }
    ],
    manual_actions: [
      {
        id: 'manual-2',
        title: 'إطلاق الأعداء الطبيعيين',
        description: 'إطلاق أبو العيد والمفترسات الطبيعية للسيطرة على آفة المن',
        urgency: 'within_hour',
        estimated_time: '2-3 ساعات',
        required_skills: ['معرفة بالمكافحة الحيوية', 'تربية الحشرات النافعة'],
        safety_requirements: ['قفازات', 'ملابس واقية خفيفة'],
        tools_needed: ['حاويات الإطلاق', 'أدوات القياس'],
        instructions: [
          'فحص جودة الحشرات النافعة',
          'تحديد نقاط الإطلاق المثلى',
          'إطلاق الحشرات في الصباح الباكر',
          'مراقبة النشاط لمدة ساعتين'
        ],
        completion_checklist: [
          'تم إطلاق العدد المحدد',
          'الحشرات نشطة وتتحرك',
          'تم توثيق نقاط الإطلاق'
        ]
      }
    ],
    resources_needed: [
      {
        id: 'resource-2',
        name: 'مبيد حيوي متخصص',
        type: 'chemical',
        quantity_available: 200,
        quantity_needed: 500,
        location: 'مخزن المبيدات',
        availability_status: 'available',
        estimated_arrival_time: '24 ساعة',
        cost_per_unit: 120,
        supplier_contact: 'شركة المبيدات الحيوية - 920005678'
      }
    ],
    success_probability: 85,
    last_activated: '2024-01-10T06:00:00Z',
    activation_count: 1,
    status: 'standby'
  },
  {
    id: '3',
    name: 'انهيار أسعار القمح المفاجئ',
    type: 'market_crash',
    severity: 'medium',
    description: 'انخفاض حاد في أسعار القمح بنسبة تزيد عن 40% خلال أسبوع واحد',
    trigger_conditions: [
      'انخفاض السعر أكثر من 40% في أسبوع',
      'زيادة المعروض العالمي بنسبة كبيرة',
      'إلغاء عقود تصدير رئيسية',
      'تغيرات في السياسات التجارية'
    ],
    affected_areas: ['جميع مزارع القمح', 'المخازن والصوامع'],
    estimated_impact: {
      financial_loss: 1200000,
      crop_damage: 0,
      area_affected: 800,
      recovery_time: '3-6 أشهر'
    },
    response_plans: [
      {
        id: 'plan-3',
        name: 'خطة التسويق الب��يل',
        priority: 'medium',
        execution_time: '1-2 أيام',
        steps: [
          {
            id: 'step-4',
            sequence: 1,
            description: 'تفعيل عقود التحوط السعري',
            action_type: 'automatic',
            estimated_duration: '1 ساعة',
            dependencies: [],
            equipment_needed: ['منصة التداول الإلكترونية'],
            personnel_required: 1,
            completion_status: 'pending'
          }
        ],
        prerequisites: ['وجود عقود تحوط نشطة', 'سيولة مالية كافية'],
        success_criteria: ['تقليل الخسائر لأقل من 20%', 'تأمين أسعار بديلة'],
        rollback_plan: ['البيع الفوري بالسعر الحالي', 'التخزين لفترة أطول'],
        estimated_cost: 50000,
        resource_requirements: ['رأس مال للتحوط', 'خبرة في التداول'],
        responsible_team: ['مدير التسويق', 'المحلل المالي']
      }
    ],
    automatic_actions: [],
    manual_actions: [
      {
        id: 'manual-3',
        title: 'البحث عن أسواق بديلة',
        description: 'التواصل مع مشترين جدد وأسواق بديلة للقمح',
        urgency: 'within_day',
        estimated_time: '8-12 ساعة',
        required_skills: ['التفاوض التجاري', 'معرفة الأسواق', 'اللغات الأجنبية'],
        safety_requirements: [],
        tools_needed: ['هاتف', 'كمبيوتر', 'عينات من المنتج'],
        instructions: [
          'مراجعة قائمة المشترين المحتملين',
          'إعداد عروض أسعار تنافسية',
          'التواصل مع الوسطاء والموزعين',
          'عرض عينات للفحص'
        ],
        completion_checklist: [
          'تم التواصل مع 10 مشترين على الأقل',
          'حصلت على 3 عروض أسعار جيدة',
          'تم إرسال العينات المطلوبة'
        ]
      }
    ],
    resources_needed: [],
    success_probability: 70,
    last_activated: '2023-12-20T09:00:00Z',
    activation_count: 0,
    status: 'standby'
  }
];

const simulations = [
  {
    id: '1',
    scenario_id: '1',
    simulation_name: 'محاكاة موجة حارة - شدة عالية',
    parameters: {
      severity: 90,
      duration: 7,
      resource_availability: 80
    },
    results: {
      success_rate: 72,
      estimated_damage: 1800000,
      response_time: 3.5,
      resource_utilization: 85,
      recommendations: [
        'زيادة مخزون المياه الطارئة',
        'تحسين أنظمة التبريد',
        'تدريب إضافي للفرق'
      ]
    },
    run_date: '2024-02-10T14:00:00Z',
    duration: 15,
    notes: 'محاكاة ناجحة مع توصيات مهمة لتحسين الاستعداد'
  },
  {
    id: '2',
    scenario_id: '2',
    simulation_name: 'محاكاة تفشي الآفات - انتشار سريع',
    parameters: {
      severity: 75,
      duration: 10,
      resource_availability: 100
    },
    results: {
      success_rate: 88,
      estimated_damage: 420000,
      response_time: 2.1,
      resource_utilization: 70,
      recommendations: [
        'تطوير أنظمة الإنذار المبكر',
        'زيادة مخزون المبيدات الحيوية',
        'تحسين برامج المراقبة'
      ]
    },
    run_date: '2024-02-08T10:30:00Z',
    duration: 12,
    notes: 'أداء ممتاز مع استجابة سريعة وفعالة'
  }
];

const emergencyContacts = [
  {
    id: '1',
    name: 'د. أحمد محمد العلي',
    role: 'مدير إدارة الطوارئ الزراعية',
    phone: '+966501234567',
    email: 'ahmed.ali@agrotech.sa',
    specialty: ['إدارة الأزمات', 'الاستجابة السريعة', 'تنسيق الفرق'],
    availability: '24/7',
    response_time: '15 دقيقة',
    location: 'الرياض - المقر الرئيسي',
    backup_contact: 'م. سارة أحمد'
  },
  {
    id: '2',
    name: 'م. محمد حسن الزهراني',
    role: 'مهندس أنظمة الري الطارئة',
    phone: '+966502345678',
    email: 'mohammed.hassan@agrotech.sa',
    specialty: ['أنظمة الري', 'إدارة المياه', 'الصيانة الطارئة'],
    availability: '24/7',
    response_time: '20 دقيقة',
    location: 'الدمام - مركز الشرقية',
    backup_contact: 'م. خالد يوسف'
  },
  {
    id: '3',
    name: 'د. فاطمة علي القحطاني',
    role: 'أخصائية وقاية النبات',
    phone: '+966503456789',
    email: 'fatima.ali@agrotech.sa',
    specialty: ['مكافحة الآفات', 'الأمراض النباتية', 'المبيدات الحيوية'],
    availability: 'business_hours',
    response_time: '30 دقيقة',
    location: 'جدة - مختبر وقاية النبات',
    backup_contact: 'د. عبدالله سالم'
  },
  {
    id: '4',
    name: 'م. عبدالرحمن سالم',
    role: 'مسؤول الأمن والسلامة',
    phone: '+966504567890',
    email: 'abdulrahman.salem@agrotech.sa',
    specialty: ['السلامة المهنية', 'إخلاء الطوارئ', 'الإس��افات الأولية'],
    availability: '24/7',
    response_time: '10 دقيقة',
    location: 'جميع المواقع - فريق متنقل',
    backup_contact: 'فريق السلامة المناوب'
  },
  {
    id: '5',
    name: 'أ. نور الهدى محمد',
    role: 'مديرة العلاقات العامة والإعلام',
    phone: '+966505678901',
    email: 'nour.mohammed@agrotech.sa',
    specialty: ['التواصل الإعلامي', 'إدارة الأزمات الإعلامية', 'العلاقات العامة'],
    availability: 'business_hours',
    response_time: '45 دقيقة',
    location: 'الرياض - قسم الإعلام',
    backup_contact: 'فريق الإعلام'
  },
  {
    id: '6',
    name: 'د. خالد يوسف أحمد',
    role: 'طبيب بيطري - صحة الحيوان',
    phone: '+966506789012',
    email: 'khalid.ahmed@agrotech.sa',
    specialty: ['صحة الحيوان', 'الأمراض المعدية', 'اللقاحات الطارئة'],
    availability: 'emergency_only',
    response_time: '40 دقيقة',
    location: 'الخرج - العيادة البيطرية',
    backup_contact: 'د. مريم عبدالله'
  }
];

// Validation schemas
const ScenarioActivationSchema = z.object({
  scenario_id: z.string(),
  activation_parameters: z.object({}).optional()
});

const SimulationSchema = z.object({
  parameters: z.object({
    severity: z.number().min(0).max(100).optional(),
    duration: z.number().min(1).max(100).optional(),
    resource_availability: z.number().min(0).max(100).optional()
  })
});

const StepStatusSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed', 'failed', 'skipped']),
  notes: z.string().optional()
});

// GET /api/emergency-response/scenarios - Get all emergency scenarios
router.get('/scenarios', (req, res) => {
  try {
    const { type, severity, status } = req.query;
    
    let filteredScenarios = [...emergencyScenarios];
    
    if (type) {
      filteredScenarios = filteredScenarios.filter(scenario => scenario.type === type);
    }
    
    if (severity) {
      filteredScenarios = filteredScenarios.filter(scenario => scenario.severity === severity);
    }
    
    if (status) {
      filteredScenarios = filteredScenarios.filter(scenario => scenario.status === status);
    }
    
    res.json(filteredScenarios);
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في جلب السيناريوهات' });
  }
});

// GET /api/emergency-response/scenarios/:id - Get specific scenario
router.get('/scenarios/:id', (req, res) => {
  try {
    const scenario = emergencyScenarios.find(s => s.id === req.params.id);
    
    if (!scenario) {
      return res.status(404).json({ error: 'السيناريو غير موجود' });
    }
    
    res.json(scenario);
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في جلب السيناريو' });
  }
});

// POST /api/emergency-response/scenarios/:id/activate - Activate emergency scenario
router.post('/scenarios/:id/activate', (req, res) => {
  try {
    const scenarioIndex = emergencyScenarios.findIndex(s => s.id === req.params.id);
    
    if (scenarioIndex === -1) {
      return res.status(404).json({ error: 'السيناريو غير موجود' });
    }
    
    // Activate the scenario
    emergencyScenarios[scenarioIndex].status = 'active';
    emergencyScenarios[scenarioIndex].last_activated = new Date().toISOString();
    emergencyScenarios[scenarioIndex].activation_count += 1;
    
    // Trigger automatic actions
    const automaticActions = emergencyScenarios[scenarioIndex].automatic_actions.filter(action => action.is_enabled);
    
    res.json({
      message: 'تم تفعيل السيناريو بنجاح',
      scenario: emergencyScenarios[scenarioIndex],
      triggered_actions: automaticActions.length,
      activation_time: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في تفعيل السيناريو' });
  }
});

// POST /api/emergency-response/scenarios/:id/simulate - Run scenario simulation
router.post('/scenarios/:id/simulate', (req, res) => {
  try {
    const validatedData = SimulationSchema.parse(req.body);
    const scenario = emergencyScenarios.find(s => s.id === req.params.id);
    
    if (!scenario) {
      return res.status(404).json({ error: 'السيناريو غير موجود' });
    }
    
    // Simulate the scenario (simplified calculation)
    const { severity = 50, duration = 5, resource_availability = 100 } = validatedData.parameters;
    
    const baseSuccessRate = scenario.success_probability;
    const severityImpact = (100 - severity) * 0.3;
    const resourceImpact = resource_availability * 0.4;
    const durationImpact = Math.max(0, (20 - duration) * 2);
    
    const success_rate = Math.min(95, Math.max(10, 
      baseSuccessRate + severityImpact + resourceImpact + durationImpact
    ));
    
    const estimated_damage = scenario.estimated_impact.financial_loss * 
      (severity / 100) * (1 - success_rate / 100);
    
    const response_time = Math.max(0.5, 5 - (resource_availability / 100) * 3);
    const resource_utilization = Math.min(100, severity + (100 - resource_availability) / 2);
    
    const simulationResult = {
      id: String(simulations.length + 1),
      scenario_id: req.params.id,
      simulation_name: `محاكاة ${scenario.name} - ${new Date().toLocaleDateString('ar-SA')}`,
      parameters: validatedData.parameters,
      results: {
        success_rate: Math.round(success_rate),
        estimated_damage: Math.round(estimated_damage),
        response_time: Math.round(response_time * 10) / 10,
        resource_utilization: Math.round(resource_utilization),
        recommendations: generateRecommendations(success_rate, estimated_damage, resource_utilization)
      },
      run_date: new Date().toISOString(),
      duration: Math.round(duration * 60), // Convert to minutes
      notes: 'محاكاة تلقائية بناءً على المعايير المحددة'
    };
    
    simulations.unshift(simulationResult);
    
    res.json({
      message: 'تم تشغيل المحاكاة بنجاح',
      simulation: simulationResult
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'بيانات غير صحيحة', details: error.errors });
    } else {
      res.status(500).json({ error: 'حدث خطأ في تشغيل المحاكاة' });
    }
  }
});

// GET /api/emergency-response/plans - Get all response plans
router.get('/plans', (req, res) => {
  try {
    const plans = emergencyScenarios.flatMap(scenario => scenario.response_plans);
    res.json(plans);
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في جلب خطط الاستجابة' });
  }
});

// PATCH /api/emergency-response/plans/:planId/steps/:stepId/status - Update step status
router.patch('/plans/:planId/steps/:stepId/status', (req, res) => {
  try {
    const validatedData = StepStatusSchema.parse(req.body);
    
    // Find the plan and step
    let planFound = false;
    let stepFound = false;
    
    for (const scenario of emergencyScenarios) {
      for (const plan of scenario.response_plans) {
        if (plan.id === req.params.planId) {
          planFound = true;
          for (const step of plan.steps) {
            if (step.id === req.params.stepId) {
              stepFound = true;
              step.completion_status = validatedData.status;
              if (validatedData.notes) {
                step.notes = validatedData.notes;
              }
              if (validatedData.status === 'completed') {
                step.completion_time = new Date().toISOString();
              }
              break;
            }
          }
          break;
        }
      }
      if (planFound) break;
    }
    
    if (!planFound) {
      return res.status(404).json({ error: 'الخطة غير موجودة' });
    }
    
    if (!stepFound) {
      return res.status(404).json({ error: 'الخطوة غير موجودة' });
    }
    
    res.json({ message: 'تم تحديث حالة الخطوة بنجاح' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'بيانات غير صحيحة', details: error.errors });
    } else {
      res.status(500).json({ error: 'حدث خطأ في تحديث حالة الخطوة' });
    }
  }
});

// GET /api/emergency-response/simulations - Get all simulations
router.get('/simulations', (req, res) => {
  try {
    const { scenario_id, limit = 10 } = req.query;
    
    let filteredSimulations = [...simulations];
    
    if (scenario_id) {
      filteredSimulations = filteredSimulations.filter(sim => sim.scenario_id === scenario_id);
    }
    
    // Sort by date and limit results
    filteredSimulations.sort((a, b) => new Date(b.run_date).getTime() - new Date(a.run_date).getTime());
    filteredSimulations = filteredSimulations.slice(0, parseInt(limit as string));
    
    res.json(filteredSimulations);
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في جلب المحاكاة' });
  }
});

// GET /api/emergency-response/contacts - Get emergency contacts
router.get('/contacts', (req, res) => {
  try {
    const { specialty, availability } = req.query;
    
    let filteredContacts = [...emergencyContacts];
    
    if (specialty) {
      filteredContacts = filteredContacts.filter(contact => 
        contact.specialty.some(spec => spec.toLowerCase().includes((specialty as string).toLowerCase()))
      );
    }
    
    if (availability) {
      filteredContacts = filteredContacts.filter(contact => contact.availability === availability);
    }
    
    res.json(filteredContacts);
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في جلب جهات الاتصال' });
  }
});

// GET /api/emergency-response/analytics - Get emergency response analytics
router.get('/analytics', (req, res) => {
  try {
    const totalScenarios = emergencyScenarios.length;
    const activeScenarios = emergencyScenarios.filter(s => s.status === 'active').length;
    const standbyScenarios = emergencyScenarios.filter(s => s.status === 'standby').length;
    
    const avgSuccessRate = emergencyScenarios.reduce((sum, s) => sum + s.success_probability, 0) / 
      Math.max(emergencyScenarios.length, 1);
    
    const totalEstimatedDamage = emergencyScenarios.reduce((sum, s) => sum + s.estimated_impact.financial_loss, 0);
    
    const scenariosByType = emergencyScenarios.reduce((acc, scenario) => {
      acc[scenario.type] = (acc[scenario.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const scenariosBySeverity = emergencyScenarios.reduce((acc, scenario) => {
      acc[scenario.severity] = (acc[scenario.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const totalSimulations = simulations.length;
    const avgSimulationSuccessRate = simulations.reduce((sum, sim) => sum + sim.results.success_rate, 0) / 
      Math.max(simulations.length, 1);
    
    const totalPlans = emergencyScenarios.reduce((sum, scenario) => sum + scenario.response_plans.length, 0);
    const totalSteps = emergencyScenarios.reduce((sum, scenario) => 
      sum + scenario.response_plans.reduce((planSum, plan) => planSum + plan.steps.length, 0), 0);
    
    const analytics = {
      overview: {
        totalScenarios,
        activeScenarios,
        standbyScenarios,
        avgSuccessRate: Math.round(avgSuccessRate * 100) / 100,
        totalEstimatedDamage,
        totalPlans,
        totalSteps
      },
      distributions: {
        scenariosByType,
        scenariosBySeverity
      },
      simulations: {
        totalSimulations,
        avgSimulationSuccessRate: Math.round(avgSimulationSuccessRate * 100) / 100,
        recentSimulations: simulations.slice(0, 5)
      },
      resources: {
        totalContacts: emergencyContacts.length,
        available24_7: emergencyContacts.filter(c => c.availability === '24/7').length,
        businessHours: emergencyContacts.filter(c => c.availability === 'business_hours').length,
        emergencyOnly: emergencyContacts.filter(c => c.availability === 'emergency_only').length
      }
    };
    
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في جلب التحليلات' });
  }
});

// Helper function to generate recommendations
function generateRecommendations(successRate: number, estimatedDamage: number, resourceUtilization: number): string[] {
  const recommendations: string[] = [];
  
  if (successRate < 70) {
    recommendations.push('تحسين خطط الاستجابة وزيادة التدريب');
    recommendations.push('مراجعة وتحديث السيناريوهات');
  }
  
  if (estimatedDamage > 1000000) {
    recommendations.push('زيادة الاستثمار في أنظمة الوقاية');
    recommendations.push('تطوير استراتيجيات التخفيف من المخاطر');
  }
  
  if (resourceUtilization > 80) {
    recommendations.push('زيادة الموارد المتاحة للطوارئ');
    recommendations.push('تحسين كفاءة استخدام الموارد');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('الأداء جيد، استمر في المراقبة والتحسين');
  }
  
  return recommendations;
}

export default router;
