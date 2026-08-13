import React, { useState } from 'react';
import { Users, Plus, Phone, MessageSquare, MapPin, Building, Search, X } from 'lucide-react';
import { StorageService } from '../services/storage';
import { Customer, CustomerType } from '../types';

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
  const [customers, setCustomers] = useState<Customer[]>(() => StorageService.getCustomers());
  const [sales] = useState(() => StorageService.getSales());
  const [receivables] = useState(() => StorageService.getReceivables());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
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
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newCustomer: Customer = {
      id: `cli-${Date.now()}`,
      name: name.trim(),
      phone,
      whatsapp: whatsapp || phone,
      type,
      city,
      address,
      cpfCnpj,
      notes,
      createdAt: new Date().toISOString().split('T')[0]
    };

    StorageService.saveCustomer(newCustomer);
    refreshData();
    setIsModalOpen(false);

    // Reset Form
    setName('');
    setPhone('');
    setWhatsapp('');
    setNotes('');
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.city && c.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
    c.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-20">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-amber-950 flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-800" />
            <span>Cadastro e Histórico de Clientes</span>
          </h2>
          <p className="text-xs text-amber-800/80">Acompanhe compras, contatos, WhatsApp e débitos em aberto.</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 bg-amber-900 hover:bg-amber-800 text-amber-50 font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all text-xs sm:text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Cliente</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-3.5 rounded-2xl border border-amber-200 flex items-center space-x-3 shadow-xs">
        <Search className="w-5 h-5 text-amber-700 shrink-0" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nome, cidade ou tipo (ex: Paisagista, Loja)..."
          className="w-full bg-transparent text-sm text-amber-950 placeholder-amber-400 focus:outline-none"
        />
      </div>

      {/* Customer Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((cust) => {
          const custSales = sales.filter(s => s.customerId === cust.id || s.customerName.toLowerCase().includes(cust.name.toLowerCase()));
          const custReceivables = receivables.filter(r => r.customerId === cust.id || r.customerName.toLowerCase().includes(cust.name.toLowerCase()));
          const pendingDebt = custReceivables.filter(r => r.status !== 'Pago').reduce((acc, r) => acc + (r.amount - r.amountPaid), 0);
          const totalSpent = custSales.reduce((acc, s) => acc + s.totalValue, 0);

          return (
            <div key={cust.id} className="bg-white border border-amber-200 rounded-2xl p-4 shadow-xs space-y-3 hover:border-amber-400 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                    {cust.type}
                  </span>
                  <h3 className="font-bold text-amber-950 text-base mt-1">{cust.name}</h3>
                  {cust.city && <p className="text-xs text-amber-800 flex items-center gap-1"><MapPin className="w-3 h-3 text-amber-600" />{cust.city}</p>}
                </div>

                {cust.whatsapp && (
                  <a
                    href={`https://wa.me/${cust.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 rounded-xl transition-colors"
                    title="Abrir WhatsApp"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </a>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-amber-50/60 p-2.5 rounded-xl border border-amber-100">
                <div>
                  <span className="text-amber-700 block text-[10px]">Total Comprado</span>
                  <span className="font-bold text-amber-950">R$ {totalSpent.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-amber-700 block text-[10px]">Débito (Fiado)</span>
                  <span className={`font-bold ${pendingDebt > 0 ? 'text-red-600' : 'text-emerald-800'}`}>
                    R$ {pendingDebt.toFixed(2)}
                  </span>
                </div>
              </div>

              {cust.notes && <p className="text-xs text-amber-800/80 italic">Obs: {cust.notes}</p>}

              <button
                onClick={() => setSelectedCustomer(cust)}
                className="w-full py-2 bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold rounded-xl text-xs transition-colors"
              >
                Ver Histórico de Compras ({custSales.length})
              </button>
            </div>
          );
        })}
      </div>

      {/* New Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-amber-200 space-y-4">
            <div className="flex items-center justify-between border-b border-amber-100 pb-3">
              <h3 className="font-bold text-amber-950 text-base">Cadastrar Novo Cliente</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-amber-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-amber-900 mb-1">Nome do Cliente:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Mendes"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-2.5 text-amber-950"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-amber-900 mb-1">Telefone / WhatsApp:</label>
                  <input
                    type="text"
                    placeholder="(11) 99999-9999"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-2.5 text-amber-950"
                  />
                </div>

                <div>
                  <label className="block font-bold text-amber-900 mb-1">Tipo de Cliente:</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as CustomerType)}
                    className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-2.5 text-amber-950"
                  >
                    {CUSTOMER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-amber-900 mb-1">Cidade:</label>
                <input
                  type="text"
                  placeholder="Ex: Campinas / SP"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-2.5 text-amber-950"
                />
              </div>

              <div>
                <label className="block font-bold text-amber-900 mb-1">Observações:</label>
                <input
                  type="text"
                  placeholder="Ex: Compra em lote para loja de plantas"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-2.5 text-amber-950"
                />
              </div>

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
                  Salvar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Details History Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-amber-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-amber-100 pb-3">
              <div>
                <h3 className="font-bold text-amber-950 text-base">{selectedCustomer.name}</h3>
                <p className="text-xs text-amber-800">{selectedCustomer.type} • {selectedCustomer.city || 'Cidade N/I'}</p>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="text-amber-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-amber-900 text-xs uppercase tracking-wider">Histórico de Compras</h4>
              {sales
                .filter(s => s.customerId === selectedCustomer.id || s.customerName.toLowerCase().includes(selectedCustomer.name.toLowerCase()))
                .map((s) => (
                  <div key={s.id} className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs space-y-1">
                    <div className="flex justify-between font-bold text-amber-950">
                      <span>{s.code} ({s.date})</span>
                      <span>R$ {s.totalValue.toFixed(2)}</span>
                    </div>
                    <p className="text-amber-800">{s.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}</p>
                    <p className="text-amber-700 font-medium">Pago: R$ {s.paidValue.toFixed(2)} | Status: {s.status}</p>
                  </div>
                ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 bg-amber-900 text-amber-50 rounded-xl font-bold text-xs"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
