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

import {
  syncDocToFirestore,
  deleteDocFromFirestore,
  listenToCollection,
  testConnection
} from './firebase';

const KEYS = {
  CATEGORIES: 'olaria_categories_v2',
  PRODUCTS: 'olaria_products_v2',
  RAW_MATERIALS: 'olaria_raw_materials_v2',
  CUSTOMERS: 'olaria_customers_v2',
  SALES: 'olaria_sales_v2',
  PRODUCTION: 'olaria_production_v2',
  CUSTOM_ORDERS: 'olaria_custom_orders_v2',
  DELIVERIES: 'olaria_deliveries_v2',
  EXPENSES: 'olaria_expenses_v2',
  RECEIVABLES: 'olaria_receivables_v2',
  AUDIT: 'olaria_audit_v2',
  VOICE_LOGS: 'olaria_voice_logs_v2'
};

// Purge any legacy demo mock data from previous sessions
try {
  const legacyKeys = [
    'olaria_categories_v1', 'olaria_products_v1', 'olaria_raw_materials_v1',
    'olaria_customers_v1', 'olaria_sales_v1', 'olaria_production_v1',
    'olaria_custom_orders_v1', 'olaria_deliveries_v1', 'olaria_expenses_v1',
    'olaria_receivables_v1', 'olaria_audit_v1', 'olaria_voice_logs_v1'
  ];
  legacyKeys.forEach(k => localStorage.removeItem(k));
} catch (e) {
  // ignore
}

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

function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

let isSyncInitialized = false;

