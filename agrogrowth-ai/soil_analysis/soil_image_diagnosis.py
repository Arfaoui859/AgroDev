"""
Soil image inspection service. This is image-statistics processing only,
not a trained soil classifier or scientific diagnosis.
"""
import base64
import binascii
import io
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Union

import numpy as np
from PIL import Image, ImageOps, UnidentifiedImageError

logger = logging.getLogger(__name__)


class SoilImageDiagnosisAI:
    def __init__(self):
        self.model = None
        self.classification_model = None
        self.condition_model = None
        self.is_ready = True
        self.is_loaded = True  # Image-processing engine is initialized.
        self.is_trained = False
        self.model_source = "deterministic-visual-analysis"
        self.field_validated = False
        self.input_shape = (224, 224, 3)
        self.max_image_bytes = 10 * 1024 * 1024
        self.max_image_pixels = 25_000_000
        self.soil_classes = ["Sandy","Clay","Loamy","Silty","Peaty","Chalky"]
        self.soil_classes_ar = ["رملية","طينية","طمية","غرينية","خثية","طباشيرية"]
        self.condition_classes = ["Healthy","Dry","Waterlogged","Compacted","Eroded","Contaminated"]
        self.condition_classes_ar = ["صحية","جافة","مشبعة بالماء","متضاغطة","متآكلة","ملوثة"]

    def _preprocess_image(self, image_data: Union[str, bytes, np.ndarray]) -> np.ndarray:
        try:
            if isinstance(image_data, str):
                encoded = image_data.strip()
                if encoded.startswith("data:"):
                    if "," not in encoded:
                        raise ValueError("Invalid image data URL")
                    header, encoded = encoded.split(",", 1)
                    if ";base64" not in header.lower():
                        raise ValueError("Image data URL must be base64")
                try:
                    raw = base64.b64decode("".join(encoded.split()), validate=True)
                except (binascii.Error, ValueError) as exc:
                    raise ValueError("Invalid base64 image data") from exc
                if len(raw) > self.max_image_bytes:
                    raise ValueError("Image exceeds maximum allowed size")
                image = Image.open(io.BytesIO(raw))
            elif isinstance(image_data, bytes):
                if not image_data:
                    raise ValueError("Empty image data")
                if len(image_data) > self.max_image_bytes:
                    raise ValueError("Image exceeds maximum allowed size")
                image = Image.open(io.BytesIO(image_data))
            elif isinstance(image_data, np.ndarray):
                arr = image_data
                if arr.size == 0 or arr.ndim != 3 or arr.shape[2] not in (3,4):
                    raise ValueError("Image array must have shape (height, width, 3 or 4)")
                if arr.dtype == np.bool_ or not np.issubdtype(arr.dtype, np.number):
                    raise ValueError("Image array must contain numeric non-boolean values")
                if not np.isfinite(arr).all():
                    raise ValueError("Image array contains non-finite values")
                if arr.dtype != np.uint8:
                    if arr.min() >= 0 and arr.max() <= 1:
                        arr = arr * 255
                    elif arr.min() < 0 or arr.max() > 255:
                        raise ValueError("Image array values must be between 0 and 255")
                    arr = np.clip(arr,0,255).astype(np.uint8)
                image = Image.fromarray(arr)
            else:
                raise ValueError("image_data must be base64, bytes, or a NumPy array")

            width, height = image.size
            if width <= 0 or height <= 0 or width * height > self.max_image_pixels:
                raise ValueError("Invalid or oversized image dimensions")
            image = ImageOps.exif_transpose(image).convert("RGB")
            image.thumbnail((self.input_shape[1], self.input_shape[0]), Image.Resampling.LANCZOS)
            # Center crop/pad to a fixed tensor size without stretching aspect ratio.
            canvas = Image.new("RGB", (self.input_shape[1], self.input_shape[0]), (0,0,0))
            x = (canvas.width-image.width)//2
            y = (canvas.height-image.height)//2
            canvas.paste(image,(x,y))
            return np.asarray(canvas,dtype=np.float32)/255.0
        except (UnidentifiedImageError, OSError, Image.DecompressionBombError) as exc:
            logger.warning("Image decode rejected: %s", exc)
            raise ValueError("Could not decode a valid supported image") from exc

    def _extract_image_features(self, image: np.ndarray) -> Dict[str,float]:
        if not isinstance(image,np.ndarray) or image.ndim != 3 or image.shape[2] != 3 or not np.isfinite(image).all():
            raise ValueError("Invalid preprocessed RGB image")
        r,g,b = image[:,:,0],image[:,:,1],image[:,:,2]
        gray = 0.2126*r + 0.7152*g + 0.0722*b
        maximum, minimum = np.max(image,axis=2),np.min(image,axis=2)
        sat = np.zeros_like(maximum)
        mask = maximum > 0
        sat[mask] = (maximum[mask]-minimum[mask])/maximum[mask]
        edge_h = np.abs(np.diff(gray,axis=1))
        edge_v = np.abs(np.diff(gray,axis=0))
        return {
            "mean_red":float(np.mean(r)),"mean_green":float(np.mean(g)),
            "mean_blue":float(np.mean(b)),"std_red":float(np.std(r)),
            "std_green":float(np.std(g)),"std_blue":float(np.std(b)),
            "mean_brightness":float(np.mean(gray)),
            "brightness_std":float(np.std(gray)),
            "mean_saturation":float(np.mean(sat)),
            "contrast":float(np.std(gray)),
            "edge_density":float((np.mean(edge_h>0.10)+np.mean(edge_v>0.10))/2),
        }

    def _classify_soil_type(self, image):
        return {"soil_type":"Unknown","soil_type_ar":"غير محدد","confidence":0.0,
                "status":"not_classified",
                "reason":"لا يمكن تحديد قوام التربة علمياً من لون صورة عادية وحده.",
                "all_probabilities":None,"model_source":self.model_source}

    def _assess_soil_condition(self, image):
        return {"condition":"Unknown","condition_ar":"غير محددة","confidence":0.0,
                "health_score":None,"status":"visual_inspection_only",
                "all_conditions":None,
                "reason":"الرطوبة والتلوث والانضغاط وصحة التربة تتطلب قياسات أو معاينة ميدانية."}

    def _analyze_color_properties(self, image):
        f = self._extract_image_features(image)
        brightness, saturation = f["mean_brightness"], f["mean_saturation"]
        return {
            "visual_color":{
                "brightness":"داكنة" if brightness < .30 else "متوسطة الإضاءة" if brightness < .65 else "فاتحة",
                "saturation":"ضعيفة التشبع" if saturation < .15 else "متوسطة التشبع" if saturation < .40 else "مرتفعة التشبع",
                "mean_brightness":round(brightness,4),"mean_saturation":round(saturation,4)},
            "organic_matter":{"level":None,"estimated_percentage":None,"status":"requires_laboratory_analysis",
                              "reason":"لون التربة لا يقيس المادة العضوية."},
            "moisture":{"level":None,"estimated_percentage":None,"status":"requires_field_measurement",
                        "reason":"الإضاءة والكاميرا وتركيب التربة تؤثر في اللون."},
            "iron_content":{"level":None,"status":"requires_laboratory_analysis",
                            "reason":"اللون الأحمر أو البني لا يحدد تركيز الحديد."},
            "overall_color_health":None,"interpretation":"visual_description_only",
        }

    def _analyze_texture(self, image):
        f = self._extract_image_features(image)
        return {"visual_pattern":"not_calibrated","particle_size":None,"porosity":None,
                "homogeneity_score":round(1/(1+f["contrast"]),4),
                "contrast_score":round(f["contrast"],4),
                "edge_density":round(f["edge_density"],4),
                "status":"visual_texture_indicators_only",
                "reason":"إحصائيات البكسلات لا تقيس توزيع أحجام حبيبات التربة أو المسامية."}

    def _generate_recommendations(self, soil_type, condition, color_analysis):
        return [
            "خذ عينة ممثلة وأرسلها إلى مخبر لتحليل pH وNPK والمواد العضوية والملوحة.",
            "حدّد قوام التربة باختبار مناسب أو بتحليل توزيع الحبيبات.",
            "قِس رطوبة التربة بأداة مناسبة بدل الاعتماد على لون الصورة.",
            "التقط الصورة في إضاءة طبيعية ومن دون فلاتر لتحسين الوصف البصري.",
            "لا تضف أسمدة أو مواد معالجة اعتماداً على الصورة وحدها.",
        ]

    def analyze_soil_image(self, image_data: Union[str,bytes,np.ndarray]) -> Dict[str,Any]:
        image = self._preprocess_image(image_data)
        features = self._extract_image_features(image)
        soil = self._classify_soil_type(image)
        condition = self._assess_soil_condition(image)
        color = self._analyze_color_properties(image)
        texture = self._analyze_texture(image)
        return {
            "soil_classification":soil,"soil_condition":condition,
            "color_analysis":color,"texture_analysis":texture,
            "image_features":features,
            "recommendations":self._generate_recommendations(soil,condition,color),
            "confidence_score":0.0,"confidence_status":"not_available",
            "analysis_timestamp":datetime.now(timezone.utc).isoformat(),
            "model_source":self.model_source,"model_trained":False,
            "field_validated":False,"analysis_type":"deterministic_visual_analysis",
            "data_source":"user_uploaded_image","is_real_image":True,
            "is_scientific_diagnosis":False,
            "limitations":[
                "No validated CNN soil classifier is configured.",
                "Soil type is not classified.",
                "No pH, NPK, moisture or organic matter values are inferred.",
                "Visual features depend on lighting and camera conditions.",
            ],
            "disclaimer":"وصف بصري فقط؛ لا يعوّض التحليل المخبري أو المعاينة الميدانية.",
        }

    def get_model_status(self):
        return {"status":"ready","model_source":self.model_source,
                "model_trained":False,"field_validated":False,
                "cnn_available":False,"image_processing_available":True,
                "analysis_type":"deterministic_visual_analysis"}


def create_soil_image_diagnosis() -> SoilImageDiagnosisAI:
    return SoilImageDiagnosisAI()
