"""
SoilAnalyzerAI - Advanced Soil Analysis using Machine Learning
Analyzes soil properties: pH, nitrogen, phosphorus, potassium, organic matter, moisture, salinity
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from typing import Dict, List, Tuple, Any
import joblib
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class SoilAnalyzerAI:
    """AI model for comprehensive soil analysis"""
    
    def __init__(self):
        self.property_models = {}
        self.classification_model = None
        self.scaler = StandardScaler()
        self.is_trained = False
        
        # Soil property ranges for validation
        self.property_ranges = {
            'ph': (3.0, 10.0),
            'nitrogen': (0.0, 500.0),  # mg/kg
            'phosphorus': (0.0, 200.0),  # mg/kg
            'potassium': (0.0, 1000.0),  # mg/kg
            'organic_matter': (0.0, 20.0),  # %
            'moisture': (0.0, 100.0),  # %
            'salinity': (0.0, 20.0),  # dS/m
            'temperature': (-10.0, 50.0)  # °C
        }
        
        # Soil classifications
        self.soil_classes = [
            'Sandy', 'Loamy', 'Clay', 'Silty', 'Peaty', 'Chalky'
        ]
        
        self._initialize_models()
    
    def _initialize_models(self):
        """Initialize pre-trained models with synthetic data"""
        try:
            # Create synthetic training data for demonstration
            self._create_synthetic_training_data()
            logger.info("SoilAnalyzerAI initialized with synthetic models")
        except Exception as e:
            logger.error(f"Error initializing SoilAnalyzerAI: {e}")
    
    def _create_synthetic_training_data(self):
        """Create synthetic training data for model demonstration"""
        np.random.seed(42)
        n_samples = 1000
        
        # Generate synthetic soil data
        data = {
            'ph': np.random.normal(6.5, 1.2, n_samples),
            'nitrogen': np.random.gamma(2, 50, n_samples),
            'phosphorus': np.random.gamma(2, 20, n_samples),
            'potassium': np.random.gamma(2, 100, n_samples),
            'organic_matter': np.random.gamma(2, 2, n_samples),
            'moisture': np.random.beta(2, 2, n_samples) * 100,
            'salinity': np.random.gamma(1, 2, n_samples),
            'temperature': np.random.normal(20, 8, n_samples)
        }
        
        # Clip values to realistic ranges
        for prop, (min_val, max_val) in self.property_ranges.items():
            data[prop] = np.clip(data[prop], min_val, max_val)
        
        df = pd.DataFrame(data)
        
        # Create soil type classifications based on properties
        soil_types = []
        for _, row in df.iterrows():
            if row['ph'] < 5.5 and row['organic_matter'] > 8:
                soil_types.append('Peaty')
            elif row['ph'] > 7.5 and row['nitrogen'] < 30:
                soil_types.append('Chalky')
            elif row['moisture'] < 20 and row['organic_matter'] < 2:
                soil_types.append('Sandy')
            elif row['moisture'] > 60 and row['nitrogen'] > 80:
                soil_types.append('Clay')
            elif 5.5 <= row['ph'] <= 7.0 and 3 <= row['organic_matter'] <= 6:
                soil_types.append('Loamy')
            else:
                soil_types.append('Silty')
        
        df['soil_type'] = soil_types
        
        # Train models
        features = ['ph', 'nitrogen', 'phosphorus', 'potassium', 'organic_matter', 'moisture', 'salinity', 'temperature']
        X = df[features].values
        X_scaled = self.scaler.fit_transform(X)
        
        # Train classification model
        self.classification_model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.classification_model.fit(X_scaled, df['soil_type'])
        
        # Train property prediction models
        for prop in features:
            if prop in self.property_ranges:
                model = RandomForestRegressor(n_estimators=100, random_state=42)
                y = df[prop].values
                model.fit(X_scaled, y)
                self.property_models[prop] = model
        
        self.is_trained = True
        logger.info("Synthetic soil analysis models trained successfully")
    
    def analyze_soil_properties(self, sensor_data: Dict[str, float]) -> Dict[str, Any]:
        """Analyze soil properties from sensor data"""
        try:
            if not self.is_trained:
                raise ValueError("Models not trained")
            
            # Validate input data
            validated_data = self._validate_input_data(sensor_data)
            
            # Prepare features
            features = ['ph', 'nitrogen', 'phosphorus', 'potassium', 'organic_matter', 'moisture', 'salinity', 'temperature']
            X = np.array([validated_data.get(f, 0.0) for f in features]).reshape(1, -1)
            X_scaled = self.scaler.transform(X)
            
            # Predict soil type
            soil_type_pred = self.classification_model.predict(X_scaled)[0]
            soil_type_proba = max(self.classification_model.predict_proba(X_scaled)[0])
            
            # Analyze individual properties
            property_analysis = {}
            for prop in features:
                if prop in self.property_models:
                    predicted_val = self.property_models[prop].predict(X_scaled)[0]
                    current_val = validated_data.get(prop, predicted_val)
                    
                    property_analysis[prop] = {
                        'current_value': float(current_val),
                        'predicted_optimal': float(predicted_val),
                        'status': self._assess_property_status(prop, current_val),
                        'recommendations': self._get_property_recommendations(prop, current_val)
                    }
            
            # Overall soil health score
            health_score = self._calculate_soil_health_score(validated_data)
            
            # Fertility assessment
            fertility_level = self._assess_fertility_level(validated_data)
            
            return {
                'soil_type': {
                    'classification': soil_type_pred,
                    'confidence': float(soil_type_proba)
                },
                'properties': property_analysis,
                'health_score': float(health_score),
                'fertility_level': fertility_level,
                'overall_recommendations': self._get_overall_recommendations(validated_data, soil_type_pred),
                'analysis_timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error in soil analysis: {e}")
            raise
    
    def _validate_input_data(self, data: Dict[str, float]) -> Dict[str, float]:
        """Validate and clean input sensor data"""
        validated = {}
        for prop, value in data.items():
            if prop in self.property_ranges:
                min_val, max_val = self.property_ranges[prop]
                validated[prop] = max(min_val, min(max_val, float(value)))
            else:
                validated[prop] = float(value)
        return validated
    
    def _assess_property_status(self, property_name: str, value: float) -> str:
        """Assess the status of a soil property"""
        if property_name == 'ph':
            if 6.0 <= value <= 7.0:
                return 'optimal'
            elif 5.5 <= value < 6.0 or 7.0 < value <= 7.5:
                return 'acceptable'
            else:
                return 'needs_attention'
        
        elif property_name == 'nitrogen':
            if value >= 50:
                return 'optimal'
            elif value >= 25:
                return 'acceptable'
            else:
                return 'needs_attention'
        
        elif property_name == 'phosphorus':
            if value >= 20:
                return 'optimal'
            elif value >= 10:
                return 'acceptable'
            else:
                return 'needs_attention'
        
        elif property_name == 'potassium':
            if value >= 100:
                return 'optimal'
            elif value >= 50:
                return 'acceptable'
            else:
                return 'needs_attention'
        
        elif property_name == 'organic_matter':
            if value >= 3.0:
                return 'optimal'
            elif value >= 1.5:
                return 'acceptable'
            else:
                return 'needs_attention'
        
        elif property_name == 'moisture':
            if 40 <= value <= 70:
                return 'optimal'
            elif 20 <= value < 40 or 70 < value <= 85:
                return 'acceptable'
            else:
                return 'needs_attention'
        
        elif property_name == 'salinity':
            if value <= 2.0:
                return 'optimal'
            elif value <= 4.0:
                return 'acceptable'
            else:
                return 'needs_attention'
        
        return 'unknown'
    
    def _get_property_recommendations(self, property_name: str, value: float) -> List[str]:
        """Get recommendations for improving a specific soil property"""
        recommendations = []
        
        if property_name == 'ph':
            if value < 6.0:
                recommendations.extend([
                    'إضافة الجير الزراعي لرفع درجة الحموضة',
                    'استخدام الأسمدة القلوية',
                    'إضافة المواد العضوية المتحللة'
                ])
            elif value > 7.5:
                recommendations.extend([
                    'إضافة الكبريت الزراعي لخفض درجة القلوية',
                    'استخدام الأسمدة الحمضية',
                    'تحسين التهوية والصرف'
                ])
        
        elif property_name == 'nitrogen' and value < 50:
            recommendations.extend([
                'إضافة الأسمدة النيتروجينية (يوريا، نترات الأمونيوم)',
                'زراعة المحاصيل البقولية لتثبيت النيتروجين',
                'إضافة السماد العضوي والكمبوست'
            ])
        
        elif property_name == 'phosphorus' and value < 20:
            recommendations.extend([
                'إضافة السوبر فوسفات',
                'استخدام صخر الفوسفات',
                'تحسين درجة حمو��ة التربة لزيادة توفر الفوسفور'
            ])
        
        elif property_name == 'potassium' and value < 100:
            recommendations.extend([
                'إضافة كلوريد البوتاسيوم أو كبريتات البوتاسيوم',
                'استخدام الرماد النباتي',
                'إضافة السماد العضوي الغني بالبوتاسيوم'
            ])
        
        elif property_name == 'organic_matter' and value < 3.0:
            recommendations.extend([
                'إضافة الكمبوست والسماد العضوي',
                'زراعة المحاصيل الغطائية',
                'تقليل الحراثة العميقة للحفاظ على المادة العضوية'
            ])
        
        elif property_name == 'moisture':
            if value < 40:
                recommendations.extend([
                    'تحسين نظام الري',
                    'إضافة المواد المحتفظة بالماء',
                    'استخدام المهاد العضوي'
                ])
            elif value > 70:
                recommendations.extend([
                    'تحسين نظام الصرف',
                    'تقليل معدل ال��ي',
                    'إضافة المواد المحسنة للصرف'
                ])
        
        elif property_name == 'salinity' and value > 2.0:
            recommendations.extend([
                'تحسين نظام الصرف',
                'الري بالماء العذب لغسل الأملاح',
                'زراعة النباتات المقاومة للملوحة'
            ])
        
        return recommendations
    
    def _calculate_soil_health_score(self, data: Dict[str, float]) -> float:
        """Calculate overall soil health score (0-100)"""
        scores = []
        
        # pH score
        ph = data.get('ph', 7.0)
        if 6.0 <= ph <= 7.0:
            ph_score = 100
        elif 5.5 <= ph < 6.0 or 7.0 < ph <= 7.5:
            ph_score = 80
        elif 5.0 <= ph < 5.5 or 7.5 < ph <= 8.0:
            ph_score = 60
        else:
            ph_score = 40
        scores.append(ph_score)
        
        # Nutrient scores
        nitrogen = data.get('nitrogen', 0)
        nitrogen_score = min(100, (nitrogen / 100) * 100)
        scores.append(nitrogen_score)
        
        phosphorus = data.get('phosphorus', 0)
        phosphorus_score = min(100, (phosphorus / 50) * 100)
        scores.append(phosphorus_score)
        
        potassium = data.get('potassium', 0)
        potassium_score = min(100, (potassium / 200) * 100)
        scores.append(potassium_score)
        
        # Organic matter score
        organic_matter = data.get('organic_matter', 0)
        organic_score = min(100, (organic_matter / 5) * 100)
        scores.append(organic_score)
        
        # Moisture score
        moisture = data.get('moisture', 50)
        if 40 <= moisture <= 70:
            moisture_score = 100
        elif 20 <= moisture < 40 or 70 < moisture <= 85:
            moisture_score = 80
        else:
            moisture_score = 50
        scores.append(moisture_score)
        
        # Salinity score (inverse - lower salinity is better)
        salinity = data.get('salinity', 1)
        if salinity <= 2:
            salinity_score = 100
        elif salinity <= 4:
            salinity_score = 70
        elif salinity <= 8:
            salinity_score = 40
        else:
            salinity_score = 20
        scores.append(salinity_score)
        
        return sum(scores) / len(scores)
    
    def _assess_fertility_level(self, data: Dict[str, float]) -> str:
        """Assess overall fertility level"""
        health_score = self._calculate_soil_health_score(data)
        
        if health_score >= 80:
            return 'عالية'
        elif health_score >= 60:
            return 'متوسطة'
        elif health_score >= 40:
            return 'منخفضة'
        else:
            return 'ضعيفة جداً'
    
    def _get_overall_recommendations(self, data: Dict[str, float], soil_type: str) -> List[str]:
        """Get overall soil improvement recommendations"""
        recommendations = []
        health_score = self._calculate_soil_health_score(data)
        
        if health_score < 60:
            recommendations.append('ضرورة تحسين خصوبة التربة بشكل شامل')
        
        # Soil type specific recommendations
        if soil_type == 'Sandy':
            recommendations.extend([
                'إضافة المواد العضوية لتحسين قدرة الاحتفاظ بالماء',
                'استخدام الأسمدة بطيئة الإطلاق',
                'الري المتكرر بكميات قليلة'
            ])
        elif soil_type == 'Clay':
            recommendations.extend([
                'تحسين الصرف والتهوية',
                'إضافة الرمل والمواد العضوية',
                'تجنب الري المفرط'
            ])
        elif soil_type == 'Peaty':
            recommendations.extend([
                'إضافة الجير لتحسين درجة الحموضة',
                'تحسين نظام الصرف',
                'إضافة العناصر المعدنية'
            ])
        
        return recommendations

# Factory function
def create_soil_analyzer() -> SoilAnalyzerAI:
    """Create and return a SoilAnalyzerAI instance"""
    return SoilAnalyzerAI()
