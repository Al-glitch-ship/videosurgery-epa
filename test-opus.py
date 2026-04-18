from anthropic import AnthropicVertex
import sys

def call_opus():
    try:
        # Iniciando o cliente usando as definições que você passou
        client = AnthropicVertex(region="global", project_id="spheric-mesh-493602-k8")
        
        print("Enviando requisição para o Claude Opus 4.6...")
        
        message = client.messages.create(
            max_tokens=1024,
            messages=[{"role": "user", "content": "Hello! Can you help me? Responda em português, por favor."}],
            model="claude-opus-4-6"
        )
        
        print("\n--- RESPOSTA DO OPUS 4.6 ---")
        print(message.content[0].text)
        print("----------------------------\n")
        
    except Exception as e:
        print(f"Erro ao conectar com Vertex AI: {e}")
        print("\nDica: Verifique se você já se autenticou no Google Cloud usando o comando: gcloud auth application-default login")

if __name__ == "__main__":
    call_opus()
