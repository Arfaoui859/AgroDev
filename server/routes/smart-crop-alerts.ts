import express from "express";

const router = express.Router();

// Types and interfaces for smart crop alerts
interface AlertData {
  alertId: string;
  userId: string;
  cropId?: string;
  type:
    | "Irrigation"
    | "Disease"
    | "Weather"
    | "Market"
    | "Fertilizer"
    | "Pest"
    | "Harvest"
    | "Planting"
    | "Treatment"
    | "TreatmentReminder"
    | "TreatmentFollow"
    | "IrrigationSchedule"
    | "IrrigationFailure"
    | "WaterBudget"
    | "SoilMoisture";
  title: string;
  description: string;
  priority: "High" | "Medium" | "Low";
  status: "Unread" | "Seen" | "Resolved" | "Dismissed";
  createdAt: Date;
  scheduledFor?: Date;
  relatedData?: {
    source: string;
    temperature?: number;
    humidity?: number;
    diseaseConfidence?: number;
    marketPrice?: number;
    soilMoisture?: number;
    treatmentId?: string;
    treatmentStep?: number;
    treatmentProgress?: number;
    irrigationId?: string;
    waterAmount?: number;
    duration?: number;
    efficiency?: number;
    [key: string]: any;
  };
  actionSuggestions: string[];
  urgencyScore: number;
}

interface TaskData {
  taskId: string;
  userId: string;
  cropId?: string;
  title: string;
  description: string;
  type: "Daily" | "Weekly" | "Monthly" | "Seasonal" | "OneTime";
  category:
    | "Irrigation"
    | "Fertilizer"
    | "Pesticide"
    | "Pruning"
    | "Harvest"
    | "Planting"
    | "Soil"
    | "General";
  priority: "High" | "Medium" | "Low";
  status: "Pending" | "InProgress" | "Completed" | "Overdue" | "Cancelled";
  scheduledDate: Date;
  estimatedDuration: number; // minutes
  createdAt: Date;
  completedAt?: Date;
  isRecurring: boolean;
  recurrencePattern?: {
    frequency: "Daily" | "Weekly" | "Monthly";
    interval: number;
    endDate?: Date;
  };
  cropStage?: string;
  weatherDependency?: boolean;
}

