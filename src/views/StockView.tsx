import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Mic, 
  Layers, 
  RefreshCw, 
  X, 
  RotateCcw, 
  Edit3, 
  Trash2, 
  Search,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { StorageService, subscribeStorage } from '../services/storage';
import { Product, RawMaterial, RawMaterialCategory, AuditLog } from '../types';

interface StockViewProps {
  onOpenVoiceModal: () => void;
}

const RAW_CATEGORIES: RawMaterialCategory[] = [
  'Argila',
  'Esmalte',
  'Tinta',
  'Pigmento',
  'Acabamento',
  'Embalagem',
  'Outros'
];

export const StockView: React.FC<StockViewProps> = ({ onOpenVoiceModal }) => {
  const [activeTab, setActiveTab] = useState<'raw' | 'finished' | 'history'>('raw');
  const [products, setProducts] = useState<Product[]>(() => StorageService.getProducts());
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>(() => StorageService.getRawMaterials());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => StorageService.getAuditLogs());
  
  // Quick Adjustment Modal
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [adjustmentQty, setAdjustmentQty] = useState(1);
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove'>('add');
  const [reason, setReason] = useState('');

  // Raw Material CRUD Modal
  const [isRawModalOpen, setIsRawModalOpen] = useState(false);
  const [editingRawMaterial, setEditingRawMaterial] = useState<RawMaterial | null>(null);
  const [rawName, setRawName] = useState('');
  const [rawCategory, setRawCategory] = useState<RawMaterialCategory>('Argila');
  const [rawStockQuantity, setRawStockQuantity] = useState<number>(100);
  const [rawUnit, setRawUnit] = useState<'kg' | 'g' | 'L' | 'ml' | 'un' | 'm'>('kg');
  const [rawMinStock, setRawMinStock] = useState<number>(20);
  const [rawCostPerUnit, setRawCostPerUnit] = useState<number>(0);
  const [rawSupplier, setRawSupplier] = useState('');
  const [rawLastPurchaseDate, setRawLastPurchaseDate] = useState(new Date().toISOString().split('T')[0]);

  // Filters for Raw Materials
  const [rawSearchTerm, setRawSearchTerm] = useState('');
  const [rawCategoryFilter, setRawCategoryFilter] = useState<string>('all');

  const refreshData = () => {
    setProducts(StorageService.getProducts());
    setRawMaterials(StorageService.getRawMaterials());
    setAuditLogs(StorageService.getAuditLogs());
  };

  useEffect(() => {
    const unsub = subscribeStorage(() => {
      refreshData();
    });
    return () => unsub();
  }, []);

  // Quick Stock Adjustment Handler
  const handleAdjustStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId) {
      alert('Selecione o item.');
      return;
    }

    if (activeTab === 'finished' || (!rawMaterials.find(m => m.id === selectedItemId) && products.find(p => p.id === selectedItemId))) {
      const prod = products.find(p => p.id === selectedItemId);
      if (prod) {
        const change = adjustmentType === 'add' ? adjustmentQty : -adjustmentQty;
        const newStock = Math.max(0, prod.stock + change);
        const updatedProd: Product = {
          ...prod,
          stock: newStock
        };
        StorageService.saveProduct(updatedProd);
      }
    } else {
      const mat = rawMaterials.find(m => m.id === selectedItemId);
      if (mat) {
        const change = adjustmentType === 'add' ? adjustmentQty : -adjustmentQty;
        const newStock = Math.max(0, mat.stockQuantity + change);
        const updatedMat: RawMaterial = {
          ...mat,
          stockQuantity: newStock
        };
        StorageService.saveRawMaterial(updatedMat);
      }
    }
    refreshData();
    setIsAdjustmentModalOpen(false);
    setSelectedItemId('');
    setReason('');
  };

  // Open Create Raw Material Modal
  const handleOpenCreateRaw = () => {
    setEditingRawMaterial(null);
    setRawName('');
    setRawCategory('Argila');
    setRawStockQuantity(100);
    setRawUnit('kg');
    setRawMinStock(20);
    setRawCostPerUnit(0);
    setRawSupplier('');
    setRawLastPurchaseDate(new Date().toISOString().split('T')[0]);
    setIsRawModalOpen(true);
  };

  // Open Edit Raw Material Modal
  const handleOpenEditRaw = (mat: RawMaterial) => {
    setEditingRawMaterial(mat);
    setRawName(mat.name);
    setRawCategory(mat.category || 'Argila');
    setRawStockQuantity(mat.stockQuantity);
    setRawUnit(mat.unit || 'kg');
    setRawMinStock(mat.minStock);
    setRawCostPerUnit(mat.costPerUnit || 0);
    setRawSupplier(mat.supplier || '');
    setRawLastPurchaseDate(mat.lastPurchaseDate || new Date().toISOString().split('T')[0]);
    setIsRawModalOpen(true);
  };

  // Save Raw Material Form
  const handleSaveRawMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawName.trim()) {
      alert('Informe o nome da matéria-prima.');
      return;
    }

    const newMat: RawMaterial = {
      id: editingRawMaterial ? editingRawMaterial.id : `raw_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      tenantId: editingRawMaterial?.tenantId,
      name: rawName.trim(),
      category: rawCategory,
      stockQuantity: Number(rawStockQuantity) || 0,
      unit: rawUnit,
      minStock: Number(rawMinStock) || 0,
      costPerUnit: Number(rawCostPerUnit) || 0,
      supplier: rawSupplier.trim() || undefined,
      lastPurchaseDate: rawLastPurchaseDate || undefined
    };

    StorageService.saveRawMaterial(newMat);
    refreshData();
    setIsRawModalOpen(false);
  };

  // Delete Raw Material
  const handleDeleteRawMaterial = (mat: RawMaterial) => {
    if (confirm(`Deseja realmente excluir a matéria-prima "${mat.name}"?`)) {
      StorageService.deleteRawMaterial(mat.id);
      refreshData();
    }
  };

  // Undo Audit Log
  const handleUndoAudit = (logId: string) => {
    if (confirm('Deseja realmente desfazer esta ação?')) {
      const success = StorageService.undoAuditAction(logId);
      if (success) {
        refreshData();
      } else {
        alert('Não foi possível desfazer esta ação.');
      }
    }
  };

  // Filtered Raw Materials
  const filteredRawMaterials = rawMaterials.filter(m => {
    const matchesCategory = rawCategoryFilter === 'all' || m.category === rawCategoryFilter;
    const matchesSearch = 
      m.name.toLowerCase().includes(rawSearchTerm.toLowerCase()) ||
      (m.supplier && m.supplier.toLowerCase().includes(rawSearchTerm.toLowerCase())) ||
      m.category.toLowerCase().includes(rawSearchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const lowRawStockCount = rawMaterials.filter(m => m.stockQuantity <= m.minStock).length;
  const totalRawInvested = rawMaterials.reduce((acc, m) => acc + (m.stockQuantity * (m.costPerUnit || 0)), 0);

  return (
    <div className="space-y-6 pb-20">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-amber-950 flex items-center gap-2">
            <Package className="w-6 h-6 text-amber-800" />
            <span>Gestão de Estoque & Matérias-Primas</span>
          </h2>
          <p className="text-xs text-amber-800/80">Controle completo de argilas, esmaltes, pigmentos, embalagens e peças acabadas.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {activeTab === 'raw' ? (
            <button
              onClick={handleOpenCreateRaw}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-amber-900 hover:bg-amber-800 text-amber-50 font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all text-xs sm:text-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Matéria-Prima</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setSelectedItemId(products[0]?.id || '');
                setIsAdjustmentModalOpen(true);
              }}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-amber-900 hover:bg-amber-800 text-amber-50 font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all text-xs sm:text-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Ajuste Manual</span>
            </button>
          )}

          <button
            onClick={onOpenVoiceModal}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-amber-600 hover:bg-amber-500 text-white font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all text-xs sm:text-sm cursor-pointer"
          >
            <Mic className="w-4 h-4 animate-pulse" />
            <span>Ajustar por Voz</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-amber-200 overflow-x-auto scrollbar-none whitespace-nowrap">
        <button
          onClick={() => setActiveTab('raw')}
          className={`px-4 sm:px-5 py-2.5 sm:py-3 font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === 'raw'
              ? 'border-amber-800 text-amber-950 bg-amber-50/50'
              : 'border-transparent text-amber-700 hover:text-amber-950'
          }`}
        >
          🧱 Matérias-Primas ({rawMaterials.length})
        </button>

        <button
          onClick={() => setActiveTab('finished')}
          className={`px-4 sm:px-5 py-2.5 sm:py-3 font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === 'finished'
              ? 'border-amber-800 text-amber-950 bg-amber-50/50'
              : 'border-transparent text-amber-700 hover:text-amber-950'
          }`}
        >
          🏺 Produtos Acabados ({products.length})
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 sm:px-5 py-2.5 sm:py-3 font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === 'history'
              ? 'border-amber-800 text-amber-950 bg-amber-50/50'
              : 'border-transparent text-amber-700 hover:text-amber-950'
          }`}
        >
          📋 Histórico & Auditoria ({auditLogs.length})
        </button>
      </div>

      {/* Raw Materials Tab */}
      {activeTab === 'raw' && (
        <div className="space-y-4">
          {/* Summary Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white border border-amber-200 rounded-xl p-4 shadow-xs">
              <span className="text-[11px] font-bold text-amber-800 uppercase block">Total de Insumos</span>
              <p className="text-xl font-black text-amber-950 mt-1">{rawMaterials.length} tipos cadastrados</p>
            </div>

            <div className={`border rounded-xl p-4 shadow-xs ${
              lowRawStockCount > 0 ? 'bg-red-50/70 border-red-200' : 'bg-white border-amber-200'
            }`}>
              <span className={`text-[11px] font-bold uppercase block ${
                lowRawStockCount > 0 ? 'text-red-700' : 'text-amber-800'
              }`}>
                Estoque Mínimo / Alerta
              </span>
              <p className={`text-xl font-black mt-1 ${
                lowRawStockCount > 0 ? 'text-red-700' : 'text-emerald-800'
              }`}>
                {lowRawStockCount > 0 ? `⚠️ ${lowRawStockCount} insumo(s) em falta` : '✓ Todos abastecidos'}
              </p>
            </div>

            <div className="bg-white border border-amber-200 rounded-xl p-4 shadow-xs">
              <span className="text-[11px] font-bold text-amber-800 uppercase block">Valor em Insumos</span>
              <p className="text-xl font-black text-amber-950 mt-1">R$ {totalRawInvested.toFixed(2)}</p>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white border border-amber-200 rounded-xl p-3.5 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-amber-700 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar matéria-prima por nome, categoria ou fornecedor..."
                value={rawSearchTerm}
                onChange={(e) => setRawSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-amber-50/40 border border-amber-200 rounded-lg text-amber-950 placeholder-amber-700/60 focus:outline-none focus:border-amber-600"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={rawCategoryFilter}
                onChange={(e) => setRawCategoryFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 text-xs sm:text-sm bg-amber-50/40 border border-amber-200 rounded-lg text-amber-950 font-medium focus:outline-none focus:border-amber-600 cursor-pointer"
              >
                <option value="all">Todas as Categorias</option>
                {RAW_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <button
                onClick={handleOpenCreateRaw}
                className="px-3 py-2 bg-amber-800 hover:bg-amber-900 text-amber-50 font-bold rounded-lg text-xs sm:text-sm flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Cadastrar Insumo</span>
                <span className="sm:hidden">Novo</span>
              </button>
            </div>
          </div>

          {/* Raw Materials Content */}
          <div className="bg-white border border-amber-200 rounded-2xl overflow-hidden shadow-xs">
            {filteredRawMaterials.length === 0 ? (
              <div className="p-10 text-center space-y-3">
                <Layers className="w-12 h-12 text-amber-400 mx-auto" />
                <p className="font-bold text-amber-950 text-base">Nenhuma matéria-prima encontrada</p>
                <p className="text-xs text-amber-700 max-w-sm mx-auto">
                  {rawMaterials.length === 0
                    ? 'Cadastre argilas, esmaltes, pigmentos ou embalagens para monitorar seu estoque e custos.'
                    : 'Nenhum resultado corresponde aos filtros de busca aplicados.'}
                </p>
                <button
                  onClick={handleOpenCreateRaw}
                  className="mt-2 inline-flex items-center space-x-1.5 px-4 py-2 bg-amber-800 hover:bg-amber-900 text-amber-50 font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Cadastrar Matéria-Prima</span>
                </button>
              </div>
            ) : (
              <>
                {/* Mobile View: Cards */}
                <div className="block md:hidden divide-y divide-amber-100">
                  {filteredRawMaterials.map((m) => {
                    const isLow = m.stockQuantity <= m.minStock;
                    return (
                      <div key={m.id} className="p-4 space-y-3 hover:bg-amber-50/40">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-bold">
                                {m.category}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isLow ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {isLow ? '⚠️ Estoque Baixo' : '✓ Normal'}
                              </span>
                            </div>
                            <p className="font-bold text-amber-950 text-base mt-1">{m.name}</p>
                            {m.supplier && (
                              <p className="text-xs text-amber-800">Fornecedor: {m.supplier}</p>
                            )}
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] text-amber-700 block uppercase font-bold">Saldo Atual</span>
                            <span className={`text-lg font-black ${isLow ? 'text-red-600' : 'text-emerald-900'}`}>
                              {m.stockQuantity} {m.unit}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 py-2 px-3 bg-amber-50/60 rounded-lg border border-amber-200/60 text-xs">
                          <div>
                            <span className="text-[10px] text-amber-700 block uppercase">Custo Unitário</span>
                            <span className="font-bold text-amber-950">R$ {m.costPerUnit.toFixed(2)} / {m.unit}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-amber-700 block uppercase">Estoque Mínimo</span>
                            <span className="font-bold text-amber-800">{m.minStock} {m.unit}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            onClick={() => {
                              setSelectedItemId(m.id);
                              setIsAdjustmentModalOpen(true);
                            }}
                            className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                          >
                            Ajustar Saldo
                          </button>
                          <button
                            onClick={() => handleOpenEditRaw(m)}
                            className="px-3 py-1.5 bg-amber-800 hover:bg-amber-900 text-amber-50 font-bold rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Editar</span>
                          </button>
                          <button
                            onClick={() => handleDeleteRawMaterial(m)}
                            className="p-1.5 text-red-700 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                            title="Excluir Matéria-Prima"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop View: Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-amber-900/10 text-amber-900 font-bold border-b border-amber-200">
                      <tr>
                        <th className="p-3.5">Matéria-Prima / Insumo</th>
                        <th className="p-3.5">Categoria</th>
                        <th className="p-3.5">Estoque Atual</th>
                        <th className="p-3.5">Estoque Mín.</th>
                        <th className="p-3.5">Custo / Unidade</th>
                        <th className="p-3.5 hidden lg:table-cell">Fornecedor</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-100">
                      {filteredRawMaterials.map((m) => {
                        const isLow = m.stockQuantity <= m.minStock;
                        return (
                          <tr key={m.id} className="hover:bg-amber-50/60">
                            <td className="p-3.5">
                              <p className="font-bold text-amber-950">{m.name}</p>
                              {m.lastPurchaseDate && (
                                <p className="text-[11px] text-amber-700">Última compra: {m.lastPurchaseDate}</p>
                              )}
                            </td>
                            <td className="p-3.5">
                              <span className="px-2.5 py-1 rounded-md bg-amber-100 text-amber-900 font-bold text-xs">
                                {m.category}
                              </span>
                            </td>
                            <td className="p-3.5">
                              <span className={`text-base font-black ${isLow ? 'text-red-600' : 'text-emerald-900'}`}>
                                {m.stockQuantity} {m.unit}
                              </span>
                            </td>
                            <td className="p-3.5 text-amber-800 font-medium">{m.minStock} {m.unit}</td>
                            <td className="p-3.5 font-bold text-amber-950">R$ {m.costPerUnit.toFixed(2)} / {m.unit}</td>
                            <td className="p-3.5 text-amber-800 hidden lg:table-cell">{m.supplier || '—'}</td>
                            <td className="p-3.5">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                isLow ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {isLow ? '⚠️ Estoque Baixo' : '✓ Normal'}
                              </span>
                            </td>
                            <td className="p-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    setSelectedItemId(m.id);
                                    setIsAdjustmentModalOpen(true);
                                  }}
                                  className="px-2.5 py-1 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors cursor-pointer"
                                  title="Ajustar Quantidade"
                                >
                                  Ajustar
                                </button>
                                <button
                                  onClick={() => handleOpenEditRaw(m)}
                                  className="p-1.5 text-amber-800 hover:bg-amber-200 rounded-lg transition-colors cursor-pointer"
                                  title="Editar Dados"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteRawMaterial(m)}
                                  className="p-1.5 text-red-700 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                                  title="Excluir Insumo"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Finished Products Inventory Tab */}
      {activeTab === 'finished' && (
        <div className="bg-white border border-amber-200 rounded-2xl overflow-hidden shadow-xs">
          {products.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <Package className="w-12 h-12 text-amber-400 mx-auto" />
              <p className="font-bold text-amber-950 text-base">Nenhum produto em estoque</p>
              <p className="text-xs text-amber-700 max-w-sm mx-auto">
                Cadastre seus vasos e cerâmicas no Catálogo de Produtos para controlar quantidades e alertas.
              </p>
            </div>
          ) : (
            <>
              {/* Mobile View: Cards */}
              <div className="block md:hidden divide-y divide-amber-100">
                {products.map((p) => {
                  const isLow = p.stock <= p.minStock;
                  return (
                    <div key={p.id} className="p-3.5 space-y-2 hover:bg-amber-50/40">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {p.photoUrl ? (
                            <img src={p.photoUrl} alt={p.name} className="w-10 h-10 object-cover rounded-lg border border-amber-200 shrink-0" />
                          ) : (
                            <div className="w-10 h-10 bg-amber-200 rounded-lg flex items-center justify-center font-bold text-amber-900 shrink-0">
                              {p.code.substring(0, 3)}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-amber-950 text-sm">{p.name}</p>
                            <p className="text-[11px] text-amber-700">{p.code} • {p.category}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isLow ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {isLow ? '⚠️ Baixo' : '✓ Normal'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-amber-100">
                        <span className="font-bold text-amber-900">Preço: R$ {p.price.toFixed(2)}</span>
                        <span className={`font-black text-sm ${isLow ? 'text-red-600' : 'text-emerald-900'}`}>
                          Estoque: {p.stock} un (mín: {p.minStock})
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop View: Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-amber-900/10 text-amber-900 font-bold border-b border-amber-200">
                    <tr>
                      <th className="p-3.5">Código / Foto</th>
                      <th className="p-3.5">Produto</th>
                      <th className="p-3.5 hidden lg:table-cell">Categoria</th>
                      <th className="p-3.5">Preço Venda</th>
                      <th className="p-3.5">Estoque Atual</th>
                      <th className="p-3.5 hidden lg:table-cell">Estoque Mín.</th>
                      <th className="p-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-100">
                    {products.map((p) => {
                      const isLow = p.stock <= p.minStock;
                      return (
                        <tr key={p.id} className="hover:bg-amber-50/60">
                          <td className="p-3.5 flex items-center space-x-3">
                            {p.photoUrl ? (
                              <img src={p.photoUrl} alt={p.name} className="w-10 h-10 object-cover rounded-lg border border-amber-200" />
                            ) : (
                              <div className="w-10 h-10 bg-amber-200 rounded-lg flex items-center justify-center font-bold text-amber-900">
                                {p.code.substring(0, 3)}
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-amber-950">{p.code}</p>
                              <p className="text-[11px] text-amber-700">Tam: {p.size}</p>
                            </div>
                          </td>
                          <td className="p-3.5">
                            <p className="font-bold text-amber-950">{p.name}</p>
                            <p className="text-[11px] text-amber-700">{p.finish || 'Acabamento padrão'}</p>
                          </td>
                          <td className="p-3.5 text-amber-900 font-medium hidden lg:table-cell">{p.category}</td>
                          <td className="p-3.5 font-bold text-amber-950">R$ {p.price.toFixed(2)}</td>
                          <td className="p-3.5">
                            <span className={`text-base font-black ${isLow ? 'text-red-600' : 'text-emerald-900'}`}>
                              {p.stock} un
                            </span>
                          </td>
                          <td className="p-3.5 text-amber-800 hidden lg:table-cell">{p.minStock} un</td>
                          <td className="p-3.5">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              isLow ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {isLow ? '⚠️ Estoque Baixo' : '✓ Normal'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* History & Audit Tab */}
      {activeTab === 'history' && (
        <div className="bg-white border border-amber-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 bg-amber-50/60 border-b border-amber-200 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-amber-950 text-sm">Histórico de Operações & Rastreabilidade</h3>
              <p className="text-xs text-amber-700">Todas as operações registram auditoria com suporte a reversão segura.</p>
            </div>
          </div>
          <div className="divide-y divide-amber-100">
            {auditLogs.length === 0 ? (
              <div className="p-6 text-center text-amber-800/60">Nenhum registro de auditoria.</div>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="p-3.5 flex items-center justify-between hover:bg-amber-50/40 text-xs">
                  <div>
                    <span className="font-bold text-amber-950 block">{log.details || log.action}</span>
                    <span className="text-[11px] text-amber-700">
                      {new Date(log.timestamp).toLocaleString('pt-BR')} • {log.action} • {log.entityType}
                    </span>
                  </div>
                  {log.status !== 'Desfeito' && (
                    <button
                      onClick={() => handleUndoAudit(log.id)}
                      className="flex items-center space-x-1 px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Desfazer</span>
                    </button>
                  )}
                  {log.status === 'Desfeito' && (
                    <span className="text-[11px] text-neutral-500 italic bg-neutral-100 px-2 py-0.5 rounded">
                      Desfeito
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modal: Cadastro / Edição de Matéria-Prima (Mobile-First Bottom-Sheet & Desktop Centered) */}
      {isRawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl border border-amber-200 flex flex-col max-h-[92dvh] sm:max-h-[88vh] overflow-hidden animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-2">
            {/* Modal Sticky Header */}
            <div className="p-4 sm:p-5 border-b border-amber-100 flex items-center justify-between shrink-0 bg-white">
              <div>
                <h3 className="font-bold text-amber-950 text-base sm:text-lg">
                  {editingRawMaterial ? 'Editar Matéria-Prima' : 'Cadastrar Nova Matéria-Prima'}
                </h3>
                <p className="text-[11px] sm:text-xs text-amber-800">
                  Preencha os dados do insumo para controle de estoque e custos.
                </p>
              </div>
              <button 
                onClick={() => setIsRawModalOpen(false)} 
                className="p-2 text-amber-800 hover:bg-amber-100 rounded-xl transition-colors cursor-pointer shrink-0"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <form onSubmit={handleSaveRawMaterial} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 overscroll-contain text-xs sm:text-sm">
                <div>
                  <label className="block font-bold text-amber-900 mb-1">
                    Nome da Matéria-Prima / Insumo: <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Argila Vermelha Terracota, Esmalte Fosco Verde, Caulim..."
                    value={rawName}
                    onChange={(e) => setRawName(e.target.value)}
                    className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-3 text-amber-950 placeholder-amber-700/50 focus:outline-none focus:border-amber-600 focus:bg-white text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-amber-900 mb-1">Categoria:</label>
                    <select
                      value={rawCategory}
                      onChange={(e) => setRawCategory(e.target.value as RawMaterialCategory)}
                      className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-3 text-amber-950 font-bold focus:outline-none focus:border-amber-600 focus:bg-white cursor-pointer text-sm"
                    >
                      {RAW_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-amber-900 mb-1">Unidade de Medida:</label>
                    <select
                      value={rawUnit}
                      onChange={(e) => setRawUnit(e.target.value as any)}
                      className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-3 text-amber-950 font-bold focus:outline-none focus:border-amber-600 focus:bg-white cursor-pointer text-sm"
                    >
                      <option value="kg">Quilogramas (kg)</option>
                      <option value="g">Gramas (g)</option>
                      <option value="L">Litros (L)</option>
                      <option value="ml">Mililitros (ml)</option>
                      <option value="un">Unidades (un)</option>
                      <option value="m">Metros (m)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-amber-900 mb-1">Estoque Inicial:</label>
                    <input
                      type="number"
                      step="any"
                      min={0}
                      required
                      value={rawStockQuantity}
                      onChange={(e) => setRawStockQuantity(parseFloat(e.target.value) || 0)}
                      className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-3 text-amber-950 focus:outline-none focus:border-amber-600 focus:bg-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-amber-900 mb-1">Estoque Mínimo:</label>
                    <input
                      type="number"
                      step="any"
                      min={0}
                      required
                      value={rawMinStock}
                      onChange={(e) => setRawMinStock(parseFloat(e.target.value) || 0)}
                      className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-3 text-amber-950 focus:outline-none focus:border-amber-600 focus:bg-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-amber-900 mb-1">Custo Unitário (R$):</label>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      value={rawCostPerUnit}
                      onChange={(e) => setRawCostPerUnit(parseFloat(e.target.value) || 0)}
                      className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-3 text-amber-950 font-bold focus:outline-none focus:border-amber-600 focus:bg-white text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-amber-900 mb-1">Fornecedor (opcional):</label>
                    <input
                      type="text"
                      placeholder="Ex: Mineradora Vale do Sol"
                      value={rawSupplier}
                      onChange={(e) => setRawSupplier(e.target.value)}
                      className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-3 text-amber-950 placeholder-amber-700/50 focus:outline-none focus:border-amber-600 focus:bg-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-amber-900 mb-1">Data da Última Compra:</label>
                    <input
                      type="date"
                      value={rawLastPurchaseDate}
                      onChange={(e) => setRawLastPurchaseDate(e.target.value)}
                      className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-3 text-amber-950 focus:outline-none focus:border-amber-600 focus:bg-white cursor-pointer text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Sticky Footer */}
              <div className="p-3.5 sm:p-4 border-t border-amber-100 flex items-center justify-end gap-2 bg-amber-50/60 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsRawModalOpen(false)}
                  className="px-4 py-2.5 border border-amber-300 rounded-xl text-amber-950 font-bold hover:bg-amber-100 transition-colors cursor-pointer text-xs sm:text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-900 hover:bg-amber-800 text-amber-50 rounded-xl font-bold shadow-md transition-colors cursor-pointer text-xs sm:text-sm"
                >
                  {editingRawMaterial ? 'Salvar Alterações' : 'Cadastrar Matéria-Prima'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Stock Adjustment Modal */}
      {isAdjustmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl border border-amber-200 flex flex-col max-h-[90dvh] sm:max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-2">
            <div className="p-4 sm:p-5 border-b border-amber-100 flex items-center justify-between shrink-0 bg-white">
              <div>
                <h3 className="font-bold text-amber-950 text-base sm:text-lg">Ajuste Manual de Saldo</h3>
                <p className="text-[11px] sm:text-xs text-amber-800">Registre entradas, saídas ou quebras de estoque.</p>
              </div>
              <button 
                onClick={() => setIsAdjustmentModalOpen(false)} 
                className="p-2 text-amber-800 hover:bg-amber-100 rounded-xl transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustStock} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 overscroll-contain text-xs sm:text-sm">
                <div>
                  <label className="block font-bold text-amber-900 mb-1">Item a Ajustar:</label>
                  <select
                    required
                    value={selectedItemId}
                    onChange={(e) => setSelectedItemId(e.target.value)}
                    className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-3 text-amber-950 focus:outline-none focus:border-amber-600 focus:bg-white cursor-pointer text-sm"
                  >
                    <option value="">Selecione o item...</option>
                    <optgroup label="Matérias-Primas">
                      {rawMaterials.map(m => <option key={m.id} value={m.id}>{m.name} (Atual: {m.stockQuantity} {m.unit})</option>)}
                    </optgroup>
                    <optgroup label="Produtos Acabados">
                      {products.map(p => <option key={p.id} value={p.id}>{p.name} (Atual: {p.stock} un)</option>)}
                    </optgroup>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-amber-900 mb-1">Tipo de Movimento:</label>
                    <select
                      value={adjustmentType}
                      onChange={(e) => setAdjustmentType(e.target.value as 'add' | 'remove')}
                      className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-3 text-amber-950 font-bold focus:outline-none focus:border-amber-600 focus:bg-white cursor-pointer text-sm"
                    >
                      <option value="add">➕ Entrada (+)</option>
                      <option value="remove">➖ Saída (-)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-amber-900 mb-1">Quantidade:</label>
                    <input
                      type="number"
                      step="any"
                      min={0.1}
                      value={adjustmentQty}
                      onChange={(e) => setAdjustmentQty(parseFloat(e.target.value) || 1)}
                      className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-3 text-amber-950 focus:outline-none focus:border-amber-600 focus:bg-white text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-amber-900 mb-1">Motivo do Ajuste:</label>
                  <input
                    type="text"
                    placeholder="Ex: Chegada de carregamento, consumo na queima ou quebra"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-3 text-amber-950 placeholder-amber-700/50 focus:outline-none focus:border-amber-600 focus:bg-white text-sm"
                  />
                </div>
              </div>

              <div className="p-3.5 sm:p-4 border-t border-amber-100 flex items-center justify-end gap-2 bg-amber-50/60 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAdjustmentModalOpen(false)}
                  className="px-4 py-2.5 border border-amber-300 rounded-xl text-amber-950 font-bold hover:bg-amber-100 transition-colors cursor-pointer text-xs sm:text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-900 hover:bg-amber-800 text-amber-50 rounded-xl font-bold shadow-md transition-colors cursor-pointer text-xs sm:text-sm"
                >
                  Confirmar Ajuste
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
