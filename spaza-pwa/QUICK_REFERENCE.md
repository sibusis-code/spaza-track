# ⚡ QUICK REFERENCE - Deployment & Database

## 🎯 YOUR DEPLOYMENT PATH

```
┌─ STEP 1: Go to Railway.app ──┐
│ Deploy backend (2 min)       │
│ Create admin user (1 min)    │
└──────────────┬────────────────┘
               ↓
┌─ STEP 2: Get Railway URL ────┐
│ Copy: https://spaza-track-   │
│       prod-xxx.railway.app   │
└──────────────┬────────────────┘
               ↓
┌─ STEP 3: Update API URL ─────┐
│ Edit: api-client.js          │
│ Push to GitHub (1 min)       │
└──────────────┬────────────────┘
               ↓
┌─ STEP 4: Enable GitHub Pages─┐
│ Settings → Pages             │
│ Deploy from branch: master   │
└──────────────┬────────────────┘
               ↓
┌─ STEP 5: Update CORS ────────┐
│ Railway dashboard            │
│ Redeploy (1 min)             │
└──────────────┬────────────────┘
               ↓
           ✅ DONE!
```

---

## 🗄️ DATABASE LOCATION ANSWERED

### Where is your database?
**On Railway.app server** in the cloud

### What database?
**SQLite** (`spaza.db` file)

### What's stored there?
```
✅ User accounts (encrypted passwords)
✅ Product inventory  
✅ Sales transactions
✅ Activity logs (who did what when)
```

### Is it backed up?
**YES** - Railway backs up daily automatically ✅

### Can you access it?
- **Direct access**: NO (only through API)
- **API access**: YES (if authenticated)
- **Admin view**: YES (at /api/activity)

### Cost?
**FREE** - Included in Railway

### Size limit?
**500MB** = Can store 100,000+ records

---

## 📍 YOUR THREE LIVE URLS (After Deployment)

### 1️⃣ Frontend
```
https://sibusis-code.github.io/spaza-track/

What it is: Your user-facing app
Where it runs: GitHub Pages (CDN)
Cost: FREE
Users see: Login page, product list, sales form
```

### 2️⃣ Backend API
```
https://spaza-track-prod-xxx.railway.app/api

What it is: Your backend server
Where it runs: Railway.app
Cost: FREE (initial), $5+/month if you scale
Powers: Authentication, database queries, calculations
```

### 3️⃣ API Documentation
```
https://spaza-track-prod-xxx.railway.app/docs

What it is: Interactive API explorer
Where it runs: Railway.app
Cost: FREE
Use for: Testing endpoints, understanding API
```

---

## 🔐 SECURITY CHECK

### Passwords
✅ Hashed with bcrypt (not plain text)
✅ Never sent to frontend
✅ Never stored anywhere except database

### API Tokens
✅ JWT tokens expire after 7 days
✅ Signed with secret key
✅ Required for every request (except login/register)

### Database
✅ Only accessible through API
✅ Only through authenticated users
✅ Activity logged for admin review

### HTTPS
✅ All connections encrypted
✅ GitHub Pages: HTTPS automatic
✅ Railway: HTTPS automatic

---

## 🚀 DEPLOYMENT TIMELINE

| Task | Time | Status |
|------|------|--------|
| Code ready | ✅ | Done |
| GitHub repo | ✅ | Done (sibusis-code/spaza-track) |
| Deployment guide | ✅ | Ready (DEPLOY_NOW.md) |
| Create Railway account | ⏳ | YOU DO THIS (5 min) |
| Deploy backend | ⏳ | YOU DO THIS (3 min) |
| Set environment vars | ⏳ | YOU DO THIS (2 min) |
| Create admin user | ⏳ | YOU DO THIS (1 min) |
| Update API URL | ⏳ | YOU DO THIS (2 min) |
| Enable GitHub Pages | ⏳ | YOU DO THIS (1 min) |
| Test login | ⏳ | YOU DO THIS (2 min) |
| **TOTAL TIME** | | **~20 minutes** |

---

## 📋 BEFORE YOU START

Have these ready:

```
☑️ GitHub repo access
   https://github.com/sibusis-code/spaza-track

☑️ GitHub login credentials
   (for Railway to connect)

☑️ Email address
   (for Railway account)

☑️ 20 minutes of free time
   (first deployment only)

☑️ Copy of this doc
   (keep DEPLOY_NOW.md handy)
```

---

## 🔧 DEPLOYMENT COMMANDS

### After Railway deploys, run in Railway Terminal:

```bash
# Create admin user
python backend/create_admin.py

# Check database exists
ls -la backend/spaza.db

# Test API from inside Railway
curl http://localhost:8000/api/health
```

