# 🚀 AgroGrowth AI Services Deployment Guide

Complete guide to run all AI microservices locally or in production on Railway/Docker.

---

## 📊 AI Services Overview

| Service | Port | Status | File | Purpose |
|---|---|---|---|---|
| Soil Analysis | 8001 | ✅ Ready | `agrogrowth-ai/soil_analysis/main.py` | Soil analysis, climate matching, soil image diagnosis |
| Crop Recommendation | 8002 | ✅ Ready | `agrogrowth-ai/crop_recommendation/main.py` | Crop recommendations, profit estimation |
| Image Diagnosis | 8003 | ⚠️ Conflict | `agrogrowth-ai/image_diagnosis/main.py` | Plant disease detection, leaf analysis |
| Market Prediction | 8003 | ⚠️ Conflict | `agrogrowth-ai/market_prediction/main.py` | Market forecasting, supply-demand analysis |
| Irrigation Optimization | 8004 | ✅ Ready | `agrogrowth-ai/irrigation_optimization/main.py` | Smart irrigation scheduling |
| Intelligent Agent | 8005 | ⚠️ Conflict | `agrogrowth-ai/intelligent_agent/main.py` | Farming chat AI, task planning, alerts |
| Pest Control | 8005 | ⚠️ Conflict | `agrogrowth-ai/pest_control/main.py` | Pest detection and recommendations |
| Weather/Yield Intelligence | 8006 | ✅ Ready | `agrogrowth-ai/weather_yield_intelligence/main.py` | Weather analysis, yield prediction |

---

## ⚠️ Port Conflicts Found

### Issue
Three services have port conflicts:
- **Port 8003**: Image Diagnosis vs Market Prediction
- **Port 8005**: Intelligent Agent vs Pest Control

### Solution
We need to reassign ports:
- **Image Diagnosis** → Port 8003 (keep)
- **Market Prediction** → Port 8004 (change from 8003)
- **Intelligent Agent** → Port 8005 (keep)
- **Pest Control** → Port 8006 (change from 8005)
- **Weather/Yield Intelligence** → Port 8007 (change from 8006)

---

## 🐳 Option 1: Run with Docker Compose (Recommended)

### Prerequisites
- Docker and Docker Compose installed
- At least 8GB RAM available
- Port range 8001-8007 available

### Step 1: Start All Services
```bash
docker-compose up -d
```

This will start:
- ✅ Frontend (port 5173)
- ✅ Backend (port 8080)
- ✅ All 8 AI services (ports 8001-8007)
- ✅ PostgreSQL database (port 5432)
- ✅ Redis cache (port 6379)
- ✅ Adminer DB UI (port 8081)
- ✅ Redis Commander (port 8082)

### Step 2: Verify All Services Are Running
```bash
docker-compose ps
```

Expected output:
```
NAME                  STATUS
agrogrowth-frontend   Up 2 minutes
agrogrowth-backend    Up 2 minutes
soil-analysis         Up 2 minutes
crop-recommendation   Up 2 minutes
image-diagnosis       Up 2 minutes
market-prediction     Up 2 minutes
irrigation-optim...   Up 2 minutes
intelligent-agent     Up 2 minutes
pest-control          Up 2 minutes
weather-yield-intel   Up 2 minutes
postgres              Up 2 minutes
redis                 Up 2 minutes
```

### Step 3: Test Services
```bash
# Test soil analysis service
curl http://localhost:8001/health

# Test crop recommendation service  
curl http://localhost:8002/health

# Test image diagnosis service
curl http://localhost:8003/health

# Test market prediction service
curl http://localhost:8004/health

# Test irrigation optimization service
curl http://localhost:8005/health

# Test intelligent agent service
curl http://localhost:8006/health

# Test pest control service
curl http://localhost:8007/health
```

### Step 4: View Service Logs
```bash
# View logs for a specific service
docker-compose logs -f soil-analysis

# View logs for all services
docker-compose logs -f

# View last 50 lines
docker-compose logs --tail=50
```

---

## 🐍 Option 2: Run Services Locally (Python)

### Prerequisites
- Python 3.9+ installed
- pip or conda package manager
- Virtual environment recommended

