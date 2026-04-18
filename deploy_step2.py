"""
Deploy Step 2: Create database tables + Deploy to Cloud Run
"""
import google.auth
from google.auth.transport.requests import Request
import json, urllib.request, time

creds, _ = google.auth.default(scopes=['https://www.googleapis.com/auth/cloud-platform'])
creds.refresh(Request())
token = creds.token
PROJECT = 'spheric-mesh-493602-k8'
REGION = 'us-central1'
SQL_INSTANCE = 'videosurgery-db'

def api_post(url, body, method="POST"):
    data = json.dumps(body).encode()
    req = urllib.request.Request(url, data=data, headers={
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }, method=method)
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        return {"error": e.read().decode(), "code": e.code}

def api_get(url):
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read().decode())

# ============================================================
# STEP 1: Create database tables via Cloud SQL Admin API
# ============================================================
print("=== STEP 1: Criando tabelas no Cloud SQL ===")

# Cloud SQL Admin API allows running SQL via export/import, but for DDL
# we need to connect directly. Let's use the Cloud SQL Admin API's
# "databases" endpoint to verify the database exists first.

sql_statements = """
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  open_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  email VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  login_method VARCHAR(100),
  last_signed_in DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS topic_lists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  area VARCHAR(100) NOT NULL,
  procedure_code VARCHAR(100) NOT NULL,
  procedure_name VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_by INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS topic_criteria (
  id INT AUTO_INCREMENT PRIMARY KEY,
  topic_list_id INT NOT NULL,
  domain VARCHAR(255) NOT NULL,
  domain_order INT DEFAULT 0,
  item TEXT NOT NULL,
  item_order INT DEFAULT 0,
  milestone VARCHAR(50),
  description TEXT,
  FOREIGN KEY (topic_list_id) REFERENCES topic_lists(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS folders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  owner_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  area VARCHAR(100) NOT NULL,
  procedure_code VARCHAR(100) NOT NULL,
  topic_list_id INT,
  cover_color VARCHAR(50),
  is_archived BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id),
  FOREIGN KEY (topic_list_id) REFERENCES topic_lists(id)
);

CREATE TABLE IF NOT EXISTS videos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  folder_id INT NOT NULL,
  uploaded_by INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  local_path TEXT,
  s3_url TEXT,
  s3_key VARCHAR(500),
  thumbnail_url TEXT,
  mime_type VARCHAR(100),
  size_bytes BIGINT,
  duration_seconds INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (folder_id) REFERENCES folders(id),
  FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS folder_invites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  folder_id INT NOT NULL,
  invited_by INT NOT NULL,
  invitee_email VARCHAR(255) NOT NULL,
  invitee_user_id INT,
  token VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  message TEXT,
  email_sent BOOLEAN DEFAULT FALSE,
  expires_at DATETIME,
  accepted_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (folder_id) REFERENCES folders(id),
  FOREIGN KEY (invited_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS folder_access (
  id INT AUTO_INCREMENT PRIMARY KEY,
  folder_id INT NOT NULL,
  user_id INT NOT NULL,
  granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_access (folder_id, user_id),
  FOREIGN KEY (folder_id) REFERENCES folders(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS evaluations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  video_id INT NOT NULL,
  folder_id INT NOT NULL,
  evaluator_id INT NOT NULL,
  criteria_scores JSON,
  total_score INT DEFAULT 0,
  max_possible_score INT DEFAULT 0,
  entrustment_level INT,
  feedback TEXT,
  strengths TEXT,
  improvements TEXT,
  action_plan TEXT,
  is_draft BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (video_id) REFERENCES videos(id),
  FOREIGN KEY (folder_id) REFERENCES folders(id),
  FOREIGN KEY (evaluator_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR(50),
  related_id INT,
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
"""

# Save SQL to file for reference
with open("create_tables.sql", "w", encoding="utf-8") as f:
    f.write(sql_statements)
print("  SQL salvo em create_tables.sql")

# Execute SQL via direct MySQL connection
try:
    import mysql.connector
    print("  Conectando ao Cloud SQL (136.119.79.124)...")
    conn = mysql.connector.connect(
        host="136.119.79.124",
        user="root",
        password="VideoSurgery2025",
        database="videosurgery"
    )
    cursor = conn.cursor()
    for statement in sql_statements.strip().split(";"):
        stmt = statement.strip()
        if stmt:
            cursor.execute(stmt)
            print(f"  OK: {stmt[:60]}...")
    conn.commit()
    cursor.close()
    conn.close()
    print("  Todas as tabelas criadas com sucesso!")
except ImportError:
    print("  mysql-connector-python nao instalado. Instalando...")
    import subprocess
    subprocess.run(["pip", "install", "mysql-connector-python"], capture_output=True)
    print("  Instalado. Rode o script novamente.")
except Exception as e:
    print(f"  Erro ao conectar ao MySQL: {e}")
    print("  Tente rodar: pip install mysql-connector-python")

# ============================================================
# STEP 2: Create Artifact Registry repository
# ============================================================
print("\n=== STEP 2: Criando repositorio no Artifact Registry ===")
repo_url = f"https://artifactregistry.googleapis.com/v1/projects/{PROJECT}/locations/{REGION}/repositories?repositoryId=videosurgery-repo"
repo_result = api_post(repo_url, {
    "format": "DOCKER",
    "description": "VideoSurgery EPA container images"
})
if "error" in repo_result:
    if "409" in str(repo_result.get("code", "")) or "already" in str(repo_result.get("error", "")).lower():
        print("  Repositorio ja existe.")
    else:
        print(f"  Resultado: {repo_result}")
else:
    print(f"  Repositorio criado!")

print("\n=== PROXIMO PASSO ===")
print("Rode o seguinte no terminal para buildar e fazer deploy:")
print(f"  gcloud builds submit --tag {REGION}-docker.pkg.dev/{PROJECT}/videosurgery-repo/videosurgery-epa")
print(f"  gcloud run deploy videosurgery-epa --image {REGION}-docker.pkg.dev/{PROJECT}/videosurgery-repo/videosurgery-epa --region {REGION} --allow-unauthenticated --add-cloudsql-instances {PROJECT}:{REGION}:{SQL_INSTANCE} --set-env-vars NODE_ENV=production,DATABASE_URL=mysql://root:VideoSurgery2025@/videosurgery?socketPath=/cloudsql/{PROJECT}:{REGION}:{SQL_INSTANCE},GOOGLE_CLOUD_PROJECT={PROJECT},GCS_BUCKET={PROJECT}-videos")
