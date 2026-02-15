# 🤖 AgroGrowth AI Infrastructure

## 📋 نظرة عامة

هذا المشروع يحتوي على جميع نماذج الذكاء الاصطناعي لمنصة AgroGrowth، مبني كـ microservices مستقلة وقابلة للتطوير.

## 🏗️ الهيكل العام

```
agrogrowth-ai/
├── ai_common/                     # الوحدات المشتركة
│   ├── model_loader.py           # محمل النماذج
│   ├── utils.py                  # الأدوات المساعدة
│   └── base_service.py           # قالب الخدمة الأساسي
├── soil_analysis/                # تحليل التربة والبيئة
├── crop_recommendation/          # توصيات المحاصيل
├── image_diagnosis/              # تشخيص الصور
├── market_forecast/              # التنبؤ بالسوق
├── smart_assistant/              # المساعد الذكي
├── market_matching/              # ربط السوق
├── models/                       # النماذج المدربة
└── docker-compose.yml           # إعداد الحاويات
```

## 🧠 نماذج الذكاء الاصطناعي

### 1. تحليل التربة والبيئة الزراعية
- **SoilAnalyzerAI**: تحليل خصائص التربة (pH، النيتروجين، الفوسفور، البوتاسيوم)
- **ClimateCropMatcher**: مطابقة المناخ مع المحاصيل المناسبة
- **SoilImageDiagnosisAI**: تشخيص التربة من الصور

### 2. التوصيات الذكية للمحاصيل
- **CropRecommenderAI**: اقتراح المحاصيل الأنسب
- **ProfitEstimatorAI**: تقدير الأرباح المتوقعة

### 3. تشخيص الآفات والأمراض
- **PlantDiseaseDetector**: كشف أمراض النباتات من الصور
- **LeafScanAI**: فحص الأوراق وتشخيص المشاكل

### 4. التنبؤ بالأسعار والسوق
- **MarketForecastAI**: التنبؤ بأسعار المحاصيل
- **SupplyDemandAI**: تحليل العرض والطلب

### 5. المساعد الذكي
- **AgroChatAI**: محادثة ذكية مع المزارعين
- **FarmingTasksPlanner**: تخطيط المهام الزراعية
- **AlertNotifierAI**: نظام التنبيهات الذكية

### 6. ربط السوق
- **SmartMatchAI**: ربط المزارعين بالمشترين
- **ProductQualityEvaluator**: تقييم جودة المنتجات

## 🚀 تشغيل الخدمات

### تشغيل جميع الخدمات
```bash
docker-compose up -d
```

### تشغيل خدمة محددة
```bash
docker-compose up soil-analysis
```

### تطوير محلي
```bash
# تثبيت المتطلبات
pip install -r requirements.txt

# تشغيل خدمة محددة
cd soil_analysis
python main.py
```

## 📊 المراقبة والصحة

كل خدمة تحتوي على نقاط مراقبة:
- `/health` - فحص صحة الخدمة
- `/metrics` - مقاييس الأداء
- `/docs` - وثائق API التفاعلية

## 🔧 التكوين

متغيرات البيئة المطلوبة:
```env
# قاعدة البيانات
DB_HOST=localhost
DB_PORT=5432
DB_NAME=agrogrowth
DB_USER=postgres
DB_PASSWORD=password

# Redis للتخزين المؤقت
REDIS_HOST=localhost
REDIS_PORT=6379

# مفاتيح API الخارجية
WEATHER_API_KEY=your_weather_api_key
SATELLITE_API_KEY=your_satellite_api_key
```

## 🧪 الاختبار

```bash
# تشغيل جميع الاختبارات
pytest

# اختبار خدمة محددة
pytest soil_analysis/tests/
```

## 📈 الأداء والتحسين

- استخدام Redis للتخزين المؤقت
- تحسين النماذج للإنتاج
- مراقبة الذاكرة والمعالج
- تحديث النماذج تلقائياً

## 🔒 الأمان

- التحقق من المدخلات
- تشفير البيانات الحساسة
- مراقبة الوصول
- حدود معدل الطلبات

## 📞 الدعم الفني

للمساعدة أو الاستفسارات:
- Email: ai-support@agrogrowth.com
- Slack: #ai-team
- GitHub Issues: [agrogrowth-ai/issues](https://github.com/agrogrowth/ai/issues)

## 📄 الترخيص

هذا المشروع مرخص تحت رخصة MIT. راجع ملف LICENSE للتفاصيل.
