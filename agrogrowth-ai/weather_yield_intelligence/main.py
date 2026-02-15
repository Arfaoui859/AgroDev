"""
Main API for Weather and Yield Intelligence Services
Combined FastAPI service for SmartWeatherCropPlanner and YieldPredictorAI
"""

from fastapi import FastAPI, HTTPException, File, UploadFile
from pydantic import BaseModel
from typing import Dict, List, Any, Optional, Union
import logging
from datetime import datetime
import uvicorn
import base64

from weather_yield_intelligence.smart_weather_crop_planner import create_smart_weather_crop_planner
from weather_yield_intelligence.yield_predictor_ai import create_yield_predictor_ai

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Weather & Yield Intelligence API",
    description="نظام ذكي للتخطيط المناخي وتوقع المردودية",
    version="1.0.0"
)

# Initialize services
weather_planner = create_smart_weather_crop_planner()
yield_predictor = create_yield_predictor_ai()

# Pydantic models for API
class LocationData(BaseModel):
    latitude: float = 35.0
    longitude: float = 10.0
    elevation: float = 100.0
    region: str = "تونس"

class WeatherData(BaseModel):
    temperature: float = 25.0
    humidity: float = 60.0
    rainfall: float = 400.0
    wind_speed: float = 5.0
    solar_radiation: float = 25.0
    recent_rainfall: float = 0.0
    annual_rainfall: float = 400.0
    temperature_variation: float = 10.0

class SoilData(BaseModel):
    ph: float = 6.5
    fertility_score: float = 0.7
    organic_matter: float = 3.0
    moisture_percentage: float = 50.0
    soil_type: str = "loamy"
    field_capacity: float = 35.0
    wilting_point: float = 15.0

class ManagementPractices(BaseModel):
    irrigation_efficiency: float = 0.8
    fertilizer_application_rate: float = 1.0
    pest_management_score: float = 0.8
    disease_control_score: float = 0.8
    organic_farming: bool = False

class FarmProfile(BaseModel):
    farm_size: float = 1.0
    experience_years: int = 5
    budget_level: str = "medium"  # low, medium, high
    technology_adoption: str = "medium"  # low, medium, high

class WeatherPlanningRequest(BaseModel):
    location: LocationData = LocationData()
    historical_weather: WeatherData = WeatherData()
    current_conditions: WeatherData = WeatherData()
    crop_options: List[str] = ["wheat", "corn", "tomato", "potato", "olive"]
    farm_profile: FarmProfile = FarmProfile()
    planning_horizon_months: int = 12

class YieldPredictionRequest(BaseModel):
    crop_type: str = "wheat"
    location: LocationData = LocationData()
    weather_data: WeatherData = WeatherData()
    soil_data: SoilData = SoilData()
    management_practices: ManagementPractices = ManagementPractices()
    farm_size: float = 1.0
    planting_date: Optional[str] = None
    variety_info: Dict[str, Any] = {}
    field_image: Optional[str] = None  # base64 encoded

class CombinedAnalysisRequest(BaseModel):
    weather_planning: WeatherPlanningRequest = WeatherPlanningRequest()
    yield_prediction: YieldPredictionRequest = YieldPredictionRequest()
    analysis_scope: str = "comprehensive"  # basic, detailed, comprehensive

@app.post("/create-weather-plan")
async def create_weather_based_plan(request: WeatherPlanningRequest):
    """
    إنشاء خطة زراعة ذكية حسب الطقس والمناخ
    """
    try:
        logger.info(f"Creating weather-based plan for location: {request.location.region}")
        
        input_data = request.dict()
        result = weather_planner.create_weather_based_plan(input_data)
        
        return {
            'success': True,
            'data': result,
            'message': 'تم إنشاء الخطة المناخية بنجاح'
        }
        
    except Exception as e:
        logger.error(f"Error creating weather plan: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict-crop-yield")
