"""
Main API for Pest Control Recommendation Service
FastAPI service for intelligent pest and disease management
"""

from fastapi import FastAPI, HTTPException, File, UploadFile
from pydantic import BaseModel
from typing import Dict, List, Any, Optional, Union
import logging
from datetime import datetime
import uvicorn
import base64

from .pest_control_recommender import create_pest_control_recommender

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Pest Control Recommender API",
    description="نظام ذكي لتوصية علاج الآفات والأمراض النباتية",
    version="1.0.0"
)

# Initialize the pest control recommender
pest_recommender = create_pest_control_recommender()

# Pydantic models for API
class WeatherConditions(BaseModel):
    temperature: float = 25.0
    humidity: float = 60.0
    recent_rainfall: float = 0.0
    wind_speed: float = 5.0

class PestAnalysisRequest(BaseModel):
    crop_type: str = "tomato"
    symptoms: List[str] = []
    affected_area_percentage: float = 20.0
    affected_plant_count: int = 0
    total_plant_count: int = 100
    plant_age_days: int = 60
    plant_health_score: float = 0.7
    weather_conditions: WeatherConditions = WeatherConditions()
    farm_size: float = 1.0
    plant_density: str = "normal"  # low, normal, high
    irrigation_frequency: str = "normal"  # low, normal, excessive
    previous_treatment: bool = False
    treatment_history: List[str] = []
    image_data: Optional[str] = None  # base64 encoded image

class PestIdentificationRequest(BaseModel):
    symptoms: List[str]
    crop_type: str
    image_data: Optional[str] = None

class TreatmentRecommendationRequest(BaseModel):
    pest_name: str
    severity_level: float  # 0-1
    farm_size: float = 1.0
    crop_type: str = "tomato"
    budget_constraint: Optional[float] = None
    organic_preference: bool = False

@app.post("/analyze-pest-problem")
async def analyze_pest_problem(request: PestAnalysisRequest):
    """
    تحليل شامل لمشكلة الآفات وتقديم التوصيات
    """
    try:
        logger.info(f"Analyzing pest problem for crop: {request.crop_type}")
        
        input_data = request.dict()
        result = pest_recommender.analyze_pest_problem(input_data)
        
        return {
            'success': True,
            'data': result,
            'message': 'تم تحليل مشكلة الآفات بنجاح'
        }
        
    except Exception as e:
        logger.error(f"Error in pest analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/identify-pest")
async def identify_pest(request: PestIdentificationRequest):
    """
    تحديد نوع الآفة أو المرض بناءً على الأعراض والصورة
    """
    try:
        # تحليل الأعراض
        symptoms_analysis = pest_recommender._analyze_symptoms(
            request.symptoms, request.crop_type
        )
        
        # تحليل الصورة إذا وجدت
        image_analysis = None
        if request.image_data:
            image_analysis = pest_recommender._analyze_pest_image(request.image_data)
        
        # دمج النتائج
        input_data = {
            'crop_type': request.crop_type,
            'symptoms': request.symptoms,
            'image_data': request.image_data
        }
        
        identification = pest_recommender._identify_pest_disease(
            input_data, image_analysis, symptoms_analysis
        )
        
        return {
            'success': True,
            'data': {
                'identification': identification,
                'symptoms_analysis': symptoms_analysis,
                'image_analysis': image_analysis
            },
            'message': 'تم تحديد الآفة بنجاح'
        }
        
    except Exception as e:
        logger.error(f"Error in pest identification: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/recommend-treatment")
