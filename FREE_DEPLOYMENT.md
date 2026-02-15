# 🆓 دليل النشر المجاني 100% - AgroGrowth

## 🎯 المنصات المجانية المقترحة

### 1. **Render.com** - خدمات AI (مجاني)

- ✅ **750 ساعة/شهر مجاناً**
- ✅ **Sleep after 15 min** (لكن يستيقظ تلقائياً)
- ✅ **PostgreSQL مجاني**
- ✅ **Redis مجاني**

### 2. **Supabase** - قاعدة البيانات (مجاني)

- ✅ **500MB قاعدة بيانات**
- ✅ **50,000 مستخدم شهرياً**
- ✅ **2GB تخزين ملفات**

### 3. **Vercel** - Frontend (مجاني)

- ✅ **100GB Bandwidth**
- ✅ **Serverless Functions**
- ✅ **Custom Domain**

### 4. **Railway** - بديل (5$ credit مجاناً)

- ✅ **5$ شهرياً للبداية**
- ✅ **يكفي لخدمة واحدة**

---

## 🚀 خطة النشر المجاني

### المرحلة 1: إعداد قاعدة البيانات (Supabase - مجاني)

#### خطوة 1: إنشاء مشروع

```bash
1. اذهب إلى https://supabase.com
2. انقر "Start your project"
3. سجل دخول بـ GitHub
4. انقر "New Project"
5. اختر:
   - Organization: "Personal"
   - Name: "agrogrowth-free"
   - Database Password: [كلمة مرور قوية]
   - Region: "West Europe (Ireland)"
6. انقر "Create new project"
```

#### خطوة 2: إعداد القاعدة

```sql
-- في Supabase > SQL Editor
-- انسخ والصق من database/cloud-setup.sql
-- ثم database/supabase-setup.sql
```

#### خطوة 3: الحصول على المتغيرات

```bash
# من Supabase Dashboard > Settings > API
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://postgres:[password]@db.xxxxx.supabase.co:5432/postgres
```

---

### المرحلة 2: نشر خدمات AI (Render - مجاني)

#### خطوة 1: إنشاء حساب Render

```bash
1. اذهب إلى https://render.com
2. سجل دخول بـ GitHub
3. انقر "New +"
4. اختر "Web Service"
5. Connect GitHub repository: Arfaoui859/app-AgroGrowth-v7
```

#### خطوة 2: إعداد خدمة تحليل التربة

```yaml
Service Name: agrogrowth-soil-analysis
Region: Frankfurt (EU Central)
Branch: zen-garden
Root Directory: agrogrowth-ai/soil_analysis

Build Command:
pip install -r ../requirements.txt

Start Command:
uvicorn main:app --host 0.0.0.0 --port $PORT

Instance Type: Free
```

**متغيرات البيئة:**

```env
PORT=10000
SERVICE_PORT=10000
MODEL_PATH=/opt/render/project/src/models
PYTHONPATH=/opt/render/project/src
DATABASE_URL=[نسخ من Supabase]
REDIS_URL=redis://localhost:6379
```

#### خطوة 3: إعداد خدمة توصيات المحاصيل

```yaml
Service Name: agrogrowth-crop-recommendation
Region: Frankfurt (EU Central)
Root Directory: agrogrowth-ai/crop_recommendation
Build Command: pip install -r ../requirements.txt
Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
Instance Type: Free
```

#### خطوة 4: إعداد خدمة تشخيص الصور

```yaml
Service Name: agrogrowth-image-diagnosis
Region: Frankfurt (EU Central)
Root Directory: agrogrowth-ai/image_diagnosis
Build Command: pip install -r ../requirements.txt
Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
Instance Type: Free
```

#### خطوة 5: الحصول على URLs

بعد النشر ستحصل على:

```
https://agrogrowth-soil-analysis.onrender.com
https://agrogrowth-crop-recommendation.onrender.com
https://agrogrowth-image-diagnosis.onrender.com
```

---

### المرحلة 3: نشر Frontend (Vercel - مجاني)

#### خطوة 1: إعداد Vercel

```bash
1. اذهب إلى https://vercel.com
2. سجل دخول بـ GitHub
3. انقر "Add New..."
4. اختر "Project"
5. Import Git Repository: Arfaoui859/app-AgroGrowth-v7
6. Branch: zen-garden
```

#### خطوة 2: تكوين المشروع

```yaml
Framework Preset: Vite
Root Directory: ./
Build Command: npm run build
Output Directory: client/dist
Install Command: npm install
```

#### خطوة 3: متغيرات البيئة

