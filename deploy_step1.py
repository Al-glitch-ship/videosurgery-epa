"""Deploy Step 1: Get Cloud SQL details + Create Storage Bucket"""
import google.auth
from google.auth.transport.requests import Request
import json, urllib.request

creds, _ = google.auth.default(scopes=['https://www.googleapis.com/auth/cloud-platform'])
creds.refresh(Request())
token = creds.token
PROJECT = 'spheric-mesh-493602-k8'

def api_get(url):
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read().decode())

def api_post(url, body):
    data = json.dumps(body).encode()
    req = urllib.request.Request(url, data=data, headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read().decode())

# 1. Get Cloud SQL instance details
print("=== CLOUD SQL DETAILS ===")
sql_data = api_get(f"https://sqladmin.googleapis.com/v1/projects/{PROJECT}/instances/videosurgery-db")
conn_name = sql_data.get("connectionName", "N/A")
ip_addresses = sql_data.get("ipAddresses", [])
region = sql_data.get("region", "N/A")
tier = sql_data.get("settings", {}).get("tier", "N/A")
print(f"  Connection Name: {conn_name}")
print(f"  Region: {region}")
print(f"  Tier: {tier}")
for ip in ip_addresses:
    print(f"  IP: {ip.get('ipAddress','?')} (type: {ip.get('type','?')})")

# 2. Get database users
print("\n=== DATABASE USERS ===")
try:
    users_data = api_get(f"https://sqladmin.googleapis.com/v1/projects/{PROJECT}/instances/videosurgery-db/users")
    for u in users_data.get("items", []):
        print(f"  User: {u.get('name','?')} (host: {u.get('host','?')})")
except Exception as e:
    print(f"  Error: {e}")

# 3. Get databases
print("\n=== DATABASES ===")
try:
    db_data = api_get(f"https://sqladmin.googleapis.com/v1/projects/{PROJECT}/instances/videosurgery-db/databases")
    for d in db_data.get("items", []):
        print(f"  DB: {d.get('name','?')}")
except Exception as e:
    print(f"  Error: {e}")

# 4. Create Storage Bucket
print("\n=== CREATING STORAGE BUCKET ===")
bucket_name = f"{PROJECT}-videos"
try:
    bucket = api_post(f"https://storage.googleapis.com/storage/v1/b?project={PROJECT}", {
        "name": bucket_name,
        "location": "US-CENTRAL1",
        "storageClass": "STANDARD",
        "iamConfiguration": {"uniformBucketLevelAccess": {"enabled": True}},
        "lifecycle": {"rule": [
            {"action": {"type": "SetStorageClass", "storageClass": "NEARLINE"}, "condition": {"age": 30}},
        ]}
    })
    print(f"  Bucket criado: {bucket.get('name','?')}")
    print(f"  Location: {bucket.get('location','?')}")
except urllib.error.HTTPError as e:
    body = e.read().decode()
    if "already" in body.lower() or "409" in str(e.code):
        print(f"  Bucket ja existe: {bucket_name}")
    else:
        print(f"  Error {e.code}: {body}")
