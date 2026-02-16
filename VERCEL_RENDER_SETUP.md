# Vercel + Render Configuration Guide

This guide explains how to set up your AgroDev application to run on **Vercel** with AI microservices on **Render**.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     VERCEL (Frontend + API)                 │
│                    agro-dev.vercel.app                      │
└──────────────────────────────────────────────────────────────┘
           ↓                    ↓                    ↓
┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐
│   RENDER SERVICES    │ │   RENDER SERVICES    │ │   RENDER SERVICES    │
│   Soil Analysis      │ │  Crop Recommendation │ │  Market Prediction   │
│ (onrender.com)       │ │  (onrender.com)      │ │  (onrender.com)      │
└──────────────────────┘ └──────────────────────┘ └──────────────────────┘
```

## Environment Variables

### For Vercel Dashboard

Add these variables in **Project Settings → Environment Variables**:

```
VITE_SUPABASE_URL = https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGc...
VITE_RENDER_SOIL_ANALYSIS_URL = https://soil-analysis-20qd.onrender.com
VITE_RENDER_CROP_RECOMMENDATION_URL = https://crop-recommendation-0zlf.onrender.com
VITE_RENDER_MARKET_PREDICTION_URL = https://market-prediction-ew18.onrender.com
VITE_RENDER_INTELLIGENT_AGENT_URL = https://intelligent-agent-ub30.onrender.com
```

**Important**: All `VITE_*` variables are **visible to frontend** - do NOT put secrets here.

### For Render Services (if needed)

If your Render services need to authenticate with Supabase:

```
SUPABASE_URL = https://your-project.supabase.co
SUPABASE_ANON_KEY = eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY = eyJhbGc...  (if they need elevated permissions)
```

## Step-by-Step Deployment

### 1. Deploy to Vercel

```bash
# Option A: Via GitHub (Recommended)
# 1. Push your code to GitHub
# 2. Connect your repo to Vercel dashboard
# 3. Vercel will auto-deploy on push

