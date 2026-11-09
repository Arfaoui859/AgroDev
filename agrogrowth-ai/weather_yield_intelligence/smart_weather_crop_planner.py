"""
SmartWeatherCropPlanner - تخطيط زراعة ذكي حسب الطقس
تخطيط زراعة حسب الطقس الموسمي والتغيرات المناخية
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Any, Optional
import logging
from sklearn.ensemble import RandomForestRegressor, GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
import json

logger = logging.getLogger(__name__)

class SmartWeatherCropPlanner:
    """نظام ذكي لتخطيط الزراعة حسب الطقس والمناخ"""
    
    def __init__(self):
        self.weather_suitability_model = None
        self.climate_adaptation_model = None
        self.seasonal_timing_model = None
        self.scaler = StandardScaler()
        self.is_trained = False
        
        # قاعدة بيانات المناخ والطقس
        self.climate_zones = {
            'mediterranean': {
                'name_ar': 'البحر المتوسط',
                'characteristics': {
                    'winter_temp_range': (5, 15),
                    'summer_temp_range': (25, 35),
                    'annual_rainfall': (400, 800),
                    'humidity_range': (50, 70),
                    'dry_season': 'summer',
                    'wet_season': 'winter'
                },
                'suitable_crops': [
                    'olive', 'wheat', 'citrus', 'grapes', 'tomato',
                    'barley', 'onion', 'garlic', 'fava_beans'
                ],
                'challenges': ['summer drought', 'irregular rainfall', 'heat waves']
            },
            'arid': {
                'name_ar': 'صحراوي',
                'characteristics': {
                    'winter_temp_range': (10, 20),
                    'summer_temp_range': (35, 45),
                    'annual_rainfall': (50, 200),
                    'humidity_range': (20, 40),
                    'dry_season': 'year_round',
                    'wet_season': 'rare'
                },
                'suitable_crops': [
                    'dates', 'wheat', 'barley', 'millet', 'sorghum',
                    'desert_adapted_vegetables'
                ],
                'challenges': ['water scarcity', 'extreme heat', 'sandstorms']
            },
            'semi_arid': {
                'name_ar': 'شبه صحراوي',
                'characteristics': {
                    'winter_temp_range': (8, 18),
                    'summer_temp_range': (28, 38),
                    'annual_rainfall': (200, 500),
                    'humidity_range': (30, 55),
                    'dry_season': 'summer',
                    'wet_season': 'winter_spring'
                },
                'suitable_crops': [
                    'wheat', 'barley', 'lentils', 'chickpeas', 'sunflower',
                    'olive', 'almonds', 'pistachios'
                ],
                'challenges': ['water stress', 'drought periods', 'high evaporation']
            }
        }
        
        # مواسم الزراعة
        self.planting_seasons = {
            'winter': {
                'months': [11, 12, 1, 2],
                'name_ar': 'الزراعة الشتوية',
                'suitable_crops': ['wheat', 'barley', 'fava_beans', 'peas', 'onion'],
                'characteristics': {
                    'temperature_range': (5, 20),
                    'water_requirement': 'medium',
                    'pest_pressure': 'low',
                    'disease_risk': 'medium'
                }
            },
            'spring': {
                'months': [3, 4, 5],
                'name_ar': 'الزراعة الربيعية',
                'suitable_crops': ['tomato', 'pepper', 'cucumber', 'corn', 'cotton'],
                'characteristics': {
                    'temperature_range': (15, 25),
                    'water_requirement': 'medium_to_high',
                    'pest_pressure': 'medium',
                    'disease_risk': 'low'
                }
            },
            'summer': {
                'months': [6, 7, 8],
                'name_ar': 'الزراعة ال��يفية',
                'suitable_crops': ['rice', 'sorghum', 'millet', 'sesame', 'watermelon'],
                'characteristics': {
                    'temperature_range': (25, 40),
                    'water_requirement': 'high',
                    'pest_pressure': 'high',
                    'disease_risk': 'medium'
                }
            },
            'autumn': {
                'months': [9, 10],
                'name_ar': 'الزراعة الخريفية',
                'suitable_crops': ['potato', 'beets', 'carrots', 'lettuce', 'spinach'],
                'characteristics': {
                    'temperature_range': (15, 30),
                    'water_requirement': 'medium',
                    'pest_pressure': 'medium',
                    'disease_risk': 'low'
                }
            }
        }
        
        # أنماط الطقس الشائعة
        self.weather_patterns = {
            'drought': {
                'name_ar': 'الجفاف',
                'indicators': {
                    'rainfall_threshold': 50,  # أقل من 50 مم شهرياً
                    'duration_months': 3,
                    'temperature_increase': 5  # درجات فوق المعدل
                },
                'adaptation_strategies': [
                    'اختيار أصناف مقاومة للجفاف',
                    'تطوير أنظمة ري موفرة للمياه',
                    'تأخير مواعيد الزراعة',
                    'زيادة المواد العضوية في التربة'
                ]
            },
            'flood': {
                'name_ar': 'الفيضانات',
                'indicators': {
                    'rainfall_threshold': 100,  # أكثر من 100 مم في يوم
                    'duration_days': 3,
                    'intensity': 'extreme'
                },
                'adaptation_strategies': [
                    'تحسين أنظمة الصرف',
                    'زراعة أصناف مقاومة للمياه الراكدة',
                    'رفع مستوى الزراعة',
                    'تنويع مواقع الزراعة'
                ]
            },
            'heat_wave': {
                'name_ar': 'موجة حر',
                'indicators': {
                    'temperature_threshold': 40,  # درجة مئوية
                    'duration_days': 5,
                    'humidity_factor': 'low'
                },
                'adaptation_strategies': [
                    'استخدام الظلال الاصطناعية',
                    'زيادة تكرار الري',
                    'زراعة أصناف مقاومة للحرارة',
                    'تجنب الأنشطة في ذروة الحر'
                ]
            },
            'frost': {
                'name_ar': 'الصقيع',
                'indicators': {
                    'temperature_threshold': 0,  # درجة مئوية
                    'timing': 'unexpected',
                    'crop_stage': 'sensitive'
                },
                'adaptation_strategies': [
                    'استخدام أغطية الحماية',
                    'إضاءة مصابيح الدفء',
                    'اختيار أصناف مقاومة للبرد',
                    'تأجيل مواعيد الزراعة'
                ]
            }
        }
        
        # مؤشرات التغير المناخي
        self.climate_change_indicators = {
            'temperature_trends': {
                'warming_rate': 0.2,  # درجة/عقد
                'extreme_events_increase': 1.5,  # مرة ونصف أكثر
                'seasonal_shifts': 15  # أيام إزاحة موسمية
            },
            'precipitation_changes': {
                'pattern_irregularity': 'increasing',
                'intensity_increase': 1.3,
                'dry_period_extension': 20  # أيام إضافية
            },
            'adaptation_urgency': {
                'immediate': ['water_management', 'heat_tolerance'],
                'medium_term': ['soil_health', 'crop_diversity'],
                'long_term': ['infrastructure', 'technology_adoption']
            }
        }
        
        # Synthetic in-process training is intentionally disabled.
        self.model_source = "synthetic-demo-disabled"
    
    def create_weather_based_plan(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """إنشاء خطة زراعة ذكية حسب الطقس"""
        try:
            if not self.is_trained:
                raise ValueError("Models not trained")
            
            # تحليل الظروف المناخية الحالية
            climate_analysis = self._analyze_current_climate(input_data)
            
            # تقييم الملائمة للمحاصيل المختلفة
            crop_suitability = self._assess_crop_climate_suitability(
                input_data, climate_analysis
            )
            
            # تحديد أفضل مواعيد الزراعة
            optimal_timing = self._determine_optimal_planting_times(
                input_data, climate_analysis
            )
            
            # تحليل مخاطر الطقس
            weather_risks = self._analyze_weather_risks(
                input_data, climate_analysis
            )
            
            # استراتيجيات التكيف المناخي
            adaptation_strategies = self._recommend_climate_adaptation(
                input_data, climate_analysis, weather_risks
            )
            
            # توقعات مناخية طويلة المدى
            long_term_forecast = self._generate_long_term_climate_outlook(
                input_data
            )
            
            # خطة الزراعة الموسمية
            seasonal_plan = self._create_seasonal_planting_plan(
                crop_suitability, optimal_timing, weather_risks
            )
            
            # إرشادات إدارة المخاطر
            risk_management = self._develop_weather_risk_management(
                weather_risks, input_data
            )
            
            return {
                'climate_analysis': climate_analysis,
                'crop_suitability': crop_suitability,
                'optimal_timing': optimal_timing,
                'weather_risks': weather_risks,
                'adaptation_strategies': adaptation_strategies,
                'long_term_forecast': long_term_forecast,
                'seasonal_plan': seasonal_plan,
                'risk_management': risk_management,
                'recommendations_summary': self._generate_recommendations_summary(
                    crop_suitability, optimal_timing, adaptation_strategies
                ),
                'analysis_timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error creating weather-based plan: {e}")
            raise
    
    def _analyze_current_climate(self, input_data: Dict) -> Dict[str, Any]:
        """تحليل الظروف المناخية الحالية"""
        location = input_data.get('location', {})
        historical_weather = input_data.get('historical_weather', {})
        current_conditions = input_data.get('current_conditions', {})
        
        # تحديد المنطقة المناخية
        climate_zone = self._identify_climate_zone(location, historical_weather)
        
        # تحليل الاتجاهات المناخية
        climate_trends = self._analyze_climate_trends(historical_weather)
        
        # تقييم الظروف الحالية
        current_assessment = self._assess_current_weather_conditions(current_conditions)
        
        # مقارنة مع المعدلات التاريخية
        historical_comparison = self._compare_with_historical_averages(
            current_conditions, historical_weather
        )
        
        return {
            'climate_zone': climate_zone,
            'climate_trends': climate_trends,
            'current_assessment': current_assessment,
            'historical_comparison': historical_comparison,
            'anomalies': self._detect_climate_anomalies(
                current_conditions, historical_weather
            ),
            'seasonal_outlook': self._assess_seasonal_outlook(
                current_conditions, climate_trends
            )
        }
    
    def _assess_crop_climate_suitability(self, input_data: Dict, 
                                       climate_analysis: Dict) -> List[Dict[str, Any]]:
        """تقييم ملائمة المحاصيل للمناخ"""
        available_crops = input_data.get('crop_options', [
            'wheat', 'barley', 'corn', 'tomato', 'potato', 'olive', 'dates'
        ])
        
        suitability_results = []
        
        for crop in available_crops:
            # استخراج معطيات للنموذج
            features = self._extract_climate_features(input_data, climate_analysis)
            
            if self.is_trained and len(features) > 0:
                features_scaled = self.scaler.transform([features])
                suitability_score = self.weather_suitability_model.predict(features_scaled)[0]
                adaptation_score = self.climate_adaptation_model.predict(features_scaled)[0]
            else:
                # تقدير بسيط
                suitability_score = self._estimate_crop_suitability(
                    crop, climate_analysis
                )
                adaptation_score = suitability_score * 0.8
            
            # تحليل مفصل للمحصول
            crop_analysis = self._analyze_crop_specific_requirements(
                crop, climate_analysis
            )
            
            # تحديد التحديات والفرص
            challenges_opportunities = self._identify_crop_challenges_opportunities(
                crop, climate_analysis
            )
            
            suitability_results.append({
                'crop': crop,
                'suitability_score': float(max(0.0, min(1.0, suitability_score))),
                'adaptation_potential': float(max(0.0, min(1.0, adaptation_score))),
                'suitability_level': self._categorize_suitability(suitability_score),
                'crop_analysis': crop_analysis,
                'challenges_opportunities': challenges_opportunities,
                'recommended_varieties': self._recommend_climate_adapted_varieties(
                    crop, climate_analysis
                )
            })
        
        # ترتيب حسب الملائمة
        suitability_results.sort(key=lambda x: x['suitability_score'], reverse=True)
        
        return suitability_results
    
    def _determine_optimal_planting_times(self, input_data: Dict, 
                                        climate_analysis: Dict) -> Dict[str, Any]:
        """تحديد أفضل مواعيد الزراعة"""
        # تحليل كل شهر في السنة
        monthly_suitability = []
        current_month = datetime.now().month
        
        for month in range(1, 13):
            # محاكاة الظروف المتوقعة للشهر
            month_conditions = self._simulate_monthly_conditions(
                month, climate_analysis
            )
            
            # تقييم الملائمة للزراعة
            features = self._extract_timing_features(
                month, month_conditions, climate_analysis
            )
            
            if self.is_trained and len(features) > 0:
                features_scaled = self.scaler.transform([features])
                timing_category = self.seasonal_timing_model.predict(features_scaled)[0]
                timing_score = [0.2, 0.6, 0.9][timing_category]  # تحويل الفئة لنقاط
            else:
                timing_score = self._estimate_monthly_suitability(month, climate_analysis)
            
            # تحديد المخاطر المتوقعة
            month_risks = self._assess_monthly_risks(month, climate_analysis)
            
            monthly_suitability.append({
                'month': month,
                'month_name_ar': self._get_arabic_month_name(month),
                'suitability_score': float(timing_score),
                'suitability_level': self._categorize_timing(timing_score),
                'expected_conditions': month_conditions,
                'risks': month_risks,
                'recommended_crops': self._get_month_recommended_crops(month),
                'planting_activities': self._get_month_planting_activities(month)
            })
        
        # تحديد أفضل نوافذ الزراعة
        optimal_windows = self._identify_optimal_planting_windows(monthly_suitability)
        
        # توصيات موسمية
        seasonal_recommendations = self._generate_seasonal_recommendations(
            monthly_suitability, climate_analysis
        )
        
        return {
            'monthly_analysis': monthly_suitability,
            'optimal_windows': optimal_windows,
            'seasonal_recommendations': seasonal_recommendations,
            'current_month_status': monthly_suitability[current_month - 1],
            'next_three_months': monthly_suitability[current_month:current_month + 3]
        }
    
    def _analyze_weather_risks(self, input_data: Dict, 
                             climate_analysis: Dict) -> Dict[str, Any]:
        """تحليل مخاطر الطقس"""
        location = input_data.get('location', {})
        
        # تحديد المخاطر الشائعة في المنطقة
        regional_risks = self._identify_regional_weather_risks(location)
        
        # تحليل احتمالية حدوث الظواهر الجوية الشديدة
        extreme_events_risk = self._assess_extreme_weather_risk(climate_analysis)
        
        # مخاطر موسمية
        seasonal_risks = self._analyze_seasonal_weather_risks(climate_analysis)
        
        # تأثير التغير المناخي
        climate_change_impact = self._assess_climate_change_risks(
            climate_analysis, location
        )
        
        # مخاطر المياه
        water_security_risks = self._analyze_water_security_risks(
            climate_analysis, input_data
        )
        
        return {
            'regional_risks': regional_risks,
            'extreme_events_risk': extreme_events_risk,
            'seasonal_risks': seasonal_risks,
            'climate_change_impact': climate_change_impact,
            'water_security': water_security_risks,
            'overall_risk_level': self._calculate_overall_weather_risk(
                regional_risks, extreme_events_risk, seasonal_risks
            ),
            'priority_risks': self._prioritize_weather_risks(
                regional_risks, extreme_events_risk, seasonal_risks
            )
        }
    
    def _recommend_climate_adaptation(self, input_data: Dict, climate_analysis: Dict,
                                    weather_risks: Dict) -> List[Dict[str, Any]]:
        """توصية استراتيجيات التكيف المناخي"""
        farm_profile = input_data.get('farm_profile', {})
        
        adaptation_strategies = []
        
        # استراتيجيات إدارة المياه
        water_strategies = self._recommend_water_management_strategies(
            climate_analysis, weather_risks
        )
        adaptation_strategies.extend(water_strategies)
        
        # استراتيجيات اختيار المحاصيل
        crop_strategies = self._recommend_crop_diversification_strategies(
            climate_analysis, weather_risks
        )
        adaptation_strategies.extend(crop_strategies)
        
        # استراتيجيات التربة والزراعة
        soil_strategies = self._recommend_soil_management_strategies(
            climate_analysis
        )
        adaptation_strategies.extend(soil_strategies)
        
        # استراتيجيات تقنية
        technology_strategies = self._recommend_technology_adaptation(
            climate_analysis, farm_profile
        )
        adaptation_strategies.extend(technology_strategies)
        
        # استراتيجيات اقتصادية
        economic_strategies = self._recommend_economic_adaptation(
            weather_risks, farm_profile
        )
        adaptation_strategies.extend(economic_strategies)
        
        # ترتيب حسب الأولوية والجدوى
        for strategy in adaptation_strategies:
            strategy['priority_score'] = self._calculate_strategy_priority(
                strategy, weather_risks, farm_profile
            )
        
        adaptation_strategies.sort(key=lambda x: x['priority_score'], reverse=True)
        
        return adaptation_strategies
    
    def _generate_long_term_climate_outlook(self, input_data: Dict) -> Dict[str, Any]:
        """توليد توقعات مناخية طويلة المدى"""
        location = input_data.get('location', {})
        
        # تحليل اتجاهات السنوات القادمة (5-10 سنوات)
        future_trends = {
            'temperature': {
                'expected_increase': 1.5,  # درجة مئوية
                'range': (1.0, 2.0),
                'confidence': 'عالي',
                'implications': [
                    'زيادة احتياجات الري',
                    'تغيير مواعيد الزراعة',
                    'ضرورة أصناف مقاومة للحرارة'
                ]
            },
            'precipitation': {
                'pattern_change': 'irregular',
                'total_change_percent': -10,
                'extreme_events_increase': 50,
                'confidence': 'متوسط',
                'implications': [
                    'حاجة لأنظمة تجميع مياه أمطار',
                    'تحسين إدارة المخاطر',
                    'تنويع مصادر المياه'
                ]
            },
            'extreme_events': {
                'drought_frequency': 'increasing',
                'heat_waves_intensity': 'higher',
                'irregular_rainfall': 'more_common',
                'implications': [
                    'الاستثمار في التقنيات المقاومة',
                    'تطوير أنظمة إنذار مبكر',
                    'تنويع الأنشطة الزراعية'
                ]
            }
        }
        
        # توصيات التحضير للمستقبل
        future_preparation = [
            {
                'timeframe': 'السنة القادمة',
                'actions': [
                    'تحسين كفاءة استخدام المياه',
                    'اختبار أصناف جديدة مقاومة',
                    'تطوير خطط طوارئ'
                ]
            },
            {
                'timeframe': '2-5 سنوات',
                'actions': [
                    'الاستثمار في تقنيات الري الذكي',
                    'تطوير أنظمة تجميع المياه',
                    'تنويع المحاصيل والأنشطة'
                ]
            },
            {
                'timeframe': '5-10 سنوات',
                'actions': [
                    'التحول للزراعة المقاومة للمناخ',
                    'الاستثمار في الطاقة المتجددة',
                    'تطوير سلاسل قيمة مرنة'
                ]
            }
        ]
        
        return {
            'future_climate_trends': future_trends,
            'preparation_timeline': future_preparation,
            'adaptation_priorities': self._prioritize_long_term_adaptations(
                future_trends
            ),
            'investment_recommendations': self._recommend_climate_investments(
                future_trends, input_data
            )
        }
    
    def _create_seasonal_planting_plan(self, crop_suitability: List[Dict],
                                     optimal_timing: Dict, 
                                     weather_risks: Dict) -> Dict[str, Any]:
        """إنشاء خطة الزراعة الموسمية"""
        current_date = datetime.now()
        
        # خطة الأشهر الـ12 القادمة
        monthly_plans = []
        
        for i in range(12):
            plan_date = current_date + timedelta(days=30 * i)
            month = plan_date.month
            
            # أفضل المحاصيل للشهر
            month_crops = self._select_crops_for_month(
                month, crop_suitability, optimal_timing
            )
            
            # الأنشطة الموصى بها
            month_activities = self._plan_monthly_activities(
                month, month_crops, weather_risks
            )
            
            # التحضيرات المطلوبة
            preparations = self._plan_monthly_preparations(
                month, month_crops, weather_risks
            )
            
            monthly_plans.append({
                'month': month,
                'date': plan_date.strftime('%Y-%m'),
                'month_name_ar': self._get_arabic_month_name(month),
                'recommended_crops': month_crops,
                'activities': month_activities,
                'preparations': preparations,
                'weather_considerations': self._get_monthly_weather_considerations(
                    month, weather_risks
                )
            })
        
        # خطة سنوية استراتيجية
        annual_strategy = self._develop_annual_strategy(
            crop_suitability, optimal_timing, weather_risks
        )
        
        return {
            'monthly_plans': monthly_plans,
            'annual_strategy': annual_strategy,
            'crop_rotation_plan': self._plan_crop_rotation(crop_suitability),
            'resource_planning': self._plan_resource_allocation(monthly_plans),
            'risk_mitigation_calendar': self._create_risk_mitigation_calendar(
                monthly_plans, weather_risks
            )
        }
    
    def _develop_weather_risk_management(self, weather_risks: Dict, 
                                       input_data: Dict) -> Dict[str, Any]:
        """تطوير خطة إدارة مخاطر الطقس"""
        farm_profile = input_data.get('farm_profile', {})
        
        # نظام الإنذار المبكر
        early_warning_system = {
            'monitoring_parameters': [
                'درجة الحرارة اليومية',
                'هطول الأمطار',
                'رطوبة التربة',
                'توقعات الطقس أسبوعياً'
            ],
            'alert_thresholds': {
                'heat_wave': 'درجة حرارة > 40°م لمدة 3 أيام',
                'drought': 'عدم هطول أمطار لمدة 30 ��وم',
                'frost': 'درجة حرارة < 2°م',
                'heavy_rain': 'أمطار > 50 مم في 24 ساعة'
            },
            'response_protocols': self._develop_response_protocols(weather_risks)
        }
        
        # خطط الطوارئ
        emergency_plans = self._develop_emergency_response_plans(
            weather_risks, farm_profile
        )
        
        # التأمين والحماية المالية
        financial_protection = self._recommend_financial_protection(
            weather_risks, farm_profile
        )
        
        # شبكات الدعم والتعاون
        support_networks = self._identify_support_networks(input_data)
        
        return {
            'early_warning_system': early_warning_system,
            'emergency_plans': emergency_plans,
            'financial_protection': financial_protection,
            'support_networks': support_networks,
            'training_needs': self._identify_training_needs(weather_risks),
            'infrastructure_improvements': self._recommend_infrastructure_improvements(
                weather_risks, farm_profile
            )
        }
    
    # Helper methods (many more would be implemented)
    def _identify_climate_zone(self, location: Dict, historical_weather: Dict) -> Dict[str, Any]:
        """تحديد المنطقة المناخية"""
        avg_temp = historical_weather.get('average_temperature', 25)
        annual_rainfall = historical_weather.get('annual_rainfall', 400)
        
        if annual_rainfall < 200 and avg_temp > 25:
            zone = 'arid'
        elif 200 <= annual_rainfall < 500 and avg_temp > 20:
            zone = 'semi_arid'
        else:
            zone = 'mediterranean'
        
        zone_info = self.climate_zones.get(zone, self.climate_zones['mediterranean'])
        
        return {
            'zone_type': zone,
            'zone_name_ar': zone_info['name_ar'],
            'characteristics': zone_info['characteristics'],
            'suitable_crops': zone_info['suitable_crops'],
            'main_challenges': zone_info['challenges']
        }
    
    def _extract_climate_features(self, input_data: Dict, climate_analysis: Dict) -> List[float]:
        """استخراج معطيات المناخ للنموذج"""
        current_conditions = input_data.get('current_conditions', {})
        location = input_data.get('location', {})
        
        avg_temp = current_conditions.get('temperature', 25.0)
        temp_variation = current_conditions.get('temperature_variation', 10.0)
        annual_rainfall = current_conditions.get('annual_rainfall', 400.0)
        rainfall_pattern = current_conditions.get('rainfall_regularity', 0.5)
        
        month = datetime.now().month
        humidity = current_conditions.get('humidity', 60.0)
        wind_speed = current_conditions.get('wind_speed', 5.0)
        solar_radiation = current_conditions.get('solar_radiation', 25.0)
        
        elevation = location.get('elevation', 100.0)
        latitude = location.get('latitude', 35.0)
        soil_water_capacity = current_conditions.get('soil_water_capacity', 0.6)
        
        # اتجاهات التغير المناخي
        warming_trend = climate_analysis.get('climate_trends', {}).get('warming_rate', 0.2)
        rainfall_trend = climate_analysis.get('climate_trends', {}).get('rainfall_change', 0.0)
        extreme_events_freq = climate_analysis.get('climate_trends', {}).get('extreme_events', 1.0)
        
        return [
            avg_temp, temp_variation, annual_rainfall, rainfall_pattern,
            month, humidity, wind_speed, solar_radiation,
            elevation, latitude, soil_water_capacity,
            warming_trend, rainfall_trend, extreme_events_freq
        ]
    
    def _categorize_suitability(self, score: float) -> str:
        """تصنيف مستوى الملائمة"""
        if score >= 0.8:
            return 'ممتاز'
        elif score >= 0.6:
            return 'جيد جداً'
        elif score >= 0.4:
            return 'جيد'
        elif score >= 0.2:
            return 'مقبول'
        else:
            return 'غير مناسب'
    
    def _get_arabic_month_name(self, month: int) -> str:
        """الحصول على اسم الشهر بالعربية"""
        months = [
            '', 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
            'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
        ]
        return months[month] if 1 <= month <= 12 else 'غير محدد'
    
    def _generate_recommendations_summary(self, crop_suitability: List[Dict],
                                        optimal_timing: Dict,
                                        adaptation_strategies: List[Dict]) -> List[str]:
        """توليد ملخص التوصيات"""
        recommendations = []
        
        if crop_suitability:
            best_crop = crop_suitability[0]
            recommendations.append(
                f"أفضل محصول موصى به: {best_crop['crop']} "
                f"بدرجة ملائمة {best_crop['suitability_score']:.1f}"
            )
        
        current_month = datetime.now().month
        if optimal_timing.get('monthly_analysis'):
            current_status = optimal_timing['monthly_analysis'][current_month - 1]
            recommendations.append(
                f"الشهر الحالي: {current_status['suitability_level']} للزراعة"
            )
        
        if adaptation_strategies:
            top_strategy = adaptation_strategies[0]
            recommendations.append(
                f"أهم استراتيجية تكيف: {top_strategy.get('title', 'غير محدد')}"
            )
        
        return recommendations

    # ------------------------------------------------------------------
    # Climate analysis
    # ------------------------------------------------------------------

    def _analyze_climate_trends(self, historical_weather: Dict) -> Dict[str, Any]:
        """تحليل اتجاهات المناخ من المعطيات التاريخية.

        عند غياب سلسلة تاريخية صريحة نُعيد اتجاهات التغير المناخي المرجعية
        للمنطقة (من قاعدة المعرفة) بدل اختلاق قيم عشوائية.
        """
        historical_weather = historical_weather or {}
        warming_rate = float(
            historical_weather.get('warming_rate',
                                   self.climate_change_indicators['temperature_trends']['warming_rate'])
        )
        rainfall_change = float(historical_weather.get('rainfall_change_percent', -10.0))
        extreme_events = float(
            historical_weather.get('extreme_events_factor',
                                   self.climate_change_indicators['temperature_trends']['extreme_events_increase'])
        )
        return {
            'warming_rate': warming_rate,
            'rainfall_change': rainfall_change,
            'extreme_events': extreme_events,
            'seasonal_shift_days': self.climate_change_indicators['temperature_trends']['seasonal_shifts'],
            'trend_direction': (
                'ارتفاع الحرارة وانخفاض الأمطار'
                if warming_rate > 0 and rainfall_change < 0
                else 'مستقر نسبياً'
            ),
            'data_basis': 'reference_trends' if not historical_weather else 'historical_input',
        }

    def _assess_current_weather_conditions(self, current_conditions: Dict) -> Dict[str, Any]:
        """تقييم الظروف الجوية الحالية مقابل المجالات الملائمة للزراعة."""
        c = current_conditions or {}
        temp = float(c.get('temperature', 25.0))
        humidity = float(c.get('humidity', 60.0))
        rainfall = float(c.get('recent_rainfall', c.get('annual_rainfall', 0.0)))

        if 15 <= temp <= 30:
            temp_status = 'ملائم'
        elif 10 <= temp < 15 or 30 < temp <= 35:
            temp_status = 'مقبول'
        else:
            temp_status = 'مجهد'

        humidity_status = 'ملائم' if 40 <= humidity <= 70 else ('مرتفع' if humidity > 70 else 'منخفض')

        return {
            'temperature_c': temp,
            'humidity_percent': humidity,
            'recent_rainfall_mm': rainfall,
            'temperature_status': temp_status,
            'humidity_status': humidity_status,
            'overall_status': 'ملائم' if temp_status == 'ملائم' else ('مقبول' if temp_status == 'مقبول' else 'غير ملائم'),
        }

    def _compare_with_historical_averages(self, current_conditions: Dict,
                                          historical_weather: Dict) -> Dict[str, Any]:
        """مقارنة الظروف الحالية بالمعدلات التاريخية."""
        c = current_conditions or {}
        h = historical_weather or {}
        cur_temp = float(c.get('temperature', 25.0))
        avg_temp = float(h.get('average_temperature', 25.0))
        cur_rain = float(c.get('annual_rainfall', 400.0))
        avg_rain = float(h.get('annual_rainfall', 400.0))

        temp_anomaly = cur_temp - avg_temp
        rain_deviation = ((cur_rain - avg_rain) / avg_rain * 100) if avg_rain else 0.0

        return {
            'temperature_anomaly_c': temp_anomaly,
            'rainfall_deviation_percent': rain_deviation,
            'comparison_basis': 'historical_input' if h else 'assumed_normals',
            'interpretation': (
                'أدفأ من المعتاد' if temp_anomaly > 1.5 else
                'أبرد من المعتاد' if temp_anomaly < -1.5 else 'قريب من المعدل'
            ),
        }

    def _detect_climate_anomalies(self, current_conditions: Dict,
                                  historical_weather: Dict) -> List[Dict[str, Any]]:
        """كشف الشذوذ المناخي (حرارة/أمطار خارج النطاق الطبيعي)."""
        anomalies = []
        c = current_conditions or {}
        temp = float(c.get('temperature', 25.0))
        rainfall = float(c.get('annual_rainfall', 400.0))

        if temp >= 40:
            anomalies.append({'type': 'heat_wave', 'name_ar': 'موجة حر', 'severity': 'عالي',
                              'value': temp})
        elif temp >= 35:
            anomalies.append({'type': 'heat_stress', 'name_ar': 'إجهاد حراري', 'severity': 'متوسط',
                              'value': temp})
        if temp <= 2:
            anomalies.append({'type': 'frost', 'name_ar': 'خطر صقيع', 'severity': 'عالي',
                              'value': temp})
        if rainfall < 200:
            anomalies.append({'type': 'drought_risk', 'name_ar': 'خطر جفاف', 'severity': 'متوسط',
                              'value': rainfall})

        return anomalies

    def _assess_seasonal_outlook(self, current_conditions: Dict,
                                 climate_trends: Dict) -> Dict[str, Any]:
        """نظرة موسمية مبنية على الشهر الحالي والاتجاهات المناخية."""
        month = datetime.now().month
        season = next(
            (name for name, info in self.planting_seasons.items() if month in info['months']),
            'spring',
        )
        season_info = self.planting_seasons[season]
        return {
            'current_season': season,
            'season_name_ar': season_info['name_ar'],
            'favorable_crops': season_info['suitable_crops'],
            'water_requirement': season_info['characteristics']['water_requirement'],
            'pest_pressure': season_info['characteristics']['pest_pressure'],
            'climate_risk_note': (
                'يُنصح بمراقبة تواتر الظواهر المتطرفة'
                if float(climate_trends.get('extreme_events', 1.0)) > 1.2
                else 'ظروف موسمية معتادة'
            ),
        }

    # ------------------------------------------------------------------
    # Crop suitability
    # ------------------------------------------------------------------

    def _estimate_crop_suitability(self, crop: str, climate_analysis: Dict) -> float:
        """تقدير ملاءمة محصول للمناخ (0..1) بقواعد صريحة."""
        zone = climate_analysis.get('climate_zone', {})
        suitable = zone.get('suitable_crops', [])
        characteristics = zone.get('characteristics', {})
        rainfall_range = characteristics.get('annual_rainfall', (200, 800))
        temp_range = characteristics.get('summer_temp_range', (20, 35))

        score = 0.6 if crop in suitable else 0.3

        current = climate_analysis.get('current_assessment', {})
        temp = float(current.get('temperature_c', 25.0))
        if temp_range[0] <= temp <= temp_range[1]:
            score += 0.2
        else:
            score -= 0.15

        recent_rain = float(current.get('recent_rainfall_mm', 0.0))
        if recent_rain < rainfall_range[0] * 0.2:
            score -= 0.1  # شح مطري

        return float(max(0.0, min(1.0, score)))

    def _analyze_crop_specific_requirements(self, crop: str,
                                            climate_analysis: Dict) -> Dict[str, Any]:
        """متطلبات المحصول المناخية مقابل الظروف المتاحة."""
        zone = climate_analysis.get('climate_zone', {})
        characteristics = zone.get('characteristics', {})
        requirements = {
            'wheat': {'temp': (10, 25), 'rainfall': (300, 900), 'water_need': 'متوسط'},
            'barley': {'temp': (8, 26), 'rainfall': (250, 700), 'water_need': 'منخفض'},
            'corn': {'temp': (18, 32), 'rainfall': (500, 1000), 'water_need': 'مرتفع'},
            'tomato': {'temp': (18, 28), 'rainfall': (400, 900), 'water_need': 'مرتفع'},
            'potato': {'temp': (15, 25), 'rainfall': (400, 800), 'water_need': 'مرتفع'},
            'olive': {'temp': (15, 35), 'rainfall': (300, 700), 'water_need': 'منخفض'},
            'dates': {'temp': (25, 45), 'rainfall': (50, 300), 'water_need': 'مرتفع'},
        }
        req = requirements.get(crop, {'temp': (15, 30), 'rainfall': (300, 800), 'water_need': 'متوسط'})

        return {
            'crop': crop,
            'required_temperature_range': req['temp'],
            'required_rainfall_range': req['rainfall'],
            'water_requirement': req['water_need'],
            'zone_matches_rainfall': (
                characteristics.get('annual_rainfall', (0, 1000))[1] >= req['rainfall'][0]
            ),
        }

    def _identify_crop_challenges_opportunities(self, crop: str,
                                                climate_analysis: Dict) -> Dict[str, Any]:
        """تحديد التحديات والفرص لمحصول في مناخ معين."""
        zone = climate_analysis.get('climate_zone', {})
        challenges = list(zone.get('main_challenges', []))
        trends = climate_analysis.get('climate_trends', {})

        opportunities = []
        if crop in zone.get('suitable_crops', []):
            opportunities.append('المحصول متكيف أصلاً مع المنطقة المناخية')
        if float(trends.get('warming_rate', 0)) > 0:
            opportunities.append('إمكانية إدخال أصناف محسّنة للحرارة')

        return {
            'challenges': challenges or ['لا توجد تحديات جوهرية مسجّلة'],
            'opportunities': opportunities or ['تحسين الممارسات الزراعية'],
        }

    def _recommend_climate_adapted_varieties(self, crop: str,
                                             climate_analysis: Dict) -> List[str]:
        """توصية أصناف متكيفة مع المناخ (مبادئ عامة، لا أسماء تجارية)."""
        varieties = {
            'wheat': ['أصناف قصيرة الساق مقاومة للحرارة', 'أصناف مبكرة النضج لتفادي الجفاف'],
            'barley': ['أصناف مبكرة متحملة للملوحة'],
            'corn': ['هجين متوسط النضج', 'أصناف متحملة للإجهاد المائي'],
            'tomato': ['أصناف مقاومة للحرارة ومتحملة للأمراض الفطرية'],
            'potato': ['أصناف متحملة للجفاف', 'أصناف مقاومة للفحة المتأخرة'],
            'olive': ['أصناف متحملة للجفاف وملائمة للزيت'],
            'dates': ['أصناف متحملة للحرارة العالية والملوحة'],
        }
        base = varieties.get(crop, ['أصناف محلية متأقلمة مع الظروف المحلية'])
        if float(climate_analysis.get('climate_trends', {}).get('warming_rate', 0)) > 0:
            base = base + ['الاعتماد على أصناف مرنة تجاه تقلب المناخ']
        return base

    # ------------------------------------------------------------------
    # Planting timing
    # ------------------------------------------------------------------

    def _simulate_monthly_conditions(self, month: int,
                                     climate_analysis: Dict) -> Dict[str, Any]:
        """محاكاة الظروف المتوقعة لشهر معيّن من المنحنى المناخي للمنطقة.

        ليست قياسات مسجّلة؛ تُشتق من مدى الحرارة/الأمطار للمنطقة المناخية
        وتُوسم صراحةً كتقدير موسمي.
        """
        characteristics = climate_analysis.get('climate_zone', {}).get('characteristics', {})
        winter = characteristics.get('winter_temp_range', (8, 18))
        summer = characteristics.get('summer_temp_range', (25, 35))
        annual_rainfall = characteristics.get('annual_rainfall', (300, 800))

        # منحنى موسمي بسيط: الذروة في يوليوز/أوت، والحد الأدنى في يناير.
        phase = np.cos((month - 7) / 12 * 2 * np.pi)  # 1 في جويلية، -1 في يناير
        mid_winter = sum(winter) / 2
        mid_summer = sum(summer) / 2
        mid_temp = mid_summer if phase >= 0 else mid_winter
        amplitude = abs(mid_summer - mid_winter) / 2
        expected_temp = mid_temp + phase * amplitude * 0.5
        expected_temp = float(max(winter[0] - 3, min(summer[1] + 3, expected_temp)))

        # الأمطار المتوسطية: معظمها شتاءً.
        rain_share = max(0.0, (1 - phase) / 2)
        expected_rainfall = float(rain_share * (sum(annual_rainfall) / 2) / 6.0)

        return {
            'month': month,
            'expected_temperature_c': round(expected_temp, 1),
            'expected_monthly_rainfall_mm': round(expected_rainfall, 1),
            'estimation_basis': 'seasonal_model',
            'note': 'تقدير موسمي مبني على نطاقات المناخ الإقليمية وليس قياساً مسجّلاً',
        }

    def _extract_timing_features(self, month: int, month_conditions: Dict,
                                 climate_analysis: Dict) -> List[float]:
        """استخراج متجه الميزات لتوقيت الزراعة (نفس أبعاد نموذج التدريب)."""
        current = climate_analysis.get('current_assessment', {})
        location = {'latitude': 35.0, 'elevation': 100.0}
        trends = climate_analysis.get('climate_trends', {})

        avg_temp = float(month_conditions.get('expected_temperature_c',
                                              current.get('temperature_c', 25.0)))
        return [
            avg_temp,
            abs(float(current.get('temperature_c', 25.0)) - avg_temp),
            float(month_conditions.get('expected_monthly_rainfall_mm', 0.0)) * 12,
            float(current.get('humidity_percent', 60.0)) / 100.0,
            float(month),
            float(current.get('humidity_percent', 60.0)),
            5.0,
            25.0,
            float(location['elevation']),
            float(location['latitude']),
            0.6,
            float(trends.get('warming_rate', 0.2)),
            float(trends.get('rainfall_change', 0.0)),
            float(trends.get('extreme_events', 1.0)),
        ]

    def _estimate_monthly_suitability(self, month: int,
                                      climate_analysis: Dict) -> float:
        """تقدير ملاءمة الشهر للزراعة بقواعد موسمية."""
        if month in [3, 4, 5, 10, 11]:
            return 0.85
        if month in [12, 1, 2]:
            return 0.6
        return 0.3

    def _assess_monthly_risks(self, month: int,
                              climate_analysis: Dict) -> List[Dict[str, Any]]:
        """المخاطر الجوية المتوقعة في شهر معيّن."""
        risks = []
        if month in [6, 7, 8]:
            risks.append({'type': 'heat_wave', 'name_ar': 'موجة حر', 'severity': 'متوسط'})
            risks.append({'type': 'drought', 'name_ar': 'جفاف صيفي', 'severity': 'عالي'})
        if month in [12, 1]:
            risks.append({'type': 'frost', 'name_ar': 'صقيع', 'severity': 'متوسط'})
        if month in [10, 11, 3, 4]:
            risks.append({'type': 'heavy_rain', 'name_ar': 'أمطار غزيرة', 'severity': 'متوسط'})
        return risks or [{'type': 'none', 'name_ar': 'مخاطر محدودة', 'severity': 'منخفض'}]

    def _categorize_timing(self, score: float) -> str:
        """تصنيف ملاءمة التوقيت."""
        if score >= 0.8:
            return 'ممتاز'
        if score >= 0.6:
            return 'جيد'
        if score >= 0.4:
            return 'مقبول'
        return 'غير مناسب'

    def _get_month_recommended_crops(self, month: int) -> List[str]:
        """المحاصيل الموصى بها للزراعة في شهر معيّن."""
        season = next(
            (info for info in self.planting_seasons.values() if month in info['months']),
            None,
        )
        return list(season['suitable_crops']) if season else ['wheat', 'barley']

    def _get_month_planting_activities(self, month: int) -> List[str]:
        """الأنشطة الزراعية النموذجية للشهر."""
        if month in [3, 4, 5]:
            return ['تحضير الأرض للزراعة الربيعية', 'زراعة المحاصيل الصيفية', 'بدء التسميد']
        if month in [6, 7, 8]:
            return ['مراقبة الري', 'مكافحة الآفات الصيفية', 'حصاد المحاصيل المبكرة']
        if month in [9, 10]:
            return ['زراعة المحاصيل الخريفية', 'حصاد الصيف', 'تحضير التربة']
        return ['زراعة الحبوب الشتوية', 'تسميد أساسي', 'حماية من الصقيع']

    def _identify_optimal_planting_windows(self,
                                           monthly_suitability: List[Dict]) -> List[Dict[str, Any]]:
        """نوافذ الزراعة المثلى (الأشهر ذات الملاءمة الأعلى)."""
        ranked = sorted(monthly_suitability, key=lambda m: m['suitability_score'], reverse=True)
        windows = []
        for entry in ranked[:4]:
            windows.append({
                'month': entry['month'],
                'month_name_ar': entry['month_name_ar'],
                'suitability_score': entry['suitability_score'],
                'suitability_level': entry['suitability_level'],
                'recommended_crops': entry['recommended_crops'],
            })
        return windows

    def _generate_seasonal_recommendations(self, monthly_suitability: List[Dict],
                                           climate_analysis: Dict) -> List[str]:
        """توصيات موسمية مبنية على تحليل الأشهر."""
        best = max(monthly_suitability, key=lambda m: m['suitability_score'])
        worst = min(monthly_suitability, key=lambda m: m['suitability_score'])
        return [
            f"أفضل شهر للزراعة: {best['month_name_ar']} ({best['suitability_level']})",
            f"يُنصح بتجنّب الزراعة في {worst['month_name_ar']} قدر الإمكان",
            'اعتمد الري التكميلي خلال الأشهر الجافة',
            'راقب توقعات الطقس قبل كل عملية زراعية',
        ]

    # ------------------------------------------------------------------
    # Weather risk
    # ------------------------------------------------------------------

    def _identify_regional_weather_risks(self, location: Dict) -> List[Dict[str, Any]]:
        """المخاطر الجوية الشائعة حسب المنطقة."""
        region = str(location.get('region', '')).lower()
        risks = [
            {'type': 'drought', 'name_ar': 'الجفاف', 'likelihood': 'عالي'},
            {'type': 'heat_wave', 'name_ar': 'موجات الحر', 'likelihood': 'متوسط'},
            {'type': 'irregular_rainfall', 'name_ar': 'عدم انتظام الأمطار', 'likelihood': 'عالي'},
        ]
        if 'tunis' in region or 'تونس' in str(location.get('region', '')):
            risks.append({'type': 'flood', 'name_ar': 'فيضانات مفاجئة', 'likelihood': 'متوسط'})
        return risks

    def _assess_extreme_weather_risk(self, climate_analysis: Dict) -> Dict[str, Any]:
        """احتمالية الظواهر الجوية المتطرفة."""
        trends = climate_analysis.get('climate_trends', {})
        extreme = float(trends.get('extreme_events', 1.0))
        level = 'عالي' if extreme >= 1.5 else ('متوسط' if extreme >= 1.1 else 'منخفض')
        return {
            'level': level,
            'extreme_events_factor': extreme,
            'events_considered': ['heat_wave', 'drought', 'heavy_rain', 'frost'],
        }

    def _analyze_seasonal_weather_risks(self, climate_analysis: Dict) -> List[Dict[str, Any]]:
        """مخاطر الطقس حسب الموسم الحالي."""
        month = datetime.now().month
        return self._assess_monthly_risks(month, climate_analysis)

    def _assess_climate_change_risks(self, climate_analysis: Dict,
                                     location: Dict) -> Dict[str, Any]:
        """تأثير التغير المناخي على المنطقة."""
        trends = climate_analysis.get('climate_trends', {})
        return {
            'warming_rate_c_per_decade': float(trends.get('warming_rate', 0.2)),
            'rainfall_change_percent': float(trends.get('rainfall_change', -10.0)),
            'risk_level': 'عالي' if float(trends.get('warming_rate', 0.2)) >= 0.3 else 'متوسط',
            'implications': [
                'زيادة احتياجات الري',
                'تقلب مواعيد الزراعة',
                'ضرورة أصناف مقاومة للحرارة',
            ],
        }

    def _analyze_water_security_risks(self, climate_analysis: Dict,
                                      input_data: Dict) -> Dict[str, Any]:
        """مخاطر أمن المياه."""
        zone = climate_analysis.get('climate_zone', {}).get('zone_type', 'mediterranean')
        base_risk = {'arid': 'عالي', 'semi_arid': 'متوسط', 'mediterranean': 'متوسط'}.get(zone, 'متوسط')
        return {
            'risk_level': base_risk,
            'zone_type': zone,
            'mitigation': ['تحسين كفاءة الري', 'حصاد مياه الأمطار', 'تنويع مصادر المياه'],
        }

    def _calculate_overall_weather_risk(self, regional_risks: List,
                                        extreme_events_risk: Dict,
                                        seasonal_risks: List) -> str:
        """المستوى الإجمالي لمخاطر الطقس."""
        score = 0
        score += 2 if extreme_events_risk.get('level') == 'عالي' else (
            1 if extreme_events_risk.get('level') == 'متوسط' else 0)
        for risk in regional_risks or []:
            if risk.get('likelihood') == 'عالي':
                score += 2
            elif risk.get('likelihood') == 'متوسط':
                score += 1
        for risk in seasonal_risks or []:
            if risk.get('severity') == 'عالي':
                score += 2
            elif risk.get('severity') == 'متوسط':
                score += 1
        if score >= 7:
            return 'عالي'
        if score >= 4:
            return 'متوسط'
        return 'منخفض'

    def _prioritize_weather_risks(self, regional_risks: List,
                                  extreme_events_risk: Dict,
                                  seasonal_risks: List) -> List[Dict[str, Any]]:
        """ترتيب المخاطر حسب الأولوية."""
        weight = {'عالي': 3, 'متوسط': 2, 'منخفض': 1}
        merged = []
        for risk in (regional_risks or []):
            merged.append({'name_ar': risk.get('name_ar'), 'priority': risk.get('likelihood', 'متوسط')})
        for risk in (seasonal_risks or []):
            merged.append({'name_ar': risk.get('name_ar'), 'priority': risk.get('severity', 'متوسط')})
        merged.append({'name_ar': 'ظواهر متطرفة', 'priority': extreme_events_risk.get('level', 'منخفض')})
        merged.sort(key=lambda r: weight.get(r['priority'], 1), reverse=True)
        return merged

    # ------------------------------------------------------------------
    # Adaptation strategies
    # ------------------------------------------------------------------

    def _recommend_water_management_strategies(self, climate_analysis: Dict,
                                               weather_risks: Dict) -> List[Dict[str, Any]]:
        return [
            {
                'category': 'إدارة المياه',
                'title': 'تحويل إلى الري بالتنقيط',
                'description': 'رفع كفاءة استخدام المياه إلى أكثر من 90%',
                'cost_level': 'مرتفع',
                'impact': 'عالي',
            },
            {
                'category': 'إدارة المياه',
                'title': 'جدولة الري حسب الرطوبة',
                'description': 'الري بناءً على قياس رطوبة التربة بدل الجدول الثابت',
                'cost_level': 'منخفض',
                'impact': 'متوسط',
            },
        ]

    def _recommend_crop_diversification_strategies(self, climate_analysis: Dict,
                                                   weather_risks: Dict) -> List[Dict[str, Any]]:
        return [
            {
                'category': 'تنويع المحاصيل',
                'title': 'إدخال محاصيل مقاومة للجفاف',
                'description': 'تقليل الاعتماد على محصول واحد حساس للمناخ',
                'cost_level': 'منخفض',
                'impact': 'عالي',
            },
            {
                'category': 'تنويع المحاصيل',
                'title': 'تناوب المحاصيل',
                'description': 'كسر دورة الآفات وتحسين خصوبة التربة',
                'cost_level': 'منخفض',
                'impact': 'متوسط',
            },
        ]

    def _recommend_soil_management_strategies(self,
                                              climate_analysis: Dict) -> List[Dict[str, Any]]:
        return [
            {
                'category': 'إدارة التربة',
                'title': 'زيادة المادة العضوية',
                'description': 'تحسين قدرة التربة على الاحتفاظ بالماء',
                'cost_level': 'متوسط',
                'impact': 'عالي',
            },
            {
                'category': 'إدارة التربة',
                'title': 'المهاد (Mulching)',
                'description': 'تقليل تبخر الماء من سطح التربة',
                'cost_level': 'منخفض',
                'impact': 'متوسط',
            },
        ]

    def _recommend_technology_adaptation(self, climate_analysis: Dict,
                                         farm_profile: Dict) -> List[Dict[str, Any]]:
        return [
            {
                'category': 'التقنية',
                'title': 'حساسات رطوبة التربة',
                'description': 'قياس مباشر لتوجيه قرارات الري',
                'cost_level': 'متوسط',
                'impact': 'عالي',
            },
            {
                'category': 'التقنية',
                'title': 'نظام إنذار مبكر للطقس',
                'description': 'تنبيهات عند اقتراب موجات حر أو صقيع',
                'cost_level': 'منخفض',
                'impact': 'متوسط',
            },
        ]

    def _recommend_economic_adaptation(self, weather_risks: Dict,
                                       farm_profile: Dict) -> List[Dict[str, Any]]:
        return [
            {
                'category': 'التكيف الاقتصادي',
                'title': 'تأمين فلاحي ضد المخاطر المناخية',
                'description': 'حماية جزئية من خسائر الجفاف والفيضانات',
                'cost_level': 'متوسط',
                'impact': 'متوسط',
            },
            {
                'category': 'التكيف الاقتصادي',
                'title': 'تنويع مصادر الدخل',
                'description': 'أنشطة تكميلية لتقليل الاعتماد على محصول واحد',
                'cost_level': 'منخفض',
                'impact': 'متوسط',
            },
        ]

    def _calculate_strategy_priority(self, strategy: Dict, weather_risks: Dict,
                                     farm_profile: Dict) -> float:
        """أولوية الاستراتيجية (0..1) حسب الأثر والتكلفة ومستوى المخاطر."""
        impact = {'عالي': 1.0, 'متوسط': 0.6, 'منخفض': 0.3}.get(strategy.get('impact'), 0.5)
        cost = {'منخفض': 1.0, 'متوسط': 0.7, 'مرتفع': 0.4}.get(strategy.get('cost_level'), 0.6)
        risk = {'عالي': 1.0, 'متوسط': 0.7, 'منخفض': 0.4}.get(
            weather_risks.get('overall_risk_level', 'متوسط'), 0.7)
        return float(round(0.45 * impact + 0.30 * cost + 0.25 * risk, 3))

    def _prioritize_long_term_adaptations(self,
                                          future_trends: Dict) -> List[Dict[str, Any]]:
        return [
            {'timeframe': 'فوري', 'priority': 'عالي',
             'actions': self.climate_change_indicators['adaptation_urgency']['immediate']},
            {'timeframe': 'متوسط المدى', 'priority': 'متوسط',
             'actions': self.climate_change_indicators['adaptation_urgency']['medium_term']},
            {'timeframe': 'طويل المدى', 'priority': 'متوسط',
             'actions': self.climate_change_indicators['adaptation_urgency']['long_term']},
        ]

    def _recommend_climate_investments(self, future_trends: Dict,
                                       input_data: Dict) -> List[Dict[str, Any]]:
        return [
            {'investment': 'أنظمة ري موفرة للمياه', 'horizon': '1-3 سنوات',
             'expected_benefit': 'خفض استهلاك المياه 30-40%'},
            {'investment': 'حصاد مياه الأمطار', 'horizon': '2-5 سنوات',
             'expected_benefit': 'مصدر مياه تكميلي في المواسم الجافة'},
            {'investment': 'طاقة شمسية للضخ', 'horizon': '3-7 سنوات',
             'expected_benefit': 'خفض تكلفة الطاقة وتشغيل الري المستقل'},
        ]

    # ------------------------------------------------------------------
    # Seasonal plan
    # ------------------------------------------------------------------

    def _select_crops_for_month(self, month: int, crop_suitability: List[Dict],
                                optimal_timing: Dict) -> List[str]:
        """أفضل المحاصيل لشهر معيّن بمزج ملاءمة المحصول والموسم."""
        season_crops = set(self._get_month_recommended_crops(month))
        ranked = [c['crop'] for c in (crop_suitability or [])]
        # الأولوية لمحاصيل الموسم، ثم حسب ترتيب الملاءمة.
        ordered = [c for c in ranked if c in season_crops]
        ordered += [c for c in ranked if c not in season_crops]
        if not ordered:
            ordered = list(season_crops)
        return ordered[:4]

    def _plan_monthly_activities(self, month: int, month_crops: List[str],
                                 weather_risks: Dict) -> List[str]:
        """أنشطة الشهر الموصى بها."""
        activities = list(self._get_month_planting_activities(month))
        if weather_risks.get('overall_risk_level') == 'عالي':
            activities.append('تفعيل خطة الطوارئ المناخية')
        if month_crops:
            activities.append(f"متابعة محاصيل: {', '.join(month_crops[:2])}")
        return activities

    def _plan_monthly_preparations(self, month: int, month_crops: List[str],
                                   weather_risks: Dict) -> List[str]:
        """التحضيرات المطلوبة للشهر."""
        preps = ['تجهيز المعدات والري']
        if month in [6, 7, 8]:
            preps.append('تأمين الظل ومصادر مياه إضافية')
        if month in [12, 1]:
            preps.append('وسائل الحماية من الصقيع')
        if month in [9, 10, 3, 4]:
            preps.append('تحسين الصرف لتفادي تجمع المياه')
        return preps

    def _get_monthly_weather_considerations(self, month: int,
                                            weather_risks: Dict) -> Dict[str, Any]:
        """الاعتبارات الجوية للشهر."""
        return {
            'expected_risks': self._assess_monthly_risks(month, {}),
            'overall_risk_level': weather_risks.get('overall_risk_level', 'متوسط'),
        }

    def _develop_annual_strategy(self, crop_suitability: List[Dict],
                                 optimal_timing: Dict,
                                 weather_risks: Dict) -> Dict[str, Any]:
        """استراتيجية سنوية شاملة."""
        top_crops = [c['crop'] for c in (crop_suitability or [])[:3]]
        windows = optimal_timing.get('optimal_windows', [])
        return {
            'primary_crops': top_crops,
            'planting_windows': windows,
            'risk_level': weather_risks.get('overall_risk_level', 'متوسط'),
            'guiding_principles': [
                'تنويع المحاصيل لتقليل المخاطر',
                'مزامنة الزراعة مع نوافذ الملاءمة العليا',
                'إدارة مائية استباقية',
            ],
        }

    def _plan_crop_rotation(self, crop_suitability: List[Dict]) -> List[Dict[str, Any]]:
        """خطة تناوب مبسطة على أساس عائلات المحاصيل."""
        families = {
            'wheat': 'حبوب', 'barley': 'حبوب', 'corn': 'حبوب',
            'tomato': 'خضروات', 'potato': 'خضروات',
            'olive': 'أشجار مثمرة', 'dates': 'أشجار مثمرة',
        }
        crops = [c['crop'] for c in (crop_suitability or [])] or ['wheat', 'barley']
        plan = []
        for idx, crop in enumerate(crops[:4]):
            plan.append({
                'season': f'موسم {idx + 1}',
                'crop': crop,
                'family': families.get(crop, 'أخرى'),
                'rationale': 'تعاقب عائلات مختلفة لكسر دورة الآفات',
            })
        return plan

    def _plan_resource_allocation(self, monthly_plans: List[Dict]) -> Dict[str, Any]:
        """تخطيط الموارد على مدار السنة."""
        heavy_months = [p['month_name_ar'] for p in monthly_plans
                        if any('ري' in a for a in p.get('activities', []))]
        return {
            'irrigation_intensive_months': heavy_months[:6],
            'labor_note': 'ذروة الطلب على العمالة خلال أشهر الزراعة والحصاد',
            'water_note': 'تخطيط مسبق لتخزين المياه في الأشهر الجافة',
        }

    def _create_risk_mitigation_calendar(self, monthly_plans: List[Dict],
                                         weather_risks: Dict) -> List[Dict[str, Any]]:
        """رزنامة إجراءات التخفيف من المخاطر."""
        calendar = []
        for plan in monthly_plans:
            risks = plan.get('weather_considerations', {}).get('expected_risks', [])
            if risks:
                calendar.append({
                    'month': plan['month_name_ar'],
                    'actions': [f"الاستعداد لـ {r.get('name_ar', '')}" for r in risks],
                })
        return calendar

    # ------------------------------------------------------------------
    # Risk management
    # ------------------------------------------------------------------

    def _develop_response_protocols(self, weather_risks: Dict) -> List[Dict[str, Any]]:
        return [
            {'event': 'موجة حر', 'protocol': 'زيادة الري وتفعيل الظل وتجنب الأنشطة في الذروة'},
            {'event': 'صقيع', 'protocol': 'أغطية حماية وري وقائي قبل الصقيع'},
            {'event': 'أمطار غزيرة', 'protocol': 'تفعيل الصرف وإيقاف الري'},
            {'event': 'جفاف', 'protocol': 'ترتيب أولويات الري وتأجيل العمليات غير الضرورية'},
        ]

    def _develop_emergency_response_plans(self, weather_risks: Dict,
                                          farm_profile: Dict) -> List[Dict[str, Any]]:
        return [
            {'scenario': 'جفاف ممتد', 'immediate_actions': ['التحول لمحاصيل أقل استهلاكاً للماء',
                                                            'حصر مياه الطوارئ']},
            {'scenario': 'فيضان', 'immediate_actions': ['تصريف المياه', 'حماية المخزون']},
            {'scenario': 'موجة حر', 'immediate_actions': ['ري تكميلي عاجل', 'حماية الثمار']},
        ]

    def _recommend_financial_protection(self, weather_risks: Dict,
                                        farm_profile: Dict) -> Dict[str, Any]:
        return {
            'insurance_type': 'تأمين فلاحي ضد المخاطر المناخية',
            'coverage_priority': ['جفاف', 'فيضانات', 'موجات حر'],
            'note': 'تُراجع الشروط مع مؤسسة التأمين الفلاحي المحلية',
        }

    def _identify_support_networks(self, input_data: Dict) -> List[str]:
        return [
            'المرشد الفلاحي المحلي',
            'التعاونيات الفلاحية',
            'مراكز الإرشاد الزراعي',
            'المنصات الرقمية للطقس الفلاحي',
        ]

    def _identify_training_needs(self, weather_risks: Dict) -> List[str]:
        needs = ['إدارة الري الموفّر للمياه', 'قراءة توقعات الطقس']
        if weather_risks.get('overall_risk_level') in ['عالي', 'متوسط']:
            needs.append('خطط الطوارئ المناخية')
        return needs

    def _recommend_infrastructure_improvements(self, weather_risks: Dict,
                                               farm_profile: Dict) -> List[Dict[str, Any]]:
        return [
            {'improvement': 'شبكة ري بالتنقيط', 'priority': 'عالي', 'cost': 'مرتفع'},
            {'improvement': 'خزان تجميع مياه الأمطار', 'priority': 'متوسط', 'cost': 'متوسط'},
            {'improvement': 'شبكة صرف فعالة', 'priority': 'متوسط', 'cost': 'متوسط'},
        ]

# Factory function
def create_smart_weather_crop_planner() -> SmartWeatherCropPlanner:
    """إنشاء وإرجاع نسخة من SmartWeatherCropPlanner"""
    return SmartWeatherCropPlanner()