// Mock database - In production, use MongoDB or PostgreSQL
let alertsDB: AlertData[] = [
  {
    alertId: "alert-001",
    userId: "user-123",
    cropId: "crop-tomato-01",
    type: "Weather",
    title: "🚨 موجة حر متوقعة غداً",
    description:
      "درجة الحرارة ستصل إلى 43°م غداً. قم بري الطماطم فوراً لتجنب التلف وحماية المحصول.",
    priority: "High",
    status: "Unread",
    createdAt: new Date("2024-01-15T06:00:00Z"),
    scheduledFor: new Date("2024-01-16T08:00:00Z"),
    relatedData: {
      source: "WeatherService",
      temperature: 43,
      humidity: 12,
      windSpeed: 15,
    },
    actionSuggestions: [
      "قم بري المحاصيل في الصباح الباكر (6-8 صباحاً)",
      "استخدم الري بالتنقيط لتوفير المياه",
      "ضع شباك الظل إذا كان متوفراً",
      "تجنب الري في وقت الظهيرة",
    ],
    urgencyScore: 0.89,
  },
  {
    alertId: "alert-002",
    userId: "user-123",
    cropId: "crop-wheat-02",
    type: "Disease",
    title: "⚠️ اشتباه في إصابة بمرض الصدأ",
    description:
      "تم اكتشاف أعراض مبكرة لمرض الصدأ في حقل القمح. ينصح بالفحص الفوري والعلاج.",
    priority: "High",
    status: "Seen",
    createdAt: new Date("2024-01-14T14:30:00Z"),
    relatedData: {
      source: "AIPlantScan",
      diseaseConfidence: 0.87,
      affectedArea: "15%",
      diseaseType: "Rust",
    },
    actionSuggestions: [
      "قم بفحص النباتات المصابة فوراً",
      "اعزل المنطقة المصابة عن باقي المحصول",
      "استخدم المبيد الفطري المناسب",
      "اتصل بخبير زراعي للاستشارة",
    ],
    urgencyScore: 0.92,
  },
  {
    alertId: "alert-003",
    userId: "user-123",
    type: "Market",
    title: "📈 ارتفاع أسعار الطماطم",
    description:
      "ارتفعت أسعار الطماطم بنسبة 25% في السوق المحلي. قد يكون الوقت مناسباً للبيع.",
    priority: "Medium",
    status: "Unread",
    createdAt: new Date("2024-01-15T10:15:00Z"),
    relatedData: {
      source: "MarketService",
      marketPrice: 3.25,
      priceChange: 0.65,
      marketTrend: "rising",
    },
    actionSuggestions: [
      "فكر في بيع جزء من المحصول الآن",
      "راقب الأسعار للأيام القادمة",
      "تحقق من جودة المحصول قبل البيع",
      "تواصل مع التجار المحليين",
    ],
    urgencyScore: 0.65,
  },
  {
    alertId: "alert-004",
    userId: "user-123",
    cropId: "crop-tomato-01",
    type: "TreatmentReminder",
    title: "💊 تذكير: موعد العلاج الثاني",
    description:
      "حان وقت تطبيق الخطوة الثانية من خطة علاج اللفحة المتأخرة. قم برش المبيد الفطري حسب الجدول.",
    priority: "High",
    status: "Unread",
    createdAt: new Date("2024-01-16T06:00:00Z"),
    scheduledFor: new Date("2024-01-16T08:00:00Z"),
    relatedData: {
      source: "TreatmentTracker",
      treatmentId: "hist-001",
      treatmentStep: 2,
      treatmentProgress: 50,
    },
    actionSuggestions: [
      "قم برش المبيد الفطري كما هو محدد في الخطة",
      "تأكد من الظروف الجوية المناسبة للرش",
      "ارتدي معدات الحماية الشخصية",
      "سجل تاريخ ووقت تطبيق العلاج",
    ],
    urgencyScore: 0.85,
  },
  {
    alertId: "alert-005",
    userId: "user-123",
    cropId: "crop-tomato-01",
    type: "TreatmentFollow",
    title: "📋 متابعة: فحص فعالية العلاج",
    description:
      "مضى 7 أيام على بدء العلاج. حان وقت فحص مدى تحسن النباتات و��قييم فعالية العلاج.",
    priority: "Medium",
    status: "Unread",
    createdAt: new Date("2024-01-17T09:00:00Z"),
    relatedData: {
      source: "TreatmentTracker",
      treatmentId: "hist-001",
      treatmentStep: 1,
      treatmentProgress: 75,
    },
    actionSuggestions: [
      "افحص النباتات المعالجة بعناية",
      "قيّم مدى تحسن الأعراض",
      "سجل ملاحظاتك في نظام المتابعة",
      "ا��تقط صوراً للمقارنة مع الحالة السابقة",
    ],
    urgencyScore: 0.7,
  },
  {
    alertId: "alert-006",
    userId: "user-123",
    cropId: "crop-wheat-02",
    type: "Treatment",
    title: "⚠️ تأخير في العلاج المجدول",
    description:
      "لم يتم تطبيق العلاج المجدول منذ يومين. قد يؤثر هذا التأخير على فعالية الخطة العلاجية.",
    priority: "High",
    status: "Unread",
    createdAt: new Date("2024-01-18T07:30:00Z"),
    relatedData: {
      source: "TreatmentTracker",
      treatmentId: "hist-002",
      treatmentStep: 3,
      treatmentProgress: 25,
      delayDays: 2,
    },
    actionSuggestions: [
      "تطبيق العلاج فوراً إذا كانت الظروف مناسبة",
      "مراجعة سبب التأخير وتجنبه مستقبلاً",
      "استشر خبير إذا كان التأخير كبيراً",
      "تحديث الجدول الزمني حسب الحاجة",
    ],
    urgencyScore: 0.9,
  },
  {
    alertId: "alert-007",
    userId: "user-123",
    cropId: "crop-tomato-01",
    type: "SoilMoisture",
    title: "💧 انخفاض خطير في رطوبة التربة",
    description:
      "انخفضت رطوبة التربة إلى 45% وهي تحت الحد الحرج للطماطم. ينصح بالري الفوري لتجنب الضرر.",
    priority: "High",
    status: "Unread",
    createdAt: new Date("2024-01-19T06:15:00Z"),
    scheduledFor: new Date("2024-01-19T07:00:00Z"),
    relatedData: {
      source: "SmartIrrigation",
      soilMoisture: 45,
      criticalLevel: 65,
      irrigationId: "schedule-001",
      waterAmount: 300,
      duration: 45,
    },
    actionSuggestions: [
      "ابدأ الري فوراً لمدة 45 دقيقة",
      "تحقق من عمل نظام الري التلقائي",
      "راقب مستوى الرطوبة بعد الري",
      "اضبط جدول الري لمنع تكرار المشكلة",
    ],
    urgencyScore: 0.95,
  },
  {
    alertId: "alert-008",
    userId: "user-123",
    cropId: "crop-olive-01",
    type: "IrrigationSchedule",
    title: "⏰ تذكير: موعد الري المجدول",
    description:
      "حان وقت الري المجدول لبستان الزيتون. الظروف الجوية مناسبة والتربة تحتاج ري.",
    priority: "Medium",
    status: "Unread",
    createdAt: new Date("2024-01-19T08:30:00Z"),
    scheduledFor: new Date("2024-01-19T09:00:00Z"),
    relatedData: {
      source: "SmartIrrigation",
      irrigationId: "schedule-002",
      waterAmount: 400,
      duration: 60,
      soilMoisture: 52,
      weatherTemp: 22,
    },
    actionSuggestions: [
      "ابدأ الري حسب الجدول المحدد",
      "تأكد من عمل جميع خطوط الري",
      "راقب توزيع المياه في البستان",
      "سجل وقت بدء ونهاية الري",
    ],
    urgencyScore: 0.7,
  },
  {
    alertId: "alert-009",
    userId: "user-123",
    type: "WaterBudget",
    title: "📊 تجاوز الميزانية المائية الأسبوعية",
    description:
      "تم استهلاك 95% من الميزانية المائية المخصصة لهذا الأسبوع. يُنصح بمراجعة جداول الري.",
    priority: "Medium",
    status: "Unread",
    createdAt: new Date("2024-01-19T10:00:00Z"),
    relatedData: {
      source: "SmartIrrigation",
      budgetUsed: 95,
      totalBudget: 5000,
      remainingBudget: 250,
      daysLeft: 2,
    },
    actionSuggestions: [
      "راجع كفاءة نظام الري الحالي",
      "أجل الري غير الضروري ليوم غد",
      "تحقق من وجود تسريبات في النظام",
      "اضبط جداول الري للأسبوع القادم",
    ],
    urgencyScore: 0.65,
  },
];

