"""Create admin user for Spaza Track"""
from database import SessionLocal, init_db
from models import User, Shop
from auth import get_password_hash

def create_admin():
    # Initialize database
    init_db()
    db = SessionLocal()
    
    # Ensure default shop exists
    shop = db.query(Shop).filter(Shop.name == "Default Shop").first()
    if not shop:
        shop = Shop(name="Default Shop")
        db.add(shop)
        db.commit()
        db.refresh(shop)

    # Check if admin exists
    existing = db.query(User).filter(User.username == "admin").first()
    if existing:
        print("❌ Admin user already exists!")
        return
    
    # Create admin
    admin = User(
        username="admin",
        email="admin@spaza.shop",
        full_name="Administrator",
        hashed_password=get_password_hash("admin123"),
        role="admin",
        is_active=True,
        shop_id=shop.id
    )
    db.add(admin)
    db.commit()
    
    print("✅ Admin user created!")
    print("   Username: admin")
    print("   Password: admin123")
    print("   Shop: Default Shop (id: {})".format(shop.id))
    print("   ⚠️  Change password after first login!")

if __name__ == "__main__":
    create_admin()
