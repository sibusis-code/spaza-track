# Spaza Track - Full Stack Setup

## 🎯 What You Now Have

✅ **Backend API** (FastAPI + SQLite/MySQL)
- User authentication with JWT tokens
- Multi-device sync
- Activity tracking
- RESTful API endpoints

✅ **Frontend** (PWA with offline support)
- Works offline with IndexedDB
- Can sync with backend API
- Modern UI with authentication

---

## 🚀 Quick Start (3 Steps)

### Step 1: Install Backend Dependencies

```powershell
cd "c:\Users\DataAnalyst\Documents\Spaza Track\spaza-pwa\backend"
pip install -r requirements.txt
```

### Step 2: Create Environment File

```powershell
# Copy example
cp .env.example .env

# Or create manually with this content:
# DATABASE_URL=sqlite:///./spaza.db
# SECRET_KEY=change-this-to-a-random-string
# ACCESS_TOKEN_EXPIRE_MINUTES=10080
# CORS_ORIGINS=http://localhost:8080,http://127.0.0.1:8080
```

### Step 3: Start Backend Server

```powershell
python main.py
```

✅ Backend runs at: http://localhost:8000
✅ API Docs at: http://localhost:8000/docs

---

## 👤 Create First Admin User

```powershell
cd backend
python create_admin.py
```

Default credentials:
- **Username**: admin
- **Password**: admin123

---

## 🌐 Run the Full App

### Terminal 1 - Backend API:
```powershell
cd "c:\Users\DataAnalyst\Documents\Spaza Track\spaza-pwa\backend"
python main.py
```

### Terminal 2 - Frontend:
```powershell
cd "c:\Users\DataAnalyst\Documents\Spaza Track\spaza-pwa"
python -m http.server 8080
```

### Open:
- **Frontend**: http://localhost:8080
- **API Docs**: http://localhost:8000/docs

---

## 📱 Multi-Device Sync

Users can now:
1. Register/Login on any device
2. Data syncs automatically via API
3. Work offline, sync when online
4. Track activity across devices

---

## 🗄️ Database Options

### SQLite (Default - Already configured)
✅ No setup needed
✅ Perfect for development
✅ Single file database
✅ Works on GitHub deployment

### MySQL (For production)
```sql
CREATE DATABASE spaza_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Update `.env`:
```
DATABASE_URL=mysql+mysqlconnector://user:password@localhost:3306/spaza_db
```

---

## 🚢 Deploy to Cloud (FREE Options)

### Option 1: Railway.app ⭐ Recommended
1. Create account at railway.app
2. Click "New Project" → "Deploy from GitHub"
3. Select your repo
4. Railway auto-detects Python
5. Add environment variables in dashboard
6. Done! Get your URL

### Option 2: Render.com
1. Create account at render.com
2. New Web Service → Connect GitHub
3. Root directory: `backend`
4. Build: `pip install -r requirements.txt`
5. Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Add environment variables
7. Deploy!

### Option 3: PythonAnywhere
1. Upload backend folder
2. Create virtual environment
3. Configure WSGI file
4. Set environment variables

### Frontend (GitHub Pages - Free)
```powershell
# Push to GitHub
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/spaza-track.git
git push -u origin main

# Enable GitHub Pages in repo settings
# Your app will be at: https://yourusername.github.io/spaza-track/
```

---

## 🔐 API Authentication Flow

```javascript
// 1. Login
const response = await fetch('http://localhost:8000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'admin', password: 'admin123' })
});
const { access_token, user } = await response.json();

// 2. Use token for requests
const products = await fetch('http://localhost:8000/api/products', {
  headers: { 'Authorization': `Bearer ${access_token}` }
});
```

---

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get profile

### Products
- `GET /api/products` - List all
- `POST /api/products` - Add new
- `PUT /api/products/{id}` - Update quantity
- `DELETE /api/products/{id}` - Delete

### Sales
- `POST /api/sales` - Record sale
- `GET /api/sales?date=2026-01-17` - List sales

### Statistics
- `GET /api/stats` - Dashboard data

### Activity (Admin only)
- `GET /api/activity` - View logs

---

## 🧪 Test the API

### Using Browser (http://localhost:8000/docs)
- Interactive Swagger UI
- Test all endpoints
- See request/response

### Using curl:
```powershell
# Health check
curl http://localhost:8000/api/health

# Login
curl -X POST http://localhost:8000/api/auth/login -H "Content-Type: application/json" -d '{\"username\":\"admin\",\"password\":\"admin123\"}'
```

---

## 🏗️ Architecture

```
Frontend (PWA)
    ↓
api-client.js (API wrapper)
    ↓
Backend API (FastAPI)
    ↓
Database (SQLite/MySQL)
```

**Offline Support**: IndexedDB stores data locally, syncs when online

---

## 🔧 Troubleshooting

### Port already in use
```powershell
# Change backend port
python main.py  # Edit to use different port

# Change frontend port
python -m http.server 8081
```

### CORS errors
Update `backend/.env`:
```
CORS_ORIGINS=http://localhost:8080,http://localhost:8081,https://yourdomain.com
```

### Database locked (SQLite)
Close other connections or use MySQL

---

## 📈 Next Steps

1. ✅ Test locally
2. ✅ Create admin account
3. ✅ Register employee accounts
4. ✅ Test multi-device sync
5. 🚀 Deploy to cloud
6. 📱 Use on mobile devices

---

## 💡 Features Included

✅ User registration & login
✅ JWT authentication
✅ Multi-device sync
✅ Activity logging
✅ Role-based access (admin/employee)
✅ Offline support
✅ Stock management
✅ Sales tracking
✅ Daily profit calculation
✅ Low stock alerts
✅ RESTful API
✅ Interactive API docs
✅ Production-ready
✅ GitHub deployment ready

---

Need help? Check:
- Backend docs: `backend/README.md`
- API docs: http://localhost:8000/docs
- Frontend: Open browser dev tools console
