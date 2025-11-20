# Coolify Deployment Guide

This guide covers deploying the Next.js + Flask markdown converter application on Coolify.

## Architecture Overview

The application consists of two services:
- **Next.js Frontend**: Node.js application on port 3000
- **Flask API Backend**: Python application on port 5000 (using Gunicorn)

Both services communicate via a private network, with the frontend making API calls to the backend.

---

## Prerequisites

- Coolify instance running and accessible
- Git repository pushed to GitHub/GitLab
- Docker support enabled in Coolify
- Basic understanding of Coolify's UI

---

## Step 1: Create Flask Backend Application

### 1.1 Add New Application in Coolify

1. Go to **Applications** → **Create New Application**
2. Select **Docker** as the deployment method
3. Choose **From Git Repository**
4. Configure:
   - **Repository URL**: `https://github.com/yourusername/gpt-to-doc.git`
   - **Repository Branch**: `master`
   - **Base Directory**: `backend`

### 1.2 Docker Configuration

Set the following in Coolify:

**Build Configuration:**
- **Dockerfile Path**: (leave empty - uses root Dockerfile or create one)
- **Docker Compose File**: (optional - use if you prefer docker-compose)

**Or create `backend/Dockerfile`:**

```dockerfile
FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    pandoc \
    texlive-latex-base \
    texlive-fonts-recommended \
    texlive-latex-extra \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Create necessary directories
RUN mkdir -p uploads outputs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5000/health')"

# Run with Gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "--timeout", "120", "app:app"]
```

### 1.3 Environment Variables

Add the following environment variables in Coolify:

```
FLASK_ENV=production
FLASK_DEBUG=false
FLASK_HOST=0.0.0.0
FLASK_PORT=5000
LOG_LEVEL=INFO
UPLOAD_FOLDER=/app/uploads
OUTPUT_FOLDER=/app/outputs
MAX_FILE_SIZE=10485760
FILE_CLEANUP_ENABLED=true
FILE_CLEANUP_INTERVAL=3600
FILE_MAX_AGE=3600
RATE_LIMIT_DEFAULT=500/hour
RATE_LIMIT_UPLOADS=100/hour
RATE_LIMIT_TEXT=200/hour
```

**CORS Configuration** (set in app.py or as environment variable):
- The app is configured to accept requests from the Next.js frontend
- Update the CORS origins if deploying to a custom domain:
  - If using Coolify's built-in domain: allow that domain
  - If using custom domain: allow your domain

### 1.4 Volumes and Storage

Add persistent volumes for:
- `/app/uploads` - Temporary uploaded files
- `/app/outputs` - Converted documents

In Coolify:
1. Go to **Application Settings** → **Volumes**
2. Add volume: `/app/uploads` → `uploads` (persistent storage)
3. Add volume: `/app/outputs` → `outputs` (persistent storage)

### 1.5 Port Configuration

- **Port**: `5000`
- **Health Check Endpoint**: `/health` (optional - implement in Flask if needed)

---

## Step 2: Create Next.js Frontend Application

### 2.1 Add New Application in Coolify

1. Go to **Applications** → **Create New Application**
2. Select **Docker** as the deployment method
3. Choose **From Git Repository**
4. Configure:
   - **Repository URL**: `https://github.com/yourusername/gpt-to-doc.git`
   - **Repository Branch**: `master`
   - **Base Directory**: `nextjs-app`

### 2.2 Docker Configuration

**Create `nextjs-app/Dockerfile` for production:**

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source
COPY . .

# Build Next.js app
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install dumb-init for signal handling
RUN apk add --no-cache dumb-init

# Copy built app from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Expose port
EXPOSE 3000

# Run with dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]
```

### 2.3 Environment Variables

Add the following in Coolify:

```
NODE_ENV=production
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
NEXT_PUBLIC_CONVERTER_URL=https://api.yourdomain.com
```

**Important**: Replace with your actual values:
- `your_clerk_publishable_key` - From your Clerk dashboard
- `your_clerk_secret_key` - From your Clerk dashboard
- `https://api.yourdomain.com` - Your Flask API endpoint (can be same domain with path-based routing)

### 2.4 Port Configuration

- **Port**: `3000`
- **Public Port**: The main domain you want users to access

### 2.5 Health Check

Endpoint: `/` (Next.js serves at root)

---

## Step 3: Networking Setup

### 3.1 Internal Communication

In Coolify, applications on the same server can communicate via:
- Docker network: `bridge` (default)
- Service name: Use the application name as hostname

For Flask backend communication from Next.js:
- If services are on same Coolify server:
  - Use `http://flask-app:5000` (where `flask-app` is the service name)
- If services are separate:
  - Use the Flask service's public URL

### 3.2 Configure Next.js Environment

In Coolify, set `NEXT_PUBLIC_CONVERTER_URL` to point to Flask:

**Option A: Same Server, Internal Network**
```
NEXT_PUBLIC_CONVERTER_URL=http://flask-backend:5000
```

**Option B: External URL**
```
NEXT_PUBLIC_CONVERTER_URL=https://api.yourdomain.com
```

---

## Step 4: Reverse Proxy Configuration

### 4.1 Set Up Domain Routing

If using a single domain with path-based routing:

**Coolify Proxy Configuration:**

1. **Frontend Application**
   - Domain: `yourdomain.com`
   - Path: `/` (root)
   - Port: `3000`

2. **Backend Application**
   - Domain: `yourdomain.com`
   - Path: `/api` (optional)
   - Port: `5000`
   - Requires path rewriting if using `/api` prefix

### 4.2 Alternative: Subdomain Routing

**Recommended approach:**

