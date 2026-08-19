import React, { useState, useEffect, useRef } from 'react';
import { ClipboardList, Plus, Mic, Calendar, Palette, DollarSign, CheckCircle2, Clock, X, Camera, Upload, Trash2 } from 'lucide-react';
import { StorageService, subscribeStorage } from '../services/storage';
import { CustomOrder, Customer } from '../types';
import { CameraModal } from '../components/CameraModal';
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

interface CustomOrdersViewProps {
  onOpenVoiceModal?: () => void;
}

export const CustomOrdersView: React.FC<CustomOrdersViewProps> = () => {
  const { showSuccess } = useToast();
  const [orders, setOrders] = useState<CustomOrder[]>(() => StorageService.getCustomOrders());
  const [customers, setCustomers] = useState<Customer[]>(() => StorageService.getCustomers());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<CustomOrder | null>(null);

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [sizeSpecs, setSizeSpecs] = useState('');
  const [colorSpecs, setColorSpecs] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      totalPrice: Number(totalPrice) || 0,
      depositPaid: Number(depositPaid) || 0,
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
    showSuccess('Encomenda Criada', `Pedido ${newOrder.code} de ${newOrder.customerName} registrado com sucesso.`);

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

  const handleUpdateStatus = (order: CustomOrder, nextStatus: CustomOrder['status']) => {
    const updated = { ...order, status: nextStatus };
    StorageService.saveCustomOrder(updated);
    refreshData();
    showSuccess('Status Atualizado', `Pedido ${order.code} movido para "${nextStatus}".`);
  };

  const confirmDelete = () => {
    if (!orderToDelete) return;
    StorageService.deleteCustomOrder(orderToDelete.id);
    refreshData();
    showSuccess('Encomenda Removida', 'Pedido removido com sucesso.');
    setOrderToDelete(null);
  };

  return (
    <div className="space-y-6 pb-20 font-brand-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#292724] dark:text-[#F7F1E7] font-brand-serif flex items-center gap-3">
            <ClipboardList className="w-7 h-7 text-[#B85C38]" />
            <span>Pedidos Sob Encomenda & Peças Especiais</span>
          </h2>
          <p className="text-sm sm:text-base text-[#5C5852] dark:text-[#C9BFA8] mt-1">
            Gestão de peças personalizadas, medidas sob medida, esmaltes especiais e prazos de entrega.
          </p>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Button
            onClick={() => setIsModalOpen(true)}
            variant="primary"
            size="md"
            icon={Plus}
            className="w-full sm:w-auto"
          >
            Novo Pedido
          </Button>
        </div>
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <EmptyState
          title="Nenhum pedido sob encomenda cadastrado"
          description="Registre peças personalizadas encomendadas por clientes, arquitetos ou floriculturas."
          actionLabel="Criar Primeiro Pedido"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {orders.map((ord) => (
            <Card key={ord.id} variant="default" className="p-5 space-y-4">
              <div className="flex items-start justify-between border-b border-[#E7D5BE] dark:border-stone-800 pb-3">
                <div>
                  <span className="text-xs sm:text-sm font-bold text-[#8A5A44] dark:text-[#D67855] font-mono">
                    {ord.code} • Prazo: {ord.targetDate.split('-').reverse().join('/')}
                  </span>
                  <h3 className="font-black text-[#292724] dark:text-[#F7F1E7] text-lg sm:text-xl mt-1">{ord.customerName}</h3>
                </div>
                <StatusBadge status={ord.status} />
              </div>

              <div className="p-4 bg-[#FAF6EF] dark:bg-[#1A1816] rounded-xl border border-[#E7D5BE] dark:border-stone-800">
                <p className="text-base font-semibold text-[#292724] dark:text-[#F7F1E7]">
                  📌 {ord.productDescription}
                </p>
              </div>

              {(ord.sizeSpecs || ord.colorSpecs) && (
                <div className="grid grid-cols-2 gap-2 text-sm text-[#5C5852] dark:text-[#C9BFA8]">
                  {ord.sizeSpecs && <p><strong>Medidas:</strong> {ord.sizeSpecs}</p>}
                  {ord.colorSpecs && <p><strong>Esmalte / Cor:</strong> {ord.colorSpecs}</p>}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 p-3.5 bg-[#FAF6EF] dark:bg-[#1A1816] rounded-xl border border-[#E7D5BE] dark:border-stone-800">
                <div>
                  <span className="text-xs text-[#8A5A44] dark:text-[#C9BFA8] block uppercase font-bold">Valor Total</span>
                  <span className="text-xl font-black text-[#292724] dark:text-[#F7F1E7] font-mono">R$ {ord.totalPrice.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-xs text-[#4F583D] dark:text-[#A4B38A] block uppercase font-bold">Sinal Pago</span>
                  <span className="text-xl font-black text-[#4F583D] dark:text-[#A4B38A] font-mono">R$ {ord.depositPaid.toFixed(2)}</span>
                </div>
              </div>

              {ord.notes && (
                <p className="text-xs sm:text-sm text-[#5C5852] dark:text-[#C9BFA8] bg-[#FAF6EF] dark:bg-[#1A1816] p-3 rounded-xl border border-[#E7D5BE] dark:border-stone-800">
                  <strong className="text-[#8A5A44] dark:text-[#D67855]">Obs:</strong> {ord.notes}
                </p>
              )}

              {/* Status Update Pipeline */}
              <div className="pt-3 border-t border-[#E7D5BE] dark:border-stone-800 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex flex-wrap gap-1.5">
                  {(['Orçamento', 'Aprovado', 'Em Produção', 'Pronto', 'Entregue'] as CustomOrder['status'][]).map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleUpdateStatus(ord, st)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        ord.status === st
                          ? 'bg-[#B85C38] text-white shadow-xs'
                          : 'bg-[#FAF6EF] dark:bg-[#1A1816] text-[#292724] dark:text-[#F7F1E7] hover:bg-[#E7D5BE] dark:hover:bg-stone-800'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <Button
                  onClick={() => setOrderToDelete(ord)}
                  variant="ghost"
                  size="sm"
                  icon={Trash2}
                  ariaLabel="Excluir pedido"
                  className="text-rose-700 hover:bg-rose-100"
                />
              </div>
            </Card>
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
              label="Nome do Cliente"
              htmlFor="order-customer-input"
              required
              hint={customers.length > 0 ? `${customers.length} clientes cadastrados` : undefined}
            >
              <Input
                id="order-customer-input"
                type="text"
                required
                list="orders-customers-list"
                placeholder="Ex: Maria Oliveira ou Floricultura Bela Arte..."
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
              <datalist id="orders-customers-list">
                {customers.map(c => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
            </FormField>

            <FormField label="Descrição Detalhada da Peça Encomendada" htmlFor="order-desc" required>
              <Input
                id="order-desc"
                type="text"
                required
                placeholder="Ex: Conjunto de 4 Cachepôs Rústicos com textura canelada"
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Dimensões / Medidas" htmlFor="order-size">
                <Input
                  id="order-size"
                  type="text"
                  placeholder="Ex: 35cm altura x 25cm diâmetro"
                  value={sizeSpecs}
                  onChange={(e) => setSizeSpecs(e.target.value)}
                />
              </FormField>

              <FormField label="Esmaltação & Cor" htmlFor="order-color">
                <Input
                  id="order-color"
                  type="text"
                  placeholder="Ex: Terracota fosco com borda esmaltada branca"
                  value={colorSpecs}
                  onChange={(e) => setColorSpecs(e.target.value)}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField label="Prazo de Entrega" htmlFor="order-target-date" required>
                <Input
                  id="order-target-date"
                  type="date"
                  required
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                />
              </FormField>

              <FormField label="Preço Total Estimado (R$)" htmlFor="order-price" required>
                <Input
                  id="order-price"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={totalPrice}
                  onChange={(e) => setTotalPrice(parseFloat(e.target.value) || 0)}
                />
              </FormField>

              <FormField label="Sinal Recebido (R$)" htmlFor="order-deposit">
                <Input
                  id="order-deposit"
                  type="number"
                  min="0"
                  step="0.01"
                  value={depositPaid}
                  onChange={(e) => setDepositPaid(parseFloat(e.target.value) || 0)}
                />
              </FormField>
            </div>

            <FormField label="Observações de Produção / Detalhes Especiais" htmlFor="order-notes">
              <Textarea
                id="order-notes"
                rows={2}
                placeholder="Ex: Queima deve ser em alta temperatura para impermeabilizar. Cliente retira na olaria."
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
                Registrar Encomenda
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation */}
      {orderToDelete && (
        <ConfirmModal
          isOpen={!!orderToDelete}
          onClose={() => setOrderToDelete(null)}
          onConfirm={confirmDelete}
          title="Excluir Pedido Personalizado"
          message={`Tem certeza que deseja excluir o pedido ${orderToDelete.code} de ${orderToDelete.customerName}?`}
          confirmLabel="Excluir Pedido"
          variant="danger"
        />
      )}
    </div>
  );
};
