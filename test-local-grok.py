import urllib.request
import json

def test_local_endpoint():
    url = "http://localhost:3000/api/vertex-ai/grok"
    headers = {"Content-Type": "application/json"}
    data = {"prompt": "Responda apenas com a palavra: ONLINE"}
    
    req = urllib.request.Request(url, data=json.dumps(data).encode("utf-8"), headers=headers, method="POST")
    print("Chamando o servidor local em", url)
    
    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode("utf-8")
            print("Resposta do servidor:", res_body)
    except Exception as e:
        print("Erro (o servidor pode não estar rodando):", e)

if __name__ == "__main__":
    test_local_endpoint()
