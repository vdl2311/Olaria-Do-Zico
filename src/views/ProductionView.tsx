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
  Layers,
  Trash2
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
  onOpenVoiceModal?: () => void;
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

  const handleOpenQuickLoss = (batch: ProductionBatch) => {
    setQuickLossBatch(batch);
    setQuickLossAmount(1);
    setQuickLossReason(LOSS_REASONS[0]);
  };

  const handleSubmitBatch = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find(p => p.id === selectedProductId);
    if (!prod) return;

    const planned = Number(quantityPlanned) || 1;
    const lost = Number(quantityLost) || 0;
    const good = Math.max(0, planned - lost);

    const batchData: ProductionBatch = {
      id: editingBatch ? editingBatch.id : `batch-${Date.now()}`,
      code: editingBatch ? editingBatch.code : `LOT-${Math.floor(1000 + Math.random() * 9000)}`,
      batchNumber: batchNumber || `Lote ${new Date().toISOString().split('T')[0]}`,
      productId: prod.id,
      productName: prod.name,
      quantityPlanned: planned,
      quantityLost: lost,
      quantityGood: good,
      quantityProduced: planned,
      stage,
      startDate: editingBatch ? editingBatch.startDate : new Date().toISOString().split('T')[0],
      completedDate: stage === 'Pronto' ? new Date().toISOString().split('T')[0] : editingBatch?.completedDate,
      notes
    };

    StorageService.saveProduction(batchData);
    refreshData();
    setIsModalOpen(false);
    showSuccess(
      editingBatch ? 'Lote Atualizado' : 'Lote Criado',
      `Lote ${batchData.code} (${batchData.productName}) salvo com sucesso.`
    );
  };

  const confirmDeleteBatch = () => {
    if (!batchToDelete) return;
    StorageService.deleteProduction(batchToDelete.id);
    refreshData();
    showSuccess('Lote Excluído', `Lote ${batchToDelete.code} foi removido com sucesso.`);
    setBatchToDelete(null);
  };

  const handleConfirmQuickLoss = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickLossBatch) return;

    const currentLost = quickLossBatch.quantityLost || 0;
    const planned = quickLossBatch.quantityPlanned || quickLossBatch.quantityProduced || 1;
    const additionalLost = Number(quickLossAmount) || 0;
    const totalLost = Math.min(planned, currentLost + additionalLost);
    const totalGood = Math.max(0, planned - totalLost);

    const logNote = `[Quebra ${new Date().toLocaleDateString('pt-BR')}]: +${additionalLost} un (${quickLossReason})`;
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

  return (
    <div className="space-y-6 pb-20 font-brand-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#292724] dark:text-[#F7F1E7] font-brand-serif flex items-center gap-3">
            <Hammer className="w-7 h-7 text-[#B85C38]" />
            <span>Controle de Produção & Queima de Cerâmica</span>
          </h2>
          <p className="text-sm sm:text-base text-[#5C5852] dark:text-[#C9BFA8] mt-1">
            Acompanhe lotes nas etapas de Produção, Secagem, Queima no Forno, Acabamento e Entrada em Estoque.
          </p>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Button
            onClick={handleOpenNewBatch}
            variant="primary"
            size="md"
            icon={Plus}
            className="w-full sm:w-auto"
          >
            Novo Lote
          </Button>
        </div>
      </div>

      {/* Production Stage Pipeline Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {STAGES.map((stg) => {
          const count = batches.filter(b => b.stage === stg).length;
          const isKiln = stg === 'Queima';
          return (
            <Card
              key={stg}
              variant="flat"
              className={`p-4 text-center ${isKiln ? 'bg-[#B85C38]/10 border-[#B85C38]/40 dark:bg-[#B85C38]/20' : ''}`}
            >
              <div className="flex items-center justify-center gap-1.5">
                {isKiln && <Flame className="w-4 h-4 text-[#B85C38] animate-pulse" />}
                <p className="text-xs sm:text-sm font-bold text-[#8A5A44] dark:text-[#C9BFA8] uppercase tracking-wider">{stg}</p>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-[#292724] dark:text-[#F7F1E7] mt-1">{count} Lote{count !== 1 ? 's' : ''}</p>
            </Card>
          );
        })}
      </div>

      {/* Production Batches List */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E7D5BE] dark:border-stone-800 pb-3">
          <h3 className="font-bold text-[#292724] dark:text-[#F7F1E7] text-lg sm:text-xl flex items-center gap-2 font-brand-serif">
            <Layers className="w-5 h-5 text-[#8A5A44]" />
            <span>Lotes de Produção ({batches.length})</span>
          </h3>
          <span className="text-xs sm:text-sm text-[#5C5852] dark:text-[#C9BFA8]">
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
                  className={`p-5 space-y-4 ${isKiln ? 'border-[#B85C38]/50 bg-[#FAF6EF] dark:bg-[#25221E]' : ''}`}
                >
                  {/* Top Bar */}
                  <div className="flex items-start justify-between border-b border-[#E7D5BE] dark:border-stone-800 pb-3 gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-[#8A5A44] dark:text-[#D67855] font-mono">{b.code}</span>
                        <span className="text-xs text-[#5C5852] dark:text-[#C9BFA8]">•</span>
                        <span className="text-xs sm:text-sm text-[#5C5852] dark:text-[#C9BFA8] font-medium">{b.batchNumber || 'Lote sem nome'}</span>
                      </div>
                      <h4 className="font-black text-[#292724] dark:text-[#F7F1E7] text-lg sm:text-xl mt-1">{b.productName}</h4>
                    </div>

                    <StatusBadge status={b.stage} />
                  </div>

                  {/* Metrics Row */}
                  <div className="grid grid-cols-3 gap-2 py-3 px-4 bg-[#FAF6EF] dark:bg-[#1A1816] rounded-xl border border-[#E7D5BE] dark:border-stone-800 text-center">
                    <div>
                      <span className="text-xs text-[#8A5A44] dark:text-[#C9BFA8] block uppercase font-bold">Planejado</span>
                      <span className="text-lg sm:text-xl font-bold text-[#292724] dark:text-[#F7F1E7]">
                        {b.quantityPlanned || b.quantityProduced} un
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-[#4F583D] dark:text-[#A4B38A] block uppercase font-bold">Aproveitado</span>
                      <span className="text-lg sm:text-xl font-black text-[#4F583D] dark:text-[#A4B38A]">
                        {b.quantityGood !== undefined ? b.quantityGood : (b.quantityProduced || 0) - (b.quantityLost || 0)} un
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-rose-700 dark:text-rose-400 block uppercase font-bold">Perda / Trinca</span>
                      <span className={`text-lg sm:text-xl font-black ${hasLoss ? 'text-rose-700 dark:text-rose-400' : 'text-[#8A5A44] dark:text-[#C9BFA8]'}`}>
                        {b.quantityLost || 0} un
                      </span>
                    </div>
                  </div>

                  {/* Notes & Breakage Info */}
                  {b.notes && (
                    <div className="text-xs sm:text-sm text-[#5C5852] dark:text-[#C9BFA8] bg-[#FAF6EF] dark:bg-[#1A1816] p-3 rounded-xl border border-[#E7D5BE] dark:border-stone-800 whitespace-pre-line">
                      <strong className="text-[#8A5A44] dark:text-[#D67855]">Histórico do Lote:</strong> {b.notes}
                    </div>
                  )}

                  {/* Bottom Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#E7D5BE] dark:border-stone-800 gap-2">
                    <span className="text-xs sm:text-sm text-[#8A5A44] dark:text-[#C9BFA8]">
                      Início: {b.startDate} {b.completedDate ? `• Fim: ${b.completedDate}` : ''}
                    </span>

                    <div className="flex items-center gap-2">
                      {b.stage !== 'Pronto' && (
                        <Button
                          onClick={() => handleOpenQuickLoss(b)}
                          variant="danger"
                          size="sm"
                          icon={AlertTriangle}
                        >
                          Quebra
                        </Button>
                      )}
                      <Button
                        onClick={() => handleOpenEditBatch(b)}
                        variant="primary"
                        size="sm"
                        icon={Edit3}
                      >
                        Editar
                      </Button>
                      <Button
                        onClick={() => setBatchToDelete(b)}
                        variant="ghost"
                        size="sm"
                        icon={Trash2}
                        ariaLabel={`Excluir lote ${b.code}`}
                        className="text-rose-700 hover:bg-rose-100"
                      />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Batch Form Modal (New & Edit) */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingBatch ? `Editar Lote ${editingBatch.code}` : 'Criar Novo Lote de Produção'}
          description="Acompanhe o lote desde a argila crua até a queima nos fornos."
          size="lg"
        >
          <form onSubmit={handleSubmitBatch} className="space-y-4 font-brand-sans">
            <FormField label="Peça Cerâmica / Produto" htmlFor="batch-prod-select" required>
              <Select
                id="batch-prod-select"
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                required
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.category})</option>
                ))}
              </Select>
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Identificação / Nome do Lote" htmlFor="batch-number" required>
                <Input
                  id="batch-number"
                  type="text"
                  required
                  placeholder="Ex: Queima Semanal Forno 2..."
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                />
              </FormField>

              <FormField label="Etapa Atual" htmlFor="batch-stage" required>
                <Select
                  id="batch-stage"
                  value={stage}
                  onChange={(e) => setStage(e.target.value as ProductionStage)}
                >
                  {STAGES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Select>
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Quantidade Planejada (Total)" htmlFor="batch-qty-planned" required>
                <Input
                  id="batch-qty-planned"
                  type="number"
                  min="1"
                  required
                  value={quantityPlanned}
                  onChange={(e) => setQuantityPlanned(parseInt(e.target.value, 10) || 1)}
                />
              </FormField>

              <FormField label="Quantidade de Perdas / Quebras" htmlFor="batch-qty-lost">
                <Input
                  id="batch-qty-lost"
                  type="number"
                  min="0"
                  max={quantityPlanned}
                  value={quantityLost}
                  onChange={(e) => setQuantityLost(parseInt(e.target.value, 10) || 0)}
                />
              </FormField>
            </div>

            <FormField label="Anotações da Produção & Fornadas" htmlFor="batch-notes">
              <Textarea
                id="batch-notes"
                rows={3}
                placeholder="Ex: Forno atingiu 1050°C às 18h. Queima durou 12h..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </FormField>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#E7D5BE] dark:border-stone-800">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
              >
                {editingBatch ? 'Salvar Alterações' : 'Iniciar Lote'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Quick Loss Modal */}
      {quickLossBatch && (
        <Modal
          isOpen={!!quickLossBatch}
          onClose={() => setQuickLossBatch(null)}
          title={`Registrar Quebra/Trinca • ${quickLossBatch.code}`}
          size="md"
        >
          <form onSubmit={handleConfirmQuickLoss} className="space-y-4 font-brand-sans">
            <p className="text-sm text-[#5C5852] dark:text-[#C9BFA8]">
              Registre peças que trincaram ou estouraram no forno para ajustar os cálculos de rendimento do lote de <strong>{quickLossBatch.productName}</strong>.
            </p>

            <FormField label="Quantidade de Peças Quebradas" htmlFor="quick-loss-qty" required>
              <Input
                id="quick-loss-qty"
                type="number"
                min="1"
                required
                value={quickLossAmount}
                onChange={(e) => setQuickLossAmount(parseInt(e.target.value, 10) || 1)}
              />
            </FormField>

            <FormField label="Motivo da Perda" htmlFor="quick-loss-reason" required>
              <Select
                id="quick-loss-reason"
                value={quickLossReason}
                onChange={(e) => setQuickLossReason(e.target.value)}
              >
                {LOSS_REASONS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </Select>
            </FormField>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#E7D5BE] dark:border-stone-800">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setQuickLossBatch(null)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="danger"
              >
                Confirmar Quebra
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Batch Confirmation */}
      {batchToDelete && (
        <ConfirmModal
          isOpen={!!batchToDelete}
          onClose={() => setBatchToDelete(null)}
          onConfirm={confirmDeleteBatch}
          title="Excluir Lote de Produção"
          message={`Tem certeza que deseja excluir o lote ${batchToDelete.code} (${batchToDelete.productName})?`}
          confirmLabel="Excluir Lote"
          variant="danger"
        />
      )}
    </div>
  );
};