async def recommend_treatment(request: TreatmentRecommendationRequest):
    """
    توصية العلاج المناسب للآفة المحددة
    """
    try:
        # إنشاء بيانات وهمية للتوصية
        input_data = {
            'crop_type': request.crop_type,
            'farm_size': request.farm_size,
            'budget_constraint': request.budget_constraint,
            'organic_preference': request.organic_preference
        }
        
        pest_identification = {
            'identified_pest': request.pest_name,
            'confidence_score': 0.8
        }
        
        severity_assessment = {
            'severity_score': request.severity_level,
            'severity_level': 'متوسط' if request.severity_level < 0.5 else 'شديد'
        }
        
        treatments = pest_recommender._recommend_treatments(
            pest_identification, severity_assessment, input_data
        )
        
        return {
            'success': True,
            'data': treatments,
            'message': 'تم إنشاء توصيات العلاج بنجاح'
        }
        
    except Exception as e:
        logger.error(f"Error in treatment recommendation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload-pest-image")
async def upload_pest_image(file: UploadFile = File(...)):
    """
    رفع صورة للآفة أو المرض وتحليلها
    """
    try:
        # قراءة الصورة
        image_data = await file.read()
        
        # تحليل الصورة
        analysis = pest_recommender._analyze_pest_image(image_data)
        
        return {
            'success': True,
            'data': analysis,
            'message': 'تم تحليل الصورة بنجاح'
        }
        
    except Exception as e:
        logger.error(f"Error analyzing uploaded image: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/pest-database")
async def get_pest_database():
    """
    الحصول على قاعدة بيانات الآفات والأمراض
    """
    try:
        return {
            'success': True,
            'data': pest_recommender.pest_disease_database,
            'message': 'تم جلب قاعدة البيانات بنجاح'
        }
        
    except Exception as e:
        logger.error(f"Error fetching pest database: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/prevention-measures/{crop_type}")
async def get_prevention_measures(crop_type: str):
    """
    الحصول على التدابير الوقائية للمحصول
    """
    try:
        pest_identification = {'identified_pest': 'general'}
        
        measures = pest_recommender._recommend_prevention_measures(
            pest_identification, crop_type
        )
        
        return {
            'success': True,
            'data': measures,
            'message': 'تم جلب التدابير الوقائية بنجاح'
        }
        
    except Exception as e:
        logger.error(f"Error fetching prevention measures: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/assess-severity")
async def assess_severity(
    pest_name: str,
    affected_area_percentage: float,
    plant_health_score: float = 0.7,
    temperature: float = 25.0,
    humidity: float = 60.0
):
    """
    تقييم شدة الإصابة بالآفة
    """
    try:
        input_data = {
            'affected_area_percentage': affected_area_percentage,
            'plant_health_score': plant_health_score,
            'weather_conditions': {
                'temperature': temperature,
                'humidity': humidity
            }
        }
        
        pest_identification = {'identified_pest': pest_name}
        
        assessment = pest_recommender._assess_pest_severity(
            input_data, pest_identification
        )
        
        return {
            'success': True,
            'data': assessment,
            'message': 'تم تقييم شدة الإصابة بنجاح'
        }
        
    except Exception as e:
        logger.error(f"Error assessing severity: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/treatment-schedule/{pest_name}")
async def get_treatment_schedule(
    pest_name: str,
    severity_level: float = 0.5,
    farm_size: float = 1.0
):
    """
    إنشاء جدولة العلاج للآفة المحددة
    """
    try:
        # إنشاء توصيات وهمية للجدولة
        mock_treatment = {
            'treatment_name_ar': 'علاج أساسي',
            'application_frequency': 'كل 7 أيام',
            'safety_level': 'آمن'
        }
        
        input_data = {'farm_size': farm_size}
        
        schedule = pest_recommender._create_treatment_schedule(
            [mock_treatment], input_data
        )
        
        return {
            'success': True,
            'data': schedule,
            'message': 'تم إنشاء جدولة العلاج بنجاح'
        }
        
    except Exception as e:
        logger.error(f"Error creating treatment schedule: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """
    فحص صحة الخدمة
    """
    return {
        'status': 'healthy',
        'service': 'Pest Control Recommender',
        'timestamp': datetime.now().isoformat(),
        'model_trained': pest_recommender.is_trained
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8005)
