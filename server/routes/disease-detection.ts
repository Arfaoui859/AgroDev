import { RequestHandler } from "express";
import multer from "multer";
import { uploadError } from "../middleware/upload";
import { isLLMConfigured } from "../services/providers/llmProvider";
import { recordFailure, recordSuccess } from "../services/providers/aiTelemetry";
import { diagnosePlantImage } from "../services/providers/visionProvider";

// Configure multer for image upload
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 10 // max 10 files
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(uploadError({ message: 'نوع الملف غير مدعوم. يرجى رفع صور بصيغة JPEG, PNG, أو WebP فقط' }));
    }
  }
});

export const uploadMiddleware = upload.array('images', 10);

export interface DiseaseDetectionRequest {
  cropType: string;
  plantPart: string;
  symptoms?: string;
  additionalInfo?: string;
  location?: {
    latitude?: number;
    longitude?: number;
    governorate?: string;
  };
}

export interface DiseaseDetectionResponse {
  id: string;
  confidence: number;
  diagnosis: {
    disease: string;
    diseaseId: string;
    confidence: number;
    severity: 'low' | 'medium' | 'high';
    description: string;
    symptoms: string[];
    causes: string[];
    treatment: string[];
    prevention: string[];
    urgency: 'low' | 'medium' | 'high' | 'critical';
  };
  imageAnalysis: {
    quality: number;
    clarity: number;
    relevantSymptoms: string[];
    detectedAreas: Array<{
      region: string;
      confidence: number;
      severity: number;
    }>;
  };
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
    monitoring: string[];
  };
  economicImpact: {
    potentialLoss: number;
    treatmentCost: number;
    recoveryTime: string;
  };
  metadata: {
    processedAt: string;
    model: string;
    version: string;
    dataSource?: "simulated" | "microservice" | "model";
    isRealData?: boolean;
    processingTime: number;
  };
}

