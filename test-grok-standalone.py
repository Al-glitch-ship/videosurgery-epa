import google.auth
from google.auth.transport.requests import Request
import json
import urllib.request

def test_grok():
    print("Obtendo token de acesso do Google Cloud (ADC)...")
    try:
        credentials, project = google.auth.default(scopes=['https://www.googleapis.com/auth/cloud-platform'])
        credentials.refresh(Request())
        token = credentials.token
    except Exception as e:
        print("Erro ao obter credenciais do Google Cloud.")
        print(str(e))
        return

    project_id = "spheric-mesh-493602-k8"
    region = "global"
    url = f"https://aiplatform.googleapis.com/v1/projects/{project_id}/locations/{region}/endpoints/openapi/chat/completions"

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    data = {
        "model": "xai/grok-4.20-non-reasoning",
        "stream": False,
        "messages": [{"role": "user", "content": "Crie um roteiro muito rápido de viagem de verão para Paris"}]
    }

    req = urllib.request.Request(url, data=json.dumps(data).encode("utf-8"), headers=headers, method="POST")
    
    print(f"Chamando API do Grok-4.20 no endpoint OpenAPI do GCP...")
    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode("utf-8")
            res_json = json.loads(res_body)
            print("\n=== RESPOSTA DO GROK 4.20 ===")
            print(res_json.get("choices", [{}])[0].get("message", {}).get("content", res_json))
            print("=============================\n")
    except urllib.error.HTTPError as e:
        print(f"\nErro HTTP {e.code}: {e.read().decode('utf-8')}")
    except Exception as e:
        print(f"\nErro de conexão: {e}")

if __name__ == "__main__":
    test_grok()
