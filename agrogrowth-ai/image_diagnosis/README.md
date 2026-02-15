# 📸 Image Diagnosis AI Service

## نظرة عامة

خدمة الذكاء الاصطناعي لتشخيص أمراض النباتات وتحليل الأوراق من الصور، تحتوي على نموذجين متطورين:

## 🧠 النماذج المتاحة

### 1. PlantDiseaseDetector - كاشف أمراض النباتات
- **الوظيفة**: تشخيص شامل لأمراض النباتات من الصور
- **المدخلات**: صور النباتات (أوراق، سيقان، ثمار)
- **المخرجات**: نوع المرض، شدة الإصابة، خطة العلاج، تقييم المخاطر

### 2. LeafScanAI - ماسح الأوراق الذكي
- **الوظيفة**: تحليل شامل لصحة الأوراق والتغذية
- **المدخلات**: صور الأوراق عالية الجودة
- **المخرجات**: حالة التغذية، النمو، الصحة، التحليل المورفولوجي

## 🚀 تشغيل الخدمة

### تشغيل محلي
```bash
cd image_diagnosis
python main.py
```

### تشغيل باستخدام Docker
```bash
docker build -t agrogrowth-image-diagnosis .
docker run -p 8003:8003 agrogrowth-image-diagnosis
```

## 📡 نقاط النهاية (API Endpoints)

### تشخيص أمراض النباتات
```http
POST /detect-disease
Content-Type: multipart/form-data

file: [plant_image.jpg]
plant_type: "tomato" (اختياري)
```

### تحليل الأوراق الشامل
```http
POST /analyze-leaf
Content-Type: multipart/form-data

file: [leaf_image.jpg]
plant_type: "wheat" (اختياري)
growth_stage: "mature" (اختياري)
```

### التحليل الشامل للنبات
```http
POST /analyze-plant
Content-Type: multipart/form-data

file: [plant_image.jpg]
plant_type: "corn" (اختياري)
growth_stage: "juvenile" (اختياري)
analysis_focus: "comprehensive" (اختياري)
```

### فحص صحة سريع
```http
POST /quick-health-check
Content-Type: multipart/form-data

file: [plant_image.jpg]
```

## 📊 أمثلة الاستجابات

### تشخيص الأمراض
```json
{
  "disease_detection": {
    "primary_disease": {
      "disease": "early_blight",
      "disease_name_ar": "اللفحة المبكرة",
      "probability": 0.85,
      "symptoms": "مرض فطري يسبب بقع بنية مع حلقات متحدة المركز"
    },
    "top_predictions": [
      {
        "disease": "early_blight",
        "disease_name_ar": "اللفحة المبكرة",
        "probability": 0.85,
        "severity_level": "high"
      }
    ]
  },
  "severity_assessment": {
    "severity_score": 2.8,
    "severity_level": "high",
    "affected_area_percentage": 25.5,
    "urgency_level": "عاجل"
  },
  "treatment_plan": {
    "immediate_treatment": [
      "رش مبيدات فطرية",
      "إزالة الأوراق المصابة",
      "تحسين تصريف التربة"
    ],
    "estimated_recovery_time": "21-30 يوم"
  }
}
```

### تحليل الأوراق
```json
{
  "leaf_nutrition": {
    "primary_deficiency": {
      "type": "nitrogen_deficiency",
      "name_ar": "نقص النيتروجين",
      "probability": 0.75,
      "severity_score": 2.1,
      "severity_stage": "متوسط"
    },
    "nutritional_health_score": 65.5
  },
  "growth_assessment": {
    "overall_growth_score": 72.3,
    "development_indicators": {
      "size_adequacy": "مناسب",
      "structural_development": "جيد",
      "maturity_level": "شبه ناضج"
    }
  },
  "health_evaluation": {
    "overall_health_score": 68.9,
    "health_category": "جيد",
    "health_status": "good"
  }
}
```

### الفحص السريع
```json
{
  "overall_health_score": 75.2,
  "overall_status": "جيد مع بعض المشاكل",
  "priority_level": "متوسط",
  "primary_issue": "نقص النيتروجين",
  "quick_recommendations": [
    "إضافة أسمدة نيتروجينية",
    "تحسين نظام الري"
  ],
  "needs_immediate_attention": false
}
```

## 🎯 الميزات الرئيسية

### كشف الأمراض:
- تشخيص 11+ مرض وحالة مختلفة
- تقييم شدة الإصابة
- تحليل المناطق المتضررة
- خطط علاج مفصلة
- تقييم المخاطر والانتشار

### تحليل الأوراق:
- كشف نقص 6 عناصر غذائية رئيسية
- تقييم النمو والتطور
- تحليل الصحة العامة
- دراسة الخصائص المورفولوجية
- كشف الإجهاد البيئي
- تقدير القدرة على التمثيل الضوئي

