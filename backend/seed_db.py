import sqlite3
import uuid
from datetime import datetime

# Simple script to seed the database for demonstration
db_path = "smart_city.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Create tables if they don't exist (handled by FastAPI but safe here too)
# cursor.execute(...)

# Sample Admins for different departments
admins = [
    ("Electricity Admin", "elec@smartcity.gov.zw", "admin123", "admin", "electricity"),
    ("Water Admin", "water@smartcity.gov.zw", "admin123", "admin", "water_sewer"),
    ("Roads Admin", "roads@smartcity.gov.zw", "admin123", "admin", "roads_infra"),
]

for name, email, pwd, role, dept in admins:
    cursor.execute("""
        INSERT INTO users (full_name, email, password_hash, role, department, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (name, email, pwd, role, dept, datetime.now().isoformat()))

# Sample Issues for Zimbabwe
zimbabwe_issues = [
    ("electricity", "Transformer Fault", "Loud bang heard, power out in Avondale.", -17.7833, 31.0333, "Avondale, Harare", "high"),
    ("water_sewer", "Pipe Burst", "Major leak on Samora Machel Ave.", -17.8292, 31.0522, "Central Business District", "critical"),
    ("roads_infra", "Major Pothole", "Dangerous pothole near bridge.", -17.8631, 31.0122, "Mbare", "medium"),
    ("electricity", "Billing Issue", "Meter reading error.", -17.8100, 31.1000, "Greendale", "low"),
]

for sector, cat, desc, lat, lng, addr, prio in zimbabwe_issues:
    ref = f"REF-{uuid.uuid4().hex[:8].upper()}"
    now = datetime.utcnow().isoformat()
    cursor.execute("""
        INSERT INTO issues (reference_number, sector, category, description, latitude, longitude, address, status, priority, reporter_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (ref, sector, cat, desc, lat, lng, addr, "reported", prio, 1, now, now))

conn.commit()
conn.close()
print("Database seeded with Zimbabwe sample issues.")
