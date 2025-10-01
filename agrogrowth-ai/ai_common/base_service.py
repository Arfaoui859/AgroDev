"""
Base FastAPI service template for AgroGrowth AI microservices
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
import logging
import uvicorn
from datetime import datetime
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class HealthResponse(BaseModel):
    status: str
    service: str
    timestamp: str
    version: str = "1.0.0"

class PredictionRequest(BaseModel):
    data: Dict[str, Any]
    metadata: Optional[Dict[str, Any]] = None

class PredictionResponse(BaseModel):
    prediction: Any
    confidence: float
    timestamp: str
    status: str
    metadata: Optional[Dict[str, Any]] = None

class ErrorResponse(BaseModel):
    status: str
    error_code: str
    error_message: str
    timestamp: str

class BaseAIService:
    """Base class for AI microservices"""
    
    def __init__(self, service_name: str, description: str = ""):
        self.service_name = service_name
        self.description = description
        self.app = self._create_app()
        self._setup_routes()
    
    def _create_app(self) -> FastAPI:
        """Create FastAPI application instance"""
        app = FastAPI(
            title=f"AgroGrowth {self.service_name}",
            description=self.description,
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
        
        return app
    
    def _setup_routes(self):
        """Setup common routes"""
        
        @self.app.get("/health", response_model=HealthResponse)
        async def health_check():
            """Health check endpoint"""
            return HealthResponse(
                status="healthy",
                service=self.service_name,
                timestamp=datetime.now().isoformat()
            )
        
        @self.app.get("/")
        async def root():
            """Root endpoint"""
            return {
                "service": self.service_name,
                "status": "running",
                "docs": "/docs",
                "health": "/health"
            }
    
    def add_prediction_endpoint(self, path: str, handler: callable, 
                              request_model: BaseModel = PredictionRequest,
                              response_model: BaseModel = PredictionResponse):
        """Add a prediction endpoint"""
        
        @self.app.post(path, response_model=response_model)
        async def prediction_endpoint(request: request_model):
            try:
                result = await handler(request) if asyncio.iscoroutinefunction(handler) else handler(request)
                return result
            except Exception as e:
                logger.error(f"Prediction error in {path}: {e}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Prediction failed: {str(e)}"
                )
    
    def run(self, host: str = "0.0.0.0", port: int = 8000, **kwargs):
        """Run the service"""
        logger.info(f"Starting {self.service_name} on {host}:{port}")
        uvicorn.run(self.app, host=host, port=port, **kwargs)

import asyncio

# Utility decorators
def log_prediction(func):
    """Decorator to log predictions"""
    def wrapper(*args, **kwargs):
        start_time = datetime.now()
        try:
            result = func(*args, **kwargs)
            duration = (datetime.now() - start_time).total_seconds()
            logger.info(f"Prediction completed in {duration:.2f}s")
            return result
        except Exception as e:
            duration = (datetime.now() - start_time).total_seconds()
            logger.error(f"Prediction failed after {duration:.2f}s: {e}")
            raise
    return wrapper

def validate_input(required_fields: List[str]):
    """Decorator to validate input data"""
    def decorator(func):
        def wrapper(request, *args, **kwargs):
            data = request.data if hasattr(request, 'data') else request
            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                raise HTTPException(
                    status_code=400,
                    detail=f"Missing required fields: {missing_fields}"
                )
            return func(request, *args, **kwargs)
        return wrapper
    return decorator
