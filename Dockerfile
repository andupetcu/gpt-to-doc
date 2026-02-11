# Main application stage
FROM python:3.9-slim

# Install system dependencies including Pandoc, LaTeX, curl, and Node.js
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    pandoc \
    texlive \
    texlive-latex-base \
    texlive-fonts-recommended \
    texlive-extra-utils \
    texlive-latex-recommended \
    gnupg \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy backend files (includes pre-built React app in backend/build/)
COPY backend/ backend/

# Copy templates directory
COPY templates/ templates/

# Install Python dependencies
RUN pip install --no-cache-dir -r backend/requirements.txt

# Install Node.js docx package for themed document generation
WORKDIR /app/templates
RUN npm init -y && npm install docx marked

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
