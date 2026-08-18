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
        const newStock = Math.max(0, mat.stockQuantity + change);
        const updatedMat: RawMaterial = { ...mat, stockQuantity: newStock };
        StorageService.saveRawMaterial(updatedMat);
        showSuccess('Estoque Ajustado', `Saldo de "${mat.name}" alterado para ${newStock} ${mat.unit}.`);
      }
    }
    refreshData();
    setIsAdjustmentModalOpen(false);
    setSelectedItemId('');
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

  const handleSaveRawMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawName.trim()) return;

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
    showSuccess(
      editingRawMaterial ? 'Insumo Atualizado' : 'Insumo Cadastrado',
      `Matéria-prima ${newMat.name} salva no estoque.`
    );
  };

  const confirmDeleteRawMaterial = () => {
    if (!rawToDelete) return;
    StorageService.deleteRawMaterial(rawToDelete.id);
    refreshData();
    showSuccess('Insumo Removido', `Matéria-prima "${rawToDelete.name}" foi excluída.`);
    setRawToDelete(null);
  };

  const handleUndoAudit = (logId: string) => {
    const success = StorageService.undoAuditAction(logId);
    if (success) {
      refreshData();
      showSuccess('Ação Desfeita', 'A operação anterior foi revertida.');
    }
  };

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
    <div className="space-y-6 pb-20 font-brand-sans">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-[#292724] font-brand-serif flex items-center gap-2">
            <Package className="w-6 h-6 text-[#B85C38]" />
            <span>Gestão de Estoque & Matérias-Primas</span>
          </h2>
          <p className="text-xs text-[#5C5852]">
            Controle completo de argilas, esmaltes, pigmentos, embalagens e peças acabadas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
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
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card variant="flat" className="p-4">
              <span className="text-[11px] font-bold text-[#8A5A44] uppercase block">Total de Insumos</span>
              <p className="text-xl font-black text-[#292724] mt-1">{rawMaterials.length} tipos cadastrados</p>
            </Card>

            <Card
              variant="flat"
              className={`p-4 ${lowRawStockCount > 0 ? 'bg-rose-500/10 border-rose-500/30' : ''}`}
            >
              <span className={`text-[11px] font-bold uppercase block ${lowRawStockCount > 0 ? 'text-rose-700' : 'text-[#8A5A44]'}`}>
                Estoque Mínimo / Alerta
              </span>
              <p className={`text-xl font-black mt-1 ${lowRawStockCount > 0 ? 'text-rose-700' : 'text-[#4F583D]'}`}>
                {lowRawStockCount > 0 ? `⚠️ ${lowRawStockCount} insumo(s) em falta` : '✓ Todos abastecidos'}
              </p>
            </Card>

            <Card variant="flat" className="p-4">
              <span className="text-[11px] font-bold text-[#8A5A44] uppercase block">Valor em Insumos</span>
              <p className="text-xl font-black text-[#292724] mt-1">R$ {totalRawInvested.toFixed(2)}</p>
            </Card>
          </div>

          <Card variant="flat" className="p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#8A5A44] absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                id="search-raw-material-input"
                type="text"
                placeholder="Buscar matéria-prima por nome, categoria ou fornecedor..."
                value={rawSearchTerm}
                onChange={(e) => setRawSearchTerm(e.target.value)}
                className="pl-9"
                aria-label="Buscar matéria-prima"
              />
            </div>

            <div className="flex items-center gap-2">
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
                <div className="block md:hidden divide-y divide-[#E7D5BE]">
                  {filteredRawMaterials.map((m) => {
                    const isLow = m.stockQuantity <= m.minStock;
                    return (
                      <div key={m.id} className="p-4 space-y-3 hover:bg-[#F7F1E7]/50">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded bg-[#E7D5BE]/60 text-[#292724] text-[10px] font-bold">
                                {m.category}
                              </span>
                              <StatusBadge status={isLow ? 'Estoque Baixo' : 'Normal'} />
                            </div>
                            <p className="font-bold text-[#292724] text-base mt-1">{m.name}</p>
                            {m.supplier && (
                              <p className="text-xs text-[#8A5A44]">Fornecedor: {m.supplier}</p>
                            )}
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] text-[#8A5A44] block uppercase font-bold">Saldo Atual</span>
                            <span className={`text-lg font-black ${isLow ? 'text-rose-700' : 'text-[#4F583D]'}`}>
                              {m.stockQuantity} {m.unit}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 py-2 px-3 bg-[#FAF6EF] rounded-xl border border-[#E7D5BE] text-xs">
                          <div>
                            <span className="text-[10px] text-[#8A5A44] block uppercase">Custo Unitário</span>
                            <span className="font-bold text-[#292724]">R$ {m.costPerUnit.toFixed(2)} / {m.unit}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#8A5A44] block uppercase">Estoque Mínimo</span>
                            <span className="font-bold text-[#8A5A44]">{m.minStock} {m.unit}</span>
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

                {/* Desktop View Table with Smooth Scroll */}
                <div className="hidden md:block overflow-x-auto rounded-xl">
                  <table className="w-full min-w-[720px] text-left text-xs sm:text-sm">
                    <thead className="bg-[#E7D5BE]/50 text-[#8A5A44] font-bold border-b border-[#E7D5BE]">
                      <tr>
                        <th className="p-3.5 whitespace-nowrap">Matéria-Prima / Insumo</th>
                        <th className="p-3.5 whitespace-nowrap">Categoria</th>
                        <th className="p-3.5 whitespace-nowrap">Estoque Atual</th>
                        <th className="p-3.5 whitespace-nowrap">Estoque Mín.</th>
                        <th className="p-3.5 whitespace-nowrap">Custo / Unidade</th>
                        <th className="p-3.5 hidden lg:table-cell whitespace-nowrap">Fornecedor</th>
                        <th className="p-3.5 whitespace-nowrap">Status</th>
                        <th className="p-3.5 text-right whitespace-nowrap">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E7D5BE]/60">
                      {filteredRawMaterials.map((m) => {
                        const isLow = m.stockQuantity <= m.minStock;
                        return (
                          <tr key={m.id} className="hover:bg-[#F7F1E7]/60">
                            <td className="p-3.5">
                              <p className="font-bold text-[#292724]">{m.name}</p>
                              {m.lastPurchaseDate && (
                                <p className="text-[11px] text-[#8A5A44]">Última compra: {m.lastPurchaseDate}</p>
                              )}
                            </td>
                            <td className="p-3.5">
                              <span className="px-2.5 py-1 rounded-lg bg-[#E7D5BE]/60 text-[#292724] font-bold text-xs">
                                {m.category}
                              </span>
                            </td>
                            <td className="p-3.5">
                              <span className={`text-base font-black ${isLow ? 'text-rose-700' : 'text-[#4F583D]'}`}>
                                {m.stockQuantity} {m.unit}
                              </span>
                            </td>
                            <td className="p-3.5 text-[#5C5852] font-medium">{m.minStock} {m.unit}</td>
                            <td className="p-3.5 font-bold text-[#292724]">R$ {m.costPerUnit.toFixed(2)} / {m.unit}</td>
                            <td className="p-3.5 text-[#5C5852] hidden lg:table-cell">{m.supplier || '—'}</td>
                            <td className="p-3.5">
                              <StatusBadge status={isLow ? 'Estoque Baixo' : 'Normal'} />
                            </td>
                            <td className="p-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
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
                                  className="text-rose-700"
                                  ariaLabel={`Excluir ${m.name}`}
                                />
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
          </Card>
        </div>
      )}

      {/* Finished Products Inventory Tab */}
      {activeTab === 'finished' && (
        <Card variant="default" className="p-0 overflow-hidden">
          {products.length === 0 ? (
            <EmptyState
              title="Nenhum produto em estoque"
              description="Cadastre seus vasos e cerâmicas no Catálogo de Produtos para controlar quantidades e alertas."
            />
          ) : (
            <>
              {/* Mobile View */}
              <div className="block md:hidden divide-y divide-[#E7D5BE]">
                {products.map((p) => {
                  const isLow = p.stock <= p.minStock;
                  return (
                    <div key={p.id} className="p-3.5 space-y-2 hover:bg-[#F7F1E7]/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {p.photoUrl ? (
                            <img src={p.photoUrl} alt={p.name} className="w-10 h-10 object-cover rounded-xl border border-[#E7D5BE] shrink-0" />
                          ) : (
                            <div className="w-10 h-10 bg-[#E7D5BE] rounded-xl flex items-center justify-center font-bold text-[#292724] shrink-0">
                              {p.code.substring(0, 3)}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-[#292724] text-sm">{p.name}</p>
                            <p className="text-[11px] text-[#8A5A44]">{p.code} • {p.category}</p>
                          </div>
                        </div>
                        <StatusBadge status={isLow ? 'Estoque Baixo' : 'Normal'} />
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-[#E7D5BE]">
                        <span className="font-bold text-[#292724]">Preço: R$ {p.price.toFixed(2)}</span>
                        <span className={`font-black text-sm ${isLow ? 'text-rose-700' : 'text-[#4F583D]'}`}>
                          Estoque: {p.stock} un (mín: {p.minStock})
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table with Smooth Scroll */}
              <div className="hidden md:block overflow-x-auto rounded-xl">
                <table className="w-full min-w-[700px] text-left text-xs sm:text-sm">
                  <thead className="bg-[#E7D5BE]/50 text-[#8A5A44] font-bold border-b border-[#E7D5BE]">
                    <tr>
                      <th className="p-3.5 whitespace-nowrap">Código / Foto</th>
                      <th className="p-3.5 whitespace-nowrap">Produto</th>
                      <th className="p-3.5 hidden lg:table-cell whitespace-nowrap">Categoria</th>
                      <th className="p-3.5 whitespace-nowrap">Preço Venda</th>
                      <th className="p-3.5 whitespace-nowrap">Estoque Atual</th>
                      <th className="p-3.5 hidden lg:table-cell whitespace-nowrap">Estoque Mín.</th>
                      <th className="p-3.5 whitespace-nowrap">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7D5BE]/60">
                    {products.map((p) => {
                      const isLow = p.stock <= p.minStock;
                      return (
                        <tr key={p.id} className="hover:bg-[#F7F1E7]/60">
                          <td className="p-3.5 flex items-center space-x-3">
                            {p.photoUrl ? (
                              <img src={p.photoUrl} alt={p.name} className="w-10 h-10 object-cover rounded-xl border border-[#E7D5BE]" />
                            ) : (
                              <div className="w-10 h-10 bg-[#E7D5BE] rounded-xl flex items-center justify-center font-bold text-[#292724]">
                                {p.code.substring(0, 3)}
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-[#292724]">{p.code}</p>
                              <p className="text-[11px] text-[#8A5A44]">Tam: {p.size}</p>
                            </div>
                          </td>
                          <td className="p-3.5">
                            <p className="font-bold text-[#292724]">{p.name}</p>
                            <p className="text-[11px] text-[#8A5A44]">{p.finish || 'Acabamento padrão'}</p>
                          </td>
                          <td className="p-3.5 text-[#5C5852] font-medium hidden lg:table-cell">{p.category}</td>
                          <td className="p-3.5 font-bold text-[#292724]">R$ {p.price.toFixed(2)}</td>
                          <td className="p-3.5">
                            <span className={`text-base font-black ${isLow ? 'text-rose-700' : 'text-[#4F583D]'}`}>
                              {p.stock} un
                            </span>
                          </td>
                          <td className="p-3.5 text-[#5C5852] hidden lg:table-cell">{p.minStock} un</td>
                          <td className="p-3.5">
                            <StatusBadge status={isLow ? 'Estoque Baixo' : 'Normal'} />
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
      )}

      {/* History & Audit Tab */}
      {activeTab === 'history' && (
        <Card variant="default" className="p-0 overflow-hidden">
          <div className="p-4 bg-[#FAF6EF] border-b border-[#E7D5BE]">
            <h3 className="font-bold text-[#292724] text-sm font-brand-serif">Histórico de Operações & Rastreabilidade</h3>
            <p className="text-xs text-[#5C5852]">Todas as operações registram auditoria com suporte a reversão segura.</p>
          </div>
          <div className="divide-y divide-[#E7D5BE]">
            {auditLogs.length === 0 ? (
              <EmptyState title="Nenhum registro de auditoria" description="As alterações no estoque aparecerão aqui." />
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="p-3.5 flex items-center justify-between hover:bg-[#FAF6EF]/60 text-xs">
                  <div>
                    <span className="font-bold text-[#292724] block">{log.details || log.action}</span>
                    <span className="text-[11px] text-[#8A5A44]">
                      {new Date(log.timestamp).toLocaleString('pt-BR')} • {log.action} • {log.entityType}
                    </span>
                  </div>
                  {log.status !== 'Desfeito' && (
                    <Button
                      onClick={() => handleUndoAudit(log.id)}
                      variant="outline"
                      size="sm"
                      icon={RotateCcw}
                    >
                      Desfazer
                    </Button>
                  )}
                  {log.status === 'Desfeito' && (
                    <span className="text-[11px] text-[#5C5852] italic bg-[#E7D5BE]/60 px-2 py-0.5 rounded">
                      Desfeito
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* Raw Material Modal */}
      {isRawModalOpen && (
        <Modal
          isOpen={isRawModalOpen}
          onClose={() => setIsRawModalOpen(false)}
          title={editingRawMaterial ? 'Editar Matéria-Prima' : 'Cadastrar Nova Matéria-Prima'}
          description="Preencha os dados do insumo para controle de estoque e custos."
          size="md"
        >
          <form onSubmit={handleSaveRawMaterial} className="space-y-4 font-brand-sans">
            <FormField label="Nome da Matéria-Prima / Insumo" htmlFor="raw-name-input" required>
              <Input
                id="raw-name-input"
                type="text"
                required
                placeholder="Ex: Argila Vermelha Terracota, Esmalte Fosco..."
                value={rawName}
                onChange={(e) => setRawName(e.target.value)}
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Categoria" htmlFor="raw-category-select" required>
                <Select
                  id="raw-category-select"
                  value={rawCategory}
                  onChange={(e) => setRawCategory(e.target.value as RawMaterialCategory)}
                >
                  {RAW_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Unidade de Medida" htmlFor="raw-unit-select" required>
                <Select
                  id="raw-unit-select"
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <FormField label="Estoque Inicial" htmlFor="raw-stock-qty-input" required>
                <Input
                  id="raw-stock-qty-input"
                  type="number"
                  step="any"
                  min={0}
                  required
                  value={rawStockQuantity}
                  onChange={(e) => setRawStockQuantity(parseFloat(e.target.value) || 0)}
                />
              </FormField>

              <FormField label="Estoque Mínimo" htmlFor="raw-min-stock-input" required>
                <Input
                  id="raw-min-stock-input"
                  type="number"
                  step="any"
                  min={0}
                  required
                  value={rawMinStock}
                  onChange={(e) => setRawMinStock(parseFloat(e.target.value) || 0)}
                />
              </FormField>

              <FormField label="Custo Unitário (R$)" htmlFor="raw-cost-input">
                <Input
                  id="raw-cost-input"
                  type="number"
                  step="0.01"
                  min={0}
                  value={rawCostPerUnit}
                  onChange={(e) => setRawCostPerUnit(parseFloat(e.target.value) || 0)}
                  className="font-bold"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Fornecedor (opcional)" htmlFor="raw-supplier-input">
                <Input
                  id="raw-supplier-input"
                  type="text"
                  placeholder="Ex: Mineradora Vale do Sol"
                  value={rawSupplier}
                  onChange={(e) => setRawSupplier(e.target.value)}
                />
              </FormField>

              <FormField label="Data da Última Compra" htmlFor="raw-purchase-date-input">
                <Input
                  id="raw-purchase-date-input"
                  type="date"
                  value={rawLastPurchaseDate}
                  onChange={(e) => setRawLastPurchaseDate(e.target.value)}
                />
              </FormField>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#E7D5BE]">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsRawModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" size="md">
                {editingRawMaterial ? 'Salvar Alterações' : 'Cadastrar Matéria-Prima'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Manual Stock Adjustment Modal */}
      {isAdjustmentModalOpen && (
        <Modal
          isOpen={isAdjustmentModalOpen}
          onClose={() => setIsAdjustmentModalOpen(false)}
          title="Ajuste Manual de Saldo"
          description="Registre entradas, saídas ou quebras de estoque."
          size="sm"
        >
          <form onSubmit={handleAdjustStock} className="space-y-4 font-brand-sans">
            <FormField label="Item a Ajustar" htmlFor="stock-adjust-item-select" required>
              <Select
                id="stock-adjust-item-select"
                required
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
              >
                <option value="">Selecione o item...</option>
                <optgroup label="Matérias-Primas">
                  {rawMaterials.map(m => <option key={m.id} value={m.id}>{m.name} (Atual: {m.stockQuantity} {m.unit})</option>)}
                </optgroup>
                <optgroup label="Produtos Acabados">
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} (Atual: {p.stock} un)</option>)}
                </optgroup>
              </Select>
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Tipo de Movimento" htmlFor="stock-adjust-type-select" required>
                <Select
                  id="stock-adjust-type-select"
                  value={adjustmentType}
                  onChange={(e) => setAdjustmentType(e.target.value as 'add' | 'remove')}
                >
                  <option value="add">➕ Entrada (+)</option>
                  <option value="remove">➖ Saída (-)</option>
                </Select>
              </FormField>

              <FormField label="Quantidade" htmlFor="stock-adjust-qty-input" required>
                <Input
                  id="stock-adjust-qty-input"
                  type="number"
                  step="any"
                  min={0.1}
                  value={adjustmentQty}
                  onChange={(e) => setAdjustmentQty(parseFloat(e.target.value) || 1)}
                />
              </FormField>
            </div>

            <FormField label="Motivo do Ajuste" htmlFor="stock-adjust-reason-input">
              <Input
                id="stock-adjust-reason-input"
                type="text"
                placeholder="Ex: Chegada de carregamento, consumo ou quebra"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </FormField>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#E7D5BE]">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsAdjustmentModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" size="md">
                Confirmar Ajuste
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Confirm Delete Raw Material Modal */}
      <ConfirmModal
        isOpen={!!rawToDelete}
        onClose={() => setRawToDelete(null)}
        onConfirm={confirmDeleteRawMaterial}
        title="Excluir Matéria-Prima"
        message={`Deseja realmente excluir a matéria-prima "${rawToDelete?.name}"?`}
        confirmLabel="Excluir Insumo"
        variant="danger"
      />
    </div>
  );
};
