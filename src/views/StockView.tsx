import React, { useState } from 'react';
import { Package, Plus, Mic, AlertTriangle, Layers, ArrowUpRight, ArrowDownRight, RefreshCw, X } from 'lucide-react';
import { StorageService } from '../services/storage';
import { Product, RawMaterial } from '../types';

interface StockViewProps {
  onOpenVoiceModal: () => void;
}

export const StockView: React.FC<StockViewProps> = ({ onOpenVoiceModal }) => {
  const [activeTab, setActiveTab] = useState<'finished' | 'raw'>('finished');
  const [products, setProducts] = useState<Product[]>(() => StorageService.getProducts());
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>(() => StorageService.getRawMaterials());
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);

  // Quick Adjustment
  const [selectedItemId, setSelectedItemId] = useState('');
  const [adjustmentQty, setAdjustmentQty] = useState(1);
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove'>('add');
  const [reason, setReason] = useState('');

  const refreshData = () => {
    setProducts(StorageService.getProducts());
    setRawMaterials(StorageService.getRawMaterials());
  };

  const handleAdjustStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'finished') {
      const prod = products.find(p => p.id === selectedItemId);
      if (prod) {
        const change = adjustmentType === 'add' ? adjustmentQty : -adjustmentQty;
        prod.stock = Math.max(0, prod.stock + change);
        StorageService.saveProduct(prod);
      }
    } else {
      const mat = rawMaterials.find(m => m.id === selectedItemId);
      if (mat) {
        const change = adjustmentType === 'add' ? adjustmentQty : -adjustmentQty;
        mat.stockQuantity = Math.max(0, mat.stockQuantity + change);
        StorageService.saveRawMaterial(mat);
      }
    }
    refreshData();
    setIsAdjustmentModalOpen(false);
    setSelectedItemId('');
    setReason('');
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header & Voice Callout */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-amber-950 flex items-center gap-2">
            <Package className="w-6 h-6 text-amber-800" />
            <span>Gestão de Estoque Olaria</span>
          </h2>
          <p className="text-xs text-amber-800/80">Produtos Acabados e Matérias-Primas (Argila, Esmaltes, Tintas).</p>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            onClick={onOpenVoiceModal}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-amber-600 hover:bg-amber-500 text-white font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all text-xs sm:text-sm"
          >
            <Mic className="w-4 h-4 animate-pulse" />
            <span>Ajustar por Voz</span>
          </button>

          <button
            onClick={() => setIsAdjustmentModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-amber-900 hover:bg-amber-800 text-amber-50 font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all text-xs sm:text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Ajuste Manual</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-amber-200">
        <button
          onClick={() => setActiveTab('finished')}
          className={`px-5 py-3 font-bold text-sm border-b-2 transition-all ${
            activeTab === 'finished'
              ? 'border-amber-800 text-amber-950 bg-amber-50/50'
              : 'border-transparent text-amber-700 hover:text-amber-950'
          }`}
        >
          🏺 Produtos Acabados ({products.length})
        </button>

        <button
          onClick={() => setActiveTab('raw')}
          className={`px-5 py-3 font-bold text-sm border-b-2 transition-all ${
            activeTab === 'raw'
              ? 'border-amber-800 text-amber-950 bg-amber-50/50'
              : 'border-transparent text-amber-700 hover:text-amber-950'
          }`}
        >
          🧱 Matérias-Primas ({rawMaterials.length})
        </button>
      </div>

      {/* Finished Products Inventory */}
      {activeTab === 'finished' && (
        <div className="bg-white border border-amber-200 rounded-2xl overflow-hidden shadow-xs">
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
                  <th className="p-3.5">Categoria</th>
                  <th className="p-3.5">Preço Venda</th>
                  <th className="p-3.5">Estoque Atual</th>
                  <th className="p-3.5">Estoque Mín.</th>
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
                      <td className="p-3.5 text-amber-900 font-medium">{p.category}</td>
                      <td className="p-3.5 font-bold text-amber-950">R$ {p.price.toFixed(2)}</td>
                      <td className="p-3.5">
                        <span className={`text-base font-black ${isLow ? 'text-red-600' : 'text-emerald-900'}`}>
                          {p.stock} un
                        </span>
                      </td>
                      <td className="p-3.5 text-amber-800">{p.minStock} un</td>
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
        </div>
      )}

      {/* Raw Materials Inventory */}
      {activeTab === 'raw' && (
        <div className="bg-white border border-amber-200 rounded-2xl overflow-hidden shadow-xs">
          {/* Mobile View: Cards */}
          <div className="block md:hidden divide-y divide-amber-100">
            {rawMaterials.map((m) => {
              const isLow = m.stockQuantity <= m.minStock;
              return (
                <div key={m.id} className="p-3.5 space-y-1.5 hover:bg-amber-50/40">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-amber-950 text-sm">{m.name}</p>
                      <p className="text-[11px] text-amber-700">{m.category} • Fornecedor: {m.supplier || 'N/I'}</p>
                    </div>
                    <span className={`font-black text-sm ${isLow ? 'text-red-600' : 'text-emerald-900'}`}>
                      {m.stockQuantity} {m.unit}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-amber-100">
                    <span className="text-amber-800">Custo: R$ {m.costPerUnit.toFixed(2)} / {m.unit}</span>
                    <span className="text-amber-700">Mín: {m.minStock} {m.unit}</span>
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
                  <th className="p-3.5">Insumo / Matéria-Prima</th>
                  <th className="p-3.5">Categoria</th>
                  <th className="p-3.5">Estoque Atual</th>
                  <th className="p-3.5">Mínimo</th>
                  <th className="p-3.5">Custo/Unid</th>
                  <th className="p-3.5">Fornecedor</th>
                  <th className="p-3.5">Última Compra</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100">
                {rawMaterials.map((m) => {
                  const isLow = m.stockQuantity <= m.minStock;
                  return (
                    <tr key={m.id} className="hover:bg-amber-50/60">
                      <td className="p-3.5 font-bold text-amber-950">{m.name}</td>
                      <td className="p-3.5 text-amber-900 font-medium">{m.category}</td>
                      <td className="p-3.5">
                        <span className={`text-base font-black ${isLow ? 'text-red-600' : 'text-emerald-900'}`}>
                          {m.stockQuantity} {m.unit}
                        </span>
                      </td>
                      <td className="p-3.5 text-amber-800">{m.minStock} {m.unit}</td>
                      <td className="p-3.5 font-bold text-amber-950">R$ {m.costPerUnit.toFixed(2)} / {m.unit}</td>
                      <td className="p-3.5 text-amber-800">{m.supplier || 'N/I'}</td>
                      <td className="p-3.5 text-amber-700">{m.lastPurchaseDate || 'N/A'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manual Stock Adjustment Modal */}
      {isAdjustmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-amber-200 space-y-4">
            <div className="flex items-center justify-between border-b border-amber-100 pb-3">
              <h3 className="font-bold text-amber-950 text-base">Ajuste de Estoque ({activeTab === 'finished' ? 'Produtos' : 'Matérias-Primas'})</h3>
              <button onClick={() => setIsAdjustmentModalOpen(false)} className="text-amber-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustStock} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-amber-900 mb-1">Item:</label>
                <select
                  required
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-2.5 text-amber-950"
                >
                  <option value="">Selecione o item...</option>
                  {activeTab === 'finished'
                    ? products.map(p => <option key={p.id} value={p.id}>{p.name} (Atual: {p.stock} un)</option>)
                    : rawMaterials.map(m => <option key={m.id} value={m.id}>{m.name} (Atual: {m.stockQuantity} {m.unit})</option>)
                  }
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-amber-900 mb-1">Tipo de Movimento:</label>
                  <select
                    value={adjustmentType}
                    onChange={(e) => setAdjustmentType(e.target.value as 'add' | 'remove')}
                    className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-2.5 text-amber-950 font-bold"
                  >
                    <option value="add">➕ Entrada (+)</option>
                    <option value="remove">➖ Saída / Perda (-)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-amber-900 mb-1">Quantidade:</label>
                  <input
                    type="number"
                    min={1}
                    value={adjustmentQty}
                    onChange={(e) => setAdjustmentQty(parseInt(e.target.value) || 1)}
                    className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-2.5 text-amber-950"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-amber-900 mb-1">Motivo do Ajuste:</label>
                <input
                  type="text"
                  placeholder="Ex: Contagem de estoque física ou quebra"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-2.5 text-amber-950"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustmentModalOpen(false)}
                  className="px-4 py-2 border border-amber-300 rounded-xl text-amber-900 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-800 text-amber-50 rounded-xl font-bold"
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
