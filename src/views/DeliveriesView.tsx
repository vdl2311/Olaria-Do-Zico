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
  Input
} from '../components/ui';

interface DeliveriesViewProps {
  onOpenVoiceModal?: () => void;
}

export const DeliveriesView: React.FC<DeliveriesViewProps> = () => {
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

  // Filtered customers for autocomplete / picker
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

  // Sales linked to currently selected customer
  const customerRecentSales = useMemo(() => {
    if (!customerName.trim() && !selectedCustomerId) return [];
    const nameLower = customerName.toLowerCase().trim();
    return sales.filter(s =>
      (selectedCustomerId && s.customerId === selectedCustomerId) ||
      (nameLower && s.customerName.toLowerCase().includes(nameLower))
    ).slice(0, 5);
  }, [sales, customerName, selectedCustomerId]);

  const handleOpenCreateModal = () => {
    setEditingDelivery(null);
    setCustomerMode(customers.length > 0 ? 'select' : 'manual');
    setSelectedCustomerId('');
    setCustomerSearchQuery('');
    setCustomerName('');
    setCustomerPhone('');
    setAddress('');
    setDeliveryDate(new Date().toISOString().split('T')[0]);
    setShippingFee(0);
    setDeliveryPerson('Furgão do Zico');
    setStatus('Pendente');
    setNotes('');
    setSelectedSaleId('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (del: Delivery) => {
    setEditingDelivery(del);
    const linkedCust = customers.find(c => c.id === del.customerId || c.name.toLowerCase() === del.customerName.toLowerCase());
    
    if (linkedCust) {
      setCustomerMode('select');
      setSelectedCustomerId(linkedCust.id);
    } else {
      setCustomerMode('manual');
      setSelectedCustomerId('');
    }

    setCustomerSearchQuery('');
    setCustomerName(del.customerName);
    setCustomerPhone(del.customerPhone || linkedCust?.phone || linkedCust?.whatsapp || '');
    setAddress(del.address);
    setDeliveryDate(del.deliveryDate);
    setShippingFee(del.shippingFee || 0);
    setDeliveryPerson(del.deliveryPerson || '');
    setStatus(del.status);
    setNotes(del.notes || '');
    setSelectedSaleId(del.saleId || '');
    setIsModalOpen(true);
  };

  const handleSelectCustomer = (cust: Customer) => {
    setSelectedCustomerId(cust.id);
    setCustomerName(cust.name);
    const phoneVal = cust.whatsapp || cust.phone || '';
    setCustomerPhone(phoneVal);

    // Auto-fill address if available
    let autoAddress = cust.address || '';
    if (!autoAddress && cust.city) {
      autoAddress = cust.city;
    }
    if (autoAddress) {
      setAddress(autoAddress);
    }

    // Auto-link latest sale if available and notes empty
    const clientSales = sales.filter(s => s.customerId === cust.id || s.customerName.toLowerCase() === cust.name.toLowerCase());
    if (clientSales.length > 0 && !notes) {
      const latest = clientSales[0];
      const itemsList = latest.items.map(i => `${i.quantity}x ${i.productName}`).join(', ');
      setNotes(`Venda ${latest.code}: ${itemsList}`);
      setSelectedSaleId(latest.id);
    }
  };

  const handleSelectSaleLink = (sale: Sale) => {
    setSelectedSaleId(sale.id);
    const itemsList = sale.items.map(i => `${i.quantity}x ${i.productName}`).join(', ');
    const noteText = `Entrega referente à Venda ${sale.code} (${itemsList})`;
    setNotes(noteText);
  };

  const handleSaveDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = customerName.trim();
    const cleanAddress = address.trim();

    if (!cleanName || !cleanAddress) {
      alert('Por favor, informe o nome do cliente e o endereço completo de entrega.');
      return;
    }

    // If new manual customer, also register into customer base
    let finalCustId = selectedCustomerId;
    if (!finalCustId) {
      const savedCust = StorageService.findOrCreateCustomerByName(cleanName);
      finalCustId = savedCust.id;
      if (cleanAddress && !savedCust.address) {
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
  };

  const handleMarkDelivered = (delivery: Delivery) => {
    const updated: Delivery = {
      ...delivery,
      status: 'Entregue',
      completedAt: new Date().toISOString()
    };
    StorageService.saveDelivery(updated);
    refreshData();
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
    setDeliveryToDelete(null);
  };

  // Filtered deliveries for display
  const displayDeliveries = useMemo(() => {
    return deliveries.filter(del => {
      // Status filter
      if (statusTab === 'Pendentes' && del.status !== 'Pendente') return false;
      if (statusTab === 'A caminho' && del.status !== 'A caminho') return false;
      if (statusTab === 'Entregues' && del.status !== 'Entregue') return false;

      // Search filter
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

  // Statistics
  const totalDeliveries = deliveries.length;
  const pendingCount = deliveries.filter(d => d.status === 'Pendente').length;
  const inTransitCount = deliveries.filter(d => d.status === 'A caminho').length;
  const deliveredCount = deliveries.filter(d => d.status === 'Entregue').length;
  const totalShippingEarned = deliveries
    .filter(d => d.status === 'Entregue')
    .reduce((acc, d) => acc + (d.shippingFee || 0), 0);

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-amber-950 flex items-center gap-2">
            <Truck className="w-6 h-6 text-amber-800" />
            <span>Logística e Organização de Entregas</span>
          </h2>
          <p className="text-xs sm:text-sm text-amber-800/80">
            Agende entregas com seleção instantânea de clientes cadastrados nas vendas e rastreie status.
          </p>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            onClick={handleOpenCreateModal}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-amber-900 hover:bg-amber-800 text-amber-50 font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all text-xs sm:text-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="whitespace-nowrap">Agendar Entrega</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-amber-200/80 rounded-2xl p-3 sm:p-4 shadow-xs">
          <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Total de Entregas</p>
          <p className="text-xl sm:text-2xl font-black text-amber-950 mt-1">{totalDeliveries}</p>
        </div>

        <div className="bg-white border border-amber-300 rounded-2xl p-3 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Pendentes</p>
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-amber-800 mt-1">{pendingCount}</p>
        </div>

        <div className="bg-white border border-blue-200 rounded-2xl p-3 sm:p-4 shadow-xs">
          <p className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">A Caminho</p>
          <p className="text-xl sm:text-2xl font-black text-blue-900 mt-1">{inTransitCount}</p>
        </div>

        <div className="bg-white border border-emerald-200 rounded-2xl p-3 sm:p-4 shadow-xs">
          <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Entregues</p>
          <p className="text-xl sm:text-2xl font-black text-emerald-800 mt-1">
            {deliveredCount}
            <span className="text-[11px] font-normal text-emerald-700 ml-1.5">(R$ {totalShippingEarned.toFixed(2)} frete)</span>
          </p>
        </div>
      </div>

      {/* Search and Filter Tabs */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-amber-200 shadow-xs">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {(['Todas', 'Pendentes', 'A caminho', 'Entregues'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusTab(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                statusTab === tab
                  ? 'bg-amber-900 text-white shadow-2xs'
                  : 'bg-amber-50 text-amber-900 hover:bg-amber-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-amber-700 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por cliente, endereço ou entregador..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full bg-amber-50/50 border border-amber-200 rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm text-amber-950 placeholder-amber-700/60 focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200 font-medium"
          />
          {searchFilter && (
            <button
              onClick={() => setSearchFilter('')}
              className="absolute right-2.5 top-2.5 text-amber-700 hover:text-amber-950 text-xs"
            >
              &times;
            </button>
          )}
        </div>
      </div>

      {/* Deliveries List Cards */}
      {displayDeliveries.length === 0 ? (
        <div className="bg-white border border-amber-200 rounded-2xl p-10 text-center space-y-4 shadow-xs">
          <Truck className="w-12 h-12 text-amber-400 mx-auto" />
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="font-bold text-amber-950 text-base">
              {searchFilter || statusTab !== 'Todas' ? 'Nenhuma entrega encontrada para o filtro' : 'Nenhuma entrega agendada'}
            </h3>
            <p className="text-xs text-amber-700">
              Selecione clientes cadastrados nas suas vendas para agendar entregas rápidas com endereço preenchido.
            </p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center space-x-2 bg-amber-900 hover:bg-amber-800 text-amber-50 font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all text-xs sm:text-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Agendar Nova Entrega</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayDeliveries.map((del) => {
            const linkedCust = customers.find(c => c.id === del.customerId || c.name.toLowerCase() === del.customerName.toLowerCase());
            const phone = del.customerPhone || linkedCust?.phone || linkedCust?.whatsapp;
            const cleanPhoneDigits = phone ? phone.replace(/\D/g, '') : '';
            const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(del.address)}`;

            return (
              <div
                key={del.id}
                className={`bg-white border rounded-2xl p-5 shadow-xs space-y-3.5 transition-all hover:border-amber-400 ${
                  del.status === 'Entregue'
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : del.status === 'A caminho'
                    ? 'border-blue-300 bg-blue-50/20'
                    : 'border-amber-200'
                }`}
              >
                {/* Card Header */}
                <div className="flex items-start justify-between border-b border-amber-100 pb-2.5">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-bold text-amber-800 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-amber-700" />
                        Prevista: {del.deliveryDate.split('-').reverse().join('/')}
                      </span>
                      {linkedCust?.type && (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md border border-amber-200">
                          {linkedCust.type}
                        </span>
                      )}
                    </div>
                    <h3 className="font-black text-amber-950 text-base sm:text-lg mt-0.5">{del.customerName}</h3>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Status dropdown / badge */}
                    <select
                      value={del.status}
                      onChange={(e) => handleQuickStatusChange(del, e.target.value as Delivery['status'])}
                      className={`text-xs font-bold px-2.5 py-1 rounded-xl border cursor-pointer focus:outline-none ${
                        del.status === 'Entregue'
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          : del.status === 'A caminho'
                          ? 'bg-blue-100 text-blue-900 border-blue-300'
                          : 'bg-amber-100 text-amber-900 border-amber-300'
                      }`}
                    >
                      <option value="Pendente">⏳ Pendente</option>
                      <option value="A caminho">🚚 A caminho</option>
                      <option value="Entregue">✓ Entregue</option>
                    </select>

                    <button
                      onClick={() => handleOpenEditModal(del)}
                      className="p-1.5 hover:bg-amber-100 rounded-lg text-amber-800 transition-colors"
                      title="Editar entrega"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeliveryToDelete(del)}
                      className="p-1.5 hover:bg-red-100 rounded-lg text-red-700 transition-colors"
                      title="Excluir entrega"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Details Box */}
                <div className="text-xs text-amber-900 space-y-2 bg-amber-50/70 p-3.5 rounded-xl border border-amber-100">
                  <div className="flex items-start justify-between gap-2">
                    <p className="flex items-start gap-1.5 font-medium leading-relaxed flex-1">
                      <MapPin className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <span>
                        <strong className="font-bold text-amber-950">Endereço:</strong> {del.address}
                      </span>
                    </p>
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 hover:text-amber-950 bg-amber-200/70 hover:bg-amber-200 px-2 py-1 rounded-lg shrink-0 transition-colors"
                      title="Ver no mapa"
                    >
                      <span>Mapa</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {phone && (
                    <div className="flex items-center justify-between pt-1 border-t border-amber-200/50">
                      <p className="flex items-center gap-1.5 font-medium">
                        <Phone className="w-3.5 h-3.5 text-amber-700" />
                        <span>Contato: {phone}</span>
                      </p>
                      {cleanPhoneDigits.length >= 10 && (
                        <a
                          href={`https://wa.me/55${cleanPhoneDigits}?text=${encodeURIComponent(`Olá ${del.customerName}, aqui é da Olaria do Zico referente à entrega de suas peças agendada para ${del.deliveryDate.split('-').reverse().join('/')}.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-2 py-0.5 rounded-md transition-colors"
                        >
                          <MessageSquare className="w-3 h-3 text-emerald-700" />
                          <span>WhatsApp</span>
                        </a>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-amber-200/50 text-[11px]">
                    <p>
                      <strong className="font-semibold text-amber-950">Frete:</strong>{' '}
                      {del.shippingFee > 0 ? (
                        <span className="font-bold text-emerald-800">R$ {del.shippingFee.toFixed(2)}</span>
                      ) : (
                        <span className="text-stone-500 font-medium">Grátis / Incluso</span>
                      )}
                    </p>
                    <p>
                      <strong className="font-semibold text-amber-950">Entregador:</strong>{' '}
                      <span className="font-medium">{del.deliveryPerson || 'Não definido'}</span>
                    </p>
                  </div>

                  {del.notes && (
                    <div className="pt-1.5 border-t border-amber-200/50">
                      <div className="flex items-start gap-1.5 text-xs text-amber-900 bg-amber-100/70 p-2 rounded-lg border border-amber-200">
                        <MessageSquare className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                        <p className="leading-snug">
                          <strong className="font-semibold text-amber-950">Obs / Peças:</strong> {del.notes}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Action Button */}
                {del.status !== 'Entregue' ? (
                  <div className="grid grid-cols-2 gap-2">
                    {del.status === 'Pendente' && (
                      <button
                        onClick={() => handleQuickStatusChange(del, 'A caminho')}
                        className="py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-all shadow-xs cursor-pointer"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Saiu p/ Entrega</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleMarkDelivered(del)}
                      className={`py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-all shadow-xs cursor-pointer ${
                        del.status === 'Pendente' ? '' : 'col-span-2'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Marcar Entregue</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between py-1.5 px-3 text-xs text-emerald-800 font-bold bg-emerald-50 rounded-xl border border-emerald-200">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Entregue com sucesso
                    </span>
                    <span className="text-[11px] text-emerald-700 font-medium">
                      {del.completedAt ? new Date(del.completedAt).toLocaleDateString('pt-BR') : del.deliveryDate}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* New / Edit Delivery Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingDelivery ? 'Editar Agendamento de Entrega' : 'Agendar Nova Entrega'}
          description="Preencha os detalhes para organizar o frete e rota de entrega."
          size="lg"
        >
          <form onSubmit={handleSaveDelivery} className="space-y-4 font-brand-sans">
            {/* Customer Mode Selection Tabs */}
            <div>
              <span className="block text-xs font-bold text-[#292724] mb-1.5">
                Cliente da Entrega:
              </span>

              {/* Toggle between Registered Customers vs New Customer */}
              <div className="grid grid-cols-2 gap-1.5 bg-[#FAF6EF] p-1 rounded-xl border border-[#E7D5BE] mb-2">
                <button
                  type="button"
                  onClick={() => setCustomerMode('select')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    customerMode === 'select'
                      ? 'bg-[#B85C38] text-white shadow-2xs'
                      : 'text-[#292724] hover:bg-[#E7D5BE]'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Selecionar Cadastrado ({customers.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCustomerMode('manual');
                    setSelectedCustomerId('');
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    customerMode === 'manual'
                      ? 'bg-[#B85C38] text-white shadow-2xs'
                      : 'text-[#292724] hover:bg-[#E7D5BE]'
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  <span>+ Novo Cliente</span>
                </button>
              </div>

              {/* Mode 1: Select from Registered Customers */}
              {customerMode === 'select' ? (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-[#8A5A44] pointer-events-none" />
                    <Input
                      id="del-cust-search"
                      type="text"
                      placeholder="Buscar cliente por nome, telefone ou cidade..."
                      value={customerSearchQuery}
                      onChange={(e) => setCustomerSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>

                  {/* Customer Selector Dropdown / Scroll Area */}
                  <div className="max-h-40 overflow-y-auto rounded-xl border border-[#E7D5BE] divide-y divide-[#E7D5BE] bg-white">
                    {filteredCustomers.length === 0 ? (
                      <div className="p-3 text-center text-xs text-[#8A5A44]">
                        Nenhum cliente cadastrado encontrado com "{customerSearchQuery}".
                        <button
                          type="button"
                          onClick={() => {
                            setCustomerMode('manual');
                            setCustomerName(customerSearchQuery);
                          }}
                          className="block mx-auto mt-1.5 text-xs font-bold text-[#B85C38] underline hover:text-[#9E4A2A]"
                        >
                          Digitar como novo cliente
                        </button>
                      </div>
                    ) : (
                      filteredCustomers.map((cust) => {
                        const isSelected = selectedCustomerId === cust.id || (customerName.toLowerCase() === cust.name.toLowerCase() && !selectedCustomerId);
                        return (
                          <button
                            key={cust.id}
                            type="button"
                            onClick={() => handleSelectCustomer(cust)}
                            className={`w-full text-left p-2.5 transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                              isSelected
                                ? 'bg-[#FAF6EF] text-[#292724] font-bold border-l-4 border-[#B85C38]'
                                : 'hover:bg-[#FAF6EF]/60 text-[#292724]'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-sm truncate">{cust.name}</span>
                                {cust.type && (
                                  <span className="text-[10px] px-1.5 py-0.2 bg-[#E7D5BE] text-[#292724] rounded font-semibold shrink-0">
                                    {cust.type}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-[#8A5A44] flex items-center gap-2 truncate">
                                {cust.city && <span>📍 {cust.city}</span>}
                                {(cust.phone || cust.whatsapp) && <span>📞 {cust.phone || cust.whatsapp}</span>}
                                {cust.address && <span className="truncate max-w-[140px]">🏠 {cust.address}</span>}
                              </div>
                            </div>
                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-[#B85C38] shrink-0" />
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>

                  {/* Selected Customer Confirmation Tag */}
                  {customerName && (
                    <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900">
                      <div className="flex items-center gap-1.5 font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span>Cliente selecionado: <strong>{customerName}</strong></span>
                      </div>
                      <span className="text-[11px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-medium">
                        Endereço auto-preenchido
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                /* Mode 2: Manual Customer Input */
                <FormField label="Nome do Novo Cliente" htmlFor="del-cust-manual" required hint="Salvo automaticamente no cadastro de clientes.">
                  <Input
                    id="del-cust-manual"
                    type="text"
                    required
                    placeholder="Ex: Carlos Mendes ou Floricultura São José"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </FormField>
              )}
            </div>

            {/* Optional Recent Sales Link Section */}
            {customerRecentSales.length > 0 && (
              <div className="p-3 bg-[#FAF6EF] rounded-xl border border-[#E7D5BE] space-y-2">
                <p className="text-xs font-bold text-[#292724] flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-[#8A5A44]" />
                  <span>Vincular itens de venda recente deste cliente (opcional):</span>
                </p>
                <div className="grid grid-cols-1 gap-1.5">
                  {customerRecentSales.map((s) => {
                    const isSelected = selectedSaleId === s.id;
                    const itemsText = s.items.map(i => `${i.quantity}x ${i.productName}`).join(', ');
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleSelectSaleLink(s)}
                        className={`p-2 rounded-lg text-left text-xs transition-colors border flex items-center justify-between gap-2 cursor-pointer ${
                          isSelected
                            ? 'bg-[#E7D5BE] border-[#B85C38] text-[#292724] font-bold'
                            : 'bg-white border-[#E7D5BE] hover:bg-[#FAF6EF] text-[#292724]'
                        }`}
                      >
                        <div className="truncate">
                          <span className="font-black mr-1.5">{s.code}</span>
                          <span className="text-[#8A5A44] font-medium">({s.date.split('-').reverse().join('/')}): </span>
                          <span className="truncate">{itemsText}</span>
                        </div>
                        <span className="text-emerald-800 font-bold shrink-0">R$ {s.totalValue.toFixed(2)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Delivery Address */}
            <FormField
              label="Endereço de Entrega"
              htmlFor="del-address"
              required
              hint={
                address ? (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-bold text-[#B85C38] hover:underline flex items-center gap-1"
                  >
                    <MapPin className="w-3 h-3 text-[#B85C38]" />
                    <span>Abrir no Maps</span>
                  </a>
                ) : undefined
              }
            >
              <Input
                id="del-address"
                type="text"
                required
                placeholder="Ex: Rua das Palmeiras, 140 - Bairro Jardim, Campinas - SP"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </FormField>

            {/* Phone & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Telefone / WhatsApp" htmlFor="del-phone">
                <Input
                  id="del-phone"
                  type="text"
                  placeholder="Ex: (19) 99876-5432"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </FormField>

              <FormField label="Data Prevista" htmlFor="del-date" required>
                <Input
                  id="del-date"
                  type="date"
                  required
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                />
              </FormField>
            </div>

            {/* Shipping Fee & Courier */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Valor do Frete (R$)" htmlFor="del-shipping">
                <Input
                  id="del-shipping"
                  type="number"
                  step="0.01"
                  min={0}
                  value={shippingFee}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setShippingFee(e.target.value)}
                  placeholder="0.00"
                  className="font-semibold"
                />
              </FormField>

              <FormField label="Entregador / Veículo" htmlFor="del-courier">
                <Input
                  id="del-courier"
                  type="text"
                  placeholder="Ex: Furgão do Zico / Carlos"
                  value={deliveryPerson}
                  onChange={(e) => setDeliveryPerson(e.target.value)}
                />
              </FormField>
            </div>

            {/* Status Selection */}
            <div>
              <span className="block text-xs font-bold text-[#292724] mb-1.5">Status da Entrega:</span>
              <div className="grid grid-cols-3 gap-2">
                {(['Pendente', 'A caminho', 'Entregue'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatus(st)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      status === st
                        ? st === 'Entregue'
                          ? 'bg-emerald-700 border-emerald-800 text-white shadow-2xs'
                          : st === 'A caminho'
                          ? 'bg-blue-700 border-blue-800 text-white shadow-2xs'
                          : 'bg-[#B85C38] border-[#9E4A2A] text-white shadow-2xs'
                        : 'bg-[#FAF6EF] border-[#E7D5BE] text-[#292724] hover:bg-[#E7D5BE]'
                    }`}
                  >
                    {st === 'Pendente' && '⏳ Pendente'}
                    {st === 'A caminho' && '🚚 A caminho'}
                    {st === 'Entregue' && '✓ Entregue'}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <FormField label="Observações / Itens a Entregar" htmlFor="del-notes">
              <textarea
                id="del-notes"
                rows={2}
                placeholder="Ex: 2x Vaso Bojudo Terracota, 1x Fonte Cascata. Cuidado: Peças frágeis."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-white border border-[#D4BEA2] rounded-xl p-2.5 text-[#292724] text-sm focus:border-[#B85C38] focus:ring-2 focus:ring-[#B85C38]/20 outline-hidden transition-all"
              />
              {/* Preset observation buttons */}
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                {['Cuidado: Frágil', 'Ligar 30 min antes', 'Entregar na portaria', 'Receber restante no local'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setNotes(prev => prev ? `${prev} | ${tag}` : tag)}
                    className="text-[11px] bg-[#FAF6EF] hover:bg-[#E7D5BE] text-[#292724] font-bold px-2 py-0.5 rounded-md cursor-pointer transition-colors"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </FormField>

            {/* Modal Footer Actions */}
            <div className="p-3.5 border-t border-[#E7D5BE] flex items-center justify-end gap-2 shrink-0">
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
                {editingDelivery ? 'Salvar Alterações' : 'Confirmar Agendamento'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deliveryToDelete && (
        <Modal
          isOpen={!!deliveryToDelete}
          onClose={() => setDeliveryToDelete(null)}
          title="Excluir Agendamento de Entrega?"
          description={`Tem certeza que deseja remover o agendamento de entrega para ${deliveryToDelete.customerName} (${deliveryToDelete.address})?`}
          size="sm"
        >
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setDeliveryToDelete(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
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