### التحليل المدمج:
- تقييم شامل لصحة النبات
- توصيات موحدة ومرتبة حسب الأولوية
- جدولة المراقبة
- تحديد المخاوف الرئيسية

## 🧪 الاختبار

```bash
# اختبار صحة الخدمة
curl http://localhost:8003/health

# فحص سريع بصورة
curl -X POST http://localhost:8003/quick-health-check \
  -F "file=@plant_image.jpg"

# الحصول على الأمراض المدعومة
curl http://localhost:8003/supported-diseases

# الحصول على أوجه نقص التغذية المدعومة
curl http://localhost:8003/supported-nutrition-deficiencies
```

## 📈 المراقبة

- **Health Check**: `/health`
- **Capabilities**: `/analysis-capabilities`
- **Documentation**: `/docs` (Swagger UI)
- **Metrics**: متوفرة في السجلات

## 🔧 التكوين

متغيرات البيئة:
```env
PYTHONPATH=/app
SERVICE_NAME=image-diagnosis
MAX_UPLOAD_SIZE=10485760
LOG_LEVEL=INFO
```

## ���� المتطلبات التقنية

### تنسيقات الصور المدعومة:
- JPEG (.jpg, .jpeg)
- PNG (.png)
- BMP (.bmp)
- TIFF (.tiff, .tif)

### الحد الأقصى لحجم الملف:
- 10 ميجابايت

### الدقة الموصى بها:
- الحد الأدنى: 224×224 بكسل
- الموصى به: 1024×1024 بكسل أو أعلى

### وقت المعالجة:
- 2-10 ثوانٍ حسب حجم الصورة وتعقيد التحليل

## 🦠 الأمراض المدعومة

### الأمراض الفطرية:
- اللفحة المبكرة (Early Blight)
- اللفحة المتأخرة (Late Blight)
- البياض الدقيقي (Powdery Mildew)
- صدأ النباتات (Rust)
- أنثراكنوز (Anthracnose)

### الأمراض البكتيرية:
- البقع البكتيرية (Bacterial Spot)

### الأمراض الفيروسية:
- فيروس الموزايك (Mosaic Virus)

### الآفات الحشرية:
- أضرار المن (Aphid Damage)
- العنكبوت الأحمر (Spider Mites)

### مشاكل التغذية:
- نقص العناصر الغذائية

## 🥬 أوجه نقص التغذية المدعومة

### العناصر الكبرى:
- نقص النيتروجين
- نقص الفوسفور
- نقص البوتاسيوم

### العناصر الثانوية:
- نقص الكالسيوم
- نقص المغنيسيوم

### العناصر الصغرى:
- نقص الحديد

## 💡 خوارزميات الذكاء الاصطناعي

### النماذج المستخدمة:
- **Convolutional Neural Networks (CNN)**: لتصنيف الأمراض وتحليل الصور
- **Feature Extraction**: لاستخراج الخصائص اللونية والنسيجية
- **Rule-based Systems**: للتحليل المنطقي والتشخيص
- **Computer Vision**: لمعالجة الصور وتحليل الأشكال

### معالجة الصور:
- تطبيع الألوان والسطوع
- تحسين الدقة والوضوح
- استخراج الخصائص المتقدمة
- تحليل أنماط الألوان والأشكال

## 🔮 التطوير المستقبلي

### ميزات مخططة:
- دعم أمراض إضافية
- تحسين دقة التشخيص
- تكامل مع بيانات الطقس
- نماذج متخصصة لمحاصيل محددة

### تحسينات مقترحة:
- زيادة سرعة المعالجة
- دعم الفيديو والتحليل المتتالي
- تطوير تطبيق محمول
- تحليل البيانات الجماعية

## 📞 الدعم

للمساعدة التقنية:
- GitHub Issues: [image-diagnosis/issues](https://github.com/agrogrowth/ai/issues)
- Email: image-diagnosis@agrogrowth.com

## ⚠️ ملاحظات مهمة

1. **جودة الصورة**: تأثر دقة التشخيص بجودة الصورة المرفوعة
2. **الإضاءة**: تأكد من الإضاءة الجيدة عند التصوير
3. **التركيز**: صور واضحة ومركزة تعطي نتائج أفضل
4. **الخلفية**: تجنب الخلفيات المعقدة أو المشتتة
5. **الحجم**: صور بدقة عالية تحسن من دقة التحليل

## 🔐 الأمان والخصوصية

- تشفير البيانات أثناء النقل
- عدم حفظ الصور بعد التحليل
- حماية ضد الملفات الضارة
- حدود آمنة لحجم الملفات
