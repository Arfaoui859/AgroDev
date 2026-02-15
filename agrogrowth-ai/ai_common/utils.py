"""
Common utilities for AgroGrowth AI services
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional, Union
import logging
from datetime import datetime, timedelta
import cv2
from PIL import Image
import base64
import io

logger = logging.getLogger(__name__)

class DataPreprocessor:
    """Common data preprocessing utilities"""
    
    @staticmethod
    def normalize_soil_data(data: Dict[str, Any]) -> np.ndarray:
        """Normalize soil analysis data"""
        features = [
            data.get('ph', 7.0),
            data.get('nitrogen', 0.0),
            data.get('phosphorus', 0.0),
            data.get('potassium', 0.0),
            data.get('organic_matter', 0.0),
            data.get('moisture', 0.0),
            data.get('temperature', 25.0),
            data.get('salinity', 0.0)
        ]
        return np.array(features, dtype=np.float32)
    
    @staticmethod
    def normalize_weather_data(data: Dict[str, Any]) -> np.ndarray:
        """Normalize weather data"""
        features = [
            data.get('temperature', 25.0),
            data.get('humidity', 60.0),
            data.get('rainfall', 0.0),
            data.get('wind_speed', 0.0),
            data.get('pressure', 1013.25),
            data.get('solar_radiation', 0.0)
        ]
        return np.array(features, dtype=np.float32)
    
    @staticmethod
    def normalize_crop_data(data: Dict[str, Any]) -> np.ndarray:
        """Normalize crop-specific data"""
        features = [
            data.get('plant_age', 0),
            data.get('height', 0.0),
            data.get('leaf_count', 0),
            data.get('growth_stage', 1),
            data.get('health_score', 1.0)
        ]
        return np.array(features, dtype=np.float32)

class ImageProcessor:
    """Image processing utilities for plant analysis"""
    
    @staticmethod
    def preprocess_plant_image(image_data: Union[str, bytes, np.ndarray], 
                              target_size: tuple = (224, 224)) -> np.ndarray:
        """Preprocess plant images for analysis"""
        try:
            if isinstance(image_data, str):
                # Base64 encoded image
                image_bytes = base64.b64decode(image_data)
                image = Image.open(io.BytesIO(image_bytes))
            elif isinstance(image_data, bytes):
                image = Image.open(io.BytesIO(image_data))
            else:
                image = Image.fromarray(image_data)
            
            # Convert to RGB if needed
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Resize
            image = image.resize(target_size)
            
            # Convert to numpy array and normalize
            img_array = np.array(image) / 255.0
            
            return img_array.astype(np.float32)
            
        except Exception as e:
            logger.error(f"Error preprocessing image: {e}")
            raise
    
    @staticmethod
    def extract_leaf_features(image: np.ndarray) -> Dict[str, float]:
        """Extract features from leaf images"""
        try:
            # Convert to HSV for better color analysis
            hsv = cv2.cvtColor(image, cv2.COLOR_RGB2HSV)
            
            # Calculate color statistics
            mean_hue = np.mean(hsv[:, :, 0])
            mean_saturation = np.mean(hsv[:, :, 1])
            mean_value = np.mean(hsv[:, :, 2])
            
            # Calculate texture features using standard deviation
            gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
            texture_std = np.std(gray)
            
            # Calculate edge density
            edges = cv2.Canny((gray * 255).astype(np.uint8), 50, 150)
            edge_density = np.sum(edges > 0) / edges.size
            
            return {
                'mean_hue': float(mean_hue),
                'mean_saturation': float(mean_saturation),
                'mean_value': float(mean_value),
                'texture_std': float(texture_std),
                'edge_density': float(edge_density)
            }
            
        except Exception as e:
            logger.error(f"Error extracting leaf features: {e}")
            return {}

class MarketDataProcessor:
    """Market data processing utilities"""
    
    @staticmethod
    def calculate_price_trends(prices: List[float], window: int = 7) -> Dict[str, float]:
        """Calculate price trend indicators"""
        if len(prices) < window:
            return {'trend': 0.0, 'volatility': 0.0, 'momentum': 0.0}
        
        df = pd.DataFrame({'price': prices})
        
        # Moving average trend
        ma_short = df['price'].rolling(window=window//2).mean().iloc[-1]
        ma_long = df['price'].rolling(window=window).mean().iloc[-1]
        trend = (ma_short - ma_long) / ma_long if ma_long > 0 else 0.0
        
        # Volatility (standard deviation)
        volatility = df['price'].rolling(window=window).std().iloc[-1]
        
        # Momentum (rate of change)
        momentum = (prices[-1] - prices[-window]) / prices[-window] if prices[-window] > 0 else 0.0
        
        return {
            'trend': float(trend),
            'volatility': float(volatility),
            'momentum': float(momentum)
        }
    
    @staticmethod
    def seasonal_adjustment(data: List[float], period: int = 12) -> List[float]:
        """Apply seasonal adjustment to time series data"""
        if len(data) < period * 2:
            return data
        
        df = pd.DataFrame({'value': data})
        
        # Simple seasonal decomposition
        seasonal_means = []
        for i in range(period):
            seasonal_values = [data[j] for j in range(i, len(data), period)]
            seasonal_means.append(np.mean(seasonal_values))
        
        # Deseasonalize
        adjusted = []
        for i, value in enumerate(data):
            seasonal_factor = seasonal_means[i % period]
            adjusted.append(value - seasonal_factor)
        
        return adjusted

class ResponseFormatter:
    """Format AI model responses for API consumption"""
    
    @staticmethod
    def format_prediction_response(prediction: Any, confidence: float, 
                                 metadata: Optional[Dict] = None) -> Dict[str, Any]:
        """Format prediction response"""
        response = {
            'prediction': prediction,
            'confidence': float(confidence),
            'timestamp': datetime.now().isoformat(),
            'status': 'success'
        }
        
        if metadata:
            response['metadata'] = metadata
        
        return response
    
    @staticmethod
    def format_error_response(error: str, error_code: str = "AI_ERROR") -> Dict[str, Any]:
        """Format error response"""
        return {
            'status': 'error',
            'error_code': error_code,
            'error_message': error,
            'timestamp': datetime.now().isoformat()
        }
    
    @staticmethod
    def format_recommendations(recommendations: List[Dict], 
                             reasoning: Optional[str] = None) -> Dict[str, Any]:
        """Format recommendation response"""
        return {
            'recommendations': recommendations,
            'reasoning': reasoning,
            'total_count': len(recommendations),
            'timestamp': datetime.now().isoformat(),
            'status': 'success'
        }

# Utility functions
def validate_coordinates(lat: float, lon: float) -> bool:
    """Validate geographic coordinates"""
    return -90 <= lat <= 90 and -180 <= lon <= 180

def calculate_growing_degree_days(temps: List[float], base_temp: float = 10.0) -> float:
    """Calculate growing degree days"""
    gdd = sum(max(0, temp - base_temp) for temp in temps)
    return gdd

def estimate_water_requirement(crop_type: str, growth_stage: int, 
                             weather_data: Dict[str, float]) -> float:
    """Estimate water requirement based on crop and conditions"""
    base_requirements = {
        'wheat': [20, 40, 60, 40, 20],
        'corn': [25, 45, 70, 50, 25],
        'rice': [40, 60, 80, 60, 40],
        'tomato': [30, 50, 70, 60, 30],
        'default': [25, 45, 65, 45, 25]
    }
    
    requirements = base_requirements.get(crop_type, base_requirements['default'])
    stage_index = min(growth_stage - 1, len(requirements) - 1)
    base_req = requirements[stage_index]
    
    # Adjust for temperature and humidity
    temp_factor = 1 + (weather_data.get('temperature', 25) - 25) * 0.02
    humidity_factor = 1 - (weather_data.get('humidity', 60) - 60) * 0.01
    
    return base_req * temp_factor * humidity_factor
