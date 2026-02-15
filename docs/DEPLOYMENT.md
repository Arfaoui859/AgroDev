# 🚀 AgroGrowth Platform Deployment Guide

This guide covers deploying the AgroGrowth Platform to various environments, from development to production.

## 📋 Prerequisites

### Required Software

- **Node.js** 18+ and npm
- **Python** 3.9+ (for AI services)
- **Docker** and Docker Compose
- **Git** for version control

### Required Accounts

- **GitHub** (for CI/CD)
- **Netlify** or **Vercel** (frontend hosting)
- **Railway** or **Heroku** (backend hosting)
- **Docker Hub** (container registry)

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Essential variables
NODE_ENV=production
PORT=8080
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret

# AI Services
SOIL_ANALYSIS_URL=your_ai_service_url
CROP_RECOMMENDATION_URL=your_ai_service_url
IMAGE_DIAGNOSIS_URL=your_ai_service_url

# External APIs
WEATHER_API_KEY=your_weather_api_key
MARKET_API_KEY=your_market_api_key
```

## 🏃‍♂️ Quick Start (Development)

### Local Development

1. **Clone and install dependencies**

   ```bash
   git clone https://github.com/agrogrowth/platform.git
   cd platform
   npm install
   ```

2. **Start development servers**

   ```bash
   # Terminal 1: Backend
   npm run server:dev

   # Terminal 2: Frontend
   npm run dev
   ```

3. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8080/api

### Docker Development

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 🌐 Production Deployment

### Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │  AI Services    │
│  (Netlify/      │    │  (Railway/      │    │  (Docker        │
│   Vercel)       │    │   Heroku)       │    │   Containers)   │
│                 │    │                 │    │                 │
│  React SPA      │◄──►│  Express.js     │◄──►│  Python Flask   │
│  Static Files   │    │  REST API       │    │  ML Models      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│      CDN        │    │   Database      │    │  File Storage   │
│   (Cloudflare)  │    │ (PostgreSQL)    │    │    (AWS S3)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 1. Frontend Deployment (Netlify)

#### Automatic Deployment via GitHub

1. **Connect repository to Netlify**

   - Go to Netlify dashboard
   - Click "New site from Git"
   - Select your GitHub repository

2. **Configure build settings**

   ```yaml
   Build command: npm run build
   Publish directory: dist
   ```

3. **Environment variables**

   ```bash
   VITE_API_URL=https://api.agrogrowth.tn/api
   VITE_APP_ENVIRONMENT=production
   ```

4. **Custom domain and SSL**
   - Add custom domain: `agrogrowth.tn`
   - Enable HTTPS (automatic with Netlify)

#### Manual Deployment

```bash
# Build for production
npm run build

# Install Netlify CLI
npm install -g netlify-cli

# Login and deploy
netlify login
netlify deploy --prod --dir=dist
```

### 2. Backend Deployment (Railway)

#### Automatic Deployment

1. **Connect to Railway**

   ```bash
   # Install Railway CLI
   npm install -g @railway/cli

   # Login and create project
   railway login
   railway init
   ```

2. **Configure environment variables**

   ```bash
   railway variables set NODE_ENV=production
   railway variables set PORT=8080
   railway variables set DATABASE_URL=${{Postgres.DATABASE_URL}}
   ```

3. **Deploy**
   ```bash
   railway up
   ```

#### Manual Deployment (Heroku Alternative)

```bash
# Build application
npm run build

# Create Procfile
echo "web: node server/index.js" > Procfile

# Deploy to your preferred platform
```

### 3. AI Services Deployment (Docker)

#### Build and Push Images

```bash
# Build soil analysis service
cd agrogrowth-ai/soil_analysis
docker build -t agrogrowth/soil-analysis:latest .
docker push agrogrowth/soil-analysis:latest

# Build crop recommendation service
cd ../crop_recommendation
docker build -t agrogrowth/crop-recommendation:latest .
docker push agrogrowth/crop-recommendation:latest

# Build image diagnosis service
cd ../image_diagnosis
docker build -t agrogrowth/image-diagnosis:latest .
docker push agrogrowth/image-diagnosis:latest
```

#### Deploy to Cloud Provider

**Option A: Railway**

```bash
# Deploy each service separately
railway up --service soil-analysis
railway up --service crop-recommendation
railway up --service image-diagnosis
```

**Option B: AWS ECS/Fargate**

```yaml
# ecs-task-definition.json
{
  "family": "agrogrowth-ai",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions":
    [
      {
        "name": "soil-analysis",
        "image": "agrogrowth/soil-analysis:latest",
        "portMappings": [{ "containerPort": 8001 }],
      },
    ],
}
```

### 4. Database Setup

#### PostgreSQL (Recommended)

**Railway PostgreSQL:**

```bash
# Add PostgreSQL to Railway project
railway add postgresql

