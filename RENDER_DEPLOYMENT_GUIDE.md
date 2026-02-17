# 🚀 Render Deployment Guide - AgroGrowth AI Services

This guide helps you deploy all 6 AI microservices to Render.

---

## 📋 Prerequisites

1. **GitHub Account** - Push your code to GitHub
2. **Render Account** - Sign up at [render.com](https://render.com)
3. **Your Repository** - Must be pushed to GitHub

---

## 🔧 Step 1: Push Code to GitHub

```bash
git add .
git commit -m "Add Render-compatible Dockerfiles for AI services"
git push origin main
```

---

## 🌐 Step 2: Create Render Account

1. Go to [render.com](https://render.com)
2. Click "Sign Up"
3. Connect with GitHub
4. Authorize GitHub access

---

## 🚀 Step 3: Deploy Each Service to Render

### **Service 1: Soil Analysis**

1. Click **"New +"** → **"Web Service"**
2. Select your GitHub repository
3. Fill in:
   - **Name:** `soil-analysis`
   - **Branch:** `main` (or your branch)
   - **Runtime:** `Docker`
   - **Dockerfile path:** `agrogrowth-ai/soil_analysis/Dockerfile.render`
   - **Port:** `8000`
4. Click **"Create Web Service"**
5. **Wait for deployment** (2-5 minutes)
6. **Copy the URL** from Render (will look like: `https://soil-analysis.onrender.com`)

### **Service 2: Crop Recommendation**

1. Click **"New +"** → **"Web Service"**
2. Select your GitHub repository
3. Fill in:
   - **Name:** `crop-recommendation`
   - **Runtime:** `Docker`
   - **Dockerfile path:** `agrogrowth-ai/crop_recommendation/Dockerfile.render`
   - **Port:** `8000`
4. **Copy the URL** when deployed

### **Service 3: Image Diagnosis**

1. Click **"New +"** → **"Web Service"**
2. Fill in:
   - **Name:** `image-diagnosis`
   - **Dockerfile path:** `agrogrowth-ai/image_diagnosis/Dockerfile.render`
   - **Port:** `8000`
3. **Copy the URL** when deployed

### **Service 4: Market Prediction**

1. Click **"New +"** → **"Web Service"**
2. Fill in:
   - **Name:** `market-prediction`
   - **Dockerfile path:** `agrogrowth-ai/market_prediction/Dockerfile.render`
   - **Port:** `8000`
3. **Copy the URL** when deployed

### **Service 5: Intelligent Agent**

1. Click **"New +"** → **"Web Service"**
2. Fill in:
   - **Name:** `intelligent-agent`
   - **Dockerfile path:** `agrogrowth-ai/intelligent_agent/Dockerfile.render`
   - **Port:** `8000`
3. **Copy the URL** when deployed

### **Service 6: Weather Yield Intelligence**

1. Click **"New +"** → **"Web Service"**
2. Fill in:
   - **Name:** `weather-yield-intelligence`
   - **Dockerfile path:** `agrogrowth-ai/weather_yield_intelligence/Dockerfile.render`
   - **Port:** `8000`
3. **Copy the URL** when deployed

---

## ✅ Step 4: Collect All Service URLs

After deploying all 6 services, you should have URLs like:

```
Service 1: https://soil-analysis.onrender.com
Service 2: https://crop-recommendation.onrender.com
Service 3: https://image-diagnosis.onrender.com
Service 4: https://market-prediction.onrender.com
Service 5: https://intelligent-agent.onrender.com
Service 6: https://weather-yield-intelligence.onrender.com
```

---

## 📝 Step 5: Update Your Main App's `.env`

Update your main application's `.env` file with the real Render URLs:

```env
# Replace localhost with Render URLs
SOIL_ANALYSIS_URL=https://soil-analysis.onrender.com
CROP_RECOMMENDATION_URL=https://crop-recommendation.onrender.com
IMAGE_DIAGNOSIS_URL=https://image-diagnosis.onrender.com
MARKET_FORECAST_URL=https://market-prediction.onrender.com
INTELLIGENT_AGENT_URL=https://intelligent-agent.onrender.com
SMART_MARKETPLACE_URL=https://weather-yield-intelligence.onrender.com

# Other variables (keep existing)
VITE_SUPABASE_URL=https://jymrhhlwdbclctobhbsi.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
DATABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

---

## 🧪 Step 6: Test Services

Test that your services are running:

```bash
# Test soil analysis service
curl https://soil-analysis.onrender.com/health

# Test crop recommendation
curl https://crop-recommendation.onrender.com/health

# Test image diagnosis
curl https://image-diagnosis.onrender.com/health

# Test market prediction
curl https://market-prediction.onrender.com/health

# Test intelligent agent
curl https://intelligent-agent.onrender.com/health

# Test weather yield intelligence
curl https://weather-yield-intelligence.onrender.com/health
```

Expected response:
```json
{"status": "healthy"}
```

---

## 🔄 Step 7: Update Main App & Deploy

1. Update your main app's `.env` with real Render URLs
2. Restart your dev server or redeploy your main app
3. Test that the app calls real AI services (not mocks)

---

## 📊 Cost Estimate

| Service | Type | Monthly Cost |
|---------|------|-------------|
| Soil Analysis | Web Service | $7-20 |
| Crop Recommendation | Web Service | $7-20 |
| Image Diagnosis | Web Service | $7-20 |
| Market Prediction | Web Service | $7-20 |
| Intelligent Agent | Web Service | $7-20 |
| Weather Yield Intelligence | Web Service | $7-20 |
| **TOTAL** | - | **$42-120/month** |

*Pricing depends on usage. Free tier available for testing.*

---

## 🔧 Environment Variables Per Service

If your services need specific environment variables (API keys, database URLs), add them in Render:

1. Go to each service in Render dashboard
2. Click **Settings**
3. Scroll to **Environment**
4. Add variables like:

```
DB_HOST=your-database-host
REDIS_URL=your-redis-url
API_KEY=your-api-key
```

---

## 🚨 Troubleshooting

### **Service won't deploy**

```
Error: Build failed
```

**Solution:**
1. Check build logs in Render dashboard
2. Ensure Dockerfile path is correct
3. Make sure requirements.txt exists

### **Service keeps crashing**

```
Error: Service crashed
```

**Solution:**
1. Check logs: Click service → Logs tab
2. Check health endpoint: `curl https://your-service.onrender.com/health`
3. Ensure port is 8000

### **Calls to service timeout**

```
Error: Service unavailable
```

**Solution:**
1. Check if service is running in Render dashboard
2. Test with curl: `curl https://your-service.onrender.com/health`
3. Increase timeout in your main app

---

## 📞 Support

- **Render Docs:** https://render.com/docs
- **FastAPI Docs:** https://fastapi.tiangolo.com
- **GitHub Issues:** Add issue to your repo

---

## ✨ Next Steps

1. Deploy all 6 services to Render
2. Collect the HTTPS URLs
3. Update your main app's `.env` with real URLs
4. Test with real AI service calls
5. Remove mock data generators from routes
6. Deploy main app with production settings

---

**Status:** Ready for production deployment! 🎉
