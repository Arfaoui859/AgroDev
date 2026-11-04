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
from ai_common.llm_provider import get_provider, LLMError
from ai_common.vision_bridge import diagnose_with_vision, merge_into_detection
from ai_common.offload import offload

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
    # Provenance: "vision-model" when a multimodal provider produced the
    # diagnosis, "heuristic" when only the built-in detector ran.
    data_source: Optional[str] = None
    is_real_data: Optional[bool] = None
    model_source: Optional[str] = None

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

@app.get("/supported-diseases")
async def supported_diseases():
    """Disease catalogue with Arabic names and treatments.

    The Node gateway exposes this list so the UI can render the set of diseases
    the diagnosis engine can report.
    """
    detector = await offload(get_disease_detector)
    db = getattr(detector, "disease_database", {}) or {}
    diseases = [
        {
            "id": key,
            "disease": key,
            "name_ar": info.get("name_ar"),
            "description": info.get("description"),
            "severity": info.get("severity"),
            "treatment": info.get("treatment", []),
            "prevention": info.get("prevention", []),
        }
        for key, info in db.items()
    ]
    return {
        "status": "success",
        "supported_diseases": diseases,
        "total_count": len(diseases),
        "model_source": "heuristic-demo",
    }


@app.get("/health")
async def health():
    provider = get_provider()
    configured = provider.is_configured()
    return {
        "status": "healthy",
        "models_loaded": {
            "disease_detector": disease_detector is not None,
            "leaf_scanner": leaf_scanner is not None
        },
        "note": "Models load only on first request (RAM optimized)",
        # When a vision provider is configured the diagnosis comes from it; the
        # heuristic detector remains the fallback. The declared source tells the
        # gateway probe which of the two produced a given result.
        "model_source": provider.model_source() if configured else "heuristic-demo",
        "vision_configured": configured,
        "disclaimer": (
            "Diagnosis is model-assisted and not a substitute for expert diagnosis."
            if configured
            else "Diagnosis is heuristic and demo-grade; not a substitute for expert diagnosis."
        ),
    }

# =========================================================
# BLOCKING WORK HELPERS
# =========================================================
# Model loading/inference and the vision HTTP call are synchronous and slow.
# The upload handlers must stay `async` (they await the upload read), so the
# blocking part is extracted here and run via `offload()` in the threadpool,
# keeping the event loop free to answer /health while a diagnosis is running.
def _run_disease_detection(image_data: bytes, content_type: str, plant_type: Optional[str]) -> Dict[str, Any]:
    detector = get_disease_detector()
    result = detector.detect_plant_disease(image_data, plant_type)

    vision = diagnose_with_vision(
        image_data,
        content_type,
        plant_type,
        getattr(detector, "disease_database", {}) or {},
    )
    if vision:
        result["disease_detection"] = merge_into_detection(
            result.get("disease_detection", {}), vision
        )
        result["data_source"] = "vision-model"
        result["is_real_data"] = True
        result["model_source"] = vision.get("model_source")
    else:
        result["data_source"] = "heuristic"
        result["is_real_data"] = False
        result["model_source"] = "heuristic-demo"
    return result


def _run_leaf_analysis(image_data: bytes, plant_type: Optional[str], growth_stage: Optional[str]) -> Dict[str, Any]:
    scanner = get_leaf_scanner()
    return scanner.analyze_leaf_comprehensive(image_data, plant_type, growth_stage)


def _run_quick_health_check(image_data: bytes) -> Dict[str, Any]:
    detector = get_disease_detector()
    scanner = get_leaf_scanner()

    disease_result = detector.detect_plant_disease(image_data)
    leaf_result = scanner.analyze_leaf_comprehensive(image_data)

    health_score = disease_result["health_score"]["health_score"]
    return {
        "status": "success",
        "health_score": float(health_score),
        "primary_disease": disease_result["disease_detection"]["primary_disease"]["disease_name_ar"],
        "nutrition_status": leaf_result["leaf_nutrition"]["primary_deficiency"]["name_ar"],
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

        # Model load/inference and the vision call run in the threadpool.
        result = await offload(
            _run_disease_detection, image_data, file.content_type, plant_type
        )

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

        result = await offload(
            _run_leaf_analysis, image_data, plant_type, growth_stage
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

        # Lazy loading and both inferences happen in the threadpool.
        return await offload(_run_quick_health_check, image_data)

    except Exception as e:
        logger.error(f"Quick check error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =========================================================
# 🚀 RENDER PORT FIX (VERY IMPORTANT)
# =========================================================
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8003))  # Render uses PORT env
    uvicorn.run(app, host="0.0.0.0", port=port)
