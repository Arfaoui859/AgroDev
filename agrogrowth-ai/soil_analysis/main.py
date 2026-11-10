
"""
AgroGrowth Soil Analysis AI — FastAPI service.

Provides:
- Soil analysis from farmer/sensor inputs
- Climate and crop matching
- Soil image diagnosis
- Laboratory-assisted ML predictions
- Crop requirements and supported soil/crop metadata

Laboratory ML predictions use sequential on-demand model loading.
Models are not field-validated or Tunisia-validated.
"""

import logging
import os
import sys
import threading
from pathlib import Path
from typing import Any, Dict, List, Optional

import uvicorn
from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------
# Paths and imports
# ---------------------------------------------------------------------

CURRENT_DIR = Path(__file__).resolve().parent
AI_ROOT = CURRENT_DIR.parent

if str(AI_ROOT) not in sys.path:
    sys.path.insert(0, str(AI_ROOT))

from soil_analysis.soil_analyzer import create_soil_analyzer
from soil_analysis.climate_crop_matcher import create_climate_crop_matcher
from soil_analysis.soil_image_diagnosis import create_soil_image_diagnosis
from soil_analysis.lab_assisted_predictor import LabAssistedSoilPredictor
from ai_common.llm_provider import get_provider
from ai_common.advisory import narrate


# ---------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO").upper(),
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)

logger = logging.getLogger("agrogrowth.soil_analysis")


# ---------------------------------------------------------------------
# Pydantic request / response models
# ---------------------------------------------------------------------

class SoilAnalysisRequest(BaseModel):
    sensor_data: Dict[str, float] = Field(
        description="Soil sensor data including pH, nutrients, moisture, etc."
    )
    location: Optional[Dict[str, float]] = Field(
        default=None,
        description="GPS coordinates (latitude, longitude)",
    )
    farm_id: Optional[str] = None
    language: str = Field(default='ar', description='Advisory language')


class ClimateMatchingRequest(BaseModel):
    climate_data: Dict[str, Any] = Field(
        description="Climate data including temperature, rainfall, humidity"
    )
    soil_data: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Optional soil data for better matching",
    )
    location: Optional[Dict[str, float]] = Field(
        default=None,
        description="GPS coordinates",
    )


class LabAssistedSoilRequest(BaseModel):
    lab_values: Dict[str, Any] = Field(
        ...,
        description=(
            "Laboratory soil measurements. All required analyte features must "
            "be supplied; partial panels are not imputed or used for prediction."
        ),
    )


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
    model_trained: Optional[bool] = None
    advisory: Optional[Dict[str, Any]] = None
    disclaimer: Optional[str] = None


class CropMatchingResponse(BaseModel):
    suitable_crops: List[Dict[str, Any]]
    climate_analysis: Dict[str, Any]
    seasonal_recommendations: Dict[str, Any]
    best_crop: Optional[Dict[str, Any]] = None
    analysis_timestamp: str


class ImageDiagnosisResponse(BaseModel):
    soil_classification: Dict[str, Any]
    soil_condition: Dict[str, Any]
    color_analysis: Dict[str, Any]
    texture_analysis: Dict[str, Any]
    recommendations: List[str]
    confidence_score: float
    analysis_timestamp: str


# ---------------------------------------------------------------------
# Initialize existing AI services
# ---------------------------------------------------------------------

soil_analyzer = create_soil_analyzer()
climate_matcher = create_climate_crop_matcher()
image_diagnosis = create_soil_image_diagnosis()


# ---------------------------------------------------------------------
# Laboratory ML predictor — metadata lazy initialization
# ---------------------------------------------------------------------

_lab_predictor: Optional[LabAssistedSoilPredictor] = None
_lab_predictor_error: Optional[str] = None
_lab_predictor_init_lock = threading.Lock()


