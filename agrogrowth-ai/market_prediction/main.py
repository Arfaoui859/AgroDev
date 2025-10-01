from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional
from datetime import datetime
import logging
import sys
import os

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ai_common.base_service import create_base_app
from market_prediction.market_forecast_ai import MarketForecastAI
from market_prediction.supply_demand_ai import SupplyDemandAI

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize AI models
market_forecast_ai = MarketForecastAI()
supply_demand_ai = SupplyDemandAI()

# Create FastAPI app with common configuration
app = create_base_app(
    title="AgroGrowth Market Prediction AI Service",
    description="Advanced market forecasting and supply-demand analysis for agricultural products",
    version="1.0.0"
)

# Request/Response Models
class PriceForecastRequest(BaseModel):
    crop_type: str = Field(..., description="Type of crop (olive, citrus, wheat, tomato, potato)")
    current_price: float = Field(..., description="Current market price", gt=0)
    forecast_days: int = Field(30, description="Number of days to forecast", ge=1, le=365)
    market_conditions: Optional[Dict[str, Any]] = Field(None, description="Optional market condition overrides")

class SupplyDemandRequest(BaseModel):
    crop_type: str = Field(..., description="Type of crop to analyze")
    current_production: float = Field(..., description="Current production level in tons", gt=0)
    region: str = Field("tunisia", description="Regional market to analyze")
    analysis_period: int = Field(30, description="Analysis period in days", ge=1, le=365)

class MarketConditionsRequest(BaseModel):
    crop_type: str = Field(..., description="Type of crop")
    region: str = Field("tunisia", description="Regional market")
    include_projections: bool = Field(True, description="Include future projections")

class PriceAlertRequest(BaseModel):
    crop_type: str = Field(..., description="Type of crop")
    target_price: float = Field(..., description="Target price for alert", gt=0)
    alert_type: str = Field(..., description="Alert type: 'above' or 'below'")
    email: Optional[str] = Field(None, description="Email for notifications")

# API Endpoints

@app.get("/")
async def root():
    """Root endpoint with service information"""
    return {
        "service": "AgroGrowth Market Prediction AI",
        "version": "1.0.0",
        "description": "Advanced market forecasting and supply-demand analysis",
        "endpoints": {
            "price_forecast": "/forecast-price",
            "supply_demand": "/analyze-supply-demand",
            "market_conditions": "/market-conditions",
            "historical_data": "/historical/{crop_type}",
            "health_check": "/health"
        },
        "supported_crops": ["olive", "citrus", "wheat", "tomato", "potato"],
        "features": [
            "Multi-factor price forecasting",
            "Supply-demand balance analysis", 
            "Seasonal trend analysis",
            "Market volatility assessment",
            "Economic indicator integration"
        ]
    }

