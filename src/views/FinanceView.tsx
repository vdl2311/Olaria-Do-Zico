import React, { useState, useEffect } from 'react';
import { DollarSign, ArrowUpRight, ArrowDownRight, Plus, Mic, CheckCircle2, Clock, X, Trash2, Edit3, UserCheck, AlertCircle } from 'lucide-react';
import { StorageService, subscribeStorage } from '../services/storage';
import { AccountReceivable, Expense, Customer } from '../types';

interface FinanceViewProps {
  onOpenVoiceModal: () => void;
}

export const FinanceView: React.FC<FinanceViewProps> = ({ onOpenVoiceModal }) => {
  const [receivables, setReceivables] = useState<AccountReceivable[]>(() => StorageService.getReceivables());
  const [expenses, setExpenses] = useState<Expense[]>(() => StorageService.getExpenses());
  const [customers, setCustomers] = useState<Customer[]>(() => StorageService.getCustomers());
  const [isReceivableModalOpen, setIsReceivableModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  // Quick Payment Modal
  const [paymentCustomerName, setPaymentCustomerName] = useState('');
  const [paymentAmount, setPaymentAmount] = useState<number>(100);

  // Expense Form
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<Expense['category']>('Matéria-Prima');
  const [expenseAmount, setExpenseAmount] = useState<number>(150);
  const [expenseSupplier, setExpenseSupplier] = useState('');

  const refreshData = () => {
    setReceivables(StorageService.getReceivables());
    setExpenses(StorageService.getExpenses());
    setCustomers(StorageService.getCustomers());
  };

  useEffect(() => {
    const unsub = subscribeStorage(() => {
      refreshData();
    });
    return () => unsub();
  }, []);

  // Debt calculation for selected customer in modal
  const selectedCustomerDebt = receivables
    .filter(r => r.customerName.toLowerCase().includes(paymentCustomerName.toLowerCase()) && r.status !== 'Pago')
    .reduce((acc, r) => acc + (r.amount - r.amountPaid), 0);

  const handleOpenReceivableModal = (defaultName?: string) => {
    const name = defaultName || (receivables.find(r => r.status !== 'Pago')?.customerName || '');
    setPaymentCustomerName(name);
    const debt = receivables
      .filter(r => r.customerName.toLowerCase().includes(name.toLowerCase()) && r.status !== 'Pago')
      .reduce((acc, r) => acc + (r.amount - r.amountPaid), 0);
    setPaymentAmount(debt > 0 ? debt : 100);
    setIsReceivableModalOpen(true);
  };

  const handleRecordReceivablePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentCustomerName.trim() || paymentAmount <= 0) return;

    StorageService.recordCustomerPayment(paymentCustomerName, paymentAmount, 'Lançamento manual no financeiro');
    refreshData();
    setIsReceivableModalOpen(false);
    setPaymentCustomerName('');
  };

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseDesc.trim() || expenseAmount <= 0) return;

    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      description: expenseDesc,
      category: expenseCategory,
      amount: expenseAmount,
      supplier: expenseSupplier,
      dueDate: new Date().toISOString().split('T')[0],
      paidDate: new Date().toISOString().split('T')[0],
      status: 'Paga'
    };

    StorageService.saveExpense(newExpense);
    refreshData();
    setIsExpenseModalOpen(false);
    setExpenseDesc('');
    setExpenseAmount(150);
  };

  const handleDeleteExpense = (exp: Expense) => {
    if (confirm(`Deseja excluir a despesa "${exp.description}"?`)) {
      StorageService.deleteExpense(exp.id);
      refreshData();
    }
  };

  const totalReceivablesPending = receivables.filter(r => r.status !== 'Pago').reduce((acc, r) => acc + (r.amount - r.amountPaid), 0);
  const totalExpensesPaid = expenses.filter(e => e.status === 'Paga').reduce((acc, e) => acc + e.amount, 0);

  // Debtor customers list
  const debtorCustomersMap: { [name: string]: number } = {};
  receivables.filter(r => r.status !== 'Pago').forEach(r => {
    debtorCustomersMap[r.customerName] = (debtorCustomersMap[r.customerName] || 0) + (r.amount - r.amountPaid);
  });

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-amber-950 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-amber-800" />
            <span>Financeiro & Contas da Olaria</span>
          </h2>
          <p className="text-xs text-amber-800/80">Contas a Receber (Fiado / Clientes) e Contas a Pagar / Despesas.</p>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            onClick={onOpenVoiceModal}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-amber-600 hover:bg-amber-500 text-white font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all text-xs sm:text-sm"
          >
            <Mic className="w-4 h-4 animate-pulse" />
            <span>Lançar por Voz</span>
          </button>

          <button
            onClick={() => handleOpenReceivableModal()}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold px-3.5 py-2.5 rounded-xl shadow-xs transition-all text-xs sm:text-sm"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Receber Pagamento</span>
          </button>

          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-red-800 hover:bg-red-700 text-white font-bold px-3.5 py-2.5 rounded-xl shadow-xs transition-all text-xs sm:text-sm"
          >
            <ArrowDownRight className="w-4 h-4" />
            <span>Nova Despesa</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-emerald-800 tracking-wider">A Receber dos Clientes (Fiado)</span>
            <ArrowUpRight className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-950 mt-1">R$ {totalReceivablesPending.toFixed(2)}</p>
          <p className="text-xs text-emerald-700 mt-1">{receivables.filter(r => r.status !== 'Pago').length} conta(s) em aberto</p>
        </div>

        <div className="bg-red-50 border border-red-200 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-red-800 tracking-wider">Despesas / Saídas Pagas</span>
            <ArrowDownRight className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-2xl font-black text-red-950 mt-1">R$ {totalExpensesPaid.toFixed(2)}</p>
          <p className="text-xs text-red-700 mt-1">Argila, esmaltes, combustível, energia</p>
        </div>
      </div>

      {/* Receivables Table */}
      <div className="bg-white border border-amber-200 rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-amber-950 text-base flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5 text-emerald-600" />
            <span>Contas a Receber (Fiado / Parcelas)</span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-amber-900/10 text-amber-900 font-bold border-b border-amber-200">
              <tr>
                <th className="p-3">Cliente</th>
                <th className="p-3">Descrição</th>
                <th className="p-3">Valor Total</th>
                <th className="p-3">Valor Pago</th>
                <th className="p-3">Restante</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100">
              {receivables.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-amber-800/60">
                    Nenhuma conta a receber registrada.
                  </td>
                </tr>
              ) : (
                receivables.map((r) => {
                  const debt = Math.max(0, r.amount - r.amountPaid);
                  return (
                    <tr key={r.id} className="hover:bg-amber-50/50">
                      <td className="p-3 font-bold text-amber-950">{r.customerName}</td>
                      <td className="p-3 text-amber-800">{r.description}</td>
                      <td className="p-3 font-bold text-amber-950">R$ {r.amount.toFixed(2)}</td>
                      <td className="p-3 text-emerald-700 font-bold">R$ {r.amountPaid.toFixed(2)}</td>
                      <td className="p-3 font-bold text-red-600">R$ {debt.toFixed(2)}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          r.status === 'Pago' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {r.status !== 'Pago' && (
                          <button
                            onClick={() => handleOpenReceivableModal(r.customerName)}
                            className="px-2.5 py-1 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors"
                          >
                            Dar Baixa
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white border border-amber-200 rounded-2xl p-5 shadow-xs space-y-3">
        <h3 className="font-bold text-amber-950 text-base flex items-center gap-2">
          <ArrowDownRight className="w-5 h-5 text-red-600" />
          <span>Despesas e Compras Registradas</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-amber-900/10 text-amber-900 font-bold border-b border-amber-200">
              <tr>
                <th className="p-3">Descrição</th>
                <th className="p-3">Categoria</th>
                <th className="p-3">Fornecedor</th>
                <th className="p-3">Valor (R$)</th>
                <th className="p-3">Data</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-amber-800/60">
                    Nenhuma despesa registrada.
                  </td>
                </tr>
              ) : (
                expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-amber-50/50">
                    <td className="p-3 font-bold text-amber-950">{e.description}</td>
                    <td className="p-3 text-amber-800">{e.category}</td>
                    <td className="p-3 text-amber-800">{e.supplier || 'N/I'}</td>
                    <td className="p-3 font-black text-red-700">R$ {e.amount.toFixed(2)}</td>
                    <td className="p-3 text-amber-700">{e.dueDate}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        e.status === 'Paga' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-200 text-amber-900'
                      }`}>
                        {e.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDeleteExpense(e)}
                        className="p-1.5 text-red-700 hover:bg-red-100 rounded-lg transition-colors"
                        title="Excluir Despesa"
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

      {/* Receive Payment Modal */}
      {isReceivableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-amber-200 space-y-4">
            <div className="flex items-center justify-between border-b border-amber-100 pb-3">
              <h3 className="font-bold text-amber-950 text-base">Registrar Recebimento de Cliente</h3>
              <button onClick={() => setIsReceivableModalOpen(false)} className="text-amber-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordReceivablePayment} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-amber-900 mb-1">Cliente Devedor:</label>
                <input
                  type="text"
                  required
                  list="debtor-list"
                  placeholder="Ex: João Silva ou Carlos"
                  value={paymentCustomerName}
                  onChange={(e) => setPaymentCustomerName(e.target.value)}
                  className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-2.5 text-amber-950 focus:outline-none focus:border-amber-600"
                />
                <datalist id="debtor-list">
                  {Object.keys(debtorCustomersMap).map((name, i) => (
                    <option key={i} value={name}>
                      Saldo Devedor: R$ {debtorCustomersMap[name].toFixed(2)}
                    </option>
                  ))}
                </datalist>

                {selectedCustomerDebt > 0 && (
                  <p className="text-xs text-emerald-800 font-semibold mt-1">
                    Dívida pendente total de {paymentCustomerName}: R$ {selectedCustomerDebt.toFixed(2)}
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-amber-900">Valor Recebido (R$):</label>
                  {selectedCustomerDebt > 0 && (
                    <button
                      type="button"
                      onClick={() => setPaymentAmount(selectedCustomerDebt)}
                      className="text-xs text-amber-800 hover:underline font-semibold"
                    >
                      Quitar Total (R$ {selectedCustomerDebt.toFixed(2)})
                    </button>
                  )}
                </div>
                <input
                  type="number"
                  step="0.01"
                  min={1}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-2.5 text-amber-950 font-bold text-emerald-800 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsReceivableModalOpen(false)}
                  className="px-4 py-2 border border-amber-300 rounded-xl text-amber-900 font-semibold hover:bg-amber-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-md"
                >
                  Confirmar Baixa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-amber-200 space-y-4">
            <div className="flex items-center justify-between border-b border-amber-100 pb-3">
              <h3 className="font-bold text-amber-950 text-base">Lançar Nova Despesa / Compra</h3>
              <button onClick={() => setIsExpenseModalOpen(false)} className="text-amber-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-amber-900 mb-1">Descrição da Despesa:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 50 quilos de argila ou combustível"
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-2.5 text-amber-950 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-amber-900 mb-1">Categoria:</label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value as Expense['category'])}
                    className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-2.5 text-amber-950 focus:outline-none focus:border-amber-600"
                  >
                    <option value="Matéria-Prima">Matéria-Prima</option>
                    <option value="Combustível">Combustível</option>
                    <option value="Manutenção">Manutenção</option>
                    <option value="Energia/Água">Energia/Água</option>
                    <option value="Embalagem">Embalagem</option>
                    <option value="Ferramentas">Ferramentas</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-amber-900 mb-1">Valor (R$):</label>
                  <input
                    type="number"
                    step="0.01"
                    min={1}
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-2.5 text-amber-950 font-bold text-red-700 focus:outline-none focus:border-amber-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-amber-900 mb-1">Fornecedor / Destino:</label>
                <input
                  type="text"
                  placeholder="Ex: Mineradora Vale do Barro ou Posto Ipiranga"
                  value={expenseSupplier}
                  onChange={(e) => setExpenseSupplier(e.target.value)}
                  className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-2.5 text-amber-950 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 border border-amber-300 rounded-xl text-amber-900 font-semibold hover:bg-amber-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-800 hover:bg-red-900 text-white rounded-xl font-bold shadow-md"
                >
                  Salvar Despesa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
