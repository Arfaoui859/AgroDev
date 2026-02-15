"""
ClimateCropMatcher - AI for matching climate conditions with suitable crops
Analyzes weather patterns, soil conditions, and geographic factors to recommend optimal crops
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from typing import Dict, List, Tuple, Any
import logging
from datetime import datetime, timedelta
import json

logger = logging.getLogger(__name__)

class ClimateCropMatcher:
    """AI model for matching climate conditions with suitable crops"""
    
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.is_trained = False
        
        # Crop database with climate requirements
        self.crop_database = {
            'wheat': {
                'name_ar': 'القمح',
                'temp_range': (10, 25),
                'rainfall_range': (300, 800),
                'humidity_range': (40, 70),
                'soil_ph_range': (6.0, 7.5),
                'growing_season': 'winter',
                'season_months': [10, 11, 12, 1, 2, 3],
                'water_requirement': 'متوسط',
                'soil_types': ['Loamy', 'Clay', 'Silty']
            },
            'corn': {
                'name_ar': 'الذرة',
                'temp_range': (20, 30),
                'rainfall_range': (500, 1200),
                'humidity_range': (50, 80),
                'soil_ph_range': (6.0, 7.0),
                'growing_season': 'summer',
                'season_months': [4, 5, 6, 7, 8, 9],
                'water_requirement': 'عالي',
                'soil_types': ['Loamy', 'Silty']
            },
            'rice': {
                'name_ar': 'الأرز',
                'temp_range': (25, 35),
                'rainfall_range': (1000, 2000),
                'humidity_range': (70, 90),
                'soil_ph_range': (5.5, 7.0),
                'growing_season': 'summer',
                'season_months': [4, 5, 6, 7, 8, 9],
                'water_requirement': 'عالي جداً',
                'soil_types': ['Clay', 'Silty']
            },
            'tomato': {
                'name_ar': '��لطماطم',
                'temp_range': (18, 28),
                'rainfall_range': (400, 800),
                'humidity_range': (60, 80),
                'soil_ph_range': (6.0, 7.0),
                'growing_season': 'spring_summer',
                'season_months': [3, 4, 5, 6, 7, 8],
                'water_requirement': 'متوسط إلى عالي',
                'soil_types': ['Loamy', 'Sandy', 'Silty']
            },
            'potato': {
                'name_ar': 'البطاطس',
                'temp_range': (15, 25),
                'rainfall_range': (400, 700),
                'humidity_range': (50, 75),
                'soil_ph_range': (5.5, 6.5),
                'growing_season': 'spring_fall',
                'season_months': [2, 3, 4, 9, 10, 11],
                'water_requirement': 'متوسط',
                'soil_types': ['Sandy', 'Loamy']
            },
            'onion': {
                'name_ar': 'البصل',
                'temp_range': (12, 25),
                'rainfall_range': (300, 600),
                'humidity_range': (40, 70),
                'soil_ph_range': (6.0, 7.5),
                'growing_season': 'winter_spring',
                'season_months': [10, 11, 12, 1, 2, 3, 4],
                'water_requirement': 'منخفض إلى متوسط',
                'soil_types': ['Loamy', 'Silty']
            },
            'cucumber': {
                'name_ar': 'الخيار',
                'temp_range': (20, 30),
                'rainfall_range': (400, 700),
                'humidity_range': (60, 85),
                'soil_ph_range': (6.0, 7.0),
                'growing_season': 'spring_summer',
                'season_months': [3, 4, 5, 6, 7, 8],
                'water_requirement': 'عالي',
                'soil_types': ['Loamy', 'Sandy']
            },
            'lettuce': {
                'name_ar': 'الخس',
                'temp_range': (10, 20),
                'rainfall_range': (250, 500),
                'humidity_range': (50, 75),
                'soil_ph_range': (6.0, 7.0),
                'growing_season': 'cool_season',
                'season_months': [9, 10, 11, 12, 1, 2, 3, 4],
                'water_requirement': 'متوسط',
                'soil_types': ['Loamy', 'Silty']
            },
            'dates': {
                'name_ar': 'التمور',
                'temp_range': (25, 40),
                'rainfall_range': (50, 300),
                'humidity_range': (30, 60),
                'soil_ph_range': (7.0, 8.5),
                'growing_season': 'perennial',
                'season_months': list(range(1, 13)),
                'water_requirement': 'متوسط',
                'soil_types': ['Sandy', 'Loamy']
            },
            'olive': {
                'name_ar': 'الزيتون',
                'temp_range': (15, 30),
                'rainfall_range': (400, 800),
                'humidity_range': (40, 70),
                'soil_ph_range': (6.5, 8.0),
                'growing_season': 'perennial',
                'season_months': list(range(1, 13)),
                'water_requirement': 'منخفض إلى متوسط',
                'soil_types': ['Loamy', 'Chalky', 'Sandy']
            }
        }
        
        self._initialize_model()
    
    def _initialize_model(self):
        """Initialize the crop matching model"""
        try:
            self._create_training_data()
            logger.info("ClimateCropMatcher initialized successfully")
        except Exception as e:
            logger.error(f"Error initializing ClimateCropMatcher: {e}")
    
    def _create_training_data(self):
        """Create training data from crop database"""
        training_data = []
        labels = []
        
        # Generate synthetic climate data for each crop
        for crop_name, crop_info in self.crop_database.items():
            for _ in range(100):  # Generate 100 samples per crop
                temp = np.random.uniform(*crop_info['temp_range'])
                rainfall = np.random.uniform(*crop_info['rainfall_range'])
                humidity = np.random.uniform(*crop_info['humidity_range'])
                ph = np.random.uniform(*crop_info['soil_ph_range'])
                
                # Add some noise to simulate real-world variations
                temp += np.random.normal(0, 2)
                rainfall += np.random.normal(0, 50)
                humidity += np.random.normal(0, 5)
                ph += np.random.normal(0, 0.2)
                
                training_data.append([temp, rainfall, humidity, ph])
                labels.append(crop_name)
        
        X = np.array(training_data)
        y = np.array(labels)
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Train model
        self.model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.model.fit(X_scaled, y)
        
        self.is_trained = True
        logger.info(f"Trained ClimateCropMatcher with {len(training_data)} samples")
    
    def match_crops_to_climate(self, climate_data: Dict[str, Any], 
                             soil_data: Dict[str, Any] = None) -> Dict[str, Any]:
        """Match suitable crops to given climate and soil conditions"""
        try:
            if not self.is_trained:
                raise ValueError("Model not trained")
            
            # Extract climate features
            temp = climate_data.get('temperature', 20)
            rainfall = climate_data.get('annual_rainfall', 500)
            humidity = climate_data.get('humidity', 60)
            soil_ph = soil_data.get('ph', 6.5) if soil_data else 6.5
            
            # Prepare features for prediction
            features = np.array([[temp, rainfall, humidity, soil_ph]])
            features_scaled = self.scaler.transform(features)
            
            # Get predictions and probabilities
            predictions = self.model.predict_proba(features_scaled)[0]
            classes = self.model.classes_
            
            # Rank crops by suitability
            crop_scores = list(zip(classes, predictions))
            crop_scores.sort(key=lambda x: x[1], reverse=True)
            
            # Detailed analysis for top crops
            suitable_crops = []
            for crop_name, score in crop_scores[:5]:  # Top 5 crops
                crop_info = self.crop_database[crop_name]
                suitability_analysis = self._analyze_crop_suitability(
                    crop_info, temp, rainfall, humidity, soil_ph
                )
                
                suitable_crops.append({
                    'crop': crop_name,
                    'name_ar': crop_info['name_ar'],
                    'suitability_score': float(score),
                    'analysis': suitability_analysis,
                    'growing_season': crop_info['growing_season'],
                    'water_requirement': crop_info['water_requirement'],
                    'suitable_soil_types': crop_info['soil_types']
                })
            
            # Climate analysis
            climate_analysis = self._analyze_climate_conditions(climate_data)
            
            # Seasonal recommendations
            current_month = datetime.now().month
            seasonal_recommendations = self._get_seasonal_recommendations(
                current_month, suitable_crops
            )
            
            return {
                'suitable_crops': suitable_crops,
                'climate_analysis': climate_analysis,
                'seasonal_recommendations': seasonal_recommendations,
                'best_crop': suitable_crops[0] if suitable_crops else None,
                'analysis_timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error in crop matching: {e}")
            raise
    
    def _analyze_crop_suitability(self, crop_info: Dict, temp: float, 
                                rainfall: float, humidity: float, ph: float) -> Dict[str, Any]:
        """Analyze how well climate conditions match crop requirements"""
        analysis = {}
        
        # Temperature analysis
        temp_min, temp_max = crop_info['temp_range']
        if temp_min <= temp <= temp_max:
            analysis['temperature'] = {'status': 'optimal', 'score': 1.0}
        elif temp_min - 5 <= temp < temp_min or temp_max < temp <= temp_max + 5:
            analysis['temperature'] = {'status': 'acceptable', 'score': 0.7}
        else:
            analysis['temperature'] = {'status': 'unsuitable', 'score': 0.3}
        
        # Rainfall analysis
        rain_min, rain_max = crop_info['rainfall_range']
        if rain_min <= rainfall <= rain_max:
            analysis['rainfall'] = {'status': 'optimal', 'score': 1.0}
        elif rain_min * 0.8 <= rainfall < rain_min or rain_max < rainfall <= rain_max * 1.2:
            analysis['rainfall'] = {'status': 'acceptable', 'score': 0.7}
        else:
            analysis['rainfall'] = {'status': 'unsuitable', 'score': 0.3}
        
        # Humidity analysis
        humidity_min, humidity_max = crop_info['humidity_range']
        if humidity_min <= humidity <= humidity_max:
            analysis['humidity'] = {'status': 'optimal', 'score': 1.0}
        elif humidity_min - 10 <= humidity < humidity_min or humidity_max < humidity <= humidity_max + 10:
            analysis['humidity'] = {'status': 'acceptable', 'score': 0.7}
        else:
            analysis['humidity'] = {'status': 'unsuitable', 'score': 0.3}
        
        # pH analysis
        ph_min, ph_max = crop_info['soil_ph_range']
        if ph_min <= ph <= ph_max:
            analysis['soil_ph'] = {'status': 'optimal', 'score': 1.0}
        elif ph_min - 0.5 <= ph < ph_min or ph_max < ph <= ph_max + 0.5:
            analysis['soil_ph'] = {'status': 'acceptable', 'score': 0.7}
        else:
            analysis['soil_ph'] = {'status': 'unsuitable', 'score': 0.3}
        
        # Overall suitability
        overall_score = np.mean([analysis[key]['score'] for key in analysis])
        analysis['overall'] = {
            'score': float(overall_score),
            'level': 'عالية' if overall_score >= 0.8 else 'متوسطة' if overall_score >= 0.6 else 'منخفضة'
        }
        
        return analysis
    
    def _analyze_climate_conditions(self, climate_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze overall climate conditions"""
        analysis = {}
        
        temp = climate_data.get('temperature', 20)
        rainfall = climate_data.get('annual_rainfall', 500)
        humidity = climate_data.get('humidity', 60)
        
        # Climate classification
        if temp > 30 and rainfall < 300:
            climate_type = 'صحراوي حار'
        elif temp > 25 and 300 <= rainfall < 800:
            climate_type = 'شبه استوائي جاف'
        elif temp > 25 and rainfall >= 800:
            climate_type = 'استوائي'
        elif 15 <= temp <= 25 and 400 <= rainfall <= 1000:
            climate_type = 'معتدل'
        elif temp < 15 and rainfall > 600:
            climate_type = 'بارد رطب'
        else:
            climate_type = 'متنوع'
        
        analysis['climate_type'] = climate_type
        
        # Growing season assessment
        if temp >= 25:
            analysis['primary_season'] = 'صيفي'
        elif 15 <= temp < 25:
            analysis['primary_season'] = 'ربيعي/خريفي'
        else:
            analysis['primary_season'] = 'شتوي'
        
        # Water availability
        if rainfall < 300:
            analysis['water_status'] = 'نقص في المياه - ري مكثف مطلوب'
        elif 300 <= rainfall < 600:
            analysis['water_status'] = 'ري تكميلي مطلوب'
        elif 600 <= rainfall < 1200:
            analysis['water_status'] = 'كافي مع ري محدود'
        else:
            analysis['water_status'] = 'وفرة في المياه - انتبه للصرف'
        
        return analysis
    
    def _get_seasonal_recommendations(self, current_month: int, 
                                    suitable_crops: List[Dict]) -> Dict[str, Any]:
        """Get seasonal planting recommendations"""
        recommendations = {
            'current_month_crops': [],
            'next_season_crops': [],
            'year_round_crops': []
        }
        
        for crop in suitable_crops:
            crop_info = self.crop_database[crop['crop']]
            season_months = crop_info['season_months']
            
            if current_month in season_months:
                recommendations['current_month_crops'].append({
                    'crop': crop['name_ar'],
                    'english_name': crop['crop'],
                    'timing': 'مناسب للزراعة الآن',
                    'suitability_score': crop['suitability_score']
                })
            elif crop_info['growing_season'] == 'perennial':
                recommendations['year_round_crops'].append({
                    'crop': crop['name_ar'],
                    'english_name': crop['crop'],
                    'timing': 'يمكن زراعته على مد��ر السنة',
                    'suitability_score': crop['suitability_score']
                })
            else:
                # Find next suitable month
                next_months = [m for m in season_months if m > current_month]
                if not next_months:
                    next_months = season_months  # Next year
                
                next_month = min(next_months)
                recommendations['next_season_crops'].append({
                    'crop': crop['name_ar'],
                    'english_name': crop['crop'],
                    'timing': f'مناسب للزراعة في الشهر {next_month}',
                    'suitability_score': crop['suitability_score']
                })
        
        return recommendations
    
    def get_crop_requirements(self, crop_name: str) -> Dict[str, Any]:
        """Get detailed requirements for a specific crop"""
        if crop_name not in self.crop_database:
            raise ValueError(f"Crop {crop_name} not found in database")
        
        crop_info = self.crop_database[crop_name]
        
        return {
            'crop': crop_name,
            'name_ar': crop_info['name_ar'],
            'climate_requirements': {
                'temperature_range': crop_info['temp_range'],
                'rainfall_range': crop_info['rainfall_range'],
                'humidity_range': crop_info['humidity_range'],
                'soil_ph_range': crop_info['soil_ph_range']
            },
            'growing_info': {
                'growing_season': crop_info['growing_season'],
                'suitable_months': crop_info['season_months'],
                'water_requirement': crop_info['water_requirement'],
                'suitable_soil_types': crop_info['soil_types']
            }
        }

# Factory function
def create_climate_crop_matcher() -> ClimateCropMatcher:
    """Create and return a ClimateCropMatcher instance"""
    return ClimateCropMatcher()