1. **Frontend**
   - Domain: `yourdomain.com` or `www.yourdomain.com`
   - Port: `3000`

2. **Backend**
   - Domain: `api.yourdomain.com`
   - Port: `5000`

Then set Next.js environment:
```
NEXT_PUBLIC_CONVERTER_URL=https://api.yourdomain.com
```

---

## Step 5: CORS Configuration for Production

### 5.1 Update Flask CORS Settings

When deployed, update the Flask CORS configuration in `backend/app.py`:

**For production with your domain:**

```python
CORS(app,
    resources={
        r"/convert*": {
            "origins": ["https://yourdomain.com", "https://www.yourdomain.com"],
            "methods": ["GET", "POST", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True
        },
        r"/save-md": {
            "origins": ["https://yourdomain.com", "https://www.yourdomain.com"],
            "methods": ["GET", "POST", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True
        }
    }
)
```

Or set via environment variable if your app supports it.

---

## Step 6: Deployment Checklist

- [ ] Flask application created and configured
- [ ] Next.js application created and configured
- [ ] Environment variables set for both services
- [ ] Volumes created for Flask uploads/outputs
- [ ] Domains configured and pointing to Coolify
- [ ] SSL certificates configured (Coolify can auto-generate)
- [ ] Health checks configured
- [ ] CORS origins updated for production domains
- [ ] Database credentials configured (if using database)
- [ ] Clerk keys configured for production

---

## Step 7: Post-Deployment

### 7.1 Verify Services

1. **Check Flask Backend**
   ```
   curl https://api.yourdomain.com/
   ```
   Should return Flask welcome page or error (not CORS error)

2. **Check Next.js Frontend**
   ```
   curl https://yourdomain.com/
   ```
   Should return HTML content

3. **Test Conversion**
   - Visit `https://yourdomain.com/app`
   - Try uploading a markdown file
   - Should convert and download

### 7.2 Monitor Logs

In Coolify:
1. Go to **Applications** → **Your App** → **Logs**
2. Check for errors
3. Monitor resource usage

### 7.3 Update Clerk Settings

In Clerk Dashboard:
1. Go to **Allowlist** (or CORS settings)
2. Add your production domain
3. Update authorized origins if needed

---

## Troubleshooting

### CORS Errors in Browser

**Problem**: "Access to fetch at 'https://api.yourdomain.com' has been blocked by CORS policy"

**Solutions**:
1. Verify Flask CORS origins match your frontend domain
2. Ensure `NEXT_PUBLIC_CONVERTER_URL` is correct
3. Check browser console for exact origin being blocked
4. Clear browser cache and do hard refresh

### File Upload Failures

**Problem**: Files uploaded but conversion fails

**Solutions**:
1. Check Flask logs: `Applications` → `Flask App` → `Logs`
2. Verify Pandoc is installed in Docker image
3. Check volume permissions for uploads/outputs folders
4. Ensure `MAX_FILE_SIZE` environment variable is sufficient

### Clerk Authentication Issues

**Problem**: Users can't sign in or sign up

**Solutions**:
1. Verify Clerk keys in environment variables
2. Check Clerk dashboard for domain allowlist
3. Ensure production Clerk instance is used (not development)
4. Check browser console for specific Clerk error messages

### Service Communication Issues

**Problem**: Next.js can't reach Flask backend

**Solutions**:
1. Verify `NEXT_PUBLIC_CONVERTER_URL` matches Flask service URL
2. Check if services are on same network
3. Test internal URL: `http://flask-service-name:5000` from Next.js
4. Check firewalls and security groups allow traffic between services

---

## Performance Optimization

### 1. Enable Caching

In Coolify, enable HTTP caching for static assets:
- JavaScript bundles (`.js`)
- CSS files (`.css`)
- Images (`.png`, `.jpg`, `.svg`)

### 2. Configure Gunicorn Workers

In `backend/Dockerfile`, adjust workers based on CPU:
```dockerfile
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", ...]
```

For more workers:
- **2 cores**: 3-5 workers
- **4 cores**: 7-9 workers
- **Formula**: `(2 * cores) + 1`

### 3. Enable Compression

Flask can enable gzip compression. Add to app.py:
```python
from flask_compress import Compress
Compress(app)
```

Add to requirements.txt:
```
Flask-Compress==1.14
```

---

## Security Recommendations

1. **Secrets Management**
   - Use Coolify's secret manager for sensitive variables
   - Never commit `.env` files with real credentials

2. **HTTPS**
   - Enable SSL/TLS for all connections
   - Coolify can auto-generate Let's Encrypt certificates

3. **Rate Limiting**
   - Flask already has rate limiting configured
   - Monitor for abuse

4. **File Upload Security**
   - Validate file types before conversion
   - Limit maximum file size
   - Clean up old files regularly (handled by Flask scheduler)

5. **Authentication**
   - Use Clerk's production keys only
   - Enable MFA for user accounts if available

---

## Monitoring and Maintenance

### Logs to Monitor

1. **Flask Logs**
   - Conversion errors
   - Rate limiting triggers
   - File cleanup operations

2. **Next.js Logs**
   - Build errors
   - Runtime errors
   - API call failures

### Regular Maintenance

- Review conversion logs weekly
- Monitor disk space for uploads/outputs
- Check error rates and performance metrics
- Update dependencies monthly

---

## Rollback Procedure

If deployment fails:

1. In Coolify, go to **Application** → **Deployments**
2. Select the previous successful deployment
3. Click **Redeploy**
4. Wait for services to restart
5. Verify services are running

---

## Additional Resources

- [Coolify Documentation](https://coolify.io/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Gunicorn Documentation](https://docs.gunicorn.org/)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [Clerk Documentation](https://clerk.com/docs)
