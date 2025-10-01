# Multi-stage Dockerfile for AgroGrowth Platform
# Optimized for production deployment

# =====================================
# Stage 1: Frontend Build
# =====================================
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Copy package files for better caching
COPY package*.json ./
RUN npm ci --only=production

# Copy source code and build frontend
COPY . .
RUN npm run build

# =====================================
# Stage 2: Python AI Services Base
# =====================================
FROM python:3.9-slim AS ai-base

WORKDIR /app/ai

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy AI services requirements and install
COPY agrogrowth-ai/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy AI services code
COPY agrogrowth-ai/ .

# =====================================
# Stage 3: Production Runtime
# =====================================
FROM node:18-alpine AS runtime

# Set production environment
ENV NODE_ENV=production
ENV PORT=8080

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Install production dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built frontend from builder stage
COPY --from=frontend-builder /app/dist ./dist

# Copy server code
COPY server/ ./server/
COPY shared/ ./shared/

# Copy AI services from ai-base stage
COPY --from=ai-base /app/ai ./agrogrowth-ai/

# Copy models directory structure (without actual model files)
COPY models/ ./models/

# Copy prompt templates
COPY prompts/ ./prompts/

# Create necessary directories and set permissions
RUN mkdir -p /app/logs /app/uploads /app/cache && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "http.get('http://localhost:$PORT/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Expose port
EXPOSE 8080

# Start the application
CMD ["node", "server/index.js"]

# =====================================
# Development Stage (Optional)
# =====================================
FROM runtime AS development

ENV NODE_ENV=development

# Install development dependencies
RUN npm install

# Install development tools
RUN npm install -g nodemon tsx

# Expose additional ports for development
EXPOSE 5173 3000

# Development command
CMD ["npm", "run", "server:dev"]

# =====================================
# Labels and Metadata
# =====================================
LABEL maintainer="AgroGrowth Team <dev@agrogrowth.tn>"
LABEL description="AI-powered agricultural management platform for Tunisia"
LABEL version="1.0.0"
LABEL org.opencontainers.image.title="AgroGrowth Platform"
LABEL org.opencontainers.image.description="Full-stack agricultural platform with AI integration"
LABEL org.opencontainers.image.vendor="AgroGrowth"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.source="https://github.com/agrogrowth/platform"