# Get connection string
railway variables
```

**AWS RDS:**

```bash
# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier agrogrowth-prod \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username agrogrowth \
  --master-user-password YOUR_PASSWORD \
  --allocated-storage 20
```

#### Database Migration

```bash
# Run migrations (if using a migration tool)
npm run migrate:latest

# Or initialize with SQL script
psql $DATABASE_URL < database/schema.sql
```

### 5. Environment Configuration

#### Production Environment Variables

```bash
# Application
NODE_ENV=production
PORT=8080
APP_URL=https://agrogrowth.tn

# Database
DATABASE_URL=postgresql://user:pass@host:port/agrogrowth
REDIS_URL=redis://host:port

# AI Services
SOIL_ANALYSIS_URL=https://soil-analysis-service.railway.app
CROP_RECOMMENDATION_URL=https://crop-rec-service.railway.app
IMAGE_DIAGNOSIS_URL=https://image-diag-service.railway.app

# Security
JWT_SECRET=super_long_random_secret_key_here
BCRYPT_ROUNDS=12
COOKIE_SECURE=true

# External APIs
WEATHER_API_KEY=prod_weather_api_key
MARKET_API_KEY=prod_market_api_key

# File Storage (AWS S3)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=eu-west-1
AWS_S3_BUCKET=agrogrowth-prod-uploads

# Monitoring
SENTRY_DSN=your_sentry_dsn
LOG_LEVEL=info

# Performance
ENABLE_COMPRESSION=true
ENABLE_RATE_LIMITING=true
```

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

The repository includes automated CI/CD workflows:

1. **Continuous Integration** (`.github/workflows/ci.yml`)

   - Code quality checks
   - Unit and integration tests
   - Security scanning
   - Performance testing

2. **Deployment** (`.github/workflows/deploy.yml`)
   - Automatic staging deployment
   - Production deployment on tags
   - Docker image building and pushing

### Deployment Process

```bash
# 1. Development workflow
git checkout -b feature/new-feature
git commit -m "feat: add new feature"
git push origin feature/new-feature

# 2. Create pull request
# CI runs automatically

# 3. Merge to main
# Automatic staging deployment

# 4. Create release
git tag v1.2.3
git push origin v1.2.3
# Automatic production deployment
```

### Manual Deployment Trigger

```bash
# Trigger deployment manually
gh workflow run deploy.yml \
  --ref main \
  -f environment=production
```

## 🐳 Docker Deployment

### Complete Docker Deployment

#### Production Docker Compose

```yaml
# docker-compose.prod.yml
version: "3.8"

services:
  frontend:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./dist:/usr/share/nginx/html
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl

  backend:
    image: agrogrowth/backend:latest
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=agrogrowth
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

#### Deploy with Docker Compose

```bash
# Production deployment
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### Container Orchestration

#### Kubernetes Deployment

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: agrogrowth-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: agrogrowth-backend
  template:
    metadata:
      labels:
        app: agrogrowth-backend
    spec:
      containers:
        - name: backend
          image: agrogrowth/backend:latest
          ports:
            - containerPort: 8080
          env:
            - name: NODE_ENV
              value: "production"
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: agrogrowth-secrets
                  key: database-url
```

```bash
# Deploy to Kubernetes
kubectl apply -f k8s/
```

## 🔧 Configuration Management

### Environment-Specific Configs

#### Staging Configuration

```javascript
// config/staging.js
module.exports = {
  api: {
    baseURL: "https://api-staging.agrogrowth.tn",
    timeout: 10000,
  },
  database: {
    ssl: false,
    pool: { min: 2, max: 10 },
  },
  logging: {
    level: "debug",
  },
};
```

#### Production Configuration

```javascript
// config/production.js
module.exports = {
  api: {
    baseURL: "https://api.agrogrowth.tn",
    timeout: 5000,
  },
  database: {
    ssl: true,
    pool: { min: 5, max: 20 },
  },
  logging: {
    level: "info",
  },
};
```

### Secrets Management

#### Using Railway Secrets

```bash
# Set secrets in Railway
railway variables set JWT_SECRET="your-secret-here"
railway variables set DATABASE_URL="postgresql://..."
```

#### Using AWS Secrets Manager

```javascript
// utils/secrets.js
const AWS = require("aws-sdk");
const secretsManager = new AWS.SecretsManager();

async function getSecret(secretName) {
  const result = await secretsManager
    .getSecretValue({
      SecretId: secretName,
    })
    .promise();

  return JSON.parse(result.SecretString);
}
```

## 🔍 Monitoring and Logging

### Application Monitoring

#### Sentry Integration

