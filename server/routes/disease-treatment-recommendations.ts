import express from 'express';
import { safeErrorMessage } from '../lib/errors';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

// Types and interfaces for disease treatment system
interface TreatmentStep {
  stepNumber: number;
  title: string;
  description: string;
  timing: string; // e.g., "Day 1", "Week 2", "Before symptoms"
  products: {
    productId: string;
    dosage: string;
    concentration: string;
    applicationMethod: string;
    waterVolume?: string;
  }[];
  conditions: string[];
  precautions: string[];
  expectedResults: string;
  costEstimate: number | null;
}

interface TreatmentSource {
  title: string;
  organization: string;
  url: string;
}

interface TreatmentPlan {
  planId: string;
  diseaseId: string;
  diseaseName: string;
  cropType: string;
  severity: 'Mild' | 'Moderate' | 'Severe' | 'Critical';
  approach: 'Chemical' | 'Organic' | 'Integrated' | 'Biological';
  totalDuration: number | null; // days
  totalCost: number | null; // TND
  successRate: number | null; // percentage
  steps: TreatmentStep[];
  preventionMeasures: string[];
  followUpSchedule: {
    checkDays: number[];
    monitoringPoints: string[];
    alertTriggers: string[];
  };
  emergencyActions: string[];
  createdAt: Date;
  aiConfidence: number | null;
  riskFactors: string[];
  alternativeTreatments: string[];
  recommendationType: 'curated-public-guidance';
  sources: TreatmentSource[];
}

interface TreatmentHistory {
  historyId: string;
  userId: string;
  planId: string;
  cropId: string;
  startDate: Date;
  endDate?: Date;
  status: 'Active' | 'Completed' | 'Paused' | 'Failed' | 'Cancelled';
  progress: {
    completedSteps: number[];
    currentStep: number;
    effectiveness: number | null;
    sideEffects: string[];
    farmerNotes: string[];
  };
  results: {
    diseaseEliminated: boolean | null;
    cropRecovery: number | null; // percentage
    yieldImpact: number | null; // percentage change
    costActual: number | null;
    timeToRecovery: number | null; // days
  };
  followUpAlerts: string[];
}

class AITreatmentEngine {
  private static readonly lateBlightSources: TreatmentSource[] = [
    {
      title: 'Late Blight - Tomato Pest Management Guidelines',
      organization: 'UC Statewide IPM Program',
      url: 'https://ipm.ucanr.edu/agriculture/tomato/late-blight/'
    },
    {
      title: 'Late Blight - Potato Pest Management Guidelines',
      organization: 'UC Statewide IPM Program',
      url: 'https://ipm.ucanr.edu/agriculture/potato/late-blight/'
    },
    {
      title: 'Late Blight of Tomato and Potato',
      organization: 'University of Connecticut Extension',
      url: 'https://homegarden.cahnr.uconn.edu/factsheets/late-blight-of-tomato-and-potato/'
    },
    {
      title: 'Late Blight of Tomato and Potato',
      organization: 'Virginia Cooperative Extension',
      url: 'https://ext.vt.edu/content/pubs_ext_vt_edu/en/ANR/ANR-6/ANR-6.html'
    }
  ];

  // Available crops. Listing a crop does not imply treatment coverage.
  private static readonly cropCatalog = [
    { cropType: 'wheat', cropName: 'القمح الصلب' },
    { cropType: 'olive', cropName: 'الزيتون' },
    { cropType: 'tomato', cropName: 'الطماطم' },
    { cropType: 'citrus', cropName: 'الحمضيات' },
    { cropType: 'potato', cropName: 'البطاطا' },
    { cropType: 'pepper', cropName: 'الفلفل الحار' }
  ];

  static getCatalog() {
    return {
      crops: this.cropCatalog,
      supportedPairs: this.getSupportedPairs()
    };
  }

