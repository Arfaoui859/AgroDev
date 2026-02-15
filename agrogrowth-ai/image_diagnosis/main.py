"""
FastAPI service for Image Diagnosis AI
Provides REST API endpoints for plant disease detection and leaf analysis
"""

from fastapi import FastAPI, HTTPException, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional
import logging
import sys
import os

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from image_diagnosis.plant_disease_detector import create_plant_disease_detector
from image_diagnosis.leaf_scan_ai import create_leaf_scan_ai

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Pydantic models for requests and responses
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

class CombinedImageAnalysisResponse(BaseModel):
    plant_disease_analysis: Dict[str, Any]
    leaf_analysis: Dict[str, Any]
    combined_assessment: Dict[str, Any]
    unified_recommendations: List[str]
    overall_plant_health: Dict[str, Any]
    analysis_timestamp: str

# Initialize AI models
disease_detector = create_plant_disease_detector()
leaf_scanner = create_leaf_scan_ai()

# Create FastAPI app
app = FastAPI(
    title="AgroGrowth Image Diagnosis AI",
    description="AI-powered plant disease detection and comprehensive leaf analysis for agricultural health monitoring",
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
        "service": "AgroGrowth Image Diagnosis AI",
        "status": "running",
        "version": "1.0.0",
        "endpoints": {
            "disease_detection": "/detect-disease",
            "leaf_analysis": "/analyze-leaf",
            "combined_analysis": "/analyze-plant",
            "health_check": "/health",
            "supported_diseases": "/supported-diseases",
            "docs": "/docs"
        },
        "supported_formats": ["JPEG", "PNG", "BMP", "TIFF"],
        "max_file_size": "10MB"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Image Diagnosis AI",
        "models_loaded": {
            "disease_detector": disease_detector.is_trained,
            "leaf_scanner": leaf_scanner.is_trained
        },
        "capabilities": [
            "Plant disease detection",
            "Leaf health analysis",
            "Nutritional deficiency detection",
            "Growth assessment",
            "Environmental stress detection"
        ]
    }

@app.post("/detect-disease", response_model=PlantDiseaseResponse)
async def detect_plant_disease(
    file: UploadFile = File(...),
    plant_type: Optional[str] = Form(None)
):
    """
    Detect plant diseases and health issues from plant images
    
    Analyzes uploaded plant images to identify:
    - Disease types and severity
    - Affected areas
    - Treatment recommendations
    - Risk assessment
    - Environmental factors
    """
    try:
        logger.info(f"Processing disease detection for file: {file.filename}")
        
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read image data
        image_data = await file.read()
        
        # Detect diseases
        result = disease_detector.detect_plant_disease(image_data, plant_type)
        
        return PlantDiseaseResponse(**result)
        
    except Exception as e:
        logger.error(f"Error in disease detection: {e}")
        raise HTTPException(status_code=500, detail=f"Disease detection failed: {str(e)}")

@app.post("/analyze-leaf", response_model=LeafAnalysisResponse)
async def analyze_leaf_comprehensive(
    file: UploadFile = File(...),
    plant_type: Optional[str] = Form(None),
    growth_stage: Optional[str] = Form(None)
):
    """
    Comprehensive leaf analysis including nutrition, growth, and health
    
    Provides detailed analysis of:
    - Nutritional deficiencies
    - Growth and development status
    - Overall leaf health
    - Morphological characteristics
    - Environmental stress indicators
    - Photosynthetic capacity
    """
    try:
        logger.info(f"Processing comprehensive leaf analysis for file: {file.filename}")
        
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read image data
        image_data = await file.read()
        
        # Analyze leaf
        result = leaf_scanner.analyze_leaf_comprehensive(image_data, plant_type, growth_stage)
        
        return LeafAnalysisResponse(**result)
        
    except Exception as e:
        logger.error(f"Error in leaf analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Leaf analysis failed: {str(e)}")

@app.post("/analyze-plant", response_model=CombinedImageAnalysisResponse)
async def analyze_plant_comprehensive(
    file: UploadFile = File(...),
    plant_type: Optional[str] = Form(None),
    growth_stage: Optional[str] = Form(None),
    analysis_focus: Optional[str] = Form("comprehensive")
):
    """
    Complete plant analysis combining disease detection and leaf analysis
    
    Performs both disease detection and leaf analysis, then provides:
    - Unified health assessment
    - Combined recommendations
    - Prioritized action items
    - Overall plant health score
    """
    try:
        logger.info(f"Processing comprehensive plant analysis for file: {file.filename}")
        
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read image data
        image_data = await file.read()
        
        # Perform both analyses
        disease_analysis = disease_detector.detect_plant_disease(image_data, plant_type)
        leaf_analysis = leaf_scanner.analyze_leaf_comprehensive(image_data, plant_type, growth_stage)
        
        # Combine results
        combined_result = _combine_analysis_results(disease_analysis, leaf_analysis, analysis_focus)
        
        return CombinedImageAnalysisResponse(**combined_result)
        
    except Exception as e:
        logger.error(f"Error in comprehensive plant analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Comprehensive analysis failed: {str(e)}")

