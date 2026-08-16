import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  Flame, 
  Truck, 
  AlertTriangle, 
  Mic, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight, 
  Users, 
  ChevronRight,
  ClipboardList,
  Sparkles
} from 'lucide-react';
import { StorageService, subscribeStorage } from '../services/storage';
import { BrandSymbol } from '../components/BrandLogo';

interface DashboardViewProps {
  onOpenVoiceModal: () => void;
  setActiveView: (view: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onOpenVoiceModal, setActiveView }) => {
  const [sales, setSales] = useState(() => StorageService.getSales());
  const [products, setProducts] = useState(() => StorageService.getProducts());
  const [production, setProduction] = useState(() => StorageService.getProduction());
  const [customOrders, setCustomOrders] = useState(() => StorageService.getCustomOrders());
  const [deliveries, setDeliveries] = useState(() => StorageService.getDeliveries());
  const [receivables, setReceivables] = useState(() => StorageService.getReceivables());
  const [expenses, setExpenses] = useState(() => StorageService.getExpenses());

  const refreshData = () => {
    setSales(StorageService.getSales());
    setProducts(StorageService.getProducts());
    setProduction(StorageService.getProduction());
    setCustomOrders(StorageService.getCustomOrders());
    setDeliveries(StorageService.getDeliveries());
    setReceivables(StorageService.getReceivables());
    setExpenses(StorageService.getExpenses());
  };

  useEffect(() => {
    const unsub = subscribeStorage(() => {
      refreshData();
    });
    return () => unsub();
  }, []);

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
    <div className="space-y-6 pb-20 font-brand-sans">
      {/* Banner / Voice Call to Action (Terracota & Argila) */}
      <div className="bg-[#FAF6EF] rounded-3xl p-6 text-[#292724] shadow-xs border border-[#E7D5BE] flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 text-center md:text-left relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#B85C38]/10 border border-[#B85C38]/20 text-[#B85C38] text-xs font-bold uppercase tracking-wider">
            <BrandSymbol variant="terracota" className="w-3.5 h-3.5" />
            <span>Da terra para transformar ambientes</span>
          </div>
          <h2 className="font-brand-serif text-2xl sm:text-3xl font-black text-[#292724] tracking-tight leading-tight">
            Gestão da Olaria por Voz
          </h2>
          <p className="text-xs sm:text-sm text-[#8A5A44] leading-relaxed">
            "Vendi 2 vasos por 360 no Pix", "Produzi lote de 30 peças", "Cliente Roberto pagou fiado"
          </p>
        </div>

        {/* Section #21 - Prominent Voice Button "Falar" */}
        <button
          onClick={onOpenVoiceModal}
          className="shrink-0 flex items-center space-x-2.5 bg-[#B85C38] hover:bg-[#9E4A2A] text-white font-bold text-sm sm:text-base px-6 py-3.5 rounded-2xl transition-all shadow-md transform hover:scale-105 active:scale-95 cursor-pointer border border-[#CF734E]/50"
        >
          <Mic className="w-5 h-5 animate-pulse" />
          <span className="tracking-wider uppercase">Falar</span>
        </button>
      </div>

      {/* Hoje (Section #22: Vendas hoje, Recebimentos, Pedidos, Produção, Estoque, Entregas) */}
      <div>
        <h3 className="font-brand-serif text-xl font-bold text-[#292724] mb-3 flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#8A5A44]" />
          <span>Atividade em Tempo Real</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Vendas Hoje */}
          <div className="bg-[#FAF6EF] p-4 rounded-2xl border border-[#E7D5BE] shadow-xs">
            <p className="text-xs font-bold text-[#8A5A44] uppercase tracking-wider">Vendas Hoje</p>
            <p className="font-brand-serif text-xl font-black text-[#292724] mt-1.5">R$ {totalSalesToday.toFixed(2)}</p>
            <span className="text-[10px] text-[#5C5852] font-semibold">{salesToday.length} registro(s)</span>
          </div>

          {/* Recebimentos */}
          <div className="bg-[#FAF6EF] p-4 rounded-2xl border border-[#E7D5BE] shadow-xs">
            <p className="text-xs font-bold text-[#667052] uppercase tracking-wider">Recebimentos</p>
            <p className="font-brand-serif text-xl font-black text-[#4F583D] mt-1.5">
              R$ {salesToday.reduce((acc, s) => acc + s.paidValue, 0).toFixed(2)}
            </p>
            <span className="text-[10px] text-[#667052] font-semibold">Em caixa hoje</span>
          </div>

          {/* Produção */}
          <div className="bg-[#FAF6EF] p-4 rounded-2xl border border-[#E7D5BE] shadow-xs">
            <p className="text-xs font-bold text-[#8A5A44] uppercase tracking-wider">Produção</p>
            <p className="font-brand-serif text-xl font-black text-[#292724] mt-1.5">{inProductionBatchesCount} Lotes</p>
            <span className="text-[10px] text-[#8A5A44] font-semibold">Torno & Fornos</span>
          </div>

          {/* Pedidos */}
          <div className="bg-[#FAF6EF] p-4 rounded-2xl border border-[#E7D5BE] shadow-xs">
            <p className="text-xs font-bold text-[#8A5A44] uppercase tracking-wider">Pedidos</p>
            <p className="font-brand-serif text-xl font-black text-[#292724] mt-1.5">{customOrders.length}</p>
            <span className="text-[10px] text-[#8A5A44] font-semibold">Sob Encomenda</span>
          </div>

          {/* Estoque */}
          <div className="bg-[#FAF6EF] p-4 rounded-2xl border border-[#E7D5BE] shadow-xs">
            <p className="text-xs font-bold text-[#8A5A44] uppercase tracking-wider">Estoque</p>
            <p className="font-brand-serif text-xl font-black text-[#B85C38] mt-1.5">{lowStockProducts.length}</p>
            <span className="text-[10px] text-[#8A5A44] font-semibold">Abaixo do mínimo</span>
          </div>

          {/* Entregas */}
          <div className="bg-[#FAF6EF] p-4 rounded-2xl border border-[#E7D5BE] shadow-xs">
            <p className="text-xs font-bold text-[#8A5A44] uppercase tracking-wider">Entregas</p>
            <p className="font-brand-serif text-xl font-black text-[#292724] mt-1.5">{pendingDeliveriesCount}</p>
            <span className="text-[10px] text-[#5C5852] font-semibold">Logística ativa</span>
          </div>
        </div>
      </div>

      {/* Financeiro Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#FAF6EF] border border-[#E7D5BE] p-4 sm:p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8A5A44]">Saldo Atual em Caixa</span>
            <DollarSign className="w-5 h-5 text-[#B85C38]" />
          </div>
          <p className="font-brand-serif text-2xl font-black text-[#292724] mt-2">R$ {currentBalance.toFixed(2)}</p>
          <p className="text-xs text-[#5C5852] mt-1">Total recebido menos despesas pagas</p>
        </div>

        <div className="bg-[#FAF6EF] border border-[#E7D5BE] p-4 sm:p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#667052]">Contas a Receber</span>
            <ArrowUpRight className="w-5 h-5 text-[#667052]" />
          </div>
          <p className="font-brand-serif text-2xl font-black text-[#4F583D] mt-2">R$ {totalReceivablePending.toFixed(2)}</p>
          <p className="text-xs text-[#667052] mt-1">Clientes a prazo (Fiado / Boleto)</p>
        </div>

        <div className="bg-[#FAF6EF] border border-[#E7D5BE] p-4 sm:p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8A5A44]">Vendas Acumuladas</span>
            <TrendingUp className="w-5 h-5 text-[#8A5A44]" />
          </div>
          <p className="font-brand-serif text-2xl font-black text-[#292724] mt-2">R$ {totalSalesValue.toFixed(2)}</p>
          <p className="text-xs text-[#5C5852] mt-1">{sales.length} vendas registradas</p>
        </div>

        <div className="bg-[#FAF6EF] border border-[#E7D5BE] p-4 sm:p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-800">Despesas Totais</span>
            <AlertTriangle className="w-5 h-5 text-rose-600" />
          </div>
          <p className="font-brand-serif text-2xl font-black text-[#292724] mt-2">R$ {totalExpensesPaid.toFixed(2)}</p>
          <p className="text-xs text-[#5C5852] mt-1">R$ {totalExpensesPending.toFixed(2)} pendente</p>
        </div>
      </div>

      {/* Production & Stock Low Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <div className="bg-[#FAF6EF] border border-[#E7D5BE] rounded-3xl p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 border-b border-[#E7D5BE] pb-3">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-[#B85C38]" />
              <h4 className="font-brand-serif font-bold text-[#292724] text-base">Alerta de Estoque Mínimo</h4>
            </div>
            <button
              onClick={() => setActiveView('estoque')}
              className="text-xs font-bold text-[#B85C38] hover:text-[#9E4A2A] flex items-center gap-1 cursor-pointer"
            >
              <span>Ver Estoque</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {lowStockProducts.length === 0 ? (
            <div className="text-center py-6 text-[#8A5A44] text-sm">
              <CheckCircle2 className="w-8 h-8 text-[#667052] mx-auto mb-2" />
              Todas as peças cerâmicas estão acima do estoque mínimo.
            </div>
          ) : (
            <div className="space-y-2.5">
              {lowStockProducts.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3.5 rounded-xl bg-[#F7F1E7] border border-[#E7D5BE]">
                  <div>
                    <p className="font-bold text-sm text-[#292724]">{p.name}</p>
                    <p className="text-xs text-[#8A5A44]">Código: {p.code} | Mínimo: {p.minStock} un</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                      Estoque: {p.stock} un
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Production Batches */}
        <div className="bg-[#FAF6EF] border border-[#E7D5BE] rounded-3xl p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 border-b border-[#E7D5BE] pb-3">
            <div className="flex items-center space-x-2">
              <Flame className="w-5 h-5 text-[#B85C38]" />
              <h4 className="font-brand-serif font-bold text-[#292724] text-base">Fornadas em Andamento</h4>
            </div>
            <button
              onClick={() => setActiveView('producao')}
              className="text-xs font-bold text-[#B85C38] hover:text-[#9E4A2A] flex items-center gap-1 cursor-pointer"
            >
              <span>Ver Produção</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {production.length === 0 ? (
            <div className="text-center py-6 text-[#8A5A44] text-sm">
              <Flame className="w-8 h-8 text-[#8A5A44]/40 mx-auto mb-2" />
              <p className="font-semibold text-[#292724]">Nenhuma fornada ativa no momento</p>
              <p className="text-xs text-[#8A5A44] mt-1">Inicie um lote ou fale: "Produzi 30 vasos bojudo"</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {production.slice(0, 4).map(b => (
                <div key={b.id} className="flex items-center justify-between p-3.5 rounded-xl bg-[#F7F1E7] border border-[#E7D5BE]">
                  <div>
                    <p className="font-bold text-sm text-[#292724]">{b.productName}</p>
                    <p className="text-xs text-[#8A5A44]">
                      Lote {b.code} | Produzidos: {b.quantityProduced} | Quebras: {b.quantityLost}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    b.stage === 'Pronto' ? 'bg-[#667052]/20 text-[#4F583D]' : 'bg-[#B85C38]/15 text-[#9E4A2A]'
                  }`}>
                    {b.stage}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Sales List */}
      <div className="bg-[#FAF6EF] border border-[#E7D5BE] rounded-3xl p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4 border-b border-[#E7D5BE] pb-3">
          <h4 className="font-brand-serif font-bold text-[#292724] text-base">Últimas Vendas Registradas</h4>
          <button
            onClick={() => setActiveView('vendas')}
            className="text-xs font-bold text-[#B85C38] hover:text-[#9E4A2A] flex items-center gap-1 cursor-pointer"
          >
            <span>Ver Todas as Vendas</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {sales.length === 0 ? (
          <div className="text-center py-8 text-[#8A5A44] text-sm">
            <TrendingUp className="w-8 h-8 text-[#8A5A44]/40 mx-auto mb-2" />
            <p className="font-semibold text-[#292724]">Nenhuma venda registrada ainda</p>
            <p className="text-xs text-[#8A5A44] mt-1">Realize a primeira venda pelo botão de voz ("Falar")!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-[#E7D5BE] text-[#8A5A44]">
                  <th className="pb-3 font-bold uppercase tracking-wider text-[11px]">Código</th>
                  <th className="pb-3 font-bold uppercase tracking-wider text-[11px]">Cliente</th>
                  <th className="pb-3 font-bold uppercase tracking-wider text-[11px]">Peças Cerâmicas</th>
                  <th className="pb-3 font-bold uppercase tracking-wider text-[11px]">Valor</th>
                  <th className="pb-3 font-bold uppercase tracking-wider text-[11px]">Pagamento</th>
                  <th className="pb-3 font-bold uppercase tracking-wider text-[11px]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7D5BE]/60 text-[#292724]">
                {sales.slice(0, 5).map(s => (
                  <tr key={s.id} className="hover:bg-[#F7F1E7]/70">
                    <td className="py-3 font-mono font-bold text-[#B85C38]">{s.code}</td>
                    <td className="py-3 font-semibold text-[#292724]">{s.customerName}</td>
                    <td className="py-3 text-[#5C5852]">{s.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}</td>
                    <td className="py-3 font-brand-serif font-black text-[#292724]">R$ {s.totalValue.toFixed(2)}</td>
                    <td className="py-3">
                      <span className="px-2.5 py-1 rounded-md bg-[#E7D5BE]/50 text-[#8A5A44] font-medium text-xs">
                        {s.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        s.status === 'Concluída' ? 'bg-[#667052]/20 text-[#4F583D]' : 'bg-[#B85C38]/15 text-[#9E4A2A]'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
