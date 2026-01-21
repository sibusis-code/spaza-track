"""Create admin user for Spaza Track"""
from database import SessionLocal, init_db
from models import User
from auth import get_password_hash

def create_admin():
    # Initialize database
    init_db()
    db = SessionLocal()
    
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
        is_active=True
    )
    db.add(admin)
    db.commit()
    
    print("✅ Admin user created!")
    print("   Username: admin")
    print("   Password: admin123")
    print("   ⚠️  Change password after first login!")

if __name__ == "__main__":
    create_admin()