@app.get("/supported-diseases")
async def get_supported_diseases():
    """Get list of supported diseases and conditions"""
    try:
        diseases = []
        for disease_key, disease_info in disease_detector.disease_database.items():
            diseases.append({
                "disease_code": disease_key,
                "name_ar": disease_info["name_ar"],
                "description": disease_info["description"],
                "severity": disease_info["severity"],
                "treatment_available": len(disease_info["treatment"]) > 0
            })
        
        return {
            "status": "success",
            "supported_diseases": diseases,
            "total_count": len(diseases),
            "categories": {
                "fungal_diseases": ["early_blight", "late_blight", "powdery_mildew", "rust", "anthracnose"],
                "bacterial_diseases": ["bacterial_spot"],
                "viral_diseases": ["mosaic_virus"],
                "pest_damage": ["aphid_damage", "spider_mites"],
                "nutritional_issues": ["nutrient_deficiency"],
                "healthy": ["healthy"]
            }
        }
    except Exception as e:
        logger.error(f"Error getting supported diseases: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/supported-nutrition-deficiencies")
async def get_supported_nutrition_deficiencies():
    """Get list of supported nutritional deficiencies"""
    try:
        deficiencies = []
        for deficiency_key, deficiency_info in leaf_scanner.nutrition_deficiencies.items():
            deficiencies.append({
                "deficiency_code": deficiency_key,
                "name_ar": deficiency_info["name_ar"],
                "symptoms": deficiency_info["symptoms"],
                "recovery_time": deficiency_info["recovery_time"],
                "treatment_available": len(deficiency_info["treatment"]) > 0
            })
        
        return {
            "status": "success",
            "supported_deficiencies": deficiencies,
            "total_count": len(deficiencies),
            "categories": {
                "major_nutrients": ["nitrogen_deficiency", "phosphorus_deficiency", "potassium_deficiency"],
                "secondary_nutrients": ["calcium_deficiency", "magnesium_deficiency"],
                "micronutrients": ["iron_deficiency"],
                "healthy": ["healthy_nutrition"]
            }
        }
    except Exception as e:
        logger.error(f"Error getting supported deficiencies: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/quick-health-check")
async def quick_plant_health_check(file: UploadFile = File(...)):
    """
    Quick plant health assessment with simplified output
    
    Provides a simplified health assessment suitable for mobile apps
    and quick decision making.
    """
    try:
        logger.info(f"Processing quick health check for file: {file.filename}")
        
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read image data
        image_data = await file.read()
        
        # Perform quick analysis
        disease_result = disease_detector.detect_plant_disease(image_data)
        leaf_result = leaf_scanner.analyze_leaf_comprehensive(image_data)
        
        # Extract key information
        primary_disease = disease_result['disease_detection']['primary_disease']
        health_score = disease_result['health_score']['health_score']
        nutrition_issue = leaf_result['leaf_nutrition']['primary_deficiency']
        
        # Determine overall status
        if health_score >= 80 and primary_disease['disease'] == 'healthy':
            overall_status = 'صحي'
            priority = 'منخفض'
        elif health_score >= 60:
            overall_status = 'جيد مع بعض المشاكل'
            priority = 'متوسط'
        else:
            overall_status = 'يحتاج اهتمام'
            priority = 'عالي'
        
        # Quick recommendations
        quick_recommendations = []
        if primary_disease['disease'] != 'healthy':
            quick_recommendations.append(f"علاج {primary_disease['disease_name_ar']}")
        
        if nutrition_issue['type'] != 'healthy_nutrition':
            quick_recommendations.append(f"معالجة {nutrition_issue['name_ar']}")
        
        if not quick_recommendations:
            quick_recommendations.append("الحفاظ على الرعاية الحالية")
        
        return {
            "status": "success",
            "overall_health_score": float(health_score),
            "overall_status": overall_status,
            "priority_level": priority,
            "primary_issue": primary_disease['disease_name_ar'] if primary_disease['disease'] != 'healthy' else 'لا توجد مشاكل',
            "nutrition_status": nutrition_issue['name_ar'],
            "quick_recommendations": quick_recommendations,
            "needs_immediate_attention": health_score < 50 or primary_disease['probability'] > 0.7
        }
        
    except Exception as e:
        logger.error(f"Error in quick health check: {e}")
        raise HTTPException(status_code=500, detail=f"Quick health check failed: {str(e)}")

