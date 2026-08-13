import React from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  Hammer, 
  Truck, 
  AlertTriangle, 
  Mic, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight, 
  Users, 
  ChevronRight,
  Flame
} from 'lucide-react';
import { StorageService } from '../services/storage';

interface DashboardViewProps {
  onOpenVoiceModal: () => void;
  setActiveView: (view: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onOpenVoiceModal, setActiveView }) => {
  const sales = StorageService.getSales();
  const products = StorageService.getProducts();
  const production = StorageService.getProduction();
  const customOrders = StorageService.getCustomOrders();
  const deliveries = StorageService.getDeliveries();
  const receivables = StorageService.getReceivables();
  const expenses = StorageService.getExpenses();

  // Financial calculations
  const totalSalesValue = sales.reduce((acc, s) => acc + s.totalValue, 0);
  const totalPaidReceived = sales.reduce((acc, s) => acc + s.paidValue, 0);
  const totalReceivablePending = receivables.filter(r => r.status !== 'Pago').reduce((acc, r) => acc + (r.amount - r.amountPaid), 0);
  const totalExpensesPaid = expenses.filter(e => e.status === 'Paga').reduce((acc, e) => acc + e.amount, 0);
  const totalExpensesPending = expenses.filter(e => e.status === 'Pendente').reduce((acc, e) => acc + e.amount, 0);
  const currentBalance = totalPaidReceived - totalExpensesPaid;

  // Today metrics
  const todayStr = new Date().toISOString().split('T')[0];
  const salesToday = sales.filter(s => s.date === todayStr);
  const totalSalesToday = salesToday.reduce((acc, s) => acc + s.totalValue, 0);
  const pendingDeliveriesCount = deliveries.filter(d => d.status === 'Pendente' || d.status === 'A caminho').length;
  const inProductionBatchesCount = production.filter(p => p.stage !== 'Pronto').length;

  // Low stock products
  const lowStockProducts = products.filter(p => p.stock <= p.minStock);

  return (
    <div className="space-y-6 pb-20">
      {/* Banner / Voice Call to Action */}
      <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-amber-950 rounded-2xl p-5 text-white shadow-xl border border-amber-700/60 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center md:text-left">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-600/40 border border-amber-500/40 text-amber-200 text-xs font-semibold">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Olaria do Zico • Assistente em Tempo Real</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-amber-100">
            Administre sua olaria falando naturalmente!
          </h2>
          <p className="text-xs sm:text-sm text-amber-200/80">
            "Vendi um vaso por 180 no Pix", "Produzi 20 vasos hoje", "Quebrei 2 vasos na queima"
          </p>
        </div>
        <button
          onClick={onOpenVoiceModal}
          className="shrink-0 flex items-center space-x-2 bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold px-5 py-3 rounded-xl transition-all shadow-lg transform active:scale-95"
        >
          <Mic className="w-5 h-5 animate-pulse" />
          <span>FALAR AGORA</span>
        </button>
      </div>

      {/* Hoje (Today Dashboard Metrics) */}
      <div>
        <h3 className="text-lg font-bold text-amber-950 mb-3 flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-800" />
          <span>Atividade de Hoje</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-xs">
            <p className="text-xs font-semibold text-amber-800/80">Vendas Hoje</p>
            <p className="text-lg font-bold text-amber-950 mt-1">R$ {totalSalesToday.toFixed(2)}</p>
            <span className="text-[10px] text-amber-600 font-medium">{salesToday.length} registro(s)</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-xs">
            <p className="text-xs font-semibold text-emerald-800/80">Recebido Hoje</p>
            <p className="text-lg font-bold text-emerald-950 mt-1">
              R$ {salesToday.reduce((acc, s) => acc + s.paidValue, 0).toFixed(2)}
            </p>
            <span className="text-[10px] text-emerald-600 font-medium">Entradas em caixa</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-xs">
            <p className="text-xs font-semibold text-amber-800/80">Peças em Produção</p>
            <p className="text-lg font-bold text-amber-950 mt-1">{inProductionBatchesCount} Lotes</p>
            <span className="text-[10px] text-amber-600 font-medium">Em fornos/secagem</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-xs">
            <p className="text-xs font-semibold text-amber-800/80">Entregas Pendentes</p>
            <p className="text-lg font-bold text-amber-950 mt-1">{pendingDeliveriesCount}</p>
            <span className="text-[10px] text-amber-600 font-medium">Logística ativa</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-xs">
            <p className="text-xs font-semibold text-amber-800/80">Pedidos Personalizados</p>
            <p className="text-lg font-bold text-amber-950 mt-1">{customOrders.length}</p>
            <span className="text-[10px] text-amber-600 font-medium">Ativos</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-xs">
            <p className="text-xs font-semibold text-amber-800/80">Alertas de Estoque</p>
            <p className="text-lg font-bold text-red-600 mt-1">{lowStockProducts.length}</p>
            <span className="text-[10px] text-red-500 font-medium">Nível mínimo</span>
          </div>
        </div>
      </div>

      {/* Financeiro Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-amber-900/10 border border-amber-800/20 p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">Saldo Atual em Caixa</span>
            <DollarSign className="w-5 h-5 text-amber-700" />
          </div>
          <p className="text-2xl font-black text-amber-950 mt-2">R$ {currentBalance.toFixed(2)}</p>
          <p className="text-xs text-amber-700/80 mt-1">Total recebido menos despesas pagas</p>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Contas a Receber</span>
            <ArrowUpRight className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-900 mt-2">R$ {totalReceivablePending.toFixed(2)}</p>
          <p className="text-xs text-emerald-700/80 mt-1">Clientes devendo (Fiado / Prazo)</p>
        </div>

        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">Vendas Acumuladas</span>
            <TrendingUp className="w-5 h-5 text-amber-700" />
          </div>
          <p className="text-2xl font-black text-amber-900 mt-2">R$ {totalSalesValue.toFixed(2)}</p>
          <p className="text-xs text-amber-700/80 mt-1">{sales.length} vendas registradas</p>
        </div>

        <div className="bg-red-50 border border-red-200 p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-red-800">Despesas Totais</span>
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-2xl font-black text-red-900 mt-2">R$ {totalExpensesPaid.toFixed(2)}</p>
          <p className="text-xs text-red-700/80 mt-1">R$ {totalExpensesPending.toFixed(2)} pendente</p>
        </div>
      </div>

      {/* Production & Stock Low Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <div className="bg-white border border-amber-900/10 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 border-b border-amber-100 pb-3">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h4 className="font-bold text-amber-950 text-base">Produtos com Estoque Baixo</h4>
            </div>
            <button
              onClick={() => setActiveView('estoque')}
              className="text-xs font-semibold text-amber-700 hover:text-amber-900 flex items-center gap-1"
            >
              <span>Ver Estoque</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {lowStockProducts.length === 0 ? (
            <div className="text-center py-6 text-amber-800/60 text-sm">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              Todos os produtos possuem quantidade acima do estoque mínimo!
            </div>
          ) : (
            <div className="space-y-2.5">
              {lowStockProducts.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-amber-50/60 border border-amber-200">
                  <div>
                    <p className="font-bold text-sm text-amber-950">{p.name}</p>
                    <p className="text-xs text-amber-700">Categoria: {p.category} | Mínimo: {p.minStock} un</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                      Estoque: {p.stock} un
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Production Batches */}
        <div className="bg-white border border-amber-900/10 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 border-b border-amber-100 pb-3">
            <div className="flex items-center space-x-2">
              <Hammer className="w-5 h-5 text-amber-700" />
              <h4 className="font-bold text-amber-950 text-base">Lotes de Produção Ativos</h4>
            </div>
            <button
              onClick={() => setActiveView('producao')}
              className="text-xs font-semibold text-amber-700 hover:text-amber-900 flex items-center gap-1"
            >
              <span>Ver Produção</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2.5">
            {production.slice(0, 4).map(b => (
              <div key={b.id} className="flex items-center justify-between p-3 rounded-xl bg-amber-50/40 border border-amber-200">
                <div>
                  <p className="font-bold text-sm text-amber-950">{b.productName}</p>
                  <p className="text-xs text-amber-700">
                    Lote {b.code} | Produzidos: {b.quantityProduced} | Quebras: {b.quantityLost}
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  b.stage === 'Pronto' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-200 text-amber-900'
                }`}>
                  Etapa: {b.stage}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Sales List */}
      <div className="bg-white border border-amber-900/10 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4 border-b border-amber-100 pb-3">
          <h4 className="font-bold text-amber-950 text-base">Últimas Vendas Registradas</h4>
          <button
            onClick={() => setActiveView('vendas')}
            className="text-xs font-semibold text-amber-700 hover:text-amber-900 flex items-center gap-1"
          >
            <span>Ver Todas as Vendas</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile View: Cards */}
        <div className="block sm:hidden space-y-2.5">
          {sales.slice(0, 5).map(s => (
            <div key={s.id} className="p-3 bg-amber-50/40 border border-amber-200/80 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-amber-900">{s.code} • {s.customerName}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                  s.status === 'Concluída' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-200 text-amber-900'
                }`}>
                  {s.status}
                </span>
              </div>
              <p className="text-xs text-amber-800 line-clamp-1">
                {s.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}
              </p>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-amber-100">
                <span className="font-semibold text-amber-700">{s.paymentMethod}</span>
                <span className="font-black text-amber-950">R$ {s.totalValue.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-amber-200 text-amber-800">
                <th className="pb-2 font-bold">Código</th>
                <th className="pb-2 font-bold">Cliente</th>
                <th className="pb-2 font-bold">Itens</th>
                <th className="pb-2 font-bold">Valor</th>
                <th className="pb-2 font-bold">Pagamento</th>
                <th className="pb-2 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100">
              {sales.slice(0, 5).map(s => (
                <tr key={s.id} className="hover:bg-amber-50/50">
                  <td className="py-2.5 font-bold text-amber-900">{s.code}</td>
                  <td className="py-2.5 text-amber-950">{s.customerName}</td>
                  <td className="py-2.5 text-amber-800">{s.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}</td>
                  <td className="py-2.5 font-bold text-amber-950">R$ {s.totalValue.toFixed(2)}</td>
                  <td className="py-2.5">
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-medium text-xs">
                      {s.paymentMethod}
                    </span>
                  </td>
                  <td className="py-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      s.status === 'Concluída' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-200 text-amber-900'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
