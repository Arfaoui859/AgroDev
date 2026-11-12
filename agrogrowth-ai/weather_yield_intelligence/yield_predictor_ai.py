"""
YieldPredictorAI - توقع مردودية المحصول
توقع مردودية المحصول حسب المعطيات الحالية (تربة، طقس، صورة، موسم)
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Any, Optional, Union
import logging
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import Ridge
from sklearn.preprocessing import StandardScaler, RobustScaler
from sklearn.metrics import mean_absolute_error, r2_score
import cv2
from PIL import Image
import base64
import io
import json

logger = logging.getLogger(__name__)

class YieldPredictorAI:
    """نظام ذكي لتوقع مردودية المحاصيل"""
    
    def __init__(self):
        self.yield_prediction_model = None
        self.quality_assessment_model = None
        self.growth_stage_model = None
        self.environmental_impact_model = None
        self.scaler = StandardScaler()
        self.quality_scaler = RobustScaler()
        self.is_trained = False
        
        # قاعدة بيانات العوائد المتوقعة للمحاصيل
        self.crop_yield_database = {
            'wheat': {
                'name_ar': 'القمح',
                'unit': 'كيلوجرام/هكتار',
                'baseline_yield': {
                    'poor_conditions': 2000,
                    'average_conditions': 3500,
                    'optimal_conditions': 5000,
                    'excellent_conditions': 6500
                },
                'yield_factors': {
                    'soil_fertility': 0.25,
                    'water_availability': 0.30,
                    'temperature': 0.20,
                    'disease_pressure': -0.15,
                    'pest_pressure': -0.10,
                    'management_practices': 0.20
                },
                'quality_parameters': {
                    'protein_content': {'min': 8, 'max': 16, 'optimal': 12},
                    'moisture_content': {'min': 10, 'max': 14, 'optimal': 12},
                    'test_weight': {'min': 70, 'max': 85, 'optimal': 78}
                },
                'critical_growth_stages': {
                    'germination': {'duration_days': 10, 'yield_impact': 0.15},
                    'tillering': {'duration_days': 30, 'yield_impact': 0.20},
                    'stem_elongation': {'duration_days': 25, 'yield_impact': 0.15},
                    'flowering': {'duration_days': 15, 'yield_impact': 0.30},
                    'grain_filling': {'duration_days': 35, 'yield_impact': 0.25},
                    'maturity': {'duration_days': 10, 'yield_impact': 0.05}
                }
            },
            'corn': {
                'name_ar': 'الذرة',
                'unit': 'كيلوجرام/هكتار',
                'baseline_yield': {
                    'poor_conditions': 3000,
                    'average_conditions': 6000,
                    'optimal_conditions': 9000,
                    'excellent_conditions': 12000
                },
                'yield_factors': {
                    'soil_fertility': 0.25,
                    'water_availability': 0.35,
                    'temperature': 0.20,
                    'disease_pressure': -0.12,
                    'pest_pressure': -0.18,
                    'management_practices': 0.25
                },
                'quality_parameters': {
                    'moisture_content': {'min': 14, 'max': 18, 'optimal': 16},
                    'protein_content': {'min': 6, 'max': 12, 'optimal': 9},
                    'starch_content': {'min': 60, 'max': 75, 'optimal': 68}
                },
                'critical_growth_stages': {
                    'germination': {'duration_days': 7, 'yield_impact': 0.10},
                    'vegetative': {'duration_days': 45, 'yield_impact': 0.20},
                    'tasseling': {'duration_days': 10, 'yield_impact': 0.25},
                    'silking': {'duration_days': 10, 'yield_impact': 0.25},
                    'grain_filling': {'duration_days': 45, 'yield_impact': 0.30},
                    'maturity': {'duration_days': 15, 'yield_impact': 0.05}
                }
            },
            'tomato': {
                'name_ar': 'الطماطم',
                'unit': 'كيلوجرام/هكتار',
                'baseline_yield': {
                    'poor_conditions': 15000,
                    'average_conditions': 30000,
                    'optimal_conditions': 50000,
                    'excellent_conditions': 75000
                },
                'yield_factors': {
                    'soil_fertility': 0.20,
                    'water_availability': 0.30,
                    'temperature': 0.25,
                    'disease_pressure': -0.25,
                    'pest_pressure': -0.20,
                    'management_practices': 0.30
                },
                'quality_parameters': {
                    'brix_content': {'min': 3, 'max': 8, 'optimal': 5.5},
                    'firmness': {'min': 2, 'max': 6, 'optimal': 4},
                    'color_uniformity': {'min': 60, 'max': 95, 'optimal': 85}
                },
                'critical_growth_stages': {
                    'seedling': {'duration_days': 20, 'yield_impact': 0.15},
                    'vegetative': {'duration_days': 35, 'yield_impact': 0.20},
                    'flowering': {'duration_days': 25, 'yield_impact': 0.30},
                    'fruit_development': {'duration_days': 40, 'yield_impact': 0.35},
                    'harvest': {'duration_days': 60, 'yield_impact': 0.10}
                }
            },
            'potato': {
                'name_ar': 'البطاطس',
                'unit': 'كيلوجرام/هكتار',
                'baseline_yield': {
                    'poor_conditions': 12000,
                    'average_conditions': 25000,
                    'optimal_conditions': 40000,
                    'excellent_conditions': 55000
                },
                'yield_factors': {
                    'soil_fertility': 0.25,
                    'water_availability': 0.25,
                    'temperature': 0.20,
                    'disease_pressure': -0.20,
                    'pest_pressure': -0.15,
                    'management_practices': 0.25
                },
                'quality_parameters': {
                    'dry_matter_content': {'min': 18, 'max': 25, 'optimal': 22},
                    'starch_content': {'min': 12, 'max': 18, 'optimal': 15},
                    'tuber_size_uniformity': {'min': 70, 'max': 95, 'optimal': 85}
                },
                'critical_growth_stages': {
                    'emergence': {'duration_days': 15, 'yield_impact': 0.15},
                    'vegetative': {'duration_days': 35, 'yield_impact': 0.20},
                    'tuber_initiation': {'duration_days': 20, 'yield_impact': 0.25},
                    'tuber_bulking': {'duration_days': 40, 'yield_impact': 0.35},
                    'maturity': {'duration_days': 15, 'yield_impact': 0.10}
                }
            },
            'olive': {
                'name_ar': 'الزيتون',
                'unit': 'كيلوجرام/هكتار',
                'baseline_yield': {
                    'poor_conditions': 3000,
                    'average_conditions': 6000,
                    'optimal_conditions': 10000,
                    'excellent_conditions': 15000
                },
                'yield_factors': {
                    'soil_fertility': 0.20,
                    'water_availability': 0.25,
                    'temperature': 0.20,
                    'disease_pressure': -0.15,
                    'pest_pressure': -0.10,
                    'tree_age': 0.15,
                    'management_practices': 0.25
                },
                'quality_parameters': {
                    'oil_content': {'min': 15, 'max': 25, 'optimal': 20},
                    'free_fatty_acid': {'min': 0.1, 'max': 0.8, 'optimal': 0.3},
                    'polyphenol_content': {'min': 100, 'max': 500, 'optimal': 250}
                },
                'critical_growth_stages': {
                    'bud_break': {'duration_days': 30, 'yield_impact': 0.15},
                    'flowering': {'duration_days': 20, 'yield_impact': 0.30},
                    'fruit_set': {'duration_days': 30, 'yield_impact': 0.25},
                    'fruit_development': {'duration_days': 120, 'yield_impact': 0.25},
                    'harvest': {'duration_days': 30, 'yield_impact': 0.10}
                }
            }
        }
        
        # عوامل بيئية مؤثرة على الإنتاج
        self.environmental_factors = {
            'temperature': {
                'optimal_ranges': {
                    'wheat': (15, 25),
                    'corn': (20, 30),
                    'tomato': (18, 28),
                    'potato': (15, 25),
                    'olive': (15, 30)
                },
                'stress_thresholds': {
                    'heat_stress': 35,
                    'cold_stress': 5,
                    'extreme_heat': 40,
                    'frost_damage': 0
                }
            },
            'water': {
                'critical_periods': {
                    'wheat': ['flowering', 'grain_filling'],
                    'corn': ['tasseling', 'silking', 'grain_filling'],
                    'tomato': ['flowering', 'fruit_development'],
                    'potato': ['tuber_initiation', 'tuber_bulking']
                },
                'deficit_impact': {
                    'mild': 0.85,    # 15% انخفاض
                    'moderate': 0.70, # 30% انخفاض
                    'severe': 0.50,   # 50% انخفاض
                    'extreme': 0.25   # 75% انخفاض
                }
            },
            'soil_health': {
                'fertility_levels': {
                    'very_poor': 0.5,
                    'poor': 0.7,
                    'average': 1.0,
                    'good': 1.2,
                    'excellent': 1.4
                },
                'ph_impact': {
                    'very_acidic': 0.6,   # pH < 5.5
                    'acidic': 0.8,        # pH 5.5-6.0
                    'optimal': 1.0,       # pH 6.0-7.5
                    'alkaline': 0.9,      # pH 7.5-8.5
                    'very_alkaline': 0.7  # pH > 8.5
                }
            }
        }
        
        # نماذج التنبؤ المتقدمة
        self.prediction_models = {
            'regression_models': ['random_forest', 'gradient_boosting', 'ridge'],
            'ensemble_weights': [0.4, 0.4, 0.2],
            'model_accuracy': {
                'random_forest': 0.85,
                'gradient_boosting': 0.87,
                'ridge': 0.75
            }
        }
        
        # Synthetic in-process training is intentionally disabled.
        self.model_source = "synthetic-demo-disabled"
    
    def predict_crop_yield(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """التنبؤ بمردودية المحصول"""
        try:
            if not self.is_trained:
                raise ValueError("Models not trained")
            
            # استخراج معلومات المحصول
            crop_type = input_data.get('crop_type', 'wheat')
            crop_info = self.crop_yield_database.get(crop_type, 
                                                    self.crop_yield_database['wheat'])
            
            # تحليل الصورة إذا وجدت
            image_analysis = None
            # Pydantic fills optional fields with None, so a key's presence is not
            # proof of an image; only analyse when bytes/base64 were actually sent.
            if input_data.get('field_image'):
                image_analysis = self._analyze_field_image(input_data['field_image'])
            
            # تحليل الظروف الحالية
            current_conditions = self._analyze_current_growing_conditions(
                input_data, crop_info
            )
            
            # تقييم مرحلة النمو الحالية
            growth_stage_assessment = self._assess_current_growth_stage(
                input_data, crop_info
            )
            
            # التنبؤ بالعائد الأساسي
            primary_yield_prediction = self._predict_base_yield(
                input_data, crop_info, current_conditions
            )
            
            # تحليل العوامل المؤثرة
            impact_factors = self._analyze_yield_impact_factors(
                input_data, current_conditions, crop_info
            )
            
            # التنبؤ بالجودة
            quality_prediction = self._predict_crop_quality(
                input_data, crop_info, current_conditions
            )
            
            # تحليل المخاطر والفرص
            risk_opportunity_analysis = self._analyze_yield_risks_opportunities(
                input_data, current_conditions, crop_info
            )
            
            # توقعات مراحل النمو القادمة
            future_growth_projections = self._project_future_growth_stages(
                input_data, growth_stage_assessment, crop_info
            )
            
            # توصيات لتحسين العائد
            yield_optimization_recommendations = self._recommend_yield_optimization(
                primary_yield_prediction, impact_factors, risk_opportunity_analysis
            )
            
            # تحليل الجدوى الاقتصادية
            economic_analysis = self._analyze_economic_viability(
                primary_yield_prediction, quality_prediction, input_data
            )
            
            return {
                'crop_info': {
                    'crop_type': crop_type,
                    'crop_name_ar': crop_info['name_ar'],
                    'unit': crop_info['unit']
                },
                'yield_prediction': primary_yield_prediction,
                'quality_prediction': quality_prediction,
                'current_conditions': current_conditions,
                'growth_stage_assessment': growth_stage_assessment,
                'impact_factors': impact_factors,
                'risk_opportunity_analysis': risk_opportunity_analysis,
                'future_projections': future_growth_projections,
                'optimization_recommendations': yield_optimization_recommendations,
                'economic_analysis': economic_analysis,
                'image_analysis': image_analysis,
                'confidence_metrics': self._calculate_prediction_confidence(
                    input_data, current_conditions
                ),
                'analysis_timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error in yield prediction: {e}")
            raise
    
    def _analyze_field_image(self, image_data: Union[str, bytes]) -> Dict[str, Any]:
        """تحليل صورة الحقل لتقدير العائد"""
        try:
            # معالجة الصورة
            if isinstance(image_data, str):
                image_bytes = base64.b64decode(image_data)
                image = Image.open(io.BytesIO(image_bytes))
            else:
                image = Image.open(io.BytesIO(image_data))
            
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            img_array = np.array(image)
            
            # تحليل الغطاء النباتي
            vegetation_analysis = self._analyze_vegetation_coverage(img_array)
            
            # تحليل صحة النباتات
            plant_health_analysis = self._analyze_plant_health_from_image(img_array)
            
            # تقدير كثافة الزراعة
            plant_density_estimation = self._estimate_plant_density(img_array)
            
            # تحليل مرحلة النمو من الصورة
            growth_stage_indicators = self._detect_growth_stage_from_image(img_array)
            
            # تقدير العائد المرئي
            visual_yield_indicators = self._extract_visual_yield_indicators(img_array)
            
            return {
                'vegetation_analysis': vegetation_analysis,
                'plant_health_analysis': plant_health_analysis,
                'plant_density_estimation': plant_density_estimation,
                'growth_stage_indicators': growth_stage_indicators,
                'visual_yield_indicators': visual_yield_indicators,
                'image_quality_assessment': self._assess_image_quality_for_analysis(img_array)
            }
            
        except Exception as e:
            logger.error(f"Error analyzing field image: {e}")
            return {'error': 'فشل في تحليل صورة الحقل'}
    
    def _analyze_current_growing_conditions(self, input_data: Dict, 
                                          crop_info: Dict) -> Dict[str, Any]:
        """تحليل ظروف النمو الحالية"""
        weather_data = input_data.get('weather_data', {})
        soil_data = input_data.get('soil_data', {})
        management_data = input_data.get('management_practices', {})
        
        # تحليل الظروف الجوية
        temperature = weather_data.get('temperature', 25.0)
        rainfall = weather_data.get('recent_rainfall', 0.0)
        humidity = weather_data.get('humidity', 60.0)
        
        # تقييم الإجهاد الحراري
        temp_stress = self._assess_temperature_stress(temperature, crop_info)
        
        # تقييم الإجهاد المائي
        water_stress = self._assess_water_stress(
            soil_data.get('moisture_percentage', 50),
            rainfall,
            crop_info
        )
        
        # تقييم صحة التربة
        soil_health = self._assess_soil_health_impact(soil_data, crop_info)
        
        # تقييم ممارسات الإدارة
        management_effectiveness = self._assess_management_practices(
            management_data, crop_info
        )
        
        # الحالة العامة للظروف
        overall_condition_score = self._calculate_overall_condition_score(
            temp_stress, water_stress, soil_health, management_effectiveness
        )
        
        return {
            'temperature_conditions': {
                'current_temp': float(temperature),
                'stress_level': temp_stress,
                'optimal_range': self.environmental_factors['temperature']['optimal_ranges'].get(
                    input_data.get('crop_type', 'wheat'), (20, 30)
                )
            },
            'water_conditions': {
                'stress_level': water_stress,
                'soil_moisture': soil_data.get('moisture_percentage', 50),
                'recent_rainfall': float(rainfall)
            },
            'soil_conditions': soil_health,
            'management_assessment': management_effectiveness,
            'overall_score': float(overall_condition_score),
            'condition_category': self._categorize_growing_conditions(overall_condition_score),
            'limiting_factors': self._identify_limiting_factors(
                temp_stress, water_stress, soil_health, management_effectiveness
            )
        }
    
    def _predict_base_yield(self, input_data: Dict, crop_info: Dict, 
                           current_conditions: Dict) -> Dict[str, Any]:
        """التنبؤ الأساسي بالعائد"""
        # استخراج المتغيرات للنموذج
        features = self._extract_prediction_features(input_data, current_conditions)
        
        if self.is_trained and len(features) > 0:
            # استخدام النموذج المدرب
            features_scaled = self.scaler.transform([features])
            predicted_yield = self.yield_prediction_model.predict(features_scaled)[0]
            
            # حساب فترة الثقة
            prediction_std = self._estimate_prediction_uncertainty(features_scaled)
            confidence_interval = (
                max(0, predicted_yield - 1.96 * prediction_std),
                predicted_yield + 1.96 * prediction_std
            )
        else:
            # تقدير بسيط بناءً على الظروف
            base_yield = crop_info['baseline_yield']['average_conditions']
            condition_factor = current_conditions['overall_score']
            predicted_yield = base_yield * condition_factor
            
            confidence_interval = (
                predicted_yield * 0.8,
                predicted_yield * 1.2
            )
        
        # تصنيف مستوى العائد
        yield_category = self._categorize_yield_level(
            predicted_yield, crop_info['baseline_yield']
        )
        
        # مقارنة مع المعدلات الإقليمية
        regional_comparison = self._compare_with_regional_averages(
            predicted_yield, input_data.get('crop_type', 'wheat')
        )
        
        # توقع الانحراف عن المعدل
        yield_deviation = self._calculate_yield_deviation(
            predicted_yield, crop_info['baseline_yield']['average_conditions']
        )
        
        return {
            'predicted_yield_kg_ha': float(max(0, predicted_yield)),
            'yield_range_kg_ha': {
                'minimum': float(confidence_interval[0]),
                'maximum': float(confidence_interval[1])
            },
            'yield_category': yield_category,
            'regional_comparison': regional_comparison,
            'deviation_from_average': yield_deviation,
            'baseline_comparison': {
                'poor_conditions': crop_info['baseline_yield']['poor_conditions'],
                'average_conditions': crop_info['baseline_yield']['average_conditions'],
                'optimal_conditions': crop_info['baseline_yield']['optimal_conditions'],
                'predicted_vs_average': float(predicted_yield / crop_info['baseline_yield']['average_conditions'])
            }
        }
    
    def _predict_crop_quality(self, input_data: Dict, crop_info: Dict, 
                            current_conditions: Dict) -> Dict[str, Any]:
        """التنبؤ بجودة المحصول"""
        # استخراج متغيرات الجودة
        features = self._extract_prediction_features(input_data, current_conditions)
        
        if self.is_trained and len(features) > 0:
            features_scaled = self.quality_scaler.transform([features])
            quality_score = self.quality_assessment_model.predict(features_scaled)[0]
            quality_score = max(0.1, min(1.0, quality_score))
        else:
            # تقدير بسيط
            quality_score = current_conditions['overall_score'] * 0.9
        
        # تحليل معايير الجودة المحددة
        quality_parameters = crop_info.get('quality_parameters', {})
        parameter_analysis = {}
        
        for param, specs in quality_parameters.items():
            # تقدير القيمة المتوقعة
            if quality_score > 0.8:
                expected_value = specs['optimal']
            elif quality_score > 0.6:
                expected_value = specs['optimal'] * 0.9
            else:
                expected_value = specs['min'] + (specs['max'] - specs['min']) * quality_score
            
            parameter_analysis[param] = {
                'expected_value': float(expected_value),
                'optimal_value': specs['optimal'],
                'acceptable_range': (specs['min'], specs['max']),
                'quality_level': self._assess_parameter_quality(expected_value, specs)
            }
        
        # تحديد العوامل المؤثرة على الجودة
        quality_factors = self._analyze_quality_factors(
            input_data, current_conditions, crop_info
        )
        
        return {
            'overall_quality_score': float(quality_score),
            'quality_grade': self._grade_crop_quality(quality_score),
            'parameter_analysis': parameter_analysis,
            'quality_factors': quality_factors,
            'market_value_impact': self._assess_market_value_impact(quality_score),
            'improvement_potential': self._assess_quality_improvement_potential(
                quality_score, current_conditions
            )
        }
    
    def _analyze_yield_impact_factors(self, input_data: Dict, current_conditions: Dict,
                                    crop_info: Dict) -> Dict[str, Any]:
        """تحليل العوامل المؤثرة على العائد"""
        factors_analysis = {}
        
        # العوامل البيئية
        environmental_factors = {
            'temperature_impact': self._calculate_temperature_impact(
                input_data.get('weather_data', {}), crop_info
            ),
            'water_availability_impact': self._calculate_water_impact(
                input_data.get('soil_data', {}), input_data.get('weather_data', {})
            ),
            'soil_fertility_impact': self._calculate_soil_fertility_impact(
                input_data.get('soil_data', {})
            )
        }
        
        # العوامل الإدارية
        management_factors = {
            'irrigation_management': self._assess_irrigation_impact(
                input_data.get('management_practices', {})
            ),
            'fertilization_program': self._assess_fertilization_impact(
                input_data.get('management_practices', {})
            ),
            'pest_disease_control': self._assess_pest_disease_control_impact(
                input_data.get('management_practices', {})
            )
        }
        
        # العوامل البيولوجية
        biological_factors = {
            'variety_performance': self._assess_variety_impact(
                input_data.get('variety_info', {}), crop_info
            ),
            'plant_density': self._assess_plant_density_impact(
                input_data.get('planting_density', 1.0)
            ),
            'growth_stage_timing': self._assess_growth_timing_impact(
                input_data.get('planting_date'), crop_info
            )
        }
        
        # تجميع التأثيرات
        total_impact = self._calculate_total_factor_impact(
            environmental_factors, management_factors, biological_factors
        )
        
        return {
            'environmental_factors': environmental_factors,
            'management_factors': management_factors,
            'biological_factors': biological_factors,
            'total_impact_score': total_impact,
            'most_influential_factors': self._identify_most_influential_factors(
                environmental_factors, management_factors, biological_factors
            ),
            'improvement_opportunities': self._identify_improvement_opportunities(
                environmental_factors, management_factors, biological_factors
            )
        }
    
    def _recommend_yield_optimization(self, yield_prediction: Dict, impact_factors: Dict,
                                    risk_analysis: Dict) -> List[Dict[str, Any]]:
        """توصيات لتحسين العائد"""
        recommendations = []
        
        # توصيات إدارة المياه
        if impact_factors['environmental_factors']['water_availability_impact']['score'] < 0.8:
            recommendations.append({
                'category': 'إدارة المياه',
                'recommendation': 'تحسين نظام الري وجدولة الري حسب احتياجات المحصول',
                'potential_improvement': '15-25%',
                'implementation_cost': 'متوسط',
                'priority': 'عالي',
                'timeframe': 'فوري'
            })
        
        # توصيات التسميد
        if impact_factors['management_factors']['fertilization_program']['score'] < 0.7:
            recommendations.append({
                'category': 'التسميد',
                'recommendation': 'تحسين برنامج التسميد وإضافة العناصر النادرة',
                'potential_improvement': '10-20%',
                'implementation_cost': 'منخفض',
                'priority': 'عالي',
                'timeframe': 'أسبوع'
            })
        
        # توصيات مكافحة الآفات
        if impact_factors['management_factors']['pest_disease_control']['score'] < 0.8:
            recommendations.append({
                'category': 'مكافحة الآفات',
                'recommendation': 'تطبيق برنامج مكافحة متكامل للآفات والأمراض',
                'potential_improvement': '20-30%',
                'implementation_cost': 'متوسط',
                'priority': 'عالي جداً',
                'timeframe': 'فوري'
            })
        
        # توصيات اختيار الأصناف
        if impact_factors['biological_factors']['variety_performance']['score'] < 0.8:
            recommendations.append({
                'category': 'اختيار الأصناف',
                'recommendation': 'التبديل لأصناف عالية الإنتاج ومقاومة للظروف المحلية',
                'potential_improvement': '25-40%',
                'implementation_cost': 'منخفض',
                'priority': 'متوسط',
                'timeframe': 'الموسم القادم'
            })
        
        # توصيات تحسين التربة
        if impact_factors['environmental_factors']['soil_fertility_impact']['score'] < 0.7:
            recommendations.append({
                'category': 'تحسين التربة',
                'recommendation': 'إضافة المواد العضوية وتحسين بنية التربة',
                'potential_improvement': '15-25%',
                'implementation_cost': 'متوسط',
                'priority': 'متوسط',
                'timeframe': 'طويل المدى'
            })
        
        # توصيات تقنية
        recommendations.append({
            'category': 'تقنيات زراعية',
            'recommendation': 'استخدام أجهزة مراقبة التربة والطقس للإدارة الدقيقة',
            'potential_improvement': '10-15%',
            'implementation_cost': 'عالي',
            'priority': 'منخفض',
            'timeframe': 'متوسط المدى'
        })
        
        # ترتيب التوصيات حسب الأولوية والفائدة
        priority_scores = {'عالي جداً': 5, 'عالي': 4, 'متوسط': 3, 'منخفض': 2}
        for rec in recommendations:
            rec['priority_score'] = priority_scores.get(rec['priority'], 2)
        
        recommendations.sort(key=lambda x: x['priority_score'], reverse=True)
        
        return recommendations
    
    def _analyze_economic_viability(self, yield_prediction: Dict, quality_prediction: Dict,
                                  input_data: Dict) -> Dict[str, Any]:
        """تحليل الجدوى الاقتصادية"""
        crop_type = input_data.get('crop_type', 'wheat')
        farm_size = input_data.get('farm_size', 1.0)
        
        # أسعار السوق التقديرية (دينار/كيلوجرام)
        market_prices = {
            'wheat': {'low': 1.8, 'average': 2.2, 'high': 2.8},
            'corn': {'low': 1.5, 'average': 1.9, 'high': 2.4},
            'tomato': {'low': 1.2, 'average': 2.5, 'high': 4.0},
            'potato': {'low': 1.0, 'average': 1.8, 'high': 2.5},
            'olive': {'low': 4.0, 'average': 6.0, 'high': 8.5}
        }
        
        crop_prices = market_prices.get(crop_type, market_prices['wheat'])
        
        # تحديد السعر بناءً على الجودة
        quality_score = quality_prediction['overall_quality_score']
        if quality_score > 0.8:
            expected_price = crop_prices['high']
        elif quality_score > 0.6:
            expected_price = crop_prices['average']
        else:
            expected_price = crop_prices['low']
        
        # حساب الإيرادات
        predicted_yield = yield_prediction['predicted_yield_kg_ha']
        total_production = predicted_yield * farm_size
        gross_revenue = total_production * expected_price
        
        # تقدير التكاليف
        production_costs = self._estimate_production_costs(crop_type, farm_size)
        
        # حساب الربحية
        net_profit = gross_revenue - production_costs['total']
        profit_margin = (net_profit / gross_revenue) * 100 if gross_revenue > 0 else 0
        roi = (net_profit / production_costs['total']) * 100 if production_costs['total'] > 0 else 0
        
        # تحليل الحساسية
        sensitivity_analysis = self._perform_sensitivity_analysis(
            predicted_yield, expected_price, production_costs, farm_size
        )
        
        return {
            'revenue_analysis': {
                'total_production_kg': float(total_production),
                'expected_price_per_kg': float(expected_price),
                'gross_revenue': float(gross_revenue),
                'price_range': crop_prices
            },
            'cost_analysis': production_costs,
            'profitability': {
                'net_profit': float(net_profit),
                'profit_margin_percent': float(profit_margin),
                'roi_percent': float(roi),
                'break_even_yield': float(production_costs['total'] / expected_price / farm_size)
            },
            'sensitivity_analysis': sensitivity_analysis,
            'risk_assessment': {
                'market_risk': 'متوسط',
                'production_risk': self._assess_production_risk(yield_prediction),
                'price_volatility': self._assess_price_volatility(crop_type)
            }
        }
    
    # Helper methods (many more would be implemented)
    def _extract_prediction_features(self, input_data: Dict, current_conditions: Dict) -> List[float]:
        """استخراج المتغيرات للتنبؤ"""
        weather_data = input_data.get('weather_data', {})
        soil_data = input_data.get('soil_data', {})
        management_data = input_data.get('management_practices', {})
        
        return [
            weather_data.get('temperature', 25.0),
            weather_data.get('annual_rainfall', 400.0),
            weather_data.get('humidity', 60.0),
            weather_data.get('solar_radiation', 25.0),
            weather_data.get('wind_speed', 5.0),
            
            soil_data.get('ph', 6.5),
            soil_data.get('fertility_score', 0.7),
            soil_data.get('organic_matter', 3.0),
            soil_data.get('moisture_percentage', 50.0),
            
            management_data.get('irrigation_efficiency', 0.8),
            management_data.get('fertilizer_application_rate', 1.0),
            management_data.get('pest_management_score', 0.8),
            management_data.get('disease_control_score', 0.8),
            
            input_data.get('plant_density_factor', 1.0),
            input_data.get('variety_performance_factor', 1.0),
            current_conditions.get('overall_score', 0.7),
            
            input_data.get('days_from_planting', 60),
            input_data.get('season_suitability', 0.8),
            
            current_conditions.get('water_conditions', {}).get('stress_level', 0.3),
            current_conditions.get('temperature_conditions', {}).get('stress_level', 0.2),
            current_conditions.get('soil_conditions', {}).get('nutrient_stress', 0.2)
        ]
    
    def _categorize_yield_level(self, predicted_yield: float, baseline_yields: Dict) -> str:
        """تصنيف مستوى العائد"""
        if predicted_yield >= baseline_yields['excellent_conditions']:
            return 'ممتاز'
        elif predicted_yield >= baseline_yields['optimal_conditions']:
            return 'جيد جداً'
        elif predicted_yield >= baseline_yields['average_conditions']:
            return 'جيد'
        elif predicted_yield >= baseline_yields['poor_conditions']:
            return 'مقبول'
        else:
            return 'ضعيف'
    
    def _estimate_production_costs(self, crop_type: str, farm_size: float) -> Dict[str, float]:
        """تقدير تكاليف الإنتاج"""
        # تكاليف تقديرية لكل هكتار (دينار)
        base_costs = {
            'wheat': {'seeds': 200, 'fertilizer': 400, 'pesticides': 300, 'labor': 500, 'machinery': 300},
            'corn': {'seeds': 250, 'fertilizer': 500, 'pesticides': 400, 'labor': 600, 'machinery': 350},
            'tomato': {'seeds': 800, 'fertilizer': 1000, 'pesticides': 800, 'labor': 1500, 'machinery': 400},
            'potato': {'seeds': 1200, 'fertilizer': 600, 'pesticides': 500, 'labor': 800, 'machinery': 300},
            'olive': {'maintenance': 300, 'fertilizer': 200, 'pesticides': 250, 'labor': 400, 'machinery': 200}
        }
        
        crop_costs = base_costs.get(crop_type, base_costs['wheat'])
        
        # حساب التكاليف الإجمالية
        total_costs = {key: value * farm_size for key, value in crop_costs.items()}
        total_costs['total'] = sum(total_costs.values())
        
        return total_costs

    # ------------------------------------------------------------------
    # Image analysis
    # ------------------------------------------------------------------

    def _analyze_vegetation_coverage(self, img_array: np.ndarray) -> Dict[str, Any]:
        """نسبة الغطاء النباتي (النباتات الخضراء) في الصورة."""
        hsv = cv2.cvtColor(img_array, cv2.COLOR_RGB2HSV)
        green = cv2.inRange(hsv, (35, 40, 40), (85, 255, 255))
        coverage = float(np.sum(green > 0) / green.size * 100)
        return {
            'coverage_percent': coverage,
            'coverage_level': 'كثيف' if coverage > 60 else ('متوسط' if coverage > 30 else 'ضعيف'),
        }

    def _analyze_plant_health_from_image(self, img_array: np.ndarray) -> Dict[str, Any]:
        """تقدير صحة النباتات من الألوان (أخضر صحي مقابل أصفر/بني)."""
        hsv = cv2.cvtColor(img_array, cv2.COLOR_RGB2HSV)
        green = np.sum(cv2.inRange(hsv, (35, 40, 40), (85, 255, 255)) > 0) / img_array[:, :, 0].size
        yellow = np.sum(cv2.inRange(hsv, (15, 50, 50), (35, 255, 255)) > 0) / img_array[:, :, 0].size
        brown = np.sum(cv2.inRange(hsv, (5, 50, 20), (20, 255, 200)) > 0) / img_array[:, :, 0].size

        health_score = float(max(0.0, min(1.0, green - (yellow * 0.5) - (brown * 0.8))))
        return {
            'green_fraction': float(green),
            'yellow_fraction': float(yellow),
            'brown_fraction': float(brown),
            'health_score': health_score,
            'health_level': 'جيد' if health_score > 0.5 else ('متوسط' if health_score > 0.25 else 'ضعيف'),
        }

    def _estimate_plant_density(self, img_array: np.ndarray) -> Dict[str, Any]:
        """تقدير كثافة النباتات من النسيج البصري (تباين التدرج)."""
        gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
        edges = cv2.Canny(gray, 50, 150)
        edge_density = float(np.sum(edges > 0) / edges.size)
        return {
            'edge_density': edge_density,
            'density_estimate': 'كثيفة' if edge_density > 0.15 else ('متوسطة' if edge_density > 0.07 else 'منخفضة'),
        }

    def _detect_growth_stage_from_image(self, img_array: np.ndarray) -> Dict[str, Any]:
        """مؤشر أولي لمرحلة النمو من الغطاء الأخضر (تقدير بصري لا قياس)."""
        coverage = self._analyze_vegetation_coverage(img_array)['coverage_percent']
        if coverage > 70:
            return {'stage_hint': 'نمو خضري متقدم', 'confidence': 'منخفض'}
        if coverage > 35:
            return {'stage_hint': 'نمو خضري متوسط', 'confidence': 'منخفض'}
        return {'stage_hint': 'مرحلة مبكرة', 'confidence': 'منخفض'}

    def _extract_visual_yield_indicators(self, img_array: np.ndarray) -> Dict[str, Any]:
        """مؤشرات بصرية مرتبطة بالإنتاج (كثافة الغطاء وصحته)."""
        vegetation = self._analyze_vegetation_coverage(img_array)
        health = self._analyze_plant_health_from_image(img_array)
        indicator = float((vegetation['coverage_percent'] / 100 * 0.5) + (health['health_score'] * 0.5))
        return {
            'visual_yield_indicator': round(indicator, 3),
            'interpretation': 'مؤشر بصري مساعد وليس تنبؤاً بعائد كمّي',
        }

    def _assess_image_quality_for_analysis(self, img_array: np.ndarray) -> Dict[str, Any]:
        """تقييم جودة الصورة لصلاحيتها للتحليل."""
        gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
        sharpness = float(cv2.Laplacian(gray, cv2.CV_64F).var())
        brightness = float(np.mean(img_array))
        score = 0
        score += 50 if sharpness > 100 else 25
        score += 50 if 50 < brightness < 200 else 20
        return {
            'sharpness': sharpness,
            'brightness': brightness,
            'quality_score': score,
            'suitable_for_analysis': score >= 60,
        }

    # ------------------------------------------------------------------
    # Growing conditions
    # ------------------------------------------------------------------

    def _assess_temperature_stress(self, temperature: float, crop_info: Dict) -> float:
        """مستوى الإجهاد الحراري (0 = لا إجهاد، 1 = إجهاد أقصى)."""
        crop = crop_info.get('name_ar', '')
        optimal = (20, 30)
        for name, ranges in self.environmental_factors['temperature']['optimal_ranges'].items():
            if crop_info.get('crop_type') == name:
                optimal = ranges
                break
        if optimal[0] <= temperature <= optimal[1]:
            return 0.0
        if temperature > optimal[1]:
            return float(min(1.0, (temperature - optimal[1]) / 15.0))
        return float(min(1.0, (optimal[0] - temperature) / 15.0))

    def _assess_water_stress(self, soil_moisture: float, recent_rainfall: float,
                             crop_info: Dict) -> float:
        """مستوى الإجهاد المائي (0 = رطوبة كافية، 1 = جفاف شديد)."""
        soil_moisture = float(soil_moisture or 0)
        recent_rainfall = float(recent_rainfall or 0)
        effective = soil_moisture + recent_rainfall * 2
        if effective >= 50:
            return 0.0
        return float(min(1.0, (50 - effective) / 50.0))

    def _assess_soil_health_impact(self, soil_data: Dict, crop_info: Dict) -> Dict[str, Any]:
        """تأثير صحة التربة على الإنتاج."""
        soil_data = soil_data or {}
        ph = float(soil_data.get('ph', 6.5))
        fertility = float(soil_data.get('fertility_score', 0.7))
        organic_matter = float(soil_data.get('organic_matter', 3.0))

        if 6.0 <= ph <= 7.5:
            ph_factor = 1.0
        elif 5.5 <= ph < 6.0 or 7.5 < ph <= 8.5:
            ph_factor = 0.9
        else:
            ph_factor = 0.7

        fertility_factor = 0.7 + 0.5 * max(0.0, min(1.0, fertility))
        organic_factor = min(1.1, 0.8 + organic_matter / 20.0)
        score = float(min(1.0, ph_factor * fertility_factor * organic_factor))

        return {
            'ph': ph,
            'ph_factor': ph_factor,
            'fertility_factor': fertility_factor,
            'organic_matter_factor': organic_factor,
            'score': score,
            'nutrient_stress': float(max(0.0, 1.0 - score)),
        }

    def _assess_management_practices(self, management_data: Dict,
                                     crop_info: Dict) -> Dict[str, Any]:
        """تقييم فعالية الممارسات الإدارية."""
        m = management_data or {}
        irrigation = float(m.get('irrigation_efficiency', 0.8))
        fertilizer = float(m.get('fertilizer_application_rate', 1.0))
        pest = float(m.get('pest_management_score', 0.8))
        disease = float(m.get('disease_control_score', 0.8))

        score = float(min(1.0, irrigation * 0.3 + min(1.0, fertilizer) * 0.25 + pest * 0.2 + disease * 0.25))
        return {
            'irrigation_efficiency': irrigation,
            'fertilizer_rate': fertilizer,
            'pest_management_score': pest,
            'disease_control_score': disease,
            'overall_score': score,
        }

    def _calculate_overall_condition_score(self, temp_stress: float, water_stress: float,
                                           soil_health: Dict,
                                           management_effectiveness: Dict) -> float:
        """درجة الحالة العامة للنمو (0..1)."""
        env = (1 - temp_stress) * 0.35 + (1 - water_stress) * 0.35
        soil = float(soil_health.get('score', 0.7)) * 0.15
        mgmt = float(management_effectiveness.get('overall_score', 0.7)) * 0.15
        return float(max(0.0, min(1.0, env + soil + mgmt)))

    def _categorize_growing_conditions(self, score: float) -> str:
        if score >= 0.85:
            return 'ممتازة'
        if score >= 0.7:
            return 'جيدة'
        if score >= 0.5:
            return 'متوسطة'
        if score >= 0.3:
            return 'ضعيفة'
        return 'سيئة'

    def _identify_limiting_factors(self, temp_stress: float, water_stress: float,
                                   soil_health: Dict,
                                   management_effectiveness: Dict) -> List[str]:
        """العوامل المحدّدة للإنتاج بترتيب الأهمية."""
        factors = []
        if water_stress > 0.3:
            factors.append(f"إجهاد مائي ({water_stress:.0%})")
        if temp_stress > 0.3:
            factors.append(f"إجهاد حراري ({temp_stress:.0%})")
        if float(soil_health.get('nutrient_stress', 0)) > 0.3:
            factors.append('نقص خصوبة/عناصر غذائية')
        if float(management_effectiveness.get('overall_score', 1)) < 0.7:
            factors.append('ضعف الممارسات الإدارية')
        return factors or ['لا توجد عوامل محدّدة بارزة']

    # ------------------------------------------------------------------
    # Yield prediction helpers
    # ------------------------------------------------------------------

    def _estimate_prediction_uncertainty(self, features_scaled: np.ndarray) -> float:
        """تقدير عدم اليقين في التنبؤ عبر تباين تنبؤات أشجار الغابة."""
        try:
            model = self.yield_prediction_model
            if hasattr(model, 'estimators_') and len(model.estimators_) > 1:
                preds = np.array([tree.predict(features_scaled)[0] for tree in model.estimators_])
                return float(np.std(preds))
        except Exception as exc:  # pragma: no cover - defensive
            logger.warning('uncertainty estimate failed: %s', exc)
        return 0.1 * float(np.mean(features_scaled)) if features_scaled.size else 1.0

    def _compare_with_regional_averages(self, predicted_yield: float,
                                        crop_type: str) -> Dict[str, Any]:
        """مقارنة العائد المتوقع بالمعدل الإقليمي المرجعي."""
        crop_info = self.crop_yield_database.get(crop_type, self.crop_yield_database['wheat'])
        regional_avg = crop_info['baseline_yield']['average_conditions']
        ratio = predicted_yield / regional_avg if regional_avg else 1.0
        return {
            'regional_average_kg_ha': regional_avg,
            'ratio_to_regional': round(float(ratio), 3),
            'position': 'أعلى من المعدل' if ratio > 1.05 else ('أقل من المعدل' if ratio < 0.95 else 'قريب من المعدل'),
        }

    def _calculate_yield_deviation(self, predicted_yield: float,
                                   average_yield: float) -> Dict[str, Any]:
        """الانحراف عن المعدل (مطلق ونسبي)."""
        deviation = predicted_yield - average_yield
        percent = (deviation / average_yield * 100) if average_yield else 0.0
        return {
            'absolute_deviation_kg_ha': float(deviation),
            'percent_deviation': round(float(percent), 2),
        }

    def _assess_parameter_quality(self, value: float, specs: Dict) -> str:
        """تصنيف جودة معيار واحد مقابل مواصفاته."""
        optimal = specs.get('optimal', value)
        low = specs.get('min', value)
        high = specs.get('max', value)
        if value == optimal or (abs(value - optimal) <= (high - low) * 0.1):
            return 'ممتاز'
        if low <= value <= high:
            return 'مقبول'
        return 'خارج النطاق'

    def _analyze_quality_factors(self, input_data: Dict, current_conditions: Dict,
                                 crop_info: Dict) -> List[Dict[str, Any]]:
        """العوامل المؤثرة على جودة المحصول."""
        return [
            {'factor': 'التغذية المعدنية', 'score': float(current_conditions.get('soil_conditions', {}).get('score', 0.7))},
            {'factor': 'إدارة الري', 'score': float(current_conditions.get('management_assessment', {}).get('irrigation_efficiency', 0.8))},
            {'factor': 'الظروف الحرارية', 'score': float(1 - current_conditions.get('temperature_conditions', {}).get('stress_level', 0.2))},
        ]

    def _grade_crop_quality(self, quality_score: float) -> str:
        if quality_score >= 0.85:
            return 'درجة أولى'
        if quality_score >= 0.7:
            return 'درجة ثانية'
        if quality_score >= 0.5:
            return 'درجة ثالثة'
        return 'درجة رابعة'

    def _assess_market_value_impact(self, quality_score: float) -> Dict[str, Any]:
        """أثر الجودة على القيمة السوقية (نسبي، ليس سعراً حقيقياً)."""
        premium = (quality_score - 0.6) * 50 if quality_score > 0.6 else (quality_score - 0.6) * 40
        return {
            'price_premium_percent': round(float(premium), 1),
            'note': 'تقدير نسبي لأثر الجودة؛ لا يمثل سعراً سوقياً حقيقياً',
        }

    def _assess_quality_improvement_potential(self, quality_score: float,
                                              current_conditions: Dict) -> Dict[str, Any]:
        """إمكانية تحسين الجودة."""
        gap = max(0.0, 1.0 - quality_score)
        return {
            'potential_gain': round(gap, 3),
            'levers': ['تحسين التسميد', 'ضبط الري', 'مكافحة الأمراض'],
        }

    def _calculate_temperature_impact(self, weather_data: Dict,
                                      crop_info: Dict) -> Dict[str, Any]:
        temp = float((weather_data or {}).get('temperature', 25.0))
        stress = self._assess_temperature_stress(temp, crop_info)
        return {'score': float(1 - stress), 'temperature': temp, 'stress_level': stress}

    def _calculate_water_impact(self, soil_data: Dict, weather_data: Dict) -> Dict[str, Any]:
        moisture = float((soil_data or {}).get('moisture_percentage', 50))
        rain = float((weather_data or {}).get('recent_rainfall', 0))
        stress = self._assess_water_stress(moisture, rain, {})
        return {'score': float(1 - stress), 'moisture': moisture, 'stress_level': stress}

    def _calculate_soil_fertility_impact(self, soil_data: Dict) -> Dict[str, Any]:
        health = self._assess_soil_health_impact(soil_data, {})
        return {'score': float(health['score']), 'ph': health['ph']}

    def _assess_irrigation_impact(self, management_data: Dict) -> Dict[str, Any]:
        eff = float((management_data or {}).get('irrigation_efficiency', 0.8))
        return {'score': eff, 'efficiency': eff}

    def _assess_fertilization_impact(self, management_data: Dict) -> Dict[str, Any]:
        rate = float((management_data or {}).get('fertilizer_application_rate', 1.0))
        return {'score': float(min(1.0, rate)), 'rate': rate}

    def _assess_pest_disease_control_impact(self, management_data: Dict) -> Dict[str, Any]:
        m = management_data or {}
        pest = float(m.get('pest_management_score', 0.8))
        disease = float(m.get('disease_control_score', 0.8))
        return {'score': float((pest + disease) / 2), 'pest_score': pest, 'disease_score': disease}

    def _assess_variety_impact(self, variety_info: Dict, crop_info: Dict) -> Dict[str, Any]:
        perf = float((variety_info or {}).get('performance_factor', 1.0))
        return {'score': float(min(1.0, perf)), 'performance_factor': perf}

    def _assess_plant_density_impact(self, plant_density: float) -> Dict[str, Any]:
        density = float(plant_density or 1.0)
        # الكثافة المثلى حول 1.0؛ الانحراف يخفض النتيجة.
        score = float(max(0.0, 1.0 - abs(density - 1.0)))
        return {'score': score, 'density_factor': density}

    def _assess_growth_timing_impact(self, planting_date, crop_info: Dict) -> Dict[str, Any]:
        """أثر توقيت الزراعة على العائد."""
        if not planting_date:
            return {'score': 0.7, 'note': 'تاريخ الزراعة غير متوفر'}
        try:
            planted = datetime.fromisoformat(str(planting_date))
            days = (datetime.now() - planted).days
            return {'score': 0.8 if 0 <= days <= 200 else 0.6, 'days_from_planting': days}
        except Exception:
            return {'score': 0.7, 'note': 'صيغة تاريخ غير صالحة'}

    def _calculate_total_factor_impact(self, environmental_factors: Dict,
                                       management_factors: Dict,
                                       biological_factors: Dict) -> float:
        """التأثير الكلي المجمّع للعوامل (0..1)."""
        def avg(group):
            vals = [v.get('score', 0.7) for v in group.values() if isinstance(v, dict)]
            return sum(vals) / len(vals) if vals else 0.7
        env = avg(environmental_factors)
        mgmt = avg(management_factors)
        bio = avg(biological_factors)
        return float(max(0.0, min(1.0, env * 0.5 + mgmt * 0.3 + bio * 0.2)))

    def _identify_most_influential_factors(self, environmental_factors: Dict,
                                           management_factors: Dict,
                                           biological_factors: Dict) -> List[Dict[str, Any]]:
        """أكثر العوامل تأثيراً (الأدنى نقاطاً = الأكثر تحديداً)."""
        all_factors = {}
        for group in (environmental_factors, management_factors, biological_factors):
            for name, data in group.items():
                if isinstance(data, dict):
                    all_factors[name] = float(data.get('score', 0.7))
        ranked = sorted(all_factors.items(), key=lambda x: x[1])
        return [{'factor': k, 'score': v} for k, v in ranked[:3]]

    def _identify_improvement_opportunities(self, environmental_factors: Dict,
                                            management_factors: Dict,
                                            biological_factors: Dict) -> List[str]:
        opportunities = []
        for group in (environmental_factors, management_factors, biological_factors):
            for name, data in group.items():
                if isinstance(data, dict) and float(data.get('score', 1.0)) < 0.7:
                    opportunities.append(f"تحسين {name.replace('_', ' ')}")
        return opportunities or ['الظروف الحالية قريبة من المثالية']

    # ------------------------------------------------------------------
    # Risk / economics
    # ------------------------------------------------------------------

    def _assess_production_risk(self, yield_prediction: Dict) -> str:
        """مستوى مخاطر الإنتاج بناءً على اتساع مجال الثقة."""
        try:
            rng = yield_prediction['yield_range_kg_ha']
            mid = yield_prediction['predicted_yield_kg_ha'] or 1
            spread = (rng['maximum'] - rng['minimum']) / mid
            if spread > 0.6:
                return 'عالي'
            if spread > 0.35:
                return 'متوسط'
            return 'منخفض'
        except Exception:
            return 'متوسط'

    def _assess_price_volatility(self, crop_type: str) -> str:
        """تقلب السعر المرجعي حسب المحصول (وصفي)."""
        volatile = {'tomato', 'potato'}
        stable = {'wheat', 'olive'}
        if crop_type in volatile:
            return 'عالي'
        if crop_type in stable:
            return 'منخفض'
        return 'متوسط'

    def _perform_sensitivity_analysis(self, predicted_yield: float, expected_price: float,
                                      production_costs: Dict, farm_size: float) -> Dict[str, Any]:
        """تحليل حساسية بسيط: تغيّر العائد والسعر ±10/20%."""
        total_cost = production_costs.get('total', 0)
        scenarios = {}
        for delta in (-0.2, -0.1, 0.0, 0.1, 0.2):
            revenue = predicted_yield * (1 + delta) * expected_price * (1 + delta) * farm_size
            scenarios[f'{int(delta * 100):+d}%'] = {
                'gross_revenue': round(float(revenue), 2),
                'net_profit': round(float(revenue - total_cost), 2),
            }
        return {'scenarios': scenarios, 'note': 'تحليل حساسية تقديري'}

    def _project_future_growth_stages(self, input_data: Dict, growth_stage_assessment: Dict,
                                      crop_info: Dict) -> List[Dict[str, Any]]:
        """توقعات مراحل النمو القادمة زمنياً (مبنية على مدة المراحل)."""
        stages = crop_info.get('critical_growth_stages', {})
        current = growth_stage_assessment.get('current_stage')
        keys = list(stages.keys())
        start = keys.index(current) + 1 if current in keys else 0
        projections = []
        cursor = datetime.now()
        for name in keys[start:start + 3]:
            duration = int(stages[name].get('duration_days', 20))
            cursor = cursor + timedelta(days=duration)
            projections.append({
                'stage': name,
                'expected_start': cursor.strftime('%Y-%m-%d'),
                'duration_days': duration,
                'yield_impact': stages[name].get('yield_impact'),
            })
        return projections

    def _calculate_prediction_confidence(self, input_data: Dict,
                                         current_conditions: Dict) -> Dict[str, Any]:
        """مؤشر ثقة التنبؤ بناءً على اكتمال المعطيات."""
        required = ['weather_data', 'soil_data', 'management_practices']
        provided = sum(1 for k in required if input_data.get(k))
        completeness = provided / len(required)
        condition_score = float(current_conditions.get('overall_score', 0.7))
        confidence = round(0.5 * completeness + 0.5 * condition_score, 3)
        return {
            'confidence_score': confidence,
            'level': 'عالي' if confidence > 0.75 else ('متوسط' if confidence > 0.5 else 'منخفض'),
            'data_completeness': completeness,
            'note': 'الثقة تعكس اكتمال المعطيات؛ التنبؤ مبني على نماذج مدربة على بيانات اصطناعية',
        }

    def _assess_current_growth_stage(self, input_data: Dict,
                                     crop_info: Dict) -> Dict[str, Any]:
        """تقييم مرحلة النمو الحالية من عدد الأيام منذ الزراعة."""
        planting_date = input_data.get('planting_date')
        days = None
        if planting_date:
            try:
                days = (datetime.now() - datetime.fromisoformat(str(planting_date))).days
            except Exception:
                days = None
        if days is None:
            days = int(input_data.get('days_from_planting', 60))

        stages = crop_info.get('critical_growth_stages', {})
        cumulative = 0
        current_stage = next(iter(stages), 'vegetative')
        for name, info in stages.items():
            cumulative += int(info.get('duration_days', 20))
            if days <= cumulative:
                current_stage = name
                break
        else:
            current_stage = list(stages.keys())[-1] if stages else 'maturity'

        return {
            'current_stage': current_stage,
            'days_from_planting': days,
            'progress_note': f'المرحلة الحالية: {current_stage}',
        }

    def _analyze_yield_risks_opportunities(self, input_data: Dict, current_conditions: Dict,
                                           crop_info: Dict) -> Dict[str, Any]:
        """تحليل مخاطر وفرص العائد."""
        risks = []
        opportunities = []
        water_stress = float(current_conditions.get('water_conditions', {}).get('stress_level', 0))
        temp_stress = float(current_conditions.get('temperature_conditions', {}).get('stress_level', 0))
        if water_stress > 0.4:
            risks.append('إجهاد مائي محتمل يهدد العائد')
        if temp_stress > 0.4:
            risks.append('إجهاد حراري محتمل')
        if float(current_conditions.get('soil_conditions', {}).get('score', 0.7)) > 0.8:
            opportunities.append('خصوبة تربة جيدة يمكن استغلالها')
        if float(current_conditions.get('overall_score', 0.7)) > 0.75:
            opportunities.append('ظروف نمو مواتية لتحقيق عائد مرتفع')
        return {
            'risks': risks or ['لا توجد مخاطر كبرى ملحوظة'],
            'opportunities': opportunities or ['تحسين الممارسات الإدارية'],
        }

# Factory function
def create_yield_predictor_ai() -> YieldPredictorAI:
    """إنشاء وإرجاع نسخة من YieldPredictorAI"""
    return YieldPredictorAI()