// Disease database for mock AI responses
const diseaseDatabase = {
  olive: {
    leaves: [
      {
        diseaseId: "olive-peacock-spot",
        disease: "عين الطاووس",
        confidence: 88,
        severity: "medium" as const,
        description: "مرض فطري شائع في أشجار الزيتون يظهر على شكل بقع دائرية على الأوراق",
        symptoms: ["بقع دائرية على الأوراق", "اصفرار حول البقع", "تساقط الأوراق"],
        causes: ["الرطوبة العالية", "قلة التهوية", "الري العلوي"],
        treatment: [
          "رش بمبيد فطري نحاسي (أوكسي كلوريد النحاس 50%)",
          "إزالة الأوراق المصابة وحرقها",
          "تحسين التهوية بالتقليم",
          "تجنب الري العلوي نهائياً"
        ],
        prevention: [
          "تقليم منتظم لتحسين التهوية",
          "زراعة بمسافات مناسبة (6-8 متر)",
          "رش وقائي بمبيد نحاسي في الخريف",
          "تحسين تصريف المياه حول الأشجار"
        ],
        urgency: "medium" as const
      },
      {
        diseaseId: "olive-anthracnose",
        disease: "الأنثراكنوز",
        confidence: 82,
        severity: "high" as const,
        description: "مرض فطري خطير يصيب الثمار والأوراق",
        symptoms: ["بقع سوداء غائرة على الثمار", "تعفن الثمار", "بقع بنية على الأوراق"],
        causes: ["الرطوبة العالية أثناء النضج", "الأمطار الغزيرة", "ضعف التهوية"],
        treatment: [
          "رش فوري بمبيد فطري جهازي",
          "قطف الثمار المصابة فوراً",
          "تحسين التهوية",
          "تقليل الرطوبة"
        ],
        prevention: [
          "رش وقائي قبل موسم الأمطار",
          "تحسين الصرف",
          "تجنب الري العلوي",
          "قطف مبكر للثمار"
        ],
        urgency: "high" as const
      }
    ]
  },
  tomato: {
    leaves: [
      {
        diseaseId: "tomato-late-blight",
        disease: "اللفحة المتأخرة",
        confidence: 92,
        severity: "high" as const,
        description: "مرض فطري مدمر يمكن أن يقضي على المحصول بالكامل",
        symptoms: ["بقع بنية داكنة", "ذبول سريع", "تعفن الثمار", "رائحة كريهة"],
        causes: ["رطوبة عالية جداً", "درجات حرارة معتدلة", "ضعف التهوية"],
        treatment: [
          "مبيد فطري جهازي فوري (مثل ريدوميل جولد)",
          "إزالة النباتات المصابة كاملة",
          "تحسين التهوية فوراً",
          "تقليل الرطوبة بكل الطرق"
        ],
        prevention: [
          "زراعة أصناف مقاومة",
          "تجنب الري العلوي نهائياً",
          "تهوية ممتازة",
          "رش وقائي في الظروف المناسبة"
        ],
        urgency: "critical" as const
      },
      {
        diseaseId: "tomato-early-blight",
        disease: "اللفحة المبكرة",
        confidence: 85,
        severity: "medium" as const,
        description: "مرض فطري شائع يصيب الأوراق السفلية أولاً",
        symptoms: ["بقع بنية محاطة بحلقات", "اصفرار الأوراق", "تساقط الأوراق السفلية"],
        causes: ["ضعف النبات", "نقص البوتاسيوم", "الرطوبة المتوسطة"],
        treatment: [
          "مبيد فطري وقائي وعلاجي",
          "تحسين التغذية بالبوتاسيوم",
          "إزالة الأوراق المصابة",
          "تحسين التهوية"
        ],
        prevention: [
          "تغذية متوازنة",
          "تجنب الإجهاد المائي",
          "تقوية النبات",
          "رش وقائي"
        ],
        urgency: "medium" as const
      }
    ]
  },
  citrus: {
    leaves: [
      {
        diseaseId: "citrus-canker",
        disease: "تقرح الحمضيات",
        confidence: 90,
        severity: "high" as const,
        description: "مرض بكتيري خطير يصيب جميع أجزاء النبات",
        symptoms: ["تقرحات بارزة", "بقع محاطة بحلقة صفراء", "تساقط الأوراق"],
        causes: ["بكتيريا Xanthomonas", "الرياح والأمطار", "الجروح"],
        treatment: [
          "مبيد بكتيري نحاسي فوري",
          "إزالة الأجزاء المصابة",
          "تطهير الأدوات",
          "تحسين التهوية"
        ],
        prevention: [
          "فحص الشتلات",
          "تجنب الجروح",
          "تطهير الأدوات",
          "مكافحة الحشرات"
        ],
        urgency: "high" as const
      }
    ]
  },
  wheat: {
    leaves: [
      {
        diseaseId: "wheat-rust",
        disease: "صدأ القمح",
        confidence: 89,
        severity: "high" as const,
        description: "مرض فطري خطير ينتشر بسرعة",
        symptoms: ["بقع صدئية", "مسحوق برتقالي", "اصفرار الأوراق"],
        causes: ["رطوبة عالية", "درجات حرارة معتدلة", "زراعة كثيفة"],
        treatment: [
          "مبيد فطري متخصص فوري",
          "تحسين التهوية",
          "تقليل الكثافة",
          "إزالة المخلفات"
        ],
        prevention: [
          "أصناف مقاومة",
          "دورة زراعية",
          "تجنب الكثافة العالية",
          "رش وقائي"
        ],
        urgency: "critical" as const
      }
    ]
  }
};

