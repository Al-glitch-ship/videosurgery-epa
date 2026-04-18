// test-grok.js
// Script simples para você testar a rota do Grok 4.20 que acabei de criar no seu servidor.
// Para rodar, certifique-se de que o seu servidor principal está ligado em uma aba do terminal,
// e em outra aba digite: node test-grok.js

const promptTeste = "Crie um roteiro rápido de 2 dias de viagem no verão para Paris.";

console.log("==========================================");
console.log("Iniciando teste da rota local: POST /api/vertex-ai/grok");
console.log(`Prompt: "${promptTeste}"`);
console.log("Aguardando resposta do modelo xai/grok-4.20-non-reasoning...");
console.log("==========================================\n");

fetch("http://localhost:3000/api/vertex-ai/grok", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ prompt: promptTeste })
})
  .then(async (res) => {
    const data = await res.json();
    if (!res.ok) {
      console.error("❌ Ocorreu um erro na requisição:");
      console.error(data.error || data);
      console.log("\nDica: Se o erro for de 'pacote não instalado', lembre-se de reiniciar o servidor para ele baixar a google-auth-library automaticamente.");
      return;
    }
    
    console.log("✅ SUCESSO! Resposta recebida do Grok:\n");
    console.log(data.response);
    console.log("\n==========================================");
  })
  .catch((err) => {
    console.error("❌ Falha de Conexão:");
    console.error("Não foi possível alcançar a rota. O seu servidor do Vite/TSX está rodando na porta 3000?");
    console.error(`Detalhe do erro: ${err.message}`);
  });
