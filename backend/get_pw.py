import sqlite3

conn = sqlite3.connect('smart_city.db')
cursor = conn.cursor()
cursor.execute("SELECT password_hash FROM users WHERE email='test@elec.gov.zw'")
res = cursor.fetchone()
print(res[0] if res else 'User not found')
conn.close()
