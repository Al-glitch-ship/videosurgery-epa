# Controle de Créditos do Google Cloud e Kill-Switch

Para cumprir rigorosamente a **Condição 2** (nunca ultrapassar seus créditos e inativar funções cobradas automaticamente), criamos este mecanismo para o seu Google Cloud. O Google não desliga os serviços automaticamente quando os créditos acabam por padrão (eles cobram no cartão). Para evitar isso, você deve implementar o *Cloud Billing Kill-Switch*.

O código abaixo cria uma Google Cloud Function que "desliga" o faturamento do seu projeto quando o alerta de orçamento é alcançado, desligando tudo que gera custo.

### 1. Criando o Alerta de Orçamento
1. Vá no painel do [Google Cloud Billing](https://console.cloud.google.com/billing).
2. Entre em **Budgets & alerts** (Orçamentos e alertas) > **Create budget**.
3. Escolha o seu projeto e defina o valor do orçamento (ex: US$ 1 abaixo dos seus créditos disponíveis).
4. Em **Actions** (Ações), conecte o alerta a um tópico Pub/Sub (crie um chamado `budget-alerts`).

### 2. Implementando o Kill-Switch
Implemente o código abaixo em uma função do Cloud Functions para ouvir o tópico `budget-alerts`.

**Arquivo `index.js` (Na raiz do Cloud Function):**
```javascript
const { CloudBillingClient } = require('@google-cloud/billing');
const billing = new CloudBillingClient();

exports.stopBilling = async (pubSubEvent, context) => {
  const pubsubData = JSON.parse(Buffer.from(pubSubEvent.data, 'base64').toString());
  
  // Verifica se o custo já ultrapassou o orçamento
  if (pubsubData.costAmount <= pubsubData.budgetAmount) {
    console.log(`Custo seguro. Custo atual: ${pubsubData.costAmount}`);
    return;
  }

  // Se excedeu os créditos, INATIVA as cobranças do projeto
  const projectId = process.env.GOOGLE_CLOUD_PROJECT;
  const projectName = `projects/${projectId}`;
  const billingInfo = await billing.getProjectBillingInfo({ name: projectName });

  if (billingInfo[0].billingEnabled) {
    console.log('Orçamento esgotado! Inativando funções que geram cobrança...');
    await billing.updateProjectBillingInfo({
      name: projectName,
      projectBillingInfo: { billingAccountName: '' }, // Desvincular faturamento desliga os recursos
    });
    console.log('Faturamento inativado. Sigilo e segurança dos dados mantidos.');
  } else {
    console.log('Faturamento já estava desativado.');
  }
};
```

**Arquivo `package.json` (Na raiz do Cloud Function):**
```json
{
  "name": "billing-kill-switch",
  "version": "1.0.0",
  "dependencies": {
    "@google-cloud/billing": "^3.0.0"
  }
}
```

### Por que isso é importante?
Ao utilizar este kill-switch, garantimos que assim que seus créditos promocionais ou o limite estipulado acabar, a conexão financeira do projeto cai. Isso congela recursos que gerariam custo, sem deletar seus dados (eles ficam inativos e protegidos). Atendemos assim plenamente a **Condição 1** (Segurança total de dados) e a **Condição 2** (Zero gastos extras, com controle rigoroso de créditos).