export const analyzePlantImages: RequestHandler = async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    const requestData: DiseaseDetectionRequest = req.body;

    if (!files || files.length === 0) {
      return res.status(400).json({
        error: "يجب رفع صورة واحدة على الأقل"
      });
    }

    if (!requestData.cropType || !requestData.plantPart) {
      return res.status(400).json({
        error: "يجب تحديد نوع المحصول والجزء المصاب"
      });
    }

    const processingStart = Date.now();

    // Prefer a real multimodal vision model when one is configured.
    if (isLLMConfigured()) {
      try {
        const vision = await diagnosePlantImage({
          image: { buffer: files[0].buffer, mimetype: files[0].mimetype },
          cropType: requestData.cropType,
          plantPart: requestData.plantPart,
          symptoms: requestData.symptoms,
        });
        const d = vision.diagnosis;
        const processingTime = Date.now() - processingStart;
        recordSuccess(
          "plant-disease-detection",
          vision.modelSource,
          true,
          vision.latencyMs ?? processingTime,
        );
        const visionResponse: DiseaseDetectionResponse = {
          id: `diag-${Date.now()}`,
          confidence: Math.round(d.confidence * 100),
          diagnosis: {
            disease: d.disease,
            diseaseId: d.diseaseId ?? "vision-model",
            confidence: Math.round(d.confidence * 100),
            severity: d.severity ?? "medium",
            description: d.description,
            symptoms: d.symptoms,
            causes: d.causes,
            treatment: d.treatment,
            prevention: d.prevention,
            urgency:
              d.severity === "high"
                ? "high"
                : d.severity === "low"
                  ? "low"
                  : "medium",
          },
          imageAnalysis: {
            quality: 0,
            clarity: 0,
            relevantSymptoms: d.symptoms.slice(0, 3),
            detectedAreas: d.detectedAreas,
          },
          recommendations: generateRecommendations({
            symptoms: d.symptoms,
            causes: d.causes,
            treatment: d.treatment,
            prevention: d.prevention,
            urgency: d.severity ?? "medium",
          } as never),
          economicImpact: calculateEconomicImpact(
            { severity: d.severity ?? "medium" } as never,
            requestData.cropType,
          ),
          metadata: {
            processedAt: new Date().toISOString(),
            model: vision.modelSource,
            version: "1.0.0",
            dataSource: "model",
            isRealData: true,
            processingTime,
          },
        };
        return res.json(visionResponse);
      } catch (error) {
        console.error("Vision model error (disease/analyze):", (error as Error).message);
        recordFailure("plant-disease-detection", "vision", error, Date.now() - processingStart);
      }
    }

    // Heuristic analysis (no trained vision model is configured/reachable).
    const analysisResult = await performMockAIAnalysis(files, requestData);
    const processingTime = Date.now() - processingStart;
    
    const response: DiseaseDetectionResponse = {
      id: `diag-${Date.now()}`,
      confidence: analysisResult.confidence,
      diagnosis: analysisResult.diagnosis,
      imageAnalysis: {
        // No image-quality model runs here; report zeros instead of inventing
        // plausible-looking scores.
        quality: 0,
        clarity: 0,
        relevantSymptoms: analysisResult.diagnosis.symptoms.slice(0, 3),
        detectedAreas: []
      },
      recommendations: generateRecommendations(analysisResult.diagnosis),
      economicImpact: calculateEconomicImpact(analysisResult.diagnosis, requestData.cropType),
      metadata: {
        processedAt: new Date().toISOString(),
        // No vision model is wired into this legacy endpoint: results are
        // heuristic simulations. Flagged explicitly so clients do not present
        // them as model inferences.
        model: "heuristic-simulated",
        version: "0.0.0",
        dataSource: "simulated",
        isRealData: false,
        processingTime
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Disease detection error:', error);
    res.status(500).json({
      error: "خطأ في تحليل الصور. يرجى المحاولة مرة أخرى"
    });
  }
};

