import vertexai
from vertexai.generative_models import GenerativeModel

PROJECT_ID = "spheric-mesh-493602-k8"
# Claude Opus no Vertex está disponível em us-east5
LOCATION = "us-east5" 

def consultar_claude_real(pergunta_usuario, trecho_codigo):
    vertexai.init(project=PROJECT_ID, location=LOCATION)

    # Este é o ID correto do Claude 3 Opus no Vertex AI
    model_id = "publishers/anthropic/models/claude-3-opus@20240229"

    try:
        model = GenerativeModel(model_id)
        prompt = f"""
        Você é um especialista em Google Cloud Run e Python.
        Pergunta: {pergunta_usuario}
        Contexto: {trecho_codigo['conteudo']}
        """
        response = model.generate_content(prompt)
        print(f"--- Resposta do Claude (via {model_id}) ---")
        print(response.text)
    except Exception as e:
        print(f"Erro ao consultar o modelo {model_id} em {LOCATION}: {e}")

meu_codigo_exemplo = {
    "servico": "videosurgery-epa",
    "conteudo": "import os\nfrom flask import Flask\napp = Flask(__name__)\n# ... resto do seu código ..."
}

consultar_claude_real(
    "Como posso otimizar o tempo de inicialização (cold start) deste serviço no Cloud Run?",
    meu_codigo_exemplo
)
