FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY image_diagnosis/requirements.txt ./requirements.txt

RUN pip install --no-cache-dir -r requirements.txt

COPY ai_common/ ./ai_common/
COPY image_diagnosis/ ./image_diagnosis/

RUN mkdir -p models data logs uploads

ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1
ENV SERVICE_NAME=image-diagnosis
ENV MAX_UPLOAD_SIZE=10485760
ENV SERVICE_PORT=8003

EXPOSE 8003

HEALTHCHECK --interval=30s --timeout=30s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8003/health || exit 1

CMD ["sh", "-c", "python -m uvicorn image_diagnosis.main:app --host 0.0.0.0 --port ${PORT:-${SERVICE_PORT:-8003}}"]
