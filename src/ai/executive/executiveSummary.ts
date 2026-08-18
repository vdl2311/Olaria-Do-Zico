import { StorageService } from '../../services/storage';
import { ExecutiveSummaryData, OperationalHealthScore } from '../types/aiTypes';
import { AlertEngine } from '../alerts/alertEngine';
import { InsightGenerator } from '../insights/insightGenerator';

export class ExecutiveSummaryEngine {
  public static generateSummary(): ExecutiveSummaryData {
    const products = StorageService.getProducts().filter(p => !p.softDeleted);
    const sales = StorageService.getSales().filter(s => !s.softDeleted && s.status !== 'Cancelada');
    const production = StorageService.getProduction().filter(p => !p.softDeleted);
    const receivables = StorageService.getReceivables().filter(r => !r.softDeleted && r.status !== 'Pago');
    const expenses = StorageService.getExpenses().filter(e => !e.softDeleted);
    const deliveries = StorageService.getDeliveries().filter(d => !d.softDeleted);

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // 1. Produção
    const totalProduced = production.reduce((acc, b) => acc + b.quantityProduced, 0);
    const totalLost = production.reduce((acc, b) => acc + b.quantityLost, 0);
    const activeBatches = production.filter(b => b.stage !== 'Pronto').length;
    const lossRate = totalProduced > 0 ? (totalLost / totalProduced) * 100 : 0;

    const prodByItem: Record<string, number> = {};
    production.forEach(b => {
      prodByItem[b.productName] = (prodByItem[b.productName] || 0) + b.quantityProduced;
    });
    const topProducedEntry = Object.entries(prodByItem).sort((a, b) => b[1] - a[1])[0];
    const topProducedProduct = topProducedEntry ? topProducedEntry[0] : 'Vasos Cerâmicos';

    // 2. Vendas
    const totalRevenue = sales.reduce((acc, s) => acc + s.totalValue, 0);
    const salesCount = sales.length;
    const averageTicket = salesCount > 0 ? totalRevenue / salesCount : 0;
    const pixSales = sales.filter(s => s.paymentMethod === 'Pix').reduce((acc, s) => acc + s.totalValue, 0);
    const fiadoSales = sales.filter(s => s.paymentMethod === 'Fiado' || s.pendingValue > 0).reduce((acc, s) => acc + s.pendingValue, 0);
    const pixPercent = totalRevenue > 0 ? (pixSales / totalRevenue) * 100 : 0;
    const fiadoPercent = totalRevenue > 0 ? (fiadoSales / totalRevenue) * 100 : 0;

    const salesByItem: Record<string, number> = {};
    sales.forEach(s => {
      s.items.forEach(i => {
        salesByItem[i.productName] = (salesByItem[i.productName] || 0) + i.quantity;
      });
    });
    const topSellingEntry = Object.entries(salesByItem).sort((a, b) => b[1] - a[1])[0];
    const topSellingProduct = topSellingEntry ? topSellingEntry[0] : 'Vaso Terracota Bojudo';

    // 3. Estoque
    const totalItems = products.reduce((acc, p) => acc + p.stock, 0);
    const totalValuation = products.reduce((acc, p) => acc + (p.stock * p.price), 0);
    const lowStockProducts = products.filter(p => p.stock <= p.minStock);

    // 4. Financeiro
    const totalReceived = sales.reduce((acc, s) => acc + s.paidValue, 0);
    const totalReceivablePending = receivables.reduce((acc, r) => acc + (r.amount - r.amountPaid), 0);
    const totalExpensesPaid = expenses.filter(e => e.status === 'Paga').reduce((acc, e) => acc + e.amount, 0);
    const totalExpensesPending = expenses.filter(e => e.status === 'Pendente').reduce((acc, e) => acc + e.amount, 0);
    const netCashFlow = totalReceived - totalExpensesPaid;
    const overdueReceivables = receivables.filter(r => r.dueDate < todayStr);
    const overdueAmount = overdueReceivables.reduce((acc, r) => acc + (r.amount - r.amountPaid), 0);
    const defaultRatePercent = totalReceivablePending > 0 ? (overdueAmount / totalReceivablePending) * 100 : 0;

    // 5. Health Score Calculation (0 to 100)
    let prodScore = Math.max(0, 100 - (lossRate * 4));
    let stockScore = products.length > 0 ? Math.max(0, 100 - ((lowStockProducts.length / products.length) * 100)) : 80;
    let finScore = Math.max(0, 100 - (defaultRatePercent * 0.8));
    if (netCashFlow < 0) finScore = Math.max(0, finScore - 20);
    let delivScore = 95;
    const lateDeliveries = deliveries.filter(d => d.status !== 'Entregue' && d.deliveryDate < todayStr);
    if (lateDeliveries.length > 0) delivScore = Math.max(50, 95 - lateDeliveries.length * 15);

    const overallScore = Math.round((prodScore * 0.3) + (stockScore * 0.25) + (finScore * 0.3) + (delivScore * 0.15));

    let healthStatus: OperationalHealthScore['status'] = 'EXCELENTE';
    if (overallScore < 60) healthStatus = 'CRITICO';
    else if (overallScore < 75) healthStatus = 'ATENCAO';
    else if (overallScore < 90) healthStatus = 'ESTAVEL';

    const highlights: string[] = [];
    const warnings: string[] = [];

    if (totalRevenue > 0) highlights.push(`Faturamento total acumulado em R$ ${totalRevenue.toFixed(2)}.`);
    if (lossRate <= 5) highlights.push(`Índice de quebra nos fornos controlado em ${lossRate.toFixed(1)}%.`);
    if (netCashFlow > 0) highlights.push(`Fluxo operacional líquido positivo em R$ ${netCashFlow.toFixed(2)}.`);

    if (lowStockProducts.length > 0) warnings.push(`${lowStockProducts.length} produto(s) com estoque em nível mínimo ou esgotado.`);
    if (overdueAmount > 0) warnings.push(`R$ ${overdueAmount.toFixed(2)} em fiados vencidos aguardando recebimento.`);
    if (activeBatches > 0) highlights.push(`${activeBatches} lote(s) atualmente em produção/secagem/forno.`);

    const health: OperationalHealthScore = {
      score: overallScore,
      status: healthStatus,
      productionScore: Math.round(prodScore),
      stockScore: Math.round(stockScore),
      financialScore: Math.round(finScore),
      deliveryScore: Math.round(delivScore),
      highlights,
      warnings
    };

    // Alerts & Insights
    const alerts = AlertEngine.generateAlerts();
    const insights = InsightGenerator.generateInsights();

    const atencao = alerts.filter(a => a.priority === 'ATENCAO').map(a => `${a.title}: ${a.recommendedAction}`);
    const oportunidades = insights.filter(i => i.type === 'OPORTUNIDADE' || i.type === 'CRESCIMENTO').map(i => `${i.title}: ${i.recommendation}`);

    const recomendacoesImediatas = [
      lowStockProducts.length > 0 ? `Repor ${lowStockProducts.slice(0, 2).map(p => p.name).join(' e ')} no próximo ciclo de queima.` : 'Estoque de produtos acabado está equilibrado.',
      overdueAmount > 0 ? `Realizar cobrança amigável de R$ ${overdueAmount.toFixed(2)} vencidos.` : 'Carteira de contas a receber em dia.',
      'Manter monitoramento contínuo da temperatura dos fornos.'
    ];

    return {
      generatedAt: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      periodLabel: `Hoje, ${now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}`,
      health,
      producao: {
        totalProduced,
        totalLost,
        lossRatePercent: Number(lossRate.toFixed(1)),
        activeBatches,
        topProducedProduct,
        summaryText: `Produção operando com ${activeBatches} lotes em andamento e taxa média de perda de ${lossRate.toFixed(1)}%. Modelo mais produzido: ${topProducedProduct}.`
      },
      vendas: {
        totalRevenue,
        salesCount,
        averageTicket: Number(averageTicket.toFixed(2)),
        topSellingProduct,
        pixPercent: Number(pixPercent.toFixed(1)),
        fiadoPercent: Number(fiadoPercent.toFixed(1)),
        summaryText: `Total de R$ ${totalRevenue.toFixed(2)} em ${salesCount} vendas (Ticket Médio: R$ ${averageTicket.toFixed(2)}). Produto líder: ${topSellingProduct}.`
      },
      estoque: {
        totalItems,
        totalValuation,
        lowStockCount: lowStockProducts.length,
        criticalProducts: lowStockProducts.map(p => p.name),
        summaryText: `${totalItems} peças no pátio avaliadas em R$ ${totalValuation.toFixed(2)}. ${lowStockProducts.length} itens requerem reposição.`
      },
      financeiro: {
        netCashFlow,
        totalReceived,
        totalReceivablePending,
        totalExpensesPaid,
        totalExpensesPending,
        defaultRatePercent: Number(defaultRatePercent.toFixed(1)),
        summaryText: `Saldo operacional líquido de R$ ${netCashFlow.toFixed(2)} (Recebido: R$ ${totalReceived.toFixed(2)} | Despesas: R$ ${totalExpensesPaid.toFixed(2)} | Fiado Pendente: R$ ${totalReceivablePending.toFixed(2)}).`
      },
      atencao: atencao.length > 0 ? atencao : ['Nenhum ponto crítico de atenção no momento. Operação estável.'],
      oportunidades: oportunidades.length > 0 ? oportunidades : ['Manter ritmo de divulgação para novos clientes e decoradores.'],
      recomendacoesImediatas
    };
  }
}
