"""
AgroGrowth Soil Analysis AI FastAPI service.
Keep existing public endpoints and factory/method contracts.
"""
import logging
import math
import os
from typing import Any, Dict, List, Optional

import uvicorn
from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field, field_validator

from soil_analysis.soil_analyzer import create_soil_analyzer
from soil_analysis.climate_crop_matcher import create_climate_crop_matcher
from soil_analysis.soil_image_diagnosis import create_soil_image_diagnosis
from ai_common.llm_provider import get_provider
from ai_common.advisory import narrate
from ai_common.offload import offload

logging.basicConfig(level=os.getenv("LOG_LEVEL","INFO"))
logger = logging.getLogger(__name__)
SERVICE_VERSION = "1.2.0"

try:
    MAX_IMAGE_SIZE = int(os.getenv("MAX_IMAGE_SIZE", str(10*1024*1024)))
    if MAX_IMAGE_SIZE <= 0:
        raise ValueError
except ValueError:
    raise RuntimeError("MAX_IMAGE_SIZE must be a positive integer")

cors_origins = [x.strip() for x in os.getenv(
    "CORS_ORIGINS","http://localhost:3000,http://localhost:5173"
).split(",") if x.strip()]

def _validate_numeric_dict(value):
    if not isinstance(value, dict) or not value:
        raise ValueError("Must be a non-empty object")
    for key, item in value.items():
        if isinstance(item,bool) or not isinstance(item,(int,float)) or not math.isfinite(float(item)):
            raise ValueError(f"{key} must be a finite number")
    return value

class SoilAnalysisRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    sensor_data: Dict[str, Any] = Field(min_length=1)
    location: Optional[Dict[str, Any]] = None
    farm_id: Optional[str] = None
    language: Optional[str] = "ar-tn"
    crop: Optional[str] = None

    @field_validator("sensor_data")
    @classmethod
    def validate_sensor_data(cls, value):
        return _validate_numeric_dict(value)

class ClimateMatchingRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    climate_data: Dict[str, Any] = Field(min_length=1)
    soil_data: Optional[Dict[str, Any]] = None
    location: Optional[Dict[str, Any]] = None
    language: Optional[str] = "ar-tn"

    @field_validator("climate_data")
    @classmethod
    def validate_climate_data(cls, value):
        if not isinstance(value,dict) or not value:
            raise ValueError("climate_data must be a non-empty object")
        return value

class SoilAnalysisResponse(BaseModel):
    soil_type: Dict[str, Any]
    properties: Dict[str, Any]
    health_score: Optional[float] = None
    fertility_level: str
    overall_recommendations: List[str]
    analysis_timestamp: str
    data_source: Optional[str] = None
    is_real_data: Optional[bool] = None
    model_source: Optional[str] = None
    measurement_verified: Optional[bool] = None
    advisory: Optional[Any] = None
    score_type: Optional[str] = None
    score_available: Optional[bool] = None
    evaluated_properties: Optional[List[str]] = None
    measurement_count: Optional[int] = None
    disclaimer: Optional[str] = None

class CropMatchingResponse(BaseModel):
    suitable_crops: List[Dict[str, Any]]
    climate_analysis: Dict[str, Any]
    seasonal_recommendations: Dict[str, Any]
    best_crop: Optional[Dict[str, Any]]
    analysis_timestamp: str
    data_source: Optional[str] = None
    is_real_data: Optional[bool] = None
    model_source: Optional[str] = None
    advisory: Optional[Any] = None
    measurement_verified: Optional[bool] = None
    provided_measurements: Optional[Dict[str, Any]] = None
    measurement_count: Optional[int] = None
    score_explanation: Optional[str] = None
    disclaimer: Optional[str] = None

class ImageDiagnosisResponse(BaseModel):
    soil_classification: Dict[str, Any]
    soil_condition: Dict[str, Any]
    color_analysis: Dict[str, Any]
    texture_analysis: Dict[str, Any]
    recommendations: List[str]
    confidence_score: float
    analysis_timestamp: str
    image_features: Optional[Dict[str, Any]] = None
    confidence_status: Optional[str] = None
    model_source: Optional[str] = None
    model_trained: Optional[bool] = None
    field_validated: Optional[bool] = None
    analysis_type: Optional[str] = None
    data_source: Optional[str] = None
    is_real_image: Optional[bool] = None
    is_scientific_diagnosis: Optional[bool] = None
    limitations: Optional[List[str]] = None
    disclaimer: Optional[str] = None

soil_analyzer = create_soil_analyzer()
climate_matcher = create_climate_crop_matcher()
image_diagnosis = create_soil_image_diagnosis()

