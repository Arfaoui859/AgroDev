"""
AgroGrowth Soil Analysis AI
Production-hardened FastAPI service.

Model provenance is reported from the actual loaded engines.
User-supplied measurements are not represented as laboratory-verified data.
"""

from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, ConfigDict
from typing import Dict, List, Any, Optional
import logging
import math
import os
import uvicorn

from soil_analysis.soil_analyzer import create_soil_analyzer
from soil_analysis.climate_crop_matcher import create_climate_crop_matcher
from soil_analysis.soil_image_diagnosis import create_soil_image_diagnosis

from ai_common.llm_provider import get_provider
from ai_common.advisory import narrate
from ai_common.offload import offload


# --------------------------------------------------
# LOGGING
# --------------------------------------------------

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger(__name__)

SERVICE_VERSION = "1.1.0"
MAX_IMAGE_SIZE = int(
    os.getenv("MAX_IMAGE_SIZE", str(10 * 1024 * 1024))
)


# --------------------------------------------------
# CONFIGURATION
# --------------------------------------------------

cors_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://localhost:5173"
    ).split(",")
    if origin.strip()
]


# --------------------------------------------------
# REQUEST MODELS
# --------------------------------------------------

class SoilAnalysisRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    sensor_data: Dict[str, float] = Field(min_length=1)
    location: Optional[Dict[str, float]] = None
    farm_id: Optional[str] = None
    language: Optional[str] = "ar-tn"
    crop: Optional[str] = None


class ClimateMatchingRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    climate_data: Dict[str, Any] = Field(min_length=1)
    soil_data: Optional[Dict[str, Any]] = None
    location: Optional[Dict[str, float]] = None
    language: Optional[str] = "ar-tn"


# --------------------------------------------------
# RESPONSE MODELS
# --------------------------------------------------

class SoilAnalysisResponse(BaseModel):
    soil_type: Dict[str, Any]
    properties: Dict[str, Any]
    health_score: float
    fertility_level: str
    overall_recommendations: List[str]
    analysis_timestamp: str

    data_source: Optional[str] = None
    is_real_data: Optional[bool] = None
    model_source: Optional[str] = None
    measurement_verified: Optional[bool] = None
    advisory: Optional[Dict[str, Any]] = None


class CropMatchingResponse(BaseModel):
    suitable_crops: List[Dict[str, Any]]
    climate_analysis: Dict[str, Any]
    seasonal_recommendations: Dict[str, Any]
    best_crop: Optional[Dict[str, Any]]
    analysis_timestamp: str

    data_source: Optional[str] = None
    is_real_data: Optional[bool] = None
    model_source: Optional[str] = None
    advisory: Optional[Dict[str, Any]] = None


class ImageDiagnosisResponse(BaseModel):
    soil_classification: Dict[str, Any]
    soil_condition: Dict[str, Any]
    color_analysis: Dict[str, Any]
    texture_analysis: Dict[str, Any]
    recommendations: List[str]
    confidence_score: float
    analysis_timestamp: str


# --------------------------------------------------
# INITIALIZE MODELS
# --------------------------------------------------

soil_analyzer = create_soil_analyzer()
climate_matcher = create_climate_crop_matcher()
image_diagnosis = create_soil_image_diagnosis()


# --------------------------------------------------
# FASTAPI APPLICATION
# --------------------------------------------------

