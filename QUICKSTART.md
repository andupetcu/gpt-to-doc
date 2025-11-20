# Quick Start Guide

This guide will get you up and running with the Markdown-to-DOCX SaaS application in 5 minutes.

## What You're Getting

A full-stack SaaS application with:
- ✅ Next.js 14 frontend with Shadcn UI
- ✅ Clerk authentication (email/password)
- ✅ Flask backend for document conversion
- ✅ Free tier with 3 conversions
- ✅ Unlimited access for signed-up users

## Prerequisites

```bash
# Check these are installed
node --version      # Should be 18+
python3 --version   # Should be 3.9+
pandoc --version    # Should be installed
```

If Pandoc is not installed:
- **macOS:** `brew install pandoc`
- **Linux:** `sudo apt-get install pandoc`
- **Windows:** Download from https://pandoc.org/installing.html

## 1. Create Clerk Account (5 minutes)

1. Go to https://clerk.com and sign up
2. Create a new application
3. Copy your **Publishable Key** and **Secret Key**
4. In dashboard settings, configure redirect URLs

## 2. Configure Environment Variables

### Next.js Frontend:

```bash
cd nextjs-app
cat > .env.local << 'EOF'
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_YOUR_KEY_HERE
CLERK_SECRET_KEY=sk_live_YOUR_KEY_HERE
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
NEXT_PUBLIC_CONVERTER_URL=http://localhost:5000
EOF
```

### Flask Backend:

```bash
cd backend
cp .env.example .env
# Edit .env if needed (defaults work for local dev)
```

## 3. Install Dependencies

### Frontend:
```bash
cd nextjs-app
npm install
```

### Backend:
```bash
cd backend
pip install -r requirements.txt
```

## 4. Run the Application

**Terminal 1 - Flask Backend:**
```bash
cd backend
python app.py
# Should output: "Running on http://127.0.0.1:5000"
```

**Terminal 2 - Next.js Frontend:**
```bash
cd nextjs-app
npm run dev
# Should output: "Ready in 1234ms"
```

## 5. Test It Out

1. Open http://localhost:3000
2. You'll see the landing page
3. Click "Try Now (3 Free Conversions)"
4. Paste some markdown in the text area
5. Click "Convert to DOCX"
6. File downloads!

## Testing the Full Flow

### Test Free Tier (3 conversions):
1. Make 3 conversions without signing in
2. 4th conversion shows "Unlock Unlimited Conversions" prompt
3. Click "Sign Up Free"

### Test Sign Up:
1. Create account with email
2. Verify email (check inbox)
3. Redirects to dashboard
4. Click "Go to Converter"
5. Convert unlimited documents

### Test Sign In:
1. Sign out (click avatar → Sign out)
2. Click "Sign In"
3. Log back in with same email
4. Redirects to dashboard

## Project Structure

```
markdown-to-docx/
├── nextjs-app/              # Next.js 14 SaaS frontend
│   ├── src/app/
│   │   ├── page.tsx        # Landing page
│   │   ├── app/page.tsx    # Converter page
│   │   ├── sign-in/
│   │   ├── sign-up/
│   │   └── dashboard/
│   └── .env.local          # Your Clerk keys go here
│
├── backend/                 # Flask API backend
│   ├── app.py             # Main application
│   ├── requirements.txt    # Python deps
│   └── .env               # Configuration
│
├── SAAS_SETUP.md          # Detailed setup guide
└── QUICKSTART.md          # This file
```

## Deploying to Production

### Option 1: Vercel (Recommended)

```bash
# Deploy Next.js to Vercel
cd nextjs-app
npm i -g vercel
vercel

# Deploy Flask separately (Heroku, Railway, etc)
# Update NEXT_PUBLIC_CONVERTER_URL to your Flask URL
```

### Option 2: Docker

```bash
docker-compose up --build
```

### Option 3: Coolify

Push to Git, connect in Coolify dashboard.

## Common Issues & Fixes

### "Conversion failed" error
```
❌ Flask backend not running
✅ Check Terminal 1: `python app.py` is running on :5000

❌ NEXT_PUBLIC_CONVERTER_URL is wrong
✅ Verify it matches Flask address

❌ Pandoc not installed
✅ Run: brew install pandoc (or apt-get on Linux)
```

### Clerk not working
```
❌ Wrong API keys
✅ Copy keys again from Clerk dashboard

❌ Redirect URLs not configured
✅ Set them in Clerk dashboard to http://localhost:3000
```

### "Free conversions" not tracking
```
❌ localStorage disabled
✅ Check browser privacy settings

❌ Incognito/Private mode clears localStorage
✅ Use regular browsing mode to test
```

## Next Steps

1. **Customize branding:** Update app name, colors in `nextjs-app/src/app/page.tsx`
2. **Add more features:** Check `SAAS_SETUP.md` for architecture details
3. **Deploy:** Follow deployment section above
4. **Monitor:** Set up error tracking (Sentry, etc)

## Useful Links

- Clerk docs: https://clerk.com/docs
- Next.js docs: https://nextjs.org/docs
- Shadcn components: https://ui.shadcn.com
- Pandoc docs: https://pandoc.org

## Support

For detailed setup instructions, see `SAAS_SETUP.md`.

Happy converting! 🚀
