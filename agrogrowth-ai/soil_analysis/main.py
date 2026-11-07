
"""
AgroGrowth Soil Analysis AI — FastAPI service.

Provides:
- Soil analysis from farmer/sensor inputs
- Climate and crop matching
- Soil image diagnosis
- Laboratory-assisted ML predictions
- Crop requirements and supported soil/crop metadata

Important:
Laboratory ML predictions are separate from field/sensor analysis.
The current production models are lab_assisted_only and are not
field-validated or Tunisia-validated.
"""

import logging
import os
import sys
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
            "Laboratory soil measurements. Values must correspond "
            "to the features required by the production models."
        ),
    )


class SoilAnalysisResponse(BaseModel):
    soil_type: Dict[str, Any]
    properties: Dict[str, Any]
    health_score: Optional[float] = None
    fertility_level: str
    overall_recommendations: List[str]
    analysis_timestamp: str


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
# Laboratory ML predictor — lazy-loaded once
# ---------------------------------------------------------------------

_lab_predictor: Optional[LabAssistedSoilPredictor] = None
_lab_predictor_error: Optional[str] = None


def get_lab_predictor() -> LabAssistedSoilPredictor:
    """
    Load laboratory models once and reuse them across requests.

    Loading is lazy so that an unavailable laboratory model does not
    prevent the other Soil Analysis endpoints from starting.
    """
    global _lab_predictor
    global _lab_predictor_error

    if _lab_predictor is not None:
        return _lab_predictor

    try:
        predictor = LabAssistedSoilPredictor(
            min_feature_coverage=0.80
        )

        if len(predictor.models) != 7:
            raise RuntimeError(
                f"Expected 7 production models, "
                f"loaded {len(predictor.models)}."
            )

        _lab_predictor = predictor
        _lab_predictor_error = None

        logger.info(
            "Loaded %d laboratory-assisted soil models.",
            len(_lab_predictor.models),
        )

        return _lab_predictor

    except Exception as exc:
        _lab_predictor_error = str(exc)
        logger.exception("Failed to load laboratory soil models.")
        raise


# ---------------------------------------------------------------------
# FastAPI application
# ---------------------------------------------------------------------

app = FastAPI(
    title="AgroGrowth Soil Analysis AI",
    description=(
        "Soil analysis, climate-crop matching, image diagnosis, "
        "and laboratory-assisted soil ML predictions."
    ),
    version="1.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)


# ---------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------

# Configure ALLOWED_ORIGINS as comma-separated URLs in production.
# Example:
# ALLOWED_ORIGINS=https://agrogrowth.tn,https://www.agrogrowth.tn
#
# Wildcard origins cannot be combined safely with credentialed requests.

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
# Health check
# ---------------------------------------------------------------------

@app.get("/health")
async def health_check():
    """
    Report service availability and model training/loading information.

    is_trained and is_ready are intentionally reported separately.
    A deterministic service can be ready without being ML-trained.
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

    return {
        "status": "healthy",
        "service": "Soil Analysis AI",
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
            "lab_assisted_models": (
                len(_lab_predictor.models)
                if _lab_predictor is not None
                else 0
            ),
        },
        "lab_assisted": {
            "loaded": _lab_predictor is not None,
            "expected_models": 7,
            "prediction_scope": "lab_assisted_only",
            "field_validated": False,
            "tunisia_validated": False,
            "load_error": _lab_predictor_error,
        },
    }


# ---------------------------------------------------------------------
# Existing endpoint: soil analysis
# ---------------------------------------------------------------------

@app.post(
    "/analyze-soil",
    response_model=SoilAnalysisResponse,
)
async def analyze_soil(request: SoilAnalysisRequest):
    """
    Analyze soil properties from farmer/sensor input.

    This endpoint preserves the existing soil analyzer contract.
    It does not call the laboratory-assisted ML models.
    """

    try:
        logger.info("Analyzing soil sensor data.")

        result = soil_analyzer.analyze_soil_properties(
            request.sensor_data
        )

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
# Existing endpoint: climate and crop matching
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
# Existing endpoint: image diagnosis
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
# New endpoint: laboratory-assisted soil prediction
# ---------------------------------------------------------------------

@app.post("/predict-lab-soil")
async def predict_lab_soil(request: LabAssistedSoilRequest):
    """
    Predict laboratory soil analytes using the seven trained ML models.

    Input:
        lab_values: laboratory measurements.

    Important:
        - This is a lab-assisted prediction endpoint.
        - It is not a sensor-only or image-only prediction endpoint.
        - The models are not field-validated or Tunisia-validated.
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
        logger.exception("Laboratory-assisted prediction failed.")

        raise HTTPException(
            status_code=503,
            detail="Laboratory-assisted prediction service is unavailable.",
        ) from exc


# ---------------------------------------------------------------------
# New endpoint: laboratory model status
# ---------------------------------------------------------------------

@app.get("/lab-models/status")
async def lab_models_status():
    """
    Return laboratory ML model loading and validation status.

    This endpoint does not force model loading.
    """

    if _lab_predictor is None:
        return {
            "status": (
                "error"
                if _lab_predictor_error
                else "not_loaded"
            ),
            "models_loaded": 0,
            "expected_models": 7,
            "prediction_scope": "lab_assisted_only",
            "field_validated": False,
            "tunisia_validated": False,
            "error": _lab_predictor_error,
        }

    models = {}

    for target, config in _lab_predictor.models.items():
        models[target] = {
            "loaded": True,
            "feature_count": len(config["features"]),
            "prediction_scope": "lab_assisted_only",
            "metrics": config.get("metrics", {}),
        }

    return {
        "status": "ready",
        "models_loaded": len(models),
        "expected_models": 7,
        "prediction_scope": "lab_assisted_only",
        "field_validated": False,
        "tunisia_validated": False,
        "models": models,
    }


# ---------------------------------------------------------------------
# Existing endpoint: crop requirements
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
# Existing endpoint: supported crops
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
# Existing endpoint: supported soil types
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
    port = int(os.environ.get("PORT", "8000"))

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        log_level=os.getenv("LOG_LEVEL", "info").lower(),
    )
