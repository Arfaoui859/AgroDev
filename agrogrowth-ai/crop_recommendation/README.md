# 🌾 Crop Recommendation AI Service

## نظرة عامة

خدمة الذكاء الاصطناعي للتوصيات الذكية للمحاصيل وتقدير الأرباح، تحتوي على نموذجين متطورين:

## 🧠 النماذج المتاحة

### 1. CropRecommenderAI - نظام التوصيات الذكي للمحاصيل
- **الوظيفة**: توصيات ذكية للمحاصيل بناءً على الظروف المتاحة
- **المدخلات**: ا��مناخ، التربة، الخبرة، رأس المال، المخاطر المقبولة
- **المخرجات**: قائمة مرتبة بالمحاصيل المناسبة مع تحليل شامل

### 2. ProfitEstimatorAI - نظام تقدير الأرباح المتقدم
- **الوظيفة**: تحليل مالي شامل وتقدير الربحية
- **المدخلات**: بيانات المحصول، حجم المزرعة، التكاليف المتوقعة
- **المخرجات**: تحليل مالي مفصل، تقييم المخاطر، توصيات الاستثمار

## 🚀 تشغيل الخدمة

### تشغيل محلي
```bash
cd crop_recommendation
python main.py
```

### تشغيل باستخدام Docker
```bash
docker build -t agrogrowth-crop-recommendation .
docker run -p 8002:8002 agrogrowth-crop-recommendation
```

## 📡 نقاط النهاية (API Endpoints)

### التوصيات الذكية للمحاصيل
```http
POST /recommend-crops
Content-Type: application/json

{
  "temperature": 25.0,
  "annual_rainfall": 600.0,
  "soil_ph": 6.5,
  "soil_quality_score": 0.8,
  "water_availability": 0.9,
  "farmer_experience_years": 8,
  "available_capital": 15000,
  "farm_size": 3.0,
  "risk_tolerance": 0.6
}
```

### تقدير الأرباح
```http
POST /estimate-profit
Content-Type: application/json

{
  "crop_name": "wheat",
  "farm_size": 5.0,
  "planning_horizon_years": 1,
  "soil_quality_score": 0.8,
  "climate_suitability_score": 0.9,
  "farmer_experience_years": 10,
  "technology_level": 0.7,
  "market_distance_km": 30,
  "seed_cost_per_hectare": 200,
  "fertilizer_cost_per_hectare": 350,
  "labor_days_per_hectare": 25
}
```

### مقارنة المحاصيل
```http
POST /compare-crops
Content-Type: application/json

{
  "crops_data": [
    {
      "crop_name": "wheat",
      "farm_size": 5.0,
      "soil_quality_score": 0.8
    },
    {
      "crop_name": "corn",
      "farm_size": 5.0,
      "soil_quality_score": 0.8
    }
  ]
}
```

### توصية سريعة
```http
POST /quick-recommendation
Content-Type: application/json

{
  "temperature": 22.0,
  "rainfall": 500.0,
  "soil_ph": 6.8,
  "farm_size": 2.0
}
```

## 📊 أمثلة الاستجابات

### توصيات المحاصيل
```json
{
  "recommendations": [
    {
      "rank": 1,
      "crop": "wheat",
      "name_ar": "القمح",
      "category": "حبوب",
      "suitability_score": 0.92,
      "predicted_yield_per_hectare": 3800,
      "profit_analysis": {
        "net_profit": 8500,
        "roi_percent": 45.2,
        "profit_margin_percent": 35.8
      },
      "risk_assessment": {
        "overall_risk_score": 0.3,
        "overall_risk_level": "منخفض"
      }
    }
  ],
  "best_recommendation": {
    "crop": "wheat",
    "name_ar": "القمح"
  },
  "seasonal_advice": {
    "current_month_crops": [
      {
        "crop": "القمح",
        "timing": "مناسب للزراعة الآن"
      }
    ]
  }
}
```