  private static readonly supportedPairs = {
    'tomato:late_blight': {
      cropName: 'الطماطم',
      diseaseName: 'اللفحة المتأخرة',
      cropActions: [
        'افحص الأوراق والسيقان والثمار، خاصة البقع المائية التي تتحول بسرعة إلى مناطق بنية أو أرجوانية.',
        'أزل النباتات أو الأجزاء المصابة في ظروف جافة، وتجنب نقلها بين أجزاء الحقل.',
        'تخلّص من المواد النباتية المصابة بطريقة آمنة؛ لا تضعها في كومة السماد.',
        'أزل نباتات الطماطم والبطاطا المتطوعة والأعشاب العائلة القريبة التي يمكن أن تحفظ مصدر العدوى.',
        'استعمل شتلات سليمة، ووفّر مسافات تسمح بحركة الهواء وجفاف الأوراق.'
      ]
    },
    'potato:late_blight': {
      cropName: 'البطاطا',
      diseaseName: 'اللفحة المتأخرة',
      cropActions: [
        'افحص الأوراق والسيقان بانتظام، وانتبه أيضاً إلى وجود تعفن بني متماسك في الدرنات.',
        'راقب مصادر العدوى المحتملة مثل الدرنات المصابة، أكوام البطاطا المرفوضة والنباتات المتطوعة.',
        'استعمل درنات بذور معتمدة وسليمة، وتجنب الاحتفاظ بدرنات تظهر عليها أعراض الإصابة.',
        'أزل مصادر العدوى والنباتات المصابة بطريقة آمنة وفق الإرشادات الزراعية المحلية.',
        'حافظ على جفاف المجموع الخضري قدر الإمكان، وتجنب الري بالرش عندما تتوفر بدائل مناسبة.'
      ]
    }
  } as const;

  static getSupportedPairs() {
    return Object.entries(this.supportedPairs).map(([key, entry]) => {
      const [cropType, diseaseId] = key.split(':');

      return {
        cropType,
        diseaseId,
        cropName: entry.cropName,
        diseaseName: entry.diseaseName
      };
    });
  }