### Update frontend (do locally, then git push):

```powershell
# Update API URL in api-client.js
# Then:
git add api-client.js
git commit -m "Update production API URL"
git push origin master
```

---

## 📊 WHAT HAPPENS AFTER DEPLOYMENT

### First User Login
1. User opens: `https://sibusis-code.github.io/spaza-track/login.html`
2. Enters: admin / admin123
3. Frontend sends to: `https://spaza-track-prod-xxx.railway.app/api/auth/login`
4. Backend queries: SQLite database
5. Returns: JWT token
6. Frontend stores: In localStorage
7. User logged in ✅

### Data Flow
1. User adds product on Phone
2. Frontend → API → SQLite (writes)
3. User refreshes on Desktop
4. Frontend → API → SQLite (reads)
5. Same product appears ✅

### Activity Tracking
1. Every login recorded
2. Every product added tracked
3. Every sale logged
4. Employee email + timestamp
5. Admins can review all activity

---

## 💡 PRO TIPS

### Tip 1: Keep Your Secret Key Safe
```
In .env file, never share:
SECRET_KEY=spaza-secret-key-xxx

If compromised:
→ Old tokens become invalid
→ Update in Railway
→ Redeploy
```

### Tip 2: Monitor Database Growth
```
SQLite can handle:
- 1000s of products ✅
- 10000s of sales ✅
- 100s of users ✅
- Millions of log entries ✅

Watch for growth, upgrade to MySQL if needed.
```

### Tip 3: Regular Backups
```
Railway auto-backs up daily ✅

To manually backup:
1. Go to Railway dashboard
2. Click terminal
3. Run: cp backend/spaza.db spaza-backup.db
4. Download file
```

### Tip 4: Redeploy Anytime
```
If something breaks:
1. Fix code locally
2. Git push
3. Railway auto-redeploys
4. Takes ~2 minutes
```

---

## 🆘 IF SOMETHING GOES WRONG

### Backend not responding?
```
1. Check Railway dashboard
2. Look at "Deployments" tab
3. Check "Logs"
4. Redeploy if needed
```

### Login fails?
```
1. Check: Is admin user created?
2. Check: API URL correct in api-client.js?
3. Check: Browser console (F12) for errors?
4. Try: Hard refresh (Ctrl+Shift+R)
```

### Can't see products?
```
1. Check: Are you logged in?
2. Check: Add a product first
3. Check: Database has data?
4. Try: Railway terminal → python backend/create_admin.py
```

### CORS error?
```
Update in Railway dashboard:
CORS_ORIGINS=https://sibusis-code.github.io/spaza-track,http://localhost:8080
Then redeploy.
```

---

## 🎓 AFTER DEPLOYMENT

### What Users Can Do
✅ Register from any device
✅ Login with same credentials
✅ See same data everywhere
✅ Record sales on phone
✅ View reports on desktop
✅ Sync happens automatically

### What Admins Can Do
✅ Everything users can do
✅ Create other user accounts
✅ View activity logs
✅ See who did what when
✅ Track sales per employee

### What Happens Next
1. **Week 1**: Test with team
2. **Week 2**: Use in production
3. **Week 3**: Collect feedback
4. **Week 4**: Plan improvements

---

## 📞 QUICK HELP

| Problem | Solution | Time |
|---------|----------|------|
| Forgot admin password | Create new admin (reset) | 2 min |
| Database too big | Upgrade to MySQL | 15 min |
| Need more storage | Railway paid tier | 5 min |
| API too slow | Add Redis cache | 10 min |
| Want custom domain | Buy domain, point to Railway | 20 min |

---

## 🎉 SUCCESS INDICATORS

You'll know it's working when:

✅ Frontend loads at GitHub Pages URL
✅ Can login with admin/admin123
✅ Can add products
✅ Can record sales
✅ Data appears on second device
✅ Activity logs show user actions
✅ API docs page loads
✅ No console errors (F12)

---

## 📚 DOCUMENTATION FILES

In your GitHub repo:

| File | Read When |
|------|-----------|
| DEPLOY_NOW.md | Step-by-step deployment |
| DEPLOYMENT_GUIDE.md | Detailed deployment info |
| ARCHITECTURE.md | How everything works |
| DATABASE_SETUP_COMPLETE.md | Database features |
| backend/README.md | Backend API details |

---

## 🏁 READY?

1. Open: `DEPLOY_NOW.md`
2. Follow steps 1-5
3. Test: Open https://sibusis-code.github.io/spaza-track/login.html
4. Login with: admin / admin123
5. Done! 🎉

**Questions?** Check the docs above.

**Let's go!** 🚀
