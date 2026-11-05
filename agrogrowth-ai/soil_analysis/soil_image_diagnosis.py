
"""
SoilImageDiagnosisAI
Deterministic visual analysis of soil images.

IMPORTANT:
- No fake CNN or synthetic training.
- No random predictions.
- A normal RGB image cannot reliably establish soil texture,
  chemical composition, pH, NPK, organic matter or water content.
- Visual indicators are descriptive only, not laboratory measurements.
"""

import base64
import binascii
import io
import logging
import math
from datetime import datetime, timezone
from typing import Any, Dict, List, Union

import numpy as np
from PIL import Image, ImageOps, UnidentifiedImageError

logger = logging.getLogger(__name__)


class SoilImageDiagnosisAI:
    """Perform deterministic visual analysis without claiming false diagnosis."""

    def __init__(self):
        self.model = None
        self.classification_model = None
        self.condition_model = None

        # The service is available, but no trained CNN exists.
        self.is_ready = True
        self.is_loaded = True
        self.is_trained = False

        self.model_source = "deterministic-visual-analysis"
        self.field_validated = False
        self.model_unavailable_reason = (
            "No validated soil image classification model is configured"
        )

        self.input_shape = (224, 224, 3)
        self.max_image_bytes = 10 * 1024 * 1024
        self.max_image_pixels = 25_000_000

        self.soil_classes = [
            "Sandy", "Clay", "Loamy", "Silty", "Peaty", "Chalky"
        ]

        self.soil_classes_ar = [
            "رملية", "طينية", "طمية", "غرينية", "خثية", "طباشيرية"
        ]

        self.condition_classes = [
            "Healthy", "Dry", "Waterlogged",
            "Compacted", "Eroded", "Contaminated"
        ]

        self.condition_classes_ar = [
            "صحية", "جافة", "مشبعة بالماء",
            "متضاغطة", "متآكلة", "ملوثة"
        ]

        logger.info(
            "SoilImageDiagnosisAI initialized: deterministic visual analysis"
        )

    # ---------------------------------------------------------
    # Image decoding and validation
    # ---------------------------------------------------------

    def _preprocess_image(
        self,
        image_data: Union[str, bytes, np.ndarray],
    ) -> np.ndarray:
        """Decode, validate and normalize an image to RGB float32."""

        try:
            if isinstance(image_data, str):
                encoded = image_data.strip()

                # Support data URLs such as data:image/jpeg;base64,...
                if encoded.startswith("data:"):
                    if "," not in encoded:
                        raise ValueError("Invalid image data URL")
                    header, encoded = encoded.split(",", 1)

                    if ";base64" not in header.lower():
                        raise ValueError("Image data URL must use base64")

                # Remove whitespace/newlines from base64.
                encoded = "".join(encoded.split())

                try:
                    image_bytes = base64.b64decode(
                        encoded,
                        validate=True,
                    )
                except (binascii.Error, ValueError):
                    raise ValueError("Invalid base64 image data")

                if len(image_bytes) > self.max_image_bytes:
                    raise ValueError("Image exceeds the 10 MB size limit")

                image = Image.open(io.BytesIO(image_bytes))

            elif isinstance(image_data, bytes):
                if not image_data:
                    raise ValueError("Empty image data")

                if len(image_data) > self.max_image_bytes:
                    raise ValueError("Image exceeds the 10 MB size limit")

                image = Image.open(io.BytesIO(image_data))

            elif isinstance(image_data, np.ndarray):
                if image_data.size == 0:
                    raise ValueError("Empty image array")

                if image_data.ndim != 3 or image_data.shape[2] not in (3, 4):
                    raise ValueError(
                        "Image array must have shape (height, width, 3 or 4)"
                    )

                if image_data.dtype == np.bool_:
                    raise ValueError("Boolean image arrays are unsupported")

                if not np.issubdtype(image_data.dtype, np.number):
                    raise ValueError("Image array must contain numeric values")

                if not np.isfinite(image_data).all():
                    raise ValueError("Image contains invalid numeric values")

                array = image_data

                if array.dtype != np.uint8:
                    if array.min() >= 0 and array.max() <= 1:
                        array = array * 255.0
                    elif array.min() < 0 or array.max() > 255:
                        raise ValueError(
                            "Image array values must be between 0 and 255"
                        )

                    array = np.clip(array, 0, 255).astype(np.uint8)

                image = Image.fromarray(array)

            else:
                raise ValueError(
                    "image_data must be base64, bytes, or a NumPy array"
                )

            # Protect against decompression bombs and oversized images.
            width, height = image.size

            if width <= 0 or height <= 0:
                raise ValueError("Invalid image dimensions")

            if width * height > self.max_image_pixels:
                raise ValueError("Image dimensions exceed the allowed limit")

            image = ImageOps.exif_transpose(image)
            image = image.convert("RGB")

            image = image.resize(
                (self.input_shape[1], self.input_shape[0]),
                Image.Resampling.LANCZOS,
            )

            return (
                np.asarray(image, dtype=np.float32) / 255.0
            )

        except (UnidentifiedImageError, OSError) as exc:
            logger.warning("Invalid or unsupported image: %s", exc)
            raise ValueError("Could not decode image. Upload a valid image.")

    # ---------------------------------------------------------
    # Visual feature extraction
    # ---------------------------------------------------------

    def _extract_image_features(
        self,
        image: np.ndarray,
    ) -> Dict[str, float]:
        """Extract reproducible image statistics, not soil measurements."""

        if (
            not isinstance(image, np.ndarray)
            or image.ndim != 3
            or image.shape[2] != 3
            or not np.isfinite(image).all()
        ):
            raise ValueError("Invalid preprocessed RGB image")

        red = image[:, :, 0]
        green = image[:, :, 1]
        blue = image[:, :, 2]

        # Relative luminance.
        gray = (
            0.2126 * red
            + 0.7152 * green
            + 0.0722 * blue
        )

        # Simple RGB saturation indicator.
        maximum = np.max(image, axis=2)
        minimum = np.min(image, axis=2)

        saturation = np.zeros_like(maximum)
        non_black = maximum > 0

        saturation[non_black] = (
            maximum[non_black] - minimum[non_black]
        ) / maximum[non_black]

        # Average horizontal and vertical brightness differences.
        horizontal_edges = np.abs(np.diff(gray, axis=1))
        vertical_edges = np.abs(np.diff(gray, axis=0))

        edge_density = float(
            (
                np.mean(horizontal_edges > 0.10)
                + np.mean(vertical_edges > 0.10)
            ) / 2.0
        )

        return {
            "mean_red": float(np.mean(red)),
            "mean_green": float(np.mean(green)),
            "mean_blue": float(np.mean(blue)),
            "std_red": float(np.std(red)),
            "std_green": float(np.std(green)),
            "std_blue": float(np.std(blue)),
            "mean_brightness": float(np.mean(gray)),
            "brightness_std": float(np.std(gray)),
            "mean_saturation": float(np.mean(saturation)),
            "contrast": float(np.std(gray)),
            "edge_density": edge_density,
        }

    # ---------------------------------------------------------
    # Soil classification
    # ---------------------------------------------------------

    def _classify_soil_type(
        self,
        image: np.ndarray,
    ) -> Dict[str, Any]:
        """
        Do not classify soil type from color alone.

        Reliable texture classification requires suitable reference data
        or a validated model trained on representative soil images.
        """

        return {
            "soil_type": "Unknown",
            "soil_type_ar": "غير محدد",
            "confidence": 0.0,
            "status": "not_classified",
            "reason": (
                "A normal image alone cannot reliably distinguish "
                "sand, clay, loam and other soil texture classes."
            ),
            "all_probabilities": None,
            "model_source": self.model_source,
        }

    # ---------------------------------------------------------
    # Soil condition assessment
    # ---------------------------------------------------------

    def _assess_soil_condition(
        self,
        image: np.ndarray,
    ) -> Dict[str, Any]:
        """Avoid claiming moisture, contamination or soil health from RGB."""

        return {
            "condition": "Unknown",
            "condition_ar": "غير محددة",
            "confidence": 0.0,
            "health_score": None,
            "status": "visual_inspection_only",
            "all_conditions": None,
            "reason": (
                "Dryness, waterlogging, compaction, contamination and "
                "soil health require field observations or measurements."
            ),
        }

    # ---------------------------------------------------------
    # Color analysis
    # ---------------------------------------------------------

    def _analyze_color_properties(
        self,
        image: np.ndarray,
    ) -> Dict[str, Any]:
        """Describe visible color without converting it into lab values."""

        features = self._extract_image_features(image)

        brightness = features["mean_brightness"]
        saturation = features["mean_saturation"]

        if brightness < 0.30:
            brightness_description = "داكنة"
        elif brightness < 0.65:
            brightness_description = "متوسطة الإضاءة"
        else:
            brightness_description = "فاتحة"

        if saturation < 0.15:
            color_description = "ضعيفة التشبع"
        elif saturation < 0.40:
            color_description = "متوسطة التشبع"
        else:
            color_description = "مرتفعة التشبع"

        return {
            "visual_color": {
                "brightness": brightness_description,
                "saturation": color_description,
                "mean_brightness": round(brightness, 4),
                "mean_saturation": round(saturation, 4),
            },
            "organic_matter": {
                "level": None,
                "estimated_percentage": None,
                "status": "requires_laboratory_analysis",
                "reason": (
                    "Soil darkness is not a reliable measurement "
                    "of organic matter."
                ),
            },
            "moisture": {
                "level": None,
                "estimated_percentage": None,
                "status": "requires_field_measurement",
                "reason": (
                    "Image brightness and color are affected by lighting, "
                    "camera settings and soil composition."
                ),
            },
            "iron_content": {
                "level": None,
                "status": "requires_laboratory_analysis",
                "reason": (
                    "Red or brown color alone cannot quantify iron content."
                ),
            },
            "overall_color_health": None,
            "interpretation": "visual_description_only",
        }

    # ---------------------------------------------------------
    # Texture appearance
    # ---------------------------------------------------------

    def _analyze_texture(
        self,
        image: np.ndarray,
    ) -> Dict[str, Any]:
        """
        Describe visible image patterns only.

        Pixel edges are not equivalent to actual soil particle size.
        """

        features = self._extract_image_features(image)

        return {
            "visual_pattern": "not_calibrated",
            "particle_size": None,
            "porosity": None,
            "homogeneity_score": round(
                1.0 / (1.0 + features["contrast"]),
                4,
            ),
            "contrast_score": round(features["contrast"], 4),
            "edge_density": round(features["edge_density"], 4),
            "status": "visual_texture_indicators_only",
            "reason": (
                "Image texture statistics cannot establish particle-size "
                "distribution or soil porosity. A soil texture test is needed."
            ),
        }

    # ---------------------------------------------------------
    # Recommendations
    # ---------------------------------------------------------

    def _generate_recommendations(
        self,
        soil_type: Dict[str, Any],
        condition: Dict[str, Any],
        color_analysis: Dict[str, Any],
    ) -> List[str]:
        """Provide safe next steps without assuming a diagnosis."""

        return [
            "خذ عينة ممثلة من التربة وأرسلها إلى مخبر لتحليل pH وNPK والمواد العضوية.",
            "تحقق من قوام التربة ميدانياً باستعمال اختبار اللمس أو تحليل توزيع الحبيبات.",
            "قِس رطوبة التربة بأداة مناسبة بدل الاعتماد على لون الصورة.",
            "التقط صوراً إضافية في إضاءة طبيعية ومن دون فلاتر لتحسين الفحص البصري.",
            "لا تضف أسمدة أو مواد معالجة اعتماداً على الصورة وحدها.",
        ]

    # ---------------------------------------------------------
    # Main public method
    # ---------------------------------------------------------

    def analyze_soil_image(
        self,
        image_data: Union[str, bytes, np.ndarray],
    ) -> Dict[str, Any]:
        """Return deterministic visual observations for an uploaded image."""

        try:
            processed_image = self._preprocess_image(image_data)

            features = self._extract_image_features(processed_image)

            soil_type_prediction = self._classify_soil_type(
                processed_image
            )

            condition_prediction = self._assess_soil_condition(
                processed_image
            )

            color_analysis = self._analyze_color_properties(
                processed_image
            )

            texture_analysis = self._analyze_texture(
                processed_image
            )

            recommendations = self._generate_recommendations(
                soil_type_prediction,
                condition_prediction,
                color_analysis,
            )

            return {
                "soil_classification": soil_type_prediction,
                "soil_condition": condition_prediction,
                "color_analysis": color_analysis,
                "texture_analysis": texture_analysis,
                "image_features": features,
                "recommendations": recommendations,

                # No validated classifier means no confidence claim.
                "confidence_score": 0.0,
                "confidence_status": "not_available",

                "analysis_timestamp": datetime.now(
                    timezone.utc
                ).isoformat(),

                "model_source": self.model_source,
                "model_trained": False,
                "field_validated": False,
                "analysis_type": "deterministic_visual_analysis",
                "data_source": "user_uploaded_image",
                "is_real_image": True,
                "is_scientific_diagnosis": False,

                "limitations": [
                    "No validated CNN model is configured.",
                    "Soil type is not classified.",
                    "No pH, NPK, moisture or organic matter values are inferred.",
                    "Visual features depend on lighting and camera conditions.",
                ],

                "disclaimer": (
                    "This service describes visible image characteristics. "
                    "It does not provide a scientifically validated soil "
                    "diagnosis or replace laboratory and field testing."
                ),
            }

        except Exception as exc:
            logger.error(
                "Soil image analysis failed: %s",
                exc,
                exc_info=True,
            )
            raise

    def get_model_status(self) -> Dict[str, Any]:
        return {
            "status": "ready",
            "model_source": self.model_source,
            "model_trained": False,
            "field_validated": False,
            "cnn_available": False,
            "analysis_type": "deterministic_visual_analysis",
            "message": (
                "Image processing is available, but no validated "
                "soil classification model is configured."
            ),
        }


def create_soil_image_diagnosis() -> SoilImageDiagnosisAI:
    """Factory function used by main.py."""
    return SoilImageDiagnosisAI()
