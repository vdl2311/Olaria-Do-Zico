export type ProductCategory = 
  | 'Vasos'
  | 'Fontes'
  | 'Cachepôs'
  | 'Jardineiras'
  | 'Vasos decorativos'
  | 'Peças especiais'
  | 'Outros'
  | string;

export interface Product {
  id: string;
  code: string;
  name: string;
  category: ProductCategory;
  photoUrl?: string;
  description?: string;
  size: 'P' | 'M' | 'G' | 'GG' | 'Personalizado' | string;
  heightCm?: number;
  widthCm?: number;
  depthCm?: number;
  weightKg?: number;
  price: number;
  cost?: number;
  estimatedCost?: number;
  stock: number;
  minStock: number;
  avgProductionDays?: number;
  finish?: string; // ex: 'Esmaltado', 'Rústico', 'Natural', 'Pintado'
  colors?: string[];
  notes?: string;
}

export type RawMaterialCategory =
  | 'Argila'
  | 'Esmalte'
  | 'Tinta'
  | 'Pigmento'
  | 'Acabamento'
  | 'Embalagem'
  | 'Outros';

export interface RawMaterial {
  id: string;
  name: string;
  category: RawMaterialCategory;
  stockQuantity: number;
  unit: 'kg' | 'g' | 'L' | 'ml' | 'un' | 'm';
  minStock: number;
  costPerUnit: number;
  lastPurchaseDate?: string;
  supplier?: string;
}

export type CustomerType =
  | 'Cliente final'
  | 'Loja'
  | 'Revendedor'
  | 'Paisagista'
  | 'Arquiteto'
  | 'Decorador'
  | 'Empresa';

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  whatsapp?: string;
  cpfCnpj?: string;
  address?: string;
  city?: string;
  type: CustomerType;
  notes?: string;
  createdAt: string;
}

export type PaymentMethod =
  | 'Pix'
  | 'Dinheiro'
  | 'Cartão'
  | 'Transferência'
  | 'Boleto'
  | 'Fiado'
  | 'Misto'
  | 'Outra';

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Sale {
  id: string;
  code: string;
  customerId?: string;
  customerName: string;
  items: SaleItem[];
  totalValue: number;
  discount: number;
  paidValue: number;
  pendingValue: number;
  paymentMethod: PaymentMethod;
  date: string;
  notes?: string;
  status: 'Concluída' | 'Parcial' | 'Pendente' | 'Cancelada';
}

export type ProductionStage = 'Produção' | 'Secagem' | 'Queima' | 'Acabamento' | 'Pronto';

export interface ProductionBatch {
  id: string;
  code: string;
  productId: string;
  productName: string;
  quantityPlanned: number;
  quantityProduced: number;
  quantityLost: number;
  quantityGood: number;
  stage: ProductionStage;
  startDate: string;
  completedDate?: string;
  batchNumber?: string;
  notes?: string;
  stockCredited?: boolean;
}

export interface CustomOrder {
  id: string;
  code: string;
  customerId: string;
  customerName: string;
  productDescription: string;
  sizeSpecs?: string;
  colorSpecs?: string;
  photoUrl?: string;
  targetDate: string;
  status: 'Orçamento' | 'Aprovado' | 'Em Produção' | 'Pronto' | 'Entregue' | 'Cancelado';
  totalPrice: number;
  depositPaid: number;
  createdAt: string;
  notes?: string;
}

export interface Delivery {
  id: string;
  orderId?: string;
  saleId?: string;
  customerName: string;
  address: string;
  deliveryDate: string;
  shippingFee: number;
  status: 'Pendente' | 'A caminho' | 'Entregue' | 'Cancelada';
  deliveryPerson?: string;
  notes?: string;
  completedAt?: string;
}

export interface Expense {
  id: string;
  description: string;
  category: 'Matéria-Prima' | 'Combustível' | 'Manutenção' | 'Energia/Água' | 'Embalagem' | 'Ferramentas' | 'Outros';
  amount: number;
  supplier?: string;
  dueDate: string;
  paidDate?: string;
  status: 'Paga' | 'Pendente';
  notes?: string;
}

export interface AccountReceivable {
  id: string;
  saleId?: string;
  customerId: string;
  customerName: string;
  description: string;
  amount: number;
  amountPaid: number;
  dueDate: string;
  status: 'Pendente' | 'Parcial' | 'Pago' | 'Atrasado';
  notes?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  entityType: string;
  entityId?: string;
  details: string;
  transcript?: string;
  actionType?: string;
  status?: 'Aplicado' | 'Desfeito' | string;
  previousValue?: string;
  newValue?: string;
  actionData?: any;
}

// Voice NLU Types
export type NluIntent =
  | 'RECORD_SALE'
  | 'RECORD_PRODUCTION'
  | 'RECORD_RAW_MATERIAL'
  | 'RECORD_LOSS'
  | 'RECORD_RECEIVABLE_PAYMENT'
  | 'RECORD_EXPENSE'
  | 'RECORD_RESERVE'
  | 'RECORD_DELIVERY'
  | 'QUERY'
  | 'AMBIGUOUS'
  | 'UNKNOWN';

export interface NluActionPayload {
  intent: NluIntent;
  summary: string;
  needsMoreInfo: boolean;
  questionToUser?: string;
  confidence: number;
  warning?: string;
  parsedData?: {
    // For Sale
    customerName?: string;
    productName?: string;
    quantity?: number;
    unitPrice?: number;
    totalPrice?: number;
    paidValue?: number;
    pendingValue?: number;
    paymentMethod?: PaymentMethod;

    // For Production / Loss
    stage?: ProductionStage;
    quantityProduced?: number;
    quantityLost?: number;

    // For Raw Material / Expense
    materialName?: string;
    materialCategory?: RawMaterialCategory;
    expenseCategory?: string;
    amount?: number;

    // For Query
    queryAnswer?: string;
    queryType?: string;
  };
}
