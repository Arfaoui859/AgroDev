# Dockerfile for Image Diagnosis AI Service
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    libgfortran5 \
    libopencv-dev \
    python3-opencv \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY ../requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy common AI modules
COPY ../ai_common/ ./ai_common/

# Copy image diagnosis specific code
COPY . ./image_diagnosis/

# Create directories
RUN mkdir -p models data logs uploads

# Set environment variables
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1
ENV SERVICE_NAME=image-diagnosis
ENV MAX_UPLOAD_SIZE=10485760

# Expose port
EXPOSE 8003

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD sh -c 'curl -f http://localhost:$SERVICE_PORT/health || exit 1'

# Run the service
ENV SERVICE_PORT=8003
CMD ["sh", "-c", "uvicorn image_diagnosis.main:app --host 0.0.0.0 --port $SERVICE_PORT"]
