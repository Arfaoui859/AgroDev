# 🚀 دليل النشر السحابي - AgroGrowth Platform

هذا الدليل يوضح كيفية نشر منصة AgroGrowth على الخدمات السحابية المختلفة.

## 📋 نظرة عامة على المعمارية

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    Frontend     │    │   Backend API   │    │  AI Services   │
│   (Vercel)      │───▶│   (Vercel)      │───▶│   (Railway)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Service Worker│    │  PostgreSQL     │    │     Redis       │
│   (Offline)     │    │  (Supabase)     │    │   (Upstash)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🏗️ خطوات النشر

### المرحلة 1: إعداد قواعد البيانات

#### Supabase (PostgreSQL)

1. إنشاء حساب على [supabase.com](https://supabase.com)
2. إنشاء مشروع جديد
3. نسخ DATABASE_URL من Settings > Database
4. تشغيل سكريبت إنشاء الجداول:

```sql
-- في SQL Editor على Supabase
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- جداول المزارع والمستخدمين
CREATE TABLE farms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    location JSONB,
    size_hectares DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT NOW()
);

-- جداول تحليل التربة
CREATE TABLE soil_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID REFERENCES farms(id),
    sensor_data JSONB NOT NULL,
    analysis_result JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- جداول المحاصيل
CREATE TABLE crop_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID REFERENCES farms(id),
    input_data JSONB NOT NULL,
    recommendations JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### Upstash (Redis)

1. إنشاء حساب على [upstash.com](https://upstash.com)
2. إنشاء قاعدة بيانات Redis جديدة
3. نسخ REDIS_URL من Console

### المرحلة 2: نشر خدمات الذكاء الاصطناعي

#### Railway

1. إنشاء حساب على [railway.app](https://railway.app)
2. ربط GitHub repository
3. نشر كل خدمة AI منفصلة:

```bash
# إعداد مشروع Railway
railway login
railway init

# نشر خدمة تحليل التربة
railway up --service soil-analysis

# نشر خدمة توصيات المحاصيل
railway up --service crop-recommendation

# نشر خدمة تشخيص الصور
railway up --service image-diagnosis
```

#### متغيرات البيئة لخدمات AI

```env
# في Railway Dashboard لكل خدمة
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
SERVICE_PORT=8001
MODEL_PATH=/app/models
PYTHONPATH=/app
```

### المرحلة 3: نشر Frontend و Backend

#### Vercel

1. إنشاء حساب على [vercel.com](https://vercel.com)
2. ربط GitHub repository
3. تكوين متغيرات البيئة:

```env
# في Vercel Dashboard
VITE_USE_CLOUD_SERVICES=true
VITE_API_URL=https://your-app.vercel.app/api
VITE_SOIL_ANALYSIS_URL=https://soil-analysis-xxx.railway.app
VITE_CROP_RECOMMENDATION_URL=https://crop-recommendation-xxx.railway.app
VITE_IMAGE_DIAGNOSIS_URL=https://image-diagnosis-xxx.railway.app
VITE_MARKET_PREDICTION_URL=https://market-prediction-xxx.railway.app
VITE_INTELLIGENT_AGENT_URL=https://intelligent-agent-xxx.railway.app

# Database connections
DATABASE_URL=postgresql://...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# External APIs
WEATHER_API_KEY=your_weather_api_key
SATELLITE_API_KEY=your_satellite_api_key
OPENAI_API_KEY=your_openai_api_key
```

## 🔧 تكوين الخدمات

### 1. Railway - خدمات الذكاء الاصطناعي

#### ملف railway.toml (تم إنشاؤه)

```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "agrogrowth-ai/Dockerfile.base"

[deploy]
startCommand = "uvicorn main:app --host 0.0.0.0 --port $PORT"
healthcheckPath = "/health"
```

### 2. Vercel - Frontend والـ API

#### ملف vercel.json (تم إنشاؤه)

```json
{
  "version": 2,
  "builds": [...],
  "routes": [...],
  "env": {...}
}
```

### 3. Dockerfile محسن للإنتاج

تم إنشاء Dockerfiles محسنة لكل خدمة AI مع:

- Multi-stage builds لتقليل حجم الصورة
- Health checks للمراقبة
- Security best practices

## 📊 المراقبة والصحة

### مراقبة الخدمات

```javascript
// التحقق من صحة جميع الخدمات
import { checkAllServicesHealth } from "@/lib/cloud-config";

const servicesStatus = await checkAllServicesHealth();
console.log("Services Health:", servicesStatus);
```

### Logging والتشخيص

- استخدام Vercel Analytics للـ Frontend
- Railway Logs للـ AI Services
- Supabase Logs للقاعدة البيانات

## 🚀 عملية النشر

### النشر التلقائي

```bash
# تشغيل سكريبت النشر
./scripts/deploy-cloud.sh

# أو نشر يدوي:
# 1. Frontend
vercel --prod

# 2. AI Services
railway up

# 3. Database migrations
npm run db:migrate
```

### النشر اليدوي خطوة بخطوة

1. **إعداد قواعد البيانات**

   ```bash
   # Supabase
   npx supabase init
   npx supabase db push

   # Upstash Redis - تلقائي
   ```

2. **نشر AI Services**

   ```bash
   # لكل خدمة AI
   railway up --service [service-name]
   ```

3. **نشر Frontend**
   ```bash
   vercel --prod
   ```

## 🔒 الأمان والمراقبة

### متغيرات البيئة الآمنة

- استخدام Vercel Environment Variables
- Railway Environment Variables
- Supabase Row Level Security

### مراقبة الأداء

- Vercel Web Vitals
- Railway Resource Usage
- Supabase Database Insights

## 📱 PWA والميزات المتقدمة

### Service Worker

تم تحديث Service Worker ليدعم:

- تخزين مؤقت للاستجابات من الخدمات السحابية
- Offline fallback للبيانات المحفوظة
- Background sync للبيانات المعلقة

### Push Notifications

```javascript
// إعداد Push Notifications
const registration = await navigator.serviceWorker.register("/sw.js");
await registration.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: "your-vapid-key",
});
```

## 🧪 الاختبار

### اختبار الخدمات السحابية

```bash
# اختبار صحة الخدمات
curl https://soil-analysis-xxx.railway.app/health

