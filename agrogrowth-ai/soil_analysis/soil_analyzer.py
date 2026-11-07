
"""
AgroGrowth Soil Screening Engine.

Transparent deterministic rules only.
No synthetic training, fabricated measurements or unverified ML predictions.

Important:
- This is a screening engine, not a trained ML model.
- Soil health score is an indicative rule-based indicator.
- NPK and salinity are excluded from the score until units and methods
  are explicitly supported.
"""

import logging
import math
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


class SoilAnalyzerAI:

    def __init__(self):
        self.model = None
        self.model_source = "deterministic-rules"
        self.is_ready = True
        self.field_validated = False
        self.is_trained = False

        self.property_ranges = {
            "ph": (3.0, 10.0),
            "nitrogen": (0.0, 500.0),
            "phosphorus": (0.0, 200.0),
            "potassium": (0.0, 1000.0),
            "organic_matter": (0.0, 20.0),
            "moisture": (0.0, 100.0),
            "salinity": (0.0, 20.0),
            "temperature": (-10.0, 50.0),
            "sand": (0.0, 100.0),
            "silt": (0.0, 100.0),
            "clay": (0.0, 100.0),
        }

        self.assessable_properties = {
            "ph",
            "nitrogen",
            "phosphorus",
            "potassium",
            "organic_matter",
            "moisture",
            "salinity",
        }

        self.texture_properties = {"sand", "silt", "clay"}

        self.unit_dependent_properties = {
            "nitrogen",
            "phosphorus",
            "potassium",
        }

        # Only these three indicators are currently eligible
        # for the indicative score.
        #
        # Salinity is excluded because its interpretation depends
        # on the unit and measurement method.
        self.score_properties = {
            "ph",
            "organic_matter",
            "moisture",
        }

        # Require all three indicators before publishing a score.
        self.minimum_score_properties = 3

        self.soil_classes = [
            "Sand",
            "Loamy Sand",
            "Sandy Loam",
            "Loam",
            "Silt Loam",
            "Silt",
            "Sandy Clay Loam",
            "Clay Loam",
            "Silty Clay Loam",
            "Sandy Clay",
            "Silty Clay",
            "Clay",
        ]

    # -----------------------------------------------------
    # Validation
    # -----------------------------------------------------

    def _validate_input_data(
        self,
        data: Dict[str, Any],
    ) -> Dict[str, float]:

        if not isinstance(data, dict) or not data:
            raise ValueError("Soil input data cannot be empty.")

        validated = {}

        for prop, raw in data.items():

            if prop not in self.property_ranges:
                raise ValueError(
                    f"Unsupported soil property: {prop}"
                )

            if isinstance(raw, bool) or raw is None:
                raise ValueError(
                    f"Invalid numeric value for {prop}."
                )

            try:
                value = float(raw)
            except (TypeError, ValueError):
                raise ValueError(
                    f"Invalid numeric value for {prop}."
                )

            if not math.isfinite(value):
                raise ValueError(
                    f"Non-finite value for {prop}."
                )

            low, high = self.property_ranges[prop]

            if not low <= value <= high:
                raise ValueError(
                    f"{prop} must be between {low} and {high}."
                )

            validated[prop] = value

        has_assessable = any(
            key in self.assessable_properties
            for key in validated
        )

        has_texture = any(
            key in self.texture_properties
            for key in validated
        )

        if not has_assessable and not has_texture:
            raise ValueError(
                "At least one soil property is required."
            )

        texture_keys = self.texture_properties.intersection(validated)

        # Partial texture input is allowed, but classification
        # requires all three percentages.
        if len(texture_keys) == 3:
            total = sum(
                validated[key]
                for key in self.texture_properties
            )

            if not 99.0 <= total <= 101.0:
                raise ValueError(
                    "Sand, silt and clay must total 100%. "
                    f"Got {total:.2f}%."
                )

        return validated

    # -----------------------------------------------------
    # Soil texture classification
    # -----------------------------------------------------

    def _classify_soil_texture(
        self,
        data: Dict[str, float],
    ) -> Dict[str, Any]:

        required = {"sand", "silt", "clay"}

        if not required.issubset(data):
            missing = sorted(required - set(data))

            return {
                "classification": "Unknown",
                "confidence": None,
                "status": "insufficient_texture_data",
                "missing_measurements": missing,
                "message": (
                    "Sand, silt and clay measurements are required "
                    "for soil texture classification."
                ),
            }

        sand = data["sand"]
        silt = data["silt"]
        clay = data["clay"]

        total = sand + silt + clay

        if not 99.0 <= total <= 101.0:
            return {
                "classification": "Unknown",
                "confidence": None,
                "status": "invalid_texture_percentages",
                "message": (
                    "Texture percentages must total approximately 100%."
                ),
            }

        # Normalize small rounding differences.
        sand = sand * 100.0 / total
        silt = silt * 100.0 / total
        clay = clay * 100.0 / total

        # Approximate USDA texture triangle rules.
        # This is not a laboratory-certified classification.

        if clay >= 40:
            if silt >= 40:
                classification = "Silty Clay"
            elif sand >= 45:
                classification = "Sandy Clay"
            else:
                classification = "Clay"

        elif clay >= 27:
            if silt >= 40:
                classification = "Silty Clay Loam"
            elif sand >= 45:
                classification = "Sandy Clay Loam"
            else:
                classification = "Clay Loam"

        elif silt >= 80 and clay < 12:
            classification = "Silt"

        elif silt >= 50 and clay < 27:
            classification = "Silt Loam"

        elif sand >= 85 and (silt + 1.5 * clay) < 15:
            classification = "Sand"

        elif (
            (silt + 1.5 * clay) >= 15
            and (silt + 2 * clay) < 30
        ):
            classification = "Loamy Sand"

        elif 7 <= clay < 27 and 28 <= silt < 50:
            classification = "Loam"

        elif sand >= 52 and clay < 20:
            classification = "Sandy Loam"

        else:
            classification = "Loam"

        return {
            "classification": classification,
            "confidence": None,
            "status": "rule_based_classification",
            "method": "USDA texture triangle approximation",
            "percentages": {
                "sand": round(sand, 2),
                "silt": round(silt, 2),
                "clay": round(clay, 2),
            },
            "message": (
                "Classification based on supplied texture percentages. "
                "This is an approximation, not a laboratory result."
            ),
        }

    # -----------------------------------------------------
    # Property assessment
    # -----------------------------------------------------

    def _assess_property_status(
        self,
        name: str,
        value: float,
    ) -> str:

        if name in self.unit_dependent_properties:
            return "requires_unit_and_lab_method"

        if name == "salinity":
            return "requires_unit_and_lab_method"

        if name == "ph":
            if 6.0 <= value <= 7.0:
                return "optimal"

            if (
                5.5 <= value < 6.0
                or 7.0 < value <= 7.5
            ):
                return "acceptable"

            return "needs_attention"

        if name == "organic_matter":
            if value >= 3.0:
                return "optimal"

            if value >= 1.5:
                return "acceptable"

            return "needs_attention"

        if name == "moisture":
            if 40 <= value <= 70:
                return "optimal"

            if (
                20 <= value < 40
                or 70 < value <= 85
            ):
                return "acceptable"

            return "needs_attention"

        if name == "temperature":
            return "not_assessed"

        return "not_assessed"

    # -----------------------------------------------------
    # Property recommendations
    # -----------------------------------------------------

    def _get_property_recommendations(
        self,
        name: str,
        value: float,
    ) -> List[str]:

        if name in self.unit_dependent_properties:
            return [
                "لا يمكن تفسير هذه القيمة دون معرفة الوحدة "
                "وطريقة التحليل المخبري."
            ]

        if name == "salinity":
            return [
                "يلزم تحديد وحدة القياس وطريقة تحليل الملوحة "
                "قبل تفسير النتيجة."
            ]

        if name == "ph" and value < 6.0:
            return [
                "تحقق من حموضة التربة مخبرياً قبل اختيار "
                "أي مادة لتعديلها."
            ]

        if name == "ph" and value > 7.5:
            return [
                "تحقق من قلوية التربة مخبرياً قبل اختيار "
                "أي معالجة."
            ]

        if name == "organic_matter" and value < 3.0:
            return [
                "يمكن دراسة استعمال الكمبوست الناضج ومحاصيل "
                "التغطية بعد تقييم التربة."
            ]

        if name == "moisture" and value < 40:
            return [
                "تحقق من احتياجات المحصول ورطوبة منطقة الجذور "
                "قبل تعديل برنامج الري."
            ]

        if name == "moisture" and value > 70:
            return [
                "تحقق من الصرف ورطوبة منطقة الجذور "
                "قبل تعديل الري."
            ]

        if name == "temperature":
            return [
                "درجة الحرارة وحدها لا تكفي لتقييم جودة التربة."
            ]

        return []

    # -----------------------------------------------------
    # Indicative score
    # -----------------------------------------------------

    def _get_score_details(
        self,
        data: Dict[str, float],
    ) -> Dict[str, Any]:

        score_map = {
            "optimal": 100.0,
            "acceptable": 70.0,
            "needs_attention": 40.0,
        }

        evaluated = {}
        missing = []

        for name in sorted(self.score_properties):

            if name not in data:
                missing.append(name)
                continue

            status = self._assess_property_status(
                name,
                data[name],
            )

            if status not in score_map:
                missing.append(name)
                continue

            evaluated[name] = {
                "status": status,
                "score": score_map[status],
            }

        count = len(evaluated)
        required = self.minimum_score_properties

        if count < required:
            score = None
            status = "insufficient_data"
        else:
            score = round(
                sum(
                    item["score"]
                    for item in evaluated.values()
                ) / count,
                2,
            )
            status = "indicative_score_available"

        return {
            "score": score,
            "status": status,
            "score_type": "indicative_rule_based_screening",
            "evaluated_count": count,
            "required_count": required,
            "evaluated_properties": evaluated,
            "missing_properties": missing,
            "coverage_percentage": round(
                count / len(self.score_properties) * 100,
                1,
            ),
            "is_ml_prediction": False,
            "is_probability": False,
            "field_validated": False,
        }

    def _calculate_soil_health_score(
        self,
        data: Dict[str, float],
    ) -> Optional[float]:

        return self._get_score_details(data)["score"]

    def _assess_fertility_level(
        self,
        data: Dict[str, float],
    ) -> str:

        score = self._calculate_soil_health_score(data)

        if score is None:
            return "بيانات غير كافية"

        if score >= 80:
            return "مؤشر إرشادي مرتفع"

        if score >= 60:
            return "مؤشر إرشادي متوسط"

        if score >= 40:
            return "مؤشر إرشادي منخفض"

        return "مؤشر إرشادي منخفض جداً"

    # -----------------------------------------------------
    # Overall recommendations
    # -----------------------------------------------------

    def _get_overall_recommendations(
        self,
        data: Dict[str, float],
        soil_type: Optional[str] = None,
    ) -> List[str]:

        recommendations = [
            "هذه النتيجة فحص إرشادي وليست تحليلاً مخبرياً "
            "أو تشخيصاً زراعياً نهائياً."
        ]

        missing = sorted(
            self.assessable_properties - set(data)
        )

        if missing:
            recommendations.append(
                "خصائص غير متوفرة: " + ", ".join(missing)
            )

        score_missing = sorted(
            self.score_properties - set(data)
        )

        if score_missing:
            recommendations.append(
                "لا يمكن حساب المؤشر الإرشادي حالياً. "
                "الخصائص المطلوبة غير المتوفرة: "
                + ", ".join(score_missing)
            )

        if self.unit_dependent_properties.intersection(data):
            recommendations.append(
                "قيم NPK معروضة كما أدخلها المستخدم، "
                "ولم تدخل في التقييم لغياب الوحدة "
                "وطريقة الاستخلاص والتحليل."
            )

        if "salinity" in data:
            recommendations.append(
                "قيمة الملوحة لم تدخل في المؤشر بسبب "
                "عدم تحديد وحدة القياس وطريقة التحليل."
            )

        recommendations.append(
            "للتسميد واتخاذ القرار، اعتمد تحليلاً مخبرياً "
            "يذكر الوحدات وطريقة القياس واحتياجات المحصول."
        )

        return recommendations

    # -----------------------------------------------------
    # Main analysis
    # -----------------------------------------------------

    def analyze_soil_properties(
        self,
        sensor_data: Dict[str, Any],
    ) -> Dict[str, Any]:

        validated = self._validate_input_data(sensor_data)

        properties = {}

        for name, value in validated.items():

            is_texture = name in self.texture_properties

            properties[name] = {
                "current_value": value,
                "predicted_optimal": None,
                "status": (
                    "texture_measurement"
                    if is_texture
                    else self._assess_property_status(name, value)
                ),
                "recommendations": (
                    []
                    if is_texture
                    else self._get_property_recommendations(
                        name,
                        value,
                    )
                ),
                "source": "user_supplied_input",
                "unit": (
                    "%"
                    if is_texture
                    else None
                ),
                "measurement_method": None,
                "measurement_verified": False,
            }

        score_details = self._get_score_details(validated)
        score = score_details["score"]

        return {
            "soil_type": self._classify_soil_texture(validated),

            "properties": properties,

            "health_score": score,

            "fertility_level": self._assess_fertility_level(
                validated
            ),

            "overall_recommendations": (
                self._get_overall_recommendations(validated)
            ),

            "analysis_timestamp": (
                datetime.now(timezone.utc).isoformat()
            ),

            "data_source": "user_supplied_input",
            "is_real_data": None,
            "model_source": self.model_source,
            "model_trained": False,
            "measurement_verified": False,

            "score_type": (
                "indicative_rule_based_screening"
            ),

            "score_available": score is not None,
            "score_details": score_details,

            "evaluated_properties": list(validated),
            "measurement_count": len(validated),

            "disclaimer": (
                "مؤشر إرشادي محدود وليس قياساً علمياً "
                "لصحة أو خصوبة التربة. "
                "لا تُفسّر قيم NPK أو الملوحة دون وحدات "
                "وطريقة تحليل معروفتين. "
                "المدخلات غير متحقّق منها مخبرياً."
            ),
        }


def create_soil_analyzer() -> SoilAnalyzerAI:
    return SoilAnalyzerAI()
