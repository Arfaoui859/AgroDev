FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements first for better caching
COPY ../requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy common modules
COPY ../ai_common ./ai_common

# Copy service-specific files
COPY . ./crop_recommendation

# Set Python path
ENV PYTHONPATH=/app

# Create models directory
RUN mkdir -p /app/models

# Expose port
EXPOSE 8002

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD sh -c 'curl -f http://localhost:$SERVICE_PORT/health || exit 1'

# Run the application
ENV SERVICE_PORT=8002
CMD ["sh", "-c", "uvicorn crop_recommendation.main:app --host 0.0.0.0 --port $SERVICE_PORT"]
