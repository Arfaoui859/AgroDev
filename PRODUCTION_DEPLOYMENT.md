# Production Deployment Guide

This document outlines the fixes applied and the required environment variables for production deployment.

## Fixes Applied

### 1. Vite HMR (Hot Module Replacement) Configuration
**Issue**: The production build was including Vite's HMR client code, which tried to connect to a dev server that didn't exist in production.

**Fix**: Updated `vite.config.ts` to disable HMR in production builds:
- HMR is now only enabled in development mode (`npm run dev`)
- Production builds (`npm run build`) will not include HMR code
- This prevents "Failed to fetch" errors from Vite's HMR client

**Files Modified**:
- `vite.config.ts` - Added conditional HMR configuration

### 2. Supabase Fetch Error Handling
**Issue**: Supabase fetch requests were failing without graceful fallback, causing auth token refresh to fail.

**Fix**: Added robust error handling for Supabase:
- Custom fetch wrapper with timeout handling
- Returns 503 Service Unavailable instead of throwing on network errors
- Improved session initialization with timeout protection
- Auto-refresh tokens now fail gracefully without crashing the app

**Files Modified**:
- `client/lib/supabase.ts` - Added custom fetch wrapper and improved error handling
- `client/lib/fetchWithRetry.ts` (NEW) - Reusable fetch wrapper with retry logic
- `client/utils/verifyTables.ts` - Added timeout and offline scenario handling

### 3. Dashboard Data Fetching
**Issue**: Individual API call failures were cascading and blocking the entire dashboard.

**Fix**: Changed to independent error handling:
- Each data fetch (farm overview, weather, notifications) has its own try-catch
- Dashboard loads partially even if some endpoints fail
- Only shows error toast if critical data couldn't load

**Previous Fix**: File `client/pages/Index.tsx` (line 560+)

## Required Environment Variables for Production

### Supabase Configuration (Required)
```bash
# Client-side variables (used by frontend, MUST be set in build)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Server-side variables (used by backend)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### External AI Services Configuration (Render Microservices)
```bash
# Render service URLs for AI microservices
VITE_RENDER_SOIL_ANALYSIS_URL=https://soil-analysis-20qd.onrender.com
VITE_RENDER_CROP_RECOMMENDATION_URL=https://crop-recommendation-0zlf.onrender.com
VITE_RENDER_MARKET_PREDICTION_URL=https://market-prediction-ew18.onrender.com
VITE_RENDER_INTELLIGENT_AGENT_URL=https://intelligent-agent-ub30.onrender.com
```

### Application Configuration
```bash
NODE_ENV=production
PORT=8080  # Default port, adjust as needed
```

### Optional: Database Configuration
```bash
DATABASE_URL=postgresql://user:password@host/database
DIRECT_URL=postgresql://user:password@host/database  # Direct connection for migrations
```

## Deployment Instructions

### For Fly.io Deployment

1. **Set Environment Variables**:
```bash
fly secrets set VITE_SUPABASE_URL="https://your-project.supabase.co"
fly secrets set VITE_SUPABASE_ANON_KEY="your-anon-key"
fly secrets set SUPABASE_URL="https://your-project.supabase.co"
fly secrets set SUPABASE_ANON_KEY="your-anon-key"
fly secrets set SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
fly secrets set NODE_ENV="production"
```

2. **Build and Deploy**:
```bash
fly deploy
```

### For Vercel Deployment

1. **Add Environment Variables in Vercel Dashboard**:
   - Go to Project Settings → Environment Variables
   - Add the following variables:
     - `VITE_SUPABASE_URL` = https://your-project.supabase.co
     - `VITE_SUPABASE_ANON_KEY` = your-anon-key
     - `VITE_RENDER_SOIL_ANALYSIS_URL` = https://soil-analysis-20qd.onrender.com
     - `VITE_RENDER_CROP_RECOMMENDATION_URL` = https://crop-recommendation-0zlf.onrender.com
     - `VITE_RENDER_MARKET_PREDICTION_URL` = https://market-prediction-ew18.onrender.com
     - `VITE_RENDER_INTELLIGENT_AGENT_URL` = https://intelligent-agent-ub30.onrender.com

2. **Build Command**:
```bash
npm run build
```

3. **Output Directory**:
```
dist/spa
```

4. **Deploy**:
   - Push to your repository or use `vercel deploy` from CLI

### For Netlify Deployment

1. **Add Environment Variables in Netlify Dashboard**:
   - Go to Site Settings → Build & Deploy → Environment
   - Add all variables listed above

2. **Build Command**:
```bash
npm run build
```

3. **Publish Directory**:
```
dist/spa
```

### For Docker Deployment

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Runtime stage
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080
CMD ["npm", "start"]
```

## Troubleshooting

### "Failed to fetch" Errors in Browser Console

1. **Check HMR Configuration**:
   - Ensure HMR is disabled in production (should be automatic)
   - If you see HMR errors, clear browser cache and hard refresh

2. **Check Supabase Connectivity**:
   - Verify VITE_SUPABASE_URL is correct and accessible from your deployment region
   - Test from browser DevTools: `fetch('https://your-project.supabase.co')`
   - Check Supabase dashboard for any service incidents

3. **Check Network/CORS**:
   - Ensure your deployment domain is allowed to access Supabase
   - Check browser DevTools Network tab for blocked requests
   - Verify Supabase CORS settings allow your deployment domain

### Timeouts on Slow Networks

The app now uses timeouts to prevent hanging requests:
- Fetch requests: 15 seconds
- Supabase auth: 5 seconds
- Database verification: 10 seconds

If you're on a slow network, you can increase these in:
- `client/lib/supabase.ts` - line 19 (timeout for Supabase)
- `client/lib/fetchWithRetry.ts` - timeout parameter defaults

### Application Continues with Limited Functionality

The app is designed to gracefully degrade:
- If Supabase is unavailable, auth features are disabled
- If weather API fails, dashboard shows without weather data
- If notifications fail, other dashboard sections still load

This is intentional to improve resilience.

## Monitoring Recommendations

1. **Log fetch errors** in your deployment monitoring:
   - Monitor for 503 errors from Supabase
   - Track timeout errors
   - Alert on repeated connectivity issues

2. **Health Check Endpoint**:
```bash
curl https://your-app.com/api/ping
# Expected response: { "message": "Server is running", ... }
```

3. **Supabase Health Check**:
```bash
curl -I https://your-project.supabase.co
# Should return 200 status
```

## Performance Notes

- HMR is completely disabled in production, reducing bundle size
- Fetch requests have retry logic (2 retries by default)
- Timeouts prevent indefinite hanging
- Graceful degradation means users see partial content instead of blank page

## Support

If you encounter issues:
1. Check the browser console for detailed error messages
2. Check server logs for backend errors
3. Verify all environment variables are set correctly
4. Ensure Supabase project is active and accessible
5. Check network connectivity from your deployment region to Supabase
