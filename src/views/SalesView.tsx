import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Mic, Search, Filter, CheckCircle, Clock, AlertCircle, FileText, X, Trash2, Edit3, AlertTriangle } from 'lucide-react';
import { StorageService, subscribeStorage } from '../services/storage';
import { Sale, Product, PaymentMethod } from '../types';

interface SalesViewProps {
  onOpenVoiceModal: () => void;
}

export const SalesView: React.FC<SalesViewProps> = ({ onOpenVoiceModal }) => {
  const [sales, setSales] = useState<Sale[]>(() => StorageService.getSales());
  const [products, setProducts] = useState<Product[]>(() => StorageService.getProducts());
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [selectedReceiptSale, setSelectedReceiptSale] = useState<Sale | null>(null);

  // Sale Form state
  const [customerName, setCustomerName] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Pix');
  const [paidValue, setPaidValue] = useState<number>(0);
  const [notes, setNotes] = useState('');

  const refreshData = () => {
    setSales(StorageService.getSales());
    setProducts(StorageService.getProducts());
  };

  useEffect(() => {
    const unsub = subscribeStorage(() => {
      refreshData();
    });
    return () => unsub();
  }, []);

  const openNewSaleModal = () => {
    setEditingSale(null);
    setCustomerName('');
    setSelectedProductId(products[0]?.id || '');
    setQuantity(1);
    const initialPrice = products[0]?.price || 0;
    setUnitPrice(initialPrice);
    setDiscount(0);
    setPaymentMethod('Pix');
    setPaidValue(initialPrice);
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditSaleModal = (sale: Sale) => {
    setEditingSale(sale);
    setCustomerName(sale.customerName);
    const firstItem = sale.items[0];
    setSelectedProductId(firstItem?.productId || '');
    setQuantity(firstItem?.quantity || 1);
    setUnitPrice(firstItem?.unitPrice || 0);
    setDiscount(sale.discount || 0);
    setPaymentMethod(sale.paymentMethod);
    setPaidValue(sale.paidValue);
    setNotes(sale.notes || '');
    setIsModalOpen(true);
  };

  const handleProductSelect = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = products.find(p => p.id === prodId);
    if (prod) {
      setUnitPrice(prod.price);
      const total = Math.max(0, (prod.price * quantity) - discount);
      if (paymentMethod === 'Fiado') {
        setPaidValue(0);
      } else {
        setPaidValue(total);
      }
    }
  };

  const handleQtyChange = (qty: number) => {
    const cleanQty = Math.max(1, qty);
    setQuantity(cleanQty);
    const total = Math.max(0, (unitPrice * cleanQty) - discount);
    if (paymentMethod === 'Fiado') {
      setPaidValue(0);
    } else {
      setPaidValue(total);
    }
  };

  const handleDiscountChange = (disc: number) => {
    const cleanDisc = Math.max(0, disc);
    setDiscount(cleanDisc);
    const total = Math.max(0, (unitPrice * quantity) - cleanDisc);
    if (paymentMethod !== 'Fiado' && paidValue > total) {
      setPaidValue(total);
    }
  };

  const handlePaymentMethodChange = (method: PaymentMethod) => {
    setPaymentMethod(method);
    const total = Math.max(0, (unitPrice * quantity) - discount);
    if (method === 'Fiado') {
      setPaidValue(0);
    } else if (paidValue === 0) {
      setPaidValue(total);
    }
  };

  const selectedProduct = products.find(p => p.id === selectedProductId);
  const totalVal = Math.max(0, (unitPrice * quantity) - discount);
  const isStockLowOrInsufficient = selectedProduct && selectedProduct.stock < quantity;

  const handleSubmitSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !selectedProductId) {
      alert('Preencha o nome do cliente e selecione o produto.');
      return;
    }

    const prod = products.find(p => p.id === selectedProductId);
    if (!prod) return;

    // Validate paidValue
    const cleanPaidValue = Math.min(totalVal, Math.max(0, paidValue));
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
        quantity,
        unitPrice,
        totalPrice: unitPrice * quantity
      }],
      totalValue: totalVal,
      discount,
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
                    <td className="p-3.5 text-amber-800 max-w-xs truncate hidden lg:table-cell">
                      {sale.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}
                    </td>
                    <td className="p-3.5 font-black text-amber-950">R$ {sale.totalValue.toFixed(2)}</td>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-amber-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-amber-100 pb-3">
              <h3 className="font-bold text-amber-950 text-lg">
                {editingSale ? `Editar Venda ${editingSale.code}` : 'Lançar Nova Venda Manual'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-amber-700 hover:text-amber-950">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitSale} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-amber-900 mb-1">Nome do Cliente:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: João Silva ou Carlos"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-2.5 text-amber-950 focus:outline-none focus:border-amber-600"
                />
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
                  className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-2.5 text-amber-950 focus:outline-none focus:border-amber-600"
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
                    Atenção: A quantidade ({quantity}) é superior ao estoque disponível ({selectedProduct?.stock} un).
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-amber-900 mb-1">Quantidade:</label>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => handleQtyChange(parseInt(e.target.value) || 1)}
                    className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-2.5 text-amber-950 focus:outline-none focus:border-amber-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-amber-900 mb-1">Preço Unitário (R$):</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-2.5 text-amber-950 focus:outline-none focus:border-amber-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-amber-900 mb-1">Desconto (R$):</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={discount}
                    onChange={(e) => handleDiscountChange(parseFloat(e.target.value) || 0)}
                    className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-2.5 text-amber-950 focus:outline-none focus:border-amber-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-amber-900 mb-1">Forma de Pagamento:</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => handlePaymentMethodChange(e.target.value as PaymentMethod)}
                    className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-2.5 text-amber-950 focus:outline-none focus:border-amber-600"
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

              <div className="bg-amber-100/60 p-3 rounded-xl border border-amber-200">
                <div className="flex items-center justify-between font-bold text-amber-950">
                  <span>Total da Venda:</span>
                  <span className="text-base font-black">R$ {totalVal.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-amber-900">Valor Pago Agora (R$):</label>
                  <button
                    type="button"
                    onClick={() => setPaidValue(totalVal)}
                    className="text-xs text-amber-800 hover:underline font-semibold"
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
                  onChange={(e) => setPaidValue(Math.min(totalVal, Math.max(0, parseFloat(e.target.value) || 0)))}
                  className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-2.5 text-amber-950 focus:outline-none focus:border-amber-600 font-bold text-emerald-800"
                />
                {(totalVal - paidValue) > 0 ? (
                  <p className="text-xs text-red-600 font-semibold mt-1">
                    Saldo restante/fiado a receber: R$ {(totalVal - paidValue).toFixed(2)}
                  </p>
                ) : (
                  <p className="text-xs text-emerald-700 font-semibold mt-1">
                    Venda totalmente quitada à vista.
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
                  className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-2.5 text-amber-950 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-amber-300 text-amber-900 font-semibold hover:bg-amber-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-amber-50 font-bold shadow-md"
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
              <p className="flex justify-between font-bold">
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
