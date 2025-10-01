"""
ProfitEstimatorAI - Advanced profit estimation and financial analysis for agricultural investments
Analyzes costs, revenues, market trends, and risk factors to provide detailed financial projections
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from typing import Dict, List, Tuple, Any, Optional
import logging
from datetime import datetime, timedelta
import json

logger = logging.getLogger(__name__)

class ProfitEstimatorAI:
    """AI system for comprehensive agricultural profit estimation and financial analysis"""
    
    def __init__(self):
        self.price_prediction_model = None
        self.yield_prediction_model = None
        self.cost_estimation_model = None
        self.risk_assessment_model = None
        self.scaler = StandardScaler()
        self.is_trained = False
        
        # Market price database with historical trends
        self.market_data = {
            'wheat': {
                'name_ar': 'القمح',
                'base_price_per_kg': 2.5,
                'price_volatility': 0.15,
                'seasonal_factors': {
                    'harvest_months': [5, 6, 7],
                    'price_dip_factor': 0.85,
                    'storage_premium': 0.1
                },
                'demand_trend': 'stable',
                'export_potential': 'medium'
            },
            'corn': {
                'name_ar': 'الذرة',
                'base_price_per_kg': 1.8,
                'price_volatility': 0.20,
                'seasonal_factors': {
                    'harvest_months': [8, 9, 10],
                    'price_dip_factor': 0.80,
                    'storage_premium': 0.15
                },
                'demand_trend': 'increasing',
                'export_potential': 'high'
            },
            'rice': {
                'name_ar': 'الأرز',
                'base_price_per_kg': 3.2,
                'price_volatility': 0.10,
                'seasonal_factors': {
                    'harvest_months': [9, 10, 11],
                    'price_dip_factor': 0.90,
                    'storage_premium': 0.08
                },
                'demand_trend': 'stable',
                'export_potential': 'very_high'
            },
            'tomato': {
                'name_ar': 'الطماطم',
                'base_price_per_kg': 4.5,
                'price_volatility': 0.35,
                'seasonal_factors': {
                    'harvest_months': [6, 7, 8, 9],
                    'price_dip_factor': 0.70,
                    'storage_premium': 0.0  # Perishable
                },
                'demand_trend': 'stable',
                'export_potential': 'low'
            },
            'potato': {
                'name_ar': 'البطاطس',
                'base_price_per_kg': 2.8,
                'price_volatility': 0.25,
                'seasonal_factors': {
                    'harvest_months': [5, 6, 10, 11],
                    'price_dip_factor': 0.75,
                    'storage_premium': 0.12
                },
                'demand_trend': 'stable',
                'export_potential': 'medium'
            },
            'onion': {
                'name_ar': 'البصل',
                'base_price_per_kg': 3.5,
                'price_volatility': 0.30,
                'seasonal_factors': {
                    'harvest_months': [4, 5, 6],
                    'price_dip_factor': 0.65,
                    'storage_premium': 0.20
                },
                'demand_trend': 'stable',
                'export_potential': 'high'
            },
            'dates': {
                'name_ar': 'التمور',
                'base_price_per_kg': 15.0,
                'price_volatility': 0.12,
                'seasonal_factors': {
                    'harvest_months': [8, 9, 10],
                    'price_dip_factor': 0.85,
                    'storage_premium': 0.05
                },
                'demand_trend': 'increasing',
                'export_potential': 'very_high'
            },
            'olive': {
                'name_ar': 'الزيتون',
                'base_price_per_kg': 8.0,
                'price_volatility': 0.18,
                'seasonal_factors': {
                    'harvest_months': [10, 11, 12],
                    'price_dip_factor': 0.80,
                    'storage_premium': 0.15
                },
                'demand_trend': 'increasing',
                'export_potential': 'high'
            }
        }
        
        # Cost structure database
        self.cost_structure = {
            'fixed_costs': {
                'land_lease_per_hectare_year': 1500,
                'equipment_depreciation_per_hectare': 200,
                'insurance_per_hectare': 150,
                'certification_per_hectare': 100
            },
            'variable_costs': {
                'labor_rates': {
                    'skilled_per_day': 45,
                    'unskilled_per_day': 25,
                    'seasonal_multiplier': 1.2
                },
                'fuel_cost_per_liter': 1.5,
                'electricity_cost_per_kwh': 0.12,
                'water_cost_per_cubic_meter': 0.8
            },
            'input_costs': {
                'fertilizer_cost_multiplier': 1.1,  # Annual increase
                'seed_cost_multiplier': 1.05,
                'pesticide_cost_multiplier': 1.08
            }
        }
        
        self._initialize_models()
    
    def _initialize_models(self):
        """Initialize the profit estimation models"""
        try:
            self._create_training_data()
            logger.info("ProfitEstimatorAI initialized successfully")
        except Exception as e:
            logger.error(f"Error initializing ProfitEstimatorAI: {e}")
    
    def _create_training_data(self):
        """Create synthetic training data for profit estimation models"""
        np.random.seed(42)
        n_samples = 2000
        
        training_data = []
        price_targets = []
        yield_targets = []
        cost_targets = []
        
        for _ in range(n_samples):
            # Generate input features
            features = {
                'farm_size': np.random.uniform(0.5, 50.0),
                'soil_quality': np.random.uniform(0.3, 1.0),
                'climate_suitability': np.random.uniform(0.2, 1.0),
                'farmer_experience': np.random.uniform(0.1, 1.0),
                'technology_level': np.random.uniform(0.2, 1.0),
                'market_distance': np.random.uniform(1, 200),  # km
                'water_availability': np.random.uniform(0.3, 1.0),
                'labor_availability': np.random.uniform(0.4, 1.0),
                'capital_available': np.random.uniform(0.2, 1.0),
                'season_factor': np.random.uniform(0.7, 1.3)
            }
            
            feature_vector = list(features.values())
            training_data.append(feature_vector)
            
            # Generate synthetic targets
            base_price = 3.0 + np.random.normal(0, 1)
            price_targets.append(max(0.5, base_price))
            
            base_yield = 5000 * features['soil_quality'] * features['climate_suitability']
            yield_targets.append(max(500, base_yield + np.random.normal(0, 1000)))
            
            base_cost = 2000 + features['farm_size'] * 100 + np.random.normal(0, 500)
            cost_targets.append(max(500, base_cost))
        
        X = np.array(training_data)
        X_scaled = self.scaler.fit_transform(X)
        
        # Train models
        self.price_prediction_model = GradientBoostingRegressor(n_estimators=100, random_state=42)
        self.price_prediction_model.fit(X_scaled, price_targets)
        
        self.yield_prediction_model = RandomForestRegressor(n_estimators=100, random_state=42)
        self.yield_prediction_model.fit(X_scaled, yield_targets)
        
        self.cost_estimation_model = GradientBoostingRegressor(n_estimators=100, random_state=42)
        self.cost_estimation_model.fit(X_scaled, cost_targets)
        
        self.is_trained = True
        logger.info(f"Trained ProfitEstimatorAI models with {n_samples} samples")
    
    def estimate_crop_profitability(self, crop_data: Dict[str, Any]) -> Dict[str, Any]:
        """Comprehensive profitability analysis for a specific crop"""
        try:
            if not self.is_trained:
                raise ValueError("Models not trained")
            
            crop_name = crop_data.get('crop_name', 'wheat')
            farm_size = crop_data.get('farm_size', 2.0)
            planning_horizon = crop_data.get('planning_horizon_years', 1)
            
            # Get market data for the crop
            if crop_name not in self.market_data:
                raise ValueError(f"Market data not available for crop: {crop_name}")
            
            market_info = self.market_data[crop_name]
            
            # Prepare features for ML models
            features = self._extract_profitability_features(crop_data)
            features_scaled = self.scaler.transform([features])
            
            # Predict key metrics
            predicted_price = self.price_prediction_model.predict(features_scaled)[0]
            predicted_yield = self.yield_prediction_model.predict(features_scaled)[0]
            predicted_costs = self.cost_estimation_model.predict(features_scaled)[0]
            
            # Adjust predictions based on crop-specific factors
            adjusted_price = self._adjust_price_prediction(predicted_price, crop_name, crop_data)
            adjusted_yield = self._adjust_yield_prediction(predicted_yield, crop_name, crop_data)
            detailed_costs = self._calculate_detailed_costs(crop_name, farm_size, crop_data)
            
            # Financial analysis
            financial_analysis = self._perform_financial_analysis(
                adjusted_price, adjusted_yield, detailed_costs, farm_size, planning_horizon
            )
            
            # Risk analysis
            risk_analysis = self._perform_risk_analysis(crop_name, crop_data, financial_analysis)
            
            # Market analysis
            market_analysis = self._analyze_market_conditions(crop_name, crop_data)
            
            # Sensitivity analysis
            sensitivity_analysis = self._perform_sensitivity_analysis(
                crop_name, adjusted_price, adjusted_yield, detailed_costs, farm_size
            )
            
            # Investment recommendations
            investment_recommendations = self._generate_investment_recommendations(
                financial_analysis, risk_analysis, market_analysis
            )
            
            return {
                'crop_name': crop_name,
                'crop_name_ar': market_info['name_ar'],
                'farm_size_hectares': farm_size,
                'planning_horizon_years': planning_horizon,
                'price_analysis': {
                    'predicted_price_per_kg': float(adjusted_price),
                    'price_range': self._calculate_price_range(adjusted_price, market_info['price_volatility']),
                    'seasonal_price_variation': self._calculate_seasonal_variation(crop_name)
                },
                'yield_analysis': {
                    'predicted_yield_per_hectare': float(adjusted_yield),
                    'total_expected_yield': float(adjusted_yield * farm_size),
                    'yield_confidence_interval': self._calculate_yield_confidence(adjusted_yield)
                },
                'cost_analysis': detailed_costs,
                'financial_analysis': financial_analysis,
                'risk_analysis': risk_analysis,
                'market_analysis': market_analysis,
                'sensitivity_analysis': sensitivity_analysis,
                'investment_recommendations': investment_recommendations,
                'analysis_timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error in crop profitability estimation: {e}")
            raise
    
    def compare_crop_profitability(self, crops_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Compare profitability of multiple crops"""
        try:
            crop_analyses = []
            
            for crop_data in crops_data:
                analysis = self.estimate_crop_profitability(crop_data)
                crop_analyses.append({
                    'crop_name': analysis['crop_name'],
                    'crop_name_ar': analysis['crop_name_ar'],
                    'net_profit': analysis['financial_analysis']['net_profit'],
                    'roi_percent': analysis['financial_analysis']['roi_percent'],
                    'payback_period': analysis['financial_analysis']['payback_period_months'],
                    'risk_score': analysis['risk_analysis']['overall_risk_score'],
                    'market_potential': analysis['market_analysis']['market_potential_score']
                })
            
            # Rank crops by different criteria
            rankings = self._rank_crops(crop_analyses)
            
            # Portfolio recommendations
            portfolio_recommendations = self._generate_portfolio_recommendations(crop_analyses)
            
            return {
                'crop_comparisons': crop_analyses,
                'rankings': rankings,
                'portfolio_recommendations': portfolio_recommendations,
                'best_overall_crop': rankings['by_weighted_score'][0] if rankings['by_weighted_score'] else None,
                'analysis_timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error in crop profitability comparison: {e}")
            raise
    
    def _extract_profitability_features(self, crop_data: Dict[str, Any]) -> List[float]:
        """Extract features for profitability prediction"""
        return [
            crop_data.get('farm_size', 2.0),
            crop_data.get('soil_quality_score', 0.7),
            crop_data.get('climate_suitability_score', 0.8),
            crop_data.get('farmer_experience_years', 5) / 20.0,
            crop_data.get('technology_level', 0.6),
            crop_data.get('market_distance_km', 50) / 200.0,
            crop_data.get('water_availability_score', 0.8),
            crop_data.get('labor_availability_score', 0.7),
            crop_data.get('available_capital', 10000) / 100000.0,
            crop_data.get('season_factor', 1.0)
        ]
    
    def _adjust_price_prediction(self, predicted_price: float, crop_name: str, 
                               crop_data: Dict[str, Any]) -> float:
        """Adjust price prediction based on crop-specific factors"""
        market_info = self.market_data[crop_name]
        base_price = market_info['base_price_per_kg']
        
        # Blend ML prediction with market data
        adjusted_price = (predicted_price * 0.3) + (base_price * 0.7)
        
        # Apply market distance factor
        distance = crop_data.get('market_distance_km', 50)
        distance_factor = max(0.9, 1.0 - (distance - 50) * 0.001)
        adjusted_price *= distance_factor
        
        # Apply quality premium/discount
        quality_score = crop_data.get('product_quality_score', 0.8)
        quality_factor = 0.8 + (quality_score * 0.4)  # Range: 0.8 to 1.2
        adjusted_price *= quality_factor
        
        return adjusted_price
    
    def _adjust_yield_prediction(self, predicted_yield: float, crop_name: str, 
                               crop_data: Dict[str, Any]) -> float:
        """Adjust yield prediction based on crop-specific factors"""
        # Apply technology factor
        tech_level = crop_data.get('technology_level', 0.6)
        tech_factor = 0.7 + (tech_level * 0.6)  # Range: 0.7 to 1.3
        
        # Apply irrigation factor
        irrigation_quality = crop_data.get('irrigation_quality_score', 0.7)
        irrigation_factor = 0.8 + (irrigation_quality * 0.4)  # Range: 0.8 to 1.2
        
        adjusted_yield = predicted_yield * tech_factor * irrigation_factor
        
        return adjusted_yield
    
    def _calculate_detailed_costs(self, crop_name: str, farm_size: float, 
                                crop_data: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate detailed cost breakdown"""
        costs = self.cost_structure
        
        # Fixed costs
        fixed_costs = {
            'land_lease': costs['fixed_costs']['land_lease_per_hectare_year'] * farm_size,
            'equipment_depreciation': costs['fixed_costs']['equipment_depreciation_per_hectare'] * farm_size,
            'insurance': costs['fixed_costs']['insurance_per_hectare'] * farm_size,
            'certification': costs['fixed_costs']['certification_per_hectare'] * farm_size
        }
        
        # Variable costs
        labor_days_per_hectare = crop_data.get('labor_days_per_hectare', 30)
        fuel_consumption = crop_data.get('fuel_consumption_per_hectare', 100)  # liters
        electricity_consumption = crop_data.get('electricity_consumption_per_hectare', 500)  # kWh
        water_consumption = crop_data.get('water_consumption_per_hectare', 3000)  # cubic meters
        
        variable_costs = {
            'labor': labor_days_per_hectare * costs['variable_costs']['labor_rates']['unskilled_per_day'] * farm_size,
            'fuel': fuel_consumption * costs['variable_costs']['fuel_cost_per_liter'] * farm_size,
            'electricity': electricity_consumption * costs['variable_costs']['electricity_cost_per_kwh'] * farm_size,
            'water': water_consumption * costs['variable_costs']['water_cost_per_cubic_meter'] * farm_size
        }
        
        # Input costs
        seed_cost_per_hectare = crop_data.get('seed_cost_per_hectare', 200)
        fertilizer_cost_per_hectare = crop_data.get('fertilizer_cost_per_hectare', 300)
        pesticide_cost_per_hectare = crop_data.get('pesticide_cost_per_hectare', 150)
        
        input_costs = {
            'seeds': seed_cost_per_hectare * farm_size,
            'fertilizers': fertilizer_cost_per_hectare * farm_size,
            'pesticides': pesticide_cost_per_hectare * farm_size
        }
        
        # Calculate totals
        total_fixed = sum(fixed_costs.values())
        total_variable = sum(variable_costs.values())
        total_input = sum(input_costs.values())
        total_costs = total_fixed + total_variable + total_input
        
        return {
            'fixed_costs': fixed_costs,
            'variable_costs': variable_costs,
            'input_costs': input_costs,
            'total_fixed_costs': float(total_fixed),
            'total_variable_costs': float(total_variable),
            'total_input_costs': float(total_input),
            'total_costs': float(total_costs),
            'cost_per_hectare': float(total_costs / farm_size) if farm_size > 0 else 0
        }
    
    def _perform_financial_analysis(self, price: float, yield_per_hectare: float, 
                                  costs: Dict[str, Any], farm_size: float, 
                                  planning_horizon: int) -> Dict[str, Any]:
        """Perform comprehensive financial analysis"""
        total_yield = yield_per_hectare * farm_size
        gross_revenue = total_yield * price
        total_costs = costs['total_costs']
        net_profit = gross_revenue - total_costs
        
        # Calculate financial metrics
        roi = (net_profit / total_costs) * 100 if total_costs > 0 else 0
        profit_margin = (net_profit / gross_revenue) * 100 if gross_revenue > 0 else 0
        profit_per_hectare = net_profit / farm_size if farm_size > 0 else 0
        
        # Break-even analysis
        breakeven_price = total_costs / total_yield if total_yield > 0 else 0
        breakeven_yield = total_costs / price if price > 0 else 0
        
        # Payback period (for perennial crops)
        payback_months = 12  # Annual crops
        if net_profit > 0 and planning_horizon > 1:
            payback_months = (total_costs / (net_profit / 12))
        
        # Cash flow projection
        cash_flow = self._calculate_cash_flow(gross_revenue, total_costs, planning_horizon)
        
        return {
            'gross_revenue': float(gross_revenue),
            'total_costs': float(total_costs),
            'net_profit': float(net_profit),
            'roi_percent': float(roi),
            'profit_margin_percent': float(profit_margin),
            'profit_per_hectare': float(profit_per_hectare),
            'breakeven_analysis': {
                'breakeven_price_per_kg': float(breakeven_price),
                'breakeven_yield_per_hectare': float(breakeven_yield)
            },
            'payback_period_months': float(payback_months),
            'cash_flow_projection': cash_flow,
            'profitability_level': self._get_profitability_level(roi)
        }
    
    def _perform_risk_analysis(self, crop_name: str, crop_data: Dict[str, Any], 
                             financial_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Perform comprehensive risk analysis"""
        market_info = self.market_data[crop_name]
        
        # Price risk
        price_volatility = market_info['price_volatility']
        price_risk_score = min(1.0, price_volatility * 2)
        
        # Yield risk
        climate_suitability = crop_data.get('climate_suitability_score', 0.8)
        yield_risk_score = 1.0 - climate_suitability
        
        # Market risk
        market_distance = crop_data.get('market_distance_km', 50)
        market_risk_score = min(1.0, market_distance / 200.0)
        
        # Financial risk
        roi = financial_analysis['roi_percent']
        financial_risk_score = max(0.0, 1.0 - roi / 50.0)  # Higher ROI = lower financial risk
        
        # Weather risk
        weather_resilience = crop_data.get('weather_resilience_score', 0.7)
        weather_risk_score = 1.0 - weather_resilience
        
        # Overall risk score
        risk_scores = [price_risk_score, yield_risk_score, market_risk_score, 
                      financial_risk_score, weather_risk_score]
        overall_risk_score = np.mean(risk_scores)
        
        return {
            'price_risk': {
                'score': float(price_risk_score),
                'level': self._get_risk_level(price_risk_score),
                'description': 'مخاطر تقلبات الأسعار'
            },
            'yield_risk': {
                'score': float(yield_risk_score),
                'level': self._get_risk_level(yield_risk_score),
                'description': 'مخاطر انخفاض الإنتاجية'
            },
            'market_risk': {
                'score': float(market_risk_score),
                'level': self._get_risk_level(market_risk_score),
                'description': 'مخاطر الوصول للس��ق'
            },
            'financial_risk': {
                'score': float(financial_risk_score),
                'level': self._get_risk_level(financial_risk_score),
                'description': 'مخاطر الربحية المالية'
            },
            'weather_risk': {
                'score': float(weather_risk_score),
                'level': self._get_risk_level(weather_risk_score),
                'description': 'مخاطر الطقس والمناخ'
            },
            'overall_risk_score': float(overall_risk_score),
            'overall_risk_level': self._get_risk_level(overall_risk_score),
            'risk_mitigation_strategies': self._generate_risk_mitigation_strategies(crop_name, risk_scores)
        }
    
    def _analyze_market_conditions(self, crop_name: str, crop_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze market conditions and opportunities"""
        market_info = self.market_data[crop_name]
        
        # Market potential score
        demand_factors = {
            'stable': 0.7,
            'increasing': 0.9,
            'decreasing': 0.4
        }
        demand_score = demand_factors.get(market_info['demand_trend'], 0.7)
        
        export_factors = {
            'very_high': 1.0,
            'high': 0.8,
            'medium': 0.6,
            'low': 0.3
        }
        export_score = export_factors.get(market_info['export_potential'], 0.6)
        
        market_potential_score = (demand_score + export_score) / 2
        
        # Seasonal analysis
        seasonal_analysis = self._calculate_seasonal_variation(crop_name)
        
        # Competition analysis
        competition_level = crop_data.get('local_competition_level', 'medium')
        competition_scores = {'low': 0.9, 'medium': 0.7, 'high': 0.4}
        competition_score = competition_scores.get(competition_level, 0.7)
        
        return {
            'market_potential_score': float(market_potential_score),
            'demand_trend': market_info['demand_trend'],
            'export_potential': market_info['export_potential'],
            'seasonal_analysis': seasonal_analysis,
            'competition_analysis': {
                'level': competition_level,
                'score': float(competition_score),
                'market_share_potential': self._estimate_market_share_potential(crop_data)
            },
            'market_opportunities': self._identify_market_opportunities(crop_name, crop_data)
        }
    
    def _perform_sensitivity_analysis(self, crop_name: str, base_price: float, 
                                    base_yield: float, costs: Dict[str, Any], 
                                    farm_size: float) -> Dict[str, Any]:
        """Perform sensitivity analysis on key variables"""
        base_profit = (base_price * base_yield * farm_size) - costs['total_costs']
        
        # Price sensitivity
        price_scenarios = {
            'pessimistic': base_price * 0.8,
            'realistic': base_price,
            'optimistic': base_price * 1.2
        }
        
        # Yield sensitivity
        yield_scenarios = {
            'pessimistic': base_yield * 0.7,
            'realistic': base_yield,
            'optimistic': base_yield * 1.3
        }
        
        # Cost sensitivity
        cost_scenarios = {
            'pessimistic': costs['total_costs'] * 1.2,
            'realistic': costs['total_costs'],
            'optimistic': costs['total_costs'] * 0.9
        }
        
        sensitivity_results = {}
        
        # Calculate profit for each scenario combination
        for price_scenario, price_val in price_scenarios.items():
            for yield_scenario, yield_val in yield_scenarios.items():
                for cost_scenario, cost_val in cost_scenarios.items():
                    scenario_name = f"{price_scenario}_{yield_scenario}_{cost_scenario}"
                    scenario_profit = (price_val * yield_val * farm_size) - cost_val
                    scenario_roi = (scenario_profit / cost_val) * 100 if cost_val > 0 else 0
                    
                    sensitivity_results[scenario_name] = {
                        'profit': float(scenario_profit),
                        'roi_percent': float(scenario_roi),
                        'profit_change_percent': ((scenario_profit - base_profit) / abs(base_profit)) * 100 if base_profit != 0 else 0
                    }
        
        return {
            'base_scenario': {
                'profit': float(base_profit),
                'price': float(base_price),
                'yield': float(base_yield),
                'costs': float(costs['total_costs'])
            },
            'scenarios': sensitivity_results,
            'worst_case': min(sensitivity_results.values(), key=lambda x: x['profit']),
            'best_case': max(sensitivity_results.values(), key=lambda x: x['profit']),
            'risk_tolerance_analysis': self._analyze_risk_tolerance(sensitivity_results)
        }
    
    # Helper methods
    def _calculate_price_range(self, base_price: float, volatility: float) -> Dict[str, float]:
        """Calculate price range based on volatility"""
        return {
            'min_price': float(base_price * (1 - volatility)),
            'max_price': float(base_price * (1 + volatility)),
            'volatility_percent': float(volatility * 100)
        }
    
    def _calculate_seasonal_variation(self, crop_name: str) -> Dict[str, Any]:
        """Calculate seasonal price variation"""
        market_info = self.market_data[crop_name]
        seasonal_factors = market_info['seasonal_factors']
        
        return {
            'harvest_months': seasonal_factors['harvest_months'],
            'price_dip_factor': seasonal_factors['price_dip_factor'],
            'storage_premium': seasonal_factors['storage_premium'],
            'best_selling_months': self._get_best_selling_months(seasonal_factors['harvest_months'])
        }
    
    def _calculate_yield_confidence(self, predicted_yield: float) -> Dict[str, float]:
        """Calculate confidence interval for yield prediction"""
        confidence_range = predicted_yield * 0.15  # ±15% confidence range
        return {
            'lower_bound': float(predicted_yield - confidence_range),
            'upper_bound': float(predicted_yield + confidence_range),
            'confidence_level_percent': 80.0
        }
    
    def _calculate_cash_flow(self, revenue: float, costs: float, horizon: int) -> List[Dict[str, float]]:
        """Calculate cash flow projection"""
        cash_flow = []
        for year in range(1, horizon + 1):
            annual_revenue = revenue * (1.02 ** (year - 1))  # 2% annual growth
            annual_costs = costs * (1.03 ** (year - 1))  # 3% annual cost increase
            net_flow = annual_revenue - annual_costs
            
            cash_flow.append({
                'year': year,
                'revenue': float(annual_revenue),
                'costs': float(annual_costs),
                'net_cash_flow': float(net_flow),
                'cumulative_cash_flow': float(sum([cf['net_cash_flow'] for cf in cash_flow]))
            })
        
        return cash_flow
    
    def _get_profitability_level(self, roi: float) -> str:
        """Get profitability level description"""
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
    
    def _get_risk_level(self, risk_score: float) -> str:
        """Get risk level description"""
        if risk_score <= 0.3:
            return 'منخفض'
        elif risk_score <= 0.6:
            return 'متوسط'
        else:
            return 'عالي'
    
    def _generate_risk_mitigation_strategies(self, crop_name: str, risk_scores: List[float]) -> List[str]:
        """Generate risk mitigation strategies"""
        strategies = []
        
        if risk_scores[0] > 0.6:  # Price risk
            strategies.append('استخدام عقود مستقبلية لتثبيت الأسعار')
            strategies.append('تنويع قنوات التسويق')
        
        if risk_scores[1] > 0.6:  # Yield risk
            strategies.append('تحسين ممارسات الري والتسميد')
            strategies.append('استخدام أصناف مقاومة للأمراض')
        
        if risk_scores[2] > 0.6:  # Market risk
            strategies.append('تطوير شبكة توزيع محلية')
            strategies.append('الاستثمار في وسائل النقل والتخزين')
        
        if risk_scores[4] > 0.6:  # Weather risk
            strategies.append('تطبيق تقنيات الزراعة المحمية')
            strategies.append('التأمين الزراعي ضد الكوارث الطبيعية')
        
        return strategies
    
    def _identify_market_opportunities(self, crop_name: str, crop_data: Dict[str, Any]) -> List[str]:
        """Identify market opportunities"""
        opportunities = []
        market_info = self.market_data[crop_name]
        
        if market_info['export_potential'] in ['high', 'very_high']:
            opportunities.append('فرص تصدي�� ممتازة للأسواق الخارجية')
        
        if market_info['demand_trend'] == 'increasing':
            opportunities.append('نمو متزايد في الطلب المحلي')
        
        quality_score = crop_data.get('product_quality_score', 0.8)
        if quality_score > 0.8:
            opportunities.append('إمكانية الحصول على أسعار مميزة للجودة العالية')
        
        return opportunities
    
    def _estimate_market_share_potential(self, crop_data: Dict[str, Any]) -> float:
        """Estimate potential market share"""
        base_share = 0.05  # 5% base market share
        
        # Adjust based on farm size
        farm_size = crop_data.get('farm_size', 2.0)
        size_factor = min(1.5, farm_size / 10.0)
        
        # Adjust based on quality
        quality_score = crop_data.get('product_quality_score', 0.8)
        
        potential_share = base_share * size_factor * quality_score
        return min(0.2, potential_share)  # Cap at 20%
    
    def _get_best_selling_months(self, harvest_months: List[int]) -> List[int]:
        """Get best months to sell (avoid harvest months)"""
        all_months = list(range(1, 13))
        return [m for m in all_months if m not in harvest_months][:3]
    
    def _rank_crops(self, crop_analyses: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
        """Rank crops by different criteria"""
        # Rank by ROI
        by_roi = sorted(crop_analyses, key=lambda x: x['roi_percent'], reverse=True)
        
        # Rank by net profit
        by_profit = sorted(crop_analyses, key=lambda x: x['net_profit'], reverse=True)
        
        # Rank by risk (ascending - lower risk is better)
        by_risk = sorted(crop_analyses, key=lambda x: x['risk_score'])
        
        # Rank by market potential
        by_market = sorted(crop_analyses, key=lambda x: x['market_potential'], reverse=True)
        
        # Weighted score ranking
        for crop in crop_analyses:
            weighted_score = (
                crop['roi_percent'] * 0.3 +
                crop['market_potential'] * 100 * 0.3 +
                (1 - crop['risk_score']) * 100 * 0.2 +
                min(crop['net_profit'] / 10000, 1) * 100 * 0.2
            )
            crop['weighted_score'] = weighted_score
        
        by_weighted = sorted(crop_analyses, key=lambda x: x['weighted_score'], reverse=True)
        
        return {
            'by_roi': by_roi,
            'by_net_profit': by_profit,
            'by_risk': by_risk,
            'by_market_potential': by_market,
            'by_weighted_score': by_weighted
        }
    
    def _generate_portfolio_recommendations(self, crop_analyses: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate portfolio diversification recommendations"""
        if len(crop_analyses) < 2:
            return {'message': 'يحتاج محصولين على الأقل للمقارنة'}
        
        # Risk-return analysis
        high_return_crops = [c for c in crop_analyses if c['roi_percent'] > 25]
        low_risk_crops = [c for c in crop_analyses if c['risk_score'] < 0.4]
        
        recommendations = {
            'diversification_strategy': self._suggest_diversification_strategy(crop_analyses),
            'risk_balanced_portfolio': self._create_risk_balanced_portfolio(crop_analyses),
            'seasonal_diversification': self._suggest_seasonal_diversification(crop_analyses),
            'investment_allocation': self._suggest_investment_allocation(crop_analyses)
        }
        
        return recommendations
    
    def _suggest_diversification_strategy(self, crops: List[Dict[str, Any]]) -> str:
        """Suggest diversification strategy"""
        risk_levels = [c['risk_score'] for c in crops]
        avg_risk = np.mean(risk_levels)
        
        if avg_risk > 0.7:
            return 'استراتيجية محافظة - التركيز على المحاصيل منخفضة المخاطر'
        elif avg_risk < 0.4:
            return 'استراتيجية متوازنة - إضافة بعض المحاصيل عالية العائد'
        else:
            return 'استراتيجية متوازنة - توزيع مناسب للمخاطر والعوائد'
    
    def _create_risk_balanced_portfolio(self, crops: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Create a risk-balanced portfolio"""
        # Sort by risk-adjusted return
        for crop in crops:
            crop['risk_adjusted_return'] = crop['roi_percent'] / (1 + crop['risk_score'])
        
        sorted_crops = sorted(crops, key=lambda x: x['risk_adjusted_return'], reverse=True)
        
        portfolio = []
        total_allocation = 100
        remaining_allocation = total_allocation
        
        for i, crop in enumerate(sorted_crops[:4]):  # Top 4 crops
            if i == 0:
                allocation = 40  # 40% to best crop
            elif i == 1:
                allocation = 30  # 30% to second best
            elif i == 2:
                allocation = 20  # 20% to third best
            else:
                allocation = remaining_allocation  # Remaining to fourth best
            
            portfolio.append({
                'crop_name_ar': crop['crop_name'],
                'allocation_percent': allocation,
                'expected_roi': crop['roi_percent'],
                'risk_level': crop['risk_score']
            })
            
            remaining_allocation -= allocation
            if remaining_allocation <= 0:
                break
        
        return portfolio
    
    def _suggest_seasonal_diversification(self, crops: List[Dict[str, Any]]) -> List[str]:
        """Suggest seasonal diversification"""
        suggestions = [
            'زراعة محاصيل مختلفة المواسم لضمان دخل مستمر',
            'التخطيط للمحاصيل قصيرة وطويلة المدى',
            'استغلال فترات الراحة بالمحاصيل السريعة النمو'
        ]
        return suggestions
    
    def _suggest_investment_allocation(self, crops: List[Dict[str, Any]]) -> Dict[str, str]:
        """Suggest investment allocation strategy"""
        avg_roi = np.mean([c['roi_percent'] for c in crops])
        
        if avg_roi > 30:
            return {
                'strategy': 'استثمار متقدم',
                'recommendation': 'توزيع الاستثمار على المحاصي�� عالية العائد مع إدارة المخاطر'
            }
        else:
            return {
                'strategy': 'استثمار تدريجي',
                'recommendation': 'البدء بالمحاصيل منخفضة المخاطر وزيادة الاستثمار تدريجياً'
            }
    
    def _analyze_risk_tolerance(self, scenarios: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze risk tolerance based on scenario analysis"""
        profits = [scenario['profit'] for scenario in scenarios.values()]
        worst_case_profit = min(profits)
        best_case_profit = max(profits)
        
        profit_range = best_case_profit - worst_case_profit
        volatility = profit_range / abs(np.mean(profits)) if np.mean(profits) != 0 else 0
        
        if volatility > 1.0:
            risk_tolerance = 'يتطلب تحمل مخاطر عالية'
        elif volatility > 0.5:
            risk_tolerance = 'يتطلب تحمل مخاطر متوسطة'
        else:
            risk_tolerance = 'مناسب للمستثمرين المحافظين'
        
        return {
            'profit_volatility': float(volatility),
            'risk_tolerance_requirement': risk_tolerance,
            'worst_case_scenario': float(worst_case_profit),
            'best_case_scenario': float(best_case_profit)
        }

# Factory function
def create_profit_estimator() -> ProfitEstimatorAI:
    """Create and return a ProfitEstimatorAI instance"""
    return ProfitEstimatorAI()
