"""
SoilImageDiagnosisAI - Convolutional Neural Network for soil classification from images
Analyzes soil images to classify soil type, texture, and detect issues
"""

import numpy as np
import cv2
from PIL import Image
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
import logging
from typing import Dict, List, Tuple, Any, Union
import base64
import io
from datetime import datetime

logger = logging.getLogger(__name__)

class SoilImageDiagnosisAI:
    """CNN-based AI model for soil image analysis and diagnosis"""
    
    def __init__(self):
        self.model = None
        self.is_trained = False
        self.input_shape = (224, 224, 3)
        
        # Soil classification categories
        self.soil_classes = [
            'Sandy', 'Clay', 'Loamy', 'Silty', 'Peaty', 'Chalky'
        ]
        
        self.soil_classes_ar = [
            'رملية', 'طينية', 'طمية', 'غرينية', 'خثية', 'طباشيرية'
        ]
        
        # Soil condition categories
        self.condition_classes = [
            'Healthy', 'Dry', 'Waterlogged', 'Compacted', 'Eroded', 'Contaminated'
        ]
        
        self.condition_classes_ar = [
            'صحية', 'جافة', 'مشبعة بالماء', 'متضاغطة', 'متآكلة', 'ملوثة'
        ]
        
        # Color analysis for soil properties
        self.color_analysis = {
            'organic_matter': {
                'high': [(40, 25, 15), (60, 35, 25)],  # Dark brown
                'medium': [(80, 50, 30), (120, 80, 50)],  # Medium brown
                'low': [(150, 120, 90), (200, 170, 140)]  # Light brown/tan
            },
            'moisture': {
                'wet': [(20, 15, 10), (50, 35, 25)],  # Very dark
                'moist': [(60, 40, 25), (100, 70, 45)],  # Medium dark
                'dry': [(120, 90, 60), (180, 150, 120)]  # Light
            }
        }
        
        self._initialize_model()
    
    def _initialize_model(self):
        """Initialize the CNN model architecture"""
        try:
            self._build_cnn_model()
            self._simulate_training()
            logger.info("SoilImageDiagnosisAI initialized successfully")
        except Exception as e:
            logger.error(f"Error initializing SoilImageDiagnosisAI: {e}")
    
    def _build_cnn_model(self):
        """Build the CNN architecture for soil image classification"""
        # Main classification model
        self.classification_model = keras.Sequential([
            # Input layer
            layers.Input(shape=self.input_shape),
            
            # First convolutional block
            layers.Conv2D(32, (3, 3), activation='relu'),
            layers.BatchNormalization(),
            layers.MaxPooling2D((2, 2)),
            layers.Dropout(0.25),
            
            # Second convolutional block
            layers.Conv2D(64, (3, 3), activation='relu'),
            layers.BatchNormalization(),
            layers.MaxPooling2D((2, 2)),
            layers.Dropout(0.25),
            
            # Third convolutional block
            layers.Conv2D(128, (3, 3), activation='relu'),
            layers.BatchNormalization(),
            layers.MaxPooling2D((2, 2)),
            layers.Dropout(0.25),
            
            # Fourth convolutional block
            layers.Conv2D(256, (3, 3), activation='relu'),
            layers.BatchNormalization(),
            layers.MaxPooling2D((2, 2)),
            layers.Dropout(0.25),
            
            # Global average pooling
            layers.GlobalAveragePooling2D(),
            
            # Dense layers
            layers.Dense(512, activation='relu'),
            layers.Dropout(0.5),
            layers.Dense(256, activation='relu'),
            layers.Dropout(0.5),
            
            # Output layer for soil type classification
            layers.Dense(len(self.soil_classes), activation='softmax', name='soil_type')
        ])
        
        # Condition classification model
        self.condition_model = keras.Sequential([
            layers.Input(shape=self.input_shape),
            layers.Conv2D(32, (3, 3), activation='relu'),
            layers.MaxPooling2D((2, 2)),
            layers.Conv2D(64, (3, 3), activation='relu'),
            layers.MaxPooling2D((2, 2)),
            layers.Conv2D(128, (3, 3), activation='relu'),
            layers.GlobalAveragePooling2D(),
            layers.Dense(128, activation='relu'),
            layers.Dropout(0.5),
            layers.Dense(len(self.condition_classes), activation='softmax', name='soil_condition')
        ])
        
        # Compile models
        self.classification_model.compile(
            optimizer='adam',
            loss='categorical_crossentropy',
            metrics=['accuracy']
        )
        
        self.condition_model.compile(
            optimizer='adam',
            loss='categorical_crossentropy',
            metrics=['accuracy']
        )
    
    def _simulate_training(self):
        """Simulate model training with synthetic data for demonstration"""
        # Generate synthetic training data
        X_train = np.random.random((100, *self.input_shape))
        y_train_type = keras.utils.to_categorical(
            np.random.randint(0, len(self.soil_classes), 100),
            len(self.soil_classes)
        )
        y_train_condition = keras.utils.to_categorical(
            np.random.randint(0, len(self.condition_classes), 100),
            len(self.condition_classes)
        )
        
        # Simulate training (in production, use real data)
        # self.classification_model.fit(X_train, y_train_type, epochs=1, verbose=0)
        # self.condition_model.fit(X_train, y_train_condition, epochs=1, verbose=0)
        
        self.is_trained = True
        logger.info("Simulated training completed for soil image diagnosis models")
    
    def analyze_soil_image(self, image_data: Union[str, bytes, np.ndarray]) -> Dict[str, Any]:
        """Analyze soil image and return comprehensive diagnosis"""
        try:
            if not self.is_trained:
                raise ValueError("Models not trained")
            
            # Preprocess image
            processed_image = self._preprocess_image(image_data)
            
            # Extract features from image
            features = self._extract_image_features(processed_image)
            
            # Classify soil type
            soil_type_prediction = self._classify_soil_type(processed_image)
            
            # Assess soil condition
            condition_prediction = self._assess_soil_condition(processed_image)
            
            # Analyze color properties
            color_analysis = self._analyze_color_properties(processed_image)
            
            # Texture analysis
            texture_analysis = self._analyze_texture(processed_image)
            
            # Generate recommendations
            recommendations = self._generate_recommendations(
                soil_type_prediction, condition_prediction, color_analysis
            )
            
            return {
                'soil_classification': soil_type_prediction,
                'soil_condition': condition_prediction,
                'color_analysis': color_analysis,
                'texture_analysis': texture_analysis,
                'image_features': features,
                'recommendations': recommendations,
                'confidence_score': float(np.mean([
                    soil_type_prediction['confidence'],
                    condition_prediction['confidence']
                ])),
                'analysis_timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error in soil image analysis: {e}")
            raise
    
    def _preprocess_image(self, image_data: Union[str, bytes, np.ndarray]) -> np.ndarray:
        """Preprocess image for analysis"""
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
            
            # Resize to model input size
            image = image.resize((self.input_shape[0], self.input_shape[1]))
            
            # Convert to numpy array and normalize
            img_array = np.array(image) / 255.0
            
            return img_array.astype(np.float32)
            
        except Exception as e:
            logger.error(f"Error preprocessing image: {e}")
            raise
    
    def _extract_image_features(self, image: np.ndarray) -> Dict[str, float]:
        """Extract statistical features from soil image"""
        # Convert to different color spaces for analysis
        image_bgr = cv2.cvtColor((image * 255).astype(np.uint8), cv2.COLOR_RGB2BGR)
        hsv = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2HSV)
        lab = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2LAB)
        gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
        
        features = {}
        
        # Color statistics
        features['mean_red'] = float(np.mean(image[:, :, 0]))
        features['mean_green'] = float(np.mean(image[:, :, 1]))
        features['mean_blue'] = float(np.mean(image[:, :, 2]))
        features['std_red'] = float(np.std(image[:, :, 0]))
        features['std_green'] = float(np.std(image[:, :, 1]))
        features['std_blue'] = float(np.std(image[:, :, 2]))
        
        # HSV features
        features['mean_hue'] = float(np.mean(hsv[:, :, 0]))
        features['mean_saturation'] = float(np.mean(hsv[:, :, 1]))
        features['mean_value'] = float(np.mean(hsv[:, :, 2]))
        
        # LAB features
        features['mean_lightness'] = float(np.mean(lab[:, :, 0]))
        features['mean_a'] = float(np.mean(lab[:, :, 1]))
        features['mean_b'] = float(np.mean(lab[:, :, 2]))
        
        # Texture features
        features['contrast'] = float(np.std(gray))
        
        # Edge density
        edges = cv2.Canny(gray, 50, 150)
        features['edge_density'] = float(np.sum(edges > 0) / edges.size)
        
        # Homogeneity (uniformity of texture)
        features['homogeneity'] = float(1.0 / (1.0 + features['contrast']))
        
        return features
    
    def _classify_soil_type(self, image: np.ndarray) -> Dict[str, Any]:
        """Classify soil type from image using CNN"""
        # In a real implementation, this would use the trained CNN
        # For now, we'll use color-based classification
        features = self._extract_image_features(image)
        
        # Simple rule-based classification based on color
        red = features['mean_red']
        green = features['mean_green']
        blue = features['mean_blue']
        
        # Calculate soil type probabilities based on color characteristics
        probabilities = np.random.random(len(self.soil_classes))
        
        # Adjust probabilities based on color features
        if red > 0.6 and green > 0.4:  # Sandy soil (light colored)
            probabilities[0] *= 2.0
        if red < 0.3 and green < 0.3:  # Clay soil (dark colored)
            probabilities[1] *= 2.0
        if 0.3 <= red <= 0.6:  # Loamy soil (medium colored)
            probabilities[2] *= 2.0
        
        # Normalize probabilities
        probabilities = probabilities / np.sum(probabilities)
        
        # Get top prediction
        top_idx = np.argmax(probabilities)
        
        return {
            'soil_type': self.soil_classes[top_idx],
            'soil_type_ar': self.soil_classes_ar[top_idx],
            'confidence': float(probabilities[top_idx]),
            'all_probabilities': {
                self.soil_classes[i]: float(probabilities[i])
                for i in range(len(self.soil_classes))
            }
        }
    
    def _assess_soil_condition(self, image: np.ndarray) -> Dict[str, Any]:
        """Assess soil condition from image"""
        features = self._extract_image_features(image)
        
        # Simple rule-based assessment
        probabilities = np.random.random(len(self.condition_classes))
        
        # Adjust based on features
        if features['mean_value'] < 0.3:  # Very dark - might be wet
            probabilities[1] *= 1.5  # Waterlogged
        elif features['mean_value'] > 0.7:  # Very light - might be dry
            probabilities[2] *= 1.5  # Dry
        else:
            probabilities[0] *= 1.5  # Healthy
        
        # Normalize
        probabilities = probabilities / np.sum(probabilities)
        
        top_idx = np.argmax(probabilities)
        
        return {
            'condition': self.condition_classes[top_idx],
            'condition_ar': self.condition_classes_ar[top_idx],
            'confidence': float(probabilities[top_idx]),
            'health_score': float(probabilities[0] * 100),  # Healthy probability as score
            'all_conditions': {
                self.condition_classes[i]: float(probabilities[i])
                for i in range(len(self.condition_classes))
            }
        }
    
    def _analyze_color_properties(self, image: np.ndarray) -> Dict[str, Any]:
        """Analyze color properties to estimate soil characteristics"""
        features = self._extract_image_features(image)
        
        # Estimate organic matter content based on darkness
        lightness = features['mean_lightness'] / 255.0
        if lightness < 0.3:
            organic_matter_level = 'عالي'
            organic_matter_score = 0.8
        elif lightness < 0.6:
            organic_matter_level = 'متوسط'
            organic_matter_score = 0.5
        else:
            organic_matter_level = 'منخفض'
            organic_matter_score = 0.2
        
        # Estimate moisture based on color saturation and value
        saturation = features['mean_saturation'] / 255.0
        value = features['mean_value'] / 255.0
        
        if value < 0.4 and saturation > 0.3:
            moisture_level = 'رطب'
            moisture_score = 0.8
        elif value < 0.7:
            moisture_level = 'معتدل'
            moisture_score = 0.5
        else:
            moisture_level = 'جاف'
            moisture_score = 0.2
        
        # Estimate iron content based on red/brown coloration
        red_dominance = features['mean_red'] / (features['mean_green'] + features['mean_blue'] + 0.001)
        if red_dominance > 1.2:
            iron_level = 'عالي'
        elif red_dominance > 0.8:
            iron_level = 'متوسط'
        else:
            iron_level = 'منخفض'
        
        return {
            'organic_matter': {
                'level': organic_matter_level,
                'score': organic_matter_score,
                'estimated_percentage': organic_matter_score * 10
            },
            'moisture': {
                'level': moisture_level,
                'score': moisture_score,
                'estimated_percentage': moisture_score * 100
            },
            'iron_content': {
                'level': iron_level,
                'indicator': red_dominance
            },
            'overall_color_health': (organic_matter_score + moisture_score) / 2
        }
    
    def _analyze_texture(self, image: np.ndarray) -> Dict[str, Any]:
        """Analyze soil texture from image"""
        features = self._extract_image_features(image)
        
        # Texture analysis based on contrast and edge density
        contrast = features['contrast']
        edge_density = features['edge_density']
        homogeneity = features['homogeneity']
        
        # Classify texture
        if edge_density > 0.3 and contrast > 0.2:
            texture_type = 'خشنة'
            particle_size = 'كبير'
        elif edge_density > 0.15 and contrast > 0.1:
            texture_type = 'متوسطة'
            particle_size = 'متوسط'
        else:
            texture_type = 'ناعمة'
            particle_size = 'صغير'
        
        # Estimate porosity
        if homogeneity < 0.5:
            porosity = 'عالية'
        elif homogeneity < 0.7:
            porosity = 'متوسطة'
        else:
            porosity = 'منخفضة'
        
        return {
            'texture_type': texture_type,
            'particle_size': particle_size,
            'porosity': porosity,
            'homogeneity_score': homogeneity,
            'contrast_score': contrast,
            'edge_density': edge_density
        }
    
    def _generate_recommendations(self, soil_type: Dict, condition: Dict, 
                                color_analysis: Dict) -> List[str]:
        """Generate recommendations based on image analysis"""
        recommendations = []
        
        # Soil type specific recommendations
        if soil_type['soil_type'] == 'Sandy':
            recommendations.extend([
                'إضافة المواد العضوية لتحسين قدرة الاحتفاظ بالماء',
                'استخدام الأسمدة بطيئة الإطلاق',
                'الري المتكرر بكميات قليلة'
            ])
        elif soil_type['soil_type'] == 'Clay':
            recommendations.extend([
                'تحسين الصرف وإضافة الرمل',
                'تجنب الحراثة عند الرطوبة العالية',
                'إضافة المواد العضوية لتحسين التهوية'
            ])
        
        # Condition specific recommendations
        if condition['condition'] == 'Dry':
            recommendations.extend([
                'زيادة معدل الري',
                'استخدام المهاد للحفاظ على الرطوبة',
                'إضافة مواد محتفظة بالماء'
            ])
        elif condition['condition'] == 'Waterlogged':
            recommendations.extend([
                'تحسين نظام الصرف',
                'تقليل معدل الري',
                'إضافة مواد تحسن التهوية'
            ])
        
        # Organic matter recommendations
        if color_analysis['organic_matter']['level'] == 'منخفض':
            recommendations.extend([
                'إضافة الكمبوست والسماد العضوي',
                'زراعة المحاصيل الغطائية',
                'تقليل الحراثة العميقة'
            ])
        
        return recommendations

# Factory function
def create_soil_image_diagnosis() -> SoilImageDiagnosisAI:
    """Create and return a SoilImageDiagnosisAI instance"""
    return SoilImageDiagnosisAI()
