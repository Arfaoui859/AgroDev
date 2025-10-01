import { Router } from "express";

const router = Router();

// Mock pest control data
const mockPestDatabase = {
  aphids: {
    name_ar: "المن",
    category: "حشرات",
    host_plants: ["tomato", "potato", "wheat", "corn", "olive"],
    symptoms: [
      "أوراق مجعدة ومشوهة",
      "إفرازات عسلية لزجة",
      "اصفرار الأوراق",
      "تجمعات حشرية على الأوراق الصغيرة",
    ],
    damage_level: "medium_to_high",
    economic_threshold: "5-10 حشرات/ورقة",
    treatment_options: [
      {
        method: "biological_control",
        name_ar: "المكافحة الحيوية",
        treatment: "إطلاق الدعسوقة والزنابير المفترسة",
        effectiveness: 85,
        cost_per_hectare: 150,
        safety_level: "آمن جداً",
      },
      {
        method: "organic_soap",
        name_ar: "صابون حشري طبيعي",
        treatment: "رش بمحلول الصابون الطبيعي 2%",
        effectiveness: 70,
        cost_per_hectare: 80,
        safety_level: "آمن",
      },
    ],
  },
  spider_mites: {
    name_ar: "العنكبوت الأحمر",
    category: "عنكبوتيات",
    host_plants: ["tomato", "potato", "corn", "cotton"],
    symptoms: [
      "نقط صفراء صغيرة على الأوراق",
      "خيوط عنكبوتية رفيعة",
      "اصفرار وذبول الأوراق",
      "سقوط الأوراق المبكر",
    ],
    damage_level: "high",
    economic_threshold: "3-5 عنكبوت/ورقة",
    treatment_options: [
      {
        method: "predatory_mites",
        name_ar: "العنكبوت المفترس",
        treatment: "إطلاق Phytoseiulus persimilis",
        effectiveness: 90,
        cost_per_hectare: 300,
        safety_level: "آمن جداً",
      },
      {
        method: "miticide_spray",
        name_ar: "مبيد عنكبوتي",
        treatment: "أباميكتين 18 جم/هكتار",
        effectiveness: 85,
        cost_per_hectare: 250,
        safety_level: "حذر",
      },
    ],
  },
  powdery_mildew: {
    name_ar: "البياض الدقيقي",
    category: "أمراض فطرية",
    host_plants: ["tomato", "cucumber", "grape", "wheat"],
    symptoms: [
      "طبقة بيضاء مسحوقية على الأوراق",
      "تشويه الأوراق والبراعم",
      "اصفرار وذبول الأوراق",
      "انخفاض جودة الثمار",
    ],
    damage_level: "medium_to_high",
    economic_threshold: "5-10% إصابة أوراق",
    treatment_options: [
      {
        method: "baking_soda_spray",
        name_ar: "محلول بيكربونات الصوديوم",
        treatment: "بيكربونات الصوديوم 5 جم/لتر",
        effectiveness: 65,
        cost_per_hectare: 50,
        safety_level: "آمن جداً",
      },
      {
        method: "systemic_fungicide",
        name_ar: "مبيد فطري جهازي",
        treatment: "تيبوكونازول 250 مل/هكتار",
        effectiveness: 95,
        cost_per_hectare: 300,
        safety_level: "حذر",
      },
    ],
  },
};

