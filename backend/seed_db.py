import sqlite3
import uuid
from datetime import datetime

# Simple script to seed the database for demonstration
db_path = "smart_city.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Sample Admins for different departments (Zimbabwe national colors and themes)
admins = [
    ("Electricity Admin", "elec@smartcity.gov.zw", "admin123", "admin", "electricity"),
    ("Water Admin", "water@smartcity.gov.zw", "admin123", "admin", "water_sewer"),
    ("Roads Admin", "roads@smartcity.gov.zw", "admin123", "admin", "roads_infra"),
    ("Waste Admin", "waste@smartcity.gov.zw", "admin123", "admin", "waste_management"),
    ("Emergency Admin", "emergency@smartcity.gov.zw", "admin123", "admin", "emergency_services"),
    ("Health Admin", "health@smartcity.gov.zw", "admin123", "admin", "public_health"),
]

for name, email, pwd, role, dept in admins:
    cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
    if not cursor.fetchone():
        cursor.execute("""
            INSERT INTO users (full_name, email, password_hash, role, department, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (name, email, pwd, role, dept, datetime.now().isoformat()))

# Sample Categories for all 6 departments
sample_categories = [
    # Electricity
    ("electricity", "Power Outage"),
    ("electricity", "Vandalism"),
    ("electricity", "Transformer Fault"),
    ("electricity", "Billing Issue"),
    # Water & Sewer
    ("water_sewer", "Burst Pipe"),
    ("water_sewer", "Sewage Leak"),
    ("water_sewer", "No Water Supply"),
    ("water_sewer", "Water Meter Fault"),
    # Roads & Infra
    ("roads_infra", "Pothole"),
    ("roads_infra", "Traffic Light Failure"),
    ("roads_infra", "Streetlight Out"),
    ("roads_infra", "Blocked Drain"),
    # Waste Management
    ("waste_management", "Uncollected Garbage"),
    ("waste_management", "Illegal Dumping"),
    ("waste_management", "Public Bin Overflow"),
    # Emergency Services
    ("emergency_services", "Fire Outbreak"),
    ("emergency_services", "Medical Emergency"),
    ("emergency_services", "Rescue Request"),
    # Public Health
    ("public_health", "Hazardous Waste"),
    ("public_health", "Unlicensed Food Vendor"),
    ("public_health", "Pest Infestation"),
]

for sector, name in sample_categories:
    cursor.execute("SELECT id FROM categories WHERE sector = ? AND name = ?", (sector, name))
    if not cursor.fetchone():
        cursor.execute("INSERT INTO categories (sector, name) VALUES (?, ?)", (sector, name))

# Sample Issues for Zimbabwe
zimbabwe_issues = [
    ("electricity", "Transformer Fault", "Loud bang heard, power out in Avondale.", -17.7833, 31.0333, "Avondale, Harare", "high"),
    ("water_sewer", "Pipe Burst", "Major leak on Samora Machel Ave.", -17.8292, 31.0522, "Central Business District", "critical"),
    ("roads_infra", "Major Pothole", "Dangerous pothole near bridge.", -17.8631, 31.0122, "Mbare", "medium"),
    ("electricity", "Billing Issue", "Meter reading error.", -17.8100, 31.1000, "Greendale", "low"),
]

for sector, cat, desc, lat, lng, addr, prio in zimbabwe_issues:
    cursor.execute("SELECT id FROM issues WHERE description = ?", (desc,))
    if not cursor.fetchone():
        ref = f"REF-{uuid.uuid4().hex[:8].upper()}"
        now = datetime.utcnow().isoformat()
        cursor.execute("""
            INSERT INTO issues (reference_number, sector, category, description, latitude, longitude, address, status, priority, reporter_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (ref, sector, cat, desc, lat, lng, addr, "reported", prio, 1, now, now))

conn.commit()
conn.close()
print("Database successfully seeded with new department admins, categories, and issues.")
