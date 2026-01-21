from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List
import os
from dotenv import load_dotenv

from database import get_db, init_db
from models import User, Product, Sale, ActivityLog
from schemas import (
    UserCreate, UserLogin, User as UserSchema, UserWithToken,
    ProductCreate, Product as ProductSchema, ProductUpdate,
    SaleCreate, Sale as SaleSchema,
    ActivityLog as ActivityLogSchema,
    DashboardStats
)
from auth import (
    get_password_hash, authenticate_user, create_access_token,
    get_current_user, get_current_active_admin
)

load_dotenv()

app = FastAPI(title="Spaza Track API", version="1.0.0")

# CORS configuration
origins = os.getenv("CORS_ORIGINS", "http://localhost:8080").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
def startup_event():
    init_db()

def log_activity(db: Session, user_id: int, action: str, details: str, ip: str = None):
    """Helper to log user activity"""
    log = ActivityLog(
        user_id=user_id,
        action=action,
        details=details,
        ip_address=ip
    )
    db.add(log)
    db.commit()

# ===== AUTH ENDPOINTS =====

@app.post("/api/auth/register", response_model=UserWithToken, status_code=status.HTTP_201_CREATED)
def register(user: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    # Check if username exists
    if db.query(User).filter(User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Username already registered")
    
    # Check if email exists
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    db_user = User(
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        hashed_password=get_password_hash(user.password),
        role=user.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Create token
    access_token = create_access_token(data={"sub": user.username})
    
    # Log activity
    log_activity(db, db_user.id, "register", f"New user registered: {user.username}")
    
    return {
        "user": db_user,
        "access_token": access_token,
        "token_type": "bearer"
    }

@app.post("/api/auth/login", response_model=UserWithToken)
def login(user_login: UserLogin, request: Request, db: Session = Depends(get_db)):
    """Login and get access token"""
    user = authenticate_user(db, user_login.username, user_login.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    # Create token
    access_token = create_access_token(data={"sub": user.username})
    
    # Log activity
    log_activity(db, user.id, "login", f"User logged in", request.client.host if request.client else None)
    
    return {
        "user": user,
        "access_token": access_token,
        "token_type": "bearer"
    }

@app.get("/api/auth/me", response_model=UserSchema)
def get_me(current_user: User = Depends(get_current_user)):
    """Get current user info"""
    return current_user

# ===== PRODUCT ENDPOINTS =====

@app.get("/api/products", response_model=List[ProductSchema])
def list_products(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all products"""
    return db.query(Product).all()

@app.post("/api/products", response_model=ProductSchema, status_code=status.HTTP_201_CREATED)
def create_product(
    product: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new product"""
    db_product = Product(
        **product.model_dump(),
        created_by=current_user.id
    )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    
    # Log activity
    log_activity(db, current_user.id, "add_product", f"Added product: {product.name}")
    
    return db_product

@app.put("/api/products/{product_id}", response_model=ProductSchema)
def update_product_quantity(
    product_id: int,
    product_update: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update product quantity"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    old_qty = product.quantity
    product.quantity = product_update.quantity
    db.commit()
    db.refresh(product)
    
    # Log activity
    log_activity(db, current_user.id, "update_stock", 
                 f"Updated {product.name} stock: {old_qty} → {product_update.quantity}")
    
    return product

@app.delete("/api/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a product"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    product_name = product.name
    db.delete(product)
    db.commit()
    
    # Log activity
    log_activity(db, current_user.id, "delete_product", f"Deleted product: {product_name}")
    
    return None

# ===== SALES ENDPOINTS =====

@app.post("/api/sales", response_model=SaleSchema, status_code=status.HTTP_201_CREATED)
def record_sale(
    sale: SaleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Record a new sale"""
    # Get product
    product = db.query(Product).filter(Product.id == sale.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check stock
    if product.quantity < sale.quantity_sold:
        raise HTTPException(status_code=400, detail="Insufficient stock")
    
    # Calculate values
    total_price = product.selling_price * sale.quantity_sold
    profit = (product.selling_price - product.cost_price) * sale.quantity_sold
    
    # Create sale
    db_sale = Sale(
        product_id=product.id,
        product_name=product.name,
        quantity_sold=sale.quantity_sold,
        total_price=total_price,
        profit=profit,
        employee_id=current_user.id,
        employee_name=current_user.full_name or current_user.username,
        date_key=datetime.now().strftime("%Y-%m-%d")
    )
    db.add(db_sale)
    
    # Update stock
    product.quantity -= sale.quantity_sold
    
    db.commit()
    db.refresh(db_sale)
    
    # Log activity
    log_activity(db, current_user.id, "record_sale", 
                 f"Sold {sale.quantity_sold}x {product.name} (R{total_price:.2f})")
    
    return db_sale

@app.get("/api/sales", response_model=List[SaleSchema])
def list_sales(
    date: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List sales, optionally filtered by date (YYYY-MM-DD)"""
    query = db.query(Sale)
    if date:
        query = query.filter(Sale.date_key == date)
    return query.order_by(Sale.sale_date.desc()).all()

# ===== STATISTICS =====

@app.get("/api/stats", response_model=DashboardStats)
def get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get dashboard statistics"""
    products = db.query(Product).all()
    sales = db.query(Sale).all()
    
    total_stock = sum(p.quantity for p in products)
    stock_value = sum(p.quantity * p.cost_price for p in products)
    total_revenue = sum(s.total_price for s in sales)
    total_profit = sum(s.profit for s in sales)
    low_stock = [{"name": p.name, "quantity": p.quantity} 
                 for p in products if p.quantity <= 3]
    recent_sales = db.query(Sale).order_by(Sale.sale_date.desc()).limit(10).all()
    
    return {
        "total_products": len(products),
        "total_stock": total_stock,
        "stock_value": stock_value,
        "total_sales": len(sales),
        "total_revenue": total_revenue,
        "total_profit": total_profit,
        "low_stock_items": low_stock,
        "recent_sales": recent_sales
    }

# ===== ACTIVITY LOGS (Admin only) =====

@app.get("/api/activity", response_model=List[ActivityLogSchema])
def get_activity_logs(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Get activity logs (admin only)"""
    return db.query(ActivityLog).order_by(ActivityLog.timestamp.desc()).limit(limit).all()

# ===== HEALTH CHECK =====

@app.get("/api/health")
def health_check():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
