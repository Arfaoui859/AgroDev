import { RequestHandler } from 'express';
import { FarmService } from '../services/farmService';
import { CropService } from '../services/cropService';
import { scopedClientFromAuthHeader } from '../lib/supabase';
import { sendCaughtError } from '../lib/errors';
import { recommendCrops } from '../services/ai/knowledgeEngine';
import { SIMULATED_DISCLAIMER_AR } from '../lib/provenance';

// ============ API HANDLERS ============

/**
 * Resolve the caller-scoped Supabase client for this request.
 *
 * The per-user tables (farms, farm_sections, soil_analyses, crop_recommendations)
 * are protected by RLS policies keyed on auth.uid(). A client built with only the
 * anon key evaluates those policies with auth.uid() = NULL, so reads return zero
 * rows and writes are denied. Forwarding the caller's verified JWT makes PostgREST
 * evaluate the policies as that user. Falls back to null (anon client) when no
 * token is present, which is the demo/dev path.
 */
function requestDb(req: Parameters<RequestHandler>[0]) {
  return scopedClientFromAuthHeader(req.header('authorization'));
}

export const getFarms: RequestHandler = async (req, res) => {
  try {
    const farms = await FarmService.getAllFarms(requestDb(req));
    res.json({
      status: 'success',
      data: farms,
      message: 'تم استرجاع المزارع بنجاح'
    });
  } catch (error) {
    console.error('Error fetching farms:', error);
    sendCaughtError(res, error, 'فشل في استرجاع المزارع');
  }
};

export const getFarmById: RequestHandler = async (req, res) => {
  try {
    const { farmId } = req.params;
    const farm = await FarmService.getFarmById(farmId, requestDb(req));
    
    if (!farm) {
      return res.status(404).json({
        status: 'error',
        message: 'المزرعة غير موجودة'
      });
    }

    res.json({
      status: 'success',
      data: farm,
      message: 'تم استرجاع المزرعة بنجاح'
    });
  } catch (error) {
    console.error('Error fetching farm:', error);
    sendCaughtError(res, error, 'فشل في استرجاع المزرعة');
  }
};

export const getFields: RequestHandler = async (req, res) => {
  try {
    const { farmId } = req.query;
    
    let fields;
    if (farmId) {
      fields = await FarmService.getFieldsByFarmId(farmId as string, requestDb(req));
    } else {
      // Get all fields for all farms
      const farms = await FarmService.getAllFarms(requestDb(req));
      const fieldPromises = farms.map(farm => FarmService.getFieldsByFarmId(farm.id, requestDb(req)));
      const fieldsArrays = await Promise.all(fieldPromises);
      fields = fieldsArrays.flat();
    }

    res.json({
      status: 'success',
      data: fields,
      message: 'تم استرجاع الحقول بنجاح'
    });
  } catch (error) {
    console.error('Error fetching fields:', error);
    sendCaughtError(res, error, 'فشل في استرجاع الحقول');
  }
};

export const getFieldById: RequestHandler = async (req, res) => {
  try {
    const { fieldId } = req.params;
    const field = await FarmService.getFieldById(fieldId, requestDb(req));
    
    if (!field) {
      return res.status(404).json({
        status: 'error',
        message: 'الحقل غير موجود'
      });
    }

    // Get soil data for this field
    const soilData = await FarmService.getSoilDataByFieldId(fieldId, 5, requestDb(req));
    const latestSoilData = soilData.length > 0 ? soilData[0] : null;

    res.json({
      status: 'success',
      data: {
        ...field,
        soilData: latestSoilData,
        soilHistory: soilData
      },
      message: 'تم استرجاع الحقل بنجاح'
    });
  } catch (error) {
    console.error('Error fetching field:', error);
    sendCaughtError(res, error, 'فشل في استرجاع الحقل');
  }
};

export const createField: RequestHandler = async (req, res) => {
  try {
    const fieldData = req.body ?? {};
    const missing: string[] = [];
    if (!fieldData.farm_id) missing.push('farm_id');
    if (!fieldData.name) missing.push('name');
    if (fieldData.size_hectares === undefined || fieldData.size_hectares === null)
      missing.push('size_hectares');
    if (!fieldData.soil_type) missing.push('soil_type');
    if (missing.length) {
      return res.status(400).json({
        status: 'error',
        code: 'INVALID_INPUT',
        message: 'بيانات الحقل غير مكتملة',
        missing,
      });
    }

    const newField = await FarmService.createField(fieldData, requestDb(req));

    res.status(201).json({
      status: 'success',
      data: newField,
      message: 'تم إنشاء الحقل بنجاح'
    });
  } catch (error) {
    console.error('Error creating field:', error);
    sendCaughtError(res, error, 'فشل في إنشاء الحقل');
  }
};

