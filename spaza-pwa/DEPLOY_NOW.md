# 🚀 DEPLOYMENT CHECKLIST - Do This Now!

## Your GitHub Repository
**URL**: https://github.com/sibusis-code/spaza-track

Code is already pushed ✅

---

## STEP 1: Deploy Backend to Railway (5 minutes)

### Go to Railway.app and Deploy

1. **Visit**: https://railway.app
2. **Sign up** with GitHub (sibusis-code)
3. **Click**: "New Project"
4. **Select**: "Deploy from GitHub repo"
5. **Choose**: `sibusis-code/spaza-track`
6. **Click**: "Deploy"

Railway will auto-detect Python and start building!

### Wait for Build to Complete
- Should take 2-3 minutes
- Check "Deployments" tab
- ✅ When green, it's live!

### Configure Environment Variables

1. In Railway dashboard, go to your project
2. Click the **service** that was created
3. Go to **"Variables"** tab
4. **Add these variables**:

```
DATABASE_URL=sqlite:///./spaza.db
SECRET_KEY=spaza-prod-2026-super-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
CORS_ORIGINS=https://sibusis-code.github.io/spaza-track,http://localhost:8080
```

5. Click "Update variables"
6. Redeploy (click "Redeploy latest")

### Create Admin User

1. In Railway, click your service
2. Click **"Deployments"** tab
3. Click the running deployment
4. Click **"Terminal"**
5. Run:
```bash
python backend/create_admin.py
```

You should see: ✅ Admin user created!

### Get Your Backend URL

1. In Railway, click your service
2. Look for **"Domains"** section
3. Copy the Railway URL

**It looks like**: `https://spaza-track-prod-abc123.railway.app`

---

## STEP 2: Update Frontend API URL

1. Open your project in VS Code
2. Find file: `api-client.js`
3. Find this line (around line 2):
```javascript
const API_BASE_URL = 'http://localhost:8000/api';
```

4. Replace with your Railway URL:
```javascript
const API_BASE_URL = 'https://spaza-track-prod-abc123.railway.app/api';
```

5. Save the file
6. Commit and push:
```powershell
git add api-client.js
git commit -m "Update API URL to production Railway URL"
git push origin master
```

---

## STEP 3: Enable GitHub Pages for Frontend

1. Go to your GitHub repo: https://github.com/sibusis-code/spaza-track
2. Click **Settings** (top right)
3. Click **"Pages"** (left sidebar)
4. **Source**: Select "Deploy from a branch"
5. **Branch**: Select `master`
6. **Folder**: Select `/ (root)`
7. Click **Save**

Wait 2-3 minutes...

Your frontend will be at:
**https://sibusis-code.github.io/spaza-track/**

---

## STEP 4: Update CORS in Backend

1. Go back to Railway dashboard
2. Click your service
3. Go to **"Variables"**
4. Find `CORS_ORIGINS`
5. Update it to include your GitHub Pages URL:
```
CORS_ORIGINS=https://sibusis-code.github.io/spaza-track,http://localhost:8080
```

6. Click "Update variables" → "Redeploy"

---

## STEP 5: Test Everything!

### Test Backend API

Open in browser:
```
https://spaza-track-prod-abc123.railway.app/api/health
```

Should return:
```json
{"status":"ok","timestamp":"2026-01-22T..."}
```

### Test API Documentation

Open in browser:
```
https://spaza-track-prod-abc123.railway.app/docs
```

You should see Swagger UI with all endpoints!

### Test Frontend

Open in browser:
```
https://sibusis-code.github.io/spaza-track/login.html
```

**Try to login** with:
- Username: `admin`
- Password: `admin123`

**It should work!** ✅

---

## ✅ Checklist

- [ ] GitHub repo created (sibusis-code/spaza-track)
- [ ] Railway account created
- [ ] Backend deployed to Railway
- [ ] Environment variables added
- [ ] Admin user created
- [ ] API URL copied
- [ ] `api-client.js` updated with prod URL
- [ ] Changes pushed to GitHub
- [ ] GitHub Pages enabled
- [ ] CORS updated
- [ ] Backend tested (health check)
- [ ] API docs tested (/docs)
- [ ] Frontend login page loads
- [ ] Can login with admin/admin123

---

## 🎉 YOUR LIVE URLS

**Backend API**:
```
https://spaza-track-prod-abc123.railway.app/api
```
(Replace `abc123` with your actual Railway URL)

**Frontend**:
```
https://sibusis-code.github.io/spaza-track/
```

**API Documentation**:
```
https://spaza-track-prod-abc123.railway.app/docs
```

**Login Page**:
```
https://sibusis-code.github.io/spaza-track/login.html
```

---

## 🗄️ Database Location

**SQLite database** (`spaza.db`):
- **Stored**: On the Railway server filesystem
- **Backed up**: Daily by Railway
- **Location**: `/app/backend/spaza.db`
- **Size limit**: 500MB (can handle 100,000+ records)
- **Cost**: FREE (included in Railway)

**How it works**:
1. User logs in on GitHub Pages (frontend)
2. Frontend sends login to Railway backend API
3. Backend validates against SQLite database
4. Backend returns JWT token
5. Frontend stores token, uses for all future requests
6. All data flows through Railway backend
7. SQLite stores everything safely

---

## 📊 What's Deployed Where

```
Your Device
    ↓
GitHub Pages
    https://sibusis-code.github.io/spaza-track/
    (Frontend: HTML, CSS, JS)
    ↓ (Makes API calls)
    ↓
Railway.app
    https://spaza-track-prod-abc123.railway.app/api
    (Backend: FastAPI + SQLite Database)
    ↓
    Database: spaza.db (SQLite file on Railway server)
```

---

## 🆘 Troubleshooting

### API not responding?
- Check Railway dashboard - deployment status
- Check "Deployments" → "Logs"
- Look for errors

### Can't login?
- Check admin user was created
- Check `api-client.js` has correct URL
- Check browser console for errors (F12)
- Check CORS settings in Railway

### GitHub Pages showing old version?
- Hard refresh: `Ctrl+Shift+R`
- Clear browser cache
- May take 2-3 min to deploy

### Database not found?
- In Railway terminal:
  ```
  python backend/create_admin.py
  ```
- Check DATABASE_URL in variables

---

## 🔄 After Deployment

Now you can:
1. ✅ Login from anywhere
2. ✅ Multiple users with different devices
3. ✅ Share login with team
4. ✅ Track user activity
5. ✅ Use mobile phone (just visit the URL)
6. ✅ Works on WiFi or mobile data

---

## 📈 Monitor Your App

**Railway Dashboard**: https://railway.app
- View logs
- Check CPU/memory
- See deployments
- Update variables
- Redeploy anytime

**API Logs**: `https://your-railway-url/docs` → `/api/activity`
- See all user actions
- Track logins
- Track sales

---

## 💰 Cost

| Item | Cost | Notes |
|------|------|-------|
| Railway Backend | FREE | Includes SQLite |
| GitHub Pages | FREE | Always |
| Custom Domain | $10/yr | Optional |
| **TOTAL** | **FREE** | 🎉 |

---

## Next Steps After Deployment

1. **Test with another user**
   - Register new employee account
   - Login on different device
   - See data sync

2. **Try the app**
   - Add products
   - Record sales
   - Check activity logs

3. **Share with team**
   - Give them the login URL
   - Share credentials
   - They can use from phone!

4. **Monitor**
   - Check Railway logs
   - View activity logs in app
   - Track usage

---

**Questions?** Check the full guide: `DEPLOYMENT_GUIDE.md`

**Ready?** Start with Step 1! 🚀
