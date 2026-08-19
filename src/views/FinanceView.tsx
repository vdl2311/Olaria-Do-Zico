import React, { useState, useEffect } from 'react';
import { DollarSign, ArrowUpRight, ArrowDownRight, Mic, CheckCircle2, Clock, Check, Edit3, Trash2 } from 'lucide-react';
import { StorageService, subscribeStorage } from '../services/storage';
import { AccountReceivable, Expense, Customer } from '../types';
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
  Tabs,
  useToast
} from '../components/ui';

interface FinanceViewProps {
  onOpenVoiceModal?: () => void;
}

export const FinanceView: React.FC<FinanceViewProps> = () => {
  const { showSuccess } = useToast();
  const [receivables, setReceivables] = useState<AccountReceivable[]>(() => StorageService.getReceivables());
  const [expenses, setExpenses] = useState<Expense[]>(() => StorageService.getExpenses());
  const [customers, setCustomers] = useState<Customer[]>(() => StorageService.getCustomers());
  const [isReceivableModalOpen, setIsReceivableModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseFilter, setExpenseFilter] = useState<'all' | 'Pendente' | 'Paga'>('all');
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

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
    if (!paymentCustomerName || paymentAmount <= 0) return;

    StorageService.recordCustomerPayment(paymentCustomerName, paymentAmount);
    refreshData();
    setIsReceivableModalOpen(false);
    showSuccess(
      'Pagamento Registrado',
      `Baixa de R$ ${paymentAmount.toFixed(2)} efetuada para "${paymentCustomerName}".`
    );
  };

  const handleSubmitExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseDesc.trim() || expenseAmount <= 0) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const expData: Expense = {
      id: editingExpense ? editingExpense.id : `exp-${Date.now()}`,
      description: expenseDesc,
      category: expenseCategory,
      amount: expenseAmount,
      supplier: expenseSupplier,
      status: expenseStatus,
      dueDate: expenseDueDate,
      paidDate: expenseStatus === 'Paga' ? todayStr : undefined,
      notes: expenseNotes
    };

    StorageService.saveExpense(expData);
    refreshData();
    setIsExpenseModalOpen(false);
    showSuccess(
      editingExpense ? 'Despesa Atualizada' : 'Despesa Lançada',
      `Despesa "${expData.description}" registrada com sucesso.`
    );
  };

  const handleQuickMarkAsPaid = (exp: Expense) => {
    StorageService.markExpenseAsPaid(exp.id);
    refreshData();
    showSuccess('Despesa Paga', `Despesa "${exp.description}" marcada como Paga!`);
  };

  const confirmDeleteExpense = () => {
    if (!expenseToDelete) return;
    StorageService.deleteExpense(expenseToDelete.id);
    refreshData();
    showSuccess('Despesa Excluída', `Despesa "${expenseToDelete.description}" removida.`);
    setExpenseToDelete(null);
  };

  const totalReceivablesPending = receivables.filter(r => r.status !== 'Pago').reduce((acc, r) => acc + (r.amount - r.amountPaid), 0);
  const totalExpensesPaid = expenses.filter(e => e.status === 'Paga').reduce((acc, e) => acc + e.amount, 0);
  const totalExpensesPending = expenses.filter(e => e.status === 'Pendente').reduce((acc, e) => acc + e.amount, 0);

  const debtorCustomersMap: { [name: string]: number } = {};
  receivables.filter(r => r.status !== 'Pago').forEach(r => {
    debtorCustomersMap[r.customerName] = (debtorCustomersMap[r.customerName] || 0) + (r.amount - r.amountPaid);
  });

  const filteredExpenses = expenses.filter(e => {
    if (expenseFilter === 'all') return true;
    return e.status === expenseFilter;
  });

  return (
    <div className="space-y-6 pb-20 font-brand-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#292724] dark:text-[#F7F1E7] font-brand-serif flex items-center gap-3">
            <DollarSign className="w-7 h-7 text-[#B85C38]" />
            <span>Financeiro & Contas da Olaria</span>
          </h2>
          <p className="text-sm sm:text-base text-[#5C5852] dark:text-[#C9BFA8] mt-1">
            Contas a Receber (Fiado) e Contas a Pagar / Despesas da Olaria.
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full sm:w-auto">
          <Button
            onClick={() => handleOpenReceivableModal()}
            variant="primary"
            size="md"
            icon={ArrowUpRight}
            className="flex-1 sm:flex-none"
          >
            Receber Pagamento
          </Button>

          <Button
            onClick={openNewExpenseModal}
            variant="danger"
            size="md"
            icon={ArrowDownRight}
            className="flex-1 sm:flex-none"
          >
            Lançar Despesa
          </Button>
        </div>
      </div>

      {/* Summary Metrics Cards with High Legibility */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card variant="flat" className="bg-[#667052]/10 border-[#667052]/30 p-5 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold uppercase text-[#4F583D] dark:text-[#A4B38A] tracking-wider">A Receber (Fiado)</span>
            <ArrowUpRight className="w-6 h-6 text-[#667052] dark:text-[#A4B38A]" />
          </div>
          <p className="text-3xl sm:text-4xl font-black text-[#292724] dark:text-[#F7F1E7] font-mono">R$ {totalReceivablesPending.toFixed(2)}</p>
          <p className="text-xs sm:text-sm text-[#5C5852] dark:text-[#C9BFA8]">{receivables.filter(r => r.status !== 'Pago').length} cliente(s) em aberto</p>
        </Card>

        <Card variant="flat" className="bg-amber-500/10 border-amber-500/30 p-5 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold uppercase text-amber-900 dark:text-[#E0B366] tracking-wider">Contas a Pagar (Pendentes)</span>
            <Clock className="w-6 h-6 text-amber-700 dark:text-[#E0B366]" />
          </div>
          <p className="text-3xl sm:text-4xl font-black text-[#292724] dark:text-[#F7F1E7] font-mono">R$ {totalExpensesPending.toFixed(2)}</p>
          <p className="text-xs sm:text-sm text-[#5C5852] dark:text-[#C9BFA8]">{expenses.filter(e => e.status === 'Pendente').length} conta(s) a pagar</p>
        </Card>

        <Card variant="flat" className="bg-rose-500/10 border-rose-500/30 p-5 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold uppercase text-rose-800 dark:text-rose-400 tracking-wider">Despesas Pagas</span>
            <CheckCircle2 className="w-6 h-6 text-rose-700 dark:text-rose-400" />
          </div>
          <p className="text-3xl sm:text-4xl font-black text-[#292724] dark:text-[#F7F1E7] font-mono">R$ {totalExpensesPaid.toFixed(2)}</p>
          <p className="text-xs sm:text-sm text-[#5C5852] dark:text-[#C9BFA8]">{expenses.filter(e => e.status === 'Paga').length} despesa(s) quitadas</p>
        </Card>
      </div>

      {/* Receivables Section */}
      <Card variant="default" className="p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-[#E7D5BE] dark:border-stone-800 pb-3">
          <h3 className="font-bold text-[#292724] dark:text-[#F7F1E7] text-lg sm:text-xl flex items-center gap-2.5 font-brand-serif">
            <ArrowUpRight className="w-6 h-6 text-[#667052]" />
            <span>Contas a Receber (Fiado / Parcelas)</span>
          </h3>
        </div>

        {/* Mobile View */}
        <div className="block md:hidden space-y-3.5">
          {receivables.length === 0 ? (
            <EmptyState
              title="Nenhuma conta a receber"
              description="Quando houver vendas fiadas, elas serão exibidas aqui."
            />
          ) : (
            receivables.map((r) => {
              const debt = Math.max(0, r.amount - r.amountPaid);
              return (
                <div key={r.id} className="p-4.5 bg-[#FAF6EF] dark:bg-[#25221E] rounded-2xl border border-[#E7D5BE] dark:border-stone-800 space-y-3.5 shadow-2xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-[#292724] dark:text-[#F7F1E7] text-base">{r.customerName}</p>
                      <p className="text-xs sm:text-sm text-[#8A5A44] dark:text-[#C9BFA8]">{r.description || 'Venda a prazo'}</p>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-2.5 px-3.5 bg-[#FAF6EF] dark:bg-[#1A1816] rounded-xl border border-[#E7D5BE] dark:border-stone-800 text-sm">
                    <div>
                      <span className="text-xs text-[#8A5A44] dark:text-[#C9BFA8] block uppercase font-bold">Total</span>
                      <span className="font-bold text-[#292724] dark:text-[#F7F1E7] font-mono">R$ {r.amount.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-xs text-[#4F583D] dark:text-[#A4B38A] block uppercase font-bold">Pago</span>
                      <span className="font-bold text-[#4F583D] dark:text-[#A4B38A] font-mono">R$ {r.amountPaid.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-xs text-rose-700 dark:text-rose-400 block uppercase font-bold">Restante</span>
                      <span className="font-black text-rose-700 dark:text-rose-400 font-mono">R$ {debt.toFixed(2)}</span>
                    </div>
                  </div>

                  {r.status !== 'Pago' && (
                    <Button
                      onClick={() => handleOpenReceivableModal(r.customerName)}
                      variant="primary"
                      size="sm"
                      icon={ArrowUpRight}
                      className="w-full"
                    >
                      Dar Baixa no Pagamento
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Table with Legible Typography */}
        <div className="hidden md:block overflow-x-auto rounded-xl">
          <table className="w-full min-w-[700px] text-left text-sm sm:text-base font-brand-sans">
            <thead className="bg-[#E7D5BE]/60 dark:bg-[#2E2A26] text-[#8A5A44] dark:text-[#D67855] font-bold border-b border-[#E7D5BE] dark:border-stone-800">
              <tr>
                <th className="p-4 whitespace-nowrap text-sm font-bold uppercase tracking-wider">Cliente</th>
                <th className="p-4 text-sm font-bold uppercase tracking-wider">Descrição</th>
                <th className="p-4 whitespace-nowrap text-sm font-bold uppercase tracking-wider">Valor Total</th>
                <th className="p-4 whitespace-nowrap text-sm font-bold uppercase tracking-wider">Valor Pago</th>
                <th className="p-4 whitespace-nowrap text-sm font-bold uppercase tracking-wider">Restante</th>
                <th className="p-4 whitespace-nowrap text-sm font-bold uppercase tracking-wider">Status</th>
                <th className="p-4 text-right whitespace-nowrap text-sm font-bold uppercase tracking-wider">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7D5BE]/60 dark:divide-stone-800">
              {receivables.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6">
                    <EmptyState
                      title="Nenhuma conta a receber"
                      description="Quando houver vendas fiadas, elas aparecerão aqui."
                    />
                  </td>
                </tr>
              ) : (
                receivables.map((r) => {
                  const debt = Math.max(0, r.amount - r.amountPaid);
                  return (
                    <tr key={r.id} className="hover:bg-[#F7F1E7]/80 dark:hover:bg-[#2E2A26] transition-colors">
                      <td className="p-4 font-bold text-[#292724] dark:text-[#F7F1E7] text-base">{r.customerName}</td>
                      <td className="p-4 text-[#5C5852] dark:text-[#C9BFA8]">{r.description}</td>
                      <td className="p-4 font-bold text-[#292724] dark:text-[#F7F1E7] font-mono">R$ {r.amount.toFixed(2)}</td>
                      <td className="p-4 text-[#4F583D] dark:text-[#A4B38A] font-bold font-mono">R$ {r.amountPaid.toFixed(2)}</td>
                      <td className="p-4 font-black text-rose-700 dark:text-rose-400 font-mono">R$ {debt.toFixed(2)}</td>
                      <td className="p-4">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="p-4 text-right">
                        {r.status !== 'Pago' && (
                          <Button
                            onClick={() => handleOpenReceivableModal(r.customerName)}
                            variant="primary"
                            size="sm"
                          >
                            Dar Baixa
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Expenses Section */}
      <Card variant="default" className="p-6 space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E7D5BE] dark:border-stone-800 pb-3">
          <h3 className="font-bold text-[#292724] dark:text-[#F7F1E7] text-lg sm:text-xl flex items-center gap-2.5 font-brand-serif">
            <ArrowDownRight className="w-6 h-6 text-rose-700" />
            <span>Despesas e Compras da Olaria</span>
          </h3>

          <Tabs
            tabs={[
              { id: 'all', label: `Todas (${expenses.length})` },
              { id: 'Pendente', label: `A Pagar (${expenses.filter(e => e.status === 'Pendente').length})` },
              { id: 'Paga', label: `Pagas (${expenses.filter(e => e.status === 'Paga').length})` },
            ]}
            activeTab={expenseFilter}
            onChange={(id) => setExpenseFilter(id as any)}
          />
        </div>

        {/* Mobile View */}
        <div className="block md:hidden space-y-3.5">
          {filteredExpenses.length === 0 ? (
            <EmptyState
              title="Nenhuma despesa encontrada"
              description="Nenhuma conta ou compra registrada no filtro selecionado."
            />
          ) : (
            filteredExpenses.map((e) => (
              <div key={e.id} className="p-4.5 bg-[#FAF6EF] dark:bg-[#25221E] rounded-2xl border border-[#E7D5BE] dark:border-stone-800 space-y-3 shadow-2xs">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-[#292724] dark:text-[#F7F1E7] text-base">{e.description}</p>
                    <p className="text-xs sm:text-sm text-[#8A5A44] dark:text-[#C9BFA8]">
                      {e.category} {e.supplier ? `• ${e.supplier}` : ''}
                    </p>
                  </div>
                  <StatusBadge status={e.status} />
                </div>

                {e.notes && (
                  <p className="text-xs text-[#5C5852] dark:text-[#C9BFA8] bg-[#F7F1E7] dark:bg-[#1A1816] p-2.5 rounded-xl border border-[#E7D5BE] dark:border-stone-800">
                    <strong className="text-[#8A5A44] dark:text-[#D67855]">Obs:</strong> {e.notes}
                  </p>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-[#E7D5BE] dark:border-stone-800 text-sm">
                  <div>
                    <span className="text-xs text-[#8A5A44] dark:text-[#C9BFA8] block uppercase font-bold">
                      {e.status === 'Paga' ? 'Data Pagamento' : 'Vencimento'}
                    </span>
                    <span className="font-medium text-[#292724] dark:text-[#F7F1E7]">{e.status === 'Paga' ? (e.paidDate || e.dueDate) : e.dueDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-base text-rose-700 dark:text-rose-400 font-mono">R$ {e.amount.toFixed(2)}</span>
                    <Button
                      onClick={() => openEditExpenseModal(e)}
                      variant="ghost"
                      size="sm"
                      icon={Edit3}
                      ariaLabel={`Editar despesa ${e.description}`}
                    />
                    <Button
                      onClick={() => setExpenseToDelete(e)}
                      variant="ghost"
                      size="sm"
                      icon={Trash2}
                      ariaLabel={`Excluir despesa ${e.description}`}
                      className="text-rose-700 hover:bg-rose-100"
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table with Legible Typography */}
        <div className="hidden md:block overflow-x-auto rounded-xl">
          <table className="w-full min-w-[700px] text-left text-sm sm:text-base font-brand-sans">
            <thead className="bg-[#E7D5BE]/60 dark:bg-[#2E2A26] text-[#8A5A44] dark:text-[#D67855] font-bold border-b border-[#E7D5BE] dark:border-stone-800">
              <tr>
                <th className="p-4 whitespace-nowrap text-sm font-bold uppercase tracking-wider">Descrição</th>
                <th className="p-4 whitespace-nowrap text-sm font-bold uppercase tracking-wider">Categoria / Fornecedor</th>
                <th className="p-4 whitespace-nowrap text-sm font-bold uppercase tracking-wider">Valor</th>
                <th className="p-4 whitespace-nowrap text-sm font-bold uppercase tracking-wider">Vencimento / Pago</th>
                <th className="p-4 whitespace-nowrap text-sm font-bold uppercase tracking-wider">Status</th>
                <th className="p-4 text-right whitespace-nowrap text-sm font-bold uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7D5BE]/60 dark:divide-stone-800">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6">
                    <EmptyState
                      title="Nenhuma despesa encontrada"
                      description="Nenhuma conta ou compra registrada no filtro selecionado."
                    />
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((e) => (
                  <tr key={e.id} className="hover:bg-[#F7F1E7]/80 dark:hover:bg-[#2E2A26] transition-colors">
                    <td className="p-4 font-bold text-[#292724] dark:text-[#F7F1E7] text-base">{e.description}</td>
                    <td className="p-4 text-sm text-[#5C5852] dark:text-[#C9BFA8]">
                      <span>{e.category}</span>
                      {e.supplier && <span className="block text-xs text-[#8A5A44] dark:text-[#C9BFA8] mt-0.5">{e.supplier}</span>}
                    </td>
                    <td className="p-4 font-black text-rose-700 dark:text-rose-400 font-mono text-base">R$ {e.amount.toFixed(2)}</td>
                    <td className="p-4 text-sm text-[#5C5852] dark:text-[#C9BFA8]">
                      {e.status === 'Paga' ? (e.paidDate || e.dueDate) : e.dueDate}
                    </td>
                    <td className="p-4">
                      <StatusBadge status={e.status} />
                    </td>
                    <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                      {e.status === 'Pendente' && (
                        <Button
                          onClick={() => handleQuickMarkAsPaid(e)}
                          variant="secondary"
                          size="sm"
                          icon={Check}
                          title="Marcar como Pago"
                        >
                          Pagar
                        </Button>
                      )}
                      <Button
                        onClick={() => openEditExpenseModal(e)}
                        variant="ghost"
                        size="sm"
                        icon={Edit3}
                        ariaLabel={`Editar despesa ${e.description}`}
                      />
                      <Button
                        onClick={() => setExpenseToDelete(e)}
                        variant="ghost"
                        size="sm"
                        icon={Trash2}
                        ariaLabel={`Excluir despesa ${e.description}`}
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

      {/* Quick Receivable Payment Modal */}
      {isReceivableModalOpen && (
        <Modal
          isOpen={isReceivableModalOpen}
          onClose={() => setIsReceivableModalOpen(false)}
          title="Registrar Baixa de Pagamento (Fiado)"
          size="md"
        >
          <form onSubmit={handleRecordReceivablePayment} className="space-y-4 font-brand-sans">
            <FormField label="Cliente" htmlFor="rec-cust-name" required>
              <Input
                id="rec-cust-name"
                type="text"
                list="debtor-cust-list"
                required
                value={paymentCustomerName}
                onChange={(e) => {
                  const val = e.target.value;
                  setPaymentCustomerName(val);
                  const debt = receivables
                    .filter(r => r.customerName.toLowerCase().includes(val.toLowerCase()) && r.status !== 'Pago')
                    .reduce((acc, r) => acc + (r.amount - r.amountPaid), 0);
                  if (debt > 0) setPaymentAmount(debt);
                }}
              />
              <datalist id="debtor-cust-list">
                {Object.keys(debtorCustomersMap).map(name => (
                  <option key={name} value={name}>
                    Débito total: R$ {debtorCustomersMap[name].toFixed(2)}
                  </option>
                ))}
              </datalist>
            </FormField>

            {selectedCustomerDebt > 0 && (
              <div className="p-3.5 bg-amber-100 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 rounded-xl text-amber-900 dark:text-amber-200 text-sm">
                Saldo devedor total acumulado de <strong>{paymentCustomerName}</strong>: <strong className="font-mono">R$ {selectedCustomerDebt.toFixed(2)}</strong>
              </div>
            )}

            <FormField label="Valor Recebido (R$)" htmlFor="rec-amount" required>
              <Input
                id="rec-amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
              />
            </FormField>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#E7D5BE] dark:border-stone-800">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsReceivableModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
              >
                Confirmar Recebimento
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Expense Modal (New & Edit) */}
      {isExpenseModalOpen && (
        <Modal
          isOpen={isExpenseModalOpen}
          onClose={() => setIsExpenseModalOpen(false)}
          title={editingExpense ? 'Editar Despesa' : 'Lançar Despesa / Compra'}
          size="md"
        >
          <form onSubmit={handleSubmitExpense} className="space-y-4 font-brand-sans">
            <FormField label="Descrição da Despesa" htmlFor="exp-desc" required>
              <Input
                id="exp-desc"
                type="text"
                required
                placeholder="Ex: Compra de 2 ton de argila, Lenha para queima..."
                value={expenseDesc}
                onChange={(e) => setExpenseDesc(e.target.value)}
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Categoria" htmlFor="exp-cat" required>
                <Select
                  id="exp-cat"
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value as any)}
                >
                  <option value="Matéria-Prima">Matéria-Prima (Argila / Esmalte)</option>
                  <option value="Combustível/Lenha">Combustível / Lenha (Forno)</option>
                  <option value="Manutenção">Manutenção dos Fornos / Tornos</option>
                  <option value="Energia/Água">Energia Elétrica / Água</option>
                  <option value="Salários">Salários / Diárias</option>
                  <option value="Transporte/Frete">Transporte / Frete</option>
                  <option value="Outros">Outras Despesas</option>
                </Select>
              </FormField>

              <FormField label="Valor da Despesa (R$)" htmlFor="exp-val" required>
                <Input
                  id="exp-val"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(parseFloat(e.target.value) || 0)}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Fornecedor / Favorecido" htmlFor="exp-supp">
                <Input
                  id="exp-supp"
                  type="text"
                  placeholder="Ex: Mineradora Vale, Florestal..."
                  value={expenseSupplier}
                  onChange={(e) => setExpenseSupplier(e.target.value)}
                />
              </FormField>

              <FormField label="Situação / Status" htmlFor="exp-stat" required>
                <Select
                  id="exp-stat"
                  value={expenseStatus}
                  onChange={(e) => setExpenseStatus(e.target.value as any)}
                >
                  <option value="Paga">Já Paga (Quitada no Caixa)</option>
                  <option value="Pendente">A Pagar (Pendente)</option>
                </Select>
              </FormField>
            </div>

            <FormField label="Data de Vencimento" htmlFor="exp-date" required>
              <Input
                id="exp-date"
                type="date"
                required
                value={expenseDueDate}
                onChange={(e) => setExpenseDueDate(e.target.value)}
              />
            </FormField>

            <FormField label="Observações" htmlFor="exp-notes">
              <Textarea
                id="exp-notes"
                rows={2}
                placeholder="Observações complementares..."
                value={expenseNotes}
                onChange={(e) => setExpenseNotes(e.target.value)}
              />
            </FormField>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#E7D5BE] dark:border-stone-800">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsExpenseModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
              >
                {editingExpense ? 'Salvar Alterações' : 'Registrar Despesa'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Expense Confirmation */}
      {expenseToDelete && (
        <ConfirmModal
          isOpen={!!expenseToDelete}
          onClose={() => setExpenseToDelete(null)}
          onConfirm={confirmDeleteExpense}
          title="Excluir Despesa"
          message={`Tem certeza que deseja excluir a despesa "${expenseToDelete.description}" no valor de R$ ${expenseToDelete.amount.toFixed(2)}?`}
          confirmLabel="Excluir Despesa"
          variant="danger"
        />
      )}
    </div>
  );
};