async function performMockAIAnalysis(
  files: Express.Multer.File[], 
  requestData: DiseaseDetectionRequest
) {
  // Simulate image quality analysis
  const imageQuality = files.reduce((sum, file) => {
    // Mock quality score based on file size (larger = potentially better quality)
    const qualityScore = Math.min(100, (file.size / (1024 * 1024)) * 30 + 60);
    return sum + qualityScore;
  }, 0) / files.length;

  // Get diseases for the crop and plant part
  const cropDiseases = diseaseDatabase[requestData.cropType as keyof typeof diseaseDatabase];
  const partDiseases = cropDiseases?.[requestData.plantPart as keyof typeof cropDiseases];

  let selectedDisease;
  
  if (partDiseases && Array.isArray(partDiseases) && partDiseases.length > 0) {
    // Select disease based on symptoms if provided
    if (requestData.symptoms) {
      const symptomsLower = requestData.symptoms.toLowerCase();
      selectedDisease = partDiseases.find(disease => 
        disease.symptoms.some(symptom => 
          symptomsLower.includes(symptom.toLowerCase()) ||
          symptom.toLowerCase().includes(symptomsLower)
        )
      ) || partDiseases[0];
    } else {
      // No symptoms supplied: return the first (primary) entry from the
      // reference table rather than drawing one at random, so repeated calls
      // are reproducible.
      selectedDisease = partDiseases[0];
    }
  } else {
    // Fallback for unknown crop/part combinations
    selectedDisease = {
      diseaseId: "unknown-disease",
      disease: "مرض نباتي غير محدد",
      confidence: 65,
      severity: "medium" as const,
      description: "تم اكتشاف أعراض مرضية ولكن يحتاج تشخيص إضافي من خبير",
      symptoms: ["أعراض غير محددة", "تغيرات في المظهر الطبيعي"],
      causes: ["عوامل متعددة محتملة"],
      treatment: ["استشارة خبير زراعي", "مراقبة النبات", "تحسين الرعاية العامة"],
      prevention: ["رعاية منتظمة", "تغذية متوازنة", "مراقبة مستمرة"],
      urgency: "medium" as const
    };
  }

  // Adjust confidence based on image quality and symptoms provided
  let finalConfidence = selectedDisease.confidence;
  
  if (imageQuality > 80) finalConfidence += 5;
  if (imageQuality < 60) finalConfidence -= 10;
  if (requestData.symptoms) finalConfidence += 8;
  if (requestData.additionalInfo) finalConfidence += 3;
  
  finalConfidence = Math.max(50, Math.min(95, finalConfidence));

  return {
    confidence: Math.round(finalConfidence),
    diagnosis: {
      ...selectedDisease,
      confidence: Math.round(finalConfidence)
    }
  };
}

function generateRecommendations(diagnosis: any) {
  const urgencyMap = {
    critical: {
      immediate: [
        "ابدأ العلاج فوراً - لا تنتظر!",
        "اعزل النباتات المصابة",
        "اتصل بخبير زراعي"
      ],
      shortTerm: [
        "راقب انتشار المرض يومياً",
        "طبق العلاج حسب التعليمات",
        "حسن ظروف البيئة"
      ],
      longTerm: [
        "غير نظام الزراعة",
        "استخدم أصناف مقاومة مستقبلاً",
        "طور نظام الوقاية"
      ]
    },
    high: {
      immediate: [
        "ابدأ العلاج خلال 24 ساعة",
        "أزل الأجزاء المصابة",
        "حسن التهوية"
      ],
      shortTerm: [
        "راقب تطور الحالة",
        "كرر العلاج حسب الحاجة",
        "اضبط الري والتغذية"
      ],
      longTerm: [
        "خطط لتحسين الوقاية",
        "راجع ممارسات الزراعة",
        "احتفظ بسجل للمراقبة"
      ]
    },
    medium: {
      immediate: [
        "ابدأ العلاج خلال 3 أيام",
        "حسن الظروف البيئية",
        "راقب انتشار المرض"
      ],
      shortTerm: [
        "طبق العلاج بانتظام",
        "حسن التغذية",
        "عزز مقاومة النبات"
      ],
      longTerm: [
        "طور برنامج وقاية",
        "احسن إدارة المزرعة",
        "اعتمد ممارسات أفضل"
      ]
    },
    low: {
      immediate: [
        "راقب تطور الأعراض",
        "حسن الرعاية العامة",
        "اضبط الري والتغذية"
      ],
      shortTerm: [
        "طبق ممارسات وقائية",
        "قوي النبات بالتغذية",
        "راقب الظروف البيئية"
      ],
      longTerm: [
        "احتفظ بالممارسات الجيدة",
        "راجع نظام الوقاية",
        "طور خطة مراقبة"
      ]
    }
  };

  const urgency = diagnosis.urgency || 'medium';
  const recommendations = urgencyMap[urgency as keyof typeof urgencyMap];

  return {
    immediate: recommendations.immediate,
    shortTerm: recommendations.shortTerm,
    longTerm: recommendations.longTerm,
    monitoring: [
      "فحص يومي للأعراض الجديدة",
      "تصوير دوري لمتابعة التطور",
      "تسجيل استجابة النبات للعلاج",
      "مراقبة النباتات المجاورة"
    ]
  };
}

