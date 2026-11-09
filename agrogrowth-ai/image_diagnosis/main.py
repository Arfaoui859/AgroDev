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
import io
import uvicorn
from PIL import Image, UnidentifiedImageError

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

# Safe provenance when the trained ONNX artifact/runtime cannot be loaded.
DEFAULT_DISEASE_MODEL_SOURCE = "heuristic-demo"

MAX_UPLOAD_SIZE = int(os.getenv("MAX_UPLOAD_SIZE", str(10 * 1024 * 1024)))
if MAX_UPLOAD_SIZE <= 0:
    raise RuntimeError("MAX_UPLOAD_SIZE must be a positive integer")

ALLOWED_IMAGE_FORMATS = {"JPEG", "PNG", "WEBP"}
IMAGE_MIME_TYPES = {
    "JPEG": "image/jpeg",
    "PNG": "image/png",
    "WEBP": "image/webp",
}


async def _read_validated_image(file: UploadFile):
    """Read a bounded upload and validate its actual image content."""
    # Read at most one byte beyond the limit so oversized uploads are rejected.
    image_data = await file.read(MAX_UPLOAD_SIZE + 1)

    if len(image_data) > MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"Image exceeds the {MAX_UPLOAD_SIZE // (1024 * 1024)} MB upload limit",
        )

    if not image_data:
        raise HTTPException(status_code=400, detail="Uploaded image is empty")

    try:
        with Image.open(io.BytesIO(image_data)) as image:
            image_format = image.format
            width, height = image.size

            if image_format not in ALLOWED_IMAGE_FORMATS:
                raise HTTPException(
                    status_code=400,
                    detail="Unsupported image format. Use JPEG, PNG, or WEBP.",
                )

            if width <= 0 or height <= 0 or width * height > 40_000_000:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid image dimensions or image is too large to process",
                )

            image.verify()

    except HTTPException:
        raise
    except (UnidentifiedImageError, OSError, ValueError, Image.DecompressionBombError):
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is not a valid image",
        )

    return image_data, IMAGE_MIME_TYPES[image_format]

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
    data_source: Optional[str] = "heuristic"
    is_real_data: Optional[bool] = False
    model_source: Optional[str] = "heuristic-demo"
# =========================================================
# FastAPI App
# =========================================================
app = FastAPI(
    title="AgroGrowth Image Diagnosis AI",
    description="AI-powered plant disease detection and leaf analysis",
    version="1.0.0"
)

