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

export const INITIAL_CATEGORIES: string[] = [
  'Vasos',
  'Fontes',
  'Cachepôs',
  'Jardineiras',
  'Vasos decorativos',
  'Peças especiais',
  'Outros'
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    code: 'VNT-001',
    name: 'Vaso Vietnamita Grande',
    category: 'Vasos',
    photoUrl: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&q=80&w=400',
    description: 'Vaso artesanal em argila queimada com acabamento esmaltado alto brilho.',
    size: 'G',
    heightCm: 75,
    widthCm: 45,
    depthCm: 45,
    weightKg: 18.5,
    price: 250.00,
    cost: 85.00,
    estimatedCost: 85.00,
    stock: 12,
    minStock: 5,
    avgProductionDays: 7,
    finish: 'Esmaltado Azul Cobalto',
    colors: ['Azul', 'Terracota'],
    notes: 'Mais vendido para paisagistas.'
  },
  {
    id: 'prod-2',
    code: 'VNT-002',
    name: 'Vaso Vietnamita Médio',
    category: 'Vasos',
    photoUrl: 'https://images.unsplash.com/photo-1615529182904-14819c35db37?auto=format&fit=crop&q=80&w=400',
    description: 'Vaso cerâmico rústico modelo médio.',
    size: 'M',
    heightCm: 50,
    widthCm: 32,
    depthCm: 32,
    weightKg: 11.0,
    price: 180.00,
    estimatedCost: 60.00,
    stock: 8,
    minStock: 4,
    avgProductionDays: 5,
    finish: 'Rústico Envelhecido',
    colors: ['Terracota', 'Verde Oliva'],
    notes: 'Ótimo para ambientes internos.'
  },
  {
    id: 'prod-3',
    code: 'FNT-001',
    name: 'Fonte Decorativa Cascata Cerâmica',
    category: 'Fontes',
    photoUrl: 'https://images.unsplash.com/photo-1584589167171-541ce45f1eea?auto=format&fit=crop&q=80&w=400',
    description: 'Fonte de água com 3 quedas em cerâmica impermeabilizada, acompanha bombinha de água.',
    size: 'G',
    heightCm: 90,
    widthCm: 50,
    depthCm: 50,
    weightKg: 25.0,
    price: 650.00,
    estimatedCost: 220.00,
    stock: 3,
    minStock: 2,
    avgProductionDays: 10,
    finish: 'Esmaltado Reativo',
    colors: ['Verde Esmeralda', 'Bronze'],
    notes: 'Destaque de jardim.'
  },
  {
    id: 'prod-4',
    code: 'CCH-001',
    name: 'Cachepô Trabalhado Flor de Lis',
    category: 'Cachepôs',
    photoUrl: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&q=80&w=400',
    description: 'Cachepô em argila natural moldado com relevos florais.',
    size: 'P',
    heightCm: 25,
    widthCm: 25,
    depthCm: 25,
    weightKg: 4.2,
    price: 75.00,
    estimatedCost: 22.00,
    stock: 15,
    minStock: 6,
    avgProductionDays: 3,
    finish: 'Natural Biscoutado',
    colors: ['Terracota'],
    notes: 'Ideal para orquídeas e suculentas.'
  },
  {
    id: 'prod-5',
    code: 'JRD-001',
    name: 'Jardineira Horizontal de Parede 80cm',
    category: 'Jardineiras',
    photoUrl: 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&q=80&w=400',
    description: 'Jardineira retangular ideal para hortas e jardins suspensos.',
    size: 'G',
    heightCm: 20,
    widthCm: 80,
    depthCm: 22,
    weightKg: 9.5,
    price: 130.00,
    estimatedCost: 45.00,
    stock: 4,
    minStock: 3,
    avgProductionDays: 4,
    finish: 'Selado Cerâmico',
    colors: ['Cerâmica Marrom'],
    notes: 'Demanda constante no outono.'
  },
  {
    id: 'prod-6',
    code: 'ESP-001',
    name: 'Escultura de Sol em Cerâmica',
    category: 'Peças especiais',
    photoUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&q=80&w=400',
    description: 'Peça decorativa de parede entalhada manualmente pelo Zico.',
    size: 'M',
    heightCm: 40,
    widthCm: 40,
    depthCm: 5,
    weightKg: 3.5,
    price: 160.00,
    estimatedCost: 35.00,
    stock: 2,
    minStock: 2,
    avgProductionDays: 6,
    finish: 'Pintura Pátina Rustica',
    colors: ['Amarelo Ocre', 'Solmado'],
    notes: 'Assinada pelo Mestre Zico.'
  }
];

