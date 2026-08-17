import React, { useState, useEffect } from 'react';
import { DollarSign, ArrowUpRight, ArrowDownRight, Plus, Mic, CheckCircle2, Clock, X, Trash2, Edit3, UserCheck, AlertCircle, MessageSquare, Calendar, Check, Filter } from 'lucide-react';
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
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseFilter, setExpenseFilter] = useState<'all' | 'Pendente' | 'Paga'>('all');

  // Quick Payment Modal
  const [paymentCustomerName, setPaymentCustomerName] = useState('');
  const [paymentAmount, setPaymentAmount] = useState<number>(100);

  // Expense Form State
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<Expense['category']>('Matéria-Prima');
  const [expenseAmount, setExpenseAmount] = useState<number>(150);
  const [expenseSupplier, setExpenseSupplier] = useState('');
  const [expenseStatus, setExpenseStatus] = useState<'Paga' | 'Pendente'>('Paga');
  const [expenseDueDate, setExpenseDueDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [expenseNotes, setExpenseNotes] = useState('');

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

  const openNewExpenseModal = () => {
    setEditingExpense(null);
    setExpenseDesc('');
    setExpenseCategory('Matéria-Prima');
    setExpenseAmount(150);
    setExpenseSupplier('');
    setExpenseStatus('Paga');
    setExpenseDueDate(new Date().toISOString().split('T')[0]);
    setExpenseNotes('');
    setIsExpenseModalOpen(true);
  };

  const openEditExpenseModal = (exp: Expense) => {
    setEditingExpense(exp);
    setExpenseDesc(exp.description);
    setExpenseCategory(exp.category);
    setExpenseAmount(exp.amount);
    setExpenseSupplier(exp.supplier || '');
    setExpenseStatus(exp.status === 'Paga' ? 'Paga' : 'Pendente');
    setExpenseDueDate(exp.dueDate || new Date().toISOString().split('T')[0]);
    setExpenseNotes(exp.notes || '');
    setIsExpenseModalOpen(true);
  };

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

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseDesc.trim() || expenseAmount <= 0) return;

    const todayStr = new Date().toISOString().split('T')[0];

    if (editingExpense) {
      const updatedExpense: Expense = {
        ...editingExpense,
        description: expenseDesc.trim(),
        category: expenseCategory,
        amount: expenseAmount,
        supplier: expenseSupplier.trim() || undefined,
        dueDate: expenseDueDate || todayStr,
        paidDate: expenseStatus === 'Paga' ? (editingExpense.paidDate || todayStr) : undefined,
        status: expenseStatus,
        notes: expenseNotes.trim() || undefined
      };
      StorageService.saveExpense(updatedExpense);
    } else {
      const newExpense: Expense = {
        id: `exp-${Date.now()}`,
        description: expenseDesc.trim(),
        category: expenseCategory,
        amount: expenseAmount,
        supplier: expenseSupplier.trim() || undefined,
        dueDate: expenseDueDate || todayStr,
        paidDate: expenseStatus === 'Paga' ? todayStr : undefined,
        status: expenseStatus,
        notes: expenseNotes.trim() || undefined
      };
      StorageService.saveExpense(newExpense);
    }

    refreshData();
    setIsExpenseModalOpen(false);
    setEditingExpense(null);
  };

  const handleQuickMarkAsPaid = (exp: Expense) => {
    StorageService.markExpenseAsPaid(exp.id);
    refreshData();
  };

  const handleDeleteExpense = (exp: Expense) => {
    if (confirm(`Deseja excluir a despesa "${exp.description}"?`)) {
      StorageService.deleteExpense(exp.id);
      refreshData();
    }
  };

  const totalReceivablesPending = receivables.filter(r => r.status !== 'Pago').reduce((acc, r) => acc + (r.amount - r.amountPaid), 0);
  const totalExpensesPaid = expenses.filter(e => e.status === 'Paga').reduce((acc, e) => acc + e.amount, 0);
  const totalExpensesPending = expenses.filter(e => e.status === 'Pendente').reduce((acc, e) => acc + e.amount, 0);

  // Debtor customers list
  const debtorCustomersMap: { [name: string]: number } = {};
  receivables.filter(r => r.status !== 'Pago').forEach(r => {
    debtorCustomersMap[r.customerName] = (debtorCustomersMap[r.customerName] || 0) + (r.amount - r.amountPaid);
  });

  const filteredExpenses = expenses.filter(e => {
    if (expenseFilter === 'all') return true;
    return e.status === expenseFilter;
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
          <p className="text-xs text-amber-800/80">Contas a Receber (Fiado) e Contas a Pagar / Despesas da Olaria.</p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={onOpenVoiceModal}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 sm:space-x-2 bg-amber-600 hover:bg-amber-500 text-white font-bold px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl shadow-xs transition-all text-xs sm:text-sm cursor-pointer whitespace-nowrap"
          >
            <Mic className="w-4 h-4 animate-pulse shrink-0" />
            <span>Lançar por Voz</span>
          </button>

          <button
            onClick={() => handleOpenReceivableModal()}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 sm:space-x-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl shadow-xs transition-all text-xs sm:text-sm cursor-pointer whitespace-nowrap"
          >
            <ArrowUpRight className="w-4 h-4 shrink-0" />
            <span>Receber</span>
          </button>

          <button
            onClick={openNewExpenseModal}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 sm:space-x-2 bg-red-800 hover:bg-red-700 text-white font-bold px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl shadow-xs transition-all text-xs sm:text-sm cursor-pointer whitespace-nowrap"
          >
            <ArrowDownRight className="w-4 h-4 shrink-0" />
            <span>Lançar Despesa</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-emerald-50 border border-emerald-200 p-4 sm:p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-emerald-800 tracking-wider">A Receber (Fiado)</span>
            <ArrowUpRight className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-950 mt-1">R$ {totalReceivablesPending.toFixed(2)}</p>
          <p className="text-xs text-emerald-700 mt-1">{receivables.filter(r => r.status !== 'Pago').length} cliente(s) em aberto</p>
        </div>

        <div className="bg-amber-50 border border-amber-300 p-4 sm:p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-amber-900 tracking-wider">Contas a Pagar (Pendentes)</span>
            <Clock className="w-5 h-5 text-amber-700" />
          </div>
          <p className="text-2xl font-black text-amber-950 mt-1">R$ {totalExpensesPending.toFixed(2)}</p>
          <p className="text-xs text-amber-800 mt-1">{expenses.filter(e => e.status === 'Pendente').length} conta(s) a pagar</p>
        </div>

        <div className="bg-red-50 border border-red-200 p-4 sm:p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-red-800 tracking-wider">Despesas Pagas</span>
            <CheckCircle2 className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-2xl font-black text-red-950 mt-1">R$ {totalExpensesPaid.toFixed(2)}</p>
          <p className="text-xs text-red-700 mt-1">{expenses.filter(e => e.status === 'Paga').length} despesa(s) quitadas</p>
        </div>
      </div>

      {/* Receivables Section */}
      <div className="bg-white border border-amber-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-amber-950 text-base flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5 text-emerald-600" />
            <span>Contas a Receber (Fiado / Parcelas)</span>
          </h3>
        </div>

        {/* Mobile View: Cards */}
        <div className="block md:hidden space-y-3">
          {receivables.length === 0 ? (
            <div className="p-6 text-center text-amber-800/60 bg-amber-50/40 rounded-xl border border-dashed border-amber-200">
              Nenhuma conta a receber registrada.
            </div>
          ) : (
            receivables.map((r) => {
              const debt = Math.max(0, r.amount - r.amountPaid);
              return (
                <div key={r.id} className="p-4 bg-amber-50/40 rounded-xl border border-amber-200/80 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-amber-950 text-sm">{r.customerName}</p>
                      <p className="text-xs text-amber-800">{r.description || 'Venda a prazo'}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 ${
                      r.status === 'Pago' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {r.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-white rounded-lg border border-amber-100 text-xs">
                    <div>
                      <span className="text-[10px] text-amber-700 block uppercase font-bold">Total</span>
                      <span className="font-bold text-amber-950">R$ {r.amount.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-700 block uppercase font-bold">Pago</span>
                      <span className="font-bold text-emerald-800">R$ {r.amountPaid.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-red-700 block uppercase font-bold">Restante</span>
                      <span className="font-black text-red-600">R$ {debt.toFixed(2)}</span>
                    </div>
                  </div>

                  {r.status !== 'Pago' && (
                    <button
                      onClick={() => handleOpenReceivableModal(r.customerName)}
                      className="w-full py-2 text-xs font-bold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 active:bg-emerald-300 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      <ArrowUpRight className="w-4 h-4 text-emerald-700" />
                      <span>Dar Baixa no Pagamento</span>
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block overflow-x-auto">
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
                            className="px-2.5 py-1 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors cursor-pointer"
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

      {/* Expenses Section */}
      <div className="bg-white border border-amber-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h3 className="font-bold text-amber-950 text-base flex items-center gap-2">
            <ArrowDownRight className="w-5 h-5 text-red-600" />
            <span>Despesas e Compras da Olaria</span>
          </h3>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-amber-100/60 p-1 rounded-xl border border-amber-200 self-stretch sm:self-auto">
            <button
              onClick={() => setExpenseFilter('all')}
              className={`flex-1 sm:flex-none px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                expenseFilter === 'all' ? 'bg-amber-900 text-white shadow-xs' : 'text-amber-900 hover:bg-amber-200/60'
              }`}
            >
              Todas ({expenses.length})
            </button>
            <button
              onClick={() => setExpenseFilter('Pendente')}
              className={`flex-1 sm:flex-none px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                expenseFilter === 'Pendente' ? 'bg-amber-600 text-white shadow-xs' : 'text-amber-900 hover:bg-amber-200/60'
              }`}
            >
              A Pagar ({expenses.filter(e => e.status === 'Pendente').length})
            </button>
            <button
              onClick={() => setExpenseFilter('Paga')}
              className={`flex-1 sm:flex-none px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                expenseFilter === 'Paga' ? 'bg-emerald-700 text-white shadow-xs' : 'text-amber-900 hover:bg-amber-200/60'
              }`}
            >
              Pagas ({expenses.filter(e => e.status === 'Paga').length})
            </button>
          </div>
        </div>

        {/* Mobile View: Cards */}
        <div className="block md:hidden space-y-3">
          {filteredExpenses.length === 0 ? (
            <div className="p-6 text-center text-amber-800/60 bg-amber-50/40 rounded-xl border border-dashed border-amber-200">
              Nenhuma despesa encontrada com o filtro selecionado.
            </div>
          ) : (
            filteredExpenses.map((e) => (
              <div key={e.id} className="p-4 bg-amber-50/40 rounded-xl border border-amber-200/80 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-amber-950 text-sm">{e.description}</p>
                    <p className="text-xs text-amber-700">
                      {e.category} {e.supplier ? `• ${e.supplier}` : ''}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 flex items-center gap-1 ${
                    e.status === 'Paga'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}>
                    {e.status === 'Paga' ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                        <span>Pago</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-3 h-3 text-amber-700" />
                        <span>A Pagar</span>
                      </>
                    )}
                  </span>
                </div>

                {e.notes && (
                  <p className="text-[11px] text-amber-800 bg-amber-100/50 px-2 py-1 rounded-lg border border-amber-200/60 italic">
                    <strong className="not-italic text-amber-950">Obs:</strong> {e.notes}
                  </p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-amber-200/60 text-xs">
                  <div>
                    <span className="text-[10px] text-amber-700 block uppercase font-bold">
                      {e.status === 'Paga' ? 'Data Pagamento' : 'Vencimento'}
                    </span>
                    <span className="font-medium text-amber-900">{e.status === 'Paga' ? (e.paidDate || e.dueDate) : e.dueDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-red-700">R$ {e.amount.toFixed(2)}</span>
                    <button
                      onClick={() => openEditExpenseModal(e)}
                      className="p-1.5 text-amber-800 hover:bg-amber-100 active:bg-amber-200 rounded-lg transition-colors"
                      title="Editar Despesa"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteExpense(e)}
                      className="p-1.5 text-red-700 hover:bg-red-100 active:bg-red-200 rounded-lg transition-colors"
                      title="Excluir Despesa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {e.status === 'Pendente' && (
                  <button
                    onClick={() => handleQuickMarkAsPaid(e)}
                    className="w-full py-2 text-xs font-bold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 active:bg-emerald-300 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4 text-emerald-700" />
                    <span>Marcar como Paga (Dar Baixa)</span>
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-amber-900/10 text-amber-900 font-bold border-b border-amber-200">
              <tr>
                <th className="p-3">Descrição</th>
                <th className="p-3">Categoria</th>
                <th className="p-3">Fornecedor</th>
                <th className="p-3">Valor (R$)</th>
                <th className="p-3">Vencimento / Data</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-amber-800/60">
                    Nenhuma despesa encontrada com o filtro selecionado.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((e) => (
                  <tr key={e.id} className="hover:bg-amber-50/50">
                    <td className="p-3">
                      <p className="font-bold text-amber-950">{e.description}</p>
                      {e.notes && (
                        <p className="text-[11px] text-amber-800 italic mt-0.5">
                          Obs: {e.notes}
                        </p>
                      )}
                    </td>
                    <td className="p-3 text-amber-800">{e.category}</td>
                    <td className="p-3 text-amber-800">{e.supplier || 'N/I'}</td>
                    <td className="p-3 font-black text-red-700">R$ {e.amount.toFixed(2)}</td>
                    <td className="p-3 text-amber-700">{e.status === 'Paga' ? (e.paidDate || e.dueDate) : e.dueDate}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                        e.status === 'Paga'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}>
                        {e.status === 'Paga' ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                            <span>Pago</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 text-amber-700" />
                            <span>A Pagar</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {e.status === 'Pendente' && (
                          <button
                            onClick={() => handleQuickMarkAsPaid(e)}
                            className="px-2.5 py-1 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                            title="Marcar como Paga"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Pagar</span>
                          </button>
                        )}
                        <button
                          onClick={() => openEditExpenseModal(e)}
                          className="p-1.5 text-amber-800 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer"
                          title="Editar Despesa"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(e)}
                          className="p-1.5 text-red-700 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                          title="Excluir Despesa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
                  onFocus={(e) => e.target.select()}
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

      {/* Expense Modal (Create & Edit with Pago / A Pagar) */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-amber-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-amber-100 pb-3">
              <h3 className="font-bold text-amber-950 text-base">
                {editingExpense ? 'Editar Despesa / Compra' : 'Lançar Nova Despesa / Compra'}
              </h3>
              <button onClick={() => setIsExpenseModalOpen(false)} className="text-amber-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-3.5 text-xs sm:text-sm">
              {/* Payment Status Switch: Pago vs A Pagar */}
              <div>
                <label className="block font-bold text-amber-900 mb-1.5">Situação da Despesa:</label>
                <div className="grid grid-cols-2 gap-2 bg-amber-100/70 p-1 rounded-xl border border-amber-200">
                  <button
                    type="button"
                    onClick={() => setExpenseStatus('Paga')}
                    className={`py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      expenseStatus === 'Paga'
                        ? 'bg-emerald-700 text-white shadow-sm ring-2 ring-emerald-600'
                        : 'text-amber-900 hover:bg-amber-200/70'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Já Pago (À vista)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExpenseStatus('Pendente')}
                    className={`py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      expenseStatus === 'Pendente'
                        ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-500'
                        : 'text-amber-900 hover:bg-amber-200/70'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    <span>A Pagar (Pendente)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-amber-900 mb-1">Descrição da Despesa:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 50 sacos de argila, combustível, energia..."
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-2.5 text-amber-950 focus:outline-none focus:border-amber-600 font-medium"
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
                    min={0.01}
                    required
                    value={expenseAmount}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setExpenseAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-2.5 text-amber-950 font-bold text-red-700 focus:outline-none focus:border-amber-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-amber-900 mb-1">Fornecedor / Destino:</label>
                  <input
                    type="text"
                    placeholder="Ex: Mineradora Vale, Posto Ipiranga..."
                    value={expenseSupplier}
                    onChange={(e) => setExpenseSupplier(e.target.value)}
                    className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-2.5 text-amber-950 focus:outline-none focus:border-amber-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-amber-900 mb-1">
                    {expenseStatus === 'Paga' ? 'Data do Pagamento:' : 'Data de Vencimento:'}
                  </label>
                  <input
                    type="date"
                    required
                    value={expenseDueDate}
                    onChange={(e) => setExpenseDueDate(e.target.value)}
                    className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-2.5 text-amber-950 focus:outline-none focus:border-amber-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-amber-900 mb-1">Observações (opcional):</label>
                <input
                  type="text"
                  placeholder="Ex: Boleto 30 dias, NF nº 4501, pago no Pix..."
                  value={expenseNotes}
                  onChange={(e) => setExpenseNotes(e.target.value)}
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
                  className={`px-5 py-2 text-white rounded-xl font-bold shadow-md cursor-pointer transition-colors ${
                    expenseStatus === 'Paga' ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-amber-700 hover:bg-amber-800'
                  }`}
                >
                  {editingExpense ? 'Atualizar Despesa' : (expenseStatus === 'Paga' ? 'Salvar Despesa Paga' : 'Salvar Conta a Pagar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
