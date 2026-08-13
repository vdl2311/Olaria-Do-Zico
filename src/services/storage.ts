import {
  Product,
  RawMaterial,
  Customer,
  Sale,
  ProductionBatch,
  CustomOrder,
  Delivery,
  Expense,
  AccountReceivable,
  AuditLog,
  NluActionPayload
} from '../types';

import {
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_RAW_MATERIALS,
  INITIAL_CUSTOMERS,
  INITIAL_SALES,
  INITIAL_PRODUCTION_BATCHES,
  INITIAL_CUSTOM_ORDERS,
  INITIAL_DELIVERIES,
  INITIAL_EXPENSES,
  INITIAL_RECEIVABLES,
  INITIAL_AUDIT_LOGS
} from '../data/initialData';

const KEYS = {
  CATEGORIES: 'olaria_categories_v1',
  PRODUCTS: 'olaria_products_v1',
  RAW_MATERIALS: 'olaria_raw_materials_v1',
  CUSTOMERS: 'olaria_customers_v1',
  SALES: 'olaria_sales_v1',
  PRODUCTION: 'olaria_production_v1',
  CUSTOM_ORDERS: 'olaria_custom_orders_v1',
  DELIVERIES: 'olaria_deliveries_v1',
  EXPENSES: 'olaria_expenses_v1',
  RECEIVABLES: 'olaria_receivables_v1',
  AUDIT: 'olaria_audit_v1',
  VOICE_LOGS: 'olaria_voice_logs_v1'
};

type Listener = () => void;
const listeners: Set<Listener> = new Set();