export const StorageService = {
  // Initialize real-time cloud synchronization with Firebase Firestore
  async initFirestoreSync() {
    if (isSyncInitialized) return;
    isSyncInitialized = true;

    try {
      await testConnection();

      // Listen for remote updates on Products
      listenToCollection<Product>('products', (cloudProducts) => {
        if (cloudProducts) {
          setItem(KEYS.PRODUCTS, cloudProducts);
        }
      });

      // Listen for remote updates on Raw Materials
      listenToCollection<RawMaterial>('raw_materials', (cloudMaterials) => {
        if (cloudMaterials) {
          setItem(KEYS.RAW_MATERIALS, cloudMaterials);
        }
      });

      // Listen for remote updates on Customers
      listenToCollection<Customer>('customers', (cloudCustomers) => {
        if (cloudCustomers) {
          setItem(KEYS.CUSTOMERS, cloudCustomers);
        }
      });

      // Listen for remote updates on Sales
      listenToCollection<Sale>('sales', (cloudSales) => {
        if (cloudSales) {
          setItem(KEYS.SALES, cloudSales);
        }
      });

      // Listen for remote updates on Production Batches
      listenToCollection<ProductionBatch>('production_batches', (cloudBatches) => {
        if (cloudBatches) {
          setItem(KEYS.PRODUCTION, cloudBatches);
        }
      });

      // Listen for remote updates on Custom Orders
      listenToCollection<CustomOrder>('custom_orders', (cloudOrders) => {
        if (cloudOrders) {
          setItem(KEYS.CUSTOM_ORDERS, cloudOrders);
        }
      });

      // Listen for remote updates on Deliveries
      listenToCollection<Delivery>('deliveries', (cloudDeliveries) => {
        if (cloudDeliveries) {
          setItem(KEYS.DELIVERIES, cloudDeliveries);
        }
      });

      // Listen for remote updates on Audit Logs
      listenToCollection<AuditLog>('audit_logs', (cloudLogs) => {
        if (cloudLogs) {
          setItem(KEYS.AUDIT, cloudLogs);
        }
      });
    } catch (err) {
      console.warn('Firebase sync initialized in offline/local-fallback mode:', err);
    }
  },

  // Category Management
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

  // Product Management
  getProducts(): Product[] {
    return getItem<Product[]>(KEYS.PRODUCTS, INITIAL_PRODUCTS);
  },

  saveProduct(product: Product, skipAudit = false): Product {
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
    syncDocToFirestore('products', product.id, product).catch(() => {});
    if (!skipAudit) {
      this.logAudit('Salvar Produto', 'Produto', product.id, `Produto ${product.name} gravado. Estoque: ${product.stock}`);
    }
    return product;
  },

  deleteProduct(id: string) {
    const list = this.getProducts().filter(p => p.id !== id);
    setItem(KEYS.PRODUCTS, list);
    deleteDocFromFirestore('products', id).catch(() => {});
    this.logAudit('Excluir Produto', 'Produto', id, `Produto removido.`);
  },

  findBestProductMatch(nameOrQuery: string): Product | null {
    if (!nameOrQuery || !nameOrQuery.trim()) return null;
    const products = this.getProducts();
    const qNorm = normalizeString(nameOrQuery);

    // 1. Exact match on code or name
    const exact = products.find(p => normalizeString(p.code) === qNorm || normalizeString(p.name) === qNorm);
    if (exact) return exact;

    // 2. Contains match
    const contains = products.find(p => normalizeString(p.name).includes(qNorm) || qNorm.includes(normalizeString(p.name)));
    if (contains) return contains;

    // 3. Keyword scoring
    const words = qNorm.split(/\s+/).filter(w => w.length > 2);
    let bestScore = 0;
    let bestProduct: Product | null = null;

    for (const p of products) {
      const pNorm = normalizeString(`${p.name} ${p.category} ${p.finish || ''} ${p.size}`);
      let score = 0;
      for (const w of words) {
        if (pNorm.includes(w)) score += 1;
      }
      if (score > bestScore) {
        bestScore = score;
        bestProduct = p;
      }
    }

    return bestScore > 0 ? bestProduct : null;
  },

  // Raw Materials
  getRawMaterials(): RawMaterial[] {
    return getItem<RawMaterial[]>(KEYS.RAW_MATERIALS, INITIAL_RAW_MATERIALS);
  },

  saveRawMaterial(mat: RawMaterial, skipAudit = false): RawMaterial {
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
    syncDocToFirestore('raw_materials', mat.id, mat).catch(() => {});
    if (!skipAudit) {
      this.logAudit('Salvar Matéria-Prima', 'Matéria-Prima', mat.id, `${mat.name}: ${mat.stockQuantity} ${mat.unit}`);
    }
    return mat;
  },

  deleteRawMaterial(id: string) {
    const list = this.getRawMaterials().filter(m => m.id !== id);
    setItem(KEYS.RAW_MATERIALS, list);
    deleteDocFromFirestore('raw_materials', id).catch(() => {});
    this.logAudit('Excluir Matéria-Prima', 'Matéria-Prima', id, `Matéria-prima removida.`);
  },

  // Customers
  getCustomers(): Customer[] {
    return getItem<Customer[]>(KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
  },

  saveCustomer(customer: Customer, skipAudit = false): Customer {
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
    syncDocToFirestore('customers', customer.id, customer).catch(() => {});
    if (!skipAudit) {
      this.logAudit('Salvar Cliente', 'Cliente', customer.id, `Cliente ${customer.name} registrado.`);
    }
    return customer;
  },

  deleteCustomer(id: string) {
    const customers = this.getCustomers();
    const target = customers.find(c => c.id === id);
    if (!target) return;

    const list = customers.filter(c => c.id !== id);
    setItem(KEYS.CUSTOMERS, list);
    deleteDocFromFirestore('customers', id).catch(() => {});
    this.logAudit('Excluir Cliente', 'Cliente', id, `Cliente ${target.name} removido do cadastro.`);
  },

  findOrCreateCustomerByName(name: string): Customer {
    const cleanName = name.trim();
    const customers = this.getCustomers();
    const qNorm = normalizeString(cleanName);
    const found = customers.find(c => normalizeString(c.name).includes(qNorm) || qNorm.includes(normalizeString(c.name)));
    if (found) return found;
    
    const newCustomer: Customer = {
      id: `cli-${Date.now()}`,
      name: cleanName,
      type: 'Cliente final',
      createdAt: new Date().toISOString().split('T')[0]
    };
    return this.saveCustomer(newCustomer);
  },

  // Sales (with Delta-based Stock Management & Receivables Sync)
  getSales(): Sale[] {
    return getItem<Sale[]>(KEYS.SALES, INITIAL_SALES);
  },

  saveSale(sale: Sale, options?: { skipStockAdjustment?: boolean; skipAudit?: boolean }): Sale {
    const sales = this.getSales();
    const idx = sales.findIndex(s => s.id === sale.id);
    const oldSale = idx >= 0 ? sales[idx] : null;

    // Normalizing values
    sale.totalValue = Math.max(0, Number(sale.totalValue) || 0);
    sale.discount = Math.max(0, Number(sale.discount) || 0);
    sale.paidValue = Math.min(sale.totalValue, Math.max(0, Number(sale.paidValue) || 0));
    sale.pendingValue = Math.max(0, sale.totalValue - sale.paidValue);
    
    if (sale.status !== 'Cancelada') {
      sale.status = sale.pendingValue === 0 ? 'Concluída' : (sale.paidValue > 0 ? 'Parcial' : 'Pendente');
    }

    if (!options?.skipStockAdjustment && sale.status !== 'Cancelada') {
      const products = this.getProducts();

      // 1. If updating an existing active sale, restore old items to stock first
      if (oldSale && oldSale.status !== 'Cancelada') {
        oldSale.items.forEach(oldItem => {
          const p = products.find(prod => prod.id === oldItem.productId || normalizeString(prod.name) === normalizeString(oldItem.productName));
          if (p) {
            p.stock += oldItem.quantity;
          }
        });
      }

      // 2. Deduct new items from stock
      sale.items.forEach(newItem => {
        const p = products.find(prod => prod.id === newItem.productId || normalizeString(prod.name) === normalizeString(newItem.productName));
        if (p) {
          p.stock = Math.max(0, p.stock - newItem.quantity);
        }
      });

      // Save updated products
      setItem(KEYS.PRODUCTS, products);
    }

    // Update sales collection
    let updatedSales: Sale[];
    if (idx >= 0) {
      updatedSales = [...sales];
      updatedSales[idx] = sale;
    } else {
      updatedSales = [sale, ...sales];
    }
    setItem(KEYS.SALES, updatedSales);
    syncDocToFirestore('sales', sale.id, sale).catch(() => {});

    // Synchronize Account Receivables
    if (sale.customerId) {
      const receivables = this.getReceivables();
      const recIdx = receivables.findIndex(r => r.saleId === sale.id);

      if (sale.status === 'Cancelada') {
        if (recIdx >= 0) {
          receivables.splice(recIdx, 1);
          setItem(KEYS.RECEIVABLES, receivables);
        }
      } else if (sale.pendingValue > 0) {
        if (recIdx >= 0) {
          receivables[recIdx].amount = sale.pendingValue + receivables[recIdx].amountPaid;
          receivables[recIdx].customerName = sale.customerName;
          receivables[recIdx].description = `Venda ${sale.code} - ${sale.items.map(i => i.productName).join(', ')}`;
          setItem(KEYS.RECEIVABLES, receivables);
        } else {
          const newReceivable: AccountReceivable = {
            id: `rec-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
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
          this.saveReceivable(newReceivable, true);
        }
      } else if (recIdx >= 0) {
        receivables[recIdx].amountPaid = receivables[recIdx].amount;
        receivables[recIdx].status = 'Pago';
        setItem(KEYS.RECEIVABLES, receivables);
      }
    }

    if (!options?.skipAudit) {
      this.logAudit(
        idx >= 0 ? 'Editar Venda' : 'Registrar Venda',
        'Venda',
        sale.id,
        `Venda ${sale.code} para ${sale.customerName} - Total: R$ ${sale.totalValue.toFixed(2)} (Pago: R$ ${sale.paidValue.toFixed(2)}, Pendente: R$ ${sale.pendingValue.toFixed(2)})`
      );
    }

    return sale;
  },

  deleteSale(id: string) {
    const sales = this.getSales();
    const target = sales.find(s => s.id === id);
    if (!target) return;

    // Restore stock
    if (target.status !== 'Cancelada') {
      const products = this.getProducts();
      target.items.forEach(item => {
        const p = products.find(prod => prod.id === item.productId || normalizeString(prod.name) === normalizeString(item.productName));
        if (p) {
          p.stock += item.quantity;
        }
      });
      setItem(KEYS.PRODUCTS, products);
    }

    // Remove associated receivable
    const receivables = this.getReceivables().filter(r => r.saleId !== id);
    setItem(KEYS.RECEIVABLES, receivables);

    // Remove sale
    const updatedSales = sales.filter(s => s.id !== id);
    setItem(KEYS.SALES, updatedSales);
    deleteDocFromFirestore('sales', id).catch(() => {});

    this.logAudit('Excluir Venda', 'Venda', id, `Venda ${target.code} cancelada e estoque estornado.`);
  },

  // Production Batches (with Idempotency & Stock Duplication Guards)
  getProduction(): ProductionBatch[] {
    return getItem<ProductionBatch[]>(KEYS.PRODUCTION, INITIAL_PRODUCTION_BATCHES);
  },

  saveProduction(batch: ProductionBatch, skipAudit = false): ProductionBatch {
    const list = this.getProduction();
    const idx = list.findIndex(b => b.id === batch.id);
    const oldBatch = idx >= 0 ? list[idx] : null;

    batch.quantityPlanned = Math.max(0, Number(batch.quantityPlanned) || 0);
    batch.quantityProduced = Math.max(0, Number(batch.quantityProduced) || batch.quantityPlanned);
    batch.quantityLost = Math.max(0, Number(batch.quantityLost) || 0);
    batch.quantityGood = Math.max(0, batch.quantityProduced - batch.quantityLost);

    const wasCredited = oldBatch ? (oldBatch.stockCredited === true || (oldBatch.stage === 'Pronto' && oldBatch.stockCredited !== false)) : false;
    const isNowPronto = batch.stage === 'Pronto' && batch.quantityGood > 0;

    const products = this.getProducts();
    const p = products.find(prod => prod.id === batch.productId || normalizeString(prod.name) === normalizeString(batch.productName));

    if (p) {
      if (wasCredited && isNowPronto) {
        // Delta adjustment if quantityGood changed
        const diff = batch.quantityGood - (oldBatch?.quantityGood || 0);
        if (diff !== 0) {
          p.stock = Math.max(0, p.stock + diff);
          this.saveProduct(p, true);
        }
        batch.stockCredited = true;
      } else if (!wasCredited && isNowPronto) {
        // First time entering Pronto
        p.stock += batch.quantityGood;
        this.saveProduct(p, true);
        batch.stockCredited = true;
      } else if (wasCredited && !isNowPronto) {
        // Reverting from Pronto to earlier stage
        p.stock = Math.max(0, p.stock - (oldBatch?.quantityGood || 0));
        this.saveProduct(p, true);
        batch.stockCredited = false;
      }
    } else if (isNowPronto) {
      batch.stockCredited = true;
    }

    let updated: ProductionBatch[];
    if (idx >= 0) {
      updated = [...list];
      updated[idx] = batch;
    } else {
      updated = [batch, ...list];
    }
    setItem(KEYS.PRODUCTION, updated);
    syncDocToFirestore('production_batches', batch.id, batch).catch(() => {});

    if (!skipAudit) {
      this.logAudit(
        idx >= 0 ? 'Editar Produção' : 'Registrar Produção',
        'Produção',
        batch.id,
        `Lote ${batch.code} (${batch.productName}): ${batch.quantityGood} boas, ${batch.quantityLost} perdas. Etapa: ${batch.stage}`
      );
    }
    return batch;
  },

  deleteProduction(id: string) {
    const list = this.getProduction();
    const target = list.find(b => b.id === id);
    if (!target) return;

    if (target.stockCredited && target.quantityGood > 0) {
      const products = this.getProducts();
      const p = products.find(prod => prod.id === target.productId || normalizeString(prod.name) === normalizeString(target.productName));
      if (p) {
        p.stock = Math.max(0, p.stock - target.quantityGood);
        this.saveProduct(p, true);
      }
    }

    const updated = list.filter(b => b.id !== id);
    setItem(KEYS.PRODUCTION, updated);
    deleteDocFromFirestore('production_batches', id).catch(() => {});
    this.logAudit('Excluir Produção', 'Produção', id, `Lote de produção ${target.code} removido.`);
  },

  // Custom Orders
  getCustomOrders(): CustomOrder[] {
    return getItem<CustomOrder[]>(KEYS.CUSTOM_ORDERS, INITIAL_CUSTOM_ORDERS);
  },

  saveCustomOrder(order: CustomOrder, skipAudit = false): CustomOrder {
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
    syncDocToFirestore('custom_orders', order.id, order).catch(() => {});
    if (!skipAudit) {
      this.logAudit('Salvar Pedido Personalizado', 'Pedido', order.id, `Pedido ${order.code} de ${order.customerName} - ${order.productDescription}`);
    }
    return order;
  },

  deleteCustomOrder(id: string) {
    const list = this.getCustomOrders().filter(o => o.id !== id);
    setItem(KEYS.CUSTOM_ORDERS, list);
    deleteDocFromFirestore('custom_orders', id).catch(() => {});
    this.logAudit('Excluir Pedido', 'Pedido', id, `Pedido personalizado removido.`);
  },

  // Deliveries
  getDeliveries(): Delivery[] {
    return getItem<Delivery[]>(KEYS.DELIVERIES, INITIAL_DELIVERIES);
  },

  saveDelivery(del: Delivery, skipAudit = false): Delivery {
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
    syncDocToFirestore('deliveries', del.id, del).catch(() => {});
    if (!skipAudit) {
      this.logAudit('Salvar Entrega', 'Entrega', del.id, `Entrega para ${del.customerName} - Status: ${del.status}`);
    }
    return del;
  },

  deleteDelivery(id: string) {
    const list = this.getDeliveries().filter(d => d.id !== id);
    setItem(KEYS.DELIVERIES, list);
    deleteDocFromFirestore('deliveries', id).catch(() => {});
    this.logAudit('Excluir Entrega', 'Entrega', id, `Entrega removida.`);
  },

  // Expenses
  getExpenses(): Expense[] {
    return getItem<Expense[]>(KEYS.EXPENSES, INITIAL_EXPENSES);
  },

  saveExpense(exp: Expense, skipAudit = false): Expense {
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
    syncDocToFirestore('financial_records', exp.id, {
      ...exp,
      type: 'Despesa'
    }).catch(() => {});
    if (!skipAudit) {
      this.logAudit('Registrar Despesa', 'Despesa', exp.id, `Despesa: ${exp.description} - R$ ${exp.amount.toFixed(2)} (${exp.status})`);
    }
    return exp;
  },

  deleteExpense(id: string) {
    const list = this.getExpenses().filter(e => e.id !== id);
    setItem(KEYS.EXPENSES, list);
    deleteDocFromFirestore('financial_records', id).catch(() => {});
    this.logAudit('Excluir Despesa', 'Despesa', id, `Despesa removida.`);
  },

  // Account Receivables
  getReceivables(): AccountReceivable[] {
    return getItem<AccountReceivable[]>(KEYS.RECEIVABLES, INITIAL_RECEIVABLES);
  },

  saveReceivable(rec: AccountReceivable, skipAudit = false): AccountReceivable {
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
    syncDocToFirestore('financial_records', rec.id, {
      ...rec,
      type: 'Recebível'
    }).catch(() => {});
    if (!skipAudit) {
      this.logAudit('Conta a Receber', 'Recebível', rec.id, `${rec.customerName}: R$ ${rec.amount.toFixed(2)} (Pago: R$ ${rec.amountPaid.toFixed(2)})`);
    }
    return rec;
  },

  deleteReceivable(id: string) {
    const list = this.getReceivables().filter(r => r.id !== id);
    setItem(KEYS.RECEIVABLES, list);
    deleteDocFromFirestore('financial_records', id).catch(() => {});
    this.logAudit('Excluir Recebível', 'Recebível', id, `Conta a receber removida.`);
  },

  recordCustomerPayment(
    customerName: string,
    amount: number,
    notes?: string
  ): { paidAmount: number; remainingDebt: number } {
    const cleanAmount = Math.max(0, Number(amount) || 0);
    if (cleanAmount <= 0) {
      return { paidAmount: 0, remainingDebt: 0 };
    }

    const receivables = this.getReceivables();
    const qNorm = normalizeString(customerName);
    const customerRecs = receivables.filter(
      r => (normalizeString(r.customerName).includes(qNorm) || qNorm.includes(normalizeString(r.customerName))) && r.status !== 'Pago'
    );

    let remainingToApply = cleanAmount;
    let actualPaidTotal = 0;
    const sales = this.getSales();
    let salesModified = false;

    customerRecs.forEach(rec => {
      if (remainingToApply <= 0) return;

      const debt = rec.amount - rec.amountPaid;
      const paymentForThisRec = Math.min(remainingToApply, debt);

      rec.amountPaid += paymentForThisRec;
      remainingToApply -= paymentForThisRec;
      actualPaidTotal += paymentForThisRec;

      if (rec.amountPaid >= rec.amount) {
        rec.status = 'Pago';
      } else {
        rec.status = 'Parcial';
      }

      // Sync linked Sale if present
      if (rec.saleId) {
        const sale = sales.find(s => s.id === rec.saleId);
        if (sale) {
          sale.paidValue = Math.min(sale.totalValue, sale.paidValue + paymentForThisRec);
          sale.pendingValue = Math.max(0, sale.totalValue - sale.paidValue);
          sale.status = sale.pendingValue === 0 ? 'Concluída' : 'Parcial';
          salesModified = true;
        }
      }
    });

    setItem(KEYS.RECEIVABLES, receivables);
    if (salesModified) {
      setItem(KEYS.SALES, sales);
    }

    const remainingDebt = receivables
      .filter(r => (normalizeString(r.customerName).includes(qNorm) || qNorm.includes(normalizeString(r.customerName))) && r.status !== 'Pago')
      .reduce((acc, r) => acc + (r.amount - r.amountPaid), 0);

    this.logAudit(
      'Recebimento de Cliente',
      'Financeiro',
      customerName,
      `Recebido R$ ${actualPaidTotal.toFixed(2)} de ${customerName}. Saldo devedor restante: R$ ${remainingDebt.toFixed(2)}. ${notes || ''}`,
      { actionType: 'RECORD_RECEIVABLE_PAYMENT', customerName, amount: actualPaidTotal }
    );

    return { paidAmount: actualPaidTotal, remainingDebt };
  },

  // Audit Logs & Rollback
  getAuditLogs(): AuditLog[] {
    return getItem<AuditLog[]>(KEYS.AUDIT, INITIAL_AUDIT_LOGS);
  },

  undoAuditAction(logId: string): boolean {
    const logs = this.getAuditLogs();
    const idx = logs.findIndex(l => l.id === logId);
    if (idx < 0) return false;

    const targetLog = logs[idx];
    if (targetLog.status === 'Desfeito') return false;

    // Execute real rollback based on actionData / entityType
    const actionData = targetLog.actionData;
    if (actionData) {
      switch (actionData.actionType) {
        case 'RECORD_SALE': {
          if (actionData.saleId) {
            this.deleteSale(actionData.saleId);
          }
          break;
        }
        case 'RECORD_PRODUCTION': {
          if (actionData.batchId) {
            this.deleteProduction(actionData.batchId);
          }
          break;
        }
        case 'RECORD_RAW_MATERIAL': {
          if (actionData.materialId && actionData.quantity) {
            const raw = this.getRawMaterials();
            const mat = raw.find(m => m.id === actionData.materialId);
            if (mat) {
              mat.stockQuantity = Math.max(0, mat.stockQuantity - actionData.quantity);
              this.saveRawMaterial(mat, true);
            }
          }
          if (actionData.expenseId) {
            this.deleteExpense(actionData.expenseId);
          }
          break;
        }
        case 'RECORD_LOSS': {
          if (actionData.productId && actionData.quantityLost) {
            const products = this.getProducts();
            const prod = products.find(p => p.id === actionData.productId);
            if (prod) {
              prod.stock += actionData.quantityLost;
              this.saveProduct(prod, true);
            }
          }
          if (actionData.batchId) {
            this.deleteProduction(actionData.batchId);
          }
          break;
        }
        case 'RECORD_EXPENSE': {
          if (actionData.expenseId) {
            this.deleteExpense(actionData.expenseId);
          }
          break;
        }
        case 'RECORD_DELIVERY': {
          if (actionData.deliveryId) {
            const deliveries = this.getDeliveries();
            const del = deliveries.find(d => d.id === actionData.deliveryId);
            if (del) {
              del.status = 'Pendente';
              delete del.completedAt;
              this.saveDelivery(del, true);
            }
          }
          break;
        }
        default:
          break;
      }
    } else if (targetLog.entityType === 'Venda' && targetLog.entityId) {
      this.deleteSale(targetLog.entityId);
    } else if (targetLog.entityType === 'Produção' && targetLog.entityId) {
      this.deleteProduction(targetLog.entityId);
    } else if (targetLog.entityType === 'Despesa' && targetLog.entityId) {
      this.deleteExpense(targetLog.entityId);
    }

    targetLog.status = 'Desfeito';
    setItem(KEYS.AUDIT, logs);
    this.logAudit('Desfazer Ação', 'Auditoria', logId, `Ação "${targetLog.action}" revertida pelo usuário com estorno total.`);
    return true;
  },

  logAudit(action: string, entityType: string, entityId: string, details: string, actionData?: any) {
    const logs = getItem<AuditLog[]>(KEYS.AUDIT, INITIAL_AUDIT_LOGS);
    const newLog: AuditLog = {
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      user: 'Oleiro Zico',
      action,
      entityType,
      entityId,
      details,
      status: 'Aplicado',
      actionData
    };
    setItem(KEYS.AUDIT, [newLog, ...logs]);
    syncDocToFirestore('audit_logs', newLog.id, newLog).catch(() => {});
  },

  // Apply Voice Action (Full NLU Execution with Zero-Corruption Guards)
  applyVoiceAction(payload: NluActionPayload): { success: boolean; message: string } {
    const parsed = payload.parsedData;
    if (!parsed) return { success: false, message: 'Dados incompletos para registrar.' };

    switch (payload.intent) {
      case 'RECORD_SALE': {
        const prodNameQuery = parsed.productName || 'Vaso';
        let prod = this.findBestProductMatch(prodNameQuery);

        const qty = Math.max(1, parsed.quantity || 1);
        const unitPrice = parsed.unitPrice || (prod ? prod.price : 180);
        const totalPrice = parsed.totalPrice || (qty * unitPrice);
        
        let paidValue = parsed.paidValue;
        if (paidValue === undefined) {
          paidValue = parsed.paymentMethod === 'Fiado' ? 0 : totalPrice;
        }
        paidValue = Math.min(totalPrice, Math.max(0, paidValue));
        const pendingValue = Math.max(0, totalPrice - paidValue);

        const customer = this.findOrCreateCustomerByName(parsed.customerName || 'Cliente Balcão');

        // Stock check warning
        let stockWarning = '';
        if (prod && prod.stock < qty) {
          stockWarning = ` (Atenção: estoque atual era de ${prod.stock} un).`;
        }

        const newSale: Sale = {
          id: `sale-${Date.now()}`,
          code: `VND-${Math.floor(1000 + Math.random() * 9000)}`,
          customerId: customer.id,
          customerName: customer.name,
          items: [{
            productId: prod ? prod.id : `prod-custom-${Date.now()}`,
            productName: prod ? prod.name : prodNameQuery,
            quantity: qty,
            unitPrice: unitPrice,
            totalPrice: totalPrice
          }],
          totalValue: totalPrice,
          discount: 0,
          paidValue: paidValue,
          pendingValue: pendingValue,
          paymentMethod: parsed.paymentMethod || (paidValue === 0 ? 'Fiado' : 'Pix'),
          date: new Date().toISOString().split('T')[0],
          notes: 'Registrado via comando de voz',
          status: pendingValue === 0 ? 'Concluída' : (paidValue > 0 ? 'Parcial' : 'Pendente')
        };

        this.saveSale(newSale);

        this.logAudit(
          'Venda por Voz',
          'Venda',
          newSale.id,
          `Venda ${newSale.code} de ${qty}x ${newSale.items[0].productName} para ${customer.name} - R$ ${totalPrice.toFixed(2)}`,
          { actionType: 'RECORD_SALE', saleId: newSale.id }
        );

        return {
          success: true,
          message: `Venda de ${qty}x ${newSale.items[0].productName} para ${customer.name} gravada com sucesso!${stockWarning}`
        };
      }

      case 'RECORD_PRODUCTION': {
        const prodNameQuery = parsed.productName || 'Vaso Médio';
        let prod = this.findBestProductMatch(prodNameQuery);

        const qtyProduced = Math.max(1, parsed.quantityProduced || 10);
        const qtyLost = Math.max(0, parsed.quantityLost || 0);
        const qtyGood = Math.max(0, qtyProduced - qtyLost);
        const stage = parsed.stage || 'Pronto';

        const newBatch: ProductionBatch = {
          id: `batch-${Date.now()}`,
          code: `PRD-${Math.floor(100 + Math.random() * 900)}`,
          productId: prod ? prod.id : `prod-custom-${Date.now()}`,
          productName: prod ? prod.name : prodNameQuery,
          quantityPlanned: qtyProduced,
          quantityProduced: qtyProduced,
          quantityLost: qtyLost,
          quantityGood: qtyGood,
          stage,
          startDate: new Date().toISOString().split('T')[0],
          completedDate: stage === 'Pronto' ? new Date().toISOString().split('T')[0] : undefined,
          notes: 'Registrado via voz'
        };

        this.saveProduction(newBatch);

        this.logAudit(
          'Produção por Voz',
          'Produção',
          newBatch.id,
          `Produção ${newBatch.code} de ${newBatch.productName}: ${qtyGood} peças boas (${qtyLost} perdas)`,
          { actionType: 'RECORD_PRODUCTION', batchId: newBatch.id }
        );

        return {
          success: true,
          message: `Produção de ${qtyGood} peças boas (${qtyLost} perdas) de ${newBatch.productName} registrada na etapa ${stage}!`
        };
      }

      case 'RECORD_RAW_MATERIAL': {
        const matName = parsed.materialName || 'Argila Terracota';
        const rawMaterials = this.getRawMaterials();
        let mat = rawMaterials.find(m => normalizeString(m.name).includes(normalizeString(matName)) || normalizeString(matName).includes(normalizeString(m.name)));

        const qty = Math.max(1, parsed.quantity || 50);
        const amount = Math.max(0, parsed.amount || 300);

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
            costPerUnit: amount / qty,
            lastPurchaseDate: new Date().toISOString().split('T')[0]
          };
          this.saveRawMaterial(mat);
        }

        // Record corresponding expense
        const newExpense: Expense = {
          id: `exp-${Date.now()}`,
          description: `Compra de ${qty} ${mat.unit} de ${mat.name}`,
          category: 'Matéria-Prima',
          amount: amount,
          supplier: 'Fornecedor Voz',
          dueDate: new Date().toISOString().split('T')[0],
          paidDate: new Date().toISOString().split('T')[0],
          status: 'Paga',
          notes: 'Registrado por voz'
        };
        this.saveExpense(newExpense);

        this.logAudit(
          'Compra de Matéria-Prima por Voz',
          'Matéria-Prima',
          mat.id,
          `Compra de ${qty} ${mat.unit} de ${mat.name} - R$ ${amount.toFixed(2)}`,
          { actionType: 'RECORD_RAW_MATERIAL', materialId: mat.id, quantity: qty, expenseId: newExpense.id }
        );

        return {
          success: true,
          message: `Compra de ${qty} ${mat.unit} de ${mat.name} no valor de R$ ${amount.toFixed(2)} lançada com sucesso!`
        };
      }

      case 'RECORD_LOSS': {
        const prodNameQuery = parsed.productName || 'Vaso';
        let prod = this.findBestProductMatch(prodNameQuery);
        const qtyLost = Math.max(1, parsed.quantityLost || 1);

        if (prod) {
          prod.stock = Math.max(0, prod.stock - qtyLost);
          this.saveProduct(prod);
        }

        const batchLoss: ProductionBatch = {
          id: `loss-${Date.now()}`,
          code: `PRD-PERDA`,
          productId: prod ? prod.id : 'prod-loss',
          productName: prod ? prod.name : prodNameQuery,
          quantityPlanned: qtyLost,
          quantityProduced: 0,
          quantityLost: qtyLost,
          quantityGood: 0,
          stage: 'Queima',
          startDate: new Date().toISOString().split('T')[0],
          notes: 'Perda/Quebra registrada via comando de voz',
          stockCredited: false
        };
        this.saveProduction(batchLoss);

        this.logAudit(
          'Perda/Quebra por Voz',
          'Produção',
          batchLoss.id,
          `Quebra de ${qtyLost}x ${batchLoss.productName}`,
          { actionType: 'RECORD_LOSS', productId: prod?.id, quantityLost: qtyLost, batchId: batchLoss.id }
        );

        return {
          success: true,
          message: `Registrado perda/quebra de ${qtyLost}x ${batchLoss.productName}. Estoque atualizado.`
        };
      }

      case 'RECORD_RECEIVABLE_PAYMENT': {
        const customerName = parsed.customerName || 'Cliente';
        const amount = Math.max(1, parsed.amount || 100);
        const res = this.recordCustomerPayment(customerName, amount, 'Via comando de voz');
        return {
          success: true,
          message: `Recebimento de R$ ${res.paidAmount.toFixed(2)} de ${customerName} registrado com sucesso! Saldo restante: R$ ${res.remainingDebt.toFixed(2)}`
        };
      }

      case 'RECORD_EXPENSE': {
        const amount = Math.max(1, parsed.amount || 50);
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

        this.logAudit(
          'Despesa por Voz',
          'Despesa',
          newExp.id,
          `Despesa ${newExp.description} - R$ ${amount.toFixed(2)}`,
          { actionType: 'RECORD_EXPENSE', expenseId: newExp.id }
        );

        return { success: true, message: `Despesa de R$ ${amount.toFixed(2)} (${newExp.description}) registrada!` };
      }

      case 'RECORD_DELIVERY': {
        const customerName = parsed.customerName || 'Cliente';
        const deliveries = this.getDeliveries();
        const pendingDel = deliveries.find(
          d => normalizeString(d.customerName).includes(normalizeString(customerName)) && d.status !== 'Entregue'
        );

        if (pendingDel) {
          pendingDel.status = 'Entregue';
          pendingDel.completedAt = new Date().toISOString();
          this.saveDelivery(pendingDel);

          this.logAudit(
            'Entrega por Voz',
            'Entrega',
            pendingDel.id,
            `Entrega de ${pendingDel.customerName} concluída`,
            { actionType: 'RECORD_DELIVERY', deliveryId: pendingDel.id }
          );

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

          this.logAudit(
            'Entrega por Voz',
            'Entrega',
            newDel.id,
            `Entrega de ${customerName} concluída`,
            { actionType: 'RECORD_DELIVERY', deliveryId: newDel.id }
          );

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
