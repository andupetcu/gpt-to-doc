# Build stage for React frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source files
COPY frontend/ .

# Build the React app
RUN npm run build

# Main application stage
FROM python:3.9-slim

# Install system dependencies including Pandoc, LaTeX, and curl
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    pandoc \
    texlive \
    texlive-latex-base \
    texlive-fonts-recommended \
    texlive-extra-utils \
    texlive-latex-extra \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy backend files
COPY backend/ backend/

# Copy built React app from builder stage
COPY --from=frontend-builder /app/frontend/build backend/build/

# Install Python dependencies
RUN pip install --no-cache-dir -r backend/requirements.txt

WORKDIR /app/backend

# Create necessary directories
RUN mkdir -p uploads outputs

# Expose the port
EXPOSE 5000

# Health check using curl
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:5000/ || exit 1

# Run with gunicorn for production
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "--timeout", "120", "--access-logfile", "-", "--error-logfile", "-", "app:app"]
