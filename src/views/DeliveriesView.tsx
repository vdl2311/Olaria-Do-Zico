import React, { useState, useEffect, useMemo } from 'react';
import {
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Mic,
  Plus,
  X,
  Search,
  UserCheck,
  UserPlus,
  Phone,
  MessageSquare,
  Calendar,
  DollarSign,
  Trash2,
  Edit3,
  ExternalLink,
  Package,
  ChevronDown
} from 'lucide-react';
import { StorageService, subscribeStorage } from '../services/storage';
import { Delivery, Customer, Sale } from '../types';
import {
  Button,
  Card,
  Modal,
  FormField,
  Input,
  Select,
  useToast
} from '../components/ui';

interface DeliveriesViewProps {
  onOpenVoiceModal?: () => void;
}

export const DeliveriesView: React.FC<DeliveriesViewProps> = () => {
  const { showSuccess } = useToast();
  const [deliveries, setDeliveries] = useState<Delivery[]>(() => StorageService.getDeliveries());
  const [customers, setCustomers] = useState<Customer[]>(() => StorageService.getCustomers());
  const [sales, setSales] = useState<Sale[]>(() => StorageService.getSales());

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState<Delivery | null>(null);
  const [deliveryToDelete, setDeliveryToDelete] = useState<Delivery | null>(null);

  // Customer selection mode: 'select' (existing registered customer) or 'manual' (new customer name)
  const [customerMode, setCustomerMode] = useState<'select' | 'manual'>('select');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [address, setAddress] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [shippingFee, setShippingFee] = useState<number | string>(0);
  const [deliveryPerson, setDeliveryPerson] = useState('');
  const [status, setStatus] = useState<Delivery['status']>('Pendente');
  const [notes, setNotes] = useState('');
  const [selectedSaleId, setSelectedSaleId] = useState<string>('');

  // Filter & Search state in main list
  const [searchFilter, setSearchFilter] = useState('');
  const [statusTab, setStatusTab] = useState<'Todas' | 'Pendentes' | 'A caminho' | 'Entregues'>('Todas');

  const refreshData = () => {
    setDeliveries(StorageService.getDeliveries());
    setCustomers(StorageService.getCustomers());
    setSales(StorageService.getSales());
  };

  useEffect(() => {
    const unsub = subscribeStorage(() => {
      refreshData();
    });
    return () => unsub();
  }, []);

  const filteredCustomers = useMemo(() => {
    if (!customerSearchQuery.trim()) return customers;
    const q = customerSearchQuery.toLowerCase().trim();
    return customers.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.city && c.city.toLowerCase().includes(q)) ||
      (c.phone && c.phone.includes(q)) ||
      (c.type && c.type.toLowerCase().includes(q))
    );
  }, [customers, customerSearchQuery]);

  const handleOpenCreateModal = () => {
    setEditingDelivery(null);
    setCustomerMode('select');
    setSelectedCustomerId(customers[0]?.id || '');
    setCustomerSearchQuery('');
    setCustomerName(customers[0]?.name || '');
    setCustomerPhone(customers[0]?.phone || customers[0]?.whatsapp || '');
    setAddress(customers[0]?.address || '');
    setDeliveryDate(new Date().toISOString().split('T')[0]);
    setShippingFee(0);
    setDeliveryPerson('');
    setStatus('Pendente');
    setNotes('');
    setSelectedSaleId('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (del: Delivery) => {
    setEditingDelivery(del);
    setCustomerMode('manual');
    setSelectedCustomerId(del.customerId || '');
    setCustomerSearchQuery('');
    setCustomerName(del.customerName);
    setCustomerPhone(del.customerPhone || '');
    setAddress(del.address);
    setDeliveryDate(del.deliveryDate);
    setShippingFee(del.shippingFee || 0);
    setDeliveryPerson(del.deliveryPerson || '');
    setStatus(del.status);
    setNotes(del.notes || '');
    setSelectedSaleId(del.saleId || '');
    setIsModalOpen(true);
  };

  const handleSelectCustomer = (c: Customer) => {
    setSelectedCustomerId(c.id);
    setCustomerName(c.name);
    setCustomerPhone(c.phone || c.whatsapp || '');
    setAddress(c.address || '');
  };

  const handleSaveDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = customerName.trim();
    const cleanAddress = address.trim();

    if (!cleanName) return;
    if (!cleanAddress) return;

    let finalCustId = selectedCustomerId;
    if (customerMode === 'manual' || !finalCustId) {
      const savedCust = StorageService.findOrCreateCustomerByName(cleanName);
      finalCustId = savedCust.id;
      if (!savedCust.address && cleanAddress) {
        savedCust.address = cleanAddress;
        if (customerPhone && !savedCust.phone) savedCust.phone = customerPhone;
        StorageService.saveCustomer(savedCust, true);
      }
    }

    const numShipping = typeof shippingFee === 'number' ? shippingFee : (parseFloat(String(shippingFee)) || 0);

    const deliveryData: Delivery = {
      id: editingDelivery ? editingDelivery.id : `del-${Date.now()}`,
      customerId: finalCustId,
      customerName: cleanName,
      customerPhone: customerPhone.trim(),
      address: cleanAddress,
      deliveryDate,
      shippingFee: Math.max(0, numShipping),
      status,
      deliveryPerson: deliveryPerson.trim(),
      notes: notes.trim(),
      saleId: selectedSaleId || undefined,
      completedAt: status === 'Entregue' ? (editingDelivery?.completedAt || new Date().toISOString()) : undefined
    };

    StorageService.saveDelivery(deliveryData);
    refreshData();
    setIsModalOpen(false);
    setEditingDelivery(null);
    showSuccess(
      editingDelivery ? 'Entrega Atualizada' : 'Entrega Agendada',
      `Entrega para ${cleanName} salva com sucesso.`
    );
  };

  const handleMarkDelivered = (delivery: Delivery) => {
    const updated: Delivery = {
      ...delivery,
      status: 'Entregue',
      completedAt: new Date().toISOString()
    };
    StorageService.saveDelivery(updated);
    refreshData();
    showSuccess('Entrega Concluída', `Entrega para ${delivery.customerName} marcada como entregue.`);
  };

  const handleQuickStatusChange = (delivery: Delivery, newStatus: Delivery['status']) => {
    const updated: Delivery = {
      ...delivery,
      status: newStatus,
      completedAt: newStatus === 'Entregue' ? new Date().toISOString() : undefined
    };
    StorageService.saveDelivery(updated);
    refreshData();
  };

  const confirmDelete = () => {
    if (!deliveryToDelete) return;
    StorageService.deleteDelivery(deliveryToDelete.id);
    refreshData();
    showSuccess('Entrega Removida', 'O agendamento de entrega foi removido.');
    setDeliveryToDelete(null);
  };

  const displayDeliveries = useMemo(() => {
    return deliveries.filter(del => {
      if (statusTab === 'Pendentes' && del.status !== 'Pendente') return false;
      if (statusTab === 'A caminho' && del.status !== 'A caminho') return false;
      if (statusTab === 'Entregues' && del.status !== 'Entregue') return false;

      if (searchFilter.trim()) {
        const q = searchFilter.toLowerCase().trim();
        const matchName = del.customerName.toLowerCase().includes(q);
        const matchAddress = del.address.toLowerCase().includes(q);
        const matchPerson = (del.deliveryPerson || '').toLowerCase().includes(q);
        const matchNotes = (del.notes || '').toLowerCase().includes(q);
        return matchName || matchAddress || matchPerson || matchNotes;
      }
      return true;
    });
  }, [deliveries, statusTab, searchFilter]);

  const totalDeliveries = deliveries.length;
  const pendingCount = deliveries.filter(d => d.status === 'Pendente').length;
  const inTransitCount = deliveries.filter(d => d.status === 'A caminho').length;
  const deliveredCount = deliveries.filter(d => d.status === 'Entregue').length;
  const totalShippingEarned = deliveries
    .filter(d => d.status === 'Entregue')
    .reduce((acc, d) => acc + (d.shippingFee || 0), 0);

  return (
    <div className="space-y-6 pb-20 font-brand-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#292724] dark:text-[#F7F1E7] font-brand-serif flex items-center gap-3">
            <Truck className="w-7 h-7 text-[#B85C38]" />
            <span>Logística e Organização de Entregas</span>
          </h2>
          <p className="text-sm sm:text-base text-[#5C5852] dark:text-[#C9BFA8] mt-1">
            Agende entregas com seleção instantânea de clientes cadastrados nas vendas e rastreie status.
          </p>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Button
            onClick={handleOpenCreateModal}
            variant="primary"
            size="md"
            icon={Plus}
            className="w-full sm:w-auto"
          >
            Agendar Entrega
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card variant="flat" className="p-4 sm:p-5 space-y-1">
          <p className="text-xs sm:text-sm font-bold text-[#8A5A44] dark:text-[#C9BFA8] uppercase tracking-wider">Total de Entregas</p>
          <p className="text-2xl sm:text-3xl font-black text-[#292724] dark:text-[#F7F1E7]">{totalDeliveries}</p>
        </Card>

        <Card variant="flat" className="p-4 sm:p-5 space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm font-bold text-[#B85C38] uppercase tracking-wider">Pendentes</p>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-[#B85C38]">{pendingCount}</p>
        </Card>

        <Card variant="flat" className="p-4 sm:p-5 space-y-1">
          <p className="text-xs sm:text-sm font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">A Caminho</p>
          <p className="text-2xl sm:text-3xl font-black text-blue-800 dark:text-blue-300">{inTransitCount}</p>
        </Card>

        <Card variant="flat" className="p-4 sm:p-5 space-y-1">
          <p className="text-xs sm:text-sm font-bold text-[#4F583D] dark:text-[#A4B38A] uppercase tracking-wider">Entregues</p>
          <p className="text-2xl sm:text-3xl font-black text-[#4F583D] dark:text-[#A4B38A]">
            {deliveredCount}
            <span className="text-xs font-normal text-[#667052] dark:text-[#C9BFA8] ml-2">(R$ {totalShippingEarned.toFixed(2)})</span>
          </p>
        </Card>
      </div>

      {/* Filter Tabs & Search */}
      <Card variant="flat" className="p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {(['Todas', 'Pendentes', 'A caminho', 'Entregues'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors whitespace-nowrap cursor-pointer ${
                statusTab === tab
                  ? 'bg-[#B85C38] text-white shadow-xs'
                  : 'bg-[#FAF6EF] dark:bg-[#25221E] text-[#292724] dark:text-[#F7F1E7] hover:bg-[#E7D5BE] dark:hover:bg-stone-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A5A44] pointer-events-none" />
          <Input
            id="deliveries-search"
            type="text"
            placeholder="Buscar por cliente, endereço ou entregador..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Deliveries List Cards */}
      {displayDeliveries.length === 0 ? (
        <Card variant="default" className="p-12 text-center space-y-4">
          <Truck className="w-14 h-14 text-[#D4BEA2] mx-auto" />
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="font-bold text-[#292724] dark:text-[#F7F1E7] text-lg">
              {searchFilter || statusTab !== 'Todas' ? 'Nenhuma entrega encontrada para o filtro' : 'Nenhuma entrega agendada'}
            </h3>
            <p className="text-sm text-[#5C5852] dark:text-[#C9BFA8]">
              Selecione clientes cadastrados nas suas vendas para agendar entregas rápidas com endereço preenchido.
            </p>
          </div>
          <Button
            onClick={handleOpenCreateModal}
            variant="primary"
            size="md"
            icon={Plus}
          >
            Agendar Nova Entrega
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayDeliveries.map((del) => {
            const linkedCust = customers.find(c => c.id === del.customerId || c.name.toLowerCase() === del.customerName.toLowerCase());
            const phone = del.customerPhone || linkedCust?.phone || linkedCust?.whatsapp;
            const cleanPhoneDigits = phone ? phone.replace(/\D/g, '') : '';
            const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(del.address)}`;

            return (
              <Card
                key={del.id}
                variant="default"
                className={`p-5 space-y-4 transition-all ${
                  del.status === 'Entregue'
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : del.status === 'A caminho'
                    ? 'border-blue-500/30 bg-blue-500/5'
                    : ''
                }`}
              >
                {/* Card Header */}
                <div className="flex items-start justify-between border-b border-[#E7D5BE] dark:border-stone-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs sm:text-sm font-bold text-[#8A5A44] dark:text-[#D67855] flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-[#B85C38]" />
                        Prevista: {del.deliveryDate.split('-').reverse().join('/')}
                      </span>
                      {linkedCust?.type && (
                        <span className="text-xs font-bold bg-[#E7D5BE]/60 dark:bg-stone-700 text-[#292724] dark:text-[#F7F1E7] px-2.5 py-0.5 rounded-lg">
                          {linkedCust.type}
                        </span>
                      )}
                    </div>
                    <h3 className="font-black text-[#292724] dark:text-[#F7F1E7] text-lg sm:text-xl mt-1">{del.customerName}</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={del.status}
                      onChange={(e) => handleQuickStatusChange(del, e.target.value as Delivery['status'])}
                      className={`text-xs sm:text-sm font-bold px-3 py-1.5 rounded-xl border cursor-pointer focus:outline-hidden ${
                        del.status === 'Entregue'
                          ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                          : del.status === 'A caminho'
                          ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-300 border-blue-300 dark:border-blue-800'
                          : 'bg-[#E7D5BE]/60 dark:bg-stone-700 text-[#292724] dark:text-[#F7F1E7] border-[#D4BEA2] dark:border-stone-600'
                      }`}
                    >
                      <option value="Pendente">⏳ Pendente</option>
                      <option value="A caminho">🚚 A caminho</option>
                      <option value="Entregue">✓ Entregue</option>
                    </select>

                    <Button
                      onClick={() => handleOpenEditModal(del)}
                      variant="ghost"
                      size="sm"
                      icon={Edit3}
                      ariaLabel="Editar entrega"
                    />
                    <Button
                      onClick={() => setDeliveryToDelete(del)}
                      variant="ghost"
                      size="sm"
                      icon={Trash2}
                      ariaLabel="Excluir entrega"
                      className="text-rose-700 hover:bg-rose-100 dark:hover:bg-rose-900/30"
                    />
                  </div>
                </div>

                {/* Details Box */}
                <div className="text-sm text-[#292724] dark:text-[#F7F1E7] space-y-2.5 bg-[#FAF6EF] dark:bg-[#1A1816] p-4 rounded-xl border border-[#E7D5BE] dark:border-stone-800">
                  <div className="flex items-start justify-between gap-2">
                    <p className="flex items-start gap-2 font-medium leading-relaxed flex-1">
                      <MapPin className="w-4 h-4 text-[#B85C38] shrink-0 mt-1" />
                      <span>
                        <strong className="font-bold text-[#292724] dark:text-[#F7F1E7]">Endereço:</strong> {del.address}
                      </span>
                    </p>
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#B85C38] dark:text-[#D67855] hover:underline bg-[#E7D5BE]/40 dark:bg-stone-800 px-2.5 py-1 rounded-lg shrink-0 transition-colors"
                      title="Ver no mapa"
                    >
                      <span>Mapa</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {phone && (
                    <div className="flex items-center justify-between pt-2 border-t border-[#E7D5BE] dark:border-stone-800">
                      <p className="flex items-center gap-2 font-medium">
                        <Phone className="w-4 h-4 text-[#8A5A44] dark:text-[#C9BFA8]" />
                        <span>Contato: <strong>{phone}</strong></span>
                      </p>
                      {cleanPhoneDigits.length >= 10 && (
                        <a
                          href={`https://wa.me/55${cleanPhoneDigits}?text=${encodeURIComponent(`Olá ${del.customerName}, aqui é da Olaria do Zico referente à entrega de suas peças agendada para ${del.deliveryDate.split('-').reverse().join('/')}.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/40 hover:bg-emerald-200 px-3 py-1 rounded-lg transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                          <span>WhatsApp</span>
                        </a>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E7D5BE] dark:border-stone-800 text-xs sm:text-sm">
                    <p>
                      <strong className="text-[#8A5A44] dark:text-[#C9BFA8]">Frete:</strong>{' '}
                      {del.shippingFee > 0 ? (
                        <span className="font-bold text-[#4F583D] dark:text-[#A4B38A] font-mono">R$ {del.shippingFee.toFixed(2)}</span>
                      ) : (
                        <span className="text-[#5C5852] dark:text-[#C9BFA8] font-medium">Grátis / Incluso</span>
                      )}
                    </p>
                    <p>
                      <strong className="text-[#8A5A44] dark:text-[#C9BFA8]">Entregador:</strong>{' '}
                      <span className="font-medium text-[#292724] dark:text-[#F7F1E7]">{del.deliveryPerson || 'Não definido'}</span>
                    </p>
                  </div>

                  {del.notes && (
                    <div className="pt-2 border-t border-[#E7D5BE] dark:border-stone-800 text-xs sm:text-sm">
                      <strong className="text-[#8A5A44] dark:text-[#C9BFA8]">Observações:</strong> {del.notes}
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                {del.status !== 'Entregue' ? (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    {del.status === 'Pendente' && (
                      <Button
                        onClick={() => handleQuickStatusChange(del, 'A caminho')}
                        variant="secondary"
                        size="md"
                        icon={Truck}
                        className="text-blue-700 border-blue-300 hover:bg-blue-50"
                      >
                        Saiu p/ Entrega
                      </Button>
                    )}
                    <Button
                      onClick={() => handleMarkDelivered(del)}
                      variant="primary"
                      size="md"
                      icon={CheckCircle2}
                      className={del.status === 'Pendente' ? '' : 'col-span-2'}
                    >
                      Marcar Entregue
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between py-2.5 px-4 text-sm text-emerald-800 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      Entregue com sucesso
                    </span>
                    <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                      {del.completedAt ? new Date(del.completedAt).toLocaleDateString('pt-BR') : del.deliveryDate}
                    </span>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* New / Edit Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingDelivery ? 'Editar Agendamento de Entrega' : 'Agendar Nova Entrega'}
          description="Preencha os detalhes para organizar o frete e rota de entrega."
          size="lg"
        >
          <form onSubmit={handleSaveDelivery} className="space-y-4 font-brand-sans">
            <div>
              <span className="block text-sm font-bold text-[#292724] dark:text-[#F7F1E7] mb-2">
                Cliente da Entrega:
              </span>

              <div className="grid grid-cols-2 gap-2 bg-[#FAF6EF] dark:bg-[#1A1816] p-1.5 rounded-xl border border-[#E7D5BE] dark:border-stone-800 mb-3">
                <button
                  type="button"
                  onClick={() => setCustomerMode('select')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                    customerMode === 'select'
                      ? 'bg-[#B85C38] text-white shadow-xs'
                      : 'text-[#292724] dark:text-[#F7F1E7] hover:bg-[#E7D5BE] dark:hover:bg-stone-800'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Selecionar Cadastrado ({customers.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCustomerMode('manual')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                    customerMode === 'manual'
                      ? 'bg-[#B85C38] text-white shadow-xs'
                      : 'text-[#292724] dark:text-[#F7F1E7] hover:bg-[#E7D5BE] dark:hover:bg-stone-800'
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Digitar Novo Cliente</span>
                </button>
              </div>

              {customerMode === 'select' ? (
                <div className="space-y-2">
                  <Select
                    id="del-cust-select"
                    value={selectedCustomerId}
                    onChange={(e) => {
                      const c = customers.find(item => item.id === e.target.value);
                      if (c) handleSelectCustomer(c);
                    }}
                  >
                    {filteredCustomers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.city ? `(${c.city})` : ''} {c.phone ? `• ${c.phone}` : ''}
                      </option>
                    ))}
                  </Select>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Nome do Cliente" htmlFor="del-cust-name" required>
                    <Input
                      id="del-cust-name"
                      type="text"
                      required
                      placeholder="Ex: Cerâmica Primavera"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                  </FormField>

                  <FormField label="Telefone / WhatsApp" htmlFor="del-cust-phone">
                    <Input
                      id="del-cust-phone"
                      type="text"
                      placeholder="Ex: (11) 98765-4321"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                    />
                  </FormField>
                </div>
              )}
            </div>

            <FormField label="Endereço Completo de Entrega" htmlFor="del-address" required>
              <Input
                id="del-address"
                type="text"
                required
                placeholder="Rua das Flores, 123 - Bairro Central, Cidade"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField label="Data Prevista" htmlFor="del-date" required>
                <Input
                  id="del-date"
                  type="date"
                  required
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                />
              </FormField>

              <FormField label="Valor do Frete (R$)" htmlFor="del-shipping">
                <Input
                  id="del-shipping"
                  type="number"
                  step="0.01"
                  min={0}
                  value={shippingFee}
                  onChange={(e) => setShippingFee(e.target.value)}
                />
              </FormField>

              <FormField label="Entregador / Veículo" htmlFor="del-person">
                <Input
                  id="del-person"
                  type="text"
                  placeholder="Ex: Furgão do Zico"
                  value={deliveryPerson}
                  onChange={(e) => setDeliveryPerson(e.target.value)}
                />
              </FormField>
            </div>

            <FormField label="Observações & Recomendações" htmlFor="del-notes">
              <Input
                id="del-notes"
                type="text"
                placeholder="Ex: Frágil - Vasos vitrificados. Entregar no período da tarde."
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
                {editingDelivery ? 'Salvar Alterações' : 'Confirmar Agendamento'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Modal */}
      {deliveryToDelete && (
        <Modal
          isOpen={!!deliveryToDelete}
          onClose={() => setDeliveryToDelete(null)}
          title="Excluir Agendamento de Entrega?"
          description={`Tem certeza que deseja remover o agendamento de entrega para ${deliveryToDelete.customerName}?`}
          size="sm"
        >
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDeliveryToDelete(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={confirmDelete}
            >
              Sim, Excluir
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};
