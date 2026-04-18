import type { Express, Request, Response } from "express";

export function registerVertexAiRoutes(app: Express) {
  
  // ==========================================
  // Rota 1: Anthropic Claude Opus
  // ==========================================
  app.post("/api/vertex-ai/assist", async (req: Request, res: Response) => {
    try {
      const { prompt } = req.body;
      if (!prompt) return res.status(400).json({ error: "Prompt é obrigatório" });

      const projectId = process.env.GOOGLE_CLOUD_PROJECT;
      if (!projectId) return res.status(500).json({ error: "GOOGLE_CLOUD_PROJECT não definido." });

      let AnthropicVertex;
      try {
        const anthropicModule = await import("@anthropic-ai/vertex-sdk");
        AnthropicVertex = anthropicModule.AnthropicVertex;
      } catch (err) {
        return res.status(500).json({ error: "SDK do Anthropic não instalado." });
      }

      const client = new AnthropicVertex({ projectId: projectId, region: "global" });
      const message = await client.messages.create({
        model: "claude-opus-4-6",
        max_tokens: 2048,
        temperature: 0.2,
        messages: [{ role: "user", content: prompt }],
      });

      const fullTextResponse = message.content[0]?.type === 'text' ? message.content[0].text : "";
      res.json({ success: true, response: fullTextResponse });

    } catch (error) {
      console.error("Vertex AI (Claude Opus) Error:", error);
      res.status(500).json({ error: "Erro ao comunicar com Claude Opus." });
    }
  });

  // ==========================================
  // Rota 2: xAI Grok 4.20 (Non-Reasoning) via OpenAPI
  // ==========================================
  app.post("/api/vertex-ai/grok", async (req: Request, res: Response) => {
    try {
      const { prompt } = req.body;
      if (!prompt) return res.status(400).json({ error: "Prompt é obrigatório" });

      const projectId = process.env.GOOGLE_CLOUD_PROJECT;
      if (!projectId) return res.status(500).json({ error: "GOOGLE_CLOUD_PROJECT não definido." });

      const region = "global";
      const endpoint = "aiplatform.googleapis.com";
      const url = `https://${endpoint}/v1/projects/${projectId}/locations/${region}/endpoints/openapi/chat/completions`;

      // Importação dinâmica para não quebrar o servidor se o pacote estiver instalando
      let GoogleAuth;
      try {
        const authModule = await import("google-auth-library");
        GoogleAuth = authModule.GoogleAuth;
      } catch (err) {
        return res.status(500).json({ 
          error: "O pacote 'google-auth-library' não está instalado. Aguarde o VS Code instalá-lo ou rode 'pnpm add google-auth-library'." 
        });
      }

      // Autenticação automática usando as credenciais do Google Cloud CLI do seu computador
      const auth = new GoogleAuth({
        scopes: 'https://www.googleapis.com/auth/cloud-platform'
      });
      const client = await auth.getClient();
      const accessToken = await client.getAccessToken();

      // Chamada HTTP (Fetch) nativa do Node, idêntica ao cURL solicitado
      const grokResponse = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken.token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "xai/grok-4.20-non-reasoning",
          stream: false, // Alterado para false para retornar a resposta completa na requisição HTTP normal
          messages: [{ role: "user", content: prompt }]
        })
      });

      if (!grokResponse.ok) {
        const errorData = await grokResponse.text();
        console.error("Grok API Error Response:", errorData);
        return res.status(grokResponse.status).json({ 
          error: `Erro retornado pelo Grok/Vertex: ${errorData}` 
        });
      }

      const data = await grokResponse.json();
      
      // O endpoint OpenAPI de Chat Completions geralmente retorna no formato OpenAI-compatible
      const responseText = data.choices?.[0]?.message?.content || "";

      res.json({
        success: true,
        response: responseText,
        raw: data // Retornando o payload bruto também para debug, se necessário
      });

    } catch (error) {
      console.error("Vertex AI (Grok) Error:", error);
      res.status(500).json({ error: "Erro interno ao tentar conectar com a API do Grok." });
    }
  });
}
