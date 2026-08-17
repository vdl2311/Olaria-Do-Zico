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
  AuditLog
} from '../types';

export const DEMO_TENANT_ID = 'tenant_demo_sandbox_01';

export const DEMO_PRODUCTS: Product[] = [
  {
    id: 'prod-demo-1',
    tenantId: DEMO_TENANT_ID,
    code: 'VAS-COL-60',
    name: 'Vaso Coluna Canelado 60cm',
    category: 'Vasos',
    size: 'G',
    price: 220.00,
    cost: 85.00,
    stock: 42,
    minStock: 15,
    description: 'Vaso coluna alto ideal para folhagens e plantas de porte médio.',
    finish: 'Terracota Natural'
  },
  {
    id: 'prod-demo-2',
    tenantId: DEMO_TENANT_ID,
    code: 'FNT-BAC-4',
    name: 'Fonte Bacia 4 Quedas Artesanal',
    category: 'Fontes',
    size: 'G',
    price: 450.00,
    cost: 160.00,
    stock: 12,
    minStock: 5,
    description: 'Fonte de água artesanal com bomba bivolt e cascata suave para jardim.',
    finish: 'Esmaltado Azul Cobalto'
  },
  {
    id: 'prod-demo-3',
    tenantId: DEMO_TENANT_ID,
    code: 'VAS-TER-45',
    name: 'Vaso Terracota Bojudo 45cm',
    category: 'Vasos',
    size: 'G',
    price: 180.00,
    cost: 65.00,
    stock: 38,
    minStock: 15,
    description: 'Vaso artesanal em barro cozido com queima lenta em forno a lenha.',
    finish: 'Terracota Rústico'
  },
  {
    id: 'prod-demo-4',
    tenantId: DEMO_TENANT_ID,
    code: 'JARD-RUS-60',
    name: 'Jardineira Rústica Cerâmica 60cm',
    category: 'Jardineiras',
    size: 'M',
    price: 120.00,
    cost: 45.00,
    stock: 24,
    minStock: 10,
    description: 'Jardineira retangular ideal para plantas ornamentais e hortas caseiras.',
    finish: 'Esmalte Terracota'
  },
  {
    id: 'prod-demo-5',
    tenantId: DEMO_TENANT_ID,
    code: 'FNT-CAS-3',
    name: 'Fonte Cascata Cerâmica 3 Quedas',
    category: 'Fontes',
    size: 'G',
    price: 380.00,
    cost: 140.00,
    stock: 9,
    minStock: 5,
    description: 'Fonte decorativa completa para áreas externas e jardins.',
    finish: 'Verniz Hidrorrepelente'
  },
  {
    id: 'prod-demo-6',
    tenantId: DEMO_TENANT_ID,
    code: 'VAS-DEC-75',
    name: 'Vaso Grande de Chão 75cm Esmaltado',
    category: 'Vasos decorativos',
    size: 'GG',
    price: 350.00,
    cost: 130.00,
    stock: 18,
    minStock: 8,
    description: 'Vaso decorativo de grande porte moldado à mão no torno.',
    finish: 'Esmalte Reativo Verde'
  }
];

