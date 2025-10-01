# Use the base AI image
FROM agrogrowth-ai-base:latest

# Set working directory
WORKDIR /app

# Copy intelligent agent specific files
COPY intelligent_agent/ ./intelligent_agent/
COPY ai_common/ ./ai_common/

# Install any additional dependencies specific to intelligent agent
RUN pip install --no-cache-dir \
    arabic-reshaper==2.1.4 \
    python-bidi==0.4.2 \
    langdetect==1.0.9

# Expose port
EXPOSE 8005

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8005/health || exit 1

# Run the application
CMD ["python", "-m", "intelligent_agent.main"]
