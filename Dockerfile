# Use an official Python image as the base
FROM python:3.9

# Install Node.js for React build
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs

# Install Pandoc and LaTeX dependencies for PDF conversion
RUN apt-get update && apt-get install -y pandoc texlive texlive-latex-base texlive-fonts-recommended texlive-extra-utils texlive-latex-extra

# Set the working directory
WORKDIR /app

# Copy frontend files and build React app
COPY frontend/package*.json frontend/
WORKDIR /app/frontend
RUN npm install

COPY frontend/ .
RUN npm run build

# Copy backend files
WORKDIR /app
COPY backend/ backend/

# Move built React app to backend static folder
RUN mkdir -p backend/build && cp -r frontend/build/* backend/build/

WORKDIR /app/backend

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Expose the Flask port
EXPOSE 5000

# Run the application
CMD ["python", "app.py"]