export const updateField: RequestHandler = async (req, res) => {
  try {
    const { fieldId } = req.params;
    const updates = req.body ?? {};
    
    const updatedField = await FarmService.updateField(fieldId, updates, requestDb(req));

    if (!updatedField) {
      return res.status(404).json({
        status: 'error',
        message: 'الحقل غير موجود'
      });
    }

    res.json({
      status: 'success',
      data: updatedField,
      message: 'تم تحديث الحقل بنجاح'
    });
  } catch (error) {
    console.error('Error updating field:', error);
    sendCaughtError(res, error, 'فشل في تحديث الحقل');
  }
};

export const deleteField: RequestHandler = async (req, res) => {
  try {
    const { fieldId } = req.params;
    await FarmService.deleteField(fieldId, requestDb(req));

    res.json({
      status: 'success',
      message: 'تم حذف الحقل بنجاح'
    });
  } catch (error) {
    console.error('Error deleting field:', error);
    sendCaughtError(res, error, 'فشل في حذف الحقل');
  }
};

export const getCropHistory: RequestHandler = async (req, res) => {
  try {
    const { fieldId } = req.query;
    
    if (!fieldId) {
      return res.status(400).json({
        status: 'error',
        message: 'معرف الحقل مطلوب'
      });
    }

    const recommendations = await CropService.getCropRecommendationsByFieldId(fieldId as string, requestDb(req));

    res.json({
      status: 'success',
      data: recommendations,
      message: 'تم استرجاع تاريخ المحاصيل بنجاح'
    });
  } catch (error) {
    console.error('Error fetching crop history:', error);
    sendCaughtError(res, error, 'فشل في استرجاع تاريخ المحاصيل');
  }
};

export const getFieldAlerts: RequestHandler = async (_req, res) => {
  // Do not manufacture alerts. Until alert rules are backed by measured sensor
  // or soil records and a persisted resolution workflow, report an explicit
  // empty, unconfigured feed instead of showing a fabricated warning.
  return res.json({
    status: 'success',
    data: [],
    provenance: { source: 'not-configured', simulated: false, persisted: false },
    message: 'لا توجد تنبيهات موثّقة متاحة حالياً.',
  });
};

export const getActivityLogs: RequestHandler = async (_req, res) => {
  // Activity history is not yet connected to a persisted event table.
  // An empty feed is safer than inventing a farmer, timestamp or soil values.
  return res.json({
    status: 'success',
    data: [],
    provenance: { source: 'not-configured', simulated: false, persisted: false },
    message: 'سجلّ الأنشطة غير مربوط بقاعدة البيانات بعد.',
  });
};

export const getFieldPerformance: RequestHandler = async (req, res) => {
  try {
    const { fieldId } = req.params;
    
    const field = await FarmService.getFieldById(fieldId, requestDb(req));
    if (!field) {
      return res.status(404).json({
        status: 'error',
        message: 'الحقل غير موجود'
      });
    }

    // Get recent soil data
    const soilData = await FarmService.getSoilDataByFieldId(fieldId, 10, requestDb(req));
    
    // Get crop recommendations
    const cropRecommendations = await CropService.getCropRecommendationsByFieldId(fieldId, requestDb(req));

    // Calculate performance metrics
    const performance = {
      fieldId,
      soilHealth: {
        score: soilData.length > 0 ? calculateSoilHealthScore(soilData[0]) : 0,
        trend: soilData.length > 1 ? calculateTrend(soilData) : 'stable',
        factors: {
          ph: soilData[0]?.ph || 0,
          nutrients: {
            nitrogen: soilData[0]?.nitrogen || 0,
            phosphorus: soilData[0]?.phosphorus || 0,
            potassium: soilData[0]?.potassium || 0
          },
          moisture: soilData[0]?.moisture || 0
        }
      },
      cropSuitability: cropRecommendations.length > 0 ? 
        cropRecommendations[0].confidence_score : 0,
      averageYield: cropRecommendations.length > 0 ? 
        cropRecommendations.reduce((sum, rec) => sum + rec.expected_yield_tons_per_hectare, 0) / cropRecommendations.length : 0,
      profitability: cropRecommendations.length > 0 ? 
        cropRecommendations.reduce((sum, rec) => sum + rec.estimated_profit_per_hectare, 0) / cropRecommendations.length : 0,
      lastUpdated: new Date().toISOString()
    };

    res.json({
      status: 'success',
      data: performance,
      message: 'تم استرجاع أداء الحقل بنجاح'
    });
  } catch (error) {
    console.error('Error fetching field performance:', error);
    sendCaughtError(res, error, 'فشل في استرجاع أداء الحقل');
  }
};