@app.get("/analysis-capabilities")
async def get_analysis_capabilities():
    """Get detailed information about analysis capabilities"""
    return {
        "disease_detection": {
            "description": "تشخيص أمراض النباتات والآفات",
            "capabilities": [
                "كشف الأمراض الفطرية والبكتيرية",
                "تحديد شدة الإصابة",
                "تقييم المناطق المتضررة", 
                "وضع خطة علاج مفصلة",
                "تقييم المخاطر",
                "تحليل العوامل البيئية"
            ],
            "supported_conditions": len(disease_detector.disease_database)
        },
        "leaf_analysis": {
            "description": "تحليل شامل لصحة الأوراق والتغذية",
            "capabilities": [
                "كشف نقص العناصر الغذائية",
                "تقييم النمو والتطور",
                "تحليل الصحة العامة للورقة",
                "دراسة الخصائص المورفولوجية",
                "كشف الإجهاد البيئي",
                "تقدير القدرة على التمثيل الضوئي"
            ],
            "supported_deficiencies": len(leaf_scanner.nutrition_deficiencies)
        },
        "technical_specs": {
            "supported_formats": ["JPEG", "PNG", "BMP", "TIFF"],
            "max_file_size": "10MB",
            "min_resolution": "224x224",
            "recommended_resolution": "1024x1024",
            "processing_time": "2-10 seconds"
        }
    }

def _combine_analysis_results(disease_analysis: Dict[str, Any], 
                            leaf_analysis: Dict[str, Any],
                            focus: str = "comprehensive") -> Dict[str, Any]:
    """Combine disease detection and leaf analysis results"""
    
    # Extract key scores
    disease_health_score = disease_analysis['health_score']['health_score']
    leaf_health_score = leaf_analysis['health_evaluation']['overall_health_score']
    nutrition_score = leaf_analysis['leaf_nutrition']['nutritional_health_score']
    
    # Calculate combined health score
    combined_health_score = (disease_health_score * 0.4 + 
                           leaf_health_score * 0.35 + 
                           nutrition_score * 0.25)
    
    # Determine overall assessment
    if combined_health_score >= 85:
        overall_assessment = 'ممتاز - نبات صحي'
        action_priority = 'منخفض'
    elif combined_health_score >= 70:
        overall_assessment = 'جيد - صحة عامة جيدة'
        action_priority = 'متوسط'
    elif combined_health_score >= 50:
        overall_assessment = 'متوسط - يحتاج رعاية'
        action_priority = 'عالي'
    else:
        overall_assessment = 'ضعيف - يحتاج تدخل فوري'
        action_priority = 'حرج'
    
    # Combine recommendations
    unified_recommendations = []
    
    # Add disease treatment recommendations
    if disease_analysis['disease_detection']['primary_disease']['disease'] != 'healthy':
        unified_recommendations.extend(disease_analysis['treatment_plan']['immediate_treatment'][:3])
    
    # Add nutrition recommendations
    if leaf_analysis['leaf_nutrition']['primary_deficiency']['type'] != 'healthy_nutrition':
        unified_recommendations.extend(leaf_analysis['leaf_nutrition']['nutrition_recommendations'][:2])
    
    # Add general care recommendations
    unified_recommendations.extend(leaf_analysis['care_recommendations'][:3])
    
    # Remove duplicates
    unified_recommendations = list(set(unified_recommendations))
    
    # Prioritize recommendations
    prioritized_recommendations = _prioritize_recommendations(
        unified_recommendations, disease_analysis, leaf_analysis
    )
    
    # Create combined assessment
    combined_assessment = {
        'overall_health_score': float(combined_health_score),
        'health_assessment': overall_assessment,
        'action_priority': action_priority,
        'primary_concerns': _identify_primary_concerns(disease_analysis, leaf_analysis),
        'improvement_potential': float(min(100, combined_health_score + 20)),
        'monitoring_schedule': _create_monitoring_schedule(combined_health_score, disease_analysis, leaf_analysis)
    }
    
    return {
        'plant_disease_analysis': disease_analysis,
        'leaf_analysis': leaf_analysis,
        'combined_assessment': combined_assessment,
        'unified_recommendations': prioritized_recommendations,
        'overall_plant_health': {
            'score': float(combined_health_score),
            'category': overall_assessment,
            'components': {
                'disease_health': float(disease_health_score),
                'leaf_health': float(leaf_health_score),
                'nutrition_health': float(nutrition_score)
            }
        },
        'analysis_timestamp': disease_analysis['analysis_timestamp']
    }