```env
# Cloud Services
VITE_USE_CLOUD_SERVICES=true
VITE_FALLBACK_TO_MOCK=false

# Database
DATABASE_URL=[نسخ من Supabase]
SUPABASE_URL=[نسخ من Supabase]
SUPABASE_ANON_KEY=[نسخ م�� Supabase]

# AI Services (URLs from Render)
VITE_SOIL_ANALYSIS_URL=https://agrogrowth-soil-analysis.onrender.com
VITE_CROP_RECOMMENDATION_URL=https://agrogrowth-crop-recommendation.onrender.com
VITE_IMAGE_DIAGNOSIS_URL=https://agrogrowth-image-diagnosis.onrender.com

# API
VITE_API_URL=https://your-app.vercel.app/api

# Redis (اختياري - يمكن تجاهله للمرحلة الأولى)
REDIS_URL=redis://localhost:6379
```

#### خطوة 4: النشر

```bash
1. انقر "Deploy"
2. انتظر اكتمال البناء (3-5 دقائق)
3. احصل على URL: https://your-app.vercel.app
```

---

## 🔧 تحسينات للخطة المجانية

### 1. تقليل استهلاك الموارد

```python
# في requirements.txt - احذف المكتبات الثقيلة غير المستخدمة
# tensorflow==2.15.0  # احذف هذا
# torch==2.1.1        # واحذف هذا
# استخدم scikit-learn فقط في البداية
```

### 2. Cache بسيط بدلاً من Redis

```python
# في AI services - استخدم memory cache
from functools import lru_cache

@lru_cache(maxsize=100)
def analyze_soil_cached(sensor_data_hash):
    # تحليل التربة مع cache
    pass
```

### 3. Lightweight Models

```python
# استخدم نماذج أصغر وأسرع
from sklearn.ensemble import RandomForestRegressor
# بدلاً من Deep Learning models
```

---

## 🚀 البديل الفوري (Render + PostgreSQL)

إذا كنت تريد حل أسرع، استخدم Render PostgreSQL مجاناً:

```yaml
# في Render Dashboard
1. انقر "New +"
2. اختر "PostgreSQL"
3. Name: agrogrowth-db
4. Region: Frankfurt
5. Plan: Free
```

ثم احصل على DATABASE_URL من Render وستكون جاهزاً!

---

## 🎯 النتيجة المتوقعة (مجاناً 100%)

✅ **Frontend**: Vercel (مجاني للأبد)
✅ **AI Services**: Render (750 ساعة/شهر)
✅ **Database**: Supabase (500MB مجاناً)
✅ **Domain**: your-app.vercel.app (مجاني)

**الحدود الوحيدة:**

- خدمات Render تنام بعد 15 دقيقة خمول
- تستيقظ خلال 30 ثانية عند أول طلب
- قاعدة البيانات محدودة بـ 500MB

---

## 📊 مراقبة الاستخدام

### Render Dashboard

- مراقبة ساعات الاستخدام
- مراقبة Memory والـ CPU

### Supabase Dashboard

- مراقبة حجم القاعدة
- مراقبة عدد الـ requests

### Vercel Dashboard

- مراقبة Bandwidth
- مراقبة Function Invocations

---

## 🆘 استكشاف ال��خطاء

### مشكلة: خدمة Render تنام

**الحل**: أضف health check كل 10 دقائق

```javascript
// في frontend
setInterval(() => {
  fetch("https://your-service.onrender.com/health").catch(() =>
    console.log("Service sleeping"),
  );
}, 600000); // كل 10 دقائق
```

### مشكلة: نفاد مساحة Supabase

**الحل**: تنظيف البيانات القديمة

```sql
-- حذف البيانات الأقدم من 30 يوم
DELETE FROM sensor_readings WHERE recorded_at < NOW() - INTERVAL '30 days';
```

### مشكلة: بطء التحميل الأول

**الحل**: Warm-up تلقائي

```javascript
// Ping services every 14 minutes
const keepWarm = () => {
  const services = [
    "https://agrogrowth-soil-analysis.onrender.com/health",
    "https://agrogrowth-crop-recommendation.onrender.com/health",
  ];

  services.forEach((url) => {
    fetch(url).catch(() => {});
  });
};

setInterval(keepWarm, 14 * 60 * 1000); // 14 دقيقة
```

---

## 🚀 الخطوات السريعة (30 دقيقة)

1. **Supabase** (5 دقائق): إنشاء project + تشغيل SQL
2. **Render Service 1** (8 دقائق): soil-analysis
3. **Render Service 2** (8 دقائق): crop-recommendation
4. **Render Service 3** (8 دقائق): image-diagnosis
5. **Vercel** (6 دقائق): frontend deployment

**المجموع**: ~35 دقيقة للنشر الكامل!

---

هل تريد البدء؟ أي خطوة تريد أن نبدأ بها؟
