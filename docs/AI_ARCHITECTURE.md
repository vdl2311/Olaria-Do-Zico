# Camada de Inteligência Artificial — Olaria do Zico

## 1. Visão Geral da Arquitetura

A camada de IA do **Olaria do Zico** foi desenhada para transformar o sistema em uma plataforma de **Gestão Inteligente Operacional**, permitindo que o gestor, oleiro e administradores consultem métricas, façam comparações de períodos, identifiquem anomalias em fornadas/queimas e recebam alertas preditivos.

```
+----------------------------------------------------------------+
|                   INTERFACE OLARIA DO ZICO                     |
|  (AIAssistantView, DashboardView, VoiceModal, Header/Sidebar)  |
+----------------------------------------------------------------+
                               |
                               v
+----------------------------------------------------------------+
|                        AI ASSISTANT                            |
|        (Gerenciador de Conversa, Sugestões, Contexto)          |
+----------------------------------------------------------------+
                               |
                               v
+----------------------------------------------------------------+
|                       AI ORCHESTRATOR                          |
| (Classificador de Intenções, Fallback Fail-Safe, Anti-Alucinação)|
+----------------------------------------------------------------+
                               |
                               v
+----------------------------------------------------------------+
|                  CONTROLLED TOOLS & ANALYTICS                  |
|  - get_producao_periodo        - get_vendas_periodo            |
|  - get_estoque_atual           - get_financeiro_periodo        |
|  - comparar_periodos           - get_dashboard                 |
|  - AnomalyDetector             - InsightGenerator              |
|  - AlertEngine                 - AIReportEngine                |
|  - ExecutiveSummaryEngine                                      |
+----------------------------------------------------------------+
                               |
                               v
+----------------------------------------------------------------+
|                    SERVIÇOS & SEGURANÇA                        |
|  - StorageService (Isolamento de Tenant)                       |
|  - AuthService (RBAC: PROPRIETARIO, FUNCIONARIO, ADMIN_TECNICO) |
+----------------------------------------------------------------+
                               |
                               v
+----------------------------------------------------------------+
|                      FIREBASE & FIRESTORE                      |
+----------------------------------------------------------------+
```

---

## 2. Componentes e Serviços Criados

### 2.1 Tipos e Contratos (`src/ai/types/aiTypes.ts`)
- `AiChatMessage`: Estrutura das mensagens da conversa com rastreamento de ferramentas e fontes de dados.
- `OperationalInsight`: Descobertas categorizadas em `CRESCIMENTO`, `QUEDA`, `ANOMALIA`, `TENDENCIA`, `OPORTUNIDADE`, `RISCO`.
- `IntelligentAlert`: Alertas com prioridade (`ATENCAO`, `ALERTA`, `OPORTUNIDADE`), dados utilizados e ação recomendada.
- `ExecutiveSummaryData`: Resumo consolidado para o recurso *"O Que Preciso Saber Hoje?"*.
- `AIReportStructure`: Estrutura para os 8 relatórios especializados (`DIARIO`, `SEMANAL`, `MENSAL`, `PRODUCAO`, `VENDAS`, `ESTOQUE`, `FINANCEIRO`, `EXECUTIVO`).
- `AnomalyDetectionResult`: Estrutura de anomalias quantitativas (desvio padrão e médias históricas).

### 2.2 Ferramentas Controladas (`src/ai/tools/systemTools.ts`)
- `get_producao_periodo`: Lotes, peças produzidas, perdas e taxa de quebra na queima cerâmica.
- `get_vendas_periodo`: Faturamento, pagamentos à vista/Pix, fiados a receber e produtos líderes.
- `get_estoque_atual`: Peças acabadas no pátio e insumos (argila, pigmentos, esmaltes).
- `get_financeiro_periodo`: Entradas em caixa, despesas pagas/pendentes, saldo líquido e inadimplência.
- `get_clientes`: Histórico de compras por arquitetos, paisagistas, lojas e consumidor final.
- `get_dashboard`: Visão executiva em tempo real.
- `comparar_periodos`: Comparações entre períodos com cálculo de variação absoluta e percentual.

### 2.3 Motores Especializados
- **`src/ai/analytics/anomalyDetector.ts`**: Detecção de quebra excessiva no forno, concentração de fiado e ruptura de estoque.
- **`src/ai/insights/insightGenerator.ts`**: Geração de tendências e produtos campeões com base matemática.
- **`src/ai/alerts/alertEngine.ts`**: Alertas operacionais com ações recomendadas acionáveis em um clique.
- **`src/ai/executive/executiveSummary.ts`**: Diagnóstico diário com *Health Score* (0 a 100).
- **`src/ai/reports/aiReportEngine.ts`**: Gerador de relatórios estruturados com exportação Excel (.xlsx), impressão e cópia.
- **`src/ai/orchestrator/aiOrchestrator.ts`**: Orquestrador conversacional híbrido (Gemini 3.7 Flash + Motor Local Determinístico de Alta Disponibilidade).

### 2.4 Interface do Usuário (`src/views/AIAssistantView.tsx`)
- Painel integrado com 6 abas:
  1. 💬 **Assistente & Consultas** (Chat em linguagem natural com tool-calling e sugestões de perguntas)
  2. 💡 **Insights da Operação** (Cards interativos de tendências e oportunidades)
  3. 🚨 **Central de Alertas** (Alertas categorizados com prioridade e resolução direta)
  4. 📋 **O Que Preciso Saber Hoje?** (Resumo executivo completo da olaria)
  5. 📊 **Relatórios com IA** (Geração e exportação em Excel/Impressão)
  6. ⚙️ **Governança & Status** (Monitoramento de latência e políticas anti-alucinação)

---

## 3. Segurança e Regras Anti-Alucinação

1. **Acesso Somente Leitura**: A IA não possui permissão para apagar, alterar ou registrar documentos arbitrariamente.
2. **Isolamento de Tenant**: Todas as consultas são filtradas estritamente pelo `tenantId` do usuário logado através do `StorageService`.
3. **Controle de Permissões (RBAC)**: Funcionários só visualizam módulos e relatórios aos quais possuem permissão delegada pelo proprietário.
4. **Proteção de Segredos**: Nenhuma chave de API fica exposta no frontend; o servidor Express atua como proxy seguro (`/api/ai-chat`, `/api/voice-nlu`).
5. **Zero Alucinação**: Quando os dados são inexistentes ou insuficientes, o assistente declara explicitamente a ausência de registros sem inventar números.

---

## 4. Como Adicionar Novas Ferramentas e Prompts

### Para Adicionar uma Nova Ferramenta:
1. Abra `src/ai/tools/systemTools.ts`.
2. Adicione a definição no objeto `SystemToolsRegistry.tools`:
```typescript
minha_nova_ferramenta: {
  name: 'minha_nova_ferramenta',
  description: 'Explicação clara da função da ferramenta',
  parameters: {
    type: 'object',
    properties: {
      meuParametro: { type: 'string', description: 'Descrição' }
    }
  },
  handler: (args) => {
    // Consulta via StorageService com isolamento de tenant
    return { resultado: 'dados' };
  }
}
```

### Para Alterar o Modelo ou Prompts:
- O prompt principal e regras de resposta residem em `src/ai/prompts/systemPrompts.ts`.
- No backend (`server.ts`), a rota `/api/ai-chat` utiliza o SDK `@google/genai` com o modelo `gemini-3.7-flash`.
