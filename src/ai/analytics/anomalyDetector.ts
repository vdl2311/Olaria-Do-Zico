import { StorageService } from '../../services/storage';
import { AnomalyDetectionResult } from '../types/aiTypes';

export class AnomalyDetector {
  public static detectAnomalies(): AnomalyDetectionResult[] {
    const results: AnomalyDetectionResult[] = [];
    const now = new Date().toISOString();

    const production = StorageService.getProduction().filter(p => !p.softDeleted);
    const products = StorageService.getProducts().filter(p => !p.softDeleted);
    const sales = StorageService.getSales().filter(s => !s.softDeleted && s.status !== 'Cancelada');
    const receivables = StorageService.getReceivables().filter(r => !r.softDeleted && r.status !== 'Pago');
    const expenses = StorageService.getExpenses().filter(e => !e.softDeleted);

    // 1. Anomalia em Perdas na Queima (Fornos)
    if (production.length >= 3) {
      const lossRates = production.map(b => b.quantityProduced > 0 ? (b.quantityLost / b.quantityProduced) * 100 : 0);
      const avgLossRate = lossRates.reduce((a, b) => a + b, 0) / lossRates.length;
      const recentBatches = production.slice(0, 5);
      const recentLossRate = recentBatches.reduce((acc, b) => acc + b.quantityLost, 0) / Math.max(1, recentBatches.reduce((acc, b) => acc + b.quantityProduced, 0)) * 100;

      if (recentLossRate > avgLossRate * 1.6 && recentLossRate > 8) {
        results.push({
          id: `anom-loss-${Date.now()}`,
          detectedAt: now,
          metric: 'Taxa de Perda / Trinca na Queima',
          module: 'producao',
          observedValue: Number(recentLossRate.toFixed(1)),
          expectedRange: { min: 0, max: Number((avgLossRate * 1.2).toFixed(1)), mean: Number(avgLossRate.toFixed(1)) },
          severity: recentLossRate > 15 ? 'ALTA' : 'MEDIA',
          quantitativeExplanation: `A taxa de quebra nos últimos lotes atingiu ${recentLossRate.toFixed(1)}%, ultrapassando a média histórica da olaria de ${avgLossRate.toFixed(1)}%.`,
          evidence: `Lotes recentes registraram perda concentrada de peças no estágio de queima a lenha/gás.`,
          suggestedMitigation: 'Verificar a curva de temperatura do forno e tempo de secagem prévia da argila antes da queima de biscoito/esmalte.'
        });
      }
    }

    // 2. Anomalia de Concentração de Risco de Crédito (Fiado)
    if (receivables.length > 0) {
      const totalReceivable = receivables.reduce((acc, r) => acc + (r.amount - r.amountPaid), 0);
      const debtorTotals: Record<string, number> = {};
      receivables.forEach(r => {
        const debt = r.amount - r.amountPaid;
        debtorTotals[r.customerName] = (debtorTotals[r.customerName] || 0) + debt;
      });

      const topDebtors = Object.entries(debtorTotals).sort((a, b) => b[1] - a[1]);
      if (topDebtors.length > 0 && totalReceivable > 500) {
        const [topName, topAmount] = topDebtors[0];
        const concentrationPercent = (topAmount / totalReceivable) * 100;

        if (concentrationPercent > 45) {
          results.push({
            id: `anom-credit-${Date.now()}`,
            detectedAt: now,
            metric: 'Concentração de Fiado por Cliente',
            module: 'financeiro',
            observedValue: Number(concentrationPercent.toFixed(1)),
            expectedRange: { min: 0, max: 30, mean: 15 },
            severity: concentrationPercent > 60 ? 'ALTA' : 'MEDIA',
            quantitativeExplanation: `O cliente "${topName}" concentra ${concentrationPercent.toFixed(1)}% de todo o fiado a receber da olaria (R$ ${topAmount.toFixed(2)} de R$ ${totalReceivable.toFixed(2)}).`,
            evidence: `Alta concentração de risco de inadimplência em um único comprador.`,
            suggestedMitigation: `Estabelecer teto de liberação para ${topName} até amortização de ao menos 50% dos títulos em aberto.`
          });
        }
      }
    }

    // 3. Anomalia de Ruptura Crítica de Estoque
    const zeroStockHighDemand = products.filter(p => p.stock === 0 && p.minStock > 0);
    if (zeroStockHighDemand.length > 0) {
      results.push({
        id: `anom-stock-zero-${Date.now()}`,
        detectedAt: now,
        metric: 'Ruptura Total de Estoque (Estoque Zero)',
        module: 'estoque',
        observedValue: zeroStockHighDemand.length,
        expectedRange: { min: 0, max: 0, mean: 0 },
        severity: 'ALTA',
        quantitativeExplanation: `${zeroStockHighDemand.length} produto(s) de catálogo estão com estoque zerado absoluto: ${zeroStockHighDemand.map(p => p.name).join(', ')}.`,
        evidence: `Perda direta de vendas por indisponibilidade imediata no pátio da olaria.`,
        suggestedMitigation: `Priorizar a modelagem e queima imediata desses modelos no próximo ciclo de fornos.`
      });
    }

    return results;
  }
}