export const generateAIRecommendations: RequestHandler = async (req, res) => {
  try {
    const { fieldId, cropType, soilData } = req.body;
    
    if (!fieldId) {
      return res.status(400).json({
        status: 'error',
        message: 'معرف الحقل مطلوب'
      });
    }
    // Field ids are UUIDs. Reject anything else before it reaches the database,
    // so a malformed id is a clean 404 instead of a 500 from a Postgres cast
    // error (whose message used to be echoed to the client).
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(fieldId))) {
      return res.status(404).json({
        status: 'error',
        message: 'الحقل غير موجود'
      });
    }

    // Get field information
    const field = await FarmService.getFieldById(fieldId, requestDb(req));
    if (!field) {
      return res.status(404).json({
        status: 'error',
        message: 'الحقل غير موجود'
      });
    }

    // Recommendations must be based on persisted measurements, not values
    // supplied by the browser. Client-provided soilData is intentionally ignored
    // because it is unverified and could make the report appear evidence-backed.
    const currentSoilData = await FarmService.getLatestSoilData(fieldId, requestDb(req));
    if (!currentSoilData) {
      return res.status(409).json({
        status: "error",
        code: "PERSISTED_SOIL_DATA_REQUIRED",
        message: "يلزم حفظ تحليل تربة موثّق لهذا الحقل قبل إنشاء توصيات زراعية مرتبطة به.",
        provenance: { source: "supabase.soil_analyses", persisted: false },
      });
    }

    // Score crops with the deterministic agronomic engine. This previously
    // returned Math.random() scores and invented yield/profit figures, which
    // presented fabricated numbers to the farmer as AI output.
    const engine = recommendCrops({
      ph: currentSoilData?.ph,
      temperature: currentSoilData?.temperature,
    });

    // Attach the reference-table metadata (crop id, maturity) the client needs,
    // without inventing yield or profit.
    const allCrops = await CropService.getAllCrops().catch(() => []);
    const byName = new Map(allCrops.map((c) => [c.name, c]));
    const recommendations = engine.recommendations.slice(0, 5).map((rec) => {
      const crop = byName.get(rec.crop);
      return {
        cropId: crop?.id ?? rec.crop,
        cropName: rec.crop,
        cropNameAr: rec.nameAr,
        suitabilityScore: rec.suitabilityScore,
        reasons: rec.reasonsAr,
        waterNeed: rec.waterNeedAr,
        plantingSeason: rec.seasonAr,
        daysToMaturity: crop?.days_to_maturity ?? null,
        recommendations: `يُنصح بزراعة ${rec.nameAr} في هذا الحقل`,
      };
    });

    res.json({
      status: 'success',
      data: {
        fieldId,
        recommendations,
        soilAnalysis: currentSoilData,
        dataSource: 'rule-based',
        isRealData: false,
        disclaimer: `${SIMULATED_DISCLAIMER_AR} درجات الملاءمة محسوبة بقواعد زراعية، والأرقام الفلاحية المتوقعة (المردود/الربح) غير مُدرجة لعدم توفر بيانات محلية موثوقة.`,
        generatedAt: new Date().toISOString()
      },
      message: 'تم إنتاج التوصيات بنجاح'
    });
  } catch (error) {
    console.error('Error generating AI recommendations:', error);
    sendCaughtError(res, error, 'فشل في إنتاج التوصيات');
  }
};

