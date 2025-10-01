"""
AI Model Loaders for AgroGrowth Platform
========================================

This module provides utilities to load and manage AI models for the AgroGrowth platform.
It includes fallback mechanisms when models are not available.
"""

import os
import pickle
import logging
from typing import Optional, Dict, Any, Union
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Model directory path
MODELS_DIR = Path(__file__).parent
SOIL_MODELS_DIR = MODELS_DIR / "soil_analysis"
CROP_MODELS_DIR = MODELS_DIR / "crop_recommendation"
IMAGE_MODELS_DIR = MODELS_DIR / "image_diagnosis"
MARKET_MODELS_DIR = MODELS_DIR / "market_prediction"

class ModelLoader:
    """
    Centralized model loader with fallback mechanisms
    """
    
    def __init__(self):
        self._loaded_models: Dict[str, Any] = {}
        self._model_status: Dict[str, bool] = {}
        
    def _load_pickle_model(self, model_path: Path, model_name: str) -> Optional[Any]:
        """Load a pickle model with error handling"""
        try:
            if not model_path.exists():
                logger.warning(f"Model file not found: {model_path}")
                self._model_status[model_name] = False
                return None
                
            with open(model_path, 'rb') as f:
                model = pickle.load(f)
                logger.info(f"Successfully loaded model: {model_name}")
                self._model_status[model_name] = True
                return model
                
        except Exception as e:
            logger.error(f"Failed to load model {model_name}: {str(e)}")
            self._model_status[model_name] = False
            return None
    
    def _load_keras_model(self, model_path: Path, model_name: str) -> Optional[Any]:
        """Load a Keras/TensorFlow model with error handling"""
        try:
            # Import tensorflow only when needed
            import tensorflow as tf
            
            if not model_path.exists():
                logger.warning(f"Model file not found: {model_path}")
                self._model_status[model_name] = False
                return None
                
            model = tf.keras.models.load_model(model_path)
            logger.info(f"Successfully loaded Keras model: {model_name}")
            self._model_status[model_name] = True
            return model
            
        except ImportError:
            logger.warning("TensorFlow not available, cannot load Keras models")
            self._model_status[model_name] = False
            return None
        except Exception as e:
            logger.error(f"Failed to load Keras model {model_name}: {str(e)}")
            self._model_status[model_name] = False
            return None
    
    # =====================================
    # SOIL ANALYSIS MODELS
    # =====================================
    
    def load_soil_classifier(self) -> Optional[Any]:
        """Load soil type classification model"""
        model_name = "soil_classifier"
        if model_name in self._loaded_models:
            return self._loaded_models[model_name]
            
        model_path = SOIL_MODELS_DIR / "soil_classifier.pkl"
        model = self._load_pickle_model(model_path, model_name)
        
        if model:
            self._loaded_models[model_name] = model
        return model
    
    def load_fertility_predictor(self) -> Optional[Any]:
        """Load soil fertility prediction model"""
        model_name = "fertility_predictor"
        if model_name in self._loaded_models:
            return self._loaded_models[model_name]
            
        model_path = SOIL_MODELS_DIR / "fertility_predictor.h5"
        model = self._load_keras_model(model_path, model_name)
        
        if model:
            self._loaded_models[model_name] = model
        return model
    
    def load_nutrient_analyzer(self) -> Optional[Any]:
        """Load NPK nutrient analysis model"""
        model_name = "nutrient_analyzer"
        if model_name in self._loaded_models:
            return self._loaded_models[model_name]
            
        model_path = SOIL_MODELS_DIR / "nutrient_analyzer.pkl"
        model = self._load_pickle_model(model_path, model_name)
        
        if model:
            self._loaded_models[model_name] = model
        return model
    
    # =====================================
    # CROP RECOMMENDATION MODELS
    # =====================================
    
    def load_crop_matcher(self) -> Optional[Any]:
        """Load crop-soil matching model"""
        model_name = "crop_matcher"
        if model_name in self._loaded_models:
            return self._loaded_models[model_name]
            
        model_path = CROP_MODELS_DIR / "crop_matcher.pkl"
        model = self._load_pickle_model(model_path, model_name)
        
        if model:
            self._loaded_models[model_name] = model
        return model
    
    def load_yield_predictor(self) -> Optional[Any]:
        """Load yield prediction model"""
        model_name = "yield_predictor"
        if model_name in self._loaded_models:
            return self._loaded_models[model_name]
            
        model_path = CROP_MODELS_DIR / "yield_predictor.h5"
        model = self._load_keras_model(model_path, model_name)
        
        if model:
            self._loaded_models[model_name] = model
        return model
    
    # =====================================
    # IMAGE DIAGNOSIS MODELS
    # =====================================
    
    def load_disease_detector(self) -> Optional[Any]:
        """Load plant disease detection model"""
        model_name = "disease_detector"
        if model_name in self._loaded_models:
            return self._loaded_models[model_name]
            
        model_path = IMAGE_MODELS_DIR / "disease_detector.h5"
        model = self._load_keras_model(model_path, model_name)
        
        if model:
            self._loaded_models[model_name] = model
        return model
    
    def load_pest_identifier(self) -> Optional[Any]:
        """Load pest identification model"""
        model_name = "pest_identifier"
        if model_name in self._loaded_models:
            return self._loaded_models[model_name]
            
        model_path = IMAGE_MODELS_DIR / "pest_identifier.h5"
        model = self._load_keras_model(model_path, model_name)
        
        if model:
            self._loaded_models[model_name] = model
        return model
    
    # =====================================
    # MARKET PREDICTION MODELS
    # =====================================
    
    def load_price_forecaster(self) -> Optional[Any]:
        """Load market price forecasting model"""
        model_name = "price_forecaster"
        if model_name in self._loaded_models:
            return self._loaded_models[model_name]
            
        model_path = MARKET_MODELS_DIR / "price_forecaster.pkl"
        model = self._load_pickle_model(model_path, model_name)
        
        if model:
            self._loaded_models[model_name] = model
        return model
    
    # =====================================
    # UTILITY METHODS
    # =====================================
    
    def get_model_status(self) -> Dict[str, bool]:
        """Get loading status of all attempted models"""
        return self._model_status.copy()
    
    def get_loaded_models(self) -> Dict[str, Any]:
        """Get dictionary of all loaded models"""
        return self._loaded_models.copy()
    
    def unload_model(self, model_name: str) -> bool:
        """Unload a specific model to free memory"""
        if model_name in self._loaded_models:
            del self._loaded_models[model_name]
            logger.info(f"Unloaded model: {model_name}")
            return True
        return False
    
    def unload_all_models(self) -> None:
        """Unload all models to free memory"""
        self._loaded_models.clear()
        logger.info("Unloaded all models")


