import { StorageService } from '../../services/storage';
import { IntelligentAlert } from '../types/aiTypes';

export class AlertEngine {
  public static generateAlerts(): IntelligentAlert[] {
    const alerts: IntelligentAlert[] = [];
    const today = new Date().toISOString().split('T')[0];

    const products = StorageService.getProducts().filter(p => !p.softDeleted);
    const rawMaterials = StorageService.getRawMaterials().filter(r => !r.softDeleted);
    const receivables = StorageService.getReceivables().filter(r => !r.softDeleted && r.status !== 'Pago');
    const customOrders = StorageService.getCustomOrders().filter(o => !o.softDeleted && o.status !== 'Entregue' && o.status !== 'Cancelado');
    const production = StorageService.getProduction().filter(p => !p.softDeleted);

    // 1. 🔴 ATENÇÃO: Produtos com Estoque Zero
    const zeroStockProducts = products.filter(p => p.stock === 0 && p.minStock > 0);
    if (zeroStockProducts.length > 0) {
      alerts.push({
        id: `alert-stock-zero-${Date.now()}`,
        title: `Estoque Esgotado (${zeroStockProducts.length} modelo(s))`,
        description: `Produtos cadastrados sem nenhuma unidade disponível no pátio: ${zeroStockProducts.map(p => p.name).join(', ')}.`,
        priority: 'ATENCAO',
        category: 'estoque',
        date: today,
        origin: 'Monitor de Estoque em Tempo Real',
        dataUsed: { count: zeroStockProducts.length, items: zeroStockProducts.map(p => p.code) },
        recommendedAction: 'Emitir ordem de produção prioritária para os lotes zerados.',
        actionView: 'producao',
        actionLabel: 'Abrir Produção'
      });
    }

    // 2. 🔴 ATENÇÃO: Fiado Vencido / Inadimplência
    const overdueReceivables = receivables.filter(r => r.dueDate < today);
    if (overdueReceivables.length > 0) {
      const totalOverdue = overdueReceivables.reduce((acc, r) => acc + (r.amount - r.amountPaid), 0);
      alerts.push({
        id: `alert-overdue-${Date.now()}`,
        title: `${overdueReceivables.length} Conta(s) Fiado Vencida(s)`,
        description: `Total de R$ ${totalOverdue.toFixed(2)} em pagamentos atrasados de clientes aguardando cobrança.`,
        priority: 'ATENCAO',
        category: 'financeiro',
        date: today,
        origin: 'Controle de Contas a Receber',
        dataUsed: { count: overdueReceivables.length, total: totalOverdue },
        recommendedAction: 'Enviar lembrete amigável no WhatsApp dos clientes com pendência.',
        actionView: 'financeiro',
        actionLabel: 'Ver Cobranças'
      });
    }

    // 3. 🟠 ALERTA: Matéria-Prima em Nível Baixo (Argila / Esmaltes)
    const lowRawMaterials = rawMaterials.filter(r => r.stockQuantity <= r.minStock);
    if (lowRawMaterials.length > 0) {
      alerts.push({
        id: `alert-raw-mat-${Date.now()}`,
        title: `Reposição de Matéria-Prima Necessária`,
        description: `Insumos abaixo do estoque mínimo: ${lowRawMaterials.map(r => `${r.name} (${r.stockQuantity}${r.unit})`).join(', ')}.`,
        priority: 'ALERTA',
        category: 'estoque',
        date: today,
        origin: 'Almoxarifado de Insumos',
        dataUsed: { items: lowRawMaterials.map(r => r.name) },
        recommendedAction: 'Cotar compra com fornecedores habituais de argila e pigmentos.',
        actionView: 'estoque',
        actionLabel: 'Ver Insumos'
      });
    }

    // 4. 🟠 ALERTA: Pedidos Sob Encomenda com Prazo Próximo
    const urgentOrders = customOrders.filter(o => {
      const diffDays = (new Date(o.targetDate).getTime() - new Date(today).getTime()) / (1000 * 3600 * 24);
      return diffDays >= 0 && diffDays <= 3;
    });

    if (urgentOrders.length > 0) {
      alerts.push({
        id: `alert-orders-due-${Date.now()}`,
        title: `${urgentOrders.length} Pedido(s) Especial(is) com Entrega em até 3 dias`,
        description: `Encomendas personalizadas com prazo limite próximo: ${urgentOrders.map(o => `${o.code} - ${o.customerName}`).join(', ')}.`,
        priority: 'ALERTA',
        category: 'producao',
        date: today,
        origin: 'Gestão de Encomendas Especiais',
        dataUsed: { count: urgentOrders.length },
        recommendedAction: 'Acelerar queima final e acabamento para garantir a pontualidade da entrega.',
        actionView: 'pedidos',
        actionLabel: 'Ver Encomendas'
      });
    }

    // 5. 🟢 OPORTUNIDADE: Giro Rápido de Peças & Estoque Saudável
    const highStockReady = products.filter(p => p.stock > p.minStock * 2);
    if (highStockReady.length > 0) {
      alerts.push({
        id: `alert-promo-opp-${Date.now()}`,
        title: `Oportunidade Comercial de Venda em Lote`,
        description: `${highStockReady.length} modelo(s) com estoque robusto e pronta-entrega imediata para paisagistas e lojas parceiras.`,
        priority: 'OPORTUNIDADE',
        category: 'vendas',
        date: today,
        origin: 'Inteligência de Vendas',
        dataUsed: { count: highStockReady.length },
        recommendedAction: 'Divulgar catálogo para parceiros paisagistas e lojas de decoração.',
        actionView: 'vendas',
        actionLabel: 'Ir para Vendas'
      });
    }

    return alerts;
  }
}
