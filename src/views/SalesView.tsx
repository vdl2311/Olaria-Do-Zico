import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Mic, Search, Filter, CheckCircle, Clock, AlertCircle, FileText, X, Trash2, Edit3, AlertTriangle, Users, MessageSquare } from 'lucide-react';
import { StorageService, subscribeStorage } from '../services/storage';
import { Sale, Product, PaymentMethod, Customer } from '../types';

interface SalesViewProps {
  onOpenVoiceModal: () => void;
}

export const SalesView: React.FC<SalesViewProps> = ({ onOpenVoiceModal }) => {
  const [sales, setSales] = useState<Sale[]>(() => StorageService.getSales());
  const [products, setProducts] = useState<Product[]>(() => StorageService.getProducts());
  const [customers, setCustomers] = useState<Customer[]>(() => StorageService.getCustomers());
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [selectedReceiptSale, setSelectedReceiptSale] = useState<Sale | null>(null);

  // Sale Form state
  const [customerName, setCustomerName] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState<number | string>(0);
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

  const numQuantity = typeof quantity === 'number' ? quantity : (parseInt(String(quantity), 10) || 0);
  const numUnitPrice = typeof unitPrice === 'number' ? unitPrice : (parseFloat(String(unitPrice)) || 0);
  const numDiscountPercent = Math.min(100, Math.max(0, typeof discountPercent === 'number' ? discountPercent : (parseFloat(String(discountPercent)) || 0)));
  const numPaidValue = typeof paidValue === 'number' ? paidValue : (parseFloat(String(paidValue)) || 0);

  const subtotal = numUnitPrice * numQuantity;
  const discountAmount = (subtotal * numDiscountPercent) / 100;
  const totalVal = Math.max(0, subtotal - discountAmount);

  const openNewSaleModal = () => {
    setEditingSale(null);
    setCustomerName('');
    const firstProd = products[0];
    setSelectedProductId(firstProd?.id || '');
    setQuantity(0); // Starts with 0 as requested
    const initialPrice = firstProd?.price || 0;
    setUnitPrice(initialPrice);
    setDiscountPercent(0);
    setPaymentMethod('Pix');
    setPaidValue(0);
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditSaleModal = (sale: Sale) => {
    setEditingSale(sale);
    setCustomerName(sale.customerName);
    const firstItem = sale.items[0];
    setSelectedProductId(firstItem?.productId || '');
    const itemQty = firstItem?.quantity ?? 0;
    const itemPrice = firstItem?.unitPrice ?? 0;
    setQuantity(itemQty);
    setUnitPrice(itemPrice);

    // Calculate percentage from discount if discountPercent not set
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

  const handleProductSelect = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = products.find(p => p.id === prodId);
    if (prod) {
      setUnitPrice(prod.price);
      const newSub = prod.price * numQuantity;
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
    const sanitized = val.replace(/\D/g, '');
    const newQty = sanitized === '' ? '' : parseInt(sanitized, 10);
    setQuantity(newQty);
    const numericQty = sanitized === '' ? 0 : parseInt(sanitized, 10);
    const newSub = numUnitPrice * numericQty;
    const newDisc = (newSub * numDiscountPercent) / 100;
    const newTotal = Math.max(0, newSub - newDisc);
    if (paymentMethod === 'Fiado') {
      setPaidValue(0);
    } else {
      setPaidValue(newTotal);
    }
  };

  const handleIncrementQty = () => {
    const next = numQuantity + 1;
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

  const handleDecrementQty = () => {
    const next = Math.max(0, numQuantity - 1);
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
    if (!customerName.trim() || !selectedProductId) {
      alert('Preencha o nome do cliente e selecione o produto.');
      return;
    }

    if (numQuantity <= 0) {
      alert('A quantidade deve ser de no mínimo 1 unidade para registrar a venda.');
      return;
    }

    const prod = products.find(p => p.id === selectedProductId);
    if (!prod) return;

    // Validate paidValue
    const cleanPaidValue = Math.min(totalVal, Math.max(0, numPaidValue));
    const pendingVal = Math.max(0, totalVal - cleanPaidValue);

    const customer = StorageService.findOrCreateCustomerByName(customerName);

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
  };

  const handleDeleteSale = (sale: Sale) => {
    if (confirm(`Deseja realmente cancelar e excluir a venda ${sale.code}? O estoque dos produtos será estornado automaticamente.`)) {
      StorageService.deleteSale(sale.id);
      refreshData();
    }
  };

  const filteredSales = sales.filter(s =>
    s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.items.some(i => i.productName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-amber-950 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-amber-800" />
            <span>Gestão de Vendas</span>
          </h2>
          <p className="text-xs text-amber-800/80">Controle completo com proteção de estoque e sincronia financeira.</p>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            onClick={onOpenVoiceModal}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-amber-600 hover:bg-amber-500 text-white font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all text-xs sm:text-sm"
          >
            <Mic className="w-4 h-4 animate-pulse" />
            <span>Registrar por Voz</span>
          </button>

          <button
            onClick={openNewSaleModal}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-amber-900 hover:bg-amber-800 text-amber-50 font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all text-xs sm:text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Venda Manual</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-amber-200 flex items-center space-x-3 shadow-xs">
        <Search className="w-5 h-5 text-amber-700 shrink-0" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar venda por código, cliente ou produto..."
          className="w-full bg-transparent text-sm text-amber-950 placeholder-amber-400 focus:outline-none"
        />
      </div>

      {/* Sales List */}
      <div className="bg-white border border-amber-200 rounded-2xl overflow-hidden shadow-xs">
        {/* Mobile View: Cards */}
        <div className="block md:hidden divide-y divide-amber-100">
          {filteredSales.length === 0 ? (
            <div className="p-8 text-center text-amber-800/60">
              Nenhuma venda encontrada.
            </div>
          ) : (
            filteredSales.map((sale) => (
              <div key={sale.id} className="p-4 space-y-2 hover:bg-amber-50/40 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-amber-950 text-sm">{sale.code}</span>
                    <span className="text-xs text-amber-700 ml-2">• {sale.date}</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    sale.status === 'Concluída'
                      ? 'bg-emerald-100 text-emerald-800'
                      : sale.status === 'Parcial'
                      ? 'bg-amber-200 text-amber-900'
                      : sale.status === 'Cancelada'
                      ? 'bg-neutral-200 text-neutral-800 line-through'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {sale.status}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-semibold text-amber-900 text-xs">{sale.customerName}</span>
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded font-bold text-[10px]">
                    {sale.paymentMethod}
                  </span>
                </div>

                <p className="text-xs text-amber-800 bg-amber-50/80 p-2 rounded-lg border border-amber-100">
                  {sale.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}
                </p>

                {sale.notes && (
                  <div className="flex items-start gap-1.5 text-xs text-amber-900 bg-amber-100/60 p-2 rounded-lg border border-amber-200/80">
                    <MessageSquare className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                    <p className="leading-snug">
                      <strong className="font-semibold text-amber-950">Obs:</strong> {sale.notes}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 border-t border-amber-100">
                  <div>
                    <span className="text-xs text-emerald-800 font-bold">R$ {sale.paidValue.toFixed(2)} pago</span>
                    {sale.pendingValue > 0 && (
                      <span className="text-xs text-red-600 font-bold ml-2">(Devendo R$ {sale.pendingValue.toFixed(2)})</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => openEditSaleModal(sale)}
                      className="p-1.5 text-amber-800 hover:bg-amber-100 rounded-lg"
                      title="Editar Venda"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setSelectedReceiptSale(sale)}
                      className="flex items-center space-x-1 px-2.5 py-1 text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Recibo</span>
                    </button>
                    <button
                      onClick={() => handleDeleteSale(sale)}
                      className="p-1.5 text-red-700 hover:bg-red-100 rounded-lg"
                      title="Cancelar/Excluir Venda"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-amber-900/10 text-amber-900 font-bold border-b border-amber-200">
              <tr>
                <th className="p-3.5">Código / Data</th>
                <th className="p-3.5">Cliente</th>
                <th className="p-3.5 hidden lg:table-cell">Produtos</th>
                <th className="p-3.5">Total</th>
                <th className="p-3.5">Pago / Restante</th>
                <th className="p-3.5 hidden xl:table-cell">Pagamento</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-amber-800/60">
                    Nenhuma venda encontrada.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-amber-50/60 transition-colors">
                    <td className="p-3.5">
                      <p className="font-bold text-amber-950">{sale.code}</p>
                      <p className="text-[11px] text-amber-700">{sale.date}</p>
                    </td>
                    <td className="p-3.5 font-semibold text-amber-950">{sale.customerName}</td>
                    <td className="p-3.5 text-amber-800 max-w-xs hidden lg:table-cell">
                      <p className="font-medium text-amber-950">{sale.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}</p>
                      {sale.notes && (
                        <p className="text-[11px] text-amber-900/90 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60 mt-1 flex items-center gap-1">
                          <MessageSquare className="w-3 h-3 text-amber-700 shrink-0" />
                          <span className="truncate"><strong>Obs:</strong> {sale.notes}</span>
                        </p>
                      )}
                    </td>
                    <td className="p-3.5">
                      <p className="font-black text-amber-950">R$ {sale.totalValue.toFixed(2)}</p>
                      {sale.discount > 0 && (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 block w-fit mt-0.5">
                          {sale.discountPercent ? `${sale.discountPercent}% desc.` : `- R$ ${sale.discount.toFixed(2)}`}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <p className="text-emerald-700 font-bold">R$ {sale.paidValue.toFixed(2)}</p>
                      {sale.pendingValue > 0 && (
                        <p className="text-red-600 font-bold text-[11px]">Devendo: R$ {sale.pendingValue.toFixed(2)}</p>
                      )}
                    </td>
                    <td className="p-3.5 hidden xl:table-cell">
                      <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-bold text-xs">
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        sale.status === 'Concluída'
                          ? 'bg-emerald-100 text-emerald-800'
                          : sale.status === 'Parcial'
                          ? 'bg-amber-200 text-amber-900'
                          : sale.status === 'Cancelada'
                          ? 'bg-neutral-200 text-neutral-800 line-through'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {sale.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-1">
                      <button
                        onClick={() => openEditSaleModal(sale)}
                        className="p-1.5 text-amber-800 hover:bg-amber-100 rounded-lg transition-colors"
                        title="Editar Venda"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setSelectedReceiptSale(sale)}
                        className="p-1.5 text-amber-800 hover:bg-amber-100 rounded-lg transition-colors"
                        title="Ver Comprovante"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSale(sale)}
                        className="p-1.5 text-red-700 hover:bg-red-100 rounded-lg transition-colors"
                        title="Cancelar e Excluir Venda"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sale Modal (New & Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-lg w-full border border-amber-200 shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[88vh] overflow-hidden animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-2">
            {/* Sticky Header */}
            <div className="p-4 sm:p-5 flex items-center justify-between border-b border-amber-100 shrink-0 bg-white">
              <h3 className="font-bold text-amber-950 text-base sm:text-lg">
                {editingSale ? `Editar Venda ${editingSale.code}` : 'Lançar Nova Venda Manual'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 text-2xl font-bold p-1 leading-none cursor-pointer shrink-0"
                aria-label="Fechar modal"
              >
                &times;
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSubmitSale} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 overscroll-contain text-xs sm:text-sm">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-amber-900">Nome do Cliente:</label>
                    {customers.length > 0 && (
                      <span className="text-[11px] text-amber-700 font-semibold">
                        {customers.length} cadastrados
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    list="sales-customers-list"
                    placeholder="Ex: João Silva, Floricultura ou Carlos..."
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-2.5 text-amber-950 text-sm focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200 font-medium"
                  />
                  <datalist id="sales-customers-list">
                    {customers.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.type ? `${c.type}${c.city ? ` - ${c.city}` : ''}` : c.city}
                      </option>
                    ))}
                  </datalist>
                  {/* Quick selection chips if empty */}
                  {!customerName && customers.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Recentes:</span>
                      {customers.slice(0, 4).map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setCustomerName(c.name)}
                          className="px-2 py-0.5 rounded-lg bg-amber-100/80 hover:bg-amber-200 text-amber-900 text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-amber-900">Produto:</label>
                    {selectedProduct && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        selectedProduct.stock <= selectedProduct.minStock ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        Estoque disponível: {selectedProduct.stock} un
                      </span>
                    )}
                  </div>
                  <select
                    required
                    value={selectedProductId}
                    onChange={(e) => handleProductSelect(e.target.value)}
                    className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-2.5 text-amber-950 text-sm focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
                  >
                    <option value="">Selecione o vaso / fonte...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Estoque: {p.stock} un | R$ {p.price.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>

                {isStockLowOrInsufficient && (
                  <div className="flex items-center space-x-2 bg-amber-50 border border-amber-300 text-amber-900 p-2.5 rounded-xl text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>
                      Atenção: A quantidade ({numQuantity}) é superior ao estoque disponível ({selectedProduct?.stock} un).
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-amber-900 mb-1">Quantidade:</label>
                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={handleDecrementQty}
                        className="w-10 h-10 rounded-xl bg-amber-100 hover:bg-amber-200 active:scale-95 text-amber-900 font-black text-lg flex items-center justify-center transition-all shrink-0 cursor-pointer border border-amber-300"
                        aria-label="Diminuir quantidade"
                      >
                        -
                      </button>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={quantity}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => handleQuantityChange(e.target.value)}
                        placeholder="0"
                        className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-2.5 text-center font-black text-base text-amber-950 focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
                      />
                      <button
                        type="button"
                        onClick={handleIncrementQty}
                        className="w-10 h-10 rounded-xl bg-amber-100 hover:bg-amber-200 active:scale-95 text-amber-900 font-black text-lg flex items-center justify-center transition-all shrink-0 cursor-pointer border border-amber-300"
                        aria-label="Aumentar quantidade"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-amber-900 mb-1">Preço Unitário (R$):</label>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      value={unitPrice}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => handleUnitPriceChange(e.target.value)}
                      className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-2.5 text-amber-950 text-sm font-semibold focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-bold text-amber-900">Desconto (%):</label>
                      {numDiscountPercent > 0 && (
                        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          - R$ {discountAmount.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        step="1"
                        min={0}
                        max={100}
                        value={discountPercent}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => handleDiscountPercentChange(e.target.value)}
                        placeholder="0"
                        className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-2.5 pr-8 text-amber-950 text-sm font-semibold focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
                      />
                      <span className="absolute right-3 top-2.5 text-amber-800 font-bold text-sm pointer-events-none">%</span>
                    </div>
                    {/* Quick percentage presets */}
                    <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                      {[0, 5, 10, 15, 20, 25].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => handleDiscountPercentChange(String(pct))}
                          className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                            numDiscountPercent === pct
                              ? 'bg-amber-800 text-white shadow-2xs'
                              : 'bg-amber-100/80 hover:bg-amber-200 text-amber-900'
                          }`}
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-amber-900 mb-1">Forma de Pagamento:</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => handlePaymentMethodChange(e.target.value as PaymentMethod)}
                      className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-2.5 text-amber-950 text-sm focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
                    >
                      <option value="Pix">Pix</option>
                      <option value="Dinheiro">Dinheiro</option>
                      <option value="Cartão">Cartão</option>
                      <option value="Transferência">Transferência</option>
                      <option value="Boleto">Boleto</option>
                      <option value="Fiado">Fiado / A Prazo</option>
                    </select>
                  </div>
                </div>

                <div className="bg-amber-100/70 p-3.5 rounded-xl border border-amber-200 space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-amber-800">
                    <span>Subtotal ({numQuantity} un × R$ {numUnitPrice.toFixed(2)}):</span>
                    <span className="font-semibold">R$ {subtotal.toFixed(2)}</span>
                  </div>
                  {numDiscountPercent > 0 && (
                    <div className="flex items-center justify-between text-xs text-emerald-800 font-medium">
                      <span>Desconto ({numDiscountPercent}%):</span>
                      <span className="font-bold">- R$ {discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between font-bold text-amber-950 pt-1.5 border-t border-amber-200/80">
                    <span>Total da Venda:</span>
                    <span className="text-base sm:text-lg font-black text-amber-900">R$ {totalVal.toFixed(2)}</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-amber-900">Valor Pago Agora (R$):</label>
                    <button
                      type="button"
                      onClick={() => setPaidValue(totalVal)}
                      className="text-xs text-amber-800 hover:underline font-bold cursor-pointer"
                    >
                      Pagar Total
                    </button>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    max={totalVal}
                    value={paidValue}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setPaidValue(e.target.value)}
                    className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-2.5 text-amber-950 focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200 font-bold text-emerald-800 text-sm"
                  />
                  {(totalVal - numPaidValue) > 0 ? (
                    <p className="text-xs text-red-600 font-semibold mt-1">
                      Saldo restante/fiado a receber: R$ {(totalVal - numPaidValue).toFixed(2)}
                    </p>
                  ) : (
                    <p className="text-xs text-emerald-700 font-semibold mt-1">
                      {numPaidValue > 0 ? 'Venda totalmente quitada à vista.' : 'Aguardando pagamento ou venda fiada.'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-amber-900 mb-1">Observações:</label>
                  <input
                    type="text"
                    placeholder="Ex: Entregar no sábado, cliente regular"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-2.5 text-amber-950 text-sm focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
                  />
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="p-3.5 sm:p-4 border-t border-amber-100 flex items-center justify-end gap-2 bg-amber-50/60 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm font-bold text-stone-700 hover:bg-stone-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-900 hover:bg-amber-950 text-white text-xs sm:text-sm font-bold shadow-md cursor-pointer"
                >
                  {editingSale ? 'Salvar Alterações' : 'Salvar Venda'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {selectedReceiptSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-amber-200 space-y-4">
            <div className="flex items-center justify-between border-b border-amber-200 pb-3">
              <div>
                <h3 className="font-bold text-amber-950 text-base">Comprovante de Venda</h3>
                <p className="text-xs text-amber-800">Olaria do Zico • Cerâmica Artesanal</p>
              </div>
              <button onClick={() => setSelectedReceiptSale(null)} className="text-amber-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs sm:text-sm text-amber-950 border border-amber-100 p-3 rounded-xl bg-amber-50/40">
              <p><strong>Venda:</strong> {selectedReceiptSale.code}</p>
              <p><strong>Data:</strong> {selectedReceiptSale.date}</p>
              <p><strong>Cliente:</strong> {selectedReceiptSale.customerName}</p>
              <hr className="border-amber-200 my-2" />
              <div className="space-y-1">
                <strong>Itens:</strong>
                {selectedReceiptSale.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-xs">
                    <span>{it.quantity}x {it.productName}</span>
                    <span>R$ {it.totalPrice.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <hr className="border-amber-200 my-2" />
              {selectedReceiptSale.discount > 0 && (
                <div className="space-y-1 text-xs">
                  <p className="flex justify-between text-amber-800">
                    <span>Subtotal:</span>
                    <span>R$ {(selectedReceiptSale.totalValue + selectedReceiptSale.discount).toFixed(2)}</span>
                  </p>
                  <p className="flex justify-between text-emerald-800 font-semibold">
                    <span>Desconto ({selectedReceiptSale.discountPercent ? `${selectedReceiptSale.discountPercent}%` : ''}):</span>
                    <span>- R$ {selectedReceiptSale.discount.toFixed(2)}</span>
                  </p>
                </div>
              )}
              <p className="flex justify-between font-black text-amber-950 text-sm pt-1 border-t border-amber-200">
                <span>Total:</span>
                <span>R$ {selectedReceiptSale.totalValue.toFixed(2)}</span>
              </p>
              <p className="flex justify-between text-emerald-800 font-bold">
                <span>Pago ({selectedReceiptSale.paymentMethod}):</span>
                <span>R$ {selectedReceiptSale.paidValue.toFixed(2)}</span>
              </p>
              {selectedReceiptSale.pendingValue > 0 && (
                <p className="flex justify-between text-red-600 font-bold">
                  <span>Pendente (Fiado):</span>
                  <span>R$ {selectedReceiptSale.pendingValue.toFixed(2)}</span>
                </p>
              )}
              {selectedReceiptSale.notes && (
                <div className="pt-2 border-t border-amber-200 text-xs text-amber-900 bg-amber-100/40 p-2 rounded-lg">
                  <p className="flex items-start gap-1">
                    <strong className="text-amber-950 font-bold">Obs:</strong>
                    <span>{selectedReceiptSale.notes}</span>
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedReceiptSale(null)}
                className="px-4 py-2 bg-amber-900 text-amber-50 rounded-xl font-bold text-xs"
              >
                Fechar Comprovante
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
