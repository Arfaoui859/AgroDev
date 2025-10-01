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
COPY . ./soil_analysis

# Set Python path
ENV PYTHONPATH=/app

# Create models directory
RUN mkdir -p /app/models

# Expose port
EXPOSE 8001

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8001/health || exit 1

# Run the application
CMD ["uvicorn", "soil_analysis.main:app", "--host", "0.0.0.0", "--port", "8001"]
