import React, { useState, useEffect, useRef } from 'react';
import { PackageSearch, Plus, Search, Filter, Edit3, Image as ImageIcon, X, Camera, Upload, Tag, QrCode } from 'lucide-react';
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

export const ProductsView: React.FC = () => {
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-[#FAF6EF] rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#E7D5BE] space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E7D5BE] pb-3">
              <h3 className="font-brand-serif font-bold text-[#292724] text-lg">
                {editingProduct ? 'Editar Peça Cerâmica' : 'Cadastrar Nova Peça na Olaria'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#8A5A44] hover:text-[#292724] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-[#292724] mb-1">Nome da Peça:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Vaso Terracota Bojudo 45cm"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#F7F1E7] border border-[#E7D5BE] rounded-xl p-2.5 text-[#292724] focus:outline-none focus:border-[#B85C38]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#292724] mb-1">Categoria:</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ProductCategory)}
                    className="w-full bg-[#F7F1E7] border border-[#E7D5BE] rounded-xl p-2.5 text-[#292724] focus:outline-none focus:border-[#B85C38]"
                  >
                    {PRODUCT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#292724] mb-1">Dimensões:</label>
                  <input
                    type="text"
                    placeholder="Ex: 45cm altura x 30cm boca"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    className="w-full bg-[#F7F1E7] border border-[#E7D5BE] rounded-xl p-2.5 text-[#292724] focus:outline-none focus:border-[#B85C38]"
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
                  className="w-full bg-[#F7F1E7] border border-[#E7D5BE] rounded-xl p-2.5 text-[#292724] focus:outline-none focus:border-[#B85C38]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#292724] mb-1">Custo de Produção (R$):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={cost}
                    onChange={(e) => setCost(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#F7F1E7] border border-[#E7D5BE] rounded-xl p-2.5 text-[#292724] focus:outline-none focus:border-[#B85C38]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#292724] mb-1">Preço de Venda (R$):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#F7F1E7] border border-[#E7D5BE] rounded-xl p-2.5 text-[#292724] font-bold focus:outline-none focus:border-[#B85C38]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#292724] mb-1">Estoque Inicial:</label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(parseInt(e.target.value) || 0)}
                    className="w-full bg-[#F7F1E7] border border-[#E7D5BE] rounded-xl p-2.5 text-[#292724] focus:outline-none focus:border-[#B85C38]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#292724] mb-1">Estoque Mínimo (Alerta):</label>
                  <input
                    type="number"
                    value={minStock}
                    onChange={(e) => setMinStock(parseInt(e.target.value) || 0)}
                    className="w-full bg-[#F7F1E7] border border-[#E7D5BE] rounded-xl p-2.5 text-[#292724] focus:outline-none focus:border-[#B85C38]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#292724] mb-1">Foto da Peça:</label>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsCameraOpen(true)}
                    className="flex-1 py-2 px-3 bg-[#F7F1E7] border border-[#E7D5BE] hover:bg-[#E7D5BE] text-[#292724] rounded-xl flex items-center justify-center space-x-1.5 cursor-pointer text-xs font-semibold"
                  >
                    <Camera className="w-4 h-4 text-[#B85C38]" />
                    <span>Tirar Foto</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-2 px-3 bg-[#F7F1E7] border border-[#E7D5BE] hover:bg-[#E7D5BE] text-[#292724] rounded-xl flex items-center justify-center space-x-1.5 cursor-pointer text-xs font-semibold"
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

              <div className="pt-3 border-t border-[#E7D5BE] flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-[#8A5A44] hover:text-[#292724] font-semibold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#B85C38] hover:bg-[#9E4A2A] text-white font-bold rounded-xl text-xs shadow-sm cursor-pointer"
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