async def predict_crop_yield(request: YieldPredictionRequest):
    """
    التنبؤ بمردودية المحصول بناءً على الظروف الحالية
    """
    try:
        logger.info(f"Predicting yield for crop: {request.crop_type}")
        
        input_data = request.dict()
        result = yield_predictor.predict_crop_yield(input_data)
        
        return {
            'success': True,
            'data': result,
            'message': 'تم التنبؤ بالمردودية بنجاح'
        }
        
    except Exception as e:
        logger.error(f"Error predicting yield: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/combined-analysis")
async def comprehensive_analysis(request: CombinedAnalysisRequest):
    """
    تحليل شامل يدمج التخطيط المناخي والتنبؤ بالمردودية
    """
    try:
        logger.info("Performing comprehensive weather and yield analysis")
        
        # تحليل التخطيط المناخي
        weather_input = request.weather_planning.dict()
        weather_analysis = weather_planner.create_weather_based_plan(weather_input)
        
        # تحليل توقع المردودية
        yield_input = request.yield_prediction.dict()
        yield_analysis = yield_predictor.predict_crop_yield(yield_input)
        
        # دمج النتائج
        combined_insights = _generate_combined_insights(
            weather_analysis, yield_analysis, request.analysis_scope
        )
        
        # توصيات متكاملة
        integrated_recommendations = _generate_integrated_recommendations(
            weather_analysis, yield_analysis
        )
        
        return {
            'success': True,
            'data': {
                'weather_analysis': weather_analysis,
                'yield_analysis': yield_analysis,
                'combined_insights': combined_insights,
                'integrated_recommendations': integrated_recommendations,
                'executive_summary': _generate_executive_summary(
                    weather_analysis, yield_analysis
                )
            },
            'message': 'تم إنجاز التحليل الشامل بنجاح'
        }
        
    except Exception as e:
        logger.error(f"Error in comprehensive analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload-field-image")
async def analyze_field_image(file: UploadFile = File(...)):
    """
    رفع وتحليل صورة الحقل لتقدير المردودية
    """
    try:
        # قراءة الصورة
        image_data = await file.read()
        
        # تحليل الصورة
        analysis = yield_predictor._analyze_field_image(image_data)
        
        return {
            'success': True,
            'data': analysis,
            'message': 'تم تحليل صورة الحقل بنجاح'
        }
        
    except Exception as e:
        logger.error(f"Error analyzing field image: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/climate-zones")
async def get_climate_zones():
    """
    الحصول على معلومات المناطق المناخية
    """
    try:
        return {
            'success': True,
            'data': weather_planner.climate_zones,
            'message': 'تم جلب معلومات المناطق المناخية'
        }
        
    except Exception as e:
        logger.error(f"Error fetching climate zones: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/crop-yield-database")
async def get_crop_yield_database():
    """
    الحصول على قاعدة بيانات عوائد المحاصيل
    """
    try:
        return {
            'success': True,
            'data': yield_predictor.crop_yield_database,
            'message': 'تم جلب قاعدة بيانات العوائد'
        }
        
    except Exception as e:
        logger.error(f"Error fetching yield database: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/assess-climate-suitability")
async def assess_crop_climate_suitability(
    crop_type: str,
    location: LocationData = LocationData(),
    current_weather: WeatherData = WeatherData()
):
    """
    تقييم ملائمة المحصول للظروف المناخية
    """
    try:
        input_data = {
            'crop_options': [crop_type],
            'location': location.dict(),
            'current_conditions': current_weather.dict()
        }
        
        # محاكاة تحلي�� مناخي مبسط
        climate_analysis = {
            'climate_zone': {'zone_type': 'mediterranean'},
            'climate_trends': {'warming_rate': 0.2}
        }
        
        suitability = weather_planner._assess_crop_climate_suitability(
            input_data, climate_analysis
        )
        
        return {
            'success': True,
            'data': suitability[0] if suitability else {},
            'message': 'تم تقييم الملائمة المناخية'
        }
        
    except Exception as e:
        logger.error(f"Error assessing climate suitability: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/optimize-planting-schedule")