# Option B: Via CLI
npm install -g vercel
vercel login
vercel --prod
```

### 2. Configure Environment Variables in Vercel

1. Go to https://vercel.com/dashboard
2. Click on your project
3. Go to **Settings → Environment Variables**
4. Add each variable with appropriate scope:
   - Development (for `npm run dev`)
   - Preview (for PR deployments)
   - Production (for live site)

**Example**:
```
Key: VITE_RENDER_SOIL_ANALYSIS_URL
Value: https://soil-analysis-20qd.onrender.com
Scope: Production, Preview
```

### 3. Verify Render Services are Running

```bash
# Test each Render service endpoint
curl https://soil-analysis-20qd.onrender.com/health
curl https://crop-recommendation-0zlf.onrender.com/health
curl https://market-prediction-ew18.onrender.com/health
curl https://intelligent-agent-ub30.onrender.com/health
```

All should return HTTP 200 or similar success status.

### 4. Redeploy Vercel

After adding environment variables:

```bash
# Trigger a redeploy
vercel --prod
```

Or use the Vercel dashboard **Deployments** → **Redeploy** button.

## Service Mapping

The application maps AI services as follows:

| AI Service | Endpoint | Render Service |
|-----------|----------|---|
| Soil Analysis | `/api/ai/soil-analysis` | soil-analysis-20qd |
| Crop Recommendation | `/api/ai/crop-recommendation` | crop-recommendation-0zlf |
| Market Forecast | `/api/ai/market-forecast` | market-prediction-ew18 |
| Supply Demand | `/api/ai/supply-demand` | market-prediction-ew18 |
| Smart Match | `/api/ai/smart-match` | market-prediction-ew18 |
| Agro Chat | `/api/ai/agro-chat` | intelligent-agent-ub30 |
| Farming Tasks | `/api/ai/farming-tasks-planner` | intelligent-agent-ub30 |
| Alert Notifier | `/api/ai/alert-notifier` | intelligent-agent-ub30 |

## Health Check

The app automatically checks service availability:

1. **Open DevTools** → Console (F12)
2. Look for health check logs:
   ```
   ✅ Supabase client initialized successfully
   🔍 System Health Check Results: { overall: 'degraded', available: '3/18', ... }
   ```

3. **Check Service Status Page** (if available in your dashboard)
   - Shows which services are up/down
   - Response times
   - Detailed error messages

## Troubleshooting

### "Failed to fetch" Error

1. **Check Render services are running**:
   ```bash
   curl -I https://soil-analysis-20qd.onrender.com
   ```
   
2. **Verify Vercel environment variables**:
   - Go to Vercel dashboard
   - Confirm all `VITE_RENDER_*` variables are set
   - Redeploy to apply changes

3. **Check CORS** (if applicable):
   - Render services should allow requests from `agro-dev.vercel.app`
   - Check service CORS configuration

### Services Showing as "Unavailable"

1. **Check Render service logs**:
   - Go to https://render.com/dashboard
   - Click on service
   - Check logs for errors

2. **Check timeout settings**:
   - If services are slow to respond, they might timeout
   - Current timeout: 8 seconds per service
   - Can be increased in `client/hooks/useServiceHealthChecker.ts`

3. **Check network connectivity**:
   ```bash
   # From browser console
   fetch('https://soil-analysis-20qd.onrender.com')
     .then(r => r.text())
     .then(console.log)
   ```

### Environment Variables Not Applying

1. **After updating Vercel env vars**:
   - Must redeploy for changes to take effect
   - Use "Redeploy" button in Vercel dashboard
   - OR push a new commit to trigger auto-deploy

2. **Verify variables are set**:
   ```bash
   # In browser console
   console.log(import.meta.env.VITE_RENDER_SOIL_ANALYSIS_URL)
   ```
   Should output the Render service URL

## Monitoring

### Vercel Analytics

- Go to Vercel dashboard → Analytics
- Monitor response times, error rates
- Check function execution times

### Render Monitoring

- Go to Render dashboard → Service metrics
- Check CPU, Memory, Network usage
- Review error rates and logs

## Scaling Considerations

### When Services Get Slow

1. **Render Free Tier**: Services spin down after 15 mins inactivity
   - Solution: Upgrade to Paid tier
   - Or use monitoring service (e.g., Uptime Robot) to ping services

2. **High Load**: Services running out of resources
   - Render: Upgrade instance type
   - Consider caching responses locally

3. **Too Many Requests**: Rate limiting
   - Add request queuing
   - Implement client-side caching

## Local Development

For local development, you can use either:

### Option A: Remote Render Services (Recommended for testing)
```bash
# .env.local
VITE_RENDER_SOIL_ANALYSIS_URL=https://soil-analysis-20qd.onrender.com
VITE_RENDER_CROP_RECOMMENDATION_URL=https://crop-recommendation-0zlf.onrender.com
# ... etc
npm run dev
```

### Option B: Local AI Services (For AI service development)
```bash
# Run AI services locally first
cd agrogrowth-ai
docker-compose up

# Then in main app
npm run dev
```

## CI/CD Pipeline

### GitHub Actions → Vercel Deployment

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install Vercel CLI
        run: npm install -g vercel
      
      - name: Deploy to Vercel
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
        run: vercel --prod --token $VERCEL_TOKEN
```

## Support & Resources

- **Vercel Docs**: https://vercel.com/docs
- **Render Docs**: https://render.com/docs
- **Project Repo**: Your GitHub repository

## Quick Reference Commands

```bash
# Vercel
vercel login                    # Authenticate with Vercel
vercel                          # Deploy to preview
vercel --prod                   # Deploy to production
vercel env ls                   # List environment variables
vercel env add KEY VALUE        # Add environment variable

# Render (via CLI if installed)
render deploy RENDER_SERVICE_ID # Deploy Render service
```

---

**Last Updated**: 2024
**Maintainer**: AgroDev Team
