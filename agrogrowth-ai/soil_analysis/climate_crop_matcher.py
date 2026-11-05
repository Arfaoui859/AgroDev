"""
Deterministic crop compatibility matcher.
Scores are reference-range compatibility indicators, never probabilities.
"""
import logging
import math
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)


class ClimateCropMatcher:
    def __init__(self):
        self.model = None
        self.is_ready = True
        self.is_trained = False
        self.model_source = "deterministic-rules"
        self.field_validated = False
        self.crop_database = {
            "wheat": {"name_ar":"القمح","temp_range":(10,25),"rainfall_range":(300,800),"humidity_range":(40,70),"soil_ph_range":(6,7.5),"growing_season":"winter","season_months":[10,11,12,1,2,3],"water_requirement":"متوسط","soil_types":["Loamy","Clay","Silty"]},
            "corn": {"name_ar":"الذرة","temp_range":(20,30),"rainfall_range":(500,1200),"humidity_range":(50,80),"soil_ph_range":(6,7),"growing_season":"summer","season_months":[4,5,6,7,8,9],"water_requirement":"عالي","soil_types":["Loamy","Silty"]},
            "rice": {"name_ar":"الأرز","temp_range":(25,35),"rainfall_range":(1000,2000),"humidity_range":(70,90),"soil_ph_range":(5.5,7),"growing_season":"summer","season_months":[4,5,6,7,8,9],"water_requirement":"عالي جداً","soil_types":["Clay","Silty"]},
            "tomato": {"name_ar":"الطماطم","temp_range":(18,28),"rainfall_range":(400,800),"humidity_range":(60,80),"soil_ph_range":(6,7),"growing_season":"spring_summer","season_months":[3,4,5,6,7,8],"water_requirement":"متوسط إلى عالي","soil_types":["Loamy","Sandy","Silty"]},
            "potato": {"name_ar":"البطاطس","temp_range":(15,25),"rainfall_range":(400,700),"humidity_range":(50,75),"soil_ph_range":(5.5,6.5),"growing_season":"spring_fall","season_months":[2,3,4,9,10,11],"water_requirement":"متوسط","soil_types":["Sandy","Loamy"]},
            "onion": {"name_ar":"البصل","temp_range":(12,25),"rainfall_range":(300,600),"humidity_range":(40,70),"soil_ph_range":(6,7.5),"growing_season":"winter_spring","season_months":[10,11,12,1,2,3,4],"water_requirement":"منخفض إلى متوسط","soil_types":["Loamy","Silty"]},
            "cucumber": {"name_ar":"الخيار","temp_range":(20,30),"rainfall_range":(400,700),"humidity_range":(60,85),"soil_ph_range":(6,7),"growing_season":"spring_summer","season_months":[3,4,5,6,7,8],"water_requirement":"عالي","soil_types":["Loamy","Sandy"]},
            "lettuce": {"name_ar":"الخس","temp_range":(10,20),"rainfall_range":(250,500),"humidity_range":(50,75),"soil_ph_range":(6,7),"growing_season":"cool_season","season_months":[9,10,11,12,1,2,3,4],"water_requirement":"متوسط","soil_types":["Loamy","Silty"]},
            "dates": {"name_ar":"التمور","temp_range":(25,40),"rainfall_range":(50,300),"humidity_range":(30,60),"soil_ph_range":(7,8.5),"growing_season":"perennial","season_months":list(range(1,13)),"water_requirement":"متوسط","soil_types":["Sandy","Loamy"]},
            "olive": {"name_ar":"الزيتون","temp_range":(15,30),"rainfall_range":(400,800),"humidity_range":(40,70),"soil_ph_range":(6.5,8),"growing_season":"perennial","season_months":list(range(1,13)),"water_requirement":"منخفض إلى متوسط","soil_types":["Loamy","Chalky","Sandy"]},
        }

    @staticmethod
    def _read_number(data: Dict[str, Any], keys: Tuple[str, ...], field: str,
                     minimum: float, maximum: float) -> Optional[float]:
        for key in keys:
            if key not in data or data[key] is None:
                continue
            raw = data[key]
            if isinstance(raw, bool):
                raise ValueError(f"{field} must be numeric")
            try:
                value = float(raw)
            except (TypeError, ValueError):
                raise ValueError(f"{field} must be numeric")
            if not math.isfinite(value) or not minimum <= value <= maximum:
                raise ValueError(f"{field} must be finite and between {minimum} and {maximum}")
            return value
        return None

    @staticmethod
    def _normalize_soil_type(value: Any) -> Optional[str]:
        if value is None:
            return None
        if not isinstance(value, str):
            raise ValueError("soil_type must be a string")
        aliases = {
            "loam":"Loamy","loamy":"Loamy","طمي":"Loamy","طمية":"Loamy",
            "طينية":"Clay","clay":"Clay","silty":"Silty","silt":"Silty","غرينية":"Silty",
            "sandy":"Sandy","sand":"Sandy","رملية":"Sandy","chalky":"Chalky","كلسية":"Chalky",
        }
        key = value.strip().lower()
        if key not in aliases:
            raise ValueError("Unsupported soil_type. Use Loamy, Clay, Silty, Sandy or Chalky.")
        return aliases[key]

    @staticmethod
    def _score_range(value: float, bounds: Tuple[float, float],
                     tolerance: float) -> Dict[str, Any]:
        low, high = bounds
        if low <= value <= high:
            status, score = "within_reference_range", 1.0
        elif low - tolerance <= value < low or high < value <= high + tolerance:
            status, score = "near_reference_range", 0.7
        else:
            status, score = "outside_reference_range", 0.0
        return {"status": status, "score": score, "reference_range": [low, high]}

    def _analyze_crop_suitability(self, info, temp, rainfall, humidity, ph, soil_type=None):
        factors = {
            "temperature": (temp, info["temp_range"], 5),
            "rainfall": (rainfall, info["rainfall_range"], 20),
            "humidity": (humidity, info["humidity_range"], 10),
            "soil_ph": (ph, info["soil_ph_range"], 0.5),
        }
        analysis, scores = {}, []
        for name, (value, bounds, tolerance) in factors.items():
            if value is None:
                analysis[name] = {"status":"not_provided","score":None,"reference_range":list(bounds)}
            else:
                result = self._score_range(value, bounds, tolerance)
                analysis[name] = result
                scores.append(result["score"])
        if soil_type is None:
            analysis["soil_type"] = {"status":"not_provided","score":None,"suitable_types":info["soil_types"]}
        else:
            compatible = soil_type in info["soil_types"]
            analysis["soil_type"] = {
                "status":"compatible" if compatible else "not_recommended",
                "score":1.0 if compatible else 0.0,
                "provided_type":soil_type,"suitable_types":info["soil_types"],
            }
            scores.append(1.0 if compatible else 0.0)
        count = len(scores)
        score = sum(scores) / count if count else None
        enough = count >= 3
        level = ("بيانات غير كافية" if not enough else
                 "عالية" if score >= 0.8 else "متوسطة" if score >= 0.6 else "منخفضة")
        analysis["overall"] = {
            "score": round(score, 3) if score is not None else None,
            "score_percentage": round(score * 100, 1) if score is not None else None,
            "level": level, "evaluated_factors": count,
            "minimum_factors_for_ranking": 3,
            "confidence_status": "limited" if not enough else "indicative",
            "score_type":"rule_based_compatibility","is_probability":False,
        }
        return analysis

    def match_crops_to_climate(self, climate_data: Dict[str, Any],
                               soil_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        if not isinstance(climate_data, dict):
            raise ValueError("climate_data must be an object")
        soil_data = {} if soil_data is None else soil_data
        if not isinstance(soil_data, dict):
            raise ValueError("soil_data must be an object")
        temp = self._read_number(climate_data,("temperature","temperature_c"),"temperature",-10,60)
        rainfall = self._read_number(climate_data,("annual_rainfall","annual_rainfall_mm","rainfall_mm"),"annual_rainfall",0,10000)
        humidity = self._read_number(climate_data,("humidity","relative_humidity"),"humidity",0,100)
        ph = self._read_number(soil_data,("ph","soil_ph"),"soil_ph",0,14)
        soil_type = self._normalize_soil_type(soil_data.get("soil_type"))
        supplied = {"temperature":temp,"annual_rainfall":rainfall,"humidity":humidity,"soil_ph":ph,"soil_type":soil_type}
        count = sum(v is not None for v in supplied.values())
        if count == 0:
            raise ValueError("Provide at least one climate or soil measurement.")

        results = []
        for name, info in self.crop_database.items():
            analysis = self._analyze_crop_suitability(info,temp,rainfall,humidity,ph,soil_type)
            overall = analysis["overall"]
            results.append({
                "crop":name,"name_ar":info["name_ar"],
                "suitability_score":overall["score"],
                "suitability_percentage":overall["score_percentage"],
                "score_type":"rule_based_compatibility",
                "ranking_reliable":overall["evaluated_factors"] >= 3,
                "analysis":analysis,"growing_season":info["growing_season"],
                "water_requirement":info["water_requirement"],
                "suitable_soil_types":info["soil_types"],
            })
        # Insufficient-data candidates are not presented as a meaningful ranking.
        results.sort(key=lambda x: (x["ranking_reliable"], x["suitability_score"] or -1), reverse=True)
        top = results[:5]
        now = datetime.now(timezone.utc)
        return {
            "suitable_crops":top,
            "climate_analysis":self._analyze_climate_conditions(temp,rainfall,humidity),
            "seasonal_recommendations":self._get_seasonal_recommendations(now.month,top),
            "best_crop":top[0] if top and top[0]["ranking_reliable"] else None,
            "analysis_timestamp":now.isoformat(),
            "model_source":self.model_source,"data_source":"user_supplied_input",
            "is_real_data":None,"measurement_verified":False,
            "provided_measurements":supplied,"measurement_count":count,
            "score_explanation":(
                "Compatibility scores compare supplied measurements with general reference ranges. "
                "At least three evaluated factors are required before a candidate is marked ranking_reliable. "
                "Scores are not probabilities, yield forecasts or validated field results."
            ),
            "disclaimer":(
                "Ranges are general references, not locally validated Tunisian planting prescriptions. "
                "Consider location, multi-year climate, rainfall distribution, irrigation, cultivar, "
                "planting date and local agronomic advice."
            ),
        }

    def _analyze_climate_conditions(self, temp, rainfall, humidity):
        provided = [k for k,v in {"temperature":temp,"annual_rainfall":rainfall,"humidity":humidity}.items() if v is not None]
        missing = [k for k,v in {"temperature":temp,"annual_rainfall":rainfall,"humidity":humidity}.items() if v is None]
        result = {"provided_factors":provided,"missing_factors":missing}
        if temp is not None and rainfall is not None:
            if temp > 30 and rainfall < 300: kind = "صحراوي حار"
            elif temp > 25 and rainfall < 800: kind = "شبه جاف"
            elif temp > 25: kind = "رطب ودافئ"
            elif 15 <= temp <= 25 and 400 <= rainfall <= 1000: kind = "معتدل"
            elif temp < 15 and rainfall > 600: kind = "بارد ورطب"
            else: kind = "متنوع"
            result["climate_type"] = kind
        else:
            result["climate_type"] = "غير محدد - بيانات مناخية ناقصة"
        result["primary_season"] = (
            "غير محدد" if temp is None else "صيفي" if temp >= 25
            else "ربيعي/خريفي" if temp >= 15 else "شتوي"
        )
        if rainfall is None:
            result["water_status"] = "غير محدد - الأمطار السنوية غير متوفرة"
        elif rainfall < 300: result["water_status"] = "أمطار سنوية منخفضة - يلزم تقييم مياه الري"
        elif rainfall < 600: result["water_status"] = "أمطار محدودة - قد يلزم ري تكميلي"
        elif rainfall < 1200: result["water_status"] = "أمطار متوسطة إلى مرتفعة"
        else: result["water_status"] = "أمطار مرتفعة - يجب تقييم الصرف"
        return result

    def _get_seasonal_recommendations(self, current_month: int, crops: List[Dict[str, Any]]):
        output = {"current_month_crops":[],"next_season_crops":[],"year_round_crops":[]}
        for crop in crops:
            info = self.crop_database[crop["crop"]]
            item = {"crop":crop["name_ar"],"english_name":crop["crop"],
                    "suitability_score":crop["suitability_score"],
                    "ranking_reliable":crop["ranking_reliable"]}
            if info["growing_season"] == "perennial":
                item["timing"] = "محصول دائم؛ موعد الغراسة يتطلب تقييماً محلياً"
                output["year_round_crops"].append(item)
            elif current_month in info["season_months"]:
                item["timing"] = "الشهر الحالي ضمن الأشهر المرجعية العامة"
                output["current_month_crops"].append(item)
            else:
                future = [((m-current_month)%12,m) for m in info["season_months"] if (m-current_month)%12]
                if future:
                    _, month = min(future)
                    item["next_suitable_month"] = month
                    item["timing"] = f"الشهر المرجعي القادم: {month}"
                    output["next_season_crops"].append(item)
        return output

    def get_crop_requirements(self, crop_name: str) -> Dict[str, Any]:
        name = crop_name.strip().lower()
        if name not in self.crop_database:
            raise ValueError(f"Crop '{name}' not found in database")
        info = self.crop_database[name]
        return {
            "crop":name,"name_ar":info["name_ar"],
            "climate_requirements":{
                "temperature_range":info["temp_range"],"rainfall_range":info["rainfall_range"],
                "humidity_range":info["humidity_range"],"soil_ph_range":info["soil_ph_range"]},
            "growing_info":{
                "growing_season":info["growing_season"],"suitable_months":info["season_months"],
                "water_requirement":info["water_requirement"],"suitable_soil_types":info["soil_types"]},
            "source":"general_reference_ranges","field_validated":False,
        }

    def get_supported_crops(self) -> List[Dict[str,str]]:
        return [{"crop":n,"name_ar":v["name_ar"]} for n,v in self.crop_database.items()]


def create_climate_crop_matcher() -> ClimateCropMatcher:
    return ClimateCropMatcher()
