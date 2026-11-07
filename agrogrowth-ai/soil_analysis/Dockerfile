
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install project dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy shared AI modules
COPY ai_common ./ai_common

# Copy Soil Analysis service
COPY soil_analysis ./soil_analysis

ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1
ENV SERVICE_PORT=8001

# ML artifacts destination
RUN mkdir -p /app/soil_analysis/models/soil_ml

EXPOSE 8001

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8001/health || exit 1

CMD ["sh", "-c", "uvicorn soil_analysis.main:app --host 0.0.0.0 --port ${SERVICE_PORT}"]
