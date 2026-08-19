import React from 'react';
import { 
  BarChart2, 
  TrendingUp, 
  AlertTriangle, 
  FileSpreadsheet, 
  PieChart as PieIcon, 
  DollarSign, 
  Package, 
  Flame,
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell, 
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';
import { StorageService } from '../services/storage';
import { BackupExportService } from '../services/backupExport';
import { AuthService } from '../services/authService';
import { Card, useToast } from '../components/ui';
import { useTheme } from '../context/ThemeContext';

export const ReportsView: React.FC = () => {
  const { showSuccess } = useToast();
  const { isDark } = useTheme();
  const currentUser = AuthService.getCurrentUser();
  
  const sales = StorageService.getSales();
  const production = StorageService.getProduction();
  const expenses = StorageService.getExpenses();
  const products = StorageService.getProducts();

  // Financial Calculations
  const totalSalesValue = sales.reduce((acc, s) => acc + s.totalValue, 0);
  const totalPaid = sales.reduce((acc, s) => acc + s.paidValue, 0);
  const totalPending = sales.reduce((acc, s) => acc + s.pendingValue, 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const netProfit = totalPaid - totalExpenses;

  // Production loss calculations
  const totalProduced = production.reduce((acc, p) => acc + p.quantityProduced, 0);
  const totalLost = production.reduce((acc, p) => acc + p.quantityLost, 0);
  const totalGood = production.reduce((acc, p) => acc + p.quantityGood, 0);
  const lossPercentage = totalProduced > 0 ? ((totalLost / totalProduced) * 100).toFixed(1) : '0';

  // Product sales counts & revenue map
  const productSalesMap: { [name: string]: { qty: number; revenue: number } } = {};
  sales.forEach(s => {
    s.items.forEach(i => {
      if (!productSalesMap[i.productName]) {
        productSalesMap[i.productName] = { qty: 0, revenue: 0 };
      }
      productSalesMap[i.productName].qty += i.quantity;
      productSalesMap[i.productName].revenue += i.totalPrice;
    });
  });

  const topProductsByQty = Object.entries(productSalesMap)
    .map(([name, data]) => ({ name, qty: data.qty, revenue: data.revenue }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 6);

  // Category distribution for PieChart with fallback and clear naming
  const categoryMap: { [cat: string]: number } = {};
  products.forEach(p => {
    let cat = p.category ? p.category.trim() : 'Outros';
    // Format / Normalize category names for clarity
    if (cat.toLowerCase() === 'vaso') cat = 'Vasos';
    if (cat.toLowerCase() === 'fonte') cat = 'Fontes';
    if (cat.toLowerCase() === 'cachepo') cat = 'Cachepôs';
    if (cat.toLowerCase() === 'jardineira') cat = 'Jardineiras';
    if (cat.toLowerCase() === 'peça especial' || cat.toLowerCase() === 'pecas especiais') cat = 'Peças Especiais';

    categoryMap[cat] = (categoryMap[cat] || 0) + (p.stock || 1);
  });
  const categoryPieData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));

  // Production vs Losses Donut Data
  const productionPieData = [
    { name: 'Peças Boas / Aproveitadas', value: totalGood || 1, color: '#15803D' },
    { name: 'Perdas / Quebradas', value: totalLost || 0, color: '#DC2626' }
  ];

  // Financial Comparison Bar Chart Data with highly distinct high-contrast colors
  const financialChartData = [
    {
      label: 'Resumo do Período',
      Faturamento: totalSalesValue,
      'Entradas Reais': totalPaid,
      Despesas: totalExpenses,
      Inadimplência: totalPending
    }
  ];

  // Colors with high visual distinction for instant comprehension:
  // Faturamento = Azul Royal Forte (#1D4ED8)
  // Entradas Reais / Caixa = Verde Esmeralda (#15803D)
  // Despesas = Âmbar Escuro / Terracota Profundo (#B45309)
  // Inadimplência / Fiado = Vermelho Rubi (#DC2626)
  const FINANCIAL_COLORS = {
    faturamento: '#1D4ED8',
    entradasReais: '#15803D',
    despesas: '#B45309',
    inadimplencia: '#DC2626'
  };

  // Pie chart distinct colors (High contrast, clearly recognizable palette)
  const PIE_COLORS = [
    '#B85C38', // Terracota Olaria
    '#15803D', // Verde Floresta
    '#1D4ED8', // Azul Safira
    '#D97706', // Âmbar Dourado
    '#7C3AED', // Roxo Violeta
    '#0891B2', // Ciano Profundo
    '#DC2626'  // Vermelho
  ];

  const textColor = isDark ? '#C9BFA8' : '#292724';
  const gridColor = isDark ? '#3D3833' : '#E7D5BE';

  return (
    <div className="space-y-6 pb-20 font-brand-sans text-[#292724] dark:text-[#F7F1E7]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[#292724] dark:text-[#F7F1E7] font-brand-serif flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-[#B85C38]" />
            <span>Relatórios & Visão Gráfica da Olaria</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#5C5852] dark:text-[#A8A29E]">
            Painel de indicadores visuais, gráficos de perdas, receita e portabilidade em Excel.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            BackupExportService.exportCompleteBackupToExcel(currentUser?.companyName);
            showSuccess('Backup completo em planilha Excel gerado com sucesso!');
          }}
          className="px-4 py-2.5 bg-[#8A5A44] hover:bg-[#6E4533] text-[#FAF6EF] font-bold rounded-xl text-xs sm:text-sm transition-all shadow-sm flex items-center gap-2 cursor-pointer shrink-0 border border-[#A7735B]/40 focus-visible:outline-2 focus-visible:outline-[#B85C38]"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-300 shrink-0" />
          <span>Exportar Backup Excel (.xlsx)</span>
        </button>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#B85C38] text-white p-5 rounded-2xl shadow-md space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-200">Lucro Líquido Estimado</span>
          <p className="text-3xl font-black mt-1 font-mono">R$ {netProfit.toFixed(2)}</p>
          <p className="text-xs text-amber-100">Entradas reais menos despesas</p>
        </div>

        <div className="bg-white dark:bg-[#25221E] border border-[#E7D5BE] dark:border-stone-800 p-5 rounded-2xl shadow-xs space-y-1 transition-colors">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">Faturamento Bruto</span>
          <p className="text-2xl font-black text-[#292724] dark:text-[#F7F1E7] mt-1 font-mono">R$ {totalSalesValue.toFixed(2)}</p>
          <p className="text-xs text-[#5C5852] dark:text-[#A8A29E]">{sales.length} vendas efetuadas</p>
        </div>

        <div className="bg-white dark:bg-[#25221E] border border-[#E7D5BE] dark:border-stone-800 p-5 rounded-2xl shadow-xs space-y-1 transition-colors">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">Inadimplência / Fiado</span>
          <p className="text-2xl font-black text-rose-700 dark:text-rose-400 mt-1 font-mono">R$ {totalPending.toFixed(2)}</p>
          <p className="text-xs text-rose-600 dark:text-rose-300">A receber de clientes</p>
        </div>

        <div className="bg-white dark:bg-[#25221E] border border-[#E7D5BE] dark:border-stone-800 p-5 rounded-2xl shadow-xs space-y-1 transition-colors">
          <span className="text-xs font-bold uppercase tracking-wider text-[#8A5A44] dark:text-[#D98A5B]">Taxa de Perdas na Queima</span>
          <p className="text-2xl font-black text-[#292724] dark:text-[#F7F1E7] mt-1 font-mono">{lossPercentage}%</p>
          <p className="text-xs text-[#5C5852] dark:text-[#A8A29E]">{totalLost} de {totalProduced} peças quebradas</p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VISUAL CHARTS SECTION */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CHART 1: Financial Comparison (Receita vs Despesas vs Inadimplência) */}
        <div className="bg-white dark:bg-[#25221E] border border-[#E7D5BE] dark:border-stone-800 p-5 rounded-2xl shadow-xs space-y-4 transition-colors">
          <div className="flex items-center justify-between border-b border-[#E7D5BE]/60 dark:border-stone-800 pb-3">
            <h3 className="font-bold text-[#292724] dark:text-[#F7F1E7] text-base flex items-center gap-2 font-brand-serif">
              <DollarSign className="w-5 h-5 text-[#B85C38]" />
              <span>Balanço Financeiro Comparativo</span>
            </h3>
            <span className="text-[11px] text-[#5C5852] dark:text-[#A8A29E] font-medium">Valores em R$</span>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financialChartData} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="label" stroke={textColor} tick={{ fontSize: 12, fontWeight: 'bold' }} />
                <YAxis stroke={textColor} tick={{ fontSize: 11 }} />
                <Tooltip 
                  formatter={(value: any) => [`R$ ${Number(value).toFixed(2)}`, '']}
                  contentStyle={{ 
                    backgroundColor: isDark ? '#1A1816' : '#FFF', 
                    borderColor: isDark ? '#3A3530' : '#E7D5BE',
                    borderRadius: '12px',
                    color: isDark ? '#F7F1E7' : '#292724',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }} 
                />
                <Legend 
                  verticalAlign="bottom" 
                  align="center"
                  wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }} 
                />
                {/* Visualmente destacado: Cores com contraste imediato */}
                <Bar dataKey="Faturamento" name="Faturamento (Total)" fill={FINANCIAL_COLORS.faturamento} radius={[6, 6, 0, 0]} />
                <Bar dataKey="Entradas Reais" name="Entradas Reais (Caixa)" fill={FINANCIAL_COLORS.entradasReais} radius={[6, 6, 0, 0]} />
                <Bar dataKey="Despesas" name="Despesas Pagas" fill={FINANCIAL_COLORS.despesas} radius={[6, 6, 0, 0]} />
                <Bar dataKey="Inadimplência" name="Inadimplência / Fiado" fill={FINANCIAL_COLORS.inadimplencia} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: Production vs Loss Pie / Donut */}
        <div className="bg-white dark:bg-[#25221E] border border-[#E7D5BE] dark:border-stone-800 p-5 rounded-2xl shadow-xs space-y-4 transition-colors">
          <div className="flex items-center justify-between border-b border-[#E7D5BE]/60 dark:border-stone-800 pb-3">
            <h3 className="font-bold text-[#292724] dark:text-[#F7F1E7] text-base flex items-center gap-2 font-brand-serif">
              <Flame className="w-5 h-5 text-[#B85C38]" />
              <span>Eficiência de Queima & Perdas na Olaria</span>
            </h3>
            <span className="text-[11px] text-[#5C5852] dark:text-[#A8A29E] font-medium">Taxa de Quebra</span>
          </div>

          <div className="h-72 w-full flex items-center justify-center pt-2">
            {totalProduced === 0 ? (
              <div className="text-center text-xs text-[#5C5852] dark:text-[#A8A29E] space-y-1">
                <Flame className="w-8 h-8 text-[#B85C38] mx-auto opacity-50" />
                <p>Nenhuma queima de forno registrada no período.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={productionPieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {productionPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [`${value} unidades`, '']}
                    contentStyle={{ 
                      backgroundColor: isDark ? '#1A1816' : '#FFF', 
                      borderColor: isDark ? '#3A3530' : '#E7D5BE',
                      borderRadius: '12px',
                      color: isDark ? '#F7F1E7' : '#292724',
                      fontSize: '12px'
                    }} 
                  />
                  <Legend verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* CHART 3: Top Selling Ceramic Pieces (Horizontal Bar Chart) */}
        <div className="bg-white dark:bg-[#25221E] border border-[#E7D5BE] dark:border-stone-800 p-5 rounded-2xl shadow-xs space-y-4 transition-colors">
          <div className="flex items-center justify-between border-b border-[#E7D5BE]/60 dark:border-stone-800 pb-3">
            <h3 className="font-bold text-[#292724] dark:text-[#F7F1E7] text-base flex items-center gap-2 font-brand-serif">
              <TrendingUp className="w-5 h-5 text-[#B85C38]" />
              <span>Peças Cerâmicas Mais Vendidas (Volume)</span>
            </h3>
            <span className="text-[11px] text-[#5C5852] dark:text-[#A8A29E] font-medium">Unidades</span>
          </div>

          <div className="h-72 w-full pt-2">
            {topProductsByQty.length === 0 ? (
              <div className="text-center text-xs text-[#5C5852] dark:text-[#A8A29E] py-12">
                Nenhuma venda registrada para compor o ranking.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProductsByQty} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis type="number" stroke={textColor} tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" stroke={textColor} tick={{ fontSize: 10 }} width={120} />
                  <Tooltip 
                    formatter={(value: any) => [`${value} unidades vendidas`, '']}
                    contentStyle={{ 
                      backgroundColor: isDark ? '#1A1816' : '#FFF', 
                      borderColor: isDark ? '#3A3530' : '#E7D5BE',
                      borderRadius: '12px',
                      color: isDark ? '#F7F1E7' : '#292724',
                      fontSize: '12px'
                    }} 
                  />
                  <Bar dataKey="qty" name="Unidades Vendidas" fill="#B85C38" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* CHART 4: Category Distribution (Pie Chart with Clean Responsive Legend) */}
        <div className="bg-white dark:bg-[#25221E] border border-[#E7D5BE] dark:border-stone-800 p-5 rounded-2xl shadow-xs space-y-4 transition-colors">
          <div className="flex items-center justify-between border-b border-[#E7D5BE]/60 dark:border-stone-800 pb-3">
            <h3 className="font-bold text-[#292724] dark:text-[#F7F1E7] text-base flex items-center gap-2 font-brand-serif">
              <PieIcon className="w-5 h-5 text-[#B85C38]" />
              <span>Distribuição do Estoque por Categoria</span>
            </h3>
            <span className="text-[11px] text-[#5C5852] dark:text-[#A8A29E] font-medium">Tipos de Peça</span>
          </div>

          <div className="h-72 w-full flex items-center justify-center pt-2">
            {categoryPieData.length === 0 ? (
              <div className="text-center text-xs text-[#5C5852] dark:text-[#A8A29E] py-12">
                Nenhum produto cadastrado no catálogo.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 0, right: 10, left: 10, bottom: 20 }}>
                  <Pie
                    data={categoryPieData}
                    cx="50%"
                    cy="45%"
                    outerRadius={75}
                    dataKey="value"
                    nameKey="name"
                  >
                    {categoryPieData.map((entry, index) => (
                      <Cell key={`cell-cat-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any, name: any, item: any) => {
                      const total = categoryPieData.reduce((acc, curr) => acc + curr.value, 0);
                      const percent = total > 0 ? ((Number(value) / total) * 100).toFixed(0) : '0';
                      return [`${value} un (${percent}%)`, name];
                    }}
                    contentStyle={{ 
                      backgroundColor: isDark ? '#1A1816' : '#FFF', 
                      borderColor: isDark ? '#3A3530' : '#E7D5BE',
                      borderRadius: '12px',
                      color: isDark ? '#F7F1E7' : '#292724',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }} 
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    align="center"
                    wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                    formatter={(value) => {
                      // Correct singular/plural labels neatly
                      if (value === 'Vaso' || value === 'vaso') return 'Vasos';
                      if (value === 'Fonte' || value === 'fonte') return 'Fontes';
                      return value;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* Structured Details Tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {/* Top Selling Products List */}
        <div className="bg-white dark:bg-[#25221E] border border-[#E7D5BE] dark:border-stone-800 p-5 rounded-2xl shadow-xs space-y-4 transition-colors">
          <h3 className="font-bold text-[#292724] dark:text-[#F7F1E7] text-base flex items-center gap-2 font-brand-serif">
            <Package className="w-5 h-5 text-[#B85C38]" />
            <span>Detalhamento dos Produtos no Topo</span>
          </h3>

          <div className="space-y-2.5">
            {topProductsByQty.length === 0 ? (
              <p className="text-xs text-[#5C5852] dark:text-[#A8A29E]">Nenhum dado registrado.</p>
            ) : (
              topProductsByQty.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between p-3 bg-[#FAF6EF] dark:bg-[#1A1816] rounded-xl border border-[#E7D5BE] dark:border-stone-800 transition-colors">
                  <div className="flex items-center space-x-3">
                    <span className="w-6 h-6 rounded-full bg-[#B85C38] text-white font-bold text-xs flex items-center justify-center shrink-0">
                      #{index + 1}
                    </span>
                    <div>
                      <span className="font-bold text-sm text-[#292724] dark:text-[#F7F1E7] block">{item.name}</span>
                      <span className="text-[11px] text-[#5C5852] dark:text-[#A8A29E]">Receita Gerada: R$ {item.revenue.toFixed(2)}</span>
                    </div>
                  </div>
                  <span className="font-bold text-xs bg-[#E7D5BE] dark:bg-[#3A3530] text-[#292724] dark:text-[#F7F1E7] px-2.5 py-1 rounded-full">
                    {item.qty} un
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Strategic Tips / AI Operational Insights */}
        <div className="bg-white dark:bg-[#25221E] border border-[#E7D5BE] dark:border-stone-800 p-5 rounded-2xl shadow-xs space-y-4 transition-colors">
          <h3 className="font-bold text-[#292724] dark:text-[#F7F1E7] text-base flex items-center gap-2 font-brand-serif">
            <TrendingUp className="w-5 h-5 text-[#667052]" />
            <span>Recomendações Estratégicas</span>
          </h3>

          <div className="space-y-3 text-xs leading-relaxed text-[#5C5852] dark:text-[#A8A29E]">
            <div className="p-3 bg-[#F7F1E7] dark:bg-[#1E1C1A] rounded-xl border border-[#E7D5BE] dark:border-stone-800">
              <strong className="text-[#292724] dark:text-[#F7F1E7] block mb-1">🏺 Foco de Produção nos Fornos</strong>
              Mantenha o forno abastecido com as peças de maior giro (Vasos Bojudos e Colunas) para evitar desabastecimento em finais de semana de pico.
            </div>

            <div className="p-3 bg-[#F7F1E7] dark:bg-[#1E1C1A] rounded-xl border border-[#E7D5BE] dark:border-stone-800">
              <strong className="text-[#292724] dark:text-[#F7F1E7] block mb-1">💰 Gestão de Inadimplência e Fiado</strong>
              O valor pendente em fiado representa um percentual do faturamento. Incentive o pagamento via Pix oferecendo pequenos descontos no ato.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