# CORS: set IMAGE_DIAGNOSIS_CORS_ORIGINS to comma-separated frontend origins.
# Wildcard remains the default for backward compatibility; credentials are disabled.
cors_origins = [
    origin.strip()
    for origin in os.getenv("IMAGE_DIAGNOSIS_CORS_ORIGINS", "*").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
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
    classifier = getattr(detector, "ml_classifier", None)
    inference_mode = getattr(detector, "inference_mode", "heuristic")
    model_source = (
        getattr(classifier, "MODEL_SOURCE", DEFAULT_DISEASE_MODEL_SOURCE)
        if classifier is not None else DEFAULT_DISEASE_MODEL_SOURCE
    )
    model_classes = []
    if classifier is not None:
        model_classes = [
            {
                "index": int(index),
                "class_name": class_name,
                "crop": class_name.split("___", 1)[0],
                "condition": (
                    class_name.split("___", 1)[1]
                    if "___" in class_name else class_name
                ),
            }
            for index, class_name in sorted(
                classifier.idx_to_class.items(), key=lambda item: item[0]
            )
        ]

    return {
        "status": "success",
        "supported_diseases": diseases,
        "total_count": len(diseases),
        "model_classes": model_classes,
        "model_class_count": len(model_classes),
        "model_source": model_source,
        "inference_mode": inference_mode,
        "classifier_loaded": classifier is not None,
    }


@app.get("/health")
async def health():
    provider = get_provider()
    configured = provider.is_configured()

    # The disease classifier is small enough for CPU inference. Load it during
    # the health probe so Render and the Node gateway report the engine that
    # is actually available, rather than the old hard-coded heuristic default.
    detector = await offload(get_disease_detector)
    classifier = getattr(detector, "ml_classifier", None)
    inference_mode = getattr(detector, "inference_mode", "heuristic")
    model_source = (
        getattr(classifier, "MODEL_SOURCE", DEFAULT_DISEASE_MODEL_SOURCE)
        if classifier is not None else "heuristic-demo"
    )

    return {
        "status": "healthy" if classifier is not None else "degraded",
        "production_ready": classifier is not None,
        "disabled_features": [] if classifier is not None else ["disease_classification"],
        "models_loaded": {
            "disease_detector": True,
            "leaf_scanner": leaf_scanner is not None,
        },
        "note": "Disease classifier is initialized by the health probe; leaf analysis remains lazy-loaded.",
        "model_source": model_source,
        "disease_detector_inference_mode": inference_mode,
        "disease_classifier_loaded": classifier is not None,
        "disease_classifier_source": (
            getattr(classifier, "MODEL_SOURCE", None)
            if classifier is not None else None
        ),
        "vision_provider_configured": configured,
        # Kept for backward compatibility. Configuration does not prove usage.
        "vision_configured": configured,
        "disclaimer": (
            "A trained PlantVillage ONNX classifier is required for disease classification. "
            "Heuristic-only image results are disabled as diagnoses. Leaf and quick health "
            "checks remain heuristic. No Tunisia field validation is implied."
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
    classifier = getattr(detector, "ml_classifier", None)
    if classifier is None:
        raise HTTPException(
            status_code=503,
            detail={
                "code": "DISEASE_CLASSIFIER_NOT_LOADED",
                "message": "A trained ONNX disease classifier is not loaded. Heuristic image outputs are not returned as AI diagnoses.",
                "production_ready": False,
            },
        )
    result = detector.detect_plant_disease(image_data, plant_type)

    detection = result.get("disease_detection", {})
    detection_source = detection.get("data_source", "heuristic")
    detection_model = detection.get("model_source", "heuristic-demo")

    vision = diagnose_with_vision(
        image_data,
        content_type,
        plant_type,
        getattr(detector, "disease_database", {}) or {},
    )

    if vision:
        result["disease_detection"] = merge_into_detection(
            detection, vision
        )
        result["data_source"] = (
            f"vision-model+{detection_source}"
            if detection_source != "heuristic"
            else "vision-model"
        )
        result["model_source"] = (
            f"{vision.get('model_source', 'vision-provider')}+{detection_model}"
            if detection_source != "heuristic"
            else vision.get("model_source", "vision-provider")
        )
        result["is_real_data"] = True
    else:
        result["data_source"] = detection_source
        result["model_source"] = detection_model
        result["is_real_data"] = detection_source == "trained-ml"

    return result


def _run_leaf_analysis(
    image_data: bytes,
    plant_type: Optional[str],
    growth_stage: Optional[str],
) -> Dict[str, Any]:
    scanner = get_leaf_scanner()
    result = scanner.analyze_leaf_comprehensive(
        image_data, plant_type, growth_stage
    )

    result["data_source"] = "heuristic"
    result["is_real_data"] = False
    result["model_source"] = "heuristic-demo"

    return result
def _run_quick_health_check(image_data: bytes) -> Dict[str, Any]:
    detector = get_disease_detector()
    scanner = get_leaf_scanner()

    disease_result = detector.detect_plant_disease(image_data)
    leaf_result = scanner.analyze_leaf_comprehensive(image_data)

    detection = disease_result.get("disease_detection", {})
    disease_source = detection.get("data_source", "heuristic")
    disease_model = detection.get("model_source", "feature-based-heuristics")
    uses_trained_model = disease_source == "trained-ml"

    return {
        "status": "success",
        "health_score": float(disease_result["health_score"]["health_score"]),
        "primary_disease": detection.get("primary_disease", {}).get(
            "disease_name_ar", "غير محدد"
        ),
        "nutrition_status": leaf_result["leaf_nutrition"]["primary_deficiency"]["name_ar"],
        "data_source": "mixed" if uses_trained_model else "heuristic",
        "is_real_data": False,
        "model_source": f"{disease_model}+leaf-feature-heuristics",
        "component_sources": {
            "disease_detection": disease_source,
            "leaf_nutrition": "heuristic",
            "health_score": "deterministic-aggregation",
        },
        "disclaimer": (
            "Disease classification may use a trained PlantVillage model. "
            "Leaf nutrition and the combined health score are heuristic, "
            "not laboratory measurements or field-validated results."
        ),
    }


def _run_comprehensive_analysis(
    image_data: bytes,
    plant_type: Optional[str],
    growth_stage: Optional[str],
) -> Dict[str, Any]:
    """Combine existing heuristic disease and leaf analyses.

    This is a deterministic aggregation, not a trained ML model.
    """

    detector = get_disease_detector()
    scanner = get_leaf_scanner()

    disease = detector.detect_plant_disease(image_data, plant_type)

    # Reject images with virtually no visible structure.
    # This is a visual-evidence quality gate, NOT a plant classifier.
    image_features = disease.get("image_features", {})
    texture_contrast = image_features.get("texture_contrast")
    edge_density = image_features.get("edge_density")

    if (
        isinstance(texture_contrast, (int, float))
        and isinstance(edge_density, (int, float))
        and texture_contrast < 1.0
        and edge_density < 0.0005
    ):
        return {
            "status": "insufficient_visual_evidence",
            "image_suitability": {
                "status": "insufficient_visual_detail",
                "reason": (
                    "The image contains too little visible texture or edge "
                    "detail for a responsible visual assessment."
                ),
                "message_ar": (
                    "الصورة ما فيهاش تفاصيل بصرية كافية للتحليل. "
                    "صوّر ورقة نبات حقيقية بوضوح وإضاءة جيدة."
                ),
                "retake_required": True,
            },
            "overall_plant_health": None,
            "combined_assessment": None,
            "unified_recommendations": [],
            "disease_analysis": None,
            "leaf_analysis": None,
            "nutrition_health_available": False,
            "data_source": "heuristic",
            "is_real_data": False,
            "model_source": "heuristic-demo",
            "disclaimer": (
                "No diagnosis or health score was produced because "
                "the image did not contain sufficient visual detail."
            ),
        }

    leaf = scanner.analyze_leaf_comprehensive(
        image_data, plant_type, growth_stage
    )

    disease_health = float(disease["health_score"]["health_score"])
    leaf_health = float(leaf["overall_leaf_score"]["overall_score"])
    nutrition_health = float(
        leaf["leaf_nutrition"]["nutritional_health_score"]
    )

    scores = (disease_health, leaf_health, nutrition_health)
    if not all(0.0 <= score <= 100.0 for score in scores):
        raise ValueError("Analysis returned a score outside the 0-100 range")

    # Nutrition is already included in overall_leaf_score.
    # Average disease and leaf health to avoid double-counting nutrition.
    overall_score = (disease_health + leaf_health) / 2.0

    if overall_score >= 85:
        health_assessment = "الحالة العامة جيدة جداً"
    elif overall_score >= 70:
        health_assessment = "الحالة العامة جيدة مع ضرورة المتابعة"
    elif overall_score >= 50:
        health_assessment = "الحالة متوسطة وتحتاج إلى تحسين"
    elif overall_score >= 30:
        health_assessment = "الحالة ضعيفة وتحتاج إلى تدخل"
    else:
        health_assessment = "الحالة حرجة وتحتاج إلى تقييم مختص"

    severity = disease.get("severity_assessment", {})
    severity_level = severity.get("severity_level", "unknown")

    primary_disease = disease.get("disease_detection", {}).get(
        "primary_disease", {}
    )
    disease_name = (
        primary_disease.get("disease_name_ar")
        or primary_disease.get("disease")
        or "غير محدد"
    )

    nutrition_available = leaf.get("leaf_nutrition", {}).get(
        "nutrition_status_available", True
    )

    primary_deficiency = leaf.get("leaf_nutrition", {}).get(
        "primary_deficiency", {}
    )
    deficiency_name = primary_deficiency.get("name_ar", "غير محدد")
    deficiency_type = primary_deficiency.get("type", "unknown")

    concerns = []

    if severity_level not in ("none", "low", "unknown"):
        concerns.append(
            f"مؤشرات ضرر أو مرض بصري: {disease_name} "
            f"(مستوى الشدة: {severity_level})"
        )

    if nutrition_available and deficiency_type != "healthy_nutrition":
        concerns.append(
            f"مؤشرات بصرية لاحتمال نقص غذائي: {deficiency_name}. "
            "يلزم التحقق بتحليل مخبري قبل اتخاذ قرار التسميد."
        )

    if overall_score < 70:
        concerns.append(health_assessment)

    treatment = disease.get("treatment_plan", {})
    recommendations = []

    for key in (
        "immediate_treatment",
        "prevention_measures",
        "general_care",
    ):
        values = treatment.get(key, [])
        if isinstance(values, list):
            recommendations.extend(
                item for item in values if isinstance(item, str) and item.strip()
            )

    leaf_recommendations = leaf.get("care_recommendations", [])
    if isinstance(leaf_recommendations, list):
        recommendations.extend(
            item for item in leaf_recommendations
            if isinstance(item, str) and item.strip()
        )

    # Preserve order while removing duplicates.
    recommendations = list(dict.fromkeys(recommendations))

    if severity_level in ("high", "very_high"):
        monitoring = {
            "immediate": "فحص النبات والتواصل مع مختص زراعي في أقرب وقت",
            "short_term": "إعادة الفحص خلال 24 إلى 48 ساعة",
            "long_term": "متابعة منتظمة حسب توجيهات المختص",
        }
        action_priority = severity_level
    elif severity_level == "medium":
        monitoring = {
            "immediate": "مراجعة المؤشرات والتوصيات الحالية",
            "short_term": "إعادة الفحص خلال يومين إلى ثلاثة أيام",
            "long_term": "متابعة دورية لحالة النبات",
        }
        action_priority = "medium"
    else:
        monitoring = {
            "immediate": "تسجيل النتيجة ومراجعة التوصيات",
            "short_term": "إعادة الفحص خلال أسبوع",
            "long_term": "مواصلة المراقبة الدورية",
        }
        action_priority = "low"

    return {
        "status": "success",
        "overall_plant_health": {
            "score": round(overall_score, 2),
            "components": {
                "disease_health": round(disease_health, 2),
                "leaf_health": round(leaf_health, 2),
                "nutrition_health": round(nutrition_health, 2),
            },
            "calculation": (
                "(disease_health + leaf_health) / 2; "
                "nutrition_health is already included in leaf_health"
            ),
        },
        "combined_assessment": {
            "action_priority": action_priority,
            "health_assessment": health_assessment,
            "primary_concerns": concerns,
            "monitoring_schedule": monitoring,
        },
        "unified_recommendations": recommendations,
        "disease_analysis": disease,
        "leaf_analysis": leaf,
        "nutrition_health_available": nutrition_available,
        "data_source": (
            "mixed"
            if disease.get("disease_detection", {}).get("data_source") == "trained-ml"
            else "heuristic"
        ),
        "is_real_data": False,
        "model_source": (
            f"{disease.get('disease_detection', {}).get('model_source', 'feature-based-heuristics')}"
            "+leaf-feature-heuristics+deterministic-aggregation"
        ),
        "component_sources": {
            "disease_detection": disease.get("disease_detection", {}).get(
                "data_source", "heuristic"
            ),
            "leaf_analysis": "heuristic",
            "nutrition_analysis": "heuristic",
            "overall_health_score": "deterministic-aggregation",
        },
        "disclaimer": (
            "Disease classification may use a trained PlantVillage model. "
            "Leaf and nutrition analysis remain heuristic; nutrient status "
            "is not a laboratory measurement. The combined health score "
            "is not field-validated and is not a substitute for expert assessment."
        ),
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

        image_data, detected_content_type = await _read_validated_image(file)

        # Model load/inference and the vision call run in the threadpool.
        result = await offload(
            _run_disease_detection, image_data, detected_content_type, plant_type
        )

        return PlantDiseaseResponse(**result)

    except HTTPException:
        raise
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

        image_data, _ = await _read_validated_image(file)

        result = await offload(
            _run_leaf_analysis, image_data, plant_type, growth_stage
        )

        return LeafAnalysisResponse(**result)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Leaf analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/quick-health-check")
async def quick_health_check(file: UploadFile = File(...)):
    try:
        image_data, _ = await _read_validated_image(file)

        # Lazy loading and both inferences happen in the threadpool.
        return await offload(_run_quick_health_check, image_data)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Quick check error: {e}")
        raise HTTPException(status_code=500, detail=str(e))




@app.post("/analyze-plant")
async def analyze_plant(
    file: UploadFile = File(...),
    plant_type: Optional[str] = Form(None),
    growth_stage: Optional[str] = Form(None),
    analysis_focus: Optional[str] = Form("comprehensive"),
):
    try:
        logger.info(
            "Processing comprehensive plant analysis: %s (focus=%s)",
            file.filename,
            analysis_focus,
        )

        image_data, _ = await _read_validated_image(file)

        return await offload(
            _run_comprehensive_analysis,
            image_data,
            plant_type,
            growth_stage,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Comprehensive plant analysis error")
        raise HTTPException(status_code=500, detail=str(e))

# =========================================================
# 🚀 RENDER PORT FIX (VERY IMPORTANT)
# =========================================================
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8003))  # Render uses PORT env
    uvicorn.run(app, host="0.0.0.0", port=port)
