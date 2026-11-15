
FROM python:3.11-slim

WORKDIR /app

ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1
ENV PIP_DISABLE_PIP_VERSION_CHECK=1

# System dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    make \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install compatible Python dependencies
RUN python -m pip install --no-cache-dir --upgrade pip setuptools wheel && \
    python -m pip install --no-cache-dir \
    numpy==1.24.3 \
    TA-Lib==0.8.3 \
    yfinance==0.2.18 \
    plotly==5.17.0

# Verify dependencies
RUN python -c "import numpy, talib, yfinance, plotly; print('Market dependencies OK'); print('NumPy:', numpy.__version__); print('TA-Lib:', talib.__version__)"

COPY ai_common/ ./ai_common/
COPY market_prediction/ ./market_prediction/

EXPOSE 8004

CMD ["sh", "-c", "python -m uvicorn market_prediction.main:app --host 0.0.0.0 --port ${PORT:-${SERVICE_PORT:-8004}}"]