# اختبار API endpoints
curl -X POST https://your-app.vercel.app/api/ai/soil/analyze \
  -H "Content-Type: application/json" \
  -d '{"sensor_data": {"ph": 7.0}}'
```

### اختبار PWA

```bash
# Lighthouse CI
npm run lighthouse:ci

# PWA testing
npm run test:pwa
```

## 🔄 التحديث والصيانة

### تحديث الخدمات

```bash
# تحديث Frontend
git push origin main  # Auto-deploy على Vercel

# تحديث AI Services
railway redeploy --service [service-name]

# تحديث Database
npx supabase db push
```

### Backup والاستعادة

- Supabase automatic backups
- Railway volume snapshots
- Vercel deployment history

## 📞 الدعم والمساعدة

### روابط مفيدة

- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [Supabase Documentation](https://supabase.com/docs)
- [Upstash Documentation](https://docs.upstash.com)

### مؤشرات المشاكل الشائعة

1. **خ��مات AI غير متاحة**: تحقق من Railway deployment logs
2. **قاعدة البيانات بطيئة**: مراجعة Supabase connection limits
3. **Frontend لا يحمل**: تحقق من Vercel build logs

### الحصول على المساعدة

- GitHub Issues
- Discord Community
- Email: support@agrogrowth.com

---

**ملاحظة**: هذا الدليل يفترض أن لديك حسابات على المنصات المذكورة. إذا كنت بحاجة لمساعدة في إعداد حساب أو تكوين خدمة معينة، راجع وثائق المنصة المخصصة.
