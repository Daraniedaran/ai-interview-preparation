# ==============================================================================
# Stage 1: Build the React + Vite Frontend
# ==============================================================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

# Install dependencies (utilize layer caching)
COPY frontend/package*.json ./
RUN npm install

# Copy frontend source and build static bundle
COPY frontend/ ./
RUN npm run build

# ==============================================================================
# Stage 2: Python Backend & Production Runner
# ==============================================================================
FROM python:3.11-slim AS runner

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    libmagic1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend code
COPY backend ./backend

# Copy built frontend assets from frontend-builder into the path expected by backend/main.py
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Set working directory to backend
WORKDIR /app/backend

# Copy startup script and ensure Unix line endings
COPY start.sh ./start.sh
RUN sed -i 's/\r$//' ./start.sh && chmod +x ./start.sh

# Environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000 \
    ENVIRONMENT=production \
    DEBUG=false

EXPOSE 8000

# Container healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8000}/health || exit 1

# Launch application
CMD ["sh", "./start.sh"]
