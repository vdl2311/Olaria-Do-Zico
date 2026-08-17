import React, { useState, useEffect, useRef } from 'react';
import { PackageSearch, Plus, Search, Filter, Edit3, Image as ImageIcon, X, Camera, Upload, Tag, QrCode, Layers, ArrowRight } from 'lucide-react';
import { StorageService, subscribeStorage } from '../services/storage';
import { Product, ProductCategory } from '../types';
import { CameraModal } from '../components/CameraModal';
import { BrandSymbol } from '../components/BrandLogo';

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
    setIsModalOpen(false);
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

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center justify-center space-x-2 bg-[#B85C38] hover:bg-[#9E4A2A] text-white font-bold px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Nova Peça</span>
        </button>
      </div>

      {/* Raw Materials Tip Callout */}
      <div className="bg-[#FAF6EF] border border-[#E7D5BE] p-3.5 sm:p-4 rounded-2xl flex items-center justify-between gap-3 text-xs sm:text-sm shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-100 text-amber-900 rounded-xl shrink-0">
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
          <button
            onClick={onNavigateToStock}
            className="px-3 py-1.5 bg-amber-900 hover:bg-amber-800 text-amber-50 font-bold text-xs rounded-xl flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
          >
            <span>Ver Matérias-Primas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-[#8A5A44]" />
          <input
            type="text"
            placeholder="Buscar por nome da peça ou código (ex: VS-101)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#FAF6EF] border border-[#E7D5BE] rounded-2xl text-xs sm:text-sm text-[#292724] placeholder-[#8A5A44]/60 focus:outline-none focus:border-[#B85C38]"
          />
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <Filter className="w-4 h-4 text-[#8A5A44] shrink-0" />
          <button
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

      {/* Products Grid conforming to Section #15 */}
      {filteredProducts.length === 0 ? (
        <div className="bg-[#FAF6EF] border border-[#E7D5BE] rounded-3xl p-12 text-center text-[#8A5A44] space-y-3">
          <PackageSearch className="w-12 h-12 mx-auto text-[#8A5A44]/40" />
          <h4 className="font-brand-serif font-bold text-lg text-[#292724]">Nenhuma peça cerâmica encontrada</h4>
          <p className="text-xs">Tente ajustar os termos da busca ou limpe os filtros de categoria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredProducts.map(p => {
            const isLow = p.stock <= p.minStock;
            return (
              <div 
                key={p.id} 
                className="bg-[#FAF6EF] border border-[#E7D5BE] rounded-3xl overflow-hidden shadow-xs hover:border-[#B85C38] transition-all flex flex-col justify-between"
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
                  <button
                    onClick={() => handleOpenEditModal(p)}
                    className="w-full py-2 bg-[#F7F1E7] hover:bg-[#E7D5BE] text-[#292724] border border-[#E7D5BE] font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#8A5A44]" />
                    <span>Editar Peça</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Product */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-[#FAF6EF] w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl border border-[#E7D5BE] flex flex-col max-h-[92dvh] sm:max-h-[88vh] overflow-hidden animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-2">
            <div className="p-4 sm:p-5 border-b border-[#E7D5BE] flex items-center justify-between shrink-0 bg-[#FAF6EF]">
              <div>
                <h3 className="font-brand-serif font-bold text-[#292724] text-base sm:text-lg">
                  {editingProduct ? 'Editar Peça Cerâmica' : 'Cadastrar Nova Peça'}
                </h3>
                <p className="text-[11px] sm:text-xs text-[#8A5A44]">
                  Preencha os detalhes da peça para catálogo e controle de estoque.
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-2 text-[#8A5A44] hover:bg-[#E7D5BE]/60 rounded-xl transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-4 sm:p-6 overflow-y-auto space-y-3.5 flex-1 overscroll-contain text-xs sm:text-sm">
                <div>
                  <label className="block font-bold text-[#292724] mb-1">Nome da Peça: <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Vaso Terracota Bojudo 45cm"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#F7F1E7] border border-[#E7D5BE] rounded-xl p-3 text-[#292724] focus:outline-none focus:border-[#B85C38] focus:bg-white text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#292724] mb-1">Categoria:</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as ProductCategory)}
                      className="w-full bg-[#F7F1E7] border border-[#E7D5BE] rounded-xl p-3 text-[#292724] focus:outline-none focus:border-[#B85C38] focus:bg-white cursor-pointer text-sm"
                    >
                      {PRODUCT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-[#292724] mb-1">Dimensões:</label>
                    <input
                      type="text"
                      placeholder="Ex: 45cm alt x 30cm boca"
                      value={size}
                      onChange={(e) => setSize(e.target.value)}
                      className="w-full bg-[#F7F1E7] border border-[#E7D5BE] rounded-xl p-3 text-[#292724] focus:outline-none focus:border-[#B85C38] focus:bg-white text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[#292724] mb-1">Acabamento / Cor:</label>
                  <input
                    type="text"
                    placeholder="Ex: Terracota Natural, Hidrorrepelente, Esmalte Verde Oliva"
                    value={finish}
                    onChange={(e) => setFinish(e.target.value)}
                    className="w-full bg-[#F7F1E7] border border-[#E7D5BE] rounded-xl p-3 text-[#292724] focus:outline-none focus:border-[#B85C38] focus:bg-white text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#292724] mb-1">Custo de Produção (R$):</label>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      value={cost}
                      onChange={(e) => setCost(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#F7F1E7] border border-[#E7D5BE] rounded-xl p-3 text-[#292724] focus:outline-none focus:border-[#B85C38] focus:bg-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#292724] mb-1">Preço de Venda (R$):</label>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      required
                      value={price}
                      onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#F7F1E7] border border-[#E7D5BE] rounded-xl p-3 text-[#292724] font-bold focus:outline-none focus:border-[#B85C38] focus:bg-white text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#292724] mb-1">Estoque Inicial:</label>
                    <input
                      type="number"
                      min={0}
                      value={stock}
                      onChange={(e) => setStock(parseInt(e.target.value) || 0)}
                      className="w-full bg-[#F7F1E7] border border-[#E7D5BE] rounded-xl p-3 text-[#292724] focus:outline-none focus:border-[#B85C38] focus:bg-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#292724] mb-1">Estoque Mínimo (Alerta):</label>
                    <input
                      type="number"
                      min={0}
                      value={minStock}
                      onChange={(e) => setMinStock(parseInt(e.target.value) || 0)}
                      className="w-full bg-[#F7F1E7] border border-[#E7D5BE] rounded-xl p-3 text-[#292724] focus:outline-none focus:border-[#B85C38] focus:bg-white text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[#292724] mb-1">Foto da Peça:</label>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setIsCameraOpen(true)}
                      className="flex-1 py-2.5 px-3 bg-[#F7F1E7] border border-[#E7D5BE] hover:bg-[#E7D5BE] text-[#292724] rounded-xl flex items-center justify-center space-x-1.5 cursor-pointer text-xs font-semibold"
                    >
                      <Camera className="w-4 h-4 text-[#B85C38]" />
                      <span>Tirar Foto</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 py-2.5 px-3 bg-[#F7F1E7] border border-[#E7D5BE] hover:bg-[#E7D5BE] text-[#292724] rounded-xl flex items-center justify-center space-x-1.5 cursor-pointer text-xs font-semibold"
                    >
                      <Upload className="w-4 h-4 text-[#8A5A44]" />
                      <span>Upload</span>
                    </button>
                    <input
                      type="file"
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
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-3.5 sm:p-4 border-t border-[#E7D5BE] flex items-center justify-end gap-2 bg-[#F7F1E7]/70 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 border border-[#E7D5BE] rounded-xl text-[#8A5A44] hover:text-[#292724] hover:bg-[#E7D5BE]/50 font-bold text-xs sm:text-sm cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#B85C38] hover:bg-[#9E4A2A] text-white font-bold rounded-xl text-xs sm:text-sm shadow-sm cursor-pointer"
                >
                  Salvar Peça
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Camera Modal */}
      {isCameraOpen && (
        <CameraModal
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
