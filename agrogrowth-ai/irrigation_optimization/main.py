"""
Main API for Smart Irrigation Optimization Service
FastAPI service for intelligent irrigation scheduling and water management
"""

import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Any, Optional
import logging
from datetime import datetime
import uvicorn

from irrigation_optimization.smart_irrigation_optimizer import create_smart_irrigation_optimizer
from ai_common.llm_provider import get_provider
from ai_common.advisory import narrate

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Smart Irrigation Optimizer API",
    description="نظام ذكي لتحسين الري وإدارة المياه",
    version="1.0.0"
)

# Initialize the irrigation optimizer
irrigation_optimizer = create_smart_irrigation_optimizer()

# Pydantic models for API
class WeatherData(BaseModel):
    temperature: float = 25.0
    humidity: float = 60.0
    wind_speed: float = 5.0
    solar_radiation: float = 25.0
    recent_rainfall: float = 0.0

class SoilData(BaseModel):
    moisture_percentage: float = 50.0
    field_capacity: float = 35.0
    wilting_point: float = 15.0
    soil_type: str = "loamy"
    soil_type_factor: float = 1.0
    irrigation_strategy: str = "balanced"  # conservative, balanced, intensive

class IrrigationOptimizationRequest(BaseModel):
    crop_type: str = "wheat"
    growth_stage: str = "vegetative"
    weather_data: WeatherData = WeatherData()
    soil_data: SoilData = SoilData()
    farm_size: float = 1.0
    days_ahead: int = 7
    language: Optional[str] = None  # advisory language: ar, ar-tn, fr or en

class IrrigationScheduleRequest(BaseModel):
    crop_type: str
    current_soil_moisture: float
    weather_forecast: List[Dict[str, Any]]
    farm_size: float = 1.0

class WaterRequirementRequest(BaseModel):
    crop_type: str
    growth_stage: str
    temperature: float
    humidity: float
    days_to_calculate: int = 30

@app.post("/optimize-irrigation")
async def optimize_irrigation_schedule(request: IrrigationOptimizationRequest):
    """
    تحسين جدولة الري بناءً على المعطيات المدخلة
    """
    raise HTTPException(
        status_code=503,
        detail={
            "code": "IRRIGATION_MODEL_NOT_VALIDATED",
            "message": "The current irrigation optimizer uses synthetic training data and is disabled for production scheduling.",
            "production_ready": False,
        },
    )

    try:
        logger.info(f"Optimizing irrigation for crop: {request.crop_type}, stage: {request.growth_stage}")
        
        input_data = {
            'crop_type': request.crop_type,
            'growth_stage': request.growth_stage,
            'weather_data': request.weather_data.model_dump(),
            'soil_data': request.soil_data.model_dump(),
            'farm_size': request.farm_size,
            'days_ahead': request.days_ahead
        }
        
        result = irrigation_optimizer.optimize_irrigation_schedule(input_data)
        
        # The numeric schedule is synthetic; a configured LLM adds a labelled
        # advisory explaining the plan and the water savings to the farmer.
        advisory = narrate(
            result,
            task="Explain this irrigation schedule and how to follow it.",
            language=request.language,
            context={"crop_type": request.crop_type, "growth_stage": request.growth_stage},
        )
        if advisory:
            result['advisory'] = advisory

        return {
            'success': True,
            'data': result,
            'data_source': 'synthetic-model',
            'is_real_data': False,
            'model_source': 'synthetic-demo',
            'message': 'تم تحسين جدولة الري بنجاح'
        }
        
    except Exception as e:
        logger.error(f"Error in irrigation optimization: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/calculate-water-requirements")
async def calculate_water_requirements(request: WaterRequirementRequest):
    """
    حساب الاحتياجات المائية للمحصول
    """
    raise HTTPException(
        status_code=503,
        detail={
            "code": "WEATHER_INPUTS_INCOMPLETE",
            "message": "This endpoint previously injected fixed wind-speed and solar-radiation values. Supply a validated ET0/weather source before calculating water requirements.",
            "production_ready": False,
        },
    )

    try:
        weather_data = {
            'temperature': request.temperature,
            'humidity': request.humidity,
            'wind_speed': 5.0,
            'solar_radiation': 25.0
        }
        
        result = irrigation_optimizer._calculate_water_requirements(
            request.crop_type, request.growth_stage, weather_data
        )
        
        return {
            'success': True,
            'data': result,
            'message': 'تم حساب الاحتياجات المائية بنجاح'
        }
        
    except Exception as e:
        logger.error(f"Error calculating water requirements: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/crop-water-database")
