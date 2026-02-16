"""
FastAPI service for Image Diagnosis AI
Memory-optimized version for Render (512MB RAM)
Lazy loading AI models to avoid Out Of Memory crash
"""

from fastapi import FastAPI, HTTPException, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Any, Optional
import logging
import sys
import os
import uvicorn

# 🔥 IMPORTANT: Reduce TensorFlow memory usage (CRITICAL for Render)
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from image_diagnosis.plant_disease_detector import create_plant_disease_detector
from image_diagnosis.leaf_scan_ai import create_leaf_scan_ai

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# =========================================================
# 🧠 LAZY LOADING MODELS (FIX OUT OF MEMORY)
# =========================================================
disease_detector = None
leaf_scanner = None

def get_disease_detector():
    global disease_detector
    if disease_detector is None:
        logger.info("🚀 Loading Plant Disease Model (Lazy Load)...")
        disease_detector = create_plant_disease_detector()
        logger.info("✅ Disease Model Loaded")
    return disease_detector

def get_leaf_scanner():
    global leaf_scanner
    if leaf_scanner is None:
        logger.info("🚀 Loading Leaf Scanner Model (Lazy Load)...")
        leaf_scanner = create_leaf_scan_ai()
        logger.info("✅ Leaf Scanner Model Loaded")
    return leaf_scanner

# =========================================================
# Pydantic Models
# =========================================================
class PlantDiseaseResponse(BaseModel):
    disease_detection: Dict[str, Any]
    severity_assessment: Dict[str, Any]
    health_score: Dict[str, Any]
    affected_areas: Dict[str, Any]
    image_features: Dict[str, Any]
    treatment_plan: Dict[str, Any]
    risk_assessment: Dict[str, Any]
    environmental_analysis: Dict[str, Any]
    monitoring_recommendations: List[str]
    analysis_timestamp: str

class LeafAnalysisResponse(BaseModel):
    leaf_nutrition: Dict[str, Any]
    growth_assessment: Dict[str, Any]
    health_evaluation: Dict[str, Any]
    morphology_analysis: Dict[str, Any]
    stress_analysis: Dict[str, Any]
    maturity_analysis: Dict[str, Any]
    photosynthesis_analysis: Dict[str, Any]
    leaf_features: Dict[str, Any]
    care_recommendations: List[str]
    overall_leaf_score: Dict[str, Any]
    analysis_timestamp: str

# =========================================================
# FastAPI App
# =========================================================
app = FastAPI(
    title="AgroGrowth Image Diagnosis AI",
    description="AI-powered plant disease detection and leaf analysis",
    version="1.0.0"
)

# CORS (important for Vercel frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================================================
# HEALTH & ROOT
# =========================================================
@app.get("/")
async def root():
    return {
        "service": "AgroGrowth Image Diagnosis AI",
        "status": "running",
        "memory_mode": "lazy_loading_enabled",
        "endpoints": {
            "health": "/health",
            "detect_disease": "/detect-disease",
            "analyze_leaf": "/analyze-leaf"
        }
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "models_loaded": {
            "disease_detector": disease_detector is not None,
            "leaf_scanner": leaf_scanner is not None
        },
        "note": "Models load only on first request (RAM optimized)"
    }

# =========================================================
# AI ENDPOINTS (MEMORY SAFE)
# =========================================================
@app.post("/detect-disease", response_model=PlantDiseaseResponse)
async def detect_plant_disease(
    file: UploadFile = File(...),
    plant_type: Optional[str] = Form(None)
):
    try:
        logger.info(f"Processing disease detection: {file.filename}")

        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")

        image_data = await file.read()

        # 🔥 Lazy load model (CRITICAL FIX)
        detector = get_disease_detector()

        result = detector.detect_plant_disease(image_data, plant_type)
        return PlantDiseaseResponse(**result)

    except Exception as e:
        logger.error(f"Disease detection error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/analyze-leaf", response_model=LeafAnalysisResponse)
async def analyze_leaf(
    file: UploadFile = File(...),
    plant_type: Optional[str] = Form(None),
    growth_stage: Optional[str] = Form(None)
):
    try:
        logger.info(f"Processing leaf analysis: {file.filename}")

        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")

        image_data = await file.read()

        # 🔥 Lazy load model (CRITICAL FIX)
        scanner = get_leaf_scanner()

        result = scanner.analyze_leaf_comprehensive(
            image_data,
            plant_type,
            growth_stage
        )

        return LeafAnalysisResponse(**result)

    except Exception as e:
        logger.error(f"Leaf analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/quick-health-check")
async def quick_health_check(file: UploadFile = File(...)):
    try:
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")

        image_data = await file.read()

        # Lazy loading both models only when needed
        detector = get_disease_detector()
        scanner = get_leaf_scanner()

        disease_result = detector.detect_plant_disease(image_data)
        leaf_result = scanner.analyze_leaf_comprehensive(image_data)

        health_score = disease_result["health_score"]["health_score"]

        return {
            "status": "success",
            "health_score": float(health_score),
            "primary_disease": disease_result["disease_detection"]["primary_disease"]["disease_name_ar"],
            "nutrition_status": leaf_result["leaf_nutrition"]["primary_deficiency"]["name_ar"]
        }

    except Exception as e:
        logger.error(f"Quick check error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =========================================================
# 🚀 RENDER PORT FIX (VERY IMPORTANT)
# =========================================================
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))  # Render uses PORT env
    uvicorn.run(app, host="0.0.0.0", port=port)
