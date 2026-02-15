"""
FastAPI service for Crop Recommendation AI
Provides REST API endpoints for crop recommendations and profit estimation
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional
import logging
import sys
import os

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from crop_recommendation.crop_recommender import create_crop_recommender
from crop_recommendation.profit_estimator import create_profit_estimator

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Pydantic models for requests and responses
class CropRecommendationRequest(BaseModel):
    temperature: float = Field(description="Average temperature in Celsius")
    annual_rainfall: float = Field(description="Annual rainfall in mm")
    soil_ph: float = Field(description="Soil pH level")
    soil_quality_score: Optional[float] = Field(default=0.7, description="Soil quality score (0-1)")
    water_availability: Optional[float] = Field(default=0.8, description="Water availability score (0-1)")
    target_market_price: Optional[float] = Field(default=3.0, description="Target market price per kg")
    farmer_experience_years: Optional[int] = Field(default=5, description="Farmer experience in years")
    available_capital: Optional[float] = Field(default=10000, description="Available capital for investment")
    farm_size: Optional[float] = Field(default=2.0, description="Farm size in hectares")
    risk_tolerance: Optional[float] = Field(default=0.5, description="Risk tolerance (0-1)")
    location: Optional[Dict[str, float]] = Field(default=None, description="GPS coordinates")

class ProfitEstimationRequest(BaseModel):
    crop_name: str = Field(description="Name of the crop to analyze")
    farm_size: float = Field(description="Farm size in hectares")
    planning_horizon_years: Optional[int] = Field(default=1, description="Planning horizon in years")
    soil_quality_score: Optional[float] = Field(default=0.7, description="Soil quality score (0-1)")
    climate_suitability_score: Optional[float] = Field(default=0.8, description="Climate suitability score (0-1)")
    farmer_experience_years: Optional[int] = Field(default=5, description="Farmer experience in years")
    technology_level: Optional[float] = Field(default=0.6, description="Technology adoption level (0-1)")
    market_distance_km: Optional[float] = Field(default=50, description="Distance to market in km")
    water_availability_score: Optional[float] = Field(default=0.8, description="Water availability score (0-1)")
    labor_availability_score: Optional[float] = Field(default=0.7, description="Labor availability score (0-1)")
    available_capital: Optional[float] = Field(default=10000, description="Available capital")
    product_quality_score: Optional[float] = Field(default=0.8, description="Expected product quality (0-1)")
    seed_cost_per_hectare: Optional[float] = Field(default=200, description="Seed cost per hectare")
    fertilizer_cost_per_hectare: Optional[float] = Field(default=300, description="Fertilizer cost per hectare")
    pesticide_cost_per_hectare: Optional[float] = Field(default=150, description="Pesticide cost per hectare")
    labor_days_per_hectare: Optional[int] = Field(default=30, description="Labor days required per hectare")

class CropComparisonRequest(BaseModel):
    crops_data: List[ProfitEstimationRequest] = Field(description="List of crops to compare")

class CropRecommendationResponse(BaseModel):
    recommendations: List[Dict[str, Any]]
    best_recommendation: Optional[Dict[str, Any]]
    overall_analysis: Dict[str, Any]
    seasonal_advice: Dict[str, Any]
    input_analysis: Dict[str, Any]
    analysis_timestamp: str

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
    analysis_timestamp: str

class CropComparisonResponse(BaseModel):
    crop_comparisons: List[Dict[str, Any]]
    rankings: Dict[str, List[Dict[str, Any]]]
    portfolio_recommendations: Dict[str, Any]
    best_overall_crop: Optional[Dict[str, Any]]
    analysis_timestamp: str

# Initialize AI models
crop_recommender = create_crop_recommender()
profit_estimator = create_profit_estimator()

# Create FastAPI app
app = FastAPI(
    title="AgroGrowth Crop Recommendation AI",
    description="AI-powered crop recommendations and profit estimation for optimal agricultural decisions",
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
        "service": "AgroGrowth Crop Recommendation AI",
        "status": "running",
        "version": "1.0.0",
        "endpoints": {
            "crop_recommendations": "/recommend-crops",
            "profit_estimation": "/estimate-profit",
            "crop_comparison": "/compare-crops",
            "supported_crops": "/supported-crops",
            "health": "/health",
            "docs": "/docs"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Crop Recommendation AI",
        "models_loaded": {
            "crop_recommender": crop_recommender.is_trained,
            "profit_estimator": profit_estimator.is_trained
        }
    }

@app.post("/recommend-crops", response_model=CropRecommendationResponse)
async def recommend_crops(request: CropRecommendationRequest):
    """
    Get intelligent crop recommendations based on conditions
    
    Analyzes soil, climate, economic, and farmer-specific factors to recommend
    the most suitable crops with detailed suitability analysis.
    """
    try:
        logger.info(f"Processing crop recommendation request for conditions: temp={request.temperature}°C, rainfall={request.annual_rainfall}mm")
        
        # Convert request to dict for processing
        input_data = request.dict()
        
        # Get recommendations
        result = crop_recommender.recommend_crops(input_data)
        
        return CropRecommendationResponse(**result)
        
    except Exception as e:
        logger.error(f"Error in crop recommendation: {e}")
        raise HTTPException(status_code=500, detail=f"Crop recommendation failed: {str(e)}")

@app.post("/estimate-profit", response_model=ProfitEstimationResponse)
async def estimate_profit(request: ProfitEstimationRequest):
    """
    Estimate comprehensive profitability for a specific crop
    
    Provides detailed financial analysis including costs, revenues, ROI,
    risk assessment, market analysis, and sensitivity analysis.
    """
    try:
        logger.info(f"Processing profit estimation for crop: {request.crop_name}, farm size: {request.farm_size}ha")
        
        # Convert request to dict for processing
        crop_data = request.dict()
        
        # Get profit estimation
        result = profit_estimator.estimate_crop_profitability(crop_data)
        
        return ProfitEstimationResponse(**result)
        
    except Exception as e:
        logger.error(f"Error in profit estimation: {e}")
        raise HTTPException(status_code=500, detail=f"Profit estimation failed: {str(e)}")

@app.post("/compare-crops", response_model=CropComparisonResponse)
async def compare_crops(request: CropComparisonRequest):
    """
    Compare profitability of multiple crops
    
    Analyzes and ranks multiple crops by different criteria including ROI,
    net profit, risk levels, and market potential. Provides portfolio
    diversification recommendations.
    """
    try:
        logger.info(f"Processing crop comparison for {len(request.crops_data)} crops")
        
        # Convert request data
        crops_data = [crop.dict() for crop in request.crops_data]
        
        # Perform comparison
        result = profit_estimator.compare_crop_profitability(crops_data)
        
        return CropComparisonResponse(**result)
        
    except Exception as e:
        logger.error(f"Error in crop comparison: {e}")
        raise HTTPException(status_code=500, detail=f"Crop comparison failed: {str(e)}")

@app.get("/supported-crops")
async def get_supported_crops():
    """Get list of all supported crops with basic information"""
    try:
        crops = []
        for crop_name, crop_info in crop_recommender.crop_database.items():
            crops.append({
                "name": crop_name,
                "name_ar": crop_info["name_ar"],
                "category": crop_info["category"],
                "growing_season": crop_info["optimal_conditions"]["growing_season"],
                "optimal_temperature_range": crop_info["optimal_conditions"]["temperature_range"],
                "optimal_rainfall_range": crop_info["optimal_conditions"]["rainfall_range"],
                "suitable_soil_types": crop_info["optimal_conditions"]["soil_types"]
            })
        
        return {
            "status": "success",
            "supported_crops": crops,
            "total_count": len(crops)
        }
    except Exception as e:
        logger.error(f"Error getting supported crops: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/crop-details/{crop_name}")
async def get_crop_details(crop_name: str):
    """Get detailed information about a specific crop"""
    try:
        if crop_name not in crop_recommender.crop_database:
            raise HTTPException(status_code=404, detail=f"Crop {crop_name} not found")
        
        crop_info = crop_recommender.crop_database[crop_name]
        
        return {
            "status": "success",
            "crop_details": {
                "name": crop_name,
                "name_ar": crop_info["name_ar"],
                "category": crop_info["category"],
                "optimal_conditions": crop_info["optimal_conditions"],
                "economic_data": crop_info["economic_data"],
                "cultivation_info": crop_info["cultivation_info"],
                "risk_factors": crop_info["risk_factors"]
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting crop details: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/market-data/{crop_name}")
async def get_market_data(crop_name: str):
    """Get market data and price information for a specific crop"""
    try:
        if crop_name not in profit_estimator.market_data:
            raise HTTPException(status_code=404, detail=f"Market data for {crop_name} not found")
        
        market_info = profit_estimator.market_data[crop_name]
        
        return {
            "status": "success",
            "market_data": {
                "crop_name": crop_name,
                "name_ar": market_info["name_ar"],
                "base_price_per_kg": market_info["base_price_per_kg"],
                "price_volatility": market_info["price_volatility"],
                "seasonal_factors": market_info["seasonal_factors"],
                "demand_trend": market_info["demand_trend"],
                "export_potential": market_info["export_potential"]
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting market data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/quick-recommendation")
async def quick_recommendation(
    temperature: float,
    rainfall: float,
    soil_ph: float,
    farm_size: float = 2.0
):
    """
    Quick crop recommendation with minimal input parameters
    
    Simplified endpoint for basic crop recommendations with essential parameters only.
    """
    try:
        # Create simplified input data
        input_data = {
            'temperature': temperature,
            'annual_rainfall': rainfall,
            'soil_ph': soil_ph,
            'farm_size': farm_size,
            'soil_quality_score': 0.7,
            'water_availability': 0.8,
            'farmer_experience_years': 5,
            'available_capital': 10000,
            'risk_tolerance': 0.5
        }
        
        result = crop_recommender.recommend_crops(input_data)
        
        # Return simplified response
        top_3_crops = result['recommendations'][:3]
        simplified_crops = []
        
        for crop in top_3_crops:
            simplified_crops.append({
                'crop_name': crop['crop'],
                'crop_name_ar': crop['name_ar'],
                'suitability_score': crop['suitability_score'],
                'expected_profit_per_hectare': crop['profit_analysis']['profit_per_hectare'],
                'risk_level': crop['risk_assessment']['overall_risk']['level'],
                'growing_season': crop['growing_season']
            })
        
        return {
            "status": "success",
            "quick_recommendations": simplified_crops,
            "best_crop": simplified_crops[0] if simplified_crops else None
        }
        
    except Exception as e:
        logger.error(f"Error in quick recommendation: {e}")
        raise HTTPException(status_code=500, detail=f"Quick recommendation failed: {str(e)}")

# Error handlers
@app.exception_handler(ValueError)
async def value_error_handler(request, exc):
    return {"status": "error", "message": str(exc)}

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}")
    return {"status": "error", "message": "Internal server error"}
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8002))  # Render يعطي PORT
    uvicorn.run("soil_analysis.main:app", host="0.0.0.0", port=port)
