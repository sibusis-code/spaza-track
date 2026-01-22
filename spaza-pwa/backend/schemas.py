from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


class Shop(BaseModel):
    id: int
    name: str
    created_at: datetime

    class Config:
        from_attributes = True

# User Schemas
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    full_name: Optional[str] = None
    role: str = "employee"
    shop_id: Optional[int] = None  # Populated server-side for non-admin roles

class UserCreate(UserBase):
    password: str = Field(..., min_length=4)
    shop_name: Optional[str] = None  # For creating a new shop when registering an admin

class UserLogin(BaseModel):
    username: str
    password: str

class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    shop_id: int
    
    class Config:
        from_attributes = True

class UserWithToken(BaseModel):
    user: User
    access_token: str
    token_type: str = "bearer"

# Product Schemas
class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    cost_price: float = Field(..., gt=0)
    selling_price: float = Field(..., gt=0)
    quantity: int = Field(default=0, ge=0)

class ProductCreate(ProductBase):
    pass

class Product(ProductBase):
    id: int
    created_by: Optional[int]
    created_at: datetime
    updated_at: Optional[datetime]
    shop_id: int
    
    class Config:
        from_attributes = True

class ProductUpdate(BaseModel):
    quantity: int = Field(..., ge=0)

# Sale Schemas
class SaleBase(BaseModel):
    product_id: int
    quantity_sold: int = Field(..., gt=0)

class SaleCreate(SaleBase):
    pass

class Sale(BaseModel):
    id: int
    product_id: int
    product_name: str
    quantity_sold: int
    total_price: float
    profit: float
    employee_id: Optional[int]
    employee_name: str
    sale_date: datetime
    date_key: str
    shop_id: int
    
    class Config:
        from_attributes = True

# Activity Log
class ActivityLog(BaseModel):
    id: int
    user_id: int
    action: str
    details: Optional[str]
    timestamp: datetime
    shop_id: Optional[int]
    
    class Config:
        from_attributes = True

# Statistics
class DashboardStats(BaseModel):
    total_products: int
    total_stock: int
    stock_value: float
    total_sales: int
    total_revenue: float
    total_profit: float
    low_stock_items: List[dict]
    recent_sales: List[Sale]

# Token
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
