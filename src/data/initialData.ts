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

export const INITIAL_PRODUCTS: Product[] = [];

export const INITIAL_RAW_MATERIALS: RawMaterial[] = [];

export const INITIAL_CUSTOMERS: Customer[] = [];

export const INITIAL_SALES: Sale[] = [];

export const INITIAL_PRODUCTION_BATCHES: ProductionBatch[] = [];

export const INITIAL_CUSTOM_ORDERS: CustomOrder[] = [];

export const INITIAL_DELIVERIES: Delivery[] = [];

export const INITIAL_EXPENSES: Expense[] = [];

export const INITIAL_RECEIVABLES: AccountReceivable[] = [];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [];