let tasksDB: TaskData[] = [
  {
    taskId: "task-001",
    userId: "user-123",
    cropId: "crop-tomato-01",
    title: "ري الطماطم الصباحي",
    description: "��ي حقل الطماطم في الص��اح الباكر لتجنب التبخر العالي",
    type: "Daily",
    category: "Irrigation",
    priority: "High",
    status: "Pending",
    scheduledDate: new Date("2024-01-16T07:00:00Z"),
    estimatedDuration: 45,
    createdAt: new Date("2024-01-15T12:00:00Z"),
    isRecurring: true,
    recurrencePattern: {
      frequency: "Daily",
      interval: 1,
    },
    cropStage: "Flowering",
    weatherDependency: true,
  },
  {
    taskId: "task-002",
    userId: "user-123",
    cropId: "crop-wheat-02",
    title: "فحص أعراض الأمراض",
    description: "فحص دوري ل��كتشاف أي أعراض مبكرة للأمراض في حقل القمح",
    type: "Weekly",
    category: "General",
    priority: "Medium",
    status: "Pending",
    scheduledDate: new Date("2024-01-16T09:00:00Z"),
    estimatedDuration: 60,
    createdAt: new Date("2024-01-10T08:00:00Z"),
    isRecurring: true,
    recurrencePattern: {
      frequency: "Weekly",
      interval: 1,
    },
    cropStage: "Vegetative",
    weatherDependency: false,
  },
  {
    taskId: "task-003",
    userId: "user-123",
    cropId: "crop-tomato-01",
    title: "إضافة السماد النيتروجيني",
    description:
      "إضافة السماد النيتروجيني لنباتات الطماطم في مرحلة النمو النشط",
    type: "Weekly",
    category: "Fertilizer",
    priority: "Medium",
    status: "Completed",
    scheduledDate: new Date("2024-01-14T08:00:00Z"),
    estimatedDuration: 30,
    createdAt: new Date("2024-01-12T10:00:00Z"),
    completedAt: new Date("2024-01-14T08:45:00Z"),
    isRecurring: true,
    recurrencePattern: {
      frequency: "Weekly",
      interval: 2,
    },
    cropStage: "Vegetative",
    weatherDependency: false,
  },
];