export const INITIAL_RAW_MATERIALS: RawMaterial[] = [
  {
    id: 'mat-1',
    name: 'Argila Tabaco / Escura',
    category: 'Argila',
    stockQuantity: 420,
    unit: 'kg',
    minStock: 100,
    costPerUnit: 6.00,
    lastPurchaseDate: '2026-08-01',
    supplier: 'Mineradora Vale do Barro'
  },
  {
    id: 'mat-2',
    name: 'Argila Terracota Virgem',
    category: 'Argila',
    stockQuantity: 280,
    unit: 'kg',
    minStock: 80,
    costPerUnit: 5.50,
    lastPurchaseDate: '2026-08-05',
    supplier: 'Mineradora Vale do Barro'
  },
  {
    id: 'mat-3',
    name: 'Esmalte Azul Cobalto Cerâmico',
    category: 'Esmalte',
    stockQuantity: 18,
    unit: 'L',
    minStock: 5,
    costPerUnit: 45.00,
    lastPurchaseDate: '2026-07-20',
    supplier: 'Química Cerâmica Arte'
  },
  {
    id: 'mat-4',
    name: 'Tinta Pátina Ocre',
    category: 'Tinta',
    stockQuantity: 8,
    unit: 'L',
    minStock: 2,
    costPerUnit: 32.00,
    lastPurchaseDate: '2026-07-15',
    supplier: 'Tintas Ateliê'
  },
  {
    id: 'mat-5',
    name: 'Plástico Bolha Reforçado (Rolo)',
    category: 'Embalagem',
    stockQuantity: 4,
    unit: 'un',
    minStock: 2,
    costPerUnit: 85.00,
    lastPurchaseDate: '2026-08-02',
    supplier: 'Embalagens Brasil'
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cli-1',
    name: 'João Silva',
    phone: '(11) 98765-4321',
    whatsapp: '5511987654321',
    type: 'Cliente final',
    city: 'São Paulo',
    notes: 'Gosta de vasos azuis para jardim de inverno.',
    createdAt: '2026-05-10'
  },
  {
    id: 'cli-2',
    name: 'Carlos Mendes',
    phone: '(11) 97654-3210',
    whatsapp: '5511976543210',
    type: 'Loja',
    cpfCnpj: '12.345.678/0001-90',
    address: 'Av. das Flores, 1200',
    city: 'Campinas',
    notes: 'Dono da Jardinagem Verde Vida. Compra em lote.',
    createdAt: '2026-04-12'
  },
  {
    id: 'cli-3',
    name: 'Maria Oliveira (Studio Arquitetura)',
    phone: '(11) 96543-2109',
    whatsapp: '5511965432109',
    type: 'Arquiteto',
    city: 'São Paulo',
    notes: 'Especifica peças personalizadas em projetos de alto padrão.',
    createdAt: '2026-06-01'
  },
  {
    id: 'cli-4',
    name: 'Pedro Santos',
    phone: '(11) 95432-1098',
    whatsapp: '5511954321098',
    type: 'Cliente final',
    city: 'Sorocaba',
    notes: 'Possui conta em aberto (fiado).',
    createdAt: '2026-07-02'
  }
];

export const INITIAL_SALES: Sale[] = [
  {
    id: 'sale-1',
    code: 'VND-1001',
    customerId: 'cli-1',
    customerName: 'João Silva',
    items: [
      {
        productId: 'prod-1',
        productName: 'Vaso Vietnamita Grande',
        quantity: 1,
        unitPrice: 250.00,
        totalPrice: 250.00
      }
    ],
    totalValue: 250.00,
    discount: 0,
    paidValue: 250.00,
    pendingValue: 0,
    paymentMethod: 'Pix',
    date: '2026-08-11',
    notes: 'Venda presencial na olaria.',
    status: 'Concluída'
  },
  {
    id: 'sale-2',
    code: 'VND-1002',
    customerId: 'cli-2',
    customerName: 'Carlos Mendes',
    items: [
      {
        productId: 'prod-1',
        productName: 'Vaso Vietnamita Grande',
        quantity: 2,
        unitPrice: 250.00,
        totalPrice: 500.00
      },
      {
        productId: 'prod-3',
        productName: 'Fonte Decorativa Cascata Cerâmica',
        quantity: 1,
        unitPrice: 650.00,
        totalPrice: 650.00
      }
    ],
    totalValue: 1150.00,
    discount: 50.00,
    paidValue: 600.00,
    pendingValue: 500.00,
    paymentMethod: 'Pix',
    date: '2026-08-10',
    notes: 'Desconto de R$ 50 concedido por compra em quantidade. Saldo restante para 15 dias.',
    status: 'Parcial'
  },
  {
    id: 'sale-3',
    code: 'VND-1003',
    customerId: 'cli-4',
    customerName: 'Pedro Santos',
    items: [
      {
        productId: 'prod-2',
        productName: 'Vaso Vietnamita Médio',
        quantity: 2,
        unitPrice: 180.00,
        totalPrice: 360.00
      }
    ],
    totalValue: 360.00,
    discount: 0,
    paidValue: 160.00,
    pendingValue: 200.00,
    paymentMethod: 'Fiado',
    date: '2026-08-08',
    notes: 'Pedro pagou 160 e ficou devendo 200.',
    status: 'Parcial'
  }
];

