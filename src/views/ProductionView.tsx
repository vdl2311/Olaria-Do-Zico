import React, { useState, useEffect } from 'react';
import { 
  Hammer, 
  Plus, 
  Mic, 
  Flame, 
  AlertTriangle, 
  X, 
  Trash2, 
  CheckCircle2, 
  Edit3, 
  PlusCircle, 
  MinusCircle,
  Info,
  Layers,
  Sparkles
} from 'lucide-react';
import { StorageService, subscribeStorage } from '../services/storage';
import { ProductionBatch, Product, ProductionStage } from '../types';

interface ProductionViewProps {
  onOpenVoiceModal: () => void;
}

export const STAGES: ProductionStage[] = ['Produção', 'Secagem', 'Queima', 'Acabamento', 'Pronto'];

const LOSS_REASONS = [
  'Trinca / quebra no forno (queima)',
  'Trinca durante a secagem ao sol/sombra',
  'Deformação na queima de alta temperatura',
  'Bolha de ar na argila (estouro no forno)',
  'Queda / impacto no manuseio',
  'Defeito no esmalte ou acabamento',
  'Outro motivo operacional'
];

export const ProductionView: React.FC<ProductionViewProps> = ({ onOpenVoiceModal }) => {
  const [batches, setBatches] = useState<ProductionBatch[]>(() => StorageService.getProduction());
  const [products, setProducts] = useState<Product[]>(() => StorageService.getProducts());
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<ProductionBatch | null>(null);

  // Quick Breakage Modal state
  const [quickLossBatch, setQuickLossBatch] = useState<ProductionBatch | null>(null);
  const [quickLossAmount, setQuickLossAmount] = useState<number>(1);
  const [quickLossReason, setQuickLossReason] = useState<string>(LOSS_REASONS[0]);

  // Form State (used for both New and Edit)
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantityPlanned, setQuantityPlanned] = useState(10);
  const [quantityLost, setQuantityLost] = useState(0);
  const [stage, setStage] = useState<ProductionStage>('Produção');
  const [batchNumber, setBatchNumber] = useState('');
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

  const handleOpenNewBatch = () => {
    setEditingBatch(null);
    setSelectedProductId(products[0]?.id || '');
    setQuantityPlanned(12);
    setQuantityLost(0);
    setStage('Produção');
    setBatchNumber(`Lote ${new Date().toISOString().split('T')[0]}`);
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEditBatch = (batch: ProductionBatch) => {
    setEditingBatch(batch);
    setSelectedProductId(batch.productId);
    setQuantityPlanned(batch.quantityPlanned || batch.quantityProduced || 1);
    setQuantityLost(batch.quantityLost || 0);
    setStage(batch.stage);
    setBatchNumber(batch.batchNumber || batch.code);
    setNotes(batch.notes || '');
    setIsModalOpen(true);
  };

  const handleUpdateStage = (batch: ProductionBatch, newStage: ProductionStage) => {
    const updated: ProductionBatch = {
      ...batch,
      stage: newStage,
      completedDate: newStage === 'Pronto' ? (batch.completedDate || new Date().toISOString().split('T')[0]) : batch.completedDate
    };
    StorageService.saveProduction(updated);
    refreshData();
  };

  const handleDeleteBatch = (batch: ProductionBatch) => {
    if (confirm(`Deseja excluir o lote ${batch.code} (${batch.productName})? Se este lote já tiver enviado peças para o estoque, elas serão estornadas automaticamente.`)) {
      StorageService.deleteProduction(batch.id);
      refreshData();
    }
  };

  const handleSaveBatch = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find(p => p.id === selectedProductId);
    if (!prod) {
      alert('Selecione um produto.');
      return;
    }

    const safePlanned = Math.max(1, Number(quantityPlanned) || 1);
    const safeLost = Math.max(0, Number(quantityLost) || 0);
    const safeGood = Math.max(0, safePlanned - safeLost);

    if (editingBatch) {
      // Editing existing batch
      const updatedBatch: ProductionBatch = {
        ...editingBatch,
        productId: prod.id,
        productName: prod.name,
        quantityPlanned: safePlanned,
        quantityProduced: safePlanned,
        quantityLost: safeLost,
        quantityGood: safeGood,
        stage,
        completedDate: stage === 'Pronto' ? (editingBatch.completedDate || new Date().toISOString().split('T')[0]) : editingBatch.completedDate,
        batchNumber: batchNumber.trim() || editingBatch.code,
        notes: notes.trim()
      };

      StorageService.saveProduction(updatedBatch);
    } else {
      // Creating new batch
      const newBatch: ProductionBatch = {
        id: `batch-${Date.now()}`,
        code: `PRD-${Math.floor(100 + Math.random() * 900)}`,
        productId: prod.id,
        productName: prod.name,
        quantityPlanned: safePlanned,
        quantityProduced: safePlanned,
        quantityLost: safeLost,
        quantityGood: safeGood,
        stage,
        startDate: new Date().toISOString().split('T')[0],
        completedDate: stage === 'Pronto' ? new Date().toISOString().split('T')[0] : undefined,
        batchNumber: batchNumber.trim() || `Lote ${new Date().toISOString().split('T')[0]}`,
        notes: notes.trim()
      };

      StorageService.saveProduction(newBatch);
    }

    refreshData();
    setIsModalOpen(false);
  };

  // Quick breakage / loss handler
  const handleOpenQuickLoss = (batch: ProductionBatch) => {
    setQuickLossBatch(batch);
    setQuickLossAmount(1);
    setQuickLossReason(batch.stage === 'Queima' ? LOSS_REASONS[0] : batch.stage === 'Secagem' ? LOSS_REASONS[1] : LOSS_REASONS[4]);
  };

  const handleApplyQuickLoss = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickLossBatch) return;

    const currentLost = quickLossBatch.quantityLost || 0;
    const additionalLost = Math.max(1, quickLossAmount);
    const totalLost = Math.min(quickLossBatch.quantityPlanned, currentLost + additionalLost);
    const totalGood = Math.max(0, quickLossBatch.quantityPlanned - totalLost);

    const nowStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const logNote = `[${new Date().toLocaleDateString('pt-BR')} ${nowStr}] +${additionalLost} perda(s) na etapa ${quickLossBatch.stage} (${quickLossReason}).`;
    const updatedNotes = quickLossBatch.notes ? `${quickLossBatch.notes}\n${logNote}` : logNote;

    const updated: ProductionBatch = {
      ...quickLossBatch,
      quantityLost: totalLost,
      quantityGood: totalGood,
      notes: updatedNotes
    };

    StorageService.saveProduction(updated);
    refreshData();
    setQuickLossBatch(null);
  };

  const calculateQuickIncrement = (delta: number) => {
    setQuantityLost(prev => {
      const next = prev + delta;
      return Math.max(0, Math.min(quantityPlanned, next));
    });
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header & Voice Callout */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-amber-950 flex items-center gap-2">
            <Hammer className="w-6 h-6 text-amber-800" />
            <span>Controle de Produção & Queima de Cerâmica</span>
          </h2>
          <p className="text-xs text-amber-800/80">
            Acompanhe lotes nas etapas de Produção, Secagem, Queima no Forno, Acabamento e Entrada em Estoque.
          </p>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            onClick={onOpenVoiceModal}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-amber-600 hover:bg-amber-500 text-white font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all text-xs sm:text-sm cursor-pointer whitespace-nowrap"
          >
            <Mic className="w-4 h-4 animate-pulse" />
            <span>Registrar por Voz</span>
          </button>

          <button
            onClick={handleOpenNewBatch}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-amber-900 hover:bg-amber-800 text-amber-50 font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all text-xs sm:text-sm cursor-pointer whitespace-nowrap"
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
          const isKiln = stg === 'Queima';
          return (
            <div 
              key={stg} 
              className={`p-3 rounded-xl border text-center shadow-xs transition-all ${
                isKiln ? 'bg-amber-50/80 border-amber-300 ring-1 ring-amber-400/30' : 'bg-white border-amber-200'
              }`}
            >
              <div className="flex items-center justify-center gap-1">
                {isKiln && <Flame className="w-3.5 h-3.5 text-amber-600 animate-pulse" />}
                <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">{stg}</p>
              </div>
              <p className="text-xl font-black text-amber-950 mt-1">{count} Lote{count !== 1 ? 's' : ''}</p>
            </div>
          );
        })}
      </div>

      {/* Production Batches List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-amber-950 text-base flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-800" />
            <span>Lotes de Produção ({batches.length})</span>
          </h3>
          <span className="text-xs text-amber-800/80">
            Dica: Clique em <strong>Editar</strong> ou <strong>Quebra</strong> para ajustar vasos quebrados na queima ou secagem.
          </span>
        </div>

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
              onClick={handleOpenNewBatch}
              className="inline-flex items-center space-x-2 bg-amber-900 hover:bg-amber-800 text-amber-50 font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all text-xs sm:text-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Iniciar Primeiro Lote</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {batches.map((b) => {
              const hasLoss = (b.quantityLost || 0) > 0;
              const isKiln = b.stage === 'Queima';

              return (
                <div 
                  key={b.id} 
                  className={`bg-white border rounded-2xl p-4 shadow-xs space-y-3 transition-all ${
                    isKiln ? 'border-amber-400 bg-amber-50/20' : 'border-amber-200'
                  }`}
                >
                  {/* Top Bar: Code, Name, Stage & Action Buttons */}
                  <div className="flex items-start justify-between border-b border-amber-100 pb-2.5 gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-amber-800 font-mono">{b.code}</span>
                        <span className="text-xs text-stone-400">•</span>
                        <span className="text-xs text-stone-600 font-medium">{b.batchNumber || 'Lote sem nome'}</span>
                      </div>
                      <h4 className="font-black text-amber-950 text-base mt-0.5">{b.productName}</h4>
                    </div>

                    <div className="flex items-center space-x-1.5 shrink-0">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                        b.stage === 'Pronto' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : b.stage === 'Queima' 
                          ? 'bg-amber-500 text-white shadow-xs' 
                          : 'bg-amber-100 text-amber-900'
                      }`}>
                        {b.stage === 'Queima' && <Flame className="w-3 h-3 animate-pulse" />}
                        <span>{b.stage}</span>
                      </span>

                      {/* Edit Button */}
                      <button
                        onClick={() => handleOpenEditBatch(b)}
                        className="p-1.5 text-amber-900 bg-amber-100/70 hover:bg-amber-200 rounded-lg transition-colors cursor-pointer"
                        title="Editar lote (quantidade, perdas, observações)"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteBatch(b)}
                        className="p-1.5 text-stone-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Excluir Lote"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Quantity Stats with Breakage Focus */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs bg-amber-50/60 p-2.5 rounded-xl border border-amber-100">
                    <div>
                      <span className="text-stone-500 block text-[10px] uppercase font-bold">Produzidos</span>
                      <span className="font-black text-amber-950 text-sm">{b.quantityProduced || b.quantityPlanned} un</span>
                    </div>

                    <div className={`rounded-lg py-0.5 ${hasLoss ? 'bg-red-50 text-red-700' : ''}`}>
                      <span className="text-red-600 block text-[10px] uppercase font-bold flex items-center justify-center gap-0.5">
                        <Flame className="w-2.5 h-2.5" />
                        <span>Quebras/Perdas</span>
                      </span>
                      <span className="font-black text-red-700 text-sm">{b.quantityLost || 0} un</span>
                    </div>

                    <div className="bg-emerald-50 rounded-lg py-0.5 text-emerald-900">
                      <span className="text-emerald-700 block text-[10px] uppercase font-bold">Aproveitados</span>
                      <span className="font-black text-emerald-900 text-sm">{b.quantityGood} un</span>
                    </div>
                  </div>

                  {/* Quick Breakage Registration Action */}
                  <div className="flex items-center justify-between bg-stone-50 px-3 py-2 rounded-xl border border-stone-200/80 text-xs">
                    <span className="text-stone-600 font-medium flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Quebrou algum vaso na queima/manuseio?</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => handleOpenQuickLoss(b)}
                      className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-800 font-bold rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Registrar Quebra</span>
                    </button>
                  </div>

                  {b.stage === 'Pronto' && (
                    <div className="flex items-center space-x-1.5 text-xs text-emerald-800 font-semibold bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Estoque atualizado com +{b.quantityGood} peças aproveitadas.</span>
                    </div>
                  )}

                  {b.notes && (
                    <div className="text-xs text-amber-900/90 bg-amber-50/40 p-2 rounded-lg border border-amber-100 whitespace-pre-line font-mono text-[11px]">
                      {b.notes}
                    </div>
                  )}

                  {/* Stage Progress Selector */}
                  <div className="pt-2 border-t border-amber-100">
                    <label className="text-[11px] font-bold text-amber-800 block mb-1.5">Avançar Etapa:</label>
                    <div className="flex flex-wrap gap-1">
                      {STAGES.map((stg) => (
                        <button
                          key={stg}
                          onClick={() => handleUpdateStage(b, stg)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            b.stage === stg
                              ? 'bg-amber-900 text-white shadow-xs'
                              : 'bg-amber-100/80 text-amber-900 hover:bg-amber-200'
                          }`}
                        >
                          {stg}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Create / Edit Batch Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-amber-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-amber-100 pb-3">
              <div className="flex items-center gap-2">
                <Hammer className="w-5 h-5 text-amber-800" />
                <h3 className="font-bold text-amber-950 text-base sm:text-lg">
                  {editingBatch ? `Editar Lote: ${editingBatch.code}` : 'Registrar Novo Lote de Produção'}
                </h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-stone-400 hover:text-stone-700 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBatch} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-amber-900 mb-1">Produto da Olaria / Peça:</label>
                <select
                  required
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-2.5 text-amber-950 focus:outline-hidden focus:border-amber-600 font-medium"
                >
                  <option value="">Selecione o vaso / peça...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.category}) — Estoque atual: {p.stock} un</option>
                  ))}
                </select>
              </div>

              {/* Quantities & Breakages Controls */}
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-amber-900 mb-1">Total Produzido / Planejado:</label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={quantityPlanned}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setQuantityPlanned(parseInt(e.target.value) || 1)}
                      className="w-full bg-white border border-amber-300 rounded-xl p-2.5 text-amber-950 font-bold focus:outline-hidden focus:border-amber-600"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-red-700 mb-1 flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5" />
                      <span>Perdas / Quebras:</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={quantityPlanned}
                      value={quantityLost}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setQuantityLost(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full bg-white border border-red-300 rounded-xl p-2.5 text-red-700 font-black focus:outline-hidden focus:border-red-600"
                    />
                  </div>
                </div>

                {/* Quick Breakage Buttons */}
                <div>
                  <span className="text-[11px] font-bold text-amber-900 block mb-1">Ajuste Rápido de Quebras (Queima/Forno):</span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => calculateQuickIncrement(1)}
                      className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-800 font-bold rounded-lg text-xs cursor-pointer"
                    >
                      +1 Quebrado
                    </button>
                    <button
                      type="button"
                      onClick={() => calculateQuickIncrement(2)}
                      className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-800 font-bold rounded-lg text-xs cursor-pointer"
                    >
                      +2 Quebrados
                    </button>
                    <button
                      type="button"
                      onClick={() => calculateQuickIncrement(5)}
                      className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-800 font-bold rounded-lg text-xs cursor-pointer"
                    >
                      +5 Quebrados
                    </button>
                    {quantityLost > 0 && (
                      <button
                        type="button"
                        onClick={() => calculateQuickIncrement(-1)}
                        className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-lg text-xs cursor-pointer"
                      >
                        -1 Correção
                      </button>
                    )}
                    {quantityLost > 0 && (
                      <button
                        type="button"
                        onClick={() => setQuantityLost(0)}
                        className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-500 font-bold rounded-lg text-xs cursor-pointer"
                      >
                        Zerar
                      </button>
                    )}
                  </div>
                </div>

                {/* Summary Box */}
                <div className="bg-white p-3 rounded-xl border border-amber-200 flex items-center justify-between">
                  <span className="font-bold text-stone-700">Vasos Aproveitados (Boas):</span>
                  <span className="text-emerald-800 font-black text-base sm:text-lg">
                    {Math.max(0, quantityPlanned - quantityLost)} unidades
                  </span>
                </div>
              </div>

              {/* Stage Selection */}
              <div>
                <label className="block font-bold text-amber-900 mb-1">Etapa Atual do Lote:</label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value as ProductionStage)}
                  className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-2.5 text-amber-950 font-bold focus:outline-hidden focus:border-amber-600"
                >
                  {STAGES.map(s => (
                    <option key={s} value={s}>
                      {s === 'Queima' ? '🔥 Queima (No Forno)' : s === 'Pronto' ? '✅ Pronto (Disponível no Estoque)' : s}
                    </option>
                  ))}
                </select>
                {stage === 'Pronto' && (
                  <p className="text-[11px] text-emerald-800 font-semibold mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Ao salvar como "Pronto", o estoque do vaso será creditado com as peças boas.</span>
                  </p>
                )}
              </div>

              {/* Batch Identification */}
              <div>
                <label className="block font-bold text-amber-900 mb-1">Identificação / Nome do Lote:</label>
                <input
                  type="text"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  placeholder="Ex: Fornada 04 - Argila Vermelha"
                  className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-2.5 text-amber-950 focus:outline-hidden focus:border-amber-600"
                />
              </div>

              {/* Notes & Loss Details */}
              <div>
                <label className="block font-bold text-amber-900 mb-1">Observações (detalhes da queima, forno, motivos de quebra):</label>
                <textarea
                  rows={3}
                  placeholder="Ex: Queima a 950°C no forno 2. 2 vasos trincaram devido à temperatura rápida."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-2.5 text-amber-950 focus:outline-hidden focus:border-amber-600 text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2 border-t border-amber-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 border border-stone-300 rounded-xl text-stone-700 font-bold hover:bg-stone-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-900 hover:bg-amber-950 text-white rounded-xl font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Hammer className="w-4 h-4" />
                  <span>{editingBatch ? 'Salvar Alterações' : 'Criar Lote'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Loss Registration Modal */}
      {quickLossBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-red-200 space-y-4">
            <div className="flex items-center justify-between border-b border-red-100 pb-3">
              <div className="flex items-center gap-2 text-red-900">
                <Flame className="w-5 h-5 text-red-600 animate-pulse" />
                <h3 className="font-bold text-base">Registrar Quebra de Vaso</h3>
              </div>
              <button 
                onClick={() => setQuickLossBatch(null)} 
                className="text-stone-400 hover:text-stone-700 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-950 space-y-1">
              <p><strong>Lote:</strong> {quickLossBatch.code} • {quickLossBatch.productName}</p>
              <p><strong>Etapa Atual:</strong> {quickLossBatch.stage}</p>
              <p><strong>Total Produzido:</strong> {quickLossBatch.quantityPlanned} un | <strong>Quebras Anteriores:</strong> {quickLossBatch.quantityLost || 0} un</p>
            </div>

            <form onSubmit={handleApplyQuickLoss} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-stone-800 mb-1">Quantidade de vasos quebrados / perdidos agora:</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuickLossAmount(prev => Math.max(1, prev - 1))}
                    className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold"
                  >
                    <MinusCircle className="w-5 h-5" />
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={Math.max(1, quickLossBatch.quantityPlanned - (quickLossBatch.quantityLost || 0))}
                    value={quickLossAmount}
                    onChange={(e) => setQuickLossAmount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full text-center bg-red-50 border border-red-300 rounded-xl p-2 text-red-900 font-black text-lg focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setQuickLossAmount(prev => prev + 1)}
                    className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold"
                  >
                    <PlusCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">Motivo da Quebra / Ocorrência:</label>
                <select
                  value={quickLossReason}
                  onChange={(e) => setQuickLossReason(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-xl p-2.5 text-stone-900 font-medium focus:outline-hidden focus:border-amber-700"
                >
                  {LOSS_REASONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-red-900 text-xs">
                As perdas serão computadas no lote e o total de vasos aproveitados será recalculado automaticamente para {Math.max(0, quickLossBatch.quantityPlanned - (quickLossBatch.quantityLost || 0) - quickLossAmount)} unidades.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setQuickLossBatch(null)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-bold text-stone-700 hover:bg-stone-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-800 hover:bg-red-900 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Confirmar Quebra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
