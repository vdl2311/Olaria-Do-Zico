import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Mic, 
  Layers, 
  RotateCcw, 
  Edit3, 
  Trash2, 
  Search,
  CheckCircle2
} from 'lucide-react';
import { StorageService, subscribeStorage } from '../services/storage';
import { Product, RawMaterial, RawMaterialCategory, AuditLog } from '../types';
import {
  Button,
  Card,
  Modal,
  FormField,
  Input,
  Select,
  ConfirmModal,
  StatusBadge,
  EmptyState,
  Tabs,
  useToast
} from '../components/ui';

interface StockViewProps {
  onOpenVoiceModal?: () => void;
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

export const StockView: React.FC<StockViewProps> = () => {
  const { showSuccess } = useToast();
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
  const [rawToDelete, setRawToDelete] = useState<RawMaterial | null>(null);
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

  const handleAdjustStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId) return;

    if (activeTab === 'finished' || (!rawMaterials.find(m => m.id === selectedItemId) && products.find(p => p.id === selectedItemId))) {
      const prod = products.find(p => p.id === selectedItemId);
      if (prod) {
        const change = adjustmentType === 'add' ? adjustmentQty : -adjustmentQty;
        const newStock = Math.max(0, prod.stock + change);
        const updatedProd: Product = { ...prod, stock: newStock };
        StorageService.saveProduct(updatedProd);
        showSuccess('Estoque Ajustado', `Saldo de "${prod.name}" alterado para ${newStock} un.`);
      }
    } else {
      const mat = rawMaterials.find(m => m.id === selectedItemId);
      if (mat) {
        const change = adjustmentType === 'add' ? adjustmentQty : -adjustmentQty;
        const newQty = Math.max(0, mat.stockQuantity + change);
        const updatedMat: RawMaterial = { ...mat, stockQuantity: newQty };
        StorageService.saveRawMaterial(updatedMat);
        showSuccess('Insumo Ajustado', `Saldo de "${mat.name}" alterado para ${newQty} ${mat.unit}.`);
      }
    }