### تقدير الأرباح
```json
{
  "crop_name": "wheat",
  "crop_name_ar": "القمح",
  "financial_analysis": {
    "gross_revenue": 12500,
    "total_costs": 4200,
    "net_profit": 8300,
    "roi_percent": 197.6,
    "profit_margin_percent": 66.4,
    "payback_period_months": 12
  },
  "risk_analysis": {
    "overall_risk_score": 0.35,
    "overall_risk_level": "متوسط",
    "price_risk": {
      "score": 0.3,
      "level": "منخفض"
    }
  },
  "sensitivity_analysis": {
    "worst_case": {
      "profit": 4200,
      "roi_percent": 100
    },
    "best_case": {
      "profit": 12800,
      "roi_percent": 305
    }
  }
}
```

## 🎯 الميزات الرئيسية

### نظام التوصيات:
- تحليل 8+ محاصيل رئيسية
- تحليل الملائمة لكل محصول
- تقييم المخاطر والعوائد
- توصيات موسمية
- تخصيص حسب خبرة المزارع

### تقدير الأرباح:
- تحليل مالي شامل (الإيرادات، التكاليف، الأرباح)
- حساب العائد على الاستثمار (ROI)
- تحليل نقطة التعادل
- تقييم المخاطر متعدد الأبعاد
- تحليل الحساسية للمتغيرات

### مقارنة المحاصيل:
- ترتيب المحاصيل حسب معايير مختلفة
- توصيات التنويع
- استراتيجيات المحفظة المتوازنة
- تحليل المخاطر والعوائد

## 🧪 الاختبار

```bash
# اختبار صحة الخدمة
curl http://localhost:8002/health

# توصية سريعة
curl -X POST http://localhost:8002/quick-recommendation \
  -H "Content-Type: application/json" \
  -d '{"temperature": 25, "rainfall": 600, "soil_ph": 6.5, "farm_size": 2.0}'

# الحصول على المحاصيل المدعومة
curl http://localhost:8002/supported-crops

# تفاصيل محصول محدد
curl http://localhost:8002/crop-details/wheat
```

## 📈 المراقبة

- **Health Check**: `/health`
- **Documentation**: `/docs` (Swagger UI)
- **Metrics**: متوفرة في السجلات

## 🔧 التكوين

متغيرات البيئة:
```env
PYTHONPATH=/app
SERVICE_NAME=crop-recommendation
LOG_LEVEL=INFO
```

## 📊 قاعدة البيانات

### المحاصيل المدعومة:
- **الحبوب**: القمح، الذرة، الأرز
- **الخضروات**: الطماطم، البطاطس، البصل
- **الفواكه**: التمور، الزيتون

### البيانات الاقتصادية:
- أسعار السوق التاريخية
- تكاليف الزراعة المفصلة
- تحليل العرض والطلب
- إمكانات التصدير

## 💡 خوارزميات الذكاء الاصطناعي

### النماذج المستخدمة:
- **Random Forest Classifier**: لتصنيف المحاصيل المناسبة
- **Gradient Boosting Regressor**: لتوقع الأسعار والإنتاجية
- **Decision Trees**: لتحليل المخاطر

### التدريب والتحسين:
- بيانات تدريب اصطناعية شاملة
- تحديث دوري للنماذج
- معايرة على البيانات المحلية

## 🔮 التطوير المستقبلي

### ميزات مخططة:
- تكامل مع بيانات ال��قمار الصناعية
- تحليل الاتجاهات السوقية في الوقت الفعلي
- نماذج تعلم عميق للتنبؤ بالأسعار
- تخصيص حسب المنطقة الجغرافية

### تحسينات مقترحة:
- إضافة محاصيل جديدة
- تحسين دقة تقدير التكاليف
- تطوير نماذج التنبؤ الموسمي
- تحليل تأثير تغير المناخ

## 📞 الدعم

للمساعدة التقنية:
- GitHub Issues: [crop-recommendation/issues](https://github.com/agrogrowth/ai/issues)
- Email: crop-recommendation@agrogrowth.com
