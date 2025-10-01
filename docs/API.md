# 🔌 AgroGrowth API Documentation

## Overview

The AgroGrowth Platform provides a comprehensive RESTful API for agricultural data analysis, crop recommendations, market intelligence, and farmer collaboration. All endpoints return JSON responses and support both Arabic and English localization.

**Base URL**: `https://api.agrogrowth.tn/api` (Production)  
**Development**: `http://localhost:8080/api`

## Authentication

### API Key Authentication (Optional)

Some endpoints may require API key authentication for enhanced rate limits.

```http
Authorization: Bearer YOUR_API_KEY
```

### Session-Based Authentication

User-specific endpoints require session authentication.

```http
Cookie: session=SESSION_TOKEN
```

## Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    // Response data
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "request_id": "req_123456789"
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "request_id": "req_123456789"
}
```

## Rate Limiting

- **Default**: 1000 requests per hour per IP
- **Authenticated**: 5000 requests per hour per user
- **AI Services**: 100 requests per hour per IP

Rate limit headers:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642248000
```

## Endpoints

### Health & Status

#### Get API Health

Check API service status and dependencies.

```http
GET /health
```

**Response:**

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "version": "1.0.0",
    "uptime": 86400,
    "services": {
      "database": "connected",
      "redis": "connected",
      "ai_services": "operational"
    }
  }
}
```

#### Get AI Services Health

Check status of AI microservices.

```http
GET /ai/health
```

**Response:**

```json
{
  "success": true,
  "data": {
    "soil_analysis": "healthy",
    "crop_recommendation": "healthy",
    "image_diagnosis": "healthy",
    "overall_status": "all_services_healthy"
  }
}
```

---

### AI Services

#### Soil Analysis

##### Analyze Soil Data

Analyze soil sensor readings and provide health assessment.

```http
POST /ai/soil/analyze
Content-Type: application/json
```

**Request Body:**

```json
{
  "sensor_data": {
    "ph": 6.5,
    "moisture": 45,
    "nitrogen": 85,
    "phosphorus": 42,
    "potassium": 118,
    "temperature": 24.5,
    "conductivity": 1.2
  },
  "location": {
    "latitude": 36.8065,
    "longitude": 10.1815,
    "region": "Tunis"
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "soil_type": {
      "classification": "Sandy Loam",
      "confidence": 0.89
    },
    "health_score": 78,
    "fertility_level": "Good",
    "overall_recommendations": [
      "Increase organic matter content",
      "Monitor pH levels regularly"
    ],
    "nutrient_analysis": {
      "nitrogen": {
        "level": 85,
        "status": "adequate",
        "recommendation": "Maintain current levels"
      },
      "phosphorus": {
        "level": 42,
        "status": "moderate",
        "recommendation": "Consider supplementation"
      },
      "potassium": {
        "level": 118,
        "status": "high",
        "recommendation": "Reduce inputs temporarily"
      }
    },
    "analysis_timestamp": "2024-01-15T10:30:00Z"
  }
}
```

##### Soil Image Diagnosis

Analyze soil images for visual assessment.

```http
POST /ai/soil/diagnose-image
Content-Type: multipart/form-data
```

**Request:**

```form-data
file: [soil_image.jpg]
location: "Tunis, Tunisia"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "visual_assessment": {
      "texture": "Sandy",
      "color": "Brown",
      "moisture_visual": "Moderate",
      "organic_matter_visual": "Low"
    },
    "recommendations": [
      "Soil appears well-drained",
      "Consider adding organic compost"
    ],
    "confidence": 0.82
  }
}
```

#### Crop Recommendations

##### Get Crop Recommendations

Get personalized crop recommendations based on soil and climate data.

```http
POST /ai/crops/recommend
Content-Type: application/json
```

**Request Body:**

```json
{
  "soil_data": {
    "ph": 6.5,
    "moisture": 45,
    "nitrogen": 85,
    "phosphorus": 42,
    "potassium": 118,
    "organic_matter": 3.2,
    "texture": "Sandy Loam"
  },
  "climate_data": {
    "temperature_avg": 24.5,
    "humidity": 60,
    "rainfall_annual": 300,
    "growing_season_length": 180
  },
  "location": {
    "latitude": 36.8065,
    "longitude": 10.1815,
    "elevation": 50,
    "region": "Tunis"
  },
  "farm_info": {
    "size_hectares": 5.0,
    "irrigation_available": true,
    "farming_experience": "intermediate",
    "budget_available": 10000
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "rank": 1,
        "crop": "wheat",
        "crop_name_ar": "قمح",
        "category": "cereal",
        "suitability_score": 92,
        "predicted_yield_per_hectare": 4.2,
        "profit_analysis": {
          "net_profit": 1250,
          "roi_percent": 35.5,
          "profit_margin_percent": 28.3,
          "payback_period_months": 8
        },
        "risk_assessment": {
          "overall_risk_score": 25,
          "overall_risk_level": "low",
          "main_risks": ["drought", "price_volatility"]
        },
        "growing_requirements": {
          "water_needs_mm": 450,
          "fertilizer_requirements": {
            "nitrogen_kg_per_ha": 120,
            "phosphorus_kg_per_ha": 60,
            "potassium_kg_per_ha": 80
          },
          "optimal_planting_time": "October-November",
          "harvest_time": "May-June"
        }
      }
    ],
    "best_recommendation": {
      "crop": "wheat",
      "confidence": 0.92,
      "reasoning": "Optimal soil pH and climate conditions for wheat cultivation"
    },
    "analysis_timestamp": "2024-01-15T10:30:00Z"
  }
}
```

#### Plant Disease Detection

##### Detect Plant Disease

Analyze plant images for disease identification.

```http
POST /ai/images/detect-disease
Content-Type: multipart/form-data
```

**Request:**

```form-data
file: [plant_image.jpg]
plant_type: "tomato"
growth_stage: "flowering"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "disease_detection": {
      "primary_disease": {
        "disease": "early_blight",
        "disease_name_ar": "اللفحة المبكرة",
        "probability": 0.87
      },
      "top_predictions": [
        {
          "disease": "early_blight",
          "disease_name_ar": "اللفحة المبكرة",
          "probability": 0.87,
          "severity_level": "moderate"
        },
        {
          "disease": "leaf_spot",
          "disease_name_ar": "تبقع الأوراق",
          "probability": 0.13,
          "severity_level": "mild"
        }
      ],
      "confidence_score": 0.87
    },
    "severity_assessment": {
      "severity_score": 65,
      "severity_level": "moderate",
      "affected_area_percentage": 25,
      "urgency_level": "medium"
    },
    "treatment_plan": {
      "immediate_treatment": [
        "Remove affected leaves immediately",
        "Improve air circulation around plants"
      ],
      "chemical_treatment": {
        "product": "Copper-based fungicide",
        "dosage": "2g per liter",
        "application_frequency": "Every 7-10 days"
      },
      "estimated_recovery_time": "2-3 weeks"
    },
    "health_score": {
      "health_score": 65,
      "health_category": "moderate_concern"
    }
  }
}
```

---

### Market Intelligence

#### Market Prices

##### Get Current Market Prices

Retrieve current commodity prices and trends.

```http
GET /market/prices
```

**Query Parameters:**

- `commodity` (optional): Specific commodity (wheat, olive_oil, tomatoes)
- `region` (optional): Market region (tunis, sfax, sousse)
- `currency` (optional): Currency (TND, USD, EUR)

**Response:**

```json
{
  "success": true,
  "data": {
    "wheat": {
      "price": 0.45,
      "currency": "TND",
      "unit": "kg",
      "change_24h": 2.3,
      "change_7d": -1.5,
      "change_30d": 8.7,
      "market_location": "Tunis Central Market",
      "last_updated": "2024-01-15T10:00:00Z"
    },
    "olive_oil": {
      "price": 8.5,
      "currency": "TND",
      "unit": "liter",
      "change_24h": -0.8,
      "change_7d": 3.2,
      "change_30d": -5.1,
      "market_location": "Sfax Market",
      "last_updated": "2024-01-15T10:00:00Z"
    }
  }
}
```

##### Get Market Trends

Analyze market trends and forecasting.

```http
GET /market/trends
```

**Query Parameters:**

- `commodity`: Commodity name
- `period`: Time period (7d, 30d, 90d, 1y)
- `forecast`: Include forecasting (true/false)

**Response:**

```json
{
  "success": true,
  "data": {
    "commodity": "wheat",
    "current_trend": "upward",
    "price_history": [
      {
        "date": "2024-01-01",
        "price": 0.42,
        "volume": 1500
      }
    ],
    "forecast": {
      "next_30_days": {
        "trend": "stable",
        "price_range": {
          "min": 0.43,
          "max": 0.47,
          "most_likely": 0.45
        },
        "confidence": 0.78
      }
    },
    "analysis": {
      "key_factors": ["Seasonal demand increase", "Export opportunities"],
      "risk_factors": ["Weather volatility", "Global price fluctuations"]
    }
  }
}
```

---

### Gamification

#### User Gamification Profile

##### Get User Profile

Retrieve user's XP, level, and achievements.

```http
GET /gamification/profile
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user_id": "user_123",
    "current_level": 5,
    "total_xp": 2850,
    "xp_to_next_level": 150,
    "streak_days": 12,
    "achievements_unlocked": 8,
    "total_achievements": 25,
    "badges": [
      {
        "id": "soil_expert",
        "name": "Soil Expert",
        "name_ar": "خبير التربة",
        "description": "Completed 10 soil analyses",
        "icon": "🌱",
        "unlocked_date": "2024-01-10T10:30:00Z"
      }
    ],
    "recent_activities": [
      {
        "action": "soil_analysis_completed",
        "xp_earned": 50,
        "timestamp": "2024-01-15T09:30:00Z"
      }
    ]
  }
}
```

##### Get Leaderboard

Retrieve community leaderboard.

```http
GET /gamification/leaderboard
```

**Query Parameters:**

- `period`: Time period (weekly, monthly, all_time)
- `region`: Filter by region
- `limit`: Number of entries (default: 20)

**Response:**

```json
{
  "success": true,
  "data": {
    "period": "monthly",
    "entries": [
      {
        "rank": 1,
        "user_id": "user_456",
        "username": "Ahmed_Farmer",
        "level": 8,
        "total_xp": 4250,
        "region": "Tunis",
        "streak_days": 25
      }
    ],
    "user_rank": 15,
    "total_participants": 342
  }
}
```

---

### Collaboration

#### Farmer Consultation

##### Get Expert Consultations

Retrieve available expert consultations.

```http
GET /collaboration/consultations
```

**Response:**

```json
{
  "success": true,
  "data": {
    "consultations": [
      {
        "id": "consultation_123",
        "expert_name": "Dr. Ahmed Mansouri",
        "expert_specialty": "Soil Science",
        "topic": "Soil pH optimization",
        "status": "available",
        "duration_minutes": 30,
        "cost_tnd": 50,
        "available_slots": ["2024-01-16T14:00:00Z", "2024-01-16T15:00:00Z"]
      }
    ]
  }
}
```

##### Book Consultation

Book an expert consultation session.

```http
POST /collaboration/consultations/book
Content-Type: application/json
```

**Request Body:**

```json
{
  "consultation_id": "consultation_123",
  "preferred_slot": "2024-01-16T14:00:00Z",
  "topic_details": "Need help with soil pH management for tomato cultivation",
  "contact_method": "video_call"
}
```

---

### Investor Dashboard

#### Investment Opportunities

##### Get Investment Opportunities

Retrieve agricultural investment opportunities.

```http
GET /investor/opportunities
```

**Query Parameters:**

- `crop_type`: Filter by crop type
- `min_roi`: Minimum ROI percentage
- `risk_level`: Risk level (low, medium, high)
- `region`: Geographic region

**Response:**

```json
{
  "success": true,
  "data": {
    "opportunities": [
      {
        "id": "inv_001",
        "project_name": "Olive Grove Expansion Project",
        "crop_type": "olives",
        "location": "Sfax, Tunisia",
        "investment_required": 150000,
        "expected_roi": 18.5,
        "payback_period_years": 4,
        "risk_level": "medium",
        "farm_size_hectares": 20,
        "projected_annual_revenue": 45000,
        "market_analysis": {
          "demand_outlook": "strong",
          "price_stability": "high",
          "export_potential": true
        }
      }
    ]
  }
}
```

---

### Offline Support

#### Sync Data

##### Upload Offline Data

Upload data collected while offline.

```http
POST /offline/sync
Content-Type: application/json
```

**Request Body:**

```json
{
  "offline_data": [
    {
      "id": "offline_123",
      "type": "soil_analysis",
      "data": {
        "ph": 6.5,
        "moisture": 45
      },
      "timestamp": "2024-01-15T08:30:00Z",
      "location": {
        "latitude": 36.8065,
        "longitude": 10.1815
      }
    }
  ],
  "device_id": "device_456",
  "sync_timestamp": "2024-01-15T10:30:00Z"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "synced_items": 1,
    "failed_items": 0,
    "sync_results": [
      {
        "offline_id": "offline_123",
        "server_id": "analysis_789",
        "status": "synced",
        "processed_at": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

---

## Error Codes

| Code                      | Description                        |
| ------------------------- | ---------------------------------- |
| `VALIDATION_ERROR`        | Request validation failed          |
| `AUTHENTICATION_REQUIRED` | Authentication required            |
| `AUTHORIZATION_DENIED`    | Insufficient permissions           |
| `RESOURCE_NOT_FOUND`      | Requested resource not found       |
| `RATE_LIMIT_EXCEEDED`     | Too many requests                  |
| `AI_SERVICE_UNAVAILABLE`  | AI service temporarily unavailable |
| `INVALID_FILE_FORMAT`     | Unsupported file format            |
| `FILE_TOO_LARGE`          | File exceeds size limit            |
| `EXTERNAL_API_ERROR`      | External service error             |
| `DATABASE_ERROR`          | Database connection error          |

## SDKs and Libraries

### JavaScript/TypeScript

```bash
npm install @agrogrowth/api-client
```

### Python

```bash
pip install agrogrowth-api
```

### Usage Example (JavaScript)

```javascript
import AgroGrowthAPI from "@agrogrowth/api-client";

const api = new AgroGrowthAPI({
  baseURL: "https://api.agrogrowth.tn/api",
  apiKey: "your_api_key",
});

// Analyze soil
const soilResult = await api.soil.analyze({
  ph: 6.5,
  moisture: 45,
  nitrogen: 85,
});

// Get crop recommendations
const recommendations = await api.crops.recommend({
  soil_data: soilResult.data,
  location: { latitude: 36.8065, longitude: 10.1815 },
});
```

## Webhooks

### Webhook Events

Register webhook endpoints to receive real-time notifications:

- `soil_analysis_completed`
- `disease_detected`
- `market_alert_triggered`
- `consultation_scheduled`
- `user_achievement_unlocked`

### Webhook Payload Example

```json
{
  "event": "disease_detected",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "user_id": "user_123",
    "detection_id": "detection_456",
    "disease": "early_blight",
    "severity": "moderate",
    "crop_type": "tomato"
  },
  "signature": "sha256=..."
}
```

## Support

- **API Status**: https://status.agrogrowth.tn
- **Documentation**: https://docs.agrogrowth.tn
- **Support Email**: api-support@agrogrowth.tn
- **Developer Discord**: https://discord.gg/agrogrowth-dev
