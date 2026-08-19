import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ShoppingCart, 
  Plus, 
  Mic, 
  Search, 
  FileText, 
  Trash2, 
  Edit3, 
  AlertTriangle, 
  MessageSquare,
  UserCheck,
  UserPlus,
  ChevronDown,
  User,
  Check
} from 'lucide-react';
import { StorageService, subscribeStorage } from '../services/storage';
import { Sale, Product, PaymentMethod, Customer } from '../types';
import { 
  Button, 
  Card, 
  Modal, 
  FormField, 
  Input, 
  Select, 
  Textarea, 
  StatusBadge, 
  EmptyState, 
  ConfirmModal, 
  useToast 
} from '../components/ui';

interface SalesViewProps {
  onOpenVoiceModal?: () => void;
}

export const SalesView: React.FC<SalesViewProps> = () => {
  const { showSuccess, showError } = useToast();
  const [sales, setSales] = useState<Sale[]>(() => StorageService.getSales());
  const [products, setProducts] = useState<Product[]>(() => StorageService.getProducts());
  const [customers, setCustomers] = useState<Customer[]>(() => StorageService.getCustomers());
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [selectedReceiptSale, setSelectedReceiptSale] = useState<Sale | null>(null);
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);

  // Customer Selection State (Select from list vs Manual typing)
  const [customerMode, setCustomerMode] = useState<'select' | 'manual'>('select');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const customerDropdownRef = useRef<HTMLDivElement>(null);

  // Sale Form state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState<number | string>(1);
  const [unitPrice, setUnitPrice] = useState<number | string>(0);
  const [discountPercent, setDiscountPercent] = useState<number | string>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Pix');
  const [paidValue, setPaidValue] = useState<number | string>(0);
  const [notes, setNotes] = useState('');

  const refreshData = () => {
    setSales(StorageService.getSales());
    setProducts(StorageService.getProducts());
    setCustomers(StorageService.getCustomers());
  };

  useEffect(() => {
    const unsub = subscribeStorage(() => {
      refreshData();
    });
    return () => unsub();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target as Node)) {
        setIsCustomerDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCustomerList = useMemo(() => {
    if (!customerSearchQuery.trim()) return customers;
    const q = customerSearchQuery.toLowerCase().trim();
    return customers.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q)) ||
      (c.city && c.city.toLowerCase().includes(q)) ||
      (c.type && c.type.toLowerCase().includes(q))
    );
  }, [customers, customerSearchQuery]);

  const numQuantity = typeof quantity === 'number' ? quantity : (parseInt(String(quantity), 10) || 0);
  const numUnitPrice = typeof unitPrice === 'number' ? unitPrice : (parseFloat(String(unitPrice)) || 0);
  const numDiscountPercent = Math.min(100, Math.max(0, typeof discountPercent === 'number' ? discountPercent : (parseFloat(String(discountPercent)) || 0)));
  const numPaidValue = typeof paidValue === 'number' ? paidValue : (parseFloat(String(paidValue)) || 0);

  const subtotal = numUnitPrice * numQuantity;
  const discountAmount = (subtotal * numDiscountPercent) / 100;
  const totalVal = Math.max(0, subtotal - discountAmount);

  const handleSelectCustomer = (c: Customer) => {
    setSelectedCustomerId(c.id);
    setCustomerName(c.name);
    setCustomerPhone(c.phone || c.whatsapp || '');
    setCustomerSearchQuery('');
    setIsCustomerDropdownOpen(false);
  };

  const openNewSaleModal = () => {
    setEditingSale(null);
    setCustomerMode(customers.length > 0 ? 'select' : 'manual');
    setSelectedCustomerId('');
    setCustomerSearchQuery('');
    setCustomerName('');
    setCustomerPhone('');
    setIsCustomerDropdownOpen(false);

    const firstProd = products[0];
    setSelectedProductId(firstProd?.id || '');
    setQuantity(1);
    const initialPrice = firstProd?.price || 0;
    setUnitPrice(initialPrice);
    setDiscountPercent(0);
    setPaymentMethod('Pix');
    setPaidValue(initialPrice);
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditSaleModal = (sale: Sale) => {
    setEditingSale(sale);
    setCustomerMode('manual');
    setSelectedCustomerId(sale.customerId || '');
    setCustomerSearchQuery('');
    setCustomerName(sale.customerName);
    setIsCustomerDropdownOpen(false);

    const firstItem = sale.items[0];
    setSelectedProductId(firstItem?.productId || '');
    const itemQty = firstItem?.quantity ?? 1;
    const itemPrice = firstItem?.unitPrice ?? 0;
    setQuantity(itemQty);
    setUnitPrice(itemPrice);

    let pct = sale.discountPercent ?? 0;
    const itemSubtotal = itemQty * itemPrice;
    if (pct === 0 && sale.discount > 0 && itemSubtotal > 0) {
      pct = Math.round((sale.discount / itemSubtotal) * 100);
    }
    setDiscountPercent(pct);
    setPaymentMethod(sale.paymentMethod);
    setPaidValue(sale.paidValue ?? 0);
    setNotes(sale.notes || '');
    setIsModalOpen(true);
  };

  const handleProductChange = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = products.find(p => p.id === prodId);
    if (prod) {
      const newPrice = prod.price;
      setUnitPrice(newPrice);
      const newSub = newPrice * numQuantity;
      const newDisc = (newSub * numDiscountPercent) / 100;
      const newTotal = Math.max(0, newSub - newDisc);
      if (paymentMethod === 'Fiado') {
        setPaidValue(0);
      } else {
        setPaidValue(newTotal);
      }
    }
  };

  const handleQuantityChange = (val: string) => {
    setQuantity(val);
    const parsedQty = parseInt(val, 10) || 0;
    const newSub = numUnitPrice * parsedQty;
    const newDisc = (newSub * numDiscountPercent) / 100;
    const newTotal = Math.max(0, newSub - newDisc);
    if (paymentMethod === 'Fiado') {
      setPaidValue(0);
    } else {
      setPaidValue(newTotal);
    }
  };

  const adjustQty = (delta: number) => {
    const next = Math.max(1, numQuantity + delta);
    setQuantity(next);
    const newSub = numUnitPrice * next;
    const newDisc = (newSub * numDiscountPercent) / 100;
    const newTotal = Math.max(0, newSub - newDisc);
    if (paymentMethod === 'Fiado') {
      setPaidValue(0);
    } else {
      setPaidValue(newTotal);
    }
  };

  const handleUnitPriceChange = (val: string) => {
    setUnitPrice(val);
    const parsedPrice = parseFloat(val) || 0;
    const newSub = parsedPrice * numQuantity;
    const newDisc = (newSub * numDiscountPercent) / 100;
    const newTotal = Math.max(0, newSub - newDisc);
    if (paymentMethod === 'Fiado') {
      setPaidValue(0);
    } else {
      setPaidValue(newTotal);
    }
  };

  const handleDiscountPercentChange = (val: string) => {
    const parsed = val === '' ? '' : Math.min(100, Math.max(0, parseFloat(val) || 0));
    setDiscountPercent(parsed);
    const numericPct = typeof parsed === 'number' ? parsed : 0;
    const newDisc = (subtotal * numericPct) / 100;
    const newTotal = Math.max(0, subtotal - newDisc);
    if (paymentMethod !== 'Fiado') {
      setPaidValue(newTotal);
    }
  };

  const handlePaymentMethodChange = (method: PaymentMethod) => {
    setPaymentMethod(method);
    if (method === 'Fiado') {
      setPaidValue(0);
    } else if (numPaidValue === 0 && totalVal > 0) {
      setPaidValue(totalVal);
    }
  };

  const selectedProduct = products.find(p => p.id === selectedProductId);
  const isStockLowOrInsufficient = selectedProduct && numQuantity > 0 && selectedProduct.stock < numQuantity;

  const handleSubmitSale = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCustomerName = customerName.trim();
    if (!finalCustomerName || !selectedProductId) {
      showError('Atenção', 'Selecione ou informe o nome do cliente e selecione o produto.');
      return;
    }

    if (numQuantity <= 0) {
      showError('Atenção', 'A quantidade deve ser de no mínimo 1 unidade para registrar a venda.');
      return;
    }

    const prod = products.find(p => p.id === selectedProductId);
    if (!prod) return;

    const cleanPaidValue = Math.min(totalVal, Math.max(0, numPaidValue));
    const pendingVal = Math.max(0, totalVal - cleanPaidValue);

    let customer = customers.find(c => c.id === selectedCustomerId);
    if (!customer) {
      customer = StorageService.findOrCreateCustomerByName(finalCustomerName);
      if (customerPhone && !customer.phone) {
        customer.phone = customerPhone;
        StorageService.saveCustomer(customer, true);
      }
    }

    const saleData: Sale = {
      id: editingSale ? editingSale.id : `sale-${Date.now()}`,
      code: editingSale ? editingSale.code : `VND-${Math.floor(1000 + Math.random() * 9000)}`,
      customerId: customer.id,
      customerName: customer.name,
      items: [{
        productId: prod.id,
        productName: prod.name,
        quantity: numQuantity,
        unitPrice: numUnitPrice,
        totalPrice: numUnitPrice * numQuantity
      }],
      totalValue: totalVal,
      discount: discountAmount,
      discountPercent: numDiscountPercent,
      paidValue: cleanPaidValue,
      pendingValue: pendingVal,
      paymentMethod,
      date: editingSale ? editingSale.date : new Date().toISOString().split('T')[0],
      notes,
      status: pendingVal === 0 ? 'Concluída' : (cleanPaidValue > 0 ? 'Parcial' : 'Pendente')
    };

    StorageService.saveSale(saleData);
    refreshData();
    setIsModalOpen(false);
    showSuccess(
      editingSale ? 'Venda Atualizada' : 'Venda Registrada',
      `Venda ${saleData.code} para ${customer.name} salva com sucesso!`
    );
  };

  const confirmDeleteSale = () => {
    if (!saleToDelete) return;
    StorageService.deleteSale(saleToDelete.id);
    refreshData();
    setSaleToDelete(null);
    showSuccess('Venda Excluída', 'A venda foi removida com sucesso e os registros de auditoria foram atualizados.');
  };

  const filteredSales = sales.filter(s =>
    s.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.items.some(i => i.productName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-20 font-brand-sans">
      {/* Header View */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#292724] dark:text-[#F7F1E7] font-brand-serif flex items-center gap-3">
            <ShoppingCart className="w-7 h-7 text-[#B85C38]" />
            <span>Vendas & Saídas de Caixa</span>
          </h2>
          <p className="text-sm sm:text-base text-[#5C5852] dark:text-[#C9BFA8] mt-1">
            Lance pedidos rápidos, consulte histórico de vendas e emita recibos térmicos.
          </p>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Button
            onClick={openNewSaleModal}
            variant="primary"
            size="md"
            icon={Plus}
            className="w-full sm:w-auto"
          >
            Nova Venda
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card variant="flat" className="p-4 flex items-center space-x-3">
        <Search className="w-5 h-5 text-[#8A5A44] dark:text-[#C9BFA8] shrink-0" />
        <Input
          id="sales-search-input"
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por cliente, código (ex: VND-1020) ou produto..."
          className="border-none bg-transparent focus:ring-0 p-0 text-base"
          aria-label="Buscar vendas"
        />
      </Card>

      {/* Sales List Table */}
      <Card variant="default" className="p-0 overflow-hidden">
        {/* Mobile View: Cards */}
        <div className="block md:hidden divide-y divide-[#E7D5BE] dark:divide-stone-800">
          {filteredSales.length === 0 ? (
            <div className="p-10 text-center">
              <EmptyState
                title="Nenhuma venda encontrada"
                description="Lançamentos rápidos baixam o estoque automaticamente e alimentam o fluxo de caixa."
                actionLabel="Lançar Primeira Venda"
                onAction={openNewSaleModal}
              />
            </div>
          ) : (
            filteredSales.map((sale) => (
              <div key={sale.id} className="p-4 space-y-3 hover:bg-[#F7F1E7]/50 dark:hover:bg-stone-800/50 transition-colors">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs sm:text-sm font-bold text-[#8A5A44] dark:text-[#D67855] bg-[#FAF6EF] dark:bg-stone-800 px-2.5 py-1 rounded-lg border border-[#E7D5BE] dark:border-stone-700">
                      {sale.code}
                    </span>
                    <span className="text-xs sm:text-sm text-[#5C5852] dark:text-[#C9BFA8]">
                      {new Date(sale.date).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <StatusBadge status={sale.status} />
                </div>

                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-black text-[#292724] dark:text-[#F7F1E7] text-lg">
                      {sale.customerName}
                    </h3>
                    <p className="text-sm text-[#5C5852] dark:text-[#C9BFA8] mt-0.5">
                      {sale.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-[#292724] dark:text-[#F7F1E7] font-mono">
                      R$ {sale.totalValue.toFixed(2)}
                    </p>
                    <span className="text-xs font-bold text-[#8A5A44] dark:text-[#C9BFA8]">
                      {sale.paymentMethod}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-1 pt-2 border-t border-[#E7D5BE] dark:border-stone-800">
                  <Button
                    onClick={() => openEditSaleModal(sale)}
                    variant="ghost"
                    size="sm"
                    icon={Edit3}
                    ariaLabel={`Editar venda ${sale.code}`}
                  />
                  <Button
                    onClick={() => setSelectedReceiptSale(sale)}
                    variant="ghost"
                    size="sm"
                    icon={FileText}
                    ariaLabel={`Ver recibo da venda ${sale.code}`}
                  />
                  <Button
                    onClick={() => setSaleToDelete(sale)}
                    variant="ghost"
                    size="sm"
                    icon={Trash2}
                    ariaLabel={`Excluir venda ${sale.code}`}
                    className="text-rose-700 hover:bg-rose-100 dark:hover:bg-rose-900/30"
                  />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block overflow-x-auto rounded-xl">
          <table className="w-full min-w-[760px] text-left text-sm sm:text-base font-brand-sans">
            <thead className="bg-[#E7D5BE]/60 dark:bg-[#2E2A26] text-[#8A5A44] dark:text-[#D67855] font-bold border-b border-[#E7D5BE] dark:border-stone-800">
              <tr>
                <th className="p-4 whitespace-nowrap text-sm font-bold uppercase tracking-wider">Código / Data</th>
                <th className="p-4 text-sm font-bold uppercase tracking-wider">Cliente</th>
                <th className="p-4 text-sm font-bold uppercase tracking-wider">Itens Vendidos</th>
                <th className="p-4 text-sm font-bold uppercase tracking-wider">Pagamento</th>
                <th className="p-4 text-right text-sm font-bold uppercase tracking-wider">Valor Total</th>
                <th className="p-4 whitespace-nowrap text-sm font-bold uppercase tracking-wider">Status</th>
                <th className="p-4 text-right whitespace-nowrap text-sm font-bold uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7D5BE]/60 dark:divide-stone-800">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-[#5C5852] dark:text-[#C9BFA8]">
                    Nenhuma venda encontrada para o filtro atual.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-[#F7F1E7]/80 dark:hover:bg-[#2E2A26] transition-colors">
                    <td className="p-4 whitespace-nowrap">
                      <span className="font-mono font-bold text-xs sm:text-sm text-[#8A5A44] dark:text-[#D67855] bg-[#FAF6EF] dark:bg-stone-800 px-2.5 py-1 rounded-lg border border-[#E7D5BE] dark:border-stone-700 block w-max">
                        {sale.code}
                      </span>
                      <span className="text-xs text-[#5C5852] dark:text-[#C9BFA8] mt-1 block">
                        {new Date(sale.date).toLocaleDateString('pt-BR')}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-[#292724] dark:text-[#F7F1E7]">
                      {sale.customerName}
                    </td>
                    <td className="p-4 text-[#5C5852] dark:text-[#C9BFA8]">
                      {sale.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-[#292724] dark:text-[#F7F1E7]">
                        {sale.paymentMethod}
                      </span>
                      {sale.discount > 0 && (
                        <span className="block text-xs text-[#8A5A44] dark:text-[#D67855]">
                          Desc: R$ {sale.discount.toFixed(2)}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right font-black text-lg text-[#292724] dark:text-[#F7F1E7] font-mono">
                      R$ {sale.totalValue.toFixed(2)}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <StatusBadge status={sale.status} />
                    </td>
                    <td className="p-4 text-right space-x-1 whitespace-nowrap">
                      <Button
                        onClick={() => openEditSaleModal(sale)}
                        variant="ghost"
                        size="sm"
                        icon={Edit3}
                        ariaLabel={`Editar venda ${sale.code}`}
                      />
                      <Button
                        onClick={() => setSelectedReceiptSale(sale)}
                        variant="ghost"
                        size="sm"
                        icon={FileText}
                        ariaLabel={`Ver recibo da venda ${sale.code}`}
                      />
                      <Button
                        onClick={() => setSaleToDelete(sale)}
                        variant="ghost"
                        size="sm"
                        icon={Trash2}
                        ariaLabel={`Excluir venda ${sale.code}`}
                        className="text-rose-700 hover:bg-rose-100 dark:hover:bg-rose-900/30"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Sale Modal (New & Edit) */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingSale ? `Editar Venda ${editingSale.code}` : 'Lançar Nova Venda Manual'}
          description="A venda atualiza automaticamente o estoque das peças e o caixa financeiro."
          size="lg"
        >
          <form onSubmit={handleSubmitSale} className="space-y-4 font-brand-sans">
            
            {/* Customer Selection Component with Clear Option to Pick Registered or Type */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm sm:text-base font-bold text-[#292724] dark:text-[#F7F1E7]">
                  Cliente *
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCustomerMode('select');
                      setIsCustomerDropdownOpen(true);
                    }}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                      customerMode === 'select'
                        ? 'bg-[#B85C38] text-white shadow-xs'
                        : 'bg-[#FAF6EF] dark:bg-stone-800 text-[#5C5852] dark:text-[#C9BFA8] hover:bg-[#E7D5BE]'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Cadastrados ({customers.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomerMode('manual');
                      setIsCustomerDropdownOpen(false);
                    }}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                      customerMode === 'manual'
                        ? 'bg-[#B85C38] text-white shadow-xs'
                        : 'bg-[#FAF6EF] dark:bg-stone-800 text-[#5C5852] dark:text-[#C9BFA8] hover:bg-[#E7D5BE]'
                    }`}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Digitar Novo</span>
                  </button>
                </div>
              </div>

              {customerMode === 'select' ? (
                <div className="relative" ref={customerDropdownRef}>
                  <div
                    onClick={() => setIsCustomerDropdownOpen(!isCustomerDropdownOpen)}
                    className="w-full px-4 py-2.5 sm:py-3 rounded-xl border border-[#E7D5BE] dark:border-stone-700 bg-[#FAF6EF] dark:bg-[#1A1816] text-[#292724] dark:text-[#F7F1E7] text-sm sm:text-base cursor-pointer flex items-center justify-between min-h-[44px]"
                  >
                    <span className={customerName ? 'font-bold' : 'text-[#5C5852]/70 dark:text-stone-400'}>
                      {customerName || 'Selecione um cliente cadastrado...'}
                    </span>
                    <ChevronDown className="w-5 h-5 text-[#8A5A44] shrink-0" />
                  </div>

                  {isCustomerDropdownOpen && (
                    <div className="absolute z-50 left-0 right-0 top-full mt-1.5 bg-[#FAF6EF] dark:bg-[#1A1816] border-2 border-[#B85C38] rounded-2xl shadow-xl p-2.5 space-y-2 max-h-72 flex flex-col">
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8A5A44]" />
                        <input
                          type="text"
                          autoFocus
                          placeholder="Buscar cliente por nome, telefone ou cidade..."
                          value={customerSearchQuery}
                          onChange={(e) => setCustomerSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-[#E7D5BE] dark:border-stone-700 bg-white dark:bg-stone-800 text-[#292724] dark:text-[#F7F1E7] focus:outline-none focus:ring-2 focus:ring-[#B85C38]"
                        />
                      </div>

                      <div className="overflow-y-auto space-y-1 flex-1">
                        {filteredCustomerList.length === 0 ? (
                          <div className="p-4 text-center text-sm text-[#5C5852] dark:text-[#C9BFA8]">
                            Nenhum cliente cadastrado encontrado com "{customerSearchQuery}".
                            <button
                              type="button"
                              onClick={() => {
                                setCustomerName(customerSearchQuery);
                                setCustomerMode('manual');
                                setIsCustomerDropdownOpen(false);
                              }}
                              className="block mx-auto mt-2 text-xs font-bold text-[#B85C38] underline"
                            >
                              Usar "{customerSearchQuery}" como novo cliente
                            </button>
                          </div>
                        ) : (
                          filteredCustomerList.map(c => {
                            const isSelected = c.name === customerName;
                            return (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => handleSelectCustomer(c)}
                                className={`w-full text-left p-3 rounded-xl transition-colors flex items-center justify-between cursor-pointer ${
                                  isSelected
                                    ? 'bg-[#B85C38] text-white'
                                    : 'hover:bg-[#E7D5BE]/60 dark:hover:bg-stone-800 text-[#292724] dark:text-[#F7F1E7]'
                                }`}
                              >
                                <div>
                                  <p className="font-bold text-sm sm:text-base">{c.name}</p>
                                  <p className={`text-xs ${isSelected ? 'text-white/80' : 'text-[#8A5A44] dark:text-[#C9BFA8]'}`}>
                                    {c.type || 'Cliente'} {c.city ? `• ${c.city}` : ''} {c.phone ? `• ${c.phone}` : ''}
                                  </p>
                                </div>
                                {isSelected && <Check className="w-5 h-5 text-white" />}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Input
                    id="sale-customer-name"
                    type="text"
                    required
                    placeholder="Digite o nome completo do cliente..."
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                  <Input
                    id="sale-customer-phone"
                    type="text"
                    placeholder="Telefone / WhatsApp (opcional)"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Peça Cerâmica / Produto" htmlFor="sale-product-select" required>
                <Select
                  id="sale-product-select"
                  value={selectedProductId}
                  onChange={(e) => handleProductChange(e.target.value)}
                  required
                >
                  <option value="">Selecione uma peça...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Estoque: {p.stock} un | R$ {p.price.toFixed(2)})
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Quantidade (Unidades)" htmlFor="sale-quantity" required>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => adjustQty(-1)}
                    className="w-11 h-11 rounded-xl bg-[#E7D5BE] dark:bg-stone-700 text-[#292724] dark:text-[#F7F1E7] font-black text-xl hover:bg-[#D4BEA2] transition-colors cursor-pointer flex items-center justify-center shrink-0"
                    aria-label="Diminuir quantidade"
                  >
                    -
                  </button>
                  <Input
                    id="sale-quantity"
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={(e) => handleQuantityChange(e.target.value)}
                    className="text-center font-bold text-lg min-h-[44px]"
                  />
                  <button
                    type="button"
                    onClick={() => adjustQty(1)}
                    className="w-11 h-11 rounded-xl bg-[#E7D5BE] dark:bg-stone-700 text-[#292724] dark:text-[#F7F1E7] font-black text-xl hover:bg-[#D4BEA2] transition-colors cursor-pointer flex items-center justify-center shrink-0"
                    aria-label="Aumentar quantidade"
                  >
                    +
                  </button>
                </div>
              </FormField>
            </div>

            {isStockLowOrInsufficient && (
              <div className="p-3.5 bg-amber-100 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 rounded-xl text-amber-900 dark:text-amber-200 text-sm flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 shrink-0 text-amber-700" />
                <span>
                  Atenção: A quantidade informada ({numQuantity} un) é maior que o estoque atual disponível ({selectedProduct?.stock} un). A venda será concluída e o saldo ficará negativo.
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField label="Preço Unitário (R$)" htmlFor="sale-unit-price" required>
                <Input
                  id="sale-unit-price"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={unitPrice}
                  onChange={(e) => handleUnitPriceChange(e.target.value)}
                />
              </FormField>

              <FormField label="Desconto (%)" htmlFor="sale-discount-percent">
                <Input
                  id="sale-discount-percent"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0%"
                  value={discountPercent}
                  onChange={(e) => handleDiscountPercentChange(e.target.value)}
                />
              </FormField>

              <FormField label="Forma de Pagamento" htmlFor="sale-payment-method" required>
                <Select
                  id="sale-payment-method"
                  value={paymentMethod}
                  onChange={(e) => handlePaymentMethodChange(e.target.value as PaymentMethod)}
                >
                  <option value="Pix">Pix</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Cartão">Cartão de Crédito/Débito</option>
                  <option value="Transferência">Transferência Bancária</option>
                  <option value="Fiado">Fiado (A Prazo / Recebível)</option>
                  <option value="Misto">Misto</option>
                </Select>
              </FormField>
            </div>

            {/* Total / Paid Calculation Box */}
            <div className="p-4 bg-[#FAF6EF] dark:bg-[#1A1816] rounded-2xl border border-[#E7D5BE] dark:border-stone-800 space-y-2">
              <div className="flex justify-between items-center text-sm sm:text-base">
                <span className="text-[#5C5852] dark:text-[#C9BFA8]">Subtotal:</span>
                <span className="font-mono font-bold text-[#292724] dark:text-[#F7F1E7]">R$ {subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between items-center text-sm sm:text-base text-[#8A5A44] dark:text-[#D67855]">
                  <span>Desconto ({numDiscountPercent}%):</span>
                  <span className="font-mono font-bold">- R$ {discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-lg sm:text-xl font-black border-t border-[#E7D5BE] dark:border-stone-800 pt-2 text-[#292724] dark:text-[#F7F1E7]">
                <span>Total a Pagar:</span>
                <span className="font-mono text-[#B85C38] dark:text-[#D98A5B]">R$ {totalVal.toFixed(2)}</span>
              </div>
            </div>

            <FormField label="Observações da Venda" htmlFor="sale-notes">
              <Textarea
                id="sale-notes"
                rows={2}
                placeholder="Ex: Cliente vai retirar na próxima semana; embalagem especial de presente..."
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
                {editingSale ? 'Salvar Alterações' : 'Concluir Venda'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation */}
      {saleToDelete && (
        <ConfirmModal
          isOpen={!!saleToDelete}
          onClose={() => setSaleToDelete(null)}
          onConfirm={confirmDeleteSale}
          title="Excluir Venda"
          message={`Tem certeza que deseja excluir a venda ${saleToDelete.code} de ${saleToDelete.customerName}? O estoque correspondente será reajustado.`}
          confirmLabel="Excluir Venda"
          variant="danger"
        />
      )}

      {/* Receipt Thermal Modal */}
      {selectedReceiptSale && (
        <Modal
          isOpen={!!selectedReceiptSale}
          onClose={() => setSelectedReceiptSale(null)}
          title="Comprovante Não Fiscal"
          size="sm"
        >
          <div className="font-mono text-xs sm:text-sm bg-[#FAF6EF] p-4 rounded-xl border border-[#E7D5BE] text-[#292724] space-y-3">
            <div className="text-center border-b border-dashed border-[#8A5A44] pb-2">
              <h4 className="font-bold text-base">OLARIA DO ZICO</h4>
              <p className="text-xs text-[#5C5852]">Cerâmica Artesanal & Utilitários</p>
              <p className="text-[11px] text-[#5C5852]">Data: {new Date(selectedReceiptSale.date).toLocaleDateString('pt-BR')}</p>
            </div>

            <div>
              <p><strong>Comprovante:</strong> {selectedReceiptSale.code}</p>
              <p><strong>Cliente:</strong> {selectedReceiptSale.customerName}</p>
              <p><strong>Pagamento:</strong> {selectedReceiptSale.paymentMethod}</p>
            </div>

            <div className="border-t border-b border-dashed border-[#8A5A44] py-2 space-y-1">
              {selectedReceiptSale.items.map((item, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>{item.quantity}x {item.productName}</span>
                  <span>R$ {item.totalPrice.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-0.5 text-right font-bold">
              {selectedReceiptSale.discount > 0 && (
                <p className="text-xs text-[#8A5A44]">Desconto: - R$ {selectedReceiptSale.discount.toFixed(2)}</p>
              )}
              <p className="text-base text-[#B85C38]">TOTAL: R$ {selectedReceiptSale.totalValue.toFixed(2)}</p>
            </div>

            <div className="text-center text-[10px] text-[#5C5852] pt-2 border-t border-dashed border-[#8A5A44]">
              Agradecemos a preferência!
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSelectedReceiptSale(null)}
            >
              Fechar
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};