### Step 1: Install Dependencies
```bash
cd agrogrowth-ai
pip install -r requirements.txt
```

### Step 2: Start Services (Each in Separate Terminal)

**Terminal 1 - Soil Analysis**
```bash
cd agrogrowth-ai/soil_analysis
python main.py
# Output: Uvicorn running on http://0.0.0.0:8001
```

**Terminal 2 - Crop Recommendation**
```bash
cd agrogrowth-ai/crop_recommendation
python main.py
# Output: Uvicorn running on http://0.0.0.0:8002
```

**Terminal 3 - Image Diagnosis**
```bash
cd agrogrowth-ai/image_diagnosis
python main.py
# Output: Uvicorn running on http://0.0.0.0:8003
```

**Terminal 4 - Market Prediction** (Port needs to be 8004)
```bash
cd agrogrowth-ai/market_prediction
# Edit main.py line: port=8004 (change from 8003)
python main.py
# Output: Uvicorn running on http://0.0.0.0:8004
```

**Terminal 5 - Irrigation Optimization**
```bash
cd agrogrowth-ai/irrigation_optimization
python main.py
# Output: Uvicorn running on http://0.0.0.0:8005
```

**Terminal 6 - Intelligent Agent**
```bash
cd agrogrowth-ai/intelligent_agent
python main.py
# Output: Uvicorn running on http://0.0.0.0:8005
```

Wait, there's a conflict! Let me provide the corrected approach...

---

## ✅ Recommended Port Assignments

Create a file `.env.services` with proper port configuration:

```env
# AI Services Port Configuration
SOIL_ANALYSIS_URL=http://localhost:8001
CROP_RECOMMENDATION_URL=http://localhost:8002
IMAGE_DIAGNOSIS_URL=http://localhost:8003
MARKET_PREDICTION_URL=http://localhost:8004
IRRIGATION_OPTIMIZATION_URL=http://localhost:8005
INTELLIGENT_AGENT_URL=http://localhost:8006
PEST_CONTROL_URL=http://localhost:8007
WEATHER_YIELD_URL=http://localhost:8008
```

---

## 🔧 Update Backend .env Configuration

Update `server` environment to point to running AI services:

```env
# AI Microservices URLs
SOIL_ANALYSIS_URL=http://localhost:8001
CROP_RECOMMENDATION_URL=http://localhost:8002
IMAGE_DIAGNOSIS_URL=http://localhost:8003
MARKET_PREDICTION_URL=http://localhost:8004
IRRIGATION_OPTIMIZATION_URL=http://localhost:8005
INTELLIGENT_AGENT_URL=http://localhost:8006
PEST_CONTROL_URL=http://localhost:8007
WEATHER_YIELD_INTELLIGENCE_URL=http://localhost:8008

# For production on Railway, use Railway internal URLs:
# SOIL_ANALYSIS_URL=https://agrogrowth-soil-analysis.railway.app
# CROP_RECOMMENDATION_URL=https://agrogrowth-crop-recommendation.railway.app
# etc...
```

---

## 📋 Service Details

### 1. Soil Analysis Service (Port 8001)
**Endpoints:**
- `GET /` - Service info
- `GET /health` - Health check
- `POST /analyze-soil` - Analyze soil properties
- `POST /match-crops` - Match crops to climate
- `POST /diagnose-image` - Diagnose from image
- `GET /supported-crops` - List supported crops
- `GET /soil-types` - List soil types

**Example Request:**
```bash
curl -X POST http://localhost:8001/analyze-soil \
  -H "Content-Type: application/json" \
  -d '{
    "sensor_data": {
      "ph": 7.0,
      "nitrogen": 50,
      "phosphorus": 30,
      "potassium": 40
    }
  }'
```

---

### 2. Crop Recommendation Service (Port 8002)
**Endpoints:**
- `GET /` - Service info
- `GET /health` - Health check
- `POST /recommend-crops` - Get crop recommendations
- `POST /estimate-profit` - Estimate profitability
- `POST /compare-crops` - Compare multiple crops
- `GET /supported-crops` - List supported crops
- `GET /market-data/{crop}` - Get market data

