from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional
from datetime import datetime
import logging
import sys
import os
import uvicorn

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ai_common.base_service import BaseAIService
from market_prediction.market_forecast_ai import MarketForecastAI
from market_prediction.supply_demand_ai import SupplyDemandAI
from ai_common.llm_provider import get_provider
from ai_common.advisory import narrate

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize AI models
market_forecast_ai = MarketForecastAI()
supply_demand_ai = SupplyDemandAI()

# Create FastAPI app with common configuration
service = BaseAIService(
    service_name="Market Prediction",
    description="AI market prediction service",
    # This service defines its own /health with model provenance below.
    include_health_route=False,
)

app = service.app

# Request/Response Models
class PriceForecastRequest(BaseModel):
    crop_type: str = Field(..., description="Type of crop (olive, citrus, wheat, tomato, potato)")
    current_price: float = Field(..., description="Current market price", gt=0)
    forecast_days: int = Field(30, description="Number of days to forecast", ge=1, le=365)
    market_conditions: Optional[Dict[str, Any]] = Field(None, description="Optional market condition overrides")
    language: Optional[str] = Field(None, description="Advisory language: ar, ar-tn, fr or en")

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
    raise HTTPException(
        status_code=503,
        detail={
            "code": "LIVE_MARKET_FEED_NOT_CONFIGURED",
            "message": "No licensed, timestamped market-price feed is configured. Synthetic forecasts are disabled.",
            "production_ready": False,
        },
    )

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
    raise HTTPException(
        status_code=503,
        detail={
            "code": "VERIFIED_MARKET_DATA_NOT_CONFIGURED",
            "message": "Verified regional production and consumption data are not configured. Synthetic analysis is disabled.",
            "production_ready": False,
        },
    )

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
    raise HTTPException(
        status_code=503,
        detail={
            "code": "VERIFIED_MARKET_DATA_NOT_CONFIGURED",
            "message": "Current market conditions cannot be reported without verified market data.",
            "production_ready": False,
        },
    )

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
    raise HTTPException(
        status_code=503,
        detail={
            "code": "HISTORICAL_MARKET_DATA_NOT_CONFIGURED",
            "message": "No verified historical market-price series is configured.",
            "production_ready": False,
        },
    )

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
    raise HTTPException(
        status_code=503,
        detail={
            "code": "PRICE_ALERTS_NOT_IMPLEMENTED",
            "message": "Price alerts are not connected to persistent storage and a notification provider.",
            "production_ready": False,
        },
    )

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "degraded",
        "production_ready": False,
        "disabled_features": [
            "price_forecast",
            "supply_demand_analysis",
            "market_conditions",
            "historical_prices",
            "price_alerts",
        ],
        "service": "Market Prediction AI",
        "version": "1.0.0",
        # No licensed market feed is configured; forecasts come from a synthetic
        # model seeded on representative base prices, never from live quotes.
        "model_source": "synthetic-demo",
        "advisory_model_source": get_provider().model_source()
        if get_provider().is_configured()
        else None,
        "advisory_configured": get_provider().is_configured(),
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
    port = int(os.environ.get("PORT", 8004))  # Render يعطي PORT
    uvicorn.run("market_prediction.main:app", host="0.0.0.0", port=port)
