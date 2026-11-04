
# Python runtime
FROM python:3.11-slim

WORKDIR /app

# System dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install service dependencies
RUN pip install --no-cache-dir \
    fastapi==0.104.1 \
    uvicorn==0.24.0 \
    pydantic==2.5.1 \
    python-multipart==0.0.9 \
    requests==2.31.0 \
    httpx==0.25.2 \
    aiohttp==3.9.1 \
    python-dotenv==1.0.0 \
    arabic-reshaper==2.1.4 \
    python-bidi==0.4.2 \
    langdetect==1.0.9

# Copy shared modules and service code
COPY ai_common/ ./ai_common/
COPY intelligent_agent/ ./intelligent_agent/

# Python configuration
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1
ENV PORT=8005

# Verify critical dependencies
RUN python -c "import fastapi, uvicorn, pydantic; print('Dependencies OK')"

EXPOSE 8005

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8005/health || exit 1

# Start API
CMD ["sh", "-c", "uvicorn intelligent_agent.main:app --host 0.0.0.0 --port ${PORT:-8005}"]