// Helper functions
function calculateSoilHealthScore(soilData: any): number {
  if (!soilData) return 0;
  
  let score = 0;
  let factors = 0;
  
  // pH score (optimal range 6.0-7.5)
  if (soilData.ph >= 6.0 && soilData.ph <= 7.5) {
    score += 25;
  } else {
    score += Math.max(0, 25 - Math.abs(soilData.ph - 6.75) * 10);
  }
  factors++;
  
  // Nitrogen score (good range 40-60)
  if (soilData.nitrogen >= 40 && soilData.nitrogen <= 60) {
    score += 25;
  } else {
    score += Math.max(0, 25 - Math.abs(soilData.nitrogen - 50) / 2);
  }
  factors++;
  
  // Phosphorus score (good range 25-40)
  if (soilData.phosphorus >= 25 && soilData.phosphorus <= 40) {
    score += 25;
  } else {
    score += Math.max(0, 25 - Math.abs(soilData.phosphorus - 32.5) / 1.5);
  }
  factors++;
  
  // Potassium score (good range 25-35)
  if (soilData.potassium >= 25 && soilData.potassium <= 35) {
    score += 25;
  } else {
    score += Math.max(0, 25 - Math.abs(soilData.potassium - 30) / 1);
  }
  factors++;
  
  return Math.round(score / factors * 4); // Scale to 100
}

function calculateTrend(soilDataArray: any[]): 'improving' | 'declining' | 'stable' {
  if (soilDataArray.length < 2) return 'stable';
  
  const recent = calculateSoilHealthScore(soilDataArray[0]);
  const previous = calculateSoilHealthScore(soilDataArray[1]);
  
  const diff = recent - previous;
  
  if (diff > 5) return 'improving';
  if (diff < -5) return 'declining';
  return 'stable';
}

export const createFarm: RequestHandler = async (req, res) => {
  try {
    const db = requestDb(req);
    if (!db || req.identitySource !== "jwt" || !req.userId) {
      return res.status(401).json({
        success: false,
        code: "VERIFIED_SESSION_REQUIRED",
        message: "يلزم تسجيل دخول موثّق لإنشاء مزرعة.",
      });
    }

    const body = req.body ?? {};
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const region = typeof body.region === "string" ? body.region.trim() : "";
    const size = Number(body.size_hectares);
    if (!name || name.length > 180 || !region || region.length > 120 || !Number.isFinite(size) || size <= 0) {
      return res.status(400).json({
        success: false,
        code: "INVALID_FARM_INPUT",
        message: "اسم المزرعة والمنطقة والمساحة بالهكتار بيانات إلزامية.",
      });
    }

    const { data, error } = await db.from("farms").insert({
      owner_id: req.userId,
      name,
      description: typeof body.description === "string" ? body.description.slice(0, 2000) : null,
      location: { region, country: "Tunisia" },
      size_hectares: size,
      soil_type: typeof body.soil_type === "string" ? body.soil_type.slice(0, 100) : null,
      climate_zone: typeof body.climate_zone === "string" ? body.climate_zone.slice(0, 100) : null,
      water_source: typeof body.water_source === "string" ? body.water_source.slice(0, 100) : null,
      irrigation_type: typeof body.irrigation_type === "string" ? body.irrigation_type.slice(0, 100) : null,
    }).select("id,name,size_hectares,location,soil_type,created_at").single();

    if (error) {
      const missingTable = error.code === "PGRST205" || /Could not find the table/i.test(error.message || "");
      const denied = error.code === "42501";
      console.error("Farm creation failed:", { code: error.code, details: error.details });
      return res.status(503).json({
        success: false,
        code: missingTable ? "FARM_MIGRATION_REQUIRED" : denied ? "FARM_RLS_DENIED" : "FARM_PERSISTENCE_FAILED",
        databaseCode: error.code,
        message: missingTable
          ? "جدول المزارع غير ظاهر في Supabase schema cache. تحقق من migration ثم حدّث schema cache."
          : denied
            ? "قاعدة البيانات رفضت إنشاء المزرعة بسبب RLS أو عدم تطابق ملكية المستخدم."
            : "لم يتم حفظ المزرعة في قاعدة البيانات. لم يتم تسجيل العملية كنجاح.",
      });
    }

    return res.status(201).json({
      success: true,
      data,
      provenance: { source: "supabase.farms", persisted: true },
      message: "تم حفظ المزرعة بنجاح.",
    });
  } catch (error) {
    console.error("Farm creation failed:", error);
    sendCaughtError(res, error, "فشل في إنشاء المزرعة");
  }
};
