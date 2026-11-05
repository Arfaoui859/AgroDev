
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

    return "unknown"


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

    return {
        "status": "healthy" if overall_ready else "degraded",
        "service": "Crop Recommendation AI",
        "version": "1.1.0",

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

    try:
        logger.info(
            "Crop recommendation request: temperature=%s, rainfall=%s, pH=%s",
            request.temperature,
            request.annual_rainfall,
            request.soil_ph,
        )

        input_data = request.model_dump()

        result = crop_recommender.recommend_crops(input_data)

        # Preserve truthful provenance.
        recommender_source = get_crop_recommender_source()

        result["data_source"] = recommender_source
        result["is_real_data"] = False
        result["model_source"] = recommender_source

        # Advisory is optional: a provider failure must not
        # make the numeric recommendation endpoint fail.
        try:
            advisory = narrate(
                result,
                task=(
                    "Explain these crop recommendations and "
                    "the reasoning behind them. Clearly distinguish "
                    "indicative estimates from verified facts."
                ),
                language=request.language,
                context={
                    "temperature": request.temperature,
                    "annual_rainfall": request.annual_rainfall,
                    "soil_ph": request.soil_ph,
                    "farm_size": request.farm_size,
                    "location": request.location,
                },
            )

            if advisory:
                result["advisory"] = advisory

        except Exception as advisory_error:
            logger.warning(
                "Optional crop advisory unavailable: %s",
                advisory_error,
            )

            result["advisory"] = {
                "status": "unavailable",
                "message": "Advisory provider is temporarily unavailable.",
            }

        return CropRecommendationResponse(**result)

    except ValueError as exc:
        logger.warning("Invalid crop recommendation input: %s", exc)
        raise HTTPException(status_code=400, detail=str(exc))

    except Exception as exc:
        logger.exception("Crop recommendation failed")
        raise HTTPException(
            status_code=500,
            detail="Crop recommendation failed.",
        )


# ---------------------------------------------------------
# Profit estimation
# ---------------------------------------------------------

@app.post(
    "/estimate-profit",
    response_model=ProfitEstimationResponse,
)
async def estimate_profit(request: ProfitEstimationRequest):

    try:
        logger.info(
            "Profit estimation request: crop=%s, farm_size=%s",
            request.crop_name,
            request.farm_size,
        )

        # Important: do not send empty optional values.
        # This allows the engine to distinguish omitted inputs
        # from values explicitly supplied by the farmer.
        crop_data = request.model_dump(exclude_none=True)

        result = profit_estimator.estimate_crop_profitability(
            crop_data
        )

        return ProfitEstimationResponse(**result)

    except ValueError as exc:
        logger.warning("Invalid profit estimation input: %s", exc)
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    except Exception:
        logger.exception("Profit estimation failed")
        raise HTTPException(
            status_code=500,
            detail="Profit estimation failed.",
        )


# ---------------------------------------------------------
# Crop comparison
# ---------------------------------------------------------

@app.post(
    "/compare-crops",
    response_model=CropComparisonResponse,
)
async def compare_crops(request: CropComparisonRequest):

    try:
        logger.info(
            "Crop comparison request: %s crops",
            len(request.crops_data),
        )

        crops_data = [
            crop.model_dump(exclude_none=True)
            for crop in request.crops_data
        ]

        result = profit_estimator.compare_crop_profitability(
            crops_data
        )

        return CropComparisonResponse(**result)

    except ValueError as exc:
        logger.warning("Invalid crop comparison input: %s", exc)
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    except Exception:
        logger.exception("Crop comparison failed")
        raise HTTPException(
            status_code=500,
            detail="Crop comparison failed.",
        )


# ---------------------------------------------------------
# Supported crops
# ---------------------------------------------------------

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

    try:
        normalized_name = crop_name.strip().lower()

        if normalized_name not in crop_recommender.crop_database:
            raise HTTPException(
                status_code=404,
                detail=f"Crop '{crop_name}' not found.",
            )

        crop_info = crop_recommender.crop_database[normalized_name]

        return {
            "status": "success",
            "crop_details": {
                "name": normalized_name,
                "name_ar": crop_info.get("name_ar"),
                "category": crop_info.get("category"),
                "optimal_conditions": crop_info.get(
                    "optimal_conditions", {}
                ),
                "economic_data": crop_info.get(
                    "economic_data", {}
                ),
                "cultivation_info": crop_info.get(
                    "cultivation_info", {}
                ),
                "risk_factors": crop_info.get(
                    "risk_factors", {}
                ),
            },
            "data_source": "static_crop_reference_database",
            "field_validated": False,
        }

    except HTTPException:
        raise

    except Exception:
        logger.exception("Getting crop details failed")
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve crop details.",
        )