app = FastAPI(title="AgroGrowth Soil Analysis AI",
              description="Soil screening, climate-crop matching and image inspection.",
              version=SERVICE_VERSION, docs_url="/docs", redoc_url="/redoc")
app.add_middleware(
    CORSMiddleware, allow_origins=cors_origins, allow_credentials=True,
    allow_methods=["GET","POST","OPTIONS"],
    allow_headers=["Authorization","Content-Type"],
)

def get_model_source(model: Any) -> str:
    if model is None:
        return "unavailable"
    source = getattr(model,"model_source",None)
    if callable(source):
        try: source = source()
        except Exception:
            logger.exception("Unable to read model source")
            return "unknown"
    return source.strip() if isinstance(source,str) and source.strip() else "unknown"

def is_model_loaded(model: Any) -> bool:
    if model is None: return False
    readiness = getattr(model,"is_ready",None)
    if readiness is not None: return bool(readiness)
    loaded = getattr(model,"is_loaded",None)
    if loaded is not None: return bool(loaded)
    return True

def is_field_validated(model: Any) -> bool:
    return bool(model is not None and getattr(model,"field_validated",False))

def validate_location(location: Optional[Dict[str, Any]]) -> None:
    if not location: return
    lat, lon = location.get("latitude"), location.get("longitude")
    if (lat is None) != (lon is None):
        raise HTTPException(422, "Provide both latitude and longitude.")
    if lat is not None:
        if isinstance(lat,bool) or isinstance(lon,bool):
            raise HTTPException(422,"Coordinates must be numeric.")
        try: lat,lon = float(lat),float(lon)
        except (TypeError,ValueError):
            raise HTTPException(422,"Coordinates must be numeric.")
        if not math.isfinite(lat) or not math.isfinite(lon) or not -90<=lat<=90 or not -180<=lon<=180:
            raise HTTPException(422,"Invalid latitude or longitude.")

def get_ai_provider():
    try: return get_provider()
    except Exception:
        logger.exception("Unable to initialize AI provider")
        return None

async def get_advisory(result: Dict[str,Any], task: str, language: Optional[str],
                       context: Optional[Dict[str,Any]]=None):
    provider = get_ai_provider()
    try:
        if provider is None or not provider.is_configured():
            return None
        return await offload(narrate,result,task=task,language=language or "ar-tn",
                             context=context or {},max_tokens=1200)
    except Exception:
        logger.exception("Advisory generation failed")
        return None

@app.get("/")
async def root():
    return {"service":"AgroGrowth Soil Analysis AI","status":"running",
            "version":SERVICE_VERSION,
            "endpoints":{"soil_analysis":"/analyze-soil","crop_matching":"/match-crops",
                         "image_diagnosis":"/diagnose-image","health":"/health","docs":"/docs"}}

@app.get("/health")
async def health_check():
    provider = get_ai_provider()
    advisory_configured = False
    advisory_source = None
    if provider:
        try:
            advisory_configured = provider.is_configured()
            if advisory_configured:
                advisory_source = provider.model_source()
        except Exception:
            logger.exception("Unable to inspect LLM provider configuration")
    loaded = {
        "soil_analyzer":is_model_loaded(soil_analyzer),
        "climate_matcher":is_model_loaded(climate_matcher),
        "image_processing":is_model_loaded(image_diagnosis),
    }
    return {
        "status":"healthy" if all(loaded.values()) else "degraded",
        "service":"Soil Analysis AI","version":SERVICE_VERSION,
        "models_loaded":loaded,
        "model_source":get_model_source(soil_analyzer),
        "model_sources":{
            "soil_analyzer":get_model_source(soil_analyzer),
            "climate_matcher":get_model_source(climate_matcher),
            "image_diagnosis":get_model_source(image_diagnosis),
        },
        "image_classifier_available":bool(getattr(image_diagnosis,"is_trained",False)),
        "numeric_models_field_validated":is_field_validated(soil_analyzer) and is_field_validated(climate_matcher),
        "advisory_model_source":advisory_source,
        "advisory_configured":advisory_configured,
        "disclaimer":"Engine readiness does not imply scientific or field validation. User-supplied data are not automatically laboratory-verified. Image processing availability does not mean a trained soil classifier is available.",
    }

