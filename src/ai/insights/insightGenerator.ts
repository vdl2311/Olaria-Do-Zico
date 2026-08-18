import { StorageService } from '../../services/storage';
import { OperationalInsight } from '../types/aiTypes';

export class InsightGenerator {
  public static generateInsights(): OperationalInsight[] {
    const insights: OperationalInsight[] = [];
    const products = StorageService.getProducts().filter(p => !p.softDeleted);
    const sales = StorageService.getSales().filter(s => !s.softDeleted && s.status !== 'Cancelada');
    const production = StorageService.getProduction().filter(p => !p.softDeleted);
    const receivables = StorageService.getReceivables().filter(r => !r.softDeleted && r.status !== 'Pago');
    const rawMaterials = StorageService.getRawMaterials().filter(r => !r.softDeleted);

    // Insight 1: Top Product Demand & Revenue Driver
    if (sales.length > 0) {
      const productSalesMap: Record<string, { qty: number; revenue: number }> = {};
      sales.forEach(s => {
        s.items.forEach(i => {
          if (!productSalesMap[i.productName]) productSalesMap[i.productName] = { qty: 0, revenue: 0 };
          productSalesMap[i.productName].qty += i.quantity;
          productSalesMap[i.productName].revenue += i.totalPrice;
        });
      });

      const topProducts = Object.entries(productSalesMap).sort((a, b) => b[1].revenue - a[1].revenue);
      if (topProducts.length > 0) {
        const [bestName, bestStats] = topProducts[0];
        const totalSalesRevenue = sales.reduce((acc, s) => acc + s.totalValue, 0);
        const sharePercent = (bestStats.revenue / Math.max(1, totalSalesRevenue)) * 100;

        insights.push({
          id: `ins-top-prod-${Date.now()}`,
          title: `Produto Campeão de Faturamento: ${bestName}`,
          description: `O modelo "${bestName}" é o maior gerador de receita da olaria, respondendo por ${sharePercent.toFixed(1)}% do faturamento total.`,
          type: 'CRESCIMENTO',
          category: 'vendas',
          metricName: 'Receita por Peça',
          currentValue: bestStats.revenue,
          percentageChange: Number(sharePercent.toFixed(1)),
          evidence: `${bestStats.qty} unidades vendidas totalizando R$ ${bestStats.revenue.toFixed(2)}.`,
          recommendation: `Mantenha estoque regulador de segurança para o modelo ${bestName} para não perder vendas por falta de produto.`,
          confidence: 0.96
        });
      }
    }

    // Insight 2: Stock Depletion & Supply Alert
    const lowStockItems = products.filter(p => p.stock <= p.minStock);
    if (lowStockItems.length > 0) {
      insights.push({
        id: `ins-stock-low-${Date.now()}`,
        title: `${lowStockItems.length} Itens em Nível Crítico de Estoque`,
        description: `Existem ${lowStockItems.length} modelos de vasos ou peças com estoque igual ou abaixo da reserva mínima.`,
        type: 'RISCO',
        category: 'estoque',
        metricName: 'Produtos em Alerta',
        currentValue: lowStockItems.length,
        evidence: `Itens em nível crítico: ${lowStockItems.slice(0, 3).map(p => `${p.name} (${p.stock}/${p.minStock} un)`).join(', ')}.`,
        recommendation: `Programar a modelagem e queima urgente dos itens com estoque abaixo do mínimo.`,
        confidence: 0.94
      });
    }

    // Insight 3: Kiln Efficiency & Loss Control
    if (production.length > 0) {
      const totalProduced = production.reduce((acc, b) => acc + b.quantityProduced, 0);
      const totalLost = production.reduce((acc, b) => acc + b.quantityLost, 0);
      const lossRate = totalProduced > 0 ? (totalLost / totalProduced) * 100 : 0;

      if (lossRate <= 5) {
        insights.push({
          id: `ins-prod-yield-${Date.now()}`,
          title: `Excelente Aproveitamento nos Fornos (${(100 - lossRate).toFixed(1)}% Úteis)`,
          description: `O índice de perdas na queima e acabamento está contido em apenas ${lossRate.toFixed(1)}%, demonstrando estabilidade na curva térmica dos fornos.`,
          type: 'OPORTUNIDADE',
          category: 'producao',
          metricName: 'Taxa de Peças Boas',
          currentValue: Number((100 - lossRate).toFixed(1)),
          evidence: `De ${totalProduced} peças produzidas, ${totalProduced - totalLost} foram aprovadas para comercialização.`,
          recommendation: `Padronize o tempo de forno e tipo de lenha/gás utilizado nesta fornada como procedimento operacional padrão.`,
          confidence: 0.92
        });
      } else {
        insights.push({
          id: `ins-prod-loss-high-${Date.now()}`,
          title: `Perdas na Queima Exigem Atenção (${lossRate.toFixed(1)}%)`,
          description: `As quebras no forno e secagem somaram ${totalLost} peças (${lossRate.toFixed(1)}% da produção).`,
          type: 'QUEDA',
          category: 'producao',
          metricName: 'Taxa de Perda',
          currentValue: Number(lossRate.toFixed(1)),
          evidence: `${totalLost} peças danificadas no forno em ${production.length} lotes analisados.`,
          recommendation: `Inspecione a homogeneidade da massa de argila e aumente o tempo de secagem natural antes do forno.`,
          confidence: 0.91
        });
      }
    }

    // Insight 4: Fiado vs Pix Liquidity Analysis
    const totalReceivablePending = receivables.reduce((acc, r) => acc + (r.amount - r.amountPaid), 0);
    const totalSalesRev = sales.reduce((acc, s) => acc + s.totalValue, 0);
    const fiadoRatio = totalSalesRev > 0 ? (totalReceivablePending / totalSalesRev) * 100 : 0;

    if (totalReceivablePending > 0) {
      insights.push({
        id: `ins-fin-receivable-${Date.now()}`,
        title: `R$ ${totalReceivablePending.toFixed(2)} Pendentes em Contas a Receber`,
        description: `O volume de pagamentos fiado/a prazo representa ${fiadoRatio.toFixed(1)}% do faturamento da olaria.`,
        type: fiadoRatio > 35 ? 'RISCO' : 'TENDENCIA',
        category: 'financeiro',
        metricName: 'Fiado a Receber',
        currentValue: totalReceivablePending,
        percentageChange: Number(fiadoRatio.toFixed(1)),
        evidence: `${receivables.length} registro(s) de cobrança em aberto com clientes.`,
        recommendation: `Incentive pagamentos via Pix com descontos pontuais de 5% a 7% para acelerar a liquidez do caixa.`,
        confidence: 0.90
      });
    }

    return insights;
  }
}
