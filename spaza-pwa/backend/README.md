# Spaza Track Backend API

FastAPI backend with user authentication, multi-device sync, and activity tracking.

## Features

- ✅ User authentication (JWT tokens)
- ✅ Multi-device sync
- ✅ Activity logging
- ✅ SQLite (default) or MySQL support
- ✅ RESTful API
- ✅ Role-based access (admin, manager, employee)

## Quick Start

### 1. Install Dependencies

```powershell
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment

```powershell
# Copy example env file
cp .env.example .env

# Edit .env with your settings (optional - defaults work fine)
```

### 3. Run the Server

```powershell
python main.py
```

Server runs at http://localhost:8000

API docs available at http://localhost:8000/docs

## Database Options

### SQLite (Default - No setup needed)
Already configured in `.env.example`. Perfect for development and GitHub hosting.

### MySQL (Production)
1. Install MySQL
2. Create database:
   ```sql
   CREATE DATABASE spaza_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. Update `.env`:
   ```
   DATABASE_URL=mysql+mysqlconnector://user:password@localhost:3306/spaza_db
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login (returns JWT token)
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products` - List all products
- `POST /api/products` - Create product
- `PUT /api/products/{id}` - Update product quantity
- `DELETE /api/products/{id}` - Delete product

### Sales
- `POST /api/sales` - Record sale
- `GET /api/sales?date=YYYY-MM-DD` - List sales (optional date filter)

### Statistics
- `GET /api/stats` - Dashboard statistics

### Activity Logs (Admin only)
- `GET /api/activity?limit=50` - View activity logs

## Usage Example

```javascript
// Register/Login
const response = await fetch('http://localhost:8000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'admin', password: 'admin123' })
});
const { access_token } = await response.json();

// Use token for authenticated requests
const products = await fetch('http://localhost:8000/api/products', {
  headers: { 'Authorization': `Bearer ${access_token}` }
});
```

## First Admin User

Create via API or Python:

```python
# Run this in Python shell
from database import SessionLocal, init_db
from models import User
from auth import get_password_hash

init_db()
db = SessionLocal()

admin = User(
    username="admin",
    email="admin@spaza.shop",
    full_name="Admin User",
    hashed_password=get_password_hash("admin123"),
    role="admin"
)
db.add(admin)
db.commit()
```

## GitHub Deployment

### Option 1: Railway.app (Recommended)
1. Push code to GitHub
2. Connect Railway to your repo
3. Add environment variables
4. Deploy automatically

### Option 2: Render.com
1. Connect GitHub repo
2. Select `backend` folder
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Option 3: PythonAnywhere
1. Upload files
2. Configure WSGI
3. Set environment variables

## Development

```powershell
# Install dev dependencies
pip install -r requirements.txt

# Run with auto-reload
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Testing

```powershell
# Test health endpoint
curl http://localhost:8000/api/health

# View API docs
# Open browser: http://localhost:8000/docs
```

## Activity Tracking

All user actions are logged:
- Login/Logout
- Product additions/deletions
- Stock updates
- Sales records

Admins can view logs at `/api/activity`
