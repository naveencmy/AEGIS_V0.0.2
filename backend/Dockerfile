FROM python:3.11-slim

LABEL maintainer="IP-SAKTI Team"
LABEL description="IP-SAKTI Sahayak — Sovereign Ayurveda IP Backend"

# System dependencies for llama-cpp-python compilation
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    cmake \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY . /app/backend/

# Create data directories
RUN mkdir -p /app/chroma_db /app/data/uploads /app/data/sample_regulatory /app/models

# Expose API port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD python -c "import httpx; r=httpx.get('http://localhost:8000/health'); assert r.status_code==200"

# Run with uvicorn
CMD ["python", "-m", "uvicorn", "backend.main:app", \
     "--host", "0.0.0.0", "--port", "8000", \
     "--workers", "1", "--log-level", "info"]
