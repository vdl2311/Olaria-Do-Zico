import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  MessageSquare, 
  MapPin, 
  Search, 
  Trash2, 
  Edit3 
} from 'lucide-react';
import { StorageService, subscribeStorage } from '../services/storage';
import { Customer, CustomerType } from '../types';
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

export const CUSTOMER_TYPES: CustomerType[] = [
  'Cliente final',
  'Loja',
  'Revendedor',
  'Paisagista',
  'Arquiteto',
  'Decorador',
  'Empresa'
];

export const CustomersView: React.FC = () => {
  const { showSuccess } = useToast();
  const [customers, setCustomers] = useState<Customer[]>(() => StorageService.getCustomers());
  const [sales, setSales] = useState(() => StorageService.getSales());
  const [receivables, setReceivables] = useState(() => StorageService.getReceivables());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [type, setType] = useState<CustomerType>('Cliente final');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [notes, setNotes] = useState('');

  const refreshData = () => {
    setCustomers(StorageService.getCustomers());
    setSales(StorageService.getSales());
    setReceivables(StorageService.getReceivables());
  };

  useEffect(() => {
    const unsub = subscribeStorage(() => {
      refreshData();
    });
    return () => unsub();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingCustomer(null);
    setName('');
    setPhone('');
    setWhatsapp('');
    setType('Cliente final');
    setCity('');
    setAddress('');
    setCpfCnpj('');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cust: Customer) => {
    setEditingCustomer(cust);
    setName(cust.name);
    setPhone(cust.phone || '');
    setWhatsapp(cust.whatsapp || cust.phone || '');
    setType(cust.type || 'Cliente final');
    setCity(cust.city || '');
    setAddress(cust.address || '');
    setCpfCnpj(cust.cpfCnpj || '');
    setNotes(cust.notes || '');
    setIsModalOpen(true);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const customerData: Customer = {
      id: editingCustomer ? editingCustomer.id : `cli-${Date.now()}`,
      name: name.trim(),
      phone,
      whatsapp: whatsapp || phone,
      type,
      city,
      address,
      cpfCnpj,
      notes,
      createdAt: editingCustomer ? editingCustomer.createdAt : new Date().toISOString().split('T')[0]
    };

    StorageService.saveCustomer(customerData);
    refreshData();
    setIsModalOpen(false);
    setEditingCustomer(null);
    showSuccess(
      editingCustomer ? 'Cliente Atualizado' : 'Cliente Cadastrado',
      `O cadastro de ${customerData.name} foi salvo.`
    );

    if (selectedCustomer && selectedCustomer.id === customerData.id) {
      setSelectedCustomer(customerData);
    }
  };

  const handleConfirmDelete = () => {
    if (!customerToDelete) return;
    StorageService.deleteCustomer(customerToDelete.id);
    refreshData();
    if (selectedCustomer?.id === customerToDelete.id) {
      setSelectedCustomer(null);
    }
    showSuccess('Cliente Removido', `O cadastro de ${customerToDelete.name} foi excluído.`);
    setCustomerToDelete(null);
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.city && c.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
    c.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-20 font-brand-sans">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-[#292724] font-brand-serif flex items-center gap-2">
            <Users className="w-6 h-6 text-[#B85C38]" />
            <span>Cadastro e Histórico de Clientes</span>
          </h2>
          <p className="text-xs text-[#5C5852]">Acompanhe compras, contatos, WhatsApp e débitos em aberto.</p>
        </div>

        <Button
          onClick={handleOpenCreateModal}
          variant="primary"
          size="md"
          icon={Plus}
        >
          Novo Cliente
        </Button>
      </div>

      {/* Search Bar */}
      <Card variant="flat" className="p-3.5 flex items-center space-x-3">
        <Search className="w-5 h-5 text-[#8A5A44] shrink-0" />
        <Input
          id="customer-search-input"
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nome, cidade ou tipo (ex: Paisagista, Loja)..."
          className="border-none bg-transparent focus:ring-0 p-0 text-sm"
          aria-label="Buscar clientes"
        />
      </Card>

      {/* Customer Grid Cards */}
      {filteredCustomers.length === 0 ? (
        <EmptyState
          title="Nenhum cliente cadastrado"
          description="Cadastre compradores, lojas, paisagistas e arquitetos para controle de histórico, vendas e fiado."
          actionLabel="Cadastrar Primeiro Cliente"
          onAction={handleOpenCreateModal}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((cust) => {
            const custSales = sales.filter(s => s.customerId === cust.id || s.customerName.toLowerCase().includes(cust.name.toLowerCase()));
            const custReceivables = receivables.filter(r => r.customerId === cust.id || r.customerName.toLowerCase().includes(cust.name.toLowerCase()));
            const pendingDebt = custReceivables.filter(r => r.status !== 'Pago').reduce((acc, r) => acc + (r.amount - r.amountPaid), 0);
            const totalSpent = custSales.reduce((acc, s) => acc + s.totalValue, 0);

            return (
              <Card key={cust.id} variant="default" className="p-4 space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#8A5A44] bg-[#E7D5BE]/60 px-2 py-0.5 rounded-full">
                        {cust.type}
                      </span>
                      <h3 className="font-bold text-[#292724] text-base mt-1">{cust.name}</h3>
                      {cust.city && (
                        <p className="text-xs text-[#5C5852] flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-[#B85C38]" />
                          {cust.city}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center space-x-1 shrink-0">
                      {cust.whatsapp && (
                        <a
                          href={`https://wa.me/${cust.whatsapp.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-[#667052]/10 text-[#4F583D] hover:bg-[#667052]/20 rounded-xl transition-colors"
                          title="Abrir WhatsApp"
                          aria-label={`Abrir WhatsApp de ${cust.name}`}
                        >
                          <MessageSquare className="w-4 h-4" />
                        </a>
                      )}
                      <Button
                        onClick={() => handleOpenEditModal(cust)}
                        variant="ghost"
                        size="sm"
                        icon={Edit3}
                        ariaLabel={`Editar ${cust.name}`}
                      />
                      <Button
                        onClick={() => setCustomerToDelete(cust)}
                        variant="ghost"
                        size="sm"
                        className="text-rose-700"
                        ariaLabel={`Excluir ${cust.name}`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-[#FAF6EF] p-2.5 rounded-xl border border-[#E7D5BE]">
                    <div>
                      <span className="text-[#8A5A44] block text-[10px] font-bold uppercase">Total Comprado</span>
                      <span className="font-bold text-[#292724]">R$ {totalSpent.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[#8A5A44] block text-[10px] font-bold uppercase">Débito (Fiado)</span>
                      <span className={`font-bold ${pendingDebt > 0 ? 'text-rose-700' : 'text-[#4F583D]'}`}>
                        R$ {pendingDebt.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {cust.notes && (
                    <div className="text-xs text-[#292724] bg-[#FAF6EF] px-2.5 py-1.5 rounded-lg border border-[#E7D5BE]">
                      <strong className="font-semibold text-[#8A5A44]">Obs:</strong> {cust.notes}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-[#E7D5BE] flex items-center gap-2">
                  <Button
                    onClick={() => setSelectedCustomer(cust)}
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                  >
                    Histórico ({custSales.length})
                  </Button>
                  <Button
                    onClick={() => setCustomerToDelete(cust)}
                    variant="ghost"
                    size="sm"
                    icon={Trash2}
                    className="text-rose-700"
                  />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Customer Modal (Create & Edit) */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setEditingCustomer(null); }}
          title={editingCustomer ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}
          description="Acompanhe contatos, categoria do comprador e preferências."
          size="md"
        >
          <form onSubmit={handleSaveCustomer} className="space-y-3 font-brand-sans">
            <FormField label="Nome do Cliente" htmlFor="cust-name-input" required>
              <Input
                id="cust-name-input"
                type="text"
                required
                placeholder="Ex: Carlos Mendes"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Telefone / WhatsApp" htmlFor="cust-whatsapp-input">
                <Input
                  id="cust-whatsapp-input"
                  type="text"
                  placeholder="(11) 99999-9999"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                />
              </FormField>

              <FormField label="Tipo de Cliente" htmlFor="cust-type-select" required>
                <Select
                  id="cust-type-select"
                  value={type}
                  onChange={(e) => setType(e.target.value as CustomerType)}
                >
                  {CUSTOMER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </Select>
              </FormField>
            </div>

            <FormField label="Cidade / Estado" htmlFor="cust-city-input">
              <Input
                id="cust-city-input"
                type="text"
                placeholder="Ex: Campinas / SP"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </FormField>

            <FormField label="Endereço" htmlFor="cust-address-input">
              <Input
                id="cust-address-input"
                type="text"
                placeholder="Ex: Rua das Flores, 120"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </FormField>

            <FormField label="CPF ou CNPJ (opcional)" htmlFor="cust-cpf-input">
              <Input
                id="cust-cpf-input"
                type="text"
                placeholder="000.000.000-00"
                value={cpfCnpj}
                onChange={(e) => setCpfCnpj(e.target.value)}
              />
            </FormField>

            <FormField label="Observações" htmlFor="cust-notes-textarea">
              <Textarea
                id="cust-notes-textarea"
                placeholder="Ex: Compra em lote para loja de plantas"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </FormField>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#E7D5BE]">
              <Button type="button" variant="ghost" size="sm" onClick={() => { setIsModalOpen(false); setEditingCustomer(null); }}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" size="md">
                {editingCustomer ? 'Salvar Alterações' : 'Salvar Cliente'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!customerToDelete}
        onClose={() => setCustomerToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Excluir Cliente"
        message={`Tem certeza que deseja excluir o cliente "${customerToDelete?.name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Sim, Excluir Cliente"
        variant="danger"
      />

      {/* Customer Details History Modal */}
      {selectedCustomer && (
        <Modal
          isOpen={!!selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          title={selectedCustomer.name}
          description={`${selectedCustomer.type} • ${selectedCustomer.city || 'Cidade N/I'}`}
          size="md"
        >
          <div className="space-y-4 font-brand-sans">
            <h4 className="font-bold text-[#8A5A44] text-xs uppercase tracking-wider font-brand-serif">
              Histórico de Compras
            </h4>
            {sales
              .filter(s => s.customerId === selectedCustomer.id || s.customerName.toLowerCase().includes(selectedCustomer.name.toLowerCase()))
              .map((s) => (
                <div key={s.id} className="p-3 bg-[#FAF6EF] rounded-xl border border-[#E7D5BE] text-xs space-y-1">
                  <div className="flex justify-between font-bold text-[#292724]">
                    <span>{s.code} ({s.date})</span>
                    <span>R$ {s.totalValue.toFixed(2)}</span>
                  </div>
                  <p className="text-[#5C5852]">{s.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}</p>
                  <p className="text-[#8A5A44] font-medium">
                    Pago: R$ {s.paidValue.toFixed(2)} | Status: <StatusBadge status={s.status} />
                  </p>
                </div>
              ))}

            <div className="flex items-center justify-between pt-3 border-t border-[#E7D5BE]">
              <Button
                type="button"
                variant="danger"
                size="sm"
                icon={Trash2}
                onClick={() => {
                  const cust = selectedCustomer;
                  setCustomerToDelete(cust);
                }}
              >
                Excluir Cliente
              </Button>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  icon={Edit3}
                  onClick={() => {
                    const cust = selectedCustomer;
                    handleOpenEditModal(cust);
                  }}
                >
                  Editar
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCustomer(null)}
                >
                  Fechar
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
