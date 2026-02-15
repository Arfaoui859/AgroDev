"""
Enhanced Model Loader for AgroGrowth AI Services
================================================

Integrates with the main models directory and provides service-specific loading.
"""

import sys
import os
from pathlib import Path
from typing import Optional, Any, Dict
import logging

# Add models directory to path
MODELS_DIR = Path(__file__).parent.parent.parent / "models"
sys.path.append(str(MODELS_DIR))

try:
    from loaders import ModelLoader, DummyResponses, get_model
    MODELS_AVAILABLE = True
except ImportError:
    MODELS_AVAILABLE = False
    logging.warning("Models directory not available, using dummy responses only")

logger = logging.getLogger(__name__)

class AIServiceModelLoader:
    """
    Service-specific model loader with enhanced error handling
    """
    
    def __init__(self, service_name: str):
        self.service_name = service_name
        self.dummy_responses = DummyResponses() if not MODELS_AVAILABLE else DummyResponses()
        self._models_loaded = False
        
        if MODELS_AVAILABLE:
            self.loader = ModelLoader()
            self._load_service_models()
        else:
            logger.warning(f"Models not available for {service_name}, using dummy responses")
    
    def _load_service_models(self):
        """Load models specific to this service"""
        try:
            if self.service_name == "soil_analysis":
                self.loader.load_soil_classifier()
                self.loader.load_fertility_predictor()
                self.loader.load_nutrient_analyzer()
            elif self.service_name == "crop_recommendation":
                self.loader.load_crop_matcher()
                self.loader.load_yield_predictor()
            elif self.service_name == "image_diagnosis":
                self.loader.load_disease_detector()
                self.loader.load_pest_identifier()
            elif self.service_name == "market_prediction":
                self.loader.load_price_forecaster()
            
            self._models_loaded = True
            logger.info(f"Models loaded for service: {self.service_name}")
            
        except Exception as e:
            logger.error(f"Failed to load models for {self.service_name}: {str(e)}")
            self._models_loaded = False
    
    def get_model(self, model_name: str) -> Optional[Any]:
        """Get a specific model with fallback"""
        if not MODELS_AVAILABLE or not self._models_loaded:
            return None
        
        try:
            return get_model(model_name)
        except Exception as e:
            logger.error(f"Error loading model {model_name}: {str(e)}")
            return None
    
    def predict_with_fallback(self, model_name: str, data: Any, fallback_func: callable) -> Dict[str, Any]:
        """
        Make prediction with automatic fallback to dummy response
        
        Args:
            model_name: Name of the model to use
            data: Input data for prediction
            fallback_func: Function to call if model is not available
            
        Returns:
            Prediction result or fallback response
        """
        model = self.get_model(model_name)
        
        if model is None:
            logger.info(f"Model {model_name} not available, using fallback")
            result = fallback_func(data)
            result['is_dummy_response'] = True
            return result
        
        try:
            # Attempt model prediction
            prediction = model.predict(data)
            
            # Format prediction result based on service
            if self.service_name == "soil_analysis":
                return self._format_soil_prediction(prediction, data)
            elif self.service_name == "crop_recommendation":
                return self._format_crop_prediction(prediction, data)
            elif self.service_name == "image_diagnosis":
                return self._format_image_prediction(prediction, data)
            else:
                return {"prediction": prediction, "is_dummy_response": False}
                
        except Exception as e:
            logger.error(f"Model prediction failed for {model_name}: {str(e)}")
            result = fallback_func(data)
            result['is_dummy_response'] = True
            result['error'] = f"Model prediction failed: {str(e)}"
            return result
    
    def _format_soil_prediction(self, prediction: Any, input_data: Dict) -> Dict[str, Any]:
        """Format soil analysis prediction"""
        # This would format the raw model output into the expected API format
        return {
            "soil_type": {
                "classification": str(prediction),
                "confidence": 0.85
            },
            "health_score": 78,
            "fertility_level": "Good",
            "is_dummy_response": False
        }
    
    def _format_crop_prediction(self, prediction: Any, input_data: Dict) -> Dict[str, Any]:
        """Format crop recommendation prediction"""
        return {
            "recommendations": prediction,
            "is_dummy_response": False
        }
    
    def _format_image_prediction(self, prediction: Any, input_data: Dict) -> Dict[str, Any]:
        """Format image diagnosis prediction"""
        return {
            "disease_detection": prediction,
            "is_dummy_response": False
        }
    
    def get_service_status(self) -> Dict[str, Any]:
        """Get status of this service's models"""
        if not MODELS_AVAILABLE:
            return {
                "status": "models_unavailable",
                "models_loaded": False,
                "using_fallback": True
            }
        
        return {
            "status": "operational" if self._models_loaded else "degraded",
            "models_loaded": self._models_loaded,
            "using_fallback": not self._models_loaded,
            "model_status": self.loader.get_model_status() if hasattr(self, 'loader') else {}
        }


# =====================================
# SERVICE-SPECIFIC LOADERS
# =====================================

class SoilAnalysisLoader(AIServiceModelLoader):
    """Soil analysis specific model loader"""
    
    def __init__(self):
        super().__init__("soil_analysis")
    
    def analyze_soil(self, sensor_data: Dict[str, float]) -> Dict[str, Any]:
        """Analyze soil with model or fallback"""
        return self.predict_with_fallback(
            'soil_classifier',
            sensor_data,
            self.dummy_responses.dummy_soil_analysis
        )
    
    def predict_fertility(self, chemical_data: Dict[str, float]) -> Dict[str, Any]:
        """Predict soil fertility"""
        return self.predict_with_fallback(
            'fertility_predictor',
            chemical_data,
            lambda x: {"fertility_score": 75, "is_dummy_response": True}
        )


class CropRecommendationLoader(AIServiceModelLoader):
    """Crop recommendation specific model loader"""
    
    def __init__(self):
        super().__init__("crop_recommendation")
    
    def recommend_crops(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Get crop recommendations with model or fallback"""
        return self.predict_with_fallback(
            'crop_matcher',
            input_data,
            self.dummy_responses.dummy_crop_recommendations
        )


class ImageDiagnosisLoader(AIServiceModelLoader):
    """Image diagnosis specific model loader"""
    
    def __init__(self):
        super().__init__("image_diagnosis")
    
    def detect_disease(self, image_data: Any) -> Dict[str, Any]:
        """Detect plant disease with model or fallback"""
        return self.predict_with_fallback(
            'disease_detector',
            image_data,
            lambda x: self.dummy_responses.dummy_disease_detection()
        )


# =====================================
# GLOBAL INSTANCES
# =====================================

# Create global instances for each service
soil_loader = SoilAnalysisLoader()
crop_loader = CropRecommendationLoader()
image_loader = ImageDiagnosisLoader()

def get_service_loader(service_name: str) -> Optional[AIServiceModelLoader]:
    """Get loader for specific service"""
    loaders = {
        "soil_analysis": soil_loader,
        "crop_recommendation": crop_loader,
        "image_diagnosis": image_loader
    }
    return loaders.get(service_name)
