import pymysql
conn = pymysql.connect(host='136.119.79.124', user='root', password='VideoSurgery2025', database='videosurgery', charset='utf8mb4')
cursor = conn.cursor()
cursor.execute("UPDATE users SET role='admin' WHERE openId='owner-admin-videosurgery'")
conn.commit()
print("Role atualizada para admin")
cursor.close()
conn.close()
