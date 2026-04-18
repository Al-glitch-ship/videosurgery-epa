import google.auth
from google.auth.transport.requests import Request
import json, urllib.request

creds, _ = google.auth.default(scopes=["https://www.googleapis.com/auth/cloud-platform"])
creds.refresh(Request())
token = creds.token

billing_account = "01A222-0D3E23-294A4F"
url = f"https://billingbudgets.googleapis.com/v1/billingAccounts/{billing_account}/budgets"

budget_body = {
    "displayName": "VideoSurgery EPA - Controle de Creditos",
    "budgetFilter": {
        "projects": ["projects/spheric-mesh-493602-k8"],
    },
    "amount": {"lastPeriodAmount": {}},
    "thresholdRules": [
        {"thresholdPercent": 0.5, "spendBasis": "CURRENT_SPEND"},
        {"thresholdPercent": 0.8, "spendBasis": "CURRENT_SPEND"},
        {"thresholdPercent": 1.0, "spendBasis": "CURRENT_SPEND"},
    ],
    "notificationsRule": {"disableDefaultIamRecipients": False},
}

data = json.dumps(budget_body).encode()
req = urllib.request.Request(url, data=data, headers={
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}, method="POST")

try:
    with urllib.request.urlopen(req) as r:
        result = json.loads(r.read().decode())
        name = result.get("displayName", "OK")
        print(f"Budget Alert criado: {name}")
        print("Alertas: 50%, 80%, 100%")
except urllib.error.HTTPError as e:
    body = e.read().decode()
    print(f"Error {e.code}: {body[:300]}")
    if "403" in str(e.code) or "PERMISSION_DENIED" in body:
        print("Habilitando billingbudgets API...")
        enable_url = "https://serviceusage.googleapis.com/v1/projects/spheric-mesh-493602-k8/services/billingbudgets.googleapis.com:enable"
        req2 = urllib.request.Request(enable_url, data=b"{}", headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }, method="POST")
        try:
            with urllib.request.urlopen(req2) as r2:
                print("API habilitada! Rode o script novamente.")
        except Exception as e2:
            print(f"Erro: {e2}")
