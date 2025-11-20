# Coolify Quick Reference Guide

## TL;DR - Deployment Steps

### 1. Create Flask Backend Service

**In Coolify Dashboard:**
1. Applications → Create New
2. Select "Docker" → "From Git Repository"
3. Repository: `https://github.com/yourusername/gpt-to-doc.git`
4. Branch: `master`
5. Base Directory: `backend`

**Environment Variables (add these):**
```
FLASK_ENV=production
FLASK_DEBUG=false
FLASK_HOST=0.0.0.0
FLASK_PORT=5000
LOG_LEVEL=INFO
UPLOAD_FOLDER=/app/uploads
OUTPUT_FOLDER=/app/outputs
MAX_FILE_SIZE=10485760
```

**Volumes:**
- Mount `/app/uploads` → persistent storage
- Mount `/app/outputs` → persistent storage

**Port:** 5000

---

### 2. Create Next.js Frontend Service

**In Coolify Dashboard:**
1. Applications → Create New
2. Select "Docker" → "From Git Repository"
3. Repository: `https://github.com/yourusername/gpt-to-doc.git`
4. Branch: `master`
5. Base Directory: `nextjs-app`

**Environment Variables (add these):**
```
NODE_ENV=production
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx (from Clerk dashboard)
CLERK_SECRET_KEY=sk_test_xxxxx (from Clerk dashboard)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
NEXT_PUBLIC_CONVERTER_URL=http://flask-backend:5000
```

**Port:** 3000

---

### 3. Configure Networking

**Option A: Subdomain Routing (Recommended)**
- Frontend: `yourdomain.com` → port 3000
- Backend: `api.yourdomain.com` → port 5000
- Update Next.js env: `NEXT_PUBLIC_CONVERTER_URL=https://api.yourdomain.com`

**Option B: Internal Network (Same Server)**
- Keep `NEXT_PUBLIC_CONVERTER_URL=http://flask-backend:5000`
- Coolify automatically connects services on same network

---

### 4. Important Environment Variables

**For Production:**
- Change `NEXT_PUBLIC_CONVERTER_URL` to your actual Flask API URL
- Use production Clerk keys (not development)
- Set `NODE_ENV=production` and `FLASK_ENV=production`

**Example Production .env Values:**
```
NEXT_PUBLIC_CONVERTER_URL=https://api.gpt-to-doc.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
CLERK_SECRET_KEY=sk_live_xxxxx
```

---

### 5. Test Deployment

**Verify Flask is running:**
```bash
curl https://api.yourdomain.com/
```

**Verify Next.js is running:**
```bash
curl https://yourdomain.com/
```

**Test File Upload:**
1. Go to `https://yourdomain.com/app`
2. Try uploading a markdown file
3. Should download converted DOCX file

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| CORS errors | Check Flask CORS origins match frontend domain |
| Can't upload files | Verify `NEXT_PUBLIC_CONVERTER_URL` is correct |
| Clerk auth fails | Check Clerk keys match production instance |
| Service won't start | Check Coolify logs for build/startup errors |
| Files not persisting | Verify volumes are mounted in Coolify |

---

## Deployment Checklist

- [ ] Flask service created with correct base directory
- [ ] Next.js service created with correct base directory
- [ ] Clerk keys added to Next.js environment
- [ ] `NEXT_PUBLIC_CONVERTER_URL` set correctly
- [ ] Volumes created and mounted for Flask
- [ ] Domains configured and DNS pointing to Coolify
- [ ] SSL/HTTPS enabled
- [ ] Services started and healthy
- [ ] Test file upload works end-to-end

---

## Commands for Docker Testing

**Before deploying to Coolify, test locally:**

```bash
# Build both images
docker-compose build

# Start services
docker-compose up

# Test Flask
curl http://localhost:5000/

# Test Next.js  
curl http://localhost:3000/

# Check logs
docker-compose logs flask-backend
docker-compose logs nextjs-frontend

# Stop services
docker-compose down
```

---

## Quick Links

- **Coolify Docs**: https://coolify.io/docs
- **Clerk Docs**: https://clerk.com/docs
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **Full Deployment Guide**: See `COOLIFY_DEPLOYMENT.md`