  static generateTreatmentPlan(
    diseaseId: string,
    cropType: string,
    severity: 'Mild' | 'Moderate' | 'Severe' | 'Critical'
  ): TreatmentPlan | null {
    const key = `${cropType}:${diseaseId}`;
    const entry = this.supportedPairs[key as keyof typeof this.supportedPairs];

    if (!entry) return null;

    const steps: TreatmentStep[] = [
      {
        stepNumber: 1,
        title: 'تأكيد التشخيص وتقييم الحقل',
        description:
          'اللفحة المتأخرة قد تتطور بسرعة. وثّق الأعراض بالصور، وسجّل تاريخ ظهورها والظروف المناخية والري. أكّد التشخيص مع مهندس زراعي أو مخبر مختص قبل اتخاذ تدخل علاجي.',
        timing: 'عند ظهور الأعراض وقبل أي تدخل',
        products: [],
        conditions: [
          'افحص عدة نباتات من مناطق مختلفة في الحقل',
          'سجّل انتشار الأعراض وتطورها',
          'لا تعتمد على صورة واحدة لتأكيد التشخيص'
        ],
        precautions: [
          'هذه إرشادات زراعية عامة وليست وصفة مبيدات',
          'تجنب نقل النباتات أو العمل بينها وهي مبللة'
        ],
        expectedResults:
          'توثيق الحالة وتحسين دقة التقييم؛ لا توجد نتيجة علاجية مضمونة',
        costEstimate: null
      },
      {
        stepNumber: 2,
        title: 'تقليل ظروف انتشار المرض',
        description:
          'قلّل مدة بقاء الأوراق مبللة، وتجنب الري بالرش متى أمكن. حسّن التهوية والمسافات بين النباتات، ونظّم الري بحيث لا تبقى الأوراق مبللة طوال الليل.',
        timing: 'ابدأ فوراً وواصل تطبيق الممارسات المناسبة',
        products: [],
        conditions: [
          'راقب الرطوبة والأمطار والندى',
          'تحقق من نظام الري وطريقة توزيع المياه'
        ],
        precautions: [
          'لا تغيّر نظام الري بطريقة تضر باحتياجات المحصول المائية',
          'اختَر التدخلات وفق ظروف الحقل والتربة والمناخ'
        ],
        expectedResults:
          'تقليل الظروف الملائمة لانتشار المرض، وليس ضمان القضاء عليه',
        costEstimate: null
      },
      {
        stepNumber: 3,
        title: 'إدارة النباتات ومصادر العدوى',
        description: entry.cropActions.join(' '),
        timing: 'بعد التقييم، مع متابعة مستمرة',
        products: [],
        conditions: [
          'ميّز النباتات المصابة عن السليمة قبل الإزالة',
          'وثّق عمليات الإزالة والتخلص من المخلفات'
        ],
        precautions: [
          'لا تنقل المخلفات المصابة عبر الحقل دون احتياطات',
          'استشر مختصاً بشأن طريقة التخلص المناسبة محلياً'
        ],
        expectedResults:
          'المساعدة على خفض مصادر العدوى والحد من انتشارها',
        costEstimate: null
      },
      {
        stepNumber: 4,
        title: 'المتابعة وإعادة التقييم',
        description:
          'راقب تطور الأعراض وانتشارها إلى نباتات أو أجزاء جديدة. إذا استمر الانتشار أو ظهرت إصابة شديدة، اطلب تقييماً عاجلاً من مهندس زراعي مختص.',
        timing: 'متابعة متكررة، ويومياً عند توافر ظروف ملائمة للمرض',
        products: [],
        conditions: [
          'سجّل عدد النباتات التي ظهرت عليها أعراض جديدة',
          'راقب الأوراق والسيقان والثمار أو الدرنات حسب المحصول'
        ],
        precautions: [
          'لا تعتبر توقف ظهور أعراض جديدة دليلاً وحده على الشفاء',
          'لا تستخدم مبيداً أو جرعة دون التثبت من التسجيل والملصق المعتمد في تونس'
        ],
        expectedResults:
          'توفير سجل متابعة يساعد المختص على تقييم تطور الحالة',
        costEstimate: null
      }
    ];

    return {
      planId: `plan_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      diseaseId,
      diseaseName: entry.diseaseName,
      cropType,
      severity,
      // Only non-chemical cultural guidance is provided by this knowledge base.
      approach: 'Integrated',
      totalDuration: null,
      totalCost: null,
      successRate: null,
      steps,
      preventionMeasures: [
        'استعمل شتلات أو درنات بذور سليمة ومعتمدة',
        'تجنب الري بالرش عندما تتوفر بدائل مناسبة',
        'حافظ على تهوية جيدة وجفاف أسرع للأوراق',
        'أزل النباتات المتطوعة وبقايا المحصول ومصادر العدوى',
        'راقب الحقل بانتظام، خاصة أثناء الطقس الرطب والمعتدل'
      ],
      followUpSchedule: {
        checkDays: [],
        monitoringPoints: [
          'ظهور بقع مائية أو بنية جديدة على الأوراق',
          'انتشار الأعراض إلى السيقان أو الثمار',
          'ظهور تعفن في درنات البطاطا',
          'الرطوبة ومدة بقاء الأوراق مبللة',
          'ظهور نباتات متطوعة أو مصادر عدوى قريبة'
        ],
        alertTriggers: [
          'انتشار سريع للأعراض إلى نباتات جديدة',
          'ظهور إصابة على السيقان أو الثمار أو الدرنات',
          'استمرار ظروف رطبة مع تزايد الأعراض',
          'عدم القدرة على تأكيد التشخيص'
        ]
      },
      emergencyActions: [
        'اطلب تقييماً عاجلاً من مهندس زراعي عند الانتشار السريع',
        'وثّق الأعراض ومناطق انتشارها قبل التدخل',
        'لا تستعمل مبيدات أو جرعات غير متحقق من تسجيلها وملصقها في تونس'
      ],
      createdAt: new Date(),
      aiConfidence: null,
      riskFactors: [
        'المرض قد ينتشر بسرعة في الظروف الرطبة والمعتدلة',
        'التشخيص بالصور وحدها لا يؤكد وجود الممرض',
        'فعالية أي تدخل تتأثر بالظروف المحلية وتوقيت اكتشاف الإصابة'
      ],
      alternativeTreatments: [],
      recommendationType: 'curated-public-guidance',
      sources: [...this.lateBlightSources]
    };
  }
}

// Mock database for treatment history
let treatmentHistoryDB: TreatmentHistory[] = [];

// API Routes

// Return the crop catalog and evidence-backed treatment pairs.
router.get('/catalog', (_req, res) => {
  res.set('X-Data-Provenance', 'curated-treatment-catalog');
  res.set('X-Is-Real-Data', 'false');

  return res.json({
    success: true,
    dataSource: 'curated-treatment-catalog',
    isRealData: false,
    data: AITreatmentEngine.getCatalog()
  });
});

// Generate treatment recommendation
router.post('/recommend', (req, res) => {
  try {
    const body = req.body || {};
    const { diseaseId, diseaseName, cropType, severity } = body;

    if (
      typeof diseaseId !== 'string' || !diseaseId.trim() ||
      typeof diseaseName !== 'string' || !diseaseName.trim() ||
      typeof cropType !== 'string' || !cropType.trim() ||
      typeof severity !== 'string'
    ) {
      return res.status(400).json({
        success: false,
        message: 'معرّف المرض واسم المرض والمحصول وشدة الإصابة مطلوبة'
      });
    }

    const normalizedDiseaseId = diseaseId.trim().toLowerCase();
    const normalizedCropType = cropType.trim().toLowerCase();
    const allowedSeverities = ['Mild', 'Moderate', 'Severe', 'Critical'];

    if (!allowedSeverities.includes(severity)) {
      return res.status(400).json({
        success: false,
        message: 'درجة شدة الإصابة غير صالحة'
      });
    }

    const treatmentPlan = AITreatmentEngine.generateTreatmentPlan(
      normalizedDiseaseId,
      normalizedCropType,
      severity as TreatmentPlan['severity']
    );

    if (!treatmentPlan) {
      res.set('X-Data-Provenance', 'unsupported-knowledge-pair');
      res.set('X-Is-Real-Data', 'false');

      return res.status(422).json({
        success: false,
        data: null,
        dataSource: 'unsupported',
        isRealData: false,
        supportedPairs: AITreatmentEngine.getSupportedPairs(),
        message:
          'لا توجد حالياً إرشادات موثّقة لهذه التركيبة من المرض والمحصول. لم يتم إنشاء خطة لتجنب تقديم توصيات غير مثبتة.'
      });
    }

    res.set('X-Data-Provenance', 'public-extension-guidance');
    res.set('X-Is-Real-Data', 'false');

    return res.json({
      success: true,
      dataSource: 'public-extension-guidance',
      isRealData: false,
      data: treatmentPlan,
      message: 'تم إنشاء خطة إرشادية اعتماداً على مصادر زراعية منشورة'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'فشل في إنشاء التوصية الزراعية',
      error: safeErrorMessage(error, 'تعذّر تنفيذ العملية')
    });
  }
});

// Get treatment products
router.get('/products', (_req, res) => {
  res.set('X-Data-Provenance', 'unavailable');
  res.set('X-Is-Real-Data', 'false');

  return res.json({
    success: true,
    data: [],
    total: 0,
    dataSource: 'unavailable',
    isRealData: false,
    message: 'لا توجد حالياً قائمة منتجات موثّقة. لن يتم اقتراح منتجات أو جرعات قبل التحقق من التسجيل والملصق المعتمد والاستعمال المسموح.'
  });
});


// History is held in memory only. It is not durable database storage.
const setHistoryProvenance = (res: express.Response) => {
  res.set('X-Data-Provenance', 'session-user-reported');
  res.set('X-Is-Real-Data', 'false');
};

// List only the authenticated user's history.
router.get('/history', requireAuth, (req, res) => {
  setHistoryProvenance(res);
  try {
    const { status, cropId } = req.query;
    let records = treatmentHistoryDB.filter(h => h.userId === req.userId);

    if (typeof status === 'string') records = records.filter(h => h.status === status);
    if (typeof cropId === 'string') records = records.filter(h => h.cropId === cropId);

    records.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    return res.json({ success: true, data: records, total: records.length });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'فشل في جلب تاريخ العلاجات',
      error: safeErrorMessage(error, 'تعذّر تنفيذ العملية')
    });
  }
});

// Retrieve one record owned by the authenticated user.
router.get('/history/:historyId', requireAuth, (req, res) => {
  setHistoryProvenance(res);
  const record = treatmentHistoryDB.find(
    h => h.historyId === req.params.historyId && h.userId === req.userId
  );
  if (!record) {
    return res.status(404).json({ success: false, message: 'سجل العلاج غير موجود' });
  }
  return res.json({ success: true, data: record });
});

// Start a session-only treatment observation record.
router.post('/start', requireAuth, (req, res) => {
  setHistoryProvenance(res);
  try {
    const { planId, cropId } = req.body || {};
    if (typeof planId !== 'string' || !planId.trim() ||
        typeof cropId !== 'string' || !cropId.trim()) {
      return res.status(400).json({
        success: false,
        message: 'معرّف الخطة والمحصول مطلوبان'
      });
    }

    const historyEntry: TreatmentHistory = {
      historyId: `hist_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      userId: req.userId!,
      planId,
      cropId,
      startDate: new Date(),
      status: 'Active',
      progress: {
        completedSteps: [],
        currentStep: 1,
        effectiveness: null,
        sideEffects: [],
        farmerNotes: []
      },
      results: {
        diseaseEliminated: null,
        cropRecovery: null,
        yieldImpact: null,
        costActual: null,
        timeToRecovery: null
      },
      followUpAlerts: []
    };

    treatmentHistoryDB.push(historyEntry);
    return res.status(201).json({ success: true, data: historyEntry });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'فشل في بدء سجل المتابعة',
      error: safeErrorMessage(error, 'تعذّر تنفيذ العملية')
    });
  }
});