export const DEMO_RAW_MATERIALS: RawMaterial[] = [
  {
    id: 'mat-demo-1',
    tenantId: DEMO_TENANT_ID,
    name: 'Argila Vermelha Plastificada',
    category: 'Argila',
    stockQuantity: 18500,
    unit: 'kg',
    minStock: 5000,
    costPerUnit: 0.14,
    supplier: 'Mineradora Vale do Paraíba (Demo)',
    lastPurchaseDate: '2026-08-01'
  },
  {
    id: 'mat-demo-2',
    tenantId: DEMO_TENANT_ID,
    name: 'Areia Fina Lavada Especial',
    category: 'Outros',
    stockQuantity: 8000,
    unit: 'kg',
    minStock: 3000,
    costPerUnit: 0.095,
    supplier: 'Areeiro São Pedro (Demo)',
    lastPurchaseDate: '2026-08-05'
  },
  {
    id: 'mat-demo-3',
    tenantId: DEMO_TENANT_ID,
    name: 'Lenha de Eucalipto Reflorestada (Forno)',
    category: 'Outros',
    stockQuantity: 24000,
    unit: 'kg',
    minStock: 10000,
    costPerUnit: 0.085,
    supplier: 'Florestal Santa Fé (Demo)',
    lastPurchaseDate: '2026-08-10'
  },
  {
    id: 'mat-demo-4',
    tenantId: DEMO_TENANT_ID,
    name: 'Esmalte e Verniz Hidrorrepelente',
    category: 'Acabamento',
    stockQuantity: 45.0,
    unit: 'L',
    minStock: 20.0,
    costPerUnit: 22.00,
    supplier: 'Química Cerâmica Brasil (Demo)',
    lastPurchaseDate: '2026-07-25'
  }
];

export const DEMO_CUSTOMERS: Customer[] = [
  {
    id: 'cli-demo-1',
    tenantId: DEMO_TENANT_ID,
    name: 'Construtora & Paisagismo Verde Ltda',
    phone: '(11) 98765-4321',
    type: 'Empresa',
    address: 'Av. Paulista 1000 - Cj 52, São Paulo - SP',
    cpfCnpj: '12.345.678/0001-90',
    notes: 'Cliente preferencial para vasos de grande porte e fontes em condomínios.',
    createdAt: '2026-01-15'
  },
  {
    id: 'cli-demo-2',
    tenantId: DEMO_TENANT_ID,
    name: 'Floricultura & Decoração Paulistana',
    phone: '(11) 97654-3210',
    type: 'Revendedor',
    address: 'Rodovia Anhanguera km 65, Jundiaí - SP',
    cpfCnpj: '23.456.789/0001-01',
    notes: 'Compra mensal de vasos decorativos, fontes e cachepôs.',
    createdAt: '2026-02-01'
  },
  {
    id: 'cli-demo-3',
    tenantId: DEMO_TENANT_ID,
    name: 'Roberto Albuquerque (Paisagismo)',
    phone: '(11) 96543-2109',
    type: 'Paisagista',
    address: 'Rua das Camélias 140, Atibaia - SP',
    notes: 'Projetos residenciais de alto padrão com vasos e fontes sob medida.',
    createdAt: '2026-03-10'
  },
  {
    id: 'cli-demo-4',
    tenantId: DEMO_TENANT_ID,
    name: 'Depósito São José Decorações',
    phone: '(11) 95432-1098',
    type: 'Loja',
    address: 'Rua Central 890, Bragança Paulista - SP',
    cpfCnpj: '34.567.890/0001-12',
    notes: 'Retira no balcão com frete próprio.',
    createdAt: '2026-04-05'
  }
];

