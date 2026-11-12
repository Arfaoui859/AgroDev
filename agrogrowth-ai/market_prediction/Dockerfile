
FROM python:3.11-slim

WORKDIR /app

# Install system build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    make \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
RUN pip install --no-cache-dir \
    numpy==1.24.3 \
    ta-lib==0.4.25 \
    yfinance==0.2.18 \
    plotly==5.17.0

# Copy application files
COPY ai_common/ ./ai_common/
COPY market_prediction/ ./market_prediction/

ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

RUN python -c "import talib, yfinance, plotly; print('Market dependencies OK')"

EXPOSE 8004

CMD ["sh", "-c", "python -m uvicorn market_prediction.main:app --host 0.0.0.0 --port ${PORT:-${SERVICE_PORT:-8004}}"]
