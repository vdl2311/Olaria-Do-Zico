import { StorageService } from '../../services/storage';
import { AuthService } from '../../services/authService';
import { Product, Sale, ProductionBatch, Customer, Expense, AccountReceivable, CustomOrder, Delivery, RawMaterial } from '../../types';

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
      default?: any;
    }>;
    required?: string[];
  };
  handler: (args: Record<string, any>) => Promise<any> | any;
}

export class SystemToolsRegistry {
  private static parseDateRange(startDate?: string, endDate?: string) {
    const now = new Date();
    const end = endDate ? new Date(endDate) : now;
    let start: Date;

    if (startDate) {
      start = new Date(startDate);
    } else {
      // Default to last 30 days
      start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return {
      startStr: start.toISOString().split('T')[0],
      endStr: end.toISOString().split('T')[0],
      startDateObj: start,
      endDateObj: end
    };
  }

  // --- Controlled Tools Catalog ---
  public static tools: Record<string, ToolDefinition> = {
    get_producao_periodo: {
      name: 'get_producao_periodo',
      description: 'Consulta lotes e peças produzidas na olaria em um intervalo de datas ou estágio de queima.',
      parameters: {
        type: 'object',
        properties: {
          startDate: { type: 'string', description: 'Data inicial no formato YYYY-MM-DD' },
          endDate: { type: 'string', description: 'Data final no formato YYYY-MM-DD' },
          stage: { type: 'string', enum: ['Produção', 'Secagem', 'Queima', 'Acabamento', 'Pronto', 'Todos'], description: 'Estágio do lote' },
          productId: { type: 'string', description: 'Filtro por ID do produto cerâmico' }
        }
      },
      handler: (args) => {
        const { startStr, endStr } = SystemToolsRegistry.parseDateRange(args.startDate, args.endDate);
        const batches = StorageService.getProduction();

        const filtered = batches.filter(b => {
          if (b.softDeleted) return false;
          if (b.startDate < startStr || b.startDate > endStr) return false;
          if (args.stage && args.stage !== 'Todos' && b.stage !== args.stage) return false;
          if (args.productId && b.productId !== args.productId) return false;
          return true;
        });

        const totalPlanned = filtered.reduce((acc, b) => acc + b.quantityPlanned, 0);
        const totalProduced = filtered.reduce((acc, b) => acc + b.quantityProduced, 0);
        const totalLost = filtered.reduce((acc, b) => acc + b.quantityLost, 0);
        const totalGood = filtered.reduce((acc, b) => acc + b.quantityGood, 0);
        const lossRate = totalProduced > 0 ? (totalLost / totalProduced) * 100 : 0;

        return {
          period: { startDate: startStr, endDate: endStr },
          totalBatches: filtered.length,
          totalPlanned,
          totalProduced,
          totalLost,
          totalGood,
          lossRatePercent: Number(lossRate.toFixed(1)),
          batches: filtered.slice(0, 50).map(b => ({
            code: b.code,
            productName: b.productName,
            planned: b.quantityPlanned,
            produced: b.quantityProduced,
            lost: b.quantityLost,
            good: b.quantityGood,
            stage: b.stage,
            startDate: b.startDate,
            completedDate: b.completedDate
          }))
        };
      }
    },

    get_vendas_periodo: {
      name: 'get_vendas_periodo',
      description: 'Consulta o histórico de vendas, faturamento, meios de pagamento e clientes em um período.',
      parameters: {
        type: 'object',
        properties: {
          startDate: { type: 'string', description: 'Data inicial no formato YYYY-MM-DD' },
          endDate: { type: 'string', description: 'Data final no formato YYYY-MM-DD' },
          paymentMethod: { type: 'string', description: 'Pix, Dinheiro, Cartão, Fiado, etc.' },
          customerName: { type: 'string', description: 'Nome ou parte do nome do cliente' },
          status: { type: 'string', enum: ['Concluída', 'Parcial', 'Pendente', 'Cancelada', 'Todas'], description: 'Status da venda' }
        }
      },
      handler: (args) => {
        const { startStr, endStr } = SystemToolsRegistry.parseDateRange(args.startDate, args.endDate);
        const sales = StorageService.getSales();

        const filtered = sales.filter(s => {
          if (s.softDeleted) return false;
          if (s.date < startStr || s.date > endStr) return false;
          if (args.status && args.status !== 'Todas' && s.status !== args.status) return false;
          if (args.paymentMethod && s.paymentMethod.toLowerCase() !== args.paymentMethod.toLowerCase()) return false;
          if (args.customerName && !s.customerName.toLowerCase().includes(args.customerName.toLowerCase())) return false;
          return true;
        });

        const totalRevenue = filtered.filter(s => s.status !== 'Cancelada').reduce((acc, s) => acc + s.totalValue, 0);
        const totalPaid = filtered.filter(s => s.status !== 'Cancelada').reduce((acc, s) => acc + s.paidValue, 0);
        const totalPending = filtered.filter(s => s.status !== 'Cancelada').reduce((acc, s) => acc + s.pendingValue, 0);
        const averageTicket = filtered.length > 0 ? totalRevenue / filtered.length : 0;

        // Group by product
        const productStats: Record<string, { qty: number; revenue: number }> = {};
        filtered.forEach(s => {
          if (s.status === 'Cancelada') return;
          s.items.forEach(item => {
            if (!productStats[item.productName]) {
              productStats[item.productName] = { qty: 0, revenue: 0 };
            }
            productStats[item.productName].qty += item.quantity;
            productStats[item.productName].revenue += item.totalPrice;
          });
        });

        const topProducts = Object.entries(productStats)
          .map(([name, stat]) => ({ productName: name, quantitySold: stat.qty, revenue: stat.revenue }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 10);

        return {
          period: { startDate: startStr, endDate: endStr },
          totalSalesCount: filtered.length,
          totalRevenue,
          totalPaid,
          totalPending,
          averageTicket: Number(averageTicket.toFixed(2)),
          topProducts,
          salesSummary: filtered.slice(0, 30).map(s => ({
            code: s.code,
            date: s.date,
            customerName: s.customerName,
            totalValue: s.totalValue,
            paidValue: s.paidValue,
            pendingValue: s.pendingValue,
            paymentMethod: s.paymentMethod,
            status: s.status,
            itemNames: s.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')
          }))
        };
      }
    },

    get_materias_primas: {
      name: 'get_materias_primas',
      description: 'Consulta detalhada do estoque de matérias-primas e insumos cerâmicos (argilas, esmaltes, areia, pigmentos, lenha para forno, embalagens).',
      parameters: {
        type: 'object',
        properties: {
          category: { type: 'string', description: 'Categoria do insumo (Argila, Esmalte, Tinta, Pigmento, Acabamento, Embalagem, Outros)' },
          onlyLowStock: { type: 'boolean', description: 'Se verdadeiro, filtra apenas matérias-primas com estoque abaixo ou igual ao mínimo' }
        }
      },
      handler: (args) => {
        const rawMaterials = StorageService.getRawMaterials().filter(r => !r.softDeleted);
        let filtered = rawMaterials;

        if (args.category) {
          filtered = filtered.filter(r => r.category.toLowerCase().includes(args.category.toLowerCase()));
        }
        if (args.onlyLowStock) {
          filtered = filtered.filter(r => r.stockQuantity <= r.minStock);
        }

        const totalCostValuation = rawMaterials.reduce((acc, r) => acc + (r.stockQuantity * (r.costPerUnit || 0)), 0);
        const lowStockItems = rawMaterials.filter(r => r.stockQuantity <= r.minStock);

        return {
          totalMaterialTypes: rawMaterials.length,
          totalCostValuation,
          lowStockCount: lowStockItems.length,
          lowStockAlerts: lowStockItems.map(r => ({
            name: r.name,
            category: r.category,
            currentStock: r.stockQuantity,
            unit: r.unit,
            minStock: r.minStock,
            supplier: r.supplier || 'Não informado'
          })),
          materials: filtered.map(r => ({
            id: r.id,
            name: r.name,
            category: r.category,
            stockQuantity: r.stockQuantity,
            unit: r.unit,
            minStock: r.minStock,
            costPerUnit: r.costPerUnit,
            totalCost: Number((r.stockQuantity * (r.costPerUnit || 0)).toFixed(2)),
            supplier: r.supplier || 'Não informado',
            lastPurchaseDate: r.lastPurchaseDate || 'Não informada',
            isLowStock: r.stockQuantity <= r.minStock
          }))
        };
      }
    },

    get_estoque_atual: {
      name: 'get_estoque_atual',
      description: 'Consulta o estoque atual de peças acabadas e matérias-primas (argila, esmaltes, insumos).',
      parameters: {
        type: 'object',
        properties: {
          category: { type: 'string', description: 'Categoria do produto ou matéria-prima' },
          onlyLowStock: { type: 'boolean', description: 'Se verdadeiro, retorna apenas itens com estoque igual ou abaixo do mínimo' }
        }
      },
      handler: (args) => {
        const products = StorageService.getProducts().filter(p => !p.softDeleted);
        const rawMaterials = StorageService.getRawMaterials().filter(r => !r.softDeleted);

        let filteredProducts = products;
        if (args.category) {
          filteredProducts = filteredProducts.filter(p => p.category.toLowerCase().includes(args.category.toLowerCase()));
        }
        if (args.onlyLowStock) {
          filteredProducts = filteredProducts.filter(p => p.stock <= p.minStock);
        }

        const totalItemsCount = products.reduce((acc, p) => acc + p.stock, 0);
        const totalValuation = products.reduce((acc, p) => acc + (p.stock * p.price), 0);
        const totalEstimatedCost = products.reduce((acc, p) => acc + (p.stock * (p.cost || p.estimatedCost || p.price * 0.4)), 0);
        const lowStockProducts = products.filter(p => p.stock <= p.minStock);
        const lowStockRawMaterials = rawMaterials.filter(r => r.stockQuantity <= r.minStock);

        return {
          totalProductsInCatalog: products.length,
          totalItemsInStock: totalItemsCount,
          totalValuation,
          totalEstimatedCost,
          lowStockCount: lowStockProducts.length,
          lowStockRawMaterialsCount: lowStockRawMaterials.length,
          lowStockAlerts: lowStockProducts.map(p => ({
            code: p.code,
            name: p.name,
            currentStock: p.stock,
            minStock: p.minStock,
            category: p.category,
            price: p.price
          })),
          products: filteredProducts.slice(0, 40).map(p => ({
            code: p.code,
            name: p.name,
            category: p.category,
            stock: p.stock,
            minStock: p.minStock,
            price: p.price,
            size: p.size,
            finish: p.finish
          })),
          rawMaterials: rawMaterials.map(r => ({
            id: r.id,
            name: r.name,
            category: r.category,
            stockQuantity: r.stockQuantity,
            unit: r.unit,
            minStock: r.minStock,
            costPerUnit: r.costPerUnit,
            isLowStock: r.stockQuantity <= r.minStock,
            supplier: r.supplier
          }))
        };
      }
    },

    get_financeiro_periodo: {
      name: 'get_financeiro_periodo',
      description: 'Consulta fluxo financeiro: receitas recebidas, despesas pagas/pendentes, fiado/inadimplência e saldo.',
      parameters: {
        type: 'object',
        properties: {
          startDate: { type: 'string', description: 'Data inicial no formato YYYY-MM-DD' },
          endDate: { type: 'string', description: 'Data final no formato YYYY-MM-DD' }
        }
      },
      handler: (args) => {
        const { startStr, endStr } = SystemToolsRegistry.parseDateRange(args.startDate, args.endDate);
        const sales = StorageService.getSales().filter(s => !s.softDeleted && s.status !== 'Cancelada' && s.date >= startStr && s.date <= endStr);
        const expenses = StorageService.getExpenses().filter(e => !e.softDeleted && e.dueDate >= startStr && e.dueDate <= endStr);
        const receivables = StorageService.getReceivables().filter(r => !r.softDeleted);

        const totalSalesRevenue = sales.reduce((acc, s) => acc + s.totalValue, 0);
        const totalCashIn = sales.reduce((acc, s) => acc + s.paidValue, 0);
        const totalSalesPending = sales.reduce((acc, s) => acc + s.pendingValue, 0);

        const expensesPaid = expenses.filter(e => e.status === 'Paga').reduce((acc, e) => acc + e.amount, 0);
        const expensesPending = expenses.filter(e => e.status === 'Pendente').reduce((acc, e) => acc + e.amount, 0);
        const totalExpenses = expensesPaid + expensesPending;

        const netOperationalBalance = totalCashIn - expensesPaid;

        // Receivables status
        const activeReceivables = receivables.filter(r => r.status !== 'Pago');
        const totalReceivableAmount = activeReceivables.reduce((acc, r) => acc + (r.amount - r.amountPaid), 0);
        const overdueReceivables = activeReceivables.filter(r => r.dueDate < new Date().toISOString().split('T')[0]);
        const totalOverdueAmount = overdueReceivables.reduce((acc, r) => acc + (r.amount - r.amountPaid), 0);

        return {
          period: { startDate: startStr, endDate: endStr },
          totalSalesRevenue,
          totalCashIn,
          totalSalesPending,
          expensesPaid,
          expensesPending,
          totalExpenses,
          netOperationalBalance,
          receivables: {
            totalPending: totalReceivableAmount,
            totalOverdue: totalOverdueAmount,
            overdueCount: overdueReceivables.length,
            topDebtors: activeReceivables.slice(0, 10).map(r => ({
              customerName: r.customerName,
              amountDue: r.amount - r.amountPaid,
              dueDate: r.dueDate,
              status: r.status
            }))
          }
        };
      }
    },

    get_clientes: {
      name: 'get_clientes',
      description: 'Consulta carteira de clientes, tipos (arquitetos, paisagistas, lojas, consumidor final) e histórico de compras.',
      parameters: {
        type: 'object',
        properties: {
          type: { type: 'string', description: 'Tipo do cliente: Loja, Paisagista, Arquiteto, Cliente final, etc.' },
          search: { type: 'string', description: 'Termo de busca por nome, telefone ou cidade' }
        }
      },
      handler: (args) => {
        const customers = StorageService.getCustomers().filter(c => !c.softDeleted);
        const sales = StorageService.getSales().filter(s => !s.softDeleted && s.status !== 'Cancelada');

        let filtered = customers;
        if (args.type) {
          filtered = filtered.filter(c => c.type.toLowerCase().includes(args.type.toLowerCase()));
        }
        if (args.search) {
          const q = args.search.toLowerCase();
          filtered = filtered.filter(c => 
            c.name.toLowerCase().includes(q) || 
            (c.city && c.city.toLowerCase().includes(q)) || 
            (c.phone && c.phone.includes(q))
          );
        }

        const clientSummaries = filtered.map(c => {
          const clientSales = sales.filter(s => s.customerId === c.id || s.customerName.toLowerCase() === c.name.toLowerCase());
          const totalSpent = clientSales.reduce((acc, s) => acc + s.totalValue, 0);
          return {
            id: c.id,
            name: c.name,
            type: c.type,
            city: c.city || 'Não informada',
            totalOrders: clientSales.length,
            totalSpent,
            lastOrderDate: clientSales.length > 0 ? clientSales[0].date : undefined
          };
        }).sort((a, b) => b.totalSpent - a.totalSpent);

        return {
          totalCustomers: customers.length,
          matchingCustomers: clientSummaries.length,
          topCustomers: clientSummaries.slice(0, 20)
        };
      }
    },

    get_dashboard: {
      name: 'get_dashboard',
      description: 'Gera uma visão executiva consolidada da olaria hoje com indicadores de produção, vendas, estoque e contas.',
      parameters: {
        type: 'object',
        properties: {}
      },
      handler: () => {
        const products = StorageService.getProducts().filter(p => !p.softDeleted);
        const sales = StorageService.getSales().filter(s => !s.softDeleted);
        const production = StorageService.getProduction().filter(p => !p.softDeleted);
        const receivables = StorageService.getReceivables().filter(r => !r.softDeleted && r.status !== 'Pago');
        const expenses = StorageService.getExpenses().filter(e => !e.softDeleted);
        const customOrders = StorageService.getCustomOrders().filter(o => !o.softDeleted && o.status !== 'Entregue' && o.status !== 'Cancelado');
        const deliveries = StorageService.getDeliveries().filter(d => !d.softDeleted && d.status !== 'Entregue' && d.status !== 'Cancelada');

        const todayStr = new Date().toISOString().split('T')[0];
        const salesToday = sales.filter(s => s.date === todayStr && s.status !== 'Cancelada');
        const totalSalesToday = salesToday.reduce((acc, s) => acc + s.totalValue, 0);

        const totalRevenueAll = sales.filter(s => s.status !== 'Cancelada').reduce((acc, s) => acc + s.totalValue, 0);
        const totalCashReceived = sales.filter(s => s.status !== 'Cancelada').reduce((acc, s) => acc + s.paidValue, 0);
        const totalExpensesPaid = expenses.filter(e => e.status === 'Paga').reduce((acc, e) => acc + e.amount, 0);
        const totalReceivablePending = receivables.reduce((acc, r) => acc + (r.amount - r.amountPaid), 0);

        const lowStockCount = products.filter(p => p.stock <= p.minStock).length;
        const inProductionBatches = production.filter(p => p.stage !== 'Pronto').length;

        return {
          todayDate: todayStr,
          today: {
            salesCount: salesToday.length,
            revenue: totalSalesToday,
            pendingDeliveries: deliveries.length,
            activeCustomOrders: customOrders.length
          },
          accumulated: {
            totalRevenue: totalRevenueAll,
            cashInBalance: totalCashReceived - totalExpensesPaid,
            totalReceivablePending,
            inProductionBatchesCount: inProductionBatches,
            lowStockItemsCount: lowStockCount,
            totalActiveProducts: products.length
          }
        };
      }
    },

    comparar_periodos: {
      name: 'comparar_periodos',
      description: 'Compara métricas de produção, vendas ou financeiro entre dois períodos distintos (ex: este mês vs mês passado).',
      parameters: {
        type: 'object',
        properties: {
          period1Start: { type: 'string', description: 'Início do período base (YYYY-MM-DD)' },
          period1End: { type: 'string', description: 'Fim do período base (YYYY-MM-DD)' },
          period2Start: { type: 'string', description: 'Início do período comparativo (YYYY-MM-DD)' },
          period2End: { type: 'string', description: 'Fim do período comparativo (YYYY-MM-DD)' },
          metricType: { type: 'string', description: 'Tipo de métrica a comparar', enum: ['vendas', 'producao', 'financeiro', 'todos'], default: 'todos' }
        },
        required: ['period1Start', 'period1End', 'period2Start', 'period2End']
      },
      handler: (args) => {
        const sales = StorageService.getSales().filter(s => !s.softDeleted && s.status !== 'Cancelada');
        const production = StorageService.getProduction().filter(p => !p.softDeleted);

        // Period 1
        const salesP1 = sales.filter(s => s.date >= args.period1Start && s.date <= args.period1End);
        const revP1 = salesP1.reduce((acc, s) => acc + s.totalValue, 0);
        const prodP1 = production.filter(p => p.startDate >= args.period1Start && p.startDate <= args.period1End);
        const piecesP1 = prodP1.reduce((acc, p) => acc + p.quantityProduced, 0);
        const lostP1 = prodP1.reduce((acc, p) => acc + p.quantityLost, 0);

        // Period 2
        const salesP2 = sales.filter(s => s.date >= args.period2Start && s.date <= args.period2End);
        const revP2 = salesP2.reduce((acc, s) => acc + s.totalValue, 0);
        const prodP2 = production.filter(p => p.startDate >= args.period2Start && p.startDate <= args.period2End);
        const piecesP2 = prodP2.reduce((acc, p) => acc + p.quantityProduced, 0);
        const lostP2 = prodP2.reduce((acc, p) => acc + p.quantityLost, 0);

        const revDiff = revP2 - revP1;
        const revPercent = revP1 > 0 ? (revDiff / revP1) * 100 : (revP2 > 0 ? 100 : 0);

        const prodDiff = piecesP2 - piecesP1;
        const prodPercent = piecesP1 > 0 ? (prodDiff / piecesP1) * 100 : (piecesP2 > 0 ? 100 : 0);

        return {
          period1: { label: `${args.period1Start} até ${args.period1End}`, revenue: revP1, salesCount: salesP1.length, producedPieces: piecesP1, losses: lostP1 },
          period2: { label: `${args.period2Start} até ${args.period2End}`, revenue: revP2, salesCount: salesP2.length, producedPieces: piecesP2, losses: lostP2 },
          comparisons: [
            {
              metric: 'Faturamento de Vendas',
              period1Val: `R$ ${revP1.toFixed(2)}`,
              period2Val: `R$ ${revP2.toFixed(2)}`,
              absoluteDiff: `R$ ${revDiff.toFixed(2)}`,
              percentageChange: Number(revPercent.toFixed(1)),
              trend: revDiff >= 0 ? 'crescimento' : 'queda'
            },
            {
              metric: 'Peças Produzidas',
              period1Val: `${piecesP1} un`,
              period2Val: `${piecesP2} un`,
              absoluteDiff: `${prodDiff} un`,
              percentageChange: Number(prodPercent.toFixed(1)),
              trend: prodDiff >= 0 ? 'crescimento' : 'queda'
            }
          ]
        };
      }
    }
  };

  public static async executeTool(toolName: string, args: Record<string, any>): Promise<any> {
    const tool = this.tools[toolName];
    if (!tool) {
      throw new Error(`Ferramenta desconhecida ou não autorizada: ${toolName}`);
    }
    return tool.handler(args);
  }

  public static getToolDefinitions() {
    return Object.values(this.tools).map(t => ({
      name: t.name,
      description: t.description,
      parameters: t.parameters
    }));
  }
}