function calculateEconomicImpact(diagnosis: any, cropType: string) {
  const baseLoss = {
    olive: 5000,
    citrus: 8000,
    tomato: 12000,
    wheat: 3000,
    artichoke: 7000
  };

  const severityMultiplier = {
    low: 0.1,
    medium: 0.3,
    high: 0.6
  };

  const cropLoss = baseLoss[cropType as keyof typeof baseLoss] || 5000;
  const severityFactor = severityMultiplier[diagnosis.severity as keyof typeof severityMultiplier] || 0.3;
  
  const potentialLoss = Math.round(cropLoss * severityFactor);
  const treatmentCost = Math.round(potentialLoss * 0.15); // 15% of potential loss

  const recoveryTime = {
    low: "1-2 أسابيع",
    medium: "3-4 أسابيع", 
    high: "6-8 أسابيع"
  };

  return {
    potentialLoss,
    treatmentCost,
    recoveryTime: recoveryTime[diagnosis.severity as keyof typeof recoveryTime] || "3-4 أسابيع"
  };
}

export const getDiseaseHistory: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.query;
    
    // In a real implementation, fetch from database
    // For now, return empty array as this is stored client-side
    res.json([]);
  } catch (error) {
    console.error('Get disease history error:', error);
    res.status(500).json({
      error: "خطأ في جلب سجل التشخيص"
    });
  }
};

export const getDiseaseInfo: RequestHandler = async (req, res) => {
  try {
    const { diseaseId } = req.params;
    
    // Find disease in database
    let foundDisease = null;
    
    for (const cropType of Object.keys(diseaseDatabase)) {
      const crop = diseaseDatabase[cropType as keyof typeof diseaseDatabase];
      for (const plantPart of Object.keys(crop)) {
        const diseases = crop[plantPart as keyof typeof crop];
        if (Array.isArray(diseases)) {
          foundDisease = diseases.find(d => d.diseaseId === diseaseId);
          if (foundDisease) break;
        }
      }
      if (foundDisease) break;
    }
    
    if (!foundDisease) {
      return res.status(404).json({
        error: "المرض غير موجود"
      });
    }
    
    res.json(foundDisease);
  } catch (error) {
    console.error('Get disease info error:', error);
    res.status(500).json({
      error: "خطأ في جلب معلومات المرض"
    });
  }
};

export const getAllDiseases: RequestHandler = async (req, res) => {
  try {
    const { cropType, severity } = req.query;
    
    let allDiseases: any[] = [];
    
    // Flatten disease database
    for (const crop of Object.keys(diseaseDatabase)) {
      if (cropType && crop !== cropType) continue;
      
      const cropData = diseaseDatabase[crop as keyof typeof diseaseDatabase];
      for (const plantPart of Object.keys(cropData)) {
        const diseases = cropData[plantPart as keyof typeof cropData];
        if (Array.isArray(diseases)) {
          const enrichedDiseases = diseases.map(disease => ({
            ...disease,
            cropType: crop,
            plantPart
          }));
          allDiseases.push(...enrichedDiseases);
        }
      }
    }
    
    // Filter by severity if specified
    if (severity && severity !== 'all') {
      allDiseases = allDiseases.filter(d => d.severity === severity);
    }
    
    res.json(allDiseases);
  } catch (error) {
    console.error('Get all diseases error:', error);
    res.status(500).json({
      error: "خطأ في جلب قائمة الأمراض"
    });
  }
};