// AI Priority Scoring Engine
class AlertPriorityEngine {
  static calculateUrgencyScore(alertData: Partial<AlertData>): number {
    let score = 0;

    // Base priority weights
    const priorityWeights = {
      High: 0.8,
      Medium: 0.5,
      Low: 0.2,
    };

    score += priorityWeights[alertData.priority || "Low"];

    // Type-specific scoring
    const typeWeights = {
      Disease: 0.9,
      Weather: 0.8,
      Irrigation: 0.7,
      Pest: 0.8,
      Market: 0.4,
      Fertilizer: 0.5,
      Harvest: 0.6,
      Planting: 0.5,
    };

    score += typeWeights[alertData.type || "Market"] * 0.3;

    // Environmental risk factors
    if (alertData.relatedData) {
      const data = alertData.relatedData;

      // Temperature extremes
      if (data.temperature && (data.temperature > 40 || data.temperature < 5)) {
        score += 0.2;
      }

      // Low humidity (drought risk)
      if (data.humidity && data.humidity < 20) {
        score += 0.15;
      }

      // High disease confidence
      if (data.diseaseConfidence && data.diseaseConfidence > 0.8) {
        score += 0.25;
      }

      // Low soil moisture
      if (data.soilMoisture && data.soilMoisture < 30) {
        score += 0.2;
      }
    }

    // Time sensitivity
    if (alertData.scheduledFor) {
      const hoursUntilScheduled =
        (alertData.scheduledFor.getTime() - Date.now()) / (1000 * 60 * 60);
      if (hoursUntilScheduled < 24) {
        score += 0.1;
      }
      if (hoursUntilScheduled < 6) {
        score += 0.2;
      }
    }

    return Math.min(1.0, score);
  }

  static generateActionSuggestions(
    alertType: string,
    relatedData?: any,
  ): string[] {
    const suggestions: { [key: string]: string[] } = {
      Weather: [
        "راقب التوقعات الجوية بانتظام",
        "قم بتعديل جدول الري حسب الطقس",
        "احم المحاصيل من الظروف القاسية",
        "تأكد من تصريف المياه في حا��ة الأمطار",
      ],
      Disease: [
        "اعزل النباتات المصابة فوراً",
        "استخدم العلاج المناسب",
        "اتصل بخبير زراعي",
        "راقب انتشار المرض",
      ],
      Irrigation: [
        "تحقق من نظام الري",
        "اضبط كمية المياه حسب المرحلة",
        "راقب رطوبة التربة",
        "تجنب الري المفرط",
      ],
      Market: [
        "راقب تقلبات الأسعار",
        "فكر في توقيت البيع",
        "تحقق من جودة المحصول",
        "تواصل مع المشترين",
      ],
      Fertilizer: [
        "اتبع جدول التسميد المناسب",
        "قم بتحليل التربة",
        "استخدم الأسمدة ال��ناسبة",
        "راقب استجابة النباتات",
      ],
      Treatment: [
        "راجع خطة العلاج المحددة",
        "تأكد من توفر المواد المطلوبة",
        "تحقق من الظروف الجوية المناسبة",
        "اتبع تعليمات السلامة",
      ],
      TreatmentReminder: [
        "تطبيق العلاج حسب الجدول المحدد",
        "ارتداء معدات الحماية الشخصية",
        "تسجيل تاريخ ووقت التطبيق",
        "مراقبة الاستجابة بعد العلاج",
      ],
      TreatmentFollow: [
        "فحص النباتات المعالجة بعناية",
        "تقييم مدى تحسن الأعراض",
        "تسجيل الملاحظات والتطورات",
        "التقاط صور للمقارنة",
      ],
    };

    return (
      suggestions[alertType] || ["راجع التوصيات العامة", "استشر خبير زراعي"]
    );
  }

