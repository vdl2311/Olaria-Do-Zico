import React, { useState, useEffect, useRef } from 'react';
import { PackageSearch, Plus, Search, Filter, Edit3, Camera, Upload, Layers, ArrowRight, X } from 'lucide-react';
import { StorageService, subscribeStorage } from '../services/storage';
import { Product, ProductCategory } from '../types';
import { CameraModal } from '../components/CameraModal';
import { BrandSymbol } from '../components/BrandLogo';
import {
  Button,
  Card,
  Modal,
  FormField,
  Input,
  Select,
  EmptyState,
  useToast
} from '../components/ui';

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  'Vaso',
  'Fonte',
  'Cachepô',
  'Jardineira',
  'Peça Decorativa',
  'Outros'
];

interface ProductsViewProps {
  onNavigateToStock?: () => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({ onNavigateToStock }) => {
  const { showSuccess } = useToast();
  const [products, setProducts] = useState<Product[]>(() => StorageService.getProducts());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ProductCategory>('Vaso');
  const [size, setSize] = useState('Médio (35cm x 30cm)');
  const [finish, setFinish] = useState('Terracota Natural');
  const [cost, setCost] = useState<number>(0);
  const [price, setPrice] = useState<number>(0);
  const [stock, setStock] = useState<number>(0);
  const [minStock, setMinStock] = useState<number>(1);
  const [photoUrl, setPhotoUrl] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshData = () => {
    setProducts(StorageService.getProducts());
  };

  useEffect(() => {
    const unsub = subscribeStorage(() => {
      refreshData();
    });
    return () => unsub();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setPhotoUrl(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setName('');
    setCategory('Vaso');
    setSize('Médio (35cm x 30cm)');
    setFinish('Terracota Natural');
    setCost(0);
    setPrice(0);
    setStock(0);
    setMinStock(1);
    setPhotoUrl('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setCategory(p.category);
    setSize(p.size);
    setFinish(p.finish || '');
    setCost(p.cost || p.estimatedCost || 0);
    setPrice(p.price);
    setStock(p.stock);
    setMinStock(p.minStock);
    setPhotoUrl(p.photoUrl || '');
    setIsModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newProd: Product = {
      id: editingProduct ? editingProduct.id : `prod-${Date.now()}`,
      code: editingProduct ? editingProduct.code : `VS-${Math.floor(100 + Math.random() * 900)}`,
      name: name.trim(),
      category,
      size,
      finish,
      cost,
      price,
      stock,
      minStock,
      photoUrl: photoUrl || undefined
    };

    StorageService.saveProduct(newProd);
    refreshData();
    setIsModalOpen(false);
    showSuccess(
      editingProduct ? 'Peça Atualizada' : 'Peça Cadastrada',
      `Peça ${newProd.name} salva no catálogo!`
    );
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 pb-20 font-brand-sans">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FAF6EF] p-5 sm:p-6 rounded-3xl border border-[#E7D5BE] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-brand-serif font-black text-2xl sm:text-3xl text-[#292724]">Catálogo de Peças Cerâmicas</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#B85C38]/15 text-[#B85C38]">
              {products.length} itens
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#8A5A44] mt-1">
            Gestão de vasos, fontes, acabamentos, dimensões e precificação da olaria.
          </p>
        </div>

        <Button
          onClick={handleOpenCreateModal}
          variant="primary"
          size="md"
          icon={Plus}
          className="shrink-0"
        >
          Cadastrar Nova Peça
        </Button>
      </div>

      {/* Raw Materials Tip Callout */}
      <Card variant="flat" className="p-3.5 sm:p-4 flex items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-[#E7D5BE] text-[#8A5A44] rounded-xl shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-[#292724] block">Insumos & Matérias-Primas (Argilas, Esmaltes, Pigmentos)</span>
            <span className="text-xs text-[#8A5A44]">
              Cadastre e acompanhe o estoque de matérias-primas no módulo dedicado.
            </span>
          </div>
        </div>
        {onNavigateToStock && (
          <Button
            onClick={onNavigateToStock}
            variant="secondary"
            size="sm"
            icon={ArrowRight}
            className="shrink-0"
          >
            Ver Matérias-Primas
          </Button>
        )}
      </Card>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-[#8A5A44]" />
          <Input
            id="search-products-input"
            type="text"
            placeholder="Buscar por nome da peça ou código (ex: VS-101)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            aria-label="Buscar peça por nome ou código"
          />
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <Filter className="w-4 h-4 text-[#8A5A44] shrink-0" />
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-[#B85C38] text-white shadow-xs'
                : 'bg-[#FAF6EF] text-[#8A5A44] hover:bg-[#E7D5BE] border border-[#E7D5BE]'
            }`}
          >
            Todos ({products.length})
          </button>
          {PRODUCT_CATEGORIES.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#B85C38] text-white shadow-xs'
                  : 'bg-[#FAF6EF] text-[#8A5A44] hover:bg-[#E7D5BE] border border-[#E7D5BE]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <EmptyState
          title="Nenhuma peça cerâmica encontrada"
          description="Tente ajustar os termos da busca ou limpe os filtros de categoria."
          actionLabel="Cadastrar Peça"
          onAction={handleOpenCreateModal}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredProducts.map(p => {
            const isLow = p.stock <= p.minStock;
            return (
              <Card
                key={p.id}
                variant="default"
                className="p-0 overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Image / Ceramic Visual */}
                  <div className="h-44 bg-[#F7F1E7] relative overflow-hidden flex items-center justify-center border-b border-[#E7D5BE]">
                    {p.photoUrl ? (
                      <img 
                        src={p.photoUrl} 
                        alt={p.name}
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="text-center p-4">
                        <BrandSymbol size={48} variant="argila" />
                        <span className="text-[11px] text-[#8A5A44] font-medium block mt-1">Cerâmica Artesanal</span>
                      </div>
                    )}
                    <span className="absolute top-2.5 left-2.5 bg-[#FAF6EF]/90 backdrop-blur-xs text-[#8A5A44] font-mono text-[10px] font-bold px-2 py-0.5 rounded-lg border border-[#D4BEA2]">
                      {p.code}
                    </span>
                    <span className="absolute top-2.5 right-2.5 bg-[#667052]/20 text-[#4F583D] text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-[#667052]/30">
                      {p.category}
                    </span>
                  </div>

                  <div className="p-4 space-y-2">
                    <h3 className="font-brand-serif font-bold text-[#292724] text-base leading-tight">{p.name}</h3>
                    <p className="text-xs text-[#8A5A44]">Dimensões: <strong>{p.size}</strong></p>
                    <p className="text-xs text-[#8A5A44]">Acabamento: <strong>{p.finish || 'Terracota Natural'}</strong></p>

                    <div className="pt-2 border-t border-[#E7D5BE] flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[#8A5A44] block text-[10px] font-semibold">Preço de Venda</span>
                        <span className="font-brand-serif font-black text-[#B85C38] text-base">R$ {p.price.toFixed(2)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[#8A5A44] block text-[10px] font-semibold">Em Estoque</span>
                        <span className={`font-brand-serif font-black text-sm ${isLow ? 'text-rose-700' : 'text-[#4F583D]'}`}>
                          {p.stock} un
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0">
                  <Button
                    onClick={() => handleOpenEditModal(p)}
                    variant="ghost"
                    size="sm"
                    icon={Edit3}
                    className="w-full border border-[#E7D5BE]"
                  >
                    Editar Peça
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal Product */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingProduct ? 'Editar Peça Cerâmica' : 'Cadastrar Nova Peça'}
          description="Preencha os detalhes da peça para catálogo e controle de estoque."
          size="md"
        >
          <form onSubmit={handleSaveProduct} className="space-y-4 font-brand-sans">
            <FormField label="Nome da Peça" htmlFor="prod-name-input" required>
              <Input
                id="prod-name-input"
                type="text"
                required
                placeholder="Ex: Vaso Terracota Bojudo 45cm"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Categoria" htmlFor="prod-category-select" required>
                <Select
                  id="prod-category-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ProductCategory)}
                >
                  {PRODUCT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </Select>
              </FormField>

              <FormField label="Dimensões" htmlFor="prod-size-input">
                <Input
                  id="prod-size-input"
                  type="text"
                  placeholder="Ex: 45cm alt x 30cm boca"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                />
              </FormField>
            </div>

            <FormField label="Acabamento / Cor" htmlFor="prod-finish-input">
              <Input
                id="prod-finish-input"
                type="text"
                placeholder="Ex: Terracota Natural, Hidrorrepelente, Esmalte Verde"
                value={finish}
                onChange={(e) => setFinish(e.target.value)}
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Custo de Produção (R$)" htmlFor="prod-cost-input">
                <Input
                  id="prod-cost-input"
                  type="number"
                  step="0.01"
                  min={0}
                  value={cost}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setCost(parseFloat(e.target.value) || 0)}
                />
              </FormField>

              <FormField label="Preço de Venda (R$)" htmlFor="prod-price-input" required>
                <Input
                  id="prod-price-input"
                  type="number"
                  step="0.01"
                  min={0}
                  required
                  value={price}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                  className="font-bold"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Estoque Inicial" htmlFor="prod-stock-input">
                <Input
                  id="prod-stock-input"
                  type="number"
                  min={0}
                  value={stock}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setStock(parseInt(e.target.value) || 0)}
                />
              </FormField>

              <FormField label="Estoque Mínimo (Alerta)" htmlFor="prod-min-stock-input">
                <Input
                  id="prod-min-stock-input"
                  type="number"
                  min={0}
                  value={minStock}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setMinStock(parseInt(e.target.value) || 0)}
                />
              </FormField>
            </div>

            <FormField label="Foto da Peça" htmlFor="prod-photo-upload">
              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  onClick={() => setIsCameraOpen(true)}
                  variant="secondary"
                  size="sm"
                  icon={Camera}
                  className="flex-1"
                >
                  Tirar Foto
                </Button>

                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  variant="secondary"
                  size="sm"
                  icon={Upload}
                  className="flex-1"
                >
                  Upload
                </Button>

                <input
                  type="file"
                  id="prod-photo-upload"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {photoUrl && (
                <div className="mt-2 relative w-20 h-20 rounded-xl overflow-hidden border border-[#D4BEA2]">
                  <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhotoUrl('')}
                    aria-label="Remover foto"
                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </FormField>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#E7D5BE]">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" size="md">
                Salvar Peça
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Camera Modal */}
      {isCameraOpen && (
        <CameraModal
          isOpen={isCameraOpen}
          onCapture={(dataUrl) => {
            setPhotoUrl(dataUrl);
            setIsCameraOpen(false);
          }}
          onClose={() => setIsCameraOpen(false)}
        />
      )}
    </div>
  );
};
