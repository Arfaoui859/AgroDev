
"""
AgroGrowth - Transparent Agricultural Profit Estimator
Deterministic financial calculations; no synthetic ML training.

IMPORTANT:
- Built-in prices and cost assumptions are indicative references only.
- They are NOT verified live Tunisian market data.
- Results are estimates, not guaranteed agricultural or financial outcomes.
"""

from typing import Dict, List, Any, Optional
from datetime import datetime
import logging
import math

logger = logging.getLogger(__name__)


class ProfitEstimatorAI:
    """Transparent agricultural profitability calculation engine."""

    MODEL_SOURCE = "deterministic-financial-rules"
    FIELD_VALIDATED = False

    # Indicative reference values only.
    # Replace these with verified regional data before production use.
    market_data = {
        "wheat": {
            "name_ar": "القمح",
            "base_price_per_kg": 2.5,
            "price_volatility": 0.15,
            "seasonal_factors": {
                "harvest_months": [5, 6, 7],
                "price_dip_factor": 0.85,
                "storage_premium": 0.10,
            },
            "demand_trend": "unknown",
            "export_potential": "unknown",
        },
        "corn": {
            "name_ar": "الذرة",
            "base_price_per_kg": 1.8,
            "price_volatility": 0.20,
            "seasonal_factors": {
                "harvest_months": [8, 9, 10],
                "price_dip_factor": 0.80,
                "storage_premium": 0.15,
            },
            "demand_trend": "unknown",
            "export_potential": "unknown",
        },
        "rice": {
            "name_ar": "الأرز",
            "base_price_per_kg": 3.2,
            "price_volatility": 0.10,
            "seasonal_factors": {
                "harvest_months": [9, 10, 11],
                "price_dip_factor": 0.90,
                "storage_premium": 0.08,
            },
            "demand_trend": "unknown",
            "export_potential": "unknown",
        },
        "tomato": {
            "name_ar": "الطماطم",
            "base_price_per_kg": 4.5,
            "price_volatility": 0.35,
            "seasonal_factors": {
                "harvest_months": [6, 7, 8, 9],
                "price_dip_factor": 0.70,
                "storage_premium": 0.0,
            },
            "demand_trend": "unknown",
            "export_potential": "unknown",
        },
        "potato": {
            "name_ar": "البطاطا",
            "base_price_per_kg": 2.8,
            "price_volatility": 0.25,
            "seasonal_factors": {
                "harvest_months": [5, 6, 10, 11],
                "price_dip_factor": 0.75,
                "storage_premium": 0.12,
            },
            "demand_trend": "unknown",
            "export_potential": "unknown",
        },
        "onion": {
            "name_ar": "البصل",
            "base_price_per_kg": 3.5,
            "price_volatility": 0.30,
            "seasonal_factors": {
                "harvest_months": [4, 5, 6],
                "price_dip_factor": 0.65,
                "storage_premium": 0.20,
            },
            "demand_trend": "unknown",
            "export_potential": "unknown",
        },
        "dates": {
            "name_ar": "التمور",
            "base_price_per_kg": 15.0,
            "price_volatility": 0.12,
            "seasonal_factors": {
                "harvest_months": [8, 9, 10],
                "price_dip_factor": 0.85,
                "storage_premium": 0.05,
            },
            "demand_trend": "unknown",
            "export_potential": "unknown",
        },
        "olive": {
            "name_ar": "الزيتون",
            "base_price_per_kg": 8.0,
            "price_volatility": 0.18,
            "seasonal_factors": {
                "harvest_months": [10, 11, 12],
                "price_dip_factor": 0.80,
                "storage_premium": 0.15,
            },
            "demand_trend": "unknown",
            "export_potential": "unknown",
        },
    }

    # Indicative reference costs, not verified local quotations.
    cost_structure = {
        "land_lease_per_hectare_year": 1500.0,
        "equipment_depreciation_per_hectare": 200.0,
        "insurance_per_hectare": 150.0,
        "certification_per_hectare": 100.0,
        "unskilled_labor_per_day": 25.0,
        "fuel_cost_per_liter": 1.5,
        "electricity_cost_per_kwh": 0.12,
        "water_cost_per_cubic_meter": 0.8,
    }

    def __init__(self):
        # Expose class-level configuration as instance attributes.
        # This also makes the estimator configuration explicit.
        self.MODEL_SOURCE = type(self).MODEL_SOURCE
        self.FIELD_VALIDATED = type(self).FIELD_VALIDATED
        self.market_data = type(self).market_data
        self.cost_structure = type(self).cost_structure

        # No model training and no synthetic data.
        self.is_trained = False
        self.model_source = self.MODEL_SOURCE

        logger.info(
            "ProfitEstimatorAI initialized using deterministic calculations"
        )

    @staticmethod
    def _number(
        data: Dict[str, Any],
        key: str,
        default: Optional[float] = None,
        minimum: Optional[float] = None,
    ) -> Optional[float]:
        value = data.get(key, default)

        if value is None:
            return None

        try:
            value = float(value)
        except (TypeError, ValueError):
            raise ValueError(f"{key} must be a valid number")

        if not math.isfinite(value):
            raise ValueError(f"{key} must be finite")

        if minimum is not None and value < minimum:
            raise ValueError(f"{key} must be >= {minimum}")

        return value

    @staticmethod
    def _clamp(value: float, low: float = 0.0, high: float = 1.0) -> float:
        return max(low, min(high, value))

    @staticmethod
    def _safe_float(value: Any) -> float:
        value = float(value)
        if not math.isfinite(value):
            raise ValueError("Calculated result is not finite")
        return value

    def _get_crop(self, crop_name: str) -> Dict[str, Any]:
        crop_name = str(crop_name).strip().lower()

        if crop_name not in self.market_data:
            supported = ", ".join(sorted(self.market_data.keys()))
            raise ValueError(
                f"Unsupported crop '{crop_name}'. Supported crops: {supported}"
            )

        return self.market_data[crop_name]

    def _calculate_detailed_costs(
        self,
        crop_name: str,
        farm_size: float,
        crop_data: Dict[str, Any],
    ) -> Dict[str, Any]:

        if farm_size <= 0:
            raise ValueError("farm_size must be greater than zero")

        reference = self.cost_structure

        def cost_per_hectare(key: str, default: float) -> float:
            return self._number(
                crop_data, key, default=default, minimum=0
            )

        fixed_per_hectare = {
            "land_lease": cost_per_hectare(
                "land_lease_per_hectare",
                reference["land_lease_per_hectare_year"]
            ),
            "equipment_depreciation": cost_per_hectare(
                "equipment_depreciation_per_hectare",
                reference["equipment_depreciation_per_hectare"]
            ),
            "insurance": cost_per_hectare(
                "insurance_per_hectare",
                reference["insurance_per_hectare"]
            ),
            "certification": cost_per_hectare(
                "certification_per_hectare",
                reference["certification_per_hectare"]
            ),
        }

        labor_days = cost_per_hectare("labor_days_per_hectare", 30)
        fuel_liters = cost_per_hectare("fuel_consumption_per_hectare", 100)
        electricity_kwh = cost_per_hectare(
            "electricity_consumption_per_hectare", 500
        )
        water_m3 = cost_per_hectare(
            "water_consumption_per_hectare", 3000
        )

        labor_rate = self._number(
            crop_data,
            "labor_cost_per_day",
            reference["unskilled_labor_per_day"],
            minimum=0,
        )
        fuel_rate = self._number(
            crop_data,
            "fuel_price_per_liter",
            reference["fuel_cost_per_liter"],
            minimum=0,
        )
        electricity_rate = self._number(
            crop_data,
            "electricity_price_per_kwh",
            reference["electricity_cost_per_kwh"],
            minimum=0,
        )
        water_rate = self._number(
            crop_data,
            "water_price_per_cubic_meter",
            reference["water_cost_per_cubic_meter"],
            minimum=0,
        )

        variable_per_hectare = {
            "labor": labor_days * labor_rate,
            "fuel": fuel_liters * fuel_rate,
            "electricity": electricity_kwh * electricity_rate,
            "water": water_m3 * water_rate,
        }

        input_per_hectare = {
            "seeds": cost_per_hectare("seed_cost_per_hectare", 200),
            "fertilizers": cost_per_hectare(
                "fertilizer_cost_per_hectare", 300
            ),
            "pesticides": cost_per_hectare(
                "pesticide_cost_per_hectare", 150
            ),
        }

        fixed_costs = {
            key: value * farm_size
            for key, value in fixed_per_hectare.items()
        }
        variable_costs = {
            key: value * farm_size
            for key, value in variable_per_hectare.items()
        }
        input_costs = {
            key: value * farm_size
            for key, value in input_per_hectare.items()
        }

        total_fixed = sum(fixed_costs.values())
        total_variable = sum(variable_costs.values())
        total_input = sum(input_costs.values())
        total = total_fixed + total_variable + total_input

        return {
            "fixed_costs": fixed_costs,
            "variable_costs": variable_costs,
            "input_costs": input_costs,
            "total_fixed_costs": self._safe_float(total_fixed),
            "total_variable_costs": self._safe_float(total_variable),
            "total_input_costs": self._safe_float(total_input),
            "total_costs": self._safe_float(total),
            "cost_per_hectare": self._safe_float(total / farm_size),
            "currency": crop_data.get("currency", "TND"),
            "cost_data_source": "user_inputs_and_indicative_reference_values",
        }

    def _perform_financial_analysis(
        self,
        price: float,
        yield_per_hectare: float,
        costs: Dict[str, Any],
        farm_size: float,
        planning_horizon: int,
    ) -> Dict[str, Any]:

        if price < 0 or yield_per_hectare < 0:
            raise ValueError("Price and yield cannot be negative")

        if farm_size <= 0:
            raise ValueError("farm_size must be greater than zero")

        total_yield = yield_per_hectare * farm_size
        gross_revenue = total_yield * price
        total_costs = costs["total_costs"]
        net_profit = gross_revenue - total_costs

        roi = (
            (net_profit / total_costs) * 100
            if total_costs > 0 else 0.0
        )
        profit_margin = (
            (net_profit / gross_revenue) * 100
            if gross_revenue > 0 else 0.0
        )

        breakeven_price = (
            total_costs / total_yield
            if total_yield > 0 else 0.0
        )
        breakeven_yield_total = (
            total_costs / price
            if price > 0 else 0.0
        )
        breakeven_yield_per_hectare = (
            breakeven_yield_total / farm_size
            if farm_size > 0 else 0.0
        )

        # A simple annual operating estimate.
        # It is not an investment payback calculation for perennial crops.
        payback_months = (
            (total_costs / net_profit) * 12
            if net_profit > 0 else None
        )

        cash_flow = self._calculate_cash_flow(
            gross_revenue,
            total_costs,
            planning_horizon,
            crop_data_growth=0.0,
            cost_growth=0.0,
        )

        return {
            "gross_revenue": self._safe_float(gross_revenue),
            "total_costs": self._safe_float(total_costs),
            "net_profit": self._safe_float(net_profit),
            "roi_percent": self._safe_float(roi),
            "profit_margin_percent": self._safe_float(profit_margin),
            "profit_per_hectare": self._safe_float(
                net_profit / farm_size
            ),
            "breakeven_analysis": {
                "breakeven_price_per_kg": self._safe_float(
                    breakeven_price
                ),
                "breakeven_yield_per_hectare": self._safe_float(
                    breakeven_yield_per_hectare
                ),
            },
            "payback_period_months": (
                self._safe_float(payback_months)
                if payback_months is not None else None
            ),
            "cash_flow_projection": cash_flow,
            "profitability_level": self._get_profitability_level(roi),
            "currency": costs.get("currency", "TND"),
        }

    def _calculate_cash_flow(
        self,
        revenue: float,
        costs: float,
        horizon: int,
        crop_data_growth: float = 0.0,
        cost_growth: float = 0.0,
    ) -> List[Dict[str, Any]]:

        if not isinstance(horizon, int) or horizon < 1 or horizon > 30:
            raise ValueError("planning_horizon_years must be between 1 and 30")

        if not (-0.5 <= crop_data_growth <= 1.0):
            raise ValueError("revenue_growth_rate must be between -0.5 and 1")

        if not (-0.5 <= cost_growth <= 1.0):
            raise ValueError("cost_growth_rate must be between -0.5 and 1")

        results = []
        cumulative = 0.0

        for year in range(1, horizon + 1):
            annual_revenue = revenue * (
                (1 + crop_data_growth) ** (year - 1)
            )
            annual_costs = costs * (
                (1 + cost_growth) ** (year - 1)
            )
            net_flow = annual_revenue - annual_costs
            cumulative += net_flow

            results.append({
                "year": year,
                "revenue": self._safe_float(annual_revenue),
                "costs": self._safe_float(annual_costs),
                "net_cash_flow": self._safe_float(net_flow),
                "cumulative_cash_flow": self._safe_float(cumulative),
            })

        return results

    def _calculate_price_range(
        self,
        base_price: float,
        volatility: float,
    ) -> Dict[str, float]:

        volatility = self._clamp(volatility, 0.0, 1.0)

        return {
            "min_price": self._safe_float(
                base_price * (1 - volatility)
            ),
            "max_price": self._safe_float(
                base_price * (1 + volatility)
            ),
            "volatility_percent": self._safe_float(volatility * 100),
        }

    def _calculate_seasonal_variation(
        self,
        crop_name: str,
    ) -> Dict[str, Any]:

        seasonal = self._get_crop(crop_name)["seasonal_factors"]
        harvest_months = seasonal["harvest_months"]

        return {
            "harvest_months": harvest_months,
            "price_dip_factor": seasonal["price_dip_factor"],
            "storage_premium": seasonal["storage_premium"],
            "best_selling_months": self._get_best_selling_months(
                harvest_months
            ),
            "status": "indicative_reference_only",
        }

    @staticmethod
    def _get_best_selling_months(
        harvest_months: List[int],
    ) -> List[int]:

        return [
            month for month in range(1, 13)
            if month not in harvest_months
        ][:3]

    def _perform_risk_analysis(
        self,
        crop_name: str,
        crop_data: Dict[str, Any],
        financial_analysis: Dict[str, Any],
    ) -> Dict[str, Any]:

        market_info = self._get_crop(crop_name)

        volatility = self._number(
            crop_data,
            "price_volatility",
            market_info["price_volatility"],
            minimum=0,
        )
        climate = self._number(
            crop_data, "climate_suitability_score", None
        )
        market_distance = self._number(
            crop_data, "market_distance_km", None, minimum=0
        )
        weather_resilience = self._number(
            crop_data, "weather_resilience_score", None
        )

        roi = financial_analysis["roi_percent"]

        scores = {
            "price": self._clamp(volatility),
            "yield": (
                1 - self._clamp(climate)
                if climate is not None else None
            ),
            "market": (
                self._clamp(market_distance / 200)
                if market_distance is not None else None
            ),
            "financial": self._clamp(
                1 - (roi / 100)
            ),
            "weather": (
                1 - self._clamp(weather_resilience)
                if weather_resilience is not None else None
            ),
        }

        available_scores = [
            score for score in scores.values()
            if score is not None
        ]

        overall = (
            sum(available_scores) / len(available_scores)
            if available_scores else None
        )

        details = {}
        descriptions = {
            "price": "مخاطر تقلبات الأسعار",
            "yield": "مخاطر انخفاض الإنتاجية",
            "market": "مخاطر الوصول إلى السوق",
            "financial": "مخاطر الربحية المالية",
            "weather": "مخاطر الطقس والمناخ",
        }

        for key, score in scores.items():
            details[key + "_risk"] = {
                "score": (
                    round(score, 4) if score is not None else None
                ),
                "level": (
                    self._get_risk_level(score)
                    if score is not None else "غير متوفر"
                ),
                "description": descriptions[key],
                "available": score is not None,
            }

        return {
            **details,
            "overall_risk_score": (
                round(overall, 4) if overall is not None else None
            ),
            "overall_risk_level": (
                self._get_risk_level(overall)
                if overall is not None else "بيانات غير كافية"
            ),
            "risk_mitigation_strategies": (
                self._generate_risk_mitigation_strategies(scores)
            ),
            "risk_data_completeness": (
                len(available_scores) / len(scores)
            ),
        }

    @staticmethod
    def _get_risk_level(score: float) -> str:
        if score <= 0.3:
            return "منخفض"
        if score <= 0.6:
            return "متوسط"
        return "عالي"

    @staticmethod
    def _generate_risk_mitigation_strategies(
        scores: Dict[str, Optional[float]],
    ) -> List[str]:

        strategies = []

        if scores["price"] is not None and scores["price"] > 0.6:
            strategies.extend([
                "تنويع قنوات التسويق",
                "دراسة اتفاقيات بيع مسبقة مع المشترين",
            ])

        if scores["yield"] is not None and scores["yield"] > 0.6:
            strategies.extend([
                "تحسين ممارسات الري والتسميد",
                "استشارة مهندس زراعي حول الأصناف المناسبة",
            ])

        if scores["market"] is not None and scores["market"] > 0.6:
            strategies.extend([
                "دراسة خيارات النقل والتوزيع المحلي",
                "مقارنة تكاليف التخزين والتسويق",
            ])

        if scores["weather"] is not None and scores["weather"] > 0.6:
            strategies.extend([
                "دراسة حلول التكيف مع الظروف المناخية",
                "التحقق من توفر التأمين الزراعي",
            ])

        if not strategies:
            strategies.append(
                "اجمع بيانات محلية إضافية قبل اتخاذ قرار الاستثمار"
            )

        return strategies

    def _analyze_market_conditions(
        self,
        crop_name: str,
        crop_data: Dict[str, Any],
    ) -> Dict[str, Any]:

        market_info = self._get_crop(crop_name)
        seasonal = self._calculate_seasonal_variation(crop_name)

        # Do not fabricate demand or export scores.
        demand_trend = crop_data.get(
            "demand_trend", market_info["demand_trend"]
        )
        export_potential = crop_data.get(
            "export_potential", market_info["export_potential"]
        )

        quality = self._number(
            crop_data, "product_quality_score", None
        )

        opportunities = []

        if demand_trend == "increasing":
            opportunities.append("الطلب المصرح به في البيانات يشير إلى نمو")

        if export_potential in ("high", "very_high"):
            opportunities.append(
                "إمكانية دراسة فرص التصدير بعد التحقق من شروط السوق"
            )

        if quality is not None and quality >= 0.8:
            opportunities.append(
                "يمكن دراسة الحصول على سعر أفضل حسب جودة المنتج"
            )

        return {
            "market_potential_score": None,
            "demand_trend": demand_trend,
            "export_potential": export_potential,
            "seasonal_analysis": seasonal,
            "competition_analysis": {
                "level": crop_data.get(
                    "local_competition_level", "unknown"
                ),
                "score": None,
                "market_share_potential": None,
            },
            "market_opportunities": opportunities,
            "market_data_status": "not_connected_to_live_market_data",
        }

    def _perform_sensitivity_analysis(
        self,
        crop_name: str,
        base_price: float,
        base_yield: float,
        costs: Dict[str, Any],
        farm_size: float,
    ) -> Dict[str, Any]:

        base_cost = costs["total_costs"]
        base_profit = (
            base_price * base_yield * farm_size - base_cost
        )

        price_scenarios = {
            "pessimistic": base_price * 0.8,
            "realistic": base_price,
            "optimistic": base_price * 1.2,
        }

        yield_scenarios = {
            "pessimistic": base_yield * 0.7,
            "realistic": base_yield,
            "optimistic": base_yield * 1.3,
        }

        cost_scenarios = {
            "pessimistic": base_cost * 1.2,
            "realistic": base_cost,
            "optimistic": base_cost * 0.9,
        }

        results = {}

        for price_name, price in price_scenarios.items():
            for yield_name, crop_yield in yield_scenarios.items():
                for cost_name, cost in cost_scenarios.items():
                    profit = (
                        price * crop_yield * farm_size - cost
                    )
                    roi = (
                        profit / cost * 100 if cost > 0 else 0
                    )

                    results[
                        f"{price_name}_{yield_name}_{cost_name}"
                    ] = {
                        "profit": self._safe_float(profit),
                        "roi_percent": self._safe_float(roi),
                        "profit_change_percent": (
                            self._safe_float(
                                (profit - base_profit)
                                / abs(base_profit) * 100
                            )
                            if base_profit != 0 else 0.0
                        ),
                    }

        worst = min(results.values(), key=lambda x: x["profit"])
        best = max(results.values(), key=lambda x: x["profit"])

        return {
            "base_scenario": {
                "profit": self._safe_float(base_profit),
                "price": self._safe_float(base_price),
                "yield": self._safe_float(base_yield),
                "costs": self._safe_float(base_cost),
            },
            "scenarios": results,
            "worst_case": worst,
            "best_case": best,
            "risk_tolerance_analysis": {
                "profit_volatility": None,
                "risk_tolerance_requirement": (
                    "راجع السيناريوهات قبل تحديد مستوى المخاطر"
                ),
                "worst_case_scenario": worst["profit"],
                "best_case_scenario": best["profit"],
            },
            "scenario_status": "illustrative_assumptions_not_forecasts",
        }

    @staticmethod
    def _get_profitability_level(roi: float) -> str:
        if roi >= 50:
            return "ممتاز"
        if roi >= 30:
            return "جيد جداً"
        if roi >= 15:
            return "جيد"
        if roi >= 5:
            return "مقبول"
        return "ضعيف"

    def _generate_investment_recommendations(
        self,
        financial_analysis: Dict[str, Any],
        risk_analysis: Dict[str, Any],
        market_analysis: Dict[str, Any],
    ) -> Dict[str, Any]:

        roi = financial_analysis["roi_percent"]
        risk = risk_analysis["overall_risk_score"]

        if risk is None:
            recommendation = "يلزم توفير بيانات إضافية قبل التوصية"
            confidence = "غير محددة"
        elif roi > 0 and risk <= 0.3:
            recommendation = "نتيجة الحسابات إيجابية؛ تحقق من الافتراضات ميدانياً"
            confidence = "محدودة بالبيانات المدخلة"
        elif roi > 0:
            recommendation = "النتيجة الحسابية إيجابية مع ضرورة مراجعة المخاطر"
            confidence = "محدودة بالبيانات المدخلة"
        else:
            recommendation = "الحسابات الحالية لا تشير إلى ربحية إيجابية"
            confidence = "محدودة بالبيانات المدخلة"

        return {
            "recommendation": recommendation,
            "confidence_level": confidence,
            "investment_attractiveness_score": None,
            "profitability_level": financial_analysis[
                "profitability_level"
            ],
            "suggested_investment_horizon_years": None,
            "risk_budget": (
                risk_analysis["overall_risk_level"]
            ),
            "expected_net_profit": financial_analysis["net_profit"],
            "expected_roi_percent": roi,
            "key_considerations": [
                "النتيجة مبنية على الأسعار والتكاليف والمردودية المدخلة أو الافتراضية",
                "لا توجد بيانات سوقية مباشرة في هذه الخدمة",
                "يجب التحقق من المردودية والأسعار مع مختص محلي",
            ],
            "next_steps": [
                "تأكيد سعر البيع الفعلي في المنطقة",
                "تأكيد المردودية المتوقعة حسب الأرض والموسم",
                "إدخال تكاليف الماء والطاقة واليد العاملة والمدخلات الفعلية",
            ],
        }

    def estimate_crop_profitability(
        self,
        crop_data: Dict[str, Any],
    ) -> Dict[str, Any]:

        if not isinstance(crop_data, dict):
            raise ValueError("crop_data must be a dictionary")

        crop_name = str(crop_data.get("crop_name", "")).strip().lower()

        if not crop_name:
            raise ValueError("crop_name is required")

        market_info = self._get_crop(crop_name)

        farm_size = self._number(
            crop_data, "farm_size", minimum=0
        )
        if farm_size is None or farm_size <= 0:
            raise ValueError("farm_size must be greater than zero")

        planning_horizon = self._number(
            crop_data, "planning_horizon_years", 1, minimum=1
        )
        if planning_horizon != int(planning_horizon) or planning_horizon > 30:
            raise ValueError(
                "planning_horizon_years must be an integer between 1 and 30"
            )
        planning_horizon = int(planning_horizon)

        # User-supplied values take priority.
        # Built-in price is only an indicative reference fallback.
        price = self._number(
            crop_data,
            "market_price_per_kg",
            market_info["base_price_per_kg"],
            minimum=0,
        )

        # No invented yield: use explicit user input or the known crop
        # reference yield if provided by the calling service.
        yield_per_hectare = self._number(
            crop_data,
            "yield_per_hectare",
            crop_data.get("expected_yield_per_hectare"),
            minimum=0,
        )

        if yield_per_hectare is None:
            raise ValueError(
                "Missing yield_per_hectare. Provide actual or locally "
                "validated expected yield in kg per hectare."
            )

        costs = self._calculate_detailed_costs(
            crop_name, farm_size, crop_data
        )

        financial = self._perform_financial_analysis(
            price,
            yield_per_hectare,
            costs,
            farm_size,
            planning_horizon,
        )

        risk = self._perform_risk_analysis(
            crop_name, crop_data, financial
        )

        market = self._analyze_market_conditions(
            crop_name, crop_data
        )

        sensitivity = self._perform_sensitivity_analysis(
            crop_name,
            price,
            yield_per_hectare,
            costs,
            farm_size,
        )

        recommendations = self._generate_investment_recommendations(
            financial, risk, market
        )

        return {
            "crop_name": crop_name,
            "crop_name_ar": market_info["name_ar"],
            "farm_size_hectares": farm_size,
            "planning_horizon_years": planning_horizon,
            "price_analysis": {
                "predicted_price_per_kg": price,
                "price_range": self._calculate_price_range(
                    price, market_info["price_volatility"]
                ),
                "seasonal_price_variation": (
                    self._calculate_seasonal_variation(crop_name)
                ),
                "price_source": (
                    "user_input"
                    if "market_price_per_kg" in crop_data
                    else "indicative_reference_not_live_market_data"
                ),
            },
            "yield_analysis": {
                "predicted_yield_per_hectare": yield_per_hectare,
                "total_expected_yield": (
                    yield_per_hectare * farm_size
                ),
                "yield_confidence_interval": None,
                "yield_source": (
                    "user_input"
                    if (
                        "yield_per_hectare" in crop_data
                        or "expected_yield_per_hectare" in crop_data
                    )
                    else "unknown"
                ),
            },
            "cost_analysis": costs,
            "financial_analysis": financial,
            "risk_analysis": risk,
            "market_analysis": market,
            "sensitivity_analysis": sensitivity,
            "investment_recommendations": recommendations,
            "model_source": self.MODEL_SOURCE,
            "field_validated": self.FIELD_VALIDATED,
            "disclaimer": (
                "حسابات تقديرية وليست توقعات مضمونة. الأسعار المرجعية "
                "والتكاليف الافتراضية غير متحقق منها كسوق تونسي مباشر. "
                "تحقق من جميع المدخلات محلياً قبل اتخاذ قرار استثماري."
            ),
            "analysis_timestamp": datetime.now().isoformat(),
        }

    def compare_crop_profitability(
        self,
        crops_data: List[Dict[str, Any]],
    ) -> Dict[str, Any]:

        if not isinstance(crops_data, list) or not crops_data:
            raise ValueError("crops_data must be a non-empty list")

        if len(crops_data) > 20:
            raise ValueError("Maximum 20 crops can be compared at once")

        analyses = []

        for crop_data in crops_data:
            analysis = self.estimate_crop_profitability(crop_data)
            financial = analysis["financial_analysis"]
            risk = analysis["risk_analysis"]

            analyses.append({
                "crop_name": analysis["crop_name"],
                "crop_name_ar": analysis["crop_name_ar"],
                "net_profit": financial["net_profit"],
                "roi_percent": financial["roi_percent"],
                "payback_period": financial["payback_period_months"],
                "risk_score": risk["overall_risk_score"],
                "market_potential": None,
                "field_validated": False,
            })

        by_roi = sorted(
            analyses,
            key=lambda item: item["roi_percent"],
            reverse=True,
        )
        by_profit = sorted(
            analyses,
            key=lambda item: item["net_profit"],
            reverse=True,
        )

        by_risk = sorted(
            analyses,
            key=lambda item: (
                item["risk_score"]
                if item["risk_score"] is not None else float("inf")
            ),
        )

        # No fabricated weighted score: comparison uses measurable
        # financial results only.
        rankings = {
            "by_roi": by_roi,
            "by_net_profit": by_profit,
            "by_risk": by_risk,
            "by_market_potential": [],
            "by_weighted_score": [],
        }

        portfolio = {
            "message": (
                "لا يتم اقتراح توزيع استثماري آلي دون بيانات سوقية "
                "ومخاطر موثوقة لكل محصول."
            ),
            "diversification_candidates": [
                item["crop_name"] for item in by_risk
            ],
        }

        return {
            "crop_comparisons": analyses,
            "rankings": rankings,
            "portfolio_recommendations": portfolio,
            "best_overall_crop": (
                by_roi[0] if by_roi else None
            ),
            "model_source": self.MODEL_SOURCE,
            "field_validated": False,
            "analysis_timestamp": datetime.now().isoformat(),
        }


def create_profit_estimator() -> ProfitEstimatorAI:
    """Factory function used by main.py."""
    return ProfitEstimatorAI()