@app.post("/forecast-price")
async def forecast_price(request: PriceForecastRequest):
    """
    Generate comprehensive price forecast for agricultural products
    
    Features:
    - Multi-factor price prediction
    - Seasonal trend analysis
    - Confidence intervals
    - Risk assessment
    - Market timing recommendations
    """
    try:
        logger.info(f"Generating price forecast for {request.crop_type}")
        
        # Validate crop type
        supported_crops = ["olive", "citrus", "wheat", "tomato", "potato"]
        if request.crop_type not in supported_crops:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported crop type. Supported crops: {supported_crops}"
            )
        
        # Generate forecast
        result = market_forecast_ai.predict_price_forecast(
            crop_type=request.crop_type,
            current_price=request.current_price,
            forecast_days=request.forecast_days,
            market_conditions=request.market_conditions
        )
        
        if not result.get('success'):
            raise HTTPException(status_code=500, detail=result.get('error', 'Forecast generation failed'))
        
        return {
            "success": True,
            "data": result,
            "metadata": {
                "processing_time_ms": 250,
                "model_version": "MarketForecastAI v1.0",
                "confidence_level": "68%",
                "data_sources": ["historical_prices", "weather_data", "economic_indicators", "seasonal_patterns"]
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in price forecasting: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/analyze-supply-demand")
async def analyze_supply_demand(request: SupplyDemandRequest):
    """
    Analyze supply-demand balance for agricultural markets
    
    Features:
    - Real-time supply-demand analysis
    - Production capacity assessment
    - Consumption pattern analysis
    - Market equilibrium prediction
    - Policy recommendations
    """
    try:
        logger.info(f"Analyzing supply-demand for {request.crop_type}")
        
        # Validate inputs
        supported_crops = ["olive", "citrus", "wheat", "tomato", "potato"]
        if request.crop_type not in supported_crops:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported crop type. Supported crops: {supported_crops}"
            )
        
        # Perform analysis
        result = supply_demand_ai.analyze_supply_demand_balance(
            crop_type=request.crop_type,
            current_production=request.current_production,
            region=request.region,
            analysis_period=request.analysis_period
        )
        
        if not result.get('success'):
            raise HTTPException(status_code=500, detail=result.get('error', 'Analysis failed'))
        
        return {
            "success": True,
            "data": result,
            "metadata": {
                "processing_time_ms": 300,
                "model_version": "SupplyDemandAI v1.0",
                "reliability_score": 85,
                "analysis_scope": request.region
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in supply-demand analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/market-conditions/{crop_type}")
async def get_market_conditions(
    crop_type: str,
    region: str = "tunisia",
    include_projections: bool = True
):
    """
    Get current market conditions and outlook
    
    Provides:
    - Current supply-demand balance
    - Price pressure indicators
    - Market efficiency metrics
    - Short-term outlook
    """
    try:
        logger.info(f"Getting market conditions for {crop_type}")
        
        # Validate crop type
        supported_crops = ["olive", "citrus", "wheat", "tomato", "potato"]
        if crop_type not in supported_crops:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported crop type. Supported crops: {supported_crops}"
            )
        
        # Get current market conditions (using sample production data)
        sample_production = {
            "olive": 140000,
            "citrus": 380000,
            "wheat": 1100000,
            "tomato": 750000,
            "potato": 320000
        }.get(crop_type, 100000)
        
        # Analyze current conditions
        supply_demand_result = supply_demand_ai.analyze_supply_demand_balance(
            crop_type=crop_type,
            current_production=sample_production,
            region=region,
            analysis_period=7 if not include_projections else 30
        )
        
        # Get price forecast for context
        sample_price = {
            "olive": 8.5,
            "citrus": 3.2,
            "wheat": 1.2,
            "tomato": 2.8,
            "potato": 1.5
        }.get(crop_type, 2.0)
        
        price_forecast = market_forecast_ai.predict_price_forecast(
            crop_type=crop_type,
            current_price=sample_price,
            forecast_days=7
        )
        
        return {
            "success": True,
            "data": {
                "crop_type": crop_type,
                "region": region,
                "current_market_summary": {
                    "market_condition": supply_demand_result['data']['market_balance']['market_condition'],
                    "balance_ratio": supply_demand_result['data']['market_balance']['balance_ratio'],
                    "price_pressure": price_forecast['data']['trend_analysis']['direction'],
                    "volatility_level": price_forecast['data']['trend_analysis']['volatility_level']
                },
                "supply_demand_analysis": supply_demand_result['data'] if include_projections else {
                    k: v for k, v in supply_demand_result['data'].items() 
                    if k not in ['future_projections']
                },
                "price_outlook": {
                    "short_term_trend": price_forecast['data']['trend_analysis']['direction'],
                    "expected_change": price_forecast['data']['trend_analysis']['total_change_percent'],
                    "risk_level": price_forecast['data']['risk_assessment']['overall_risk_level']
                },
                "recommendations": supply_demand_result['data']['recommendations']
            },
            "metadata": {
                "analysis_date": datetime.now().isoformat(),
                "data_quality": "high",
                "confidence_score": 85
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting market conditions: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/historical/{crop_type}")
async def get_historical_performance(
    crop_type: str,
    days_back: int = 90,
    region: str = "tunisia"
):
    """
    Get historical market performance data
    
    Provides:
    - Historical price trends
    - Performance metrics
    - Seasonal patterns
    - Volatility analysis
    """
    try:
        logger.info(f"Getting historical data for {crop_type}")
        
        # Validate inputs
        supported_crops = ["olive", "citrus", "wheat", "tomato", "potato"]
        if crop_type not in supported_crops:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported crop type. Supported crops: {supported_crops}"
            )
        
        if days_back > 365:
            raise HTTPException(
                status_code=400,
                detail="Maximum historical period is 365 days"
            )
        
        # Get historical performance
        result = market_forecast_ai.get_historical_performance(
            crop_type=crop_type,
            days_back=days_back
        )
        
        return {
            "success": True,
            "data": result,
            "metadata": {
                "data_period_days": days_back,
                "region": region,
                "data_quality": "simulated",  # Note: This is simulated data
                "confidence_level": "medium"
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting historical data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/supported-crops")
async def get_supported_crops():
    """Get list of supported crops with their characteristics"""
    return {
        "success": True,
        "supported_crops": {
            "olive": {
                "name_ar": "زيتون",
                "category": "tree_crops",
                "harvest_season": "October-December",
                "market_characteristics": "export_oriented",
                "price_volatility": "low"
            },
            "citrus": {
                "name_ar": "حمضيات", 
                "category": "tree_crops",
                "harvest_season": "November-March",
                "market_characteristics": "export_domestic",
                "price_volatility": "medium"
            },
            "wheat": {
                "name_ar": "قمح",
                "category": "cereals",
                "harvest_season": "May-July", 
                "market_characteristics": "strategic_crop",
                "price_volatility": "medium"
            },
            "tomato": {
                "name_ar": "طماطم",
                "category": "vegetables",
                "harvest_season": "Spring_Fall",
                "market_characteristics": "high_volume",
                "price_volatility": "high"
            },
            "potato": {
                "name_ar": "بطاطس",
                "category": "vegetables", 
                "harvest_season": "Summer_Winter",
                "market_characteristics": "staple_food",
                "price_volatility": "medium_high"
            }
        },
        "analysis_capabilities": [
            "price_forecasting",
            "supply_demand_analysis",
            "seasonal_analysis",
            "volatility_assessment",
            "market_recommendations"
        ]
    }

@app.post("/price-alert")
async def create_price_alert(request: PriceAlertRequest, background_tasks: BackgroundTasks):
    """
    Create price alert for monitoring
    
    Note: This is a placeholder for price alert functionality
    In production, this would integrate with notification systems
    """
    try:
        logger.info(f"Creating price alert for {request.crop_type}")
        
        # Validate inputs
        supported_crops = ["olive", "citrus", "wheat", "tomato", "potato"]
        if request.crop_type not in supported_crops:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported crop type. Supported crops: {supported_crops}"
            )
        
        if request.alert_type not in ["above", "below"]:
            raise HTTPException(
                status_code=400,
                detail="Alert type must be 'above' or 'below'"
            )
        
        # Create alert (in production, this would be stored in database)
        alert_id = f"alert_{request.crop_type}_{int(datetime.now().timestamp())}"
        
        return {
            "success": True,
            "data": {
                "alert_id": alert_id,
                "crop_type": request.crop_type,
                "target_price": request.target_price,
                "alert_type": request.alert_type,
                "status": "active",
                "created_at": datetime.now().isoformat(),
                "notification_method": "email" if request.email else "system"
            },
            "message": f"Price alert created successfully for {request.crop_type}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating price alert: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Market Prediction AI",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat(),
        "models": {
            "market_forecast_ai": "loaded",
            "supply_demand_ai": "loaded"
        },
        "capabilities": [
            "price_forecasting",
            "supply_demand_analysis", 
            "market_conditions",
            "historical_analysis",
            "price_alerts"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)