# ---------------------------------------------------------
# Market reference data
# ---------------------------------------------------------

@app.get("/market-data/{crop_name}")
async def get_market_data(crop_name: str):

    try:
        normalized_name = crop_name.strip().lower()

        if normalized_name not in profit_estimator.market_data:
            raise HTTPException(
                status_code=404,
                detail=f"Market reference for '{crop_name}' not found.",
            )

        market_info = profit_estimator.market_data[normalized_name]

        return {
            "status": "success",
            "market_data": {
                "crop_name": normalized_name,
                "name_ar": market_info["name_ar"],
                "base_price_per_kg": market_info["base_price_per_kg"],
                "price_volatility": market_info["price_volatility"],
                "seasonal_factors": market_info["seasonal_factors"],
                "demand_trend": market_info["demand_trend"],
                "export_potential": market_info["export_potential"],
            },
            "data_source": "indicative_reference_values",
            "live_market_data": False,
            "field_validated": False,
            "disclaimer": (
                "These values are indicative references, "
                "not verified live market prices."
            ),
        }

    except HTTPException:
        raise

    except Exception:
        logger.exception("Getting market data failed")
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve market reference data.",
        )


# ---------------------------------------------------------
# Quick crop recommendation
# ---------------------------------------------------------

@app.post("/quick-recommendation")
async def quick_recommendation(
    temperature: float = Field(
        description="Average temperature in Celsius",
        ge=-30,
        le=60,
    ),
    rainfall: float = Field(
        description="Annual rainfall in mm",
        ge=0,
        le=10000,
    ),
    soil_ph: float = Field(
        description="Soil pH level",
        ge=0,
        le=14,
    ),
    farm_size: float = Field(
        default=2.0,
        gt=0,
    ),
):

    try:
        input_data = {
            "temperature": temperature,
            "annual_rainfall": rainfall,
            "soil_ph": soil_ph,
            "farm_size": farm_size,
            "soil_quality_score": 0.7,
            "water_availability": 0.8,
            "farmer_experience_years": 5,
            "available_capital": 10000,
            "risk_tolerance": 0.5,
        }

        result = crop_recommender.recommend_crops(input_data)

        top_crops = result.get("recommendations", [])[:3]

        simplified_crops = []

        for crop in top_crops:

            risk_assessment = crop.get("risk_assessment", {})
            overall_risk = risk_assessment.get("overall_risk", {})

            simplified_crops.append({
                "crop_name": crop.get("crop"),
                "crop_name_ar": crop.get("name_ar"),
                "suitability_score": crop.get("suitability_score"),
                "risk_level": overall_risk.get(
                    "level", "غير محدد"
                ),
                "growing_season": crop.get("growing_season"),
            })

        return {
            "status": "success",
            "quick_recommendations": simplified_crops,
            "best_crop": (
                simplified_crops[0]
                if simplified_crops else None
            ),
            "model_source": get_crop_recommender_source(),
            "field_validated": False,
            "disclaimer": (
                "Suitability scores are indicative and not "
                "field-validated. This endpoint does not estimate profit."
            ),
            "analysis_timestamp": datetime.now().isoformat(),
        }

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    except Exception:
        logger.exception("Quick recommendation failed")
        raise HTTPException(
            status_code=500,
            detail="Quick recommendation failed.",
        )


# ---------------------------------------------------------
# Error handlers
# ---------------------------------------------------------

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
