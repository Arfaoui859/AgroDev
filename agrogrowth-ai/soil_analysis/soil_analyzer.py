
"""
AgroGrowth Soil Analysis AI
Deterministic soil analysis engine.

This engine evaluates user-supplied measurements using transparent
indicative rules. It does not train on synthetic data, predict missing
measurements, or claim laboratory/field validation.
"""

import logging
import math
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


class SoilAnalyzerAI:
    """Rule-based soil screening engine."""

    def __init__(self):
        # Engine metadata
        self.model_source = "deterministic-rules"
        self.is_ready = True

        # Compatibility with existing health-check code.
        # This does NOT mean a machine-learning model was trained.
        self.is_trained = True

        # No field validation has been established.
        self.field_validated = False

        # Expected input ranges.
        # N, P and K are interpreted as mg/kg only when the
        # measurement method and units supplied by the user support that.
        self.property_ranges = {
            "ph": (3.0, 10.0),
            "nitrogen": (0.0, 500.0),
            "phosphorus": (0.0, 200.0),
            "potassium": (0.0, 1000.0),
            "organic_matter": (0.0, 20.0),
            "moisture": (0.0, 100.0),
            "salinity": (0.0, 20.0),
            "temperature": (-10.0, 50.0),
        }

        self.soil_classes = [
            "Sandy", "Loamy", "Clay", "Silty", "Peaty", "Chalky"
        ]

        self.assessable_properties = {
            "ph",
            "nitrogen",
            "phosphorus",
            "potassium",
            "organic_matter",
            "moisture",
            "salinity",
        }

        logger.info(
            "SoilAnalyzerAI initialized with deterministic rules"
        )

    # --------------------------------------------------
    # INPUT VALIDATION
    # --------------------------------------------------

    def _validate_input_data(
        self,
        data: Dict[str, float]
    ) -> Dict[str, float]:

        if not isinstance(data, dict) or not data:
            raise ValueError("Soil input data cannot be empty.")

        validated = {}

        for prop, raw_value in data.items():

            if prop not in self.property_ranges:
                raise ValueError(
                    f"Unsupported soil property: {prop}"
                )

            if isinstance(raw_value, bool):
                raise ValueError(
                    f"Invalid numeric value for {prop}."
                )

            try:
                value = float(raw_value)
            except (TypeError, ValueError):
                raise ValueError(
                    f"Invalid numeric value for {prop}."
                )

            if not math.isfinite(value):
                raise ValueError(
                    f"Non-finite value for {prop}."
                )

            min_value, max_value = self.property_ranges[prop]

            if not min_value <= value <= max_value:
                raise ValueError(
                    f"{prop} must be between "
                    f"{min_value} and {max_value}."
                )

            validated[prop] = value

        if not any(
            prop in self.assessable_properties
            for prop in validated
        ):
            raise ValueError(
                "At least one assessable soil property is required."
            )

        return validated

    # --------------------------------------------------
    # PROPERTY STATUS
    # --------------------------------------------------

    def _assess_property_status(
        self,
        property_name: str,
        value: float
    ) -> str:

        if property_name == "ph":
            if 6.0 <= value <= 7.0:
                return "optimal"
            if 5.5 <= value < 6.0 or 7.0 < value <= 7.5:
                return "acceptable"
            return "needs_attention"

        if property_name == "nitrogen":
            if value >= 50:
                return "optimal"
            if value >= 25:
                return "acceptable"
            return "needs_attention"

        if property_name == "phosphorus":
            if value >= 20:
                return "optimal"
            if value >= 10:
                return "acceptable"
            return "needs_attention"

        if property_name == "potassium":
            if value >= 100:
                return "optimal"
            if value >= 50:
                return "acceptable"
            return "needs_attention"

        if property_name == "organic_matter":
            if value >= 3.0:
                return "optimal"
            if value >= 1.5:
                return "acceptable"
            return "needs_attention"

        if property_name == "moisture":
            if 40 <= value <= 70:
                return "optimal"
            if 20 <= value < 40 or 70 < value <= 85:
                return "acceptable"
            return "needs_attention"

        if property_name == "salinity":
            if value <= 2.0:
                return "optimal"
            if value <= 4.0:
                return "acceptable"
            return "needs_attention"

        if property_name == "temperature":
            return "not_assessed"

        return "not_assessed"

    # --------------------------------------------------
    # PROPERTY RECOMMENDATIONS
    # --------------------------------------------------

    def _get_property_recommendations(
        self,
        property_name: str,
        value: float
    ) -> List[str]:

        recommendations = []

        if property_name == "ph":
            if value < 6.0:
                recommendations.append(
                    "تحقق من حموضة التربة مخبرياً قبل اختيار أي مادة لتعديلها."
                )
            elif value > 7.5:
                recommendations.append(
                    "تحقق من قلوية التربة ومصدرها مخبرياً قبل المعالجة."
                )

        elif property_name in {
            "nitrogen", "phosphorus", "potassium"
        }:
            status = self._assess_property_status(
                property_name, value
            )

            if status == "needs_attention":
                recommendations.append(
                    "يُنصح بتحليل مخبري للعناصر الغذائية قبل تحديد نوع السماد أو كميته."
                )

        elif property_name == "organic_matter":
            if value < 3.0:
                recommendations.extend([
                    "يمكن دراسة استعمال الكمبوست الناضج بعد تقييم جودة التربة.",
                    "يمكن اعتماد محاصيل التغطية للمساعدة على تحسين المادة العضوية."
                ])

        elif property_name == "moisture":
            if value < 40:
                recommendations.append(
                    "تحقق من احتياجات المحصول ونظام الري قبل تعديل برنامج السقي."
                )
            elif value > 70:
                recommendations.append(
                    "تحقق من الصرف ورطوبة منطقة الجذور قبل زيادة أو تقليل الري."
                )

        elif property_name == "salinity":
            if value > 2.0:
                recommendations.append(
                    "تحقق من ملوحة التربة ومياه الري مخبرياً قبل اختيار طريقة المعالجة."
                )

        elif property_name == "temperature":
            recommendations.append(
                "درجة الحرارة وحدها لا تكفي لتقييم جودة التربة."
            )

        return recommendations

    # --------------------------------------------------
    # HEALTH SCORE
    # --------------------------------------------------

    def _calculate_soil_health_score(
        self,
        data: Dict[str, float]
    ) -> float:

        scores = []

        for prop in self.assessable_properties:

            if prop not in data:
                continue

            status = self._assess_property_status(
                prop,
                data[prop]
            )

            if status == "optimal":
                scores.append(100.0)
            elif status == "acceptable":
                scores.append(70.0)
            elif status == "needs_attention":
                scores.append(40.0)

        if not scores:
            return 0.0

        return round(sum(scores) / len(scores), 2)

    def _assess_fertility_level(
        self,
        data: Dict[str, float]
    ) -> str:

        if not any(
            prop in data
            for prop in self.assessable_properties
        ):
            return "بيانات غير كافية"

        score = self._calculate_soil_health_score(data)

        if score >= 80:
            return "عالية"
        if score >= 60:
            return "متوسطة"
        if score >= 40:
            return "منخفضة"

        return "ضعيفة جداً"

    # --------------------------------------------------
    # GENERAL RECOMMENDATIONS
    # --------------------------------------------------

    def _get_overall_recommendations(
        self,
        data: Dict[str, float],
        soil_type: Optional[str] = None
    ) -> List[str]:

        recommendations = [
            "هذه النتيجة تقييم إرشادي وليست تحليلاً مخبرياً للتربة."
        ]

        if len(data) < len(self.assessable_properties):
            missing = sorted(
                self.assessable_properties - set(data.keys())
            )

            recommendations.append(
                "البيانات غير مكتملة. الخصائص غير المتوفرة: "
                + ", ".join(missing)
            )

        if any(
            prop in data
            for prop in ("nitrogen", "phosphorus", "potassium")
        ):
            recommendations.append(
                "يجب التأكد من طريقة قياس العناصر الغذائية ووحداتها "
                "قبل اتخاذ قرار بالتسميد."
            )

        recommendations.append(
            "للحصول على توصيات زراعية دقيقة، يُنصح بتحليل مخبري "
            "يشمل خصائص التربة واحتياجات المحصول."
        )

        return recommendations

    # --------------------------------------------------
    # MAIN ANALYSIS
    # --------------------------------------------------

    def analyze_soil_properties(
        self,
        sensor_data: Dict[str, float]
    ) -> Dict[str, Any]:

        try:
            validated_data = self._validate_input_data(sensor_data)

            property_analysis = {}

            for prop, current_value in validated_data.items():

                status = self._assess_property_status(
                    prop,
                    current_value
                )

                property_analysis[prop] = {
                    "current_value": current_value,
                    "predicted_optimal": None,
                    "status": status,
                    "recommendations": (
                        self._get_property_recommendations(
                            prop,
                            current_value
                        )
                    ),
                    "source": "user_supplied_input",
                }

            health_score = self._calculate_soil_health_score(
                validated_data
            )

            fertility_level = self._assess_fertility_level(
                validated_data
            )

            # Soil texture cannot be reliably inferred from pH,
            # NPK, moisture or salinity alone.
            soil_type = {
                "classification": "Unknown",
                "confidence": 0.0,
                "status": "insufficient_texture_data",
                "message": (
                    "Sand, silt and clay percentage measurements "
                    "are required for soil texture classification."
                ),
            }

            result = {
                "soil_type": soil_type,
                "properties": property_analysis,
                "health_score": health_score,
                "fertility_level": fertility_level,
                "overall_recommendations": (
                    self._get_overall_recommendations(
                        validated_data
                    )
                ),
                "analysis_timestamp": datetime.now(
                    timezone.utc
                ).isoformat(),

                "data_source": "user_supplied_input",
                "is_real_data": False,
                "model_source": self.model_source,
                "measurement_verified": False,

                "score_type": "indicative_rule_based_screening",
                "evaluated_properties": list(validated_data.keys()),
                "measurement_count": len(validated_data),

                "disclaimer": (
                    "This is an indicative rule-based screening, "
                    "not a laboratory soil test or a field-validated "
                    "machine-learning prediction. Thresholds can vary "
                    "with crop, soil type, laboratory extraction method "
                    "and measurement units."
                ),
            }

            logger.info(
                "Soil screening completed using deterministic rules. "
                "Evaluated properties: %s",
                list(validated_data.keys())
            )

            return result

        except Exception:
            logger.exception("Error in soil analysis")
            raise


# --------------------------------------------------
# FACTORY
# --------------------------------------------------

def create_soil_analyzer() -> SoilAnalyzerAI:
    """Create and return the deterministic soil analyzer."""

    return SoilAnalyzerAI()