**Example Request:**
```bash
curl -X POST http://localhost:8002/recommend-crops \
  -H "Content-Type: application/json" \
  -d '{
    "temperature": 25,
    "annual_rainfall": 500,
    "soil_ph": 7.0,
    "farm_size": 2.0
  }'
```

---

### 3. Image Diagnosis Service (Port 8003)
**Endpoints:**
- `GET /` - Service info
- `GET /health` - Health check
- `POST /detect-disease` - Detect plant diseases (multipart file upload)
- `POST /analyze-leaf` - Comprehensive leaf analysis
- `POST /analyze-plant` - Combined analysis
- `POST /quick-health-check` - Quick health assessment
- `GET /supported-diseases` - List diseases
- `GET /supported-nutrition-deficiencies` - List deficiencies

**Example Request:**
```bash
curl -X POST http://localhost:8003/detect-disease \
  -F "file=@plant_image.jpg" \
  -F "plant_type=tomato"
```

---

### 4. Market Prediction Service (Port 8004)
**Endpoints:**
- `GET /` - Service info
- `GET /health` - Health check
- `POST /forecast-price` - Price forecasting
- `POST /analyze-supply-demand` - Supply-demand analysis
- `POST /analyze-market-conditions` - Market analysis
- `POST /price-alerts` - Create price alerts

**Example Request:**
```bash
curl -X POST http://localhost:8004/forecast-price \
  -H "Content-Type: application/json" \
  -d '{
    "crop_type": "olive",
    "current_price": 3.5,
    "forecast_days": 30
  }'
```

---

### 5. Irrigation Optimization Service (Port 8005)
**Endpoints:**
- `GET /` - Service info
- `GET /health` - Health check
- `POST /optimize-irrigation` - Get irrigation schedule
- `POST /analyze-soil-moisture` - Analyze moisture levels
- `GET /supported-crops` - List supported crops

**Example Request:**
```bash
curl -X POST http://localhost:8005/optimize-irrigation \
  -H "Content-Type: application/json" \
  -d '{
    "crop_type": "wheat",
    "growth_stage": "vegetative",
    "weather_data": {
      "temperature": 25,
      "humidity": 60,
      "wind_speed": 5,
      "solar_radiation": 25,
      "recent_rainfall": 0
    },
    "soil_data": {
      "moisture_percentage": 50,
      "field_capacity": 35,
      "wilting_point": 15,
      "soil_type": "loamy"
    },
    "farm_size": 2.0
  }'
```

---

### 6. Intelligent Agent Service (Port 8006)
**Endpoints:**
- `GET /` - Service info
- `GET /health` - Health check
- `POST /chat` - Chat with AI
- `POST /generate-plan` - Generate farming plan
- `POST /detect-alerts` - Detect potential issues

**Example Request:**
```bash
curl -X POST http://localhost:8006/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "كيف يمكن تحسين محصول القمح؟",
    "context": {
      "crop_type": "wheat",
      "farm_size": 2.0
    }
  }'
```

---

### 7. Pest Control Service (Port 8007)
**Endpoints:**
- `GET /` - Service info
- `GET /health` - Health check
- `POST /detect-pest` - Detect pests (image upload)
- `POST /recommend-treatment` - Recommend pest treatment
- `GET /supported-pests` - List supported pests

---

### 8. Weather & Yield Intelligence Service (Port 8008)
**Endpoints:**
- `GET /` - Service info
- `GET /health` - Health check
- `POST /predict-yield` - Predict crop yield
- `POST /analyze-weather` - Analyze weather impact
- `GET /forecast` - Get weather forecast

---

## 🧪 Testing All Services

### Quick Health Check Script
```bash
#!/bin/bash

echo "🔍 Checking AI Services Health..."
echo ""

services=(
  "Soil Analysis:8001"
  "Crop Recommendation:8002"
  "Image Diagnosis:8003"
  "Market Prediction:8004"
  "Irrigation Optimization:8005"
  "Intelligent Agent:8006"
  "Pest Control:8007"
  "Weather/Yield Intelligence:8008"
)

for service in "${services[@]}"; do
  name="${service%%:*}"
  port="${service##*:}"
  
  response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$port/health)
  
  if [ "$response" = "200" ]; then
    echo "✅ $name (port $port) - HEALTHY"
  else
    echo "❌ $name (port $port) - DOWN (HTTP $response)"
  fi
done
```