export const DEMO_SALES: Sale[] = [
  {
    id: 'sale-demo-1',
    tenantId: DEMO_TENANT_ID,
    code: 'VND-DEMO-701',
    customerId: 'cli-demo-1',
    customerName: 'Construtora & Paisagismo Verde Ltda',
    items: [
      {
        productId: 'prod-demo-1',
        productName: 'Vaso Coluna Canelado 60cm',
        quantity: 10,
        unitPrice: 220.00,
        totalPrice: 2200.00
      }
    ],
    totalValue: 2200.00,
    discount: 0,
    paidValue: 2200.00,
    pendingValue: 0,
    paymentMethod: 'Pix',
    date: '2026-08-14',
    notes: 'Venda de demonstração - 10x Vasos Coluna pagos à vista via Pix.',
    status: 'Concluída'
  },
  {
    id: 'sale-demo-2',
    tenantId: DEMO_TENANT_ID,
    code: 'VND-DEMO-702',
    customerId: 'cli-demo-3',
    customerName: 'Roberto Albuquerque (Paisagismo)',
    items: [
      {
        productId: 'prod-demo-3',
        productName: 'Vaso Terracota Bojudo 45cm',
        quantity: 4,
        unitPrice: 180.00,
        totalPrice: 720.00
      },
      {
        productId: 'prod-demo-4',
        productName: 'Jardineira Rústica Cerâmica 60cm',
        quantity: 2,
        unitPrice: 120.00,
        totalPrice: 240.00
      }
    ],
    totalValue: 960.00,
    discount: 0,
    paidValue: 480.00,
    pendingValue: 480.00,
    paymentMethod: 'Fiado',
    date: '2026-08-15',
    notes: 'Venda de demonstração - Sinal de 50% pago, restante a 15 dias.',
    status: 'Parcial'
  },
  {
    id: 'sale-demo-3',
    tenantId: DEMO_TENANT_ID,
    code: 'VND-DEMO-703',
    customerId: 'cli-demo-4',
    customerName: 'Depósito São José Decorações',
    items: [
      {
        productId: 'prod-demo-2',
        productName: 'Fonte Bacia 4 Quedas Artesanal',
        quantity: 3,
        unitPrice: 450.00,
        totalPrice: 1350.00
      }
    ],
    totalValue: 1350.00,
    discount: 0,
    paidValue: 1350.00,
    pendingValue: 0,
    paymentMethod: 'Boleto',
    date: '2026-08-12',
    notes: 'Venda de demonstração - 3 Fontes Bacia com entrega própria do cliente.',
    status: 'Concluída'
  }
];

export const DEMO_PRODUCTION_BATCHES: ProductionBatch[] = [
  {
    id: 'batch-demo-1',
    tenantId: DEMO_TENANT_ID,
    code: 'PRD-DEMO-301',
    productId: 'prod-demo-1',
    productName: 'Vaso Coluna Canelado 60cm',
    quantityPlanned: 50,
    quantityProduced: 50,
    quantityLost: 2,
    quantityGood: 48,
    stage: 'Pronto',
    startDate: '2026-08-10',
    completedDate: '2026-08-13',
    stockCredited: true,
    notes: 'Lote de vasos concluído no Forno 1 - Excelente acabamento e tonalidade terracota.'
  },
  {
    id: 'batch-demo-2',
    tenantId: DEMO_TENANT_ID,
    code: 'PRD-DEMO-302',
    productId: 'prod-demo-2',
    productName: 'Fonte Bacia 4 Quedas Artesanal',
    quantityPlanned: 20,
    quantityProduced: 20,
    quantityLost: 1,
    quantityGood: 19,
    stage: 'Queima',
    startDate: '2026-08-14',
    stockCredited: false,
    notes: 'Forno 2 em regime de queima a 980°C para vitrificação do esmalte azul.'
  },
  {
    id: 'batch-demo-3',
    tenantId: DEMO_TENANT_ID,
    code: 'PRD-DEMO-303',
    productId: 'prod-demo-3',
    productName: 'Vaso Terracota Bojudo 45cm',
    quantityPlanned: 50,
    quantityProduced: 50,
    quantityLost: 2,
    quantityGood: 48,
    stage: 'Secagem',
    startDate: '2026-08-15',
    stockCredited: false,
    notes: 'Secagem natural ao abrigo do sol no galpão norte.'
  }
];

export const DEMO_CUSTOM_ORDERS: CustomOrder[] = [
  {
    id: 'order-demo-1',
    tenantId: DEMO_TENANT_ID,
    code: 'PED-DEMO-501',
    customerId: 'cli-demo-3',
    customerName: 'Roberto Albuquerque (Paisagismo)',
    productDescription: '10x Vasos Cilindro 50cm com gravação personalizada "Reserva Santa Clara"',
    sizeSpecs: '50 cm alt x 35 cm diâmetro',
    colorSpecs: 'Terracota Rústico com Brasão em Baixo Relevo',
    totalPrice: 2200.00,
    depositPaid: 1100.00,
    targetDate: '2026-08-28',
    status: 'Em Produção',
    createdAt: '2026-08-10',
    notes: 'Modelagem artesanal no torno iniciada.'
  }
];

