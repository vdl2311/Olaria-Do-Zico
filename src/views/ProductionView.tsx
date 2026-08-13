import React, { useState } from 'react';
import { Hammer, Plus, Mic, Flame, CheckCircle, AlertTriangle, ChevronRight, X } from 'lucide-react';
import { StorageService } from '../services/storage';
import { ProductionBatch, Product, ProductionStage } from '../types';

interface ProductionViewProps {
  onOpenVoiceModal: () => void;
}

export const STAGES: ProductionStage[] = ['Produção', 'Secagem', 'Queima', 'Acabamento', 'Pronto'];

export const ProductionView: React.FC<ProductionViewProps> = ({ onOpenVoiceModal }) => {
  const [batches, setBatches] = useState<ProductionBatch[]>(() => StorageService.getProduction());
  const [products] = useState<Product[]>(() => StorageService.getProducts());
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
  };

  const handleUpdateStage = (batch: ProductionBatch, newStage: ProductionStage) => {
    const updated = { ...batch, stage: newStage };
    StorageService.saveProduction(updated);
    refreshData();
  };

  const handleCreateBatch = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find(p => p.id === selectedProductId);
    if (!prod) return;

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
            onClick={() => setIsModalOpen(true)}
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
        <h3 className="font-bold text-amber-950 text-base">Lotes de Produção em Andamento</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {batches.map((b) => (
            <div key={b.id} className="bg-white border border-amber-200 rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-amber-100 pb-2">
                <div>
                  <span className="text-xs font-bold text-amber-700">{b.code} • {b.batchNumber}</span>
                  <h4 className="font-black text-amber-950 text-base">{b.productName}</h4>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  b.stage === 'Pronto' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                }`}>
                  {b.stage}
                </span>
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
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
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
      </div>

      {/* New Batch Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-amber-200 space-y-4">
            <div className="flex items-center justify-between border-b border-amber-100 pb-3">
              <h3 className="font-bold text-amber-950 text-lg">Registrar Novo Lote de Produção</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-amber-700">
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
                  className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-2.5 text-amber-950 focus:outline-none"
                >
                  <option value="">Selecione o vaso / peça...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Cat: {p.category})</option>
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
                    className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-2.5 text-amber-950"
                  />
                </div>

                <div>
                  <label className="block font-bold text-amber-900 mb-1">Perdas / Quebras:</label>
                  <input
                    type="number"
                    min={0}
                    value={quantityLost}
                    onChange={(e) => setQuantityLost(parseInt(e.target.value) || 0)}
                    className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-2.5 text-amber-950 text-red-600 font-bold"
                  />
                </div>
              </div>

              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 flex justify-between font-bold text-amber-950">
                <span>Peças Aproveitadas:</span>
                <span className="text-emerald-800">{Math.max(0, quantityPlanned - quantityLost)} un</span>
              </div>

              <div>
                <label className="block font-bold text-amber-900 mb-1">Etapa Atual:</label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value as ProductionStage)}
                  className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-2.5 text-amber-950"
                >
                  {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block font-bold text-amber-900 mb-1">Número do Lote:</label>
                <input
                  type="text"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-2.5 text-amber-950"
                />
              </div>

              <div>
                <label className="block font-bold text-amber-900 mb-1">Observações (causa da quebra, tipo de queima):</label>
                <input
                  type="text"
                  placeholder="Ex: 3 peças trincaram na subida do forno"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-2.5 text-amber-950"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-amber-300 rounded-xl text-amber-900 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-800 text-amber-50 rounded-xl font-bold"
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