// Update only validated, user-reported progress.
router.patch('/progress/:historyId', requireAuth, (req, res) => {
  setHistoryProvenance(res);
  try {
    const history = treatmentHistoryDB.find(
      h => h.historyId === req.params.historyId && h.userId === req.userId
    );
    if (!history) {
      return res.status(404).json({ success: false, message: 'سجل العلاج غير موجود' });
    }

    const { stepCompleted, effectiveness, notes, sideEffects } = req.body || {};

    if (stepCompleted !== undefined &&
        (!Number.isInteger(stepCompleted) || stepCompleted < 1)) {
      return res.status(400).json({ success: false, message: 'رقم الخطوة غير صالح' });
    }
    if (effectiveness !== undefined && effectiveness !== null &&
        (typeof effectiveness !== 'number' || !Number.isFinite(effectiveness) ||
         effectiveness < 0 || effectiveness > 100)) {
      return res.status(400).json({ success: false, message: 'قيمة التقييم يجب أن تكون بين 0 و100' });
    }
    if (notes !== undefined && typeof notes !== 'string') {
      return res.status(400).json({ success: false, message: 'الملاحظات يجب أن تكون نصاً' });
    }
    if (sideEffects !== undefined &&
        (!Array.isArray(sideEffects) || !sideEffects.every((v: unknown) => typeof v === 'string'))) {
      return res.status(400).json({ success: false, message: 'قائمة الأعراض الجانبية غير صالحة' });
    }

    if (stepCompleted !== undefined && !history.progress.completedSteps.includes(stepCompleted)) {
      history.progress.completedSteps.push(stepCompleted);
      history.progress.currentStep = Math.max(history.progress.currentStep, stepCompleted + 1);
    }
    if (effectiveness !== undefined) history.progress.effectiveness = effectiveness;
    if (typeof notes === 'string' && notes.trim()) {
      history.progress.farmerNotes.push(`${new Date().toLocaleDateString('ar-EG')}: ${notes.trim()}`);
    }
    if (sideEffects !== undefined) history.progress.sideEffects.push(...sideEffects);

    return res.json({ success: true, data: history });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'فشل في تحديث تقدم المتابعة',
      error: safeErrorMessage(error, 'تعذّر تنفيذ العملية')
    });
  }
});

