# Use the base AI image
FROM agrogrowth-ai-base:latest

# Set working directory
WORKDIR /app

# Copy market prediction specific files
COPY market_prediction/ ./market_prediction/
COPY ai_common/ ./ai_common/

# Install any additional dependencies specific to market prediction
RUN pip install --no-cache-dir \
    ta-lib==0.4.25 \
    yfinance==0.2.18 \
    plotly==5.17.0

# Expose port
EXPOSE 8003

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8003/health || exit 1

# Run the application
CMD ["python", "-m", "market_prediction.main"]
