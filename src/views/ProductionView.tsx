import React, { useState, useEffect } from 'react';
import { 
  Hammer, 
  Plus, 
  Mic, 
  Flame, 
  AlertTriangle, 
  CheckCircle2, 
  Edit3, 
  PlusCircle, 
  MinusCircle,
  Layers
} from 'lucide-react';
import { StorageService, subscribeStorage } from '../services/storage';
import { ProductionBatch, Product, ProductionStage } from '../types';
import {
  Button,
  Card,
  Modal,
  FormField,
  Input,
  Select,
  Textarea,
  ConfirmModal,
  StatusBadge,
  EmptyState,
  useToast
} from '../components/ui';

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
  const { showSuccess } = useToast();
  const [batches, setBatches] = useState<ProductionBatch[]>(() => StorageService.getProduction());
  const [products, setProducts] = useState<Product[]>(() => StorageService.getProducts());
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<ProductionBatch | null>(null);
  const [batchToDelete, setBatchToDelete] = useState<ProductionBatch | null>(null);

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
    showSuccess('Etapa Atualizada', `Lote ${batch.code} avançou para ${newStage}.`);
  };

  const confirmDeleteBatch = () => {
    if (!batchToDelete) return;
    StorageService.deleteProduction(batchToDelete.id);
    refreshData();
    showSuccess('Lote Removido', `O lote ${batchToDelete.code} foi excluído.`);
    setBatchToDelete(null);
  };

  const handleSaveBatch = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find(p => p.id === selectedProductId);
    if (!prod) return;

    const safePlanned = Math.max(1, Number(quantityPlanned) || 1);
    const safeLost = Math.max(0, Number(quantityLost) || 0);
    const safeGood = Math.max(0, safePlanned - safeLost);

    if (editingBatch) {
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
      showSuccess('Lote Atualizado', `Lote ${updatedBatch.code} salvo com sucesso!`);
    } else {
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
      showSuccess('Novo Lote Iniciado', `Lote ${newBatch.code} registrado em ${stage}.`);
    }

    refreshData();
    setIsModalOpen(false);
  };

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
    showSuccess('Quebra Registrada', `+${additionalLost} quebra(s) registrada(s) no lote ${quickLossBatch.code}.`);
    setQuickLossBatch(null);
  };

  const calculateQuickIncrement = (delta: number) => {
    setQuantityLost(prev => {
      const next = prev + delta;
      return Math.max(0, Math.min(quantityPlanned, next));
    });
  };

  return (
    <div className="space-y-6 pb-20 font-brand-sans">
      {/* Header & Voice Callout */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-[#292724] font-brand-serif flex items-center gap-2">
            <Hammer className="w-6 h-6 text-[#B85C38]" />
            <span>Controle de Produção & Queima de Cerâmica</span>
          </h2>
          <p className="text-xs text-[#5C5852]">
            Acompanhe lotes nas etapas de Produção, Secagem, Queima no Forno, Acabamento e Entrada em Estoque.
          </p>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Button
            onClick={onOpenVoiceModal}
            variant="secondary"
            size="md"
            icon={Mic}
            className="flex-1 sm:flex-none"
          >
            Registrar por Voz
          </Button>

          <Button
            onClick={handleOpenNewBatch}
            variant="primary"
            size="md"
            icon={Plus}
            className="flex-1 sm:flex-none"
          >
            Novo Lote
          </Button>
        </div>
      </div>

      {/* Production Stage Pipeline Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {STAGES.map((stg) => {
          const count = batches.filter(b => b.stage === stg).length;
          const isKiln = stg === 'Queima';
          return (
            <Card
              key={stg}
              variant="flat"
              className={`p-3 text-center ${isKiln ? 'bg-[#B85C38]/10 border-[#B85C38]/40' : ''}`}
            >
              <div className="flex items-center justify-center gap-1">
                {isKiln && <Flame className="w-3.5 h-3.5 text-[#B85C38] animate-pulse" />}
                <p className="text-[11px] font-bold text-[#8A5A44] uppercase tracking-wider">{stg}</p>
              </div>
              <p className="text-xl font-black text-[#292724] mt-1">{count} Lote{count !== 1 ? 's' : ''}</p>
            </Card>
          );
        })}
      </div>

      {/* Production Batches List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-[#292724] text-base flex items-center gap-2 font-brand-serif">
            <Layers className="w-4 h-4 text-[#8A5A44]" />
            <span>Lotes de Produção ({batches.length})</span>
          </h3>
          <span className="text-xs text-[#5C5852]">
            Dica: Clique em <strong>Editar</strong> ou <strong>Quebra</strong> para registrar trincas de forno.
          </span>
        </div>

        {batches.length === 0 ? (
          <EmptyState
            title="Nenhum lote de produção registrado"
            description="Inicie um lote para acompanhar a moldagem, secagem, queima e acabamento das peças."
            actionLabel="Iniciar Primeiro Lote"
            onAction={handleOpenNewBatch}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {batches.map((b) => {
              const hasLoss = (b.quantityLost || 0) > 0;
              const isKiln = b.stage === 'Queima';

              return (
                <Card
                  key={b.id}
                  variant="default"
                  className={`p-4 space-y-3 ${isKiln ? 'border-[#B85C38]/50 bg-[#FAF6EF]' : ''}`}
                >
                  {/* Top Bar */}
                  <div className="flex items-start justify-between border-b border-[#E7D5BE] pb-2.5 gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-[#8A5A44] font-mono">{b.code}</span>
                        <span className="text-xs text-[#5C5852]">•</span>
                        <span className="text-xs text-[#5C5852] font-medium">{b.batchNumber || 'Lote sem nome'}</span>
                      </div>
                      <h4 className="font-black text-[#292724] text-base mt-0.5">{b.productName}</h4>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0">
                      <StatusBadge status={b.stage} />

                      <Button
                        onClick={() => handleOpenEditBatch(b)}
                        variant="ghost"
                        size="sm"
                        icon={Edit3}
                        ariaLabel={`Editar lote ${b.code}`}
                      />

                      <Button
                        onClick={() => setBatchToDelete(b)}
                        variant="ghost"
                        size="sm"
                        className="text-rose-700"
                        ariaLabel={`Excluir lote ${b.code}`}
                      />
                    </div>
                  </div>

                  {/* Quantity Stats */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs bg-[#FAF6EF] p-2.5 rounded-2xl border border-[#E7D5BE]">
                    <div>
                      <span className="text-[#5C5852] block text-[10px] uppercase font-bold">Produzidos</span>
                      <span className="font-black text-[#292724] text-sm">{b.quantityProduced || b.quantityPlanned} un</span>
                    </div>

                    <div className={`rounded-xl py-0.5 ${hasLoss ? 'bg-rose-500/10 text-rose-700' : ''}`}>
                      <span className="text-rose-700 block text-[10px] uppercase font-bold flex items-center justify-center gap-0.5">
                        <Flame className="w-2.5 h-2.5" />
                        <span>Quebras</span>
                      </span>
                      <span className="font-black text-rose-700 text-sm">{b.quantityLost || 0} un</span>
                    </div>

                    <div className="bg-[#667052]/10 rounded-xl py-0.5 text-[#4F583D]">
                      <span className="text-[#4F583D] block text-[10px] uppercase font-bold">Aproveitados</span>
                      <span className="font-black text-[#4F583D] text-sm">{b.quantityGood} un</span>
                    </div>
                  </div>

                  {/* Quick Breakage Registration Action */}
                  <div className="flex items-center justify-between bg-[#FAF6EF] px-3 py-2 rounded-xl border border-[#E7D5BE] text-xs">
                    <span className="text-[#5C5852] font-medium flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-[#B85C38]" />
                      <span>Quebrou peça no forno ou secagem?</span>
                    </span>

                    <Button
                      type="button"
                      onClick={() => handleOpenQuickLoss(b)}
                      variant="danger"
                      size="sm"
                      icon={PlusCircle}
                    >
                      Quebra
                    </Button>
                  </div>

                  {b.stage === 'Pronto' && (
                    <div className="flex items-center space-x-1.5 text-xs text-[#4F583D] font-semibold bg-[#667052]/10 px-2.5 py-1.5 rounded-xl border border-[#667052]/30">
                      <CheckCircle2 className="w-4 h-4 text-[#4F583D] shrink-0" />
                      <span>Estoque atualizado com +{b.quantityGood} peças aproveitadas.</span>
                    </div>
                  )}

                  {b.notes && (
                    <div className="text-xs text-[#292724] bg-[#FAF6EF] p-2 rounded-xl border border-[#E7D5BE] whitespace-pre-line font-mono text-[11px]">
                      {b.notes}
                    </div>
                  )}

                  {/* Stage Progress Selector */}
                  <div className="pt-2 border-t border-[#E7D5BE]">
                    <label className="text-[11px] font-bold text-[#8A5A44] block mb-1.5">Avançar Etapa:</label>
                    <div className="flex flex-wrap gap-1">
                      {STAGES.map((stg) => (
                        <button
                          key={stg}
                          type="button"
                          onClick={() => handleUpdateStage(b, stg)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            b.stage === stg
                              ? 'bg-[#B85C38] text-white shadow-xs'
                              : 'bg-[#E7D5BE]/50 text-[#292724] hover:bg-[#E7D5BE]'
                          }`}
                        >
                          {stg}
                        </button>
                      ))}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Create / Edit Batch Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingBatch ? `Editar Lote: ${editingBatch.code}` : 'Registrar Novo Lote de Produção'}
          description="Controle a quantidade moldada, trincas de secagem e quebras de forno."
          size="md"
        >
          <form onSubmit={handleSaveBatch} className="space-y-4 font-brand-sans">
            <FormField label="Produto / Peça" htmlFor="batch-product-select" required>
              <Select
                id="batch-product-select"
                required
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
              >
                <option value="">Selecione a peça...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.category}) — Estoque: {p.stock} un</option>
                ))}
              </Select>
            </FormField>

            <div className="p-4 bg-[#FAF6EF] border border-[#E7D5BE] rounded-2xl space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Total Produzido" htmlFor="batch-planned-input" required>
                  <Input
                    id="batch-planned-input"
                    type="number"
                    min={1}
                    required
                    value={quantityPlanned}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setQuantityPlanned(parseInt(e.target.value) || 1)}
                    className="font-bold"
                  />
                </FormField>

                <FormField label="Perdas / Quebras" htmlFor="batch-lost-input">
                  <Input
                    id="batch-lost-input"
                    type="number"
                    min={0}
                    max={quantityPlanned}
                    value={quantityLost}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setQuantityLost(Math.max(0, parseInt(e.target.value) || 0))}
                    className="font-bold text-rose-700"
                  />
                </FormField>
              </div>

              <div>
                <span className="text-[11px] font-bold text-[#8A5A44] block mb-1">Ajuste Rápido de Quebras (Queima/Forno):</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => calculateQuickIncrement(1)}
                    className="px-2.5 py-1 bg-rose-500/15 text-rose-800 font-bold rounded-lg text-xs cursor-pointer hover:bg-rose-500/25"
                  >
                    +1 Quebrado
                  </button>
                  <button
                    type="button"
                    onClick={() => calculateQuickIncrement(2)}
                    className="px-2.5 py-1 bg-rose-500/15 text-rose-800 font-bold rounded-lg text-xs cursor-pointer hover:bg-rose-500/25"
                  >
                    +2 Quebrados
                  </button>
                  <button
                    type="button"
                    onClick={() => calculateQuickIncrement(5)}
                    className="px-2.5 py-1 bg-rose-500/15 text-rose-800 font-bold rounded-lg text-xs cursor-pointer hover:bg-rose-500/25"
                  >
                    +5 Quebrados
                  </button>
                  {quantityLost > 0 && (
                    <button
                      type="button"
                      onClick={() => setQuantityLost(0)}
                      className="px-2 py-1 bg-[#E7D5BE]/60 text-[#292724] font-bold rounded-lg text-xs cursor-pointer"
                    >
                      Zerar
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-[#E7D5BE] flex items-center justify-between">
                <span className="font-bold text-[#292724]">Peças Aproveitadas (Boas):</span>
                <span className="text-[#4F583D] font-black text-base sm:text-lg">
                  {Math.max(0, quantityPlanned - quantityLost)} unidades
                </span>
              </div>
            </div>

            <FormField label="Etapa Atual do Lote" htmlFor="batch-stage-select" required>
              <Select
                id="batch-stage-select"
                value={stage}
                onChange={(e) => setStage(e.target.value as ProductionStage)}
              >
                {STAGES.map(s => (
                  <option key={s} value={s}>
                    {s === 'Queima' ? '🔥 Queima (No Forno)' : s === 'Pronto' ? '✅ Pronto (Disponível no Estoque)' : s}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Identificação / Nome do Lote" htmlFor="batch-identifier-input">
              <Input
                id="batch-identifier-input"
                type="text"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                placeholder="Ex: Fornada 04 - Argila Vermelha"
              />
            </FormField>

            <FormField label="Observações (detalhes da queima, forno, motivos de quebra)" htmlFor="batch-notes-textarea">
              <Textarea
                id="batch-notes-textarea"
                placeholder="Ex: Queima a 950°C no forno 2. 2 vasos trincaram."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </FormField>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#E7D5BE]">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" size="md" icon={Hammer}>
                {editingBatch ? 'Salvar Alterações' : 'Criar Lote'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Quick Loss Registration Modal */}
      {quickLossBatch && (
        <Modal
          isOpen={!!quickLossBatch}
          onClose={() => setQuickLossBatch(null)}
          title="Registrar Quebra de Vaso"
          description={`Lote ${quickLossBatch.code} • ${quickLossBatch.productName}`}
          size="sm"
        >
          <form onSubmit={handleApplyQuickLoss} className="space-y-4 font-brand-sans">
            <FormField label="Vasos quebrados / perdidos agora" htmlFor="quick-loss-amount-input" required>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  onClick={() => setQuickLossAmount(prev => Math.max(1, prev - 1))}
                  variant="outline"
                  size="sm"
                  icon={MinusCircle}
                >
                  Diminuir
                </Button>
                <Input
                  id="quick-loss-amount-input"
                  type="number"
                  min={1}
                  max={Math.max(1, quickLossBatch.quantityPlanned - (quickLossBatch.quantityLost || 0))}
                  value={quickLossAmount}
                  onChange={(e) => setQuickLossAmount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="text-center font-black text-lg text-rose-700"
                />
                <Button
                  type="button"
                  onClick={() => setQuickLossAmount(prev => prev + 1)}
                  variant="outline"
                  size="sm"
                  icon={PlusCircle}
                >
                  Aumentar
                </Button>
              </div>
            </FormField>

            <FormField label="Motivo da Quebra / Ocorrência" htmlFor="quick-loss-reason-select" required>
              <Select
                id="quick-loss-reason-select"
                value={quickLossReason}
                onChange={(e) => setQuickLossReason(e.target.value)}
              >
                {LOSS_REASONS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </Select>
            </FormField>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#E7D5BE]">
              <Button type="button" variant="ghost" size="sm" onClick={() => setQuickLossBatch(null)}>
                Cancelar
              </Button>
              <Button type="submit" variant="danger" size="md">
                Confirmar Quebra
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!batchToDelete}
        onClose={() => setBatchToDelete(null)}
        onConfirm={confirmDeleteBatch}
        title="Excluir Lote de Produção"
        message={`Deseja excluir o lote ${batchToDelete?.code} (${batchToDelete?.productName})? Se este lote já tiver enviado peças para o estoque, elas serão estornadas.`}
        confirmLabel="Excluir Lote"
        variant="danger"
      />
    </div>
  );
};
