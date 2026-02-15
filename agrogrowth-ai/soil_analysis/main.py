"""
FastAPI service for Soil Analysis AI
Provides REST API endpoints for soil analysis, climate-crop matching, and image diagnosis
"""

from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional
import logging
import sys
import os

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ai_common.base_service import BaseAIService, PredictionResponse
from soil_analysis.soil_analyzer import create_soil_analyzer
from soil_analysis.climate_crop_matcher import create_climate_crop_matcher
from soil_analysis.soil_image_diagnosis import create_soil_image_diagnosis

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Pydantic models for requests and responses
class SoilAnalysisRequest(BaseModel):
    sensor_data: Dict[str, float] = Field(
        description="Soil sensor data including pH, nutrients, moisture, etc."
    )
    location: Optional[Dict[str, float]] = Field(
        default=None,
        description="GPS coordinates (latitude, longitude)"
    )
    farm_id: Optional[str] = Field(default=None)

class ClimateMatchingRequest(BaseModel):
    climate_data: Dict[str, Any] = Field(
        description="Climate data including temperature, rainfall, humidity"
    )
    soil_data: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Optional soil data for better matching"
    )
    location: Optional[Dict[str, float]] = Field(
        default=None,
        description="GPS coordinates"
    )

class SoilAnalysisResponse(BaseModel):
    soil_type: Dict[str, Any]
    properties: Dict[str, Any]
    health_score: float
    fertility_level: str
    overall_recommendations: List[str]
    analysis_timestamp: str

class CropMatchingResponse(BaseModel):
    suitable_crops: List[Dict[str, Any]]
    climate_analysis: Dict[str, Any]
    seasonal_recommendations: Dict[str, Any]
    best_crop: Optional[Dict[str, Any]]
    analysis_timestamp: str

class ImageDiagnosisResponse(BaseModel):
    soil_classification: Dict[str, Any]
    soil_condition: Dict[str, Any]
    color_analysis: Dict[str, Any]
    texture_analysis: Dict[str, Any]
    recommendations: List[str]
    confidence_score: float
    analysis_timestamp: str

# Initialize AI models
soil_analyzer = create_soil_analyzer()
climate_matcher = create_climate_crop_matcher()
image_diagnosis = create_soil_image_diagnosis()

# Create FastAPI app
app = FastAPI(
    title="AgroGrowth Soil Analysis AI",
    description="AI-powered soil analysis, climate-crop matching, and image diagnosis for agricultural optimization",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "AgroGrowth Soil Analysis AI",
        "status": "running",
        "version": "1.0.0",
        "endpoints": {
            "soil_analysis": "/analyze-soil",
            "crop_matching": "/match-crops",
            "image_diagnosis": "/diagnose-image",
            "health": "/health",
            "docs": "/docs"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Soil Analysis AI",
        "models_loaded": {
            "soil_analyzer": soil_analyzer.is_trained,
            "climate_matcher": climate_matcher.is_trained,
            "image_diagnosis": image_diagnosis.is_trained
        }
    }

@app.post("/analyze-soil", response_model=SoilAnalysisResponse)
async def analyze_soil(request: SoilAnalysisRequest):
    """
    Analyze soil properties from sensor data
    
    Returns comprehensive soil analysis including:
    - Soil type classification
    - Nutrient analysis
    - Health score
    - Improvement recommendations
    """
    try:
        logger.info(f"Analyzing soil data: {request.sensor_data}")
        
        result = soil_analyzer.analyze_soil_properties(request.sensor_data)
        
        return SoilAnalysisResponse(**result)
        
    except Exception as e:
        logger.error(f"Error in soil analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Soil analysis failed: {str(e)}")

@app.post("/match-crops", response_model=CropMatchingResponse)
async def match_crops(request: ClimateMatchingRequest):
    """
    Match suitable crops to climate and soil conditions
    
    Returns:
    - List of suitable crops ranked by compatibility
    - Climate analysis
    - Seasonal planting recommendations
    - Best crop recommendation
    """
    try:
        logger.info(f"Matching crops for climate: {request.climate_data}")
        
        result = climate_matcher.match_crops_to_climate(
            request.climate_data,
            request.soil_data
        )
        
        return CropMatchingResponse(**result)
        
    except Exception as e:
        logger.error(f"Error in crop matching: {e}")
        raise HTTPException(status_code=500, detail=f"Crop matching failed: {str(e)}")

@app.post("/diagnose-image", response_model=ImageDiagnosisResponse)
async def diagnose_soil_image(file: UploadFile = File(...)):
    """
    Diagnose soil condition from uploaded image
    
    Returns:
    - Soil type classification
    - Condition assessment
    - Color and texture analysis
    - Improvement recommendations
    """
    try:
        logger.info(f"Analyzing soil image: {file.filename}")
        
        # Read image data
        image_data = await file.read()
        
        # Analyze image
        result = image_diagnosis.analyze_soil_image(image_data)
        
        return ImageDiagnosisResponse(**result)
        
    except Exception as e:
        logger.error(f"Error in image diagnosis: {e}")
        raise HTTPException(status_code=500, detail=f"Image diagnosis failed: {str(e)}")

@app.get("/crop-requirements/{crop_name}")
async def get_crop_requirements(crop_name: str):
    """Get detailed requirements for a specific crop"""
    try:
        requirements = climate_matcher.get_crop_requirements(crop_name)
        return {
            "status": "success",
            "crop_requirements": requirements
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error getting crop requirements: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get crop requirements: {str(e)}")

@app.get("/supported-crops")
async def get_supported_crops():
    """Get list of all supported crops"""
    try:
        crops = []
        for crop_name, crop_info in climate_matcher.crop_database.items():
            crops.append({
                "name": crop_name,
                "name_ar": crop_info["name_ar"],
                "growing_season": crop_info["growing_season"],
                "water_requirement": crop_info["water_requirement"]
            })
        
        return {
            "status": "success",
            "supported_crops": crops,
            "total_count": len(crops)
        }
    except Exception as e:
        logger.error(f"Error getting supported crops: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/soil-types")
async def get_soil_types():
    """Get list of supported soil types"""
    return {
        "status": "success",
        "soil_types": [
            {
                "name": soil_type,
                "name_ar": soil_type_ar
            }
            for soil_type, soil_type_ar in zip(
                image_diagnosis.soil_classes,
                image_diagnosis.soil_classes_ar
            )
        ]
    }

# Error handlers
@app.exception_handler(ValueError)
async def value_error_handler(request, exc):
    return {"status": "error", "message": str(exc)}

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}")
    return {"status": "error", "message": "Internal server error"}
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))  # Render يعطي PORT
    uvicorn.run("soil_analysis.main:app", host="0.0.0.0", port=port)