def get_lab_predictor() -> LabAssistedSoilPredictor:
    """
    Initialize predictor metadata once, safely under concurrent requests.
    Model artifacts remain unloaded until sequential prediction.
    """
    global _lab_predictor
    global _lab_predictor_error

    if _lab_predictor is not None:
        return _lab_predictor

    with _lab_predictor_init_lock:
        # Another request may have initialized it while we waited.
        if _lab_predictor is not None:
            return _lab_predictor

        try:
            predictor = LabAssistedSoilPredictor(
                min_feature_coverage=1.0
            )

            if len(predictor.models) != 7:
                raise RuntimeError(
                    f"Expected 7 production models, "
                    f"found {len(predictor.models)}."
                )

            _lab_predictor = predictor
            _lab_predictor_error = None

            logger.info(
                "Initialized metadata for %d laboratory-assisted models.",
                len(predictor.models),
            )

            return predictor

        except Exception as exc:
            _lab_predictor_error = str(exc)
            logger.exception(
                "Failed to initialize laboratory model metadata."
            )
            raise


# ---------------------------------------------------------------------
# FastAPI application
# ---------------------------------------------------------------------

app = FastAPI(
    title="AgroGrowth Soil Analysis AI",
    description=(
        "Soil analysis, climate-crop matching, image diagnosis, "
        "and memory-aware laboratory-assisted soil ML predictions."
    ),
    version="1.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)


# ---------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------

_origins_env = os.getenv("ALLOWED_ORIGINS", "*").strip()

if _origins_env == "*":
    allowed_origins = ["*"]
else:
    allowed_origins = [
        origin.strip().rstrip("/")
        for origin in _origins_env.split(",")
        if origin.strip()
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------
# Root
# ---------------------------------------------------------------------

@app.get("/")
async def root():
    """Service information and available endpoints."""

    return {
        "service": "AgroGrowth Soil Analysis AI",
        "status": "running",
        "version": "1.1.0",
        "endpoints": {
            "soil_analysis": "/analyze-soil",
            "crop_matching": "/match-crops",
            "image_diagnosis": "/diagnose-image",
            "lab_assisted_prediction": "/predict-lab-soil",
            "lab_models_status": "/lab-models/status",
            "health": "/health",
            "docs": "/docs",
        },
    }


# ---------------------------------------------------------------------
# Optional LLM advisory status
# ---------------------------------------------------------------------

def get_advisory_provider_status():
    try:
        provider = get_provider()
        configured = bool(provider.is_configured())
        return {
            "configured": configured,
            "model_source": provider.model_source() if configured else None,
        }
    except Exception as exc:
        logger.warning("Soil advisory provider status unavailable: %s", exc)
        return {"configured": False, "model_source": None}


def get_soil_model_source():
    source = getattr(soil_analyzer, "model_source", None)
    return source or "deterministic-rules"


# ---------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------

@app.get("/health")
async def health_check():
    """
    Report service availability and model metadata state.

    Lab model artifacts are never loaded by this endpoint.
    """

    def service_status(service):
        return {
            "ready": bool(getattr(service, "is_ready", False)),
            "trained": bool(getattr(service, "is_trained", False)),
            "model_source": getattr(service, "model_source", None),
            "field_validated": bool(
                getattr(service, "field_validated", False)
            ),
        }

    advisory_status = get_advisory_provider_status()

    return {
        "status": "healthy",
        "service": "Soil Analysis AI",
        "model_source": get_soil_model_source(),
        "advisory_configured": advisory_status["configured"],
        "advisory_model_source": advisory_status["model_source"],
        "services": {
            "soil_analyzer": service_status(soil_analyzer),
            "climate_matcher": service_status(climate_matcher),
            "image_diagnosis": service_status(image_diagnosis),
        },
        "models_loaded": {
            "soil_analyzer": bool(
                getattr(soil_analyzer, "is_trained", False)
            ),
            "climate_matcher": bool(
                getattr(climate_matcher, "is_trained", False)
            ),
            "image_diagnosis": bool(
                getattr(image_diagnosis, "is_trained", False)
            ),
            # Sequential inference does not retain model objects.
            "lab_assisted_models": 0,
        },
        "lab_assisted": {
            "loaded": False,
            "metadata_ready": _lab_predictor is not None,
            "expected_models": 7,
            "prediction_scope": "lab_assisted_only",
            "field_validated": False,
            "tunisia_validated": False,
            "load_error": _lab_predictor_error,
        },
    }


# ---------------------------------------------------------------------
# Soil analysis
# ---------------------------------------------------------------------

@app.post(
    "/analyze-soil",
    response_model=SoilAnalysisResponse,
)
async def analyze_soil(request: SoilAnalysisRequest):
    """
    Analyze soil properties from farmer/sensor input.

    This endpoint does not call laboratory-assisted ML models.
    """

    try:
        logger.info("Analyzing soil sensor data.")

        result = soil_analyzer.analyze_soil_properties(
            request.sensor_data
        )

        # Keep measurement provenance separate from model provenance.
        result["data_source"] = "user_supplied_input"
        result["is_real_data"] = None
        result["model_source"] = get_soil_model_source()

        # Advisory is optional and must never break numeric analysis.
        try:
            advisory = narrate(
                result,
                task=(
                    "Explain this rule-based soil screening result. "
                    "Give cautious, practical guidance. Distinguish "
                    "user-provided measurements from verified lab results. "
                    "Do not invent missing measurements or units."
                ),
                language=request.language,
                context={
                    "sensor_data": request.sensor_data,
                    "location": request.location,
                },
            )
            if advisory:
                result["advisory"] = advisory
        except Exception as advisory_error:
            logger.warning(
                "Optional soil advisory unavailable: %s",
                advisory_error,
            )
            result["advisory"] = None

        return SoilAnalysisResponse(**result)

    except HTTPException:
        raise

    except ValueError as exc:
        logger.warning("Invalid soil analysis input: %s", exc)
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        logger.exception("Soil analysis failed.")
        raise HTTPException(
            status_code=500,
            detail="Soil analysis failed.",
        ) from exc


# ---------------------------------------------------------------------
# Climate and crop matching
# ---------------------------------------------------------------------

@app.post(
    "/match-crops",
    response_model=CropMatchingResponse,
)
async def match_crops(request: ClimateMatchingRequest):
    """Match suitable crops to climate and soil conditions."""

    try:
        logger.info("Matching crops from climate and soil data.")

        result = climate_matcher.match_crops_to_climate(
            request.climate_data,
            request.soil_data,
        )

        return CropMatchingResponse(**result)

    except HTTPException:
        raise

    except Exception as exc:
        logger.exception("Crop matching failed.")

        raise HTTPException(
            status_code=500,
            detail="Crop matching failed.",
        ) from exc


# ---------------------------------------------------------------------
# Soil image diagnosis
# ---------------------------------------------------------------------

@app.post(
    "/diagnose-image",
    response_model=ImageDiagnosisResponse,
)
async def diagnose_soil_image(file: UploadFile = File(...)):
    """Diagnose soil condition from an uploaded image."""

    try:
        if not file.filename:
            raise HTTPException(
                status_code=400,
                detail="An image file is required.",
            )

        image_data = await file.read()

        if not image_data:
            raise HTTPException(
                status_code=400,
                detail="Uploaded image is empty.",
            )

        logger.info(
            "Analyzing soil image: %s",
            file.filename,
        )

        result = image_diagnosis.analyze_soil_image(image_data)

        return ImageDiagnosisResponse(**result)

    except HTTPException:
        raise

    except Exception as exc:
        logger.exception("Image diagnosis failed.")

        raise HTTPException(
            status_code=500,
            detail="Image diagnosis failed.",
        ) from exc

    finally:
        await file.close()


# ---------------------------------------------------------------------
# Laboratory-assisted soil prediction
# ---------------------------------------------------------------------

@app.post("/predict-lab-soil")
def predict_lab_soil(request: LabAssistedSoilRequest):
    """
    Predict laboratory soil analytes using seven sequentially loaded models.

    Each model is loaded for its prediction and released before
    the next model is loaded.
    """

    if not request.lab_values:
        raise HTTPException(
            status_code=422,
            detail="lab_values cannot be empty.",
        )

    try:
        predictor = get_lab_predictor()
        result = predictor.predict(request.lab_values)

        return result

    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc

    except HTTPException:
        raise

    except Exception as exc:
        logger.exception(
            "Laboratory-assisted soil prediction failed."
        )

        raise HTTPException(
            status_code=503,
            detail=(
                "Laboratory-assisted prediction service is unavailable."
            ),
        ) from exc


# ---------------------------------------------------------------------
# Laboratory model status — metadata only, no artifact loading
# ---------------------------------------------------------------------

@app.get("/lab-models/status")
async def lab_models_status():
    """
    Report model metadata and artifact availability.

    This endpoint does not load any joblib model into memory.
    """

    try:
        predictor = get_lab_predictor()
        models = {}

        for target, config in predictor.models.items():
            artifact_path = config["artifact_path"]

            models[target] = {
                "loaded": False,
                "available": artifact_path.is_file(),
                "feature_count": len(config["features"]),
                "prediction_scope": "lab_assisted_only",
                "metrics": config.get("metrics", {}),
            }

        available_count = sum(
            1
            for model in models.values()
            if model["available"]
        )

        status = (
            "ready"
            if available_count == len(models) == 7
            else "degraded"
        )

        return {
            "status": status,
            "models_loaded": 0,
            "models_available": available_count,
            "expected_models": 7,
            "prediction_scope": "lab_assisted_only",
            "field_validated": False,
            "tunisia_validated": False,
            "models": models,
        }

    except Exception as exc:
        logger.exception(
            "Laboratory model metadata diagnostic failed."
        )

        return JSONResponse(
            status_code=503,
            content={
                "status": "error",
                "models_loaded": 0,
                "models_available": 0,
                "expected_models": 7,
                "error_type": type(exc).__name__,
                "message": (
                    "Laboratory model metadata could not be loaded. "
                    "Check service logs for details."
                ),
            },
        )


# ---------------------------------------------------------------------
# Crop requirements
# ---------------------------------------------------------------------

@app.get("/crop-requirements/{crop_name}")
async def get_crop_requirements(crop_name: str):
    """Get detailed requirements for a specific crop."""

    try:
        requirements = climate_matcher.get_crop_requirements(
            crop_name
        )

        return {
            "status": "success",
            "crop_requirements": requirements,
        }

    except ValueError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        logger.exception("Failed to get crop requirements.")

        raise HTTPException(
            status_code=500,
            detail="Failed to get crop requirements.",
        ) from exc


# ---------------------------------------------------------------------
# Supported crops
# ---------------------------------------------------------------------

@app.get("/supported-crops")
async def get_supported_crops():
    """Get the list of all supported crops."""

    try:
        crops = []

        for crop_name, crop_info in climate_matcher.crop_database.items():
            crops.append({
                "name": crop_name,
                "name_ar": crop_info["name_ar"],
                "growing_season": crop_info["growing_season"],
                "water_requirement": crop_info["water_requirement"],
            })

        return {
            "status": "success",
            "supported_crops": crops,
            "total_count": len(crops),
        }

    except Exception as exc:
        logger.exception("Failed to get supported crops.")

        raise HTTPException(
            status_code=500,
            detail="Failed to get supported crops.",
        ) from exc


# ---------------------------------------------------------------------
# Supported soil types
# ---------------------------------------------------------------------

@app.get("/soil-types")
async def get_soil_types():
    """Get the list of supported soil types."""

    try:
        return {
            "status": "success",
            "soil_types": [
                {
                    "name": soil_type,
                    "name_ar": soil_type_ar,
                }
                for soil_type, soil_type_ar in zip(
                    image_diagnosis.soil_classes,
                    image_diagnosis.soil_classes_ar,
                )
            ],
        }

    except Exception as exc:
        logger.exception("Failed to get soil types.")

        raise HTTPException(
            status_code=500,
            detail="Failed to get soil types.",
        ) from exc


# ---------------------------------------------------------------------
# Exception handlers
# ---------------------------------------------------------------------

@app.exception_handler(ValueError)
async def value_error_handler(request, exc: ValueError):
    logger.warning(
        "Invalid request value on %s: %s",
        request.url.path,
        str(exc),
    )

    return JSONResponse(
        status_code=400,
        content={
            "status": "error",
            "message": str(exc),
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc: Exception):
    logger.exception(
        "Unhandled exception on %s",
        request.url.path,
    )

    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "message": "Internal server error",
        },
    )


# ---------------------------------------------------------------------
# Application entry point
# ---------------------------------------------------------------------

if __name__ == "__main__":
    port = int(
        os.environ.get(
            "PORT",
            os.environ.get("SERVICE_PORT", "8001"),
        )
    )

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        log_level=os.getenv("LOG_LEVEL", "info").lower(),
    )
