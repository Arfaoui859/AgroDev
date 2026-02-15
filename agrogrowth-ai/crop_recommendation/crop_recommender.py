"""
CropRecommenderAI - Advanced crop recommendation system
Analyzes soil, climate, market, and historical data to recommend optimal crops
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, mean_squared_error
from typing import Dict, List, Tuple, Any, Optional
import logging
from datetime import datetime, timedelta
import json

logger = logging.getLogger(__name__)

class CropRecommenderAI:
    """AI system for intelligent crop recommendations"""
    
    def __init__(self):
        self.recommendation_model = None
        self.yield_prediction_model = None
        self.scaler = StandardScaler()
        self.label_encoder = LabelEncoder()
        self.is_trained = False
        
        # Comprehensive crop database
        self.crop_database = {
            'wheat': {
                'name_ar': 'القمح',
                'category': 'حبوب',
                'optimal_conditions': {
                    'temperature_range': (10, 25),
                    'rainfall_range': (300, 800),
                    'ph_range': (6.0, 7.5),
                    'soil_types': ['Loamy', 'Clay'],
                    'growing_season': 'winter'
                },
                'economic_data': {
                    'avg_price_per_kg': 2.5,
                    'market_demand': 'high',
                    'storage_duration': 12,  # months
                    'processing_required': True
                },
                'cultivation_info': {
                    'seed_cost_per_hectare': 150,
                    'fertilizer_cost_per_hectare': 300,
                    'labor_cost_per_hectare': 400,
                    'irrigation_requirement': 'medium',
                    'growing_period': 120,  # days
                    'expected_yield_per_hectare': 3500  # kg
                },
                'risk_factors': {
                    'disease_susceptibility': 'medium',
                    'pest_risk': 'medium',
                    'weather_sensitivity': 'high',
                    'market_volatility': 'low'
                }
            },
            'corn': {
                'name_ar': 'الذرة',
                'category': 'حبوب',
                'optimal_conditions': {
                    'temperature_range': (20, 30),
                    'rainfall_range': (500, 1200),
                    'ph_range': (6.0, 7.0),
                    'soil_types': ['Loamy', 'Silty'],
                    'growing_season': 'summer'
                },
                'economic_data': {
                    'avg_price_per_kg': 1.8,
                    'market_demand': 'high',
                    'storage_duration': 18,
                    'processing_required': True
                },
                'cultivation_info': {
                    'seed_cost_per_hectare': 200,
                    'fertilizer_cost_per_hectare': 400,
                    'labor_cost_per_hectare': 350,
                    'irrigation_requirement': 'high',
                    'growing_period': 90,
                    'expected_yield_per_hectare': 4500
                },
                'risk_factors': {
                    'disease_susceptibility': 'medium',
                    'pest_risk': 'high',
                    'weather_sensitivity': 'medium',
                    'market_volatility': 'medium'
                }
            },
            'rice': {
                'name_ar': 'الأرز',
                'category': 'حبوب',
                'optimal_conditions': {
                    'temperature_range': (25, 35),
                    'rainfall_range': (1000, 2000),
                    'ph_range': (5.5, 7.0),
                    'soil_types': ['Clay', 'Silty'],
                    'growing_season': 'summer'
                },
                'economic_data': {
                    'avg_price_per_kg': 3.2,
                    'market_demand': 'very_high',
                    'storage_duration': 24,
                    'processing_required': True
                },
                'cultivation_info': {
                    'seed_cost_per_hectare': 180,
                    'fertilizer_cost_per_hectare': 450,
                    'labor_cost_per_hectare': 500,
                    'irrigation_requirement': 'very_high',
                    'growing_period': 110,
                    'expected_yield_per_hectare': 4000
                },
                'risk_factors': {
                    'disease_susceptibility': 'high',
                    'pest_risk': 'high',
                    'weather_sensitivity': 'medium',
                    'market_volatility': 'low'
                }
            },
            'tomato': {
                'name_ar': 'الطماطم',
                'category': 'خضروات',
                'optimal_conditions': {
                    'temperature_range': (18, 28),
                    'rainfall_range': (400, 800),
                    'ph_range': (6.0, 7.0),
                    'soil_types': ['Loamy', 'Sandy'],
                    'growing_season': 'spring_summer'
                },
                'economic_data': {
                    'avg_price_per_kg': 4.5,
                    'market_demand': 'high',
                    'storage_duration': 1,
                    'processing_required': False
                },
                'cultivation_info': {
                    'seed_cost_per_hectare': 300,
                    'fertilizer_cost_per_hectare': 600,
                    'labor_cost_per_hectare': 800,
                    'irrigation_requirement': 'high',
                    'growing_period': 75,
                    'expected_yield_per_hectare': 25000
                },
                'risk_factors': {
                    'disease_susceptibility': 'high',
                    'pest_risk': 'high',
                    'weather_sensitivity': 'high',
                    'market_volatility': 'high'
                }
            },
            'potato': {
                'name_ar': 'البطاطس',
                'category': 'خضروات',
                'optimal_conditions': {
                    'temperature_range': (15, 25),
                    'rainfall_range': (400, 700),
                    'ph_range': (5.5, 6.5),
                    'soil_types': ['Sandy', 'Loamy'],
                    'growing_season': 'spring_fall'
                },
                'economic_data': {
                    'avg_price_per_kg': 2.8,
                    'market_demand': 'very_high',
                    'storage_duration': 6,
                    'processing_required': False
                },
                'cultivation_info': {
                    'seed_cost_per_hectare': 400,
                    'fertilizer_cost_per_hectare': 500,
                    'labor_cost_per_hectare': 600,
                    'irrigation_requirement': 'medium',
                    'growing_period': 85,
                    'expected_yield_per_hectare': 18000
                },
                'risk_factors': {
                    'disease_susceptibility': 'medium',
                    'pest_risk': 'medium',
                    'weather_sensitivity': 'medium',
                    'market_volatility': 'medium'
                }
            },
            'onion': {
                'name_ar': 'البصل',
                'category': 'خضروات',
                'optimal_conditions': {
                    'temperature_range': (12, 25),
                    'rainfall_range': (300, 600),
                    'ph_range': (6.0, 7.5),
                    'soil_types': ['Loamy', 'Silty'],
                    'growing_season': 'winter_spring'
                },
                'economic_data': {
                    'avg_price_per_kg': 3.5,
                    'market_demand': 'high',
                    'storage_duration': 8,
                    'processing_required': False
                },
                'cultivation_info': {
                    'seed_cost_per_hectare': 250,
                    'fertilizer_cost_per_hectare': 400,
                    'labor_cost_per_hectare': 500,
                    'irrigation_requirement': 'medium',
                    'growing_period': 95,
                    'expected_yield_per_hectare': 15000
                },
                'risk_factors': {
                    'disease_susceptibility': 'medium',
                    'pest_risk': 'medium',
                    'weather_sensitivity': 'medium',
                    'market_volatility': 'medium'
                }
            },
            'dates': {
                'name_ar': 'التمور',
                'category': 'فواكه',
                'optimal_conditions': {
                    'temperature_range': (25, 40),
                    'rainfall_range': (50, 300),
                    'ph_range': (7.0, 8.5),
                    'soil_types': ['Sandy', 'Loamy'],
                    'growing_season': 'perennial'
                },
                'economic_data': {
                    'avg_price_per_kg': 15.0,
                    'market_demand': 'high',
                    'storage_duration': 12,
                    'processing_required': False
                },
                'cultivation_info': {
                    'seed_cost_per_hectare': 2000,  # Tree plantation cost
                    'fertilizer_cost_per_hectare': 300,
                    'labor_cost_per_hectare': 800,
                    'irrigation_requirement': 'medium',
                    'growing_period': 365,  # Perennial
                    'expected_yield_per_hectare': 8000
                },
                'risk_factors': {
                    'disease_susceptibility': 'low',
                    'pest_risk': 'medium',
                    'weather_sensitivity': 'low',
                    'market_volatility': 'low'
                }
            },
            'olive': {
                'name_ar': 'الزيتون',
                'category': 'فواكه',
                'optimal_conditions': {
                    'temperature_range': (15, 30),
                    'rainfall_range': (400, 800),
                    'ph_range': (6.5, 8.0),
                    'soil_types': ['Loamy', 'Chalky'],
                    'growing_season': 'perennial'
                },
                'economic_data': {
                    'avg_price_per_kg': 8.0,
                    'market_demand': 'medium',
                    'storage_duration': 6,
                    'processing_required': True
                },
                'cultivation_info': {
                    'seed_cost_per_hectare': 3000,
                    'fertilizer_cost_per_hectare': 250,
                    'labor_cost_per_hectare': 600,
                    'irrigation_requirement': 'low',
                    'growing_period': 365,
                    'expected_yield_per_hectare': 6000
                },
                'risk_factors': {
                    'disease_susceptibility': 'low',
                    'pest_risk': 'low',
                    'weather_sensitivity': 'medium',
                    'market_volatility': 'medium'
                }
            }
        }
        
        self._initialize_models()
    
    def _initialize_models(self):
        """Initialize the recommendation models"""
        try:
            self._create_training_data()
            logger.info("CropRecommenderAI initialized successfully")
        except Exception as e:
            logger.error(f"Error initializing CropRecommenderAI: {e}")
    
    def _create_training_data(self):
        """Create synthetic training data for crop recommendation"""
        training_data = []
        labels = []
        yield_data = []
        
        # Generate training samples for each crop
        for crop_name, crop_info in self.crop_database.items():
            conditions = crop_info['optimal_conditions']
            cultivation = crop_info['cultivation_info']
            
            for _ in range(200):  # 200 samples per crop
                # Generate feature vector
                temp = np.random.uniform(*conditions['temperature_range'])
                rainfall = np.random.uniform(*conditions['rainfall_range'])
                ph = np.random.uniform(*conditions['ph_range'])
                
                # Add variability
                temp += np.random.normal(0, 3)
                rainfall += np.random.normal(0, 100)
                ph += np.random.normal(0, 0.3)
                
                # Additional features
                soil_quality = np.random.uniform(0.3, 1.0)
                water_availability = np.random.uniform(0.4, 1.0)
                market_price = crop_info['economic_data']['avg_price_per_kg']
                market_price += np.random.normal(0, market_price * 0.2)
                
                # Farmer experience and resources
                farmer_experience = np.random.uniform(0.2, 1.0)
                available_capital = np.random.uniform(0.3, 1.0)
                farm_size = np.random.uniform(0.5, 20.0)  # hectares
                
                # Risk tolerance
                risk_tolerance = np.random.uniform(0.2, 1.0)
                
                features = [
                    temp, rainfall, ph, soil_quality, water_availability,
                    market_price, farmer_experience, available_capital,
                    farm_size, risk_tolerance
                ]
                
                training_data.append(features)
                labels.append(crop_name)
                
                # Generate yield data
                base_yield = cultivation['expected_yield_per_hectare']
                # Add noise based on conditions match
                yield_factor = np.random.uniform(0.7, 1.3)
                actual_yield = base_yield * yield_factor * soil_quality * water_availability
                yield_data.append(actual_yield)
        
        # Convert to arrays
        X = np.array(training_data)
        y_crop = np.array(labels)
        y_yield = np.array(yield_data)
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Encode crop labels
        y_encoded = self.label_encoder.fit_transform(y_crop)
        
        # Train recommendation model
        self.recommendation_model = RandomForestClassifier(
            n_estimators=200,
            max_depth=15,
            random_state=42
        )
        self.recommendation_model.fit(X_scaled, y_encoded)
        
        # Train yield prediction model
        self.yield_prediction_model = GradientBoostingRegressor(
            n_estimators=200,
            max_depth=8,
            random_state=42
        )
        self.yield_prediction_model.fit(X_scaled, y_yield)
        
        self.is_trained = True
        logger.info(f"Trained CropRecommenderAI with {len(training_data)} samples")
    
    def recommend_crops(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate crop recommendations based on input parameters"""
        try:
            if not self.is_trained:
                raise ValueError("Models not trained")
            
            # Extract and validate input features
            features = self._extract_features(input_data)
            
            # Scale features
            features_scaled = self.scaler.transform([features])
            
            # Get crop probabilities
            crop_probabilities = self.recommendation_model.predict_proba(features_scaled)[0]
            crop_names = self.label_encoder.inverse_transform(range(len(crop_probabilities)))
            
            # Rank crops by suitability
            crop_scores = list(zip(crop_names, crop_probabilities))
            crop_scores.sort(key=lambda x: x[1], reverse=True)
            
            # Generate detailed recommendations
            recommendations = []
            for i, (crop_name, score) in enumerate(crop_scores[:6]):  # Top 6 crops
                crop_info = self.crop_database[crop_name]
                
                # Predict yield
                predicted_yield = self.yield_prediction_model.predict(features_scaled)[0]
                
                # Calculate suitability analysis
                suitability_analysis = self._analyze_crop_suitability(
                    crop_info, input_data
                )
                
                # Calculate profitability
                profit_analysis = self._calculate_profitability(
                    crop_info, predicted_yield, input_data.get('farm_size', 1.0)
                )
                
                # Risk assessment
                risk_assessment = self._assess_crop_risk(
                    crop_info, input_data
                )
                
                recommendation = {
                    'rank': i + 1,
                    'crop': crop_name,
                    'name_ar': crop_info['name_ar'],
                    'category': crop_info['category'],
                    'suitability_score': float(score),
                    'predicted_yield_per_hectare': float(predicted_yield),
                    'suitability_analysis': suitability_analysis,
                    'profit_analysis': profit_analysis,
                    'risk_assessment': risk_assessment,
                    'growing_season': crop_info['optimal_conditions']['growing_season'],
                    'growing_period_days': crop_info['cultivation_info']['growing_period']
                }
                
                recommendations.append(recommendation)
            
            # Overall analysis
            overall_analysis = self._generate_overall_analysis(
                recommendations, input_data
            )
            
            # Seasonal recommendations
            seasonal_advice = self._generate_seasonal_advice(
                recommendations, datetime.now().month
            )
            
            return {
                'recommendations': recommendations,
                'best_recommendation': recommendations[0] if recommendations else None,
                'overall_analysis': overall_analysis,
                'seasonal_advice': seasonal_advice,
                'input_analysis': self._analyze_input_conditions(input_data),
                'analysis_timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error in crop recommendation: {e}")
            raise
    
    def _extract_features(self, input_data: Dict[str, Any]) -> List[float]:
        """Extract and normalize features from input data"""
        # Climate features
        temp = input_data.get('temperature', 25.0)
        rainfall = input_data.get('annual_rainfall', 600.0)
        ph = input_data.get('soil_ph', 6.5)
        
        # Soil and environment
        soil_quality = input_data.get('soil_quality_score', 0.7)
        water_availability = input_data.get('water_availability', 0.8)
        
        # Market data
        target_market_price = input_data.get('target_market_price', 3.0)
        
        # Farmer profile
        farmer_experience = input_data.get('farmer_experience_years', 5) / 20.0  # Normalize to 0-1
        available_capital = input_data.get('available_capital', 10000) / 50000.0  # Normalize
        farm_size = input_data.get('farm_size', 2.0)
        risk_tolerance = input_data.get('risk_tolerance', 0.5)  # 0-1 scale
        
        return [
            temp, rainfall, ph, soil_quality, water_availability,
            target_market_price, farmer_experience, available_capital,
            farm_size, risk_tolerance
        ]
    
    def _analyze_crop_suitability(self, crop_info: Dict, input_data: Dict) -> Dict[str, Any]:
        """Analyze how well input conditions match crop requirements"""
        conditions = crop_info['optimal_conditions']
        analysis = {}
        
        # Temperature suitability
        temp = input_data.get('temperature', 25.0)
        temp_min, temp_max = conditions['temperature_range']
        temp_score = self._calculate_range_score(temp, temp_min, temp_max)
        analysis['temperature'] = {
            'score': temp_score,
            'status': self._get_status_from_score(temp_score),
            'current': temp,
            'optimal_range': conditions['temperature_range']
        }
        
        # Rainfall suitability
        rainfall = input_data.get('annual_rainfall', 600.0)
        rain_min, rain_max = conditions['rainfall_range']
        rain_score = self._calculate_range_score(rainfall, rain_min, rain_max)
        analysis['rainfall'] = {
            'score': rain_score,
            'status': self._get_status_from_score(rain_score),
            'current': rainfall,
            'optimal_range': conditions['rainfall_range']
        }
        
        # pH suitability
        ph = input_data.get('soil_ph', 6.5)
        ph_min, ph_max = conditions['ph_range']
        ph_score = self._calculate_range_score(ph, ph_min, ph_max)
        analysis['soil_ph'] = {
            'score': ph_score,
            'status': self._get_status_from_score(ph_score),
            'current': ph,
            'optimal_range': conditions['ph_range']
        }
        
        # Overall suitability
        overall_score = np.mean([temp_score, rain_score, ph_score])
        analysis['overall'] = {
            'score': float(overall_score),
            'level': self._get_suitability_level(overall_score)
        }
        
        return analysis
    
    def _calculate_profitability(self, crop_info: Dict, predicted_yield: float, 
                               farm_size: float) -> Dict[str, Any]:
        """Calculate expected profitability for the crop"""
        cultivation = crop_info['cultivation_info']
        economic = crop_info['economic_data']
        
        # Calculate costs
        seed_cost = cultivation['seed_cost_per_hectare'] * farm_size
        fertilizer_cost = cultivation['fertilizer_cost_per_hectare'] * farm_size
        labor_cost = cultivation['labor_cost_per_hectare'] * farm_size
        irrigation_cost = self._estimate_irrigation_cost(
            cultivation['irrigation_requirement'], farm_size
        )
        
        total_costs = seed_cost + fertilizer_cost + labor_cost + irrigation_cost
        
        # Calculate revenue
        total_yield = predicted_yield * farm_size
        gross_revenue = total_yield * economic['avg_price_per_kg']
        
        # Calculate profit
        net_profit = gross_revenue - total_costs
        profit_margin = (net_profit / gross_revenue) * 100 if gross_revenue > 0 else 0
        roi = (net_profit / total_costs) * 100 if total_costs > 0 else 0
        
        return {
            'total_costs': float(total_costs),
            'breakdown': {
                'seed_cost': float(seed_cost),
                'fertilizer_cost': float(fertilizer_cost),
                'labor_cost': float(labor_cost),
                'irrigation_cost': float(irrigation_cost)
            },
            'gross_revenue': float(gross_revenue),
            'net_profit': float(net_profit),
            'profit_margin_percent': float(profit_margin),
            'roi_percent': float(roi),
            'profitability_level': self._get_profitability_level(roi),
            'payback_period_months': cultivation['growing_period'] / 30.0
        }
    
    def _assess_crop_risk(self, crop_info: Dict, input_data: Dict) -> Dict[str, Any]:
        """Assess various risks associated with the crop"""
        risks = crop_info['risk_factors']
        farmer_experience = input_data.get('farmer_experience_years', 5)
        
        # Convert risk levels to scores
        risk_mapping = {'low': 0.2, 'medium': 0.5, 'high': 0.8, 'very_high': 1.0}
        
        disease_risk = risk_mapping.get(risks['disease_susceptibility'], 0.5)
        pest_risk = risk_mapping.get(risks['pest_risk'], 0.5)
        weather_risk = risk_mapping.get(risks['weather_sensitivity'], 0.5)
        market_risk = risk_mapping.get(risks['market_volatility'], 0.5)
        
        # Adjust risks based on farmer experience
        experience_factor = min(1.0, farmer_experience / 10.0)
        disease_risk *= (1 - experience_factor * 0.3)
        pest_risk *= (1 - experience_factor * 0.3)
        
        # Overall risk score
        overall_risk = np.mean([disease_risk, pest_risk, weather_risk, market_risk])
        
        return {
            'disease_risk': {
                'score': float(disease_risk),
                'level': self._get_risk_level(disease_risk),
                'description': 'مخاطر الأمراض النباتية'
            },
            'pest_risk': {
                'score': float(pest_risk),
                'level': self._get_risk_level(pest_risk),
                'description': 'مخاطر الآفات الحشرية'
            },
            'weather_risk': {
                'score': float(weather_risk),
                'level': self._get_risk_level(weather_risk),
                'description': 'مخاطر الطقس والمناخ'
            },
            'market_risk': {
                'score': float(market_risk),
                'level': self._get_risk_level(market_risk),
                'description': 'مخاطر تقلبات السوق'
            },
            'overall_risk': {
                'score': float(overall_risk),
                'level': self._get_risk_level(overall_risk),
                'recommendation': self._get_risk_recommendation(overall_risk)
            }
        }
    
    def _generate_overall_analysis(self, recommendations: List[Dict], 
                                 input_data: Dict) -> Dict[str, Any]:
        """Generate overall analysis and insights"""
        if not recommendations:
            return {'message': 'لا توجد توصيات متاحة'}
        
        # Analyze recommendation diversity
        categories = [rec['category'] for rec in recommendations[:3]]
        category_diversity = len(set(categories))
        
        # Average profitability
        avg_roi = np.mean([rec['profit_analysis']['roi_percent'] for rec in recommendations[:3]])
        
        # Average risk
        avg_risk = np.mean([rec['risk_assessment']['overall_risk']['score'] for rec in recommendations[:3]])
        
        # Best category recommendation
        category_scores = {}
        for rec in recommendations:
            cat = rec['category']
            if cat not in category_scores:
                category_scores[cat] = []
            category_scores[cat].append(rec['suitability_score'])
        
        best_category = max(category_scores.keys(), 
                           key=lambda x: np.mean(category_scores[x]))
        
        return {
            'recommendation_quality': 'عالية' if recommendations[0]['suitability_score'] > 0.7 else 'متوسطة',
            'diversity_score': category_diversity,
            'average_profitability': float(avg_roi),
            'average_risk_level': self._get_risk_level(avg_risk),
            'best_category': best_category,
            'farmer_suitability': self._assess_farmer_suitability(input_data),
            'key_insights': self._generate_key_insights(recommendations, input_data)
        }
    
    def _generate_seasonal_advice(self, recommendations: List[Dict], 
                                current_month: int) -> Dict[str, Any]:
        """Generate seasonal planting advice"""
        immediate_crops = []
        upcoming_crops = []
        
        season_mapping = {
            'winter': [11, 12, 1, 2],
            'spring': [3, 4, 5],
            'summer': [6, 7, 8],
            'fall': [9, 10],
            'spring_summer': [3, 4, 5, 6, 7, 8],
            'winter_spring': [11, 12, 1, 2, 3, 4],
            'spring_fall': [3, 4, 5, 9, 10],
            'perennial': list(range(1, 13))
        }
        
        for rec in recommendations[:5]:
            growing_season = rec['growing_season']
            suitable_months = season_mapping.get(growing_season, [])
            
            if current_month in suitable_months:
                immediate_crops.append({
                    'crop': rec['name_ar'],
                    'suitability_score': rec['suitability_score'],
                    'profit_potential': rec['profit_analysis']['roi_percent']
                })
            else:
                # Find next suitable month
                next_months = [m for m in suitable_months if m > current_month]
                if not next_months:
                    next_months = suitable_months  # Next year
                
                if next_months:
                    upcoming_crops.append({
                        'crop': rec['name_ar'],
                        'next_planting_month': min(next_months),
                        'suitability_score': rec['suitability_score']
                    })
        
        return {
            'current_month': current_month,
            'immediate_planting': immediate_crops,
            'upcoming_planting': upcoming_crops,
            'seasonal_advice': self._get_seasonal_advice_text(current_month)
        }
    
    def _analyze_input_conditions(self, input_data: Dict) -> Dict[str, Any]:
        """Analyze the input conditions and provide insights"""
        temp = input_data.get('temperature', 25.0)
        rainfall = input_data.get('annual_rainfall', 600.0)
        ph = input_data.get('soil_ph', 6.5)
        
        # Climate classification
        if temp > 30 and rainfall < 400:
            climate_type = 'صحراوي حار'
        elif temp > 25 and 400 <= rainfall < 800:
            climate_type = 'شبه استوائي'
        elif 20 <= temp <= 25 and 600 <= rainfall <= 1200:
            climate_type = 'معتدل'
        elif temp < 20:
            climate_type = 'بارد'
        else:
            climate_type = 'استوائي'
        
        # Soil condition
        if 6.0 <= ph <= 7.0:
            soil_condition = 'مثالية'
        elif 5.5 <= ph < 6.0 or 7.0 < ph <= 7.5:
            soil_condition = 'جيدة'
        else:
            soil_condition = 'تحتاج تحسين'
        
        # Water status
        if rainfall < 400:
            water_status = 'نقص - ري مكثف مطلوب'
        elif 400 <= rainfall < 800:
            water_status = 'معتدل - ري ت��ميلي'
        else:
            water_status = 'وفرة - انتبه للصرف'
        
        return {
            'climate_type': climate_type,
            'soil_condition': soil_condition,
            'water_status': water_status,
            'limitations': self._identify_limitations(input_data),
            'strengths': self._identify_strengths(input_data)
        }
    
    # Helper methods
    def _calculate_range_score(self, value: float, min_val: float, max_val: float) -> float:
        """Calculate how well a value fits within an optimal range"""
        if min_val <= value <= max_val:
            return 1.0
        elif value < min_val:
            distance = min_val - value
            tolerance = (max_val - min_val) * 0.5
            return max(0.0, 1.0 - distance / tolerance)
        else:
            distance = value - max_val
            tolerance = (max_val - min_val) * 0.5
            return max(0.0, 1.0 - distance / tolerance)
    
    def _get_status_from_score(self, score: float) -> str:
        """Convert score to status"""
        if score >= 0.8:
            return 'ممتاز'
        elif score >= 0.6:
            return 'جيد'
        elif score >= 0.4:
            return 'مقبول'
        else:
            return 'غير مناسب'
    
    def _get_suitability_level(self, score: float) -> str:
        """Get suitability level from score"""
        if score >= 0.8:
            return 'عالية جداً'
        elif score >= 0.6:
            return 'عالية'
        elif score >= 0.4:
            return 'متوسطة'
        else:
            return 'منخفضة'
    
    def _get_risk_level(self, risk_score: float) -> str:
        """Get risk level from score"""
        if risk_score <= 0.3:
            return 'منخفض'
        elif risk_score <= 0.6:
            return 'متوسط'
        else:
            return 'عالي'
    
    def _get_profitability_level(self, roi: float) -> str:
        """Get profitability level from ROI"""
        if roi >= 50:
            return 'ممتاز'
        elif roi >= 30:
            return 'جيد جداً'
        elif roi >= 15:
            return 'جيد'
        elif roi >= 5:
            return 'مقبول'
        else:
            return 'ضعيف'
    
    def _estimate_irrigation_cost(self, requirement: str, farm_size: float) -> float:
        """Estimate irrigation costs based on requirements"""
        cost_per_hectare = {
            'low': 100,
            'medium': 200,
            'high': 400,
            'very_high': 600
        }
        return cost_per_hectare.get(requirement, 200) * farm_size
    
    def _get_risk_recommendation(self, risk_score: float) -> str:
        """Get risk management recommendation"""
        if risk_score <= 0.3:
            return 'مخاطر منخفضة - مناسب للمبتدئين'
        elif risk_score <= 0.6:
            return 'مخاطر متوسطة - يحتاج خبرة معتدلة'
        else:
            return 'مخاطر عالية - يحتاج خبرة متقدمة وإدارة مخاطر'
    
    def _assess_farmer_suitability(self, input_data: Dict) -> str:
        """Assess farmer's suitability for recommendations"""
        experience = input_data.get('farmer_experience_years', 5)
        capital = input_data.get('available_capital', 10000)
        risk_tolerance = input_data.get('risk_tolerance', 0.5)
        
        if experience >= 10 and capital >= 20000 and risk_tolerance >= 0.7:
            return 'مناسب للمحاصيل عالية المخاطر والعائد'
        elif experience >= 5 and capital >= 10000:
            return 'مناسب للمحاصيل متوسطة المخاطر'
        else:
            return 'يُنصح بالمحاصيل منخفضة المخاطر'
    
    def _generate_key_insights(self, recommendations: List[Dict], 
                             input_data: Dict) -> List[str]:
        """Generate key insights from the analysis"""
        insights = []
        
        if recommendations:
            best_crop = recommendations[0]
            insights.append(f"أفضل محصول موصى به: {best_crop['name_ar']} بدرجة ملائمة {best_crop['suitability_score']:.1f}")
            
            if best_crop['profit_analysis']['roi_percent'] > 30:
                insights.append(f"عائد استثمار ممتاز متوقع: {best_crop['profit_analysis']['roi_percent']:.1f}%")
            
            # Risk insights
            avg_risk = np.mean([rec['risk_assessment']['overall_risk']['score'] for rec in recommendations[:3]])
            if avg_risk > 0.7:
                insights.append("المحاصيل الموصى بها تحتاج إدارة مخاطر متقدمة")
            elif avg_risk < 0.3:
                insights.append("المحاصيل الموصى بها منخفضة المخاطر ومناسبة للمبتدئين")
        
        # Climate insights
        temp = input_data.get('temperature', 25.0)
        if temp > 35:
            insights.append("درجة الحرارة العالية تحد من خيارات المحاصيل")
        elif temp < 10:
            insights.append("درجة الحرارة المنخفضة تتطلب محاصيل شتوية")
        
        return insights
    
    def _get_seasonal_advice_text(self, month: int) -> str:
        """Get seasonal advice text"""
        if month in [12, 1, 2]:
            return "فصل الشتاء - مناسب لزراعة المحاصيل الشتوية مثل القمح والبصل"
        elif month in [3, 4, 5]:
            return "فصل الربيع - وقت ممتاز للزراعة، معظم المحاصيل مناسبة"
        elif month in [6, 7, 8]:
            return "فصل الصيف - ركز على المحاصيل المقاومة للحرارة"
        else:
            return "فصل الخريف - مناسب للمحاصيل قصيرة المدى"
    
    def _identify_limitations(self, input_data: Dict) -> List[str]:
        """Identify limitations in the input conditions"""
        limitations = []
        
        temp = input_data.get('temperature', 25.0)
        if temp > 35:
            limitations.append("درجة حرارة عالية جداً")
        elif temp < 5:
            limitations.append("درجة حرارة منخفضة جداً")
        
        rainfall = input_data.get('annual_rainfall', 600.0)
        if rainfall < 200:
            limitations.append("نقص شديد في الأمطار")
        elif rainfall > 2000:
            limitations.append("أمطار مفرطة قد تسبب مشاكل صر��")
        
        ph = input_data.get('soil_ph', 6.5)
        if ph < 5.0:
            limitations.append("تربة حمضية جداً")
        elif ph > 8.5:
            limitations.append("تربة قلوية جداً")
        
        return limitations
    
    def _identify_strengths(self, input_data: Dict) -> List[str]:
        """Identify strengths in the input conditions"""
        strengths = []
        
        temp = input_data.get('temperature', 25.0)
        if 20 <= temp <= 28:
            strengths.append("درجة حرارة مثالية للعديد من المحاصيل")
        
        rainfall = input_data.get('annual_rainfall', 600.0)
        if 500 <= rainfall <= 1000:
            strengths.append("هطول أمطار ممتاز")
        
        ph = input_data.get('soil_ph', 6.5)
        if 6.0 <= ph <= 7.0:
            strengths.append("درجة حموضة مثالية للتربة")
        
        experience = input_data.get('farmer_experience_years', 5)
        if experience >= 10:
            strengths.append("خبرة زراعية متقدمة")
        
        return strengths

# Factory function
def create_crop_recommender() -> CropRecommenderAI:
    """Create and return a CropRecommenderAI instance"""
    return CropRecommenderAI()
