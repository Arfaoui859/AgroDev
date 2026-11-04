# Multi-stage Dockerfile for the AgroGrowth platform (Vite SPA + Express API).
# The AI microservices under agrogrowth-ai/ are deployed separately; this image
# serves the SPA and the Node API, which falls back to the rule-based engine
# when those microservices are not reachable.

# =====================================
# Stage 1: Build (client + server bundle)
# =====================================
FROM node:22-alpine AS builder

WORKDIR /app

# Install ALL dependencies (build needs devDependencies such as vite/typescript)
COPY package*.json ./
RUN npm ci --no-audit --no-fund

# Copy source and build the SPA (dist/) + the server bundle (build/server/)
COPY . .
RUN npm run build

# =====================================
# Stage 2: Development (optional, not the default target)
# =====================================
FROM node:22-alpine AS development

ENV NODE_ENV=development
WORKDIR /app
COPY package*.json ./
RUN npm ci --no-audit --no-fund
COPY . .
EXPOSE 8080
CMD ["npm", "run", "dev"]

# =====================================
# Stage 3: Production runtime (default build target)
# =====================================
FROM node:22-alpine AS runtime

ENV NODE_ENV=production
ENV PORT=8080

# Run as a non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001 -G nodejs

WORKDIR /app

# Production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force

# Built artifacts: the SPA (public static root) and the server bundle, which is
# kept OUTSIDE dist/ so it can never be served by express.static.
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/build ./build

# Prompt templates used by AI routes at runtime
COPY prompts/ ./prompts/

RUN mkdir -p /app/logs /app/uploads /app/cache && \
    chown -R nodejs:nodejs /app

USER nodejs

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "fetch('http://localhost:'+(process.env.PORT||8080)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

EXPOSE 8080

# Start the bundled Express server (serves /api/* and the SPA)
CMD ["node", "build/server/node-build.mjs"]

LABEL maintainer="AgroGrowth Team <dev@agrogrowth.tn>"
LABEL description="AI-powered agricultural management platform for Tunisia"
LABEL org.opencontainers.image.title="AgroGrowth Platform"
LABEL org.opencontainers.image.licenses="MIT"