# =====================================
# DUMMY RESPONSE GENERATORS
# =====================================

class DummyResponses:
    """
    Generate realistic dummy responses when models are not available
    """
    
    @staticmethod
    def dummy_soil_analysis(sensor_data: Dict[str, float]) -> Dict[str, Any]:
        """Generate dummy soil analysis response"""
        ph = sensor_data.get('ph', 6.5)
        moisture = sensor_data.get('moisture', 45)
        
        # Simple rule-based logic for dummy response
        if ph < 6.0:
            soil_type = "Acidic Clay"
            fertility = "Poor"
            health_score = 45
        elif ph > 7.5:
            soil_type = "Alkaline Sandy"
            fertility = "Moderate"
            health_score = 65
        else:
            soil_type = "Sandy Loam"
            fertility = "Good"
            health_score = 78
        
        return {
            "soil_type": {
                "classification": soil_type,
                "confidence": 0.75  # Lower confidence for dummy data
            },
            "health_score": health_score,
            "fertility_level": fertility,
            "overall_recommendations": [
                "Regular monitoring recommended",
                "Consider soil testing for accurate analysis",
                "Models are currently unavailable - using basic analysis"
            ],
            "analysis_timestamp": "2024-01-15T10:30:00Z",
            "is_dummy_response": True
        }
    
    @staticmethod
    def dummy_crop_recommendations(soil_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate dummy crop recommendations"""
        ph = soil_data.get('ph', 6.5)
        
        # Simple rule-based recommendations
        if ph < 6.0:
            top_crop = {"crop": "potato", "name_ar": "بطاطا", "suitability_score": 75}
        elif ph > 7.5:
            top_crop = {"crop": "barley", "name_ar": "شعير", "suitability_score": 80}
        else:
            top_crop = {"crop": "wheat", "name_ar": "قمح", "suitability_score": 85}
        
        return {
            "recommendations": [
                {
                    "rank": 1,
                    **top_crop,
                    "category": "cereal",
                    "predicted_yield_per_hectare": 3.5,
                    "profit_analysis": {
                        "net_profit": 1000,
                        "roi_percent": 25.0,
                        "profit_margin_percent": 20.0
                    },
                    "risk_assessment": {
                        "overall_risk_score": 30,
                        "overall_risk_level": "low"
                    }
                }
            ],
            "best_recommendation": top_crop,
            "is_dummy_response": True,
            "note": "AI models unavailable - using basic recommendations"
        }
    
    @staticmethod
    def dummy_disease_detection() -> Dict[str, Any]:
        """Generate dummy disease detection response"""
        return {
            "disease_detection": {
                "primary_disease": {
                    "disease": "healthy",
                    "disease_name_ar": "سليم",
                    "probability": 0.70
                },
                "top_predictions": [
                    {
                        "disease": "healthy",
                        "disease_name_ar": "سليم",
                        "probability": 0.70,
                        "severity_level": "none"
                    }
                ],
                "confidence_score": 0.70
            },
            "health_score": {
                "health_score": 75,
                "health_category": "good"
            },
            "is_dummy_response": True,
            "note": "AI models unavailable - basic analysis performed"
        }


# =====================================
# GLOBAL MODEL LOADER INSTANCE
# =====================================

# Create global loader instance
_global_loader = ModelLoader()

def get_model(model_name: str) -> Optional[Any]:
    """
    Get a specific model by name
    
    Args:
        model_name: Name of the model to load
        
    Returns:
        Loaded model or None if not available
    """
    loader_methods = {
        'soil_classifier': _global_loader.load_soil_classifier,
        'fertility_predictor': _global_loader.load_fertility_predictor,
        'nutrient_analyzer': _global_loader.load_nutrient_analyzer,
        'crop_matcher': _global_loader.load_crop_matcher,
        'yield_predictor': _global_loader.load_yield_predictor,
        'disease_detector': _global_loader.load_disease_detector,
        'pest_identifier': _global_loader.load_pest_identifier,
        'price_forecaster': _global_loader.load_price_forecaster,
    }
    
    if model_name in loader_methods:
        return loader_methods[model_name]()
    else:
        logger.warning(f"Unknown model name: {model_name}")
        return None

def get_model_status() -> Dict[str, bool]:
    """Get status of all models"""
    return _global_loader.get_model_status()

def get_dummy_responses() -> DummyResponses:
    """Get dummy response generator"""
    return DummyResponses()
