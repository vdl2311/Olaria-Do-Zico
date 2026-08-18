import React, { useState, useEffect, useRef } from 'react';
import { ClipboardList, Plus, Mic, Calendar, Palette, DollarSign, CheckCircle2, Clock, X, Camera, Upload } from 'lucide-react';
import { StorageService, subscribeStorage } from '../services/storage';
import { CustomOrder, Customer } from '../types';
import { CameraModal } from '../components/CameraModal';
import {
  Button,
  Card,
  Modal,
  FormField,
  Input
} from '../components/ui';

interface CustomOrdersViewProps {
  onOpenVoiceModal: () => void;
}

export const CustomOrdersView: React.FC<CustomOrdersViewProps> = ({ onOpenVoiceModal }) => {
  const [orders, setOrders] = useState<CustomOrder[]>(() => StorageService.getCustomOrders());
  const [customers, setCustomers] = useState<Customer[]>(() => StorageService.getCustomers());
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [sizeSpecs, setSizeSpecs] = useState('');
  const [colorSpecs, setColorSpecs] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const [targetDate, setTargetDate] = useState(() => new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [depositPaid, setDepositPaid] = useState(0);
  const [notes, setNotes] = useState('');

  const refreshData = () => {
    setOrders(StorageService.getCustomOrders());
    setCustomers(StorageService.getCustomers());
  };

  useEffect(() => {
    const unsub = subscribeStorage(() => {
      refreshData();
    });
    return () => unsub();
  }, []);

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !productDescription.trim()) return;

    const customer = StorageService.findOrCreateCustomerByName(customerName);

    const newOrder: CustomOrder = {
      id: `ord-${Date.now()}`,
      code: `PED-${Math.floor(500 + Math.random() * 500)}`,
      customerId: customer.id,
      customerName: customer.name,
      productDescription,
      sizeSpecs,
      colorSpecs,
      photoUrl,
      targetDate,
      status: 'Orçamento',
      totalPrice,
      depositPaid,
      createdAt: new Date().toISOString().split('T')[0],
      notes
    };

    StorageService.saveCustomOrder(newOrder);

    // Also auto create delivery if target date set
    StorageService.saveDelivery({
      id: `del-${Date.now()}`,
      orderId: newOrder.id,
      customerName: customer.name,
      address: customer.address || 'Endereço a confirmar',
      deliveryDate: targetDate,
      shippingFee: 0,
      status: 'Pendente',
      notes: `Entrega do pedido sob encomenda ${newOrder.code}`
    });

    refreshData();
    setIsModalOpen(false);

    // Reset Form
    setCustomerName('');
    setProductDescription('');
    setSizeSpecs('');
    setColorSpecs('');
    setPhotoUrl('');
    setTotalPrice(0);
    setDepositPaid(0);
    setNotes('');
  };

  const handleUpdateStatus = (order: CustomOrder, newStatus: CustomOrder['status']) => {
    const updated = { ...order, status: newStatus };
    StorageService.saveCustomOrder(updated);
    refreshData();
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-amber-950 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-amber-800" />
            <span>Pedidos Personalizados e Sob Encomenda</span>
          </h2>
          <p className="text-xs text-amber-800/80">Registre fontes sob medida, cores especiais, prazos e sinal pago.</p>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            onClick={onOpenVoiceModal}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-amber-600 hover:bg-amber-500 text-white font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all text-xs sm:text-sm"
          >
            <Mic className="w-4 h-4 animate-pulse" />
            <span>Pedir por Voz</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-amber-900 hover:bg-amber-800 text-amber-50 font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all text-xs sm:text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Pedido</span>
          </button>
        </div>
      </div>

      {/* Orders Grid Cards */}
      {orders.length === 0 ? (
        <div className="bg-white border border-amber-200 rounded-2xl p-10 text-center space-y-4 shadow-xs">
          <ClipboardList className="w-12 h-12 text-amber-400 mx-auto" />
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="font-bold text-amber-950 text-base">Nenhum pedido sob encomenda</h3>
            <p className="text-xs text-amber-700">
              Cadastre pedidos sob medida, fontes personalizadas com prazos de entrega e valores de sinal.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center space-x-2 bg-amber-900 hover:bg-amber-800 text-amber-50 font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all text-xs sm:text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Primeiro Pedido</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {orders.map((ord) => (
            <div key={ord.id} className="bg-white border border-amber-200 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-start justify-between border-b border-amber-100 pb-2">
                <div>
                  <span className="text-xs font-bold text-amber-700">{ord.code} • Prazo: {ord.targetDate}</span>
                  <h3 className="font-black text-amber-950 text-base">{ord.customerName}</h3>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  ord.status === 'Entregue'
                    ? 'bg-emerald-100 text-emerald-800'
                    : ord.status === 'Em Produção'
                    ? 'bg-amber-200 text-amber-900'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {ord.status}
                </span>
              </div>

              <p className="text-sm font-semibold text-amber-950 bg-amber-50/80 p-3 rounded-xl border border-amber-100">
                📌 {ord.productDescription}
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs text-amber-800">
                {ord.sizeSpecs && <p><strong>Tamanho/Medidas:</strong> {ord.sizeSpecs}</p>}
                {ord.colorSpecs && <p><strong>Cor/Esmalte:</strong> {ord.colorSpecs}</p>}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-amber-100/50 p-2.5 rounded-xl border border-amber-200 font-bold">
                <div>
                  <span className="text-amber-800 block text-[10px]">Valor Total</span>
                  <span className="text-amber-950">R$ {ord.totalPrice.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-emerald-800 block text-[10px]">Sinal Pago</span>
                  <span className="text-emerald-950">R$ {ord.depositPaid.toFixed(2)}</span>
                </div>
              </div>

              {ord.notes && (
                <p className="text-xs text-amber-900 bg-amber-50 p-2 rounded-lg border border-amber-200/60">
                  <strong className="font-semibold text-amber-950">Obs:</strong> {ord.notes}
                </p>
              )}

              {/* Status updates */}
              <div className="pt-2 border-t border-amber-100 flex flex-wrap gap-1.5">
                {(['Orçamento', 'Aprovado', 'Em Produção', 'Pronto', 'Entregue'] as CustomOrder['status'][]).map(st => (
                  <button
                    key={st}
                    onClick={() => handleUpdateStatus(ord, st)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                      ord.status === st ? 'bg-amber-900 text-white' : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Custom Order Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Registrar Pedido Personalizado"
          description="Cadastre um novo pedido sob encomenda com especificações do cliente."
          size="lg"
        >
          <form onSubmit={handleCreateOrder} className="space-y-4 font-brand-sans">
            <FormField
              label="Cliente"
              htmlFor="order-customer-input"
              required
              hint={customers.length > 0 ? `${customers.length} clientes cadastrados` : undefined}
            >
              <Input
                id="order-customer-input"
                type="text"
                required
                list="orders-customers-list"
                placeholder="Ex: Maria Oliveira ou Floricultura..."
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
              <datalist id="orders-customers-list">
                {customers.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.type ? `${c.type}${c.city ? ` - ${c.city}` : ''}` : c.city}
                  </option>
                ))}
              </datalist>
              {!customerName && customers.length > 0 && (
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="text-[10px] font-bold text-[#8A5A44] uppercase tracking-wider">Recentes:</span>
                  {customers.slice(0, 4).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCustomerName(c.name)}
                      className="px-2 py-0.5 rounded-lg bg-[#FAF6EF] hover:bg-[#E7D5BE] text-[#292724] text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </FormField>

            <FormField label="Descrição da Peça Personalizada" htmlFor="order-description" required>
              <textarea
                id="order-description"
                required
                rows={2}
                placeholder="Ex: Fonte de cerâmica de 1 metro na cor azul mar profundo com prato coletor"
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                className="w-full bg-white border border-[#D4BEA2] rounded-xl p-2.5 text-[#292724] text-sm focus:border-[#B85C38] focus:ring-2 focus:ring-[#B85C38]/20 outline-hidden transition-all"
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Medidas / Tamanho" htmlFor="order-sizespecs">
                <Input
                  id="order-sizespecs"
                  type="text"
                  placeholder="Ex: 1 metro de altura"
                  value={sizeSpecs}
                  onChange={(e) => setSizeSpecs(e.target.value)}
                />
              </FormField>

              <FormField label="Cor / Esmalte" htmlFor="order-colorspecs">
                <Input
                  id="order-colorspecs"
                  type="text"
                  placeholder="Ex: Azul cobalto"
                  value={colorSpecs}
                  onChange={(e) => setColorSpecs(e.target.value)}
                />
              </FormField>
            </div>

            <div>
              <span className="block text-xs font-bold text-[#292724] mb-1.5">Foto / Referência da Encomenda:</span>
              
              {photoUrl && (
                <div className="mb-2 relative h-32 bg-[#FAF6EF] rounded-xl overflow-hidden border border-[#D4BEA2] flex items-center justify-center">
                  <img
                    src={photoUrl}
                    alt="Foto de referência"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setPhotoUrl('')}
                    className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full hover:bg-black/80 focus-visible:outline-2 focus-visible:outline-[#B85C38]"
                    title="Remover foto"
                    aria-label="Remover foto"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 mb-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsCameraOpen(true)}
                  icon={Camera}
                >
                  Abrir Câmera
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  icon={Upload}
                >
                  Galeria / Arquivo
                </Button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileUpload}
                className="hidden"
                aria-label="Upload de imagem de referência"
              />
            </div>

            {/* Camera Modal */}
            <CameraModal
              isOpen={isCameraOpen}
              onClose={() => setIsCameraOpen(false)}
              onCapture={(imgData) => setPhotoUrl(imgData)}
            />

            <FormField label="Data de Entrega Prometida" htmlFor="order-targetdate" required>
              <Input
                id="order-targetdate"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Valor Total (R$)" htmlFor="order-totalprice">
                <Input
                  id="order-totalprice"
                  type="number"
                  value={totalPrice}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setTotalPrice(parseFloat(e.target.value) || 0)}
                />
              </FormField>

              <FormField label="Sinal / Entrada Pago (R$)" htmlFor="order-depositpaid">
                <Input
                  id="order-depositpaid"
                  type="number"
                  value={depositPaid}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setDepositPaid(parseFloat(e.target.value) || 0)}
                  className="font-bold text-emerald-800"
                />
              </FormField>
            </div>

            <div className="p-3.5 border-t border-[#E7D5BE] flex justify-end gap-2 shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
              >
                Criar Pedido
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