export const DEMO_DELIVERIES: Delivery[] = [
  {
    id: 'del-demo-1',
    tenantId: DEMO_TENANT_ID,
    saleId: 'sale-demo-1',
    customerName: 'Construtora & Paisagismo Verde Ltda',
    address: 'Obra Residencial Alphaville - Rod. Fernão Dias km 42, Atibaia - SP',
    deliveryDate: '2026-08-16',
    shippingFee: 180.00,
    deliveryPerson: 'Caminhão da Olaria (Marcos)',
    status: 'Pendente',
    notes: 'Entrega de 10 vasos coluna 60cm agendada para o primeiro horário.'
  },
  {
    id: 'del-demo-2',
    tenantId: DEMO_TENANT_ID,
    saleId: 'sale-demo-3',
    customerName: 'Depósito São José Decorações',
    address: 'Rua Central 890, Bragança Paulista - SP',
    deliveryDate: '2026-08-12',
    shippingFee: 0,
    deliveryPerson: 'Retirada Própria do Cliente',
    status: 'Entregue',
    completedAt: '2026-08-12T15:30:00.000Z',
    notes: 'Retirada de 3 fontes bacia confirmada e conferida pelo encarregado.'
  }
];

export const DEMO_EXPENSES: Expense[] = [
  {
    id: 'exp-demo-1',
    tenantId: DEMO_TENANT_ID,
    description: 'Carga de Argila Especial para Vasos e Fontes (15 toneladas)',
    category: 'Matéria-Prima',
    amount: 2100.00,
    supplier: 'Mineradora Vale do Paraíba (Demo)',
    dueDate: '2026-08-01',
    paidDate: '2026-08-01',
    status: 'Paga',
    notes: 'Nota Fiscal Demo 4102'
  },
  {
    id: 'exp-demo-2',
    tenantId: DEMO_TENANT_ID,
    description: 'Manutenção Preventiva Tornos Cerâmicos e Misturador',
    category: 'Manutenção',
    amount: 680.00,
    supplier: 'Mecânica Industrial Paulista (Demo)',
    dueDate: '2026-08-08',
    paidDate: '2026-08-08',
    status: 'Paga',
    notes: 'Troca de correias e rolamentos dos tornos'
  },
  {
    id: 'exp-demo-3',
    tenantId: DEMO_TENANT_ID,
    description: 'Energia Elétrica Trifásica Fornos e Motores',
    category: 'Energia/Água',
    amount: 1450.00,
    supplier: 'Concessionária de Energia (Demo)',
    dueDate: '2026-08-20',
    status: 'Pendente',
    notes: 'Fatura competência Julho/2026'
  }
];

export const DEMO_RECEIVABLES: AccountReceivable[] = [
  {
    id: 'rec-demo-1',
    tenantId: DEMO_TENANT_ID,
    saleId: 'sale-demo-2',
    customerId: 'cli-demo-3',
    customerName: 'Roberto Albuquerque (Paisagismo)',
    description: 'Venda VND-DEMO-702 - 4x Vaso Terracota + 2x Jardineira (Parcela 2/2)',
    amount: 480.00,
    amountPaid: 0,
    dueDate: '2026-08-30',
    status: 'Pendente',
    notes: 'Saldo a receber referente à venda VND-DEMO-702'
  }
];

export const DEMO_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'audit-demo-01',
    tenantId: DEMO_TENANT_ID,
    timestamp: '2026-08-15T08:00:00.000Z',
    user: 'Sistema Sandbox (Demonstração)',
    action: 'Inicialização Sandbox',
    entityType: 'Ambiente',
    entityId: DEMO_TENANT_ID,
    details: 'Ambiente de demonstração inicializado com dataset fictício 100% isolado da produção.',
    status: 'Aplicado'
  }
];
