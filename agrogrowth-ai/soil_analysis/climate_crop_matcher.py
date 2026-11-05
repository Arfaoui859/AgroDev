
"""
ClimateCropMatcher
Deterministic crop suitability matching based on supplied climate and soil data.

IMPORTANT:
- No synthetic training data.
- No fabricated default measurements.
- Suitability scores are rule-based compatibility indicators, NOT probabilities.
- Crop ranges are general references and require local agronomic validation.
"""

import logging
import math
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)


class ClimateCropMatcher:
    """Match crops against available climate and soil measurements."""

    def __init__(self):
        self.model = None

        # Compatibility fields for the existing health endpoint.
        # This service uses deterministic rules, not a trained ML model.
        self.is_ready = True
        self.is_trained = True
        self.model_source = "deterministic-rules"
        self.field_validated = False

        self.crop_database = {
            "wheat": {
                "name_ar": "القمح",
                "temp_range": (10, 25),
                "rainfall_range": (300, 800),
                "humidity_range": (40, 70),
                "soil_ph_range": (6.0, 7.5),
                "growing_season": "winter",
                "season_months": [10, 11, 12, 1, 2, 3],
                "water_requirement": "متوسط",
                "soil_types": ["Loamy", "Clay", "Silty"],
            },
            "corn": {
                "name_ar": "الذرة",
                "temp_range": (20, 30),
                "rainfall_range": (500, 1200),
                "humidity_range": (50, 80),
                "soil_ph_range": (6.0, 7.0),
                "growing_season": "summer",
                "season_months": [4, 5, 6, 7, 8, 9],
                "water_requirement": "عالي",
                "soil_types": ["Loamy", "Silty"],
            },
            "rice": {
                "name_ar": "الأرز",
                "temp_range": (25, 35),
                "rainfall_range": (1000, 2000),
                "humidity_range": (70, 90),
                "soil_ph_range": (5.5, 7.0),
                "growing_season": "summer",
                "season_months": [4, 5, 6, 7, 8, 9],
                "water_requirement": "عالي جداً",
                "soil_types": ["Clay", "Silty"],
            },
            "tomato": {
                "name_ar": "الطماطم",
                "temp_range": (18, 28),
                "rainfall_range": (400, 800),
                "humidity_range": (60, 80),
                "soil_ph_range": (6.0, 7.0),
                "growing_season": "spring_summer",
                "season_months": [3, 4, 5, 6, 7, 8],
                "water_requirement": "متوسط إلى عالي",
                "soil_types": ["Loamy", "Sandy", "Silty"],
            },
            "potato": {
                "name_ar": "البطاطس",
                "temp_range": (15, 25),
                "rainfall_range": (400, 700),
                "humidity_range": (50, 75),
                "soil_ph_range": (5.5, 6.5),
                "growing_season": "spring_fall",
                "season_months": [2, 3, 4, 9, 10, 11],
                "water_requirement": "متوسط",
                "soil_types": ["Sandy", "Loamy"],
            },
            "onion": {
                "name_ar": "البصل",
                "temp_range": (12, 25),
                "rainfall_range": (300, 600),
                "humidity_range": (40, 70),
                "soil_ph_range": (6.0, 7.5),
                "growing_season": "winter_spring",
                "season_months": [10, 11, 12, 1, 2, 3, 4],
                "water_requirement": "منخفض إلى متوسط",
                "soil_types": ["Loamy", "Silty"],
            },
            "cucumber": {
                "name_ar": "الخيار",
                "temp_range": (20, 30),
                "rainfall_range": (400, 700),
                "humidity_range": (60, 85),
                "soil_ph_range": (6.0, 7.0),
                "growing_season": "spring_summer",
                "season_months": [3, 4, 5, 6, 7, 8],
                "water_requirement": "عالي",
                "soil_types": ["Loamy", "Sandy"],
            },
            "lettuce": {
                "name_ar": "الخس",
                "temp_range": (10, 20),
                "rainfall_range": (250, 500),
                "humidity_range": (50, 75),
                "soil_ph_range": (6.0, 7.0),
                "growing_season": "cool_season",
                "season_months": [9, 10, 11, 12, 1, 2, 3, 4],
                "water_requirement": "متوسط",
                "soil_types": ["Loamy", "Silty"],
            },
            "dates": {
                "name_ar": "التمور",
                "temp_range": (25, 40),
                "rainfall_range": (50, 300),
                "humidity_range": (30, 60),
                "soil_ph_range": (7.0, 8.5),
                "growing_season": "perennial",
                "season_months": list(range(1, 13)),
                "water_requirement": "متوسط",
                "soil_types": ["Sandy", "Loamy"],
            },
            "olive": {
                "name_ar": "الزيتون",
                "temp_range": (15, 30),
                "rainfall_range": (400, 800),
                "humidity_range": (40, 70),
                "soil_ph_range": (6.5, 8.0),
                "growing_season": "perennial",
                "season_months": list(range(1, 13)),
                "water_requirement": "منخفض إلى متوسط",
                "soil_types": ["Loamy", "Chalky", "Sandy"],
            },
        }

        logger.info(
            "ClimateCropMatcher initialized using deterministic rules"
        )

    # ---------------------------------------------------------
    # Input validation
    # ---------------------------------------------------------

    @staticmethod
    def _read_number(
        data: Dict[str, Any],
        keys: Tuple[str, ...],
        field_name: str,
        minimum: float,
        maximum: float,
    ) -> Optional[float]:
        """Read and validate a numeric measurement without inventing it."""

        for key in keys:
            if key not in data or data[key] is None:
                continue

            value = data[key]

            if isinstance(value, bool):
                raise ValueError(f"{field_name} must be numeric")

            try:
                number = float(value)
            except (TypeError, ValueError):
                raise ValueError(f"{field_name} must be numeric")

            if not math.isfinite(number):
                raise ValueError(f"{field_name} must be finite")

            if not minimum <= number <= maximum:
                raise ValueError(
                    f"{field_name} must be between {minimum} and {maximum}"
                )

            return number

        return None

    @staticmethod
    def _normalize_soil_type(value: Any) -> Optional[str]:
        if value is None:
            return None

        if not isinstance(value, str):
            raise ValueError("soil_type must be a string")

        normalized = value.strip().lower()

        aliases = {
            "loam": "Loamy",
            "loamy": "Loamy",
            "طمي": "Loamy",
            "طينية": "Clay",
            "clay": "Clay",
            "silty": "Silty",
            "silt": "Silty",
            "غرينية": "Silty",
            "sandy": "Sandy",
            "sand": "Sandy",
            "رملية": "Sandy",
            "chalky": "Chalky",
            "كلسية": "Chalky",
        }

        if normalized not in aliases:
            raise ValueError(
                "Unsupported soil_type. Supported types: "
                "Loamy, Clay, Silty, Sandy, Chalky"
            )

        return aliases[normalized]

    # ---------------------------------------------------------
    # Suitability calculations
    # ---------------------------------------------------------

    @staticmethod
    def _score_range(
        value: float,
        acceptable_range: Tuple[float, float],
        tolerance: float,
    ) -> Dict[str, Any]:
        """
        Compare a measurement with a crop reference range.

        1.0 = within reference range
        0.7 = slightly outside reference range
        0.0 = significantly outside reference range

        These are rule-based indicators, not probabilities.
        """

        minimum, maximum = acceptable_range

        if minimum <= value <= maximum:
            return {
                "status": "optimal",
                "score": 1.0,
                "reference_range": [minimum, maximum],
            }

        if minimum - tolerance <= value < minimum:
            return {
                "status": "acceptable",
                "score": 0.7,
                "reference_range": [minimum, maximum],
            }

        if maximum < value <= maximum + tolerance:
            return {
                "status": "acceptable",
                "score": 0.7,
                "reference_range": [minimum, maximum],
            }

        return {
            "status": "unsuitable",
            "score": 0.0,
            "reference_range": [minimum, maximum],
        }

    def _analyze_crop_suitability(
        self,
        crop_info: Dict[str, Any],
        temp: Optional[float],
        rainfall: Optional[float],
        humidity: Optional[float],
        ph: Optional[float],
        soil_type: Optional[str] = None,
    ) -> Dict[str, Any]:

        analysis = {}
        evaluated_scores = []

        factors = [
            (
                "temperature",
                temp,
                crop_info["temp_range"],
                5,
            ),
            (
                "rainfall",
                rainfall,
                crop_info["rainfall_range"],
                20,
            ),
            (
                "humidity",
                humidity,
                crop_info["humidity_range"],
                10,
            ),
            (
                "soil_ph",
                ph,
                crop_info["soil_ph_range"],
                0.5,
            ),
        ]

        for factor_name, value, reference_range, tolerance in factors:
            if value is None:
                analysis[factor_name] = {
                    "status": "not_provided",
                    "score": None,
                    "reference_range": list(reference_range),
                }
                continue

            result = self._score_range(
                value,
                reference_range,
                tolerance,
            )

            analysis[factor_name] = result
            evaluated_scores.append(result["score"])

        # Soil type is only evaluated when the user supplied it.
        if soil_type is not None:
            compatible_types = crop_info["soil_types"]
            is_compatible = soil_type in compatible_types

            soil_score = 1.0 if is_compatible else 0.0

            analysis["soil_type"] = {
                "status": (
                    "compatible" if is_compatible else "not_recommended"
                ),
                "score": soil_score,
                "provided_type": soil_type,
                "suitable_types": compatible_types,
            }

            evaluated_scores.append(soil_score)
        else:
            analysis["soil_type"] = {
                "status": "not_provided",
                "score": None,
                "suitable_types": crop_info["soil_types"],
            }

        if not evaluated_scores:
            raise ValueError(
                "At least one valid climate or soil measurement is required"
            )

        overall_score = sum(evaluated_scores) / len(evaluated_scores)

        if overall_score >= 0.8:
            level = "عالية"
        elif overall_score >= 0.6:
            level = "متوسطة"
        else:
            level = "منخفضة"

        analysis["overall"] = {
            "score": round(overall_score, 3),
            "score_percentage": round(overall_score * 100, 1),
            "level": level,
            "evaluated_factors": len(evaluated_scores),
            "score_type": "rule_based_compatibility",
            "is_probability": False,
        }

        return analysis

    # ---------------------------------------------------------
    # Main matching method
    # ---------------------------------------------------------

    def match_crops_to_climate(
        self,
        climate_data: Dict[str, Any],
        soil_data: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:

        if not isinstance(climate_data, dict):
            raise ValueError("climate_data must be an object")

        if soil_data is None:
            soil_data = {}

        if not isinstance(soil_data, dict):
            raise ValueError("soil_data must be an object")

        temp = self._read_number(
            climate_data,
            ("temperature", "temperature_c"),
            "temperature",
            -10,
            60,
        )

        rainfall = self._read_number(
            climate_data,
            ("annual_rainfall", "annual_rainfall_mm", "rainfall_mm"),
            "annual_rainfall",
            0,
            10000,
        )

        humidity = self._read_number(
            climate_data,
            ("humidity", "relative_humidity"),
            "humidity",
            0,
            100,
        )

        ph = self._read_number(
            soil_data,
            ("ph", "soil_ph"),
            "soil_ph",
            0,
            14,
        )

        soil_type = self._normalize_soil_type(
            soil_data.get("soil_type")
        )

        supplied_measurements = {
            "temperature": temp,
            "annual_rainfall": rainfall,
            "humidity": humidity,
            "soil_ph": ph,
            "soil_type": soil_type,
        }

        available_count = sum(
            value is not None for value in supplied_measurements.values()
        )

        if available_count == 0:
            raise ValueError(
                "No usable measurements supplied. Provide at least one of: "
                "temperature, annual_rainfall, humidity, soil pH or soil_type."
            )

        suitable_crops = []

        for crop_name, crop_info in self.crop_database.items():
            analysis = self._analyze_crop_suitability(
                crop_info=crop_info,
                temp=temp,
                rainfall=rainfall,
                humidity=humidity,
                ph=ph,
                soil_type=soil_type,
            )

            score = analysis["overall"]["score"]

            suitable_crops.append({
                "crop": crop_name,
                "name_ar": crop_info["name_ar"],
                "suitability_score": score,
                "suitability_percentage": round(score * 100, 1),
                "score_type": "rule_based_compatibility",
                "analysis": analysis,
                "growing_season": crop_info["growing_season"],
                "water_requirement": crop_info["water_requirement"],
                "suitable_soil_types": crop_info["soil_types"],
            })

        suitable_crops.sort(
            key=lambda item: item["suitability_score"],
            reverse=True,
        )

        top_crops = suitable_crops[:5]

        climate_analysis = self._analyze_climate_conditions(
            climate_data,
            temp,
            rainfall,
            humidity,
        )

        current_month = datetime.now().month

        seasonal_recommendations = self._get_seasonal_recommendations(
            current_month,
            top_crops,
        )

        return {
            "suitable_crops": top_crops,
            "climate_analysis": climate_analysis,
            "seasonal_recommendations": seasonal_recommendations,
            "best_crop": top_crops[0] if top_crops else None,
            "analysis_timestamp": datetime.now(timezone.utc).isoformat(),
            "model_source": self.model_source,
            "data_source": "user_supplied_input",
            "is_real_data": False,
            "measurement_verified": False,
            "provided_measurements": supplied_measurements,
            "measurement_count": available_count,
            "score_explanation": (
                "Scores represent rule-based compatibility with general "
                "crop reference ranges. They are not probabilities, "
                "yield predictions or scientifically validated field results."
            ),
            "disclaimer": (
                "Recommendations are indicative only. Local climate history, "
                "soil laboratory analysis, irrigation availability, variety, "
                "planting date and local agronomic advice should be considered."
            ),
        }

    # ---------------------------------------------------------
    # Climate analysis
    # ---------------------------------------------------------

    def _analyze_climate_conditions(
        self,
        climate_data: Dict[str, Any],
        temp: Optional[float] = None,
        rainfall: Optional[float] = None,
        humidity: Optional[float] = None,
    ) -> Dict[str, Any]:

        analysis = {
            "provided_factors": [],
            "missing_factors": [],
        }

        values = {
            "temperature": temp,
            "annual_rainfall": rainfall,
            "humidity": humidity,
        }

        for name, value in values.items():
            if value is None:
                analysis["missing_factors"].append(name)
            else:
                analysis["provided_factors"].append(name)

        if temp is not None and rainfall is not None:
            if temp > 30 and rainfall < 300:
                climate_type = "صحراوي حار"
            elif temp > 25 and 300 <= rainfall < 800:
                climate_type = "شبه جاف"
            elif temp > 25 and rainfall >= 800:
                climate_type = "رطب ودافئ"
            elif 15 <= temp <= 25 and 400 <= rainfall <= 1000:
                climate_type = "معتدل"
            elif temp < 15 and rainfall > 600:
                climate_type = "بارد ورطب"
            else:
                climate_type = "متنوع"

            analysis["climate_type"] = climate_type
        else:
            analysis["climate_type"] = "غير محدد - بيانات مناخية ناقصة"

        if temp is not None:
            if temp >= 25:
                analysis["primary_season"] = "صيفي"
            elif temp >= 15:
                analysis["primary_season"] = "ربيعي/خريفي"
            else:
                analysis["primary_season"] = "شتوي"
        else:
            analysis["primary_season"] = "غير محدد"

        if rainfall is not None:
            if rainfall < 300:
                water_status = "أمطار سنوية منخفضة - يلزم تقييم مياه الري"
            elif rainfall < 600:
                water_status = "أمطار محدودة - قد يلزم ري تكميلي"
            elif rainfall < 1200:
                water_status = "أمطار متوسطة إلى مرتفعة"
            else:
                water_status = "أمطار مرتفعة - يجب تقييم الصرف"

            analysis["water_status"] = water_status
        else:
            analysis["water_status"] = "غير محدد - الأمطار السنوية غير متوفرة"

        return analysis

    # ---------------------------------------------------------
    # Seasonal recommendations
    # ---------------------------------------------------------

    def _get_seasonal_recommendations(
        self,
        current_month: int,
        suitable_crops: List[Dict[str, Any]],
    ) -> Dict[str, Any]:

        recommendations = {
            "current_month_crops": [],
            "next_season_crops": [],
            "year_round_crops": [],
        }

        for crop in suitable_crops:
            crop_info = self.crop_database[crop["crop"]]
            season_months = crop_info["season_months"]

            item = {
                "crop": crop["name_ar"],
                "english_name": crop["crop"],
                "suitability_score": crop["suitability_score"],
                "suitability_percentage": crop["suitability_percentage"],
            }

            if crop_info["growing_season"] == "perennial":
                item["timing"] = "محصول دائم؛ موعد الغراسة يتطلب تقييماً محلياً"
                recommendations["year_round_crops"].append(item)

            elif current_month in season_months:
                item["timing"] = "الشهر الحالي ضمن الأشهر المرجعية للمحصول"
                recommendations["current_month_crops"].append(item)

            else:
                # Find the next planting month, including next year.
                future_months = [
                    ((month - current_month) % 12, month)
                    for month in season_months
                    if (month - current_month) % 12 != 0
                ]

                if future_months:
                    _, next_month = min(future_months)

                    item["next_suitable_month"] = next_month
                    item["timing"] = (
                        f"الشهر المرجعي القادم للزراعة: {next_month}"
                    )

                    recommendations["next_season_crops"].append(item)

        return recommendations

    # ---------------------------------------------------------
    # Crop information
    # ---------------------------------------------------------

    def get_crop_requirements(self, crop_name: str) -> Dict[str, Any]:

        crop_name = crop_name.strip().lower()

        if crop_name not in self.crop_database:
            raise ValueError(
                f"Crop '{crop_name}' not found in database"
            )

        crop_info = self.crop_database[crop_name]

        return {
            "crop": crop_name,
            "name_ar": crop_info["name_ar"],
            "climate_requirements": {
                "temperature_range": crop_info["temp_range"],
                "rainfall_range": crop_info["rainfall_range"],
                "humidity_range": crop_info["humidity_range"],
                "soil_ph_range": crop_info["soil_ph_range"],
            },
            "growing_info": {
                "growing_season": crop_info["growing_season"],
                "suitable_months": crop_info["season_months"],
                "water_requirement": crop_info["water_requirement"],
                "suitable_soil_types": crop_info["soil_types"],
            },
            "source": "general_reference_ranges",
            "field_validated": False,
        }

    def get_supported_crops(self) -> List[Dict[str, str]]:
        return [
            {
                "crop": crop_name,
                "name_ar": crop_info["name_ar"],
            }
            for crop_name, crop_info in self.crop_database.items()
        ]


def create_climate_crop_matcher() -> ClimateCropMatcher:
    """Factory function used by main.py."""
    return ClimateCropMatcher()