// Complete a record using only explicit, validated user-reported values.
router.post('/complete/:historyId', requireAuth, (req, res) => {
  setHistoryProvenance(res);
  try {
    const history = treatmentHistoryDB.find(
      h => h.historyId === req.params.historyId && h.userId === req.userId
    );
    if (!history) {
      return res.status(404).json({ success: false, message: 'سجل العلاج غير موجود' });
    }

    const results = req.body?.results;
    if (!results || typeof results !== 'object' || Array.isArray(results)) {
      return res.status(400).json({ success: false, message: 'بيانات النتائج مطلوبة' });
    }

    const numericRules: Record<string, { min: number; max: number }> = {
      cropRecovery: { min: 0, max: 100 },
      yieldImpact: { min: -100, max: 100 },
      costActual: { min: 0, max: Number.MAX_SAFE_INTEGER },
      timeToRecovery: { min: 0, max: Number.MAX_SAFE_INTEGER }
    };

    for (const [key, rule] of Object.entries(numericRules)) {
      const value = results[key];
      if (value !== undefined && value !== null &&
          (typeof value !== 'number' || !Number.isFinite(value) ||
           value < rule.min || value > rule.max)) {
        return res.status(400).json({ success: false, message: `القيمة ${key} غير صالحة` });
      }
    }
    if (results.diseaseEliminated !== undefined &&
        results.diseaseEliminated !== null &&
        typeof results.diseaseEliminated !== 'boolean') {
      return res.status(400).json({ success: false, message: 'قيمة diseaseEliminated غير صالحة' });
    }

    for (const key of ['diseaseEliminated', ...Object.keys(numericRules)]) {
      if (Object.prototype.hasOwnProperty.call(results, key)) {
        (history.results as any)[key] = results[key];
      }
    }

    history.status = 'Completed';
    history.endDate = new Date();
    return res.json({ success: true, data: history });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'فشل في إنهاء سجل المتابعة',
      error: safeErrorMessage(error, 'تعذّر تنفيذ العملية')
    });
  }
});

// Counts are available; outcome metrics remain unknown until real reports exist.
router.get('/stats', requireAuth, (req, res) => {
  setHistoryProvenance(res);
  try {
    const records = treatmentHistoryDB.filter(h => h.userId === req.userId);
    return res.json({
      success: true,
      data: {
        totalTreatments: records.length,
        completed: records.filter(h => h.status === 'Completed').length,
        active: records.filter(h => h.status === 'Active').length,
        successRate: null,
        averageRecovery: null,
        totalCost: null,
        averageDuration: null
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'فشل في جلب إحصائيات المتابعة',
      error: safeErrorMessage(error, 'تعذّر تنفيذ العملية')
    });
  }
});

export default router;
