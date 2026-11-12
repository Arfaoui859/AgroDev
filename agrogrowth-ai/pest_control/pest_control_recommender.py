"""
PestControlRecommender - نظام توصية لعلاج الأمراض والحشرات
نظام توصية لعلاج الأمراض والحشرات حسب نوع الآفة والصورة وتحليل الحالة
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Any, Optional, Union
import logging
from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler, LabelEncoder
import cv2
from PIL import Image
import base64
import io
import json

logger = logging.getLogger(__name__)

class PestControlRecommender:
    """نظام ذكي لتوصية علاج الآفات والأمراض النباتية"""
    
    def __init__(self):
        self.pest_detection_model = None
        self.severity_assessment_model = None
        self.treatment_effectiveness_model = None
        self.scaler = StandardScaler()
        self.label_encoder = LabelEncoder()
        self.is_trained = False
        
        # قاعدة بيانات شاملة للآفات والأمراض
        self.pest_disease_database = {
            # الآفات الحشرية
            'aphids': {
                'name_ar': 'المن',
                'category': 'حشرات',
                'host_plants': ['tomato', 'potato', 'wheat', 'corn', 'olive'],
                'symptoms': [
                    'أوراق مجعدة ومشوهة',
                    'إفرازات عسلية لزجة',
                    'اصفرار الأوراق',
                    'تجمعات حشرية على الأوراق الصغيرة'
                ],
                'identification_features': {
                    'size_mm': (1, 4),
                    'color': ['أخضر', 'أسود', 'بني'],
                    'location': 'أسفل الأوراق والبراعم',
                    'season_peak': ['spring', 'early_summer']
                },
                'damage_level': 'medium_to_high',
                'economic_threshold': '5-10 حشرات/ورقة',
                'treatment_options': [
                    {
                        'method': 'biological_control',
                        'name_ar': 'المكافحة الحيوية',
                        'treatment': 'إطلاق الدعسوقة والزنابير المفترسة',
                        'effectiveness': 85,
                        'cost_per_hectare': 150,
                        'application_frequency': 'مرة واحدة',
                        'safety_level': 'آمن جداً',
                        'residual_effect_days': 30
                    },
                    {
                        'method': 'organic_soap',
                        'name_ar': 'صابون حشري طبيعي',
                        'treatment': 'رش بمحلول الصابون الطبيعي 2%',
                        'effectiveness': 70,
                        'cost_per_hectare': 80,
                        'application_frequency': 'كل 3-5 أيام',
                        'safety_level': 'آمن',
                        'residual_effect_days': 0
                    },
                    {
                        'method': 'systemic_insecticide',
                        'name_ar': 'مبيد حشري جهازي',
                        'treatment': 'إيميداكلوبريد 200 جم/هكتار',
                        'effectiveness': 95,
                        'cost_per_hectare': 200,
                        'application_frequency': 'مرة كل 21 يوم',
                        'safety_level': 'حذر',
                        'residual_effect_days': 21
                    }
                ]
            },
            'spider_mites': {
                'name_ar': 'العنكبوت الأحمر',
                'category': 'عنكبوتيات',
                'host_plants': ['tomato', 'potato', 'corn', 'cotton'],
                'symptoms': [
                    'نقط صفراء صغيرة على الأوراق',
                    'خيوط عنكبوتية رفيعة',
                    'اصفرار وذبول الأوراق',
                    'سقوط الأوراق المبكر'
                ],
                'identification_features': {
                    'size_mm': (0.3, 0.5),
                    'color': ['أحمر', 'أصفر', 'أخضر'],
                    'location': 'أسفل الأوراق',
                    'season_peak': ['summer', 'dry_periods']
                },
                'damage_level': 'high',
                'economic_threshold': '3-5 عنكبوت/ورقة',
                'treatment_options': [
                    {
                        'method': 'predatory_mites',
                        'name_ar': 'العنكبوت المفترس',
                        'treatment': 'إطلاق Phytoseiulus persimilis',
                        'effectiveness': 90,
                        'cost_per_hectare': 300,
                        'application_frequency': 'مرة واحدة',
                        'safety_level': 'آمن جداً',
                        'residual_effect_days': 45
                    },
                    {
                        'method': 'miticide_spray',
                        'name_ar': 'مبيد عنكبوتي',
                        'treatment': 'أباميكتين 18 جم/هكتار',
                        'effectiveness': 85,
                        'cost_per_hectare': 250,
                        'application_frequency': 'كل 10-14 يوم',
                        'safety_level': 'حذر',
                        'residual_effect_days': 14
                    },
                    {
                        'method': 'water_spray',
                        'name_ar': 'الرش بالماء',
                        'treatment': 'رش قوي بالماء يومياً',
                        'effectiveness': 60,
                        'cost_per_hectare': 20,
                        'application_frequency': 'يومياً لمدة أسبوع',
                        'safety_level': 'آمن جداً',
                        'residual_effect_days': 0
                    }
                ]
            },
            'whiteflies': {
                'name_ar': 'الذبابة البيضاء',
                'category': 'حشرات',
                'host_plants': ['tomato', 'potato', 'cotton', 'cucumber'],
                'symptoms': [
                    'أوراق صفراء لزجة',
                    'حشرات بيضاء صغيرة تطير عند الهز',
                    'إفرازات عسلية',
                    'نمو فطريات سوداء'
                ],
                'identification_features': {
                    'size_mm': (1, 2),
                    'color': ['أبيض', 'أصفر فاتح'],
                    'location': 'أسفل الأوراق الصغيرة',
                    'season_peak': ['summer', 'autumn']
                },
                'damage_level': 'high',
                'economic_threshold': '1-2 بالغ/ورقة',
                'treatment_options': [
                    {
                        'method': 'yellow_sticky_traps',
                        'name_ar': 'المصائد اللاصقة الصفراء',
                        'treatment': '20-30 مصيدة/هكتار',
                        'effectiveness': 75,
                        'cost_per_hectare': 100,
                        'application_frequency': 'تركيب مستمر',
                        'safety_level': 'آمن جداً',
                        'residual_effect_days': 30
                    },
                    {
                        'method': 'neem_oil',
                        'name_ar': 'زيت النيم',
                        'treatment': 'زيت النيم 1% + صابون',
                        'effectiveness': 70,
                        'cost_per_hectare': 120,
                        'application_frequency': 'كل 7-10 أيام',
                        'safety_level': 'آمن',
                        'residual_effect_days': 7
                    },
                    {
                        'method': 'systemic_insecticide',
                        'name_ar': 'مبيد جهازي',
                        'treatment': 'إيميداكلوبريد + ثياميثوكسام',
                        'effectiveness': 90,
                        'cost_per_hectare': 280,
                        'application_frequency': 'كل 21 يوم',
                        'safety_level': 'حذر',
                        'residual_effect_days': 21
                    }
                ]
            },
            
            # الأمراض الفطرية
            'powdery_mildew': {
                'name_ar': 'البياض الدقيقي',
                'category': 'أمراض فطرية',
                'host_plants': ['tomato', 'cucumber', 'grape', 'wheat'],
                'symptoms': [
                    'طبقة بيضاء مسحوقية على الأوراق',
                    'تشويه الأوراق والبراعم',
                    'اصفرار وذبول الأوراق',
                    'انخفاض جودة الثمار'
                ],
                'identification_features': {
                    'appearance': 'مسحوق أبيض يمكن إزالته',
                    'location': 'سطح الأوراق العلوي والسفلي',
                    'season_peak': ['spring', 'autumn'],
                    'humidity_range': (60, 80)
                },
                'damage_level': 'medium_to_high',
                'economic_threshold': '5-10% إصابة أوراق',
                'treatment_options': [
                    {
                        'method': 'baking_soda_spray',
                        'name_ar': 'محلول بيكربونات الصوديوم',
                        'treatment': 'بيكربونات الصوديوم 5 جم/لتر',
                        'effectiveness': 65,
                        'cost_per_hectare': 50,
                        'application_frequency': 'كل 7 أيام',
                        'safety_level': 'آمن جداً',
                        'residual_effect_days': 5
                    },
                    {
                        'method': 'sulfur_fungicide',
                        'name_ar': 'مبيد فطري كبريتي',
                        'treatment': 'كبريت قابل للبلل 3 كجم/هكتار',
                        'effectiveness': 80,
                        'cost_per_hectare': 150,
                        'application_frequency': 'كل 10-14 يوم',
                        'safety_level': 'آمن',
                        'residual_effect_days': 14
                    },
                    {
                        'method': 'systemic_fungicide',
                        'name_ar': 'مبيد فطري جهازي',
                        'treatment': 'تيبوكونازول 250 مل/هكتار',
                        'effectiveness': 95,
                        'cost_per_hectare': 300,
                        'application_frequency': 'كل 21 يوم',
                        'safety_level': 'حذر',
                        'residual_effect_days': 21
                    }
                ]
            },
            'late_blight': {
                'name_ar': 'اللفحة المتأخرة',
                'category': 'أمراض فطرية',
                'host_plants': ['tomato', 'potato'],
                'symptoms': [
                    'بقع بنية مائية على الأوراق',
                    'نمو أبيض على أسفل الأوراق',
                    'تعفن الثمار والدرنات',
                    'رائحة كريهة'
                ],
                'identification_features': {
                    'appearance': 'بقع غير منتظمة بنية محاطة بهالة صفراء',
                    'location': 'الأوراق والسيقان والثمار',
                    'season_peak': ['late_summer', 'autumn'],
                    'humidity_range': (85, 100)
                },
                'damage_level': 'very_high',
                'economic_threshold': '1% إصابة أوراق',
                'treatment_options': [
                    {
                        'method': 'copper_fungicide',
                        'name_ar': 'مبيد فطري نحاسي',
                        'treatment': 'أوكسي كلوريد نحاس 2.5 كجم/هكتار',
                        'effectiveness': 75,
                        'cost_per_hectare': 200,
                        'application_frequency': 'كل 7-10 أيام',
                        'safety_level': 'آمن',
                        'residual_effect_days': 10
                    },
                    {
                        'method': 'systemic_fungicide',
                        'name_ar': 'مبيد فطري جهازي',
                        'treatment': 'ميتالاكسيل + مانكوزيب 2.5 كجم/هكتار',
                        'effectiveness': 90,
                        'cost_per_hectare': 350,
                        'application_frequency': 'كل 14 يوم',
                        'safety_level': 'حذر',
                        'residual_effect_days': 14
                    },
                    {
                        'method': 'resistant_varieties',
                        'name_ar': 'أصناف مقاومة',
                        'treatment': 'زراعة أصناف مقاومة وراثياً',
                        'effectiveness': 85,
                        'cost_per_hectare': 50,
                        'application_frequency': 'عند الزراعة',
                        'safety_level': 'آمن جداً',
                        'residual_effect_days': 365
                    }
                ]
            },
            
            # الأمراض البكتيرية
            'bacterial_wilt': {
                'name_ar': 'الذبول البكتيري',
                'category': 'أمراض بكتيرية',
                'host_plants': ['tomato', 'potato', 'eggplant'],
                'symptoms': [
                    'ذبول مفاجئ للنبات',
                    'اصفرار الأوراق السفلية',
                    'تلون الأوعية الناقلة',
                    'موت النبات'
                ],
                'identification_features': {
                    'appearance': 'ذبول سريع بدون اصفرار تدريجي',
                    'location': 'النبات كاملاً',
                    'season_peak': ['summer', 'hot_weather'],
                    'temperature_range': (25, 35)
                },
                'damage_level': 'very_high',
                'economic_threshold': '1% نباتات مصابة',
                'treatment_options': [
                    {
                        'method': 'crop_rotation',
                        'name_ar': 'تناوب المحاصيل',
                        'treatment': 'تناوب مع محاصيل غير حساسة لمدة 3-4 سنوات',
                        'effectiveness': 80,
                        'cost_per_hectare': 0,
                        'application_frequency': 'سنوياً',
                        'safety_level': 'آمن جداً',
                        'residual_effect_days': 365
                    },
                    {
                        'method': 'soil_solarization',
                        'name_ar': 'تشميس التربة',
                        'treatment': 'تغطية التربة بالبلاستيك الشفاف لمدة 6-8 أسابيع',
                        'effectiveness': 70,
                        'cost_per_hectare': 800,
                        'application_frequency': 'قبل الزراعة',
                        'safety_level': 'آمن جداً',
                        'residual_effect_days': 180
                    },
                    {
                        'method': 'resistant_varieties',
                        'name_ar': 'أصناف مقاومة',
                        'treatment': 'زراعة أصناف مقاومة للذبول البكتيري',
                        'effectiveness': 90,
                        'cost_per_hectare': 100,
                        'application_frequency': 'عند الزراعة',
                        'safety_level': 'آمن جداً',
                        'residual_effect_days': 365
                    }
                ]
            }
        }
        
        # مستويات الأمان للمبيدات
        self.safety_levels = {
            'آمن جداً': {
                'preharvest_interval_days': 0,
                'worker_reentry_hours': 4,
                'restrictions': ['لا توجد قيود خاصة']
            },
            'آمن': {
                'preharvest_interval_days': 3,
                'worker_reentry_hours': 12,
                'restrictions': ['تجنب الرش أثناء الرياح']
            },
            'حذر': {
                'preharvest_interval_days': 7,
                'worker_reentry_hours': 24,
                'restrictions': ['ارتداء معدات الوقاية', 'تجنب الرش قبل الحصاد']
            },
            'خطر': {
                'preharvest_interval_days': 14,
                'worker_reentry_hours': 48,
                'restrictions': ['معدات وقاية كاملة', 'تجنب الاستخدام قرب مصادر المياه']
            }
        }
        
        # العوامل البيئية المؤثرة
        self.environmental_factors = {
            'temperature': {
                'optimal_range': (15, 25),
                'high_risk_range': (30, 45),
                'low_risk_range': (5, 15)
            },
            'humidity': {
                'fungal_favorable': (70, 95),
                'insect_favorable': (40, 70),
                'low_disease_risk': (30, 50)
            },
            'rainfall': {
                'high_disease_risk': '>20mm في 48 ساعة',
                'moderate_risk': '10-20mm في 48 ساعة',
                'low_risk': '<10mm في 48 ساعة'
            }
        }
        
        # Synthetic in-process training is intentionally disabled.
        self.model_source = "synthetic-demo-disabled"
    
    def analyze_pest_problem(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """تحليل مشكلة الآفات وتقديم التوصيات"""
        try:
            if not self.is_trained:
                raise ValueError("Models not trained")
            
            # استخراج وتحليل الصورة إذا وجدت
            image_analysis = None
            # Pydantic fills optional fields with None, so a key's presence is not
            # proof of an image; only analyse when an image was actually sent.
            if input_data.get('image_data'):
                image_analysis = self._analyze_pest_image(input_data['image_data'])
            
            # تحليل الأعراض المدخلة
            symptoms_analysis = self._analyze_symptoms(
                input_data.get('symptoms', []),
                input_data.get('crop_type', 'tomato')
            )
            
            # تحديد الآفة/المرض المحتمل
            pest_identification = self._identify_pest_disease(
                input_data, image_analysis, symptoms_analysis
            )
            
            # تقييم شدة الإصابة
            severity_assessment = self._assess_pest_severity(
                input_data, pest_identification
            )
            
            # تحليل المخاطر
            risk_analysis = self._analyze_pest_risks(
                pest_identification, severity_assessment, input_data
            )
            
            # توصيات العلاج
            treatment_recommendations = self._recommend_treatments(
                pest_identification, severity_assessment, input_data
            )
            
            # جدولة العلاج
            treatment_schedule = self._create_treatment_schedule(
                treatment_recommendations, input_data
            )
            
            # تدابير وقائية
            prevention_measures = self._recommend_prevention_measures(
                pest_identification, input_data.get('crop_type', 'tomato')
            )
            
            # تقييم التكاليف
            cost_analysis = self._calculate_treatment_costs(
                treatment_recommendations, input_data.get('farm_size', 1.0)
            )
            
            # مؤشرات المتابعة
            monitoring_plan = self._create_monitoring_plan(
                pest_identification, treatment_recommendations
            )
            
            return {
                'pest_identification': pest_identification,
                'severity_assessment': severity_assessment,
                'risk_analysis': risk_analysis,
                'treatment_recommendations': treatment_recommendations,
                'treatment_schedule': treatment_schedule,
                'prevention_measures': prevention_measures,
                'cost_analysis': cost_analysis,
                'monitoring_plan': monitoring_plan,
                'image_analysis': image_analysis,
                'symptoms_analysis': symptoms_analysis,
                'analysis_timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error in pest analysis: {e}")
            raise
    
    def _analyze_pest_image(self, image_data: Union[str, bytes]) -> Dict[str, Any]:
        """تحليل صورة الآفة أو المرض"""
        try:
            # معالجة الصورة
            if isinstance(image_data, str):
                image_bytes = base64.b64decode(image_data)
                image = Image.open(io.BytesIO(image_bytes))
            else:
                image = Image.open(io.BytesIO(image_data))
            
            # تحويل إلى RGB
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # تحويل إلى numpy array
            img_array = np.array(image)
            
            # تحليل الألوان
            color_analysis = self._analyze_image_colors(img_array)
            
            # تحليل الأنماط والأشكال
            pattern_analysis = self._analyze_image_patterns(img_array)
            
            # تحليل الضرر المرئي
            damage_analysis = self._analyze_visible_damage(img_array)
            
            # تقدير احتمالية الآفات بناءً على الصورة
            pest_probabilities = self._estimate_pest_from_image(
                color_analysis, pattern_analysis, damage_analysis
            )
            
            return {
                'color_analysis': color_analysis,
                'pattern_analysis': pattern_analysis,
                'damage_analysis': damage_analysis,
                'pest_probabilities': pest_probabilities,
                'image_quality': self._assess_image_quality(img_array)
            }
            
        except Exception as e:
            logger.error(f"Error analyzing image: {e}")
            return {'error': 'فشل في تحليل الصورة'}
    
    def _analyze_symptoms(self, symptoms: List[str], crop_type: str) -> Dict[str, Any]:
        """تحليل الأعراض المدخلة"""
        symptom_keywords = {
            'aphids': [
                'أوراق مجعدة', 'إفرازات لزجة', 'حشرات صغيرة خضراء',
                'اصفرار', 'تجمعات حشرية'
            ],
            'spider_mites': [
                'نقط صفراء', 'خيوط عنكبوتية', 'أوراق بقع صفراء صغيرة',
                'ذبول الأوراق', 'سقوط الأوراق'
            ],
            'whiteflies': [
                'حشرات بيضاء', 'تطير عند الهز', 'أوراق لزجة',
                'اصفرار الأوراق', 'فطريات سوداء'
            ],
            'powdery_mildew': [
                'طبقة بيضاء', 'مسحوق أبيض', 'البياض الدقيقي',
                'تشويه الأوراق', 'أوراق مغبرة'
            ],
            'late_blight': [
                'بقع بنية', 'تعفن', 'رائحة كريهة',
                'بقع مائية', 'نمو أبيض أسفل الأوراق'
            ],
            'bacterial_wilt': [
                'ذبول مفاجئ', 'موت النبات', 'اصفرار سفلي',
                'ذبول سريع', 'تلون الأوعية'
            ]
        }
        
        # حساب نقاط التطابق لكل آفة
        pest_scores = {}
        total_symptoms = len(symptoms)
        
        for pest, keywords in symptom_keywords.items():
            matches = 0
            for symptom in symptoms:
                for keyword in keywords:
                    if keyword in symptom:
                        matches += 1
                        break
            
            score = matches / max(1, total_symptoms) if total_symptoms > 0 else 0
            pest_scores[pest] = score
        
        # ترتيب حسب النقاط
        sorted_pests = sorted(pest_scores.items(), key=lambda x: x[1], reverse=True)
        
        return {
            'symptom_count': total_symptoms,
            'pest_likelihood_scores': dict(sorted_pests),
            'most_likely_pest': sorted_pests[0][0] if sorted_pests else None,
            'confidence_level': sorted_pests[0][1] if sorted_pests else 0.0
        }
    
    def _identify_pest_disease(self, input_data: Dict, image_analysis: Optional[Dict],
                              symptoms_analysis: Dict) -> Dict[str, Any]:
        """تحديد الآفة أو المرض"""
        # استخراج المعطيات للنموذج
        features = self._extract_features_for_identification(input_data)
        
        if self.is_trained and len(features) > 0:
            # الاستخدام النموذج المدرب
            features_scaled = self.scaler.transform([features])
            
            # تنبؤ الآفة
            pest_probabilities = self.pest_detection_model.predict_proba(features_scaled)[0]
            pest_names = self.label_encoder.inverse_transform(range(len(pest_probabilities)))
            
            # ترتيب حسب الاحتمالية
            pest_predictions = list(zip(pest_names, pest_probabilities))
            pest_predictions.sort(key=lambda x: x[1], reverse=True)
        else:
            # استخدام تحليل الأعراض كبديل
            pest_predictions = [
                (symptoms_analysis.get('most_likely_pest', 'aphids'),
                 symptoms_analysis.get('confidence_level', 0.5))
            ]

        # دمج مطابقة الأعراض (قاعدة ثابتة ومفسّرة) مع النموذج. النموذج مدرب على
        # بيانات اصطناعية فيقل وزنه، لكن الإشارة النصية القوية للأعراض تُرفع
        # النتيجة لأنها مبنية على قاعدة معرفية صريحة.
        if self.is_trained and symptoms_analysis.get('symptom_count'):
            symptom_scores = symptoms_analysis.get('pest_likelihood_scores', {})
            if symptom_scores and max(symptom_scores.values()) > 0:
                blended = {}
                for pest, prob in pest_predictions[:5]:
                    blended[str(pest)] = float(prob) * 0.6
                for pest, score in symptom_scores.items():
                    if score > 0:
                        blended[pest] = blended.get(pest, 0.0) + float(score) * 0.4
                pest_predictions = sorted(
                    blended.items(), key=lambda x: x[1], reverse=True
                )
        
        # دمج نتائج تحليل الصورة إذا توفرت
        if image_analysis and 'pest_probabilities' in image_analysis:
            image_pests = image_analysis['pest_probabilities']
            # دمج النتائج بأوزان
            combined_scores = {}
            for pest, prob in pest_predictions[:3]:
                model_score = prob * 0.6  # 60% وزن للنموذج
                image_score = image_pests.get(pest, 0) * 0.4  # 40% وزن للصورة
                combined_scores[pest] = model_score + image_score
            
            # إعادة ترتيب
            pest_predictions = sorted(combined_scores.items(), key=lambda x: x[1], reverse=True)
        
        # الحصول على معلومات الآفة الأكثر احتمالاً
        most_likely_pest = str(pest_predictions[0][0])
        confidence = pest_predictions[0][1]
        pest_info = self.pest_disease_database.get(most_likely_pest, {})
        
        return {
            'identified_pest': most_likely_pest,
            'pest_name_ar': pest_info.get('name_ar', most_likely_pest),
            'confidence_score': float(confidence),
            'category': pest_info.get('category', 'غير محدد'),
            'top_predictions': [
                {
                    'pest': pest,
                    'name_ar': self.pest_disease_database.get(pest, {}).get('name_ar', pest),
                    'probability': float(prob),
                    'category': self.pest_disease_database.get(pest, {}).get('category', 'غير محدد')
                }
                for pest, prob in [(str(p), pr) for p, pr in pest_predictions[:5]]
            ],
            'identification_method': 'model_based' if self.is_trained else 'symptom_based',
            'pest_characteristics': {
                'symptoms': pest_info.get('symptoms', []),
                'host_plants': pest_info.get('host_plants', []),
                'damage_level': pest_info.get('damage_level', 'medium')
            }
        }
    
    def _assess_pest_severity(self, input_data: Dict, pest_identification: Dict) -> Dict[str, Any]:
        """تقييم شدة الإصابة"""
        pest_name = pest_identification['identified_pest']
        pest_info = self.pest_disease_database.get(pest_name, {})
        
        # استخراج المعطيات
        features = self._extract_features_for_identification(input_data)
        
        if self.is_trained and len(features) > 0:
            # استخدام النموذج
            features_scaled = self.scaler.transform([features])
            predicted_severity = self.severity_assessment_model.predict(features_scaled)[0]
            predicted_severity = max(0.0, min(1.0, predicted_severity))
        else:
            # تقدير بناءً على المعطيات المدخلة
            affected_area = input_data.get('affected_area_percentage', 20) / 100
            plant_count = input_data.get('affected_plant_count', 0)
            total_plants = input_data.get('total_plant_count', 100)
            
            if total_plants > 0:
                plant_percentage = plant_count / total_plants
            else:
                plant_percentage = affected_area
            
            predicted_severity = min(1.0, (affected_area + plant_percentage) / 2)
        
        # تصنيف الشدة
        if predicted_severity < 0.2:
            severity_level = 'خفيف'
            urgency = 'منخفض'
        elif predicted_severity < 0.4:
            severity_level = 'متوسط'
            urgency = 'متوسط'
        elif predicted_severity < 0.7:
            severity_level = 'شديد'
            urgency = 'عالي'
        else:
            severity_level = 'حاد جداً'
            urgency = 'عاجل'
        
        # تحديد العتبة الاقتصادية
        economic_threshold = pest_info.get('economic_threshold', 'غير محدد')
        
        return {
            'severity_score': float(predicted_severity),
            'severity_level': severity_level,
            'urgency_level': urgency,
            'economic_threshold': economic_threshold,
            'above_threshold': bool(predicted_severity > 0.3),  # عتبة افتراضية
            'damage_assessment': {
                'current_damage_percent': float(predicted_severity * 100),
                'potential_yield_loss': float(min(80, predicted_severity * 60)),
                'spread_risk': self._assess_spread_risk(pest_name, predicted_severity),
                'recovery_potential': self._assess_recovery_potential(predicted_severity)
            }
        }
    
    def _analyze_pest_risks(self, pest_identification: Dict, severity_assessment: Dict,
                           input_data: Dict) -> Dict[str, Any]:
        """تحليل مخاطر الآفات"""
        pest_name = pest_identification['identified_pest']
        pest_info = self.pest_disease_database.get(pest_name, {})
        severity = severity_assessment['severity_score']
        
        # مخاطر الانتشار
        spread_risk = self._calculate_spread_risk(
            pest_name, severity, input_data.get('weather_conditions', {})
        )
        
        # مخاطر اقتصادية
        economic_risk = self._calculate_economic_risk(
            pest_info, severity, input_data.get('farm_size', 1.0)
        )
        
        # مخاطر بيئية
        environmental_risk = self._assess_environmental_conditions_risk(
            pest_name, input_data.get('weather_conditions', {})
        )
        
        # مخاطر مقاومة المبيدات
        resistance_risk = self._assess_resistance_risk(
            pest_name, input_data.get('treatment_history', [])
        )
        
        return {
            'spread_risk': spread_risk,
            'economic_risk': economic_risk,
            'environmental_risk': environmental_risk,
            'resistance_risk': resistance_risk,
            'overall_risk_level': self._calculate_overall_risk(
                spread_risk, economic_risk, environmental_risk
            ),
            'risk_factors': self._identify_risk_factors(pest_name, input_data),
            'risk_mitigation_priority': self._determine_risk_priority(
                spread_risk, economic_risk, severity
            )
        }
    
    def _recommend_treatments(self, pest_identification: Dict, severity_assessment: Dict,
                            input_data: Dict) -> List[Dict[str, Any]]:
        """توصية العلاجات المناسبة"""
        pest_name = pest_identification['identified_pest']
        pest_info = self.pest_disease_database.get(pest_name, {})
        severity = severity_assessment['severity_score']
        
        # الحصول على خيارات العلاج
        treatment_options = pest_info.get('treatment_options', [])
        
        recommendations = []
        for treatment in treatment_options:
            # تقدير فعالية العلاج للحالة الحالية
            effectiveness = self._estimate_treatment_effectiveness(
                treatment, severity, input_data
            )
            
            # تحليل التكلفة والفائدة
            cost_benefit = self._analyze_treatment_cost_benefit(
                treatment, input_data.get('farm_size', 1.0), effectiveness
            )
            
            # معلومات الأمان
            safety_info = self._get_treatment_safety_info(treatment)
            
            # شروط التطبيق
            application_conditions = self._get_application_conditions(
                treatment, input_data.get('weather_conditions', {})
            )
            
            recommendation = {
                'treatment_method': treatment['method'],
                'treatment_name_ar': treatment['name_ar'],
                'treatment_details': treatment['treatment'],
                'effectiveness_score': float(effectiveness),
                'cost_per_hectare': treatment['cost_per_hectare'],
                'application_frequency': treatment['application_frequency'],
                'safety_level': treatment['safety_level'],
                'residual_effect_days': treatment['residual_effect_days'],
                'cost_benefit_ratio': cost_benefit,
                'safety_information': safety_info,
                'application_conditions': application_conditions,
                'suitability_score': self._calculate_treatment_suitability(
                    treatment, severity, input_data
                ),
                'pros_and_cons': self._get_treatment_pros_cons(treatment)
            }
            
            recommendations.append(recommendation)
        
        # ترتيب التوصيات حسب الملائمة
        recommendations.sort(key=lambda x: x['suitability_score'], reverse=True)
        
        return recommendations
    
    def _create_treatment_schedule(self, treatment_recommendations: List[Dict],
                                 input_data: Dict) -> Dict[str, Any]:
        """إنشاء جدولة العلاج"""
        if not treatment_recommendations:
            return {'message': 'لا توجد توصيات علاج'}
        
        # اختيار أفضل علاج
        primary_treatment = treatment_recommendations[0]
        
        # إنشاء جدولة زمنية
        schedule = []
        start_date = datetime.now()
        
        # تحديد عدد التطبيقات
        frequency = primary_treatment['application_frequency']
        if 'يوم' in frequency:
            interval_days = int(''.join(filter(str.isdigit, frequency.split()[1])))
            applications = 3  # افتراضي
        elif 'أسبوع' in frequency:
            interval_days = 7
            applications = 4
        else:
            interval_days = 7
            applications = 3
        
        for i in range(applications):
            application_date = start_date + timedelta(days=i * interval_days)
            
            # تحديد أفضل وقت في اليوم
            best_time = self._determine_best_application_time(
                primary_treatment, input_data.get('weather_conditions', {})
            )
            
            schedule_entry = {
                'application_number': i + 1,
                'date': application_date.strftime('%Y-%m-%d'),
                'best_time': best_time,
                'treatment': primary_treatment['treatment_details'],
                'dosage': self._calculate_dosage(
                    primary_treatment, input_data.get('farm_size', 1.0)
                ),
                'weather_requirements': self._get_weather_requirements(primary_treatment),
                'preparation_steps': self._get_preparation_steps(primary_treatment),
                'safety_precautions': self._get_safety_precautions(primary_treatment)
            }
            
            schedule.append(schedule_entry)
        
        return {
            'primary_treatment': primary_treatment['treatment_name_ar'],
            'total_applications': applications,
            'schedule': schedule,
            'alternative_treatments': [
                {
                    'name': t['treatment_name_ar'],
                    'suitability': t['suitability_score']
                }
                for t in treatment_recommendations[1:3]
            ],
            'monitoring_intervals': self._determine_monitoring_intervals(primary_treatment),
            'success_indicators': self._define_success_indicators(primary_treatment)
        }
    
    def _recommend_prevention_measures(self, pest_identification: Dict, 
                                     crop_type: str) -> List[Dict[str, Any]]:
        """توصية التدابير الوقائية"""
        pest_name = pest_identification['identified_pest']
        pest_info = self.pest_disease_database.get(pest_name, {})
        
        prevention_measures = [
            {
                'category': 'الإدارة الزراعية',
                'measures': [
                    'تناوب المحاصيل لكسر دورة حياة الآفات',
                    'إزالة بقايا المحاصيل المصابة',
                    'اختيار أصناف مقاومة',
                    'تنظيم مواعيد الزراعة'
                ],
                'priority': 'عالي',
                'cost_level': 'منخفض'
            },
            {
                'category': 'المراقبة والكشف المبكر',
                'measures': [
                    'فحص دوري للنباتات (2-3 مرات أسبوعياً)',
                    'استخدام المصائد الفيرمونية',
                    'مراقبة الظروف البيئية المحفزة',
                    'توثيق حالات الإصابة'
                ],
                'priority': 'عالي جداً',
                'cost_level': 'منخفض'
            },
            {
                'category': 'التحكم البيولوجي',
                'measures': [
                    'تشجيع الأعداء الطبيعية',
                    'زراعة نباتات جاذبة للحشرات المفيدة',
                    'تجنب المبيدات واسعة المدى',
                    'إنشاء ملاجئ للحشرات المفيدة'
                ],
                'priority': 'متوسط',
                'cost_level': 'متوسط'
            },
            {
                'category': 'إدارة البيئة',
                'measures': [
                    'تحسين تصريف المياه',
                    'ضبط كثافة الزراعة',
                    'إزالة الأعشاب الضارة',
                    'تحسين التهوية بين النباتات'
                ],
                'priority': 'متوسط',
                'cost_level': 'متوسط'
            }
        ]
        
        # إضافة تدابير خاصة بالآفة
        if pest_name == 'aphids':
            prevention_measures.append({
                'category': 'خاص بالمن',
                'measures': [
                    'استخدام النشارة الفضية العاكسة',
                    'زراعة نباتات طاردة مثل الريحان',
                    'التخلص من المن على الأعشاب المجاورة'
                ],
                'priority': 'متوسط',
                'cost_level': 'منخفض'
            })
        elif pest_name == 'spider_mites':
            prevention_measures.append({
                'category': 'خاص بالعنكبوت الأحمر',
                'measures': [
                    'المحافظة على رطوبة التربة',
                    'تجنب الإجهاد المائي',
                    'رش الأوراق بالماء لزيادة الرطوبة'
                ],
                'priority': 'عالي',
                'cost_level': 'منخفض'
            })
        
        return prevention_measures
    
    def _calculate_treatment_costs(self, treatment_recommendations: List[Dict],
                                 farm_size: float) -> Dict[str, Any]:
        """حساب تكاليف العلاج"""
        if not treatment_recommendations:
            return {'total_cost': 0, 'message': 'لا توجد توصيات علاج'}
        
        cost_analysis = {}
        
        for treatment in treatment_recommendations[:3]:  # أفضل 3 علاجات
            # تكلفة المادة الفعالة
            material_cost = treatment['cost_per_hectare'] * farm_size
            
            # تكلفة التطبيق (عمالة + معدات)
            application_cost = farm_size * 50  # تقدير 50 دينار/هكتار
            
            # عدد التطبيقات
            frequency = treatment['application_frequency']
            if 'مرة' in frequency and 'واحدة' in frequency:
                applications = 1
            elif 'يوم' in frequency:
                applications = 3  # افتراضي
            else:
                applications = 2
            
            # التكلفة الإجمالية
            total_cost = (material_cost + application_cost) * applications
            
            # تكلفة الفرصة البديلة (فقدان الإنتاج)
            potential_loss = farm_size * 5000 * 0.3  # تقدير 30% من قيمة الإنتاج
            
            cost_analysis[treatment['treatment_name_ar']] = {
                'material_cost': float(material_cost),
                'application_cost': float(application_cost),
                'total_applications': applications,
                'total_treatment_cost': float(total_cost),
                'potential_loss_if_untreated': float(potential_loss),
                'cost_benefit_ratio': float(potential_loss / total_cost) if total_cost > 0 else 0,
                'payback_analysis': {
                    'break_even_point': f'{total_cost / potential_loss:.1%}' if potential_loss > 0 else 'غير محدد',
                    'roi_percentage': f'{((potential_loss - total_cost) / total_cost) * 100:.1f}%' if total_cost > 0 else 'غير محدد'
                }
            }
        
        # التكلفة الموصى بها (أفضل علاج)
        recommended_cost = cost_analysis.get(
            treatment_recommendations[0]['treatment_name_ar'], {}
        )
        
        return {
            'recommended_treatment_cost': recommended_cost,
            'cost_comparison': cost_analysis,
            'cost_saving_tips': [
                'اختيار التوقيت المناسب للعلاج',
                'استخدام الجرعة الصحيحة تجنباً للهدر',
                'دمج العلاج مع عمليات زراعية أخرى',
                'الاستفادة من الخصومات عند الشراء بكميات'
            ]
        }
    
    def _create_monitoring_plan(self, pest_identification: Dict,
                              treatment_recommendations: List[Dict]) -> Dict[str, Any]:
        """إنشاء خطة المتابعة والمراقبة"""
        pest_name = pest_identification['identified_pest']
        
        # مؤشرات النجاح
        success_indicators = [
            'انخفاض أعداد الآفات بنسبة 80% خلال أسبوع',
            'توقف انتشار الإصابة للنباتات الجديدة',
            'تحسن مظهر النباتات المصابة',
            'عدم ظهور أعراض جديدة'
        ]
        
        # جدولة المراقبة
        monitoring_schedule = [
            {
                'timing': 'قبل العلاج',
                'activities': [
                    'توثيق مستوى الإصابة الحالي',
                    'تصوير المناطق المصابة',
                    'عد الآفات في عينة ممثلة'
                ]
            },
            {
                'timing': 'بعد 3 أيام من العلاج',
                'activities': [
                    'فحص فعالية العلاج الأولى',
                    'البحث عن آفات ميتة أو ضعيفة',
                    'تقييم استجابة النباتات'
                ]
            },
            {
                'timing': 'بعد أسبوع من العلاج',
                'activities': [
                    'عد الآفات المتبقية',
                    'تقييم انتشار الإصابة',
                    'تحديد الحاجة لعلاج إضافي'
                ]
            },
            {
                'timing': 'المتابعة طويلة المدى',
                'activities': [
                    'مراقبة أسبوعية لمنع معاودة الإصابة',
                    'فحص ظهور آفات جديدة',
                    'تقييم صحة النباتات العامة'
                ]
            }
        ]
        
        # علامات التحذير للتدخل الطارئ
        warning_signs = [
            'زيادة أعداد الآفات بدلاً من انخفاضها',
            'ظهور أعراض مقاومة للعلاج',
            'انتشار الإصابة لمناطق جديدة',
            'تدهور حالة النباتات المعالجة'
        ]
        
        return {
            'monitoring_schedule': monitoring_schedule,
            'success_indicators': success_indicators,
            'warning_signs': warning_signs,
            'documentation_requirements': [
                'تسجيل يومي لحالة المحصول',
                'تصوير دوري للمناطق المعالجة',
                'تسجيل الظروف الجوية',
                'توثيق كميات العلاج المستخدمة'
            ],
            'decision_points': [
                {
                    'condition': 'عدم تحسن بعد أسبوع',
                    'action': 'تغيير طريقة العلاج أو زيادة الجرعة'
                },
                {
                    'condition': 'ظهور آفات جديدة',
                    'action': 'إعادة التقييم والتشخيص'
                },
                {
                    'condition': 'تحسن ملحوظ',
                    'action': 'متابعة الخطة الحالية مع تقليل التكرار'
                }
            ]
        }
    
    # Helper methods
    def _analyze_image_colors(self, img_array: np.ndarray) -> Dict[str, Any]:
        """تحليل الألوان في الصورة"""
        # تحليل القنوات اللونية
        mean_rgb = np.mean(img_array, axis=(0, 1))
        
        # تحويل إلى HSV لتحليل أفضل
        hsv_img = cv2.cvtColor(img_array, cv2.COLOR_RGB2HSV)
        mean_hsv = np.mean(hsv_img, axis=(0, 1))
        
        # تحليل الألوان السائدة
        dominant_colors = self._extract_dominant_colors(img_array)
        
        return {
            'mean_rgb': mean_rgb.tolist(),
            'mean_hsv': mean_hsv.tolist(),
            'dominant_colors': dominant_colors,
            'color_diversity': float(np.std(img_array)),
            'green_content': float(mean_rgb[1]),  # قناة الأخضر
            'brown_content': self._detect_brown_content(img_array)
        }
    
    def _analyze_image_patterns(self, img_array: np.ndarray) -> Dict[str, Any]:
        """تحليل الأنماط والأشكال في الصورة"""
        gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
        
        # كشف الحواف
        edges = cv2.Canny(gray, 50, 150)
        edge_density = np.sum(edges > 0) / edges.size
        
        # تحليل النسيج
        texture_variance = np.var(gray)
        
        # كشف البقع الدائرية (قد تشير للآفات)
        circles = cv2.HoughCircles(
            gray, cv2.HOUGH_GRADIENT, 1, 20,
            param1=50, param2=30, minRadius=5, maxRadius=50
        )
        
        spot_count = len(circles[0]) if circles is not None else 0
        
        return {
            'edge_density': float(edge_density),
            'texture_variance': float(texture_variance),
            'spot_count': spot_count,
            'pattern_regularity': self._assess_pattern_regularity(gray),
            'damage_patterns': self._identify_damage_patterns(img_array)
        }
    
    def _analyze_visible_damage(self, img_array: np.ndarray) -> Dict[str, Any]:
        """تحليل الضرر المرئي"""
        # تحويل إلى HSV للتحليل الأفضل
        hsv = cv2.cvtColor(img_array, cv2.COLOR_RGB2HSV)
        
        # كشف المناطق الصفراء (اصفرار الأوراق)
        yellow_mask = cv2.inRange(hsv, (15, 50, 50), (35, 255, 255))
        yellow_percentage = np.sum(yellow_mask > 0) / yellow_mask.size
        
        # كشف المناطق البنية (تلف/موت الأنسجة)
        brown_mask = cv2.inRange(hsv, (5, 50, 20), (20, 255, 200))
        brown_percentage = np.sum(brown_mask > 0) / brown_mask.size
        
        # كشف المناطق البيضاء (فطريات أو حشرات)
        white_mask = cv2.inRange(hsv, (0, 0, 200), (180, 30, 255))
        white_percentage = np.sum(white_mask > 0) / white_mask.size
        
        return {
            'yellow_damage_percentage': float(yellow_percentage * 100),
            'brown_damage_percentage': float(brown_percentage * 100),
            'white_spots_percentage': float(white_percentage * 100),
            'overall_damage_level': self._calculate_overall_damage_level(
                yellow_percentage, brown_percentage
            ),
            'damage_distribution': self._analyze_damage_distribution(
                yellow_mask, brown_mask
            )
        }
    
    def _estimate_pest_from_image(self, color_analysis: Dict, pattern_analysis: Dict,
                                damage_analysis: Dict) -> Dict[str, float]:
        """تقدير احتمالية الآفات من تحليل الصورة"""
        pest_probabilities = {}
        
        # تحليل المن
        if (color_analysis['green_content'] > 100 and 
            damage_analysis['yellow_damage_percentage'] > 10):
            pest_probabilities['aphids'] = 0.7
        
        # تحليل العنكبوت الأحمر
        if (damage_analysis['yellow_damage_percentage'] > 20 and
            pattern_analysis['spot_count'] > 5):
            pest_probabilities['spider_mites'] = 0.8
        
        # تحليل الذبابة البيضاء
        if damage_analysis['white_spots_percentage'] > 5:
            pest_probabilities['whiteflies'] = 0.6
        
        # تحليل البياض الدقيقي
        if damage_analysis['white_spots_percentage'] > 15:
            pest_probabilities['powdery_mildew'] = 0.9
        
        # تحليل اللفحة المتأخرة
        if (damage_analysis['brown_damage_percentage'] > 25 and
            pattern_analysis['edge_density'] > 0.3):
            pest_probabilities['late_blight'] = 0.8
        
        # تطبيع الاحتماليات
        total = sum(pest_probabilities.values())
        if total > 0:
            pest_probabilities = {k: v/total for k, v in pest_probabilities.items()}
        
        return pest_probabilities
    
    def _assess_image_quality(self, img_array: np.ndarray) -> Dict[str, Any]:
        """تقييم جودة الصورة"""
        # حساب الوضوح
        gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        
        # حساب السطوع
        brightness = np.mean(img_array)
        
        # حساب التباين
        contrast = np.std(img_array)
        
        # تقييم الجودة
        quality_score = 0
        if laplacian_var > 100:  # وضوح جيد
            quality_score += 30
        if 50 < brightness < 200:  # سطوع مناسب
            quality_score += 30
        if contrast > 30:  # تباين جيد
            quality_score += 40
        
        quality_level = 'ممتاز' if quality_score > 80 else \
                      'جيد' if quality_score > 60 else \
                      'مقبول' if quality_score > 40 else 'ضعيف'
        
        return {
            'quality_score': quality_score,
            'quality_level': quality_level,
            'sharpness': float(laplacian_var),
            'brightness': float(brightness),
            'contrast': float(contrast),
            'recommendations': self._get_image_improvement_tips(quality_score)
        }
    
    def _extract_features_for_identification(self, input_data: Dict) -> List[float]:
        """استخراج الميزات للتعرف على الآفات"""
        # المتغيرات البيئية
        weather = input_data.get('weather_conditions', {})
        temperature = weather.get('temperature', 25.0)
        humidity = weather.get('humidity', 60.0)
        rainfall = weather.get('recent_rainfall', 0.0)
        
        # متغيرات النبات
        plant_age = input_data.get('plant_age_days', 60)
        plant_health = input_data.get('plant_health_score', 0.7)
        
        # شدة الأعراض
        affected_area = input_data.get('affected_area_percentage', 20) / 100
        symptom_severity = input_data.get('symptom_severity', 0.5)
        
        # متغيرات إضافية
        crop_stage = input_data.get('crop_stage', 0.5)  # 0-1
        previous_treatment = 1 if input_data.get('previous_treatment', False) else 0
        farm_size = input_data.get('farm_size', 1.0)
        
        return [
            temperature, humidity, rainfall, plant_age,
            plant_health, affected_area, crop_stage, previous_treatment,
            farm_size
        ]
    
    def _assess_spread_risk(self, pest_name: str, severity: float) -> str:
        """تقييم خطر الانتشار"""
        spread_factors = {
            'aphids': 0.9,  # ينتشر بسرعة
            'spider_mites': 0.8,
            'whiteflies': 0.85,
            'powdery_mildew': 0.7,
            'late_blight': 0.95,  # ينتشر بسرعة جداً
            'bacterial_wilt': 0.6
        }
        
        base_risk = spread_factors.get(pest_name, 0.5)
        adjusted_risk = base_risk * (severity + 0.5)  # تأثير الشدة
        
        if adjusted_risk > 0.8:
            return 'عالي جداً'
        elif adjusted_risk > 0.6:
            return 'عالي'
        elif adjusted_risk > 0.4:
            return 'متوسط'
        else:
            return 'منخفض'
    
    def _assess_recovery_potential(self, severity: float) -> str:
        """تقييم إمكانية التعافي"""
        if severity < 0.3:
            return 'ممتاز - تعافي سريع متوقع'
        elif severity < 0.5:
            return 'جيد - تعافي في 2-3 أسابيع'
        elif severity < 0.7:
            return 'متوسط - تعافي في 4-6 أسابيع'
        else:
            return 'ضعيف - قد يحتاج موسم كامل'
    
    # Additional helper methods...
    def _calculate_spread_risk(self, pest_name: str, severity: float, 
                             weather_conditions: Dict) -> Dict[str, Any]:
        """حساب مخاطر الانتشار"""
        base_risk = {'aphids': 0.8, 'spider_mites': 0.7, 'late_blight': 0.9}.get(pest_name, 0.5)
        
        # تأثير الطقس
        temp = weather_conditions.get('temperature', 25)
        humidity = weather_conditions.get('humidity', 60)
        
        weather_factor = 1.0
        if 20 <= temp <= 30 and humidity > 60:
            weather_factor = 1.3  # ظروف مواتية للانتشار
        elif temp > 35 or temp < 10:
            weather_factor = 0.7  # ظروف غير مواتية
        
        final_risk = min(1.0, base_risk * severity * weather_factor)
        
        return {
            'risk_score': float(final_risk),
            'risk_level': 'عالي' if final_risk > 0.7 else 'متوسط' if final_risk > 0.4 else 'منخفض',
            'factors': ['شدة الإصابة', 'نوع الآفة', 'الظروف الجوية']
        }
    
    def _calculate_economic_risk(self, pest_info: Dict, severity: float, 
                               farm_size: float) -> Dict[str, Any]:
        """حساب المخاطر الاقتصادية"""
        damage_potential = {'very_high': 0.8, 'high': 0.6, 'medium_to_high': 0.5}.get(
            pest_info.get('damage_level', 'medium'), 0.3
        )
        
        # تقدير الخسارة المالية
        estimated_yield_per_hectare = 5000  # دينار/هكتار (تقدير)
        potential_loss = farm_size * estimated_yield_per_hectare * damage_potential * severity
        
        risk_level = 'عالي' if potential_loss > 10000 else \
                    'متوسط' if potential_loss > 3000 else 'منخفض'
        
        return {
            'potential_loss_amount': float(potential_loss),
            'risk_level': risk_level,
            'affected_area_value': float(farm_size * estimated_yield_per_hectare),
            'loss_percentage': float(damage_potential * severity * 100)
        }
    
    def _assess_environmental_conditions_risk(self, pest_name: str, 
                                            weather_conditions: Dict) -> Dict[str, Any]:
        """تقييم مخاطر الظروف البيئية"""
        temp = weather_conditions.get('temperature', 25)
        humidity = weather_conditions.get('humidity', 60)
        
        # مصفوفة المخاطر حسب الآفة والظروف
        risk_matrix = {
            'aphids': {'temp_range': (15, 25), 'humidity_range': (40, 70)},
            'spider_mites': {'temp_range': (25, 35), 'humidity_range': (30, 50)},
            'powdery_mildew': {'temp_range': (15, 25), 'humidity_range': (60, 80)},
            'late_blight': {'temp_range': (15, 20), 'humidity_range': (80, 95)}
        }
        
        pest_requirements = risk_matrix.get(pest_name, {
            'temp_range': (20, 30), 'humidity_range': (50, 70)
        })
        
        # حساب الملائمة
        temp_suitable = pest_requirements['temp_range'][0] <= temp <= pest_requirements['temp_range'][1]
        humidity_suitable = pest_requirements['humidity_range'][0] <= humidity <= pest_requirements['humidity_range'][1]
        
        if temp_suitable and humidity_suitable:
            risk_level = 'عالي'
            risk_score = 0.8
        elif temp_suitable or humidity_suitable:
            risk_level = 'متوسط'
            risk_score = 0.5
        else:
            risk_level = 'منخفض'
            risk_score = 0.2
        
        return {
            'risk_score': risk_score,
            'risk_level': risk_level,
            'favorable_conditions': temp_suitable and humidity_suitable,
            'temperature_suitability': temp_suitable,
            'humidity_suitability': humidity_suitable
        }
    
    def _assess_resistance_risk(self, pest_name: str, treatment_history: List[str]) -> Dict[str, Any]:
        """تقييم مخاطر مقاومة المبيدات"""
        # عد استخدام نفس المجموعة الكيميائية
        chemical_groups_used = len(set(treatment_history))
        total_treatments = len(treatment_history)
        
        if total_treatments == 0:
            risk_level = 'منخفض'
            risk_score = 0.1
        elif chemical_groups_used == 1 and total_treatments > 3:
            risk_level = 'عالي'
            risk_score = 0.8
        elif chemical_groups_used < total_treatments / 2:
            risk_level = 'متوسط'
            risk_score = 0.5
        else:
            risk_level = 'منخفض'
            risk_score = 0.2
        
        return {
            'risk_score': risk_score,
            'risk_level': risk_level,
            'treatments_count': total_treatments,
            'chemical_diversity': chemical_groups_used,
            'recommendations': [
                'تناوب المجموعات الكيميائية',
                'استخدام طرق مكافحة متنوعة',
                'تجنب الاستخدام المتكرر لنفس المبيد'
            ]
        }
    
    def _calculate_overall_risk(self, spread_risk: Dict, economic_risk: Dict, 
                              environmental_risk: Dict) -> str:
        """حساب المخاطر الإجمالية"""
        spread_score = spread_risk['risk_score']
        economic_score = economic_risk.get('potential_loss_amount', 0) / 20000  # تطبيع
        environmental_score = environmental_risk['risk_score']
        
        overall_score = (spread_score * 0.4 + min(1.0, economic_score) * 0.3 + 
                        environmental_score * 0.3)
        
        if overall_score > 0.7:
            return 'عالي'
        elif overall_score > 0.4:
            return 'متوسط'
        else:
            return 'منخفض'
    
    def _identify_risk_factors(self, pest_name: str, input_data: Dict) -> List[str]:
        """تحديد عوامل الخطر"""
        risk_factors = []
        
        weather = input_data.get('weather_conditions', {})
        temp = weather.get('temperature', 25)
        humidity = weather.get('humidity', 60)
        
        if temp > 30:
            risk_factors.append('درجة حرارة عالية')
        if humidity > 80:
            risk_factors.append('رطوبة عالية')
        if input_data.get('plant_density', 'normal') == 'high':
            risk_factors.append('كثافة زراعة عالية')
        if input_data.get('irrigation_frequency', 'normal') == 'excessive':
            risk_factors.append('ري مفرط')
        
        return risk_factors
    
    def _determine_risk_priority(self, spread_risk: Dict, economic_risk: Dict, 
                               severity: float) -> str:
        """تحديد أولوية إدارة المخاطر"""
        if (spread_risk['risk_score'] > 0.7 and 
            economic_risk.get('potential_loss_amount', 0) > 5000 and 
            severity > 0.6):
            return 'أولوية قصوى'
        elif spread_risk['risk_score'] > 0.5 or severity > 0.5:
            return 'أولوية عالية'
        elif spread_risk['risk_score'] > 0.3:
            return 'أولوية متوسطة'
        else:
            return 'أولوية منخفضة'

    # ------------------------------------------------------------------
    # Treatment evaluation helpers
    # ------------------------------------------------------------------

    def _estimate_treatment_effectiveness(self, treatment: Dict, severity: float,
                                          input_data: Dict) -> float:
        """تقدير فعالية العلاج للحالة الحالية (0..1).

        الفعالية المرجعية مأخوذة من قاعدة البيانات، ثم تُعدَّل حسب شدة الإصابة
        والظروف الجوية: العلاجات الجهازية تحافظ على فعاليتها مع ارتفاع الضغط،
        بينما تفقد العلاجات الملامسة/الحيوية جزءاً منها، ويزيد الغسل بالمطر
        والرياح من فقدان الرش.
        """
        base = float(treatment.get('effectiveness', 70)) / 100.0
        method = str(treatment.get('method', ''))
        systemic = any(k in method for k in ('systemic', 'insecticide', 'miticide'))

        pressure_penalty = float(severity) * (0.10 if systemic else 0.30)

        weather = input_data.get('weather_conditions') or {}
        weather_penalty = 0.0
        if float(weather.get('recent_rainfall', 0) or 0) > 5 and any(
            k in method for k in ('soap', 'organic')
        ):
            weather_penalty += 0.15  # الأمطار تغسل الرش الملامس
        if float(weather.get('wind_speed', 0) or 0) > 20:
            weather_penalty += 0.10  # انجراف الرش
        if float(weather.get('temperature', 25) or 25) > 35:
            weather_penalty += 0.05  # تبخر سريع / إجهاد حراري

        effectiveness = base - pressure_penalty - weather_penalty
        return float(max(0.05, min(1.0, effectiveness)))

    def _analyze_treatment_cost_benefit(self, treatment: Dict, farm_size: float,
                                        effectiveness: float) -> Dict[str, Any]:
        """تحليل التكلفة والفائدة لخيار علاج واحد."""
        farm_size = max(float(farm_size or 1.0), 0.01)
        cost_per_hectare = float(treatment.get('cost_per_hectare', 0))
        frequency = str(treatment.get('application_frequency', ''))
        applications = 1 if 'مرة واحدة' in frequency else (3 if 'يوم' in frequency else 2)

        total_cost = cost_per_hectare * farm_size * applications
        # قيمة الإنتاج المعرضة للخطر، معدّلة بفعالية العلاج المتوقعة.
        at_risk_value = farm_size * 5000.0 * 0.30
        loss_avoided = at_risk_value * float(effectiveness)
        ratio = (loss_avoided / total_cost) if total_cost > 0 else 0.0

        return {
            'total_cost': float(total_cost),
            'applications': applications,
            'expected_loss_avoided': float(loss_avoided),
            'ratio': float(ratio),
            'verdict': (
                'مجدٍ اقتصادياً' if ratio >= 2 else
                'مقبول' if ratio >= 1 else
                'تكلفة أعلى من الفائدة المتوقعة'
            ),
        }

    def _get_treatment_safety_info(self, treatment: Dict) -> Dict[str, Any]:
        """معلومات السلامة وفترة الأمان بعد الرش."""
        safety_level = treatment.get('safety_level', 'حذر')
        reentry_hours = {
            'آمن جداً': 0,
            'آمن': 4,
            'حذر': 24,
            'خطر': 48,
        }.get(safety_level, 24)

        if reentry_hours == 0:
            equipment = ['قفازات عند التحضير']
        elif reentry_hours <= 4:
            equipment = ['قفازات', 'كمامة']
        else:
            equipment = ['قفازات', 'كمامة', 'ملابس واقية', 'نظارات واقية']

        return {
            'safety_level': safety_level,
            'reentry_interval_hours': reentry_hours,
            'residual_effect_days': treatment.get('residual_effect_days', 0),
            'protective_equipment': equipment,
            'notes': [
                'يُمنع الرش أثناء هبوب الرياح القوية',
                'لا تخلط المبيدات مع مواد غير موصى بها',
            ],
        }

    def _get_application_conditions(self, treatment: Dict,
                                    weather: Dict) -> Dict[str, Any]:
        """شروط التطبيق المناسبة مقارنة بالظروف الحالية."""
        weather = weather or {}
        temp = float(weather.get('temperature', 25) or 25)
        wind = float(weather.get('wind_speed', 0) or 0)
        rain = float(weather.get('recent_rainfall', 0) or 0)
        method = str(treatment.get('method', ''))
        is_spray = any(k in method for k in ('spray', 'soap', 'insecticide', 'miticide', 'organic'))

        max_wind = 15.0
        reasons = []
        if is_spray and wind > max_wind:
            reasons.append('سرعة الرياح مرتفعة: احتمال انجراف الرش')
        if not (10 <= temp <= 30):
            reasons.append('درجة الحرارة خارج المجال المناسب للرش (10-30°م)')
        if is_spray and rain > 5:
            reasons.append('أمطار حديثة قد تغسل المادة الفعالة')

        return {
            'suitable_now': len(reasons) == 0,
            'temperature_range': [10, 30],
            'max_wind_speed_kmh': max_wind,
            'rain_free_hours_required': 6 if is_spray else 0,
            'blocking_reasons': reasons,
        }

    def _calculate_treatment_suitability(self, treatment: Dict, severity: float,
                                         input_data: Dict) -> float:
        """ملاءمة العلاج (0..1) بدمج الفعالية والسلامة والتكلفة والتفضيل العضوي."""
        effectiveness = self._estimate_treatment_effectiveness(
            treatment, severity, input_data
        )
        safety = {
            'آمن جداً': 1.0, 'آمن': 0.85, 'حذر': 0.6, 'خطر': 0.3,
        }.get(treatment.get('safety_level', 'حذر'), 0.6)

        cost = float(treatment.get('cost_per_hectare', 0))
        cost_score = 1.0 if cost <= 100 else (0.7 if cost <= 250 else 0.45)

        score = 0.55 * effectiveness + 0.25 * safety + 0.20 * cost_score

        method = str(treatment.get('method', ''))
        organic = any(k in method for k in ('biological', 'organic', 'predatory'))
        if input_data.get('organic_preference'):
            score += 0.15 if organic else -0.20

        budget = input_data.get('budget_constraint')
        if budget is not None and cost > float(budget):
            score -= 0.25

        return float(max(0.0, min(1.0, score)))

    def _get_treatment_pros_cons(self, treatment: Dict) -> Dict[str, List[str]]:
        """إيجابيات وسلبيات خيار العلاج."""
        method = str(treatment.get('method', ''))
        safety = treatment.get('safety_level', 'حذر')
        effectiveness = float(treatment.get('effectiveness', 70))

        pros: List[str] = []
        cons: List[str] = []

        if any(k in method for k in ('biological', 'organic', 'predatory')):
            pros += ['صديق للبيئة', 'آمن للإنسان والحشرات النافعة']
            cons += ['بطيء النتائج', 'يحتاج ظروفاً مناسبة']
        if any(k in method for k in ('systemic', 'insecticide', 'miticide')):
            pros += ['سريع المفعول', 'فعالية عالية ضد الإصابة الشديدة']
            cons += ['قد يؤثر على الحشرات النافعة', 'فترة أمان قبل الحصاد']
        if safety == 'آمن جداً':
            pros.append('فترة أمان قصيرة')
        if safety in ('حذر', 'خطر'):
            cons.append('يتطلب معدات حماية وفترة إعادة دخول')
        if effectiveness >= 90:
            pros.append('فعالية موثقة عالية')
        elif effectiveness < 70:
            cons.append('فعالية متوسطة، قد تحتاج تكراراً')

        return {'pros': pros, 'cons': cons}

    # ------------------------------------------------------------------
    # Treatment schedule helpers
    # ------------------------------------------------------------------

    def _determine_best_application_time(self, treatment: Dict,
                                         weather: Dict) -> str:
        """أفضل وقت في اليوم للتطبيق."""
        weather = weather or {}
        temp = float(weather.get('temperature', 25) or 25)
        method = str(treatment.get('method', ''))
        if any(k in method for k in ('biological', 'predatory')):
            return 'الصباح الباكر (6-9) لإطلاق الأعداء الطبيعية'
        if temp > 28:
            return 'الصباح الباكر (6-9) أو المساء (17-20) لتفادي الحرارة'
        return 'الصباح الباكر (7-10) مع رطوبة مناسبة'

    def _calculate_dosage(self, treatment: Dict, farm_size: float) -> Dict[str, Any]:
        """حساب الجرعة الإجمالية حسب المساحة."""
        farm_size = max(float(farm_size or 1.0), 0.01)
        return {
            'farm_size_hectares': float(farm_size),
            'water_volume_liters': float(farm_size * 200),
            'note': 'استخدم الجرعة الموصى بها على البطاقة؛ لا تزد الجرعة لتجنب المقاومة',
        }

    def _get_weather_requirements(self, treatment: Dict) -> Dict[str, Any]:
        """الظروف الجوية المطلوبة للتطبيق."""
        method = str(treatment.get('method', ''))
        is_spray = any(k in method for k in ('spray', 'soap', 'insecticide', 'miticide', 'organic'))
        return {
            'min_temperature_c': 10,
            'max_temperature_c': 30,
            'max_wind_speed_kmh': 15,
            'rain_free_hours': 6 if is_spray else 0,
        }

    def _get_preparation_steps(self, treatment: Dict) -> List[str]:
        """خطوات التحضير قبل التطبيق."""
        return [
            'قراءة بطاقة المنتج واحترام الجرعة',
            'تحضير المحلول في خزان نظيف',
            'ارتداء معدات الحماية',
            'معايرة آلة الرش قبل الاستعمال',
        ]

    def _get_safety_precautions(self, treatment: Dict) -> List[str]:
        """احتياطات السلامة أثناء وبعد التطبيق."""
        reentry = self._get_treatment_safety_info(treatment)['reentry_interval_hours']
        steps = [
            'تجنب الرش عكس اتجاه الريح',
            'عدم الأكل أو الشرب أثناء التطبيق',
            'غسل المعدات والملابس بعد الانتهاء',
        ]
        if reentry > 0:
            steps.append(f'منع دخول المزرعة لمدة {reentry} ساعة')
        return steps

    def _determine_monitoring_intervals(self, treatment: Dict) -> Dict[str, Any]:
        """فترات المراقبة بعد العلاج."""
        residual = int(treatment.get('residual_effect_days', 0) or 0)
        return {
            'first_check_days': 3,
            'follow_up_interval_days': 7,
            'duration_days': max(14, residual + 7),
            'note': 'سجّل النتائج لكل زيارة لمقارنة التقدم',
        }

    def _define_success_indicators(self, treatment: Dict) -> List[str]:
        """مؤشرات نجاح العلاج."""
        return [
            'انخفاض نسبة الأوراق المصابة',
            'توقف انتشار الإصابة إلى نباتات جديدة',
            'ظهور نمو جديد سليم',
            'انخفاض أعداد الحشرات تحت العتبة الاقتصادية',
        ]

    # ------------------------------------------------------------------
    # Image analysis helpers
    # ------------------------------------------------------------------

    def _extract_dominant_colors(self, img_array: np.ndarray, k: int = 3) -> List[Dict[str, Any]]:
        """استخراج الألوان السائدة عبر k-means."""
        try:
            small = cv2.resize(img_array, (60, 60)).reshape(-1, 3).astype(np.float32)
            criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 20, 1.0)
            _, labels, centers = cv2.kmeans(
                small, k, None, criteria, 3, cv2.KMEANS_PP_CENTERS
            )
            counts = np.bincount(labels.flatten(), minlength=k)
            total = int(counts.sum()) or 1
            colors = []
            for i in range(k):
                rgb = [int(max(0, min(255, c))) for c in centers[i]]
                colors.append({
                    'rgb': rgb,
                    'hex': '#%02x%02x%02x' % tuple(rgb),
                    'percentage': float(counts[i] / total * 100),
                })
            colors.sort(key=lambda c: c['percentage'], reverse=True)
            return colors
        except Exception as exc:  # pragma: no cover - defensive
            logger.warning('dominant colour extraction failed: %s', exc)
            return []

    def _detect_brown_content(self, img_array: np.ndarray) -> float:
        """نسبة المحتوى البني (أنسجة ميتة/تلف) في الصورة."""
        hsv = cv2.cvtColor(img_array, cv2.COLOR_RGB2HSV)
        brown_mask = cv2.inRange(hsv, (5, 50, 20), (20, 255, 200))
        return float(np.sum(brown_mask > 0) / brown_mask.size * 100)

    def _assess_pattern_regularity(self, gray: np.ndarray) -> float:
        """انتظام النمط (0..1): الأنماط المنتظمة تركّز الطاقة في ترددات قليلة."""
        f = np.fft.fft2(gray.astype(np.float32))
        mag = np.abs(np.fft.fftshift(f))
        h, w = mag.shape
        mag[h // 2 - 2:h // 2 + 3, w // 2 - 2:w // 2 + 3] = 0  # إزالة المكوّن المستمر
        total = float(mag.sum())
        if total <= 0:
            return 0.0
        top = np.sort(mag.ravel())[-max(1, mag.size // 1000):].sum()
        return float(min(1.0, (top / total) * 10))

    def _identify_damage_patterns(self, img_array: np.ndarray) -> List[str]:
        """وصف أنماط الضرر الظاهرة في الصورة."""
        hsv = cv2.cvtColor(img_array, cv2.COLOR_RGB2HSV)
        yellow = np.sum(cv2.inRange(hsv, (15, 50, 50), (35, 255, 255)) > 0) / img_array[:, :, 0].size
        brown = np.sum(cv2.inRange(hsv, (5, 50, 20), (20, 255, 200)) > 0) / img_array[:, :, 0].size
        white = np.sum(cv2.inRange(hsv, (0, 0, 200), (180, 30, 255)) > 0) / img_array[:, :, 0].size

        patterns = []
        if yellow > 0.05:
            patterns.append('اصفرار الأوراق (نقص تغذية أو إصابة)')
        if brown > 0.05:
            patterns.append('بقع بنية (تلف نسيجي أو فطري)')
        if white > 0.03:
            patterns.append('بقع بيضاء (فطريات أو حشرات دقيقة)')
        return patterns or ['لا توجد أنماط ضرر واضحة']

    def _calculate_overall_damage_level(self, yellow_percentage: float,
                                        brown_percentage: float) -> str:
        """المستوى الإجمالي للضرر المرئي."""
        combined = float(yellow_percentage or 0) + float(brown_percentage or 0)
        if combined > 0.40:
            return 'شديد'
        if combined > 0.20:
            return 'متوسط'
        if combined > 0.05:
            return 'خفيف'
        return 'طفيف'

    def _analyze_damage_distribution(self, yellow_mask: np.ndarray,
                                     brown_mask: np.ndarray) -> Dict[str, Any]:
        """توزيع الضرر: منتظم أم بقعي أم على الحواف."""
        combined = ((yellow_mask > 0) | (brown_mask > 0)).astype(np.uint8)
        affected = float(combined.mean() * 100)
        if affected <= 0:
            return {'affected_percentage': 0.0, 'distribution': 'لا يوجد ضرر', 'spread': 'محدود'}

        h, w = combined.shape
        edge_band = combined[:max(1, h // 10), :].mean() + combined[-max(1, h // 10):, :].mean()
        center = combined[h // 3: 2 * h // 3, w // 3: 2 * w // 3].mean()

        if edge_band > 0 and edge_band > center * 1.5:
            distribution = 'متمركز على الحواف'
        elif center > edge_band * 1.5:
            distribution = 'متمركز في الوسط'
        else:
            distribution = 'منتظم/بقعي'

        spread = 'واسع' if affected > 30 else ('متوسط' if affected > 10 else 'محدود')
        return {
            'affected_percentage': affected,
            'distribution': distribution,
            'spread': spread,
        }

    def _get_image_improvement_tips(self, quality_score: int) -> List[str]:
        """نصائح لتحسين جودة الصورة عند إعادة التصوير."""
        if quality_score > 80:
            return ['جودة الصورة جيدة للتحليل']
        tips = []
        if quality_score < 60:
            tips.append('التقط الصورة في إضاءة طبيعية كافية')
        tips += [
            'قرّب الكاميرا من الورقة المصابة',
            'تجنب الاهتزاز واستخدم التركيز التلقائي',
            'أظهر الوجه العلوي والسفلي للورقة',
        ]
        return tips

# Factory function
def create_pest_control_recommender() -> PestControlRecommender:
    """إنشاء وإرجاع نسخة من PestControlRecommender"""
    return PestControlRecommender()
