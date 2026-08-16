export type UserRole = 'PROPRIETARIO' | 'FUNCIONARIO' | 'ADMIN_TECNICO';

export interface EmployeePermissions {
  vendas: boolean;
  producao: boolean;
  estoque: boolean;
  clientes: boolean;
  pedidos: boolean;
  entregas: boolean;
  financeiro: boolean; // default false for employees
  produtos: boolean;
  relatorios: boolean; // default false for employees
  auditoria: boolean; // default false for employees
  configuracoes: boolean; // default false for employees
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  tenantId: string;
  companyName: string;
  permissions: EmployeePermissions;
  pin?: string;
  biometricsEnabled?: boolean;
  status: 'ativo' | 'inativo' | 'bloqueado';
  createdAt: string;
  lastLogin?: string;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
  expiresAt: number;
  tenantId: string;
}

export interface TechnicalLog {
  id: string;
  timestamp: string;
  errorCode: string; // e.g. SALE_CREATE_502, DB_QUERY_OK, AUTH_LOGIN_401, VOICE_NLU_200
  module: 'sales' | 'production' | 'stock' | 'customers' | 'finance' | 'auth' | 'voice' | 'database' | 'system';
  tenantId: string; // anonymized / masked tenant identifier, e.g. TENANT_8392
  userId: string; // anonymized user identifier, e.g. USER_2847
  severity: 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
  component: string;
  message: string; // Sanitized, strictly NO personal or commercial financial data
  latencyMs?: number;
}

export interface SupportTicket {
  id: string;
  code: string; // e.g. SUP-20260816-8F42
  tenantId: string;
  createdAt: string;
  status: 'ABERTO' | 'INVESTIGANDO' | 'RESOLVIDO';
  issueType: string;
  technicalCode: string;
  affectedModule: string;
  technicalDetails: string; // Sanitized metadata without customer names or monetary amounts
  resolutionNotes?: string;
}

export interface TenantInfo {
  id: string;
  name: string;
  plan: 'STARTER' | 'PROFISSIONAL' | 'ENTERPRISE';
  status: 'EM_IMPLANTACAO' | 'ATIVO' | 'TRANSFERIDO';
  setupToken: string; // Token de ativação inicial para passagem de posse
  ownerEmail?: string;
  ownerName?: string;
  createdAt: string;
  handoverCompletedAt?: string;
  setupAccountDestroyed: boolean;
  zeroKnowledgeVerified: boolean;
}

export interface TenantHandoverParams {
  tenantId?: string;
  companyName: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone?: string;
  password?: string;
  pin?: string;
  setupToken?: string;
  useGoogleAuth?: boolean;
}

export interface TemporarySupportGrant {
  id: string;
  tenantId: string;
  grantedByUserId: string;
  grantedByUserName: string;
  reason: string;
  grantedAt: string;
  expiresAt: string;
  token: string;
  status: 'ATIVO' | 'EXPIRADO' | 'REVOGADO';
  accessScope: 'LOGS_AVANCADOS' | 'ESTRUTURA_DADOS' | 'TESTE_SISTEMA';
  accessLog: Array<{
    timestamp: string;
    action: string;
    details?: string;
  }>;
}

export interface SecurityTestResult {
  id: string;
  title: string;
  description: string;
  status: 'PASSED' | 'FAILED' | 'RUNNING';
  assertion: string;
  details?: string;
}

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
  tenantId?: string;
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
  softDeleted?: boolean;
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
  tenantId?: string;
  name: string;
  category: RawMaterialCategory;
  stockQuantity: number;
  unit: 'kg' | 'g' | 'L' | 'ml' | 'un' | 'm';
  minStock: number;
  costPerUnit: number;
  lastPurchaseDate?: string;
  supplier?: string;
  softDeleted?: boolean;
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
  tenantId?: string;
  name: string;
  phone?: string;
  whatsapp?: string;
  cpfCnpj?: string;
  address?: string;
  city?: string;
  type: CustomerType;
  notes?: string;
  createdAt: string;
  softDeleted?: boolean;
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
  tenantId?: string;
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
  cancelledReason?: string;
  softDeleted?: boolean;
}

export type ProductionStage = 'Produção' | 'Secagem' | 'Queima' | 'Acabamento' | 'Pronto';

export interface ProductionBatch {
  id: string;
  tenantId?: string;
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
  softDeleted?: boolean;
}

export interface CustomOrder {
  id: string;
  tenantId?: string;
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
  cancelledReason?: string;
  softDeleted?: boolean;
}

export interface Delivery {
  id: string;
  tenantId?: string;
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
  softDeleted?: boolean;
}

export interface Expense {
  id: string;
  tenantId?: string;
  description: string;
  category: 'Matéria-Prima' | 'Combustível' | 'Manutenção' | 'Energia/Água' | 'Embalagem' | 'Ferramentas' | 'Outros';
  amount: number;
  supplier?: string;
  dueDate: string;
  paidDate?: string;
  status: 'Paga' | 'Pendente' | 'Cancelada';
  notes?: string;
  cancelledReason?: string;
  softDeleted?: boolean;
}

export interface AccountReceivable {
  id: string;
  tenantId?: string;
  saleId?: string;
  customerId: string;
  customerName: string;
  description: string;
  amount: number;
  amountPaid: number;
  dueDate: string;
  status: 'Pendente' | 'Parcial' | 'Pago' | 'Atrasado' | 'Cancelada';
  notes?: string;
  cancelledReason?: string;
  softDeleted?: boolean;
}

export interface AuditLog {
  id: string;
  tenantId?: string;
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