def _prioritize_recommendations(recommendations: List[str], 
                              disease_analysis: Dict[str, Any],
                              leaf_analysis: Dict[str, Any]) -> List[str]:
    """Prioritize recommendations based on urgency and impact"""
    
    # Create priority scoring
    priority_scores = {}
    
    for rec in recommendations:
        score = 1.0  # Base score
        
        # Increase priority for disease-related recommendations
        if any(word in rec for word in ['مرض', 'فطر', 'بكتير', 'علاج']):
            disease_severity = disease_analysis['severity_assessment']['severity_score']
            score += disease_severity
        
        # Increase priority for severe nutritional issues
        if any(word in rec for word in ['نقص', 'تسميد', 'عنصر']):
            nutrition_severity = 4 - leaf_analysis['leaf_nutrition']['primary_deficiency']['severity_score']
            score += nutrition_severity * 0.5
        
        # Increase priority for immediate actions
        if any(word in rec for word in ['فوري', 'عاجل', 'سريع']):
            score += 2.0
        
        priority_scores[rec] = score
    
    # Sort by priority score (descending)
    prioritized = sorted(priority_scores.items(), key=lambda x: x[1], reverse=True)
    
    return [rec for rec, score in prioritized]

def _identify_primary_concerns(disease_analysis: Dict[str, Any],
                             leaf_analysis: Dict[str, Any]) -> List[str]:
    """Identify primary concerns from both analyses"""
    concerns = []
    
    # Disease concerns
    primary_disease = disease_analysis['disease_detection']['primary_disease']
    if primary_disease['disease'] != 'healthy' and primary_disease['probability'] > 0.5:
        concerns.append(f"إصابة بـ {primary_disease['disease_name_ar']}")
    
    # Nutrition concerns
    nutrition_issue = leaf_analysis['leaf_nutrition']['primary_deficiency']
    if nutrition_issue['type'] != 'healthy_nutrition' and nutrition_issue['severity_score'] > 1.5:
        concerns.append(f"{nutrition_issue['name_ar']}")
    
    # Health concerns
    overall_health = leaf_analysis['health_evaluation']['overall_health_score']
    if overall_health < 60:
        concerns.append("تراجع في الصحة العامة")
    
    # Environmental stress
    stress_types = leaf_analysis['stress_analysis']['detected_stress_types']
    if len(stress_types) > 0:
        stress_names = [info['severity'] for info in stress_types.values()]
        if any('عالي' in severity for severity in stress_names):
            concerns.append("إجهاد بيئي شديد")
    
    return concerns if concerns else ["لا توجد مخاوف رئيسية"]

def _create_monitoring_schedule(combined_health_score: float,
                              disease_analysis: Dict[str, Any],
                              leaf_analysis: Dict[str, Any]) -> Dict[str, str]:
    """Create monitoring schedule based on plant condition"""
    
    disease_severity = disease_analysis['severity_assessment']['severity_score']
    nutrition_severity = leaf_analysis['leaf_nutrition']['primary_deficiency']['severity_score']
    
    # Determine frequencies
    if combined_health_score < 50 or disease_severity > 3 or nutrition_severity > 2.5:
        return {
            "immediate": "فحص يومي لمدة أسبوع",
            "short_term": "فحص كل يومين لمدة أسبوعين",
            "long_term": "فحص أسبوعي بعد ذلك"
        }
    elif combined_health_score < 70 or disease_severity > 2 or nutrition_severity > 1.5:
        return {
            "immediate": "فحص كل يومين لمدة أسبوع",
            "short_term": "فحص أسبوعي لمدة شهر",
            "long_term": "فحص كل أسبوعين بعد ذلك"
        }
    else:
        return {
            "immediate": "فحص أسبوعي لمدة شهر",
            "short_term": "فحص كل أسبوعين",
            "long_term": "فحص شهري"
        }

# Error handlers
@app.exception_handler(ValueError)
async def value_error_handler(request, exc):
    return {"status": "error", "message": str(exc)}

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}")
    return {"status": "error", "message": "Internal server error"}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8003))  # Render يعطي PORT
    uvicorn.run("soil_analysis.main:app", host="0.0.0.0", port=port)
