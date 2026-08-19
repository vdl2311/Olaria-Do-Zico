import React, { useState } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  Flame, 
  Truck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight, 
  Users, 
  ChevronRight,
  ClipboardList,
  Sparkles,
  Layers,
  ShieldCheck,
  ShoppingCart,
  Calendar,
  Filter,
  BarChart3,
  Search,
  Check,
  Plus
} from 'lucide-react';
import { StorageService } from '../services/storage';
import { Product, Sale, ProductionBatch, CustomOrder, Delivery, AccountReceivable, Expense } from '../types';
import { ExecutiveSummaryEngine } from '../ai/executive/executiveSummary';
import { BrandSymbol } from '../components/BrandLogo';

interface DashboardViewProps {
  setActiveView: (view: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ setActiveView }) => {
  const [dateRange, setDateRange] = useState<'today' | '7days' | '30days' | 'all'>('30days');

  const products = StorageService.getProducts();
  const sales = StorageService.getSales();
  const production = StorageService.getProduction();
  const customOrders = StorageService.getCustomOrders();
  const deliveries = StorageService.getDeliveries();
  const receivables = StorageService.getReceivables();
  const expenses = StorageService.getExpenses();
  const aiSummary = ExecutiveSummaryEngine.generateSummary();

  // Metrics calculation
  const todayStr = new Date().toISOString().split('T')[0];
  const salesToday = sales.filter(s => s.date === todayStr);
  const totalSalesToday = salesToday.reduce((acc, s) => acc + s.totalValue, 0);

  const totalSalesValue = sales.reduce((acc, s) => acc + s.totalValue, 0);
  const totalPaidReceived = sales.reduce((acc, s) => acc + s.paidValue, 0);
  const totalExpensesPaid = expenses.filter(e => e.status === 'Paga').reduce((acc, e) => acc + e.amount, 0);
  const currentBalance = totalPaidReceived - totalExpensesPaid;

  const totalReceivablePending = receivables
    .filter(r => r.status !== 'Pago')
    .reduce((acc, r) => acc + (r.amount - r.amountPaid), 0);

  const activeBatches = production.filter(p => p.stage !== 'Pronto');
  const lowStockProducts = products.filter(p => p.stock <= p.minStock);

  return (
    <div className="space-y-6 pb-20 font-brand-sans">
      
      {/* Banner / Operational Overview (Terracota & Argila) */}
      <div className="bg-[#FAF6EF] dark:bg-[#252320] rounded-3xl p-6 sm:p-8 text-[#292724] dark:text-[#F7F1E7] shadow-xs border border-[#E7D5BE] dark:border-[#3D3833] flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-3 text-center md:text-left relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#B85C38]/10 border border-[#B85C38]/20 text-[#B85C38] dark:text-[#E78B68] text-xs sm:text-sm font-bold uppercase tracking-wider font-brand-sans">
            <BrandSymbol variant="terracota" className="w-4 h-4" />
            <span>Da terra para transformar ambientes</span>
          </div>
          <h2 className="font-brand-serif text-2xl sm:text-3xl md:text-4xl font-black text-[#292724] dark:text-[#F7F1E7] tracking-tight leading-tight">
            Painel de Gestão & Produção da Olaria
          </h2>
          <p className="text-sm sm:text-base text-[#8A5A44] dark:text-[#CBB5A1] leading-relaxed font-brand-sans">
            Controle integrado de vendas, queima nos fornos, estoque de argilas e saúde financeira da olaria.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setActiveView('vendas')}
            className="flex items-center space-x-2.5 bg-[#B85C38] hover:bg-[#9E4A2A] text-white font-bold text-sm sm:text-base px-6 py-3.5 rounded-2xl transition-all shadow-md transform hover:scale-105 active:scale-95 cursor-pointer border border-[#CF734E]/50 font-brand-sans min-h-[46px]"
          >
            <ShoppingCart className="w-5 h-5" />
            <span>Nova Venda</span>
          </button>
        </div>
      </div>

      {/* AI Operational Intelligence Bar */}
      <div className="bg-[#FAF6EF] dark:bg-[#252320] border border-[#E7D5BE] dark:border-[#3D3833] rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#B85C38]/15 dark:bg-[#B85C38]/25 text-[#B85C38] dark:text-[#E78B68] flex items-center justify-center shrink-0 border border-[#B85C38]/30">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#8A5A44] dark:text-[#E7D5BE]">
                Diagnóstico de IA • Saúde da Operação:
              </span>
              <span className="px-3 py-1 rounded-full text-xs sm:text-sm font-black bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 border border-green-300 dark:border-green-700">
                {aiSummary.health.score}/100 ({aiSummary.health.status})
              </span>
            </div>
            <p className="text-sm sm:text-base text-[#292724] dark:text-[#F7F1E7] font-medium mt-1">
              {aiSummary.recomendacoesImediatas[0] || 'Operação balanceada e fornos em ritmo regular.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setActiveView('assistente-ia')}
          className="px-5 py-2.5 bg-white dark:bg-[#1E1C1A] text-[#B85C38] dark:text-[#E78B68] hover:bg-[#FAF6EF] dark:hover:bg-[#252320] border border-[#B85C38]/30 hover:border-[#B85C38] text-sm font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer shrink-0 shadow-xs self-start md:self-auto min-h-[42px]"
        >
          <span>Abrir Assistente IA</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Atividade em Tempo Real (6 Cards com Tipografia Reforçada) */}
      <div>
        <h3 className="font-brand-serif text-xl sm:text-2xl font-bold text-[#292724] dark:text-[#F7F1E7] mb-3.5 flex items-center gap-2.5">
          <Clock className="w-6 h-6 text-[#8A5A44] dark:text-[#D67855]" />
          <span>Atividade em Tempo Real</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {/* Vendas Hoje */}
          <div className="bg-[#FAF6EF] dark:bg-[#252320] p-4.5 rounded-2xl border border-[#E7D5BE] dark:border-[#3D3833] shadow-xs space-y-1">
            <p className="text-xs sm:text-sm font-bold text-[#8A5A44] dark:text-[#C9BFA8] uppercase tracking-wider">Vendas Hoje</p>
            <p className="font-brand-serif text-xl sm:text-2xl font-black text-[#292724] dark:text-[#F7F1E7] font-mono">R$ {totalSalesToday.toFixed(2)}</p>
            <span className="text-xs text-[#5C5852] dark:text-[#C9BFA8] font-semibold block">{salesToday.length} registro(s)</span>
          </div>

          {/* Recebimentos */}
          <div className="bg-[#FAF6EF] dark:bg-[#252320] p-4.5 rounded-2xl border border-[#E7D5BE] dark:border-[#3D3833] shadow-xs space-y-1">
            <p className="text-xs sm:text-sm font-bold text-[#667052] dark:text-[#A4B38A] uppercase tracking-wider">Recebimentos</p>
            <p className="font-brand-serif text-xl sm:text-2xl font-black text-[#4F583D] dark:text-[#D4E4BF] font-mono">
              R$ {salesToday.reduce((acc, s) => acc + s.paidValue, 0).toFixed(2)}
            </p>
            <span className="text-xs text-[#667052] dark:text-[#A4B38A] font-semibold block">Em caixa hoje</span>
          </div>

          {/* Produção */}
          <div className="bg-[#FAF6EF] dark:bg-[#252320] p-4.5 rounded-2xl border border-[#E7D5BE] dark:border-[#3D3833] shadow-xs space-y-1">
            <p className="text-xs sm:text-sm font-bold text-[#8A5A44] dark:text-[#C9BFA8] uppercase tracking-wider">Produção</p>
            <p className="font-brand-serif text-xl sm:text-2xl font-black text-[#B85C38] dark:text-[#E78B68]">{activeBatches.length} Lotes</p>
            <span className="text-xs text-[#8A5A44] dark:text-[#CBB5A1] font-semibold block">Em andamento</span>
          </div>

          {/* Estoque Crítico */}
          <div className="bg-[#FAF6EF] dark:bg-[#252320] p-4.5 rounded-2xl border border-[#E7D5BE] dark:border-[#3D3833] shadow-xs space-y-1">
            <p className="text-xs sm:text-sm font-bold text-[#8A5A44] dark:text-[#C9BFA8] uppercase tracking-wider">Estoque Crítico</p>
            <p className="font-brand-serif text-xl sm:text-2xl font-black text-rose-700 dark:text-rose-400">{lowStockProducts.length} Peças</p>
            <span className="text-xs text-rose-700 dark:text-rose-400 font-semibold block">Abaixo do mínimo</span>
          </div>

          {/* Entregas */}
          <div className="bg-[#FAF6EF] dark:bg-[#252320] p-4.5 rounded-2xl border border-[#E7D5BE] dark:border-[#3D3833] shadow-xs space-y-1">
            <p className="text-xs sm:text-sm font-bold text-[#8A5A44] dark:text-[#C9BFA8] uppercase tracking-wider">Entregas</p>
            <p className="font-brand-serif text-xl sm:text-2xl font-black text-[#292724] dark:text-[#F7F1E7]">{deliveries.filter(d => d.status !== 'Entregue').length}</p>
            <span className="text-xs text-[#5C5852] dark:text-[#C9BFA8] font-semibold block">A despachar</span>
          </div>

          {/* Encomendas */}
          <div className="bg-[#FAF6EF] dark:bg-[#252320] p-4.5 rounded-2xl border border-[#E7D5BE] dark:border-[#3D3833] shadow-xs space-y-1">
            <p className="text-xs sm:text-sm font-bold text-[#8A5A44] dark:text-[#C9BFA8] uppercase tracking-wider">Encomendas</p>
            <p className="font-brand-serif text-xl sm:text-2xl font-black text-[#8A5A44] dark:text-[#D4BEA2]">{customOrders.length}</p>
            <span className="text-xs text-[#8A5A44] dark:text-[#CBB5A1] font-semibold block">Sob medida</span>
          </div>
        </div>
      </div>

      {/* Cards Financeiros & Indicadores Chave com Destaque Tipográfico */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#FAF6EF] dark:bg-[#252320] p-6 rounded-3xl border border-[#E7D5BE] dark:border-[#3D3833] shadow-xs flex flex-col justify-between">
          <div>
            <p className="text-sm font-bold text-[#8A5A44] dark:text-[#D67855] uppercase tracking-wider">Saldo Líquido em Caixa</p>
            <p className="font-brand-serif text-3xl sm:text-4xl font-black text-[#292724] dark:text-[#F7F1E7] mt-2 font-mono">
              R$ {currentBalance.toFixed(2)}
            </p>
            <p className="text-xs sm:text-sm text-[#5C5852] dark:text-[#C9BFA8] mt-1 font-medium">Entradas realizadas menos saídas</p>
          </div>
          <button 
            type="button"
            onClick={() => setActiveView('financeiro')}
            className="mt-5 pt-3.5 border-t border-[#E7D5BE] dark:border-[#3D3833] flex items-center justify-between text-sm font-bold text-[#B85C38] dark:text-[#E78B68] hover:text-[#9E4A2A] cursor-pointer"
          >
            <span>Ver Extrato Financeiro Completo</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-[#FAF6EF] dark:bg-[#252320] p-6 rounded-3xl border border-[#E7D5BE] dark:border-[#3D3833] shadow-xs flex flex-col justify-between">
          <div>
            <p className="text-sm font-bold text-[#667052] dark:text-[#A4B38A] uppercase tracking-wider">A Receber (Prazo / Fiado)</p>
            <p className="font-brand-serif text-3xl sm:text-4xl font-black text-[#4F583D] dark:text-[#D4E4BF] mt-2 font-mono">
              R$ {totalReceivablePending.toFixed(2)}
            </p>
            <p className="text-xs sm:text-sm text-[#5C5852] dark:text-[#C9BFA8] mt-1 font-medium">Contas e vendas pendentes</p>
          </div>
          <button 
            type="button"
            onClick={() => setActiveView('financeiro')}
            className="mt-5 pt-3.5 border-t border-[#E7D5BE] dark:border-[#3D3833] flex items-center justify-between text-sm font-bold text-[#667052] dark:text-[#A4B38A] hover:text-[#4F583D] cursor-pointer"
          >
            <span>Gestão de Cobranças & Fiados</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-[#FAF6EF] dark:bg-[#252320] p-6 rounded-3xl border border-[#E7D5BE] dark:border-[#3D3833] shadow-xs flex flex-col justify-between">
          <div>
            <p className="text-sm font-bold text-[#8A5A44] dark:text-[#D67855] uppercase tracking-wider">Faturamento Histórico</p>
            <p className="font-brand-serif text-3xl sm:text-4xl font-black text-[#292724] dark:text-[#F7F1E7] mt-2 font-mono">
              R$ {totalSalesValue.toFixed(2)}
            </p>
            <p className="text-xs sm:text-sm text-[#5C5852] dark:text-[#C9BFA8] mt-1 font-medium">Total de {sales.length} vendas registradas</p>
          </div>
          <button 
            type="button"
            onClick={() => setActiveView('vendas')}
            className="mt-5 pt-3.5 border-t border-[#E7D5BE] dark:border-[#3D3833] flex items-center justify-between text-sm font-bold text-[#8A5A44] dark:text-[#D67855] hover:text-[#6E4533] cursor-pointer"
          >
            <span>Histórico Detalhado de Vendas</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