  // Generate treatment-specific alerts
  static generateTreatmentAlert(
    userId: string,
    cropId: string,
    treatmentId: string,
    alertType: "reminder" | "followup" | "delay",
    treatmentData: any,
  ): AlertData {
    const alertId = `treatment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    let alertInfo = {
      title: "",
      description: "",
      priority: "Medium" as const,
      type: "Treatment" as const,
      urgencyScore: 0.6,
    };

    switch (alertType) {
      case "reminder":
        alertInfo = {
          title: `💊 تذكير: موعد العلاج - الخطوة ${treatmentData.step}`,
          description: `حان وقت تطبيق الخطوة ${treatmentData.step} من خطة العلاج. ${treatmentData.stepDescription || "راجع تفاصيل الخطة للمزيد من المعلومات."}`,
          priority: "Medium",
          type: "Treatment",
          urgencyScore: 0.85,
        };
        break;

      case "followup":
        alertInfo = {
          title: `📋 متابعة: فحص فعالية العلاج`,
          description: `مضى ${treatmentData.daysSince || 7} أيام على ${treatmentData.lastAction || "بدء العلاج"}. حان وقت فحص مدى تحسن النباتات وتقييم فعالية العلاج.`,
          priority: "Medium",
          type: "Treatment",
          urgencyScore: 0.7,
        };
        break;

      case "delay":
        alertInfo = {
          title: `⚠️ تأخير في العلاج المجدول`,
          description: `لم يتم تطبيق العلاج المجدول منذ ${treatmentData.delayDays || 1} يوم(أيام). قد يؤثر هذا التأخير على فعالية الخطة العلاجية.`,
          priority: "Medium",
          type: "Treatment",
          urgencyScore: 0.9,
        };
        break;
    }

    return {
      alertId,
      userId,
      cropId,
      ...alertInfo,
      status: "Unread",
      createdAt: new Date(),
      scheduledFor: treatmentData.scheduledFor
        ? new Date(treatmentData.scheduledFor)
        : undefined,
      relatedData: {
        source: "TreatmentTracker",
        treatmentId,
        treatmentStep: treatmentData.step,
        treatmentProgress: treatmentData.progress || 0,
        ...treatmentData,
      },
      actionSuggestions: this.generateActionSuggestions(
        alertInfo.type,
        treatmentData,
      ),
    };
  }
}

// Task Scheduler Engine
class TaskSchedulerEngine {
  static generateDailyTasks(userId: string, crops: any[]): TaskData[] {
    const tasks: TaskData[] = [];
    const now = new Date();

    crops.forEach((crop) => {
      // Morning irrigation task
      if (crop.needsIrrigation) {
        tasks.push({
          taskId: `daily-irrigation-${crop.id}-${now.getTime()}`,
          userId,
          cropId: crop.id,
          title: `ري ${crop.name} الصباحي`,
          description: `ري حقل ${crop.name} في الصباح الباكر`,
          type: "Daily",
          category: "Irrigation",
          priority: "High",
          status: "Pending",
          scheduledDate: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Tomorrow
          estimatedDuration: 30,
          createdAt: now,
          isRecurring: true,
          recurrencePattern: {
            frequency: "Daily",
            interval: 1,
          },
          cropStage: crop.stage,
          weatherDependency: true,
        });
      }

      // Weekly inspection task
      if (now.getDay() === 1) {
        // Monday
        tasks.push({
          taskId: `weekly-inspection-${crop.id}-${now.getTime()}`,
          userId,
          cropId: crop.id,
          title: `فحص ${crop.name} الأسبوعي`,
          description: `فحص شامل لحالة النباتات واكتشاف أي مشاكل`,
          type: "Weekly",
          category: "General",
          priority: "Medium",
          status: "Pending",
          scheduledDate: new Date(now.getTime() + 24 * 60 * 60 * 1000),
          estimatedDuration: 45,
          createdAt: now,
          isRecurring: true,
          recurrencePattern: {
            frequency: "Weekly",
            interval: 1,
          },
          cropStage: crop.stage,
          weatherDependency: false,
        });
      }
    });

    return tasks;
  }

  static getTasksByTimeframe(
    tasks: TaskData[],
    timeframe: "today" | "week" | "month",
  ): TaskData[] {
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
    const endOfWeek = new Date(startOfDay.getTime() + 7 * 24 * 60 * 60 * 1000);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return tasks.filter((task) => {
      const taskDate = new Date(task.scheduledDate);

      switch (timeframe) {
        case "today":
          return taskDate >= startOfDay && taskDate < endOfDay;
        case "week":
          return taskDate >= startOfDay && taskDate < endOfWeek;
        case "month":
          return taskDate >= startOfDay && taskDate <= endOfMonth;
        default:
          return false;
      }
    });
  }
}

// API Routes

// Get all alerts for a user
router.get("/alerts/user/:userId", (req, res) => {
  try {
    const { userId } = req.params;
    const { status, type, priority, limit = 50 } = req.query;

    let filteredAlerts = alertsDB.filter((alert) => alert.userId === userId);

    if (status) {
      filteredAlerts = filteredAlerts.filter(
        (alert) => alert.status === status,
      );
    }

    if (type) {
      filteredAlerts = filteredAlerts.filter((alert) => alert.type === type);
    }

    if (priority) {
      filteredAlerts = filteredAlerts.filter(
        (alert) => alert.priority === priority,
      );
    }

    // Sort by urgency score and creation date
    filteredAlerts.sort((a, b) => {
      if (a.urgencyScore !== b.urgencyScore) {
        return b.urgencyScore - a.urgencyScore;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const limitNum = parseInt(limit as string);
    const result = filteredAlerts.slice(0, limitNum);

    res.json({
      success: true,
      data: result,
      total: filteredAlerts.length,
      unreadCount: filteredAlerts.filter((a) => a.status === "Unread").length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "فشل في جلب التنبيهات",
      error: error.message,
    });
  }
});

// Mark alert as resolved
router.post("/alerts/resolve/:alertId", (req, res) => {
  try {
    const { alertId } = req.params;
    const alert = alertsDB.find((a) => a.alertId === alertId);

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: "التنبيه غير موجود",
      });
    }

    alert.status = "Resolved";

    res.json({
      success: true,
      message: "تم تحديث حالة التنبيه بنجاح",
      data: alert,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "فشل في تحديث التنبيه",
      error: error.message,
    });
  }
});

// Update alert status
router.patch("/alerts/:alertId/status", (req, res) => {
  try {
    const { alertId } = req.params;
    const { status } = req.body;

    const alert = alertsDB.find((a) => a.alertId === alertId);

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: "التنبيه غير موجود",
      });
    }

    alert.status = status;

    res.json({
      success: true,
      message: "تم تحديث حالة التنبيه بنجاح",
      data: alert,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "فشل في تحديث التنبيه",
      error: error.message,
    });
  }
});

// Generate new alert (for admin/testing)
router.post("/alerts/generate", (req, res) => {
  try {
    const alertData = req.body;

    const newAlert: AlertData = {
      alertId: `alert-${Date.now()}`,
      createdAt: new Date(),
      status: "Unread",
      actionSuggestions: AlertPriorityEngine.generateActionSuggestions(
        alertData.type,
        alertData.relatedData,
      ),
      urgencyScore: AlertPriorityEngine.calculateUrgencyScore(alertData),
      ...alertData,
    };

    alertsDB.push(newAlert);

    res.json({
      success: true,
      message: "تم إنشاء التنبيه بنجاح",
      data: newAlert,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "فشل في إنشاء التنبيه",
      error: error.message,
    });
  }
});

// Get today's tasks
router.get("/tasks/user/:userId/today", (req, res) => {
  try {
    const { userId } = req.params;
    const userTasks = tasksDB.filter((task) => task.userId === userId);
    const todayTasks = TaskSchedulerEngine.getTasksByTimeframe(
      userTasks,
      "today",
    );

    res.json({
      success: true,
      data: todayTasks,
      total: todayTasks.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "فشل في جلب مهام اليوم",
      error: error.message,
    });
  }
});

// Get tasks by timeframe
router.get("/tasks/user/:userId/:timeframe", (req, res) => {
  try {
    const { userId, timeframe } = req.params;
    const { status, category, cropId } = req.query;

    let userTasks = tasksDB.filter((task) => task.userId === userId);

    if (status) {
      userTasks = userTasks.filter((task) => task.status === status);
    }

    if (category) {
      userTasks = userTasks.filter((task) => task.category === category);
    }

    if (cropId) {
      userTasks = userTasks.filter((task) => task.cropId === cropId);
    }

    const filteredTasks = TaskSchedulerEngine.getTasksByTimeframe(
      userTasks,
      timeframe as "today" | "week" | "month",
    );

    // Sort by priority and scheduled date
    filteredTasks.sort((a, b) => {
      const priorityOrder = { High: 3, Medium: 2, Low: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return (
        new Date(a.scheduledDate).getTime() -
        new Date(b.scheduledDate).getTime()
      );
    });

    res.json({
      success: true,
      data: filteredTasks,
      total: filteredTasks.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "فشل في جلب المهام",
      error: error.message,
    });
  }
});

// Create new task
router.post("/tasks/schedule", (req, res) => {
  try {
    const taskData = req.body;

    const newTask: TaskData = {
      taskId: `task-${Date.now()}`,
      createdAt: new Date(),
      status: "Pending",
      estimatedDuration: 30,
      isRecurring: false,
      ...taskData,
      scheduledDate: new Date(taskData.scheduledDate),
    };

    tasksDB.push(newTask);

    res.json({
      success: true,
      message: "تم إنشاء المهمة بنجاح",
      data: newTask,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "فشل في إنشاء المهمة",
      error: error.message,
    });
  }
});

// Update task status
router.patch("/tasks/:taskId/status", (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    const task = tasksDB.find((t) => t.taskId === taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "المهمة غير موجودة",
      });
    }

    task.status = status;

    if (status === "Completed") {
      task.completedAt = new Date();
    }

    res.json({
      success: true,
      message: "تم تحديث حالة المهمة بنجاح",
      data: task,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "فشل في تحديث المهمة",
      error: error.message,
    });
  }
});

// Get alert statistics
router.get("/alerts/user/:userId/stats", (req, res) => {
  try {
    const { userId } = req.params;
    const userAlerts = alertsDB.filter((alert) => alert.userId === userId);

    const stats = {
      total: userAlerts.length,
      unread: userAlerts.filter((a) => a.status === "Unread").length,
      high: userAlerts.filter((a) => a.priority === "High").length,
      medium: userAlerts.filter((a) => a.priority === "Medium").length,
      low: userAlerts.filter((a) => a.priority === "Low").length,
      byType: {
        Weather: userAlerts.filter((a) => a.type === "Weather").length,
        Disease: userAlerts.filter((a) => a.type === "Disease").length,
        Irrigation: userAlerts.filter((a) => a.type === "Irrigation").length,
        Market: userAlerts.filter((a) => a.type === "Market").length,
        Fertilizer: userAlerts.filter((a) => a.type === "Fertilizer").length,
        Pest: userAlerts.filter((a) => a.type === "Pest").length,
        Treatment: userAlerts.filter((a) => a.type === "Treatment").length,
        TreatmentReminder: userAlerts.filter(
          (a) => a.type === "TreatmentReminder",
        ).length,
        TreatmentFollow: userAlerts.filter((a) => a.type === "TreatmentFollow")
          .length,
      },
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "فشل في جلب إحصائيات التنبيهات",
      error: error.message,
    });
  }
});

// Generate treatment alert
router.post("/alerts/treatment/generate", (req, res) => {
  try {
    const {
      userId,
      cropId,
      treatmentId,
      alertType, // 'reminder', 'followup', 'delay'
      treatmentData,
    } = req.body;

    if (!userId || !cropId || !treatmentId || !alertType) {
      return res.status(400).json({
        success: false,
        message: "بيانات غير مكتملة لإنشاء تنبيه العلاج",
      });
    }

    const treatmentAlert = AlertPriorityEngine.generateTreatmentAlert(
      userId,
      cropId,
      treatmentId,
      alertType,
      treatmentData || {},
    );

    alertsDB.push(treatmentAlert);

    res.json({
      success: true,
      data: treatmentAlert,
      message: "تم إنشاء تنبيه العلاج بنجاح",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "فشل في إنشاء تنبيه العلاج",
      error: error.message,
    });
  }
});

// Get treatment alerts for specific treatment
router.get("/alerts/treatment/:treatmentId", (req, res) => {
  try {
    const { treatmentId } = req.params;

    const treatmentAlerts = alertsDB.filter(
      (alert) => alert.relatedData?.treatmentId === treatmentId,
    );

    // Sort by creation date
    treatmentAlerts.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    res.json({
      success: true,
      data: treatmentAlerts,
      total: treatmentAlerts.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "فشل ��ي جلب تنبيهات العلاج",
      error: error.message,
    });
  }
});

// Schedule automatic treatment reminders
router.post("/alerts/treatment/schedule-reminders", (req, res) => {
  try {
    const { userId, cropId, treatmentId, treatmentPlan } = req.body;

    if (!userId || !cropId || !treatmentId || !treatmentPlan) {
      return res.status(400).json({
        success: false,
        message: "بيانات غير مكتملة لجدولة التذكيرات",
      });
    }

    const scheduledAlerts = [];
    const now = new Date();

    // Generate reminders for each treatment step
    if (treatmentPlan.steps) {
      treatmentPlan.steps.forEach((step, index) => {
        // Calculate reminder date based on step timing
        const reminderDate = new Date(
          now.getTime() + (index + 1) * 7 * 24 * 60 * 60 * 1000,
        ); // Weekly steps

        const reminderAlert = AlertPriorityEngine.generateTreatmentAlert(
          userId,
          cropId,
          treatmentId,
          "reminder",
          {
            step: step.stepNumber,
            stepDescription: step.title,
            scheduledFor: reminderDate,
            progress: 0,
          },
        );

        reminderAlert.scheduledFor = reminderDate;
        alertsDB.push(reminderAlert);
        scheduledAlerts.push(reminderAlert);
      });
    }

    // Generate follow-up alerts
    const followUpDates = treatmentPlan.followUpSchedule?.checkDays || [
      3, 7, 14, 21,
    ];
    followUpDates.forEach((days) => {
      const followUpDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

      const followUpAlert = AlertPriorityEngine.generateTreatmentAlert(
        userId,
        cropId,
        treatmentId,
        "followup",
        {
          daysSince: days,
          lastAction: "بدء العلاج",
          scheduledFor: followUpDate,
          progress: Math.min(100, (days / treatmentPlan.totalDuration) * 100),
        },
      );

      followUpAlert.scheduledFor = followUpDate;
      alertsDB.push(followUpAlert);
      scheduledAlerts.push(followUpAlert);
    });

    res.json({
      success: true,
      data: scheduledAlerts,
      message: `تم جدولة ${scheduledAlerts.length} تذكير بنجاح`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "فشل في جدولة التذكيرات",
      error: error.message,
    });
  }
});

export default router;
