import { SystemToolsRegistry } from '../tools/systemTools';
import { AiChatMessage, AiToolCallRecord } from '../types/aiTypes';
import { SUGGESTED_QUESTIONS } from '../prompts/systemPrompts';

export class AIOrchestrator {
  private static messageHistory: AiChatMessage[] = [];

  public static getHistory(): AiChatMessage[] {
    return [...this.messageHistory];
  }

  public static clearHistory(): void {
    this.messageHistory = [];
  }

  /**
   * Main conversational entry point
   */
  public static async processUserMessage(
    userMessage: string, 
    contextHistory: AiChatMessage[] = []
  ): Promise<AiChatMessage> {
    const startTime = performance.now();
    const cleanQuery = userMessage.trim();

    // Prepare temporary context (last 4 messages)
    const recentHistory = contextHistory.slice(-4).map(m => ({
      role: m.role,
      content: m.content
    }));

    // Step 1: Try Server-side AI endpoint with tool-calling capabilities
    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: cleanQuery,
          history: recentHistory
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.content) {
          const assistantMsg: AiChatMessage = {
            id: `ai-msg-${Date.now()}`,
            role: 'assistant',
            content: data.content,
            timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            dataSources: data.dataSources || ['Base de Dados Firestore'],
            toolCalls: data.toolCalls,
            suggestedFollowUps: data.suggestedFollowUps || this.generateFollowUpSuggestions(cleanQuery)
          };
          this.messageHistory.push(assistantMsg);
          return assistantMsg;
        }
      }
    } catch (err) {
      console.warn('Backend AI endpoint unavailable, using local orchestrator engine:', err);
    }

    // Step 2: Local Intelligent Tool-Orchestrator (High reliability, exact math, zero hallucination)
    const localResult = await this.executeLocalOrchestration(cleanQuery, recentHistory);
    const executionTimeMs = Math.round(performance.now() - startTime);

    const assistantMsg: AiChatMessage = {
      id: `ai-msg-${Date.now()}`,
      role: 'assistant',
      content: localResult.content,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      dataSources: localResult.dataSources,
      toolCalls: localResult.toolCalls.map(tc => ({ ...tc, executionTimeMs })),
      suggestedFollowUps: localResult.suggestedFollowUps
    };

    this.messageHistory.push(assistantMsg);
    return assistantMsg;
  }

  /**
   * Local deterministic intent classifier & tool execution engine
   */
  private static async executeLocalOrchestration(
    query: string, 
    history: Array<{ role: string; content: string }>
  ): Promise<{
    content: string;
    toolCalls: AiToolCallRecord[];
    dataSources: string[];
    suggestedFollowUps: string[];
  }> {
    const q = query.toLowerCase();
    const toolCalls: AiToolCallRecord[] = [];
    const dataSources: string[] = [];

    // 1. Resumo Geral / "O que merece atenção" / Situação da olaria
    if (q.includes('resumo') || q.includes('situação') || q.includes('atenção') || q.includes('preciso saber') || q.includes('hoje')) {
      const dashTool = SystemToolsRegistry.tools.get_dashboard;
      const tStart = performance.now();
      const dashData = dashTool.handler({});
      toolCalls.push({
        toolName: 'get_dashboard',
        args: {},
        result: dashData,
        timestamp: new Date().toISOString(),
        executionTimeMs: Math.round(performance.now() - tStart)
      });
      dataSources.push('Painel Executivo Operacional');

      const finTool = SystemToolsRegistry.tools.get_financeiro_periodo;
      const finData = finTool.handler({});
      toolCalls.push({
        toolName: 'get_financeiro_periodo',
        args: {},
        result: finData,
        timestamp: new Date().toISOString(),
        executionTimeMs: Math.round(performance.now() - tStart)
      });
      dataSources.push('Módulo Financeiro & Contas');

      const stockTool = SystemToolsRegistry.tools.get_estoque_atual;
      const stockData = stockTool.handler({ onlyLowStock: true });
      toolCalls.push({
        toolName: 'get_estoque_atual',
        args: { onlyLowStock: true },
        result: stockData,
        timestamp: new Date().toISOString(),
        executionTimeMs: Math.round(performance.now() - tStart)
      });
      dataSources.push('Estoque de Peças e Insumos');

      let responseText = `### 📋 Resumo Executivo da Olaria do Zico\n\n`;
      responseText += `Aqui está o panorama completo da operação com base nos registros do sistema:\n\n`;
      responseText += `- **Vendas Acumuladas:** **R$ ${dashData.accumulated.totalRevenue.toFixed(2)}**\n`;
      responseText += `- **Saldo Operacional em Caixa:** **R$ ${dashData.accumulated.cashInBalance.toFixed(2)}**\n`;
      responseText += `- **Lotes em Produção/Fornos:** **${dashData.accumulated.inProductionBatchesCount} lote(s)**\n`;
      responseText += `- **Contas a Receber (Fiado):** **R$ ${dashData.accumulated.totalReceivablePending.toFixed(2)}**\n`;
      responseText += `- **Itens em Nível Crítico de Estoque:** **${dashData.accumulated.lowStockItemsCount} produto(s)**\n\n`;

      if (stockData.lowStockCount > 0) {
        responseText += `#### 🔴 Pontos de Atenção Imediata:\n`;
        responseText += `- Reposição prioritária necessária para: **${stockData.lowStockAlerts.map((a: any) => a.name).join(', ')}**.\n`;
      }
      if (finData.receivables.totalOverdue > 0) {
        responseText += `- Cobrança de **R$ ${finData.receivables.totalOverdue.toFixed(2)}** em títulos fiado vencidos.\n`;
      }

      responseText += `\n**Recomendação Estratégica:** Mantenha a cadência de queima nos fornos dos modelos com maior giro e ofereça incentivos para liquidação via Pix.`;

      return {
        content: responseText,
        toolCalls,
        dataSources,
        suggestedFollowUps: [
          'Compare este mês com o anterior',
          'Quais produtos tiveram maior saída?',
          'Como está a produção nos fornos?'
        ]
      };
    }

    // 2. Comparação de Períodos
    if (q.includes('compare') || q.includes('comparar') || q.includes('comparação') || q.includes('mês passado')) {
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const thisMonthEnd = now.toISOString().split('T')[0];

      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];

      const compTool = SystemToolsRegistry.tools.comparar_periodos;
      const tStart = performance.now();
      const compData = compTool.handler({
        period1Start: lastMonthStart,
        period1End: lastMonthEnd,
        period2Start: thisMonthStart,
        period2End: thisMonthEnd
      });

      toolCalls.push({
        toolName: 'comparar_periodos',
        args: { period1Start: lastMonthStart, period1End: lastMonthEnd, period2Start: thisMonthStart, period2End: thisMonthEnd },
        result: compData,
        timestamp: new Date().toISOString(),
        executionTimeMs: Math.round(performance.now() - tStart)
      });
      dataSources.push('Histórico Comparativo de Vendas e Produção');

      let responseText = `### ⚖️ Comparativo de Desempenho Operacional\n\n`;
      responseText += `Comparação calculada entre o **Mês Anterior** (${compData.period1.label}) e o **Mês Atual** (${compData.period2.label}):\n\n`;

      responseText += `| Indicador | Mês Anterior | Mês Atual | Variação Absoluta | Variação % |\n`;
      responseText += `| :--- | :--- | :--- | :--- | :--- |\n`;
      compData.comparisons.forEach((c: any) => {
        const sign = c.percentageChange >= 0 ? '+' : '';
        responseText += `| **${c.metric}** | ${c.period1Val} | ${c.period2Val} | ${c.absoluteDiff} | **${sign}${c.percentageChange}%** |\n`;
      });

      responseText += `\n**Interpretação Analítica:**\n`;
      responseText += `- O faturamento variou **${compData.comparisons[0].percentageChange >= 0 ? '+' : ''}${compData.comparisons[0].percentageChange}%** em relação ao período base.\n`;
      responseText += `- O volume de peças produzidas registrou variação de **${compData.comparisons[1].percentageChange >= 0 ? '+' : ''}${compData.comparisons[1].percentageChange}%**.\n`;

      return {
        content: responseText,
        toolCalls,
        dataSources,
        suggestedFollowUps: [
          'Quais produtos venderam mais neste período?',
          'Qual foi a taxa de perda nos fornos?',
          'Faça um resumo financeiro'
        ]
      };
    }

    // 3. Produção & Fornos
    if (q.includes('produção') || q.includes('produzi') || q.includes('forno') || q.includes('queima') || q.includes('lote') || q.includes('perda')) {
      const prodTool = SystemToolsRegistry.tools.get_producao_periodo;
      const tStart = performance.now();
      const prodData = prodTool.handler({});
      toolCalls.push({
        toolName: 'get_producao_periodo',
        args: {},
        result: prodData,
        timestamp: new Date().toISOString(),
        executionTimeMs: Math.round(performance.now() - tStart)
      });
      dataSources.push('Controle de Produção e Queima');

      let responseText = `### 🔥 Desempenho da Produção & Fornos\n\n`;
      responseText += `No período avaliado (${prodData.period.startDate} a ${prodData.period.endDate}), a olaria registrou os seguintes dados técnicos:\n\n`;
      responseText += `- **Total de Peças Produzidas:** **${prodData.totalProduced} unidades**\n`;
      responseText += `- **Peças Aprovadas (1ª Linha):** **${prodData.totalGood} unidades**\n`;
      responseText += `- **Perdas / Trincas no Forno:** **${prodData.totalLost} unidades**\n`;
      responseText += `- **Índice Médio de Perda na Queima:** **${prodData.lossRatePercent}%**\n`;
      responseText += `- **Lotes Ativos Monitorados:** **${prodData.totalBatches} lote(s)**\n\n`;

      if (prodData.batches.length > 0) {
        responseText += `#### Lotes Recentes nos Fornos:\n`;
        responseText += `| Código | Peça Cerâmica | Produzido | Perdas | Aprovado | Estágio |\n`;
        responseText += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;
        prodData.batches.slice(0, 5).forEach((b: any) => {
          responseText += `| ${b.code} | ${b.productName} | ${b.produced} un | ${b.lost} un | ${b.good} un | **${b.stage}** |\n`;
        });
      }

      responseText += `\n**Diagnóstico da IA:** A taxa de quebra de **${prodData.lossRatePercent}%** ${prodData.lossRatePercent <= 6 ? 'está em excelente patamar de controle térmico.' : 'exige atenção quanto à umidade da argila antes da entrada no forno.'}`;

      return {
        content: responseText,
        toolCalls,
        dataSources,
        suggestedFollowUps: [
          'Existe algum problema no estoque?',
          'Quais foram as vendas mais recentes?',
          'Gere um relatório de produção'
        ]
      };
    }

    // 4. Vendas & Faturamento & Melhores Produtos
    if (q.includes('venda') || q.includes('faturamento') || q.includes('saída') || q.includes('mais vendido') || q.includes('lucro') || q.includes('compraram')) {
      const salesTool = SystemToolsRegistry.tools.get_vendas_periodo;
      const tStart = performance.now();
      const salesData = salesTool.handler({});
      toolCalls.push({
        toolName: 'get_vendas_periodo',
        args: {},
        result: salesData,
        timestamp: new Date().toISOString(),
        executionTimeMs: Math.round(performance.now() - tStart)
      });
      dataSources.push('Módulo Comercial de Vendas');

      let responseText = `### 💰 Análise Comercial & Produtos com Maior Saída\n\n`;
      responseText += `Registros consolidados de vendas do período:\n\n`;
      responseText += `- **Faturamento Total:** **R$ ${salesData.totalRevenue.toFixed(2)}**\n`;
      responseText += `- **Total de Pedidos/Vendas:** **${salesData.totalSalesCount} transações**\n`;
      responseText += `- **Ticket Médio por Venda:** **R$ ${salesData.averageTicket.toFixed(2)}**\n`;
      responseText += `- **Recebido em Caixa:** **R$ ${salesData.totalPaid.toFixed(2)}**\n`;
      responseText += `- **Pendente a Receber (Fiado):** **R$ ${salesData.totalPending.toFixed(2)}**\n\n`;

      if (salesData.topProducts.length > 0) {
        responseText += `#### 🏆 Top Produtos em Vendas e Faturamento:\n`;
        responseText += `| Produto | Qtd Vendida | Faturamento Total |\n`;
        responseText += `| :--- | :--- | :--- |\n`;
        salesData.topProducts.slice(0, 5).forEach((p: any) => {
          responseText += `| **${p.productName}** | ${p.quantitySold} un | R$ ${p.revenue.toFixed(2)} |\n`;
        });
      }

      return {
        content: responseText,
        toolCalls,
        dataSources,
        suggestedFollowUps: [
          'Qual é o saldo devedor de fiado?',
          'Como está o estoque desses produtos?',
          'Gere o relatório de vendas completo'
        ]
      };
    }

    // 5. Matérias-Primas & Insumos Cerâmicos (Argila, Esmalte, Pigmento, Lenha, Areia)
    const isExplicitRawMaterial = q.includes('matéria prima') || 
                                  q.includes('materia prima') || 
                                  q.includes('matérias primas') || 
                                  q.includes('materias primas') || 
                                  q.includes('matéria-prima') || 
                                  q.includes('materia-prima') || 
                                  q.includes('matérias-primas') || 
                                  q.includes('materias-primas') || 
                                  q.includes('argila') || 
                                  q.includes('esmalte') || 
                                  q.includes('insumo') || 
                                  q.includes('insumos') || 
                                  q.includes('lenha') || 
                                  q.includes('areia');

    if (isExplicitRawMaterial) {
      const matTool = SystemToolsRegistry.tools.get_materias_primas;
      const tStart = performance.now();
      const matData = matTool.handler({});
      toolCalls.push({
        toolName: 'get_materias_primas',
        args: {},
        result: matData,
        timestamp: new Date().toISOString(),
        executionTimeMs: Math.round(performance.now() - tStart)
      });
      dataSources.push('Almoxarifado & Estoque de Matérias-Primas');

      let responseText = `### 🧱 Estoque de Matérias-Primas & Insumos\n\n`;
      responseText += `Aqui está a situação exata dos insumos e matérias-primas cadastrados na olaria:\n\n`;
      responseText += `- **Tipos de Insumos Cadastrados:** **${matData.totalMaterialTypes} item(ns)**\n`;
      responseText += `- **Valor Investido em Matéria-Prima:** **R$ ${matData.totalCostValuation.toFixed(2)}**\n`;
      responseText += `- **Insumos em Nível Crítico/Reposição:** **${matData.lowStockCount} item(ns)**\n\n`;

      if (matData.materials && matData.materials.length > 0) {
        responseText += `#### 📋 Detalhamento das Matérias-Primas em Estoque:\n`;
        responseText += `| Insumo / Matéria-Prima | Categoria | Quantidade Atual | Mínimo | Custo Unit. | Status |\n`;
        responseText += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;
        
        matData.materials.forEach((m: any) => {
          const statusBadge = m.isLowStock ? '⚠️ **Repor urgente**' : '✅ **Adequado**';
          const costStr = m.costPerUnit > 0 ? `R$ ${m.costPerUnit.toFixed(2)}/${m.unit}` : '-';
          responseText += `| **${m.name}** | ${m.category} | **${m.stockQuantity} ${m.unit}** | ${m.minStock} ${m.unit} | ${costStr} | ${statusBadge} |\n`;
        });
        
        if (matData.lowStockCount > 0) {
          responseText += `\n⚠️ **Alerta de Compra:** O estoque de **${matData.lowStockAlerts.map((a: any) => `${a.name} (${a.currentStock} ${a.unit})`).join(', ')}** atingiu o nível de segurança. Programe pedidos com fornecedores para não paralisar os fornos e a modelagem.`;
        } else {
          responseText += `\n✅ **Tudo em ordem:** Todas as matérias-primas estão com estoque acima do limite mínimo operacional.`;
        }
      } else {
        responseText += `ℹ️ *Nenhuma matéria-prima cadastrada no momento.* Acesse a aba **Estoque > Matérias-Primas** para cadastrar seus lotes de argila, esmaltes e lenha.`;
      }

      return {
        content: responseText,
        toolCalls,
        dataSources,
        suggestedFollowUps: [
          'Como está a produção nos fornos?',
          'Existe algum problema no estoque de peças?',
          'Gere o relatório de estoque'
        ]
      };
    }

    // 6. Estoque Geral de Peças & Produtos Acabados
    if (q.includes('estoque') || q.includes('pátio') || q.includes('patio') || q.includes('peça acabada') || q.includes('peças acabadas') || q.includes('falta') || q.includes('crítico')) {
      const stockTool = SystemToolsRegistry.tools.get_estoque_atual;
      const tStart = performance.now();
      const stockData = stockTool.handler({});
      toolCalls.push({
        toolName: 'get_estoque_atual',
        args: {},
        result: stockData,
        timestamp: new Date().toISOString(),
        executionTimeMs: Math.round(performance.now() - tStart)
      });
      dataSources.push('Inventário de Produtos & Pátio Cerâmico');

      let responseText = `### 📦 Diagnóstico do Estoque de Peças Cerâmicas\n\n`;
      responseText += `- **Modelos no Catálogo:** **${stockData.totalProductsInCatalog} peças**\n`;
      responseText += `- **Total de Peças em Pátio:** **${stockData.totalItemsInStock} unidades**\n`;
      responseText += `- **Valor Total de Venda do Estoque:** **R$ ${stockData.totalValuation.toFixed(2)}**\n`;
      responseText += `- **Peças em Alerta de Reposição:** **${stockData.lowStockCount} modelo(s)**\n\n`;

      if (stockData.lowStockAlerts.length > 0) {
        responseText += `#### ⚠️ Modelos com Estoque Crítico (<= Estoque Mínimo):\n`;
        responseText += `| Código | Produto | Estoque Atual | Estoque Mínimo | Preço Unit. |\n`;
        responseText += `| :--- | :--- | :--- | :--- | :--- |\n`;
        stockData.lowStockAlerts.forEach((a: any) => {
          responseText += `| ${a.code} | **${a.name}** | **${a.currentStock} un** | ${a.minStock} un | R$ ${a.price.toFixed(2)} |\n`;
        });
        responseText += `\n**Ação Sugerida:** Programar lote de queima nos fornos para os produtos listados acima para evitar ruptura de vendas no pátio.\n`;
      } else {
        responseText += `✅ **Situação Regular:** Todos os modelos de peças estão com estoque acima do limite mínimo de segurança.\n`;
      }

      return {
        content: responseText,
        toolCalls,
        dataSources,
        suggestedFollowUps: [
          'Como está a matéria-prima?',
          'Como está a produção nos fornos?',
          'Quais produtos estão vendendo mais?'
        ]
      };
    }

    // 6. Financeiro & Devedores / Fiado
    if (q.includes('financeiro') || q.includes('fiado') || q.includes('devedor') || q.includes('dívida') || q.includes('despesa') || q.includes('caixa') || q.includes('saldo')) {
      const finTool = SystemToolsRegistry.tools.get_financeiro_periodo;
      const tStart = performance.now();
      const finData = finTool.handler({});
      toolCalls.push({
        toolName: 'get_financeiro_periodo',
        args: {},
        result: finData,
        timestamp: new Date().toISOString(),
        executionTimeMs: Math.round(performance.now() - tStart)
      });
      dataSources.push('Gestão Financeira e Contas a Receber');

      let responseText = `### 💵 Visão Geral Financeira & Carteira de Fiado\n\n`;
      responseText += `- **Total Recebido em Caixa:** **R$ ${finData.totalCashIn.toFixed(2)}**\n`;
      responseText += `- **Despesas Pagas:** **R$ ${finData.expensesPaid.toFixed(2)}**\n`;
      responseText += `- **Saldo Operacional Líquido:** **R$ ${finData.netOperationalBalance.toFixed(2)}**\n`;
      responseText += `- **Total de Fiado a Receber:** **R$ ${finData.receivables.totalPending.toFixed(2)}**\n`;
      responseText += `- **Fiados Vencidos (Inadimplência):** **R$ ${finData.receivables.totalOverdue.toFixed(2)}** (${finData.receivables.overdueCount} títulos)\n\n`;

      if (finData.receivables.topDebtors.length > 0) {
        responseText += `#### 📋 Principais Clientes com Saldos Devedores:\n`;
        responseText += `| Cliente | Valor Devido | Vencimento | Status |\n`;
        responseText += `| :--- | :--- | :--- | :--- |\n`;
        finData.receivables.topDebtors.slice(0, 5).forEach((d: any) => {
          responseText += `| **${d.customerName}** | R$ ${d.amountDue.toFixed(2)} | ${d.dueDate} | ${d.status} |\n`;
        });
      }

      return {
        content: responseText,
        toolCalls,
        dataSources,
        suggestedFollowUps: [
          'Quais foram as vendas deste mês?',
          'Faça um resumo executivo',
          'Gere o relatório financeiro'
        ]
      };
    }

    // Default Fallback with Safe Contextual Answering
    const dashTool = SystemToolsRegistry.tools.get_dashboard;
    const tStart = performance.now();
    const dashData = dashTool.handler({});
    toolCalls.push({
      toolName: 'get_dashboard',
      args: {},
      result: dashData,
      timestamp: new Date().toISOString(),
      executionTimeMs: Math.round(performance.now() - tStart)
    });
    dataSources.push('Base Integrada da Olaria do Zico');

    return {
      content: `Entendi sua consulta sobre "${query}".\n\nCom base nos dados atuais da olaria, temos **${dashData.accumulated.totalActiveProducts} produtos** cadastrados, faturamento acumulado de **R$ ${dashData.accumulated.totalRevenue.toFixed(2)}**, saldo operacional em caixa de **R$ ${dashData.accumulated.cashInBalance.toFixed(2)}** e **${dashData.accumulated.inProductionBatchesCount} lote(s)** em andamento nos fornos.\n\nComo posso aprofundar esta análise para você?`,
      toolCalls,
      dataSources,
      suggestedFollowUps: SUGGESTED_QUESTIONS.slice(0, 3)
    };
  }

  private static generateFollowUpSuggestions(query: string): string[] {
    return [
      'Compare este mês com o anterior',
      'Quais produtos tiveram maior saída?',
      'O que merece minha atenção hoje?'
    ];
  }
}
