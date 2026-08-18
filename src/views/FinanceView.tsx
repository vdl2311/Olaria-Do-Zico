import React, { useState, useEffect } from 'react';
import { DollarSign, ArrowUpRight, ArrowDownRight, Mic, CheckCircle2, Clock, Check } from 'lucide-react';
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
    if (!paymentCustomerName.trim() || paymentAmount <= 0) return;

    StorageService.recordCustomerPayment(paymentCustomerName, paymentAmount, 'Lançamento manual no financeiro');
    refreshData();
    setIsReceivableModalOpen(false);
    setPaymentCustomerName('');
    showSuccess('Baixa Registrada', `Pagamento de R$ ${paymentAmount.toFixed(2)} registrado com sucesso!`);
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
      showSuccess('Despesa Atualizada', `A despesa "${expenseDesc}" foi atualizada.`);
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
      showSuccess('Despesa Lançada', `Nova despesa de R$ ${expenseAmount.toFixed(2)} lançada.`);
    }

    refreshData();
    setIsExpenseModalOpen(false);
    setEditingExpense(null);
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
          <h2 className="text-xl font-black text-[#292724] font-brand-serif flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-[#B85C38]" />
            <span>Financeiro & Contas da Olaria</span>
          </h2>
          <p className="text-xs text-[#5C5852]">
            Contas a Receber (Fiado) e Contas a Pagar / Despesas da Olaria.
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
          <Button
            onClick={() => handleOpenReceivableModal()}
            variant="primary"
            size="md"
            icon={ArrowUpRight}
            className="flex-1 sm:flex-none"
          >
            Receber
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card variant="flat" className="bg-[#667052]/10 border-[#667052]/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-[#4F583D] tracking-wider">A Receber (Fiado)</span>
            <ArrowUpRight className="w-5 h-5 text-[#667052]" />
          </div>
          <p className="text-2xl font-black text-[#292724] mt-1">R$ {totalReceivablesPending.toFixed(2)}</p>
          <p className="text-xs text-[#5C5852] mt-1">{receivables.filter(r => r.status !== 'Pago').length} cliente(s) em aberto</p>
        </Card>

        <Card variant="flat" className="bg-amber-500/10 border-amber-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-amber-900 tracking-wider">Contas a Pagar (Pendentes)</span>
            <Clock className="w-5 h-5 text-amber-700" />
          </div>
          <p className="text-2xl font-black text-[#292724] mt-1">R$ {totalExpensesPending.toFixed(2)}</p>
          <p className="text-xs text-[#5C5852] mt-1">{expenses.filter(e => e.status === 'Pendente').length} conta(s) a pagar</p>
        </Card>

        <Card variant="flat" className="bg-rose-500/10 border-rose-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-rose-800 tracking-wider">Despesas Pagas</span>
            <CheckCircle2 className="w-5 h-5 text-rose-700" />
          </div>
          <p className="text-2xl font-black text-[#292724] mt-1">R$ {totalExpensesPaid.toFixed(2)}</p>
          <p className="text-xs text-[#5C5852] mt-1">{expenses.filter(e => e.status === 'Paga').length} despesa(s) quitadas</p>
        </Card>
      </div>

      {/* Receivables Section */}
      <Card variant="default" className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-[#292724] text-base flex items-center gap-2 font-brand-serif">
            <ArrowUpRight className="w-5 h-5 text-[#667052]" />
            <span>Contas a Receber (Fiado / Parcelas)</span>
          </h3>
        </div>

        {/* Mobile View */}
        <div className="block md:hidden space-y-3">
          {receivables.length === 0 ? (
            <EmptyState
              title="Nenhuma conta a receber"
              description="Quando houver vendas fiadas, elas serão exibidas aqui."
            />
          ) : (
            receivables.map((r) => {
              const debt = Math.max(0, r.amount - r.amountPaid);
              return (
                <div key={r.id} className="p-4 bg-[#FAF6EF] rounded-2xl border border-[#E7D5BE] space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-[#292724] text-sm">{r.customerName}</p>
                      <p className="text-xs text-[#8A5A44]">{r.description || 'Venda a prazo'}</p>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-[#FAF6EF] rounded-xl border border-[#E7D5BE] text-xs">
                    <div>
                      <span className="text-[10px] text-[#8A5A44] block uppercase font-bold">Total</span>
                      <span className="font-bold text-[#292724]">R$ {r.amount.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#4F583D] block uppercase font-bold">Pago</span>
                      <span className="font-bold text-[#4F583D]">R$ {r.amountPaid.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-rose-700 block uppercase font-bold">Restante</span>
                      <span className="font-black text-rose-700">R$ {debt.toFixed(2)}</span>
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

        {/* Desktop Table with Smooth Scroll */}
        <div className="hidden md:block overflow-x-auto rounded-xl">
          <table className="w-full min-w-[650px] text-left text-xs sm:text-sm">
            <thead className="bg-[#E7D5BE]/50 text-[#8A5A44] font-bold border-b border-[#E7D5BE]">
              <tr>
                <th className="p-3 whitespace-nowrap">Cliente</th>
                <th className="p-3">Descrição</th>
                <th className="p-3 whitespace-nowrap">Valor Total</th>
                <th className="p-3 whitespace-nowrap">Valor Pago</th>
                <th className="p-3 whitespace-nowrap">Restante</th>
                <th className="p-3 whitespace-nowrap">Status</th>
                <th className="p-3 text-right whitespace-nowrap">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7D5BE]/60">
              {receivables.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-4">
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
                    <tr key={r.id} className="hover:bg-[#F7F1E7]/60">
                      <td className="p-3 font-bold text-[#292724]">{r.customerName}</td>
                      <td className="p-3 text-[#5C5852]">{r.description}</td>
                      <td className="p-3 font-bold text-[#292724]">R$ {r.amount.toFixed(2)}</td>
                      <td className="p-3 text-[#4F583D] font-bold">R$ {r.amountPaid.toFixed(2)}</td>
                      <td className="p-3 font-bold text-rose-700">R$ {debt.toFixed(2)}</td>
                      <td className="p-3">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="p-3 text-right">
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
      <Card variant="default" className="p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h3 className="font-bold text-[#292724] text-base flex items-center gap-2 font-brand-serif">
            <ArrowDownRight className="w-5 h-5 text-rose-700" />
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
        <div className="block md:hidden space-y-3">
          {filteredExpenses.length === 0 ? (
            <EmptyState
              title="Nenhuma despesa encontrada"
              description="Nenhuma conta ou compra registrada no filtro selecionado."
            />
          ) : (
            filteredExpenses.map((e) => (
              <div key={e.id} className="p-4 bg-[#FAF6EF] rounded-2xl border border-[#E7D5BE] space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-[#292724] text-sm">{e.description}</p>
                    <p className="text-xs text-[#8A5A44]">
                      {e.category} {e.supplier ? `• ${e.supplier}` : ''}
                    </p>
                  </div>
                  <StatusBadge status={e.status} />
                </div>

                {e.notes && (
                  <p className="text-[11px] text-[#5C5852] bg-[#F7F1E7] px-2 py-1 rounded-xl border border-[#E7D5BE] italic">
                    <strong className="not-italic text-[#8A5A44]">Obs:</strong> {e.notes}
                  </p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-[#E7D5BE] text-xs">
                  <div>
                    <span className="text-[10px] text-[#8A5A44] block uppercase font-bold">
                      {e.status === 'Paga' ? 'Data Pagamento' : 'Vencimento'}
                    </span>
                    <span className="font-medium text-[#292724]">{e.status === 'Paga' ? (e.paidDate || e.dueDate) : e.dueDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-rose-700">R$ {e.amount.toFixed(2)}</span>
                    <Button
                      onClick={() => openEditExpenseModal(e)}
                      variant="ghost"
                      size="sm"
                      ariaLabel="Editar despesa"
                    >
                      Editar
                    </Button>
                    <Button
                      onClick={() => setExpenseToDelete(e)}
                      variant="ghost"
                      size="sm"
                      className="text-rose-700"
                      ariaLabel="Excluir despesa"
                    >
                      Excluir
                    </Button>
                  </div>
                </div>

                {e.status === 'Pendente' && (
                  <Button
                    onClick={() => handleQuickMarkAsPaid(e)}
                    variant="primary"
                    size="sm"
                    icon={Check}
                    className="w-full"
                  >
                    Marcar como Paga (Dar Baixa)
                  </Button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Desktop View Table with Smooth Scroll */}
        <div className="hidden md:block overflow-x-auto rounded-xl">
          <table className="w-full min-w-[700px] text-left text-xs sm:text-sm">
            <thead className="bg-[#E7D5BE]/50 text-[#8A5A44] font-bold border-b border-[#E7D5BE]">
              <tr>
                <th className="p-3 whitespace-nowrap">Descrição</th>
                <th className="p-3 whitespace-nowrap">Categoria</th>
                <th className="p-3 whitespace-nowrap">Fornecedor</th>
                <th className="p-3 whitespace-nowrap">Valor (R$)</th>
                <th className="p-3 whitespace-nowrap">Vencimento / Data</th>
                <th className="p-3 whitespace-nowrap">Status</th>
                <th className="p-3 text-right whitespace-nowrap">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7D5BE]/60">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-4">
                    <EmptyState
                      title="Nenhuma despesa encontrada"
                      description="Nenhum registro no filtro selecionado."
                    />
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((e) => (
                  <tr key={e.id} className="hover:bg-[#F7F1E7]/60">
                    <td className="p-3">
                      <p className="font-bold text-[#292724]">{e.description}</p>
                      {e.notes && (
                        <p className="text-[11px] text-[#5C5852] italic mt-0.5">
                          Obs: {e.notes}
                        </p>
                      )}
                    </td>
                    <td className="p-3 text-[#5C5852]">{e.category}</td>
                    <td className="p-3 text-[#5C5852]">{e.supplier || 'N/I'}</td>
                    <td className="p-3 font-black text-rose-700">R$ {e.amount.toFixed(2)}</td>
                    <td className="p-3 text-[#8A5A44]">{e.status === 'Paga' ? (e.paidDate || e.dueDate) : e.dueDate}</td>
                    <td className="p-3">
                      <StatusBadge status={e.status} />
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {e.status === 'Pendente' && (
                          <Button
                            onClick={() => handleQuickMarkAsPaid(e)}
                            variant="primary"
                            size="sm"
                            icon={Check}
                          >
                            Pagar
                          </Button>
                        )}
                        <Button
                          onClick={() => openEditExpenseModal(e)}
                          variant="ghost"
                          size="sm"
                          ariaLabel="Editar despesa"
                        >
                          Editar
                        </Button>
                        <Button
                          onClick={() => setExpenseToDelete(e)}
                          variant="ghost"
                          size="sm"
                          className="text-rose-700"
                          ariaLabel="Excluir despesa"
                        >
                          Excluir
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Receive Payment Modal */}
      {isReceivableModalOpen && (
        <Modal
          isOpen={isReceivableModalOpen}
          onClose={() => setIsReceivableModalOpen(false)}
          title="Registrar Recebimento de Cliente"
          description="Dê baixa no saldo devendo pelo cliente e atualize o caixa da olaria."
          size="md"
        >
          <form onSubmit={handleRecordReceivablePayment} className="space-y-4 font-brand-sans">
            <FormField label="Cliente Devedor" htmlFor="receivable-customer-input" required>
              <Input
                id="receivable-customer-input"
                type="text"
                required
                list="debtor-list"
                placeholder="Ex: João Silva ou Carlos"
                value={paymentCustomerName}
                onChange={(e) => setPaymentCustomerName(e.target.value)}
              />
              <datalist id="debtor-list">
                {Object.keys(debtorCustomersMap).map((name, i) => (
                  <option key={i} value={name}>
                    Saldo Devedor: R$ {debtorCustomersMap[name].toFixed(2)}
                  </option>
                ))}
              </datalist>
              {selectedCustomerDebt > 0 && (
                <p className="text-xs text-[#4F583D] font-semibold mt-1">
                  Dívida pendente total de {paymentCustomerName}: R$ {selectedCustomerDebt.toFixed(2)}
                </p>
              )}
            </FormField>

            <FormField label="Valor Recebido (R$)" htmlFor="receivable-amount-input" required>
              <div className="flex items-center justify-between gap-2">
                <Input
                  id="receivable-amount-input"
                  type="number"
                  step="0.01"
                  min={1}
                  value={paymentAmount}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="font-bold text-[#4F583D]"
                />
                {selectedCustomerDebt > 0 && (
                  <Button
                    type="button"
                    onClick={() => setPaymentAmount(selectedCustomerDebt)}
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                  >
                    Quitar Total
                  </Button>
                )}
              </div>
            </FormField>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E7D5BE]">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsReceivableModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" size="md">
                Confirmar Baixa
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Expense Modal */}
      {isExpenseModalOpen && (
        <Modal
          isOpen={isExpenseModalOpen}
          onClose={() => setIsExpenseModalOpen(false)}
          title={editingExpense ? 'Editar Despesa / Compra' : 'Lançar Nova Despesa / Compra'}
          description="Controle os custos de matérias-primas, energia dos fornos e insumos."
          size="md"
        >
          <form onSubmit={handleSaveExpense} className="space-y-4 font-brand-sans">
            <FormField label="Situação da Despesa" htmlFor="expense-status-toggle">
              <div className="grid grid-cols-2 gap-2 p-1 bg-[#E7D5BE]/40 rounded-xl border border-[#E7D5BE]">
                <button
                  type="button"
                  id="expense-status-toggle"
                  onClick={() => setExpenseStatus('Paga')}
                  className={`py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    expenseStatus === 'Paga'
                      ? 'bg-[#B85C38] text-white shadow-xs'
                      : 'text-[#8A5A44] hover:bg-[#FAF6EF]/60'
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
                      ? 'bg-[#B85C38] text-white shadow-xs'
                      : 'text-[#8A5A44] hover:bg-[#FAF6EF]/60'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>A Pagar (Pendente)</span>
                </button>
              </div>
            </FormField>

            <FormField label="Descrição da Despesa" htmlFor="expense-description-input" required>
              <Input
                id="expense-description-input"
                type="text"
                required
                placeholder="Ex: 50 sacos de argila, combustível, energia..."
                value={expenseDesc}
                onChange={(e) => setExpenseDesc(e.target.value)}
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Categoria" htmlFor="expense-category-select" required>
                <Select
                  id="expense-category-select"
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value as Expense['category'])}
                >
                  <option value="Matéria-Prima">Matéria-Prima</option>
                  <option value="Combustível">Combustível</option>
                  <option value="Manutenção">Manutenção</option>
                  <option value="Energia/Água">Energia/Água</option>
                  <option value="Embalagem">Embalagem</option>
                  <option value="Ferramentas">Ferramentas</option>
                  <option value="Outros">Outros</option>
                </Select>
              </FormField>

              <FormField label="Valor (R$)" htmlFor="expense-amount-input" required>
                <Input
                  id="expense-amount-input"
                  type="number"
                  step="0.01"
                  min={0.01}
                  required
                  value={expenseAmount}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setExpenseAmount(parseFloat(e.target.value) || 0)}
                  className="font-bold text-rose-700"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Fornecedor / Destino" htmlFor="expense-supplier-input">
                <Input
                  id="expense-supplier-input"
                  type="text"
                  placeholder="Ex: Mineradora Vale, Posto Ipiranga..."
                  value={expenseSupplier}
                  onChange={(e) => setExpenseSupplier(e.target.value)}
                />
              </FormField>

              <FormField
                label={expenseStatus === 'Paga' ? 'Data do Pagamento' : 'Data de Vencimento'}
                htmlFor="expense-due-date-input"
                required
              >
                <Input
                  id="expense-due-date-input"
                  type="date"
                  required
                  value={expenseDueDate}
                  onChange={(e) => setExpenseDueDate(e.target.value)}
                />
              </FormField>
            </div>

            <FormField label="Observações (opcional)" htmlFor="expense-notes-input">
              <Textarea
                id="expense-notes-input"
                placeholder="Ex: Boleto 30 dias, NF nº 4501, pago no Pix..."
                value={expenseNotes}
                onChange={(e) => setExpenseNotes(e.target.value)}
              />
            </FormField>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E7D5BE]">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsExpenseModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" size="md">
                {editingExpense ? 'Atualizar Despesa' : 'Salvar Despesa'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!expenseToDelete}
        onClose={() => setExpenseToDelete(null)}
        onConfirm={confirmDeleteExpense}
        title="Excluir Despesa"
        message={`Deseja realmente excluir a despesa "${expenseToDelete?.description}" no valor de R$ ${expenseToDelete?.amount.toFixed(2)}?`}
        confirmLabel="Excluir"
        variant="danger"
      />
    </div>
  );
};