```javascript
// server/middleware/sentry.js
const Sentry = require("@sentry/node");

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});

module.exports = Sentry;
```

#### Health Checks

```javascript
// server/routes/health.js
app.get("/health", async (req, res) => {
  const health = {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: await checkDatabase(),
      redis: await checkRedis(),
      ai_services: await checkAIServices(),
    },
  };

  res.json(health);
});
```

### Logging Configuration

```javascript
// utils/logger.js
const winston = require("winston");

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "logs/app.log" }),
  ],
});

module.exports = logger;
```

## 🛡️ Security Considerations

### Production Security Checklist

- [ ] **HTTPS enabled** with valid SSL certificates
- [ ] **Environment variables** properly configured
- [ ] **Database connections** use SSL
- [ ] **API rate limiting** enabled
- [ ] **CORS** properly configured
- [ ] **Security headers** implemented
- [ ] **Input validation** on all endpoints
- [ ] **File upload restrictions** in place
- [ ] **Authentication** and authorization working
- [ ] **Secrets** not exposed in logs or client code

### Security Headers

```javascript
// server/middleware/security.js
const helmet = require("helmet");

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
    },
  }),
);
```

## 📊 Performance Optimization

### Frontend Optimization

1. **Build Optimization**

   ```javascript
   // vite.config.ts
   export default defineConfig({
     build: {
       rollupOptions: {
         output: {
           manualChunks: {
             vendor: ["react", "react-dom"],
             charts: ["recharts"],
             ui: ["@radix-ui/react-dialog"],
           },
         },
       },
     },
   });
   ```

2. **Image Optimization**
   ```javascript
   // Use WebP format with fallbacks
   <picture>
     <source srcSet="image.webp" type="image/webp" />
     <img src="image.jpg" alt="Description" />
   </picture>
   ```

### Backend Optimization

1. **Caching Strategy**

   ```javascript
   // utils/cache.js
   const Redis = require("redis");
   const client = Redis.createClient(process.env.REDIS_URL);

   async function cacheGet(key) {
     return await client.get(key);
   }

   async function cacheSet(key, value, ttl = 3600) {
     return await client.setEx(key, ttl, JSON.stringify(value));
   }
   ```

2. **Database Connection Pooling**

   ```javascript
   // database/connection.js
   const { Pool } = require("pg");

   const pool = new Pool({
     connectionString: process.env.DATABASE_URL,
     ssl: process.env.NODE_ENV === "production",
     max: 20,
     idleTimeoutMillis: 30000,
     connectionTimeoutMillis: 2000,
   });
   ```

## 🚨 Troubleshooting

### Common Deployment Issues

#### Build Failures

```bash
# Clear cache and rebuild
npm run clean
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### Environment Variable Issues

```bash
# Verify environment variables
printenv | grep AGRO
railway variables  # For Railway
netlify env:list   # For Netlify
```

#### Database Connection Issues

```bash
# Test database connection
psql $DATABASE_URL -c "SELECT 1;"

# Check connection pool
SELECT * FROM pg_stat_activity;
```

#### AI Services Connectivity

```bash
# Test AI service endpoints
curl -f $SOIL_ANALYSIS_URL/health
curl -f $CROP_RECOMMENDATION_URL/health
curl -f $IMAGE_DIAGNOSIS_URL/health
```

### Rollback Procedures

#### Frontend Rollback (Netlify)

```bash
# Rollback to previous deployment
netlify sites:list
netlify api listSiteDeploys --site-id=your-site-id
netlify api restoreSiteDeploy --site-id=your-site-id --deploy-id=deploy-id
```

#### Backend Rollback (Railway)

```bash
# Rollback to previous deployment
railway status
railway rollback
```

#### Docker Rollback

```bash
# Rollback to previous image version
docker-compose down
docker-compose pull agrogrowth/backend:v1.2.2
docker-compose up -d
```

## 📞 Support and Maintenance

### Deployment Support

- **Documentation**: https://docs.agrogrowth.tn/deployment
- **Discord**: https://discord.gg/agrogrowth-dev
- **Email**: devops@agrogrowth.tn
- **Status Page**: https://status.agrogrowth.tn

### Maintenance Schedule

- **Security Updates**: Weekly
- **Dependency Updates**: Monthly
- **Database Backups**: Daily
- **Performance Reviews**: Quarterly
- **Disaster Recovery Tests**: Bi-annually

### Monitoring Dashboards

- **Application Performance**: Grafana dashboard
- **Infrastructure**: Railway/AWS CloudWatch
- **Error Tracking**: Sentry dashboard
- **Uptime Monitoring**: StatusCake/Pingdom

---

This deployment guide provides comprehensive instructions for deploying the AgroGrowth Platform across different environments and cloud providers. For specific deployment questions or issues, consult the support channels listed above.
