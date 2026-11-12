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
    
    def __init__(self, service_name: str, description: str = "",
                 include_health_route: bool = True):
        self.service_name = service_name
        self.description = description
        self.app = self._create_app()
        # A service that defines its own /health (with model provenance, model
        # status, capabilities) must set include_health_route=False. Otherwise
        # this base route is registered first and, because FastAPI resolves the
        # first matching route, the richer service handler becomes dead code.
        self.include_health_route = include_health_route
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

        if self.include_health_route:

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

        register_readiness_route(self.app, self.service_name)
    
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

def register_service_probes(app: FastAPI, service_name: str) -> None:
    """Register lightweight operational probes on a FastAPI app.

    `/health` performs a deep check (it reports model provenance and, for some
    services, model load state). These probes answer narrower operational
    questions without touching a model artifact:

    * `GET /ready`   -- is this process up and able to accept traffic?
    * `GET /metrics` -- real process-level counters (uptime, request count,
      resident memory). These are measured, not synthesised.
    """
    import os
    from datetime import datetime

    started_at = datetime.now()
    counters = {"requests": 0}

    @app.middleware("http")
    async def _count_requests(request, call_next):
        counters["requests"] += 1
        return await call_next(request)

    @app.get("/ready")
    async def readiness_check():
        return {
            "status": "ready",
            "ready": True,
            "service": service_name,
            "timestamp": datetime.now().isoformat(),
        }

    @app.get("/metrics")
    async def metrics():
        uptime_seconds = (datetime.now() - started_at).total_seconds()
        resident_bytes = None
        try:
            import resource

            resident_bytes = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss * 1024
        except Exception:  # pragma: no cover - platform dependent
            resident_bytes = None
        return {
            "service": service_name,
            "pid": os.getpid(),
            "uptime_seconds": round(uptime_seconds, 3),
            "requests_total": counters["requests"],
            "resident_memory_bytes": resident_bytes,
            "timestamp": datetime.now().isoformat(),
        }

# Backwards-compatible alias: the readiness probe was the first one added.
register_readiness_route = register_service_probes

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