export function subscribeStorage(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners() {
  listeners.forEach(l => l());
}

function getItem<T>(key: string, defaultValue: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (e) {
    console.error(`Error loading key ${key}:`, e);
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    notifyListeners();
  } catch (e) {
    console.error(`Error setting key ${key}:`, e);
  }
}

// Data Getters
export const StorageService = {
  getCategories(): string[] {
    return getItem<string[]>(KEYS.CATEGORIES, INITIAL_CATEGORIES);
  },

  addCategory(category: string): string[] {
    const list = this.getCategories();
    if (!list.includes(category)) {
      const updated = [...list, category];
      setItem(KEYS.CATEGORIES, updated);
      this.logAudit('Adicionar Categoria', 'Categoria', category, `Categoria ${category} criada.`);
      return updated;
    }
    return list;
  },

  getProducts(): Product[] {
    return getItem<Product[]>(KEYS.PRODUCTS, INITIAL_PRODUCTS);
  },

  saveProduct(product: Product): Product {
    const list = this.getProducts();
    const idx = list.findIndex(p => p.id === product.id);
    let updated: Product[];
    if (idx >= 0) {
      updated = [...list];
      updated[idx] = product;
    } else {
      updated = [product, ...list];
    }
    setItem(KEYS.PRODUCTS, updated);
    this.logAudit('Salvar Produto', 'Produto', product.id, `Produto ${product.name} gravado. Estoque: ${product.stock}`);
    return product;
  },

  deleteProduct(id: string) {
    const list = this.getProducts().filter(p => p.id !== id);
    setItem(KEYS.PRODUCTS, list);
    this.logAudit('Excluir Produto', 'Produto', id, `Produto removido.`);
  },

  getRawMaterials(): RawMaterial[] {
    return getItem<RawMaterial[]>(KEYS.RAW_MATERIALS, INITIAL_RAW_MATERIALS);
  },

  saveRawMaterial(mat: RawMaterial): RawMaterial {
    const list = this.getRawMaterials();
    const idx = list.findIndex(m => m.id === mat.id);
    let updated: RawMaterial[];
    if (idx >= 0) {
      updated = [...list];
      updated[idx] = mat;
    } else {
      updated = [mat, ...list];
    }
    setItem(KEYS.RAW_MATERIALS, updated);
    this.logAudit('Salvar Matéria-Prima', 'Matéria-Prima', mat.id, `${mat.name}: ${mat.stockQuantity} ${mat.unit}`);
    return mat;
  },

  getCustomers(): Customer[] {
    return getItem<Customer[]>(KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
  },

  saveCustomer(customer: Customer): Customer {
    const list = this.getCustomers();
    const idx = list.findIndex(c => c.id === customer.id);
    let updated: Customer[];
    if (idx >= 0) {
      updated = [...list];
      updated[idx] = customer;
    } else {
      updated = [customer, ...list];
    }
    setItem(KEYS.CUSTOMERS, updated);
    this.logAudit('Salvar Cliente', 'Cliente', customer.id, `Cliente ${customer.name} registrado.`);
    return customer;
  },

  findOrCreateCustomerByName(name: string): Customer {
    const customers = this.getCustomers();
    const found = customers.find(c => c.name.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(c.name.toLowerCase()));
    if (found) return found;
    
    const newCustomer: Customer = {
      id: `cli-${Date.now()}`,
      name: name.trim(),
      type: 'Cliente final',
      createdAt: new Date().toISOString().split('T')[0]
    };
    return this.saveCustomer(newCustomer);
  },

  getSales(): Sale[] {
    return getItem<Sale[]>(KEYS.SALES, INITIAL_SALES);
  },

  saveSale(sale: Sale): Sale {
    const sales = this.getSales();
    const idx = sales.findIndex(s => s.id === sale.id);
    let updated: Sale[];
    if (idx >= 0) {
      updated = [...sales];
      updated[idx] = sale;
    } else {
      updated = [sale, ...sales];
    }
    setItem(KEYS.SALES, updated);

    // Auto update stock for items
    const products = this.getProducts();
    sale.items.forEach(item => {
      const p = products.find(prod => prod.id === item.productId || prod.name.toLowerCase() === item.productName.toLowerCase());
      if (p) {
        p.stock = Math.max(0, p.stock - item.quantity);
        this.saveProduct(p);
      }
    });

    // Auto create account receivable if pendingValue > 0
    if (sale.pendingValue > 0 && sale.customerId) {
      const receivables = this.getReceivables();
      const existing = receivables.find(r => r.saleId === sale.id);
      if (!existing) {
        const newReceivable: AccountReceivable = {
          id: `rec-${Date.now()}`,
          saleId: sale.id,
          customerId: sale.customerId,
          customerName: sale.customerName,
          description: `Venda ${sale.code} - ${sale.items.map(i => i.productName).join(', ')}`,
          amount: sale.pendingValue,
          amountPaid: 0,
          dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
          status: 'Pendente',
          notes: `Saldo a receber referente à venda ${sale.code}`
        };
        this.saveReceivable(newReceivable);
      }
    }

    this.logAudit('Registrar Venda', 'Venda', sale.id, `Venda ${sale.code} para ${sale.customerName} no valor de R$ ${sale.totalValue.toFixed(2)}`);
    return sale;
  },

  getProduction(): ProductionBatch[] {
    return getItem<ProductionBatch[]>(KEYS.PRODUCTION, INITIAL_PRODUCTION_BATCHES);
  },

  saveProduction(batch: ProductionBatch): ProductionBatch {
    const list = this.getProduction();
    const idx = list.findIndex(b => b.id === batch.id);
    let updated: ProductionBatch[];
    if (idx >= 0) {
      updated = [...list];
      updated[idx] = batch;
    } else {
      updated = [batch, ...list];
    }
    setItem(KEYS.PRODUCTION, updated);

    // If batch finished/pronto or good pieces produced, add to product stock if appropriate
    if (batch.stage === 'Pronto' && batch.quantityGood > 0) {
      const products = this.getProducts();
      const p = products.find(prod => prod.id === batch.productId || prod.name.toLowerCase() === batch.productName.toLowerCase());
      if (p) {
        p.stock += batch.quantityGood;
        this.saveProduct(p);
      }
    }

    this.logAudit('Registrar Produção', 'Produção', batch.id, `Produção ${batch.code} de ${batch.productName}: ${batch.quantityGood} boas, ${batch.quantityLost} perdas.`);
    return batch;
  },

  getCustomOrders(): CustomOrder[] {
    return getItem<CustomOrder[]>(KEYS.CUSTOM_ORDERS, INITIAL_CUSTOM_ORDERS);
  },

  saveCustomOrder(order: CustomOrder): CustomOrder {
    const list = this.getCustomOrders();
    const idx = list.findIndex(o => o.id === order.id);
    let updated: CustomOrder[];
    if (idx >= 0) {
      updated = [...list];
      updated[idx] = order;
    } else {
      updated = [order, ...list];
    }
    setItem(KEYS.CUSTOM_ORDERS, updated);
    this.logAudit('Salvar Pedido Personalizado', 'Pedido', order.id, `Pedido ${order.code} de ${order.customerName}`);
    return order;
  },

  getDeliveries(): Delivery[] {
    return getItem<Delivery[]>(KEYS.DELIVERIES, INITIAL_DELIVERIES);
  },

  saveDelivery(del: Delivery): Delivery {
    const list = this.getDeliveries();
    const idx = list.findIndex(d => d.id === del.id);
    let updated: Delivery[];
    if (idx >= 0) {
      updated = [...list];
      updated[idx] = del;
    } else {
      updated = [del, ...list];
    }
    setItem(KEYS.DELIVERIES, updated);
    this.logAudit('Salvar Entrega', 'Entrega', del.id, `Entrega para ${del.customerName} - Status: ${del.status}`);
    return del;
  },

  getExpenses(): Expense[] {
    return getItem<Expense[]>(KEYS.EXPENSES, INITIAL_EXPENSES);
  },

  saveExpense(exp: Expense): Expense {
    const list = this.getExpenses();
    const idx = list.findIndex(e => e.id === exp.id);
    let updated: Expense[];
    if (idx >= 0) {
      updated = [...list];
      updated[idx] = exp;
    } else {
      updated = [exp, ...list];
    }
    setItem(KEYS.EXPENSES, updated);
    this.logAudit('Registrar Despesa', 'Despesa', exp.id, `Despesa: ${exp.description} - R$ ${exp.amount.toFixed(2)}`);
    return exp;
  },

  getReceivables(): AccountReceivable[] {
    return getItem<AccountReceivable[]>(KEYS.RECEIVABLES, INITIAL_RECEIVABLES);
  },

  saveReceivable(rec: AccountReceivable): AccountReceivable {
    const list = this.getReceivables();
    const idx = list.findIndex(r => r.id === rec.id);
    let updated: AccountReceivable[];
    if (idx >= 0) {
      updated = [...list];
      updated[idx] = rec;
    } else {
      updated = [rec, ...list];
    }
    setItem(KEYS.RECEIVABLES, updated);
    this.logAudit('Conta a Receber', 'Recebível', rec.id, `${rec.customerName}: R$ ${rec.amount.toFixed(2)}`);
    return rec;
  },

  recordCustomerPayment(customerName: string, amount: number, notes?: string): { paidAmount: number; remainingDebt: number } {
    const receivables = this.getReceivables();
    const customerRecs = receivables.filter(
      r => r.customerName.toLowerCase().includes(customerName.toLowerCase()) && r.status !== 'Pago'
    );

    let remainingToApply = amount;
    let totalDebtRemaining = 0;

    customerRecs.forEach(rec => {
      if (remainingToApply <= 0) {
        totalDebtRemaining += (rec.amount - rec.amountPaid);
        return;
      }

      const debt = rec.amount - rec.amountPaid;
      if (remainingToApply >= debt) {
        remainingToApply -= debt;
        rec.amountPaid = rec.amount;
        rec.status = 'Pago';
      } else {
        rec.amountPaid += remainingToApply;
        remainingToApply = 0;
        rec.status = 'Parcial';
        totalDebtRemaining += (rec.amount - rec.amountPaid);
      }
      this.saveReceivable(rec);
    });

    this.logAudit('Recebimento de Cliente', 'Financeiro', customerName, `Recebido R$ ${amount.toFixed(2)} de ${customerName}. ${notes || ''}`);
    return { paidAmount: amount, remainingDebt: totalDebtRemaining };
  },

  getAuditLogs(): AuditLog[] {
    return getItem<AuditLog[]>(KEYS.AUDIT, INITIAL_AUDIT_LOGS);
  },

  undoAuditAction(logId: string) {
    const logs = this.getAuditLogs();
    const idx = logs.findIndex(l => l.id === logId);
    if (idx >= 0) {
      logs[idx].status = 'Desfeito';
      setItem(KEYS.AUDIT, logs);
      this.logAudit('Desfazer Ação', 'Auditoria', logId, `Ação ${logId} revertida pelo usuário.`);
    }
  },

  logAudit(action: string, entityType: string, entityId: string, details: string) {
    const logs = getItem<AuditLog[]>(KEYS.AUDIT, INITIAL_AUDIT_LOGS);
    const newLog: AuditLog = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: 'Oleiro Zico',
      action,
      entityType,
      entityId,
      details
    };
    setItem(KEYS.AUDIT, [newLog, ...logs]);
  },

  // Apply Action Executed from Voice NLU Confirmation
  applyVoiceAction(payload: NluActionPayload): { success: boolean; message: string } {
    const parsed = payload.parsedData;
    if (!parsed) return { success: false, message: 'Dados incompletos para registrar.' };

    switch (payload.intent) {
      case 'RECORD_SALE': {
        const prodName = parsed.productName || 'Vaso Ceramico';
        const products = this.getProducts();
        let prod = products.find(p => p.name.toLowerCase().includes(prodName.toLowerCase()) || prodName.toLowerCase().includes(p.name.toLowerCase()));
        
        if (!prod && products.length > 0) {
          prod = products[0]; // fallback
        }

        const qty = parsed.quantity || 1;
        const unitPrice = parsed.unitPrice || (prod ? prod.price : 180);
        const totalPrice = parsed.totalPrice || (qty * unitPrice);
        const paidValue = parsed.paidValue !== undefined ? parsed.paidValue : (parsed.paymentMethod === 'Fiado' ? 0 : totalPrice);
        const pendingValue = parsed.pendingValue !== undefined ? parsed.pendingValue : (totalPrice - paidValue);

        const customer = this.findOrCreateCustomerByName(parsed.customerName || 'Cliente Balcão');

        const newSale: Sale = {
          id: `sale-${Date.now()}`,
          code: `VND-${Math.floor(1000 + Math.random() * 9000)}`,
          customerId: customer.id,
          customerName: customer.name,
          items: [{
            productId: prod ? prod.id : 'prod-1',
            productName: prod ? prod.name : prodName,
            quantity: qty,
            unitPrice: unitPrice,
            totalPrice: totalPrice
          }],
          totalValue: totalPrice,
          discount: 0,
          paidValue: paidValue,
          pendingValue: pendingValue,
          paymentMethod: parsed.paymentMethod || 'Pix',
          date: new Date().toISOString().split('T')[0],
          notes: 'Registrado via comando de voz',
          status: pendingValue === 0 ? 'Concluída' : (paidValue > 0 ? 'Parcial' : 'Pendente')
        };

        this.saveSale(newSale);
        return { success: true, message: `Venda de ${qty}x ${prod ? prod.name : prodName} para ${customer.name} gravada com sucesso!` };
      }

      case 'RECORD_PRODUCTION': {
        const prodName = parsed.productName || 'Vaso Médio';
        const products = this.getProducts();
        let prod = products.find(p => p.name.toLowerCase().includes(prodName.toLowerCase()));
        if (!prod && products.length > 0) prod = products[0];

        const qtyProduced = parsed.quantityProduced || 10;
        const qtyLost = parsed.quantityLost || 0;
        const qtyGood = Math.max(0, qtyProduced - qtyLost);

        const newBatch: ProductionBatch = {
          id: `batch-${Date.now()}`,
          code: `PRD-${Math.floor(100 + Math.random() * 900)}`,
          productId: prod ? prod.id : 'prod-1',
          productName: prod ? prod.name : prodName,
          quantityPlanned: qtyProduced,
          quantityProduced: qtyProduced,
          quantityLost: qtyLost,
          quantityGood: qtyGood,
          stage: parsed.stage || 'Pronto',
          startDate: new Date().toISOString().split('T')[0],
          completedDate: new Date().toISOString().split('T')[0],
          notes: 'Registrado via voz'
        };

        this.saveProduction(newBatch);
        return { success: true, message: `Produção de ${qtyGood} peças boas (${qtyLost} perdas) de ${prod ? prod.name : prodName} registrada no estoque!` };
      }

      case 'RECORD_RAW_MATERIAL': {
        const matName = parsed.materialName || 'Argila';
        const rawMaterials = this.getRawMaterials();
        let mat = rawMaterials.find(m => m.name.toLowerCase().includes(matName.toLowerCase()));

        const qty = parsed.quantity || 50;
        const amount = parsed.amount || 300;

        if (mat) {
          mat.stockQuantity += qty;
          mat.lastPurchaseDate = new Date().toISOString().split('T')[0];
          this.saveRawMaterial(mat);
        } else {
          mat = {
            id: `mat-${Date.now()}`,
            name: matName,
            category: parsed.materialCategory || 'Argila',
            stockQuantity: qty,
            unit: 'kg',
            minStock: 20,
            costPerUnit: amount / (qty || 1),
            lastPurchaseDate: new Date().toISOString().split('T')[0]
          };
          this.saveRawMaterial(mat);
        }

        // Record corresponding expense
        const newExpense: Expense = {
          id: `exp-${Date.now()}`,
          description: `Compra de ${qty}kg de ${matName}`,
          category: 'Matéria-Prima',
          amount: amount,
          supplier: 'Fornecedor Voz',
          dueDate: new Date().toISOString().split('T')[0],
          paidDate: new Date().toISOString().split('T')[0],
          status: 'Paga',
          notes: 'Registrado por voz'
        };
        this.saveExpense(newExpense);

        return { success: true, message: `Compra de ${qty} ${mat.unit} de ${mat.name} no valor de R$ ${amount.toFixed(2)} lançada com sucesso!` };
      }

      case 'RECORD_LOSS': {
        const prodName = parsed.productName || 'Vaso';
        const products = this.getProducts();
        let prod = products.find(p => p.name.toLowerCase().includes(prodName.toLowerCase()));
        
        const qtyLost = parsed.quantityLost || 1;
        if (prod) {
          prod.stock = Math.max(0, prod.stock - qtyLost);
          this.saveProduct(prod);
        }

        // Create production loss log batch
        const batchLoss: ProductionBatch = {
          id: `loss-${Date.now()}`,
          code: `PRD-PERDA`,
          productId: prod ? prod.id : 'prod-1',
          productName: prod ? prod.name : prodName,
          quantityPlanned: qtyLost,
          quantityProduced: 0,
          quantityLost: qtyLost,
          quantityGood: 0,
          stage: 'Queima',
          startDate: new Date().toISOString().split('T')[0],
          notes: 'Perda/Quebra registrada via comando de voz'
        };
        this.saveProduction(batchLoss);

        return { success: true, message: `Registrado perda/quebra de ${qtyLost}x ${prod ? prod.name : prodName}. Estoque atualizado.` };
      }

      case 'RECORD_RECEIVABLE_PAYMENT': {
        const customerName = parsed.customerName || 'Cliente';
        const amount = parsed.amount || 100;
        const res = this.recordCustomerPayment(customerName, amount, 'Via comando de voz');
        return { success: true, message: `Recebimento de R$ ${amount.toFixed(2)} de ${customerName} registrado!` };
      }

      case 'RECORD_EXPENSE': {
        const amount = parsed.amount || 50;
        const newExp: Expense = {
          id: `exp-${Date.now()}`,
          description: parsed.expenseCategory || 'Despesa Geral',
          category: 'Outros',
          amount: amount,
          dueDate: new Date().toISOString().split('T')[0],
          paidDate: new Date().toISOString().split('T')[0],
          status: 'Paga',
          notes: 'Registrado via comando de voz'
        };
        this.saveExpense(newExp);
        return { success: true, message: `Despesa de R$ ${amount.toFixed(2)} (${newExp.description}) registrada!` };
      }

      case 'RECORD_DELIVERY': {
        const customerName = parsed.customerName || 'Cliente';
        const deliveries = this.getDeliveries();
        const pendingDel = deliveries.find(d => d.customerName.toLowerCase().includes(customerName.toLowerCase()) && d.status !== 'Entregue');

        if (pendingDel) {
          pendingDel.status = 'Entregue';
          pendingDel.completedAt = new Date().toISOString();
          this.saveDelivery(pendingDel);
          return { success: true, message: `Entrega do pedido de ${pendingDel.customerName} marcada como ENTREGUE!` };
        } else {
          const newDel: Delivery = {
            id: `del-${Date.now()}`,
            customerName: customerName,
            address: 'Endereço cadastrado',
            deliveryDate: new Date().toISOString().split('T')[0],
            shippingFee: 0,
            status: 'Entregue',
            completedAt: new Date().toISOString(),
            notes: 'Registrado por voz'
          };
          this.saveDelivery(newDel);
          return { success: true, message: `Entrega para ${customerName} concluída e registrada!` };
        }
      }

      default:
        return { success: false, message: 'Intenção de comando não reconhecida.' };
    }
  },

  resetToDefault() {
    localStorage.clear();
    notifyListeners();
  }
};
