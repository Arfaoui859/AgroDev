"""
LeafScanAI - Advanced leaf analysis and scanning system
Specialized in analyzing leaf health, nutrition status, and growth patterns
"""

import numpy as np
import cv2
from PIL import Image
import tensorflow as tf
from tensorflow import keras
from typing import Dict, List, Tuple, Any, Union, Optional
import base64
import io
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class LeafScanAI:
    """AI system for comprehensive leaf analysis and health assessment"""
    
    def __init__(self):
        self.nutrition_model = None
        self.growth_model = None
        self.leaf_health_model = None
        self.is_trained = False
        self.input_shape = (224, 224, 3)
        
        # Nutritional deficiency database
        self.nutrition_deficiencies = {
            'nitrogen_deficiency': {
                'name_ar': 'نقص النيتروجين',
                'symptoms': 'اصفرار الأوراق القديمة من الأسفل للأعلى',
                'color_indicators': {'yellow_dominance': True, 'green_reduction': True},
                'severity_stages': ['طفيف', 'متوسط', 'شديد', 'حرج'],
                'treatment': [
                    'إضافة أسمدة نيتروجينية سريعة المفعول',
                    'استخدام اليوريا أو نترات الأمونيوم',
                    'تطبيق التسميد الورقي'
                ],
                'recovery_time': '7-14 يوم'
            },
            'phosphorus_deficiency': {
                'name_ar': 'نقص الفوسفور',
                'symptoms': 'تلون أرجواني أو بنفسجي للأوراق خاصة السيقان',
                'color_indicators': {'purple_tint': True, 'dark_veins': True},
                'severity_stages': ['طفيف', 'متوسط', 'شديد', 'حرج'],
                'treatment': [
                    'إضافة سوبر فوسفات',
                    'استخدام الفوسفات الصخري',
                    'تحسين درجة حموضة التربة'
                ],
                'recovery_time': '14-21 يوم'
            },
            'potassium_deficiency': {
                'name_ar': 'نقص البوتاسيوم',
                'symptoms': 'اصفرار وحرق حواف الأوراق',
                'color_indicators': {'edge_burn': True, 'yellowing_margins': True},
                'severity_stages': ['طفيف', 'متوسط', 'شديد', 'حرج'],
                'treatment': [
                    'إضافة كبريتات البوتاسيوم',
                    'استخدام كلوريد البوتاسيوم',
                    'رش ورقي بمحلول البوتاسيوم'
                ],
                'recovery_time': '10-18 يوم'
            },
            'iron_deficiency': {
                'name_ar': 'نقص الحديد',
                'symptoms': 'اصفرار بين العروق مع بقاء العروق خضراء',
                'color_indicators': {'interveinal_chlorosis': True, 'green_veins': True},
                'severity_stages': ['طفيف', 'متوسط', 'شديد', 'حرج'],
                'treatment': [
                    'رش كلوريد الحديد على الأوراق',
                    'إضافة كب��يتات الحديد للتربة',
                    'تحسين تصريف التربة'
                ],
                'recovery_time': '5-10 أيام'
            },
            'magnesium_deficiency': {
                'name_ar': 'نقص المغنيسيوم',
                'symptoms': 'اصفرار بين العروق في الأوراق القديمة',
                'color_indicators': {'old_leaf_yellowing': True, 'vein_contrast': True},
                'severity_stages': ['طفيف', 'متوسط', 'شديد', 'حرج'],
                'treatment': [
                    'رش كبريتات المغنيسيوم',
                    'إضافة الدولوميت للتربة',
                    'تحسين توازن الكالسيوم والمغنيسيوم'
                ],
                'recovery_time': '7-14 يوم'
            },
            'calcium_deficiency': {
                'name_ar': 'نقص الكالسيوم',
                'symptoms': 'تشوه الأوراق الجديدة وموت الأطراف النامية',
                'color_indicators': {'tip_burn': True, 'deformed_growth': True},
                'severity_stages': ['طفيف', 'متوسط', 'شديد', 'حرج'],
                'treatment': [
                    'إضافة الجير الز��اعي',
                    'رش كلوريد الكالسيوم',
                    'تحسين تصريف التربة'
                ],
                'recovery_time': '14-28 يوم'
            },
            'healthy_nutrition': {
                'name_ar': 'تغذية صحية',
                'symptoms': 'لون أخضر منتظم ونمو طبيعي',
                'color_indicators': {'uniform_green': True, 'healthy_growth': True},
                'severity_stages': ['ممتاز'],
                'treatment': ['الحفاظ على برنامج التسميد الحالي'],
                'recovery_time': 'غير مطلوب'
            }
        }
        
        # Growth analysis parameters
        self.growth_parameters = {
            'leaf_size': {'min': 2, 'max': 25, 'unit': 'cm'},
            'leaf_thickness': {'indicator': 'texture_density'},
            'venation_pattern': {'indicator': 'vein_prominence'},
            'surface_texture': {'indicator': 'surface_smoothness'},
            'edge_condition': {'indicator': 'edge_integrity'}
        }
        
        # Health indicators
        self.health_indicators = {
            'color_uniformity': {'weight': 0.25, 'optimal_range': (0.7, 1.0)},
            'surface_integrity': {'weight': 0.20, 'optimal_range': (0.8, 1.0)},
            'size_consistency': {'weight': 0.15, 'optimal_range': (0.6, 1.0)},
            'venation_health': {'weight': 0.20, 'optimal_range': (0.7, 1.0)},
            'edge_condition': {'weight': 0.20, 'optimal_range': (0.8, 1.0)}
        }
        
        self._initialize_models()
    
    def _initialize_models(self):
        """Initialize the leaf analysis models"""
        try:
            self._build_nutrition_analysis_model()
            self._build_growth_assessment_model()
            self._build_health_evaluation_model()
            self._simulate_training()
            logger.info("LeafScanAI initialized successfully")
        except Exception as e:
            logger.error(f"Error initializing LeafScanAI: {e}")
    
    def _build_nutrition_analysis_model(self):
        """Build model for nutritional deficiency detection"""
        self.nutrition_model = keras.Sequential([
            layers.Input(shape=self.input_shape),
            
            # Specialized layers for color analysis
            layers.Conv2D(64, (5, 5), activation='relu'),
            layers.BatchNormalization(),
            layers.MaxPooling2D((2, 2)),
            
            layers.Conv2D(128, (3, 3), activation='relu'),
            layers.BatchNormalization(),
            layers.MaxPooling2D((2, 2)),
            
            layers.Conv2D(256, (3, 3), activation='relu'),
            layers.BatchNormalization(),
            layers.GlobalAveragePooling2D(),
            
            layers.Dense(256, activation='relu'),
            layers.Dropout(0.5),
            layers.Dense(128, activation='relu'),
            layers.Dropout(0.3),
            
            # Output for nutrition classification
            layers.Dense(len(self.nutrition_deficiencies), activation='softmax')
        ])
        
        self.nutrition_model.compile(
            optimizer='adam',
            loss='categorical_crossentropy',
            metrics=['accuracy']
        )
    
    def _build_growth_assessment_model(self):
        """Build model for growth assessment"""
        self.growth_model = keras.Sequential([
            layers.Input(shape=self.input_shape),
            
            layers.Conv2D(32, (7, 7), activation='relu'),
            layers.MaxPooling2D((3, 3)),
            layers.Conv2D(64, (5, 5), activation='relu'),
            layers.MaxPooling2D((2, 2)),
            layers.Conv2D(128, (3, 3), activation='relu'),
            layers.GlobalAveragePooling2D(),
            
            layers.Dense(128, activation='relu'),
            layers.Dropout(0.4),
            
            # Multiple outputs for different growth aspects
            layers.Dense(64, activation='relu'),
            layers.Dense(5, activation='linear', name='growth_metrics')  # 5 growth parameters
        ])
        
        self.growth_model.compile(
            optimizer='adam',
            loss='mse',
            metrics=['mae']
        )
    
    def _build_health_evaluation_model(self):
        """Build model for overall leaf health evaluation"""
        self.leaf_health_model = keras.Sequential([
            layers.Input(shape=self.input_shape),
            
            layers.Conv2D(64, (3, 3), activation='relu'),
            layers.MaxPooling2D((2, 2)),
            layers.Conv2D(128, (3, 3), activation='relu'),
            layers.MaxPooling2D((2, 2)),
            layers.Conv2D(256, (3, 3), activation='relu'),
            layers.GlobalAveragePooling2D(),
            
            layers.Dense(128, activation='relu'),
            layers.Dropout(0.5),
            layers.Dense(64, activation='relu'),
            
            # Health score output (0-100)
            layers.Dense(1, activation='sigmoid', name='health_score')
        ])
        
        self.leaf_health_model.compile(
            optimizer='adam',
            loss='mse',
            metrics=['mae']
        )
    
    def _simulate_training(self):
        """Simulate model training"""
        # Generate synthetic data for demonstration
        X_train = np.random.random((300, *self.input_shape))
        
        # Nutrition labels
        y_nutrition = keras.utils.to_categorical(
            np.random.randint(0, len(self.nutrition_deficiencies), 300),
            len(self.nutrition_deficiencies)
        )
        
        # Growth metrics (5 parameters)
        y_growth = np.random.random((300, 5))
        
        # Health scores (0-1)
        y_health = np.random.random((300, 1))
        
        # Simulate training
        # self.nutrition_model.fit(X_train, y_nutrition, epochs=1, verbose=0)
        # self.growth_model.fit(X_train, y_growth, epochs=1, verbose=0)
        # self.leaf_health_model.fit(X_train, y_health, epochs=1, verbose=0)
        
        self.is_trained = True
        logger.info("Simulated training completed for leaf analysis models")
    
    def analyze_leaf_comprehensive(self, image_data: Union[str, bytes, np.ndarray], 
                                 plant_type: Optional[str] = None,
                                 growth_stage: Optional[str] = None) -> Dict[str, Any]:
        """Comprehensive leaf analysis including nutrition, growth, and health"""
        try:
            if not self.is_trained:
                raise ValueError("Models not trained")
            
            # Preprocess image
            processed_image = self._preprocess_leaf_image(image_data)
            
            # Extract detailed leaf features
            leaf_features = self._extract_comprehensive_leaf_features(processed_image)
            
            # Nutritional analysis
            nutrition_analysis = self._analyze_nutrition_status(processed_image, leaf_features)
            
            # Growth assessment
            growth_analysis = self._assess_leaf_growth(processed_image, leaf_features, growth_stage)
            
            # Health evaluation
            health_evaluation = self._evaluate_leaf_health(processed_image, leaf_features)
            
            # Morphological analysis
            morphology_analysis = self._analyze_leaf_morphology(processed_image)
            
            # Environmental stress detection
            stress_analysis = self._detect_environmental_stress(leaf_features)
            
            # Age and maturity assessment
            maturity_analysis = self._assess_leaf_maturity(leaf_features, growth_stage)
            
            # Photosynthetic capacity estimation
            photosynthesis_analysis = self._estimate_photosynthetic_capacity(leaf_features)
            
            # Generate recommendations
            recommendations = self._generate_leaf_care_recommendations(
                nutrition_analysis, growth_analysis, health_evaluation, stress_analysis
            )
            
            return {
                'leaf_nutrition': nutrition_analysis,
                'growth_assessment': growth_analysis,
                'health_evaluation': health_evaluation,
                'morphology_analysis': morphology_analysis,
                'stress_analysis': stress_analysis,
                'maturity_analysis': maturity_analysis,
                'photosynthesis_analysis': photosynthesis_analysis,
                'leaf_features': leaf_features,
                'care_recommendations': recommendations,
                'overall_leaf_score': self._calculate_overall_leaf_score(
                    nutrition_analysis, growth_analysis, health_evaluation
                ),
                'analysis_timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error in comprehensive leaf analysis: {e}")
            raise
    
    def _preprocess_leaf_image(self, image_data: Union[str, bytes, np.ndarray]) -> np.ndarray:
        """Preprocess leaf image for analysis"""
        try:
            if isinstance(image_data, str):
                image_bytes = base64.b64decode(image_data)
                image = Image.open(io.BytesIO(image_bytes))
            elif isinstance(image_data, bytes):
                image = Image.open(io.BytesIO(image_data))
            else:
                image = Image.fromarray(image_data)
            
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Resize to model input size
            image = image.resize((self.input_shape[0], self.input_shape[1]))
            
            # Convert to numpy array and normalize
            img_array = np.array(image) / 255.0
            
            return img_array.astype(np.float32)
            
        except Exception as e:
            logger.error(f"Error preprocessing leaf image: {e}")
            raise
    
    def _extract_comprehensive_leaf_features(self, image: np.ndarray) -> Dict[str, float]:
        """Extract comprehensive features from leaf image"""
        # Convert to different color spaces
        image_bgr = cv2.cvtColor((image * 255).astype(np.uint8), cv2.COLOR_RGB2BGR)
        hsv = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2HSV)
        lab = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2LAB)
        gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
        
        features = {}
        
        # Basic color analysis
        features['mean_red'] = float(np.mean(image[:, :, 0]))
        features['mean_green'] = float(np.mean(image[:, :, 1]))
        features['mean_blue'] = float(np.mean(image[:, :, 2]))
        features['std_red'] = float(np.std(image[:, :, 0]))
        features['std_green'] = float(np.std(image[:, :, 1]))
        features['std_blue'] = float(np.std(image[:, :, 2]))
        
        # HSV analysis for better color characterization
        features['mean_hue'] = float(np.mean(hsv[:, :, 0]))
        features['mean_saturation'] = float(np.mean(hsv[:, :, 1]))
        features['mean_value'] = float(np.mean(hsv[:, :, 2]))
        features['std_hue'] = float(np.std(hsv[:, :, 0]))
        features['std_saturation'] = float(np.std(hsv[:, :, 1]))
        features['std_value'] = float(np.std(hsv[:, :, 2]))
        
        # LAB color space for perceptual analysis
        features['lightness'] = float(np.mean(lab[:, :, 0]))
        features['a_component'] = float(np.mean(lab[:, :, 1]))  # Green-red axis
        features['b_component'] = float(np.mean(lab[:, :, 2]))  # Blue-yellow axis
        
        # Green dominance (health indicator)
        green_dominance = features['mean_green'] / (features['mean_red'] + features['mean_blue'] + 0.001)
        features['green_dominance'] = float(green_dominance)
        
        # Chlorophyll estimation
        features['chlorophyll_index'] = float(
            (features['mean_green'] - features['mean_red']) / 
            (features['mean_green'] + features['mean_red'] + 0.001)
        )
        
        # Color uniformity
        color_variance = (features['std_red'] + features['std_green'] + features['std_blue']) / 3
        features['color_uniformity'] = float(1.0 / (1.0 + color_variance))
        
        # Texture analysis
        features['texture_contrast'] = float(np.std(gray))
        features['texture_energy'] = float(np.mean(gray ** 2))
        
        # Edge analysis for venation and structure
        edges = cv2.Canny(gray, 50, 150)
        features['edge_density'] = float(np.sum(edges > 0) / edges.size)
        
        # Gradient analysis for smoothness
        grad_x = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
        grad_y = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
        gradient_magnitude = np.sqrt(grad_x**2 + grad_y**2)
        features['gradient_magnitude'] = float(np.mean(gradient_magnitude))
        
        # Spectral analysis for health assessment
        features['vegetation_index'] = float(
            (features['mean_green'] - features['mean_red']) /
            (features['mean_green'] + features['mean_red'] + 0.001)
        )
        
        # Yellow stress indicator
        yellow_hue_mask = (hsv[:, :, 0] >= 15) & (hsv[:, :, 0] <= 35)
        features['yellow_ratio'] = float(np.sum(yellow_hue_mask) / yellow_hue_mask.size)
        
        # Brown/dead tissue indicator
        brown_hue_mask = (hsv[:, :, 0] >= 5) & (hsv[:, :, 0] <= 15)
        features['brown_ratio'] = float(np.sum(brown_hue_mask) / brown_hue_mask.size)
        
        # Purple tint (phosphorus deficiency indicator)
        purple_hue_mask = (hsv[:, :, 0] >= 120) & (hsv[:, :, 0] <= 150)
        features['purple_ratio'] = float(np.sum(purple_hue_mask) / purple_hue_mask.size)
        
        # Surface roughness estimation
        laplacian = cv2.Laplacian(gray, cv2.CV_64F)
        features['surface_roughness'] = float(np.var(laplacian))
        
        return features
    
    def _analyze_nutrition_status(self, image: np.ndarray, features: Dict[str, float]) -> Dict[str, Any]:
        """Analyze nutritional status from leaf characteristics"""
        
        # Rule-based nutritional analysis
        nutrition_scores = {}
        deficiencies = list(self.nutrition_deficiencies.keys())
        
        # Initialize scores
        for deficiency in deficiencies:
            nutrition_scores[deficiency] = 0.1
        
        # Nitrogen deficiency analysis
        if features['yellow_ratio'] > 0.3 and features['green_dominance'] < 1.5:
            nutrition_scores['nitrogen_deficiency'] = 0.7
        
        # Phosphorus deficiency analysis
        if features['purple_ratio'] > 0.1 or features['a_component'] < 120:
            nutrition_scores['phosphorus_deficiency'] = 0.6
        
        # Potassium deficiency analysis (edge burn)
        if features['edge_density'] > 0.4 and features['brown_ratio'] > 0.1:
            nutrition_scores['potassium_deficiency'] = 0.6
        
        # Iron deficiency analysis (interveinal chlorosis)
        if (features['yellow_ratio'] > 0.2 and 
            features['edge_density'] > 0.3 and 
            features['chlorophyll_index'] < 0.3):
            nutrition_scores['iron_deficiency'] = 0.7
        
        # Magnesium deficiency analysis
        if (features['yellow_ratio'] > 0.25 and 
            features['green_dominance'] < 2.0 and
            features['edge_density'] < 0.3):
            nutrition_scores['magnesium_deficiency'] = 0.5
        
        # Calcium deficiency analysis
        if features['brown_ratio'] > 0.15 and features['texture_contrast'] > 50:
            nutrition_scores['calcium_deficiency'] = 0.5
        
        # Healthy nutrition
        if (features['green_dominance'] > 2.5 and 
            features['color_uniformity'] > 0.7 and 
            features['chlorophyll_index'] > 0.4):
            nutrition_scores['healthy_nutrition'] = 0.8
        
        # Normalize scores
        total_score = sum(nutrition_scores.values())
        nutrition_scores = {k: v/total_score for k, v in nutrition_scores.items()}
        
        # Get primary deficiency
        primary_deficiency = max(nutrition_scores.items(), key=lambda x: x[1])
        deficiency_info = self.nutrition_deficiencies[primary_deficiency[0]]
        
        # Assess severity
        severity_score = self._assess_nutrition_severity(features, primary_deficiency[0])
        
        return {
            'primary_deficiency': {
                'type': primary_deficiency[0],
                'name_ar': deficiency_info['name_ar'],
                'probability': float(primary_deficiency[1]),
                'severity_score': severity_score,
                'severity_stage': deficiency_info['severity_stages'][min(3, int(severity_score))],
                'symptoms': deficiency_info['symptoms']
            },
            'all_deficiency_scores': {k: float(v) for k, v in nutrition_scores.items()},
            'nutrition_recommendations': deficiency_info['treatment'],
            'estimated_recovery_time': deficiency_info['recovery_time'],
            'nutritional_health_score': float((1 - severity_score) * 100),
            'monitoring_frequency': self._get_nutrition_monitoring_frequency(severity_score)
        }
    
    def _assess_leaf_growth(self, image: np.ndarray, features: Dict[str, float], 
                          growth_stage: Optional[str] = None) -> Dict[str, Any]:
        """Assess leaf growth and development"""
        
        # Growth parameter estimation
        growth_metrics = {}
        
        # Size estimation (relative to image)
        leaf_area_ratio = 1.0 - (features['brown_ratio'] + features['yellow_ratio'])
        growth_metrics['relative_size'] = float(leaf_area_ratio)
        
        # Thickness estimation from texture
        thickness_indicator = features['texture_contrast'] / 100.0
        growth_metrics['thickness_indicator'] = float(min(1.0, thickness_indicator))
        
        # Venation development
        venation_score = features['edge_density'] * features['gradient_magnitude'] / 1000.0
        growth_metrics['venation_development'] = float(min(1.0, venation_score))
        
        # Surface development
        surface_development = 1.0 - (features['surface_roughness'] / 10000.0)
        growth_metrics['surface_development'] = float(max(0.0, surface_development))
        
        # Overall growth score
        growth_score = np.mean(list(growth_metrics.values())) * 100
        
        # Growth stage assessment
        if growth_stage:
            stage_assessment = self._assess_growth_stage_match(growth_metrics, growth_stage)
        else:
            stage_assessment = self._estimate_growth_stage(growth_metrics)
        
        # Growth recommendations
        growth_recommendations = self._generate_growth_recommendations(
            growth_metrics, stage_assessment
        )
        
        return {
            'growth_metrics': growth_metrics,
            'overall_growth_score': float(growth_score),
            'growth_stage_assessment': stage_assessment,
            'growth_recommendations': growth_recommendations,
            'development_indicators': {
                'size_adequacy': 'مناسب' if growth_metrics['relative_size'] > 0.7 else 'صغير',
                'structural_development': 'جيد' if growth_metrics['venation_development'] > 0.6 else 'يحتاج تحسين',
                'maturity_level': self._assess_maturity_level(growth_metrics)
            }
        }
    
    def _evaluate_leaf_health(self, image: np.ndarray, features: Dict[str, float]) -> Dict[str, Any]:
        """Evaluate overall leaf health"""
        
        health_components = {}
        
        # Color health (25% weight)
        color_health = features['color_uniformity'] * features['green_dominance'] / 3.0
        color_health = min(1.0, max(0.0, color_health))
        health_components['color_health'] = float(color_health)
        
        # Surface integrity (20% weight)
        surface_integrity = 1.0 - (features['brown_ratio'] + features['yellow_ratio'])
        surface_integrity = max(0.0, surface_integrity)
        health_components['surface_integrity'] = float(surface_integrity)
        
        # Chlorophyll health (20% weight)
        chlorophyll_health = (features['chlorophyll_index'] + 1) / 2  # Normalize to 0-1
        health_components['chlorophyll_health'] = float(chlorophyll_health)
        
        # Structural health (20% weight)
        structural_health = min(1.0, features['edge_density'] * 2)  # Good venation = good structure
        health_components['structural_health'] = float(structural_health)
        
        # Vitality (15% weight)
        vitality = features['vegetation_index'] if features['vegetation_index'] > 0 else 0
        vitality = min(1.0, vitality * 2)
        health_components['vitality'] = float(vitality)
        
        # Calculate weighted health score
        weights = [0.25, 0.20, 0.20, 0.20, 0.15]
        values = list(health_components.values())
        overall_health = sum(w * v for w, v in zip(weights, values)) * 100
        
        # Health category
        if overall_health >= 85:
            health_category = 'ممتاز'
            health_status = 'excellent'
        elif overall_health >= 70:
            health_category = 'جيد جداً'
            health_status = 'very_good'
        elif overall_health >= 55:
            health_category = 'جيد'
            health_status = 'good'
        elif overall_health >= 40:
            health_category = 'متوسط'
            health_status = 'fair'
        elif overall_health >= 25:
            health_category = 'ضعيف'
            health_status = 'poor'
        else:
            health_category = 'حرج'
            health_status = 'critical'
        
        return {
            'overall_health_score': float(overall_health),
            'health_category': health_category,
            'health_status': health_status,
            'health_components': health_components,
            'health_trends': self._analyze_health_trends(health_components),
            'improvement_areas': self._identify_improvement_areas(health_components),
            'health_prognosis': self._predict_health_prognosis(overall_health, health_components)
        }
    
    def _analyze_leaf_morphology(self, image: np.ndarray) -> Dict[str, Any]:
        """Analyze leaf morphological characteristics"""
        gray = cv2.cvtColor((image * 255).astype(np.uint8), cv2.COLOR_RGB2GRAY)
        
        # Contour analysis for shape
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        morphology = {}
        
        if contours:
            # Largest contour (main leaf)
            main_contour = max(contours, key=cv2.contourArea)
            
            # Shape analysis
            area = cv2.contourArea(main_contour)
            perimeter = cv2.arcLength(main_contour, True)
            
            if perimeter > 0:
                circularity = 4 * np.pi * area / (perimeter * perimeter)
                morphology['circularity'] = float(circularity)
            else:
                morphology['circularity'] = 0.0
            
            # Aspect ratio
            x, y, w, h = cv2.boundingRect(main_contour)
            aspect_ratio = float(w) / float(h) if h > 0 else 1.0
            morphology['aspect_ratio'] = float(aspect_ratio)
            
            # Convexity
            hull = cv2.convexHull(main_contour)
            hull_area = cv2.contourArea(hull)
            if hull_area > 0:
                convexity = area / hull_area
                morphology['convexity'] = float(convexity)
            else:
                morphology['convexity'] = 1.0
            
            # Solidity
            morphology['solidity'] = float(convexity)  # Same as convexity in this context
            
        else:
            # Default values if no contours found
            morphology = {
                'circularity': 0.5,
                'aspect_ratio': 1.0,
                'convexity': 0.8,
                'solidity': 0.8
            }
        
        # Shape classification
        shape_type = self._classify_leaf_shape(morphology)
        
        return {
            'morphological_metrics': morphology,
            'leaf_shape_type': shape_type,
            'shape_regularity': self._assess_shape_regularity(morphology),
            'structural_integrity': self._assess_structural_integrity(morphology)
        }
    
    def _detect_environmental_stress(self, features: Dict[str, float]) -> Dict[str, Any]:
        """Detect environmental stress indicators"""
        stress_indicators = {}
        
        # Heat stress
        if features['brown_ratio'] > 0.1 and features['edge_density'] > 0.3:
            stress_indicators['heat_stress'] = {
                'severity': 'متوسط' if features['brown_ratio'] < 0.2 else 'عالي',
                'indicators': ['حرق الحواف', 'تبقع بني'],
                'recommendations': ['توفير الظل', 'زيادة الري', 'رش ماء بارد']
            }
        
        # Water stress
        if features['yellow_ratio'] > 0.2 and features['color_uniformity'] < 0.5:
            stress_indicators['water_stress'] = {
                'severity': 'متوسط' if features['yellow_ratio'] < 0.4 else 'عالي',
                'indicators': ['ذبول', 'اصفرار', 'فقدان التماسك'],
                'recommendations': ['تحسين الري', 'فحص نظام الصرف', 'إضافة مهاد']
            }
        
        # Light stress (too much or too little)
        if features['mean_value'] > 200 or features['mean_value'] < 80:
            light_type = 'إضاءة مفرطة' if features['mean_value'] > 200 else 'نقص إضاءة'
            stress_indicators['light_stress'] = {
                'severity': 'متوسط',
                'indicators': [light_type, 'تغير في اللون'],
                'recommendations': ['ضبط مستوى الإضاءة', 'نقل النبات إذا أمكن']
            }
        
        # Chemical stress (pollution, chemicals)
        if features['surface_roughness'] > 5000 and features['brown_ratio'] > 0.05:
            stress_indicators['chemical_stress'] = {
                'severity': 'متوسط',
                'indicators': ['خشونة السطح', 'تصبغات غير طبيعية'],
                'recommendations': ['تجنب المواد الكيماوية الضارة', 'غسل الأوراق']
            }
        
        # Overall stress level
        stress_count = len(stress_indicators)
        if stress_count == 0:
            overall_stress = 'منخفض'
        elif stress_count == 1:
            overall_stress = 'متوسط'
        else:
            overall_stress = 'عالي'
        
        return {
            'detected_stress_types': stress_indicators,
            'overall_stress_level': overall_stress,
            'stress_resilience_score': float(max(0, 100 - stress_count * 25)),
            'stress_management_priority': 'عاجل' if stress_count > 2 else 'عادي'
        }
    
    def _assess_leaf_maturity(self, features: Dict[str, float], 
                           growth_stage: Optional[str] = None) -> Dict[str, Any]:
        """Assess leaf maturity and age"""
        
        # Maturity indicators
        color_maturity = features['green_dominance'] * features['color_uniformity']
        structure_maturity = features['edge_density'] * (1 - features['surface_roughness'] / 10000)
        
        maturity_score = (color_maturity + structure_maturity) / 2
        maturity_score = min(1.0, max(0.0, maturity_score))
        
        # Age estimation
        if maturity_score > 0.8:
            estimated_age = 'ناضج'
            maturity_stage = 'mature'
        elif maturity_score > 0.6:
            estimated_age = 'شبه ناضج'
            maturity_stage = 'semi_mature'
        elif maturity_score > 0.4:
            estimated_age = 'في طور النمو'
            maturity_stage = 'developing'
        else:
            estimated_age = 'صغير'
            maturity_stage = 'young'
        
        return {
            'maturity_score': float(maturity_score * 100),
            'estimated_age': estimated_age,
            'maturity_stage': maturity_stage,
            'development_phase': self._determine_development_phase(maturity_score),
            'optimal_harvest_timing': self._estimate_harvest_timing(maturity_score)
        }
    
    def _estimate_photosynthetic_capacity(self, features: Dict[str, float]) -> Dict[str, Any]:
        """Estimate photosynthetic capacity and efficiency"""
        
        # Chlorophyll content indicator
        chlorophyll_score = (features['chlorophyll_index'] + 1) / 2
        
        # Surface area efficiency
        surface_efficiency = features['color_uniformity'] * (1 - features['brown_ratio'])
        
        # Light absorption capacity
        light_absorption = 1 - (features['mean_value'] / 255.0)
        if light_absorption < 0:
            light_absorption = 0
        
        # Overall photosynthetic capacity
        photosynthetic_capacity = (chlorophyll_score * 0.4 + 
                                 surface_efficiency * 0.4 + 
                                 light_absorption * 0.2)
        
        capacity_score = photosynthetic_capacity * 100
        
        # Efficiency rating
        if capacity_score >= 80:
            efficiency_rating = 'ممتاز'
        elif capacity_score >= 65:
            efficiency_rating = 'جيد جداً'
        elif capacity_score >= 50:
            efficiency_rating = 'جيد'
        elif capacity_score >= 35:
            efficiency_rating = 'متوسط'
        else:
            efficiency_rating = 'ضعيف'
        
        return {
            'photosynthetic_capacity_score': float(capacity_score),
            'efficiency_rating': efficiency_rating,
            'chlorophyll_content_indicator': float(chlorophyll_score * 100),
            'surface_efficiency': float(surface_efficiency * 100),
            'light_absorption_capacity': float(light_absorption * 100),
            'productivity_potential': self._assess_productivity_potential(capacity_score),
            'optimization_suggestions': self._suggest_photosynthesis_optimization(
                chlorophyll_score, surface_efficiency, light_absorption
            )
        }
    
    def _calculate_overall_leaf_score(self, nutrition: Dict[str, Any], 
                                    growth: Dict[str, Any], 
                                    health: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate overall leaf quality score"""
        
        # Weight the different aspects
        nutrition_weight = 0.35
        growth_weight = 0.30
        health_weight = 0.35
        
        nutrition_score = nutrition['nutritional_health_score']
        growth_score = growth['overall_growth_score']
        health_score = health['overall_health_score']
        
        overall_score = (nutrition_score * nutrition_weight + 
                        growth_score * growth_weight + 
                        health_score * health_weight)
        
        # Quality grade
        if overall_score >= 90:
            quality_grade = 'A+'
            quality_description = 'ممتاز - جودة استثنائية'
        elif overall_score >= 80:
            quality_grade = 'A'
            quality_description = 'ممتاز - جودة عالية'
        elif overall_score >= 70:
            quality_grade = 'B+'
            quality_description = 'جيد جدا��'
        elif overall_score >= 60:
            quality_grade = 'B'
            quality_description = 'جيد'
        elif overall_score >= 50:
            quality_grade = 'C+'
            quality_description = 'متوسط فما فوق'
        elif overall_score >= 40:
            quality_grade = 'C'
            quality_description = 'متوسط'
        else:
            quality_grade = 'D'
            quality_description = 'يحتاج تحسين'
        
        return {
            'overall_score': float(overall_score),
            'quality_grade': quality_grade,
            'quality_description': quality_description,
            'component_scores': {
                'nutrition': float(nutrition_score),
                'growth': float(growth_score),
                'health': float(health_score)
            },
            'improvement_potential': float(min(100, overall_score + 15)),
            'quality_trend': self._predict_quality_trend(overall_score, nutrition, growth, health)
        }
    
    # Helper methods
    def _assess_nutrition_severity(self, features: Dict[str, float], deficiency_type: str) -> float:
        """Assess severity of nutritional deficiency"""
        if deficiency_type == 'healthy_nutrition':
            return 0.0
        
        # Base severity on visual indicators
        severity_factors = []
        
        if 'nitrogen' in deficiency_type:
            severity_factors.append(features['yellow_ratio'] * 2)
        elif 'phosphorus' in deficiency_type:
            severity_factors.append(features['purple_ratio'] * 3)
        elif 'potassium' in deficiency_type:
            severity_factors.append(features['brown_ratio'] * 2.5)
        elif 'iron' in deficiency_type:
            severity_factors.append((1 - features['chlorophyll_index']) * 2)
        
        severity_factors.append(1 - features['color_uniformity'])
        severity_factors.append(1 - features['green_dominance'] / 3)
        
        severity = np.mean(severity_factors)
        return min(3.0, max(0.0, severity * 4))  # Scale to 0-3
    
    def _get_nutrition_monitoring_frequency(self, severity: float) -> str:
        """Get monitoring frequency based on severity"""
        if severity > 2.5:
            return 'يومياً'
        elif severity > 1.5:
            return 'كل يومين'
        elif severity > 0.5:
            return 'أسبوعياً'
        else:
            return 'شهرياً'
    
    def _assess_growth_stage_match(self, metrics: Dict[str, float], stage: str) -> Dict[str, Any]:
        """Assess if growth metrics match expected stage"""
        # Simplified stage matching
        expected_metrics = {
            'seedling': {'relative_size': 0.3, 'venation_development': 0.4},
            'juvenile': {'relative_size': 0.6, 'venation_development': 0.7},
            'mature': {'relative_size': 0.9, 'venation_development': 0.9},
            'senescent': {'relative_size': 0.7, 'venation_development': 0.8}
        }
        
        if stage in expected_metrics:
            expected = expected_metrics[stage]
            size_match = 1 - abs(metrics['relative_size'] - expected['relative_size'])
            venation_match = 1 - abs(metrics['venation_development'] - expected['venation_development'])
            overall_match = (size_match + venation_match) / 2
            
            return {
                'stage_match_score': float(overall_match * 100),
                'expected_stage': stage,
                'actual_assessment': self._estimate_growth_stage(metrics)['estimated_stage']
            }
        
        return {'stage_match_score': 0.0, 'expected_stage': stage, 'actual_assessment': 'unknown'}
    
    def _estimate_growth_stage(self, metrics: Dict[str, float]) -> Dict[str, str]:
        """Estimate growth stage from metrics"""
        size = metrics['relative_size']
        venation = metrics['venation_development']
        
        if size < 0.4 and venation < 0.5:
            return {'estimated_stage': 'seedling', 'confidence': 'high'}
        elif size < 0.7 and venation < 0.8:
            return {'estimated_stage': 'juvenile', 'confidence': 'medium'}
        elif size > 0.8 and venation > 0.8:
            return {'estimated_stage': 'mature', 'confidence': 'high'}
        else:
            return {'estimated_stage': 'intermediate', 'confidence': 'low'}
    
    def _generate_growth_recommendations(self, metrics: Dict[str, float], 
                                       stage_assessment: Dict[str, Any]) -> List[str]:
        """Generate growth improvement recommendations"""
        recommendations = []
        
        if metrics['relative_size'] < 0.6:
            recommendations.append('تحسين التغذية لزيادة النمو')
        
        if metrics['venation_development'] < 0.7:
            recommendations.append('ضمان كفاية الإضاءة لتطوير البنية الوعائية')
        
        if metrics['surface_development'] < 0.6:
            recommendations.append('حماية النبات من العوامل البيئية الضارة')
        
        return recommendations
    
    def _assess_maturity_level(self, metrics: Dict[str, float]) -> str:
        """Assess maturity level"""
        avg_metric = np.mean(list(metrics.values()))
        
        if avg_metric > 0.8:
            return 'ناضج تماماً'
        elif avg_metric > 0.6:
            return 'شبه ناضج'
        elif avg_metric > 0.4:
            return 'في طور النضج'
        else:
            return 'غير ناضج'
    
    def _analyze_health_trends(self, components: Dict[str, float]) -> Dict[str, str]:
        """Analyze health component trends"""
        trends = {}
        
        for component, value in components.items():
            if value > 0.8:
                trends[component] = 'ممتاز'
            elif value > 0.6:
                trends[component] = 'جيد'
            elif value > 0.4:
                trends[component] = 'متوسط'
            else:
                trends[component] = 'يحتاج تحسين'
        
        return trends
    
    def _identify_improvement_areas(self, components: Dict[str, float]) -> List[str]:
        """Identify areas needing improvement"""
        areas = []
        
        for component, value in components.items():
            if value < 0.6:
                if component == 'color_health':
                    areas.append('تحسين التغذية والصحة العا��ة')
                elif component == 'surface_integrity':
                    areas.append('حماية السطح من الأضرار')
                elif component == 'chlorophyll_health':
                    areas.append('تحسين إنتاج الكلوروفيل')
                elif component == 'structural_health':
                    areas.append('تقوية البنية الورقية')
                elif component == 'vitality':
                    areas.append('زيادة الحيوية والنشاط')
        
        return areas
    
    def _predict_health_prognosis(self, overall_health: float, 
                                components: Dict[str, float]) -> str:
        """Predict health prognosis"""
        if overall_health > 70 and min(components.values()) > 0.5:
            return 'توقعات إيجابية للنمو والتطور'
        elif overall_health > 50:
            return 'تحسن متوقع مع العناية المناسبة'
        else:
            return 'يحتاج تدخل فوري لتحسين الحالة'
    
    def _classify_leaf_shape(self, morphology: Dict[str, float]) -> str:
        """Classify leaf shape based on morphological metrics"""
        circularity = morphology['circularity']
        aspect_ratio = morphology['aspect_ratio']
        
        if circularity > 0.8:
            return 'دائري'
        elif aspect_ratio > 2.0:
            return 'طولي'
        elif aspect_ratio < 0.5:
            return 'عريض'
        elif circularity > 0.6:
            return 'بيضاوي'
        else:
            return 'غير منتظم'
    
    def _assess_shape_regularity(self, morphology: Dict[str, float]) -> str:
        """Assess shape regularity"""
        regularity_score = (morphology['convexity'] + morphology['solidity']) / 2
        
        if regularity_score > 0.8:
            return 'منتظم جداً'
        elif regularity_score > 0.6:
            return 'منتظم'
        else:
            return 'غير منتظم'
    
    def _assess_structural_integrity(self, morphology: Dict[str, float]) -> str:
        """Assess structural integrity"""
        integrity_score = morphology['convexity']
        
        if integrity_score > 0.9:
            return 'بنية سليمة'
        elif integrity_score > 0.7:
            return 'بنية جيدة'
        else:
            return 'بنية متضررة'
    
    def _determine_development_phase(self, maturity_score: float) -> str:
        """Determine development phase"""
        if maturity_score > 0.8:
            return 'طور النضج الكامل'
        elif maturity_score > 0.6:
            return 'طور النضج المتقدم'
        elif maturity_score > 0.4:
            return 'طور النمو النشط'
        else:
            return 'طور النمو المبكر'
    
    def _estimate_harvest_timing(self, maturity_score: float) -> str:
        """Estimate optimal harvest timing"""
        if maturity_score > 0.85:
            return 'جاهز للحصاد'
        elif maturity_score > 0.7:
            return 'قريب من النضج (7-14 يوم)'
        elif maturity_score > 0.5:
            return 'يحتاج وقت أكثر (2-4 أسابيع)'
        else:
            return 'بعيد عن النضج (أكثر من شهر)'
    
    def _assess_productivity_potential(self, capacity_score: float) -> str:
        """Assess productivity potential"""
        if capacity_score > 80:
            return 'إمكانية إنتاج عالية'
        elif capacity_score > 60:
            return 'إمكانية إنتاج جيدة'
        elif capacity_score > 40:
            return 'إمكانية إنتاج متوسطة'
        else:
            return 'إمكانية إنتاج منخفضة'
    
    def _suggest_photosynthesis_optimization(self, chlorophyll: float, 
                                           surface: float, light: float) -> List[str]:
        """Suggest photosynthesis optimization"""
        suggestions = []
        
        if chlorophyll < 0.6:
            suggestions.append('تحسين التغذية بالنيتروجين والمغنيسيوم')
        
        if surface < 0.6:
            suggestions.append('حماية سطح الورقة من التلف')
        
        if light < 0.4:
            suggestions.append('تحسين ظروف الإضاءة')
        elif light > 0.8:
            suggestions.append('توفير ظل جزئي لتجنب الإجهاد الضوئي')
        
        return suggestions
    
    def _predict_quality_trend(self, overall_score: float, nutrition: Dict[str, Any], 
                             growth: Dict[str, Any], health: Dict[str, Any]) -> str:
        """Predict quality trend"""
        if overall_score > 75 and nutrition['nutritional_health_score'] > 70:
            return 'تحسن مستمر متوقع'
        elif overall_score > 50:
            return 'استقرار مع إمكانية تحسن'
        else:
            return 'يحتاج تدخل لتجنب التدهور'
    
    def _generate_leaf_care_recommendations(self, nutrition: Dict[str, Any], 
                                          growth: Dict[str, Any], 
                                          health: Dict[str, Any], 
                                          stress: Dict[str, Any]) -> List[str]:
        """Generate comprehensive leaf care recommendations"""
        recommendations = []
        
        # Add nutrition recommendations
        recommendations.extend(nutrition['nutrition_recommendations'])
        
        # Add growth recommendations
        recommendations.extend(growth['growth_recommendations'])
        
        # Add health improvement suggestions
        recommendations.extend(health['improvement_areas'])
        
        # Add stress management recommendations
        for stress_type, stress_info in stress['detected_stress_types'].items():
            recommendations.extend(stress_info['recommendations'])
        
        # Add general care recommendations
        recommendations.extend([
            'مراقبة منتظمة لحالة الأوراق',
            'ضمان التهوية الجيدة',
            'تجنب الري على الأوراق مباشرة',
            'إزالة الأوراق التالفة بانتظام'
        ])
        
        # Remove duplicates and return unique recommendations
        return list(set(recommendations))

# Factory function
def create_leaf_scan_ai() -> LeafScanAI:
    """Create and return a LeafScanAI instance"""
    return LeafScanAI()
