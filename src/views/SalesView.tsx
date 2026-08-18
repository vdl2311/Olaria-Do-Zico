import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Mic, Search, FileText, Trash2, Edit3, AlertTriangle, MessageSquare } from 'lucide-react';
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
    setQuantity(0);
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
      showError('Atenção', 'Preencha o nome do cliente e selecione o produto.');
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
    showSuccess(
      editingSale ? 'Venda Atualizada' : 'Venda Registrada',
      `Venda ${saleData.code} salva com sucesso!`
    );
  };

  const confirmDeleteSale = () => {
    if (!saleToDelete) return;
    StorageService.deleteSale(saleToDelete.id);
    refreshData();
    showSuccess('Venda Cancelada', `A venda ${saleToDelete.code} foi excluída e o estoque estornado.`);
    setSaleToDelete(null);
  };

  const filteredSales = sales.filter(s =>
    s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.items.some(i => i.productName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-20 font-brand-sans">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-[#292724] font-brand-serif flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-[#B85C38]" />
            <span>Gestão de Vendas</span>
          </h2>
          <p className="text-xs text-[#5C5852]">
            Controle completo com proteção de estoque e sincronia financeira.
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

      {/* Search Bar */}
      <Card variant="flat" className="p-3">
        <div className="flex items-center space-x-3">
          <Search className="w-5 h-5 text-[#8A5A44] shrink-0" />
          <input
            type="text"
            id="search-sales-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar venda por código, cliente ou produto..."
            aria-label="Buscar venda por código, cliente ou produto"
            className="w-full bg-transparent text-xs sm:text-sm text-[#292724] placeholder-[#5C5852]/60 focus:outline-none font-medium"
          />
        </div>
      </Card>

      {/* Sales List Container */}
      <Card variant="default" className="p-0 overflow-hidden">
        {/* Mobile View: Cards */}
        <div className="block md:hidden divide-y divide-[#E7D5BE]">
          {filteredSales.length === 0 ? (
            <EmptyState
              title="Nenhuma venda encontrada"
              description="Cadastre uma nova venda ou use o assistente por voz."
              actionLabel="Lançar Nova Venda"
              onAction={openNewSaleModal}
            />
          ) : (
            filteredSales.map((sale) => (
              <div key={sale.id} className="p-4 space-y-2 hover:bg-[#F7F1E7]/50 transition-colors">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-[#292724] text-sm">{sale.code}</span>
                    <span className="text-xs text-[#8A5A44] ml-2">• {sale.date}</span>
                  </div>
                  {/* StatusBadge handles color & icon unified */}
                  <StatusBadge status={sale.status} />
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-[#8A5A44] text-xs">{sale.customerName}</span>
                  <span className="px-2 py-0.5 bg-[#E7D5BE]/60 text-[#292724] rounded-lg font-bold text-[10px]">
                    {sale.paymentMethod}
                  </span>
                </div>

                <p className="text-xs text-[#292724] bg-[#F7F1E7] p-2 rounded-xl border border-[#E7D5BE]/60">
                  {sale.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}
                </p>

                {sale.notes && (
                  <div className="flex items-start gap-1.5 text-xs text-[#292724] bg-[#FAF6EF] p-2 rounded-xl border border-[#E7D5BE]">
                    <MessageSquare className="w-3.5 h-3.5 text-[#B85C38] shrink-0 mt-0.5" />
                    <p className="leading-snug">
                      <strong className="font-semibold text-[#8A5A44]">Obs:</strong> {sale.notes}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-[#E7D5BE]">
                  <div>
                    <span className="text-xs text-[#4F583D] font-bold">R$ {sale.paidValue.toFixed(2)} pago</span>
                    {sale.pendingValue > 0 && (
                      <span className="text-xs text-rose-700 font-bold ml-2">(Devendo R$ {sale.pendingValue.toFixed(2)})</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      onClick={() => openEditSaleModal(sale)}
                      variant="ghost"
                      size="sm"
                      icon={Edit3}
                      ariaLabel={`Editar venda ${sale.code}`}
                    />
                    <Button
                      onClick={() => setSelectedReceiptSale(sale)}
                      variant="outline"
                      size="sm"
                      icon={FileText}
                    >
                      Recibo
                    </Button>
                    <Button
                      onClick={() => setSaleToDelete(sale)}
                      variant="ghost"
                      size="sm"
                      icon={Trash2}
                      ariaLabel={`Excluir venda ${sale.code}`}
                      className="text-rose-700 hover:bg-rose-100"
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Table with Smooth Scroll */}
        <div className="hidden md:block overflow-x-auto rounded-xl">
          <table className="w-full min-w-[720px] text-left text-xs sm:text-sm">
            <thead className="bg-[#E7D5BE]/50 text-[#8A5A44] font-bold border-b border-[#E7D5BE]">
              <tr>
                <th className="p-3.5 whitespace-nowrap">Código / Data</th>
                <th className="p-3.5 whitespace-nowrap">Cliente</th>
                <th className="p-3.5 hidden lg:table-cell">Produtos</th>
                <th className="p-3.5 whitespace-nowrap">Total</th>
                <th className="p-3.5 whitespace-nowrap">Pago / Restante</th>
                <th className="p-3.5 hidden xl:table-cell whitespace-nowrap">Pagamento</th>
                <th className="p-3.5 whitespace-nowrap">Status</th>
                <th className="p-3.5 text-right whitespace-nowrap">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7D5BE]/60">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-4">
                    <EmptyState
                      title="Nenhuma venda encontrada"
                      description="Cadastre uma nova venda ou altere o filtro de busca."
                      actionLabel="Lançar Venda"
                      onAction={openNewSaleModal}
                    />
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-[#F7F1E7]/60 transition-colors">
                    <td className="p-3.5">
                      <p className="font-bold text-[#292724]">{sale.code}</p>
                      <p className="text-[11px] text-[#8A5A44]">{sale.date}</p>
                    </td>
                    <td className="p-3.5 font-semibold text-[#292724]">{sale.customerName}</td>
                    <td className="p-3.5 text-[#5C5852] max-w-xs hidden lg:table-cell">
                      <p className="font-medium text-[#292724]">{sale.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}</p>
                      {sale.notes && (
                        <p className="text-[11px] text-[#5C5852] bg-[#F7F1E7] px-2 py-0.5 rounded-md border border-[#E7D5BE] mt-1 flex items-center gap-1">
                          <MessageSquare className="w-3 h-3 text-[#B85C38] shrink-0" />
                          <span className="truncate"><strong>Obs:</strong> {sale.notes}</span>
                        </p>
                      )}
                    </td>
                    <td className="p-3.5">
                      <p className="font-black text-[#292724]">R$ {sale.totalValue.toFixed(2)}</p>
                      {sale.discount > 0 && (
                        <span className="text-[10px] font-bold text-[#4F583D] bg-[#667052]/15 px-1.5 py-0.5 rounded border border-[#667052]/30 block w-fit mt-0.5">
                          {sale.discountPercent ? `${sale.discountPercent}% desc.` : `- R$ ${sale.discount.toFixed(2)}`}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <p className="text-[#4F583D] font-bold">R$ {sale.paidValue.toFixed(2)}</p>
                      {sale.pendingValue > 0 && (
                        <p className="text-rose-700 font-bold text-[11px]">Devendo: R$ {sale.pendingValue.toFixed(2)}</p>
                      )}
                    </td>
                    <td className="p-3.5 hidden xl:table-cell">
                      <span className="px-2.5 py-1 rounded-lg bg-[#E7D5BE]/60 text-[#292724] font-bold text-xs">
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <StatusBadge status={sale.status} />
                    </td>
                    <td className="p-3.5 text-right space-x-1">
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
                        className="text-rose-700 hover:bg-rose-100"
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
          <form onSubmit={handleSubmitSale} className="space-y-4">
            <FormField label="Nome do Cliente" htmlFor="sale-customer-name" required>
              <Input
                id="sale-customer-name"
                type="text"
                required
                list="sales-customers-list"
                placeholder="Ex: João Silva, Floricultura ou Carlos..."
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
              <datalist id="sales-customers-list">
                {customers.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.type ? `${c.type}${c.city ? ` - ${c.city}` : ''}` : c.city}
                  </option>
                ))}
              </datalist>
              {!customerName && customers.length > 0 && (
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  <span className="text-[10px] font-bold text-[#8A5A44] uppercase tracking-wider">Recentes:</span>
                  {customers.slice(0, 4).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCustomerName(c.name)}
                      className="px-2 py-0.5 rounded-lg bg-[#E7D5BE]/60 hover:bg-[#E7D5BE] text-[#292724] text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </FormField>

            <FormField label="Produto" htmlFor="sale-product-select" required>
              <Select
                id="sale-product-select"
                required
                value={selectedProductId}
                onChange={(e) => handleProductSelect(e.target.value)}
              >
                <option value="">Selecione o vaso / peça...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Estoque: {p.stock} un | R$ {p.price.toFixed(2)})
                  </option>
                ))}
              </Select>
            </FormField>

            {isStockLowOrInsufficient && (
              <div className="flex items-center space-x-2 bg-amber-500/10 border border-amber-500/30 text-amber-900 p-2.5 rounded-xl text-xs font-medium">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>
                  Atenção: A quantidade ({numQuantity}) é superior ao estoque disponível ({selectedProduct?.stock} un).
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Quantidade" htmlFor="sale-quantity-input" required>
                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={handleDecrementQty}
                    className="w-10 h-10 rounded-xl bg-[#E7D5BE]/60 hover:bg-[#E7D5BE] active:scale-95 text-[#292724] font-black text-lg flex items-center justify-center transition-all shrink-0 cursor-pointer border border-[#E7D5BE]"
                    aria-label="Diminuir quantidade"
                  >
                    -
                  </button>
                  <Input
                    id="sale-quantity-input"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={quantity}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => handleQuantityChange(e.target.value)}
                    className="text-center font-black text-base"
                  />
                  <button
                    type="button"
                    onClick={handleIncrementQty}
                    className="w-10 h-10 rounded-xl bg-[#E7D5BE]/60 hover:bg-[#E7D5BE] active:scale-95 text-[#292724] font-black text-lg flex items-center justify-center transition-all shrink-0 cursor-pointer border border-[#E7D5BE]"
                    aria-label="Aumentar quantidade"
                  >
                    +
                  </button>
                </div>
              </FormField>

              <FormField label="Preço Unitário (R$)" htmlFor="sale-unit-price-input" required>
                <Input
                  id="sale-unit-price-input"
                  type="number"
                  step="0.01"
                  min={0}
                  value={unitPrice}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => handleUnitPriceChange(e.target.value)}
                  className="font-semibold"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Desconto (%)" htmlFor="sale-discount-input">
                <div className="relative">
                  <Input
                    id="sale-discount-input"
                    type="number"
                    step="1"
                    min={0}
                    max={100}
                    value={discountPercent}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => handleDiscountPercentChange(e.target.value)}
                    className="pr-8 font-semibold"
                  />
                  <span className="absolute right-3 top-2.5 text-[#8A5A44] font-bold text-sm pointer-events-none">%</span>
                </div>
                <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                  {[0, 5, 10, 15, 20, 25].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => handleDiscountPercentChange(String(pct))}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                        numDiscountPercent === pct
                          ? 'bg-[#B85C38] text-white'
                          : 'bg-[#E7D5BE]/60 hover:bg-[#E7D5BE] text-[#292724]'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </FormField>

              <FormField label="Forma de Pagamento" htmlFor="sale-payment-method-select" required>
                <Select
                  id="sale-payment-method-select"
                  value={paymentMethod}
                  onChange={(e) => handlePaymentMethodChange(e.target.value as PaymentMethod)}
                >
                  <option value="Pix">Pix</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Cartão">Cartão</option>
                  <option value="Transferência">Transferência</option>
                  <option value="Boleto">Boleto</option>
                  <option value="Fiado">Fiado / A Prazo</option>
                </Select>
              </FormField>
            </div>

            <div className="bg-[#FAF6EF] p-3.5 rounded-2xl border border-[#E7D5BE] space-y-1.5 font-brand-sans">
              <div className="flex items-center justify-between text-xs text-[#5C5852]">
                <span>Subtotal ({numQuantity} un × R$ {numUnitPrice.toFixed(2)}):</span>
                <span className="font-semibold text-[#292724]">R$ {subtotal.toFixed(2)}</span>
              </div>
              {numDiscountPercent > 0 && (
                <div className="flex items-center justify-between text-xs text-[#4F583D] font-medium">
                  <span>Desconto ({numDiscountPercent}%):</span>
                  <span className="font-bold">- R$ {discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex items-center justify-between font-bold text-[#292724] pt-1.5 border-t border-[#E7D5BE]">
                <span>Total da Venda:</span>
                <span className="text-base sm:text-lg font-black text-[#B85C38]">R$ {totalVal.toFixed(2)}</span>
              </div>
            </div>

            <FormField label="Valor Pago Agora (R$)" htmlFor="sale-paid-value-input">
              <div className="flex items-center justify-between gap-2">
                <Input
                  id="sale-paid-value-input"
                  type="number"
                  step="0.01"
                  min={0}
                  max={totalVal}
                  value={paidValue}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setPaidValue(e.target.value)}
                  className="font-bold text-[#4F583D]"
                />
                <Button
                  type="button"
                  onClick={() => setPaidValue(totalVal)}
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                >
                  Quitar Total
                </Button>
              </div>
              {(totalVal - numPaidValue) > 0 ? (
                <p className="text-xs text-rose-700 font-semibold mt-1">
                  Saldo restante fiado a receber: R$ {(totalVal - numPaidValue).toFixed(2)}
                </p>
              ) : (
                <p className="text-xs text-[#4F583D] font-semibold mt-1">
                  {numPaidValue > 0 ? 'Venda totalmente quitada à vista.' : 'Aguardando pagamento.'}
                </p>
              )}
            </FormField>

            <FormField label="Observações" htmlFor="sale-notes-input">
              <Textarea
                id="sale-notes-input"
                placeholder="Ex: Entregar no sábado, cliente regular"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </FormField>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E7D5BE]">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" size="md">
                {editingSale ? 'Salvar Alterações' : 'Salvar Venda'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Receipt Modal */}
      {selectedReceiptSale && (
        <Modal
          isOpen={!!selectedReceiptSale}
          onClose={() => setSelectedReceiptSale(null)}
          title="Comprovante de Venda"
          description="Olaria do Zico • Cerâmica Artesanal"
          size="md"
        >
          <div className="space-y-3 text-xs sm:text-sm text-[#292724] border border-[#E7D5BE] p-4 rounded-2xl bg-[#FAF6EF]">
            <p><strong>Venda:</strong> {selectedReceiptSale.code}</p>
            <p><strong>Data:</strong> {selectedReceiptSale.date}</p>
            <p><strong>Cliente:</strong> {selectedReceiptSale.customerName}</p>
            <hr className="border-[#E7D5BE] my-2" />
            <div className="space-y-1">
              <strong>Itens:</strong>
              {selectedReceiptSale.items.map((it, idx) => (
                <div key={idx} className="flex justify-between text-xs">
                  <span>{it.quantity}x {it.productName}</span>
                  <span>R$ {it.totalPrice.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <hr className="border-[#E7D5BE] my-2" />
            {selectedReceiptSale.discount > 0 && (
              <div className="space-y-1 text-xs">
                <p className="flex justify-between text-[#8A5A44]">
                  <span>Subtotal:</span>
                  <span>R$ {(selectedReceiptSale.totalValue + selectedReceiptSale.discount).toFixed(2)}</span>
                </p>
                <p className="flex justify-between text-[#4F583D] font-semibold">
                  <span>Desconto ({selectedReceiptSale.discountPercent ? `${selectedReceiptSale.discountPercent}%` : ''}):</span>
                  <span>- R$ {selectedReceiptSale.discount.toFixed(2)}</span>
                </p>
              </div>
            )}
            <p className="flex justify-between font-black text-[#292724] text-sm pt-1 border-t border-[#E7D5BE]">
              <span>Total:</span>
              <span>R$ {selectedReceiptSale.totalValue.toFixed(2)}</span>
            </p>
            <p className="flex justify-between text-[#4F583D] font-bold">
              <span>Pago ({selectedReceiptSale.paymentMethod}):</span>
              <span>R$ {selectedReceiptSale.paidValue.toFixed(2)}</span>
            </p>
            {selectedReceiptSale.pendingValue > 0 && (
              <p className="flex justify-between text-rose-700 font-bold">
                <span>Pendente (Fiado):</span>
                <span>R$ {selectedReceiptSale.pendingValue.toFixed(2)}</span>
              </p>
            )}
            {selectedReceiptSale.notes && (
              <div className="pt-2 border-t border-[#E7D5BE] text-xs text-[#292724] bg-[#F7F1E7] p-2 rounded-xl">
                <p className="flex items-start gap-1">
                  <strong className="text-[#8A5A44] font-bold">Obs:</strong>
                  <span>{selectedReceiptSale.notes}</span>
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-3">
            <Button
              onClick={() => setSelectedReceiptSale(null)}
              variant="primary"
              size="sm"
            >
              Fechar Comprovante
            </Button>
          </div>
        </Modal>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!saleToDelete}
        onClose={() => setSaleToDelete(null)}
        onConfirm={confirmDeleteSale}
        title="Cancelar e Excluir Venda"
        message={`Deseja realmente cancelar a venda ${saleToDelete?.code}? O estoque da peça será restaurado e o caixa atualizado.`}
        confirmLabel="Sim, Excluir Venda"
        cancelLabel="Cancelar"
        variant="danger"
      />
    </div>
  );
};
