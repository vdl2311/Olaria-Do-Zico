import React, { useState, useRef } from 'react';
import { PackageSearch, Plus, Search, Filter, Edit3, Image as ImageIcon, X, Camera, Upload } from 'lucide-react';
import { StorageService } from '../services/storage';
import { Product, ProductCategory } from '../types';
import { CameraModal } from '../components/CameraModal';

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

  React.useEffect(() => {
    return StorageService.getProducts ? () => {} : undefined;
  }, []);

  const refreshData = () => {
    setProducts(StorageService.getProducts());
  };

  React.useEffect(() => {
    refreshData();
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
      estimatedCost: cost,
      price,
      stock,
      minStock,
      photoUrl: photoUrl || 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&q=80&w=400'
    };

    StorageService.saveProduct(newProd);
    refreshData();
    setIsModalOpen(false);
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-amber-950 flex items-center gap-2">
            <PackageSearch className="w-6 h-6 text-amber-800" />
            <span>Catálogo de Produtos & Vasos</span>
          </h2>
          <p className="text-xs text-amber-800/80">Vasos, fontes, cachepôs, jardineiras e cerâmicas decorativas.</p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center space-x-2 bg-amber-900 hover:bg-amber-800 text-amber-50 font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all text-xs sm:text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Novo Produto</span>
        </button>
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="bg-white p-3 rounded-2xl border border-amber-200 flex items-center space-x-3 shadow-xs flex-1">
          <Search className="w-5 h-5 text-amber-700 shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar produto por nome ou código..."
            className="w-full bg-transparent text-sm text-amber-950 placeholder-amber-400 focus:outline-none"
          />
        </div>

        <div className="bg-white p-2 rounded-2xl border border-amber-200 shadow-xs flex items-center space-x-2">
          <Filter className="w-4 h-4 text-amber-800 ml-2" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-transparent text-xs sm:text-sm font-bold text-amber-950 p-1 focus:outline-none"
          >
            <option value="all">Todas Categorias</option>
            {PRODUCT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Product Catalog Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white border border-amber-200 rounded-2xl p-10 text-center space-y-4 shadow-xs">
          <PackageSearch className="w-12 h-12 text-amber-400 mx-auto" />
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="font-bold text-amber-950 text-base">Nenhum produto cadastrado</h3>
            <p className="text-xs text-amber-700">
              Comece cadastrando os vasos, fontes, jardineiras e peças cerâmicas produzidas na olaria.
            </p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center space-x-2 bg-amber-900 hover:bg-amber-800 text-amber-50 font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all text-xs sm:text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Primeiro Produto</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((p) => {
            const margin = p.price - p.cost;
            const isLow = p.stock <= p.minStock;

            return (
              <div key={p.id} className="bg-white border border-amber-200 rounded-2xl overflow-hidden shadow-xs hover:border-amber-400 transition-all flex flex-col justify-between">
                <div>
                  <div className="relative h-44 bg-amber-100 overflow-hidden">
                    <img
                      src={p.photoUrl || 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&q=80&w=400'}
                      alt={p.name}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2 left-2 bg-amber-950/80 text-amber-100 text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-xs">
                      {p.code}
                    </span>
                    <span className="absolute top-2 right-2 bg-white/90 text-amber-950 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                      {p.category}
                    </span>
                  </div>

                  <div className="p-4 space-y-2">
                    <h3 className="font-black text-amber-950 text-base leading-tight">{p.name}</h3>
                    <p className="text-xs text-amber-800">Tam: {p.size} | {p.finish || 'Padrão'}</p>

                    <div className="pt-2 border-t border-amber-100 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-amber-700 block text-[10px]">Preço Venda</span>
                        <span className="font-black text-amber-950 text-sm">R$ {p.price.toFixed(2)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-amber-700 block text-[10px]">Estoque</span>
                        <span className={`font-black text-sm ${isLow ? 'text-red-600' : 'text-emerald-800'}`}>
                          {p.stock} un
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0">
                  <button
                    onClick={() => handleOpenEditModal(p)}
                    className="w-full py-2 bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editar Produto</span>
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
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-amber-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-amber-100 pb-3">
              <h3 className="font-bold text-amber-950 text-base">
                {editingProduct ? 'Editar Produto' : 'Cadastrar Novo Produto na Olaria'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-amber-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-amber-900 mb-1">Nome do Produto:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Vaso Vietnâmita Cerâmica Grandes Curvas"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-2.5 text-amber-950"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-amber-900 mb-1">Categoria:</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ProductCategory)}
                    className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-2.5 text-amber-950"
                  >
                    {PRODUCT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-amber-900 mb-1">Tamanho / Medidas:</label>
                  <input
                    type="text"
                    placeholder="Ex: 50cm x 40cm"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-2.5 text-amber-950"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-amber-900 mb-1">Acabamento / Cor:</label>
                <input
                  type="text"
                  placeholder="Ex: Esmaltado Azul Cobalto ou Terracota Rústico"
                  value={finish}
                  onChange={(e) => setFinish(e.target.value)}
                  className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-2.5 text-amber-950"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-amber-900 mb-1">Custo de Produção (R$):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={cost}
                    onChange={(e) => setCost(parseFloat(e.target.value) || 0)}
                    className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-2.5 text-amber-950"
                  />
                </div>

                <div>
                  <label className="block font-bold text-amber-900 mb-1">Preço de Venda (R$):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-2.5 text-amber-950 font-bold text-amber-950"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-amber-900 mb-1">Estoque Inicial:</label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(parseInt(e.target.value) || 0)}
                    className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-2.5 text-amber-950"
                  />
                </div>

                <div>
                  <label className="block font-bold text-amber-900 mb-1">Estoque Mínimo (Alerta):</label>
                  <input
                    type="number"
                    value={minStock}
                    onChange={(e) => setMinStock(parseInt(e.target.value) || 0)}
                    className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-2.5 text-amber-950"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-amber-900 mb-1">Foto do Vaso / Peça:</label>
                
                {/* Image Preview */}
                {photoUrl && (
                  <div className="mb-2 relative h-36 bg-amber-100 rounded-xl overflow-hidden border border-amber-300 flex items-center justify-center">
                    <img
                      src={photoUrl}
                      alt="Prévia do produto"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setPhotoUrl('')}
                      className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full hover:bg-black/80"
                      title="Remover foto"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Photo Action Buttons */}
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setIsCameraOpen(true)}
                    className="flex items-center justify-center space-x-2 bg-amber-800 hover:bg-amber-900 text-amber-50 font-bold py-2.5 px-3 rounded-xl shadow-xs transition-colors text-xs"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Abrir Câmera</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center space-x-2 bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold py-2.5 px-3 rounded-xl border border-amber-300 transition-colors text-xs"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Galeria / Arquivo</span>
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <input
                  type="text"
                  placeholder="Ou cole a URL da Imagem (https://...)"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-2 text-xs text-amber-950 placeholder-amber-400"
                />
              </div>

              {/* Camera Modal */}
              <CameraModal
                isOpen={isCameraOpen}
                onClose={() => setIsCameraOpen(false)}
                onCapture={(imgData) => setPhotoUrl(imgData)}
              />

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
                  {editingProduct ? 'Salvar Alterações' : 'Cadastrar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
