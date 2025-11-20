# SaaS Boilerplate Integration Setup Guide

This document explains how to set up and deploy the integrated Markdown-to-DOCX converter with Clerk authentication and SaaS features.

## Architecture Overview

```
┌─────────────────────────────────┐
│   Next.js 14 Frontend           │
│   - Landing page                │
│   - Dashboard                   │
│   - Converter UI (Shadcn)       │
│   - Free tier tracking          │
└──────────────┬──────────────────┘
               │
               │ HTTP API calls
               │
┌──────────────▼──────────────────┐
│   Flask Backend (Microservice)  │
│   - Pandoc conversion           │
│   - File handling               │
│   - Rate limiting               │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│   Clerk Authentication          │
│   - User management             │
│   - JWT tokens                  │
│   - Session handling            │
└─────────────────────────────────┘
```

## Prerequisites

- Node.js 18+ (for Next.js development)
- Python 3.9+ (for Flask backend)
- Pandoc installed and in PATH
- Clerk account (https://clerk.com)
- Docker (optional, for containerization)

## Step 1: Set Up Clerk Authentication

1. Create a Clerk account at https://clerk.com
2. Create a new application
3. In the Clerk dashboard:
   - Go to API Keys
   - Copy your `Publishable Key` and `Secret Key`
   - Set the sign-in URL to `/sign-in`
   - Set the sign-up URL to `/sign-up`
   - Set the after-sign-in URL to `/dashboard`
   - Set the after-sign-up URL to `/dashboard`

## Step 2: Configure Next.js Environment

Update `nextjs-app/.env.local`:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key_here
CLERK_SECRET_KEY=your_secret_key_here
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
NEXT_PUBLIC_CONVERTER_URL=http://localhost:5000
```

For production, change `NEXT_PUBLIC_CONVERTER_URL` to your Flask backend URL.

## Step 3: Configure Flask Backend

Update or create `backend/.env`:

```bash
# Optional: Clerk integration
CLERK_ENDPOINT=https://your-tenant.clerk.accounts.com
CLERK_AUDIENCE=your_clerk_app_id

# CORS configuration
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com

# Other existing Flask config
FLASK_ENV=production
LOG_LEVEL=INFO
```

## Step 4: Install Dependencies

### Next.js Frontend:

```bash
cd nextjs-app
npm install
```

### Flask Backend:

```bash
cd backend
pip install -r requirements.txt
```

## Step 5: Run Locally

### Start Flask Backend:

```bash
cd backend
python app.py
# Backend will run on http://localhost:5000
```

### Start Next.js Frontend:

```bash
cd nextjs-app
npm run dev
# Frontend will run on http://localhost:3000
```

Visit http://localhost:3000 in your browser.

## Step 6: Features Overview

### Public Landing Page (/)
- Product description
- Features list
- CTA buttons (Try Now, Sign Up)

### Free Tier Tracking
- Users can convert up to 3 documents without signing up
- Tracked using browser fingerprinting + localStorage
- Optional, can be bypassed by tech-savvy users (acceptable for soft gate)

### Sign In / Sign Up (/sign-in, /sign-up)
- Powered by Clerk
- Email/password authentication only
- Customizable UI with Clerk branding

### Dashboard (/dashboard)
- Requires authentication
- Welcome message
- Overview of features
- Link to converter

### Converter (/app)
- Public with free tier limit (3 conversions)
- Authenticated users get unlimited access
- Features:
  - Text-to-DOCX conversion
  - File upload
  - Batch conversion
  - PDF export
  - Advanced options (TOC, headers, footers)

## Step 7: Deployment

### Option A: Vercel + External Flask

1. **Deploy Next.js to Vercel:**
   ```bash
   cd nextjs-app
   npm i -g vercel
   vercel
   ```

2. **Deploy Flask to a VPS or Heroku:**
   - Update Dockerfile with production settings
   - Deploy to Coolify, Heroku, or your VPS
   - Update `NEXT_PUBLIC_CONVERTER_URL` env variable

### Option B: Docker Compose (Single Machine)

Create `docker-compose.prod.yml`:

```yaml
version: "3.8"
services:
  nextjs:
    build:
      context: .
      dockerfile: Dockerfile.nextjs
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_CONVERTER_URL: http://flask:5000
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: ${CLERK_PUBLISHABLE_KEY}
      CLERK_SECRET_KEY: ${CLERK_SECRET_KEY}

  flask:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "5000:5000"
    environment:
      ALLOWED_ORIGINS: http://nextjs:3000
      FLASK_ENV: production
```

### Option C: Coolify

1. Connect your Git repository
2. Create app for Next.js (select Next.js)
3. Create service for Flask (select Python/Flask)
4. Configure environment variables for both
5. Deploy

## Step 8: Environment Variables Checklist

**Next.js (.env.local):**
- [ ] NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
- [ ] CLERK_SECRET_KEY
- [ ] NEXT_PUBLIC_CONVERTER_URL

**Flask (backend/.env):**
- [ ] ALLOWED_ORIGINS
- [ ] Optional: CLERK_ENDPOINT, CLERK_AUDIENCE

## Security Considerations

1. **Clerk JWT Tokens:**
   - Optional JWT validation on Flask endpoints
   - Currently not enforced (Flask works without it)
   - Add `@require_auth` decorator to endpoints if needed

2. **Rate Limiting:**
   - Flask has rate limiting enabled by default
   - Configured in `backend/config.py`

3. **CORS:**
   - Configured to allow requests from Next.js frontend only
   - Set `ALLOWED_ORIGINS` env variable appropriately

4. **Free Tier:**
   - Browser fingerprinting is not foolproof
   - Intentional "soft gate" - not a security boundary
   - Users expecting unlimited access should sign up

## Troubleshooting

### "Conversion failed" errors
- Check Flask backend is running
- Check `NEXT_PUBLIC_CONVERTER_URL` points to correct Flask URL
- Check CORS is properly configured
- Check Pandoc is installed and in PATH

### Clerk authentication not working
- Verify Clerk keys in .env.local
- Check Clerk dashboard for correct redirect URLs
- Verify domain is whitelisted in Clerk

### Free tier tracking not working
- Ensure localStorage is enabled in browser
- Check browser dev tools console for errors
- Try incognito/private mode

## File Structure

```
.
├── nextjs-app/                 # Next.js frontend
│   ├── src/
│   │   ├── app/               # Routes
│   │   │   ├── page.tsx       # Landing page
│   │   │   ├── sign-in/
│   │   │   ├── sign-up/
│   │   │   ├── dashboard/
│   │   │   └── app/           # Converter
│   │   ├── components/        # React components
│   │   ├── lib/               # Utilities
│   │   │   ├── fp.ts         # Fingerprinting
│   │   │   └── api-client.ts # API calls
│   │   └── middleware.ts      # Clerk middleware
│   └── .env.local            # Environment variables
│
├── backend/                    # Flask backend
│   ├── app.py               # Main Flask app
│   ├── config.py            # Configuration
│   ├── jwt_utils.py         # JWT validation
│   ├── requirements.txt      # Python dependencies
│   └── .env                 # Environment variables
│
└── SAAS_SETUP.md           # This file
```

## Next Steps

1. Configure Clerk
2. Update environment variables
3. Run locally to test
4. Deploy to production
5. Monitor for errors and feedback

## Support

For issues or questions:
- Clerk docs: https://clerk.com/docs
- Next.js docs: https://nextjs.org/docs
- Flask docs: https://flask.palletsprojects.com

## Future Enhancements

- Add Stripe for paid tiers
- Implement conversion history/storage
- Multi-language support
- Custom templates/styling
- Team/organization features
- API access for external users
