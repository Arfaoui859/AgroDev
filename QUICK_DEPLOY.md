# 🚀 دليل النشر السريع - AgroGrowth

## 1. إعداد قاعدة البيانات (Supabase)

### خطوة 1: إنشاء مشروع Supabase

1. اذهب إلى [supabase.com](https://supabase.com)
2. أنشئ حساب جديد
3. انقر "New Project"
4. اختر اسم المشروع: `agrogrowth-production`
5. اختر كلمة مرور قوية للقاعدة
6. اختر المنطقة الأقرب (Europe - Germany)

### خطوة 2: تشغيل سكريبت إعداد القاعدة

1. في Supabase Dashboard، اذهب إلى "SQL Editor"
2. انسخ والصق محتوى `database/cloud-setup.sql`
3. انقر "Run" لتنفيذ السكريبت
4. ثم انسخ والصق محتوى `database/supabase-setup.sql`
5. انقر "Run" مرة أخرى

### خطوة 3: الحصول على متغيرات الاتصال

من Settings > API:

- `SUPABASE_URL`: Project URL
- `SUPABASE_ANON_KEY`: anon public key
- `DATABASE_URL`: من Settings > Database > Connection string

## 2. إعداد Redis (Upstash)

### خطوة 1: إنشاء قاعدة Redis

1. اذهب إلى [upstash.com](https://upstash.com)
2. أنشئ حساب وسجل دخول
3. انقر "Create Database"
4. اختر اسم: `agrogrowth-cache`
5. اختر المنطقة: Europe (Germany)
6. انقر "Create"

### خطوة 2: الحصول على بيانات الاتصال

من Database Dashboard:

- `REDIS_URL`: Connection string
- `UPSTASH_REDIS_REST_URL`: REST API URL
- `UPSTASH_REDIS_REST_TOKEN`: REST Token

## 3. نشر خدمات AI (Railway)

### خطوة 1: إعداد Railway

1. اذهب إلى [railway.app](https://railway.app)
2. سجل دخول بـ GitHub
3. انقر "New Project"
4. اختر "Deploy from GitHub repo"
5. اختر repository: `Arfaoui859/app-AgroGrowth-v7`

### خطوة 2: إعداد الخدمات

لكل خدمة AI:

#### خدمة تحليل التربة:

```bash
# في Railway Dashboard
Service Name: agrogrowth-soil-analysis
Root Directory: agrogrowth-ai/soil_analysis
Build Command: pip install -r ../requirements.txt
Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT

# متغيرات البيئة:
PORT=8001
SERVICE_PORT=8001
MODEL_PATH=/app/models
PYTHONPATH=/app
DATABASE_URL=[نسخ من Supabase]
REDIS_URL=[نسخ من Upstash]
```

#### خدمة توصيات المحاصيل:

```bash
Service Name: agrogrowth-crop-recommendation
Root Directory: agrogrowth-ai/crop_recommendation
Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
PORT=8002
```

#### خدمة تشخيص الصور:

```bash
Service Name: agrogrowth-image-diagnosis
Root Directory: agrogrowth-ai/image_diagnosis
Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
PORT=8003
```

### خطوة 3: الحصول على URLs

بعد النشر، ستحصل على URLs مثل:

- `https://agrogrowth-soil-analysis-production.up.railway.app`
- `https://agrogrowth-crop-recommendation-production.up.railway.app`
- `https://agrogrowth-image-diagnosis-production.up.railway.app`

## 4. نشر Frontend (Vercel)

### خطوة 1: إعداد Vercel

1. اذهب إلى [vercel.com](https://vercel.com)
2. سجل دخول بـ GitHub
3. انقر "Add New Project"
4. اختر repository: `Arfaoui859/app-AgroGrowth-v7`
5. اختر framework: "Vite"

### خطوة 2: تكوين متغيرات البيئة

في Vercel Dashboard > Settings > Environment Variables:

```env
# Database
DATABASE_URL=[نسخ من Supabase]
SUPABASE_URL=[نسخ من Supabase]
SUPABASE_ANON_KEY=[نسخ من Supabase]
REDIS_URL=[نسخ من Upstash]

# Cloud Services
VITE_USE_CLOUD_SERVICES=true
VITE_FALLBACK_TO_MOCK=false

# AI Services URLs (نسخ من Railway)
VITE_SOIL_ANALYSIS_URL=https://agrogrowth-soil-analysis-production.up.railway.app
VITE_CROP_RECOMMENDATION_URL=https://agrogrowth-crop-recommendation-production.up.railway.app
VITE_IMAGE_DIAGNOSIS_URL=https://agrogrowth-image-diagnosis-production.up.railway.app

# API
VITE_API_URL=https://your-app.vercel.app/api

# External APIs (اختياري)
WEATHER_API_KEY=your_weather_api_key
OPENAI_API_KEY=your_openai_api_key
```

### خطوة 3: النشر

1. انقر "Deploy"
2. انتظر اكتمال البناء (Build)
3. احصل على URL النهائي

## 5. الاختبار والتحقق

### اختبار الخدمات

```bash
# اختبار الصحة العامة
./scripts/test-deployment.sh --cloud \
  -f https://your-app.vercel.app \
  -a https://your-app.vercel.app/api

# أو اختبار يدوي
curl https://agrogrowth-soil-analysis-production.up.railway.app/health
```

### فحص الحالة في التطبيق

1. اذهب إلى `https://your-app.vercel.app/cloud-status`
2. تحقق من حالة جميع الخدمات
3. اختبر التحليل الحقيقي

## 6. خطوات إضافية (اختيارية)

### تفعيل Domain مخصص

1. في Vercel: Settings > Domains
2. أضف domain مخصص مثل `app.agrogrowth.com`

### تفعيل Monitoring

1. في Railway: Settings > Monitoring
2. في Vercel: Analytics & Speed Insights

### Backup تلقائي

- Supabase: تلقائي يومياً
- Railway: Volume snapshots

## 🎯 النتيجة المتوقعة

بعد اكتمال هذه الخطوات:

- ✅ خدم��ت AI حقيقية تعمل على Railway
- ✅ قاعدة بيانات احترافية على Supabase
- ✅ Frontend سريع على Vercel
- ✅ تحليل حقيقي بدلاً من البيانات التجريبية
- ✅ مراقبة شاملة للخدمات

## 🆘 الدعم

إذا واجهت مشاكل:

1. تحقق من Logs في Railway Dashboard
2. راجع Build Logs في Vercel
3. استخدم `/cloud-status` للمراقبة
4. راجع `CLOUD_DEPLOYMENT.md` للتفاصيل الكاملة

---

⏱️ **وقت النشر المتوقع**: 30-45 دقيقة
💰 **التكلفة**: مجاني للاستخدام المحدود، $5-20/شهر للاستخدام المكثف
