import vertexai
from vertexai.generative_models import GenerativeModel, Part

# Configurações do seu projeto
PROJECT_ID = "spheric-mesh-493602-k8"
LOCATION = "us-central1"

def consultar_claude_para_projeto(pergunta_usuario, trecho_codigo):
    # Inicializa o Vertex AI
    vertexai.init(project=PROJECT_ID, location=LOCATION)

    # O ID solicitado pelo usuário
    model_id = "publishers/anthropic/models/claude-opus-4-7"

    try:
        # Inicializa o modelo
        model = GenerativeModel(model_id)

        prompt = f"""
        Você é um especialista em Google Cloud Run e Python.
        Estou trabalhando no serviço '{trecho_codigo['servico']}' no projeto GCP.
        
        Contexto do Código:
        {trecho_codigo['conteudo']}
        
        Pergunta: {pergunta_usuario}
        """

        response = model.generate_content(prompt)
        
        print("--- Resposta do Claude Opus 4.7 ---")
        print(response.text)
    except Exception as e:
        print(f"Erro ao consultar o modelo {model_id}: {e}")
        print("\nTentando com o ID padrão do Claude 3 Opus no Vertex...")
        
        # Fallback para o ID real do Claude 3 Opus
        fallback_id = "publishers/anthropic/models/claude-3-opus@20240229"
        try:
            model = GenerativeModel(fallback_id)
            response = model.generate_content(prompt)
            print(f"--- Resposta do Claude (via {fallback_id}) ---")
            print(response.text)
        except Exception as e2:
            print(f"Erro também no fallback: {e2}")

# Exemplo de uso para o seu serviço
meu_codigo_exemplo = {
    "servico": "videosurgery-epa",
    "conteudo": "import os\nfrom flask import Flask\napp = Flask(__name__)\n# ... resto do seu código ..."
}

consultar_claude_para_projeto(
    "Como posso otimizar o tempo de inicialização (cold start) deste serviço no Cloud Run?",
    meu_codigo_exemplo
)
