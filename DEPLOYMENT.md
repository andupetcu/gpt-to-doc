# Deployment Guide - GPT to Doc

This guide covers deploying the GPT to Doc application using Coolify.

## Prerequisites

- Coolify instance running and accessible
- GitHub account with access to the repository
- Docker installed (handled by Coolify)

## Deployment Steps

### 1. Add Your Application to Coolify

1. Log into your Coolify instance
2. Create a new project
3. Add a new service/application
4. **IMPORTANT**: Select **Docker** as the build pack (NOT Nixpacks auto-detection)

### 2. Configure the Service

#### Basic Settings
- **Name**: `gpt-to-doc`
- **Repository**: `https://github.com/andupetcu/gpt-to-doc.git`
- **Branch**: `master`
- **Dockerfile**: `Dockerfile`

#### Environment Variables
```
FLASK_DEBUG=false
FLASK_HOST=0.0.0.0
FLASK_PORT=5000
LOG_LEVEL=INFO
FILE_CLEANUP_ENABLED=true
FILE_CLEANUP_INTERVAL=3600
FILE_MAX_AGE=3600
```

#### Ports
- **Container Port**: `5000`
- **Host Port**: `5000` (or any available port)
- **Protocol**: `HTTP`

#### Volumes (Persistent Storage)
Create two volumes for persistent storage:

1. **Uploads Volume**
   - Source: `uploads`
   - Target: `/app/backend/uploads`
   - Type: Named Volume

2. **Outputs Volume**
   - Source: `outputs`
   - Target: `/app/backend/outputs`
   - Type: Named Volume

#### Health Check
- **Test**: `curl -f http://localhost:5000/`
- **Interval**: `30s`
- **Timeout**: `10s`
- **Retries**: `3`
- **Start Period**: `40s`

#### Restart Policy
- **Policy**: `unless-stopped`

### 3. Deploy

1. Click **Deploy** or **Save & Deploy**
2. Coolify will:
   - Clone the repository
   - Build the Docker image
   - Start the container
   - Monitor the health checks

### 4. Verify Deployment

1. Check the container logs in Coolify dashboard
2. Access your application at the configured URL
3. Test the markdown conversion functionality

## Post-Deployment

### File Cleanup
The application includes an automatic file cleanup scheduler:
- Runs every `FILE_CLEANUP_INTERVAL` seconds (default: 3600 = 1 hour)
- Deletes files older than `FILE_MAX_AGE` seconds (default: 3600 = 1 hour)
- Set `FILE_CLEANUP_ENABLED=true` to enable (default)

### Rate Limiting
The application includes rate limiting:
- Default: `500 requests/hour`
- Uploads: `100 requests/hour`
- Text conversion: `200 requests/hour`

Adjust these in environment variables:
```
RATE_LIMIT_DEFAULT=500/hour
RATE_LIMIT_UPLOADS=100/hour
RATE_LIMIT_TEXT=200/hour
```

### Logging
Logs are written to:
- Container stdout/stderr (viewable in Coolify dashboard)
- File: `/app/backend/app.log` (inside container)

Set log level via environment variable:
```
LOG_LEVEL=DEBUG|INFO|WARNING|ERROR|CRITICAL
```

## Troubleshooting

### Nixpacks Build Failure Error
**Error**: "Nixpacks failed to detect the application type"

**Solution**:
1. In Coolify, go to your service settings
2. Look for **Build Pack** or **Build Method** option
3. Select **Docker** instead of **Nixpacks** or **Auto-detect**
4. Make sure **Dockerfile** field points to `./Dockerfile` or just `Dockerfile`
5. Redeploy

This project uses a custom Dockerfile that combines both Node.js (for React frontend) and Python (for Flask backend) in a multi-stage build. Nixpacks auto-detection doesn't recognize this structure, so Docker build pack must be used explicitly.

### Container Won't Start
1. Check the build logs in Coolify dashboard
2. Verify all environment variables are set correctly
3. Ensure port 5000 is not already in use
4. Make sure the build pack is set to **Docker**, not Nixpacks

### 502 Bad Gateway
1. Wait for the health checks to pass (start period is 40s)
2. Check container logs for Flask/Gunicorn errors
3. Verify the application is running: `curl http://localhost:5000/`

### File Permissions Issues
1. Ensure volumes are properly mounted
2. Check that the container user has write permissions
3. Verify volume paths in Coolify configuration

### High Memory Usage
1. Adjust gunicorn worker count in Dockerfile:
   - Current: `--workers 4`
   - Reduce for lower memory machines: `--workers 2`
2. Restart the container after changes

## Updating the Application

To update the application:

1. Make changes to the code locally
2. Commit and push to GitHub: `git push origin master`
3. In Coolify dashboard:
   - Go to your service
   - Click **Redeploy** or **Update**
4. Coolify will automatically:
   - Pull the latest code
   - Rebuild the Docker image
   - Restart the container

## Environment-Specific Configuration

### Development
```
FLASK_DEBUG=true
LOG_LEVEL=DEBUG
```

### Production (Current)
```
FLASK_DEBUG=false
LOG_LEVEL=INFO
```

## API Endpoints

After deployment, the following endpoints will be available:

- `GET /` - Serve frontend application
- `POST /convert` - Convert uploaded .md file to DOCX
- `POST /convert-text` - Convert markdown text (JSON) to DOCX
- `POST /convert-pdf` - Convert markdown text to PDF
- `POST /save-md` - Save markdown text as .md file

See `docs/API_DOCUMENTATION.md` for detailed API documentation.

## Support

For Coolify-specific issues, see: https://coolify.io/docs
For application issues, check the GitHub repository: https://github.com/andupetcu/gpt-to-doc
