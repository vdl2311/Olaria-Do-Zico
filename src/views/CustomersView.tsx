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
      id: editingCustomer ? editingCustomer.id : `cust-${Date.now()}`,
      name: name.trim(),
      phone: phone.trim(),
      whatsapp: whatsapp.trim() || phone.trim(),
      type,
      city: city.trim(),
      address: address.trim(),
      cpfCnpj: cpfCnpj.trim(),
      notes: notes.trim(),
      createdAt: editingCustomer ? editingCustomer.createdAt : new Date().toISOString()
    };

    StorageService.saveCustomer(customerData);
    refreshData();
    setIsModalOpen(false);
    showSuccess(
      editingCustomer ? 'Cliente Atualizado' : 'Cliente Cadastrado',
      `"${customerData.name}" salvo com sucesso.`
    );
  };

  const confirmDeleteCustomer = () => {
    if (!customerToDelete) return;
    StorageService.deleteCustomer(customerToDelete.id);
    refreshData();
    showSuccess('Cliente Removido', `"${customerToDelete.name}" foi excluído com sucesso.`);
    setCustomerToDelete(null);
  };

  const filteredCustomers = customers.filter(c => {
    const q = searchTerm.toLowerCase();
    return c.name.toLowerCase().includes(q) ||
      (c.city && c.city.toLowerCase().includes(q)) ||
      (c.type && c.type.toLowerCase().includes(q)) ||
      (c.phone && c.phone.includes(q));
  });

  return (
    <div className="space-y-6 pb-20 font-brand-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#292724] dark:text-[#F7F1E7] font-brand-serif flex items-center gap-3">
            <Users className="w-7 h-7 text-[#B85C38]" />
            <span>Cadastro e Histórico de Clientes</span>
          </h2>
          <p className="text-sm sm:text-base text-[#5C5852] dark:text-[#C9BFA8] mt-1">
            Acompanhe compras, contatos, WhatsApp e débitos em aberto.
          </p>
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
      <Card variant="flat" className="p-4 flex items-center space-x-3">
        <Search className="w-5 h-5 text-[#8A5A44] dark:text-[#C9BFA8] shrink-0" />
        <Input
          id="customer-search-input"
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nome, cidade ou tipo (ex: Paisagista, Loja)..."
          className="border-none bg-transparent focus:ring-0 p-0 text-base"
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
              <Card key={cust.id} variant="default" className="p-5 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs uppercase font-bold text-[#8A5A44] dark:text-[#C9BFA8] bg-[#E7D5BE]/60 dark:bg-stone-700 px-2.5 py-1 rounded-lg">
                        {cust.type}
                      </span>
                      <h3 className="font-black text-[#292724] dark:text-[#F7F1E7] text-lg sm:text-xl mt-1.5">{cust.name}</h3>
                      {cust.city && (
                        <p className="text-xs sm:text-sm text-[#5C5852] dark:text-[#C9BFA8] flex items-center gap-1.5 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-[#B85C38]" />
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
                          className="p-2.5 bg-[#667052]/10 text-[#4F583D] hover:bg-[#667052]/20 rounded-xl transition-colors"
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
                        icon={Trash2}
                        className="text-rose-700 hover:bg-rose-100"
                        ariaLabel={`Excluir ${cust.name}`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm bg-[#FAF6EF] dark:bg-[#1A1816] p-3.5 rounded-xl border border-[#E7D5BE] dark:border-stone-800">
                    <div>
                      <span className="text-[#8A5A44] dark:text-[#C9BFA8] block text-xs font-bold uppercase">Total Comprado</span>
                      <span className="font-black text-[#292724] dark:text-[#F7F1E7] font-mono">R$ {totalSpent.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[#8A5A44] dark:text-[#C9BFA8] block text-xs font-bold uppercase">Débito (Fiado)</span>
                      <span className={`font-black font-mono ${pendingDebt > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-[#4F583D] dark:text-[#A4B38A]'}`}>
                        R$ {pendingDebt.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {cust.phone && (
                    <p className="text-xs sm:text-sm text-[#5C5852] dark:text-[#C9BFA8]">
                      Tel: <strong>{cust.phone}</strong>
                    </p>
                  )}

                  {cust.address && (
                    <p className="text-xs sm:text-sm text-[#5C5852] dark:text-[#C9BFA8] truncate">
                      End: {cust.address}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-[#E7D5BE] dark:border-stone-800 flex items-center justify-between">
                  <span className="text-xs text-[#8A5A44] dark:text-[#C9BFA8]">
                    {custSales.length} compra(s) realizada(s)
                  </span>
                  <Button
                    onClick={() => setSelectedCustomer(cust)}
                    variant="secondary"
                    size="sm"
                  >
                    Ver Histórico
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Customer Form Modal (New & Edit) */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingCustomer ? `Editar Cliente: ${editingCustomer.name}` : 'Cadastrar Novo Cliente'}
          size="md"
        >
          <form onSubmit={handleSaveCustomer} className="space-y-4 font-brand-sans">
            <FormField label="Nome Completo ou Razão Social" htmlFor="cust-name" required>
              <Input
                id="cust-name"
                type="text"
                required
                placeholder="Ex: Floricultura Bela Vista..."
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Tipo de Cliente" htmlFor="cust-type" required>
                <Select
                  id="cust-type"
                  value={type}
                  onChange={(e) => setType(e.target.value as CustomerType)}
                >
                  {CUSTOMER_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </Select>
              </FormField>

              <FormField label="CPF ou CNPJ" htmlFor="cust-doc">
                <Input
                  id="cust-doc"
                  type="text"
                  placeholder="000.000.000-00"
                  value={cpfCnpj}
                  onChange={(e) => setCpfCnpj(e.target.value)}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Telefone / Contato" htmlFor="cust-phone">
                <Input
                  id="cust-phone"
                  type="text"
                  placeholder="(11) 98765-4321"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </FormField>

              <FormField label="WhatsApp (Comercial)" htmlFor="cust-whatsapp">
                <Input
                  id="cust-whatsapp"
                  type="text"
                  placeholder="(11) 98765-4321"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Cidade / UF" htmlFor="cust-city">
                <Input
                  id="cust-city"
                  type="text"
                  placeholder="Ex: Cunha / SP"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </FormField>

              <FormField label="Endereço de Entrega" htmlFor="cust-address">
                <Input
                  id="cust-address"
                  type="text"
                  placeholder="Rua, Número, Bairro"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </FormField>
            </div>

            <FormField label="Observações & Notas Comerciais" htmlFor="cust-notes">
              <Textarea
                id="cust-notes"
                rows={2}
                placeholder="Ex: Prefere pagar no Pix; compra peças vitrificadas de grande porte..."
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
                {editingCustomer ? 'Salvar Alterações' : 'Cadastrar Cliente'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Customer Purchase History Modal */}
      {selectedCustomer && (
        <Modal
          isOpen={!!selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          title={`Histórico de Compras: ${selectedCustomer.name}`}
          size="lg"
        >
          <div className="space-y-4 font-brand-sans">
            <div className="p-4 bg-[#FAF6EF] dark:bg-[#1A1816] rounded-xl border border-[#E7D5BE] dark:border-stone-800 flex justify-between items-center">
              <div>
                <span className="text-xs uppercase font-bold text-[#8A5A44] dark:text-[#C9BFA8]">{selectedCustomer.type}</span>
                <h4 className="font-bold text-[#292724] dark:text-[#F7F1E7] text-lg">{selectedCustomer.name}</h4>
                <p className="text-sm text-[#5C5852] dark:text-[#C9BFA8]">{selectedCustomer.city || 'Sem cidade informada'} • {selectedCustomer.phone || 'Sem telefone'}</p>
              </div>
            </div>

            <h5 className="font-bold text-[#292724] dark:text-[#F7F1E7] text-base font-brand-serif">Vendas Vinculadas</h5>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {sales.filter(s => s.customerId === selectedCustomer.id || s.customerName.toLowerCase().includes(selectedCustomer.name.toLowerCase())).length === 0 ? (
                <p className="text-sm text-[#5C5852] dark:text-[#C9BFA8] italic">Nenhuma venda associada a este cliente.</p>
              ) : (
                sales.filter(s => s.customerId === selectedCustomer.id || s.customerName.toLowerCase().includes(selectedCustomer.name.toLowerCase())).map(sale => (
                  <div key={sale.id} className="p-3 bg-[#FAF6EF] dark:bg-[#1A1816] rounded-xl border border-[#E7D5BE] dark:border-stone-800 flex justify-between items-center text-sm">
                    <div>
                      <span className="font-mono font-bold text-xs text-[#8A5A44] dark:text-[#D67855]">{sale.code}</span>
                      <p className="font-medium text-[#292724] dark:text-[#F7F1E7]">{sale.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}</p>
                      <span className="text-xs text-[#5C5852] dark:text-[#C9BFA8]">{new Date(sale.date).toLocaleDateString('pt-BR')} • {sale.paymentMethod}</span>
                    </div>
                    <span className="font-black text-[#292724] dark:text-[#F7F1E7] font-mono">R$ {sale.totalValue.toFixed(2)}</span>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-[#E7D5BE] dark:border-stone-800">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setSelectedCustomer(null)}
              >
                Fechar
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {customerToDelete && (
        <ConfirmModal
          isOpen={!!customerToDelete}
          onClose={() => setCustomerToDelete(null)}
          onConfirm={confirmDeleteCustomer}
          title="Excluir Cliente"
          message={`Tem certeza que deseja remover "${customerToDelete.name}" da lista de clientes?`}
          confirmLabel="Excluir Cliente"
          variant="danger"
        />
      )}
    </div>
  );
};
