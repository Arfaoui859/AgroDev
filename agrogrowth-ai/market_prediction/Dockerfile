FROM python:3.11-slim

WORKDIR /app

# Install only the native build tools required by Python wheels that may need
# compilation. TA-Lib is intentionally not installed: the market prediction
# service does not import it, and the old 0.4.25 release has no reliable
# prebuilt wheel for this Python/Linux combination.
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    make \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Runtime dependencies actually imported by this service and ai_common.
# Keep NumPy/Pandas/scikit-learn versions compatible with Python 3.11.
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir \
    fastapi==0.104.1 \
    uvicorn==0.24.0 \
    pydantic==2.5.1 \
    numpy==1.24.3 \
    pandas==2.1.3 \
    scikit-learn==1.3.2 \
    httpx==0.25.2

# Copy application files
COPY ai_common/ ./ai_common/
COPY market_prediction/ ./market_prediction/

ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

# Fail the image build if a required runtime import is missing.
RUN python -c "import fastapi, uvicorn, pydantic, numpy, pandas, sklearn, httpx; from market_prediction.main import app; print('Market Prediction runtime imports OK')"

EXPOSE 8004

CMD ["sh", "-c", "python -m uvicorn market_prediction.main:app --host 0.0.0.0 --port ${PORT:-${SERVICE_PORT:-8004}}"]
