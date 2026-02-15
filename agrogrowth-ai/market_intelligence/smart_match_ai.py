import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)

@dataclass
class MarketListing:
    """Represents a market listing for agricultural products"""
    id: str
    seller_id: str
    product_type: str
    product_name: str
    product_name_ar: str
    quantity_kg: float
    price_per_kg: float
    quality_grade: str
    location: str
    harvest_date: datetime
    available_until: datetime
    certification: List[str]
    packaging_type: str
    delivery_options: List[str]
    payment_terms: List[str]
    created_at: datetime
    updated_at: datetime
    status: str = 'active'  # active, sold, expired, withdrawn

@dataclass
class BuyerRequirement:
    """Represents buyer requirements and preferences"""
    id: str
    buyer_id: str
    product_type: str
    quantity_needed_kg: float
    max_price_per_kg: float
    preferred_quality: List[str]
    location_preference: str
    max_distance_km: float
    delivery_required: bool
    packaging_preference: List[str]
    certification_required: List[str]
    needed_by_date: datetime
    payment_method: List[str]
    created_at: datetime
    status: str = 'active'  # active, fulfilled, expired, cancelled

class SmartMatchAI:
    """
    Intelligent Market Matching System for Agricultural Products
    
    Features:
    - Smart buyer-seller matching
    - Multi-criteria optimization
    - Price negotiation support
    - Quality-based matching
    - Geographic optimization
    - Seasonal demand analysis
    - Trust score integration
    - Real-time market dynamics
    """
    
    def __init__(self):
        self.active_listings = []
        self.active_requirements = []
        self.match_history = []
        
        # Tunisia market data
        self.regional_data = {
            'governorates': [
                'Tunis', 'Ariana', 'Ben Arous', 'Manouba', 'Nabeul', 'Zaghouan',
                'Bizerte', 'Béja', 'Jendouba', 'Kef', 'Siliana', 'Kairouan',
                'Kasserine', 'Sidi Bouzid', 'Sfax', 'Mahdia', 'Monastir', 'Sousse',
                'Gafsa', 'Tozeur', 'Kebili', 'Gabes', 'Medenine', 'Tataouine'
            ],
            'major_markets': {
                'Tunis': {'type': 'consumer', 'population': 1200000, 'premium_market': True},
                'Sfax': {'type': 'export_hub', 'population': 330000, 'export_capacity': 'high'},
                'Sousse': {'type': 'tourist', 'population': 270000, 'seasonal_demand': True},
                'Kairouan': {'type': 'agricultural', 'population': 190000, 'processing_hub': True},
                'Bizerte': {'type': 'port', 'population': 140000, 'export_access': True}
            },
            'transportation_costs_per_km': {
                'truck_small': 0.8,  # TND per km
                'truck_medium': 1.2,
                'truck_large': 1.8,
                'refrigerated': 2.5
            }
        }
        
        # Matching weights for scoring algorithm
        self.matching_weights = {
            'price_compatibility': 0.25,
            'quality_match': 0.20,
            'quantity_match': 0.15,
            'location_proximity': 0.15,
            'delivery_compatibility': 0.10,
            'timing_compatibility': 0.10,
            'trust_score': 0.05
        }
        
        # Product quality standards
        self.quality_standards = {
            'olive': {
                'premium': {'oil_content': '>18%', 'moisture': '<30%', 'defects': '<2%'},
                'grade_a': {'oil_content': '>15%', 'moisture': '<35%', 'defects': '<5%'},
                'grade_b': {'oil_content': '>12%', 'moisture': '<40%', 'defects': '<10%'},
                'standard': {'oil_content': '>10%', 'moisture': '<45%', 'defects': '<15%'}
            },
            'citrus': {
                'premium': {'brix': '>12', 'size': 'large', 'color': 'excellent', 'defects': '<1%'},
                'grade_a': {'brix': '>10', 'size': 'medium-large', 'color': 'good', 'defects': '<3%'},
                'grade_b': {'brix': '>8', 'size': 'medium', 'color': 'acceptable', 'defects': '<7%'},
                'standard': {'brix': '>6', 'size': 'small-medium', 'color': 'fair', 'defects': '<15%'}
            },
            'wheat': {
                'premium': {'protein': '>14%', 'moisture': '<12%', 'test_weight': '>80kg/hl'},
                'grade_a': {'protein': '>12%', 'moisture': '<13%', 'test_weight': '>78kg/hl'},
                'grade_b': {'protein': '>10%', 'moisture': '<14%', 'test_weight': '>75kg/hl'},
                'standard': {'protein': '>8%', 'moisture': '<15%', 'test_weight': '>70kg/hl'}
            },
            'tomato': {
                'premium': {'firmness': 'excellent', 'color': 'uniform', 'size': 'large', 'defects': '<1%'},
                'grade_a': {'firmness': 'good', 'color': 'good', 'size': 'medium-large', 'defects': '<3%'},
                'grade_b': {'firmness': 'acceptable', 'color': 'acceptable', 'size': 'medium', 'defects': '<8%'},
                'standard': {'firmness': 'fair', 'color': 'fair', 'size': 'small-medium', 'defects': '<15%'}
            }
        }
    
    def find_matches(self, 
                    buyer_requirement: BuyerRequirement,
                    max_matches: int = 10,
                    include_partial: bool = True) -> Dict[str, Any]:
        """
        Find optimal matches for buyer requirements
        
        Args:
            buyer_requirement: Buyer's requirements and preferences
            max_matches: Maximum number of matches to return
            include_partial: Include partial quantity matches
            
        Returns:
            Ranked list of matches with compatibility scores
        """
        try:
            # Filter eligible listings
            eligible_listings = self._filter_eligible_listings(buyer_requirement)
            
            if not eligible_listings:
                return {
                    'success': True,
                    'buyer_id': buyer_requirement.buyer_id,
                    'total_matches': 0,
                    'matches': [],
                    'message': 'No eligible listings found for this requirement'
                }
            
            # Calculate match scores
            scored_matches = []
            for listing in eligible_listings:
                match_score = self._calculate_match_score(buyer_requirement, listing)
                
                if match_score['overall_score'] > 0.3:  # Minimum threshold
                    match_details = self._generate_match_details(buyer_requirement, listing, match_score)
                    scored_matches.append(match_details)
            
            # Sort by overall score
            scored_matches.sort(key=lambda x: x['compatibility_score'], reverse=True)
            
            # Limit results
            final_matches = scored_matches[:max_matches]
            
            # Generate market insights
            market_insights = self._generate_market_insights(buyer_requirement, eligible_listings)
            
            return {
                'success': True,
                'buyer_id': buyer_requirement.buyer_id,
                'requirement_id': buyer_requirement.id,
                'total_matches': len(final_matches),
                'matches': final_matches,
                'market_insights': market_insights,
                'matching_algorithm': 'SmartMatchAI v1.0',
                'generated_at': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error finding matches: {str(e)}")
            return {
                'success': False,
                'error': f"Match finding failed: {str(e)}",
                'buyer_id': buyer_requirement.buyer_id
            }
    
    def suggest_optimal_pricing(self, 
                              product_type: str,
                              quality_grade: str,
                              quantity_kg: float,
                              location: str) -> Dict[str, Any]:
        """
        Suggest optimal pricing based on market conditions
        
        Args:
            product_type: Type of agricultural product
            quality_grade: Quality grade of the product
            quantity_kg: Quantity in kilograms
            location: Product location
            
        Returns:
            Pricing recommendations with market analysis
        """
        try:
            # Get market data for the product
            market_data = self._get_market_data(product_type, location)
            
            # Calculate base price from recent transactions
            base_price = self._calculate_base_price(product_type, quality_grade, market_data)
            
            # Apply quality premium/discount
            quality_multiplier = self._get_quality_multiplier(product_type, quality_grade)
            quality_adjusted_price = base_price * quality_multiplier
            
            # Apply quantity discount/premium
            quantity_multiplier = self._get_quantity_multiplier(quantity_kg, product_type)
            quantity_adjusted_price = quality_adjusted_price * quantity_multiplier
            
            # Apply location factors
            location_multiplier = self._get_location_multiplier(location, product_type)
            final_base_price = quantity_adjusted_price * location_multiplier
            
            # Generate price range
            price_range = {
                'minimum': round(final_base_price * 0.85, 2),
                'optimal': round(final_base_price, 2),
                'maximum': round(final_base_price * 1.15, 2)
            }
            
            # Market positioning analysis
            competitive_analysis = self._analyze_competition(product_type, quality_grade, location)
            
            return {
                'success': True,
                'product_type': product_type,
                'quality_grade': quality_grade,
                'quantity_kg': quantity_kg,
                'location': location,
                'pricing_recommendation': price_range,
                'market_position': competitive_analysis,
                'factors_considered': {
                    'base_market_price': round(base_price, 2),
                    'quality_adjustment': f"{((quality_multiplier - 1) * 100):+.1f}%",
                    'quantity_adjustment': f"{((quantity_multiplier - 1) * 100):+.1f}%",
                    'location_adjustment': f"{((location_multiplier - 1) * 100):+.1f}%"
                },
                'confidence_level': 0.85,
                'generated_at': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error generating pricing suggestion: {str(e)}")
            return {
                'success': False,
                'error': f"Pricing suggestion failed: {str(e)}",
                'product_type': product_type
            }
    
    def analyze_market_opportunity(self, 
                                 product_type: str,
                                 location: str,
                                 analysis_period_days: int = 30) -> Dict[str, Any]:
        """
        Analyze market opportunities for a specific product and location
        
        Args:
            product_type: Type of agricultural product
            location: Geographic location
            analysis_period_days: Analysis period in days
            
        Returns:
            Market opportunity analysis with recommendations
        """
        try:
            # Analyze supply and demand
            supply_analysis = self._analyze_supply(product_type, location, analysis_period_days)
            demand_analysis = self._analyze_demand(product_type, location, analysis_period_days)
            
            # Calculate market gap
            market_gap = demand_analysis['total_demand'] - supply_analysis['total_supply']
            gap_percentage = (market_gap / demand_analysis['total_demand']) * 100 if demand_analysis['total_demand'] > 0 else 0
            
            # Opportunity scoring
            opportunity_score = self._calculate_opportunity_score(
                supply_analysis, demand_analysis, market_gap, gap_percentage
            )
            
            # Price trend analysis
            price_trends = self._analyze_price_trends(product_type, location, analysis_period_days)
            
            # Competition analysis
            competition = self._analyze_market_competition(product_type, location)
            
            # Generate recommendations
            recommendations = self._generate_market_recommendations(
                product_type, location, opportunity_score, market_gap, price_trends
            )
            
            return {
                'success': True,
                'product_type': product_type,
                'location': location,
                'analysis_period_days': analysis_period_days,
                'market_opportunity': {
                    'opportunity_score': round(opportunity_score, 1),
                    'opportunity_level': self._categorize_opportunity(opportunity_score),
                    'market_gap_kg': round(market_gap, 0),
                    'gap_percentage': round(gap_percentage, 1)
                },
                'supply_analysis': supply_analysis,
                'demand_analysis': demand_analysis,
                'price_trends': price_trends,
                'competition': competition,
                'recommendations': recommendations,
                'generated_at': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error analyzing market opportunity: {str(e)}")
            return {
                'success': False,
                'error': f"Market analysis failed: {str(e)}",
                'product_type': product_type
            }
    
    def _filter_eligible_listings(self, requirement: BuyerRequirement) -> List[MarketListing]:
        """Filter listings based on basic requirements"""
        eligible = []
        
        for listing in self.active_listings:
            # Product type match
            if listing.product_type != requirement.product_type:
                continue
            
            # Status check
            if listing.status != 'active':
                continue
            
            # Availability check
            if listing.available_until < datetime.now():
                continue
            
            # Basic price check (with some tolerance)
            if listing.price_per_kg > requirement.max_price_per_kg * 1.1:
                continue
            
            # Timing check
            if listing.available_until < requirement.needed_by_date:
                continue
            
            # Location check (if specified)
            if requirement.location_preference and requirement.max_distance_km > 0:
                distance = self._calculate_distance(listing.location, requirement.location_preference)
                if distance > requirement.max_distance_km:
                    continue
            
            eligible.append(listing)
        
        return eligible
    
    def _calculate_match_score(self, requirement: BuyerRequirement, listing: MarketListing) -> Dict[str, float]:
        """Calculate detailed match score between requirement and listing"""
        scores = {}
        
        # Price compatibility (0-1 scale)
        price_ratio = requirement.max_price_per_kg / listing.price_per_kg
        scores['price_compatibility'] = min(1.0, price_ratio) if price_ratio >= 0.8 else 0.0
        
        # Quality match
        scores['quality_match'] = self._calculate_quality_score(requirement.preferred_quality, listing.quality_grade)
        
        # Quantity match
        quantity_ratio = min(listing.quantity_kg, requirement.quantity_needed_kg) / requirement.quantity_needed_kg
        scores['quantity_match'] = quantity_ratio
        
        # Location proximity
        if requirement.location_preference:
            distance = self._calculate_distance(listing.location, requirement.location_preference)
            max_distance = requirement.max_distance_km or 500  # Default 500km
            scores['location_proximity'] = max(0, 1 - (distance / max_distance))
        else:
            scores['location_proximity'] = 0.5  # Neutral score
        
        # Delivery compatibility
        if requirement.delivery_required:
            delivery_score = 1.0 if any(option in listing.delivery_options for option in ['delivery', 'shipping']) else 0.3
        else:
            delivery_score = 1.0
        scores['delivery_compatibility'] = delivery_score
        
        # Timing compatibility
        time_buffer = (listing.available_until - requirement.needed_by_date).days
        if time_buffer >= 0:
            scores['timing_compatibility'] = min(1.0, time_buffer / 7)  # Prefer listings with time buffer
        else:
            scores['timing_compatibility'] = 0.0
        
        # Trust score (simulated - would be based on seller history)
        scores['trust_score'] = np.random.uniform(0.7, 1.0)  # Placeholder
        
        # Calculate overall score
        overall_score = sum(
            scores[factor] * weight 
            for factor, weight in self.matching_weights.items()
        )
        scores['overall_score'] = overall_score
        
        return scores
    
    def _calculate_quality_score(self, preferred_quality: List[str], listing_quality: str) -> float:
        """Calculate quality compatibility score"""
        if listing_quality in preferred_quality:
            return 1.0
        
        # Quality hierarchy
        quality_hierarchy = ['premium', 'grade_a', 'grade_b', 'standard']
        
        if listing_quality in quality_hierarchy:
            listing_index = quality_hierarchy.index(listing_quality)
            
            # Find best match in preferred qualities
            best_match_score = 0.0
            for pref_quality in preferred_quality:
                if pref_quality in quality_hierarchy:
                    pref_index = quality_hierarchy.index(pref_quality)
                    # Calculate score based on distance in hierarchy
                    distance = abs(listing_index - pref_index)
                    score = max(0, 1.0 - (distance * 0.25))
                    best_match_score = max(best_match_score, score)
            
            return best_match_score
        
        return 0.5  # Default neutral score
    
    def _calculate_distance(self, location1: str, location2: str) -> float:
        """Calculate distance between two locations (simplified)"""
        # Simplified distance calculation for Tunisia
        # In a real implementation, this would use actual geographic data
        
        if location1 == location2:
            return 0
        
        # Sample distances between major Tunisian cities (km)
        distance_matrix = {
            ('Tunis', 'Sfax'): 270,
            ('Tunis', 'Sousse'): 140,
            ('Tunis', 'Kairouan'): 160,
            ('Tunis', 'Bizerte'): 65,
            ('Sfax', 'Sousse'): 130,
            ('Sfax', 'Kairouan'): 120,
            ('Sousse', 'Kairouan'): 50,
            ('Bizerte', 'Béja'): 100,
            ('Béja', 'Jendouba'): 85
        }
        
        # Check both directions
        distance = distance_matrix.get((location1, location2)) or distance_matrix.get((location2, location1))
        
        # If not in matrix, estimate based on geographic regions
        if distance is None:
            # Simple heuristic based on regional proximity
            distance = np.random.uniform(50, 300)  # Placeholder
        
        return distance
    
    def _generate_match_details(self, 
                               requirement: BuyerRequirement, 
                               listing: MarketListing, 
                               scores: Dict[str, float]) -> Dict[str, Any]:
        """Generate detailed match information"""
        # Calculate transportation cost
        distance = self._calculate_distance(listing.location, requirement.location_preference or listing.location)
        transport_cost = self._calculate_transport_cost(listing.quantity_kg, distance)
        
        # Calculate total cost
        product_cost = listing.price_per_kg * min(listing.quantity_kg, requirement.quantity_needed_kg)
        total_cost = product_cost + transport_cost
        
        # Quantity fulfillment
        quantity_fulfilled = min(listing.quantity_kg, requirement.quantity_needed_kg)
        fulfillment_percentage = (quantity_fulfilled / requirement.quantity_needed_kg) * 100
        
        return {
            'listing_id': listing.id,
            'seller_id': listing.seller_id,
            'product_name': listing.product_name,
            'product_name_ar': listing.product_name_ar,
            'compatibility_score': round(scores['overall_score'], 3),
            'score_breakdown': {k: round(v, 3) for k, v in scores.items() if k != 'overall_score'},
            'pricing': {
                'price_per_kg': listing.price_per_kg,
                'quantity_available_kg': listing.quantity_kg,
                'quantity_needed_kg': requirement.quantity_needed_kg,
                'quantity_fulfilled_kg': quantity_fulfilled,
                'fulfillment_percentage': round(fulfillment_percentage, 1),
                'product_cost_total': round(product_cost, 2),
                'transport_cost': round(transport_cost, 2),
                'total_cost': round(total_cost, 2),
                'cost_per_kg_delivered': round(total_cost / quantity_fulfilled, 2) if quantity_fulfilled > 0 else 0
            },
            'logistics': {
                'distance_km': round(distance, 1),
                'seller_location': listing.location,
                'delivery_options': listing.delivery_options,
                'estimated_delivery_days': max(1, int(distance / 300))  # Rough estimate
            },
            'quality': {
                'grade': listing.quality_grade,
                'harvest_date': listing.harvest_date.strftime('%Y-%m-%d'),
                'freshness_days': (datetime.now() - listing.harvest_date).days,
                'certifications': listing.certification
            },
            'terms': {
                'payment_terms': listing.payment_terms,
                'packaging_type': listing.packaging_type,
                'available_until': listing.available_until.strftime('%Y-%m-%d')
            },
            'recommendation': self._generate_match_recommendation(scores['overall_score'], fulfillment_percentage)
        }
    
    def _calculate_transport_cost(self, quantity_kg: float, distance_km: float) -> float:
        """Calculate transportation cost"""
        # Determine vehicle type based on quantity
        if quantity_kg <= 1000:  # Up to 1 ton
            cost_per_km = self.regional_data['transportation_costs_per_km']['truck_small']
        elif quantity_kg <= 5000:  # Up to 5 tons
            cost_per_km = self.regional_data['transportation_costs_per_km']['truck_medium']
        else:  # More than 5 tons
            cost_per_km = self.regional_data['transportation_costs_per_km']['truck_large']
        
        # Add refrigeration cost for perishables
        # (This could be determined by product type)
        base_cost = distance_km * cost_per_km
        
        # Minimum cost and fuel surcharge
        minimum_cost = 50  # Minimum transport cost
        fuel_surcharge = base_cost * 0.15  # 15% fuel surcharge
        
        return max(minimum_cost, base_cost + fuel_surcharge)
    
    def _generate_match_recommendation(self, compatibility_score: float, fulfillment_percentage: float) -> Dict[str, str]:
        """Generate recommendation based on match quality"""
        if compatibility_score >= 0.8 and fulfillment_percentage >= 90:
            return {
                'level': 'excellent',
                'message': 'توصية ممتازة - تطابق عالي في جميع المعايير',
                'action': 'يُنصح بالمتابعة الفورية'
            }
        elif compatibility_score >= 0.7 and fulfillment_percentage >= 80:
            return {
                'level': 'very_good',
                'message': 'توصية جيدة جداً - تطابق جيد مع معظم المعايير',
                'action': 'يُنصح بالنظر بجدية'
            }
        elif compatibility_score >= 0.6 and fulfillment_percentage >= 70:
            return {
                'level': 'good',
                'message': 'توصية جيدة - يحقق المتطلبات الأساسية',
                'action': 'خيار مناسب للنظر فيه'
            }
        elif compatibility_score >= 0.5:
            return {
                'level': 'acceptable',
                'message': 'توصية مقبولة - قد يحتاج تفاوض',
                'action': 'يمكن النظر فيه كخيار احتياطي'
            }
        else:
            return {
                'level': 'poor',
                'message': 'تطابق ضعيف - لا يُنصح به',
                'action': 'ابحث عن خيارات أفضل'
            }
    
    def _get_market_data(self, product_type: str, location: str) -> Dict[str, Any]:
        """Get market data for pricing analysis"""
        # Simulated market data - in production would come from real market sources
        base_prices = {
            'olive': {'base': 8.5, 'volatility': 0.15},
            'citrus': {'base': 3.2, 'volatility': 0.25},
            'wheat': {'base': 1.2, 'volatility': 0.10},
            'tomato': {'base': 2.8, 'volatility': 0.35},
            'potato': {'base': 1.5, 'volatility': 0.20}
        }
        
        product_data = base_prices.get(product_type, {'base': 2.0, 'volatility': 0.20})
        
        # Add some market variation
        current_price = product_data['base'] * (1 + np.random.uniform(-product_data['volatility'], product_data['volatility']))
        
        return {
            'current_price': current_price,
            'price_trend_7d': np.random.uniform(-0.1, 0.1),
            'volume_traded': np.random.uniform(1000, 10000),
            'active_listings': np.random.randint(5, 25)
        }
    
    def _calculate_base_price(self, product_type: str, quality_grade: str, market_data: Dict) -> float:
        """Calculate base price from market data"""
        return market_data['current_price']
    
    def _get_quality_multiplier(self, product_type: str, quality_grade: str) -> float:
        """Get quality-based price multiplier"""
        multipliers = {
            'premium': 1.25,
            'grade_a': 1.10,
            'grade_b': 1.00,
            'standard': 0.85
        }
        return multipliers.get(quality_grade, 1.0)
    
    def _get_quantity_multiplier(self, quantity_kg: float, product_type: str) -> float:
        """Get quantity-based price multiplier"""
        # Bulk discounts/premiums
        if quantity_kg >= 10000:  # 10+ tons
            return 0.95  # 5% bulk discount
        elif quantity_kg >= 5000:  # 5+ tons
            return 0.98  # 2% bulk discount
        elif quantity_kg <= 100:  # Small quantities
            return 1.05  # 5% premium for small lots
        else:
            return 1.0  # No adjustment
    
    def _get_location_multiplier(self, location: str, product_type: str) -> float:
        """Get location-based price multiplier"""
        # Premium markets command higher prices
        market_info = self.regional_data['major_markets'].get(location, {})
        
        if market_info.get('premium_market'):
            return 1.10  # 10% premium for premium markets
        elif market_info.get('export_capacity') == 'high':
            return 1.05  # 5% premium for export markets
        elif market_info.get('type') == 'agricultural':
            return 0.95  # 5% discount for agricultural areas
        else:
            return 1.0  # No adjustment
    
    def _analyze_competition(self, product_type: str, quality_grade: str, location: str) -> Dict[str, Any]:
        """Analyze competitive position"""
        # Simulated competition analysis
        competitor_count = np.random.randint(3, 15)
        price_position = np.random.choice(['low', 'average', 'high'], p=[0.2, 0.6, 0.2])
        
        return {
            'competitor_count': competitor_count,
            'market_saturation': 'high' if competitor_count > 10 else 'medium' if competitor_count > 6 else 'low',
            'price_position': price_position,
            'competitive_advantage': ['quality', 'price', 'location', 'service'][np.random.randint(0, 4)]
        }
    
    def _generate_market_insights(self, requirement: BuyerRequirement, listings: List[MarketListing]) -> Dict[str, Any]:
        """Generate market insights from available listings"""
        if not listings:
            return {'message': 'لا توجد بيانات كافية لتحليل السوق'}
        
        prices = [listing.price_per_kg for listing in listings]
        quantities = [listing.quantity_kg for listing in listings]
        
        return {
            'market_summary': {
                'total_listings': len(listings),
                'total_quantity_available': sum(quantities),
                'avg_price': round(np.mean(prices), 2),
                'price_range': {
                    'min': round(min(prices), 2),
                    'max': round(max(prices), 2)
                }
            },
            'buyer_insights': {
                'requirement_coverage': f"{(sum(quantities) / requirement.quantity_needed_kg) * 100:.1f}%",
                'price_competitiveness': 'good' if requirement.max_price_per_kg >= np.mean(prices) else 'challenging',
                'market_timing': 'favorable' if len(listings) > 5 else 'limited_options'
            },
            'recommendations': [
                'قارن عدة عروض قبل اتخاذ القرار',
                'تفاوض على الكمية والسعر',
                'تأكد من جودة المنتج قبل الشراء'
            ]
        }
    
    def _analyze_supply(self, product_type: str, location: str, days: int) -> Dict[str, Any]:
        """Analyze supply for market opportunity"""
        # Simulated supply analysis
        total_supply = np.random.uniform(5000, 50000)  # kg
        supplier_count = np.random.randint(5, 20)
        
        return {
            'total_supply': total_supply,
            'supplier_count': supplier_count,
            'supply_concentration': 'high' if supplier_count < 8 else 'medium' if supplier_count < 15 else 'low',
            'supply_stability': 'stable' if np.random.random() > 0.3 else 'volatile'
        }
    
    def _analyze_demand(self, product_type: str, location: str, days: int) -> Dict[str, Any]:
        """Analyze demand for market opportunity"""
        # Simulated demand analysis
        total_demand = np.random.uniform(6000, 60000)  # kg
        buyer_count = np.random.randint(8, 30)
        
        return {
            'total_demand': total_demand,
            'buyer_count': buyer_count,
            'demand_strength': 'strong' if buyer_count > 20 else 'moderate' if buyer_count > 12 else 'weak',
            'seasonal_factor': np.random.uniform(0.8, 1.2)
        }
    
    def _calculate_opportunity_score(self, supply: Dict, demand: Dict, gap: float, gap_percentage: float) -> float:
        """Calculate market opportunity score"""
        score = 50  # Base score
        
        # Gap score (positive gap = opportunity)
        if gap > 0:
            score += min(30, gap_percentage)  # Up to 30 points for market gap
        else:
            score -= min(20, abs(gap_percentage) / 2)  # Penalty for oversupply
        
        # Supply concentration (fewer suppliers = opportunity)
        if supply['supply_concentration'] == 'high':
            score += 10
        elif supply['supply_concentration'] == 'medium':
            score += 5
        
        # Demand strength
        if demand['demand_strength'] == 'strong':
            score += 15
        elif demand['demand_strength'] == 'moderate':
            score += 5
        
        return min(100, max(0, score))
    
    def _analyze_price_trends(self, product_type: str, location: str, days: int) -> Dict[str, Any]:
        """Analyze price trends"""
        # Simulated price trend analysis
        trend_direction = np.random.choice(['increasing', 'stable', 'decreasing'], p=[0.4, 0.3, 0.3])
        volatility = np.random.uniform(0.05, 0.25)
        
        return {
            'trend_direction': trend_direction,
            'volatility_level': 'high' if volatility > 0.2 else 'medium' if volatility > 0.1 else 'low',
            'price_stability': 'stable' if volatility < 0.1 else 'unstable'
        }
    
    def _analyze_market_competition(self, product_type: str, location: str) -> Dict[str, Any]:
        """Analyze market competition"""
        return {
            'competition_level': np.random.choice(['low', 'medium', 'high']),
            'market_leaders': np.random.randint(2, 8),
            'entry_barriers': np.random.choice(['low', 'medium', 'high'])
        }
    
    def _generate_market_recommendations(self, 
                                       product_type: str, 
                                       location: str, 
                                       opportunity_score: float,
                                       market_gap: float,
                                       price_trends: Dict) -> List[Dict[str, str]]:
        """Generate market recommendations"""
        recommendations = []
        
        if opportunity_score >= 75:
            recommendations.append({
                'type': 'strong_opportunity',
                'title': 'فرصة استثمارية ممتازة',
                'description': 'السوق يُظهر فرصة قوية مع طلب عالي وعرض محدود'
            })
        elif opportunity_score >= 60:
            recommendations.append({
                'type': 'good_opportunity',
                'title': 'فرصة استثمارية جيدة',
                'description': 'ظروف السوق مناسبة للدخول مع مراعاة المنافسة'
            })
        elif opportunity_score >= 40:
            recommendations.append({
                'type': 'moderate_opportunity',
                'title': 'فرصة متوسطة',
                'description': 'السوق متوازن، يحتاج استراتيجية تنافسية واضحة'
            })
        else:
            recommendations.append({
                'type': 'limited_opportunity',
                'title': 'فرصة محدودة',
                'description': 'السوق مشبع، يُنصح بالبحث عن أسواق أو منتجات أخرى'
            })
        
        if market_gap > 0:
            recommendations.append({
                'type': 'supply_gap',
                'title': 'نقص في العرض',
                'description': f'يوجد نقص في المعروض بحوالي {market_gap:.0f} كيلو'
            })
        
        if price_trends['trend_direction'] == 'increasing':
            recommendations.append({
                'type': 'price_trend',
                'title': 'اتجاه سعري إيجابي',
                'description': 'الأسعار في اتجاه صاعد، وقت مناسب للبيع'
            })
        
        return recommendations
    
    def _categorize_opportunity(self, score: float) -> str:
        """Categorize opportunity level"""
        if score >= 75:
            return 'excellent'
        elif score >= 60:
            return 'good'
        elif score >= 40:
            return 'moderate'
        else:
            return 'limited'
    
    def add_listing(self, listing_data: Dict[str, Any]) -> Dict[str, Any]:
        """Add a new market listing"""
        try:
            # Create listing object
            listing = MarketListing(
                id=f"listing_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{np.random.randint(1000, 9999)}",
                seller_id=listing_data['seller_id'],
                product_type=listing_data['product_type'],
                product_name=listing_data['product_name'],
                product_name_ar=listing_data['product_name_ar'],
                quantity_kg=listing_data['quantity_kg'],
                price_per_kg=listing_data['price_per_kg'],
                quality_grade=listing_data['quality_grade'],
                location=listing_data['location'],
                harvest_date=datetime.fromisoformat(listing_data['harvest_date']),
                available_until=datetime.fromisoformat(listing_data['available_until']),
                certification=listing_data.get('certification', []),
                packaging_type=listing_data.get('packaging_type', 'standard'),
                delivery_options=listing_data.get('delivery_options', ['pickup']),
                payment_terms=listing_data.get('payment_terms', ['cash']),
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            
            # Add to active listings
            self.active_listings.append(listing)
            
            return {
                'success': True,
                'listing_id': listing.id,
                'message': 'تم إضافة العرض بنجاح',
                'created_at': listing.created_at.isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error adding listing: {str(e)}")
            return {
                'success': False,
                'error': f"Failed to add listing: {str(e)}"
            }
    
    def add_requirement(self, requirement_data: Dict[str, Any]) -> Dict[str, Any]:
        """Add a new buyer requirement"""
        try:
            # Create requirement object
            requirement = BuyerRequirement(
                id=f"req_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{np.random.randint(1000, 9999)}",
                buyer_id=requirement_data['buyer_id'],
                product_type=requirement_data['product_type'],
                quantity_needed_kg=requirement_data['quantity_needed_kg'],
                max_price_per_kg=requirement_data['max_price_per_kg'],
                preferred_quality=requirement_data.get('preferred_quality', ['grade_a']),
                location_preference=requirement_data.get('location_preference', ''),
                max_distance_km=requirement_data.get('max_distance_km', 500),
                delivery_required=requirement_data.get('delivery_required', False),
                packaging_preference=requirement_data.get('packaging_preference', []),
                certification_required=requirement_data.get('certification_required', []),
                needed_by_date=datetime.fromisoformat(requirement_data['needed_by_date']),
                payment_method=requirement_data.get('payment_method', ['cash']),
                created_at=datetime.now()
            )
            
            # Add to active requirements
            self.active_requirements.append(requirement)
            
            return {
                'success': True,
                'requirement_id': requirement.id,
                'message': 'تم إضافة الطلب بنجاح',
                'created_at': requirement.created_at.isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error adding requirement: {str(e)}")
            return {
                'success': False,
                'error': f"Failed to add requirement: {str(e)}"
            }