async def get_crop_water_database():
    """
    الحصول على قاعدة بيانات الاحتياجات المائية للمحاصيل
    """
    try:
        return {
            'success': True,
            'data': irrigation_optimizer.crop_water_requirements,
            'message': 'تم جلب قاعدة البيانات بنجاح'
        }
        
    except Exception as e:
        logger.error(f"Error fetching crop database: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/irrigation-methods")
async def get_irrigation_methods():
    """
    الحصول على معلومات طرق الري المختلفة
    """
    try:
        return {
            'success': True,
            'data': irrigation_optimizer.irrigation_methods,
            'message': 'تم جلب معلومات طرق الري بنجاح'
        }
        
    except Exception as e:
        logger.error(f"Error fetching irrigation methods: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze-soil-moisture")
async def analyze_soil_moisture(
    crop_type: str,
    current_moisture: float,
    field_capacity: float,
    wilting_point: float
):
    """
    تحليل رطوبة التربة وتحديد الحاجة للري
    """
    raise HTTPException(
        status_code=503,
        detail={
            "code": "WEATHER_INPUTS_INCOMPLETE",
            "message": "This endpoint previously injected fixed weather values. A verified weather/ET0 input is required for a defensible irrigation assessment.",
            "production_ready": False,
        },
    )

    try:
        soil_data = {
            'moisture_percentage': current_moisture,
            'field_capacity': field_capacity,
            'wilting_point': wilting_point
        }
        
        weather_data = {
            'temperature': 25.0,
            'humidity': 60.0,
            'wind_speed': 5.0,
            'solar_radiation': 25.0
        }
        
        analysis = irrigation_optimizer._analyze_current_conditions(
            weather_data, soil_data, crop_type, 'vegetative'
        )
        
        return {
            'success': True,
            'data': analysis,
            'message': 'تم تحليل رطوبة التربة بنجاح'
        }
        
    except Exception as e:
        logger.error(f"Error analyzing soil moisture: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/recommend-irrigation-method")
async def recommend_irrigation_method(
    crop_type: str,
    farm_size: float,
    soil_type: str = "loamy",
    budget: Optional[float] = None
):
    """
    توصية طريقة الري المثلى
    """
    try:
        soil_data = {
            'soil_type': soil_type,
            'budget_constraint': budget
        }
        
        recommendation = irrigation_optimizer._recommend_irrigation_method(
            crop_type, soil_data, farm_size
        )
        
        return {
            'success': True,
            'data': recommendation,
            'message': 'تم تحديد طريقة الري المثلى بنجاح'
        }
        
    except Exception as e:
        logger.error(f"Error recommending irrigation method: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/water-conservation-tips/{crop_type}")
async def get_water_conservation_tips(crop_type: str):
    """
    نصائح توفير المياه للمحصول المحدد
    """
    raise HTTPException(
        status_code=503,
        detail={
            "code": "LIVE_WEATHER_NOT_CONFIGURED",
            "message": "This endpoint previously generated tips from mock weather and a fixed irrigation method; mock context is disabled.",
            "production_ready": False,
        },
    )

    try:
        # Mock current analysis for tips generation
        current_analysis = {
            'weather_conditions': {
                'temperature': 25.0,
                'humidity': 60.0,
                'wind_speed': 5.0
            }
        }
        
        irrigation_method = {'recommended_method': 'drip'}
        
        tips = irrigation_optimizer._generate_water_conservation_tips(
            crop_type, irrigation_method, current_analysis
        )
        
        return {
            'success': True,
            'data': tips,
            'message': 'تم جلب نصائح توفير المياه بنجاح'
        }
        
    except Exception as e:
        logger.error(f"Error fetching conservation tips: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """
    فحص صحة الخدمة
    """
    return {
        'status': 'degraded',
        'production_ready': False,
        'disabled_features': [
            'irrigation_optimization',
            'water_requirement_estimation',
            'soil_moisture_assessment',
            'weather_based_conservation_tips',
        ],
        'service': 'Smart Irrigation Optimizer',
        # Trained on synthetic samples generated in-process.
        'model_source': 'synthetic-demo',
        'advisory_model_source': get_provider().model_source()
        if get_provider().is_configured()
        else None,
        'advisory_configured': get_provider().is_configured(),
        'timestamp': datetime.now().isoformat(),
        'model_trained': irrigation_optimizer.is_trained
    }

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8008))
    uvicorn.run(app, host="0.0.0.0", port=port)
