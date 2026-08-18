import { StorageService } from '../../services/storage';
import { AIReportStructure, ReportType } from '../types/aiTypes';
import { SystemToolsRegistry } from '../tools/systemTools';

export class AIReportEngine {
  public static generateReport(type: ReportType, customStartDate?: string, customEndDate?: string): AIReportStructure {
    const now = new Date();
    let startDate = customStartDate;
    let endDate = customEndDate || now.toISOString().split('T')[0];

    // Determine default dates if not provided
    if (!startDate) {
      const d = new Date();
      if (type === 'DIARIO') {
        startDate = endDate;
      } else if (type === 'SEMANAL') {
        d.setDate(d.getDate() - 7);
        startDate = d.toISOString().split('T')[0];
      } else if (type === 'MENSAL' || type === 'EXECUTIVO') {
        d.setDate(d.getDate() - 30);
        startDate = d.toISOString().split('T')[0];
      } else {
        d.setDate(d.getDate() - 30);
        startDate = d.toISOString().split('T')[0];
      }
    }

    const periodLabel = `${new Date(startDate + 'T12:00:00').toLocaleDateString('pt-BR')} até ${new Date(endDate + 'T12:00:00').toLocaleDateString('pt-BR')}`;

    const salesData = SystemToolsRegistry.tools.get_vendas_periodo.handler({ startDate, endDate });
    const prodData = SystemToolsRegistry.tools.get_producao_periodo.handler({ startDate, endDate });
    const stockData = SystemToolsRegistry.tools.get_estoque_atual.handler({});
    const finData = SystemToolsRegistry.tools.get_financeiro_periodo.handler({ startDate, endDate });

    const reportId = `rep-${type.toLowerCase()}-${Date.now()}`;
    const generatedAt = now.toLocaleString('pt-BR');

    switch (type) {
      case 'DIARIO':
      case 'SEMANAL':
      case 'MENSAL':
      case 'EXECUTIVO': {
        const title = type === 'DIARIO' 
          ? `Relatório Operacional Diário - ${periodLabel}`
          : type === 'SEMANAL' 
            ? `Relatório Gerencial Semanal - ${periodLabel}`
            : type === 'MENSAL'
              ? `Relatório Mensal de Desempenho - ${periodLabel}`
              : `Relatório Executivo Integrado - ${periodLabel}`;

        return {
          id: reportId,
          title,
          reportType: type,
          generatedAt,
          period: { startDate, endDate, label: periodLabel },
          resumo: `No período de ${periodLabel}, a Olaria do Zico registrou R$ ${salesData.totalRevenue.toFixed(2)} em faturamento bruto (${salesData.totalSalesCount} vendas) e produziu ${prodData.totalProduced} peças cerâmicas com taxa de quebra de ${prodData.lossRatePercent}%. O fluxo financeiro encerrou com saldo operacional líquido de R$ ${finData.netOperationalBalance.toFixed(2)}.`,
          indicadores: [
            { label: 'Faturamento Bruto', value: `R$ ${salesData.totalRevenue.toFixed(2)}`, trend: 'up' },
            { label: 'Ticket Médio', value: `R$ ${salesData.averageTicket.toFixed(2)}` },
            { label: 'Peças Produzidas', value: `${prodData.totalProduced} un` },
            { label: 'Perda na Queima', value: `${prodData.lossRatePercent}%`, trend: prodData.lossRatePercent > 7 ? 'down' : 'up' },
            { label: 'Estoque Disponível', value: `${stockData.totalItemsInStock} un` },
            { label: 'Saldo Líquido', value: `R$ ${finData.netOperationalBalance.toFixed(2)}`, trend: finData.netOperationalBalance >= 0 ? 'up' : 'down' }
          ],
          comparacoes: [
            {
              metric: 'Vendas Totais vs Recebimento em Caixa',
              previousValue: `R$ ${salesData.totalRevenue.toFixed(2)}`,
              currentValue: `R$ ${salesData.totalPaid.toFixed(2)}`,
              absoluteDifference: `R$ ${salesData.totalPending.toFixed(2)}`,
              percentageDifference: salesData.totalRevenue > 0 ? Number(((salesData.totalPaid / salesData.totalRevenue) * 100).toFixed(1)) : 100,
              interpretation: `${salesData.totalRevenue > 0 ? ((salesData.totalPaid / salesData.totalRevenue) * 100).toFixed(1) : 100}% do faturamento foi liquidado à vista/Pix, com R$ ${salesData.totalPending.toFixed(2)} pendentes em fiado.`
            },
            {
              metric: 'Peças Planejadas vs Peças Aprovadas',
              previousValue: `${prodData.totalPlanned} un`,
              currentValue: `${prodData.totalGood} un`,
              absoluteDifference: `${prodData.totalPlanned - prodData.totalGood} un`,
              percentageDifference: prodData.totalPlanned > 0 ? Number(((prodData.totalGood / prodData.totalPlanned) * 100).toFixed(1)) : 100,
              interpretation: `Aproveitamento de ${prodData.totalPlanned > 0 ? ((prodData.totalGood / prodData.totalPlanned) * 100).toFixed(1) : 100}% da capacidade planejada das fornadas.`
            }
          ],
          tendencias: [
            `Demanda concentrada nos modelos: ${salesData.topProducts.slice(0, 3).map((p: any) => p.productName).join(', ') || 'Vasos Terracota'}.`,
            `Meios de pagamento instantâneos (Pix) mantêm liquidez regular nas vendas diárias.`,
            `Índice de perda nos fornos dentro do padrão técnico para cerâmica artesanal.`
          ],
          problemas: [
            stockData.lowStockCount > 0 ? `${stockData.lowStockCount} produto(s) abaixo da margem mínima de segurança.` : 'Estoque operando sem rupturas.',
            finData.receivables.totalOverdue > 0 ? `R$ ${finData.receivables.totalOverdue.toFixed(2)} em fiados vencidos aguardando recebimento.` : 'Zero inadimplência de fiados no período.'
          ],
          oportunidades: [
            `Aproveitar boa saída dos modelos campeões para produzir lotes antecipados.`,
            `Expandir vendas consignadas para novos paisagistas e floriculturas parceiras.`
          ],
          recomendacoes: [
            `Priorizar a queima dos itens com estoque crítico no próximo ciclo.`,
            `Realizar contato ativo com clientes que possuem títulos a vencer nesta semana.`,
            `Inspecionar temperatura e tempo de forno para manter a taxa de perdas abaixo de 5%.`
          ],
          tabularData: {
            headers: ['Código/Data', 'Descrição / Operação', 'Cliente / Produto', 'Valor / Quantidade', 'Status'],
            rows: salesData.salesSummary.slice(0, 10).map((s: any) => [
              s.code,
              s.itemNames,
              s.customerName,
              `R$ ${s.totalValue.toFixed(2)}`,
              s.status
            ])
          }
        };
      }

      case 'VENDAS': {
        return {
          id: reportId,
          title: `Relatório Especializado de Vendas e Faturamento - ${periodLabel}`,
          reportType: 'VENDAS',
          generatedAt,
          period: { startDate, endDate, label: periodLabel },
          resumo: `Análise detalhada do desempenho comercial da Olaria do Zico. Foram concretizadas ${salesData.totalSalesCount} vendas no montante de R$ ${salesData.totalRevenue.toFixed(2)}, com ticket médio de R$ ${salesData.averageTicket.toFixed(2)}.`,
          indicadores: [
            { label: 'Faturamento Bruto', value: `R$ ${salesData.totalRevenue.toFixed(2)}`, trend: 'up' },
            { label: 'Total Recebido em Caixa', value: `R$ ${salesData.totalPaid.toFixed(2)}` },
            { label: 'Total a Receber (Fiado)', value: `R$ ${salesData.totalPending.toFixed(2)}` },
            { label: 'Ticket Médio por Venda', value: `R$ ${salesData.averageTicket.toFixed(2)}` }
          ],
          comparacoes: [
            {
              metric: 'Pagamento à Vista vs Fiado',
              previousValue: `R$ ${salesData.totalPaid.toFixed(2)} (À vista/Pix)`,
              currentValue: `R$ ${salesData.totalPending.toFixed(2)} (Fiado)`,
              absoluteDifference: `R$ ${(salesData.totalPaid - salesData.totalPending).toFixed(2)}`,
              percentageDifference: salesData.totalRevenue > 0 ? Number(((salesData.totalPaid / salesData.totalRevenue) * 100).toFixed(1)) : 100,
              interpretation: `Predomínio de recebimento à vista (${salesData.totalRevenue > 0 ? ((salesData.totalPaid / salesData.totalRevenue) * 100).toFixed(1) : 100}% do total).`
            }
          ],
          tendencias: [
            `Maior volume de faturamento concentrado nos finais de semana e compras para projetos paisagísticos.`,
            `Produtos de maior valor agregado (Fontes e Vasos Bojudos Grandes) impulsionam o ticket médio.`
          ],
          problemas: [
            salesData.totalPending > 0 ? `R$ ${salesData.totalPending.toFixed(2)} em crédito concedido a clientes que demandam controle de vencimento.` : 'Nenhum fiado pendente.'
          ],
          oportunidades: [
            `Criar combos de vasos de diferentes tamanhos com desconto progressivo no Pix.`,
            `Oferecer entrega agendada para compras acima de R$ 500,00.`
          ],
          recomendacoes: [
            `Manter registro rigoroso de todos os pedidos especiais e prazos de entrega acordados.`,
            `Enviar catálogo digital atualizado para arquitetos cadastrados no início de cada mês.`
          ],
          tabularData: {
            headers: ['Produto Mais Vendido', 'Unidades Vendidas', 'Receita Total Gerada'],
            rows: salesData.topProducts.map((p: any) => [
              p.productName,
              `${p.quantitySold} un`,
              `R$ ${p.revenue.toFixed(2)}`
            ])
          }
        };
      }

      case 'PRODUCAO': {
        return {
          id: reportId,
          title: `Relatório de Produção e Fornos Cerâmicos - ${periodLabel}`,
          reportType: 'PRODUCAO',
          generatedAt,
          period: { startDate, endDate, label: periodLabel },
          resumo: `Relatório técnico de produção fabril. Foram monitorados ${prodData.totalBatches} lotes, resultando em ${prodData.totalProduced} peças cerâmicas confeccionadas, com ${prodData.totalGood} aprovadas e ${prodData.totalLost} descartadas na queima (${prodData.lossRatePercent}% de perda).`,
          indicadores: [
            { label: 'Total Produzido', value: `${prodData.totalProduced} un` },
            { label: 'Peças Aprovadas', value: `${prodData.totalGood} un`, trend: 'up' },
            { label: 'Perdas no Forno', value: `${prodData.totalLost} un`, trend: prodData.totalLost > 10 ? 'down' : 'neutral' },
            { label: 'Taxa de Perda', value: `${prodData.lossRatePercent}%` }
          ],
          comparacoes: [
            {
              metric: 'Planejamento vs Peças Entregues',
              previousValue: `${prodData.totalPlanned} un`,
              currentValue: `${prodData.totalGood} un`,
              absoluteDifference: `${prodData.totalPlanned - prodData.totalGood} un`,
              percentageDifference: prodData.totalPlanned > 0 ? Number(((prodData.totalGood / prodData.totalPlanned) * 100).toFixed(1)) : 100,
              interpretation: `Eficiência global de fornada de ${prodData.totalPlanned > 0 ? ((prodData.totalGood / prodData.totalPlanned) * 100).toFixed(1) : 100}%.`
            }
          ],
          tendencias: [
            `Lotes de vasos médios apresentam menor índice de quebra em comparação a bacias largas.`,
            `Tempo de cura e secagem natural reduz trincas em até 40% durante a queima inicial de biscoito.`
          ],
          problemas: [
            prodData.totalLost > 0 ? `${prodData.totalLost} peças danificadas na queima representam custo de argila e tempo de forno.` : 'Nenhuma perda registrada.'
          ],
          oportunidades: [
            `Aproveitar cacos e peças trincadas moídas como chamote para novas massas cerâmicas rústicas.`
          ],
          recomendacoes: [
            `Controlar a rampa de aquecimento dos primeiros 300°C nos fornos para evitar choques térmicos.`,
            `Garantir espessura de parede uniforme nos vasos modelados no torno manual.`
          ],
          tabularData: {
            headers: ['Lote', 'Peça', 'Produzido', 'Perdas', 'Aprovado', 'Estágio'],
            rows: prodData.batches.map((b: any) => [
              b.code,
              b.productName,
              `${b.produced} un`,
              `${b.lost} un`,
              `${b.good} un`,
              b.stage
            ])
          }
        };
      }

      case 'ESTOQUE': {
        return {
          id: reportId,
          title: `Relatório de Estoque e Matérias-Primas - ${periodLabel}`,
          reportType: 'ESTOQUE',
          generatedAt,
          period: { startDate, endDate, label: periodLabel },
          resumo: `Inventário de peças prontas e insumos. O catálogo possui ${stockData.totalProductsInCatalog} modelos com ${stockData.totalItemsInStock} unidades no pátio avaliadas em R$ ${stockData.totalValuation.toFixed(2)}. Foram detectados ${stockData.lowStockCount} produtos com necessidade de reposição.`,
          indicadores: [
            { label: 'Peças em Estoque', value: `${stockData.totalItemsInStock} un` },
            { label: 'Valor de Venda Total', value: `R$ ${stockData.totalValuation.toFixed(2)}`, trend: 'up' },
            { label: 'Custo Estimado Imobilizado', value: `R$ ${stockData.totalEstimatedCost.toFixed(2)}` },
            { label: 'Modelos em Estoque Baixo', value: `${stockData.lowStockCount} un`, trend: stockData.lowStockCount > 0 ? 'down' : 'up' }
          ],
          comparacoes: [
            {
              metric: 'Valor de Venda vs Custo Estimado',
              previousValue: `R$ ${stockData.totalEstimatedCost.toFixed(2)}`,
              currentValue: `R$ ${stockData.totalValuation.toFixed(2)}`,
              absoluteDifference: `R$ ${(stockData.totalValuation - stockData.totalEstimatedCost).toFixed(2)}`,
              percentageDifference: stockData.totalEstimatedCost > 0 ? Number((((stockData.totalValuation - stockData.totalEstimatedCost) / stockData.totalEstimatedCost) * 100).toFixed(1)) : 150,
              interpretation: `Margem potencial de contribuição do estoque avaliada em R$ ${(stockData.totalValuation - stockData.totalEstimatedCost).toFixed(2)}.`
            }
          ],
          tendencias: [
            `Alta rotatividade de vasos terracota naturais de porte médio e jardineiras retangulares.`,
            `Estoque de matéria-prima (argila e pigmentos) supre os próximos ciclos de queima.`
          ],
          problemas: [
            stockData.lowStockCount > 0 ? `${stockData.lowStockCount} modelo(s) correm risco de falta imediata no showroom.` : 'Sem produtos em nível crítico.'
          ],
          oportunidades: [
            `Produzir em maior escala os modelos de maior margem com baixa perda de forno.`
          ],
          recomendacoes: [
            `Programar a reposição prioritária dos itens com estoque abaixo do mínimo.`,
            `Manter estoque de segurança de argila tratada para períodos chuvosos.`
          ],
          tabularData: {
            headers: ['Código', 'Produto', 'Categoria', 'Estoque Atual', 'Estoque Mínimo', 'Preço Unitário'],
            rows: stockData.products.slice(0, 15).map((p: any) => [
              p.code,
              p.name,
              p.category,
              `${p.stock} un`,
              `${p.minStock} un`,
              `R$ ${p.price.toFixed(2)}`
            ])
          }
        };
      }

      case 'FINANCEIRO': {
        return {
          id: reportId,
          title: `Relatório Financeiro e Fluxo de Caixa - ${periodLabel}`,
          reportType: 'FINANCEIRO',
          generatedAt,
          period: { startDate, endDate, label: periodLabel },
          resumo: `Demonstrativo financeiro operacional. No período analisado, o total de entradas somou R$ ${finData.totalCashIn.toFixed(2)}, contra R$ ${finData.expensesPaid.toFixed(2)} de despesas operacionais pagas, resultando em saldo líquido positivo de R$ ${finData.netOperationalBalance.toFixed(2)}. Contas a receber totalizam R$ ${finData.receivables.totalPending.toFixed(2)}.`,
          indicadores: [
            { label: 'Entradas em Caixa', value: `R$ ${finData.totalCashIn.toFixed(2)}`, trend: 'up' },
            { label: 'Despesas Pagas', value: `R$ ${finData.expensesPaid.toFixed(2)}` },
            { label: 'Despesas Pendentes', value: `R$ ${finData.expensesPending.toFixed(2)}` },
            { label: 'Saldo Operacional Líquido', value: `R$ ${finData.netOperationalBalance.toFixed(2)}`, trend: finData.netOperationalBalance >= 0 ? 'up' : 'down' },
            { label: 'Fiado a Receber', value: `R$ ${finData.receivables.totalPending.toFixed(2)}` }
          ],
          comparacoes: [
            {
              metric: 'Receitas Recebidas vs Despesas Pagas',
              previousValue: `R$ ${finData.expensesPaid.toFixed(2)}`,
              currentValue: `R$ ${finData.totalCashIn.toFixed(2)}`,
              absoluteDifference: `R$ ${finData.netOperationalBalance.toFixed(2)}`,
              percentageDifference: finData.expensesPaid > 0 ? Number(((finData.totalCashIn / finData.expensesPaid) * 100).toFixed(1)) : 100,
              interpretation: `Cobertura de ${finData.expensesPaid > 0 ? ((finData.totalCashIn / finData.expensesPaid) * 100).toFixed(1) : 100}% das despesas correntes da olaria.`
            }
          ],
          tendencias: [
            `Despesas fixas concentradas em energia elétrica dos fornos, combustível de entregas e argila.`,
            `Controle rigoroso de prazos de recebimento assegura fluxo de caixa saudável.`
          ],
          problemas: [
            finData.receivables.totalOverdue > 0 ? `R$ ${finData.receivables.totalOverdue.toFixed(2)} em fiados vencidos demandam contato imediato.` : 'Títulos a receber em dia.'
          ],
          oportunidades: [
            `Oferecer condições diferenciadas para quitação antecipada de saldos devedores.`
          ],
          recomendacoes: [
            `Provisionar valor das despesas com energia e manutenção dos fornos com antecedência.`,
            `Manter limite prudencial de crédito fiado por cliente individual.`
          ],
          tabularData: {
            headers: ['Cliente Devedor', 'Valor Pendente', 'Data de Vencimento', 'Status'],
            rows: finData.receivables.topDebtors.map((d: any) => [
              d.customerName,
              `R$ ${d.amountDue.toFixed(2)}`,
              d.dueDate,
              d.status
            ])
          }
        };
      }
    }
  }
}