Save as `check-services.sh` and run:
```bash
chmod +x check-services.sh
./check-services.sh
```

---

## 🌐 Integration with Express Backend

The Express backend (`server/index.ts`) needs to know where to call each service:

**Update `server/routes/` to use service URLs:**

```typescript
// Example: soil-analysis.ts
import axios from 'axios';

const SOIL_ANALYSIS_URL = process.env.SOIL_ANALYSIS_URL || 'http://localhost:8001';

export async function analyzeSoil(sensorData: any) {
  try {
    const response = await axios.post(
      `${SOIL_ANALYSIS_URL}/analyze-soil`,
      { sensor_data: sensorData }
    );
    return response.data;
  } catch (error) {
    console.error('Soil analysis service error:', error);
    throw error;
  }
}
```

---

## 🚀 Production Deployment (Railway)

### Step 1: Deploy Each Service to Railway

For each service folder in `agrogrowth-ai/`:

```bash
cd agrogrowth-ai/soil_analysis
railway init
railway up
```

Railway will automatically:
- Build Docker image from Dockerfile
- Deploy to Railway infrastructure
- Assign public URL (e.g., `https://agrogrowth-soil-analysis.railway.app`)
- Manage environment variables
- Handle auto-scaling

### Step 2: Update Production .env

Once deployed, update `server/.env.production`:

```env
SOIL_ANALYSIS_URL=https://agrogrowth-soil-analysis.railway.app
CROP_RECOMMENDATION_URL=https://agrogrowth-crop-recommendation.railway.app
IMAGE_DIAGNOSIS_URL=https://agrogrowth-image-diagnosis.railway.app
MARKET_PREDICTION_URL=https://agrogrowth-market-prediction.railway.app
IRRIGATION_OPTIMIZATION_URL=https://agrogrowth-irrigation-optimization.railway.app
INTELLIGENT_AGENT_URL=https://agrogrowth-intelligent-agent.railway.app
PEST_CONTROL_URL=https://agrogrowth-pest-control.railway.app
WEATHER_YIELD_INTELLIGENCE_URL=https://agrogrowth-weather-yield.railway.app
```

---

## 📊 Service Dependencies

```
Frontend (React)
    ↓
Backend API (Express)
    ↓
┌─────────────────────────────────────┐
│    AI Microservices Orchestrator      │
├──────────┬──────────┬──────────┬─────┤
│          │          │          │     │
▼          ▼          ▼          ▼     ▼
Soil    Crop      Image      Market  Irrigation
Analysis Rec.    Diagnosis  Predict  Optimiz.
│          │          │          │     │
└──────────┴──────────┴──────────┴─────┘
    ↓
Database (PostgreSQL)
+ Cache (Redis)
```

---

## 🔍 Troubleshooting

### Service Won't Start
```bash
# Check if port is already in use
lsof -i :8001

# Kill process on port
kill -9 <PID>
```

### Docker Container Issues
```bash
# Rebuild image
docker-compose build --no-cache soil-analysis

# Restart service
docker-compose restart soil-analysis

# View detailed logs
docker-compose logs --tail=100 soil-analysis
```

### Python Import Errors
```bash
# Reinstall dependencies
pip install --upgrade pip
pip install -r requirements.txt --force-reinstall
```

### Connection Refused
- Verify service is running: `curl http://localhost:8001/health`
- Check firewall: `sudo ufw allow 8001`
- Verify environment variables are correct

---

## ✅ Success Indicators

All AI services should be running when:
- ✅ All 8 services respond with HTTP 200 to `/health`
- ✅ Frontend can communicate with backend
- ✅ Backend can reach all AI services
- ✅ Database is connected and migrations complete
- ✅ Redis cache is available
- ✅ API endpoints return valid responses (not 500 errors)

---

## 📞 Next Steps

1. **Start Services**: Use Docker Compose for easiest setup
2. **Verify Health**: Run health check script
3. **Update Backend**: Ensure `.env` has correct service URLs
4. **Test Endpoints**: Use curl or Postman to test each service
5. **Deploy to Production**: Use Railway.app for production deployment

---
