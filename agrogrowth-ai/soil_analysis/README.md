# 🌱 Soil Analysis AI Service

## نظرة عامة

خدمة الذكاء الاصطناعي لتحليل التربة والبيئة الزراعية، تحتوي على ثلاثة نماذج ذكية متخصصة:

## 🧠 النماذج المتاحة

### 1. SoilAnalyzerAI - محلل التربة الذكي
- **الوظيفة**: تحليل شامل لخصائص التربة من بيانات الاستشعار
- **المدخلات**: pH، النيتروجين، الفوسفور، البوتاسيوم، المادة العضوية، الرطوبة، الملوحة
- **المخرجات**: تصنيف نوع التربة، تقييم المغذيات، درجة الصحة، التوصيات

### 2. ClimateCropMatcher - مطابق المناخ والمحاصيل
- **الوظيفة**: ربط الظروف المناخية بالمحاصيل المناسبة
- **المدخلات**: بيانات المناخ (الحرارة، الأمطار، الرطوبة)، بيانات التربة
- **المخرجات**: قائمة المحاصيل المناسبة، تحليل المناخ، توصيات موسمية

### 3. SoilImageDiagnosisAI - تشخيص التربة من الصور
- **الوظيفة**: تصنيف التربة وتشخيص حالتها من الصور
- **المدخلات**: صور التربة
- **المخرجات**: نوع التربة، حالة التربة، تحليل اللون والملمس

## 🚀 تشغيل الخدمة

### تشغيل محلي
```bash
cd soil_analysis
python main.py
```

### تشغيل باستخدام Docker
```bash
docker build -t agrogrowth-soil-analysis .
docker run -p 8001:8001 agrogrowth-soil-analysis
```

## 📡 نقاط النهاية (API Endpoints)

### تحليل التربة
```http
POST /analyze-soil
Content-Type: application/json

{
  "sensor_data": {
    "ph": 6.5,
    "nitrogen": 45.0,
    "phosphorus": 12.0,
    "potassium": 85.0,
    "organic_matter": 3.2,
    "moisture": 55.0,
    "salinity": 1.8,
    "temperature": 22.0
  },
  "location": {
    "latitude": 31.5204,
    "longitude": 74.3587
  }
}
```

### مطابقة المحاصيل
```http
POST /match-crops
Content-Type: application/json

{
  "climate_data": {
    "temperature": 25.0,
    "annual_rainfall": 600.0,
    "humidity": 65.0
  },
  "soil_data": {
    "ph": 6.8
  }
}
```

### تشخيص الصور
```http
POST /diagnose-image
Content-Type: multipart/form-data

file: [soil_image.jpg]
```

## 📊 أمثلة الاستجابات

### تحليل التربة
```json
{
  "soil_type": {
    "classification": "Loamy",
    "confidence": 0.85
  },
  "properties": {
    "ph": {
      "current_value": 6.5,
      "status": "optimal",
      "recommendations": ["الحفاظ على المستوى الحالي"]
    }
  },
  "health_score": 82.5,
  "fertility_level": "عالية"
}
```

### مطابقة المحاصيل
```json
{
  "suitable_crops": [
    {
      "crop": "tomato",
      "name_ar": "الطماطم",
      "suitability_score": 0.92,
      "analysis": {
        "temperature": {"status": "optimal", "score": 1.0},
        "rainfall": {"status": "acceptable", "score": 0.8}
      }
    }
  ],
  "best_crop": {
    "crop": "tomato",
    "name_ar": "الطماطم"
  }
}
```

## 🧪 الاختبار

```bash
# اختبار صحة الخدمة
curl http://localhost:8001/health

# اختبار تحليل التربة
curl -X POST http://localhost:8001/analyze-soil \
  -H "Content-Type: application/json" \
  -d '{"sensor_data": {"ph": 6.5, "nitrogen": 45}}'

# الحصول على المحاصيل المدعومة
curl http://localhost:8001/supported-crops
```

## 📈 المراقبة

- **Health Check**: `/health`
- **Metrics**: متوفرة في logs
- **Documentation**: `/docs` (Swagger UI)

## 🔧 التكوين

متغيرات البيئة:
```env
PYTHONPATH=/app
SERVICE_NAME=soil-analysis
LOG_LEVEL=INFO
MODEL_PATH=./models
```

## 📝 ملاحظات التطوير

### إضافة محاصيل جديدة
لإضافة محصول جديد، عدّل `crop_database` في ملف `climate_crop_matcher.py`:

```python
'new_crop': {
    'name_ar': 'اسم المحصول',
    'temp_range': (min_temp, max_temp),
    'rainfall_range': (min_rain, max_rain),
    'humidity_range': (min_humidity, max_humidity),
    'soil_ph_range': (min_ph, max_ph),
    'growing_season': 'season_name',
    'season_months': [month_list],
    'water_requirement': 'requirement_level',
    'soil_types': ['suitable_soil_types']
}
```

### تحسين دقة النماذج
1. جمع بيانات تدريب حقيقية
2. إعادة تدريب النماذج باستخدام البيانات الجديدة
3. تقييم الأداء وضبط المعاملات
4. نشر النماذج المحدثة

## 🐛 استكشاف الأخطاء

### مشاكل شائعة:
1. **خطأ في تحميل النماذج**: تأكد من وجود ملفات النماذج
2. **خطأ في معالجة الصور**: تحقق من تنسيق الصورة المرفوعة
3. **بيانات مفقودة**: تأكد من إرسال جميع الحقول المطلوبة

### سجلات الأخطاء:
```bash
# عرض السجلات
docker logs container_name

# المراقبة المباشرة
docker logs -f container_name
```

## 📞 الدعم

للمساعدة التقنية:
- GitHub Issues: [soil-analysis/issues](https://github.com/agrogrowth/ai/issues)
- Email: soil-analysis@agrogrowth.com
