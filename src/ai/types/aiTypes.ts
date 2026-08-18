export type AiMessageRole = 'user' | 'assistant' | 'system' | 'tool';

export interface AiToolCallRecord {
  toolName: string;
  args: Record<string, any>;
  result: any;
  timestamp: string;
  executionTimeMs: number;
}

export interface AiChatMessage {
  id: string;
  role: AiMessageRole;
  content: string;
  timestamp: string;
  toolCalls?: AiToolCallRecord[];
  dataSources?: string[];
  suggestedFollowUps?: string[];
  isError?: boolean;
}

export type AlertPriority = 'ATENCAO' | 'ALERTA' | 'OPORTUNIDADE';

export interface IntelligentAlert {
  id: string;
  title: string;
  description: string;
  priority: AlertPriority;
  category: 'estoque' | 'producao' | 'vendas' | 'financeiro' | 'entregas';
  date: string;
  origin: string;
  dataUsed: Record<string, any>;
  recommendedAction: string;
  actionView?: string;
  actionLabel?: string;
}

export type InsightType = 'CRESCIMENTO' | 'QUEDA' | 'ANOMALIA' | 'TENDENCIA' | 'OPORTUNIDADE' | 'RISCO';

export interface OperationalInsight {
  id: string;
  title: string;
  description: string;
  type: InsightType;
  category: 'vendas' | 'producao' | 'estoque' | 'financeiro';
  metricName: string;
  currentValue: number;
  previousValue?: number;
  percentageChange?: number;
  evidence: string;
  recommendation: string;
  confidence: number;
}

export interface OperationalHealthScore {
  score: number; // 0 to 100
  status: 'EXCELENTE' | 'ESTAVEL' | 'ATENCAO' | 'CRITICO';
  productionScore: number;
  stockScore: number;
  financialScore: number;
  deliveryScore: number;
  highlights: string[];
  warnings: string[];
}

export interface ExecutiveSummaryData {
  generatedAt: string;
  periodLabel: string;
  health: OperationalHealthScore;
  producao: {
    totalProduced: number;
    totalLost: number;
    lossRatePercent: number;
    activeBatches: number;
    topProducedProduct: string;
    summaryText: string;
  };
  vendas: {
    totalRevenue: number;
    salesCount: number;
    averageTicket: number;
    topSellingProduct: string;
    pixPercent: number;
    fiadoPercent: number;
    summaryText: string;
  };
  estoque: {
    totalItems: number;
    totalValuation: number;
    lowStockCount: number;
    criticalProducts: string[];
    summaryText: string;
  };
  financeiro: {
    netCashFlow: number;
    totalReceived: number;
    totalReceivablePending: number;
    totalExpensesPaid: number;
    totalExpensesPending: number;
    defaultRatePercent: number;
    summaryText: string;
  };
  atencao: string[];
  oportunidades: string[];
  recomendacoesImediatas: string[];
}

export type ReportType = 
  | 'DIARIO' 
  | 'SEMANAL' 
  | 'MENSAL' 
  | 'PRODUCAO' 
  | 'VENDAS' 
  | 'ESTOQUE' 
  | 'FINANCEIRO' 
  | 'EXECUTIVO';

export interface AIReportStructure {
  id: string;
  title: string;
  reportType: ReportType;
  generatedAt: string;
  period: {
    startDate: string;
    endDate: string;
    label: string;
  };
  resumo: string;
  indicadores: Array<{
    label: string;
    value: string | number;
    change?: string;
    trend?: 'up' | 'down' | 'neutral';
  }>;
  comparacoes: Array<{
    metric: string;
    previousValue: string | number;
    currentValue: string | number;
    absoluteDifference: string | number;
    percentageDifference: number;
    interpretation: string;
  }>;
  tendencias: string[];
  problemas: string[];
  oportunidades: string[];
  recomendacoes: string[];
  tabularData?: {
    headers: string[];
    rows: Array<Array<string | number>>;
  };
}

export interface AnomalyDetectionResult {
  id: string;
  detectedAt: string;
  metric: string;
  module: 'vendas' | 'producao' | 'estoque' | 'financeiro';
  observedValue: number;
  expectedRange: { min: number; max: number; mean: number };
  severity: 'BAIXA' | 'MEDIA' | 'ALTA';
  quantitativeExplanation: string;
  evidence: string;
  suggestedMitigation: string;
}

export interface SearchFilterIntent {
  module: 'produtos' | 'clientes' | 'vendas' | 'producao' | 'financeiro' | 'pedidos';
  filterDescription: string;
  filters: Record<string, any>;
  summary: string;
}