export const INITIAL_PRODUCTION_BATCHES: ProductionBatch[] = [
  {
    id: 'batch-1',
    code: 'PRD-201',
    productId: 'prod-2',
    productName: 'Vaso Vietnamita Médio',
    quantityPlanned: 20,
    quantityProduced: 20,
    quantityLost: 3,
    quantityGood: 17,
    stage: 'Queima',
    startDate: '2026-08-08',
    batchNumber: 'Lote 2026-08-A',
    notes: '3 vasos trincaram durante a elevação de temperatura na queima.'
  },
  {
    id: 'batch-2',
    code: 'PRD-202',
    productId: 'prod-4',
    productName: 'Cachepô Trabalhado Flor de Lis',
    quantityPlanned: 15,
    quantityProduced: 15,
    quantityLost: 0,
    quantityGood: 15,
    stage: 'Secagem',
    startDate: '2026-08-11',
    batchNumber: 'Lote 2026-08-B',
    notes: 'Secagem lenta na sombra.'
  }
];

export const INITIAL_CUSTOM_ORDERS: CustomOrder[] = [
  {
    id: 'ord-1',
    code: 'PED-501',
    customerId: 'cli-3',
    customerName: 'Maria Oliveira (Studio Arquitetura)',
    productDescription: 'Fonte de cerâmica de 1 metro na cor azul mar profundo com prato coletor reforçado.',
    sizeSpecs: 'Altura: 100cm, Diâmetro: 60cm',
    colorSpecs: 'Esmalte Azul Profundo',
    targetDate: '2026-08-20',
    status: 'Em Produção',
    totalPrice: 850.00,
    depositPaid: 425.00,
    createdAt: '2026-08-05',
    notes: 'Entrega direto na obra em Alphaville.'
  }
];

export const INITIAL_DELIVERIES: Delivery[] = [
  {
    id: 'del-1',
    orderId: 'ord-1',
    customerName: 'Maria Oliveira (Studio Arquitetura)',
    address: 'Alameda dos Araguaias, 450 - Alphaville',
    deliveryDate: '2026-08-20',
    shippingFee: 80.00,
    status: 'Pendente',
    deliveryPerson: 'Mário da Perua',
    notes: 'Ligar 30 min antes de chegar.'
  },
  {
    id: 'del-2',
    saleId: 'sale-2',
    customerName: 'Carlos Mendes',
    address: 'Av. das Flores, 1200 - Campinas',
    deliveryDate: '2026-08-12',
    shippingFee: 0,
    status: 'Entregue',
    completedAt: '2026-08-12T11:30:00Z',
    notes: 'Entregue e assinado por Carlos.'
  }
];

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'exp-1',
    description: 'Compra de 50kg de argila especial',
    category: 'Matéria-Prima',
    amount: 300.00,
    supplier: 'Mineradora Vale do Barro',
    dueDate: '2026-08-10',
    paidDate: '2026-08-10',
    status: 'Paga',
    notes: 'Pago via Pix.'
  },
  {
    id: 'exp-2',
    description: 'Combustível furgão entrega',
    category: 'Combustível',
    amount: 150.00,
    supplier: 'Posto Shell',
    dueDate: '2026-08-11',
    paidDate: '2026-08-11',
    status: 'Paga',
    notes: 'Abastecimento para entregas da semana.'
  },
  {
    id: 'exp-3',
    description: 'Conta de Energia Elétrica Forno Queima',
    category: 'Energia/Água',
    amount: 480.00,
    supplier: 'CPFL Energia',
    dueDate: '2026-08-25',
    status: 'Pendente',
    notes: 'Referente ao mês de Julho.'
  }
];

export const INITIAL_RECEIVABLES: AccountReceivable[] = [
  {
    id: 'rec-1',
    saleId: 'sale-2',
    customerId: 'cli-2',
    customerName: 'Carlos Mendes',
    description: 'Saldo restante da venda VND-1002 (Fontes e Vasos G)',
    amount: 500.00,
    amountPaid: 0,
    dueDate: '2026-08-25',
    status: 'Pendente',
    notes: 'Combinado pagamento via Pix até o fim do mês.'
  },
  {
    id: 'rec-2',
    saleId: 'sale-3',
    customerId: 'cli-4',
    customerName: 'Pedro Santos',
    description: 'Fiado 2 Vasos Médios (VND-1003)',
    amount: 200.00,
    amountPaid: 0,
    dueDate: '2026-08-15',
    status: 'Pendente',
    notes: 'Pedro prometeu acertar no sábado.'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'audit-1',
    timestamp: '2026-08-12T10:00:00Z',
    user: 'Mestre Zico',
    action: 'Criação de Sistema',
    entityType: 'Sistema',
    details: 'Sistema de Gestão Olaria do Zico inicializado com sucesso.'
  }
];