app = FastAPI(
    title="AgroGrowth Soil Analysis AI",
    description=(
        "Soil analysis, climate-crop matching "
        "and soil image diagnosis service."
    ),
    version=SERVICE_VERSION,
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


# --------------------------------------------------
# MODEL STATUS HELPERS
# --------------------------------------------------

def get_model_source(model: Any) -> str:
    """
    Read the source from the actual model instance.
    Never claim that a model is validated without explicit evidence.
    """

    if model is None:
        return "unavailable"

    source = getattr(model, "model_source", None)

    if callable(source):
        try:
            source = source()
        except Exception:
            logger.exception("Unable to read model source")

    if isinstance(source, str) and source.strip():
        return source.strip()

    return "unknown"


def is_model_loaded(model: Any) -> bool:
    """Check whether a model engine was initialized."""

    if model is None:
        return False

    for attribute in ("is_loaded", "is_ready", "is_trained"):
        value = getattr(model, attribute, None)

        if value is not None:
            return bool(value)

    return True


def is_field_validated(model: Any) -> bool:
    """
    Field validation must be explicitly declared by the model.
    Loading a model does not mean it has been field validated.
    """

    if model is None:
        return False

    return bool(
        getattr(model, "field_validated", False)
    )


# --------------------------------------------------
# VALIDATION HELPERS
# --------------------------------------------------

def validate_numeric_data(data: Dict[str, float]) -> None:

    if not data:
        raise HTTPException(
            status_code=422,
            detail="Input data cannot be empty."
        )

    for key, value in data.items():

        if not math.isfinite(value):
            raise HTTPException(
                status_code=422,
                detail=f"Invalid numeric value for {key}."
            )


def validate_location(location: Optional[Dict[str, float]]) -> None:

    if not location:
        return

    lat = location.get("latitude")
    lon = location.get("longitude")

    if lat is not None and not -90 <= lat <= 90:
        raise HTTPException(
            status_code=422,
            detail="Invalid latitude."
        )

    if lon is not None and not -180 <= lon <= 180:
        raise HTTPException(
            status_code=422,
            detail="Invalid longitude."
        )


# --------------------------------------------------
# AI PROVIDER
# --------------------------------------------------

def get_ai_provider():

    try:
        return get_provider()

    except Exception:
        logger.exception("Unable to initialize AI provider")
        return None


async def get_advisory(
    result: Dict[str, Any],
    task: str,
    language: Optional[str],
    context: Optional[Dict[str, Any]] = None
):
    """
    Generate an optional LLM explanation.

    The LLM explains the analysis; it does not modify measurements
    or create scientific measurements that were not provided.
    """

    provider = get_ai_provider()

    if not provider:
        return None

    try:
        if not provider.is_configured():
            return None

        advisory = await offload(
            narrate,
            result,
            task=task,
            language=language or "ar-tn",
            context=context or {},
            max_tokens=1200
        )

        return advisory

    except Exception:
        logger.exception("Advisory generation failed")
        return None


# --------------------------------------------------
# ROOT
# --------------------------------------------------

@app.get("/")
async def root():

    return {
        "service": "AgroGrowth Soil Analysis AI",
        "status": "running",
        "version": SERVICE_VERSION,
        "endpoints": {
            "soil_analysis": "/analyze-soil",
            "crop_matching": "/match-crops",
            "image_diagnosis": "/diagnose-image",
            "health": "/health",
            "docs": "/docs"
        }
    }


# --------------------------------------------------
# HEALTH CHECK
# --------------------------------------------------

@app.get("/health")
async def health_check():

    provider = get_ai_provider()

    try:
        advisory_configured = bool(
            provider and provider.is_configured()
        )
    except Exception:
        logger.exception("Unable to check advisory provider")
        advisory_configured = False

    soil_source = get_model_source(soil_analyzer)
    climate_source = get_model_source(climate_matcher)
    image_source = get_model_source(image_diagnosis)

    models_loaded = {
        "soil_analyzer": is_model_loaded(soil_analyzer),
        "climate_matcher": is_model_loaded(climate_matcher),
        "image_diagnosis": is_model_loaded(image_diagnosis)
    }

    all_models_loaded = all(models_loaded.values())

    return {
        "status": "healthy" if all_models_loaded else "degraded",
        "service": "Soil Analysis AI",
        "version": SERVICE_VERSION,

        "models_loaded": models_loaded,

        # Backward-compatible field: soil analyzer source.
        "model_source": soil_source,

        # Explicit source for every engine.
        "model_sources": {
            "soil_analyzer": soil_source,
            "climate_matcher": climate_source,
            "image_diagnosis": image_source
        },

        # False unless the engine explicitly declares validation.
        "numeric_models_field_validated": (
            is_field_validated(soil_analyzer)
            and is_field_validated(climate_matcher)
        ),

        "advisory_model_source": (
            provider.model_source()
            if advisory_configured
            else None
        ),

        "advisory_configured": advisory_configured,

        "disclaimer": (
            "Model readiness does not imply scientific or field "
            "validation. User-supplied measurements are not "
            "automatically laboratory-verified. Rule-based results "
            "are indicative and should not replace laboratory "
            "soil testing or professional agronomic advice."
        )
    }


# --------------------------------------------------
# SOIL ANALYSIS
# --------------------------------------------------

@app.post(
    "/analyze-soil",
    response_model=SoilAnalysisResponse
)
async def analyze_soil(request: SoilAnalysisRequest):

    try:
        validate_numeric_data(request.sensor_data)
        validate_location(request.location)

        logger.info("Starting soil analysis")

        result = await offload(
            soil_analyzer.analyze_soil_properties,
            request.sensor_data
        )

        if not isinstance(result, dict):
            raise RuntimeError(
                "Soil analyzer returned an invalid response."
            )

        # Preserve the source declared by the actual analyzer.
        result["data_source"] = result.get(
            "data_source",
            "user_supplied_input"
        )

        result["model_source"] = result.get(
            "model_source",
            get_model_source(soil_analyzer)
        )

        # User input is not automatically verified sensor/lab data.
        result["is_real_data"] = False
        result["measurement_verified"] = False

        advisory = await get_advisory(
            result,
            task=(
                "Explain this soil analysis to a farmer. "
                "Use only measurements and findings explicitly "
                "present in the supplied analysis. Clearly identify "
                "missing information and uncertainty. Explain that "
                "rule-based results are indicative, not laboratory "
                "measurements. Never invent measurements, fertilizer "
                "dosages, application rates, quantities, chemical "
                "concentrations, or treatment schedules. Do not give "
                "numeric fertilizer recommendations unless those "
                "exact recommendations are explicitly supplied by "
                "a verified agronomic source in the context. "
                "Recommend laboratory testing when necessary."
            ),
            language=request.language,
            context={
                "farm_id": request.farm_id,
                "location": request.location,
                "crop": request.crop
            }
        )

        if advisory:
            result["advisory"] = advisory

        return SoilAnalysisResponse(**result)

    except HTTPException:
        raise

    except Exception:
        logger.exception("Soil analysis failed")

        raise HTTPException(
            status_code=500,
            detail="Soil analysis failed."
        )


# --------------------------------------------------
# CLIMATE AND CROP MATCHING
# --------------------------------------------------

@app.post(
    "/match-crops",
    response_model=CropMatchingResponse
)
async def match_crops(request: ClimateMatchingRequest):

    try:
        if not request.climate_data:
            raise HTTPException(
                status_code=422,
                detail="Climate data cannot be empty."
            )

        validate_location(request.location)

        logger.info("Starting climate-crop matching")

        result = await offload(
            climate_matcher.match_crops_to_climate,
            request.climate_data,
            request.soil_data
        )

        if not isinstance(result, dict):
            raise RuntimeError(
                "Climate matcher returned an invalid response."
            )

        result["data_source"] = result.get(
            "data_source",
            "user_supplied_climate_and_soil_input"
        )

        result["model_source"] = result.get(
            "model_source",
            get_model_source(climate_matcher)
        )

        result["is_real_data"] = False

        advisory = await get_advisory(
            result,
            task=(
                "Explain the crop compatibility results. "
                "Discuss climate and soil constraints, water needs, "
                "and seasonal considerations. Clearly identify "
                "missing climate or soil measurements. Do not invent "
                "weather forecasts, rainfall measurements, yields, "
                "fertilizer dosages, or guarantees of crop success. "
                "Explain that compatibility scores are not "
                "probabilities unless explicitly documented as such."
            ),
            language=request.language,
            context={
                "climate_data": request.climate_data,
                "soil_data": request.soil_data,
                "location": request.location
            }
        )

        if advisory:
            result["advisory"] = advisory

        return CropMatchingResponse(**result)

    except HTTPException:
        raise

    except Exception:
        logger.exception("Crop matching failed")

        raise HTTPException(
            status_code=500,
            detail="Crop matching failed."
        )


# --------------------------------------------------
# SOIL IMAGE DIAGNOSIS
# --------------------------------------------------

@app.post(
    "/diagnose-image",
    response_model=ImageDiagnosisResponse
)
async def diagnose_soil_image(
    file: UploadFile = File(...)
):

    try:
        allowed_types = {
            "image/jpeg",
            "image/png",
            "image/webp"
        }

        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=415,
                detail="Only JPEG, PNG and WebP images are accepted."
            )

        image_data = await file.read(MAX_IMAGE_SIZE + 1)

        if not image_data:
            raise HTTPException(
                status_code=400,
                detail="Uploaded image is empty."
            )

        if len(image_data) > MAX_IMAGE_SIZE:
            raise HTTPException(
                status_code=413,
                detail="Image exceeds maximum allowed size."
            )

        logger.info("Starting soil image diagnosis")

        result = await offload(
            image_diagnosis.analyze_soil_image,
            image_data
        )

        if not isinstance(result, dict):
            raise RuntimeError(
                "Image diagnosis returned an invalid response."
            )

        return ImageDiagnosisResponse(**result)

    except HTTPException:
        raise

    except Exception:
        logger.exception("Image diagnosis failed")

        raise HTTPException(
            status_code=500,
            detail="Image diagnosis failed."
        )

    finally:
        await file.close()


# --------------------------------------------------
# CROP REQUIREMENTS
# --------------------------------------------------

@app.get("/crop-requirements/{crop_name}")
async def get_crop_requirements(crop_name: str):

    try:
        requirements = climate_matcher.get_crop_requirements(
            crop_name
        )

        return {
            "status": "success",
            "crop_requirements": requirements
        }

    except ValueError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc)
        )

    except Exception:
        logger.exception("Crop requirements lookup failed")

        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve crop requirements."
        )


# --------------------------------------------------
# SUPPORTED CROPS
# --------------------------------------------------

@app.get("/supported-crops")
async def get_supported_crops():

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

    except Exception:
        logger.exception("Supported crops lookup failed")

        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve supported crops."
        )


# --------------------------------------------------
# SOIL TYPES
# --------------------------------------------------

@app.get("/soil-types")
async def get_soil_types():

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


# --------------------------------------------------
# ERROR HANDLERS
# --------------------------------------------------

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):

    logger.exception(
        "Unhandled error on %s %s",
        request.method,
        request.url.path
    )

    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "message": "Internal server error."
        }
    )


# --------------------------------------------------
# SERVER
# --------------------------------------------------

if __name__ == "__main__":

    port = int(os.environ.get("PORT", 8001))

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port
    )
