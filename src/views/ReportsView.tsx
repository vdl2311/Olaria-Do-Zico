import React from 'react';
import { BarChart2, TrendingUp, AlertTriangle, PieChart, DollarSign, Calendar } from 'lucide-react';
import { StorageService } from '../services/storage';

export const ReportsView: React.FC = () => {
  const sales = StorageService.getSales();
  const production = StorageService.getProduction();
  const expenses = StorageService.getExpenses();
  const products = StorageService.getProducts();

  // Calculations
  const totalSalesValue = sales.reduce((acc, s) => acc + s.totalValue, 0);
  const totalPaid = sales.reduce((acc, s) => acc + s.paidValue, 0);
  const totalPending = sales.reduce((acc, s) => acc + s.pendingValue, 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const netProfit = totalPaid - totalExpenses;

  // Production loss calculations
  const totalProduced = production.reduce((acc, p) => acc + p.quantityProduced, 0);
  const totalLost = production.reduce((acc, p) => acc + p.quantityLost, 0);
  const lossPercentage = totalProduced > 0 ? ((totalLost / totalProduced) * 100).toFixed(1) : '0';

  // Product sales counts
  const productSalesMap: { [name: string]: number } = {};
  sales.forEach(s => {
    s.items.forEach(i => {
      productSalesMap[i.productName] = (productSalesMap[i.productName] || 0) + i.quantity;
    });
  });

  const sortedTopProducts = Object.entries(productSalesMap).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-amber-950 flex items-center gap-2">
          <BarChart2 className="w-6 h-6 text-amber-800" />
          <span>Relatórios & Desempenho da Olaria</span>
        </h2>
        <p className="text-xs text-amber-800/80">Resumos executivos de vendas, lucratividade, perdas e produção.</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-amber-900 text-amber-50 p-5 rounded-2xl shadow-md">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-300">Lucro Líquido Estimado</span>
          <p className="text-3xl font-black mt-2">R$ {netProfit.toFixed(2)}</p>
          <p className="text-xs text-amber-200 mt-1">Entradas reais menos despesas</p>
        </div>

        <div className="bg-white border border-amber-200 p-5 rounded-2xl shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-800">Faturamento Bruto</span>
          <p className="text-2xl font-black text-amber-950 mt-1">R$ {totalSalesValue.toFixed(2)}</p>
          <p className="text-xs text-amber-700 mt-1">{sales.length} vendas efetuadas</p>
        </div>

        <div className="bg-white border border-amber-200 p-5 rounded-2xl shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-800">Inadimplência / Fiado</span>
          <p className="text-2xl font-black text-red-600 mt-1">R$ {totalPending.toFixed(2)}</p>
          <p className="text-xs text-red-500 mt-1">A receber de clientes</p>
        </div>

        <div className="bg-white border border-amber-200 p-5 rounded-2xl shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-800">Taxa de Perdas na Queima</span>
          <p className="text-2xl font-black text-amber-950 mt-1">{lossPercentage}%</p>
          <p className="text-xs text-amber-700 mt-1">{totalLost} de {totalProduced} peças quebradas</p>
        </div>
      </div>

      {/* Top Selling Products */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-amber-200 p-5 rounded-2xl shadow-xs space-y-4">
          <h3 className="font-bold text-amber-950 text-base flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-800" />
            <span>Produtos Mais Vendidos (Volume)</span>
          </h3>

          <div className="space-y-3">
            {sortedTopProducts.length === 0 ? (
              <p className="text-xs text-amber-800">Nenhum dado registrado.</p>
            ) : (
              sortedTopProducts.slice(0, 5).map(([prodName, qty], index) => (
                <div key={prodName} className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <div className="flex items-center space-x-3">
                    <span className="w-6 h-6 rounded-full bg-amber-800 text-amber-50 font-bold text-xs flex items-center justify-center">
                      #{index + 1}
                    </span>
                    <span className="font-bold text-sm text-amber-950">{prodName}</span>
                  </div>
                  <span className="font-bold text-xs bg-amber-200 text-amber-900 px-2.5 py-1 rounded-full">
                    {qty} unidades vendidas
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Breakage & Loss Audit */}
        <div className="bg-white border border-amber-200 p-5 rounded-2xl shadow-xs space-y-4">
          <h3 className="font-bold text-amber-950 text-base flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-800" />
            <span>Resumo de Perdas de Produção / Quebra</span>
          </h3>

          <div className="space-y-3">
            {production.map((b) => (
              <div key={b.id} className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-xs space-y-1">
                <div className="flex justify-between font-bold text-amber-950">
                  <span>{b.productName} ({b.batchNumber})</span>
                  <span className="text-red-600 font-bold">{b.quantityLost} peças perdidas</span>
                </div>
                <p className="text-amber-800">
                  Produzidos: {b.quantityProduced} | Aproveitados: {b.quantityGood} | Etapa: {b.stage}
                </p>
                {b.notes && <p className="text-amber-700 italic">Obs: {b.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