// Analyze pest problem
router.post("/analyze-problem", async (req, res) => {
  try {
    const {
      crop_type = "tomato",
      symptoms = [],
      affected_area_percentage = 20.0,
      weather_conditions = {},
      farm_size = 1.0,
    } = req.body;

    // Mock analysis result
    const analysis = {
      pest_identification: {
        identified_pest: "aphids",
        pest_name_ar: "المن",
        confidence_score: 0.85,
        category: "حشرات",
        top_predictions: [
          {
            pest: "aphids",
            name_ar: "المن",
            probability: 0.85,
            category: "حشرات",
          },
          {
            pest: "spider_mites",
            name_ar: "العنكبوت الأحمر",
            probability: 0.12,
            category: "عنكبوتيات",
          },
        ],
      },
      severity_assessment: {
        severity_score: affected_area_percentage / 100,
        severity_level:
          affected_area_percentage > 50
            ? "شديد"
            : affected_area_percentage > 30
              ? "متوسط"
              : "خفيف",
        urgency_level: affected_area_percentage > 50 ? "عاجل" : "متوسط",
        above_threshold: affected_area_percentage > 30,
        damage_assessment: {
          current_damage_percent: affected_area_percentage,
          potential_yield_loss: Math.min(80, affected_area_percentage * 1.5),
          spread_risk: "متوسط",
          recovery_potential: "جيد",
        },
      },
      treatment_recommendations: [
        {
          treatment_method: "biological_control",
          treatment_name_ar: "المكافحة الحيوية",
          treatment_details: "إطلاق الدعسوقة والزنابير المفترسة",
          effectiveness_score: 0.85,
          cost_per_hectare: 150,
          safety_level: "آمن جداً",
          suitability_score: 0.9,
          pros_and_cons: {
            pros: ["صديق للبيئة", "آمن للإنسان", "مستدام"],
            cons: ["بطيء النتائج", "يحتاج ظروف مناسبة"],
          },
        },
        {
          treatment_method: "organic_soap",
          treatment_name_ar: "صابون حشري طبيعي",
          treatment_details: "رش بمحلول الصابون الطبيعي 2%",
          effectiveness_score: 0.7,
          cost_per_hectare: 80,
          safety_level: "آمن",
          suitability_score: 0.8,
          pros_and_cons: {
            pros: ["سريع المفعول", "رخيص الثمن"],
            cons: ["يحتاج تكرار", "قد يؤثر على النحل"],
          },
        },
      ],
      prevention_measures: [
        {
          category: "الإدارة الزراعية",
          measures: [
            "تناوب المحاصيل لكسر دورة حياة الآفات",
            "إزالة بقايا المحاصيل المصابة",
            "اختيار أصناف مقاومة",
          ],
          priority: "عالي",
          cost_level: "منخفض",
        },
        {
          category: "المراقبة والكشف المبكر",
          measures: [
            "فحص دوري للنباتات (2-3 مرات أسبوعياً)",
            "استخدام المصائد الفيرمونية",
            "مراقبة الظروف البيئية المحفزة",
          ],
          priority: "عالي جداً",
          cost_level: "منخفض",
        },
      ],
      cost_analysis: {
        recommended_treatment_cost: {
          material_cost: 150.0 * farm_size,
          application_cost: 50.0 * farm_size,
          total_treatment_cost: 200.0 * farm_size,
          potential_loss_if_untreated: 1500.0 * farm_size,
          cost_benefit_ratio: 7.5,
          payback_analysis: {
            roi_percentage: "650.0%",
          },
        },
      },
      monitoring_plan: {
        monitoring_schedule: [
          {
            timing: "قبل العلاج",
            activities: [
              "توثيق مستوى الإصابة الحالي",
              "تصوير المناطق المصابة",
              "عد الآفات في عينة ممثلة",
            ],
          },
          {
            timing: "بعد 3 أيام من العلاج",
            activities: [
              "فحص فعالية العلاج الأولى",
              "البحث عن آفات ميتة أو ضعيفة",
              "تقييم استجابة النباتات",
            ],
          },
        ],
        success_indicators: [
          "انخفاض أعداد الآفات بنسبة 80% خلال أسبوع",
          "توقف انتشار الإصابة للنباتات الجديدة",
          "تحسن مظهر النباتات المصابة",
        ],
      },
    };

    res.json({
      success: true,
      data: analysis,
      message: "تم تحليل مشكلة الآفات بنجاح",
    });
  } catch (error) {
    console.error("Error analyzing pest problem:", error);
    res.status(500).json({
      success: false,
      error: "فشل في تحليل مشكلة الآفات",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// Identify pest from symptoms
router.post("/identify", async (req, res) => {
  try {
    const { symptoms = [], crop_type = "tomato" } = req.body;

    // Simple symptom matching
    let identified_pest = "aphids";
    let confidence = 0.5;

    if (symptoms.some((s) => s.includes("مجعدة") || s.includes("لزجة"))) {
      identified_pest = "aphids";
      confidence = 0.8;
    } else if (
      symptoms.some((s) => s.includes("نقط صفراء") || s.includes("عنكبوت"))
    ) {
      identified_pest = "spider_mites";
      confidence = 0.8;
    } else if (
      symptoms.some((s) => s.includes("بيضاء") || s.includes("مسحوق"))
    ) {
      identified_pest = "powdery_mildew";
      confidence = 0.8;
    }

    const pestInfo =
      mockPestDatabase[identified_pest as keyof typeof mockPestDatabase];

    const identification = {
      identified_pest,
      pest_name_ar: pestInfo.name_ar,
      confidence_score: confidence,
      category: pestInfo.category,
      symptoms: pestInfo.symptoms,
      host_plants: pestInfo.host_plants,
    };

    res.json({
      success: true,
      data: { identification },
      message: "تم تحديد الآفة بنجاح",
    });
  } catch (error) {
    console.error("Error identifying pest:", error);
    res.status(500).json({
      success: false,
      error: "فشل في تحديد الآفة",
    });
  }
});

// Get pest database
router.get("/database", async (req, res) => {
  try {
    res.json({
      success: true,
      data: mockPestDatabase,
      message: "تم جلب قاعدة البيانات بنجاح",
    });
  } catch (error) {
    console.error("Error fetching pest database:", error);
    res.status(500).json({
      success: false,
      error: "فشل في جلب قاعدة البيانات",
    });
  }
});

// Get prevention measures for crop
router.get("/prevention/:crop_type", async (req, res) => {
  try {
    const { crop_type } = req.params;

    const preventionMeasures = [
      {
        category: "الإدارة الزراعية",
        measures: [
          "تناوب المحاصيل لكسر دورة حياة الآفات",
          "إزالة بقايا المحاصيل المصابة",
          "اختيار أصناف مقاومة",
          "تنظيم مواعيد الزراعة",
        ],
        priority: "عالي",
        cost_level: "منخفض",
      },
      {
        category: "المراقبة والكشف المبكر",
        measures: [
          "فحص دوري للنباتات (2-3 مرات أسبوعياً)",
          "استخدام المصائد الفيرمونية",
          "مراقبة الظروف البيئية المحفزة",
          "توثيق حالات الإصابة",
        ],
        priority: "عالي جداً",
        cost_level: "منخفض",
      },
      {
        category: "التحكم البيولوجي",
        measures: [
          "تشجيع الأعداء الطبيعية",
          "زراعة نباتات جاذبة للحشرات المفيدة",
          "تجنب المبيدات واسعة المدى",
          "إنشاء ملاجئ للحشرات المفيدة",
        ],
        priority: "متوسط",
        cost_level: "متوسط",
      },
    ];

    // Add crop-specific measures
    if (crop_type === "tomato") {
      preventionMeasures.push({
        category: "خاص بالطماطم",
        measures: [
          "تحسين التهوية بين النباتات",
          "تجنب الري على الأوراق",
          "إزالة الأوراق السفلية المصابة",
        ],
        priority: "عالي",
        cost_level: "منخفض",
      });
    }

    res.json({
      success: true,
      data: preventionMeasures,
      message: "تم جلب التدابير الوقائية بنجاح",
    });
  } catch (error) {
    console.error("Error fetching prevention measures:", error);
    res.status(500).json({
      success: false,
      error: "فشل في جلب التدابير الوقائية",
    });
  }
});

// Recommend treatment
router.post("/recommend-treatment", async (req, res) => {
  try {
    const {
      pest_name = "aphids",
      severity_level = 0.5,
      farm_size = 1.0,
      organic_preference = false,
    } = req.body;

    const pestInfo =
      mockPestDatabase[pest_name as keyof typeof mockPestDatabase];

    if (!pestInfo) {
      return res.status(404).json({
        success: false,
        error: "آفة غير موجودة في قاعدة البيانات",
      });
    }

    let treatments = pestInfo.treatment_options;

    // Filter for organic treatments if preferred
    if (organic_preference) {
      treatments = treatments.filter(
        (t) =>
          t.method.includes("biological") ||
          t.method.includes("organic") ||
          t.safety_level === "آمن جداً",
      );
    }

    // Adjust recommendations based on severity
    const recommendations = treatments.map((treatment) => ({
      ...treatment,
      priority:
        severity_level > 0.7 ? "عاجل" : severity_level > 0.4 ? "عالي" : "متوسط",
      total_cost: treatment.cost_per_hectare * farm_size,
      applications_needed:
        severity_level > 0.7 ? 3 : severity_level > 0.4 ? 2 : 1,
    }));

    res.json({
      success: true,
      data: recommendations,
      message: "تم إنشاء توصيات العلاج بنجاح",
    });
  } catch (error) {
    console.error("Error recommending treatment:", error);
    res.status(500).json({
      success: false,
      error: "فشل في توصية العلاج",
    });
  }
});

// Assess pest severity
router.post("/assess-severity", async (req, res) => {
  try {
    const {
      pest_name = "aphids",
      affected_area_percentage = 20.0,
      plant_health_score = 0.7,
      temperature = 25.0,
      humidity = 60.0,
    } = req.body;

    // Calculate severity based on multiple factors
    const area_factor = affected_area_percentage / 100;
    const health_factor = 1 - plant_health_score;
    const weather_factor = temperature > 30 || humidity > 80 ? 1.2 : 1.0;

    const severity_score = Math.min(
      1.0,
      (area_factor + health_factor) * weather_factor,
    );

    const assessment = {
      severity_score,
      severity_level:
        severity_score > 0.7
          ? "حاد جداً"
          : severity_score > 0.5
            ? "شديد"
            : severity_score > 0.3
              ? "متوسط"
              : "خفيف",
      urgency_level:
        severity_score > 0.7 ? "عاجل" : severity_score > 0.5 ? "عالي" : "متوسط",
      above_threshold: severity_score > 0.3,
      recommendations: [
        severity_score > 0.7 ? "تدخل فوري مطلوب" : "مراقبة مستمرة",
        "تطبيق إجراءات وقائية",
      ],
    };

    res.json({
      success: true,
      data: assessment,
      message: "تم تقييم شدة الإصابة بنجاح",
    });
  } catch (error) {
    console.error("Error assessing severity:", error);
    res.status(500).json({
      success: false,
      error: "فشل في تقييم شدة الإصابة",
    });
  }
});

export { router as pestControlRouter };