@app.post("/analyze-soil",response_model=SoilAnalysisResponse)
async def analyze_soil(request: SoilAnalysisRequest):
    validate_location(request.location)
    try:
        result = await offload(soil_analyzer.analyze_soil_properties,request.sensor_data)
        if not isinstance(result,dict): raise RuntimeError("Invalid soil analyzer response")
        result["model_source"] = result.get("model_source") or get_model_source(soil_analyzer)
        result["data_source"] = result.get("data_source") or "user_supplied_input"
        result["measurement_verified"] = False
        advisory = await get_advisory(
            result,
            task=("Explain this indicative soil screening. Use only supplied values. "
                  "Do not invent measurements, nutrient concentrations, fertilizer doses "
                  "or treatment schedules. State missing data and uncertainty. Recommend "
                  "laboratory testing where appropriate."),
            language=request.language,
            context={"farm_id":request.farm_id,"location":request.location,"crop":request.crop},
        )
        if advisory is not None: result["advisory"] = advisory
        return SoilAnalysisResponse(**result)
    except ValueError as exc:
        raise HTTPException(status_code=422,detail=str(exc))
    except HTTPException: raise
    except Exception:
        logger.exception("Soil analysis failed")
        raise HTTPException(status_code=500,detail="Soil analysis failed.")

@app.post("/match-crops",response_model=CropMatchingResponse)
async def match_crops(request: ClimateMatchingRequest):
    validate_location(request.location)
    try:
        result = await offload(climate_matcher.match_crops_to_climate,
                               request.climate_data,request.soil_data)
        if not isinstance(result,dict): raise RuntimeError("Invalid climate matcher response")
        result["model_source"] = result.get("model_source") or get_model_source(climate_matcher)
        result["data_source"] = result.get("data_source") or "user_supplied_input"
        result["measurement_verified"] = False
        advisory = await get_advisory(
            result,
            task=("Explain the crop compatibility indicators and their limitations. "
                  "Identify missing inputs. Do not invent weather, yields, crop success "
                  "guarantees or fertilizer prescriptions."),
            language=request.language,
            context={"climate_data":request.climate_data,"soil_data":request.soil_data,
                     "location":request.location},
        )
        if advisory is not None: result["advisory"] = advisory
        return CropMatchingResponse(**result)
    except ValueError as exc:
        raise HTTPException(status_code=422,detail=str(exc))
    except HTTPException: raise
    except Exception:
        logger.exception("Crop matching failed")
        raise HTTPException(status_code=500,detail="Crop matching failed.")

@app.post("/diagnose-image",response_model=ImageDiagnosisResponse)
async def diagnose_soil_image(file: UploadFile = File(...)):
    try:
        if file.content_type not in {"image/jpeg","image/png","image/webp"}:
            raise HTTPException(415,"Only JPEG, PNG and WebP images are accepted.")
        raw = await file.read(MAX_IMAGE_SIZE+1)
        if not raw: raise HTTPException(400,"Uploaded image is empty.")
        if len(raw)>MAX_IMAGE_SIZE: raise HTTPException(413,"Image exceeds maximum allowed size.")
        result = await offload(image_diagnosis.analyze_soil_image,raw)
        if not isinstance(result,dict): raise RuntimeError("Invalid image diagnosis response")
        return ImageDiagnosisResponse(**result)
    except ValueError as exc:
        raise HTTPException(422,detail=str(exc))
    except HTTPException: raise
    except Exception:
        logger.exception("Image inspection failed")
        raise HTTPException(500,"Image inspection failed.")
    finally:
        await file.close()

@app.get("/crop-requirements/{crop_name}")
async def get_crop_requirements(crop_name: str):
    try:
        return {"status":"success","crop_requirements":climate_matcher.get_crop_requirements(crop_name)}
    except ValueError as exc: raise HTTPException(404,detail=str(exc))
    except Exception:
        logger.exception("Crop requirements lookup failed")
        raise HTTPException(500,"Unable to retrieve crop requirements.")

@app.get("/supported-crops")
async def get_supported_crops():
    try:
        crops = climate_matcher.get_supported_crops()
        return {"status":"success","supported_crops":crops,"total_count":len(crops)}
    except Exception:
        logger.exception("Supported crops lookup failed")
        raise HTTPException(500,"Unable to retrieve supported crops.")

@app.get("/soil-types")
async def get_soil_types():
    return {"status":"success","soil_types":[
        {"name":name,"name_ar":ar}
        for name,ar in zip(image_diagnosis.soil_classes,image_diagnosis.soil_classes_ar)
    ]}

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.exception("Unhandled error on %s %s",request.method,request.url.path)
    return JSONResponse(status_code=500,content={"status":"error","message":"Internal server error."})

if __name__ == "__main__":
    uvicorn.run(app,host="0.0.0.0",port=int(os.getenv("PORT","8001")))