    refreshData();
    setIsAdjustmentModalOpen(false);
    setReason('');
  };

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

  const handleOpenEditRaw = (raw: RawMaterial) => {
    setEditingRawMaterial(raw);
    setRawName(raw.name);
    setRawCategory(raw.category);
    setRawStockQuantity(raw.stockQuantity);
    setRawUnit(raw.unit);
    setRawMinStock(raw.minStock);
    setRawCostPerUnit(raw.costPerUnit || 0);
    setRawSupplier(raw.supplier || '');
    setRawLastPurchaseDate(raw.lastPurchaseDate || new Date().toISOString().split('T')[0]);
    setIsRawModalOpen(true);
  };

  const handleSubmitRawMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawName.trim()) return;

    const rawData: RawMaterial = {
      id: editingRawMaterial ? editingRawMaterial.id : `raw-${Date.now()}`,
      name: rawName.trim(),
      category: rawCategory,
      stockQuantity: Number(rawStockQuantity),
      unit: rawUnit,
      minStock: Number(rawMinStock),
      costPerUnit: Number(rawCostPerUnit),
      supplier: rawSupplier.trim(),
      lastPurchaseDate: rawLastPurchaseDate
    };

    StorageService.saveRawMaterial(rawData);
    refreshData();
    setIsRawModalOpen(false);
    showSuccess(
      editingRawMaterial ? 'Insumo Atualizado' : 'Insumo Cadastrado',
      `"${rawData.name}" salvo com sucesso.`
    );
  };

  const confirmDeleteRaw = () => {
    if (!rawToDelete) return;
    StorageService.deleteRawMaterial(rawToDelete.id);
    refreshData();
    showSuccess('Insumo Removido', `"${rawToDelete.name}" foi excluído com sucesso.`);
    setRawToDelete(null);
  };

  const filteredRawMaterials = rawMaterials.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(rawSearchTerm.toLowerCase()) ||
      (m.supplier && m.supplier.toLowerCase().includes(rawSearchTerm.toLowerCase()));
    const matchesCategory = rawCategoryFilter === 'all' || m.category === rawCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  const lowRawStockCount = rawMaterials.filter(m => m.stockQuantity <= m.minStock).length;
  const totalRawInvested = rawMaterials.reduce((acc, m) => acc + (m.stockQuantity * m.costPerUnit), 0);

  return (
    <div className="space-y-6 pb-20 font-brand-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#292724] dark:text-[#F7F1E7] font-brand-serif flex items-center gap-3">
            <Package className="w-7 h-7 text-[#B85C38]" />
            <span>Estoque de Peças & Insumos</span>
          </h2>
          <p className="text-sm sm:text-base text-[#5C5852] dark:text-[#C9BFA8] mt-1">
            Controle de argilas, esmaltes, pigmentos, embalagens e peças prontas para venda.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {activeTab === 'raw' ? (
            <Button
              onClick={handleOpenCreateRaw}
              variant="primary"
              size="md"
              icon={Plus}
              className="flex-1 sm:flex-none"
            >
              Nova Matéria-Prima
            </Button>
          ) : (
            <Button
              onClick={() => {
                setSelectedItemId(products[0]?.id || '');
                setIsAdjustmentModalOpen(true);
              }}
              variant="primary"
              size="md"
              icon={Plus}
              className="w-full sm:w-auto"
            >
              Ajuste Manual
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'raw', label: `🧱 Matérias-Primas (${rawMaterials.length})` },
          { id: 'finished', label: `🏺 Produtos Acabados (${products.length})` },
          { id: 'history', label: `📋 Histórico & Auditoria (${auditLogs.length})` },
        ]}
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as any)}
      />

      {/* Raw Materials Tab */}
      {activeTab === 'raw' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card variant="flat" className="p-5 space-y-1.5">
              <span className="text-xs sm:text-sm font-bold text-[#8A5A44] dark:text-[#C9BFA8] uppercase block tracking-wider">Total de Insumos</span>
              <p className="text-2xl sm:text-3xl font-black text-[#292724] dark:text-[#F7F1E7]">{rawMaterials.length} tipos cadastrados</p>
            </Card>

            <Card
              variant="flat"
              className={`p-5 space-y-1.5 ${lowRawStockCount > 0 ? 'bg-rose-500/10 border-rose-500/30' : ''}`}
            >
              <span className={`text-xs sm:text-sm font-bold uppercase block tracking-wider ${lowRawStockCount > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-[#8A5A44] dark:text-[#C9BFA8]'}`}>
                Estoque Mínimo / Alerta
              </span>
              <p className={`text-2xl sm:text-3xl font-black ${lowRawStockCount > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-[#4F583D] dark:text-[#A4B38A]'}`}>
                {lowRawStockCount > 0 ? `⚠️ ${lowRawStockCount} insumo(s) em falta` : '✓ Todos abastecidos'}
              </p>
            </Card>

            <Card variant="flat" className="p-5 space-y-1.5">
              <span className="text-xs sm:text-sm font-bold text-[#8A5A44] dark:text-[#C9BFA8] uppercase block tracking-wider">Valor em Insumos</span>
              <p className="text-2xl sm:text-3xl font-black text-[#292724] dark:text-[#F7F1E7] font-mono">R$ {totalRawInvested.toFixed(2)}</p>
            </Card>
          </div>

          <Card variant="flat" className="p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-[#8A5A44] dark:text-[#C9BFA8] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <Input
                id="search-raw-material-input"
                type="text"
                placeholder="Buscar matéria-prima por nome, categoria ou fornecedor..."
                value={rawSearchTerm}
                onChange={(e) => setRawSearchTerm(e.target.value)}
                className="pl-10"
                aria-label="Buscar matéria-prima"
              />
            </div>

            <div className="flex items-center gap-3">
              <Select
                id="filter-raw-category-select"
                value={rawCategoryFilter}
                onChange={(e) => setRawCategoryFilter(e.target.value)}
                className="w-full sm:w-auto"
                aria-label="Filtrar por categoria"
              >
                <option value="all">Todas as Categorias</option>
                {RAW_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </Select>

              <Button
                onClick={handleOpenCreateRaw}
                variant="primary"
                size="sm"
                icon={Plus}
                className="shrink-0"
              >
                Cadastrar Insumo
              </Button>
            </div>
          </Card>

          <Card variant="default" className="p-0 overflow-hidden">
            {filteredRawMaterials.length === 0 ? (
              <EmptyState
                title="Nenhuma matéria-prima encontrada"
                description={
                  rawMaterials.length === 0
                    ? 'Cadastre argilas, esmaltes, pigmentos ou embalagens para monitorar seu estoque e custos.'
                    : 'Nenhum resultado corresponde aos filtros aplicados.'
                }
                actionLabel="Cadastrar Matéria-Prima"
                onAction={handleOpenCreateRaw}
              />
            ) : (
              <>
                {/* Mobile View */}
                <div className="block md:hidden divide-y divide-[#E7D5BE] dark:divide-stone-800">
                  {filteredRawMaterials.map((m) => {
                    const isLow = m.stockQuantity <= m.minStock;
                    return (
                      <div key={m.id} className="p-4.5 space-y-3.5 hover:bg-[#F7F1E7]/50 dark:hover:bg-stone-800/50">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-1 rounded-lg bg-[#E7D5BE]/60 dark:bg-stone-700 text-[#292724] dark:text-[#F7F1E7] text-xs font-bold">
                                {m.category}
                              </span>
                              <StatusBadge status={isLow ? 'Estoque Baixo' : 'Normal'} />
                            </div>
                            <p className="font-bold text-[#292724] dark:text-[#F7F1E7] text-base sm:text-lg mt-1.5">{m.name}</p>
                            {m.supplier && (
                              <p className="text-xs sm:text-sm text-[#8A5A44] dark:text-[#C9BFA8]">Fornecedor: {m.supplier}</p>
                            )}
                          </div>

                          <div className="text-right">
                            <span className="text-xs text-[#8A5A44] dark:text-[#C9BFA8] block uppercase font-bold">Saldo Atual</span>
                            <span className={`text-xl font-black ${isLow ? 'text-rose-700 dark:text-rose-400' : 'text-[#4F583D] dark:text-[#A4B38A]'}`}>
                              {m.stockQuantity} {m.unit}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 py-2.5 px-3.5 bg-[#FAF6EF] dark:bg-[#1A1816] rounded-xl border border-[#E7D5BE] dark:border-stone-800 text-sm">
                          <div>
                            <span className="text-xs text-[#8A5A44] dark:text-[#C9BFA8] block uppercase">Custo Unitário</span>
                            <span className="font-bold text-[#292724] dark:text-[#F7F1E7] font-mono">R$ {m.costPerUnit.toFixed(2)} / {m.unit}</span>
                          </div>
                          <div>
                            <span className="text-xs text-[#8A5A44] dark:text-[#C9BFA8] block uppercase">Estoque Mínimo</span>
                            <span className="font-bold text-[#8A5A44] dark:text-[#C9BFA8]">{m.minStock} {m.unit}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1">
                          <Button
                            onClick={() => {
                              setSelectedItemId(m.id);
                              setIsAdjustmentModalOpen(true);
                            }}
                            variant="secondary"
                            size="sm"
                          >
                            Ajustar Saldo
                          </Button>
                          <Button
                            onClick={() => handleOpenEditRaw(m)}
                            variant="primary"
                            size="sm"
                            icon={Edit3}
                          >
                            Editar
                          </Button>
                          <Button
                            onClick={() => setRawToDelete(m)}
                            variant="ghost"
                            size="sm"
                            className="text-rose-700"
                            ariaLabel={`Excluir ${m.name}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop View Table with Legible Typography */}
                <div className="hidden md:block overflow-x-auto rounded-xl">
                  <table className="w-full min-w-[760px] text-left text-sm sm:text-base font-brand-sans">
                    <thead className="bg-[#E7D5BE]/60 dark:bg-[#2E2A26] text-[#8A5A44] dark:text-[#D67855] font-bold border-b border-[#E7D5BE] dark:border-stone-800">
                      <tr>
                        <th className="p-4 whitespace-nowrap text-sm font-bold uppercase tracking-wider">Matéria-Prima / Insumo</th>
                        <th className="p-4 whitespace-nowrap text-sm font-bold uppercase tracking-wider">Categoria</th>
                        <th className="p-4 whitespace-nowrap text-sm font-bold uppercase tracking-wider">Estoque Atual</th>
                        <th className="p-4 whitespace-nowrap text-sm font-bold uppercase tracking-wider">Estoque Mín.</th>
                        <th className="p-4 whitespace-nowrap text-sm font-bold uppercase tracking-wider">Custo / Unidade</th>
                        <th className="p-4 hidden lg:table-cell whitespace-nowrap text-sm font-bold uppercase tracking-wider">Fornecedor</th>
                        <th className="p-4 whitespace-nowrap text-sm font-bold uppercase tracking-wider">Status</th>
                        <th className="p-4 text-right whitespace-nowrap text-sm font-bold uppercase tracking-wider">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E7D5BE]/60 dark:divide-stone-800">
                      {filteredRawMaterials.map((m) => {
                        const isLow = m.stockQuantity <= m.minStock;
                        return (
                          <tr key={m.id} className="hover:bg-[#F7F1E7]/80 dark:hover:bg-[#2E2A26] transition-colors">
                            <td className="p-4">
                              <p className="font-bold text-[#292724] dark:text-[#F7F1E7] text-base">{m.name}</p>
                              {m.lastPurchaseDate && (
                                <p className="text-xs sm:text-sm text-[#8A5A44] dark:text-[#C9BFA8] mt-0.5">Última compra: {m.lastPurchaseDate}</p>
                              )}
                            </td>
                            <td className="p-4">
                              <span className="px-3 py-1 rounded-lg bg-[#E7D5BE]/60 dark:bg-stone-700 text-[#292724] dark:text-[#F7F1E7] font-bold text-xs sm:text-sm">
                                {m.category}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className={`font-black text-base sm:text-lg ${isLow ? 'text-rose-700 dark:text-rose-400' : 'text-[#4F583D] dark:text-[#A4B38A]'}`}>
                                {m.stockQuantity} {m.unit}
                              </span>
                            </td>
                            <td className="p-4 font-semibold text-[#8A5A44] dark:text-[#C9BFA8]">
                              {m.minStock} {m.unit}
                            </td>
                            <td className="p-4 font-bold text-[#292724] dark:text-[#F7F1E7] font-mono">
                              R$ {m.costPerUnit.toFixed(2)} / {m.unit}
                            </td>
                            <td className="p-4 hidden lg:table-cell text-[#5C5852] dark:text-[#C9BFA8]">
                              {m.supplier || '—'}
                            </td>
                            <td className="p-4">
                              <StatusBadge status={isLow ? 'Estoque Baixo' : 'Normal'} />
                            </td>
                            <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                              <Button
                                onClick={() => {
                                  setSelectedItemId(m.id);
                                  setIsAdjustmentModalOpen(true);
                                }}
                                variant="secondary"
                                size="sm"
                              >
                                Ajustar
                              </Button>
                              <Button
                                onClick={() => handleOpenEditRaw(m)}
                                variant="ghost"
                                size="sm"
                                icon={Edit3}
                                ariaLabel={`Editar ${m.name}`}
                              />
                              <Button
                                onClick={() => setRawToDelete(m)}
                                variant="ghost"
                                size="sm"
                                icon={Trash2}
                                ariaLabel={`Excluir ${m.name}`}
                                className="text-rose-700 hover:bg-rose-100 dark:hover:bg-rose-900/30"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </Card>
        </div>
      )}

      {/* Finished Products Tab */}
      {activeTab === 'finished' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p) => {
              const isLow = p.stock <= p.minStock;
              return (
                <Card key={p.id} variant="default" className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-bold uppercase text-[#8A5A44] dark:text-[#C9BFA8]">{p.category}</span>
                      <h4 className="font-bold text-[#292724] dark:text-[#F7F1E7] text-lg mt-0.5">{p.name}</h4>
                    </div>
                    <StatusBadge status={isLow ? 'Estoque Baixo' : 'Normal'} />
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-[#FAF6EF] dark:bg-[#1A1816] rounded-xl border border-[#E7D5BE] dark:border-stone-800">
                    <div>
                      <span className="text-xs text-[#8A5A44] dark:text-[#C9BFA8] block uppercase font-bold">Estoque Pronto</span>
                      <span className={`text-2xl font-black ${isLow ? 'text-rose-700 dark:text-rose-400' : 'text-[#4F583D] dark:text-[#A4B38A]'}`}>
                        {p.stock} un
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-[#8A5A44] dark:text-[#C9BFA8] block uppercase font-bold">Preço de Venda</span>
                      <span className="text-xl font-black text-[#292724] dark:text-[#F7F1E7] font-mono">
                        R$ {p.price.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-[#5C5852] dark:text-[#C9BFA8] pt-2 border-t border-[#E7D5BE] dark:border-stone-800">
                    <span>Mínimo Recomendado: <strong>{p.minStock} un</strong></span>
                    <Button
                      onClick={() => {
                        setSelectedItemId(p.id);
                        setIsAdjustmentModalOpen(true);
                      }}
                      variant="secondary"
                      size="sm"
                    >
                      Ajustar Saldo
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* History & Audit Logs Tab */}
      {activeTab === 'history' && (
        <Card variant="default" className="p-6">
          <h3 className="text-lg sm:text-xl font-bold text-[#292724] dark:text-[#F7F1E7] mb-4 font-brand-serif">
            Histórico de Alterações de Estoque & Auditoria
          </h3>
          <div className="space-y-3">
            {auditLogs.slice(0, 20).map((log) => (
              <div key={log.id} className="p-3.5 bg-[#FAF6EF] dark:bg-[#25221E] rounded-xl border border-[#E7D5BE] dark:border-stone-800 text-sm flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#292724] dark:text-[#F7F1E7]">{log.userName || 'Sistema'}</span>
                  <span className="text-xs text-[#8A5A44] dark:text-[#C9BFA8] ml-2">• {new Date(log.timestamp).toLocaleString()}</span>
                  <p className="text-sm text-[#5C5852] dark:text-[#C9BFA8] mt-0.5">{log.action}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Adjustment Modal */}
      {isAdjustmentModalOpen && (
        <Modal
          isOpen={isAdjustmentModalOpen}
          onClose={() => setIsAdjustmentModalOpen(false)}
          title="Ajuste Manual de Saldo de Estoque"
          size="md"
        >
          <form onSubmit={handleAdjustStock} className="space-y-4 font-brand-sans">
            <FormField label="Item Selecionado" htmlFor="adj-item" required>
              <Select
                id="adj-item"
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                required
              >
                <optgroup label="Matérias-Primas & Insumos">
                  {rawMaterials.map(m => (
                    <option key={m.id} value={m.id}>{m.name} (Atual: {m.stockQuantity} {m.unit})</option>
                  ))}
                </optgroup>
                <optgroup label="Produtos Acabados">
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Atual: {p.stock} un)</option>
                  ))}
                </optgroup>
              </Select>
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Tipo de Ajuste" htmlFor="adj-type" required>
                <Select
                  id="adj-type"
                  value={adjustmentType}
                  onChange={(e) => setAdjustmentType(e.target.value as any)}
                >
                  <option value="add">Entrada (+) Adicionar</option>
                  <option value="remove">Saída (-) Remover</option>
                </Select>
              </FormField>

              <FormField label="Quantidade" htmlFor="adj-qty" required>
                <Input
                  id="adj-qty"
                  type="number"
                  min="0.1"
                  step="any"
                  required
                  value={adjustmentQty}
                  onChange={(e) => setAdjustmentQty(parseFloat(e.target.value) || 0)}
                />
              </FormField>
            </div>

            <FormField label="Motivo do Ajuste" htmlFor="adj-reason">
              <Input
                id="adj-reason"
                type="text"
                placeholder="Ex: Compra de emergência, perda em transporte, quebra..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </FormField>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#E7D5BE] dark:border-stone-800">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsAdjustmentModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
              >
                Confirmar Ajuste
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Raw Material CRUD Modal */}
      {isRawModalOpen && (
        <Modal
          isOpen={isRawModalOpen}
          onClose={() => setIsRawModalOpen(false)}
          title={editingRawMaterial ? 'Editar Matéria-Prima' : 'Cadastrar Matéria-Prima / Insumo'}
          size="md"
        >
          <form onSubmit={handleSubmitRawMaterial} className="space-y-4 font-brand-sans">
            <FormField label="Nome do Insumo" htmlFor="raw-name" required>
              <Input
                id="raw-name"
                type="text"
                required
                placeholder="Ex: Argila Tabaco, Esmalte Branco Brilhante..."
                value={rawName}
                onChange={(e) => setRawName(e.target.value)}
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Categoria" htmlFor="raw-cat" required>
                <Select
                  id="raw-cat"
                  value={rawCategory}
                  onChange={(e) => setRawCategory(e.target.value as any)}
                >
                  {RAW_CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Unidade de Medida" htmlFor="raw-unit" required>
                <Select
                  id="raw-unit"
                  value={rawUnit}
                  onChange={(e) => setRawUnit(e.target.value as any)}
                >
                  <option value="kg">Quilogramas (kg)</option>
                  <option value="g">Gramas (g)</option>
                  <option value="L">Litros (L)</option>
                  <option value="ml">Mililitros (ml)</option>
                  <option value="un">Unidades (un)</option>
                  <option value="m">Metros (m)</option>
                </Select>
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField label="Estoque Atual" htmlFor="raw-stock" required>
                <Input
                  id="raw-stock"
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={rawStockQuantity}
                  onChange={(e) => setRawStockQuantity(parseFloat(e.target.value) || 0)}
                />
              </FormField>

              <FormField label="Estoque Mínimo" htmlFor="raw-min" required>
                <Input
                  id="raw-min"
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={rawMinStock}
                  onChange={(e) => setRawMinStock(parseFloat(e.target.value) || 0)}
                />
              </FormField>

              <FormField label="Custo Unitário (R$)" htmlFor="raw-cost">
                <Input
                  id="raw-cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={rawCostPerUnit}
                  onChange={(e) => setRawCostPerUnit(parseFloat(e.target.value) || 0)}
                />
              </FormField>
            </div>

            <FormField label="Fornecedor / Origem" htmlFor="raw-supplier">
              <Input
                id="raw-supplier"
                type="text"
                placeholder="Ex: Mineradora Vale, Cerâmica São José..."
                value={rawSupplier}
                onChange={(e) => setRawSupplier(e.target.value)}
              />
            </FormField>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#E7D5BE] dark:border-stone-800">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsRawModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
              >
                {editingRawMaterial ? 'Salvar Alterações' : 'Cadastrar Insumo'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {rawToDelete && (
        <ConfirmModal
          isOpen={!!rawToDelete}
          onClose={() => setRawToDelete(null)}
          onConfirm={confirmDeleteRaw}
          title="Excluir Matéria-Prima"
          message={`Tem certeza que deseja remover "${rawToDelete.name}" do controle de insumos?`}
          confirmLabel="Excluir Insumo"
          variant="danger"
        />
      )}
    </div>
  );
};
