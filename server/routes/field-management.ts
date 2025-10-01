import { RequestHandler } from 'express';
import { FarmService } from '../services/farmService';
import { CropService } from '../services/cropService';

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
    res.status(500).json({
      status: 'error',
      message: 'فشل في استرجاع المزارع',
      error: error.message
    });
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
    res.status(500).json({
      status: 'error',
      message: 'فشل في استرجاع المزرعة',
      error: error.message
    });
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
    res.status(500).json({
      status: 'error',
      message: 'فشل في استرجاع الحقول',
      error: error.message
    });
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
    res.status(500).json({
      status: 'error',
      message: 'فشل في استرجاع الحقل',
      error: error.message
    });
  }
};

export const createField: RequestHandler = async (req, res) => {
  try {
    const fieldData = req.body;
    const newField = await FarmService.createField(fieldData);

    res.status(201).json({
      status: 'success',
      data: newField,
      message: 'تم إنشاء الحقل بنجاح'
    });
  } catch (error) {
    console.error('Error creating field:', error);
    res.status(500).json({
      status: 'error',
      message: 'فشل في إنشاء الحقل',
      error: error.message
    });
  }
};

export const updateField: RequestHandler = async (req, res) => {
  try {
    const { fieldId } = req.params;
    const updates = req.body;
    
    const updatedField = await FarmService.updateField(fieldId, updates);

    res.json({
      status: 'success',
      data: updatedField,
      message: 'تم تحديث الحقل بنجاح'
    });
  } catch (error) {
    console.error('Error updating field:', error);
    res.status(500).json({
      status: 'error',
      message: 'فشل في تحديث الحقل',
      error: error.message
    });
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
    res.status(500).json({
      status: 'error',
      message: 'فشل في حذف الحقل',
      error: error.message
    });
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
    res.status(500).json({
      status: 'error',
      message: 'فشل في استرجاع تاريخ المحاصيل',
      error: error.message
    });
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
    res.status(500).json({
      status: 'error',
      message: 'فشل في استرجاع التنبيهات',
      error: error.message
    });
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
    res.status(500).json({
      status: 'error',
      message: 'فشل في استرجاع سجل الأنشطة',
      error: error.message
    });
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
    res.status(500).json({
      status: 'error',
      message: 'فشل في استرجاع أداء الحقل',
      error: error.message
    });
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

    // Get suitable crops
    const allCrops = await CropService.getAllCrops();
    
    // Generate recommendations based on soil data and field characteristics
    const recommendations = allCrops.slice(0, 5).map(crop => ({
      cropId: crop.id,
      cropName: crop.name,
      cropNameAr: crop.name_ar,
      suitabilityScore: Math.random() * 100, // This would be calculated by AI service
      expectedYield: Math.random() * 10 + 2,
      estimatedProfit: Math.random() * 5000 + 1000,
      plantingDate: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
      harvestDate: new Date(Date.now() + (90 + crop.days_to_maturity) * 24 * 60 * 60 * 1000).toISOString(),
      riskFactors: [],
      recommendations: `يُنصح بزراعة ${crop.name_ar} في هذا الحقل`
    }));

    res.json({
      status: 'success',
      data: {
        fieldId,
        recommendations,
        soilAnalysis: currentSoilData,
        generatedAt: new Date().toISOString()
      },
      message: 'تم إنتاج التوصيات بنجاح'
    });
  } catch (error) {
    console.error('Error generating AI recommendations:', error);
    res.status(500).json({
      status: 'error',
      message: 'فشل في إنتاج التوصيات',
      error: error.message
    });
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
