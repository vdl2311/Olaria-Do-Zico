import React, { useState, useEffect } from 'react';
import { Hammer, Plus, Mic, Flame, CheckCircle, AlertTriangle, ChevronRight, X, Trash2, CheckCircle2 } from 'lucide-react';
import { StorageService, subscribeStorage } from '../services/storage';
import { ProductionBatch, Product, ProductionStage } from '../types';

interface ProductionViewProps {
  onOpenVoiceModal: () => void;
}

export const STAGES: ProductionStage[] = ['Produção', 'Secagem', 'Queima', 'Acabamento', 'Pronto'];

export const ProductionView: React.FC<ProductionViewProps> = ({ onOpenVoiceModal }) => {
  const [batches, setBatches] = useState<ProductionBatch[]>(() => StorageService.getProduction());
  const [products, setProducts] = useState<Product[]>(() => StorageService.getProducts());
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Batch Form
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantityPlanned, setQuantityPlanned] = useState(10);
  const [quantityLost, setQuantityLost] = useState(0);
  const [stage, setStage] = useState<ProductionStage>('Produção');
  const [batchNumber, setBatchNumber] = useState(`Lote ${new Date().toISOString().split('T')[0]}`);
  const [notes, setNotes] = useState('');

  const refreshData = () => {
    setBatches(StorageService.getProduction());
    setProducts(StorageService.getProducts());
  };

  useEffect(() => {
    const unsub = subscribeStorage(() => {
      refreshData();
    });
    return () => unsub();
  }, []);

  const handleUpdateStage = (batch: ProductionBatch, newStage: ProductionStage) => {
    const updated: ProductionBatch = {
      ...batch,
      stage: newStage,
      completedDate: newStage === 'Pronto' ? new Date().toISOString().split('T')[0] : batch.completedDate
    };
    StorageService.saveProduction(updated);
    refreshData();
  };

  const handleDeleteBatch = (batch: ProductionBatch) => {
    if (confirm(`Deseja excluir o lote ${batch.code}? Caso o lote tenha adicionado peças ao estoque, elas serão estornadas.`)) {
      StorageService.deleteProduction(batch.id);
      refreshData();
    }
  };

  const handleCreateBatch = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find(p => p.id === selectedProductId);
    if (!prod) {
      alert('Selecione um produto.');
      return;
    }

    const qtyGood = Math.max(0, quantityPlanned - quantityLost);

    const newBatch: ProductionBatch = {
      id: `batch-${Date.now()}`,
      code: `PRD-${Math.floor(100 + Math.random() * 900)}`,
      productId: prod.id,
      productName: prod.name,
      quantityPlanned,
      quantityProduced: quantityPlanned,
      quantityLost,
      quantityGood: qtyGood,
      stage,
      startDate: new Date().toISOString().split('T')[0],
      completedDate: stage === 'Pronto' ? new Date().toISOString().split('T')[0] : undefined,
      batchNumber,
      notes
    };

    StorageService.saveProduction(newBatch);
    refreshData();
    setIsModalOpen(false);

    // Reset Form
    setSelectedProductId('');
    setQuantityPlanned(10);
    setQuantityLost(0);
    setNotes('');
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header & Voice Callout */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-amber-950 flex items-center gap-2">
            <Hammer className="w-6 h-6 text-amber-800" />
            <span>Controle de Produção de Cerâmica</span>
          </h2>
          <p className="text-xs text-amber-800/80">Acompanhe etapas: Produção → Secagem → Queima → Acabamento → Pronto.</p>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            onClick={onOpenVoiceModal}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-amber-600 hover:bg-amber-500 text-white font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all text-xs sm:text-sm"
          >
            <Mic className="w-4 h-4 animate-pulse" />
            <span>Registrar por Voz</span>
          </button>

          <button
            onClick={() => {
              setSelectedProductId(products[0]?.id || '');
              setIsModalOpen(true);
            }}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-amber-900 hover:bg-amber-800 text-amber-50 font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all text-xs sm:text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Lote</span>
          </button>
        </div>
      </div>

      {/* Production Stage Pipeline Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {STAGES.map((stg) => {
          const count = batches.filter(b => b.stage === stg).length;
          return (
            <div key={stg} className="bg-white p-3 rounded-xl border border-amber-200 text-center shadow-xs">
              <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">{stg}</p>
              <p className="text-xl font-black text-amber-950 mt-1">{count} Lote(s)</p>
            </div>
          );
        })}
      </div>

      {/* Production Batches List */}
      <div className="space-y-4">
        <h3 className="font-bold text-amber-950 text-base">Lotes de Produção</h3>

        {batches.length === 0 ? (
          <div className="bg-white border border-amber-200 rounded-2xl p-10 text-center space-y-4 shadow-xs">
            <Hammer className="w-12 h-12 text-amber-400 mx-auto" />
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="font-bold text-amber-950 text-base">Nenhum lote de produção registrado</h3>
              <p className="text-xs text-amber-700">
                Inicie um lote para acompanhar a moldagem, secagem, queima e acabamento de vasos e peças cerâmicas.
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center space-x-2 bg-amber-900 hover:bg-amber-800 text-amber-50 font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all text-xs sm:text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Iniciar Primeiro Lote</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {batches.map((b) => (
              <div key={b.id} className="bg-white border border-amber-200 rounded-2xl p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-amber-100 pb-2">
                  <div>
                    <span className="text-xs font-bold text-amber-700">{b.code} • {b.batchNumber}</span>
                    <h4 className="font-black text-amber-950 text-base">{b.productName}</h4>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      b.stage === 'Pronto' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                    }`}>
                      {b.stage}
                    </span>
                    <button
                      onClick={() => handleDeleteBatch(b)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Excluir Lote"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs bg-amber-50/60 p-2.5 rounded-xl border border-amber-100">
                  <div>
                    <span className="text-amber-700 block text-[10px]">Produzidos</span>
                    <span className="font-bold text-amber-950">{b.quantityProduced} un</span>
                  </div>
                  <div>
                    <span className="text-red-600 block text-[10px]">Perdas/Quebras</span>
                    <span className="font-bold text-red-700">{b.quantityLost} un</span>
                  </div>
                  <div>
                    <span className="text-emerald-700 block text-[10px]">Aproveitados</span>
                    <span className="font-bold text-emerald-900">{b.quantityGood} un</span>
                  </div>
                </div>

                {b.stage === 'Pronto' && (
                  <div className="flex items-center space-x-1 text-xs text-emerald-800 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Estoque da peça atualizado com +{b.quantityGood} unidades.</span>
                  </div>
                )}

                {b.notes && (
                  <p className="text-xs text-amber-800/80 italic">Obs: {b.notes}</p>
                )}

                {/* Stage Progress Selector */}
                <div className="pt-2 border-t border-amber-100">
                  <label className="text-[11px] font-bold text-amber-800 block mb-1">Mudar Etapa:</label>
                  <div className="flex flex-wrap gap-1">
                    {STAGES.map((stg) => (
                      <button
                        key={stg}
                        onClick={() => handleUpdateStage(b, stg)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                          b.stage === stg
                            ? 'bg-amber-800 text-white shadow-xs'
                            : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                        }`}
                      >
                        {stg}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Batch Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-amber-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-amber-100 pb-3">
              <h3 className="font-bold text-amber-950 text-lg">Registrar Novo Lote de Produção</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-amber-700 hover:text-amber-950">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-amber-900 mb-1">Produto da Cerâmica:</label>
                <select
                  required
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-2.5 text-amber-950 focus:outline-none focus:border-amber-600"
                >
                  <option value="">Selecione o vaso / peça...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Cat: {p.category} | Estoque Atual: {p.stock})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-amber-900 mb-1">Quantidade Produzida:</label>
                  <input
                    type="number"
                    min={1}
                    value={quantityPlanned}
                    onChange={(e) => setQuantityPlanned(parseInt(e.target.value) || 1)}
                    className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-2.5 text-amber-950 focus:outline-none focus:border-amber-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-amber-900 mb-1">Perdas / Quebras:</label>
                  <input
                    type="number"
                    min={0}
                    value={quantityLost}
                    onChange={(e) => setQuantityLost(parseInt(e.target.value) || 0)}
                    className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-2.5 text-amber-950 text-red-600 font-bold focus:outline-none focus:border-amber-600"
                  />
                </div>
              </div>

              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 flex justify-between font-bold text-amber-950">
                <span>Peças Aproveitadas (Boas):</span>
                <span className="text-emerald-800 text-base">{Math.max(0, quantityPlanned - quantityLost)} un</span>
              </div>

              <div>
                <label className="block font-bold text-amber-900 mb-1">Etapa Inicial:</label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value as ProductionStage)}
                  className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-2.5 text-amber-950 focus:outline-none focus:border-amber-600"
                >
                  {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block font-bold text-amber-900 mb-1">Identificação / Lote:</label>
                <input
                  type="text"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-2.5 text-amber-950 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block font-bold text-amber-900 mb-1">Observações (queima, argila usada):</label>
                <input
                  type="text"
                  placeholder="Ex: Queima de alta temperatura, sem trincas"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-2.5 text-amber-950 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-amber-300 rounded-xl text-amber-900 font-semibold hover:bg-amber-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-800 hover:bg-amber-900 text-amber-50 rounded-xl font-bold shadow-md"
                >
                  Salvar Lote
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
