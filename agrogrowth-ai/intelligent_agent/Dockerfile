
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install NumPy first
RUN pip install --no-cache-dir numpy==1.24.3 pandas==2.1.3

# Install API and AI dependencies
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

COPY ai_common/ ./ai_common/
COPY intelligent_agent/ ./intelligent_agent/

ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

RUN python -c "import numpy, fastapi, uvicorn; print('AI dependencies OK')"

EXPOSE 8005

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8005/health || exit 1

CMD ["sh", "-c", "python -m uvicorn intelligent_agent.main:app --host 0.0.0.0 --port ${PORT:-${SERVICE_PORT:-8005}}"]
