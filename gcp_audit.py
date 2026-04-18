import google.auth
from google.auth.transport.requests import Request
import json, urllib.request

creds, _ = google.auth.default(scopes=['https://www.googleapis.com/auth/cloud-platform'])
creds.refresh(Request())
token = creds.token
project_id = 'spheric-mesh-493602-k8'

def api_get(url):
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read().decode())
    except Exception as e:
        return {"error": str(e)}

# Billing
print("=== BILLING ===")
print(json.dumps(api_get(f"https://cloudbilling.googleapis.com/v1/projects/{project_id}/billingInfo"), indent=2))

# Cloud Run
print("\n=== CLOUD RUN ===")
data = api_get(f"https://run.googleapis.com/v2/projects/{project_id}/locations/-/services")
for s in data.get("services", []):
    print(f"  Service: {s.get('name','?')} -> {s.get('uri','N/A')}")
if not data.get("services"):
    print("  Nenhum servico existente.")

# Storage Buckets
print("\n=== STORAGE BUCKETS ===")
data = api_get(f"https://storage.googleapis.com/storage/v1/b?project={project_id}")
for b in data.get("items", []):
    print(f"  Bucket: {b.get('name','?')} (location: {b.get('location','?')}, class: {b.get('storageClass','?')})")
if not data.get("items"):
    print("  Nenhum bucket existente.")

# Cloud SQL
print("\n=== CLOUD SQL ===")
data = api_get(f"https://sqladmin.googleapis.com/v1/projects/{project_id}/instances")
for inst in data.get("items", []):
    print(f"  Instance: {inst.get('name','?')} ({inst.get('databaseVersion','?')}) state={inst.get('state','?')}")
if not data.get("items"):
    print("  Nenhuma instancia existente.")

# Artifact Registry repos
print("\n=== ARTIFACT REGISTRY ===")
data = api_get(f"https://artifactregistry.googleapis.com/v1/projects/{project_id}/locations/-/repositories")
for r in data.get("repositories", []):
    print(f"  Repo: {r.get('name','?')}")
if not data.get("repositories"):
    print("  Nenhum repositorio existente.")
