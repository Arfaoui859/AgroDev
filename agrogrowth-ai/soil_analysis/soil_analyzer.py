"""
AgroGrowth soil screening engine.
Transparent deterministic rules only; no synthetic training or invented data.
"""
import logging
import math
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


class SoilAnalyzerAI:
    def __init__(self):
        self.model_source = "deterministic-rules"
        self.is_ready = True
        self.field_validated = False
        self.is_trained = False  # No ML model is trained in this engine.

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
        self.assessable_properties = {
            "ph", "nitrogen", "phosphorus", "potassium",
            "organic_matter", "moisture", "salinity",
        }
        self.unit_dependent_properties = {"nitrogen", "phosphorus", "potassium"}
        self.soil_classes = ["Sandy", "Loamy", "Clay", "Silty", "Peaty", "Chalky"]

    def _validate_input_data(self, data: Dict[str, Any]) -> Dict[str, float]:
        if not isinstance(data, dict) or not data:
            raise ValueError("Soil input data cannot be empty.")
        validated = {}
        for prop, raw in data.items():
            if prop not in self.property_ranges:
                raise ValueError(f"Unsupported soil property: {prop}")
            if isinstance(raw, bool) or raw is None:
                raise ValueError(f"Invalid numeric value for {prop}.")
            try:
                value = float(raw)
            except (TypeError, ValueError):
                raise ValueError(f"Invalid numeric value for {prop}.")
            if not math.isfinite(value):
                raise ValueError(f"Non-finite value for {prop}.")
            low, high = self.property_ranges[prop]
            if not low <= value <= high:
                raise ValueError(f"{prop} must be between {low} and {high}.")
            validated[prop] = value
        if not any(k in self.assessable_properties for k in validated):
            raise ValueError("At least one assessable soil property is required.")
        return validated

    def _assess_property_status(self, name: str, value: float) -> str:
        # NPK cannot be interpreted safely without unit + extraction method.
        if name in self.unit_dependent_properties:
            return "requires_unit_and_lab_method"
        if name == "ph":
            if 6.0 <= value <= 7.0: return "optimal"
            if 5.5 <= value < 6.0 or 7.0 < value <= 7.5: return "acceptable"
            return "needs_attention"
        if name == "organic_matter":
            if value >= 3.0: return "optimal"
            if value >= 1.5: return "acceptable"
            return "needs_attention"
        if name == "moisture":
            if 40 <= value <= 70: return "optimal"
            if 20 <= value < 40 or 70 < value <= 85: return "acceptable"
            return "needs_attention"
        if name == "salinity":
            if value <= 2.0: return "optimal"
            if value <= 4.0: return "acceptable"
            return "needs_attention"
        return "not_assessed"

    def _get_property_recommendations(self, name: str, value: float) -> List[str]:
        if name in self.unit_dependent_properties:
            return ["لا يمكن تفسير هذه القيمة دون معرفة الوحدة وطريقة التحليل المخبري."]
        if name == "ph" and value < 6.0:
            return ["تحقق من حموضة التربة مخبرياً قبل اختيار أي مادة لتعديلها."]
        if name == "ph" and value > 7.5:
            return ["تحقق من قلوية التربة مخبرياً قبل اختيار أي معالجة."]
        if name == "organic_matter" and value < 3.0:
            return ["يمكن دراسة استعمال الكمبوست الناضج ومحاصيل التغطية بعد تقييم التربة."]
        if name == "moisture" and value < 40:
            return ["تحقق من احتياجات المحصول ورطوبة منطقة الجذور قبل تعديل برنامج الري."]
        if name == "moisture" and value > 70:
            return ["تحقق من الصرف ورطوبة منطقة الجذور قبل تعديل الري."]
        if name == "salinity" and value > 2.0:
            return ["تحقق مخبرياً من ملوحة التربة ومياه الري قبل اختيار المعالجة."]
        if name == "temperature":
            return ["درجة الحرارة وحدها لا تكفي لتقييم جودة التربة."]
        return []

    def _calculate_soil_health_score(self, data: Dict[str, float]) -> Optional[float]:
        # Only properties with defensible generic screening rules contribute.
        score_map = {"optimal": 100.0, "acceptable": 70.0, "needs_attention": 40.0}
        scores = [
            score_map[self._assess_property_status(k, v)]
            for k, v in data.items()
            if k in {"ph", "organic_matter", "moisture", "salinity"}
            and self._assess_property_status(k, v) in score_map
        ]
        return round(sum(scores) / len(scores), 2) if scores else None

    def _assess_fertility_level(self, data: Dict[str, float]) -> str:
        score = self._calculate_soil_health_score(data)
        if score is None:
            return "بيانات غير كافية"
        if score >= 80: return "مؤشر إرشادي مرتفع"
        if score >= 60: return "مؤشر إرشادي متوسط"
        if score >= 40: return "مؤشر إرشادي منخفض"
        return "مؤشر إرشادي منخفض جداً"

    def _get_overall_recommendations(self, data: Dict[str, float],
                                     soil_type: Optional[str] = None) -> List[str]:
        recommendations = ["هذه النتيجة فحص إرشادي وليست تحليلاً مخبرياً أو تشخيصاً زراعياً."]
        missing = sorted(self.assessable_properties - set(data))
        if missing:
            recommendations.append("خصائص غير متوفرة: " + ", ".join(missing))
        if self.unit_dependent_properties.intersection(data):
            recommendations.append(
                "قيم NPK معروضة كما أدخلها المستخدم، ولم تدخل في التقييم "
                "لغياب الوحدة وطريقة الاستخلاص/التحليل."
            )
        recommendations.append(
            "للتسميد واتخاذ القرار، اعتمد تحليلاً مخبرياً يذكر الوحدات "
            "وطريقة القياس واحتياجات المحصول."
        )
        return recommendations

    def analyze_soil_properties(self, sensor_data: Dict[str, Any]) -> Dict[str, Any]:
        validated = self._validate_input_data(sensor_data)
        properties = {}
        for name, value in validated.items():
            properties[name] = {
                "current_value": value,
                "predicted_optimal": None,
                "status": self._assess_property_status(name, value),
                "recommendations": self._get_property_recommendations(name, value),
                "source": "user_supplied_input",
                "unit": None,
                "measurement_method": None,
            }

        score = self._calculate_soil_health_score(validated)
        # Texture cannot be inferred from pH/NPK/moisture values.
        return {
            "soil_type": {
                "classification": "Unknown",
                "confidence": 0.0,
                "status": "insufficient_texture_data",
                "message": "يلزم قياس نسب الرمل والطمي والطين لتحديد قوام التربة.",
            },
            "properties": properties,
            "health_score": score,
            "fertility_level": self._assess_fertility_level(validated),
            "overall_recommendations": self._get_overall_recommendations(validated),
            "analysis_timestamp": datetime.now(timezone.utc).isoformat(),
            "data_source": "user_supplied_input",
            "is_real_data": None,
            "model_source": self.model_source,
            "measurement_verified": False,
            "score_type": "indicative_rule_based_screening",
            "score_available": score is not None,
            "evaluated_properties": list(validated),
            "measurement_count": len(validated),
            "disclaimer": (
                "مؤشر إرشادي محدود وليس قياساً علمياً لصحة أو خصوبة التربة. "
                "لا تُفسّر قيم NPK دون وحدات وطريقة تحليل معروفتين. "
                "المدخلات غير متحقّق منها مخبرياً."
            ),
        }


def create_soil_analyzer() -> SoilAnalyzerAI:
    return SoilAnalyzerAI()
