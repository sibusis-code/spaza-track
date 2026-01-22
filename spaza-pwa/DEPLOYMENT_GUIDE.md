# 🚀 Deployment Guide - Railway.app (FREE)

## Database Location 🗄️

**SQLite** (Current - What you're using):
- Database file: `spaza.db` 
- Runs ON the backend server (Railway)
- Data stored: In the production server
- Cost: FREE
- Best for: Small-medium shops (up to 10,000 records)

**If you want MySQL** (Optional - separate database):
- Cost: $5-15/month extra
- Database runs: Separate MySQL server
- More scalable
- Can backup independently

**For now**: We'll keep SQLite - works great!

---

## Step 1: Push Code to GitHub

### 1.1 Initialize Git (if not done)

```powershell
cd "C:\Users\DataAnalyst\Documents\Spaza Track\spaza-pwa"

# Initialize git
git init
git config user.name "Your Name"
git config user.email "your@email.com"
```

### 1.2 Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `spaza-track`
3. Description: `Offline-first PWA for spaza shop sales tracking`
4. Make it **PUBLIC** (free GitHub Pages)
5. Click "Create repository"

### 1.3 Push Code to GitHub

```powershell
cd "C:\Users\DataAnalyst\Documents\Spaza Track\spaza-pwa"

# Add all files
git add .

# Commit
git commit -m "Initial commit: Spaza Track with FastAPI backend"

# Add remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/spaza-track.git

# Push to main branch
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy Backend to Railway.app

### 2.1 Create Railway Account

1. Go to https://railway.app
2. Click "Login with GitHub"
3. Authorize Railway
4. Done!

### 2.2 Create New Project

1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Select `spaza-track` repository
4. Click "Deploy"

Railway will auto-detect Python! ✅

### 2.3 Configure Environment

1. In Railway dashboard, click your project
2. Go to "Variables"
3. Add these environment variables:

```
DATABASE_URL=sqlite:///./spaza.db
SECRET_KEY=your-super-secret-key-generate-random
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
CORS_ORIGINS=http://localhost:8080,https://YOUR_USERNAME.github.io/spaza-track,https://your-railway-url.railway.app
```

### 2.4 Configure Root Directory

1. In Railway, click your service
2. Go to "Settings" → "Variables"
3. Add:
   ```
   RAILWAY_ROOT_DIRECTORY=backend
   ```

Wait for Railway to build and deploy (~2-3 minutes).

**Your API will be at**: `https://spaza-track-api-production-xxxx.railway.app`

---

## Step 3: Deploy Frontend to GitHub Pages

### 3.1 Enable GitHub Pages

1. Go to your repo: https://github.com/YOUR_USERNAME/spaza-track
2. Go to Settings → Pages
3. Source: Deploy from branch
4. Branch: main
5. Folder: / (root)
6. Save

**Your frontend will be at**: `https://YOUR_USERNAME.github.io/spaza-track/`

### 3.2 Update API URL in Frontend

1. Go back to your project locally
2. Edit `api-client.js`:

```javascript
// Change this line:
const API_BASE_URL = 'http://localhost:8000/api';

// To your Railway URL:
const API_BASE_URL = 'https://spaza-track-api-production-xxxx.railway.app/api';
```

3. Commit and push:
```powershell
git add api-client.js
git commit -m "Update API URL for production"
git push
```

GitHub Pages will auto-update!

---

## Step 4: Create Admin User on Production

### Option A: Using Railway Terminal

1. In Railway dashboard, click your project
2. Click "Command" → "New"
3. Run:
   ```
   python backend/create_admin.py
   ```

### Option B: Using API

```powershell
# Register first user as admin
$api = "https://spaza-track-api-production-xxxx.railway.app/api"

curl -X POST "$api/auth/register" `
  -H "Content-Type: application/json" `
  -d '{
    "username": "admin",
    "email": "admin@spaza.local",
    "password": "YourSecurePassword123",
    "full_name": "Admin User",
    "role": "admin"
  }'
```

---

## Step 5: Test Production

### Test Backend API

```powershell
# Check if running
curl https://spaza-track-api-production-xxxx.railway.app/api/health

# Should return:
# {"status":"ok","timestamp":"2026-01-22T..."}
```

### Test Frontend

Open in browser:
```
https://YOUR_USERNAME.github.io/spaza-track/login.html
```

Login with your admin credentials!

---

## What's Running Where

```
┌─────────────────────────────────────────────────────┐
│                    The Internet                      │
└───────────────┬───────────────────────┬──────────────┘
                │                       │
        ┌───────▼────────┐      ┌──────▼────────┐
        │                │      │                │
        │  Railway.app   │      │ GitHub Pages   │
        │   (Backend)    │      │   (Frontend)   │
        │                │      │                │
        │ ┌────────────┐ │      │ ┌────────────┐│
        │ │ FastAPI    │ │      │ │ HTML/JS    ││
        │ │ Server     │ │      │ │ (PWA)      ││
        │ └────────────┘ │      │ └────────────┘│
        │ ┌────────────┐ │      │                │
        │ │ SQLite DB  │ │      │ (Offline)      │
        │ │ spaza.db   │ │      │ IndexedDB      │
        │ └────────────┘ │      │                │
        │                │      │                │
        └────────────────┘      └────────────────┘
              │                        │
              │     User Login         │
              │◄──────────────────────►│
              │     Data Sync          │
```

---

## Database Details

### SQLite Storage
- **Location**: `backend/spaza.db` on Railway server
- **Size**: Can handle ~10,000 products easily
- **Backup**: Railway auto-backs up every day
- **Access**: Only through API (secure)

### What's Stored
- Users (encrypted passwords)
- Products
- Sales
- Activity logs

### How It Works
1. User logs in → Token created
2. Frontend makes API call with token
3. Backend fetches from SQLite
4. Returns JSON response
5. Frontend displays data

---

## Environment Variables Explained

```
DATABASE_URL              # Where database lives (SQLite file)
SECRET_KEY               # Used to sign JWT tokens (keep secret!)
ALGORITHM                # HS256 = HMAC with SHA-256
ACCESS_TOKEN_EXPIRE_MINUTES # 7 days = 10080 minutes
CORS_ORIGINS             # Where frontend can be (security)
```

---

## Cost Breakdown

| Service | Cost | Why |
|---------|------|-----|
| Railway Backend | $0-5 | Free tier, then $0.50/GB |
| GitHub Pages Frontend | $0 | Always free for public repos |
| Domain (optional) | $10/year | namecheap.com, domains.google |
| **Total** | **$0-15/year** | Amazing value! |

---

## Quick Checklist

- [ ] Create GitHub account
- [ ] Create GitHub repository
- [ ] Push code to GitHub
- [ ] Create Railway account
- [ ] Deploy backend to Railway
- [ ] Set environment variables
- [ ] Create admin user
- [ ] Update API URL in frontend
- [ ] Enable GitHub Pages
- [ ] Test login at production URL
- [ ] Share with team!

---

## Troubleshooting

### Can't push to GitHub?

```powershell
# Generate SSH key
ssh-keygen -t ed25519

# Add to GitHub: Settings → SSH Keys → New SSH Key
cat ~/.ssh/id_ed25519.pub
```

### Railway build failing?

1. Check "Deploy" tab for logs
2. Make sure `.env` has DATABASE_URL
3. Check Python version (3.11+)

### API URL not updating on GitHub Pages?

1. Make sure you updated `api-client.js`
2. Commit and push
3. Wait 2-3 minutes for GitHub Pages to rebuild
4. Hard refresh browser (Ctrl+Shift+R)

### SQLite database growing too large?

For now: Keep using it!
Later: Switch to MySQL for better performance.

---

## Next: Automatic Deployments

After your first deployment:
- Every time you push to GitHub → Railway auto-deploys
- No manual steps needed!
- Same for GitHub Pages (updates instantly)

---

## Your Production URLs

**Backend API**:
```
https://spaza-track-api-production-xxxx.railway.app/api
```

**Frontend**:
```
https://YOUR_USERNAME.github.io/spaza-track/
```

**API Documentation**:
```
https://spaza-track-api-production-xxxx.railway.app/docs
```

---

## Monitoring & Logs

### Railway Logs
1. Dashboard → Your Project → "Logs" tab
2. See all backend activity in real-time
3. Errors show up here

### Activity Logs (In-App)
As admin, view user activity at:
```
https://spaza-track-api-production-xxxx.railway.app/docs
→ GET /api/activity
```

---

## Scale as You Grow

If you need more power later:
- Railway: Upgrade from free tier ($5+/month)
- MySQL Database: Add Railway MySQL service
- Custom Domain: Point to Railway
- CloudFlare: Cache static assets (free)

For now: SQLite is perfect! ✅

---

**Ready?** Jump to Step 1: Push to GitHub!