async def optimize_planting_schedule(
    crop_types: List[str],
    location: LocationData = LocationData(),
    planning_months: int = 12
):
    """
    تحسين جدولة الزراعة للمحاصيل المختلفة
    """
    try:
        input_data = {
            'crop_options': crop_types,
            'location': location.dict(),
            'planning_horizon_months': planning_months
        }
        
        # محاكاة تحليل مناخي
        climate_analysis = {
            'climate_zone': {'zone_type': 'mediterranean'},
            'seasonal_outlook': {'favorable_months': [3, 4, 5, 10, 11]}
        }
        
        optimal_timing = weather_planner._determine_optimal_planting_times(
            input_data, climate_analysis
        )
        
        return {
            'success': True,
            'data': optimal_timing,
            'message': 'تم تحسين جدولة الزراعة'
        }
        
    except Exception as e:
        logger.error(f"Error optimizing planting schedule: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """
    فحص صحة الخدمة
    """
    return {
        'status': 'healthy',
        'services': {
            'weather_planner': {
                'status': 'active',
                'model_trained': weather_planner.is_trained
            },
            'yield_predictor': {
                'status': 'active', 
                'model_trained': yield_predictor.is_trained
            }
        },
        'timestamp': datetime.now().isoformat()
    }

# Helper functions
def _generate_combined_insights(weather_analysis: Dict, yield_analysis: Dict, 
                              scope: str) -> Dict[str, Any]:
    """توليد رؤى مدمجة من التحليلين"""
    insights = {
        'key_findings': [],
        'opportunities': [],
        'risks': [],
        'synergies': []
    }
    
    # تحليل النتائج المدمجة
    if weather_analysis.get('climate_analysis', {}).get('climate_zone', {}).get('zone_type') == 'mediterranean':
        insights['key_findings'].append('المنطقة مناسبة للزراعة المتوسطية')
    
    if yield_analysis.get('yield_prediction', {}).get('yield_category') in ['ممتاز', 'جيد جداً']:
        insights['opportunities'].append('إمكانية تحقيق عوائد عالية')
    
    # تحديد المخاطر المشتركة
    weather_risks = weather_analysis.get('weather_risks', {}).get('overall_risk_level', 'منخفض')
    if weather_risks in ['عالي', 'متوسط']:
        insights['risks'].append('مخاطر مناخية تتطلب إدارة دقيقة')
    
    return insights

def _generate_integrated_recommendations(weather_analysis: Dict, 
                                       yield_analysis: Dict) -> List[Dict[str, Any]]:
    """توليد توصيات متكاملة"""
    recommendations = []
    
    # توصيات مبنية على التحليل المناخي
    if weather_analysis.get('adaptation_strategies'):
        recommendations.extend([
            {
                'category': 'التكيف المناخي',
                'recommendation': 'تطبيق استراتيجيات التكيف المناخي الموصى بها',
                'priority': 'عالي',
                'source': 'تحليل مناخي'
            }
        ])
    
    # توصيات مبنية على توقع المردودية
    if yield_analysis.get('optimization_recommendations'):
        for rec in yield_analysis['optimization_recommendations'][:3]:
            recommendations.append({
                'category': rec.get('category', 'عام'),
                'recommendation': rec.get('recommendation', ''),
                'priority': rec.get('priority', 'متوسط'),
                'source': 'تحليل المردودية'
            })
    
    return recommendations

def _generate_executive_summary(weather_analysis: Dict, yield_analysis: Dict) -> Dict[str, Any]:
    """توليد ملخص تنفيذي"""
    return {
        'overall_assessment': 'تقييم شامل للظروف الزراعية',
        'climate_outlook': weather_analysis.get('climate_analysis', {}).get('climate_zone', {}).get('zone_type', 'غير محدد'),
        'yield_potential': yield_analysis.get('yield_prediction', {}).get('yield_category', 'غير محدد'),
        'key_recommendations': [
            'تطبيق ممارسات زراعية محسنة',
            'مراقبة الظروف الجوية',
            'تحسين إدارة المياه'
        ],
        'confidence_level': 'متوسط إلى عالي'
    }
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8004))  # Render يعطي PORT
    uvicorn.run("soil_analysis.main:app", host="0.0.0.0", port=port)
