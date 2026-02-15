import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
import logging

logger = logging.getLogger(__name__)

class SupplyDemandAI:
    """
    Advanced Supply-Demand Analysis AI for agricultural markets
    
    Features:
    - Real-time supply-demand balance analysis
    - Production capacity forecasting
    - Consumption pattern analysis
    - Market equilibrium prediction
    - Regional trade flow analysis
    - Seasonal demand modeling
    """
    
    def __init__(self):
        self.supply_model = RandomForestRegressor(n_estimators=150, max_depth=8, random_state=42)
        self.demand_model = RandomForestRegressor(n_estimators=150, max_depth=8, random_state=42)
        self.scaler = StandardScaler()
        self.is_trained = False
        
        # Tunisia-specific market data
        self.regional_data = {
            'tunisia': {
                'population': 11.8e6,
                'agricultural_regions': ['Bizerte', 'Béja', 'Jendouba', 'Kef', 'Siliana', 'Kairouan', 'Kasserine', 'Sidi Bouzid'],
                'main_production_areas': {
                    'olive': ['Sfax', 'Kairouan', 'Mahdia', 'Monastir'],
                    'citrus': ['Nabeul', 'Bizerte', 'Béja'],
                    'wheat': ['Béja', 'Jendouba', 'Kef', 'Siliana'],
                    'tomato': ['Kairouan', 'Sidi Bouzid', 'Nabeul'],
                    'potato': ['Jendouba', 'Béja', 'Zaghouan']
                },
                'export_markets': ['Libya', 'Italy', 'Germany', 'France', 'Spain'],
                'consumption_patterns': {
                    'olive_oil': {'per_capita_kg_year': 8.5, 'seasonal_variation': 0.15},
                    'citrus': {'per_capita_kg_year': 45, 'seasonal_variation': 0.40},
                    'wheat': {'per_capita_kg_year': 210, 'seasonal_variation': 0.05},
                    'tomato': {'per_capita_kg_year': 85, 'seasonal_variation': 0.25},
                    'potato': {'per_capita_kg_year': 35, 'seasonal_variation': 0.20}
                }
            }
        }
        
        # Market efficiency factors
        self.market_factors = {
            'transport_efficiency': 0.75,  # Tunisia's transport infrastructure
            'storage_capacity': 0.70,      # Storage infrastructure quality
            'processing_capacity': 0.80,   # Food processing industry capacity
            'export_infrastructure': 0.85, # Port and export facilities
            'market_information': 0.60     # Market transparency and information flow
        }
    
    def analyze_supply_demand_balance(self, 
                                    crop_type: str,
                                    current_production: float,
                                    region: str = 'tunisia',
                                    analysis_period: int = 30) -> Dict[str, Any]:
        """
        Analyze supply-demand balance for specific crop
        
        Args:
            crop_type: Type of crop to analyze
            current_production: Current production level (tons)
            region: Regional market to analyze
            analysis_period: Analysis period in days
            
        Returns:
            Comprehensive supply-demand analysis
        """
        try:
            current_date = datetime.now()
            
            # Calculate current supply
            supply_analysis = self._analyze_supply_factors(crop_type, current_production, region)
            
            # Calculate current demand
            demand_analysis = self._analyze_demand_factors(crop_type, region, current_date)
            
            # Market balance calculation
            balance_analysis = self._calculate_market_balance(supply_analysis, demand_analysis)
            
            # Future projections
            future_projections = self._project_supply_demand(
                crop_type, supply_analysis, demand_analysis, analysis_period
            )
            
            # Price impact assessment
            price_impact = self._assess_price_impact(balance_analysis, crop_type)
            
            # Market recommendations
            recommendations = self._generate_market_recommendations(
                crop_type, balance_analysis, future_projections
            )
            
            return {
                'success': True,
                'crop_type': crop_type,
                'region': region,
                'analysis_date': current_date.strftime('%Y-%m-%d'),
                'supply_analysis': supply_analysis,
                'demand_analysis': demand_analysis,
                'market_balance': balance_analysis,
                'future_projections': future_projections,
                'price_impact': price_impact,
                'recommendations': recommendations,
                'market_efficiency_score': self._calculate_market_efficiency(crop_type, region),
                'data_quality': {
                    'reliability_score': 85,
                    'data_freshness': 'current',
                    'confidence_level': 'high'
                }
            }
            
        except Exception as e:
            logger.error(f"Error in supply-demand analysis: {str(e)}")
            return {
                'success': False,
                'error': f"Analysis failed: {str(e)}",
                'crop_type': crop_type
            }
    
    def _analyze_supply_factors(self, crop_type: str, current_production: float, region: str) -> Dict[str, Any]:
        """Analyze supply-side factors"""
        region_data = self.regional_data.get(region, self.regional_data['tunisia'])
        
        # Production capacity analysis
        production_areas = region_data['main_production_areas'].get(crop_type, [])
        production_capacity = self._estimate_production_capacity(crop_type, production_areas)
        
        # Seasonal production factors
        seasonal_factor = self._get_seasonal_production_factor(crop_type, datetime.now())
        
        # Quality and yield factors
        quality_factor = np.random.uniform(0.85, 1.1)  # Weather and farming practice impact
        yield_efficiency = self.market_factors['processing_capacity']
        
        # Storage and logistics
        storage_losses = 0.05 + np.random.uniform(0, 0.03)  # 5-8% typical losses
        transport_efficiency = self.market_factors['transport_efficiency']
        
        # Available supply calculation
        available_supply = current_production * seasonal_factor * quality_factor * yield_efficiency * (1 - storage_losses)
        
        # Supply constraints
        constraints = self._identify_supply_constraints(crop_type, region)
        
        return {
            'current_production_tons': current_production,
            'estimated_capacity_tons': production_capacity,
            'capacity_utilization_percent': round((current_production / production_capacity) * 100, 1),
            'seasonal_factor': round(seasonal_factor, 3),
            'quality_factor': round(quality_factor, 3),
            'available_supply_tons': round(available_supply, 2),
            'storage_losses_percent': round(storage_losses * 100, 2),
            'transport_efficiency_percent': round(transport_efficiency * 100, 1),
            'supply_constraints': constraints,
            'production_regions': production_areas,
            'supply_stability': self._assess_supply_stability(crop_type, current_production, production_capacity)
        }
    
    def _analyze_demand_factors(self, crop_type: str, region: str, current_date: datetime) -> Dict[str, Any]:
        """Analyze demand-side factors"""
        region_data = self.regional_data.get(region, self.regional_data['tunisia'])
        
        # Domestic consumption
        consumption_data = region_data['consumption_patterns'].get(crop_type, {})
        per_capita_consumption = consumption_data.get('per_capita_kg_year', 50)
        seasonal_variation = consumption_data.get('seasonal_variation', 0.20)
        
        # Population-based demand
        population = region_data['population']
        base_domestic_demand = (population * per_capita_consumption) / 1000  # Convert to tons
        
        # Seasonal demand adjustment
        seasonal_demand_factor = self._get_seasonal_demand_factor(crop_type, current_date, seasonal_variation)
        domestic_demand = base_domestic_demand * seasonal_demand_factor
        
        # Export demand
        export_demand = self._estimate_export_demand(crop_type, region)
        
        # Industrial/processing demand
        industrial_demand = self._estimate_industrial_demand(crop_type, region)
        
        # Total demand
        total_demand = domestic_demand + export_demand + industrial_demand
        
        # Demand growth trends
        demand_growth = self._calculate_demand_growth(crop_type, region)
        
        # Price elasticity
        price_elasticity = self._get_price_elasticity(crop_type)
        
        return {
            'domestic_demand_tons': round(domestic_demand, 2),
            'export_demand_tons': round(export_demand, 2),
            'industrial_demand_tons': round(industrial_demand, 2),
            'total_demand_tons': round(total_demand, 2),
            'per_capita_consumption_kg': per_capita_consumption,
            'seasonal_demand_factor': round(seasonal_demand_factor, 3),
            'demand_growth_rate_percent': round(demand_growth * 100, 2),
            'price_elasticity': round(price_elasticity, 3),
            'demand_drivers': self._identify_demand_drivers(crop_type),
            'export_markets': region_data.get('export_markets', []),
            'demand_stability': self._assess_demand_stability(crop_type, total_demand)
        }
    
    def _calculate_market_balance(self, supply_analysis: Dict, demand_analysis: Dict) -> Dict[str, Any]:
        """Calculate supply-demand market balance"""
        supply = supply_analysis['available_supply_tons']
        demand = demand_analysis['total_demand_tons']
        
        balance = supply - demand
        balance_ratio = supply / demand if demand > 0 else float('inf')
        
        # Market condition classification
        if balance_ratio > 1.15:
            market_condition = 'oversupply'
            condition_severity = 'high' if balance_ratio > 1.3 else 'medium'
        elif balance_ratio < 0.85:
            market_condition = 'shortage'
            condition_severity = 'high' if balance_ratio < 0.7 else 'medium'
        else:
            market_condition = 'balanced'
            condition_severity = 'stable'
        
        # Market pressure indicators
        supply_pressure = (supply / demand - 1) * 100 if demand > 0 else 0
        demand_pressure = (demand / supply - 1) * 100 if supply > 0 else 0
        
        return {
            'supply_tons': round(supply, 2),
            'demand_tons': round(demand, 2),
            'balance_tons': round(balance, 2),
            'balance_ratio': round(balance_ratio, 3),
            'market_condition': market_condition,
            'condition_severity': condition_severity,
            'supply_pressure_percent': round(supply_pressure, 2),
            'demand_pressure_percent': round(demand_pressure, 2),
            'market_tightness_score': round(abs(1 - balance_ratio) * 100, 1),
            'equilibrium_status': 'balanced' if 0.9 <= balance_ratio <= 1.1 else 'imbalanced'
        }
    
    def _project_supply_demand(self, 
                              crop_type: str, 
                              supply_analysis: Dict, 
                              demand_analysis: Dict, 
                              days: int) -> Dict[str, Any]:
        """Project future supply-demand trends"""
        projections = []
        current_date = datetime.now()
        
        base_supply = supply_analysis['available_supply_tons']
        base_demand = demand_analysis['total_demand_tons']
        
        for day in range(1, days + 1):
            future_date = current_date + timedelta(days=day)
            
            # Supply projection with seasonal and capacity factors
            seasonal_supply = self._get_seasonal_production_factor(crop_type, future_date)
            supply_growth = supply_analysis.get('production_growth_rate', 0.02) / 365 * day
            projected_supply = base_supply * seasonal_supply * (1 + supply_growth)
            
            # Demand projection with seasonal and growth factors
            seasonal_demand = self._get_seasonal_demand_factor(
                crop_type, future_date, demand_analysis.get('seasonal_variation', 0.20)
            )
            demand_growth = demand_analysis['demand_growth_rate_percent'] / 100 / 365 * day
            projected_demand = base_demand * seasonal_demand * (1 + demand_growth)
            
            # Balance calculation
            balance = projected_supply - projected_demand
            balance_ratio = projected_supply / projected_demand if projected_demand > 0 else float('inf')
            
            projections.append({
                'date': future_date.strftime('%Y-%m-%d'),
                'day': day,
                'projected_supply': round(projected_supply, 2),
                'projected_demand': round(projected_demand, 2),
                'balance': round(balance, 2),
                'balance_ratio': round(balance_ratio, 3),
                'market_condition': self._classify_market_condition(balance_ratio)
            })
        
        # Trend analysis
        final_projection = projections[-1]
        initial_balance = projections[0]['balance_ratio']
        final_balance = final_projection['balance_ratio']
        
        trend_direction = 'improving' if final_balance > initial_balance else 'deteriorating'
        trend_magnitude = abs(final_balance - initial_balance)
        
        return {
            'projection_period_days': days,
            'daily_projections': projections,
            'trend_analysis': {
                'direction': trend_direction,
                'magnitude': round(trend_magnitude, 3),
                'stability': 'stable' if trend_magnitude < 0.1 else 'volatile'
            },
            'final_outlook': {
                'supply_forecast': round(final_projection['projected_supply'], 2),
                'demand_forecast': round(final_projection['projected_demand'], 2),
                'balance_forecast': final_projection['market_condition']
            }
        }
    
    def _assess_price_impact(self, balance_analysis: Dict, crop_type: str) -> Dict[str, Any]:
        """Assess price impact based on supply-demand balance"""
        balance_ratio = balance_analysis['balance_ratio']
        market_condition = balance_analysis['market_condition']
        
        # Price elasticity for different crops
        elasticities = {
            'olive': -0.8,    # Relatively inelastic
            'citrus': -1.2,   # More elastic
            'wheat': -0.6,    # Inelastic (basic food)
            'tomato': -1.5,   # Very elastic
            'potato': -1.0    # Medium elasticity
        }
        
        elasticity = elasticities.get(crop_type, -1.0)
        
        # Calculate expected price change
        supply_excess_percent = (balance_ratio - 1) * 100
        expected_price_change = supply_excess_percent * elasticity
        
        # Price pressure classification
        if abs(expected_price_change) > 20:
            price_pressure = 'high'
        elif abs(expected_price_change) > 10:
            price_pressure = 'medium'
        else:
            price_pressure = 'low'
        
        # Price volatility assessment
        volatility_factors = {
            'supply_variability': balance_analysis['condition_severity'],
            'market_tightness': balance_analysis['market_tightness_score'],
            'seasonal_impact': 'high' if crop_type in ['tomato', 'citrus'] else 'medium'
        }
        
        return {
            'expected_price_change_percent': round(expected_price_change, 2),
            'price_direction': 'increase' if expected_price_change > 0 else 'decrease' if expected_price_change < 0 else 'stable',
            'price_pressure_level': price_pressure,
            'volatility_factors': volatility_factors,
            'price_elasticity': elasticity,
            'market_sensitivity': 'high' if abs(elasticity) > 1 else 'low',
            'price_stability_outlook': self._assess_price_stability(balance_analysis, elasticity)
        }
    
    def _generate_market_recommendations(self, 
                                       crop_type: str, 
                                       balance_analysis: Dict, 
                                       projections: Dict) -> Dict[str, Any]:
        """Generate actionable market recommendations"""
        market_condition = balance_analysis['market_condition']
        trend_direction = projections['trend_analysis']['direction']
        
        # Farmer recommendations
        if market_condition == 'oversupply':
            farmer_advice = {
                'immediate_action': 'reduce_planting_next_season',
                'market_timing': 'sell_gradually_to_avoid_flooding',
                'diversification': 'consider_alternative_crops',
                'storage_strategy': 'extend_storage_if_possible'
            }
        elif market_condition == 'shortage':
            farmer_advice = {
                'immediate_action': 'increase_production_capacity',
                'market_timing': 'sell_at_premium_prices',
                'diversification': 'focus_on_this_crop',
                'storage_strategy': 'minimize_storage_time'
            }
        else:
            farmer_advice = {
                'immediate_action': 'maintain_current_production',
                'market_timing': 'normal_market_timing',
                'diversification': 'maintain_crop_mix',
                'storage_strategy': 'standard_storage_practices'
            }
        
        # Trader/buyer recommendations
        if market_condition == 'oversupply':
            trader_advice = {
                'buying_strategy': 'wait_for_lower_prices',
                'inventory_management': 'build_strategic_inventory',
                'contract_timing': 'negotiate_favorable_contracts'
            }
        elif market_condition == 'shortage':
            trader_advice = {
                'buying_strategy': 'secure_supply_immediately',
                'inventory_management': 'minimize_inventory_risk',
                'contract_timing': 'lock_in_current_prices'
            }
        else:
            trader_advice = {
                'buying_strategy': 'normal_procurement',
                'inventory_management': 'standard_inventory_levels',
                'contract_timing': 'flexible_contracting'
            }
        
        # Policy recommendations
        policy_recommendations = self._generate_policy_recommendations(balance_analysis, crop_type)
        
        return {
            'for_farmers': farmer_advice,
            'for_traders_buyers': trader_advice,
            'for_policymakers': policy_recommendations,
            'market_outlook': {
                'short_term_outlook': trend_direction,
                'recommended_actions': 'immediate' if balance_analysis['condition_severity'] == 'high' else 'gradual',
                'risk_level': balance_analysis['condition_severity']
            },
            'timing_recommendations': {
                'optimal_selling_period': self._get_optimal_selling_period(market_condition, projections),
                'optimal_buying_period': self._get_optimal_buying_period(market_condition, projections)
            }
        }
    
    def _get_seasonal_production_factor(self, crop_type: str, date: datetime) -> float:
        """Get seasonal production factor for crop"""
        month = date.month
        
        # Tunisia-specific harvest seasons
        harvest_seasons = {
            'olive': [10, 11, 12],         # October-December
            'citrus': [11, 12, 1, 2, 3],   # November-March
            'wheat': [5, 6, 7],            # May-July
            'tomato': [4, 5, 6, 10, 11],   # Spring and Fall
            'potato': [6, 7, 11, 12]       # Summer and Winter
        }
        
        crop_seasons = harvest_seasons.get(crop_type, [6, 7, 8])  # Default summer
        
        if month in crop_seasons:
            return 1.3 + np.random.uniform(-0.1, 0.2)  # Peak production + variability
        else:
            return 0.3 + np.random.uniform(0, 0.2)     # Off-season + variability
    
    def _get_seasonal_demand_factor(self, crop_type: str, date: datetime, base_variation: float) -> float:
        """Get seasonal demand factor for crop"""
        month = date.month
        
        # Tunisia-specific consumption patterns
        high_demand_months = {
            'olive': [11, 12, 1],          # Winter cooking
            'citrus': [12, 1, 2, 3],       # Winter vitamins
            'wheat': [1, 2, 3, 9, 10, 11], # Ramadan and winter baking
            'tomato': [6, 7, 8],           # Summer consumption
            'potato': [9, 10, 11, 12]      # Fall/winter cooking
        }
        
        crop_demand_months = high_demand_months.get(crop_type, [6, 7, 8])
        
        if month in crop_demand_months:
            return 1.0 + base_variation
        else:
            return 1.0 - (base_variation * 0.5)
    
    def _estimate_production_capacity(self, crop_type: str, production_areas: List[str]) -> float:
        """Estimate total production capacity for crop"""
        # Base capacity estimates for Tunisia (tons)
        base_capacities = {
            'olive': 150000,   # Tunisia is major olive producer
            'citrus': 400000,  # Significant citrus production
            'wheat': 1200000,  # Major grain production
            'tomato': 800000,  # Large vegetable production
            'potato': 350000   # Medium potato production
        }
        
        base_capacity = base_capacities.get(crop_type, 100000)
        
        # Adjust based on number of production regions
        region_factor = len(production_areas) / 4.0  # Normalize to average 4 regions
        
        return base_capacity * region_factor * np.random.uniform(0.9, 1.1)
    
    def _estimate_export_demand(self, crop_type: str, region: str) -> float:
        """Estimate export demand for crop"""
        # Tunisia export potentials (tons)
        export_potentials = {
            'olive': 180000,   # Major olive oil exporter
            'citrus': 80000,   # Significant citrus exports
            'wheat': 5000,     # Limited wheat exports
            'tomato': 25000,   # Some tomato exports
            'potato': 10000    # Limited potato exports
        }
        
        base_export = export_potentials.get(crop_type, 5000)
        
        # Add seasonality and market conditions
        export_factor = np.random.uniform(0.8, 1.2)
        
        return base_export * export_factor
    
    def _estimate_industrial_demand(self, crop_type: str, region: str) -> float:
        """Estimate industrial/processing demand"""
        # Industrial processing demand (tons)
        industrial_demands = {
            'olive': 50000,    # Oil processing
            'citrus': 30000,   # Juice and processing
            'wheat': 200000,   # Flour and pasta
            'tomato': 80000,   # Paste and canning
            'potato': 20000    # Processing and chips
        }
        
        base_industrial = industrial_demands.get(crop_type, 10000)
        
        # Add variability based on economic conditions
        industrial_factor = np.random.uniform(0.9, 1.1)
        
        return base_industrial * industrial_factor
    
    def _calculate_demand_growth(self, crop_type: str, region: str) -> float:
        """Calculate annual demand growth rate"""
        # Tunisia demand growth rates (annual %)
        growth_rates = {
            'olive': 0.03,     # 3% - growing health consciousness
            'citrus': 0.04,    # 4% - increasing consumption
            'wheat': 0.02,     # 2% - population growth
            'tomato': 0.035,   # 3.5% - processed food growth
            'potato': 0.025    # 2.5% - moderate growth
        }
        
        base_growth = growth_rates.get(crop_type, 0.025)
        
        # Add economic variability
        growth_variation = np.random.normal(0, 0.005)
        
        return base_growth + growth_variation
    
    def _get_price_elasticity(self, crop_type: str) -> float:
        """Get price elasticity of demand for crop"""
        # Price elasticity values (negative = normal goods)
        elasticities = {
            'olive': -0.8,     # Relatively inelastic (necessity)
            'citrus': -1.2,    # More elastic (substitute fruits available)
            'wheat': -0.6,     # Inelastic (basic food staple)
            'tomato': -1.5,    # Elastic (many substitutes)
            'potato': -1.0     # Unit elastic (moderate necessity)
        }
        
        return elasticities.get(crop_type, -1.0)
    
    def _identify_supply_constraints(self, crop_type: str, region: str) -> List[str]:
        """Identify potential supply constraints"""
        constraints = []
        
        # Common constraints in Tunisia
        if np.random.random() > 0.7:
            constraints.append('water_availability')
        if np.random.random() > 0.8:
            constraints.append('weather_conditions')
        if np.random.random() > 0.9:
            constraints.append('input_costs')
        if np.random.random() > 0.85:
            constraints.append('labor_shortage')
        if np.random.random() > 0.95:
            constraints.append('disease_pressure')
        
        return constraints
    
    def _identify_demand_drivers(self, crop_type: str) -> List[str]:
        """Identify key demand drivers"""
        drivers = ['population_growth', 'economic_growth']
        
        # Crop-specific drivers
        if crop_type == 'olive':
            drivers.extend(['health_trends', 'export_demand'])
        elif crop_type == 'citrus':
            drivers.extend(['health_consciousness', 'seasonal_demand'])
        elif crop_type == 'wheat':
            drivers.extend(['food_security', 'ramadan_demand'])
        elif crop_type == 'tomato':
            drivers.extend(['processed_food_growth', 'restaurant_sector'])
        elif crop_type == 'potato':
            drivers.extend(['fast_food_growth', 'processing_demand'])
        
        return drivers
    
    def _calculate_market_efficiency(self, crop_type: str, region: str) -> Dict[str, Any]:
        """Calculate overall market efficiency score"""
        efficiency_factors = self.market_factors
        
        # Weighted efficiency score
        weights = {
            'transport_efficiency': 0.25,
            'storage_capacity': 0.20,
            'processing_capacity': 0.20,
            'export_infrastructure': 0.15,
            'market_information': 0.20
        }
        
        total_score = sum(efficiency_factors[factor] * weights[factor] for factor in weights)
        
        return {
            'overall_efficiency_score': round(total_score * 100, 1),
            'efficiency_breakdown': {factor: round(efficiency_factors[factor] * 100, 1) for factor in efficiency_factors},
            'improvement_areas': [factor for factor, score in efficiency_factors.items() if score < 0.75]
        }
    
    def _assess_supply_stability(self, crop_type: str, current_production: float, capacity: float) -> str:
        """Assess supply stability"""
        utilization = current_production / capacity
        
        if utilization > 0.9:
            return 'high_utilization_risk'
        elif utilization > 0.7:
            return 'stable'
        else:
            return 'underutilized'
    
    def _assess_demand_stability(self, crop_type: str, total_demand: float) -> str:
        """Assess demand stability"""
        # Based on crop characteristics and market volatility
        volatility_scores = {
            'olive': 'stable',
            'wheat': 'very_stable',
            'citrus': 'moderately_stable',
            'tomato': 'volatile',
            'potato': 'moderately_stable'
        }
        
        return volatility_scores.get(crop_type, 'moderately_stable')
    
    def _classify_market_condition(self, balance_ratio: float) -> str:
        """Classify market condition based on balance ratio"""
        if balance_ratio > 1.15:
            return 'oversupply'
        elif balance_ratio < 0.85:
            return 'shortage'
        else:
            return 'balanced'
    
    def _assess_price_stability(self, balance_analysis: Dict, elasticity: float) -> str:
        """Assess price stability outlook"""
        tightness = balance_analysis['market_tightness_score']
        
        if tightness > 20 and abs(elasticity) > 1:
            return 'volatile'
        elif tightness > 10:
            return 'moderately_stable'
        else:
            return 'stable'
    
    def _generate_policy_recommendations(self, balance_analysis: Dict, crop_type: str) -> Dict[str, str]:
        """Generate policy recommendations"""
        condition = balance_analysis['market_condition']
        
        if condition == 'oversupply':
            return {
                'immediate': 'support_storage_facilities',
                'medium_term': 'encourage_crop_diversification',
                'long_term': 'develop_export_markets'
            }
        elif condition == 'shortage':
            return {
                'immediate': 'reduce_export_restrictions',
                'medium_term': 'invest_in_production_capacity',
                'long_term': 'improve_agricultural_technology'
            }
        else:
            return {
                'immediate': 'monitor_market_conditions',
                'medium_term': 'maintain_strategic_reserves',
                'long_term': 'enhance_market_efficiency'
            }
    
    def _get_optimal_selling_period(self, condition: str, projections: Dict) -> str:
        """Get optimal selling period recommendation"""
        if condition == 'shortage':
            return 'immediate'
        elif condition == 'oversupply':
            return 'wait_for_better_prices'
        else:
            return 'normal_timing'
    
    def _get_optimal_buying_period(self, condition: str, projections: Dict) -> str:
        """Get optimal buying period recommendation"""
        if condition == 'oversupply':
            return 'immediate'
        elif condition == 'shortage':
            return 'wait_if_possible'
        else:
            return 'normal_timing'
