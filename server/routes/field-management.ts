import { RequestHandler } from 'express';
import { FarmService } from '../services/farmService';
import { CropService } from '../services/cropService';
import { sendCaughtError } from '../lib/errors';
import { recommendCrops } from '../services/ai/knowledgeEngine';
import { SIMULATED_DISCLAIMER_AR } from '../lib/provenance';

// ============ API HANDLERS ============

export const getFarms: RequestHandler = async (req, res) => {
  try {
    const farms = await FarmService.getAllFarms();
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
    const farm = await FarmService.getFarmById(farmId);
    
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
      fields = await FarmService.getFieldsByFarmId(farmId as string);
    } else {
      // Get all fields for all farms
      const farms = await FarmService.getAllFarms();
      const fieldPromises = farms.map(farm => FarmService.getFieldsByFarmId(farm.id));
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
    const field = await FarmService.getFieldById(fieldId);
    
    if (!field) {
      return res.status(404).json({
        status: 'error',
        message: 'الحقل غير موجود'
      });
    }

    // Get soil data for this field
    const soilData = await FarmService.getSoilDataByFieldId(fieldId, 5);
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

    const newField = await FarmService.createField(fieldData);

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
    
    const updatedField = await FarmService.updateField(fieldId, updates);

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
    await FarmService.deleteField(fieldId);

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

    const recommendations = await CropService.getCropRecommendationsByFieldId(fieldId as string);

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

export const getFieldAlerts: RequestHandler = async (req, res) => {
  try {
    const { fieldId } = req.query;
    
    // For now, return mock alerts until we implement a full alerting system
    const alerts = [
      {
        id: 'alert_1',
        fieldId: fieldId,
        type: 'soil_moisture',
        severity: 'medium',
        title: 'انخفاض في رطوبة التربة',
        titleEn: 'Low Soil Moisture',
        message: 'مستوى الرطوبة في التربة أقل من المعدل المطلوب',
        messageEn: 'Soil moisture level is below required threshold',
        timestamp: new Date().toISOString(),
        resolved: false
      }
    ];

    res.json({
      status: 'success',
      data: alerts,
      message: 'تم استرجاع التنبيهات بنجاح'
    });
  } catch (error) {
    console.error('Error fetching field alerts:', error);
    sendCaughtError(res, error, 'فشل في استرجاع التنبيهات');
  }
};

export const getActivityLogs: RequestHandler = async (req, res) => {
  try {
    const { fieldId, farmId } = req.query;
    
    // For now, return mock activity logs until we implement full activity tracking
    const activities = [
      {
        id: 'activity_1',
        fieldId: fieldId,
        farmId: farmId,
        type: 'soil_analysis',
        description: 'تحليل التربة',
        descriptionEn: 'Soil Analysis',
        user: 'المزارع أحمد',
        userEn: 'Farmer Ahmed',
        timestamp: new Date().toISOString(),
        data: {
          ph: 6.5,
          nitrogen: 45,
          phosphorus: 32
        }
      }
    ];

    res.json({
      status: 'success',
      data: activities,
      message: 'تم استرجاع سجل الأنشطة بنجاح'
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    sendCaughtError(res, error, 'فشل في استرجاع سجل الأنشطة');
  }
};

export const getFieldPerformance: RequestHandler = async (req, res) => {
  try {
    const { fieldId } = req.params;
    
    const field = await FarmService.getFieldById(fieldId);
    if (!field) {
      return res.status(404).json({
        status: 'error',
        message: 'الحقل غير موجود'
      });
    }

    // Get recent soil data
    const soilData = await FarmService.getSoilDataByFieldId(fieldId, 10);
    
    // Get crop recommendations
    const cropRecommendations = await CropService.getCropRecommendationsByFieldId(fieldId);

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
    const field = await FarmService.getFieldById(fieldId);
    if (!field) {
      return res.status(404).json({
        status: 'error',
        message: 'الحقل غير موجود'
      });
    }

    // Get latest soil data if not provided
    let currentSoilData = soilData;
    if (!currentSoilData) {
      const latestSoil = await FarmService.getLatestSoilData(fieldId);
      currentSoilData = latestSoil;
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
