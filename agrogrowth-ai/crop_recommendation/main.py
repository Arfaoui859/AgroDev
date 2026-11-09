
"""
FastAPI service for AgroGrowth Crop Recommendation AI.

Provides:
- Crop recommendations
- Transparent profit estimation
- Crop profitability comparison
- Crop information and market reference data

The profit estimator uses deterministic financial calculations.
The crop recommender remains separately identified by its actual model source.
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional
import logging
import sys
import os
import uvicorn
from datetime import datetime

# Add parent directory to path for imports
sys.path.append(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
)

from crop_recommendation.crop_recommender import create_crop_recommender
from crop_recommendation.profit_estimator import create_profit_estimator
from ai_common.llm_provider import get_provider
from ai_common.advisory import narrate


# ---------------------------------------------------------
# Logging
# ---------------------------------------------------------

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ---------------------------------------------------------
# Request models
# ---------------------------------------------------------

class CropRecommendationRequest(BaseModel):
    temperature: float = Field(
        description="Average temperature in Celsius",
        ge=-30,
        le=60,
    )

    annual_rainfall: float = Field(
        description="Annual rainfall in mm",
        ge=0,
        le=10000,
    )

    soil_ph: float = Field(
        description="Soil pH level",
        ge=0,
        le=14,
    )

    soil_quality_score: Optional[float] = Field(
        default=0.7,
        ge=0,
        le=1,
    )

    water_availability: Optional[float] = Field(
        default=0.8,
        ge=0,
        le=1,
    )

    target_market_price: Optional[float] = Field(
        default=3.0,
        ge=0,
    )

    farmer_experience_years: Optional[int] = Field(
        default=5,
        ge=0,
    )

    available_capital: Optional[float] = Field(
        default=10000,
        ge=0,
    )

    farm_size: Optional[float] = Field(
        default=2.0,
        gt=0,
    )

    risk_tolerance: Optional[float] = Field(
        default=0.5,
        ge=0,
        le=1,
    )

    location: Optional[Dict[str, float]] = None

    language: Optional[str] = Field(
        default=None,
        description="ar, ar-tn, fr or en",
    )


class ProfitEstimationRequest(BaseModel):
    crop_name: str = Field(
        description="Supported crop name",
        min_length=1,
    )

    farm_size: float = Field(
        description="Farm size in hectares",
        gt=0,
    )

    planning_horizon_years: int = Field(
        default=1,
        ge=1,
        le=30,
    )

    # Actual or locally validated yield is required by the engine.
    yield_per_hectare: Optional[float] = Field(
        default=None,
        ge=0,
        description="Actual/validated yield in kg per hectare",
    )

    expected_yield_per_hectare: Optional[float] = Field(
        default=None,
        ge=0,
        description="Expected yield in kg per hectare",
    )

    # If omitted, the engine may use its indicative reference price.
    market_price_per_kg: Optional[float] = Field(
        default=None,
        ge=0,
        description="Actual selling price per kg",
    )

    currency: Optional[str] = Field(
        default="TND",
        min_length=3,
        max_length=5,
    )

    soil_quality_score: Optional[float] = Field(
        default=None,
        ge=0,
        le=1,
    )

    climate_suitability_score: Optional[float] = Field(
        default=None,
        ge=0,
        le=1,
    )

    farmer_experience_years: Optional[int] = Field(
        default=None,
        ge=0,
    )

    technology_level: Optional[float] = Field(
        default=None,
        ge=0,
        le=1,
    )

    market_distance_km: Optional[float] = Field(
        default=None,
        ge=0,
    )

    water_availability_score: Optional[float] = Field(
        default=None,
        ge=0,
        le=1,
    )

    labor_availability_score: Optional[float] = Field(
        default=None,
        ge=0,
        le=1,
    )

    available_capital: Optional[float] = Field(
        default=None,
        ge=0,
    )

    product_quality_score: Optional[float] = Field(
        default=None,
        ge=0,
        le=1,
    )

    # Cost inputs. None means use the estimator's
    # clearly identified indicative reference value.
    seed_cost_per_hectare: Optional[float] = Field(
        default=None,
        ge=0,
    )

    fertilizer_cost_per_hectare: Optional[float] = Field(
        default=None,
        ge=0,
    )

    pesticide_cost_per_hectare: Optional[float] = Field(
        default=None,
        ge=0,
    )

    labor_days_per_hectare: Optional[float] = Field(
        default=None,
        ge=0,
    )

    land_lease_per_hectare: Optional[float] = Field(
        default=None,
        ge=0,
    )

    equipment_depreciation_per_hectare: Optional[float] = Field(
        default=None,
        ge=0,
    )

    insurance_per_hectare: Optional[float] = Field(
        default=None,
        ge=0,
    )

    certification_per_hectare: Optional[float] = Field(
        default=None,
        ge=0,
    )

    fuel_consumption_per_hectare: Optional[float] = Field(
        default=None,
        ge=0,
    )

    electricity_consumption_per_hectare: Optional[float] = Field(
        default=None,
        ge=0,
    )

    water_consumption_per_hectare: Optional[float] = Field(
        default=None,
        ge=0,
    )

    labor_cost_per_day: Optional[float] = Field(
        default=None,
        ge=0,
    )

    fuel_price_per_liter: Optional[float] = Field(
        default=None,
        ge=0,
    )

    electricity_price_per_kwh: Optional[float] = Field(
        default=None,
        ge=0,
    )

    water_price_per_cubic_meter: Optional[float] = Field(
        default=None,
        ge=0,
    )

    # Optional risk and market information
    price_volatility: Optional[float] = Field(
        default=None,
        ge=0,
        le=1,
    )

    weather_resilience_score: Optional[float] = Field(
        default=None,
        ge=0,
        le=1,
    )

    demand_trend: Optional[str] = None
    export_potential: Optional[str] = None
    local_competition_level: Optional[str] = None


class CropComparisonRequest(BaseModel):
    crops_data: List[ProfitEstimationRequest] = Field(
        description="List of crops to compare",
        min_length=1,
        max_length=20,
    )


# ---------------------------------------------------------
# Response models
# ---------------------------------------------------------

class CropRecommendationResponse(BaseModel):
    recommendations: List[Dict[str, Any]]
    best_recommendation: Optional[Dict[str, Any]] = None
    overall_analysis: Dict[str, Any]
    seasonal_advice: Dict[str, Any]
    input_analysis: Dict[str, Any]
    analysis_timestamp: str

    data_source: Optional[str] = None
    is_real_data: Optional[bool] = None
    model_source: Optional[str] = None
    advisory: Optional[Dict[str, Any]] = None


class ProfitEstimationResponse(BaseModel):
    crop_name: str
    crop_name_ar: str
    farm_size_hectares: float
    planning_horizon_years: int

    price_analysis: Dict[str, Any]
    yield_analysis: Dict[str, Any]
    cost_analysis: Dict[str, Any]
    financial_analysis: Dict[str, Any]
    risk_analysis: Dict[str, Any]
    market_analysis: Dict[str, Any]
    sensitivity_analysis: Dict[str, Any]
    investment_recommendations: Dict[str, Any]

    model_source: Optional[str] = None
    field_validated: Optional[bool] = None
    disclaimer: Optional[str] = None
    analysis_timestamp: str


class CropComparisonResponse(BaseModel):
    crop_comparisons: List[Dict[str, Any]]
    rankings: Dict[str, List[Dict[str, Any]]]
    portfolio_recommendations: Dict[str, Any]
    best_overall_crop: Optional[Dict[str, Any]] = None

    model_source: Optional[str] = None
    field_validated: Optional[bool] = None
    analysis_timestamp: str


# ---------------------------------------------------------
# Initialize services
# ---------------------------------------------------------

try:
    crop_recommender = create_crop_recommender()
    profit_estimator = create_profit_estimator()

    logger.info("Crop Recommendation AI initialized")
    logger.info("Profit Estimator initialized")

except Exception:
    logger.exception("AI service initialization failed")
    raise


# ---------------------------------------------------------
# FastAPI application
# ---------------------------------------------------------

app = FastAPI(
    title="AgroGrowth Crop Recommendation AI",
    description=(
        "Crop suitability recommendations and transparent "
        "agricultural financial calculations."
    ),
    version="1.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)


# ---------------------------------------------------------
# CORS
# ---------------------------------------------------------

cors_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "*").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)


# ---------------------------------------------------------
# Utility functions
# ---------------------------------------------------------

def get_advisory_provider_status():
    try:
        provider = get_provider()

        configured = provider.is_configured()

        return {
            "configured": configured,
            "model_source": (
                provider.model_source() if configured else None
            ),
        }

    except Exception as exc:
        logger.warning("Advisory provider status unavailable: %s", exc)

        return {
            "configured": False,
            "model_source": None,
        }


def get_crop_recommender_source():
    """
    Do not label a synthetic ML recommender as a real-data model.
    This service will be updated separately when its engine is replaced.
    """
    source = getattr(
        crop_recommender,
        "model_source",
        None,
    )

    if source:
        return source

    if getattr(crop_recommender, "is_trained", False):
        return "synthetic-demo"

    return "synthetic-demo"


# ---------------------------------------------------------
# Root
# ---------------------------------------------------------

@app.get("/")
async def root():
    return {
        "service": "AgroGrowth Crop Recommendation AI",
        "status": "running",
        "version": "1.1.0",
        "model_sources": {
            "crop_recommender": get_crop_recommender_source(),
            "profit_estimator": profit_estimator.model_source,
        },
        "endpoints": {
            "crop_recommendations": "/recommend-crops",
            "profit_estimation": "/estimate-profit",
            "crop_comparison": "/compare-crops",
            "supported_crops": "/supported-crops",
            "crop_details": "/crop-details/{crop_name}",
            "market_data": "/market-data/{crop_name}",
            "quick_recommendation": "/quick-recommendation",
            "health": "/health",
            "docs": "/docs",
        },
    }


# ---------------------------------------------------------
# Health
# ---------------------------------------------------------

@app.get("/health")
async def health_check():
    advisory_status = get_advisory_provider_status()

    crop_ready = crop_recommender is not None

    profit_ready = (
        profit_estimator is not None
        and callable(
            getattr(
                profit_estimator,
                "estimate_crop_profitability",
                None,
            )
        )
        and callable(
            getattr(
                profit_estimator,
                "compare_crop_profitability",
                None,
            )
        )
    )

    overall_ready = crop_ready and profit_ready
    production_ready = (
        overall_ready
        and get_crop_recommender_source() != "synthetic-demo"
        and profit_estimator.model_source != "deterministic-financial-rules"
    )

    return {
        "status": "healthy" if production_ready else "degraded",
        "production_ready": production_ready,
        "disabled_features": [
            "crop_recommendations",
            "profit_estimation",
            "crop_comparison",
            "market_data",
            "quick_recommendation",
        ],
        "service": "Crop Recommendation AI",
        "version": "1.1.0",
        "model_source": get_crop_recommender_source(),

        "components": {
            "crop_recommender": (
                "loaded" if crop_ready else "unavailable"
            ),
            "profit_estimator": (
                "loaded" if profit_ready else "unavailable"
            ),
        },

        "models_loaded": {
            "crop_recommender": crop_ready,
            "profit_estimator": profit_ready,
        },

        "model_sources": {
            "crop_recommender": get_crop_recommender_source(),
            "profit_estimator": profit_estimator.model_source,
        },

        "numeric_models_field_validated": False,

        "advisory_model_source": advisory_status["model_source"],
        "advisory_configured": advisory_status["configured"],

        "disclaimer": (
            "Crop recommender provenance must be interpreted separately. "
            "Profit estimation uses deterministic calculations and "
            "indicative reference assumptions. Neither status nor readiness "
            "implies scientific or field validation."
        ),

        "timestamp": datetime.now().isoformat(),
    }


# ---------------------------------------------------------
# Crop recommendation
# ---------------------------------------------------------

@app.post(
    "/recommend-crops",
    response_model=CropRecommendationResponse,
)
async def recommend_crops(request: CropRecommendationRequest):
    raise HTTPException(
        status_code=503,
        detail={
            "code": "CROP_MODEL_NOT_VALIDATED",
            "message": "The crop recommender was trained on synthetic samples. Production recommendations are disabled until a documented real dataset and independent evaluation are available.",
            "production_ready": False,
        },
    )
@app.post(
    "/estimate-profit",
    response_model=ProfitEstimationResponse,
)
async def estimate_profit(request: ProfitEstimationRequest):
    raise HTTPException(
        status_code=503,
        detail={
            "code": "FINANCIAL_REFERENCE_DATA_NOT_VERIFIED",
            "message": "The profitability engine uses unverified reference prices and cost assumptions. Financial estimates are disabled until source, region, currency, date, and units are verified.",
            "production_ready": False,
        },
    )
@app.post(
    "/compare-crops",
    response_model=CropComparisonResponse,
)
async def compare_crops(request: CropComparisonRequest):
    raise HTTPException(
        status_code=503,
        detail={
            "code": "FINANCIAL_REFERENCE_DATA_NOT_VERIFIED",
            "message": "Crop comparisons depend on unverified reference prices and cost assumptions and are disabled until verified inputs are available.",
            "production_ready": False,
        },
    )
@app.get("/supported-crops")
async def get_supported_crops():

    try:
        crops = []

        for crop_name, crop_info in crop_recommender.crop_database.items():

            optimal = crop_info.get("optimal_conditions", {})

            crops.append({
                "name": crop_name,
                "name_ar": crop_info.get("name_ar"),
                "category": crop_info.get("category"),
                "growing_season": optimal.get("growing_season"),
                "optimal_temperature_range": optimal.get(
                    "temperature_range"
                ),
                "optimal_rainfall_range": optimal.get(
                    "rainfall_range"
                ),
                "suitable_soil_types": optimal.get("soil_types", []),
            })

        return {
            "status": "success",
            "supported_crops": crops,
            "total_count": len(crops),
            "data_source": "static_crop_reference_database",
            "field_validated": False,
            "source_verified": False,
        }

    except Exception:
        logger.exception("Getting supported crops failed")
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve supported crops.",
        )


# ---------------------------------------------------------
# Crop details
# ---------------------------------------------------------

@app.get("/crop-details/{crop_name}")
async def get_crop_details(crop_name: str):
    raise HTTPException(
        status_code=503,
        detail={
            "code": "CROP_REFERENCE_NOT_VERIFIED",
            "message": "Detailed crop economics, yield, cultivation and risk values are not backed by a verified source catalogue and are not exposed.",
            "production_ready": False,
        },
    )
@app.get("/market-data/{crop_name}")
async def get_market_data(crop_name: str):
    raise HTTPException(
        status_code=503,
        detail={
            "code": "LIVE_MARKET_DATA_NOT_CONFIGURED",
            "message": "The stored crop prices are indicative placeholders, not verified market observations. They are not exposed as market data.",
            "production_ready": False,
        },
    )
@app.post("/quick-recommendation")
async def quick_recommendation(
    temperature: float = Query(
        ...,
        description="Average temperature in Celsius",
        ge=-30,
        le=60,
    ),
    rainfall: float = Query(
        ...,
        description="Annual rainfall in mm",
        ge=0,
        le=10000,
    ),
    soil_ph: float = Query(
        ...,
        description="Soil pH level",
        ge=0,
        le=14,
    ),
    farm_size: float = Query(
        default=2.0,
        gt=0,
    ),
):
    raise HTTPException(
        status_code=503,
        detail={
            "code": "CROP_MODEL_NOT_VALIDATED",
            "message": "The quick recommender calls the same synthetic-trained crop model and injects default soil, water, capital, and experience values. It is disabled for production.",
            "production_ready": False,
        },
    )
@app.exception_handler(ValueError)
async def value_error_handler(request, exc):

    return JSONResponse(
        status_code=400,
        content={
            "status": "error",
            "message": str(exc),
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):

    logger.exception("Unhandled exception: %s", exc)

    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "message": "Internal server error.",
        },
    )


# ---------------------------------------------------------
# Run
# ---------------------------------------------------------

if __name__ == "__main__":

    port = int(os.environ.get("PORT", 8002))

    uvicorn.run(
        "crop_recommendation.main:app",
        host="0.0.0.0",
        port=port,
    )
